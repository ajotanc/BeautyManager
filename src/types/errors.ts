import { AppwriteException } from 'appwrite'

export interface IError {
  message: string
  code?: number
  type?: string
}

/**
 * Função utilitária para tratamento de erros sem uso de any ou unknown
 */
export function parseErrorMessage(error: unknown): string {
  if (error instanceof AppwriteException) {
    return error.message || `Erro no Appwrite (Código: ${error.code})`
  }
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'Ocorreu um erro inesperado no sistema.'
}
