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
      <section className="rounded-2xl border border-slate-700 bg-slate-900 p-8">
        <p className="text-xs uppercase tracking-wide text-slate-400">{hero.eyebrow}</p>
        <h1 className="mt-4 text-4xl font-bold text-white">
          {hero.title} <span className="text-emerald-300">{hero.titleAccent}</span>
        </h1>
        <p className="mt-3 text-slate-300">{hero.subtitle}</p>

      </section>

      <section>
        <h2 className="text-2xl font-semibold">Core capabilities</h2>
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-xl border border-slate-700 bg-slate-800 p-4">
              <h3 className="font-semibold text-white">{feature.title}</h3>
              <p className="text-slate-300 mt-1 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Immediate use cases</h2>
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          {useCases.map((item) => (
            <div key={item.title} className="rounded-xl border border-slate-700 bg-slate-800 p-4">
              <h3 className="font-semibold text-white">{item.title}</h3>
              <p className="text-slate-300 mt-1 text-sm">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Team behind CareerX</h2>
        <p className="text-slate-400 text-sm mt-1">Small team, big impact.</p>
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'SRINITHYA', role: 'Product Lead and UI Designer', github: 'Srinithya-21' },
            { name: 'NAVADEEP VARMA', role: 'AI Engineer', github: 'navadeep-1104' },
            { name: 'SIDDDIQ SK', role: 'Frontend Dev', github: 'siddiqshiak521-a11y' },
            { name: 'VARUN DEEPAK', role: 'Backend Engineer', github: 'varun-2907' },
          ].map((member) => (
            <a
              key={member.name}
              href={`https://github.com/${member.github}`}
              target="_blank"
              rel="noopener noreferrer"
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
                <p className="text-xs text-slate-400 mt-2 group-hover:text-emerald-300 transition-colors">@{member.github}</p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
