import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('name')
    .eq('user_id', user.id)
    .single()

  if (!business) redirect('/login')

  return (
    <div style={{ display: 'flex', background: 'var(--ivory)', minHeight: '100vh' }}>
      <Sidebar businessName={business.name} />
      <main style={{ marginLeft: 230, flex: 1, padding: '36px 40px',
        minHeight: '100vh', boxSizing: 'border-box' }}>
        {children}
      </main>
    </div>
  )
}
