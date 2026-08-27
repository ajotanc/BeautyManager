import { z } from 'zod'
import type { ICategory } from '@/types/category'
import type { IBrand } from '@/types/brand'

export const productSchema = z.object({
  name: z.string({ error: 'O nome do produto é obrigatório' }).trim().min(2, 'O nome do produto deve ter pelo menos 2 caracteres'),
  barcode: z.string({ error: 'O código de barras é obrigatório' }).trim().min(1, 'O código de barras é obrigatório'),
  category: z.custom<ICategory | null>().optional().nullable(),
  brand: z.custom<IBrand | null>().optional().nullable(),
  cost_price: z.number({ error: 'Preço de custo é obrigatório' }).min(0, 'Preço de custo deve ser maior ou igual a zero'),
  profit_margin: z.number({ error: 'Margem de lucro é obrigatória' }).min(0, 'Margem de lucro deve ser maior ou igual a zero'),
  selling_price: z.number({ error: 'Preço de venda é obrigatório' }).min(0.01, 'Preço de venda deve ser maior que zero'),
  stock_quantity: z.number({ error: 'Estoque é obrigatório' }).int().min(0, 'Quantidade em estoque não pode ser negativa'),
  min_stock_alert: z.number({ error: 'Alerta mínimo é obrigatório' }).int().min(1, 'Alerta mínimo deve ser de pelo menos 1 unidade'),
  expiry_date: z.union([z.string(), z.date()]).nullable().optional(),
  is_quick_sale: z.boolean().optional().default(false)
})

export type ProductFormData = z.infer<typeof productSchema>
