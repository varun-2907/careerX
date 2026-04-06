import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../utils/invokeLLM'

const defaultContent = {
  hero: {
    eyebrow: 'Career AI',
    title: 'Smart career moves',
    titleAccent: 'without the noise',
    subtitle: 'Actionable recommendations and tools in one easy flow.',
    primaryCta: 'Get Started',
    secondaryCta: 'Explore Features',
  },
  features: [
    { title: 'Career recommendation', desc: 'Match roles and skill gaps quickly.' },
    { title: 'Resume assistant', desc: 'Generate concise, role-based resume highlights.' },
    { title: 'Guided job search', desc: 'Focus on opportunities aligned to your profile.' },
  ],
  useCases: [
    { title: 'Entry-level planning', detail: 'Plan the next 90 days, step-by-step.' },
    { title: 'Mid-career shift', detail: 'Assess and compare role paths with evidence.' },
  ],
}

export default function Home() {
  const [content, setContent] = useState(defaultContent)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    const fetchContent = async () => {
      setLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/api/home-content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        })
        const data = await response.json()
        if (data.error) throw new Error(data.error)

        if (isMounted && data) {
          setContent((prev) => ({
            ...prev,
            hero: { ...prev.hero, ...(data.hero || {}) },
            features: Array.isArray(data.features) ? data.features : prev.features,
            useCases: Array.isArray(data.useCases) ? data.useCases : prev.useCases,
          }))
        }
      } catch (err) {
        if (isMounted) setError(String(err.message || 'Failed to load content.'))
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchContent()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  // Always render core content; hydration is immediate and remote API updates are gradual.
  // In hackathon mode, we avoid blocking UX on backend data errors.
  const showError = Boolean(error)

  if (showError) {
    console.warn('[Home] remote content load issue:', error)
  }

  const { hero, features, useCases } = content

  return (
    <div className="space-y-16 max-w-6xl mx-auto px-6 py-10">
      <section className="relative overflow-hidden rounded-3xl border border-slate-700/70 bg-slate-950 p-8">
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] relative">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{hero.eyebrow}</p>
            <h1 className="mt-4 text-4xl md:text-5xl font-bold text-white leading-tight">
              {hero.title} <span className="text-emerald-300">{hero.titleAccent}</span>
            </h1>
            <p className="mt-4 text-slate-300 text-base md:text-lg max-w-xl">{hero.subtitle}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/recommendation"
                className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-400/30 transition hover:-translate-y-0.5"
              >
                {hero.primaryCta}
              </Link>
              <Link
                to="/ai-guide"
                className="inline-flex items-center justify-center rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 hover:border-emerald-400/50"
              >
                {hero.secondaryCta}
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3 max-w-xl">
              {[
                { label: 'Role Matches', value: '40+' },
                { label: 'Skill Signals', value: '120+' },
                { label: 'Avg Time', value: '45 sec' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
                  <p className="text-xl font-semibold text-white">{stat.value}</p>
                  <p className="text-xs text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">AI Snapshot</p>
                <h3 className="text-lg font-semibold text-white mt-2">Career Fit Pulse</h3>
              </div>
              <span className="text-xs rounded-full bg-emerald-500/20 text-emerald-300 px-3 py-1">Live</span>
            </div>
            <div className="mt-5 space-y-3">
              {[
                { title: 'Full-Stack Developer', fit: '92% fit', note: 'High demand in product teams' },
                { title: 'Cloud Engineer', fit: '88% fit', note: 'Strong infrastructure pathway' },
                { title: 'Embedded AI Engineer', fit: '83% fit', note: 'Emerging edge role' },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <span className="text-xs text-emerald-300">{item.fit}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Core capabilities</h2>
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
              <h3 className="font-semibold text-white">{feature.title}</h3>
              <p className="text-slate-300 mt-2 text-sm">{feature.desc}</p>
              <p className="mt-3 text-xs text-emerald-300/80">AI-ranked insights</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Immediate use cases</h2>
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          {useCases.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
              <h3 className="font-semibold text-white">{item.title}</h3>
              <p className="text-slate-300 mt-2 text-sm">{item.detail}</p>
              <p className="mt-3 text-xs text-slate-400">Outcome-driven planning</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Team behind CareerX</h2>
        <p className="text-slate-400 text-sm mt-1">Small team, big impact.</p>
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'VARUN DEEPAK', role: 'Product Lead and UI Designer' },
            { name: 'UDAY KUMAR REDDY', role: 'AI Engineer' },
            { name: 'KRISHNA SATHVIK', role: 'Frontend Dev' },
          ].map((member) => (
            <div
              key={member.name}
              className="group rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-1 transition-all duration-200 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-400/20"
            >
              <div className="h-full rounded-xl bg-slate-900 p-5 transition-transform duration-200 group-hover:-translate-y-1 group-hover:bg-slate-800">
                <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-emerald-400/20 flex items-center justify-center text-base font-bold text-emerald-300">
                  {member.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </div>
                <p className="text-white font-semibold">{member.name}</p>
                <p className="text-xs text-emerald-300 mt-1">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
