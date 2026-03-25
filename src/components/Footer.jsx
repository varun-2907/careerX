const social = [
  { label: 'LinkedIn', href: '#' },
  { label: 'GitHub', href: '#' },
  { label: 'Twitter', href: '#' },
]

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-800/60">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <p className="text-lg font-semibold">CareerX</p>
          <p className="text-sm text-slate-400">Empowering smarter career decisions with AI.</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-slate-400">
          <a className="hover:text-white" href="/">Home</a>
          <a className="hover:text-white" href="/recommendation">Recommendation</a>
          <a className="hover:text-white" href="/resume-builder">Resume Builder</a>
          <a className="hover:text-white" href="/ai-guide">AI Guide</a>
        </div>
        <div className="flex gap-4 text-sm text-slate-400">
          {social.map((item) => (
            <a key={item.label} className="hover:text-white" href={item.href}>
              {item.label}
            </a>
          ))}
        </div>
      </div>
      <div className="text-center text-xs text-slate-500 pb-6">© 2026 CareerX. All rights reserved.</div>
    </footer>
  )
}
