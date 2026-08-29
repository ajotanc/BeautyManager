import { databases, APPWRITE_DATABASE_ID, TABLES } from './appwrite'
import type { IKit } from '@/types/kit'
import { ID, Query } from 'appwrite'

export const KitService = {
  async row(rowId: string): Promise<IKit> {
    try {
      return await databases.getRow<IKit>({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.KITS,
        rowId,
        queries: [
          Query.select(['*', 'items.*', 'items.product.*'])
        ]
      })
    } catch (error) {
      console.error('Erro ao buscar kit:', error)
      throw error
    }
  },

  async list(queries: string[] = []): Promise<IKit[]> {
    try {
      const defaultQueries = [
        Query.select(['*', 'items.*', 'items.product.*']),
        Query.orderAsc('name'),
        Query.limit(200)
      ]
      const combinedQueries = queries.length > 0 ? queries : defaultQueries
      const response = await databases.listRows<IKit>({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.KITS,
        queries: combinedQueries
      })
      return response.rows
    } catch (error) {
      console.error('Erro ao listar kits:', error)
      return []
    }
  },

  async listActive(): Promise<IKit[]> {
    try {
      return await this.list([
        Query.equal('is_active', true),
        Query.select(['*', 'items.*', 'items.product.*']),
        Query.orderAsc('name'),
        Query.limit(200)
      ])
    } catch (error) {
      console.error('Erro ao listar kits ativos:', error)
      return []
    }
  },

  async byBarcode(barcode: string): Promise<IKit | null> {
    const trimmed = barcode.trim()
    if (!trimmed) return null

    try {
      const response = await databases.listRows<IKit>({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.KITS,
        queries: [
          Query.equal('barcode', trimmed),
          Query.select(['*', 'items.*', 'items.product.*']),
          Query.limit(1)
        ]
      })
      return response.rows.length > 0 ? response.rows[0] : null
    } catch (error) {
      console.error('Erro ao buscar kit por código de barras:', error)
      return null
    }
  },

  async saveKit(
    data: Partial<IKit>
  ): Promise<IKit> {
    try {
      const id = data.$id || ID.unique()
      return await databases.upsertRow<IKit>({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.KITS,
        rowId: id,
        data
      })
    } catch (error: unknown) {
      console.error('Erro no saveKit:', error)
      throw error
    }
  },

  async toggleActive(kitId: string, isActive: boolean): Promise<IKit> {
    try {
      return await databases.updateRow<IKit>({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.KITS,
        rowId: kitId,
        data: {
          is_active: isActive
        }
      })
    } catch (error: unknown) {
      console.error('Erro ao alterar status do kit:', error)
      throw error
    }
  },

  async delete(kitId: string): Promise<void> {
    try {
      await databases.deleteRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.KITS,
        rowId: kitId
      })
    } catch (error: unknown) {
      console.error('Erro ao excluir kit:', error)
      throw error
    }
  }
}

export const kits = KitService
