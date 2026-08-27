import { z } from 'zod'

export const customerSchema = z.object({
  name: z.string().trim().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  phone: z.string().trim().min(8, 'Informe um telefone ou WhatsApp válido'),
  email: z.email('Informe um e-mail válido').optional().or(z.literal('')),
  document_number: z.string().trim().optional().or(z.literal('')),
  birth_date: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().optional().or(z.literal(''))
})

export type CustomerFormData = z.infer<typeof customerSchema>
