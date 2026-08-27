import { z } from 'zod'
import type { ICategory } from '@/types/category'
import type { IBrand } from '@/types/brand'

export const productSchema = z.object({
  name: z.string({ error: 'O nome do produto é obrigatório' }).trim().min(2, 'O nome do produto deve ter pelo menos 2 caracteres'),
  barcode: z.string({ error: 'O código de barras é obrigatório' }).trim().min(1, 'O código de barras é obrigatório'),
  category: z.custom<ICategory | null>().optional().nullable(),
  brand: z.custom<IBrand | null>().optional().nullable(),
  
  cost_price: z.number().nullish().optional(),
  profit_margin: z.number().nullish().optional(),
  selling_price: z.number().nullish().optional(),
  
  stock_quantity: z.number({ error: 'Estoque é obrigatório' }).int().min(0, 'Quantidade em estoque não pode ser negativa'),
  min_stock_alert: z.number({ error: 'Alerta mínimo é obrigatório' }).int().min(1, 'Alerta mínimo deve ser de pelo menos 1 unidade'),
  expiry_date: z.union([z.string(), z.date()]).nullable().optional(),
  is_quick_sale: z.boolean().default(false)
})

export type ProductFormData = z.infer<typeof productSchema>
