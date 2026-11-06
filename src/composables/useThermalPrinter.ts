import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useVueToPrint } from 'vue-to-print'
import thermalPrintCss from '@/assets/styles/thermalPrint.css?inline'
import { buildReceiptEscPos } from '@/utils/escpos'
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

  /** Com destino "térmica" imprime direto pelo agente local; senão abre o diálogo do navegador. */
  async function printReceipt(data?: ReceiptPrintData): Promise<boolean> {
    isPrinting.value = true
    try {
      await ready()
      if (destination.value === 'thermal' && data) {
        await sendToAgent(buildReceiptEscPos({ ...data, paperDots: agentPaperDots.value ?? undefined, leftMargin: agentLeftMargin.value, textMode: agentTextMode.value }))
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
