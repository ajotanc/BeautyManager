import type { Models } from 'appwrite'
import type { IProduct } from './product'

export type PaymentMethod = 'pix' | 'credit' | 'debit' | 'cash'
export type SaleStatus = 'completed' | 'canceled'

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'PIX',
  credit: 'Cartão de Crédito',
  debit: 'Cartão de Débito',
  cash: 'Dinheiro'
}

export const PAYMENT_METHOD_OPTIONS: { label: string; value: PaymentMethod; icon: string }[] = [
  { label: 'Dinheiro', value: 'cash', icon: 'ri-money-dollar-circle-line' },
  { label: 'PIX', value: 'pix', icon: 'ri-qr-code-line' },
  { label: 'Cartão Crédito', value: 'credit', icon: 'ri-bank-card-line' },
  { label: 'Cartão Débito', value: 'debit', icon: 'ri-wallet-3-line' }
]

export function formatPaymentMethod(method: PaymentMethod | string | null | undefined): string {
  if (!method) return '-'
  const key = method.toLowerCase() as PaymentMethod
  return PAYMENT_METHOD_LABELS[key] || method
}

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

