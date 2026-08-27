import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { CustomerService } from '@/services/customers'
import type { ICustomer } from '@/types/customer'
import { dayjs } from '@/utils/date'

export const useCustomerStore = defineStore('customers', () => {
  const customerList = ref<ICustomer[]>([])
  const isLoading = ref<boolean>(false)

  /**
   * Clientes que fazem aniversário hoje
   */
  const birthdaysToday = computed<ICustomer[]>(() => {
    const todayStr = dayjs().format('DD/MM')
    return customerList.value.filter((c) => {
      if (!c.birth_date) return false
      const parsed = dayjs(c.birth_date, ['DD/MM/YYYY', 'DD/MM', 'YYYY-MM-DD'], true)
      if (!parsed.isValid()) {
        const fallback = dayjs(c.birth_date)
        return fallback.isValid() && fallback.format('DD/MM') === todayStr
      }
      return parsed.format('DD/MM') === todayStr
    })
  })

  /**
   * Clientes que fazem aniversário no mês atual
   */
  const birthdaysThisMonth = computed<ICustomer[]>(() => {
    const currentMonth = dayjs().month()
    return customerList.value.filter((c) => {
      if (!c.birth_date) return false
      const parsed = dayjs(c.birth_date, ['DD/MM/YYYY', 'DD/MM', 'YYYY-MM-DD'], true)
      if (!parsed.isValid()) {
        const fallback = dayjs(c.birth_date)
        return fallback.isValid() && fallback.month() === currentMonth
      }
      return parsed.month() === currentMonth
    })
  })

  const totalCustomers = computed<number>(() => customerList.value.length)

  async function fetchAll(search?: string): Promise<void> {
    isLoading.value = true
    try {
      customerList.value = await CustomerService.list(search)
    } finally {
      isLoading.value = false
    }
  }

  async function saveCustomer(dto: Partial<ICustomer>): Promise<ICustomer> {
    const saved = await CustomerService.upsert(dto.$id, dto)
    const index = customerList.value.findIndex((c) => c.$id === saved.$id)
    if (index !== -1) {
      customerList.value[index] = saved
    } else {
      customerList.value.unshift(saved)
    }
    return saved
  }

  async function deleteCustomer(id: string): Promise<void> {
    await CustomerService.delete(id)
    customerList.value = customerList.value.filter((c) => c.$id !== id)
  }

  return {
    customerList,
    isLoading,
    birthdaysToday,
    birthdaysThisMonth,
    totalCustomers,
    fetchAll,
    saveCustomer,
    deleteCustomer
  }
})
