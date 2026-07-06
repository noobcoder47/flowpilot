'use client'
import React from 'react'

// ── Design tokens (imported for local use, re-exported for consumers) ──────
import { C } from '@/lib/tokens'
export { C }

// ── Health Score Ring ──────────────────────────────────────────────────────
export function HealthRing({ score }: { score: number }) {
  const r = 70, cx = 88, cy = 88
  const circ = 2 * Math.PI * r
  const track = circ * 0.75
  const val = track * (score / 100)
  const color = score >= 70 ? C.green : score >= 40 ? C.gold : C.red
  return (
    <svg width="176" height="176" viewBox="0 0 176 176">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth="13"
        strokeDasharray={`${track} ${circ - track}`} strokeLinecap="round"
        transform={`rotate(135,${cx},${cy})`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="13"
        strokeDasharray={`${val} ${circ - val}`} strokeLinecap="round"
        transform={`rotate(135,${cx},${cy})`}
        style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)' }} />
      <text x={cx} y={cy - 8} textAnchor="middle" fill={C.forest}
        style={{ fontFamily: "'DM Serif Display',serif", fontSize: '44px' }}>{score}</text>
      <text x={cx} y={cy + 20} textAnchor="middle" fill={C.sage}
        style={{ fontFamily: 'Inter,sans-serif', fontSize: '10px', letterSpacing: '0.1em', fontWeight: 600 }}>HEALTH</text>
    </svg>
  )
}

// ── Status Badge ───────────────────────────────────────────────────────────
export function Badge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    paid: { bg: C.mint, color: C.mintText, label: 'Paid' },
    pending: { bg: C.amber, color: C.amberText, label: 'Pending' },
    overdue: { bg: C.softRed, color: C.redText, label: 'Overdue' },
    sent: { bg: C.mint, color: C.mintText, label: 'Sent' },
    failed: { bg: C.softRed, color: C.redText, label: 'Failed' },
  }
  const s = map[status] || map.pending
  return (
    <span style={{
      background: s.bg, color: s.color, fontSize: 11, fontWeight: 700,
      padding: '3px 11px', borderRadius: 20, fontFamily: 'Inter,sans-serif',
      letterSpacing: '0.04em', whiteSpace: 'nowrap'
    }}>{s.label}</span>
  )
}

// ── Gold Button ────────────────────────────────────────────────────────────
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'outline' | 'ghost'
  loading?: boolean
}
export function Btn({ children, variant = 'gold', loading, disabled, style, ...rest }: BtnProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '11px 20px', borderRadius: 10, fontFamily: 'Inter,sans-serif',
    fontWeight: 600, fontSize: 14, cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'opacity 0.15s', opacity: disabled || loading ? 0.6 : 1, border: 'none',
  }
  const variants: Record<string, React.CSSProperties> = {
    gold: { background: C.gold, color: C.forest },
    outline: { background: 'transparent', color: C.forest, border: `1.5px solid ${C.border}` },
    ghost: { background: 'transparent', color: C.gold, border: `1.5px solid ${C.gold}` },
  }
  return (
    <button disabled={disabled || loading} style={{ ...base, ...variants[variant], ...style }} {...rest}>
      {loading ? <span className="spin" style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid currentColor`, borderTopColor: 'transparent', display: 'inline-block' }} /> : null}
      {children}
    </button>
  )
}

// ── Form Field ─────────────────────────────────────────────────────────────
interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> { label: string }
export function Field({ label, ...props }: FieldProps) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        fontSize: 11, fontWeight: 700, color: C.sage, fontFamily: 'Inter,sans-serif',
        letterSpacing: '0.07em', display: 'block', marginBottom: 7, textTransform: 'uppercase'
      }}>{label}</label>
      <input {...props} style={{
        width: '100%', padding: '12px 15px', borderRadius: 10,
        border: `1.5px solid ${C.border}`, fontFamily: 'Inter,sans-serif', fontSize: 14,
        color: C.forest, background: C.ivory, boxSizing: 'border-box', transition: 'border-color 0.15s', ...props.style
      }} />
    </div>
  )
}

// ── Card ───────────────────────────────────────────────────────────────────
export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: C.white, borderRadius: 16, padding: '24px 28px',
      boxShadow: '0 1px 6px rgba(0,0,0,0.06)', ...style
    }}>{children}</div>
  )
}

// ── Loading Spinner ────────────────────────────────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div className="spin" style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid ${C.border}`, borderTopColor: C.gold, display: 'inline-block'
    }} />
  )
}

// ── Page Loading ───────────────────────────────────────────────────────────
export function PageLoading() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '60vh', gap: 12, color: C.sage, fontFamily: 'Inter,sans-serif', fontSize: 14
    }}>
      <Spinner /> Loading…
    </div>
  )
}

// ── Error State ────────────────────────────────────────────────────────────
export function ErrorState({ message }: { message: string }) {
  return (
    <div style={{
      background: '#FDECEA', border: `1px solid #FECACA`, borderRadius: 12,
      padding: '16px 20px', color: '#991B1B', fontFamily: 'Inter,sans-serif', fontSize: 14
    }}>
      ⚠ {message}
    </div>
  )
}

// ── Empty State ────────────────────────────────────────────────────────────
export function EmptyState({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{
      textAlign: 'center', padding: '60px 0', color: C.sage,
      fontFamily: 'Inter,sans-serif'
    }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>○</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: C.forest, marginBottom: 6 }}>{title}</div>
      {sub && <div style={{ fontSize: 13 }}>{sub}</div>}
    </div>
  )
}

// ── Toast ──────────────────────────────────────────────────────────────────
export function Toast({ message, type = 'success', onClose }: { message: string; type?: 'success' | 'error'; onClose: () => void }) {
  React.useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div className="fade-in" style={{
      position: 'fixed', top: 24, right: 24, zIndex: 200,
      background: type === 'error' ? C.redText : C.forest, color: C.white,
      padding: '13px 22px', borderRadius: 12, fontFamily: 'Inter,sans-serif',
      fontSize: 14, fontWeight: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      display: 'flex', alignItems: 'center', gap: 10, maxWidth: 360
    }}>
      <span>{type === 'success' ? '✓' : '✕'}</span>
      <span>{message}</span>
      <button onClick={onClose} style={{
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
        cursor: 'pointer', fontSize: 16, marginLeft: 8
      }}>✕</button>
    </div>
  )
}

// ── Drawer ─────────────────────────────────────────────────────────────────
export function Drawer({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex' }}>
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(10,33,24,0.5)' }} />
      <div className="slide-in" style={{
        width: 440, background: C.white, height: '100vh',
        overflowY: 'auto', padding: 32, boxShadow: '-6px 0 32px rgba(0,0,0,0.14)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 21, fontFamily: "'DM Serif Display',serif", color: C.forest }}>{title}</div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none',
            fontSize: 20, color: C.sage, cursor: 'pointer', lineHeight: 1
          }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Stat Card ──────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, mono = true }: {
  label: string; value: string | number; sub?: string; mono?: boolean
}) {
  return (
    <Card>
      <div style={{
        fontSize: 11, color: C.sage, fontFamily: 'Inter,sans-serif',
        fontWeight: 600, letterSpacing: '0.06em', marginBottom: 10, textTransform: 'uppercase'
      }}>{label}</div>
      <div style={{
        fontSize: 22, fontWeight: 600, color: C.forest, marginBottom: 5,
        fontFamily: mono ? "'JetBrains Mono',monospace" : "'DM Serif Display',serif"
      }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.sage, fontFamily: 'Inter,sans-serif' }}>{sub}</div>}
    </Card>
  )
}
