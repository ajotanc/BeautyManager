import {
  isValidCpf,
  isValidCnpj,
  formatCpf,
  formatCnpj
} from '@brazilian-utils/brazilian-utils'

/**
 * Remove todos os caracteres não numéricos de uma string
 */
export function unmask(value: string | null | undefined): string {
  if (!value) return ''
  return value.replace(/\D/g, '')
}

/**
 * Aplica máscara progressiva de CPF ou CNPJ em tempo real durante a digitação:
 * - Até 11 dígitos: formata progressivamente como CPF (000.000.000-00)
 * - De 12 a 14 dígitos: transiciona suavemente e formata como CNPJ (00.000.000/0000-00)
 *
 * @param value Valor bruto com ou sem pontuação
 * @returns String formatada com a máscara progressiva
 */
export function maskCpfCnpj(value: string | null | undefined): string {
  const digits = unmask(value).slice(0, 14)
  const len = digits.length

  if (!len) return ''

  // Formatação progressiva do CPF (1 a 11 dígitos)
  if (len <= 11) {
    if (len <= 3) return digits
    if (len <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (len <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  }

  // Formatação progressiva do CNPJ (12 a 14 dígitos)
  if (len <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

/**
 * Formata um documento completo (útil para exibição de dados vindos do banco)
 */
export function formatDocument(value: string | null | undefined): string {
  const digits = unmask(value)
  if (digits.length === 11) {
    return formatCpf(digits)
  }
  if (digits.length === 14) {
    return formatCnpj(digits)
  }
  return maskCpfCnpj(digits)
}

/**
 * Valida os dígitos verificadores oficiais de CPF ou CNPJ
 *
 * @param value Documento formatado ou apenas dígitos
 * @returns true se for um CPF ou CNPJ matematicamente válido
 */
export function isValidDocument(value: string | null | undefined): boolean {
  const digits = unmask(value)
  if (digits.length === 11) {
    return isValidCpf(digits)
  }
  if (digits.length === 14) {
    return isValidCnpj(digits)
  }
  return false
}
