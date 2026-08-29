import { z } from 'zod'

export const kitSchema = z.object({
  name: z
    .string({ error: 'O nome do kit é obrigatório' })
    .trim()
    .min(2, 'O nome do kit deve ter pelo menos 2 caracteres'),
  barcode: z
    .string({ error: 'O código de barras é obrigatório' })
    .trim()
    .min(1, 'O código de barras é obrigatório'),
  campaign_event: z
    .string({ error: 'Selecione uma campanha' })
    .min(1, 'Selecione uma campanha'),
  event_date: z
    .string()
    .nullable()
    .optional(),
  packaging_cost: z
    .number()
    .min(0, 'O custo não pode ser negativo')
    .nullish()
    .optional(),
  selling_price: z
    .number({ error: 'Preço de venda é obrigatório' })
    .min(0.01, 'Informe um preço de venda válido para o kit'),
  description: z
    .string()
    .nullable()
    .optional(),
  is_active: z
    .boolean()
    .default(true)
})

export type KitFormData = z.infer<typeof kitSchema>
