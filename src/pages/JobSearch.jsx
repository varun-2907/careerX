import { useState } from 'react'
import { invokeLLM } from '../utils/invokeLLM'

export default function JobSearch() {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [skills, setSkills] = useState('')
  const [jobs, setJobs] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const searchJobs = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await invokeLLM('job-search', { query, location, skills })
      if (!response?.jobs) {
        throw new Error('AI is unavailable right now. Please try again later.')
      }
      setJobs(response.jobs)
    } catch (err) {
      setJobs([])
      setError(err.message || 'AI is unavailable right now. Please try again later.')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-6xl mx-auto px-6 space-y-8">
      <header className="space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Job Search</p>
        <h1 className="text-3xl md:text-4xl font-semibold">Find your dream job with AI.</h1>
        <p className="text-slate-300">
          AI-powered job recommendations tailored to your skills and preferences.
        </p>
      </header>

      <div className="glass rounded-3xl p-6 space-y-6">
        {error && (
          <div className="text-sm text-rose-300 bg-rose-500/20 border border-rose-400/30 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}
        <div className="grid md:grid-cols-3 gap-4">
          <input
            className="px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/60"
            placeholder="Job Title or Keywords"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <input
            className="px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/60"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <input
            className="px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/60"
            placeholder="Your Skills"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />
        </div>
        <button
          onClick={searchJobs}
          disabled={loading || !query}
          className="gradient-bg px-6 py-3 rounded-xl font-semibold"
        >
          {loading ? 'Searching...' : 'Search Jobs'}
        </button>
      </div>

      {jobs.length > 0 && (
        <div className="space-y-4">
          {jobs.map((job, i) => (
            <div key={i} className="glass rounded-3xl p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">{job.title}</h3>
                  <p className="text-slate-300">{job.company} • {job.location}</p>
                  <p className="text-sm text-slate-400 mt-2">{job.salaryRange}</p>
                </div>
              </div>
              <p className="text-slate-300 mt-4">{job.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}