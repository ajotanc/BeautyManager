import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ICartItem, PaymentMethod, ISale, ISaleItem } from '@/types/sale'
import type { IProduct } from '@/types/product'
import type { IKit } from '@/types/kit'
import type { ICustomer } from '@/types/customer'
import { sales } from '@/services/sales'
import { products } from '@/services/products'
import { kits } from '@/services/kits'
import { CustomerService } from '@/services/customers'
import { useAuthStore } from './authStore'
import { useCashRegisterStore } from './cashRegisterStore'
import { useProductStore } from './productStore'
import { toDecimalString, toNumber } from '@/utils/currency'

export const usePosStore = defineStore('pos', () => {
  const cart = ref<ICartItem[]>([])
  const discount = ref<number>(0)
  const customerName = ref<string>('')
  const customerPhone = ref<string>('')
  const selectedCustomer = ref<ICustomer | null>(null)
  const selectedPaymentMethod = ref<PaymentMethod>('cash')
  const amountPaid = ref<number>(0)
  const lastCompletedSale = ref<ISale | null>(null)
  const isProcessingSale = ref<boolean>(false)

  const subtotal = computed<number>(() => {
    const sum = cart.value.reduce((acc, item) => acc + item.subtotal, 0)
    return Number(sum.toFixed(2))
  })

  const totalAmount = computed<number>(() => {
    const total = Math.max(0, subtotal.value - discount.value)
    return Number(total.toFixed(2))
  })

  const changeAmount = computed<number>(() => {
    if (selectedPaymentMethod.value !== 'cash') return 0
    const diff = amountPaid.value - totalAmount.value
    return Math.max(0, Number(diff.toFixed(2)))
  })

  const totalItemsCount = computed<number>(() => {
    return cart.value.reduce((acc, item) => acc + item.quantity, 0)
  })

  function addToCart(product: IProduct, quantity: number = 1): void {
    const priceNum = toNumber(product.selling_price)
    const existingIndex = cart.value.findIndex((item) => item.product?.$id === product.$id)
    if (existingIndex !== -1) {
      const existing = cart.value[existingIndex]
      const newQty = existing.quantity + quantity
      cart.value[existingIndex] = {
        ...existing,
        quantity: newQty,
        subtotal: Number((newQty * existing.unit_price).toFixed(2))
      }
    } else {
      cart.value.push({
        product,
        quantity,
        unit_price: priceNum,
        subtotal: Number((quantity * priceNum).toFixed(2)),
        discount: 0
      })
    }
  }

  function addKitToCart(kit: IKit, quantity: number = 1): void {
    const priceNum = toNumber(kit.selling_price)
    const existingIndex = cart.value.findIndex((item) => item.kit?.$id === kit.$id)
    if (existingIndex !== -1) {
      const existing = cart.value[existingIndex]
      const newQty = existing.quantity + quantity
      cart.value[existingIndex] = {
        ...existing,
        quantity: newQty,
        subtotal: Number((newQty * existing.unit_price).toFixed(2))
      }
    } else {
      cart.value.push({
        kit,
        quantity,
        unit_price: priceNum,
        subtotal: Number((quantity * priceNum).toFixed(2)),
        discount: 0
      })
    }
  }

  async function addByBarcode(barcode: string): Promise<boolean> {
    const trimmed = barcode.trim()
    if (!trimmed) return false

    // 1. Tenta buscar por produto avulso
    const product = await products.getByBarcode(trimmed)
    if (product) {
      addToCart(product, 1)
      return true
    }

    // 2. Se não encontrar, tenta buscar por Kit promocional
    const kit = await kits.byBarcode(trimmed)
    if (kit) {
      addKitToCart(kit, 1)
      return true
    }

    return false
  }

  function updateQuantity(rowId: string, quantity: number): void {
    const index = cart.value.findIndex((item) => (item.product?.$id === rowId) || (item.kit?.$id === rowId))
    if (index !== -1) {
      if (quantity <= 0) {
        removeFromCart(rowId)
      } else {
        const item = cart.value[index]
        cart.value[index] = {
          ...item,
          quantity,
          subtotal: Number((quantity * item.unit_price).toFixed(2))
        }
      }
    }
  }

  function removeFromCart(rowId: string): void {
    cart.value = cart.value.filter((item) => item.product?.$id !== rowId && item.kit?.$id !== rowId)
  }

  function clearCart(): void {
    cart.value = []
    discount.value = 0
    customerName.value = ''
    customerPhone.value = ''
    selectedCustomer.value = null
    amountPaid.value = 0
  }

  async function checkout(): Promise<ISale> {
    if (cart.value.length === 0) {
      throw new Error('O carrinho de compras está vazio.')
    }

    const authStore = useAuthStore()
    const cashRegisterStore = useCashRegisterStore()
    const productStore = useProductStore()

    if (!cashRegisterStore.isRegisterOpen) {
      throw new Error('O Caixa Diário está fechado. Abra o caixa antes de realizar vendas.')
    }

    isProcessingSale.value = true
    try {
      const saleItems: ISaleItem[] = []

      for (const item of cart.value) {
        if (item.product) {
          saleItems.push({
            product: item.product,
            quantity: item.quantity,
            unit_price: toDecimalString(item.unit_price),
            subtotal: toDecimalString(item.subtotal)
          } as ISaleItem)
        } else if (item.kit && item.kit.items && item.kit.items.length > 0) {
          const kitTotalOriginal = item.kit.items.reduce((acc, comp) => {
            const price = toNumber(comp.product?.selling_price)
            return acc + price * (Number(comp.quantity) || 1)
          }, 0)

          const kitSellingPrice = toNumber(item.kit.selling_price)
          const ratio = kitTotalOriginal > 0 ? (kitSellingPrice / kitTotalOriginal) : (1 / item.kit.items.length)

          let accumulatedSubtotal = 0
          const validComponents = item.kit.items.filter((comp) => comp.product)
          const totalComponents = validComponents.length

          validComponents.forEach((comp, idx) => {
            const compQty = item.quantity * (Number(comp.quantity) || 1)
            const origUnitPrice = toNumber(comp.product.selling_price)
            
            let compUnitPrice = Number((origUnitPrice * ratio).toFixed(2))
            let compSubtotal = Number((compUnitPrice * compQty).toFixed(2))

            // Ajuste de centavos no último item para fechar exatamente no valor do kit
            if (idx === totalComponents - 1) {
              const expectedTotal = item.subtotal
              const diff = Number((expectedTotal - (accumulatedSubtotal + compSubtotal)).toFixed(2))
              compSubtotal = Number((compSubtotal + diff).toFixed(2))
              compUnitPrice = compQty > 0 ? Number((compSubtotal / compQty).toFixed(2)) : compSubtotal
            } else {
              accumulatedSubtotal += compSubtotal
            }

            saleItems.push({
              product: comp.product,
              kit: item.kit, // Rastreabilidade do Kit para histórico
              quantity: compQty,
              unit_price: toDecimalString(compUnitPrice),
              subtotal: toDecimalString(compSubtotal)
            } as ISaleItem)
          })
        }
      }

      const createdSale = await sales.createSale({
        total_amount: toDecimalString(totalAmount.value),
        discount_amount: toDecimalString(discount.value),
        payment_method: selectedPaymentMethod.value,
        customer_name: customerName.value.trim() || null,
        customer_phone: customerPhone.value.trim() || null,
        status: 'completed',
        user_id: authStore.currentUser?.$id || 'anonymous',
        items: saleItems
      } as ISale)

      // Atualiza o estoque local na store para feedback instantâneo na UI
      for (const item of cart.value) {
        if (item.product) {
          productStore.decrementStock(item.product.$id, item.quantity)
        } else if (item.kit?.items) {
          for (const kitComponent of item.kit.items) {
            if (kitComponent.product?.$id) {
              const qtyToDeduct = item.quantity * (Number(kitComponent.quantity) || 1)
              productStore.decrementStock(kitComponent.product.$id, qtyToDeduct)
            }
          }
        }
      }

      if (selectedCustomer.value?.$id) {
        await CustomerService.recordPurchase(selectedCustomer.value, 'purchase')
      }

      if (selectedPaymentMethod.value === 'cash' && cashRegisterStore.currentRegister) {
        await cashRegisterStore.addCashSale(totalAmount.value)
      }

      lastCompletedSale.value = createdSale
      clearCart()
      return createdSale
    } finally {
      isProcessingSale.value = false
    }
  }

  return {
    cart,
    discount,
    customerName,
    customerPhone,
    selectedCustomer,
    selectedPaymentMethod,
    amountPaid,
    lastCompletedSale,
    isProcessingSale,
    subtotal,
    totalAmount,
    changeAmount,
    totalItemsCount,
    addToCart,
    addKitToCart,
    addByBarcode,
    updateQuantity,
    removeFromCart,
    clearCart,
    checkout
  }
})
