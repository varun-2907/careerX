import { useState } from 'react'
import { invokeLLM } from '../utils/invokeLLM'

export default function SkillAssessment() {
  const [role, setRole] = useState('')
  const [skills, setSkills] = useState('')
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const generateQuiz = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await invokeLLM('skill-assessment', { role, currentSkills: skills })
      if (!response?.quiz) {
        throw new Error('AI is unavailable right now. Please try again later.')
      }
      setQuiz(response.quiz)
      setAnswers({})
      setResult(null)
    } catch (err) {
      setQuiz(null)
      setResult(null)
      setError(err.message || 'AI is unavailable right now. Please try again later.')
    }
    setLoading(false)
  }

  const submitQuiz = () => {
    let score = 0
    quiz.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) score++
    })
    setResult({ score, total: quiz.length })
  }

  return (
    <div className="max-w-4xl mx-auto px-6 space-y-8">
      <header className="space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Skill Assessment</p>
        <h1 className="text-3xl md:text-4xl font-semibold">Test your skills with AI.</h1>
        <p className="text-slate-300">
          Get a personalized quiz to assess your readiness for your target role.
        </p>
      </header>

      <div className="glass rounded-3xl p-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <input
            className="px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/60"
            placeholder="Target Role (e.g., Data Scientist)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          <input
            className="px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/60"
            placeholder="Current Skills (comma separated)"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />
        </div>
        <button
          onClick={generateQuiz}
          disabled={loading || !role}
          className="gradient-bg px-6 py-3 rounded-xl font-semibold"
        >
          {loading ? 'Generating Quiz...' : 'Generate Quiz'}
        </button>
      </div>

      {quiz && (
        <div className="glass rounded-3xl p-6 space-y-6">
          <h2 className="text-2xl font-semibold">Your Skill Assessment Quiz</h2>
          {quiz.map((q, i) => (
            <div key={i} className="space-y-3">
              <p className="font-semibold">{q.question}</p>
              {q.options.map((opt, j) => (
                <label key={j} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name={`q${i}`}
                    value={j}
                    onChange={() => setAnswers({ ...answers, [i]: j })}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          ))}
          <button
            onClick={submitQuiz}
            className="gradient-bg px-6 py-3 rounded-xl font-semibold"
          >
            Submit Quiz
          </button>
        </div>
      )}

      {error && (
        <div className="text-sm text-rose-300 bg-rose-500/20 border border-rose-400/30 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}
      {result && (
        <div className="glass rounded-3xl p-6 text-center">
          <h3 className="text-2xl font-semibold">Your Score: {result.score}/{result.total}</h3>
          <p className="text-slate-300 mt-2">
            {result.score / result.total > 0.8 ? 'Excellent! You\'re well-prepared.' :
             result.score / result.total > 0.6 ? 'Good job! Some areas to focus on.' :
             'Keep learning! Focus on building these skills.'}
          </p>
        </div>
      )}
    </div>
  )
}