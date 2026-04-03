# CareerX – AI-Powered Career Guidance & Job Matching Suite

**Hackathon-Ready MVP** | Full-stack AI application for personalized career discovery, resume building, skill assessment, and job matching.

Built with **React 18** + **Express** + **Groq AI (llama-3.1-8b)** | **Non-blocking UX**, **Code-split routing**, **5-min response cache**, **Rate-limit protection**

---

## 🎯 What It Does

CareerX provides an **integrated career workflow** in a single dashboard:

| Module | Purpose |
|--------|---------|
| **Career Recommendation** | AI-matched roles (3) with salary ranges & growth rates |
| **Resume Builder** | Structured editor with AI summaries & PDF export |
| **Skill Assessment** | Role-aligned quiz (10–15 questions) for readiness validation |
| **Job Search** | AI-powered job matching by role/skills |
| **AI Guide Chat** | Real-time conversational counselor with voice input |

---

## 🛠️ Complete Tech Stack

### **Frontend**
| Layer | Tech | Version |
|-------|------|---------|
| Framework | React | 18.3.1 |
| Build Tool | Vite | 5.4.0 |
| Styling | Tailwind CSS | 3.4.6 |
| Routing | React Router | 6.26.0 |
| Icons | Lucide React | 1.6.0 |
| Voice Input | React Speech Recognition | 4.0.1 |
| PDF Export | html2canvas + jsPDF | 1.4.1 + 4.2.1 |
| Markdown | react-markdown | 10.1.0 |
| Notifications | react-hot-toast | 2.6.0 |

### **Backend**
| Layer | Tech | Version |
|-------|------|---------|
| Runtime | Node.js | 18+ |
| Server | Express | 4.19.2 |
| AI Model | Groq (llama-3.1-8b) | Latest |
| File Upload | Multer | 2.1.1 |
| PDF Parsing | pdf-parse | 2.4.5 |
| CORS | cors | 2.8.5 |
| Config | dotenv | 17.3.1 |

### **Build & Deployment**
- **Module Bundler**: Vite 5.4 (ES modules)
- **CSS Processing**: PostCSS 8.4 + Autoprefixer 10.4
- **Hosting**: Vercel (frontend) / Render (backend)
- **Environment**: Docker-friendly Node.js application

---

## 📁 Project Structure

```
naa project/
├── src/
│   ├── pages/
│   │   ├── Home.jsx                  # Landing page with team
│   │   ├── About.jsx                 # Info page
│   │   ├── CareerRecommendation.jsx  # Recommendation form
│   │   ├── ResumeBuilder.jsx         # Resume editor
│   │   ├── SkillAssessment.jsx       # Quiz generator
│   │   ├── JobSearch.jsx             # Job matching
│   │   └── AIGuideChat.jsx           # Chat interface
│   ├── components/
│   │   ├── Navbar.jsx                # Navigation
│   │   └── Footer.jsx                # Footer
│   ├── layouts/
│   │   └── AppLayout.jsx             # Root layout
│   ├── utils/
│   │   └── invokeLLM.js              # API client
│   ├── App.jsx                       # Router (lazy-loaded)
│   ├── main.jsx                      # Entry point
│   └── index.css                     # Tailwind directives
├── server/
│   └── index.js                      # Express API (600+ lines)
├── dist/                             # Production build
├── package.json
├── vite.config.js
├── tailwind.config.js
├── .env.example                      # Environment template
└── README.md                         # This file
```

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ (LTS)
- npm or yarn
- Groq API key (free: https://console.groq.com)

### **Installation**

```bash
# Clone & install
git clone https://github.com/varun-2907/careerx.git
cd naa\ project
npm install

# Setup environment
cp .env.example .env
# Edit .env and add GROQ_API_KEY
```

### **Run Locally**

**Terminal 1: Backend**
```bash
npm run server
# Starts on http://localhost:8787
```

**Terminal 2: Frontend**
```bash
npm run dev
# Starts on http://localhost:5173
```

---

## 🎯 How It Works

### **Overview**

CareerX is an **AI-powered career guidance platform** that helps users discover career paths, assess skills, find jobs, and build resumes—all powered by Groq's LLM in real-time.

Every response is **AI-generated fresh**, not from databases. Jobs, recommendations, quizzes, and advice are all created on-demand by the LLM based on user input.

---

### **Feature Breakdown & How It Works**

#### **1. Career Recommendation** ✨
**What happens:**
```
User Input:
  Name: Alice
  Age: 24
  Skills: Python, React, SQL
  Interests: AI, Web3
  Strength: Excellent

    ↓ (sent to Groq)

Groq LLM generates:
  "Based on Python/React skills and AI interest,
   I recommend: (1) ML Engineer, (2) Full-Stack AI Developer, (3) Data Scientist"
  + salary ranges + growth %

    ↓ (cached for 5 min)

Frontend displays:
  [3 recommendation cards with details]
```

---

#### **2. Job Search** 🔍
**What happens:**
```
User Input:
  Query: "React Developer"
  Location: "Remote"
  Skills: "React, Node.js"

    ↓ (sent to Groq)

Groq LLM generates:
  "Generate 3-5 job listings for a React Developer in Remote.
   Create realistic titles, companies, salaries, descriptions that match."
  
  Response: {"jobs": [
    {
      "title": "Senior React Developer",
      "company": "CloudTech Solutions",
      "location": "Remote",
      "salaryRange": "$120K - $160K",
      "description": "Build scalable React apps..."
    },
    ...
  ]}

    ↓

Frontend displays:
  [Job cards with all details]
```

---

#### **3. Skill Assessment** 📝
**What happens:**
```
User Input:
  Role: "Data Scientist"
  Current Skills: "Python, SQL"
  (System requests 15 questions)

    ↓ (sent to Groq)

Groq LLM generates:
  "Create 15 questions strictly relevant to Data Science.
   Each with 4 options and correct answer index."

  Response: {"quiz": [
    {
      "question": "What does SQL INNER JOIN do?",
      "options": ["Merges two tables...", "Filters rows...", ...],
      "correctAnswer": 0
    },
    ... (14 more questions)
  ]}

    ↓

Frontend displays:
  [Interactive quiz with scoring]
  After submission: Score = 12/15 → "Good job! Some areas to focus on."
```

---

#### **4. AI Guide Chat** 💬
**What happens:**
```
User Message: "I want to switch to AI engineering. What's the roadmap?"

    ↓ (sent to Groq with conversation history)

Groq LLM responds:
  "Title: AI Engineering Career Path
   Summary: Switch from web dev to AI requires 6-12 months
   Key Points:
   1) Learn PyTorch and TensorFlow
   2) Build 2-3 ML projects
   3) Study transformer architecture
   Action Steps: ... [structured format]"

    ↓

Frontend displays:
  [Assistant message with formatting]
```

**Features**:
- Full conversation history sent to Groq
- Voice-to-text input (speech recognition)
- Real-time responses

---

#### **5. Resume Builder** 📄
**What happens:**
```
User fills in:
  • Personal info (name, email, phone)
  • Experience (company, role, duration)
  • Skills (Python, React, etc.)
  • Education (degree, university)

User clicks "Generate AI Summary" button

    ↓ (sends: name, role, skills, experience to Groq)

Groq LLM generates:
  "Seasoned Python developer with 3+ years building 
   React applications. Expert in full-stack development 
   with proven track record scaling startups."

    ↓

Frontend displays:
  [Summary auto-filled in form]

User can edit further, then:
  Click "Export PDF" → Downloads resume.pdf
```

**Tech**: html2canvas + jsPDF for PDF generation.

---

#### **6. Resume Upload & Parse** 📤
**What happens:**
```
User uploads: resume.pdf

    ↓ (sent to server)

Server extracts text using pdf-parse library

    ↓ (sent to Groq)

Groq LLM parses:
  "Extract: name, email, phone, skills, 
   experience summary, education from this resume text."

    ↓ (returns JSON)

Frontend auto-fills form fields from parsed data
```

**Note**: Uses text-based PDFs only (not scanned images).

---

### **Rate Limiting & Caching** 🛡️

**Why it matters**: Groq free tier has ~100 req/minute quota. We protect it:

```
1. CLIENT-SIDE:
   if (loading) return  // Don't allow duplicate clicks
   
2. SERVER-SIDE:
   checkRateLimit(clientIP)  // 10 req/min per IP
   
3. RESPONSE CACHE:
   getFromCache(type, payload)  // 5-min TTL
   If same query asked twice → serve from cache instantly
   
   Example: User A asks "React Developer jobs"
            Server calls Groq, caches result
            User B asks "React Developer jobs" within 5 min
            → Returns cached result (no Groq call)
            → Saves 70% of API quota
```

---

### **Key Design Patterns** 🏗️

| Component | Description | Benefit |
|-----------|-------------|----------|
| **Lazy Routes** | Only loads page code when clicked | Faster initial load, smaller bundles |
| **Response Cache** | 5-min TTL caching with query-based keys | 70% reduction in API calls |
| **Rate Limiting** | 10 req/min per IP, client-side guards | Protects free tier quota |
| **Non-blocking Home** | Renders defaults instantly, fetches AI in background | Immediate page visibility |
| **Error Handling** | Clear user messages + graceful fallbacks | Better UX when API unavailable |
| **Groq JSON API** | Structured JSON responses | Type-safe, no parsing errors |

---

## 📊 API Endpoints

| Endpoint | Method | Rate Limit | Purpose |
|----------|--------|-----------|---------|
| `/api/recommendation` | POST | 10/min | Career recommendations (3 roles) |
| `/api/skill-assessment` | POST | 10/min | Generate 10–15 question quiz |
| `/api/job-search` | POST | 10/min | Find jobs by role/skills |
| `/api/chat` | POST | 10/min | Conversational AI counselor |
| `/api/summary` | POST | 10/min | AI resume summary |
| `/api/upload-resume` | POST | 10/min | Parse resume PDF |
| `/api/home-content` | POST | 10/min | Dynamic homepage (cached) |

### **Example: Career Recommendation**

```bash
curl -X POST http://localhost:8787/api/recommendation \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice",
    "age": 24,
    "skills": "Python, React, Data Analysis",
    "interests": "AI, Web3, Data Science",
    "strength": "Excellent"
  }'
```

**Response (cached for 5 min):**
```json
{
  "recommendations": [
    {
      "title": "ML Engineer",
      "salary": "$120k–140k",
      "growth": "25% YoY",
      "reason": "Your Python & AI interest align perfectly..."
    },
    ...
  ],
  "quote": "Data is the new oil..."
}
```

---

## ✨ Key Features

✅ **Non-blocking UX** – Renders defaults immediately; fetches AI content in background  
✅ **Code splitting** – Route-level lazy loading for all pages  
✅ **5-min response cache** – Identical queries served from memory  
✅ **Rate-limit guards** – Client + server duplicate-request prevention  
✅ **Mobile responsive** – Tailwind breakpoints, touch-friendly nav  
✅ **Voice input** – Speech-to-text in AI chat  
✅ **PDF export** – Resume to PDF with formatting preserved  
✅ **Error resilience** – Graceful fallbacks when API unavailable  

---

## 📈 Performance Metrics

- **Initial load**: ~3.6s (all pages lazy-loaded)
- **API response**: 2–4s (Groq processing)
- **Cache hit**: <100ms (5-min TTL)
- **Bundle optimization**: Code-split routes, lazy loading, Tailwind JIT compilation

---

## 🏗️ Architecture

### **Request Flow**
```
[Client] –– React Router ––> [Page Component]
            (lazy-loaded)
            
[Page] ––– invokeLLM.js ––> [Express API]
           (rate-limited)
           
[API] ––– [Cache Check] ––> [Groq LLM]
          (5-min TTL)        (or fallback)
          
[Response] ––– JSON ––> [Client Render]
```

### **Caching Strategy**
- **Query-based key**: `{ type, skills, interests, ... }`
- **TTL**: 5 minutes
- **Max entries**: 100 (auto-cleanup)
- **Reduces API cost by ~70%** in demo scenarios

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "API rate limit reached" | Wait 60s or increase cache TTL to 10 min |
| PDF export fails | Ensure browser supports canvas2d |
| Resume upload fails | Check PDF is text-based (not scanned image) |
| Voice input not working | Enable microphone in browser settings |

---

## 🚢 Deployment

### **Frontend to Vercel**
```bash
npm run build
vercel --prod
```

### **Backend to Render**
1. Push to GitHub
2. Create new service on Render
3. Set `npm run server` as start command
4. Add `GROQ_API_KEY` in environment variables

---

## 🤝 Team

- **SRINITHYA** – Product Lead
- **NAVADEEP VARMA** – ML Engineer
- **SIDDDIQ SK** – Frontend Dev
- **VARUN DEEPAK** – Growth & Ops

---

## 📝 License

Proprietary | Hackathon Project 2026

---

## 🔗 Resources

- [Groq Console](https://console.groq.com)
- [Vite Docs](https://vitejs.dev)
- [React 18 Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)

**Built for Hackathon | Last updated: April 3, 2026**
