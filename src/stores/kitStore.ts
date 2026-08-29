import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { IKit, IKitItem } from '@/types/kit'
import { KitService } from '@/services/kits'
import { parseErrorMessage } from '@/types/errors'
import { useProductStore } from './productStore'

export const useKitStore = defineStore('kits', () => {
  const kits = ref<IKit[]>([])
  const isLoading = ref<boolean>(false)
  const productStore = useProductStore()

  const activeKits = computed<IKit[]>(() => {
    return kits.value.filter((kit) => kit.is_active)
  })

  async function fetchKits(): Promise<void> {
    isLoading.value = true
    try {
      kits.value = await KitService.list()
    } catch (error: unknown) {
      console.error('Erro ao carregar kits:', parseErrorMessage(error))
    } finally {
      isLoading.value = false
    }
  }

  function getAvailableStock(kit: IKit): number {
    if (!kit.items || kit.items.length === 0) return 0

    let minPossible = Infinity

    for (const item of kit.items) {
      if (!item.product) continue

      const productInStore = productStore.products.find((p) => p.$id === item.product.$id)
      const currentStock = productInStore ? productInStore.stock_quantity : (item.product.stock_quantity ?? 0)
      const requiredQty = Number(item.quantity) || 1

      const possibleForThisItem = Math.floor(Math.max(0, currentStock) / requiredQty)
      if (possibleForThisItem < minPossible) {
        minPossible = possibleForThisItem
      }
    }

    return minPossible === Infinity ? 0 : minPossible
  }

  async function saveKit(data: Partial<IKit> & { items?: IKitItem[] }): Promise<IKit> {
    isLoading.value = true
    try {
      const savedKit = await KitService.saveKit(data)
      const index = kits.value.findIndex((k) => k.$id === savedKit.$id)
      if (index !== -1) {
        kits.value[index] = savedKit
      } else {
        kits.value.unshift(savedKit)
      }
      return savedKit
    } catch (error: unknown) {
      console.error('Erro ao salvar kit:', parseErrorMessage(error))
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function toggleStatus(kit: IKit): Promise<void> {
    const newStatus = !kit.is_active
    try {
      await KitService.toggleActive(kit.$id, newStatus)
      kit.is_active = newStatus
    } catch (error: unknown) {
      console.error('Erro ao alternar status do kit:', parseErrorMessage(error))
      throw error
    }
  }

  async function removeKit(kit: IKit): Promise<void> {
    isLoading.value = true
    try {
      await KitService.delete(kit.$id)
      kits.value = kits.value.filter((k) => k.$id !== kit.$id)
    } catch (error: unknown) {
      console.error('Erro ao excluir kit:', parseErrorMessage(error))
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function findByBarcode(barcode: string): Promise<IKit | null> {
    const trimmed = barcode.trim()
    if (!trimmed) return null

    const foundLocal = kits.value.find((k) => k.barcode === trimmed)
    if (foundLocal) return foundLocal

    return await KitService.byBarcode(trimmed)
  }

  return {
    kits,
    activeKits,
    isLoading,
    fetchKits,
    getAvailableStock,
    saveKit,
    toggleStatus,
    removeKit,
    findByBarcode
  }
})
