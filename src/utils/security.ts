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
