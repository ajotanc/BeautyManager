import { databases, APPWRITE_DATABASE_ID, TABLES } from './appwrite'
import type { IProduct } from '@/types/product'
import { ID, Query } from 'appwrite'

export class Products {
  async list(queries: string[] = []): Promise<IProduct[]> {
    const defaultQueries = [
      Query.select(['*', 'category.*', 'brand.*']),
      Query.orderAsc('name'),
      Query.limit(500)
    ]
    const combinedQueries = queries.length > 0 ? queries : defaultQueries
    const response = await databases.listRows<IProduct>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.PRODUCTS,
      queries: combinedQueries
    })
    return response.rows
  }

  async getById(id: string): Promise<IProduct> {
    return await databases.getRow<IProduct>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.PRODUCTS,
      rowId: id
    })
  }

  async getByBarcode(barcode: string): Promise<IProduct | null> {
    const trimmed = barcode.trim()
    if (!trimmed) return null

    const response = await databases.listRows<IProduct>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.PRODUCTS,
      queries: [Query.equal('barcode', trimmed), Query.limit(1)]
    })
    return response.rows.length > 0 ? response.rows[0] : null
  }

  async listQuickSaleProducts(): Promise<IProduct[]> {
    const response = await databases.listRows<IProduct>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.PRODUCTS,
      queries: [Query.equal('is_quick_sale', true), Query.orderAsc('name'), Query.limit(50)]
    })
    return response.rows
  }

  async create(data: IProduct): Promise<IProduct> {
    return await databases.createRow<IProduct>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.PRODUCTS,
      rowId: ID.unique(),
      data
    })
  }

  async update(id: string, data: IProduct): Promise<IProduct> {
    return await databases.updateRow<IProduct>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.PRODUCTS,
      rowId: id,
      data
    })
  }

  async updateStock(id: string, newQuantity: number): Promise<IProduct> {
    return await databases.updateRow<IProduct>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.PRODUCTS,
      rowId: id,
      data: {
        stock_quantity: newQuantity
      }
    })
  }

  async delete(id: string): Promise<void> {
    await databases.deleteRow({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.PRODUCTS,
      rowId: id
    })
  }
}

export const products = new Products()
