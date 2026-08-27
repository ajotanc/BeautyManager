import { databases, APPWRITE_DATABASE_ID, TABLES } from './appwrite'
import type { ISettings } from '@/types/storeSettings'
import { ID, Query } from 'appwrite'

export class Settings {
  async getSettings(): Promise<ISettings | null> {
    try {
      const response = await databases.listRows<ISettings>({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.STORE_SETTINGS,
        queries: [Query.limit(1)]
      })

      if (response.rows.length > 0) {
        return response.rows[0]
      }

      return null
    } catch {
      return null
    }
  }

  async saveSettings(id: string | undefined, data: Partial<ISettings>): Promise<ISettings> {
    const rowId = id || ID.unique()
    return await databases.upsertRow<ISettings>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.STORE_SETTINGS,
      rowId,
      data
    })
  }
}

export const settings = new Settings()
