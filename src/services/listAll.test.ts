import { Query } from 'appwrite'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ listRows: vi.fn() }))
vi.mock('./appwrite', () => ({
  APPWRITE_DATABASE_ID: 'db',
  databases: { listRows: mocks.listRows }
}))

const { listAllRows } = await import('./listAll')

const rows = (from: number, count: number) => Array.from({ length: count }, (_, i) => ({ $id: `r${from + i}` }))
const method = (query: string): string => JSON.parse(query).method
const calledQueries = (call: number): string[] => mocks.listRows.mock.calls[call][0].queries

beforeEach(() => mocks.listRows.mockReset())

describe('listAllRows', () => {
  it('uma página incompleta termina na primeira chamada', async () => {
    mocks.listRows.mockResolvedValueOnce({ rows: rows(0, 3) })
    expect(await listAllRows('products')).toHaveLength(3)
    expect(mocks.listRows).toHaveBeenCalledTimes(1)
  })

  it('junta todas as páginas, avançando pelo cursor do último ID (o caso dos 500+ produtos)', async () => {
    mocks.listRows.mockResolvedValueOnce({ rows: rows(0, 500) }).mockResolvedValueOnce({ rows: rows(500, 120) })
    const all = (await listAllRows('products')) as unknown as { $id: string }[]
    expect(all).toHaveLength(620)
    expect(all[619].$id).toBe('r619')
    expect(calledQueries(0).map(method)).not.toContain('cursorAfter')
    expect(calledQueries(1)).toContain(Query.cursorAfter('r499'))
  })

  it('com exatamente uma página cheia, confirma na seguinte que acabou', async () => {
    mocks.listRows.mockResolvedValueOnce({ rows: rows(0, 500) }).mockResolvedValueOnce({ rows: [] })
    expect(await listAllRows('products')).toHaveLength(500)
    expect(mocks.listRows).toHaveBeenCalledTimes(2)
  })

  it('mantém as consultas do chamador e ignora o limit dele (a paginação é daqui)', async () => {
    mocks.listRows.mockResolvedValueOnce({ rows: [] })
    await listAllRows('kits', [Query.orderAsc('name'), Query.limit(200)])
    const queries = calledQueries(0)
    expect(queries).toContain(Query.orderAsc('name'))
    expect(queries).not.toContain(Query.limit(200))
    expect(queries.filter((q) => method(q) === 'limit')).toEqual([Query.limit(500)])
  })

  it('devolve o erro do Appwrite, não uma lista parcial', async () => {
    mocks.listRows.mockResolvedValueOnce({ rows: rows(0, 500) }).mockRejectedValueOnce(new Error('rede caiu'))
    await expect(listAllRows('products')).rejects.toThrow('rede caiu')
  })
})
