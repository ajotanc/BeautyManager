import { ref, onMounted, onBeforeUnmount, watch, type Ref } from 'vue'

export interface DragScrollOptions {
  /**
   * Direção permitida para a rolagem
   * @default 'both'
   */
  direction?: 'vertical' | 'horizontal' | 'both'
  /**
   * Fator multiplicador da velocidade de rolagem
   * @default 1.2
   */
  speed?: number
  /**
   * Seletor CSS para ignorar o início do arraste (ex: inputs, botões)
   */
  ignoredSelectors?: string
}

/**
 * Composable para permitir arrastar e rolar contêineres com overflow (Drag-to-Scroll)
 */
export function useDragScroll(
  containerRef: Ref<HTMLElement | null>,
  options: DragScrollOptions = {}
) {
  const {
    direction = 'both',
    speed = 1.2,
    ignoredSelectors = 'input, button, select, textarea, a, [role="button"]'
  } = options

  const isDragging = ref<boolean>(false)
  let isMouseDown = false
  let startX = 0
  let startY = 0
  let initialScrollLeft = 0
  let initialScrollTop = 0
  let hasMoved = false

  function isIgnoredElement(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLElement)) return false
    return target.closest(ignoredSelectors) !== null
  }

  function handleMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return // Apenas botão esquerdo
    if (isIgnoredElement(e.target)) return

    const container = containerRef.value
    if (!container) return

    isMouseDown = true
    hasMoved = false
    startX = e.pageX
    startY = e.pageY
    initialScrollLeft = container.scrollLeft
    initialScrollTop = container.scrollTop

    window.addEventListener('mousemove', handleMouseMove, { passive: false })
    window.addEventListener('mouseup', handleMouseUp)
  }

  function handleMouseMove(e: MouseEvent): void {
    if (!isMouseDown) return
    const container = containerRef.value
    if (!container) return

    const deltaX = e.pageX - startX
    const deltaY = e.pageY - startY

    // Limiar mínimo para diferenciar clique simples de arraste (drag)
    if (!hasMoved && (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4)) {
      hasMoved = true
      isDragging.value = true
      container.classList.add('is-dragging')
      document.body.style.userSelect = 'none'
    }

    if (hasMoved) {
      e.preventDefault()

      if (direction === 'horizontal' || direction === 'both') {
        container.scrollLeft = initialScrollLeft - deltaX * speed
      }
      if (direction === 'vertical' || direction === 'both') {
        container.scrollTop = initialScrollTop - deltaY * speed
      }
    }
  }

  function handleMouseUp(): void {
    isMouseDown = false
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
    document.body.style.userSelect = ''

    const container = containerRef.value
    if (container) {
      container.classList.remove('is-dragging')
    }

    // Pequeno atraso para não disparar cliques imediatos se houve arraste
    setTimeout(() => {
      isDragging.value = false
      hasMoved = false
    }, 50)
  }

  // Permite vincular quando o ref mudar (ex: v-if com template ref)
  watch(
    containerRef,
    (newEl, oldEl) => {
      if (oldEl) {
        oldEl.removeEventListener('mousedown', handleMouseDown)
      }
      if (newEl) {
        newEl.addEventListener('mousedown', handleMouseDown)
      }
    },
    { immediate: true }
  )

  onMounted(() => {
    const container = containerRef.value
    if (container) {
      container.addEventListener('mousedown', handleMouseDown)
    }
  })

  onBeforeUnmount(() => {
    const container = containerRef.value
    if (container) {
      container.removeEventListener('mousedown', handleMouseDown)
    }
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
    document.body.style.userSelect = ''
  })

  return {
    isDragging
  }
}
