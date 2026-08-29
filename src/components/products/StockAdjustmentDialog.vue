<template>
  <AppDialog :visible="visible" title="Movimentação de Estoque" subtitle="Entrada de compras ou saída por avaria/ajuste"
    :icon="transactionType === 'IN' ? 'ri-inbox-archive-line' : 'ri-inbox-unarchive-line'" width="520px"
    @update:visible="(val) => emit('update:visible', val)" class="stock-adjustment-modal">

    <Fluid>
      <form id="stock-adj-form" @submit.prevent="handleSubmit" class="stock-adj-content">
        <!-- Card do Produto Selecionado -->
        <div v-if="product" class="prod-summary-card">
          <div class="prod-details">
            <span class="prod-name">{{ product.name }}</span>
            <div class="prod-tags">
              <span v-if="product.barcode" class="tag-barcode">
                <i class="ri-barcode-line"></i>
                {{ product.barcode }}
              </span>
              <span class="tag-category" v-if="product.category?.name">
                {{ product.category.name }}
              </span>
            </div>
          </div>
          <div class="current-stock-box">
            <span class="stock-label">Estoque Atual</span>
            <strong class="stock-val">{{ product.stock_quantity }} un.</strong>
          </div>
        </div>

        <!-- Seletor Tipo de Movimentação (Entrada vs Saída) -->
        <div class="field-section">
          <label class="section-label">Tipo de Movimentação *</label>
          <div class="type-selector-grid">
            <button type="button" class="type-card in-card" :class="{ 'is-active': transactionType === 'IN' }"
              @click="transactionType = 'IN'">
              <div class="type-card-icon">
                <i class="ri-arrow-down-circle-fill"></i>
              </div>
              <div class="type-card-text">
                <strong class="type-title">Entrada (+)</strong>
                <span class="type-desc">Compra ou devolução</span>
              </div>
              <div class="type-check" v-if="transactionType === 'IN'">
                <i class="ri-checkbox-circle-fill"></i>
              </div>
            </button>

            <button type="button" class="type-card out-card" :class="{ 'is-active': transactionType === 'OUT' }"
              @click="transactionType = 'OUT'">
              <div class="type-card-icon">
                <i class="ri-arrow-up-circle-fill"></i>
              </div>
              <div class="type-card-text">
                <strong class="type-title">Saída (-)</strong>
                <span class="type-desc">Avaria, perda ou ajuste</span>
              </div>
              <div class="type-check" v-if="transactionType === 'OUT'">
                <i class="ri-checkbox-circle-fill"></i>
              </div>
            </button>
          </div>
        </div>

        <!-- Quantidade e Atalhos Rápidos -->
        <div class="field-section">
          <div class="quantity-header">
            <label class="section-label">Quantidade a Movimentar *</label>
            <div class="quick-qty-pills">
              <button v-for="amt in [1, 5, 10, 20]" :key="amt" type="button" class="qty-pill"
                :class="{ 'is-active': quantity === amt }" @click="quantity = amt">
                +{{ amt }}
              </button>
            </div>
          </div>

          <div class="stepper-field">
            <InputNumber id="adj_quantity" v-model="quantity" :min="1"
              :max="transactionType === 'OUT' ? (product?.stock_quantity || 1) : 99999" show-buttons
              button-layout="horizontal" size="small" decrement-button-class="stepper-btn"
              increment-button-class="stepper-btn" increment-button-icon="ri-add-line"
              decrement-button-icon="ri-subtract-line" class="custom-stepper" :invalid="!!errors.quantity" required />
          </div>
          <Message v-if="errors.quantity" severity="error" size="small" variant="simple">
            {{ errors.quantity }}
          </Message>
        </div>

        <!-- Motivo do Ajuste -->
        <div class="field-section">
          <label class="section-label">Motivo do Ajuste *</label>
          <Select id="adj_reason" v-model="reason" :options="reasonOptions" option-label="label" option-value="value"
            :filter="true" filter-placeholder="Buscar motivo..." size="small" fluid class="custom-select" :invalid="!!errors.reason" required />
          <Message v-if="errors.reason" severity="error" size="small" variant="simple">
            {{ errors.reason }}
          </Message>
        </div>

        <!-- Painel de Impacto no Estoque -->
        <div class="stock-impact-card" :class="transactionType === 'IN' ? 'in-impact' : 'out-impact'">
          <div class="impact-col">
            <span class="impact-label">Estoque Atual</span>
            <span class="impact-val">{{ product?.stock_quantity || 0 }}</span>
          </div>

          <div class="impact-symbol">
            <i :class="transactionType === 'IN' ? 'ri-add-line' : 'ri-subtract-line'"></i>
          </div>

          <div class="impact-col">
            <span class="impact-label">Movimentação</span>
            <span class="impact-val delta-val">{{ quantity || 0 }}</span>
          </div>

          <div class="impact-symbol">
            <i class="ri-arrow-right-line"></i>
          </div>

          <div class="impact-col result-col">
            <span class="impact-label">Novo Estoque</span>
            <strong class="impact-val final-val">{{ computedNewStock }} un.</strong>
          </div>
        </div>
      </form>
    </Fluid>

    <template #footer>
      <div class="flex items-center justify-end gap-2.5 w-full">
        <Button label="Fechar" icon="ri-close-line" severity="secondary" variant="text" size="small"
          @click="emit('update:visible', false)" />
        <Button form="stock-adj-form" type="submit"
          :label="transactionType === 'IN' ? 'Confirmar Entrada' : 'Confirmar Saída'"
          :icon="transactionType === 'IN' ? 'ri-arrow-down-line' : 'ri-arrow-up-line'"
          :severity="transactionType === 'IN' ? 'success' : 'danger'" size="small" class="submit-action-btn"
          :loading="isSubmitting" />
      </div>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import AppDialog from '@/components/common/AppDialog.vue'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Message from 'primevue/message'
import Fluid from 'primevue/fluid'
import type { IProduct } from '@/types/product'
import type { InventoryTransactionType, InventoryReason } from '@/types/inventory'
import { inventory } from '@/services/inventory'
import { useToast } from 'primevue/usetoast'
import { parseErrorMessage } from '@/types/errors'
import { z } from 'zod'

const stockAdjustmentSchema = z.object({
  quantity: z.number().int().min(1, 'A quantidade mínima para movimentação é 1'),
  transaction_type: z.enum(['IN', 'OUT']),
  reason: z.enum(['purchase', 'sale', 'adjustment', 'damage', 'devolution'])
})

interface Props {
  visible: boolean
  product: IProduct | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'adjusted'): void
}>()

const toast = useToast()

const transactionType = ref<InventoryTransactionType>('IN')
const quantity = ref<number>(1)
const reason = ref<InventoryReason>('purchase')
const isSubmitting = ref<boolean>(false)
const errors = reactive<Record<string, string>>({})

watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible) {
      quantity.value = 1
      transactionType.value = 'IN'
      reason.value = 'purchase'
      clearErrors()
    }
  }
)

watch(transactionType, (newType) => {
  if (newType === 'IN') {
    reason.value = 'purchase'
  } else {
    reason.value = 'damage'
  }
})

const inReasonOptions = [
  { label: 'Compra / Reposição de Fornecedor', value: 'purchase' },
  { label: 'Ajuste de Balanço / Contagem Física (+)', value: 'adjustment' },
  { label: 'Devolução de Cliente', value: 'devolution' }
]

const outReasonOptions = [
  { label: 'Avaria / Perda / Produto Danificado', value: 'damage' },
  { label: 'Ajuste de Balanço / Contagem Física (-)', value: 'adjustment' },
  { label: 'Uso Interno / Demonstração Loja', value: 'damage' }
]

const reasonOptions = computed(() => {
  return transactionType.value === 'IN' ? inReasonOptions : outReasonOptions
})

const computedNewStock = computed<number>(() => {
  if (!props.product) return 0
  const current = props.product.stock_quantity || 0
  if (transactionType.value === 'IN') {
    return current + (quantity.value || 0)
  }
  return Math.max(0, current - (quantity.value || 0))
})

function clearErrors(): void {
  Object.keys(errors).forEach((key) => delete errors[key])
}

async function handleSubmit(): Promise<void> {
  if (!props.product) return
  clearErrors()

  const validation = stockAdjustmentSchema.safeParse({
    quantity: quantity.value,
    transaction_type: transactionType.value,
    reason: reason.value
  })

  if (!validation.success) {
    validation.error.issues.forEach((err) => {
      const field = String(err.path[0])
      if (field) {
        errors[field] = err.message
      }
    })
    return
  }

  isSubmitting.value = true
  try {
    await inventory.recordTransaction({
      product: props.product,
      transaction_type: validation.data.transaction_type,
      quantity: validation.data.quantity,
      reason: validation.data.reason
    })

    // Atualiza o estoque local do produto
    props.product.stock_quantity = computedNewStock.value
    toast.add({
      severity: 'success',
      summary: 'Estoque Atualizado',
      detail: `Estoque de "${props.product.name}" agora é ${computedNewStock.value} un.`,
      life: 3000
    })

    emit('adjusted')
    emit('update:visible', false)
  } catch (error: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Erro ao movimentar estoque',
      detail: parseErrorMessage(error),
      life: 4000
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.stock-adj-content {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  padding-top: 0.25rem;
}

/* Custom Header */
.dialog-custom-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.header-icon-box {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  transition: all 0.25s ease;
}

.in-icon {
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.out-icon {
  background: #ffe4e6;
  color: #be123c;
  border: 1px solid #fecdd3;
}

.header-title {
  font-family: var(--font-title);
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
}

.header-subtitle {
  font-size: 0.76rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* Product Summary Card */
.prod-summary-card {
  background: linear-gradient(135deg, var(--p-brand-50) 0%, #ffffff 100%);
  border: 1px solid var(--p-brand-200);
  border-radius: var(--radius-md);
  padding: 0.85rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  box-shadow: var(--shadow-xs);
}

.prod-details {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.prod-name {
  font-family: var(--font-title);
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
}

.prod-tags {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.tag-barcode {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.72rem;
  font-weight: 700;
  background: #ffffff;
  color: #334155;
  border: 1px solid #cbd5e1;
  padding: 0.1rem 0.45rem;
  border-radius: var(--radius-xs);
}

.tag-category {
  font-size: 0.72rem;
  color: var(--text-secondary);
  background: #ffffff;
  border: 1px solid var(--border-color);
  padding: 0.1rem 0.45rem;
  border-radius: var(--radius-xs);
}

.current-stock-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
  flex-shrink: 0;
}

.stock-label {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stock-val {
  font-size: 1.15rem;
  font-weight: 900;
  color: var(--text-primary);
}

/* Sections */
.field-section {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.section-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-primary);
}

/* Type Selector Cards */
.type-selector-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.type-card {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.75rem 0.85rem;
  border-radius: var(--radius-md);
  border: 2px solid var(--border-color);
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  position: relative;
}

.type-card-icon {
  font-size: 1.35rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.type-card-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  flex: 1;
}

.type-title {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
}

.type-desc {
  font-size: 0.68rem;
  color: var(--text-muted);
}

.type-check {
  font-size: 1.1rem;
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
}

/* IN State */
.in-card:hover {
  background: #f0fdf4;
  border-color: #86efac;
}

.in-card .type-card-icon {
  color: #16a34a;
}

.in-card.is-active {
  background: #f0fdf4;
  border-color: #22c55e;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.15);
}

.in-card.is-active .type-title {
  color: #15803d;
}

.in-card.is-active .type-check {
  color: #16a34a;
}

/* OUT State */
.out-card:hover {
  background: #fff1f2;
  border-color: #fda4af;
}

.out-card .type-card-icon {
  color: #e11d48;
}

.out-card.is-active {
  background: #fff1f2;
  border-color: #f43f5e;
  box-shadow: 0 2px 8px rgba(244, 63, 94, 0.15);
}

.out-card.is-active .type-title {
  color: #be123c;
}

.out-card.is-active .type-check {
  color: #e11d48;
}

/* Quantity Header & Stepper */
.quantity-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.quick-qty-pills {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.qty-pill {
  border: 1px solid var(--border-color);
  background: #f8fafc;
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.qty-pill:hover {
  background: var(--p-brand-50);
  border-color: var(--p-brand-300);
  color: var(--p-brand-900);
}

.qty-pill.is-active {
  background: var(--p-brand-600);
  border-color: var(--p-brand-600);
  color: #ffffff;
}

.custom-stepper :deep(.p-inputnumber-input) {
  font-weight: 800;
  font-size: 1rem;
  text-align: center;
}

.custom-stepper :deep(.p-inputnumber-button) {
  padding: 0.45rem 0.75rem;
}

/* Impact Panel */
.stock-impact-card {
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.25s ease;
}

.impact-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.impact-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.8;
}

.impact-val {
  font-size: 0.95rem;
  font-weight: 800;
}

.impact-symbol {
  font-size: 1.1rem;
  opacity: 0.6;
}

.result-col {
  align-items: flex-end;
}

.final-val {
  font-size: 1.25rem;
  font-weight: 900;
}

.in-impact {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1px solid #86efac;
  color: #15803d;
}

.out-impact {
  background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%);
  border: 1px solid #fecdd3;
  color: #be123c;
}

.submit-action-btn {
  font-weight: 700;
}
</style>
