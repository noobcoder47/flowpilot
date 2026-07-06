import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ErrorState } from '@/components/ui'
import { PayoutsClient } from './client'

export const revalidate = 0

export default async function PayoutsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses').select('*').eq('user_id', user.id).single()
  if (!business) redirect('/login')

  const { data: disbursements, error } = await supabase
    .from('disbursements').select('*')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  if (error) return <ErrorState message="Failed to load payouts." />

  return <PayoutsClient disbursements={disbursements || []} businessId={business.id} />
}
