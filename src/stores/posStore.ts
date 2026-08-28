import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ICartItem, PaymentMethod, ISale, ISaleItem } from '@/types/sale'
import type { IProduct } from '@/types/product'
import type { ICustomer } from '@/types/customer'
import { sales } from '@/services/sales'
import { products } from '@/services/products'
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
    const existingIndex = cart.value.findIndex((item) => item.product.$id === product.$id)
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

  async function addByBarcode(barcode: string): Promise<boolean> {
    const trimmed = barcode.trim()
    if (!trimmed) return false

    const product = await products.getByBarcode(trimmed)
    if (product) {
      addToCart(product, 1)
      return true
    }
    return false
  }

  function updateQuantity(productId: string, quantity: number): void {
    const index = cart.value.findIndex((item) => item.product.$id === productId)
    if (index !== -1) {
      if (quantity <= 0) {
        removeFromCart(productId)
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

  function removeFromCart(productId: string): void {
    cart.value = cart.value.filter((item) => item.product.$id !== productId)
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
      const saleItems = cart.value.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        unit_price: toDecimalString(item.unit_price),
        subtotal: toDecimalString(item.subtotal)
      } as ISaleItem))

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

      // Se houver cliente cadastrado selecionado, atualiza o histórico direto pelo $id
      if (selectedCustomer.value?.$id) {
        await CustomerService.recordPurchase(selectedCustomer.value, "purchase");
      }

      // Se o pagamento for em dinheiro, atualiza o total_in do caixa
      if (selectedPaymentMethod.value === 'cash' && cashRegisterStore.currentRegister) {
        await cashRegisterStore.addCashSale(totalAmount.value)
      }

      // Atualiza o estoque local no productStore imediatamente sem fazer requisição de rede
      for (const item of cart.value) {
        productStore.decrementStock(item.product.$id, item.quantity)
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
    addByBarcode,
    updateQuantity,
    removeFromCart,
    clearCart,
    checkout
  }
})
