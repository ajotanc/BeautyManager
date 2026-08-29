import { computed, type Ref } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'

export function useLoyalty(customerTotalPurchases: Ref<number>) {
  const settingsStore = useSettingsStore()

  // Retorna a meta configurada, ou 2 por padrão, ou 0 se desativado
  const milestoneTarget = computed(() => settingsStore.settings?.loyalty_milestone || 2)

  const isLoyaltyEnabled = computed(() => milestoneTarget.value > 0)

  // A próxima compra será a (atual + 1). Se o resto for 0, é uma compra premiada!
  const isNextPurchaseMilestone = computed(() => {
    if (!isLoyaltyEnabled.value) return false
    
    const nextPurchase = Number(customerTotalPurchases.value || 0) + 1
    return nextPurchase % milestoneTarget.value === 0
  })

  // Quantas compras faltam para atingir a próxima meta
  const purchasesUntilGift = computed(() => {
    if (!isLoyaltyEnabled.value) return 0
    
    const nextPurchase = Number(customerTotalPurchases.value || 0) + 1
    const remainder = nextPurchase % milestoneTarget.value
    
    if (remainder === 0) return 0 // Está na compra premiada!
    return milestoneTarget.value - remainder
  })

  // Qual a meta que está sendo atingida ou a próxima (ex: 10, 20, 30)
  const nextMilestoneNumber = computed(() => {
    if (!isLoyaltyEnabled.value) return 0
    const nextPurchase = Number(customerTotalPurchases.value || 0) + 1
    return nextPurchase + purchasesUntilGift.value
  })

  return {
    isLoyaltyEnabled,
    isNextPurchaseMilestone,
    purchasesUntilGift,
    nextMilestoneNumber,
    milestoneTarget
  }
}
