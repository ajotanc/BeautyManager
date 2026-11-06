import { describe, expect, it } from 'vitest'
import { customerSchema } from './customerSchema'

const base = { name: 'Ana Souza', phone: '11999999999' }
const withDocument = (document_number: string | null | undefined) => customerSchema.safeParse({ ...base, document_number }).success

describe('customerSchema: CPF/CNPJ', () => {
  it('aceita CPF e CNPJ válidos, com ou sem máscara', () => {
    expect(withDocument('529.982.247-25')).toBe(true)
    expect(withDocument('52998224725')).toBe(true)
    expect(withDocument('11.222.333/0001-81')).toBe(true)
  })

  it('recusa CPF e CNPJ inválidos', () => {
    expect(withDocument('111.111.111-11')).toBe(false)
    expect(withDocument('529.982.247-26')).toBe(false)
    expect(withDocument('123')).toBe(false)
  })

  it('o documento continua opcional', () => {
    expect(withDocument('')).toBe(true)
    expect(withDocument(null)).toBe(true)
    expect(withDocument(undefined)).toBe(true)
  })
})
