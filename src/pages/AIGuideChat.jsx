import { useEffect, useRef, useState } from 'react'
import { invokeLLM } from '../utils/invokeLLM'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'

export default function AIGuideChat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition()

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const sendMessage = async (text) => {
    const trimmed = text.trim()
    if (!trimmed || typing) return
    setError('')

    const nextMessages = [...messages, { role: 'user', text: trimmed }]
    setMessages(nextMessages)
    setInput('')
    setTyping(true)

    try {
      const response = await invokeLLM('chat', {
        text: trimmed,
        messages: nextMessages.map((item) => ({
          role: item.role,
          content: item.text,
        })),
      })

      const reply = response?.reply || 'AI is unavailable right now. Please try again later.'
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }])
    } catch (err) {
      const msg = err.message || 'AI is unavailable right now. Please try again later.'
      setError(msg)
      // keep user message only; do not echo predefined assistant content
      // if we want to keep minimal feedback we can show one in the system area
    } finally {
      setTyping(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 space-y-10">
      <header className="space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">AI Guide Chat</p>
        <h1 className="text-3xl md:text-4xl font-semibold">Talk to your career counselor.</h1>
        <p className="text-slate-300">
          Ask about roles, skill roadmaps, resumes, interviews, or higher studies. CareerX responds
          in real time.
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_0.35fr] gap-6">
        <div className="glass rounded-3xl p-6 flex flex-col h-[560px]">
          {error && (
            <div className="mb-4 text-sm text-rose-200 bg-rose-500/20 border border-rose-400/30 px-4 py-2 rounded-xl">
              {error}
            </div>
          )}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-white">Welcome to CareerX AI Guide</h2>
                  <p className="text-slate-300">Your personal career counselor is ready to help.</p>
                </div>
                <div className="space-y-4 max-w-md">
                  <div className="glass rounded-2xl p-4 space-y-2">
                    <h3 className="text-lg font-semibold">How to get started:</h3>
                    <ul className="text-sm text-slate-300 space-y-1 text-left">
                      <li>1. Tell me your current role or interests</li>
                      <li>2. Ask about career paths or skill roadmaps</li>
                      <li>3. Get help with resumes or interviews</li>
                    </ul>
                  </div>
                  <div className="text-xs text-slate-400">
                    Type your question below and press Enter or click Send.
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      message.role === 'assistant'
                        ? 'bg-slate-900/60 text-slate-100'
                        : 'bg-gradient-to-r from-indigo-500/70 to-cyan-500/70 text-white ml-auto'
                    }`}
                  >
                    {message.text}
                  </div>
                ))}
                {typing && (
                  <div className="max-w-[60%] rounded-2xl px-4 py-3 text-sm bg-slate-900/60 text-slate-100">
                    <span className="inline-flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse" />
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse" />
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse" />
                    </span>
                  </div>
                )}
                <div ref={endRef} />
              </>
            )}
          </div>

          <div className="border-t border-slate-800/60 pt-4 mt-4">
            <div className="flex items-center gap-3">
              <input
                className="flex-1 px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/60"
                placeholder="Type your message..."
                value={listening ? transcript : input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    sendMessage(listening ? transcript : input)
                  }
                }}
              />
              {browserSupportsSpeechRecognition && (
                <button
                  onClick={() => {
                    if (listening) {
                      SpeechRecognition.stopListening()
                      setInput(transcript)
                    } else {
                      resetTranscript()
                      SpeechRecognition.startListening()
                    }
                  }}
                  className={`px-4 py-3 rounded-xl border ${
                    listening
                      ? 'border-red-500 text-red-400'
                      : 'border-slate-700/60 text-slate-300 hover:text-white'
                  }`}
                  disabled={typing}
                >
                  {listening ? '🎤' : '🎙️'}
                </button>
              )}
              <button
                onClick={() => sendMessage(listening ? transcript : input)}
                className="gradient-bg px-4 py-3 rounded-xl font-semibold"
                disabled={typing}
              >
                {typing ? 'Sending...' : 'Send'}
              </button>
              <button
                onClick={() => setMessages([])}
                className="px-4 py-3 rounded-xl border border-slate-700/60 text-slate-300 hover:text-white"
                disabled={typing}
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-3xl p-6 space-y-3">
            <h3 className="text-lg font-semibold">Session Status</h3>
            <p className="text-sm text-slate-300">
              {typing ? 'AI counselor is typing...' : 'AI counselor is online and ready.'}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className={`h-2 w-2 rounded-full ${typing ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              {typing ? 'Responding' : 'Live'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
