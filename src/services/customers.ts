import { ID, Query } from 'appwrite'
import { databases, APPWRITE_DATABASE_ID, TABLES } from './appwrite'
import type { ICustomer } from '@/types/customer'

export const CustomerService = {
  async row(rowId: string): Promise<ICustomer> {
    try {
      return await databases.getRow<ICustomer>({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.CUSTOMERS,
        rowId
      })
    } catch (error) {
      console.error('Erro ao buscar cliente:', error)
      throw error
    }
  },

  async list(search?: string): Promise<ICustomer[]> {
    try {
      const queries = [Query.orderAsc('name'), Query.limit(200)]
      if (search && search.trim()) {
        queries.push(Query.contains('name', search.trim()))
      }

      const response = await databases.listRows<ICustomer>({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.CUSTOMERS,
        queries
      })
      return response.rows
    } catch (error) {
      console.error('Erro ao listar clientes:', error)
      return []
    }
  },

  async create(data: ICustomer): Promise<ICustomer> {
    try {
      return await databases.createRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.CUSTOMERS,
        rowId: ID.unique(),
        data
      });
    } catch (error) {
      console.error('Erro ao criar cliente:', error)
      throw error
    }
  },

  async update(rowId: string, data: Partial<ICustomer>): Promise<ICustomer> {
    try {
      return await databases.updateRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.CUSTOMERS,
        rowId,
        data
      })
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error)
      throw error
    }
  },

  async upsert(
    rowId: string | undefined,
    data: Partial<ICustomer>
  ): Promise<ICustomer> {
    try {
      const id = rowId || ID.unique()

      return await databases.upsertRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.CUSTOMERS,
        rowId: id,
        data
      })
    } catch (error) {
      console.error('Erro no upsert de cliente:', error)
      throw error
    }
  },

  async delete(rowId: string): Promise<void> {
    try {
      await databases.deleteRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.CUSTOMERS,
        rowId
      })
    } catch (error) {
      console.error('Erro ao excluir cliente:', error)
      throw error
    }
  }
}

export const customers = CustomerService
