import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ICashRegister, ICashMovement } from '@/types/cashRegister'
import { cashRegister } from '@/services/cashRegister'
import { toNumber } from '@/utils/currency'

export const useCashRegisterStore = defineStore('cashRegister', () => {
  const currentRegister = ref<ICashRegister | null>(null)
  const history = ref<ICashRegister[]>([])
  const isLoading = ref<boolean>(false)

  const isRegisterOpen = computed<boolean>(() => currentRegister.value?.status === 'open')

  const currentExpectedBalance = computed<number>(() => {
    if (!currentRegister.value) return 0
    const op = toNumber(currentRegister.value.opening_balance)
    const ti = toNumber(currentRegister.value.total_in)
    const to = toNumber(currentRegister.value.total_out)
    const balance = op + ti - to
    return Number(balance.toFixed(2))
  })

  async function checkActiveRegister(): Promise<ICashRegister | null> {
    isLoading.value = true
    try {
      const reg = await cashRegister.getOpenRegister()
      currentRegister.value = reg
      return reg
    } finally {
      isLoading.value = false
    }
  }

  async function fetchHistory(): Promise<void> {
    isLoading.value = true
    try {
      history.value = await cashRegister.listHistory()
    } finally {
      isLoading.value = false
    }
  }

  async function openRegister(dto: Partial<ICashRegister>): Promise<ICashRegister> {
    isLoading.value = true
    try {
      const reg = await cashRegister.openRegister(dto)
      currentRegister.value = reg
      return reg
    } finally {
      isLoading.value = false
    }
  }

  async function closeRegister(dto: Partial<ICashRegister>): Promise<ICashRegister> {
    if (!currentRegister.value) {
      throw new Error('Nenhum caixa aberto para fechar.')
    }
    isLoading.value = true
    try {
      const reg = await cashRegister.closeRegister(currentRegister.value.$id, dto)
      currentRegister.value = null
      await fetchHistory()
      return reg
    } finally {
      isLoading.value = false
    }
  }

  async function recordMovement(movement: ICashMovement): Promise<ICashRegister> {
    if (!currentRegister.value) {
      throw new Error('Nenhum caixa aberto para registrar movimentação.')
    }
    isLoading.value = true
    try {
      const reg = await cashRegister.recordCashMovement(currentRegister.value.$id, movement)
      currentRegister.value = reg
      return reg
    } finally {
      isLoading.value = false
    }
  }

  async function addCashSale(amount: number | string): Promise<void> {
    if (!currentRegister.value) return
    const reg = await cashRegister.addCashSale(currentRegister.value.$id, amount)
    currentRegister.value = reg
  }

  return {
    currentRegister,
    history,
    isLoading,
    isRegisterOpen,
    expectedBalance: currentExpectedBalance,
    currentExpectedBalance,
    checkActiveRegister,
    fetchHistory,
    openRegister,
    closeRegister,
    recordMovement,
    addCashSale
  }
})
