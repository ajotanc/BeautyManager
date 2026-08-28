/**
 * Verificação de execução em ambiente local / seguro
 */
export function isLocalEnvironment(): boolean {
  if (typeof window === 'undefined') return true
  const hostname = window.location.hostname
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.')
  )
}

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
