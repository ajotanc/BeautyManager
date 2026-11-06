import type { Models } from 'appwrite'
import type { ICategory } from './category'
import type { IBrand } from './brand'

export interface IProduct extends Models.Row {
  barcode: string
  name: string
  category?: ICategory | null
  brand?: IBrand | null
  cost_price: number | null
  profit_margin: number | null
  selling_price: number | null
  stock_quantity: number
  min_stock_alert: number
  expiry_date?: string | null
  is_quick_sale?: boolean
}