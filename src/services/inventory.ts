import { databases, APPWRITE_DATABASE_ID, TABLES } from './appwrite'
import type { IInventoryTransaction, InventoryReason, InventoryTransactionType } from '@/types/inventory'
import type { IProduct } from '@/types/product'
import { products } from './products'
import { ID, Query } from 'appwrite'

export class Inventory {
  async listRecent(limitCount: number = 100): Promise<IInventoryTransaction[]> {
    const response = await databases.listRows<IInventoryTransaction>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.INVENTORY_TRANSACTIONS,
      queries: [Query.orderDesc('$createdAt'), Query.limit(limitCount)]
    })
    return response.rows
  }

  async listByProduct(productId: string): Promise<IInventoryTransaction[]> {
    const response = await databases.listRows<IInventoryTransaction>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.INVENTORY_TRANSACTIONS,
      queries: [Query.equal('product', productId), Query.orderDesc('$createdAt'), Query.limit(50)]
    })
    return response.rows
  }

  async recordTransaction(dto: { product: string | IProduct; quantity: number; transaction_type: InventoryTransactionType; reason: InventoryReason }): Promise<IInventoryTransaction> {
    const prodId = typeof dto.product === 'object' && dto.product ? dto.product.$id : (dto.product as string)
    const product = await products.getById(prodId)
    const currentStock = product.stock_quantity

    let newStock = currentStock
    if (dto.transaction_type === 'IN') {
      newStock += dto.quantity
    } else {
      newStock = Math.max(0, currentStock - dto.quantity)
    }

    // Atualiza o estoque do produto via updateRow
    await products.updateStock(prodId, newStock)

    // Registra a transação de auditoria via createRow
    const transaction = await databases.createRow<IInventoryTransaction>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.INVENTORY_TRANSACTIONS,
      rowId: ID.unique(),
      data: {
        product: prodId,
        transaction_type: dto.transaction_type,
        quantity: dto.quantity,
        reason: dto.reason
      }
    })

    return transaction
  }
}

export const inventory = new Inventory()
