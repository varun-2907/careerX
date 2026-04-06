# CareerX – AI-Powered Career Guidance Platform

CareerX is a full-stack career guidance platform that helps users explore role fit, build resumes, prepare for interviews, and find relevant job opportunities. It blends a modern React UI with an Express backend and LLM integration to deliver structured, actionable insights.

## Highlights
- Personalized career recommendations with salary ranges and growth outlook
- AI Guide Chat for roadmaps, interviews, and career planning
- Skill assessment generation for targeted role readiness
- Resume summary assistance with PDF export
- Job search insights aligned to user profiles

## Tech Stack
- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express
- AI: Groq LLM (llama-3.1-8b-instant)

## Architecture
- React SPA with route-based code splitting
- Express API server with rate limiting, caching, and input validation
- Structured JSON responses from the LLM for reliable rendering

## Getting Started

### 1) Install
```bash
npm install
```

### 2) Environment
Create a `.env` file in the project root:
```env
# Backend
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant
PORT=8787

# Frontend
VITE_API_BASE_URL=http://localhost:8787

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Optional demo modes
MOCK_RECOMMENDATIONS=false
MOCK_CHAT=false
```

### 3) Run
```bash
# Terminal 1 - backend
node server/index.js

# Terminal 2 - frontend
npm run dev
```

## Demo Modes
If you want the app to work without a live AI key, enable mock modes:
```env
MOCK_RECOMMENDATIONS=true
MOCK_CHAT=true
```

## Scripts
```bash
npm run dev       # Start frontend dev server
npm run build     # Build frontend
npm run preview   # Preview built frontend
```

## API Endpoints
- `POST /api/recommendation`
- `POST /api/chat`
- `POST /api/summary`
- `POST /api/skill-assessment`
- `POST /api/job-search`
- `POST /api/home-content`

## Deployment
- Frontend: Deploy the Vite build output to Vercel or any static hosting provider.
- Backend: Deploy the Express server to Render, Railway, or any Node.js runtime.
- Ensure `VITE_API_BASE_URL` points to your deployed backend URL.
- Configure CORS in `CORS_ORIGIN` to allow your frontend domain.

## Troubleshooting
- `ERR_CONNECTION_REFUSED`: Backend is not running or `VITE_API_BASE_URL` is wrong.
- `Invalid API Key`: Set `GROQ_API_KEY` in the backend environment and restart the server.
- `Rate limit exceeded`: Enable `MOCK_RECOMMENDATIONS`/`MOCK_CHAT` or wait and retry.

## Roadmap
- Add user profiles and saved plans
- Role-specific interview preparation packs
- Multi-language support for global users
- Analytics dashboard for career progress

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request

## Team
- VARUN DEEPAK
- UDAY KUMAR REDDY
- KRISHNA SATHVIK

## License
MIT
