import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { initiateTransfer, networkChannels } from '@/lib/moolre'
import { generateRef } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { business_id, recipient_name, phone, network, amount } = await req.json()
    if (!phone || !amount || !business_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const externalref = generateRef()
    const channel = networkChannels[network] || 13
    const amountNum = Number(amount)

    // Save disbursement as pending first
    const { data: disb, error: dbError } = await supabase.from('disbursements').insert({
      business_id,
      recipient_name,
      phone,
      network,
      amount: amountNum,
      status: 'pending',
      external_ref: externalref,
    }).select().single()

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

    // Initiate Moolre transfer
    const result = await initiateTransfer({ channel, receiver: phone, amount: amountNum, externalref })

    const moolreRef = result?.transactionid || result?.data?.transactionid || null

    // Update to sent
    await supabase.from('disbursements').update({
      status: 'sent',
      moolre_ref: moolreRef,
    }).eq('id', disb.id)

    // Also log as outgoing transaction
    await supabase.from('transactions').insert({
      business_id,
      type: 'out',
      amount: amountNum,
      description: `Payout to ${recipient_name}`,
      status: 'sent',
      moolre_ref: moolreRef,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (e: any) {
    // Mark disbursement as failed if we can find it
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
