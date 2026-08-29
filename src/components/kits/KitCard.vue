<template>
  <div class="kit-card glass-panel" :class="{ 'is-inactive': !kit.is_active }">
    <!-- Header do Card: Tag da Campanha e Status -->
    <div class="card-top">
      <div
        class="campaign-badge"
        :style="{
          color: campaignMeta.color,
          backgroundColor: campaignMeta.bgLight,
          borderColor: campaignMeta.color + '40'
        }"
      >
        <i :class="campaignMeta.icon"></i>
        <span>{{ campaignMeta.label }}</span>
        <span v-if="kit.event_date" class="event-date-chip">
          <i class="ri-calendar-line"></i>
          {{ kit.event_date }}
        </span>
      </div>

      <div class="status-toggle-wrapper">
        <ToggleSwitch
          :model-value="kit.is_active"
          @update:model-value="emit('toggle-status', kit)"
          title="Ativar/Desativar Kit"
        />
      </div>
    </div>

    <!-- Título do Kit e Código -->
    <div class="kit-info-header">
      <h3 class="kit-title truncate whitespace-nowrap" :title="kit.name">{{ kit.name }}</h3>
      <div class="kit-meta-row">
        <span class="barcode-tag font-mono">
          <i class="ri-barcode-line"></i>
          <span>{{ kit.barcode }}</span>
        </span>
        <span v-if="kit.description" class="kit-desc-preview truncate whitespace-nowrap" :title="kit.description">
          {{ kit.description }}
        </span>
      </div>
    </div>

    <!-- Lista de Itens Componentes -->
    <div class="kit-composition-box">
      <div class="composition-header">
        <span class="comp-label">Itens Inclusos ({{ totalItemsCount }} itens)</span>
        <span
          class="stock-viable-badge"
          :class="availableStock > 0 ? 'is-available' : 'is-empty'"
        >
          <i :class="availableStock > 0 ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'"></i>
          {{ availableStock > 0 ? `${availableStock} kits montáveis` : 'Sem estoque' }}
        </span>
      </div>

      <div class="composition-list">
        <div
          v-for="(item, idx) in kit.items"
          :key="idx"
          class="comp-item"
        >
          <div class="comp-item-name">
            <span class="qty-bubble">{{ item.quantity }}x</span>
            <span class="name-text truncate" :title="item.product?.name">{{ item.product?.name || 'Produto não encontrado' }}</span>
          </div>
          <span class="comp-item-price">{{ formatCurrency(item.product?.selling_price) }}</span>
        </div>

        <div v-if="packagingCostNum > 0" class="comp-item packaging-item">
          <div class="comp-item-name">
            <i class="ri-gift-line text-amber-600 text-xs"></i>
            <span class="name-text text-amber-800">Embalagem / Sacola</span>
          </div>
          <span class="comp-item-price text-amber-800">{{ formatCurrency(packagingCostNum) }}</span>
        </div>
      </div>
    </div>

    <!-- Rodapé: Preço, Desconto e Ações -->
    <div class="card-footer">
      <div class="pricing-block">
        <div class="original-price-row" v-if="originalTotal > sellingPriceNum">
          <span class="original-price">{{ formatCurrency(originalTotal) }}</span>
          <span class="discount-badge">{{ discountPercent.toFixed(0) }}% OFF</span>
        </div>
        <div class="selling-price-row">
          <span class="currency-symbol">R$</span>
          <strong class="final-price">{{ sellingPriceFormatted }}</strong>
        </div>
      </div>

      <div class="actions-block">
        <Button
          icon="ri-edit-line"
          severity="secondary"
          variant="outlined"
          size="small"
          title="Editar Kit"
          @click="emit('edit', kit)"
        />
        <Button
          icon="ri-delete-bin-line"
          severity="danger"
          variant="text"
          size="small"
          title="Excluir Kit"
          @click="emit('delete', kit)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import ToggleSwitch from 'primevue/toggleswitch'
import type { IKit } from '@/types/kit'
import { getCampaignEvent } from '@/types/kit'
import { useKitStore } from '@/stores/kitStore'
import { formatCurrency, toNumber } from '@/utils/currency'

const props = defineProps<{
  kit: IKit
}>()

const emit = defineEmits<{
  (e: 'edit', kit: IKit): void
  (e: 'delete', kit: IKit): void
  (e: 'toggle-status', kit: IKit): void
}>()

const kitStore = useKitStore()

const campaignMeta = computed(() => getCampaignEvent(props.kit.campaign_event))

const packagingCostNum = computed(() => toNumber(props.kit.packaging_cost))
const sellingPriceNum = computed(() => toNumber(props.kit.selling_price))

const sellingPriceFormatted = computed(() => {
  return sellingPriceNum.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
})

const availableStock = computed(() => kitStore.getAvailableStock(props.kit))

const totalItemsCount = computed(() => {
  return (props.kit.items || []).reduce((acc, item) => acc + (item.quantity || 1), 0)
})

const originalTotal = computed(() => {
  const productsTotal = (props.kit.items || []).reduce((acc, item) => {
    return acc + toNumber(item.product?.selling_price) * (item.quantity || 1)
  }, 0)
  return productsTotal + packagingCostNum.value
})

const discountPercent = computed(() => {
  if (originalTotal.value <= 0 || sellingPriceNum.value >= originalTotal.value) return 0
  return ((originalTotal.value - sellingPriceNum.value) / originalTotal.value) * 100
})
</script>

<style scoped>
.kit-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.15rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.9rem;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

.kit-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
  border-color: var(--p-brand-300);
}

.kit-card.is-inactive {
  opacity: 0.65;
  filter: grayscale(0.2);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.campaign-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  letter-spacing: 0.02em;
}

.event-date-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.68rem;
  opacity: 0.85;
  margin-left: 0.3rem;
  padding-left: 0.3rem;
  border-left: 1px solid currentColor;
}

.kit-info-header {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.kit-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.3;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.kit-meta-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.barcode-tag {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--p-surface-100);
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-color);
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.kit-desc-preview {
  font-size: 0.75rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

/* Composição */
.kit-composition-box {
  background: var(--p-surface-50);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.composition-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.72rem;
  font-weight: 700;
}

.comp-label {
  color: var(--text-muted);
  text-transform: uppercase;
}

.stock-viable-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-xs);
  font-size: 0.72rem;
  font-weight: 800;
}

.stock-viable-badge.is-available {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
}

.stock-viable-badge.is-empty {
  background: rgba(244, 63, 94, 0.15);
  color: #e11d48;
}

.composition-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 120px;
  overflow-y: auto;
}

.comp-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.78rem;
  color: var(--text-primary);
  gap: 0.5rem;
}

.comp-item-name {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
  flex: 1;
}

.qty-bubble {
  background: var(--p-brand-100);
  color: var(--p-brand-700);
  font-weight: 800;
  font-size: 0.7rem;
  padding: 0.05rem 0.35rem;
  border-radius: var(--radius-xs);
  flex-shrink: 0;
}

.name-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.comp-item-price {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 600;
  flex-shrink: 0;
}

.packaging-item {
  border-top: 1px dashed var(--border-subtle);
  padding-top: 0.3rem;
  margin-top: 0.15rem;
}

/* Rodapé */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-top: 0.6rem;
  border-top: 1px solid var(--border-subtle);
}

.pricing-block {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.original-price-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.original-price {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-decoration: line-through;
  font-weight: 600;
}

.discount-badge {
  font-size: 0.65rem;
  font-weight: 800;
  background: #dcfce7;
  color: #15803d;
  padding: 0.1rem 0.35rem;
  border-radius: var(--radius-xs);
}

.selling-price-row {
  display: flex;
  align-items: baseline;
  gap: 0.2rem;
}

.currency-symbol {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--p-brand-600);
}

.final-price {
  font-size: 1.35rem;
  font-weight: 900;
  color: var(--p-brand-600);
  line-height: 1;
}

.actions-block {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
</style>
