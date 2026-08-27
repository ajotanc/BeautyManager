import type { Models } from 'appwrite'
import type { IProduct } from './product'

export type PaymentMethod = 'pix' | 'credit' | 'debit' | 'cash'
export type SaleStatus = 'completed' | 'canceled'

export interface ISaleItem extends Models.Row {
  product: IProduct
  quantity: number
  unit_price: number | string
  subtotal: number | string
}

export interface ISale extends Models.Row {
  total_amount: number | string
  discount_amount?: number | string
  payment_method: PaymentMethod
  customer_name?: string | null
  customer_phone?: string | null
  status: SaleStatus
  user_id: string
  items?: ISaleItem[]
}

export interface ICartItem {
  product: IProduct
  quantity: number
  unit_price: number
  subtotal: number
  discount: number
}

export interface IReceiptItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
}

