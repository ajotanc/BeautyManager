import { onMounted, onUnmounted } from 'vue'

export interface PosShortcutHandlers {
  onSearchProduct?: () => void     // F1
  onCheckout?: () => void          // F4
  onCancelOrClose?: () => void     // Escape
}

export function usePosKeyboardShortcuts(handlers: PosShortcutHandlers) {
  function handleKeyDown(event: KeyboardEvent): void {
    // F1 - Foco na Busca / Scanner
    if (event.key === 'F1') {
      event.preventDefault()
      handlers.onSearchProduct?.()
      return
    }

    // F4 - Finalizar Venda (Abrir Modal de Pagamento)
    if (event.key === 'F4') {
      event.preventDefault()
      handlers.onCheckout?.()
      return
    }

    // Escape - Cancelar / Fechar Modais
    if (event.key === 'Escape') {
      handlers.onCancelOrClose?.()
      return
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })
}
