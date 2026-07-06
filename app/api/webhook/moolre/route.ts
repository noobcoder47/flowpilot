import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service role — webhook runs outside user session
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[Moolre Webhook]', JSON.stringify(body))

    const { status, externalref, transactionid, amount, type } = body

    // Moolre sends status: 'success' | 'failed' | 'pending'
    if (!externalref) {
      return NextResponse.json({ error: 'Missing externalref' }, { status: 400 })
    }

    if (status === 'success') {
      // Update matching invoice to paid
      const { data: invoice } = await adminSupabase
        .from('invoices')
        .update({ status: 'paid', moolre_transaction_id: transactionid })
        .eq('external_ref', externalref)
        .select('business_id, amount, customer_name')
        .single()

      if (invoice) {
        // Log incoming transaction
        await adminSupabase.from('transactions').upsert({
          business_id: invoice.business_id,
          type: 'in',
          amount: amount || invoice.amount,
          description: `Payment from ${invoice.customer_name}`,
          status: 'paid',
          moolre_ref: transactionid,
        }, { onConflict: 'moolre_ref', ignoreDuplicates: true })
      }
    } else if (status === 'failed') {
      await adminSupabase
        .from('invoices')
        .update({ status: 'pending' }) // revert, keep as pending
        .eq('external_ref', externalref)
    }

    return NextResponse.json({ received: true })
  } catch (e: any) {
    console.error('[Moolre Webhook Error]', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Moolre may send GET to verify endpoint
export async function GET() {
  return NextResponse.json({ status: 'FlowPilot webhook active' })
}
