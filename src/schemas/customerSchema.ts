import { z } from 'zod'
import { isValidDocument } from '@/utils/masks'

export const customerSchema = z.object({
  name: z.string({ error: 'O nome é obrigatório' }).trim().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  phone: z.string({ error: 'Informe um telefone ou WhatsApp válido' }).trim().min(8, 'Informe um telefone ou WhatsApp válido'),
  email: z.email('Informe um e-mail válido').optional().nullable().or(z.literal('')),
  document_number: z.string().trim().refine((v) => !v || isValidDocument(v), 'Informe um CPF ou CNPJ válido').optional().nullable(),
  birth_date: z.union([z.string(), z.date()]).nullable().optional().or(z.literal('')),
  notes: z.string().trim().optional().nullable().or(z.literal(''))
})

export type CustomerFormData = z.infer<typeof customerSchema>
