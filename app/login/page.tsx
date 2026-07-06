'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Btn, Field, C } from '@/components/ui'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    email: '', password: '', businessName: '', accountNumber: ''
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const handleLogin = async () => {
    setError(''); setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email, password: form.password
    })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  const handleRegister = async () => {
    if (!form.businessName || !form.accountNumber)
      return setError('Business name and Moolre account number are required')
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')

      // Sign in after registering
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email, password: form.password
      })
      if (error) throw error
      router.push('/dashboard')
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter,sans-serif' }}>
      {/* Left panel */}
      <div style={{ width: '44%', background: C.forest, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '60px 62px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 90 }}>
          <div style={{ width: 36, height: 36, background: C.gold, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: C.forest, fontWeight: 800, fontSize: 19,
              fontFamily: "'DM Serif Display',serif" }}>F</span>
          </div>
          <span style={{ color: 'white', fontFamily: "'DM Serif Display',serif", fontSize: 22 }}>FlowPilot</span>
        </div>
        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 40, color: 'white',
          lineHeight: 1.22, fontStyle: 'italic', marginBottom: 24 }}>
          "Your business finances. Finally under control."
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.42)', lineHeight: 1.75 }}>
          AI-powered cash flow, invoicing, and payments for small businesses across Ghana.
        </div>
        <div style={{ position: 'absolute', bottom: -70, right: -70, width: 240, height: 240,
          borderRadius: '50%', border: '1px solid rgba(212,168,67,0.18)' }} />
        <div style={{ position: 'absolute', bottom: -36, right: -36, width: 150, height: 150,
          borderRadius: '50%', border: '1px solid rgba(212,168,67,0.10)' }} />
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: C.ivory, padding: 60 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          {/* Tab toggle */}
          <div style={{ display: 'flex', background: 'white', padding: 4, borderRadius: 12,
            marginBottom: 32, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }} style={{
                flex: 1, padding: '10px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: mode === m ? 600 : 400,
                background: mode === m ? C.forest : 'transparent',
                color: mode === m ? 'white' : C.sage, transition: 'all 0.12s ease' }}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 28, fontFamily: "'DM Serif Display',serif", color: C.forest, marginBottom: 7 }}>
            {mode === 'login' ? 'Welcome back' : 'Get started'}
          </div>
          <div style={{ fontSize: 14, color: C.sage, marginBottom: 28 }}>
            {mode === 'login' ? 'Sign in to your FlowPilot account.' : 'Create your account and connect Moolre.'}
          </div>

          {error && (
            <div style={{ background: C.softRed, border: `1px solid #FECACA`, borderRadius: 10,
              padding: '12px 16px', color: C.redText, fontFamily: 'Inter,sans-serif',
              fontSize: 13, marginBottom: 20 }}>⚠ {error}</div>
          )}

          <Field label="Email" type="email" placeholder="you@business.com"
            value={form.email} onChange={set('email')} />
          <Field label="Password" type="password" placeholder="••••••••"
            value={form.password} onChange={set('password')} />

          {mode === 'register' && (
            <>
              <Field label="Business Name" type="text" placeholder="e.g. Ama's Fashion Store"
                value={form.businessName} onChange={set('businessName')} />
              <Field label="Moolre Account Number" type="text" placeholder="Your Moolre account number"
                value={form.accountNumber} onChange={set('accountNumber')} />
            </>
          )}

          <Btn loading={loading}
            onClick={mode === 'login' ? handleLogin : handleRegister}
            style={{ width: '100%', padding: '15px', justifyContent: 'center', marginBottom: 20, marginTop: 8 }}>
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </Btn>

          <div style={{ textAlign: 'center', fontSize: 13, color: C.sage }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <span onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
              style={{ color: C.gold, cursor: 'pointer', fontWeight: 700 }}>
              {mode === 'login' ? 'Create one →' : 'Sign in →'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
