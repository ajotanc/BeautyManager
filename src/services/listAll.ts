import { Query, type Models } from 'appwrite'
import { APPWRITE_DATABASE_ID, databases } from './appwrite'

const PAGE_SIZE = 500

/** As consultas do SDK são JSON (`{"method":"limit","values":[500]}`). */
const queryMethod = (query: string): string | undefined => {
  try {
    return JSON.parse(query).method
  } catch {
    return undefined
  }
}

/**
 * Lê todas as linhas de uma tabela, página por página (cursor). O Appwrite devolve no máximo `limit` linhas por
 * chamada; um `Query.limit` fixo cortava a lista em silêncio (produtos além do 500º, clientes além do 200º...).
 * Qualquer `limit` vindo em `queries` é ignorado: a paginação é daqui.
 */
export async function listAllRows<T extends Models.Row>(tableId: string, queries: string[] = []): Promise<T[]> {
  const base = queries.filter((query) => queryMethod(query) !== 'limit')
  const rows: T[] = []
  for (;;) {
    const cursor = rows.length > 0 ? [Query.cursorAfter(rows[rows.length - 1].$id)] : []
    const page = await databases.listRows<T>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId,
      queries: [...base, Query.limit(PAGE_SIZE), ...cursor]
    })
    rows.push(...page.rows)
    if (page.rows.length < PAGE_SIZE) return rows
  }
}
