import { formatPaymentMethod, type ISale } from '@/types/sale'
import type { ISettings, ReceiptWidth } from '@/types/storeSettings'
import type { IProduct } from '@/types/product'
import { formatCurrency, toNumber } from './currency'
import { formatDateTime } from './date'
import { getReceiptQr } from './receipt'

/** Cabeça térmica a 203 dpi (8 pontos por mm). Úteis: 384 (58 mm) e 576 (80 mm). */
const PAPER_DOTS: Record<ReceiptWidth, number> = { '58mm': 384, '80mm': 576 }
/** Fonte A da impressora: 12 pontos por caractere. */
const DOTS_PER_CHAR = 12

/** Largura útil em pontos pela configuração da loja; o agente pode informar a medida real da cabeça. */
export function paperDotsFor(width: ReceiptWidth | undefined): number {
  return PAPER_DOTS[width ?? '58mm'] ?? PAPER_DOTS['58mm']
}

/** Remove acentos (ç→c, ã→a, º→o): a impressora recebe só ASCII e não depende de página de código. */
export function encodeText(text: string): number[] {
  return Array.from(text.normalize('NFKD'))
    .filter((ch) => {
      const code = ch.charCodeAt(0)
      return code < 0x300 || code > 0x36f // descarta as marcas de acento combinadas
    })
    .map((ch) => (ch.charCodeAt(0) < 0x80 ? ch.charCodeAt(0) : 0x3f))
}

/** `native`: texto da impressora, sem acentos (ç→c). `image`: texto desenhado, com acentos. */
export type TextMode = 'native' | 'image'

export class EscPosBuilder {
  private bytes: number[] = []
  private centered = false
  private boldOn = false

  constructor(
    private paperDots = 384,
    /** Pontos em branco à esquerda, para centralizar quando a cabeça fica deslocada no papel. */
    private leftMargin = 0,
    private textMode: TextMode = 'native'
  ) {}

  /** Largura útil do conteúdo: a margem esquerda fica dentro da largura total da cabeça. */
  private get area(): number {
    return this.paperDots - this.leftMargin
  }

  raw(...data: number[]): this {
    this.bytes.push(...data)
    return this
  }

  /** Reseta e desliga o modo chinês/GBK (FS .). */
  init(): this {
    return this.raw(0x1b, 0x40, 0x1c, 0x2e)
  }

  /** O alinhamento do texto é calculado por linha (posição absoluta); só o QR usa ESC a. */
  align(mode: 'left' | 'center'): this {
    this.centered = mode === 'center'
    return this
  }

  /** Linha de texto nativo (sem acentos) no alinhamento atual da impressora (ESC a). */
  plain(text: string): this {
    return this.raw(...encodeText(text), 0x0a)
  }

  bold(on: boolean): this {
    this.boldOn = on
    return this.raw(0x1b, 0x45, on ? 1 : 0)
  }

  /** Texto nativo (sem acentos) ou imagem, conforme o modo. ESC $ posiciona em pontos: aplica a margem e centraliza sem ESC a. */
  line(text = ''): this {
    if (this.textMode === 'image') return this.imageLine(text)
    // Linha vazia: só a quebra de linha. Um ESC $ logo após o QR nativo desloca o código e ele não é lido.
    if (!text) return this.raw(0x0a)
    const bytes = encodeText(text)
    const x = this.leftMargin + (this.centered ? Math.max(0, Math.floor((this.area - bytes.length * DOTS_PER_CHAR) / 2)) : 0)
    return this.raw(0x1b, 0x24, x & 0xff, x >> 8, ...bytes, 0x0a)
  }

  /** Linha desenhada em fonte monoespaçada (12 pontos por caractere), mantendo as colunas alinhadas. */
  private imageLine(text: string): this {
    const lineHeight = 28
    const canvas = document.createElement('canvas')
    canvas.width = this.area
    canvas.height = lineHeight
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, lineHeight)
    if (text.trim()) {
      this.setMonoFont(ctx, this.boldOn)
      ctx.fillStyle = '#000'
      ctx.textBaseline = 'middle'
      ctx.textAlign = this.centered ? 'center' : 'left'
      ctx.fillText(text, this.centered ? this.area / 2 : 0, lineHeight / 2 + 1)
    }
    return this.raster(canvas)
  }

  /** Fonte monoespaçada com 12 pontos por caractere, igual à largura da fonte nativa. */
  private setMonoFont(ctx: CanvasRenderingContext2D, bold: boolean): void {
    const family = 'Consolas, "Courier New", monospace'
    const weight = bold ? 'bold ' : ''
    ctx.font = `${weight}100px ${family}`
    ctx.font = `${weight}${Math.floor(DOTS_PER_CHAR / (ctx.measureText('M').width / 100))}px ${family}`
  }

  /**
   * Avança o papel com quebras de linha (1 linha = 30 pontos). Não usa ESC J: logo após uma imagem
   * (GS v 0), vários modelos reimprimem as últimas linhas dela ao receber ESC J.
   */
  feed(dots: number): this {
    return this.raw(...Array<number>(Math.ceil(dots / 30)).fill(0x0a))
  }

  cut(): this {
    return this.feed(40).raw(0x1d, 0x56, 0x01)
  }

  /** QR nativo da impressora (GS ( k), nível M, centralizado. */
  qr(payload: string, moduleSize = 5): this {
    const data = encodeText(payload)
    const len = data.length + 3
    return this.raw(0x1b, 0x61, 0x01, 0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00)
      .raw(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, moduleSize)
      .raw(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31)
      .raw(0x1d, 0x28, 0x6b, len & 0xff, len >> 8, 0x31, 0x50, 0x30, ...data)
      .raw(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30, 0x1b, 0x61, 0x00)
  }

  /** Imagem com a margem esquerda configurada. */
  raster(canvas: HTMLCanvasElement): this {
    if (this.leftMargin <= 0) return this.rasterRaw(canvas)
    const wide = document.createElement('canvas')
    wide.width = canvas.width + this.leftMargin
    wide.height = canvas.height
    const ctx = wide.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, wide.width, wide.height)
    ctx.drawImage(canvas, this.leftMargin, 0)
    return this.rasterRaw(wide)
  }

  /** Imagem 1 bit (GS v 0) em uma só faixa (até 255 linhas), sem emendas entre comandos. */
  private rasterRaw(canvas: HTMLCanvasElement): this {
    const ctx = canvas.getContext('2d')!
    const { width, height } = canvas
    const bytesPerRow = Math.ceil(width / 8)
    const pixels = ctx.getImageData(0, 0, width, height).data
    for (let top = 0; top < height; top += 255) {
      const rows = Math.min(255, height - top)
      this.raw(0x1d, 0x76, 0x30, 0x00, bytesPerRow & 0xff, bytesPerRow >> 8, rows & 0xff, rows >> 8)
      for (let y = top; y < top + rows; y++) {
        for (let bx = 0; bx < bytesPerRow; bx++) {
          let byte = 0
          for (let bit = 0; bit < 8; bit++) {
            const x = bx * 8 + bit
            if (x >= width) continue
            const i = (y * width + x) * 4
            const luminance = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114
            if (pixels[i + 3] > 127 && luminance < 128) byte |= 0x80 >> bit
          }
          this.bytes.push(byte)
        }
      }
    }
    return this
  }

  build(): Uint8Array {
    return Uint8Array.from(this.bytes)
  }
}

function wrap(text: string, cols: number): string[] {
  const lines: string[] = []
  for (let rest = text.trim(); rest.length > 0;) {
    lines.push(rest.slice(0, cols))
    rest = rest.slice(cols)
  }
  return lines.length > 0 ? lines : ['']
}

function pair(left: string, right: string, cols: number): string {
  const room = cols - right.length - 1
  return `${left.slice(0, Math.max(0, room)).padEnd(Math.max(0, room))} ${right}`
}

interface ReceiptPayload {
  sale?: ISale | null
  settings?: Partial<ISettings> | null
  changeAmount?: number
  /** Largura útil real em pontos (do agente). Sem ela, usa a largura da bobina das configurações. */
  paperDots?: number
  /** Margem esquerda em pontos (do agente). */
  leftMargin?: number
  textMode?: TextMode
}

interface ReceiptLine {
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
  components?: { name: string; quantity: number }[]
}

const SAMPLE_LINES: ReceiptLine[] = [
  { name: 'Batom Matte Rosa Luxo', quantity: 1, unitPrice: 29.9, subtotal: 29.9 },
  { name: 'Máscara de Cílios Volume', quantity: 1, unitPrice: 39.9, subtotal: 39.9 },
  { name: 'Esmalte Gel Efeito Brilho', quantity: 2, unitPrice: 8.5, subtotal: 17 }
]

function toReceiptLines(sale?: ISale | null): ReceiptLine[] {
  if (!sale?.items?.length) return SAMPLE_LINES
  const lines: ReceiptLine[] = []
  const kits = new Map<string, ReceiptLine>()
  for (const item of sale.items) {
    if (!item.kit) {
      lines.push({
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: toNumber(item.unit_price),
        subtotal: toNumber(item.subtotal)
      })
      continue
    }
    let kit = kits.get(item.kit.$id)
    if (!kit) {
      kit = { name: item.kit.name, quantity: 1, unitPrice: 0, subtotal: 0, components: [] }
      kits.set(item.kit.$id, kit)
      lines.push(kit)
    }
    kit.unitPrice += toNumber(item.subtotal)
    kit.subtotal += toNumber(item.subtotal)
    kit.components!.push({ name: item.product.name, quantity: item.quantity })
  }
  return lines
}

/** Cupom não fiscal em texto ESC/POS, espelhando o ThermalReceipt.vue. */
export function buildReceiptEscPos({ sale, settings, changeAmount = 0, paperDots, leftMargin = 0, textMode }: ReceiptPayload): Uint8Array {
  const width: ReceiptWidth = settings?.receipt_width === '80mm' ? '80mm' : '58mm'
  const dots = paperDots ?? paperDotsFor(width)
  const cols = Math.floor((dots - leftMargin) / DOTS_PER_CHAR)
  const rule = '-'.repeat(cols)
  const strong = '='.repeat(cols)
  const lines = toReceiptLines(sale)
  const discount = toNumber(sale?.discount_amount)
  const total = sale ? toNumber(sale.total_amount) : lines.reduce((acc, l) => acc + l.subtotal, 0)
  const subtotal = sale ? total + discount : total

  const b = new EscPosBuilder(dots, leftMargin, textMode).init().align('center').bold(true)
  wrap(settings?.store_name || 'BEAUTY MANAGER COSMÉTICOS', cols).forEach((l) => b.line(l))
  b.bold(false)
  if (settings?.document_number) b.line(`CNPJ: ${settings.document_number}`)
  if (settings?.address) wrap(settings.address, cols).forEach((l) => b.line(l))
  if (settings?.phone) b.line(`WhatsApp: ${settings.phone}`)
  if (settings?.instagram) b.line(`Instagram: ${settings.instagram}`)
  b.line(strong).bold(true).line('** CUPOM NÃO FISCAL **').bold(false).line(strong)

  b.align('left')
  b.line(`DATA: ${formatDateTime(sale?.$createdAt || new Date().toISOString())}`)
  b.line(`CUPOM: ${sale?.$id ? `#${sale.$id.slice(-6).toUpperCase()}` : '#PREVIEW'}`)
  wrap(`CLIENTE: ${sale?.customer_name || 'Consumidor Final'}`, cols).forEach((l) => b.line(l))
  b.line(rule)

  for (const item of lines) {
    b.bold(true)
    wrap(item.name, cols).forEach((l) => b.line(l))
    b.bold(false)
    b.line(pair(`${item.quantity}x ${formatCurrency(item.unitPrice)}`, formatCurrency(item.subtotal), cols))
    item.components?.forEach((c) => b.line(`  - ${c.quantity}x ${c.name}`.slice(0, cols)))
  }
  b.line(rule)

  b.line(pair('SUBTOTAL:', formatCurrency(subtotal), cols))
  if (discount > 0) b.line(pair('DESCONTO:', `- ${formatCurrency(discount)}`, cols))
  b.bold(true).line(pair('TOTAL PAGO:', formatCurrency(total), cols)).bold(false)
  b.line(pair('FORMA PAGTO:', sale?.payment_method ? formatPaymentMethod(sale.payment_method) : 'PIX / Dinheiro', cols))
  if (changeAmount > 0) b.line(pair('TROCO:', formatCurrency(changeAmount), cols))
  b.line(strong)

  if (settings?.show_qrcode) {
    const qr = getReceiptQr(settings)
    b.align('center').bold(true).line(qr.label).bold(false).line().qr(qr.payload, dots >= 512 ? 7 : 5).line()
    b.line('Aponte a câmera do seu celular').line(strong)
  }

  b.align('center')
  wrap(settings?.receipt_footer || 'Obrigada pela preferência! Volte sempre!', cols).forEach((l) => b.line(l))
  return b.cut().build()
}

/** EAN-13 válido: 13 dígitos e dígito verificador correto (pesos 1 e 3). */
export function isEan13(v: string): boolean {
  if (!/^[0-9]{13}$/.test(v)) return false
  const sum = Array.from(v.slice(0, 12)).reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0)
  return (10 - (sum % 10)) % 10 === Number(v[12])
}

/**
 * Código de barras para GS k. EAN-13 válido usa o formato próprio da impressora (tipo 67, 95 módulos, permite barra
 * mais larga); o resto vai em CODE128 (tipo 73): pares de dígitos no conjunto C (mais curto), o resto no conjunto B.
 * `modules` é a largura total em módulos, para escolher a barra mais larga que cabe no papel.
 */
export function barcode(value: string): { type: number; bytes: number[]; modules: number } {
  const v = value.trim()
  if (isEan13(v)) return { type: 67, bytes: Array.from(v, (d) => d.charCodeAt(0)), modules: 95 }
  const digits = /^[0-9]+$/.test(v) ? v.length - (v.length % 2) : 0
  if (digits === 0) {
    return { type: 73, bytes: [0x7b, 0x42, ...Array.from(v, (ch) => ch.charCodeAt(0) & 0x7f)], modules: 11 * (v.length + 2) + 2 }
  }
  const bytes = [0x7b, 0x43]
  for (let i = 0; i < digits; i += 2) bytes.push(Number(v.slice(i, i + 2)))
  if (v.length > digits) bytes.push(0x7b, 0x42, v.charCodeAt(v.length - 1))
  const symbols = 1 + digits / 2 + (v.length > digits ? 2 : 0) + 1 // início + dados + (troca de conjunto + dígito) + verificador
  return { type: 73, bytes, modules: 11 * symbols + 2 }
}

/** Texto sem acentos (normalize) para a impressora. */
const toAscii = (text: string): string => String.fromCharCode(...encodeText(text))

/** Quebra os pedaços em linhas de até `cols` colunas, sem partir um pedaço (o preço fica inteiro). */
function wrapTokens(tokens: string[], cols: number): string[] {
  const lines: string[] = []
  let current = ''
  for (const token of tokens) {
    const attempt = current ? `${current} ${token}` : token
    if (!current || attempt.length <= cols) current = attempt
    else {
      lines.push(current)
      current = token
    }
  }
  lines.push(current)
  return lines
}

/**
 * "NOME DO PRODUTO - R$ 0,01" em maiúsculo e sem acentos, em até 2 linhas. Se não couber, o nome é encurtado
 * com "..." (o preço nunca é cortado).
 */
export function labelTitle(name: string, price: string, cols: number): string[] {
  const words = toAscii(name.toUpperCase()).trim().split(/\s+/)
  const tail = ['-', toAscii(price)]
  let cut = false
  const tokens = (): string[] => [...words.slice(0, -1), words[words.length - 1] + (cut ? '...' : ''), ...tail]
  while (words.length > 1 && wrapTokens(tokens(), cols).length > 2) {
    words.pop()
    cut = true
  }
  return wrapTokens(tokens(), cols)
}

/**
 * Etiquetas em texto nativo usando a largura inteira do papel: "NOME - R$ 0,00" em até 2 linhas, linha em branco,
 * código de barras grande com o número embaixo e uma linha tracejada de corte. Sem imagens.
 */
export function buildLabelsEscPos(products: IProduct[], paperDots: number, leftMargin = 0): Uint8Array {
  const area = paperDots - leftMargin
  const cols = Math.floor(area / DOTS_PER_CHAR)
  const cutLine = '- '.repeat(Math.floor(cols / 2)).trim()
  const b = new EscPosBuilder(paperDots, leftMargin).init()
  // Margem esquerda e área de impressão (GS L / GS W); ESC a 1 centraliza dentro dela.
  if (leftMargin > 0) b.raw(0x1d, 0x4c, leftMargin & 0xff, leftMargin >> 8, 0x1d, 0x57, area & 0xff, area >> 8)
  b.raw(0x1b, 0x61, 0x01)

  for (const product of products) {
    b.bold(true)
    labelTitle(product.name, formatCurrency(product.selling_price), cols).forEach((text) => b.plain(text))
    b.bold(false).plain('')
    const code = product.barcode ? barcode(String(product.barcode)) : null
    if (code) {
      // Barra o mais larga possível (2 a 6 pontos, o máximo da impressora) que ainda cabe no papel; altura 64.
      const bar = Math.max(2, Math.min(6, Math.floor(area / code.modules)))
      b.raw(0x1d, 0x68, 64, 0x1d, 0x77, bar, 0x1d, 0x48, 2, 0x1d, 0x66, 0, 0x1d, 0x6b, code.type, code.bytes.length, ...code.bytes, 0x0a) // a impressora já avança após o código; este LF dá a linha em branco antes da linha de corte
    }
    b.plain(cutLine).plain('')
  }
  return b.feed(60).build()
}
