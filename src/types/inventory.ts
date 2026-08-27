import type { Models } from 'appwrite'
import type { IProduct } from './product'

export type InventoryTransactionType = 'IN' | 'OUT'
export type InventoryReason = 'purchase' | 'sale' | 'adjustment' | 'damage' | 'devolution'

export interface IInventoryTransaction extends Models.Row {
  product: IProduct
  transaction_type: InventoryTransactionType
  quantity: number
  reason: InventoryReason
}