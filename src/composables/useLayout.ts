import { ref } from 'vue'

const isMobileSidebarOpen = ref<boolean>(false)

export function useLayout() {
  function toggleMobileSidebar(): void {
    isMobileSidebarOpen.value = !isMobileSidebarOpen.value
  }

  function closeMobileSidebar(): void {
    isMobileSidebarOpen.value = false
  }

  function openMobileSidebar(): void {
    isMobileSidebarOpen.value = true
  }

  return {
    isMobileSidebarOpen,
    toggleMobileSidebar,
    closeMobileSidebar,
    openMobileSidebar
  }
}
