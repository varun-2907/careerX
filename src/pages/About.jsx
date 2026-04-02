export default function About() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
      <h1 className="text-3xl md:text-4xl font-bold">About CareerX</h1>
      <p className="text-slate-300 text-base leading-relaxed">
        CareerX is a hackathon-ready AI suite to help users discover career paths, build resumes, test
        skills, and find job match suggestions using a polished, streamlined UI.
      </p>
      <p className="text-slate-300 text-base leading-relaxed">
        Our focus is quality rollout: resilient UX, centralized backend prompts, role-aware assessments,
        and fast navigation. This page exists as a stable info page for demo and validation.
      </p>
      <ul className="list-disc list-inside space-y-2 text-slate-300 text-base">
        <li>Multi-page React router navigation with code-splitting</li>
        <li>AI-based end-to-end career workflow (recommendation, resume, skill questions, job search)</li>
        <li>Robust API error handling and rate-limit protection</li>
        <li>Minimal with fallback defaults for fast initial load</li>
      </ul>
    </div>
  )
}
