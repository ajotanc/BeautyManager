/** Limite da coluna `notes` (cash_register e customers) no Appwrite. */
export const NOTES_MAX_LENGTH = 1024

/**
 * Acrescenta uma linha às notas sem passar do limite da coluna: as linhas mais antigas saem primeiro,
 * as mais recentes ficam (senão o Appwrite recusa a gravação e o lançamento se perde).
 */
export function appendNote(current: string | null | undefined, line: string, max: number = NOTES_MAX_LENGTH): string {
  const combined = (current || '') + line
  if (combined.length <= max) return combined
  const tail = combined.slice(-max)
  const firstBreak = tail.indexOf('\n')
  // começa numa linha inteira, quando der
  return firstBreak > 0 && firstBreak < tail.length - 1 ? tail.slice(firstBreak) : tail
}
