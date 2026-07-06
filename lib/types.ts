export interface Business {
  id: string
  user_id: string
  name: string
  moolre_account_number: string
  created_at: string
}

export interface Customer {
  id: string
  business_id: string
  name: string
  phone: string
  created_at: string
}

export interface Invoice {
  id: string
  business_id: string
  customer_name: string
  customer_phone: string
  amount: number
  description: string
  status: 'pending' | 'paid' | 'overdue'
  due_date: string
  payment_link?: string
  external_ref?: string
  moolre_transaction_id?: string
  created_at: string
}

export interface Transaction {
  id: string
  business_id: string
  type: 'in' | 'out'
  amount: number
  description: string
  status: 'pending' | 'paid' | 'sent' | 'failed'
  moolre_ref?: string
  created_at: string
}

export interface Disbursement {
  id: string
  business_id: string
  recipient_name: string
  phone: string
  network: string
  amount: number
  status: 'pending' | 'sent' | 'failed'
  external_ref?: string
  moolre_ref?: string
  created_at: string
}

export interface HealthScore {
  score: number
  label: 'Healthy' | 'Fair' | 'At Risk'
  collectionRate: number
  netCashFlow: number
  overdueCount: number
  revenue: number
  costs: number
}
