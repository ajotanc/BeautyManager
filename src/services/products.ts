import { ID, Query } from 'appwrite'
import { databases, APPWRITE_DATABASE_ID, TABLES } from './appwrite'
import type { IProduct } from '@/types/product'

export const ProductService = {
  async row(rowId: string): Promise<IProduct> {
    try {
      return await databases.getRow<IProduct>({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.PRODUCTS,
        rowId
      })
    } catch (error) {
      console.error('Erro ao buscar produto:', error)
      throw error
    }
  },

  async list(queries: string[] = []): Promise<IProduct[]> {
    try {
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
    } catch (error) {
      console.error('Erro ao listar produtos:', error)
      return []
    }
  },

  async byBarcode(barcode: string): Promise<IProduct | null> {
    const trimmed = barcode.trim()
    if (!trimmed) return null

    try {
      const response = await databases.listRows<IProduct>({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.PRODUCTS,
        queries: [Query.equal('barcode', trimmed), Query.limit(1)]
      })
      return response.rows.length > 0 ? response.rows[0] : null
    } catch (error) {
      console.error('Erro ao buscar por código de barras:', error)
      return null
    }
  },

  async getByBarcode(barcode: string): Promise<IProduct | null> {
    return this.byBarcode(barcode)
  },

  async getById(id: string): Promise<IProduct> {
    return this.row(id)
  },

  async listQuickSale(): Promise<IProduct[]> {
    try {
      const response = await databases.listRows<IProduct>({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.PRODUCTS,
        queries: [Query.equal('is_quick_sale', true), Query.orderAsc('name'), Query.limit(50)]
      })
      return response.rows
    } catch (error) {
      console.error('Erro ao listar venda rápida:', error)
      return []
    }
  },

  async create(data: IProduct): Promise<IProduct> {
    try {
      return await databases.createRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.PRODUCTS,
        rowId: ID.unique(),
        data
      })
    } catch (error) {
      console.error('Erro ao criar produto:', error)
      throw error
    }
  },

  async update(rowId: string, data: Partial<IProduct>): Promise<IProduct> {
    try {
      return await databases.updateRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.PRODUCTS,
        rowId,
        data
      })
    } catch (error) {
      console.error('Erro ao atualizar produto:', error)
      throw error
    }
  },

  async upsert(
    rowId: string | undefined,
    data: Partial<IProduct>
  ): Promise<IProduct> {
    try {
      const id = rowId || ID.unique()

      return await databases.upsertRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.PRODUCTS,
        rowId: id,
        data
      })
    } catch (error) {
      console.error('Erro no upsert de produto:', error)
      throw error
    }
  },

  async updateStock(rowId: string, newQuantity: number): Promise<IProduct> {
    try {
      return await databases.updateRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.PRODUCTS,
        rowId,
        data: {
          stock_quantity: newQuantity
        }
      })
    } catch (error: unknown) {
      console.error('Erro ao atualizar estoque:', error)
      throw error
    }
  },

  async delete(rowId: string): Promise<void> {
    try {
      await databases.deleteRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.PRODUCTS,
        rowId
      })
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      throw error
    }
  }
}

export const products = ProductService
