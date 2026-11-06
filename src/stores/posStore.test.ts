import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { IKit } from '@/types/kit'
import type { IProduct } from '@/types/product'

const mocks = vi.hoisted(() => ({
  createSale: vi.fn(async (data: Record<string, unknown>) => ({ ...data, $id: 'sale-1' })),
  recordPurchase: vi.fn(async () => undefined),
  addCashSale: vi.fn(async () => undefined),
  decrementStock: vi.fn(),
  register: { isRegisterOpen: true, currentRegister: { $id: 'reg-1' } as { $id: string } | null }
}))

vi.mock('@/services/sales', () => ({ sales: { createSale: mocks.createSale } }))
vi.mock('@/services/products', () => ({ products: {} }))
vi.mock('@/services/kits', () => ({ kits: {} }))
vi.mock('@/services/customers', () => ({ CustomerService: { recordPurchase: mocks.recordPurchase } }))
vi.mock('@/stores/authStore', () => ({ useAuthStore: () => ({ currentUser: { $id: 'user-1' } }) }))
vi.mock('@/stores/cashRegisterStore', () => ({
  useCashRegisterStore: () => ({ ...mocks.register, addCashSale: mocks.addCashSale })
}))
vi.mock('@/stores/productStore', () => ({ useProductStore: () => ({ decrementStock: mocks.decrementStock }) }))

const { usePosStore } = await import('./posStore')

const product = (id: string, price: number) => ({ $id: id, name: id, selling_price: price }) as unknown as IProduct
type SaleItem = { subtotal: string }
const lastSale = () => mocks.createSale.mock.calls[mocks.createSale.mock.calls.length - 1][0] as unknown as { items: SaleItem[]; total_amount: string; discount_amount: string }

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  mocks.register.isRegisterOpen = true
  mocks.register.currentRegister = { $id: 'reg-1' }
})

describe('checkout', () => {
  it('recusa carrinho vazio e caixa fechado', async () => {
    const pos = usePosStore()
    await expect(pos.checkout()).rejects.toThrow(/vazio/)
    pos.addToCart(product('p1', 10))
    mocks.register.isRegisterOpen = false
    await expect(pos.checkout()).rejects.toThrow(/fechado/)
    expect(mocks.createSale).not.toHaveBeenCalled()
  })

  it('se o caixa falhar depois da venda salva, limpa o carrinho (senão o próximo clique duplica a venda)', async () => {
    const pos = usePosStore()
    pos.addToCart(product('p1', 10))
    pos.selectedPaymentMethod = 'cash'
    mocks.addCashSale.mockRejectedValueOnce(new Error('rede caiu'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const sale = await pos.checkout()

    expect(sale.$id).toBe('sale-1')
    expect(pos.cart).toHaveLength(0)
    expect(mocks.createSale).toHaveBeenCalledTimes(1)
  })

  it('se atualizar o cliente falhar depois da venda salva, também limpa o carrinho', async () => {
    const pos = usePosStore()
    pos.addToCart(product('p1', 10))
    pos.selectedCustomer = { $id: 'c1', total_purchases: 1 } as never
    mocks.recordPurchase.mockRejectedValueOnce(new Error('rede caiu'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await pos.checkout()

    expect(pos.cart).toHaveLength(0)
  })

  it('o desconto gravado nunca passa do subtotal', async () => {
    const pos = usePosStore()
    pos.addToCart(product('p1', 30))
    pos.discount = 100
    await pos.checkout()
    expect(lastSale().discount_amount).toBe('30.00')
    expect(lastSale().total_amount).toBe('0.00')
  })

  it('o kit é rateado nos componentes e fecha exatamente no valor do kit', async () => {
    const pos = usePosStore()
    const kit = {
      $id: 'k1',
      name: 'Kit',
      selling_price: 12.34,
      items: [
        { product: product('a', 10), quantity: 1 },
        { product: product('b', 5), quantity: 1 }
      ]
    } as unknown as IKit
    pos.addKitToCart(kit, 3)
    await pos.checkout()
    const total = lastSale().items.reduce((sum, item) => sum + Number(item.subtotal), 0)
    expect(total.toFixed(2)).toBe('37.02') // 3 x 12,34
  })

  it('venda em dinheiro soma no caixa; pix não', async () => {
    const pos = usePosStore()
    pos.addToCart(product('p1', 10))
    pos.selectedPaymentMethod = 'cash'
    await pos.checkout()
    expect(mocks.addCashSale).toHaveBeenCalledWith(10)

    mocks.addCashSale.mockClear()
    pos.addToCart(product('p1', 10))
    pos.selectedPaymentMethod = 'pix'
    await pos.checkout()
    expect(mocks.addCashSale).not.toHaveBeenCalled()
  })
})
