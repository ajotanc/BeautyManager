import { z } from 'zod'

export const settingsSchema = z.object({
  store_name: z.string().trim().min(2, 'O nome da loja deve ter pelo menos 2 caracteres'),
  document_number: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  instagram: z.string().trim().optional(),
  address: z.string().trim().optional(),
  receipt_header: z.string().trim().optional(),
  receipt_footer: z.string().trim().optional(),
  receipt_width: z.enum(['58mm', '80mm']),
  show_qrcode: z.boolean().optional(),
  qrcode_type: z.enum(['whatsapp', 'instagram', 'pix', 'custom']),
  qrcode_payload: z.string().trim().optional(),
  pix_key: z.string().trim().optional(),
  loyalty_milestone: z.number().min(0).optional()
})

export type SettingsFormData = z.infer<typeof settingsSchema>
