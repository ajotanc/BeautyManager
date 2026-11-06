import { ref } from 'vue'
import type { TextMode } from '@/utils/escpos'

export type PrintDestination = 'browser' | 'thermal'

/** Agente local (public/print-agent) que recebe ESC/POS e imprime em segundo plano. */
const AGENT_URL = 'http://127.0.0.1:9101'
const STORAGE_KEY = 'print_destination'

function loadDestination(): PrintDestination | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'thermal' || value === 'browser' ? value : null
  } catch {
    return null
  }
}

// Estado compartilhado entre telas: a escolha vale para cupom e etiquetas.
// Sem escolha salva, o padrão vira "térmica" assim que o agente local responde.
const storedDestination = loadDestination()
let hasExplicitChoice = storedDestination !== null
const destination = ref<PrintDestination>(storedDestination ?? 'browser')
const agentOnline = ref<boolean>(false)
const agentPrinter = ref<string | null>(null)
// Largura útil da cabeça em pontos, medida no agente (null = usar a largura da bobina das configurações).
const agentPaperDots = ref<number | null>(null)
const agentLeftMargin = ref<number>(0)
const agentTextMode = ref<TextMode>('native')

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

export function usePrintAgent() {
  function setDestination(value: PrintDestination): void {
    hasExplicitChoice = true
    destination.value = value
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // armazenamento indisponível: vale só nesta sessão
    }
  }

  async function checkAgent(): Promise<boolean> {
    try {
      const res = await fetch(`${AGENT_URL}/status`, { signal: AbortSignal.timeout(1500) })
      const data = await res.json()
      agentOnline.value = Boolean(data.ok)
      agentPrinter.value = data.printer ?? null
      if (Number.isInteger(data.paper_dots) && data.paper_dots > 0) agentPaperDots.value = data.paper_dots
      if (data.text_mode === 'native' || data.text_mode === 'image') agentTextMode.value = data.text_mode
      if (Number.isInteger(data.left_margin_dots) && data.left_margin_dots >= 0) agentLeftMargin.value = data.left_margin_dots
      if (agentOnline.value && !hasExplicitChoice) destination.value = 'thermal'
    } catch {
      agentOnline.value = false
      agentPrinter.value = null
    }
    return agentOnline.value
  }

  /** Envia bytes ESC/POS ao agente; lança erro com a causa quando falha. */
  async function sendToAgent(bytes: Uint8Array): Promise<void> {
    let res: Response
    try {
      res = await fetch(`${AGENT_URL}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: toBase64(bytes) }),
        signal: AbortSignal.timeout(15000)
      })
    } catch {
      agentOnline.value = false
      throw new Error('Agente de impressão não encontrado. Verifique se o serviço está em execução e se este site está em "Sites autorizados" do agente.')
    }
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.ok) {
      throw new Error(data.error === 'printer_not_found' ? 'Impressora térmica não encontrada no Windows.' : `Falha ao imprimir (${data.error || res.status}).`)
    }
  }

  /**
   * Lê o /status do agente antes de imprimir (chamada local, rápida): traz a configuração atual (largura, margem,
   * modo) e pega o agente que subiu depois da página. Com "navegador" escolhido, nem consulta.
   */
  function ready(): Promise<boolean> {
    if (hasExplicitChoice && destination.value === 'browser') return Promise.resolve(false)
    return checkAgent()
  }
  ready()

  return { destination, agentOnline, agentPrinter, agentPaperDots, agentLeftMargin, agentTextMode, setDestination, checkAgent, sendToAgent, ready }
}
