import { describe, expect, it } from 'vitest'
import { appendNote, NOTES_MAX_LENGTH } from './notes'

const line = (i: number): string => `\n[10:${String(i).padStart(2, '0')}:00] Sangria: R$ 10.00 - troco para o dia ${i}`

describe('appendNote', () => {
  it('acrescenta quando cabe', () => {
    expect(appendNote('a', '\nb')).toBe('a\nb')
    expect(appendNote(null, 'x')).toBe('x')
  })

  it('nunca passa do limite da coluna, mesmo depois de 100 lançamentos', () => {
    let notes = ''
    for (let i = 0; i < 100; i++) notes = appendNote(notes, line(i))
    expect(notes.length).toBeLessThanOrEqual(NOTES_MAX_LENGTH)
  })

  it('mantém as linhas mais recentes e começa numa linha inteira', () => {
    let notes = ''
    for (let i = 0; i < 100; i++) notes = appendNote(notes, line(i))
    expect(notes.endsWith('dia 99')).toBe(true)
    expect(notes.startsWith('\n[')).toBe(true)
    expect(notes).not.toContain('dia 0\n')
  })
})
