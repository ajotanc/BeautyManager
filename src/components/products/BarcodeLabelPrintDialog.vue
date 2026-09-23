<template>
  <AppDialog
    :visible="visible"
    title="Impressão de Etiquetas de Gôndola"
    subtitle="Folha A4 • 96 etiquetas por folha (31 × 17 mm)"
    icon="ri-barcode-box-line"
    width="940px"
    max-width="96vw"
    :content-style="{
      padding: '0.85rem 1.25rem 0.65rem 1.25rem',
      display: 'flex',
      flexDirection: 'column',
      flex: '1 1 auto',
      minHeight: '0',
      overflow: 'hidden'
    }"
    @update:visible="(val) => emit('update:visible', val)"
    class="barcode-print-modal"
  >
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 min-h-0 w-full overflow-hidden">
      <!-- COLUNA ESQUERDA: Fila de Impressão & Seleção de Produtos (7 cols) -->
      <div class="md:col-span-7 flex flex-col gap-2.5 h-full min-h-0 overflow-hidden bg-surface-50/80 dark:bg-surface-900/60 border border-(--border-color) rounded-lg p-3">
        <!-- Campo de Busca de Produtos (Padrão de borda nativo do Select) -->
        <div class="relative shrink-0">
          <Select
            :key="selectKey"
            id="product_search_add"
            v-model="selectedProductToAdd"
            :options="availableProducts"
            option-label="name"
            :filter="true"
            :filter-fields="['name', 'barcode']"
            placeholder="Buscar por nome ou código de barras para adicionar..."
            class="w-full text-sm"
            show-clear
            @change="addProductToQueue"
          >
            <template #value="slotProps">
              <span v-if="slotProps.value" class="text-sm font-semibold text-surface-900 dark:text-surface-100">
                {{ slotProps.value.name }}
              </span>
              <span v-else class="text-sm text-surface-400 flex items-center gap-2">
                <i class="ri-search-2-line text-(--p-brand-600)"></i>
                <span class="truncate">Buscar produto para incluir na folha...</span>
              </span>
            </template>

            <template #option="{ option }">
              <div class="flex items-center justify-between w-full py-1.5 gap-2">
                <div class="flex flex-col min-w-0">
                  <span class="font-bold text-sm truncate text-surface-900 dark:text-surface-100">{{ option.name }}</span>
                  <div class="text-xs text-surface-500 flex items-center gap-2 mt-0.5">
                    <span class="font-medium">Cód: {{ option.barcode }}</span>
                    <span>•</span>
                    <span>Estoque: <strong class="text-surface-700 dark:text-surface-300">{{ option.stock_quantity ?? 0 }} un.</strong></span>
                  </div>
                </div>
                <div class="flex items-center shrink-0">
                  <span class="font-extrabold text-sm text-(--p-brand-600)">
                    {{ formatCurrency(option.selling_price) }}
                  </span>
                </div>
              </div>
            </template>
          </Select>
        </div>

        <!-- Cabeçalho da Fila de Produtos -->
        <div class="flex items-center justify-between px-0.5 shrink-0">
          <div class="flex items-center gap-2">
            <span class="text-xs font-black uppercase tracking-wider text-surface-700 dark:text-surface-300">
              Produtos Selecionados
            </span>
            <span
              v-if="printQueue.length > 0"
              class="text-xs font-bold bg-(--p-brand-50) text-(--p-brand-600) border border-(--border-color) px-2 py-0.5 rounded-sm"
            >
              {{ printQueue.length }} {{ printQueue.length === 1 ? 'item' : 'itens' }}
            </span>
          </div>

          <button
            v-if="printQueue.length > 0"
            type="button"
            class="text-xs font-bold text-red-500 hover:text-red-700 hover:underline inline-flex items-center gap-1 cursor-pointer transition-colors"
            @click="clearQueue"
          >
            <i class="ri-delete-bin-line"></i>
            <span>Limpar Lista</span>
          </button>
        </div>

        <!-- Lista Rolável de Produtos na Fila com Drag-to-Scroll -->
        <div
          ref="queueScrollRef"
          v-if="printQueue.length > 0"
          class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 custom-scrollbar overscroll-contain pb-3 drag-scroll-area"
        >
          <div
            v-for="(item, index) in printQueue"
            :key="item.product.$id"
            class="p-2.5 bg-white dark:bg-surface-900 border border-(--border-color) rounded-sm shadow-2xs hover:border-(--p-brand-300) transition-all flex flex-col gap-2 shrink-0"
          >
            <!-- Linha 1: Título e Preço -->
            <div class="flex items-center justify-between gap-2">
              <span class="font-bold text-sm text-surface-900 dark:text-surface-100 truncate" :title="item.product.name">
                {{ item.product.name }}
              </span>
              <span class="text-sm font-black text-(--p-brand-600) shrink-0">
                {{ formatCurrency(item.product.selling_price) }}
              </span>
            </div>

            <!-- Linha 2: Metadados & Controles de Quantidade -->
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <div class="flex items-center gap-2 text-xs text-surface-500">
                <span class="inline-flex items-center gap-1 font-semibold text-surface-700 bg-surface-100 dark:bg-surface-800 dark:text-surface-300 px-1.5 py-0.5 rounded-xs border border-surface-200 dark:border-surface-700">
                  <i class="ri-barcode-line text-xs text-(--p-brand-600)"></i>
                  {{ item.product.barcode }}
                </span>
                <span>
                  Estoque: <strong class="text-surface-800 dark:text-surface-200">{{ item.product.stock_quantity ?? 0 }} un.</strong>
                </span>
              </div>

              <!-- Controles de Quantidade com altura uniforme de 32px (h-8) -->
              <div class="flex items-center gap-1.5 shrink-0">
                <!-- Atalho Estoque -->
                <button
                  v-if="(item.product.stock_quantity ?? 0) > 0"
                  type="button"
                  class="h-8 inline-flex items-center gap-1 px-2 text-xs font-bold rounded-sm border transition-all cursor-pointer whitespace-nowrap"
                  :class="item.quantity === item.product.stock_quantity
                    ? 'bg-(--p-brand-50) border-(--p-brand-300) text-(--p-brand-600)'
                    : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-600 hover:border-(--p-brand-300) hover:text-(--p-brand-600)'"
                  title="Ajustar quantidade para o estoque disponível"
                  @click="item.quantity = Math.max(1, item.product.stock_quantity ?? 1)"
                >
                  <i class="ri-box-3-line text-xs"></i>
                  <span>Estoque ({{ item.product.stock_quantity }})</span>
                </button>

                <!-- Stepper Numérico -->
                <div class="inline-flex items-center h-8 rounded-sm border border-(--border-color) bg-surface-50 dark:bg-surface-800 overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    class="w-7 h-full flex items-center justify-center text-surface-500 hover:text-(--p-brand-600) hover:bg-(--p-brand-50) transition-colors cursor-pointer border-r border-(--border-color) disabled:opacity-30 disabled:cursor-not-allowed"
                    :disabled="item.quantity <= 1"
                    title="Diminuir"
                    @click="item.quantity = Math.max(1, item.quantity - 1)"
                  >
                    <i class="ri-subtract-line text-xs font-bold"></i>
                  </button>
                  <input
                    v-model.number="item.quantity"
                    type="number"
                    min="1"
                    max="960"
                    class="w-12 h-full text-center font-black text-xs text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-900 border-0 outline-none p-0 focus:ring-0 no-spinners"
                  />
                  <button
                    type="button"
                    class="w-7 h-full flex items-center justify-center text-surface-500 hover:text-(--p-brand-600) hover:bg-(--p-brand-50) transition-colors cursor-pointer border-l border-(--border-color)"
                    title="Aumentar"
                    @click="item.quantity = Math.min(960, item.quantity + 1)"
                  >
                    <i class="ri-add-line text-xs font-bold"></i>
                  </button>
                </div>

                <!-- Botão Remover -->
                <button
                  type="button"
                  class="w-8 h-8 rounded-sm border border-red-200 bg-red-50/60 text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors flex items-center justify-center cursor-pointer shrink-0"
                  title="Remover produto da folha"
                  @click="removeItem(index)"
                >
                  <i class="ri-close-line text-base font-bold"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Estado Vazio da Fila Reutilizando AppEmptyState -->
        <div
          v-else
          class="flex-1 min-h-0 flex items-center justify-center border border-dashed border-(--border-color) rounded-sm bg-white/60 dark:bg-surface-800/30 overflow-hidden"
        >
          <AppEmptyState
            icon="ri-barcode-box-line"
            title="Nenhum produto selecionado"
            description="Busque e selecione produtos acima para distribuir as etiquetas na mesma folha e economizar papel."
          />
        </div>
      </div>

      <!-- COLUNA DIREITA: Folha A4 Inteligente & Pré-Visualização (5 cols) -->
      <div class="md:col-span-5 flex flex-col gap-2.5 h-full min-h-0 overflow-hidden bg-surface-50/80 dark:bg-surface-900/60 border border-(--border-color) rounded-lg p-3">
        <!-- Painel de Métricas da Folha -->
        <div class="flex flex-col gap-2 shrink-0">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <i class="ri-file-paper-2-line text-(--p-brand-600) text-base"></i>
              <span class="text-xs font-black uppercase tracking-wider text-surface-700 dark:text-surface-300">
                Folha A4 (31 × 17 mm)
              </span>
            </div>
            <span class="text-xs font-bold text-surface-500">
              {{ totalLabels }} / {{ sheetCapacity }} etiquetas
            </span>
          </div>

          <!-- Barra de Progresso com Gradiente da Marca -->
          <div class="w-full bg-surface-200 dark:bg-surface-700 h-2 rounded-full overflow-hidden p-0.5">
            <div
              class="h-full rounded-full transition-all duration-300"
              style="background: var(--grad-primary)"
              :style="{ width: `${sheetFillPercentage}%` }"
            ></div>
          </div>

          <!-- Status do Aproveitamento da Folha -->
          <div class="flex items-center justify-between gap-2 pt-0.5">
            <span v-if="missingToFullSheet > 0 && totalLabels > 0" class="text-xs font-bold text-(--p-brand-600) flex items-center gap-1">
              <i class="ri-information-line"></i>
              Faltam {{ missingToFullSheet }} para 1 folha cheia
            </span>
            <span v-else-if="totalLabels > 0" class="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <i class="ri-checkbox-circle-fill"></i>
              Folha 100% preenchida!
            </span>
            <span v-else class="text-xs text-surface-400">
              Capacidade: 96 etiquetas por folha
            </span>

            <!-- Botão Completar Folha -->
            <button
              v-if="missingToFullSheet > 0 && printQueue.length > 0"
              type="button"
              class="text-xs font-bold text-white px-2.5 py-1 rounded-sm shadow-2xs hover:opacity-95 transition-opacity cursor-pointer flex items-center gap-1 shrink-0"
              style="background: var(--grad-primary)"
              title="Preencher os espaços restantes com o último produto"
              @click="fillSheet"
            >
              <i class="ri-magic-line text-xs"></i>
              <span>Completar (96)</span>
            </button>
          </div>
        </div>

        <div class="border-t border-(--border-color) shrink-0"></div>

        <!-- Miniatura Realista da Folha A4 (Preview Proporcional com Scroll Garantido) -->
        <div class="flex flex-col gap-1.5 flex-1 min-h-0 overflow-hidden">
          <div class="flex items-center justify-between text-xs px-0.5 shrink-0">
            <span class="font-bold text-surface-600 dark:text-surface-400 flex items-center gap-1">
              <i class="ri-eye-line text-(--p-brand-600)"></i>
              Prévia das Etiquetas
            </span>
            <span class="text-surface-400">
              {{ sheetsCount }} folha{{ sheetsCount > 1 ? 's' : '' }} A4
            </span>
          </div>

          <!-- Container da Folha em Escala com Perfect Rounded e Drag-to-Scroll -->
          <div
            ref="previewScrollRef"
            class="flex-1 min-h-0 overflow-y-auto rounded-sm border border-(--border-color) bg-white dark:bg-surface-950 p-2 shadow-inner custom-scrollbar overscroll-contain drag-scroll-area"
          >
            <div v-if="totalLabels > 0" class="grid grid-cols-2 gap-1.5">
              <!-- Cards Mini-Etiqueta Proporcionais -->
              <div
                v-for="(prod, i) in flatStickers"
                :key="`preview-${i}`"
                class="realistic-sticker"
              >
                <div class="sticker-product-name" :title="prod.name">
                  {{ prod.name }}
                </div>
                <div class="sticker-barcode-box" v-if="prod.barcode">
                  <ProductBarcode :value="prod.barcode" :width="0.8" :height="14" :font-size="7" :display-value="true" />
                </div>
                <div class="sticker-price-tag">
                  {{ formatCurrency(prod.selling_price) }}
                </div>
              </div>

              <!-- Slots livres indicando espaço disponível na folha -->
              <div
                v-for="s in previewEmptySlots"
                :key="`slot-${s}`"
                class="empty-preview-slot"
              >
                <i class="ri-add-line text-surface-300 text-xs"></i>
                <span>Livre</span>
              </div>
            </div>

            <!-- Placeholder quando vazia utilizando AppEmptyState -->
            <div v-else class="h-full flex items-center justify-center p-2">
              <AppEmptyState
                icon="ri-layout-grid-line"
                title="Folha vazia"
                description="A prévia das etiquetas aparecerá aqui conforme você adicionar produtos à folha."
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Área Oculta de Impressão (Teleportada para renderizar o CSS estrito de impressão) -->
    <Teleport to="body">
      <div v-if="visible" id="printable-labels-print-area" ref="printableLabelsRef">
        <div v-for="(prod, i) in flatStickers" :key="`print-${i}`" class="label-sticker">
          <div class="sticker-name">{{ prod.name }}</div>
          <div class="sticker-barcode-box" v-if="prod.barcode">
            <ProductBarcode :value="prod.barcode" :width="0.95" :height="16" :font-size="8" :display-value="true" />
          </div>
          <div class="sticker-price">{{ formatCurrency(prod.selling_price) }}</div>
        </div>
      </div>
    </Teleport>

    <!-- Rodapé Elegante do Modal (Botões com borda e radius nativos do PrimeVue) -->
    <template #footer>
      <div class="flex items-center justify-between w-full pt-1">
        <div class="flex items-center gap-2">
          <span v-if="totalLabels > 0" class="text-xs font-semibold text-surface-600 dark:text-surface-300 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <strong>{{ totalLabels }} etiquetas</strong> prontas em {{ sheetsCount }} folha{{ sheetsCount > 1 ? 's' : '' }} A4
          </span>
          <span v-else class="text-xs text-surface-400">
            Adicione ao menos um produto para imprimir
          </span>
        </div>

        <div class="flex items-center gap-2">
          <Button
            label="Fechar"
            icon="ri-close-line"
            severity="secondary"
            variant="outlined"
            size="small"
            @click="emit('update:visible', false)"
          />
          <Button
            :label="`Imprimir Etiquetas (${totalLabels})`"
            icon="ri-printer-line"
            severity="primary"
            size="small"
            :disabled="totalLabels === 0"
            @click="handlePrint"
          />
        </div>
      </div>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import AppDialog from '@/components/common/AppDialog.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import { useVueToPrint } from 'vue-to-print'
import labelsPrintCss from '@/assets/styles/labelsPrint.css?inline'
import ProductBarcode from '@/components/common/ProductBarcode.vue'
import type { IProduct } from '@/types/product'
import { formatCurrency } from '@/utils/currency'
import { useProductStore } from '@/stores/productStore'
import { useDragScroll } from '@/composables/useDragScroll'

interface PrintQueueItem {
  product: IProduct
  quantity: number
}

interface Props {
  visible: boolean
  product?: IProduct | null
}

const props = withDefaults(defineProps<Props>(), {
  product: null
})

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
}>()

const productStore = useProductStore()

const printQueue = ref<PrintQueueItem[]>([])
const selectedProductToAdd = ref<IProduct | null>(null)
const selectKey = ref<number>(0)
const printableLabelsRef = ref<HTMLElement | null>(null)

// Drag-to-Scroll Refs
const queueScrollRef = ref<HTMLElement | null>(null)
const previewScrollRef = ref<HTMLElement | null>(null)

useDragScroll(queueScrollRef, { direction: 'vertical', speed: 1.2 })
useDragScroll(previewScrollRef, { direction: 'vertical', speed: 1.2 })

const availableProducts = computed<IProduct[]>(() => {
  return productStore.products.filter(p => p.barcode)
})

const flatStickers = computed<IProduct[]>(() => {
  return printQueue.value.flatMap(item =>
    Array.from({ length: Math.max(1, item.quantity) }, () => item.product)
  )
})

const totalLabels = computed<number>(() => flatStickers.value.length)

const sheetsCount = computed<number>(() => {
  return Math.max(1, Math.ceil(totalLabels.value / 96))
})

const sheetCapacity = computed<number>(() => {
  return sheetsCount.value * 96
})

const missingToFullSheet = computed<number>(() => {
  if (totalLabels.value === 0) return 96
  const remainder = totalLabels.value % 96
  return remainder === 0 ? 0 : 96 - remainder
})

const sheetFillPercentage = computed<number>(() => {
  if (totalLabels.value === 0) return 0
  const remainder = totalLabels.value % 96
  if (remainder === 0) return 100
  return Math.round((remainder / 96) * 100)
})

const previewEmptySlots = computed<number>(() => {
  if (totalLabels.value === 0) return 0
  return Math.min(8, missingToFullSheet.value)
})

function addProductToQueue(): void {
  if (!selectedProductToAdd.value) return
  const p = selectedProductToAdd.value

  const existingIndex = printQueue.value.findIndex(item => item.product.$id === p.$id)
  if (existingIndex >= 0) {
    printQueue.value[existingIndex].quantity += 1
  } else {
    const defaultQty = (p.stock_quantity && p.stock_quantity > 0)
      ? Math.min(p.stock_quantity, 96)
      : 1
    printQueue.value.push({
      product: p,
      quantity: defaultQty
    })
  }

  // Reseta seleção limpa e imediatamente
  nextTick(() => {
    selectedProductToAdd.value = null
    selectKey.value++
  })
}

function removeItem(index: number): void {
  printQueue.value.splice(index, 1)
}

function clearQueue(): void {
  printQueue.value = []
}

function fillSheet(): void {
  const missing = missingToFullSheet.value
  if (missing <= 0 || printQueue.value.length === 0) return

  const lastItem = printQueue.value[printQueue.value.length - 1]
  lastItem.quantity += missing
}

watch(
  () => props.visible,
  (isOpen) => {
    if (isOpen) {
      if (props.product && props.product.$id) {
        const defaultQty = (props.product.stock_quantity && props.product.stock_quantity > 0)
          ? Math.min(props.product.stock_quantity, 96)
          : 96

        printQueue.value = [{
          product: props.product,
          quantity: defaultQty
        }]
      } else {
        printQueue.value = []
      }
      selectedProductToAdd.value = null
      selectKey.value++
    }
  }
)

const { handlePrint } = useVueToPrint({
  content: printableLabelsRef,
  documentTitle: 'Etiquetas_Produtos',
  copyStyles: false,
  pageStyle: labelsPrintCss
})
</script>

<style scoped>
/* Remover setas nativas do input de número */
.no-spinners::-webkit-outer-spin-button,
.no-spinners::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.no-spinners {
  appearance: textfield;
  -moz-appearance: textfield;
  -webkit-appearance: textfield;
}

/* Realistic Sticker Card no Preview (Proporção 31x17 mm) */
.realistic-sticker {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 0.25rem 0.35rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  min-height: 68px;
  position: relative;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.realistic-sticker:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(225, 29, 72, 0.12);
  border-color: var(--p-brand-400);
}

.sticker-product-name {
  font-size: 8px;
  font-weight: 800;
  color: var(--text-primary);
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1;
}

.sticker-barcode-box {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sticker-price-tag {
  font-size: 8.5px;
  font-weight: 900;
  color: var(--p-brand-600);
  background: var(--p-brand-50);
  border: 1px solid var(--border-color);
  padding: 0.5px 3px;
  border-radius: 2px;
  width: 100%;
  line-height: 1.1;
}

/* Slots vazios no preview para demonstrar aproveitamento da folha */
.empty-preview-slot {
  border: 1px dashed var(--border-color);
  border-radius: 4px;
  min-height: 68px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  color: var(--text-muted);
  font-size: 9px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.5);
}

/* Drag to Scroll */
.drag-scroll-area {
  cursor: grab;
}

.drag-scroll-area.is-dragging {
  cursor: grabbing !important;
  user-select: none !important;
}

.drag-scroll-area.is-dragging * {
  cursor: grabbing !important;
}

/* Custom Scrollbar */
.custom-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none; 
}

.custom-scrollbar::-webkit-scrollbar {
  display: none;
}

/* Estrutura Flex Integrada para Evitar Qualquer Corte */
:deep(.barcode-print-modal.p-dialog) {
  display: flex !important;
  flex-direction: column !important;
  height: 600px !important;
  max-height: 88vh !important;
}

:deep(.barcode-print-modal .p-dialog-content) {
  display: flex !important;
  flex-direction: column !important;
  flex: 1 1 auto !important;
  min-height: 0 !important;
  overflow: hidden !important;
}
</style>
