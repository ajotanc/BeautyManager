import type { Models } from 'appwrite'
import type { IProduct } from './product'

export type PaymentMethod = 'Pix' | 'Credit' | 'Debit' | 'Cash'
export type SaleStatus = 'Completed' | 'Canceled'

export interface ISaleItem extends Models.Row {
  product: IProduct | string
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

export interface ISaleItemInput {
  product: IProduct
  quantity: number
  unit_price: number
  subtotal: number
}

export type CreateSaleInput = Omit<ISale, keyof Models.Row | 'items'> & {
  items?: ISaleItemInput[]
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