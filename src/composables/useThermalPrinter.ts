import { ref } from 'vue'
import { useVueToPrint } from 'vue-to-print'
import thermalPrintCss from '@/assets/styles/thermalPrint.css?inline'

export function useThermalPrinter() {
  const isPrinting = ref<boolean>(false)

  const { handlePrint } = useVueToPrint({
    content: () => document.getElementById('thermal-receipt-print-area'),
    documentTitle: 'Cupom_Nao_Fiscal',
    copyStyles: false,
    pageStyle: thermalPrintCss
  })

  function printReceipt(): Promise<boolean> {
    return new Promise((resolve) => {
      isPrinting.value = true
      try {
        handlePrint()
        isPrinting.value = false
        resolve(true)
      } catch (err: unknown) {
        console.error('Erro ao imprimir cupom térmico:', err)
        isPrinting.value = false
        resolve(false)
      }
    })
  }

  return {
    isPrinting,
    printReceipt
  }
}
