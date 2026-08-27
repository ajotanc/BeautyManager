import { onMounted, onUnmounted } from 'vue'

export interface BarcodeScannerOptions {
  onScan: (barcode: string) => void
  maxDelayMs?: number
  minChars?: number
  enabled?: () => boolean
}

/**
 * Composable para escuta global do Leitor de Código de Barras USB em modo emulação de teclado
 */
export function useBarcodeScanner(options: BarcodeScannerOptions) {
  const maxDelay = options.maxDelayMs ?? 60
  const minChars = options.minChars ?? 3

  let buffer: string = ''
  let lastKeyTime: number = 0

  function handleKeyDown(event: KeyboardEvent): void {
    if (options.enabled && !options.enabled()) {
      return
    }

    const currentTime = Date.now()
    const timeDiff = currentTime - lastKeyTime

    // Se o tempo entre teclas for maior que maxDelay, reinicia o buffer
    if (timeDiff > maxDelay && buffer.length > 0) {
      buffer = ''
    }

    lastKeyTime = currentTime

    if (event.key === 'Enter') {
      if (buffer.length >= minChars) {
        event.preventDefault()
        options.onScan(buffer)
        buffer = ''
      }
      return
    }

    // Apenas caracteres alfanuméricos e traços
    if (event.key.length === 1) {
      buffer += event.key
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })

  return {
    clearBuffer: () => {
      buffer = ''
    }
  }
}
