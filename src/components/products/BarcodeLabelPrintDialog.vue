<template>
  <AppDialog :visible="visible" title="Impressão de Etiquetas"
    subtitle="Padrão A4 • 96 etiquetas por folha (31 x 17 mm)" icon="ri-barcode-box-line" width="640px"
    @update:visible="(val) => emit('update:visible', val)" class="barcode-print-modal">

    <Fluid>
      <div class="labels-dialog-content">
        <!-- Card de Informações do Produto Selecionado -->
        <div v-if="product" class="product-info-card">
          <div class="info-main">
            <div class="product-title-wrap">
              <span class="product-name">{{ product.name }}</span>
              <div class="product-badges">
                <span class="barcode-pill">
                  <i class="ri-barcode-line"></i>
                  {{ product.barcode }}
                </span>
                <span v-if="product.stock_quantity !== undefined" class="stock-pill">
                  Estoque: <strong>{{ product.stock_quantity }} un.</strong>
                </span>
              </div>
            </div>
            <div class="price-box">
              <span class="price-label">Preço Unitário</span>
              <strong class="price-val">{{ formatCurrency(product.selling_price) }}</strong>
            </div>
          </div>
        </div>

        <!-- Controles de Quantidade e Atalhos Rápidos -->
        <div class="print-config-section">
          <div class="config-row">
            <div class="field-wrap">
              <label class="field-title">Quantidade de Etiquetas a Imprimir:</label>
              <div class="stepper-wrap">
                <InputNumber v-model="labelCount" :min="1" :max="960" show-buttons button-layout="horizontal"
                  size="small" decrement-button-class="stepper-btn" increment-button-class="stepper-btn"
                  increment-button-icon="ri-add-line" decrement-button-icon="ri-subtract-line" class="custom-stepper" />
              </div>
            </div>

            <!-- Botões de Seleção Rápida -->
            <div class="quick-presets-wrap">
              <span class="presets-label">Qtd. Rápida:</span>
              <div class="presets-group">
                <button v-for="preset in [6, 18, 48, 96]" :key="preset" type="button" class="preset-pill"
                  :class="{ 'is-active': labelCount === preset }" @click="labelCount = preset">
                  {{ preset === 96 ? '96 (1 Folha)' : preset }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Prévia da Folha de Etiquetas -->
        <div class="preview-section">
          <div class="preview-header">
            <span class="preview-title">
              <i class="ri-eye-line"></i> Pré-Visualização das Etiquetas (31 x 17 mm)
            </span>
            <Tag :value="`${labelCount} etiquetas • ${Math.ceil(labelCount / 96)} folha(s)`" severity="info"
              size="small" />
          </div>

          <div class="stickers-sheet-canvas">
            <div class="stickers-grid">
              <div v-for="i in labelCount" :key="i" class="realistic-sticker">
                <div class="sticker-product-name" :title="product?.name">
                  {{ product?.name }}
                </div>
                <div class="sticker-barcode-box" v-if="product?.barcode">
                  <ProductBarcode :value="product.barcode" :width="0.95" :height="16" :font-size="8"
                    :display-value="true" />
                </div>
                <div class="sticker-price-tag">
                  {{ formatCurrency(product?.selling_price) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fluid>

    <!-- Área de Impressão de Etiquetas (Teleportada para o body para renderização e captura pelo vue-to-print) -->
    <Teleport to="body">
      <div v-if="visible" id="printable-labels-print-area" ref="printableLabelsRef">
        <div v-for="i in labelCount" :key="`print-${i}`" class="label-sticker">
          <div class="sticker-name">{{ product?.name }}</div>
          <div class="sticker-barcode-box" v-if="product?.barcode">
            <ProductBarcode :value="product.barcode" :width="0.95" :height="16" :font-size="8" :display-value="true" />
          </div>
          <div class="sticker-price">{{ formatCurrency(product?.selling_price) }}</div>
        </div>
      </div>
    </Teleport>

    <template #footer>
      <div class="flex items-center justify-end gap-2.5 w-full">
        <Button label="Fechar" icon="ri-close-line" severity="secondary" variant="text" size="small"
          @click="emit('update:visible', false)" />
        <Button label="Imprimir Etiquetas" icon="ri-printer-line" severity="primary" size="small"
          class="print-action-btn" @click="handlePrint" />
      </div>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppDialog from '@/components/common/AppDialog.vue'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import Tag from 'primevue/tag'
import Fluid from 'primevue/fluid'
import { useVueToPrint } from 'vue-to-print'
import labelsPrintCss from '@/assets/styles/labelsPrint.css?inline'
import ProductBarcode from '@/components/common/ProductBarcode.vue'
import type { IProduct } from '@/types/product'
import { formatCurrency } from '@/utils/currency'

interface Props {
  visible: boolean
  product: IProduct | null
}

defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
}>()

const labelCount = ref<number>(96)
const printableLabelsRef = ref<HTMLElement | null>(null)

const { handlePrint } = useVueToPrint({
  content: printableLabelsRef,
  documentTitle: 'Etiquetas_Produtos',
  copyStyles: false,
  pageStyle: labelsPrintCss
})
</script>

<style scoped>
.labels-dialog-content {
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
  background: var(--p-brand-100);
  color: var(--p-brand-700);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  border: 1px solid var(--p-brand-300);
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

/* Product Info Card */
.product-info-card {
  background: linear-gradient(135deg, var(--p-brand-50) 0%, #ffffff 100%);
  border: 1px solid var(--p-brand-200);
  border-radius: var(--radius-md);
  padding: 0.85rem 1rem;
  box-shadow: var(--shadow-xs);
}

.info-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.product-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.product-name {
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
}

.product-badges {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.barcode-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  font-weight: 700;
  background: #ffffff;
  color: #334155;
  border: 1px solid #cbd5e1;
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-xs);
}

.stock-pill {
  font-size: 0.72rem;
  color: var(--text-secondary);
  background: #ffffff;
  border: 1px solid var(--border-color);
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-xs);
}

.price-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
  flex-shrink: 0;
}

.price-label {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.price-val {
  font-size: 1.18rem;
  font-weight: 900;
  color: var(--p-brand-600);
}

/* Config Section */
.print-config-section {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
}

.config-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.field-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 140px;
}

.field-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-primary);
}

.custom-stepper :deep(.p-inputnumber-input) {
  text-align: center;
  font-weight: 800;
  font-size: 0.95rem;
  max-width: 60px;
}

.custom-stepper :deep(.p-inputnumber-button) {
  padding: 0.4rem 0.6rem;
}

.quick-presets-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.presets-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.presets-group {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.preset-pill {
  border: 1px solid var(--border-color);
  background: #f8fafc;
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-pill:hover {
  background: var(--p-brand-50);
  border-color: var(--p-brand-300);
  color: var(--p-brand-900);
}

.preset-pill.is-active {
  background: var(--grad-primary);
  border-color: var(--p-brand-600);
  color: #ffffff;
  box-shadow: var(--shadow-xs);
}

/* Preview Section */
.preview-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.preview-title {
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.preview-title i {
  color: var(--p-brand-600);
}

.stickers-sheet-canvas {
  background: #f1f5f9;
  border: 1px dashed #cbd5e1;
  border-radius: var(--radius-lg);
  padding: 1rem;
  max-height: 280px;
  overflow-y: auto;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.03);
}

.stickers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(115px, 1fr));
  gap: 0.45rem;
}

/* Realistic Sticker Card no Preview (Proporção 30x15 mm) */
.realistic-sticker {
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 3px;
  padding: 0.25rem 0.35rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  min-height: 68px;
  position: relative;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.realistic-sticker:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.09);
}

.sticker-product-name {
  font-size: 8px;
  font-weight: 800;
  color: #0f172a;
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
  border: 1px solid var(--p-brand-200);
  padding: 0.5px 3px;
  border-radius: 2px;
  width: 100%;
  line-height: 1.1;
}

.print-action-btn {
  font-weight: 700;
}
</style>
