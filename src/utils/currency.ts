import { formatCurrency as brFormatCurrency, parseCurrency as brParseCurrency } from '@brazilian-utils/brazilian-utils'

/**
 * Converte qualquer valor numérico ou string monetária para número de ponto flutuante seguro
 */
export function toNumber(value: number | string | undefined | null): number {
  if (value === undefined || value === null || value === '') return 0
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value
  }
  const parsed = typeof brParseCurrency === 'function' ? brParseCurrency(value) : parseFloat(value)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Formata um valor numérico ou string para o padrão de moeda brasileiro (ex: R$ 3,50)
 */
export function formatCurrency(value: number | string | undefined | null): string {
  const num = toNumber(value)
  return `R$ ${brFormatCurrency(num)}`
}

/**
 * Formata percentual (ex: 50.0%)
 */
export function formatPercent(value: number | string | undefined | null): string {
  const num = toNumber(value)
  return `${num.toFixed(1)}%`
}

/**
 * Formata o valor numérico para a string decimal padrão do banco (ex: "3.50")
 */
export function toDecimalString(value: number | string | undefined | null, decimals: number = 2): string {
  const num = toNumber(value)
  return num.toFixed(decimals)
}
