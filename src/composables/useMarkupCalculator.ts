import { ref, computed } from 'vue'

export function useMarkupCalculator(
  initialCost: number = 0,
  initialMargin: number = 0,
  initialSelling: number = 0
) {
  const costPrice = ref<number>(initialCost)
  const profitMargin = ref<number>(initialMargin)
  const manualSellingPrice = ref<number | null>(initialSelling > 0 ? initialSelling : null)

  const sellingPrice = computed({
    get: () => {
      if (manualSellingPrice.value !== null) return manualSellingPrice.value
      if (costPrice.value <= 0) return 0
      return Number((costPrice.value * (1 + profitMargin.value / 100)).toFixed(2))
    },
    set: (newValue: number) => {
      manualSellingPrice.value = newValue
      if (costPrice.value > 0) {
        const calculatedMargin = ((newValue - costPrice.value) / costPrice.value) * 100
        profitMargin.value = Number(calculatedMargin.toFixed(2))
      }
    }
  })

  const profitAmount = computed<number>(() => {
    return Number(Math.max(0, sellingPrice.value - costPrice.value).toFixed(2))
  })

  function setCostPrice(cost: number): void {
    costPrice.value = cost
    if (manualSellingPrice.value !== null && cost > 0) {
      profitMargin.value = Number((((manualSellingPrice.value - cost) / cost) * 100).toFixed(2))
    }
  }

  function setProfitMargin(margin: number): void {
    manualSellingPrice.value = null
    profitMargin.value = margin
  }

  function reset(cost: number = 0, margin: number = 0, selling: number = 0): void {
    costPrice.value = cost
    profitMargin.value = margin
    manualSellingPrice.value = selling > 0 ? selling : null
  }

  return {
    costPrice,
    profitMargin,
    sellingPrice,
    profitAmount,
    setCostPrice,
    setProfitMargin,
    reset
  }
}
