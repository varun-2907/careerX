import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

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
      <section className="max-w-6xl mx-auto px-6">
        <div className="relative overflow-hidden rounded-[30px] border border-slate-800/70 bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#0b1224_35%,_#05060f_100%)] p-10 md:p-14">
          <div className="pointer-events-none absolute -top-24 right-10 h-60 w-60 rounded-full bg-cyan-400/20 blur-[130px]" />
          <div className="pointer-events-none absolute -bottom-32 left-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-[160px]" />
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center relative">
            <div className="space-y-6">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-xs uppercase tracking-[0.35em] text-slate-400"
              >
            Career Intelligence Suite
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold leading-tight"
          >
            Make bold career moves with <span className="gradient-text">CareerX</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-300 text-lg"
          >
            Strategy, storytelling, and skill plans in one focused workspace. Cut the noise and
            move fast with AI-led guidance tailored to your goals.
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
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-slate-300">
              <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Signal</p>
                <p className="text-2xl font-semibold text-white">95% fit</p>
                <p className="text-xs text-slate-400 mt-1">Role alignment score</p>
              </div>
              <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Response</p>
                <p className="text-2xl font-semibold text-white">&lt; 2m</p>
                <p className="text-xs text-slate-400 mt-1">Actionable next steps</p>
              </div>
            </div>
          </div>
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-800/70 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Career Readiness</p>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
                    <p className="text-slate-400 text-xs uppercase tracking-[0.2em]">Alignment</p>
                    <p className="text-xl font-semibold text-white mt-2">95%</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
                    <p className="text-slate-400 text-xs uppercase tracking-[0.2em]">Resume</p>
                    <p className="text-xl font-semibold text-white mt-2">88%</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
                    <p className="text-slate-400 text-xs uppercase tracking-[0.2em]">Interview</p>
                    <p className="text-xl font-semibold text-white mt-2">82%</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
                    <p className="text-slate-400 text-xs uppercase tracking-[0.2em]">Momentum</p>
                    <p className="text-xl font-semibold text-white mt-2">+30%</p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-800/70 bg-slate-900/50 p-6">
                <p className="text-sm text-slate-300">Deliverables</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-200">
                  <span className="px-3 py-1 rounded-full border border-slate-700/70">Career map</span>
                  <span className="px-3 py-1 rounded-full border border-slate-700/70">Resume boost</span>
                  <span className="px-3 py-1 rounded-full border border-slate-700/70">Interview prep</span>
                  <span className="px-3 py-1 rounded-full border border-slate-700/70">Skill sprints</span>
                </div>
              </div>
            </div>
          </div>
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

      <section className="max-w-6xl mx-auto px-6">
        <div className="glass rounded-3xl p-8 md:p-10 grid md:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Get Started</p>
            <h2 className="text-3xl font-semibold">Take the next step in minutes.</h2>
            <p className="text-slate-300">
              Share your strengths and goals. CareerX will deliver a focused plan you can act on today.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <a
              href="/ai-guide"
              className="gradient-bg px-6 py-3 rounded-xl font-semibold text-white shadow-glow"
            >
              Start AI Guide
            </a>
            <a
              href="/recommendation"
              className="px-6 py-3 rounded-xl border border-slate-700/60 text-slate-200 hover:text-white"
            >
              View Recommendations
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 space-y-8">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-end">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Team</p>
            <h2 className="text-3xl font-semibold">
              A small, intense team shipping career intelligence.
            </h2>
            <p className="text-slate-300">
              We move fast across product, AI, and experience design to keep your career journey sharp.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-800/70 bg-slate-900/50 p-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Base</p>
              <p className="text-lg font-semibold">India · Global focus</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mode</p>
              <p className="text-lg font-semibold">Remote-first</p>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: 'Varun Deepak', role: 'Full Stack Engineer', focus: 'Platform + UI' },
            { name: 'Uday Kumar Reddy', role: 'AI/ML Engineer', focus: 'Models + Insights' },
            { name: 'Krishna Sathwik', role: 'Product Designer', focus: 'UX + Visuals' },
          ].map((member, index) => (
            <div
              key={member.name}
              className="rounded-3xl border border-slate-800/70 bg-gradient-to-b from-slate-900/70 to-slate-950/80 p-6"
              style={{ transform: `translateY(${index * 10}px)` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Role</p>
                  <p className="text-lg font-semibold">{member.role}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500/80 to-indigo-500/80 text-white font-semibold flex items-center justify-center">
                  {member.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </div>
              </div>
              <p className="mt-4 text-xl font-semibold">{member.name}</p>
              <p className="text-sm text-slate-300 mt-1">Focus: {member.focus}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>Ownership</span>
                <span className="text-slate-200">High impact</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
