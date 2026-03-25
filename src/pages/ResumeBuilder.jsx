import { useMemo, useState, useRef } from 'react'
import { invokeLLM } from '../utils/invokeLLM'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const tabs = ['Personal', 'Summary', 'Experience', 'Education', 'Skills', 'Projects']

export default function ResumeBuilder() {
  const [activeTab, setActiveTab] = useState(tabs[0])
  const [photo, setPhoto] = useState(null)
  const [loading, setLoading] = useState(false)
  const previewRef = useRef(null)

  const [data, setData] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    experience: [],
    education: [],
    skills: '',
    projects: [],
  })

  const handlePhoto = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhoto(reader.result)
    reader.readAsDataURL(file)
  }

  const updateField = (field, value) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  const updateList = (field, index, key, value) => {
    setData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, idx) => (idx === index ? { ...item, [key]: value } : item)),
    }))
  }

  const addItem = (field, empty) => {
    setData((prev) => ({ ...prev, [field]: [...prev[field], empty] }))
  }

  const [error, setError] = useState('')

  const aiSummary = async () => {
    setLoading(true)
    setError('')
    try {
      const experience = data.experience
        .map((item) => `${item.title} at ${item.company}: ${item.details}`)
        .join(' | ')
      const response = await invokeLLM('summary', {
        name: data.name,
        role: data.role,
        skills: data.skills,
        experience,
      })
      updateField('summary', response.summary)
    } catch (err) {
      setError(err.message || 'AI is unavailable right now. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const exportPDF = async () => {
    if (!previewRef.current) return
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`${data.name || 'resume'}.pdf`)
    } catch (error) {
      console.error('PDF export failed:', error)
      alert('Failed to export PDF. Please try again.')
    }
  }

  const uploadResume = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('resume', file)
    try {
      const response = await fetch('/api/upload-resume', {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()
      if (result.extracted) {
        setData((prev) => ({
          ...prev,
          name: result.extracted.name || prev.name,
          email: result.extracted.email || prev.email,
          phone: result.extracted.phone || prev.phone,
          skills: result.extracted.skills || prev.skills,
          summary: result.extracted.summary || prev.summary,
        }))
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Failed to upload resume.')
    }
  }

  const previewName = useMemo(() => data.name || 'Your Name', [data.name])

  return (
    <div className="max-w-6xl mx-auto px-6 space-y-10">
      <header className="space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Resume Builder</p>
        <h1 className="text-3xl md:text-4xl font-semibold">Craft a polished resume in minutes.</h1>
        <p className="text-slate-300">
          Use the AI summary generator, edit sections in tabs, and preview a professional template
          instantly.
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8">
        <div className="glass rounded-3xl p-6 space-y-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm transition border ${
                  activeTab === tab
                    ? 'bg-slate-900/70 border-slate-500 text-white'
                    : 'border-slate-700/60 text-slate-300 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Personal' && (
            <div className="space-y-4">
              <label className="text-sm text-slate-300 space-y-2">
                Full Name
                <input
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/60"
                  value={data.name}
                  onChange={(event) => updateField('name', event.target.value)}
                />
              </label>
              <label className="text-sm text-slate-300 space-y-2">
                Target Role
                <input
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/60"
                  value={data.role}
                  onChange={(event) => updateField('role', event.target.value)}
                />
              </label>
              <label className="text-sm text-slate-300 space-y-2">
                Email
                <input
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/60"
                  value={data.email}
                  onChange={(event) => updateField('email', event.target.value)}
                />
              </label>
              <label className="text-sm text-slate-300 space-y-2">
                Phone
                <input
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/60"
                  value={data.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                />
              </label>
              <label className="text-sm text-slate-300 space-y-2">
                Location
                <input
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/60"
                  value={data.location}
                  onChange={(event) => updateField('location', event.target.value)}
                />
              </label>
              <label className="text-sm text-slate-300 space-y-2">
                Photo Upload
                <input
                  type="file"
                  accept="image/*"
                  className="w-full text-sm text-slate-300"
                  onChange={handlePhoto}
                />
              </label>
              <label className="text-sm text-slate-300 space-y-2">
                Upload Existing Resume (PDF)
                <input
                  type="file"
                  accept=".pdf"
                  className="w-full text-sm text-slate-300"
                  onChange={uploadResume}
                />
                <p className="text-xs text-slate-400">AI will extract and fill your information</p>
              </label>
            </div>
          )}

          {activeTab === 'Summary' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-300">Professional Summary</p>
                <button
                  onClick={aiSummary}
                  className="text-xs px-3 py-2 rounded-lg border border-slate-700/60 hover:text-white"
                >
                  {loading ? 'Generating...' : 'AI Auto-Generate'}
                </button>
              </div>
              <textarea
                className="w-full min-h-[160px] px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/60"
                value={data.summary}
                onChange={(event) => updateField('summary', event.target.value)}
              />
            </div>
          )}

          {activeTab === 'Experience' && (
            <div className="space-y-4">
              {data.experience.map((item, index) => (
                <div key={index} className="space-y-2 border border-slate-800/60 rounded-2xl p-4">
                  <input
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-700/60"
                    value={item.title}
                    onChange={(event) => updateList('experience', index, 'title', event.target.value)}
                    placeholder="Role"
                  />
                  <input
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-700/60"
                    value={item.company}
                    onChange={(event) => updateList('experience', index, 'company', event.target.value)}
                    placeholder="Company"
                  />
                  <input
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-700/60"
                    value={item.duration}
                    onChange={(event) => updateList('experience', index, 'duration', event.target.value)}
                    placeholder="Duration"
                  />
                  <textarea
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-700/60"
                    value={item.details}
                    onChange={(event) => updateList('experience', index, 'details', event.target.value)}
                    placeholder="Achievements"
                  />
                </div>
              ))}
              <button
                onClick={() =>
                  addItem('experience', {
                    title: '',
                    company: '',
                    duration: '',
                    details: '',
                  })
                }
                className="text-xs px-3 py-2 rounded-lg border border-slate-700/60 hover:text-white"
              >
                Add Experience
              </button>
            </div>
          )}

          {activeTab === 'Education' && (
            <div className="space-y-4">
              {data.education.map((item, index) => (
                <div key={index} className="space-y-2 border border-slate-800/60 rounded-2xl p-4">
                  <input
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-700/60"
                    value={item.school}
                    onChange={(event) => updateList('education', index, 'school', event.target.value)}
                    placeholder="Institution"
                  />
                  <input
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-700/60"
                    value={item.degree}
                    onChange={(event) => updateList('education', index, 'degree', event.target.value)}
                    placeholder="Degree"
                  />
                  <input
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-700/60"
                    value={item.duration}
                    onChange={(event) => updateList('education', index, 'duration', event.target.value)}
                    placeholder="Duration"
                  />
                </div>
              ))}
              <button
                onClick={() => addItem('education', { school: '', degree: '', duration: '' })}
                className="text-xs px-3 py-2 rounded-lg border border-slate-700/60 hover:text-white"
              >
                Add Education
              </button>
            </div>
          )}

          {activeTab === 'Skills' && (
            <div className="space-y-4">
              <textarea
                className="w-full min-h-[120px] px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/60"
                value={data.skills}
                onChange={(event) => updateField('skills', event.target.value)}
              />
            </div>
          )}

          {activeTab === 'Projects' && (
            <div className="space-y-4">
              {data.projects.map((item, index) => (
                <div key={index} className="space-y-2 border border-slate-800/60 rounded-2xl p-4">
                  <input
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-700/60"
                    value={item.name}
                    onChange={(event) => updateList('projects', index, 'name', event.target.value)}
                    placeholder="Project Name"
                  />
                  <textarea
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-700/60"
                    value={item.details}
                    onChange={(event) => updateList('projects', index, 'details', event.target.value)}
                    placeholder="Project Highlights"
                  />
                </div>
              ))}
              <button
                onClick={() => addItem('projects', { name: '', details: '' })}
                className="text-xs px-3 py-2 rounded-lg border border-slate-700/60 hover:text-white"
              >
                Add Project
              </button>
            </div>
          )}
        </div>

        <div className="glass rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Live Preview</h2>
              <p className="text-sm text-slate-400">Professional resume template</p>
            </div>
            <button
              onClick={exportPDF}
              className="text-xs px-3 py-2 rounded-lg border border-slate-700/60 hover:text-white"
            >
              Export PDF
            </button>
          </div>
          {error && (
            <div className="text-sm text-rose-300 bg-rose-500/20 border border-rose-400/30 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
          <div ref={previewRef} className="bg-white text-slate-900 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-slate-200 flex items-center justify-center overflow-hidden">
                {photo ? (
                  <img src={photo} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-slate-500">Photo</span>
                )}
              </div>
              <div>
                <h3 className="text-2xl font-semibold">{previewName}</h3>
                <p className="text-sm text-slate-600">{data.role}</p>
                <p className="text-xs text-slate-500">
                  {data.email} | {data.phone} | {data.location}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Professional Summary
              </h4>
              <p className="text-sm text-slate-700 mt-2">{data.summary}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Experience
              </h4>
              <div className="space-y-3 mt-2">
                {data.experience.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <span className="text-xs text-slate-500">{item.duration}</span>
                    </div>
                    <p className="text-xs text-slate-600">{item.company}</p>
                    <p className="text-xs text-slate-600">{item.details}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Education
              </h4>
              <div className="space-y-2 mt-2">
                {data.education.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{item.school}</p>
                      <span className="text-xs text-slate-500">{item.duration}</span>
                    </div>
                    <p className="text-xs text-slate-600">{item.degree}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Skills
              </h4>
              <p className="text-xs text-slate-600 mt-2">{data.skills}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Projects
              </h4>
              <div className="space-y-2 mt-2">
                {data.projects.map((item, index) => (
                  <div key={index}>
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-slate-600">{item.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
