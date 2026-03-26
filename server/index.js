import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import * as pdfParse from 'pdf-parse'

dotenv.config({ override: true })

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

const upload = multer({ storage: multer.memoryStorage() })

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant'

const fallbackHome = {
  features: [
    { title: 'AI Career Paths', desc: 'Personalized pathways based on skills and interests.' },
    { title: 'Resume Builder', desc: 'Craft polished resumes with AI support.' },
    { title: 'Live AI Guide', desc: 'Chat with a career counselor that understands your goals.' },
    { title: 'Skill Gap Radar', desc: 'Spot gaps and plan learning sprints.' },
    { title: 'Growth Forecasts', desc: 'Salary and growth trends instantly.' },
    { title: 'Portfolio Blueprint', desc: 'Project ideas curated for your target role.' },
  ],
  stats: [
    { label: 'Career Paths', value: '250+' },
    { label: 'AI Sessions', value: '42K+' },
    { label: 'Confidence Boost', value: '3.8x' },
  ],
  futureScope: [
    'AI-curated internships and mentorship matching.',
    'Personalized learning roadmaps with progress analytics.',
    'Hiring readiness score with interview simulations.',
  ],
  highlights: [
    { title: 'AI Recommendation Engine', detail: 'Career matches with salary + growth analytics.' },
    { title: 'Resume Studio', detail: 'Tabbed editor with AI summary and live preview.' },
    { title: 'Real-Time AI Guide', detail: 'Conversational mentor with quick prompts.' },
  ],
}

const isQuotaError = (error) => {
  const msg = String(error?.message || '')
  return msg.includes('429') || msg.toLowerCase().includes('rate')
}

const fallbackRecommendation = {
  recommendations: [
    {
      title: 'AI Product Strategist',
      salary: '$85k - $140k',
      growth: '32% YoY',
      reason: 'Combines product thinking with AI-powered solutions to solve user needs.',
    },
    {
      title: 'Cybersecurity Analyst',
      salary: '$78k - $125k',
      growth: '28% YoY',
      reason: 'Strong demand for analytical problem-solvers in security roles.',
    },
    {
      title: 'Cloud Solutions Engineer',
      salary: '$90k - $150k',
      growth: '30% YoY',
      reason: 'Cloud adoption is accelerating across industries.',
    },
  ],
  quote: 'Small steps compound into remarkable careers.',
  warning: 'AI quota reached. Showing fallback recommendations.',
}

const fallbackSummary = {
  summary:
    'Ambitious and detail-oriented professional with a passion for innovation, teamwork, and delivering measurable impact.',
  warning: 'AI quota reached. Showing a fallback summary.',
}

const fallbackQuiz = {
  quiz: [
    {
      question: 'Which SQL clause is used to filter rows?',
      options: ['GROUP BY', 'WHERE', 'ORDER BY', 'JOIN'],
      correctAnswer: 1,
    },
    {
      question: 'Which metric best summarizes the center of a distribution?',
      options: ['Median', 'Variance', 'Range', 'Mode'],
      correctAnswer: 0,
    },
    {
      question: 'What does API stand for?',
      options: ['Advanced Protocol Interface', 'Application Programming Interface', 'Applied Program Input', 'Array Program Index'],
      correctAnswer: 1,
    },
    {
      question: 'Which is a supervised learning example?',
      options: ['K-means clustering', 'Linear regression', 'PCA', 'Apriori'],
      correctAnswer: 1,
    },
    {
      question: 'Which tool is commonly used for data visualization?',
      options: ['Tableau', 'Redis', 'Nginx', 'Kafka'],
      correctAnswer: 0,
    },
  ],
  warning: 'AI quota reached. Showing a fallback quiz.',
}

const fallbackJobs = {
  jobs: [
    {
      title: 'Data Analyst',
      company: 'Insight Labs',
      location: 'Remote',
      salaryRange: '$70k - $100k',
      description: 'Analyze datasets, build dashboards, and deliver insights to business teams.',
    },
    {
      title: 'Junior Cloud Engineer',
      company: 'SkyOps',
      location: 'Bengaluru',
      salaryRange: '$80k - $115k',
      description: 'Support cloud deployments, monitoring, and infrastructure automation.',
    },
    {
      title: 'Security Analyst',
      company: 'SecureCore',
      location: 'Hyderabad',
      salaryRange: '$75k - $110k',
      description: 'Monitor threats, run incident response, and maintain security baselines.',
    },
  ],
  warning: 'AI quota reached. Showing fallback job results.',
}

function extractFirstJsonBlock(text) {
  const startObj = text.indexOf('{')
  const startArr = text.indexOf('[')
  let start = -1
  let open = ''
  let close = ''

  if (startObj !== -1 && (startArr === -1 || startObj < startArr)) {
    start = startObj
    open = '{'
    close = '}'
  } else if (startArr !== -1) {
    start = startArr
    open = '['
    close = ']'
  }

  if (start === -1) return null

  let depth = 0
  let inString = false
  let escape = false

  for (let i = start; i < text.length; i += 1) {
    const ch = text[i]
    if (inString) {
      if (escape) {
        escape = false
      } else if (ch === '\\') {
        escape = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }

    if (ch === '"') {
      inString = true
      continue
    }

    if (ch === open) depth += 1
    if (ch === close) {
      depth -= 1
      if (depth === 0) {
        return text.slice(start, i + 1)
      }
    }
  }

  return null
}

function tryParseJson(text) {
  const cleaned = text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, '$1')

  return JSON.parse(cleaned)
}

function parseJsonSafe(text) {
  try {
    return JSON.parse(text)
  } catch {
    const block = extractFirstJsonBlock(text || '')
    if (!block) {
      throw new Error('Invalid JSON from model')
    }
    try {
      return JSON.parse(block)
    } catch {
      return tryParseJson(block)
    }
  }
}

// Rate limiting: simple in-memory store (for production, use Redis or similar)
const requestCounts = new Map()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 10 // 10 requests per minute per IP

const checkRateLimit = (ip) => {
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, [])
  }

  const requests = requestCounts.get(ip)
  // Remove old requests outside the window
  const validRequests = requests.filter(time => time > windowStart)

  if (validRequests.length >= RATE_LIMIT_MAX) {
    return false // Rate limit exceeded
  }

  validRequests.push(now)
  requestCounts.set(ip, validRequests)
  return true
}

const GROQ_API_KEY = process.env.GROQ_API_KEY

if (process.env.DEBUG_KEYS === 'true') {
  console.log(`Groq key loaded: ${GROQ_API_KEY ? 'yes' : 'no'}`)
}

async function callGroq({ system, user, messages, responseFormat }) {
  if (!GROQ_API_KEY) {
    throw new Error('Missing GROQ_API_KEY in .env.')
  }

  const baseMessages = messages?.length
    ? messages.map((msg) => ({
        role: msg.role,
        content: String(msg.content || msg.text || ''),
      }))
    : [{ role: 'user', content: String(user || '') }]

  const finalMessages = system
    ? [{ role: 'system', content: system }, ...baseMessages]
    : baseMessages

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: finalMessages,
      temperature: 0.4,
      ...(responseFormat ? { response_format: responseFormat } : {}),
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Groq request failed')
  }

  const data = await response.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) {
    throw new Error('Empty Groq response')
  }
  return text.trim()
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.post('/api/chat', async (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress

  if (!checkRateLimit(clientIP)) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Please wait before making another request.'
    })
  }

  try {
    const { messages } = req.body
    const system =
      'You are CareerX, an AI career counselor. Give direct, practical answers. ' +
      'If the user asks for a roadmap with a timeframe, respond with: 1) Skills focus, 2) Projects, 3) Weekly plan. ' +
      'Keep it under 120 words and end with one clarifying question.'

    const reply = await callGroq({ system, messages })
    res.json({ reply })
  } catch (error) {
    if (isQuotaError(error)) {
      return res.json({
        reply: 'I am temporarily rate-limited. Please try again in a minute or ask a shorter question.',
        warning: 'AI quota reached.',
      })
    }
    res.status(500).json({ error: error.message || 'Chat failed' })
  }
})

app.post('/api/recommendation', async (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress

  if (!checkRateLimit(clientIP)) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Please wait before making another request.'
    })
  }

  try {
    const { name, age, skills, interests, strength } = req.body
    const system =
      'You are CareerX. Return ONLY valid JSON. Provide exactly 3 career recommendations. ' +
      'Use "recommendations" as the array key. Each item must include: title, salary, growth, reason. Include a motivational quote as quote.'

    const user = `User profile:\nName: ${name}\nAge: ${age}\nSkills: ${skills}\nInterests: ${interests}\nAcademic Strength: ${strength}\n` +
      'Generate 3 matching careers with salary ranges and growth %.'

    const text = await callGroq({ system, user, responseFormat: { type: 'json_object' } })
    let parsed
    try {
      parsed = parseJsonSafe(text)
    } catch (error) {
      const stricterSystem =
        system +
        ' Output must be a single JSON object with double quotes. Do not include markdown, comments, or trailing commas.'
      const retryText = await callGroq({
        system: stricterSystem,
        user,
        responseFormat: { type: 'json_object' },
      })
      parsed = parseJsonSafe(retryText)
    }
    res.json(parsed)
  } catch (error) {
    if (isQuotaError(error)) {
      return res.json(fallbackRecommendation)
    }
    res.status(500).json({ error: error.message || 'Recommendation failed' })
  }
})

app.post('/api/summary', async (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress

  if (!checkRateLimit(clientIP)) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Please wait before making another request.'
    })
  }

  try {
    const { name, role, skills, experience } = req.body
    const system =
      'You are a resume assistant. Write a 2-3 sentence professional summary. Keep it concise and impactful.'

    const user = `Name: ${name}\nTarget Role: ${role}\nSkills: ${skills}\nExperience: ${experience}`

    const summary = await callGroq({ system, user })
    res.json({ summary })
  } catch (error) {
    if (isQuotaError(error)) {
      return res.json(fallbackSummary)
    }
    res.status(500).json({ error: error.message || 'Summary failed' })
  }
})

app.post('/api/home-content', async (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress

  if (!checkRateLimit(clientIP)) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Please wait before making another request.'
    })
  }

  try {
    const system =
      'You are CareerX AI. Return ONLY valid JSON object with keys: features, stats, futureScope, highlights. ' +
      'features = array of 6 objects {title, desc}. stats = array of 3 objects {label, value}. ' +
      'futureScope = array of 3 strings. highlights = array of 3 objects {title, detail}.'

    const user = 'Generate fresh content for the CareerX home page.'

    const text = await callGroq({ system, user, responseFormat: { type: 'json_object' } })
    const parsed = parseJsonSafe(text)
    res.json(parsed)
  } catch (error) {
    if (isQuotaError(error)) {
      return res.json(fallbackHome)
    }
    res.status(500).json({ error: error.message || 'Home content failed' })
  }
})

app.post('/api/upload-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('No file uploaded')
    }
    const data = await pdfParse(req.file.buffer)
    const text = data.text

    const system = 'Extract key information from this resume text: name, email, phone, skills, experience, education. Return as JSON.'
    const user = `Resume text: ${text}`

    const extracted = await callGroq({ system, user, responseFormat: { type: 'json_object' } })
    let parsed
    try {
      parsed = JSON.parse(extracted)
    } catch {
      parsed = { rawText: text }
    }

    res.json({ extracted: parsed, rawText: text })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Resume upload failed' })
  }
})

app.post('/api/skill-assessment', async (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress

  if (!checkRateLimit(clientIP)) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Please wait before making another request.'
    })
  }

  try {
    const { role, currentSkills } = req.body
    const system =
      'You are a skills assessor. Generate a 5-question quiz strictly related to the target role and skills. ' +
      'Return ONLY valid JSON object with key quiz (array of 5 items). ' +
      'Each item: {question, options, correctAnswer}. options is array of 4 short strings. correctAnswer is index 0-3. ' +
      'Do NOT include unrelated topics.'
    const user =
      `Target role: ${role}. Current skills: ${currentSkills}. ` +
      'Focus on role-specific fundamentals, tools, and scenarios.'

    const quizText = await callGroq({ system, user, responseFormat: { type: 'json_object' } })
    const parsed = parseJsonSafe(quizText)
    const quiz = Array.isArray(parsed) ? parsed : parsed.quiz
    if (!Array.isArray(quiz)) {
      throw new Error('Invalid quiz format')
    }
    const roleKey = String(role || '').toLowerCase()
    const filtered = quiz.filter((q) => String(q.question || '').toLowerCase().includes(roleKey))
    const finalQuiz = filtered.length >= 3 ? filtered.slice(0, 5) : quiz.slice(0, 5)
    res.json({ quiz: finalQuiz })
  } catch (error) {
    if (isQuotaError(error)) {
      return res.json(fallbackQuiz)
    }
    res.status(500).json({ error: error.message || 'Skill assessment failed' })
  }
})

app.post('/api/job-search', async (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress

  if (!checkRateLimit(clientIP)) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Please wait before making another request.'
    })
  }

  try {
    const { query, location, skills } = req.body
    const system =
      'You are a job recommender. Return ONLY valid JSON object with key jobs (array of 3-5 items). ' +
      'Each item: {title, company, location, salaryRange, description}. ' +
      'Titles and descriptions must clearly match the query and skills. Avoid unrelated roles.'
    const user =
      `Job query: ${query}. Location: ${location}. Skills: ${skills}. ` +
      'Make the job titles and descriptions directly relevant.'

    const jobsText = await callGroq({ system, user, responseFormat: { type: 'json_object' } })
    const parsed = parseJsonSafe(jobsText)
    const jobs = Array.isArray(parsed) ? parsed : parsed.jobs
    if (!Array.isArray(jobs)) {
      throw new Error('Invalid jobs format')
    }
    const q = String(query || '').toLowerCase()
    const filtered = jobs.filter((job) =>
      String(job.title || '').toLowerCase().includes(q)
    )
    const finalJobs = filtered.length >= 2 ? filtered : jobs
    res.json({ jobs: finalJobs })
  } catch (error) {
    if (isQuotaError(error)) {
      return res.json(fallbackJobs)
    }
    res.status(500).json({ error: error.message || 'Job search failed' })
  }
})

const port = process.env.PORT || 8787
app.listen(port, () => {
  console.log(`CareerX API running on http://localhost:${port}`)
})
