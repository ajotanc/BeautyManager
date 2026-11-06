import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { IProduct } from '@/types/product'

const mocks = vi.hoisted(() => ({ listRows: vi.fn(), upsertRow: vi.fn(), createRow: vi.fn() }))
vi.mock('./appwrite', () => ({
  APPWRITE_DATABASE_ID: 'db',
  TABLES: { PRODUCTS: 'products' },
  permissions: [],
  databases: mocks
}))

const { ProductService } = await import('./products')

const otherProduct = { $id: 'outro', name: 'bandana' }
const data = (barcode: string) => ({ barcode, name: 'ventosa' }) as unknown as Partial<IProduct>

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  mocks.upsertRow.mockResolvedValue({ $id: 'novo' })
  mocks.createRow.mockResolvedValue({ $id: 'novo' })
})

describe('código de barras único', () => {
  it('recusa um código que já é de outro produto e não grava', async () => {
    mocks.listRows.mockResolvedValue({ rows: [otherProduct] })
    await expect(ProductService.upsert(undefined, data('0010'))).rejects.toThrow(/já pertence ao produto "bandana"/)
    expect(mocks.upsertRow).not.toHaveBeenCalled()
  })

  it('permite salvar o próprio produto com o mesmo código (edição)', async () => {
    mocks.listRows.mockResolvedValue({ rows: [{ $id: 'meu', name: 'ventosa' }] })
    await ProductService.upsert('meu', data('0010'))
    expect(mocks.upsertRow).toHaveBeenCalledTimes(1)
  })

  it('código livre grava normalmente', async () => {
    mocks.listRows.mockResolvedValue({ rows: [] })
    await ProductService.upsert(undefined, data('7891234567895'))
    expect(mocks.upsertRow).toHaveBeenCalledTimes(1)
  })

  it('a criação também confere', async () => {
    mocks.listRows.mockResolvedValue({ rows: [otherProduct] })
    await expect(ProductService.create(data('0010') as IProduct)).rejects.toThrow(/já pertence/)
    expect(mocks.createRow).not.toHaveBeenCalled()
  })

  it('sem código (ex.: atualização só de estoque) nem consulta o banco', async () => {
    await ProductService.upsert('meu', { stock_quantity: 3 } as Partial<IProduct>)
    expect(mocks.listRows).not.toHaveBeenCalled()
  })

  it('ignora espaços ao redor do código', async () => {
    mocks.listRows.mockResolvedValue({ rows: [] })
    await ProductService.upsert(undefined, data('  0010  '))
    const queries = mocks.listRows.mock.calls[0][0].queries as string[]
    expect(queries.some((q) => q.includes('"0010"'))).toBe(true)
  })
})
