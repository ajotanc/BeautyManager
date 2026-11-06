import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const status = { ok: true, printer: 'KNUP KP-IM607', paper_dots: 384, left_margin_dots: 16, text_mode: 'native' }

function stubBrowser(stored: string | null, agent: { ok: boolean; body?: unknown } | 'offline') {
  const store: Record<string, string> = stored ? { print_destination: stored } : {}
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => void (store[k] = v)
  })
  const fetchMock = vi.fn(async () => {
    if (agent === 'offline') throw new TypeError('Failed to fetch')
    return { ok: agent.ok, json: async () => agent.body ?? status } as Response
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

// O estado do composable é do módulo: reimporta a cada teste.
async function load() {
  vi.resetModules()
  return (await import('./usePrintAgent')).usePrintAgent()
}

beforeEach(() => vi.useRealTimers())
afterEach(() => vi.unstubAllGlobals())

describe('usePrintAgent', () => {
  it('sem escolha salva e com o agente no ar, o destino padrão vira térmica', async () => {
    stubBrowser(null, { ok: true })
    const agent = await load()
    await agent.ready()
    expect(agent.destination.value).toBe('thermal')
    expect(agent.agentPaperDots.value).toBe(384)
    expect(agent.agentLeftMargin.value).toBe(16)
  })

  it('sem escolha salva e agente fora do ar, continua no navegador', async () => {
    stubBrowser(null, 'offline')
    const agent = await load()
    await agent.ready()
    expect(agent.destination.value).toBe('browser')
    expect(agent.agentOnline.value).toBe(false)
  })

  it('escolha "navegador" salva vale sempre e nem consulta o agente ao imprimir', async () => {
    const fetchMock = stubBrowser('browser', { ok: true })
    const agent = await load()
    fetchMock.mockClear()
    await agent.ready()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(agent.destination.value).toBe('browser')
  })

  it('agente que sobe depois da página é pego na próxima impressão', async () => {
    const offline = stubBrowser(null, 'offline')
    const agent = await load()
    await agent.ready()
    expect(agent.destination.value).toBe('browser')
    offline.mockImplementation(async () => ({ ok: true, json: async () => status }) as Response)
    await agent.ready()
    expect(agent.destination.value).toBe('thermal')
  })

  it('escolher o destino grava no navegador e passa a valer', async () => {
    stubBrowser(null, { ok: true })
    const agent = await load()
    agent.setDestination('browser')
    expect(localStorage.getItem('print_destination')).toBe('browser')
    await agent.ready()
    expect(agent.destination.value).toBe('browser')
  })

  it('sendToAgent explica quando o agente não responde', async () => {
    stubBrowser('thermal', 'offline')
    const agent = await load()
    await expect(agent.sendToAgent(new Uint8Array([1]))).rejects.toThrow(/Agente de impressão não encontrado/)
  })

  it('sendToAgent explica quando a impressora não existe', async () => {
    stubBrowser('thermal', { ok: false, body: { ok: false, error: 'printer_not_found' } })
    const agent = await load()
    await expect(agent.sendToAgent(new Uint8Array([1]))).rejects.toThrow(/Impressora térmica não encontrada/)
  })

  it('sendToAgent manda os bytes em base64', async () => {
    const fetchMock = stubBrowser('thermal', { ok: true, body: { ok: true } })
    const agent = await load()
    fetchMock.mockClear()
    await agent.sendToAgent(new Uint8Array([0x1b, 0x40]))
    const call = fetchMock.mock.calls[0] as unknown as [string, { body: string }]
    expect(JSON.parse(call[1].body)).toEqual({ data: 'G0A=' })
  })
})
