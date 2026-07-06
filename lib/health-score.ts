import type { Invoice, Transaction, Disbursement, HealthScore } from './types'

export function calculateHealthScore(
  invoices: Invoice[],
  transactions: Transaction[],
  disbursements: Disbursement[]
): HealthScore {
  // Collection rate — 40 points
  const paidCount = invoices.filter(i => i.status === 'paid').length
  const totalInvoices = invoices.length || 1
  const collectionRate = Math.round((paidCount / totalInvoices) * 100)
  const collectionScore = (paidCount / totalInvoices) * 40

  // Cash flow — 40 points (revenue vs costs ratio)
  const revenue = transactions
    .filter(t => t.type === 'in' && (t.status === 'paid' || t.status === 'sent'))
    .reduce((s, t) => s + Number(t.amount), 0)
  const costs = disbursements
    .filter(d => d.status === 'sent')
    .reduce((s, d) => s + Number(d.amount), 0)
  const ratio = costs > 0 ? revenue / costs : 2
  const cashFlowScore = Math.min(40, ratio * 20)

  // Overdue penalty — 20 points
  const overdueCount = invoices.filter(i => i.status === 'overdue').length
  const overdueScore = Math.max(0, 20 - overdueCount * 5)

  const score = Math.min(100, Math.round(collectionScore + cashFlowScore + overdueScore))
  const label: HealthScore['label'] =
    score >= 70 ? 'Healthy' : score >= 40 ? 'Fair' : 'At Risk'

  return {
    score,
    label,
    collectionRate,
    netCashFlow: revenue - costs,
    overdueCount,
    revenue,
    costs,
  }
}
