import type { Models } from 'appwrite'

export interface ICustomer extends Models.Row {
  name: string
  phone: string
  email?: string | null
  document_number?: string | null
  birth_date?: string | null
  notes?: string | null
  total_purchases?: number | string
  last_purchase_at?: string | null
}
