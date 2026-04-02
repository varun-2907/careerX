import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import * as pdfParse from 'pdf-parse'
import crypto from 'crypto'

dotenv.config({ override: true })

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1)
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((value) => value.trim())
  : null

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || !allowedOrigins || allowedOrigins.length === 0) {
        return callback(null, true)
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(new Error('Not allowed by CORS'))
    },
  })
)
app.use(express.json({ limit: '1mb' }))
app.use((req, res, next) => {
  const requestId = crypto.randomUUID()
  res.setHeader('X-Request-Id', requestId)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  req.requestId = requestId
  next()
})

const upload = multer({ storage: multer.memoryStorage() })

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant'

const isQuotaError = (error) => {
  const msg = String(error?.message || '')
  return msg.includes('429') || msg.toLowerCase().includes('rate')
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

function ensureString(value, label) {
  const cleaned = String(value ?? '').trim()
  if (!cleaned) {
    const error = new Error(`Missing required field: ${label}`)
    error.status = 400
    throw error
  }
  return cleaned
}

function ensureOptionalString(value) {
  const cleaned = String(value ?? '').trim()
  return cleaned
}

function ensureArray(value, label) {
  if (!Array.isArray(value) || value.length === 0) {
    const error = new Error(`Missing required array: ${label}`)
    error.status = 400
    throw error
  }
  return value
}

function validateHomeContent(payload) {
  const error = new Error('AI returned incomplete home content.')
  error.status = 502

  if (!payload || typeof payload !== 'object') {
    throw error
  }

  const hero = payload.hero
  if (!hero || typeof hero !== 'object') {
    throw error
  }

  const requiredHeroFields = ['eyebrow', 'title', 'titleAccent', 'subtitle', 'primaryCta', 'secondaryCta']
  const missingHero = requiredHeroFields.some((key) => !String(hero[key] || '').trim())
  if (missingHero) {
    throw error
  }

  const kpis = hero.kpis
  if (!Array.isArray(kpis) || kpis.length < 2) {
    throw error
  }

  const requiredArrays = ['features', 'stats', 'highlights', 'useCases', 'futureScope', 'team']
  const missingArray = requiredArrays.some((key) => !Array.isArray(payload[key]) || payload[key].length === 0)
  if (missingArray) {
    throw error
  }

  const trust = payload.trust
  if (!trust || typeof trust !== 'object') {
    throw error
  }

  if (!Array.isArray(trust.metrics) || trust.metrics.length === 0) {
    throw error
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

function sendError(res, status, message) {
  return res.status(status).json({
    error: message,
    requestId: res.getHeader('X-Request-Id'),
  })
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
    const messages = ensureArray(req.body?.messages, 'messages')
    const system =
      'You are CareerX, an AI career counselor. Answer in a clear, structured format. ' +
      'Use this exact template with labels and line breaks (no markdown): ' +
      'Title: ...\\nSummary: ...\\nKey Points: 1) ... 2) ... 3) ...\\nAction Steps: 1) ... 2) ... 3) ...\\nQuestion: ... ' +
      'If the user asks for a roadmap with a timeframe, reflect it in Action Steps. ' +
      'Keep it under 140 words.'

    const reply = await callGroq({ system, messages })
    res.json({ reply })
  } catch (error) {
    if (isQuotaError(error)) {
      return sendError(res, 429, 'AI rate limit reached. Please try again in a minute.')
    }
    if (error?.status === 400) {
      return sendError(res, 400, error.message)
    }
    sendError(res, 500, error.message || 'Chat failed')
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
    const name = ensureString(req.body?.name, 'name')
    const ageValue = Number(req.body?.age)
    if (!Number.isFinite(ageValue) || ageValue < 13) {
      throw new Error('Invalid age provided')
    }
    const age = String(ageValue)
    const skills = ensureString(req.body?.skills, 'skills')
    const interests = ensureString(req.body?.interests, 'interests')
    const strength = ensureString(req.body?.strength, 'strength')
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
    const msg = String(error?.message || '')
    if (isQuotaError(error)) {
      return sendError(res, 429, 'AI rate limit reached. Please try again in a minute.')
    }
    if (error?.status === 400) {
      return sendError(res, 400, error.message)
    }
    if (msg.includes('Invalid JSON') || msg.includes('Unexpected')) {
      return sendError(res, 502, 'AI returned invalid format. Please try again.')
    }
    sendError(res, 500, error.message || 'Recommendation failed')
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
    const name = ensureString(req.body?.name, 'name')
    const role = ensureString(req.body?.role, 'role')
    const skills = ensureString(req.body?.skills, 'skills')
    const experience = ensureString(req.body?.experience, 'experience')
    const system =
      'You are a resume assistant. Write a 2-3 sentence professional summary. Keep it concise and impactful.'

    const user = `Name: ${name}\nTarget Role: ${role}\nSkills: ${skills}\nExperience: ${experience}`

    const summary = await callGroq({ system, user })
    res.json({ summary })
  } catch (error) {
    if (isQuotaError(error)) {
      return sendError(res, 429, 'AI rate limit reached. Please try again in a minute.')
    }
    if (error?.status === 400) {
      return sendError(res, 400, error.message)
    }
    sendError(res, 500, error.message || 'Summary failed')
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
      'You are CareerX AI. Return ONLY valid JSON object with keys: hero, features, stats, highlights, useCases, futureScope, trust, team. ' +
      'hero = {eyebrow, title, titleAccent, subtitle, primaryCta, secondaryCta, kpis:[{label,value,detail}]}. ' +
      'features = array of 6 objects {title, desc}. stats = array of 3 objects {label, value}. ' +
      'highlights = array of 3 objects {title, detail}. useCases = array of 3 objects {title, detail}. ' +
      'futureScope = array of 3 strings. trust = {badges:[string], guarantees:[string], metrics:[{label,value}]}. ' +
      'team = array of 4 objects {role, focus}. Use role-based pods, do not invent real person names.'

    const user = 'Generate fresh content for the CareerX home page.'

    const text = await callGroq({ system, user, responseFormat: { type: 'json_object' } })
    const parsed = parseJsonSafe(text)
    validateHomeContent(parsed)
    const requiredKeys = ['hero', 'features', 'stats', 'highlights', 'useCases', 'futureScope', 'trust', 'team']
    const hasAllKeys = requiredKeys.every((key) => Object.prototype.hasOwnProperty.call(parsed, key))
    if (!hasAllKeys) {
      throw new Error('AI returned incomplete content.')
    }
    res.json(parsed)
  } catch (error) {
    const msg = String(error?.message || '')
    if (isQuotaError(error)) {
      return sendError(res, 429, 'AI rate limit reached. Please try again in a minute.')
    }
    if (error?.status === 400) {
      return sendError(res, 400, error.message)
    }
    if (msg.includes('Invalid JSON') || msg.includes('Unexpected')) {
      return sendError(res, 502, 'AI returned invalid format. Please try again.')
    }
    sendError(res, 500, error.message || 'Home content failed')
  }
})

app.post('/api/upload-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      const err = new Error('No file uploaded')
      err.status = 400
      throw err
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
    if (error?.status === 400) {
      return sendError(res, 400, error.message)
    }
    sendError(res, 500, error.message || 'Resume upload failed')
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
    const role = ensureString(req.body?.role, 'role')
    const currentSkills = ensureString(req.body?.currentSkills, 'currentSkills')
    const maxQuestions = Math.min(Math.max(Number(req.body?.maxQuestions) || 15, 10), 20)
    const system =
      `You are a skills assessor. Generate ${maxQuestions}-question quiz strictly related to the target role and skills. ` +
      'Return ONLY valid JSON object with key quiz (array). ' +
      'Each item: {question, options, correctAnswer}. options is array of 4 short strings. correctAnswer is index 0-3. ' +
      'Do NOT include unrelated topics.'
    const user =
      `Target role: ${role}. Current skills: ${currentSkills}. ` +
      'Focus on role-specific fundamentals, tools, and scenarios.'

    const quizText = await callGroq({ system, user, responseFormat: { type: 'json_object' } })
    const parsed = parseJsonSafe(quizText)
    const quiz = Array.isArray(parsed) ? parsed : parsed?.quiz
    if (!Array.isArray(quiz)) {
      throw new Error('Invalid quiz format')
    }
    const roleKey = String(role || '').toLowerCase()
    const filtered = quiz.filter((q) => String(q.question || '').toLowerCase().includes(roleKey))
    const finalQuiz = filtered.length >= 10 ? filtered.slice(0, maxQuestions) : quiz.slice(0, maxQuestions)
    res.json({ quiz: finalQuiz })
  } catch (error) {
    const msg = String(error?.message || '')
    if (isQuotaError(error)) {
      return sendError(res, 429, 'AI rate limit reached. Please try again in a minute.')
    }
    if (error?.status === 400) {
      return sendError(res, 400, error.message)
    }
    if (msg.includes('Invalid JSON') || msg.includes('Unexpected')) {
      return sendError(res, 502, 'AI returned invalid format. Please try again.')
    }
    sendError(res, 500, error.message || 'Skill assessment failed')
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
    const query = ensureString(req.body?.query, 'query')
    const location = ensureOptionalString(req.body?.location)
    const skills = ensureOptionalString(req.body?.skills)
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
    const msg = String(error?.message || '')
    if (isQuotaError(error)) {
      return sendError(res, 429, 'AI rate limit reached. Please try again in a minute.')
    }
    if (error?.status === 400) {
      return sendError(res, 400, error.message)
    }
    if (msg.includes('Invalid JSON') || msg.includes('Unexpected')) {
      return sendError(res, 502, 'AI returned invalid format. Please try again.')
    }
    sendError(res, 500, error.message || 'Job search failed')
  }
})

const port = process.env.PORT || 8787
app.listen(port, () => {
  console.log(`CareerX API running on http://localhost:${port}`)
})
