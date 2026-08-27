import type { Models } from 'appwrite'
import type { ICategory } from './category'
import type { IBrand } from './brand'

export interface IProduct extends Models.Row {
  barcode: string
  name: string
  category?: ICategory | null
  brand?: IBrand | null
  cost_price: number | string
  profit_margin: number | string
  selling_price: number | string
  stock_quantity: number
  min_stock_alert: number
  expiry_date?: string | null
  is_quick_sale?: boolean
}