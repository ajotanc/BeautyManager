import { ref, computed } from 'vue'

export function useMarkupCalculator(
  initialCost: number | null = null,
  initialMargin: number | null = null,
  initialSelling: number | null = null
) {
  const costPrice = ref<number | null>(initialCost)
  const profitMargin = ref<number | null>(initialMargin)

  const manualSellingPrice = ref<number | null>(
    initialSelling
  )

  const sellingPrice = computed<number | null>({
    get() {
      /*
       * Se existe preço informado manualmente,
       * ele tem prioridade.
       */
      if (manualSellingPrice.value !== null) {
        return manualSellingPrice.value
      }

      /*
       * Sem custo ou margem não existe cálculo.
       */
      if (
        costPrice.value === null ||
        profitMargin.value === null
      ) {
        return null
      }

      if (costPrice.value <= 0) {
        return null
      }

      return Number(
        (
          costPrice.value *
          (1 + profitMargin.value / 100)
        ).toFixed(2)
      )
    },

    set(value: number | null) {
      manualSellingPrice.value = value

      /*
       * Usuário apagou o preço.
       */
      if (value === null) {
        return
      }

      /*
       * Calcula a margem somente se existe custo.
       */
      if (
        costPrice.value === null ||
        costPrice.value <= 0
      ) {
        return
      }

      const calculatedMargin =
        ((value - costPrice.value) /
          costPrice.value) *
        100

      profitMargin.value =
        Number(calculatedMargin.toFixed(2))
    }
  })

  const profitAmount = computed<number>(() => {
    if (
      costPrice.value === null ||
      sellingPrice.value === null
    ) {
      return 0
    }

    return Number(
      Math.max(
        0,
        sellingPrice.value - costPrice.value
      ).toFixed(2)
    )
  })

  function setCostPrice(
    value: number | null
  ): void {
    costPrice.value = value

    /*
     * Mudou o custo:
     * o preço manual deixa de existir.
     *
     * Assim o sellingPrice passa a ser calculado
     * automaticamente pela margem.
     */
    manualSellingPrice.value = null
  }

  function setProfitMargin(
    value: number | null
  ): void {
    profitMargin.value = value

    /*
     * Mudou a margem:
     * remove o preço manual para permitir
     * que o computed faça o cálculo.
     */
    manualSellingPrice.value = null
  }

  function reset(
    cost: number | null = null,
    margin: number | null = null,
    selling: number | null = null
  ): void {
    costPrice.value = cost
    profitMargin.value = margin
    manualSellingPrice.value = selling
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