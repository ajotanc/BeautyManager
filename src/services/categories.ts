import { databases, APPWRITE_DATABASE_ID, TABLES } from './appwrite'
import type { ICategory } from '@/types/category'
import { ID, Query } from 'appwrite'

export class Categories {
  async list(): Promise<ICategory[]> {
    const response = await databases.listRows<ICategory>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.CATEGORIES,
      queries: [Query.orderAsc('name'), Query.limit(100)]
    })
    return response.rows
  }

  async getById(id: string): Promise<ICategory> {
    return await databases.getRow<ICategory>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.CATEGORIES,
      rowId: id
    })
  }

  async create(data: Partial<ICategory>): Promise<ICategory> {
    return await databases.createRow<ICategory>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.CATEGORIES,
      rowId: ID.unique(),
      data: {
        name: data.name || ''
      }
    })
  }

  async update(id: string, data: Partial<ICategory>): Promise<ICategory> {
    return await databases.updateRow<ICategory>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.CATEGORIES,
      rowId: id,
      data
    })
  }

  async delete(id: string): Promise<void> {
    await databases.deleteRow({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.CATEGORIES,
      rowId: id
    })
  }
}

export const categories = new Categories()
