import { useState } from 'react'
import { invokeLLM } from '../utils/invokeLLM'

const strengths = ['Excellent', 'Good', 'Average', 'Needs Improvement']

export default function CareerRecommendation() {
  const [form, setForm] = useState({
    name: '',
    age: '',
    skills: '',
    interests: '',
    strength: strengths[0],
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await invokeLLM('career-recommendation', form)
      setResult(response)
    } catch (err) {
      setResult(null)
      setError(err.message || 'AI is unavailable right now. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 space-y-12">
      <header className="space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Career Recommendation</p>
        <h1 className="text-3xl md:text-4xl font-semibold">
          Discover career paths personalized for you.
        </h1>
        <p className="text-slate-300">
          Share your strengths and interests, then let CareerX generate three AI-backed
          recommendations with salary ranges, growth metrics, and a motivational boost.
        </p>
      </header>

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8">
        <form onSubmit={handleSubmit} className="glass rounded-3xl p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="space-y-2 text-sm text-slate-300">
              Name
              <input
                className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/60"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
                required
              />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              Age
              <input
                className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/60"
                name="age"
                type="number"
                min="15"
                value={form.age}
                onChange={handleChange}
                placeholder="20"
                required
              />
            </label>
          </div>
          <label className="space-y-2 text-sm text-slate-300">
            Skills (comma separated)
            <input
              className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/60"
              name="skills"
              value={form.skills}
              onChange={handleChange}
              placeholder="Python, UI Design, Data Analysis"
              required
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            Interests
            <textarea
              className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/60 min-h-[120px]"
              name="interests"
              value={form.interests}
              onChange={handleChange}
              placeholder="AI products, cybersecurity, cloud systems..."
              required
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            Academic Strength
            <select
              className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/60"
              name="strength"
              value={form.strength}
              onChange={handleChange}
            >
              {strengths.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="w-full gradient-bg py-3 rounded-xl font-semibold shadow-glow"
          >
            {loading ? 'Analyzing with AI...' : 'Get Recommendations'}
          </button>
        </form>

        <div className="space-y-6">
          <div className="glass rounded-3xl p-6 space-y-3">
            <h2 className="text-xl font-semibold">AI Guidance Preview</h2>
            <p className="text-sm text-slate-300">
              Once you submit, CareerX will deliver three career paths with salary ranges, growth
              rates, and a tailored justification.
            </p>
          </div>
          {error && (
            <div className="text-sm text-rose-300 bg-rose-500/20 border border-rose-400/30 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
          {result && (
            <div className="glass rounded-3xl p-6 space-y-6">
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Recommendations</p>
                <h3 className="text-2xl font-semibold">Top AI Matches</h3>
              </div>
              <div className="space-y-4">
                {result.recommendations.map((career) => (
                  <div key={career.title} className="border border-slate-700/60 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold">{career.title}</h4>
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-200">
                        {career.growth}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">Salary: {career.salary}</p>
                    <p className="text-sm text-slate-300 mt-2">{career.reason}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-700/60 pt-4">
                <p className="text-sm text-slate-400">Motivational Quote</p>
                <p className="text-base italic">“{result.quote}”</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
