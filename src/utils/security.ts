/**
 * Mascara um documento CPF em conformidade com a LGPD (ex: ***.456.789-**)
 */
export function maskCpf(document?: string | null): string {
  if (!document) return '-'
  const clean = document.replace(/\D/g, '')
  if (clean.length === 11) {
    return `***.${clean.slice(3, 6)}.${clean.slice(6, 9)}-**`
  }
  if (clean.length > 4) {
    return `***.${clean.slice(2, 5)}.-**`
  }
  return '***.***.***-**'
}
