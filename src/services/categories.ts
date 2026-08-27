import { ID, Query } from 'appwrite'
import { databases, APPWRITE_DATABASE_ID, TABLES } from './appwrite'
import type { ICategory } from '@/types/category'

export const CategoryService = {
  async row(rowId: string): Promise<ICategory> {
    try {
      return await databases.getRow<ICategory>({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.CATEGORIES,
        rowId
      })
    } catch (error) {
      console.error('Erro ao buscar categoria:', error)
      throw error
    }
  },

  async list(): Promise<ICategory[]> {
    try {
      const response = await databases.listRows<ICategory>({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.CATEGORIES,
        queries: [Query.orderAsc('name'), Query.limit(100)]
      })
      return response.rows
    } catch (error) {
      console.error('Erro ao listar categorias:', error)
      return []
    }
  },

  async create(data: ICategory): Promise<ICategory> {
    try {
      return await databases.createRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.CATEGORIES,
        rowId: ID.unique(),
        data
      })
    } catch (error) {
      console.error('Erro ao criar categoria:', error)
      throw error
    }
  },

  async update(rowId: string, data: Partial<ICategory>): Promise<ICategory> {
    try {
      return await databases.updateRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.CATEGORIES,
        rowId,
        data
      })
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error)
      throw error
    }
  },

  async upsert(
    rowId: string | undefined,
    data: Partial<ICategory>
  ): Promise<ICategory> {
    try {
      const id = rowId || ID.unique()

      return await databases.upsertRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.CATEGORIES,
        rowId: id,
        data
      })
    } catch (error) {
      console.error('Erro no upsert de categoria:', error)
      throw error
    }
  },

  async delete(rowId: string): Promise<void> {
    try {
      await databases.deleteRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.CATEGORIES,
        rowId
      })
    } catch (error) {
      console.error('Erro ao excluir categoria:', error)
      throw error
    }
  }
}

export const categories = CategoryService
