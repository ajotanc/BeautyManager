import { ref } from 'vue'

export function useThermalPrinter() {
  const isPrinting = ref<boolean>(false)

  function printReceipt(): Promise<boolean> {
    return new Promise((resolve) => {
      isPrinting.value = true
      document.body.classList.add('is-printing-thermal')
      document.body.classList.remove('is-printing-labels')

      window.addEventListener(
        'afterprint',
        () => {
          document.body.classList.remove('is-printing-thermal')
        },
        { once: true }
      )

      setTimeout(() => {
        try {
          window.print()
          isPrinting.value = false
          resolve(true)
        } catch {
          document.body.classList.remove('is-printing-thermal')
          isPrinting.value = false
          resolve(false)
        }
      }, 150)
    })
  }

  return {
    isPrinting,
    printReceipt
  }
}
