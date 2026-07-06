export const fmt = (n: number) =>
  `GHS ${Number(n).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`

export const generateRef = () =>
  `FP-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`

export const getDaysAgo = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })

export const formatShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })
