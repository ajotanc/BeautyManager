<template>
  <div class="product-catalog-container glass-panel">
    <!-- Header com Abas e Filtro de Categorias no Padrão do Carrinho -->
    <div class="catalog-header">
      <AppSectionHeader title="Catálogo & Venda Rápida"
        :subtitle="`${isKitsSelected ? kitStore.activeKits.length : filteredProducts.length} ${isKitsSelected ? 'kits disponíveis' : filteredProducts.length === 1 ? 'produto disponível' : 'produtos disponíveis'}`"
        icon="ri-store-2-fill" />

      <!-- Filtro Rápido de Categorias com Arraste Livre (Drag-to-Scroll) -->
      <div ref="categoryScrollRef" class="category-pills" @wheel.prevent="handleWheelScroll" @mousedown="startDrag"
        @mouseleave="stopDrag" @mouseup="stopDrag" @mousemove="onDrag">
        <button type="button" class="pill-btn" :class="{ 'is-active': selectedCategory === 'ALL' }"
          @click="handleCategoryClick('ALL')">
          Todos
        </button>
        <button type="button" class="pill-btn pill-kits" :class="{ 'is-active': selectedCategory === 'KITS' }"
          @click="handleCategoryClick('KITS')">
          <i class="ri-gift-2-line"></i> Kits & Presentes
        </button>
        <button type="button" class="pill-btn" :class="{ 'is-active': selectedCategory === 'QUICK' }"
          @click="handleCategoryClick('QUICK')">
          <i class="ri-flashlight-line"></i> Venda Rápida
        </button>
        <button v-for="cat in productStore.categories" :key="cat.$id" type="button" class="pill-btn"
          :class="{ 'is-active': selectedCategory === cat.$id }" @click="handleCategoryClick(cat.$id)">
          {{ cat.name }}
        </button>
      </div>
    </div>

    <!-- Seção de Kits Promocionais -->
    <template v-if="isKitsSelected">
      <div v-if="kitStore.activeKits.length === 0" class="catalog-empty">
        <i class="ri-gift-line empty-icon"></i>
        <span>Nenhum kit promocional ativo no momento.</span>
      </div>

      <div v-else class="catalog-grid">
        <div v-for="kit in kitStore.activeKits" :key="kit.$id" class="product-card floating-card kit-pos-card"
          :class="{ 'low-stock': kitStore.getAvailableStock(kit) === 0 }" @click="handleAddKitToCart(kit)">
          <div class="card-top">
            <span class="card-category font-bold" :style="{ color: getCampaignEvent(kit.campaign_event).color }">
              <i :class="getCampaignEvent(kit.campaign_event).icon"></i>
              {{ getCampaignEvent(kit.campaign_event).label }}
            </span>
            <span class="card-stock" :class="{ 'stock-warn': kitStore.getAvailableStock(kit) === 0 }">
              <i class="ri-archive-line"></i>
              <span>{{ kitStore.getAvailableStock(kit) }} kits</span>
            </span>
          </div>

          <div class="card-body">
            <span class="card-name" :title="kit.name">{{ kit.name }}</span>
            <span class="card-barcode font-mono">{{ kit.barcode }}</span>
            <span v-if="kit.items && kit.items.length > 0" class="kit-items-summary" :title="formatKitItems(kit)">
              {{ formatKitItems(kit) }}
            </span>
          </div>

          <div class="card-bottom">
            <strong class="card-price font-bold text-(--p-brand-600)">{{ formatCurrency(kit.selling_price) }}</strong>
            <button type="button" class="add-btn kit-add-btn" title="Adicionar kit ao carrinho"
              @click.stop="handleAddKitToCart(kit)">
              <i class="ri-add-line"></i>
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Seção Padrão de Produtos Avulsos -->
    <template v-else>
      <div v-if="filteredProducts.length === 0" class="catalog-empty">
        <i class="ri-search-line empty-icon"></i>
        <span>Nenhum produto cadastrado nesta categoria.</span>
      </div>

      <div v-else class="catalog-grid">
        <div v-for="prod in filteredProducts" :key="prod.$id" class="product-card floating-card"
          :class="{ 'low-stock': prod.stock_quantity <= prod.min_stock_alert }" @click="handleAddToCart(prod)">
          <div class="card-top">
            <span class="card-category">{{ getCategoryName(prod) }}</span>
            <span class="card-stock" :class="{ 'stock-warn': prod.stock_quantity <= prod.min_stock_alert }">
              <i class="ri-archive-line"></i>
              <span> {{ prod.stock_quantity }} un.</span>
            </span>
          </div>

          <div class="card-body">
            <span class="card-name" :title="prod.name">{{ prod.name }}</span>
            <span class="card-barcode">{{ prod.barcode }}</span>
          </div>

          <div class="card-bottom">
            <strong class="card-price font-bold">{{ formatCurrency(prod.selling_price) }}</strong>
            <button type="button" class="add-btn" title="Adicionar ao carrinho" @click.stop="handleAddToCart(prod)">
              <i class="ri-add-line"></i>
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProductStore } from '@/stores/productStore'
import { usePosStore } from '@/stores/posStore'
import { useKitStore } from '@/stores/kitStore'
import type { IProduct } from '@/types/product'
import type { IKit } from '@/types/kit'
import { getCampaignEvent } from '@/types/kit'
import { formatCurrency } from '@/utils/currency'
import AppSectionHeader from '../common/AppSectionHeader.vue'

const emit = defineEmits<{
  (e: 'item-added', product: IProduct): void
  (e: 'kit-added', kit: IKit): void
}>()

const productStore = useProductStore()
const posStore = usePosStore()
const kitStore = useKitStore()

const selectedCategory = ref<string>('ALL')
const categoryScrollRef = ref<HTMLElement | null>(null)

const isKitsSelected = computed(() => selectedCategory.value === 'KITS')

onMounted(async () => {
  if (kitStore.kits.length === 0) {
    await kitStore.fetchKits()
  }
})

function handleAddToCart(prod: IProduct): void {
  posStore.addToCart(prod, 1)
  emit('item-added', prod)
}

function handleAddKitToCart(kit: IKit): void {
  posStore.addKitToCart(kit, 1)
  emit('kit-added', kit)
}

function formatKitItems(kit: IKit): string {
  if (!kit.items || kit.items.length === 0) return ''
  return kit.items.map((i) => `${i.quantity}x ${i.product?.name || 'Item'}`).join(' + ')
}

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

  if (selectedCategory.value !== 'ALL' && selectedCategory.value !== 'KITS') {
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

@media (max-width: 1024px) {
  .product-catalog-container {
    height: auto;
    min-height: 260px;
    max-height: 380px;
  }
}

.catalog-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex-shrink: 0;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.catalog-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.header-icon-circle {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-xs);
  background: var(--p-brand-50);
  color: var(--p-brand-600);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.header-title-meta {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
}

.header-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.header-subtitle {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.category-pills {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  overflow-x: auto;
  padding-bottom: 0.2rem;
  scrollbar-width: none;
  cursor: grab;
  user-select: none;
}

.category-pills::-webkit-scrollbar {
  display: none;
}

.category-pills.is-dragging {
  cursor: grabbing;
}

.pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: var(--radius-full);
  background: var(--p-surface-50);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s ease;
}

.pill-btn:hover {
  background: var(--p-brand-50);
  color: var(--p-brand-600);
  border-color: var(--p-brand-200);
}

.pill-btn.is-active {
  background: var(--p-brand-600);
  color: #ffffff;
  border-color: var(--p-brand-600);
  font-weight: 700;
  box-shadow: var(--shadow-sm);
}

.pill-btn.pill-kits {
  background: rgba(236, 72, 153, 0.08);
  color: #db2777;
  border-color: rgba(236, 72, 153, 0.3);
}

.pill-btn.pill-kits.is-active {
  background: #db2777;
  color: #ffffff;
  border-color: #db2777;
}

.catalog-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2.5rem 1rem;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.empty-icon {
  font-size: 2rem;
  color: var(--text-muted);
  opacity: 0.5;
}

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  grid-auto-rows: 135px;
  align-items: start;
  gap: 0.5rem;
  overflow-y: auto;
  flex: 1;
  padding: 0.15rem 0.05rem;
  scrollbar-width: thin;
}

.product-card {
  height: 135px;
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 0.45rem 0.55rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.18s ease;
  position: relative;
  box-sizing: border-box;
}

.product-card:hover {
  border-color: var(--p-brand-300);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.product-card.kit-pos-card {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.03) 0%, rgba(255, 255, 255, 1) 100%);
  border-color: rgba(236, 72, 153, 0.25);
}

.product-card.kit-pos-card:hover {
  border-color: #ec4899;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.62rem;
}

.card-category {
  color: var(--text-muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90px;
}

.card-stock {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--text-secondary);
  background: var(--p-surface-100);
  padding: 0.08rem 0.3rem;
  border-radius: var(--radius-xs);
  white-space: nowrap;
}

.card-stock.stock-warn {
  background: #fee2e2;
  color: #dc2626;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.card-name {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 1.9rem;
}

.card-barcode {
  font-size: 0.62rem;
  color: var(--text-muted);
}

.kit-items-summary {
  font-size: 0.64rem;
  color: #db2777;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.25rem;
  border-top: 1px dashed var(--border-subtle);
}

.card-price {
  font-size: 0.9rem;
  color: var(--p-brand-600);
}

.add-btn {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-xs);
  background: var(--p-brand-50);
  color: var(--p-brand-600);
  border: 1px solid var(--p-brand-200);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.add-btn:hover {
  background: var(--p-brand-600);
  color: #ffffff;
  border-color: var(--p-brand-600);
  transform: scale(1.08);
}

.add-btn.kit-add-btn {
  background: rgba(236, 72, 153, 0.12);
  color: #db2777;
  border-color: rgba(236, 72, 153, 0.3);
}

.add-btn.kit-add-btn:hover {
  background: #db2777;
  color: #ffffff;
  border-color: #db2777;
}
</style>
