import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fmt, formatShortDate } from '@/lib/utils'
import { Badge, Card, StatCard, EmptyState, ErrorState } from '@/components/ui'
import { C } from '@/lib/tokens'

export const revalidate = 0

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses').select('*').eq('user_id', user.id).single()
  if (!business) redirect('/login')

  const { data: transactions, error } = await supabase
    .from('transactions').select('*')
    .eq('business_id', business.id)
    .eq('type', 'in')
    .order('created_at', { ascending: false })

  if (error) return <ErrorState message="Failed to load payments." />

  const txs = transactions || []
  const totalCollected = txs.filter(t => t.status === 'paid').reduce((s, t) => s + Number(t.amount), 0)
  const totalPending   = txs.filter(t => t.status === 'pending').reduce((s, t) => s + Number(t.amount), 0)

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 24, fontFamily: "var(--font-dm-serif-display),serif", color: C.forest, marginBottom: 4 }}>Payments</div>
        <div style={{ fontSize: 13, color: C.sage, fontFamily: 'var(--font-inter),sans-serif' }}>All incoming payments to your account</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 22 }}>
        <StatCard label="Total Collected" value={fmt(totalCollected)} sub="Confirmed payments" />
        <StatCard label="Pending"         value={fmt(totalPending)}   sub="Awaiting confirmation" />
        <StatCard label="Transactions"    value={String(txs.length)}  sub="This account" mono={false} />
      </div>

      <Card>
        {txs.length === 0 ? (
          <EmptyState title="No payments yet" sub="Payments will appear here as customers pay invoices" />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Customer / Description', 'Amount', 'Reference', 'Status', 'Date'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0 0 12px', fontSize: 11,
                    color: C.sage, fontFamily: 'var(--font-inter),sans-serif', fontWeight: 600,
                    letterSpacing: '0.07em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txs.map((tx, i) => (
                <tr key={tx.id} style={{ borderBottom: i < txs.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <td style={{ padding: '14px 0', fontSize: 14, color: C.forest,
                    fontFamily: 'var(--font-inter),sans-serif', fontWeight: 500 }}>{tx.description || '—'}</td>
                  <td style={{ padding: '14px 0', fontSize: 14, fontFamily: "var(--font-jetbrains-mono),monospace",
                    color: C.green, fontWeight: 600 }}>+{fmt(Number(tx.amount))}</td>
                  <td style={{ padding: '14px 0', fontSize: 11, color: C.sage,
                    fontFamily: "var(--font-jetbrains-mono),monospace" }}>{tx.moolre_ref || '—'}</td>
                  <td style={{ padding: '14px 0' }}><Badge status={tx.status} /></td>
                  <td style={{ padding: '14px 0', fontSize: 13, color: C.sage,
                    fontFamily: 'var(--font-inter),sans-serif' }}>{formatShortDate(tx.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
