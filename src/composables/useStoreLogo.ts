import { onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { LogoService } from '@/services/logo'

/** URL local da logo da loja (ou null sem logo / se não carregar), para exibir no cupom em tela. */
export function useStoreLogo(fileId: Ref<string | null | undefined>) {
  const url = ref<string | null>(null)

  function release(): void {
    if (url.value) URL.revokeObjectURL(url.value)
    url.value = null
  }

  watch(
    fileId,
    async (id) => {
      release()
      if (!id) return
      try {
        const blobUrl = URL.createObjectURL(await LogoService.blob(id))
        if (fileId.value === id) url.value = blobUrl
        else URL.revokeObjectURL(blobUrl)
      } catch (error) {
        console.error('Erro ao carregar a logo:', error)
      }
    },
    { immediate: true }
  )
  onBeforeUnmount(release)

  return url
}
