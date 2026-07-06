import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service role client — bypasses RLS for initial setup
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email, password, businessName, accountNumber } = await req.json()

    if (!email || !password || !businessName || !accountNumber) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Create auth user
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // skip email confirmation for competition demo
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Create business record
    const { error: bizError } = await adminSupabase.from('businesses').insert({
      user_id: authData.user.id,
      name: businessName,
      moolre_account_number: accountNumber,
    })

    if (bizError) {
      // Rollback: delete the auth user if business creation fails
      await adminSupabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: 'Failed to create business: ' + bizError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
