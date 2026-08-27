import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(customParseFormat)
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(relativeTime)
dayjs.locale('pt-br')

export { dayjs }

/**
 * Formata data e hora (padrão: DD/MM/YYYY HH:mm)
 */
export function formatDateTime(dateInput?: string | Date | dayjs.Dayjs | null, format: string = 'DD/MM/YYYY HH:mm'): string {
  if (!dateInput) return '-'
  const d = dayjs(dateInput)
  if (!d.isValid()) return '-'
  return d.format(format)
}

/**
 * Formata apenas data (padrão: DD/MM/YYYY)
 */
export function formatDate(dateInput?: string | Date | dayjs.Dayjs | null, format: string = 'DD/MM/YYYY'): string {
  if (!dateInput) return '-'
  const d = dayjs(dateInput)
  if (!d.isValid()) return '-'
  return d.format(format)
}

/**
 * Formata apenas hora (padrão: HH:mm)
 */
export function formatTime(dateInput?: string | Date | dayjs.Dayjs | null, format: string = 'HH:mm'): string {
  if (!dateInput) return '-'
  const d = dayjs(dateInput)
  if (!d.isValid()) return '-'
  return d.format(format)
}

/**
 * Verifica se um produto cosmético está próximo do vencimento
 */
export function isExpiringSoon(expiryDate?: string | Date | dayjs.Dayjs | null, daysThreshold: number = 45): boolean {
  if (!expiryDate) return false
  const exp = dayjs(expiryDate)
  if (!exp.isValid()) return false
  const now = dayjs()
  const diffDays = exp.diff(now, 'day')
  return diffDays >= 0 && diffDays <= daysThreshold
}

/**
 * Verifica se um produto cosmético já está vencido
 */
export function isExpired(expiryDate?: string | Date | dayjs.Dayjs | null): boolean {
  if (!expiryDate) return false
  const exp = dayjs(expiryDate)
  if (!exp.isValid()) return false
  return exp.isBefore(dayjs(), 'day')
}

/**
 * Retorna a data/hora atual em formato ISO string
 */
export function nowIso(): string {
  return dayjs().toISOString()
}
