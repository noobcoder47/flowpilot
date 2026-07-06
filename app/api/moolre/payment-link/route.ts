import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePaymentLink } from '@/lib/moolre'
import { generateRef } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { customer_name, customer_phone, description, amount, due_date, reusable, business_id } = await req.json()

    if (!customer_name || !amount) {
      return NextResponse.json({ error: 'Customer name and amount are required' }, { status: 400 })
    }

    const externalref = generateRef()
    const amountNum = Number(amount)

    // Generate Moolre payment link
    const moolreRes = await generatePaymentLink({
      amount: amountNum,
      externalref,
      reusable: reusable ? 1 : 0,
      expiration_time: due_date || undefined,
    })

    const paymentLink = moolreRes?.link || moolreRes?.url || moolreRes?.data?.link || null

    // Save invoice to Supabase
    const { data: invoice, error } = await supabase.from('invoices').insert({
      business_id,
      customer_name,
      customer_phone: customer_phone || '',
      description: description || '',
      amount: amountNum,
      status: 'pending',
      due_date: due_date || null,
      payment_link: paymentLink,
      external_ref: externalref,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ invoice, payment_link: paymentLink })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
