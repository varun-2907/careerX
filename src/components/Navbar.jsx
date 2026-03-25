import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home' },
  { to: '/recommendation', label: 'Career Recommendation' },
  { to: '/resume-builder', label: 'Resume Builder' },
  { to: '/ai-guide', label: 'AI Guide Chat' },
  { to: '/skill-assessment', label: 'Skill Assessment' },
  { to: '/job-search', label: 'Job Search' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 w-full z-50">
      <nav className="glass mx-4 mt-4 rounded-2xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-bg flex items-center justify-center text-white font-bold shadow-glow">
            CX
          </div>
          <div>
            <p className="text-lg font-semibold">CareerX</p>
            <p className="text-xs text-slate-300">AI-Powered Guidance</p>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-6">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium transition ${
                  isActive ? 'text-white' : 'text-slate-300 hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
        <button
          className="lg:hidden h-10 w-10 rounded-xl border border-slate-700/60 flex items-center justify-center"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          <span className="text-xl">{open ? '✕' : '☰'}</span>
        </button>
      </nav>
      {open && (
        <div className="lg:hidden mx-4 mt-2 glass rounded-2xl px-6 py-4 flex flex-col gap-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `text-sm font-medium ${
                  isActive ? 'text-white' : 'text-slate-300 hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  )
}
