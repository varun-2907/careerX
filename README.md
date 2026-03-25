# CareerX - AI-Powered Career Guidance Platform

A modern, AI-driven career guidance platform built with React, Express, and Groq AI. Features intelligent career recommendations, resume building, skill assessments, and voice-enabled AI chat.

## 🚀 Features

- **AI Career Recommendations** - Personalized career paths based on skills and interests
- **Smart Resume Builder** - AI-powered resume summaries with live preview and PDF export
- **Skill Assessment Quizzes** - Dynamic quiz generation for career readiness
- **Job Search** - AI-powered job matching and recommendations
- **Voice-Enabled Chat** - Conversational AI career counselor with speech recognition
- **Resume Upload & Parsing** - PDF and text resume analysis
- **Rate Limiting** - Built-in protection against API abuse

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **React Router** - Client-side routing
- **React Speech Recognition** - Voice input functionality

### Backend
- **Express.js** - RESTful API server
- **Groq AI** - Fast, affordable AI inference
- **Multer** - File upload handling
- **PDF-Parse** - Resume PDF processing

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- GitHub account

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/careerx.git
   cd careerx
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your Groq API key
   ```

4. **Get Groq API Key**
   - Visit [Groq Console](https://console.groq.com/keys)
   - Create an API key
   - Add it to your `.env` file:
   ```env
   GROQ_API_KEY=your_api_key_here
   ```

5. **Start the development servers**
   ```bash
   # Terminal 1: Start backend
   npm run server

   # Terminal 2: Start frontend
   npm run dev
   ```

6. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8787

## 📁 Project Structure

```
careerx/
├── server/                 # Backend Express server
│   ├── index.js           # Main server file
│   └── uploads/           # File upload directory
├── src/                   # Frontend React app
│   ├── components/        # Reusable components
│   ├── pages/            # Page components
│   ├── layouts/          # Layout components
│   ├── utils/            # Utility functions
│   └── assets/           # Static assets
├── public/               # Public static files
├── .env.example         # Environment variables template
├── .gitignore          # Git ignore rules
├── package.json        # Dependencies and scripts
├── vite.config.js      # Vite configuration
└── tailwind.config.js  # Tailwind CSS configuration
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run server` - Start backend API server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🤖 AI Features

### Career Recommendations
- Analyzes user skills, interests, and background
- Provides 3 personalized career suggestions
- Includes salary ranges and growth projections

### Resume Builder
- AI-generated professional summaries
- Live preview with PDF export
- Tabbed interface for easy editing

### Skill Assessments
- Dynamic quiz generation based on target roles
- Multiple choice questions with explanations
- Progress tracking and recommendations

### Voice Chat
- Speech-to-text input
- AI-powered career counseling
- Natural language conversations

## 🔒 Security & Rate Limiting

- **Rate Limiting**: 10 requests per minute per IP
- **API Key Protection**: Secure key management
- **File Upload Validation**: Safe resume processing
- **Error Handling**: Graceful fallbacks for API failures

## 📊 API Endpoints

- `POST /api/chat` - AI chat conversations
- `POST /api/recommendation` - Career recommendations
- `POST /api/summary` - Resume summary generation
- `POST /api/skill-assessment` - Quiz generation
- `POST /api/job-search` - Job search and matching
- `POST /api/upload-resume` - Resume file upload
- `GET /api/health` - Server health check

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Groq](https://groq.com) for fast AI inference
- [React](https://reactjs.org) for the UI framework
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Vite](https://vitejs.dev) for the build tool

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

---

**Built with ❤️ for career guidance and professional development**