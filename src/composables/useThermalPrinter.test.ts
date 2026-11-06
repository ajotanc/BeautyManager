import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ handlePrint: vi.fn(), toastAdd: vi.fn() }))
vi.mock('vue-to-print', () => ({ useVueToPrint: () => ({ handlePrint: mocks.handlePrint }) }))
vi.mock('primevue/usetoast', () => ({ useToast: () => ({ add: mocks.toastAdd }) }))
vi.mock('@/assets/styles/thermalPrint.css?inline', () => ({ default: '' }))

const status = { ok: true, printer: 'KNUP KP-IM607', paper_dots: 384, left_margin_dots: 0, text_mode: 'native' }

/** Navegador falso: destino salvo, resposta do agente em /status e em /print. */
function stub(stored: string | null, print: { ok: boolean; body: unknown } = { ok: true, body: { ok: true } }) {
  const store: Record<string, string> = stored ? { print_destination: stored } : {}
  vi.stubGlobal('localStorage', { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => void (store[k] = v) })
  const fetchMock = vi.fn(async (url: string) => {
    if (url.endsWith('/status')) return { ok: true, json: async () => status } as Response
    return { ok: print.ok, json: async () => print.body } as Response
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function load() {
  vi.resetModules() // o estado do agente é do módulo
  return (await import('./useThermalPrinter')).useThermalPrinter()
}
const printCalls = (fetchMock: ReturnType<typeof stub>) => fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/print'))

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})
afterEach(() => vi.unstubAllGlobals())

describe('printReceipt', () => {
  it('destino "navegador": abre a janela de impressão e não fala com o agente', async () => {
    const fetchMock = stub('browser')
    const { printReceipt } = await load()
    expect(await printReceipt({ settings: { receipt_width: '58mm' } })).toBe(true)
    expect(mocks.handlePrint).toHaveBeenCalledTimes(1)
    expect(printCalls(fetchMock)).toHaveLength(0)
  })

  it('destino "térmica" (agente no ar): envia ao agente e não abre a janela', async () => {
    const fetchMock = stub(null)
    const { printReceipt } = await load()
    expect(await printReceipt({ settings: { receipt_width: '58mm' } })).toBe(true)
    expect(printCalls(fetchMock)).toHaveLength(1)
    expect(mocks.handlePrint).not.toHaveBeenCalled()
  })

  it('sem dados do cupom, cai na janela do navegador mesmo na térmica', async () => {
    stub('thermal')
    const { printReceipt } = await load()
    await printReceipt()
    expect(mocks.handlePrint).toHaveBeenCalledTimes(1)
  })

  it('se o agente falhar, avisa o usuário e devolve false (sem imprimir na impressora errada)', async () => {
    stub('thermal', { ok: false, body: { ok: false, error: 'printer_not_found' } })
    const { printReceipt, isPrinting } = await load()
    expect(await printReceipt({ settings: {} })).toBe(false)
    expect(mocks.toastAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: expect.stringMatching(/Impressora térmica não encontrada/) }))
    expect(mocks.handlePrint).not.toHaveBeenCalled()
    expect(isPrinting.value).toBe(false)
  })
})
