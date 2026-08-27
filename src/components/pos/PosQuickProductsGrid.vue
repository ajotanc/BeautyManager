<template>
  <div class="product-catalog-container glass-panel">
    <!-- Header com Abas e Filtro de Categorias -->
    <div class="catalog-header">
      <div class="catalog-title-box">
        <span class="catalog-title">
          <i class="ri-store-2-line"></i> Catálogo & Venda Rápida
        </span>
        <Tag :value="`${filteredProducts.length} itens`" severity="secondary" class="catalog-count-tag" />
      </div>

      <!-- Filtro Rápido de Categorias com Arraste Livre (Drag-to-Scroll) -->
      <div
        ref="categoryScrollRef"
        class="category-pills"
        @wheel.prevent="handleWheelScroll"
        @mousedown="startDrag"
        @mouseleave="stopDrag"
        @mouseup="stopDrag"
        @mousemove="onDrag"
      >
        <button
          type="button"
          class="pill-btn"
          :class="{ 'is-active': selectedCategory === 'ALL' }"
          @click="handleCategoryClick('ALL')"
        >
          Todos
        </button>
        <button
          type="button"
          class="pill-btn"
          :class="{ 'is-active': selectedCategory === 'QUICK' }"
          @click="handleCategoryClick('QUICK')"
        >
          <i class="ri-flashlight-line"></i> Venda Rápida
        </button>
        <button
          v-for="cat in productStore.categories"
          :key="cat.$id"
          type="button"
          class="pill-btn"
          :class="{ 'is-active': selectedCategory === cat.$id }"
          @click="handleCategoryClick(cat.$id)"
        >
          {{ cat.name }}
        </button>
      </div>
    </div>

    <!-- Lista / Grid de Produtos -->
    <div v-if="filteredProducts.length === 0" class="catalog-empty">
      <i class="ri-search-line empty-icon"></i>
      <span>Nenhum produto cadastrado nesta categoria.</span>
    </div>

    <div v-else class="catalog-grid">
      <div
        v-for="prod in filteredProducts"
        :key="prod.$id"
        class="product-card"
        :class="{ 'low-stock': prod.stock_quantity <= prod.min_stock_alert }"
        @click="posStore.addToCart(prod, 1)"
      >
        <div class="card-top">
          <span class="card-category">{{ getCategoryName(prod) }}</span>
          <span
            class="card-stock"
            :class="{ 'stock-warn': prod.stock_quantity <= prod.min_stock_alert }"
          >
            {{ prod.stock_quantity }} un.
          </span>
        </div>

        <div class="card-body">
          <span class="card-name" :title="prod.name">{{ prod.name }}</span>
          <span class="card-barcode">{{ prod.barcode }}</span>
        </div>

        <div class="card-bottom">
          <strong class="card-price font-bold">{{ formatCurrency(prod.selling_price) }}</strong>
          <button
            type="button"
            class="add-btn"
            title="Adicionar ao carrinho"
            @click.stop="posStore.addToCart(prod, 1)"
          >
            <i class="ri-add-line"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Tag from 'primevue/tag'
import { useProductStore } from '@/stores/productStore'
import { usePosStore } from '@/stores/posStore'
import type { IProduct } from '@/types/product'
import { formatCurrency } from '@/utils/currency'

const productStore = useProductStore()
const posStore = usePosStore()

const selectedCategory = ref<string>('ALL')
const categoryScrollRef = ref<HTMLElement | null>(null)

let isMouseDown = false
let startX = 0
let scrollLeftVal = 0
let hasMoved = false

function startDrag(e: MouseEvent): void {
  const el = categoryScrollRef.value
  if (!el) return
  isMouseDown = true
  hasMoved = false
  startX = e.pageX - el.offsetLeft
  scrollLeftVal = el.scrollLeft
}

function stopDrag(): void {
  isMouseDown = false
  const el = categoryScrollRef.value
  if (el) {
    el.classList.remove('is-dragging')
  }
  setTimeout(() => {
    hasMoved = false
  }, 60)
}

function onDrag(e: MouseEvent): void {
  if (!isMouseDown) return
  const el = categoryScrollRef.value
  if (!el) return

  const x = e.pageX - el.offsetLeft
  const diff = x - startX

  if (Math.abs(diff) > 5) {
    hasMoved = true
    el.classList.add('is-dragging')
    el.scrollLeft = scrollLeftVal - diff * 1.3
  }
}

function handleCategoryClick(categoryId: string): void {
  if (hasMoved) return
  selectedCategory.value = categoryId
}

function handleWheelScroll(e: WheelEvent): void {
  const el = categoryScrollRef.value
  if (!el) return
  el.scrollLeft += e.deltaY * 0.9 || e.deltaX * 0.9
}

function getCategoryName(prod: IProduct): string {
  if (prod.category && typeof prod.category === 'object' && 'name' in prod.category) {
    return (prod.category as { name: string }).name || 'Cosmético'
  }
  return 'Geral'
}

const filteredProducts = computed(() => {
  const list = productStore.products

  if (selectedCategory.value === 'QUICK') {
    return list.filter((p) => p.is_quick_sale)
  }

  if (selectedCategory.value !== 'ALL') {
    return list.filter((p) => {
      if (!p.category) return false
      if (Array.isArray(p.category)) {
        return p.category.some((c: unknown) => {
          if (c && typeof c === 'object' && '$id' in c) {
            return (c as { $id: string }).$id === selectedCategory.value
          }
          return c === selectedCategory.value
        })
      }
      if (typeof p.category === 'object' && p.category && '$id' in p.category) {
        return p.category.$id === selectedCategory.value
      }
      return String(p.category) === selectedCategory.value
    })
  }

  return list
})
</script>

<style scoped>
.product-catalog-container {
  padding: 1rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.catalog-header {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  flex-shrink: 0;
}

.catalog-title-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.catalog-title {
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 0.95rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.catalog-title i {
  color: var(--p-brand-600);
}

.catalog-count-tag {
  font-size: 0.72rem !important;
}

.category-pills {
  display: flex;
  gap: 0.45rem;
  overflow-x: auto;
  padding-bottom: 0.35rem;
  flex-shrink: 0;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: rgba(253, 0, 84, 0.25) transparent;
}

.category-pills.is-dragging {
  cursor: grabbing;
  scroll-behavior: auto;
}

.category-pills::-webkit-scrollbar {
  height: 4px;
}

.category-pills::-webkit-scrollbar-thumb {
  background: rgba(253, 0, 84, 0.25);
  border-radius: 9999px;
}

.pill-btn {
  background: var(--p-brand-50);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 0.3rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.pill-btn:hover {
  background: var(--p-brand-100);
  border-color: var(--p-brand-300);
  color: var(--text-primary);
}

.pill-btn.is-active {
  background: var(--grad-primary);
  border-color: transparent;
  color: #ffffff;
  box-shadow: var(--shadow-sm);
}

.catalog-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex: 1;
  padding: 1.5rem;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.empty-icon {
  font-size: 2.2rem;
  color: var(--p-brand-300);
}

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(145px, 1fr));
  grid-auto-rows: max-content;
  align-content: start;
  gap: 0.75rem;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 0.35rem;
}

.catalog-grid::-webkit-scrollbar {
  width: 5px;
}

.catalog-grid::-webkit-scrollbar-thumb {
  background: var(--p-brand-200);
  border-radius: 4px;
}

.product-card {
  height: 140px;
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.75rem 0.8rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-xs);
}

.product-card:hover {
  border-color: var(--p-brand-400);
  box-shadow: var(--shadow-md);
}

.product-card:active {
  transform: scale(0.98);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.68rem;
}

.card-category {
  color: var(--p-brand-600);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 85px;
}

.card-stock {
  font-weight: 700;
  color: var(--text-secondary);
  background: var(--p-brand-50);
  padding: 0.12rem 0.35rem;
  border-radius: var(--radius-xs);
  font-size: 0.7rem;
}

.stock-warn {
  background: #fee2e2;
  color: #dc2626;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.card-name {
  font-weight: 700;
  font-size: 0.82rem;
  color: var(--text-primary);
  line-height: 1.25;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2rem;
}

.card-barcode {
  font-size: 0.68rem;
  color: var(--text-muted);
}

.card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.4rem;
  border-top: 1px dashed var(--border-subtle);
}

.card-price {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--p-brand-600);
}

.add-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--p-brand-50);
  border: 1px solid var(--p-brand-300);
  color: var(--p-brand-700);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.add-btn:hover {
  background: var(--p-brand-600);
  color: #ffffff;
  border-color: var(--p-brand-600);
  transform: scale(1.08);
}
</style>
