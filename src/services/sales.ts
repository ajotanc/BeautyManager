import { databases, APPWRITE_DATABASE_ID, TABLES } from './appwrite'
import type { ISale, ISaleItem } from '@/types/sale'
import { InventoryService } from './inventory'
import { ID, Query } from 'appwrite'
import { IProduct } from '@/types/product'

export const SalesService = {
  async row(rowId: string): Promise<ISale> {
    try {
      return await databases.getRow<ISale>({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.SALES,
        rowId,
        queries: [
          Query.select(['*', 'items.*', 'items.product.*', 'items.kit.*'])
        ]
      })
    } catch (error) {
      console.error('Erro ao buscar venda:', error)
      throw error
    }
  },

  async listRecent(limitCount: number = 100): Promise<ISale[]> {
    try {
      const response = await databases.listRows<ISale>({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.SALES,
        queries: [
          Query.select(['*', 'items.*', 'items.product.*', 'items.kit.*']),
          Query.orderDesc('$createdAt'),
          Query.limit(limitCount)
        ]
      })
      return response.rows
    } catch (error) {
      console.error('Erro ao listar vendas recentes:', error)
      return []
    }
  },

  async createSale(
    data: Omit<ISale, 'items'> & { items?: ISaleItem[] }
  ): Promise<ISale> {
    try {
      const createdSale = await databases.createRow<ISale>({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.SALES,
        rowId: ID.unique(),
        data
      })

      if (createdSale.items) {
        for (const item of createdSale.items) {
          const product = item.product as IProduct
          await InventoryService.recordTransaction({
            product,
            transaction_type: 'OUT',
            quantity: Number(item.quantity),
            reason: 'sale'
          })
        }
      }

      return createdSale
    } catch (error: unknown) {
      console.error('Erro ao criar venda:', error)
      throw error
    }
  },

  async cancelSale(sale: ISale): Promise<ISale> {
    try {
      if (sale.status === 'canceled') {
        return sale
      }

      // Estorna os itens de volta ao estoque
      if (sale.items) {
        for (const item of sale.items) {
          const product = item.product as IProduct;
          await InventoryService.recordTransaction({
            product,
            transaction_type: 'IN',
            quantity: Number(item.quantity),
            reason: 'devolution'
          })
        }
      }

      return await databases.updateRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.SALES,
        rowId: sale.$id,
        data: {
          status: 'canceled'
        }
      })
    } catch (error: unknown) {
      console.error('Erro ao cancelar venda:', error)
      throw error
    }
  }
}

export const sales = SalesService
