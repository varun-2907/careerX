import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const team = [
  { name: 'Varun Deepak', role: 'Full Stack Engineer', focus: 'Platform + UI' },
  { name: 'Uday Kumar Reddy', role: 'AI/ML Engineer', focus: 'Models + Insights' },
  { name: 'Krishna Sathwik', role: 'Product Designer', focus: 'UX + Visuals' },
]

export default function Home() {
  const [content, setContent] = useState({
    features: [],
    stats: [],
    futureScope: [],
    highlights: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/home-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
        if (response.ok) {
          const data = await response.json()
          setContent(data)
        }
      } catch (error) {
        console.error('Failed to fetch home content:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchContent()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    )
  }
  return (
    <div className="space-y-24">
      <section className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-sm uppercase tracking-[0.3em] text-slate-400"
          >
            AI-Powered Career Guidance
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold leading-tight"
          >
            Build your next move with <span className="gradient-text">CareerX</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-300 text-lg"
          >
            Discover roles that match your strengths, craft resumes that stand out, and get real-time
            mentorship from our AI counselor.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-4"
          >
            <a
              href="/recommendation"
              className="gradient-bg px-6 py-3 rounded-xl font-semibold text-white shadow-glow"
            >
              Get Recommendations
            </a>
            <a
              href="/resume-builder"
              className="px-6 py-3 rounded-xl border border-slate-700/60 text-slate-200 hover:text-white"
            >
              Build Resume
            </a>
          </motion.div>
        </div>
        <div className="relative h-[420px]">
          <motion.div
            className="glass rounded-3xl p-6 absolute top-0 left-0 w-64 float-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm text-slate-300">Career Match</p>
            <h3 className="text-2xl font-semibold mt-2">95% Alignment</h3>
            <p className="text-xs text-slate-400 mt-2">AI Product + UX Strategy</p>
          </motion.div>
          <motion.div
            className="glass rounded-3xl p-6 absolute top-28 right-0 w-64 float-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <p className="text-sm text-slate-300">Salary Range</p>
            <h3 className="text-2xl font-semibold mt-2">$85k - $140k</h3>
            <p className="text-xs text-slate-400 mt-2">Projected 3-year growth 30%</p>
          </motion.div>
          <motion.div
            className="glass rounded-3xl p-6 absolute bottom-0 left-10 w-72 float-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="text-sm text-slate-300">AI Mentor</p>
            <h3 className="text-2xl font-semibold mt-2">24/7 Guidance</h3>
            <p className="text-xs text-slate-400 mt-2">Ask anything about your career roadmap</p>
          </motion.div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 space-y-10">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Features</p>
          <h2 className="text-3xl font-semibold">Everything you need to accelerate your career.</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {content.features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="glass rounded-2xl p-6 space-y-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="text-sm text-slate-300">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">About</p>
          <h2 className="text-3xl font-semibold">Career clarity powered by AI insights.</h2>
          <p className="text-slate-300">
            CareerX blends industry trends, your unique strengths, and AI mentorship into a single
            workspace so you can focus on growth.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {content.stats.map((stat) => (
            <div key={stat.label} className="glass rounded-2xl p-4 text-center">
              <p className="text-2xl font-semibold">{stat.value}</p>
              <p className="text-xs text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-10">
        <div className="glass rounded-3xl p-8 space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Future Scope</p>
          <h2 className="text-3xl font-semibold">What’s next on the CareerX roadmap.</h2>
          <p className="text-slate-300">We are building new AI modules to make your career journey even smarter.</p>
        </div>
        <div className="space-y-4">
          {content.futureScope.map((item) => (
            <div key={item} className="glass rounded-2xl p-5">
              <p className="text-sm text-slate-200">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 space-y-10">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Project Highlights</p>
          <h2 className="text-3xl font-semibold">Presentation-ready feature set.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {content.highlights.map((item) => (
            <div key={item.title} className="glass rounded-3xl p-6 space-y-3">
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="text-sm text-slate-300">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 space-y-10">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Meet the Team</p>
          <h2 className="text-3xl font-semibold">The developers shaping CareerX.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {team.map((member) => (
            <div key={member.name} className="glass rounded-3xl p-6 space-y-3">
              <div className="h-14 w-14 rounded-2xl gradient-bg flex items-center justify-center text-white font-semibold">
                {member.name
                  .split(' ')
                  .map((part) => part[0])
                  .join('')}
              </div>
              <div>
                <p className="text-lg font-semibold">{member.name}</p>
                <p className="text-sm text-slate-400">{member.role}</p>
              </div>
              <p className="text-sm text-slate-300">Focus: {member.focus}</p>
              <div className="flex gap-3 text-xs text-slate-400">
                <span className="px-2 py-1 rounded-full border border-slate-700/60">LinkedIn</span>
                <span className="px-2 py-1 rounded-full border border-slate-700/60">GitHub</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
