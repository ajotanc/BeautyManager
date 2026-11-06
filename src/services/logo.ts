import { ID } from 'appwrite'
import { account, storage, BUCKETS, APPWRITE_PROJECT_ID } from './appwrite'

export const LOGO_MAX_BYTES = 2 * 1024 * 1024
export const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp']

const blobs = new Map<string, Promise<Blob>>()

export const LogoService = {
  /** Envia a imagem para o bucket `logos` e devolve o ID do arquivo. */
  async upload(file: File): Promise<string> {
    const created = await storage.createFile({ bucketId: BUCKETS.LOGOS, fileId: ID.unique(), file })
    return created.$id
  },

  /** Remove o arquivo; falha de arquivo já apagado não importa. */
  async remove(fileId: string): Promise<void> {
    blobs.delete(fileId)
    try {
      await storage.deleteFile({ bucketId: BUCKETS.LOGOS, fileId })
    } catch (error) {
      console.error('Erro ao remover a logo:', error)
    }
  },

  /** Baixa a logo com o login do usuário (o bucket não é público) e guarda em memória. */
  blob(fileId: string): Promise<Blob> {
    let cached = blobs.get(fileId)
    if (!cached) {
      cached = (async () => {
        const { jwt } = await account.createJWT()
        const url = storage.getFileView({ bucketId: BUCKETS.LOGOS, fileId })
        const response = await fetch(url, { headers: { 'X-Appwrite-Project': APPWRITE_PROJECT_ID, 'X-Appwrite-JWT': jwt } })
        if (!response.ok) throw new Error(`Logo indisponível (${response.status})`)
        return response.blob()
      })()
      cached.catch(() => blobs.delete(fileId)) // tenta de novo na próxima vez
      blobs.set(fileId, cached)
    }
    return cached
  }
}
