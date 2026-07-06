import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { calculateHealthScore } from '@/lib/health-score'
import { getDaysAgo, fmt } from '@/lib/utils'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { messages } = await req.json()
    if (!messages?.length) return NextResponse.json({ error: 'No messages' }, { status: 400 })

    // Fetch business
    const { data: business } = await supabase
      .from('businesses').select('*').eq('user_id', user.id).single()
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    const thirtyDaysAgo = getDaysAgo(30)

    // Fetch live financial data
    const [invoicesRes, txRes, disbRes] = await Promise.all([
      supabase.from('invoices').select('*').eq('business_id', business.id)
        .gte('created_at', thirtyDaysAgo),
      supabase.from('transactions').select('*').eq('business_id', business.id)
        .gte('created_at', thirtyDaysAgo),
      supabase.from('disbursements').select('*').eq('business_id', business.id)
        .gte('created_at', thirtyDaysAgo),
    ])

    const invoices = invoicesRes.data || []
    const transactions = txRes.data || []
    const disbursements = disbRes.data || []
    const health = calculateHealthScore(invoices, transactions, disbursements)

    // Build rich context string
    const revenue = transactions.filter(t => t.type === 'in' && t.status === 'paid')
      .reduce((s: number, t: any) => s + Number(t.amount), 0)
    const costs = disbursements.filter((d: any) => d.status === 'sent')
      .reduce((s: number, d: any) => s + Number(d.amount), 0)
    const overdueInvoices = invoices.filter((i: any) => i.status === 'overdue')
    const pendingInvoices = invoices.filter((i: any) => i.status === 'pending')

    const context = `
BUSINESS: ${business.name}
PERIOD: Last 30 days
HEALTH SCORE: ${health.score}/100 (${health.label})
REVENUE COLLECTED: ${fmt(revenue)}
TOTAL COSTS/PAYOUTS: ${fmt(costs)}
NET CASH FLOW: ${fmt(revenue - costs)}
ACCOUNT BALANCE: Approx ${fmt(revenue - costs)} (net)

INVOICES:
- Total: ${invoices.length}
- Paid: ${invoices.filter((i: any) => i.status === 'paid').length}
- Pending: ${pendingInvoices.length} worth ${fmt(pendingInvoices.reduce((s: number, i: any) => s + Number(i.amount), 0))}
- Overdue: ${overdueInvoices.length}${overdueInvoices.length ? ' — ' + overdueInvoices.map((i: any) => `${i.customer_name} ${fmt(i.amount)}`).join(', ') : ''}
- Collection rate: ${health.collectionRate}%

RECENT TRANSACTIONS (last 30 days):
${transactions.slice(0, 10).map((t: any) =>
  `${new Date(t.created_at).toLocaleDateString()} | ${t.type === 'in' ? 'IN' : 'OUT'} | ${fmt(Number(t.amount))} | ${t.description || ''} | ${t.status}`
).join('\n') || 'None yet'}

RECENT PAYOUTS:
${disbursements.slice(0, 5).map((d: any) =>
  `${new Date(d.created_at).toLocaleDateString()} | ${d.recipient_name} | ${fmt(Number(d.amount))} | ${d.network} | ${d.status}`
).join('\n') || 'None yet'}
`.trim()

    const systemPrompt = `You are Afi, the AI CFO inside FlowPilot — a financial management app for small businesses in Ghana.

CORE RULE: Never invent numbers. Every figure you mention must come from the business data below. If the data does not contain it, say so.

YOUR JOB:
Answer financial questions about this specific business.
Help the owner understand their cash flow, invoices, payments, and payouts. Give direct advice using real numbers.

CONTEXT YOU UNDERSTAND:
Ghana business environment, GHS currency, MTN MoMo, Telecel, AirtelTigo, informal market patterns, mobile money payments.

HOW TO RESPOND:
- Get straight to the answer — no filler openers
- Use real figures from the data, always in GHS
- Match length to the question — short questions get short answers
- Be direct and warm, like a trusted advisor
- For questions outside business finances, say:
  "I can only help with this business's finances."
- If there is no data yet, say:
  "No financial data yet — create your first invoice to get started."

LIVE BUSINESS DATA:
${context}`

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash-latest',
      systemInstruction: systemPrompt,
    })

    // Map messages for Gemini: split into history + last user message
    const geminiMessages = messages.map((m: { role: string; text: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }))

    const history = geminiMessages.slice(0, -1)
    
    // Gemini API strict rule: history MUST start with a 'user' message.
    // If the history starts with a 'model' message (like an initial greeting), we must drop it.
    const firstUserIndex = history.findIndex((m: any) => m.role === 'user')
    const validHistory = firstUserIndex >= 0 ? history.slice(firstUserIndex) : []

    const lastMessage = geminiMessages[geminiMessages.length - 1]

    const chat = model.startChat({ history: validHistory })
    const result = await chat.sendMessage(lastMessage.parts)

    const reply = result.response.text()
    return NextResponse.json({ reply })
  } catch (e: any) {
    console.error('[AI CFO Error]', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
