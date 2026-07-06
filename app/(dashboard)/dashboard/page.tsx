import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { calculateHealthScore } from '@/lib/health-score'
import { getDaysAgo, fmt, formatShortDate } from '@/lib/utils'
import { Card, HealthRing, Badge, StatCard, ErrorState, EmptyState } from '@/components/ui'
import { C } from '@/lib/tokens'

export const revalidate = 0

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses').select('*').eq('user_id', user.id).single()
  if (!business) redirect('/login')

  const thirtyDaysAgo = getDaysAgo(30)

  const [invoicesRes, txRes, disbRes] = await Promise.all([
    supabase.from('invoices').select('*').eq('business_id', business.id)
      .gte('created_at', thirtyDaysAgo).order('created_at', { ascending: false }),
    supabase.from('transactions').select('*').eq('business_id', business.id)
      .gte('created_at', thirtyDaysAgo).order('created_at', { ascending: false }),
    supabase.from('disbursements').select('*').eq('business_id', business.id)
      .gte('created_at', thirtyDaysAgo).order('created_at', { ascending: false }),
  ])

  const invoices = invoicesRes.data || []
  const transactions = txRes.data || []
  const disbursements = disbRes.data || []

  const health = calculateHealthScore(invoices, transactions, disbursements)
  const scoreColor = health.score >= 70 ? C.green : health.score >= 40 ? C.gold : C.red

  const revenue = transactions.filter(t => t.type === 'in' && t.status === 'paid')
    .reduce((s, t) => s + Number(t.amount), 0)
  const pendingAmount = invoices.filter(i => i.status === 'pending')
    .reduce((s, i) => s + Number(i.amount), 0)
  const paidCount = invoices.filter(i => i.status === 'paid').length
  const payoutsTotal = disbursements.filter(d => d.status === 'sent')
    .reduce((s, d) => s + Number(d.amount), 0)

  const recentTx = [...transactions, ...disbursements]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 24, fontFamily: "'DM Serif Display',serif", color: C.forest, marginBottom: 4 }}>
          Welcome back 👋
        </div>
        <div style={{ fontSize: 13, color: C.sage, fontFamily: 'Inter,sans-serif' }}>
          {business.name} · Last 30 days
        </div>
      </div>

      {/* Health Ring + Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 18, marginBottom: 22 }}>
        <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '26px 30px', minWidth: 210 }}>
          <HealthRing score={health.score} />
          <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6,
            background: `${scoreColor}18`, padding: '4px 15px', borderRadius: 20 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: scoreColor }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor, fontFamily: 'Inter,sans-serif' }}>
              {health.label}
            </span>
          </div>
          <div style={{ marginTop: 18, display: 'flex', gap: 22 }}>
            {[
              { label: 'Collection', val: `${health.collectionRate}%` },
              { label: 'Cash Flow',  val: health.netCashFlow >= 0 ? '↑' : '↓' },
              { label: 'Overdue',    val: String(health.overdueCount) },
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.forest,
                  fontFamily: "'JetBrains Mono',monospace" }}>{m.val}</div>
                <div style={{ fontSize: 10, color: C.sage, fontFamily: 'Inter,sans-serif',
                  letterSpacing: '0.04em', marginTop: 2 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <StatCard label="Revenue (30d)"    value={fmt(revenue)}       sub="Collected payments" />
          <StatCard label="Pending Invoices" value={fmt(pendingAmount)} sub={`${invoices.filter(i=>i.status==='pending').length} invoices open`} />
          <StatCard label="Collection Rate"  value={`${health.collectionRate}%`} sub={`${paidCount} of ${invoices.length} paid`} mono={false} />
          <StatCard label="Payouts Sent"     value={fmt(payoutsTotal)}  sub="This period" />
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.forest, fontFamily: 'Inter,sans-serif' }}>
            Recent Activity
          </div>
        </div>
        {recentTx.length === 0 ? (
          <EmptyState title="No transactions yet" sub="Create your first invoice to get started" />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Description', 'Amount', 'Status', 'Date'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0 0 11px', fontSize: 11,
                    color: C.sage, fontFamily: 'Inter,sans-serif', fontWeight: 600,
                    letterSpacing: '0.07em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentTx.map((item: any, i) => {
                const isIn = item.type === 'in' || item.customer_name
                const amount = Number(item.amount)
                const desc = item.description || item.customer_name || item.recipient_name || '—'
                const status = item.status
                return (
                  <tr key={item.id} style={{ borderBottom: i < recentTx.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <td style={{ padding: '13px 0', fontSize: 14, color: C.forest,
                      fontFamily: 'Inter,sans-serif', fontWeight: 500, maxWidth: 220,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{desc}</td>
                    <td style={{ padding: '13px 0', fontSize: 14, fontFamily: "'JetBrains Mono',monospace",
                      fontWeight: 600, color: isIn ? C.green : C.red }}>
                      {isIn ? '+' : '−'}{fmt(amount)}
                    </td>
                    <td style={{ padding: '13px 0' }}><Badge status={status} /></td>
                    <td style={{ padding: '13px 0', fontSize: 13, color: C.sage,
                      fontFamily: 'Inter,sans-serif' }}>{formatShortDate(item.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
