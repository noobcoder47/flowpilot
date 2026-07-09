'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Disbursement } from '@/lib/types'
import { fmt, formatShortDate } from '@/lib/utils'
import { Badge, Btn, Field, Drawer, Toast, Card, StatCard, EmptyState, C } from '@/components/ui'

interface Props { disbursements: Disbursement[]; businessId: string }
type Stage = 'form' | 'verifying' | 'verified'
const NETWORKS = ['MTN', 'Telecel', 'AT', 'Bank']

export function PayoutsClient({ disbursements, businessId }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [showDrawer, setShowDrawer] = useState(false)
  const [stage, setStage] = useState<Stage>('form')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [sending, setSending] = useState(false)
  const [verifiedName, setVerifiedName] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', network: 'MTN', amount: '' })

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type })

  const totalSent = disbursements.filter(d => d.status === 'sent')
    .reduce((s, d) => s + Number(d.amount), 0)

  const resetDrawer = () => {
    setShowDrawer(false)
    setStage('form')
    setVerifiedName('')
    setForm({ name: '', phone: '', network: 'MTN', amount: '' })
  }

  const handleVerify = async () => {
    if (!form.name || !form.phone) return showToast('Name and phone are required', 'error')
    setVerifying(true)
    try {
      const res = await fetch('/api/moolre/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone, network: form.network }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Verification failed')
      setVerifiedName(data.name || form.name.toUpperCase())
      setStage('verified')
    } catch (e: any) {
      showToast(e.message, 'error')
    }
    setVerifying(false)
  }

  const handleSend = async () => {
    if (!form.amount || Number(form.amount) <= 0) return showToast('Enter a valid amount', 'error')
    setSending(true)
    try {
      const res = await fetch('/api/moolre/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          recipient_name: verifiedName,
          phone: form.phone,
          network: form.network,
          amount: Number(form.amount),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Transfer failed')
      resetDrawer()
      showToast(`${fmt(Number(form.amount))} sent to ${verifiedName}`)
      startTransition(() => router.refresh())
    } catch (e: any) {
      showToast(e.message, 'error')
    }
    setSending(false)
  }

  return (
    <div className="fade-in">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 24, fontFamily: "var(--font-dm-serif-display),serif", color: C.forest, marginBottom: 4 }}>Payouts</div>
          <div style={{ fontSize: 13, color: C.sage, fontFamily: 'var(--font-inter),sans-serif' }}>Pay staff and suppliers instantly</div>
        </div>
        <Btn onClick={() => { setShowDrawer(true); setStage('form') }}>+ New Payout</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 22 }}>
        <StatCard label="Total Sent"   value={fmt(totalSent)} sub="All time" />
        <StatCard label="Transactions" value={String(disbursements.length)} sub="Completed payouts" mono={false} />
        <StatCard label="This Month"
          value={fmt(disbursements
            .filter(d => new Date(d.created_at).getMonth() === new Date().getMonth())
            .reduce((s, d) => s + Number(d.amount), 0))}
          sub="Current period" />
      </div>

      {disbursements.length === 0 ? (
        <Card><EmptyState title="No payouts yet" sub="Use New Payout to pay staff or suppliers" /></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {disbursements.map(d => (
            <div key={d.id} style={{ background: C.white, borderRadius: 15, padding: '20px 26px',
              boxShadow: '0 1px 5px rgba(0,0,0,0.05)', display: 'flex',
              alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: C.ivory,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, color: C.sage }}>↗</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.forest,
                    fontFamily: 'var(--font-inter),sans-serif', marginBottom: 3 }}>{d.recipient_name}</div>
                  <div style={{ fontSize: 12, color: C.sage, fontFamily: 'var(--font-inter),sans-serif' }}>
                    {d.phone} · {d.network} · {formatShortDate(d.created_at)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 600,
                  fontFamily: "var(--font-jetbrains-mono),monospace", color: C.red }}>
                  −{fmt(Number(d.amount))}
                </div>
                <Badge status={d.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Payout Drawer */}
      <Drawer open={showDrawer} onClose={resetDrawer} title="New Payout">
        <Field label="Recipient Name" type="text" placeholder="Full name"
          value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        <Field label="Phone / Account Number" type="tel" placeholder="e.g. 0244 123 456"
          value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
        <Field label="Amount (GHS)" type="number" placeholder="0.00"
          value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />

        {/* Network selector */}
        <div style={{ marginBottom: 26 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.sage, fontFamily: 'var(--font-inter),sans-serif',
            letterSpacing: '0.07em', display: 'block', marginBottom: 9, textTransform: 'uppercase' }}>Network</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {NETWORKS.map(n => (
              <button key={n} onClick={() => { setForm(p => ({ ...p, network: n })); setStage('form'); setVerifiedName('') }}
                style={{ flex: 1, padding: '10px 6px', borderRadius: 10, cursor: 'pointer',
                  border: form.network === n ? `2px solid ${C.gold}` : `1.5px solid ${C.border}`,
                  background: form.network === n ? `${C.gold}14` : 'transparent',
                  fontFamily: 'var(--font-inter),sans-serif', fontSize: 12,
                  color: form.network === n ? C.forest : C.sage,
                  fontWeight: form.network === n ? 700 : 400 }}>{n}</button>
            ))}
          </div>
        </div>

        {stage === 'form' && (
          <Btn loading={verifying} onClick={handleVerify} variant="outline"
            style={{ width: '100%', padding: '13px', justifyContent: 'center',
              border: `1.5px solid ${C.border}` }}>
            Verify Recipient Name →
          </Btn>
        )}

        {stage === 'verified' && (
          <>
            <div style={{ background: C.mint, border: '1.5px solid #BBF7D0', borderRadius: 12,
              padding: '15px 20px', marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: C.mintText, fontFamily: 'var(--font-inter),sans-serif',
                fontWeight: 700, letterSpacing: '0.06em', marginBottom: 5, textTransform: 'uppercase' }}>
                Verified Recipient
              </div>
              <div style={{ fontSize: 15, color: C.mintText, fontFamily: "var(--font-jetbrains-mono),monospace", fontWeight: 700 }}>
                {verifiedName} ✓
              </div>
            </div>
            <Btn loading={sending} onClick={handleSend} style={{ width: '100%', padding: '15px', justifyContent: 'center' }}>
              Confirm & Send {form.amount ? fmt(Number(form.amount)) : ''}
            </Btn>
            <Btn variant="outline" onClick={() => setStage('form')}
              style={{ width: '100%', padding: '11px', justifyContent: 'center', marginTop: 10 }}>
              ← Change Details
            </Btn>
          </>
        )}
      </Drawer>
    </div>
  )
}
