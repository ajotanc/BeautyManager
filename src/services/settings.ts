import { ID, Query } from 'appwrite'
import { databases, APPWRITE_DATABASE_ID, TABLES } from './appwrite'
import type { ISettings } from '@/types/storeSettings'

export const SettingsService = {
  async getSettings(): Promise<ISettings | null> {
    try {
      const response = await databases.listRows<ISettings>({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.STORE_SETTINGS,
        queries: [Query.limit(1)]
      })

      return response.rows.length > 0 ? response.rows[0] : null
    } catch (error) {
      console.error('Erro ao buscar configurações:', error)
      return null
    }
  },

  async upsert(
    rowId: string | undefined,
    data: Partial<ISettings>
  ): Promise<ISettings> {
    try {
      const id = rowId || ID.unique()

      return await databases.upsertRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.STORE_SETTINGS,
        rowId: id,
        data
      })
    } catch (error) {
      console.error('Erro no upsert de configurações:', error)
      throw error
    }
  },

  async saveSettings(id: string | undefined, data: Partial<ISettings>): Promise<ISettings> {
    return this.upsert(id, data)
  }
}

export const settings = SettingsService
