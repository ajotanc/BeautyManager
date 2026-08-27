import { databases, APPWRITE_DATABASE_ID, TABLES } from './appwrite'
import type { IInventoryTransaction, InventoryReason, InventoryTransactionType } from '@/types/inventory'
import type { IProduct } from '@/types/product'
import { ProductService } from './products'
import { ID, Query } from 'appwrite'

export const InventoryService = {
  async listRecent(limitCount: number = 100): Promise<IInventoryTransaction[]> {
    try {
      const response = await databases.listRows<IInventoryTransaction>({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.INVENTORY_TRANSACTIONS,
        queries: [Query.orderDesc('$createdAt'), Query.limit(limitCount)]
      })
      return response.rows
    } catch (error) {
      console.error('Erro ao listar transações de estoque:', error)
      return []
    }
  },

  async listByProduct(productId: string): Promise<IInventoryTransaction[]> {
    try {
      const response = await databases.listRows<IInventoryTransaction>({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.INVENTORY_TRANSACTIONS,
        queries: [Query.equal('product', productId), Query.orderDesc('$createdAt'), Query.limit(50)]
      })
      return response.rows
    } catch (error) {
      console.error('Erro ao listar transações por produto:', error)
      return []
    }
  },

  async recordTransaction(dto: {
    product: IProduct
    quantity: number
    transaction_type: InventoryTransactionType
    reason: InventoryReason
  }): Promise<IInventoryTransaction> {
    try {
      const currentStock = dto.product.stock_quantity

      let newStock = currentStock
      if (dto.transaction_type === 'IN') {
        newStock += dto.quantity
      } else {
        newStock = Math.max(0, currentStock - dto.quantity)
      }

      // 1. Atualiza o estoque do produto via updateStock
      await ProductService.updateStock(dto.product.$id, newStock)

      // 2. Atualiza a referência em memória
      dto.product.stock_quantity = newStock

      // 3. Registra a transação de auditoria via createRow com apenas o ID do produto
      return await databases.createRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.INVENTORY_TRANSACTIONS,
        rowId: ID.unique(),
        data: {
          product: dto.product,
          transaction_type: dto.transaction_type,
          quantity: dto.quantity,
          reason: dto.reason
        }
      })
    } catch (error) {
      console.error('Erro ao registrar transação de estoque:', error)
      throw error
    }
  }
}

export const inventory = InventoryService
