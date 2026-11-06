import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useVueToPrint } from 'vue-to-print'
import thermalPrintCss from '@/assets/styles/thermalPrint.css?inline'
import { buildReceiptEscPos, paperDotsFor } from '@/utils/escpos'
import { LogoService } from '@/services/logo'
import { logoToCanvas } from '@/utils/logo'
import { usePrintAgent } from './usePrintAgent'
import type { ISale } from '@/types/sale'
import type { ISettings } from '@/types/storeSettings'

export interface ReceiptPrintData {
  sale?: ISale | null
  settings?: Partial<ISettings> | null
  changeAmount?: number
}

export function useThermalPrinter() {
  const isPrinting = ref<boolean>(false)
  const toast = useToast()
  const { destination, sendToAgent, ready, agentPaperDots, agentLeftMargin, agentTextMode } = usePrintAgent()

  const { handlePrint } = useVueToPrint({
    content: () => document.getElementById('thermal-receipt-print-area'),
    documentTitle: 'Cupom_Nao_Fiscal',
    copyStyles: false,
    pageStyle: thermalPrintCss
  })

  /** Sem logo ou se ela não carregar, o cupom sai normal: a logo nunca bloqueia a venda. */
  async function loadLogo(fileId: string | null | undefined, area: number): Promise<HTMLCanvasElement | null> {
    if (!fileId) return null
    try {
      return await logoToCanvas(await LogoService.blob(fileId), area)
    } catch (error) {
      console.error('Logo fora do cupom:', error)
      return null
    }
  }

  /** Com destino "térmica" imprime direto pelo agente local; senão abre o diálogo do navegador. */
  async function printReceipt(data?: ReceiptPrintData): Promise<boolean> {
    isPrinting.value = true
    try {
      await ready()
      if (destination.value === 'thermal' && data) {
        const dots = agentPaperDots.value ?? paperDotsFor(data.settings?.receipt_width)
        const logo = await loadLogo(data.settings?.logo_id, dots - agentLeftMargin.value)
        await sendToAgent(buildReceiptEscPos({ ...data, paperDots: dots, leftMargin: agentLeftMargin.value, textMode: agentTextMode.value, logo }))
      } else {
        handlePrint()
      }
      return true
    } catch (err: unknown) {
      console.error('Erro ao imprimir cupom térmico:', err)
      toast.add({
        severity: 'error',
        summary: 'Erro na impressão',
        detail: err instanceof Error ? err.message : 'Não foi possível imprimir o cupom.',
        life: 4000
      })
      return false
    } finally {
      isPrinting.value = false
    }
  }

  return {
    isPrinting,
    printReceipt
  }
}
