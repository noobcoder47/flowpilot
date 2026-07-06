import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fmt, formatShortDate } from '@/lib/utils'
import { Badge, EmptyState, ErrorState } from '@/components/ui'
import { InvoicesClient } from './client'
import { C } from '@/lib/tokens'

export const revalidate = 0

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses').select('*').eq('user_id', user.id).single()
  if (!business) redirect('/login')

  const { data: invoices, error } = await supabase
    .from('invoices').select('*').eq('business_id', business.id)
    .order('created_at', { ascending: false })

  if (error) return <ErrorState message="Failed to load invoices. Please refresh." />

  return <InvoicesClient invoices={invoices || []} businessId={business.id} />
}
