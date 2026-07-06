import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/moolre'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { phone, message } = await req.json()
    if (!phone || !message) return NextResponse.json({ error: 'Phone and message required' }, { status: 400 })

    const sender = process.env.MOOLRE_SMS_SENDER_ID || 'FlowPilot'
    const result = await sendSMS({
      sender,
      messages: [{ to: phone, message }],
    })

    return NextResponse.json({ success: true, data: result })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
