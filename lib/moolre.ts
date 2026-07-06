const BASE = process.env.MOOLRE_SANDBOX === 'true'
  ? 'https://sandbox.moolre.com'
  : 'https://api.moolre.com'

async function post(path: string, body: object, extra: Record<string, string> = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-USER': process.env.MOOLRE_API_USER!,
      ...extra,
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message || `Moolre error ${res.status}`)
  return data
}

const account = () => process.env.MOOLRE_ACCOUNT_NUMBER!
const pubKey  = () => ({ 'X-API-PUBKEY': process.env.MOOLRE_API_PUBKEY! })
const privKey = () => ({ 'X-API-KEY': process.env.MOOLRE_API_KEY! })
const vasKey  = () => ({ 'X-API-VASKEY': process.env.MOOLRE_API_VASKEY! })

export async function generatePaymentLink(p: {
  amount: number; externalref: string; reusable?: 0 | 1; expiration_time?: string
}) {
  return post('/embed/link', { ...p, currency: 'GHS', accountnumber: account() }, pubKey())
}

export async function initiatePayment(p: {
  channel: number; payer: string; amount: number; externalref: string
}) {
  return post('/open/transact/payment', { ...p, accountnumber: account() }, privKey())
}

export async function checkPaymentStatus(externalref: string) {
  return post('/open/transact/status', { externalref, accountnumber: account() }, pubKey())
}

export async function validateName(p: { channel: number; account: string }) {
  return post('/open/transact/validate', { ...p, accountnumber: account() }, privKey())
}

export async function initiateTransfer(p: {
  channel: number; receiver: string; amount: number; externalref: string
}) {
  return post('/open/transact/transfer', { ...p, accountnumber: account() }, privKey())
}

export async function sendSMS(p: {
  sender: string; messages: Array<{ to: string; message: string }>
}) {
  return post('/open/sms/send', p, vasKey())
}

export async function getAccountTransactions(p?: {
  status?: number; limit?: number; startdate?: string; enddate?: string
}) {
  return post('/open/account/status', { accountnumber: account(), ...p }, privKey())
}

// MTN=13, Telecel=6, AT=7, Bank=2
export const networkChannels: Record<string, number> = {
  MTN: 13, Telecel: 6, AT: 7, Bank: 2,
}
