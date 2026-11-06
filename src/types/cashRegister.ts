import type { Models } from 'appwrite'

export type CashRegisterStatus = 'open' | 'closed'

export interface ICashRegister extends Models.Row {
  opened_at: string
  closed_at?: string | null
  opening_balance: number
  total_in: number
  total_out: number
  closing_balance?: number
  status: CashRegisterStatus
  user_id: string
  notes?: string | null
}

export interface ICashMovement {
  type: 'IN' | 'OUT'
  amount: number
  reason: string
}
