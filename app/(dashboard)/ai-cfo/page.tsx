'use client'
import { useState, useEffect, useRef } from 'react'
import { Btn, Spinner, C } from '@/components/ui'

interface Message { role: 'user' | 'assistant'; text: string }

const SUGGESTED = [
  'Can I afford to pay my staff this week?',
  'Who owes me the most money?',
  'What is my revenue this month?',
  'Am I in a healthy cash flow position?',
  'Which invoices are overdue?',
  'What are my biggest expenses?',
]

export default function AICFOPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: "Hello. I'm your AI CFO. I have access to your live transaction data, invoices, and cash flow. Ask me anything about your business finances." }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const send = async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    const newMessages: Message[] = [...messages, { role: 'user', text: msg }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/ai/cfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'AI error')
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply }])
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', text: `Sorry, I ran into an issue: ${e.message}. Please try again.` }])
    }
    setLoading(false)
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 72px)' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 24, fontFamily: "'DM Serif Display',serif", color: C.forest, marginBottom: 4 }}>AI CFO</div>
        <div style={{ fontSize: 13, color: C.sage, fontFamily: 'Inter,sans-serif' }}>
          Your financial advisor, powered by live business data
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, background: 'white', borderRadius: 18, padding: 24,
        overflowY: 'auto', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', marginBottom: 14 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: 16, alignItems: 'flex-start' }}>
            {m.role === 'assistant' && (
              <div style={{ width: 33, height: 33, borderRadius: 9, background: C.forest, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 2 }}>
                <span style={{ color: C.gold, fontSize: 14, fontWeight: 700 }}>✦</span>
              </div>
            )}
            <div style={{ maxWidth: '72%', padding: '13px 17px',
              borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: m.role === 'user' ? C.forest : C.ivory,
              color: m.role === 'user' ? 'white' : C.forest,
              fontFamily: 'Inter,sans-serif', fontSize: 14, lineHeight: 1.7,
              whiteSpace: 'pre-wrap' }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ width: 33, height: 33, borderRadius: 9, background: C.forest, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: C.gold, fontSize: 14 }}>✦</span>
            </div>
            <div style={{ background: C.ivory, padding: '13px 18px', borderRadius: '18px 18px 18px 4px',
              fontFamily: 'Inter,sans-serif', fontSize: 14, color: C.sage,
              display: 'flex', alignItems: 'center', gap: 10 }}>
              <Spinner size={14} /> Analysing your financial data…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggested prompts - show when fresh */}
      {messages.length <= 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {SUGGESTED.map(s => (
            <button key={s} onClick={() => send(s)} style={{ padding: '8px 15px', borderRadius: 20,
              border: `1.5px solid ${C.border}`, background: 'white',
              fontFamily: 'Inter,sans-serif', fontSize: 12, color: C.forest,
              cursor: 'pointer', fontWeight: 500, transition: 'border-color 0.15s' }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div style={{ display: 'flex', gap: 10 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask your CFO anything about your finances…"
          style={{ flex: 1, padding: '14px 18px', borderRadius: 12,
            border: `1.5px solid ${C.border}`, fontFamily: 'Inter,sans-serif',
            fontSize: 14, color: C.forest, outline: 'none', background: 'white',
            transition: 'border-color 0.15s' }} />
        <Btn onClick={() => send()} disabled={loading || !input.trim()}
          style={{ padding: '14px 22px' }}>Send</Btn>
      </div>
    </div>
  )
}
