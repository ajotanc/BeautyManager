import type { Models } from 'appwrite'

export type CashRegisterStatus = 'Open' | 'Closed'

export interface ICashRegister extends Models.Row {
  opened_at: string
  closed_at?: string | null
  opening_balance: number | string
  total_in: number | string
  total_out: number | string
  closing_balance?: number | string
  status: CashRegisterStatus
  user_id: string
  notes?: string | null
}

export interface ICashMovement {
  type: 'IN' | 'OUT'
  amount: number | string
  reason: string
}
