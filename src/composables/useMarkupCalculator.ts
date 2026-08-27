import { ref, computed, reactive } from 'vue'

export interface IFieldError {
  invalid: boolean
  message: string
}

export interface IPricingErrors {
  costPrice: IFieldError
  profitMargin: IFieldError
  sellingPrice: IFieldError
}

export function useMarkupCalculator(
  initialCost: number | null = null,
  initialMargin: number | null = null,
  initialSelling: number | null = null
) {
  const costPrice = ref<number | null>(initialCost)
  const profitMargin = ref<number | null>(initialMargin)
  const manualSellingPrice = ref<number | null>(initialSelling)

  const errors = reactive<IPricingErrors>({
    costPrice: { invalid: false, message: '' },
    profitMargin: { invalid: false, message: '' },
    sellingPrice: { invalid: false, message: '' }
  })

  const sellingPrice = computed<number | null>({
    get() {
      if (manualSellingPrice.value !== null) {
        return manualSellingPrice.value
      }

      if (
        costPrice.value === null ||
        profitMargin.value === null ||
        costPrice.value <= 0
      ) {
        return null
      }

      return Number(
        (costPrice.value * (1 + profitMargin.value / 100)).toFixed(2)
      )
    },
    set(value: number | null) {
      setSellingPrice(value)
    }
  })

  const profitAmount = computed<number>(() => {
    if (costPrice.value === null || sellingPrice.value === null) {
      return 0
    }

    return Number(
      Math.max(0, sellingPrice.value - costPrice.value).toFixed(2)
    )
  })

  function validate(): boolean {
    const isCostInvalid = costPrice.value === null || costPrice.value < 0
    errors.costPrice.invalid = isCostInvalid
    errors.costPrice.message = isCostInvalid ? 'Preço de custo é obrigatório' : ''

    const isMarginInvalid = profitMargin.value === null || profitMargin.value < 0
    errors.profitMargin.invalid = isMarginInvalid
    errors.profitMargin.message = isMarginInvalid ? 'Margem de lucro é obrigatória' : ''

    const isSellingInvalid = sellingPrice.value === null || sellingPrice.value <= 0
    errors.sellingPrice.invalid = isSellingInvalid
    errors.sellingPrice.message = isSellingInvalid ? 'Preço de venda é obrigatório' : ''

    return !errors.costPrice.invalid && !errors.profitMargin.invalid && !errors.sellingPrice.invalid
  }

  function setCostPrice(value: number | null): void {
    costPrice.value = value
    manualSellingPrice.value = null
    validate()
  }

  function setProfitMargin(value: number | null): void {
    profitMargin.value = value
    manualSellingPrice.value = null
    validate()
  }

  function setSellingPrice(value: number | null): void {
    manualSellingPrice.value = value

    if (value !== null && costPrice.value !== null && costPrice.value > 0) {
      const calculatedMargin =
        ((value - costPrice.value) / costPrice.value) * 100
      profitMargin.value = Number(calculatedMargin.toFixed(2))
    }

    validate()
  }

  function reset(
    cost: number | null = null,
    margin: number | null = null,
    selling: number | null = null
  ): void {
    costPrice.value = cost
    profitMargin.value = margin
    manualSellingPrice.value = selling
    errors.costPrice.invalid = false
    errors.costPrice.message = ''
    errors.profitMargin.invalid = false
    errors.profitMargin.message = ''
    errors.sellingPrice.invalid = false
    errors.sellingPrice.message = ''
  }

  const isValid = computed<boolean>(() => {
    return (
      costPrice.value !== null &&
      costPrice.value >= 0 &&
      profitMargin.value !== null &&
      profitMargin.value >= 0 &&
      sellingPrice.value !== null &&
      sellingPrice.value > 0
    )
  })

  return {
    costPrice,
    profitMargin,
    sellingPrice,
    profitAmount,
    errors,
    isValid,
    setCostPrice,
    setProfitMargin,
    setSellingPrice,
    validate,
    reset
  }
}