import { ID, Query } from 'appwrite'
import { databases, APPWRITE_DATABASE_ID, TABLES } from './appwrite'
import type { IBrand } from '@/types/brand'

export const BrandService = {
  async row(rowId: string): Promise<IBrand> {
    try {
      return await databases.getRow<IBrand>({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.BRANDS,
        rowId
      })
    } catch (error) {
      console.error('Erro ao buscar marca:', error)
      throw error
    }
  },

  async list(): Promise<IBrand[]> {
    try {
      const response = await databases.listRows<IBrand>({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.BRANDS,
        queries: [Query.orderAsc('name'), Query.limit(100)]
      })
      return response.rows
    } catch (error) {
      console.error('Erro ao listar marcas:', error)
      return []
    }
  },

  async create(data: IBrand): Promise<IBrand> {
    try {
      return await databases.createRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.BRANDS,
        rowId: ID.unique(),
        data
      })
    } catch (error) {
      console.error('Erro ao criar marca:', error)
      throw error
    }
  },

  async update(rowId: string, data: Partial<IBrand>): Promise<IBrand> {
    try {
      return await databases.updateRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.BRANDS,
        rowId,
        data
      })
    } catch (error) {
      console.error('Erro ao atualizar marca:', error)
      throw error
    }
  },

  async upsert(
    rowId: string | undefined,
    data: Partial<IBrand>
  ): Promise<IBrand> {
    try {
      const id = rowId || ID.unique()

      return await databases.upsertRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.BRANDS,
        rowId: id,
        data
      })
    } catch (error) {
      console.error('Erro no upsert de marca:', error)
      throw error
    }
  },

  async delete(rowId: string): Promise<void> {
    try {
      await databases.deleteRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.BRANDS,
        rowId
      })
    } catch (error) {
      console.error('Erro ao excluir marca:', error)
      throw error
    }
  }
}

export const brands = BrandService
