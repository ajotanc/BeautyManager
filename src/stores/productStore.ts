import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { products } from '@/services/products'
import { categories } from '@/services/categories'
import { brands } from '@/services/brands'
import type { IProduct } from '@/types/product'
import type { ICategory } from '@/types/category'
import type { IBrand } from '@/types/brand'
import { isExpiringSoon } from '@/utils/date'

export const useProductStore = defineStore('products', () => {
  const productList = ref<IProduct[]>([])
  const categoryList = ref<ICategory[]>([])
  const brandList = ref<IBrand[]>([])
  const isLoading = ref<boolean>(false)

  const lowStockProducts = computed<IProduct[]>(() => {
    return productList.value.filter((p) => p.stock_quantity <= p.min_stock_alert)
  })

  const expiringProducts = computed<IProduct[]>(() => {
    return productList.value.filter((p) => isExpiringSoon(p.expiry_date, 60))
  })

  const quickSaleProducts = computed<IProduct[]>(() => {
    return productList.value.filter((p) => p.is_quick_sale)
  })

  async function fetchAll(): Promise<void> {
    isLoading.value = true
    try {
      const [prods, cats, brs] = await Promise.all([
        products.list(),
        categories.list(),
        brands.list()
      ])
      productList.value = prods
      categoryList.value = cats
      brandList.value = brs
    } finally {
      isLoading.value = false
    }
  }

  async function saveProduct(dto: Partial<IProduct>): Promise<IProduct> {
    const saved = await products.upsert(dto.$id, dto)
    const index = productList.value.findIndex((p) => p.$id === saved.$id)
    if (index !== -1) {
      productList.value[index] = saved
    } else {
      productList.value.unshift(saved)
    }
    return saved
  }

  async function deleteProduct(id: string): Promise<void> {
    await products.delete(id)
    productList.value = productList.value.filter((p) => p.$id !== id)
  }

  function updateStock(productId: string, newQuantity: number): void {
    const prod = productList.value.find((p) => p.$id === productId)
    if (prod) {
      prod.stock_quantity = newQuantity
    }
  }

  function decrementStock(productId: string, quantity: number): void {
    const prod = productList.value.find((p) => p.$id === productId)
    if (prod) {
      prod.stock_quantity = Math.max(0, prod.stock_quantity - quantity)
    }
  }

  function incrementStock(productId: string, quantity: number): void {
    const prod = productList.value.find((p) => p.$id === productId)
    if (prod) {
      prod.stock_quantity += quantity
    }
  }

  return {
    products: productList,
    categories: categoryList,
    brands: brandList,
    lowStockProducts,
    expiringProducts,
    quickSaleProducts,
    isLoading,
    fetchAll,
    saveProduct,
    deleteProduct,
    updateStock,
    decrementStock,
    incrementStock
  }
})
