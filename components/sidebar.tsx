'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { C } from './ui'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: '▣' },
  { href: '/invoices', label: 'Invoices', icon: '◫' },
  { href: '/payments', label: 'Payments', icon: '⊕' },
  { href: '/payouts', label: 'Payouts', icon: '↗' },
  { href: '/ai-cfo', label: 'AI CFO', icon: '✦' },
]

export function Sidebar({ businessName }: { businessName: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{
      width: 230, minHeight: '100vh', background: C.forest, display: 'flex',
      flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0
    }}>
      {/* Logo */}
      <div style={{ padding: '26px 22px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 33, height: 33, background: C.gold, borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{
              color: C.forest, fontWeight: 800, fontSize: 17,
              fontFamily: "var(--font-dm-serif-display),serif"
            }}>F</span>
          </div>
          <span style={{
            color: C.white, fontFamily: "var(--font-dm-serif-display),serif",
            fontSize: 20, letterSpacing: '-0.01em'
          }}>FlowPilot</span>
        </div>
      </div>

      {/* Business name */}
      <div style={{ padding: '14px 22px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{
          fontSize: 10, color: C.sage, fontFamily: 'var(--font-inter),sans-serif', marginBottom: 3,
          letterSpacing: '0.08em', fontWeight: 600, textTransform: 'uppercase'
        }}>Business</div>
        <div style={{
          fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-inter),sans-serif',
          fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          {businessName}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '14px 0' }}>
        {nav.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 11, width: '100%',
                padding: '11px 22px', background: active ? 'rgba(212,168,67,0.09)' : 'transparent',
                borderLeft: active ? `3px solid ${C.gold}` : '3px solid transparent',
                transition: 'all 0.12s ease', cursor: 'pointer'
              }}>
                <span style={{
                  fontSize: 15, width: 18, color: active ? C.gold : C.sage,
                  textAlign: 'center'
                }}>{item.icon}</span>
                <span style={{
                  fontFamily: 'var(--font-inter),sans-serif', fontSize: 13.5,
                  fontWeight: active ? 600 : 400, color: active ? C.white : C.sage
                }}>{item.label}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={handleLogout} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: C.sage, fontFamily: 'var(--font-inter),sans-serif', fontSize: 12, fontWeight: 500
        }}>
          Sign out →
        </button>
      </div>
    </div>
  )
}
