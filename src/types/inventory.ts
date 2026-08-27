import type { Models } from 'appwrite'
import type { IProduct } from './product'

export type InventoryTransactionType = 'IN' | 'OUT'
export type InventoryReason = 'Purchase' | 'Sale' | 'Adjustment' | 'Damage' | 'Devolution'

export interface IInventoryTransaction extends Models.Row {
  product: IProduct | string
  transaction_type: InventoryTransactionType
  quantity: number
  reason: InventoryReason
}