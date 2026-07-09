'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Invoice } from '@/lib/types'
import { fmt, formatShortDate } from '@/lib/utils'
import { Badge, Btn, Field, Drawer, Toast, Card, EmptyState, C } from '@/components/ui'

interface Props { invoices: Invoice[]; businessId: string }

const tabs = ['all', 'pending', 'paid', 'overdue'] as const

export function InvoicesClient({ invoices, businessId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState<(typeof tabs)[number]>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [loading, setLoading] = useState(false)
  const [remindingId, setRemindingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', description: '', amount: '', due_date: '', reusable: false
  })

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter)
  const count = (s: string) => invoices.filter(i => i.status === s).length

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type })

  const handleCreate = async () => {
    if (!form.customer_name || !form.amount) return showToast('Customer name and amount are required', 'error')
    setLoading(true)
    try {
      const res = await fetch('/api/moolre/payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, business_id: businessId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create invoice')
      setShowCreate(false)
      setForm({ customer_name: '', customer_phone: '', description: '', amount: '', due_date: '', reusable: false })
      showToast('Invoice created — payment link ready!')
      startTransition(() => router.refresh())
    } catch (e: any) {
      showToast(e.message, 'error')
    }
    setLoading(false)
  }

  const handleRemind = async (inv: Invoice) => {
    if (!inv.customer_phone) return showToast('No phone number for this customer', 'error')
    if (remindingId) return
    if (!window.confirm(`Send a payment reminder SMS to ${inv.customer_name} (${inv.customer_phone})?`)) return
    setRemindingId(inv.id)
    try {
      const res = await fetch('/api/moolre/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: inv.customer_phone,
          message: `Hi ${inv.customer_name}, your invoice of ${fmt(inv.amount)} is due${inv.due_date ? ` on ${inv.due_date}` : ''}. Pay here: ${inv.payment_link || 'Contact us to pay'}. — ${''}`
        }),
      })
      if (!res.ok) throw new Error('SMS failed')
      showToast(`Reminder sent to ${inv.customer_name}`)
    } catch (e: any) {
      showToast(e.message, 'error')
    } finally {
      setRemindingId(null)
    }
  }

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link).then(() => showToast('Payment link copied!'))
  }

  return (
    <div className="fade-in">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 26 }}>
        <div>
          <div style={{ fontSize: 24, fontFamily: "'DM Serif Display',serif", color: C.forest, marginBottom: 4 }}>Invoices</div>
          <div style={{ fontSize: 13, color: C.sage, fontFamily: 'Inter,sans-serif' }}>Track and collect customer payments</div>
        </div>
        <Btn onClick={() => setShowCreate(true)}>+ Create Invoice</Btn>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'white',
        padding: 5, borderRadius: 12, width: 'fit-content', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{ padding: '8px 18px', borderRadius: 9,
            border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontSize: 13,
            fontWeight: filter === t ? 600 : 400,
            background: filter === t ? C.forest : 'transparent',
            color: filter === t ? C.white : C.sage, transition: 'all 0.12s ease' }}>
            {t === 'all' ? `All (${invoices.length})` : `${t.charAt(0).toUpperCase()+t.slice(1)} (${count(t)})`}
          </button>
        ))}
      </div>

      {/* Invoice List */}
      {filtered.length === 0 ? (
        <Card><EmptyState title="No invoices here" sub="Create your first invoice to get started" /></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(inv => (
            <div key={inv.id} style={{ background: C.white, borderRadius: 15, padding: '18px 24px',
              boxShadow: '0 1px 5px rgba(0,0,0,0.05)', display: 'flex',
              alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: C.ivory,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 700, color: C.forest, fontFamily: "'DM Serif Display',serif" }}>
                  {inv.customer_name[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.forest, fontFamily: 'Inter,sans-serif', marginBottom: 2 }}>
                    {inv.customer_name}
                  </div>
                  <div style={{ fontSize: 12, color: C.sage, fontFamily: 'Inter,sans-serif' }}>
                    {inv.description || '—'} · {inv.due_date ? `Due ${formatShortDate(inv.due_date)}` : 'No due date'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", color: C.forest }}>
                  {fmt(inv.amount)}
                </div>
                <Badge status={inv.status} />
                {inv.status !== 'paid' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Btn variant="outline" loading={remindingId === inv.id} disabled={remindingId !== null}
                      onClick={() => handleRemind(inv)}
                      style={{ padding: '6px 13px', fontSize: 12 }}>Remind</Btn>
                    {inv.payment_link && (
                      <Btn variant="ghost" onClick={() => handleCopyLink(inv.payment_link!)}
                        style={{ padding: '6px 13px', fontSize: 12 }}>Copy Link</Btn>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Invoice Drawer */}
      <Drawer open={showCreate} onClose={() => setShowCreate(false)} title="New Invoice">
        <Field label="Customer Name" type="text" placeholder="e.g. Kofi Mensah"
          value={form.customer_name} onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))} />
        <Field label="Phone Number" type="tel" placeholder="e.g. 0244 123 456"
          value={form.customer_phone} onChange={e => setForm(p => ({ ...p, customer_phone: e.target.value }))} />
        <Field label="Description" type="text" placeholder="What is this invoice for?"
          value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        <Field label="Amount (GHS)" type="number" placeholder="0.00"
          value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
        <Field label="Due Date" type="date"
          value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
        <div style={{ marginBottom: 26 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.sage, fontFamily: 'Inter,sans-serif',
            letterSpacing: '0.07em', display: 'block', marginBottom: 9, textTransform: 'uppercase' }}>Payment Link</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {[{ label: 'One-time', val: false }, { label: 'Reusable', val: true }].map(opt => (
              <button key={String(opt.val)} onClick={() => setForm(p => ({ ...p, reusable: opt.val }))} style={{
                flex: 1, padding: '11px', borderRadius: 11, cursor: 'pointer',
                border: form.reusable === opt.val ? `2px solid ${C.gold}` : `1.5px solid ${C.border}`,
                background: form.reusable === opt.val ? `${C.gold}14` : 'transparent',
                fontFamily: 'Inter,sans-serif', fontSize: 13,
                color: form.reusable === opt.val ? C.forest : C.sage,
                fontWeight: form.reusable === opt.val ? 700 : 400
              }}>{opt.label}</button>
            ))}
          </div>
        </div>
        <Btn loading={loading} onClick={handleCreate} style={{ width: '100%', padding: '15px', justifyContent: 'center' }}>
          Generate Invoice & Payment Link
        </Btn>
      </Drawer>
    </div>
  )
}
