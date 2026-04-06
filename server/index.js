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

function buildChatMock(messages = []) {
  const lastUser = [...messages].reverse().find((item) => item.role === 'user')?.content || ''
  const text = String(lastUser).toLowerCase()
  const isCSE = ['software', 'coding', 'developer', 'web', 'full stack', 'backend', 'frontend', 'ml', 'ai', 'data']
    .some((key) => text.includes(key))
  const isECE = ['ece', 'embedded', 'vlsi', 'fpga', 'iot', 'signal', 'electronics', 'hardware', 'rf']
    .some((key) => text.includes(key))

  let title = 'Career Guidance Snapshot'
  let summary =
    'Based on your message, here is a focused 90-day plan that balances skill growth, portfolio proof, and interview readiness.'
  let keyPoints = [
    'Build one demonstrable project tied to your target role',
    'Track 3-5 skills that show measurable progress each week',
    'Practice short, structured interview answers',
  ]
  let actionSteps = [
    'Week 1-2: Pick a target role and list the top 8 skills from job descriptions',
    'Week 3-6: Build a portfolio project and document decisions weekly',
    'Week 7-12: Prepare interviews, refine resume, and start targeted applications',
  ]
  let question = 'Which role are you targeting and what is your current skill level?'

  if (isCSE) {
    title = 'CSE Career Fit Plan'
    summary =
      'You are aligned with software roles. Focus on one product-ready project and strengthen core CS fundamentals.'
    keyPoints = [
      'Choose a stack: React + Node, or Python + FastAPI',
      'Show impact with a real use case and metrics',
      'Master DS/Algo basics and system design starters',
    ]
    actionSteps = [
      'Week 1-2: Build a small full-stack app with auth + database',
      'Week 3-6: Add APIs, tests, and deployment to cloud',
      'Week 7-12: Practice 3 problems/day + 2 mock interviews/week',
    ]
    question = 'Which stack do you want to specialize in: web, data, or AI?'
  } else if (isECE) {
    title = 'ECE Career Fit Plan'
    summary =
      'You are aligned with electronics/embedded roles. Focus on one hardware-software project and tooling mastery.'
    keyPoints = [
      'Pick a track: embedded, VLSI, or IoT',
      'Build a prototype and document design tradeoffs',
      'Strengthen C, Python, and circuit fundamentals',
    ]
    actionSteps = [
      'Week 1-2: Choose a microcontroller and ship a basic sensor project',
      'Week 3-6: Add communication + power optimization',
      'Week 7-12: Prepare a project demo + interview Q&A list',
    ]
    question = 'Which ECE track interests you most: embedded, VLSI, or IoT?'
  }

  return [
    `Title: ${title}`,
    `Summary: ${summary}`,
    `Key Points: 1) ${keyPoints[0]} 2) ${keyPoints[1]} 3) ${keyPoints[2]}`,
    `Action Steps: 1) ${actionSteps[0]} 2) ${actionSteps[1]} 3) ${actionSteps[2]}`,
    `Question: ${question}`,
  ].join('\n')
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
  // Clean potential Markdown wrappers if present
  let cleanedText = (text || '').trim()
  if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```(?:json)?\s*|\s*```$/g, '')
  }
  try {
    return JSON.parse(cleanedText)
  } catch {
    const block = extractFirstJsonBlock(cleanedText)
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

// Simple response cache to reduce API hits during demo (TTL: 5 minutes)
const responseCache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

const getCacheKey = (type, payload) => {
  const key = JSON.stringify({ type, ...payload })
  return key
}

const getFromCache = (type, payload) => {
  const key = getCacheKey(type, payload)
  const cached = responseCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Cache HIT] ${type}`)
    return cached.response
  }
  return null
}

const setInCache = (type, payload, response) => {
  const key = getCacheKey(type, payload)
  responseCache.set(key, { response, timestamp: Date.now() })
  // Clean old entries
  if (responseCache.size > 100) {
    const oldest = Array.from(responseCache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp)[0]
    responseCache.delete(oldest[0])
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

function buildFallbackRecommendation({ name, skills, interests, strength }) {
  const haystack = `${skills} ${interests}`.toLowerCase()
  
  const masterPool = [
    // CSE DOMAIN (20)
    { title: 'Full-Stack Developer', keywords: ['web', 'react', 'node', 'javascript', 'html', 'css', 'fullstack', 'backend', 'frontend'], salary: '$85k-$145k', growth: 'High' },
    { title: 'Data Scientist', keywords: ['data', 'python', 'sql', 'analytics', 'statistics', 'ml', 'ai', 'machine learning'], salary: '$95k-$160k', growth: 'Very High' },
    { title: 'Cyber Security Analyst', keywords: ['security', 'cyber', 'network', 'hacking', 'infosec', 'firewall'], salary: '$85k-$140k', growth: 'Very High' },
    { title: 'Cloud Architect', keywords: ['cloud', 'aws', 'azure', 'gcp', 'infrastructure', 'devops', 'kubernetes'], salary: '$110k-$180k', growth: 'Very High' },
    { title: 'Mobile App Developer', keywords: ['mobile', 'android', 'ios', 'swift', 'kotlin', 'flutter', 'react native'], salary: '$80k-$130k', growth: 'High' },
    { title: 'AI Engineer', keywords: ['ai', 'artificial intelligence', 'neural networks', 'deep learning', 'pytorch', 'tensorflow'], salary: '$105k-$175k', growth: 'Extreme' },
    { title: 'DevOps Engineer', keywords: ['devops', 'cicd', 'docker', 'jenkins', 'automation', 'linux'], salary: '$90k-$150k', growth: 'High' },
    { title: 'UI/UX Designer', keywords: ['ui', 'ux', 'design', 'figma', 'product', 'creative'], salary: '$70k-$125k', growth: 'Medium' },
    { title: 'Blockchain Developer', keywords: ['blockchain', 'web3', 'solidity', 'crypto', 'ethereum', 'smart contracts'], salary: '$95k-$170k', growth: 'High' },
    { title: 'Game Developer', keywords: ['game', 'unity', 'unreal', 'c#', 'c++', 'graphics', '3d'], salary: '$75k-$130k', growth: 'Medium' },
    { title: 'Frontend Engineer', keywords: ['frontend', 'react', 'angular', 'vue', 'javascript', 'typescript'], salary: '$80k-$135k', growth: 'High' },
    { title: 'Backend Engineer', keywords: ['backend', 'java', 'go', 'python', 'ruby', 'database', 'api'], salary: '$85k-$145k', growth: 'High' },
    { title: 'Site Reliability Engineer', keywords: ['sre', 'reliability', 'infrastructure', 'scaling', 'monitoring'], salary: '$100k-$165k', growth: 'High' },
    { title: 'Data Engineer', keywords: ['data', 'spark', 'hadoop', 'etl', 'pipeline', 'sql', 'big data'], salary: '$95k-$155k', growth: 'Very High' },
    { title: 'MLOps Engineer', keywords: ['mlops', 'ai', 'deployment', 'model', 'pipeline'], salary: '$110k-$175k', growth: 'Very High' },
    { title: 'Database Administrator', keywords: ['database', 'sql', 'oracle', 'postgres', 'mongo', 'dba'], salary: '$75k-$125k', growth: 'Stable' },
    { title: 'QA Automation Engineer', keywords: ['qa', 'testing', 'selenium', 'automation', 'python', 'cypress'], salary: '$70k-$115k', growth: 'Medium' },
    { title: 'Computer Vision Engineer', keywords: ['vision', 'opencv', 'image', 'ai', 'pattern recognition'], salary: '$100k-$165k', growth: 'Very High' },
    { title: 'NLP Engineer', keywords: ['nlp', 'language', 'llm', 'bert', 'text', 'ai'], salary: '$105k-$170k', growth: 'Very High' },
    { title: 'AR/VR Developer', keywords: ['ar', 'vr', 'unity', 'xr', 'meta', 'immersion'], salary: '$85k-$145k', growth: 'High' },

    // ECE DOMAIN (20)
    { title: 'VLSI Design Engineer', keywords: ['vlsi', 'hardware', 'circuits', 'verilog', 'vhdl', 'semiconductor', 'electronics'], salary: '$90k-$155k', growth: 'High' },
    { title: 'Embedded Systems Engineer', keywords: ['embedded', 'c', 'c++', 'microcontrollers', 'hardware', 'firmware', 'rtos'], salary: '$80k-$135k', growth: 'High' },
    { title: 'Robotics Engineer', keywords: ['robotics', 'automation', 'sensors', 'control systems', 'mechatronics'], salary: '$85k-$145k', growth: 'High' },
    { title: 'Network Engineer', keywords: ['network', 'cisco', 'routing', 'switching', 'telecom', 'protocol'], salary: '$75k-$120k', growth: 'Medium' },
    { title: 'RF Engineer', keywords: ['rf', 'radio', 'antenna', 'wireless', 'communication', 'signal'], salary: '$85k-$140k', growth: 'Medium' },
    { title: 'Analog Circuit Designer', keywords: ['analog', 'circuit', 'pcb', 'electronics', 'hardware', 'cadence'], salary: '$90k-$150k', growth: 'High' },
    { title: 'DSP Engineer', keywords: ['dsp', 'signal', 'processing', 'matlab', 'filtering', 'audio', 'video'], salary: '$85k-$135k', growth: 'Medium' },
    { title: 'Control Systems Engineer', keywords: ['control', 'feedback', 'automation', 'matlab', 'simulink', 'plc'], salary: '$80k-$130k', growth: 'Medium' },
    { title: 'IoT Architect', keywords: ['iot', 'internet of things', 'sensors', 'wireless', 'connectivity', 'mqtt'], salary: '$95k-$155k', growth: 'High' },
    { title: 'FPGA Engineer', keywords: ['fpga', 'xilinx', 'intel', 'verilog', 'vhdl', 'hardware acceleration'], salary: '$90k-$150k', growth: 'High' },
    { title: 'Hardware Verification Engineer', keywords: ['verification', 'uvm', 'sv', 'systemverilog', 'hardware', 'testing'], salary: '$85k-$145k', growth: 'High' },
    { title: 'Semiconductor Process Engineer', keywords: ['semiconductor', 'fabrication', 'wafer', 'lithography', 'silicon'], salary: '$80k-$135k', growth: 'Medium' },
    { title: 'Power Electronics Engineer', keywords: ['power', 'inverter', 'converter', 'motor', 'electric vehicle', 'ev'], salary: '$85k-$140k', growth: 'High' },
    { title: 'Automotive Electronics Engineer', keywords: ['automotive', 'car', 'can bus', 'ecu', 'adas', 'autonomous'], salary: '$90k-$145k', growth: 'High' },
    { title: 'Telecommunications Engineer', keywords: ['telecom', '5g', 'lte', 'network', 'fiber', 'satellite'], salary: '$80k-$130k', growth: 'Medium' },
    { title: 'Biomedical Engineer (ECE)', keywords: ['biomedical', 'medical', 'device', 'sensors', 'healthcare'], salary: '$75k-$125k', growth: 'Medium' },
    { title: 'Firmware Engineer', keywords: ['firmware', 'c', 'drivers', 'bare metal', 'hardware'], salary: '$85k-$140k', growth: 'High' },
    { title: 'PCB Design Engineer', keywords: ['pcb', 'altium', 'eagle', 'layout', 'hardware'], salary: '$75k-$125k', growth: 'Medium' },
    { title: 'Microwave Engineer', keywords: ['microwave', 'radar', 'high frequency', 'electromagnetics'], salary: '$88k-$142k', growth: 'Medium' },
    { title: 'Wireless Specialist', keywords: ['wireless', 'wifi', 'bluetooth', 'zigbee', 'connectivity'], salary: '$82k-$138k', growth: 'High' },
  ]

  const quotes = [
    "Small steps compound into big career moves.",
    "Your potential is only limited by your willingness to learn.",
    "The best way to predict the future is to create it.",
    "Hard work beats talent when talent doesn't work hard.",
    "Career success is a marathon, not a sprint."
  ]

  // Filter and score based on keywords
  const scoredPool = masterPool.map(item => {
    let score = 0
    item.keywords.forEach(kw => {
      if (haystack.includes(kw)) score += 2
    })
    return { ...item, score }
  })

  // Sort by score and take top matches
  let picks = scoredPool
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  // Fill with random if not enough matches
  while (picks.length < 3) {
    const random = masterPool[Math.floor(Math.random() * masterPool.length)]
    if (!picks.find(p => p.title === random.title)) {
      picks.push(random)
    }
  }

  // Add personalized reasons
  const recommendations = picks.map(p => ({
    title: p.title,
    salary: p.salary,
    growth: p.growth,
    reason: `Based on your ${strength.toLowerCase()} profile and interest in ${interests.split(',')[0] || 'tech'}, this role offers significant opportunities for growth.`
  }))

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]

  return {
    recommendations,
    quote: name
      ? `Keep going, ${name} — ${randomQuote.toLowerCase()}`
      : randomQuote,
    fallback: true,
  }
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
  const mockOnly = process.env.MOCK_CHAT === 'true'

  if (mockOnly) {
    const messages = ensureArray(req.body?.messages, 'messages')
    const reply = buildChatMock(messages)
    return res.json({ reply, model: 'mock-careerx' })
  }

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
  const mockOnly = process.env.MOCK_RECOMMENDATIONS === 'true'

  if (mockOnly) {
    const name = String(req.body?.name || '').trim()
    const strength = String(req.body?.strength || 'Average')
    const recommendations = [
      { title: 'Software Engineer (CSE)', salary: '$70k-$120k', growth: 'High', reason: 'Strong fit for core coding and system design fundamentals.' },
      { title: 'Full-Stack Developer (CSE)', salary: '$75k-$125k', growth: 'High', reason: 'Blends frontend UX with backend APIs for end-to-end product impact.' },
      { title: 'Backend Engineer (CSE)', salary: '$80k-$130k', growth: 'High', reason: 'Scales services, databases, and distributed systems reliably.' },
      { title: 'Frontend Engineer (CSE)', salary: '$70k-$120k', growth: 'High', reason: 'Builds responsive, accessible UIs that drive engagement.' },
      { title: 'DevOps Engineer (CSE)', salary: '$85k-$140k', growth: 'High', reason: 'Automates deployment pipelines and improves reliability.' },
      { title: 'Cloud Engineer (CSE)', salary: '$85k-$145k', growth: 'High', reason: 'Designs scalable cloud infrastructure for modern apps.' },
      { title: 'Site Reliability Engineer (CSE)', salary: '$90k-$150k', growth: 'High', reason: 'Ensures uptime and performance through automation and monitoring.' },
      { title: 'Data Engineer (CSE)', salary: '$85k-$140k', growth: 'High', reason: 'Builds pipelines and warehouses for large-scale analytics.' },
      { title: 'Data Analyst (CSE)', salary: '$60k-$105k', growth: 'High', reason: 'Transforms data into business insights and KPIs.' },
      { title: 'Data Scientist (CSE)', salary: '$90k-$150k', growth: 'High', reason: 'Applies statistical models and ML to solve complex problems.' },
      { title: 'Machine Learning Engineer (CSE)', salary: '$95k-$160k', growth: 'High', reason: 'Productionizes ML models for real-world use cases.' },
      { title: 'AI Engineer (CSE)', salary: '$95k-$160k', growth: 'High', reason: 'Builds AI-powered systems and intelligent features.' },
      { title: 'NLP Engineer (CSE)', salary: '$95k-$155k', growth: 'High', reason: 'Specializes in language models and text intelligence.' },
      { title: 'Computer Vision Engineer (CSE)', salary: '$95k-$155k', growth: 'High', reason: 'Builds systems for image and video understanding.' },
      { title: 'Cybersecurity Analyst (CSE)', salary: '$75k-$130k', growth: 'High', reason: 'Protects systems, networks, and user data.' },
      { title: 'Security Engineer (CSE)', salary: '$90k-$150k', growth: 'High', reason: 'Designs secure systems and vulnerability defenses.' },
      { title: 'Blockchain Developer (CSE)', salary: '$85k-$145k', growth: 'Medium', reason: 'Builds smart contracts and decentralized applications.' },
      { title: 'Game Developer (CSE)', salary: '$65k-$120k', growth: 'Medium', reason: 'Creates interactive experiences with real-time systems.' },
      { title: 'Mobile App Developer (CSE)', salary: '$70k-$125k', growth: 'High', reason: 'Builds iOS/Android apps with strong user retention.' },
      { title: 'QA Automation Engineer (CSE)', salary: '$65k-$115k', growth: 'Medium', reason: 'Ensures software quality with scalable test automation.' },
      { title: 'Embedded Systems Engineer (ECE)', salary: '$75k-$130k', growth: 'High', reason: 'Builds firmware for microcontrollers and IoT devices.' },
      { title: 'IoT Engineer (ECE)', salary: '$75k-$135k', growth: 'High', reason: 'Connects devices to cloud systems with secure protocols.' },
      { title: 'VLSI Design Engineer (ECE)', salary: '$85k-$150k', growth: 'High', reason: 'Designs integrated circuits and high-performance chips.' },
      { title: 'ASIC Design Engineer (ECE)', salary: '$85k-$150k', growth: 'High', reason: 'Creates custom silicon for specialized computing.' },
      { title: 'FPGA Engineer (ECE)', salary: '$80k-$140k', growth: 'High', reason: 'Implements hardware logic for performance-critical systems.' },
      { title: 'RF Engineer (ECE)', salary: '$80k-$140k', growth: 'Medium', reason: 'Designs wireless communication components and antennas.' },
      { title: 'Signal Processing Engineer (ECE)', salary: '$85k-$145k', growth: 'High', reason: 'Analyzes and improves signals for audio, radar, and comms.' },
      { title: 'Control Systems Engineer (ECE)', salary: '$80k-$140k', growth: 'Medium', reason: 'Develops automation and stability for complex systems.' },
      { title: 'Robotics Engineer (ECE)', salary: '$85k-$150k', growth: 'High', reason: 'Builds intelligent robots with sensors and control logic.' },
      { title: 'Embedded AI Engineer (ECE)', salary: '$90k-$155k', growth: 'High', reason: 'Deploys ML models on edge devices efficiently.' },
      { title: 'Hardware Validation Engineer (ECE)', salary: '$75k-$125k', growth: 'Medium', reason: 'Tests hardware reliability and compliance at scale.' },
      { title: 'Electronics Design Engineer (ECE)', salary: '$75k-$130k', growth: 'Medium', reason: 'Creates PCB designs and electronic circuits.' },
      { title: 'Power Electronics Engineer (ECE)', salary: '$80k-$145k', growth: 'Medium', reason: 'Works on converters, inverters, and energy systems.' },
      { title: 'Telecom Engineer (ECE)', salary: '$70k-$120k', growth: 'Medium', reason: 'Designs and optimizes telecom networks and systems.' },
      { title: 'Network Engineer (ECE)', salary: '$70k-$120k', growth: 'High', reason: 'Builds and secures enterprise networking infrastructure.' },
      { title: 'AR/VR Engineer (CSE)', salary: '$85k-$145k', growth: 'Medium', reason: 'Builds immersive experiences using 3D engines.' },
      { title: 'Systems Engineer (CSE)', salary: '$80k-$140k', growth: 'High', reason: 'Integrates software, hardware, and requirements at scale.' },
      { title: 'Product Engineer (CSE)', salary: '$80k-$135k', growth: 'High', reason: 'Bridges engineering with product strategy for impact.' },
      { title: 'Technical Program Manager (CSE)', salary: '$90k-$150k', growth: 'High', reason: 'Coordinates complex technical delivery across teams.' },
      { title: 'Research Engineer (CSE)', salary: '$90k-$155k', growth: 'Medium', reason: 'Explores novel methods and prototypes new systems.' },
    ]

    return res.json({
      recommendations,
      quote: name
        ? `Based on your profile, ${name}, here are AI-curated paths aligned to your strengths (${strength}).`
        : `Here are AI-curated paths aligned to your strengths (${strength}).`,
      notice: 'AI-driven insights simulated for demo mode.',
      mock: true,
    })
  }

  if (!checkRateLimit(clientIP)) {
    const skills = String(req.body?.skills || '')
    const interests = String(req.body?.interests || '')
    const strength = String(req.body?.strength || 'Average')
    const name = String(req.body?.name || '')
    const fallback = buildFallbackRecommendation({ name, skills, interests, strength })
    return res.json({
      ...fallback,
      notice: 'Rate limit exceeded. Showing a quick fallback recommendation.',
      rateLimited: true,
    })
  }

  try {
    const name = ensureString(req.body?.name, 'name')
    const ageValue = Number(req.body?.age)
    const age = Number.isFinite(ageValue) && ageValue >= 13 ? String(ageValue) : 'Not specified'
    const skills = ensureString(req.body?.skills, 'skills')
    const interests = ensureString(req.body?.interests, 'interests')
    const strength = ensureString(req.body?.strength, 'strength')

    // Check cache first
    const cacheResult = getFromCache('career-recommendation', { skills, interests, strength })
    if (cacheResult) {
      return res.json(cacheResult)
    }

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

    if (Array.isArray(parsed)) {
      parsed = { recommendations: parsed }
    }

    const recommendations = Array.isArray(parsed?.recommendations) ? parsed.recommendations : []
    if (recommendations.length < 3 || !parsed?.quote) {
      const salvageSystem =
        system +
        ' Ensure "recommendations" is an array with exactly 3 items and include "quote".'
      const salvageText = await callGroq({
        system: salvageSystem,
        user,
        responseFormat: { type: 'json_object' },
      })
      parsed = parseJsonSafe(salvageText)
    }

    if (!Array.isArray(parsed?.recommendations) || parsed.recommendations.length < 3 || !parsed?.quote) {
      throw new Error('AI returned incomplete recommendations.')
    }

    // Cache the result
    setInCache('career-recommendation', { skills, interests, strength }, parsed)

    res.json(parsed)
  } catch (error) {
    const msg = String(error?.message || '')
    if (isQuotaError(error)) {
      const skills = String(req.body?.skills || '')
      const interests = String(req.body?.interests || '')
      const strength = String(req.body?.strength || 'Average')
      const name = String(req.body?.name || '')
      const cached = getFromCache('career-recommendation', { skills, interests, strength })
      if (cached) {
        return res.json({
          ...cached,
          notice: 'AI rate limit reached. Showing cached recommendations.',
          cached: true,
        })
      }
      const fallback = buildFallbackRecommendation({ name, skills, interests, strength })
      return res.json({
        ...fallback,
        notice: 'AI rate limit reached. Showing a quick fallback recommendation.',
      })
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
