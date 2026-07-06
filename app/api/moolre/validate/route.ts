import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateName, networkChannels } from '@/lib/moolre'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { phone, network } = await req.json()
    if (!phone) return NextResponse.json({ error: 'Phone number required' }, { status: 400 })

    const channel = networkChannels[network] || 13
    const result = await validateName({ channel, account: phone })

    // Moolre returns the account name in result.name or result.data.name
    const name = result?.name || result?.data?.name || result?.accountname || null
    if (!name) return NextResponse.json({ error: 'Could not verify recipient' }, { status: 400 })

    return NextResponse.json({ name })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
