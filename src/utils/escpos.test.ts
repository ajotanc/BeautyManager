import { describe, expect, it } from 'vitest'
import type { IProduct } from '@/types/product'
import type { ISettings } from '@/types/storeSettings'
import { barcode, buildLabelsEscPos, buildReceiptEscPos, EscPosBuilder, isEan13, labelTitle, paperDotsFor } from './escpos'

const ascii = (bytes: Uint8Array): string => Array.from(bytes, (b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : b === 0x0a ? '\n' : '·')).join('')
const has = (bytes: Uint8Array, seq: number[]): boolean => ascii(bytes).length > 0 && Array.from(bytes).some((_, i) => seq.every((v, j) => bytes[i + j] === v))
const product = (name: string, code: string, price = 6.99): IProduct => ({ name, barcode: code, selling_price: price }) as unknown as IProduct

describe('texto sem acentos (normalize)', () => {
  it('troca ç, ã, á, º por ASCII', () => {
    const out = ascii(new EscPosBuilder().plain('laço NÃO Ação 1º').build())
    expect(out).toBe('laco NAO Acao 1o\n')
  })

  it('troca o que não tem equivalente por ?', () => {
    expect(ascii(new EscPosBuilder().plain('a–b').build())).toBe('a?b\n')
  })
})

describe('EscPosBuilder', () => {
  it('avança o papel com quebras de linha, nunca com ESC J', () => {
    const bytes = new EscPosBuilder().feed(60).build()
    expect(Array.from(bytes)).toEqual([0x0a, 0x0a])
  })

  it('posiciona a linha com a margem esquerda (ESC $)', () => {
    const bytes = new EscPosBuilder(384, 24).line('AB').build()
    expect(Array.from(bytes.slice(0, 4))).toEqual([0x1b, 0x24, 24, 0])
  })

  it('centraliza dentro da área útil (largura menos margem)', () => {
    // área = 384 - 24 = 360; "AB" ocupa 24 pontos; sobra 336 / 2 = 168; mais a margem 24 = 192
    const bytes = new EscPosBuilder(384, 24).align('center').line('AB').build()
    expect(bytes[2] | (bytes[3] << 8)).toBe(192)
  })

  it('linha vazia é só a quebra de linha (ESC $ após o QR desloca o código)', () => {
    expect(Array.from(new EscPosBuilder().line('').build())).toEqual([0x0a])
  })

  it('o QR nativo guarda o conteúdo e manda imprimir', () => {
    const bytes = new EscPosBuilder().qr('https://x.com').build()
    expect(ascii(bytes)).toContain('https://x.com')
    expect(has(bytes, [0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30])).toBe(true)
  })
})

describe('código de barras', () => {
  it('reconhece EAN-13 válido pelo dígito verificador', () => {
    expect(isEan13('7891234567895')).toBe(true)
    expect(isEan13('7891234567890')).toBe(false)
    expect(isEan13('789123456789')).toBe(false)
    expect(isEan13('abc')).toBe(false)
  })

  it('EAN-13 válido usa o formato nativo (tipo 67, 95 módulos)', () => {
    expect(barcode('7891234567895')).toMatchObject({ type: 67, modules: 95 })
  })

  it('números pares vão em CODE128 conjunto C (pares de dígitos)', () => {
    expect(barcode('0005')).toMatchObject({ type: 73, bytes: [0x7b, 0x43, 0, 5] })
  })

  it('número ímpar troca para o conjunto B no último dígito', () => {
    expect(barcode('12345').bytes).toEqual([0x7b, 0x43, 12, 34, 0x7b, 0x42, 0x35])
  })

  it('texto vai em CODE128 conjunto B', () => {
    expect(barcode('AB12')).toMatchObject({ type: 73, bytes: [0x7b, 0x42, 0x41, 0x42, 0x31, 0x32] })
  })
})

describe('título da etiqueta', () => {
  it('"NOME - R$ 0,00" em maiúsculo e sem acentos', () => {
    expect(labelTitle('laço infantil', 'R$ 6,99', 32)).toEqual(['LACO INFANTIL - R$ 6,99'])
  })

  it('usa até 2 linhas e o preço nunca é cortado nem separado', () => {
    const lines = labelTitle('Kit Hidratante Facial Premium Anti-idade Noite e Dia com Vitamina C 200ml', 'R$ 129,90', 32)
    expect(lines.length).toBeLessThanOrEqual(2)
    expect(lines.every((l) => l.length <= 32)).toBe(true)
    expect(lines[lines.length - 1]).toMatch(/\.\.\. - R\$ 129,90$/)
  })

  it('o nome curto cabe sem reticências', () => {
    expect(labelTitle('Presilha', 'R$ 0,01', 32)).toEqual(['PRESILHA - R$ 0,01'])
  })
})

describe('etiquetas', () => {
  it('EAN-13 usa a barra mais larga que cabe no papel de 384 pontos', () => {
    const bytes = buildLabelsEscPos([product('A', '7891234567895')], 384)
    const widthCmd = Array.from(bytes).findIndex((_, i) => bytes[i] === 0x1d && bytes[i + 1] === 0x77)
    expect(bytes[widthCmd + 2]).toBe(4) // 95 módulos x 4 = 380 <= 384
  })

  it('barra nunca passa de 6 nem de 2 para baixo', () => {
    const wide = buildLabelsEscPos([product('A', '0005')], 384)
    const i = Array.from(wide).findIndex((_, k) => wide[k] === 0x1d && wide[k + 1] === 0x77)
    expect(wide[i + 2]).toBe(6)
  })

  it('sem código de barras não imprime o comando de código', () => {
    const bytes = buildLabelsEscPos([product('A', '')], 384)
    expect(has(bytes, [0x1d, 0x6b])).toBe(false)
  })

  it('não usa ESC J (reimprime linhas) nem imagem (GS v 0)', () => {
    const bytes = buildLabelsEscPos([product('A', '7891234567895'), product('B', '0005')], 384)
    expect(has(bytes, [0x1b, 0x4a])).toBe(false)
    expect(has(bytes, [0x1d, 0x76, 0x30])).toBe(false)
  })

  it('aplica a margem esquerda com GS L e GS W', () => {
    const bytes = buildLabelsEscPos([product('A', '0005')], 384, 24)
    expect(has(bytes, [0x1d, 0x4c, 24, 0, 0x1d, 0x57, 104, 1])).toBe(true) // área 360 = 0x0168
  })
})

describe('cupom', () => {
  const settings = { store_name: 'Loja Beleza', receipt_width: '58mm', show_qrcode: true, qrcode_type: 'instagram', instagram: '@loja' } as Partial<ISettings>

  it('sai em texto sem acentos, com QR e corte', () => {
    const bytes = buildReceiptEscPos({ settings })
    const text = ascii(bytes)
    expect(text).toContain('CUPOM NAO FISCAL')
    expect(text).toContain('INSTAGRAM DA LOJA')
    expect(has(bytes, [0x1d, 0x56, 0x01])).toBe(true)
    expect(has(bytes, [0x1b, 0x4a])).toBe(false)
  })

  it('o título do QR é seguido por uma linha em branco e o QR (sem ESC $ no meio)', () => {
    const text = ascii(buildReceiptEscPos({ settings }))
    // título, ESC E 0 (negrito off), linha em branco (só LF), ESC a 1 do QR
    expect(text).toMatch(/INSTAGRAM DA LOJA\n·E·\n·a·/)
  })

  it('nome do produto em maiúsculas e só uma linha em branco antes do corte', () => {
    const sale = { total_amount: 10, items: [{ quantity: 1, unit_price: 10, subtotal: 10, product: { name: 'batom rosa' } }] }
    const bytes = buildReceiptEscPos({ settings: { receipt_width: '58mm' }, sale } as never)
    expect(ascii(bytes)).toContain('BATOM ROSA')
    const cut = bytes.length - 3 // GS V 1 é o fim do cupom
    expect(Array.from(bytes.slice(cut))).toEqual([0x1d, 0x56, 0x01])
    expect(Array.from(bytes.slice(cut - 2, cut))).toEqual([0x0a, 0x0a]) // LF da última linha + 1 de avanço
    expect(bytes[cut - 3]).not.toBe(0x0a)
  })

  it('usa a largura do agente quando informada', () => {
    const narrow = ascii(buildReceiptEscPos({ settings, paperDots: 384 }))
    const wide = ascii(buildReceiptEscPos({ settings, paperDots: 576 }))
    expect(wide.match(/={32,}/)).not.toBeNull()
    expect(narrow.match(/={33,}/)).toBeNull()
  })
})

describe('paperDotsFor', () => {
  it('58 mm = 384 pontos, 80 mm = 576, padrão 384', () => {
    expect(paperDotsFor('58mm')).toBe(384)
    expect(paperDotsFor('80mm')).toBe(576)
    expect(paperDotsFor(undefined)).toBe(384)
  })
})
