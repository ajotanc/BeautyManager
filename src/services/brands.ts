import { databases, APPWRITE_DATABASE_ID, TABLES } from './appwrite'
import type { IBrand } from '@/types/brand'
import { ID, Query } from 'appwrite'

export class Brands {
  async list(): Promise<IBrand[]> {
    const response = await databases.listRows<IBrand>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.BRANDS,
      queries: [Query.orderAsc('name'), Query.limit(100)]
    })
    return response.rows
  }

  async getById(id: string): Promise<IBrand> {
    return await databases.getRow<IBrand>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.BRANDS,
      rowId: id
    })
  }

  async create(data: Partial<IBrand>): Promise<IBrand> {
    return await databases.createRow<IBrand>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.BRANDS,
      rowId: ID.unique(),
      data: {
        name: data.name || ''
      }
    })
  }

  async update(id: string, data: Partial<IBrand>): Promise<IBrand> {
    return await databases.updateRow<IBrand>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.BRANDS,
      rowId: id,
      data
    })
  }

  async delete(id: string): Promise<void> {
    await databases.deleteRow({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.BRANDS,
      rowId: id
    })
  }
}

export const brands = new Brands()
