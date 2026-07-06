import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { initiatePayment, networkChannels } from '@/lib/moolre'
import { generateRef } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { payer, amount, network, invoice_id } = await req.json()
    if (!payer || !amount) return NextResponse.json({ error: 'Payer and amount required' }, { status: 400 })

    const externalref = generateRef()
    const channel = networkChannels[network] || 13

    const result = await initiatePayment({ channel, payer, amount: Number(amount), externalref })

    if (invoice_id) {
      await supabase.from('invoices').update({ external_ref: externalref }).eq('id', invoice_id)
    }

    return NextResponse.json({ success: true, externalref, data: result })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
