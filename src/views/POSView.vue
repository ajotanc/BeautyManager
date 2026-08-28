<template>
  <div class="pos-view">
    <!-- Alerta se o Caixa estiver Fechado -->
    <div v-if="!isRegisterOpen" class="cash-closed-banner glass-panel">
      <div class="banner-content">
        <div class="banner-icon-box">
          <i class="ri-lock-line banner-icon"></i>
        </div>
        <div>
          <h3 class="banner-title">O Caixa Diário está Fechado</h3>
          <p class="banner-desc">É necessário abrir o caixa e informar o fundo de troco antes de iniciar as vendas.</p>
        </div>
      </div>
      <Button label="Abrir Caixa Agora" icon="ri-lock-unlock-line" severity="primary"
        @click="showOpenRegisterDialog = true" />
    </div>

    <!-- Layout Principal do PDV -->
    <div class="pos-grid" :class="{ 'is-disabled': !isRegisterOpen }">
      <!-- Coluna Esquerda: Scanner, Busca Rápida e Grid de Variedades -->
      <div class="pos-left-panel">
        <!-- Barra de Scanner e Busca -->
        <div class="scanner-search-box glass-panel">
          <div class="box-header">
            <div class="header-left">
              <div class="header-icon-circle">
                <i class="ri-barcode-line"></i>
              </div>
              <div class="header-title-meta">
                <h3 class="header-title">Leitor de Código / Busca</h3>
                <span class="header-subtitle">Escaneie o código ou busque pelo nome</span>
              </div>
            </div>
            <span class="kbd-badge">F1</span>
          </div>

          <div class="search-input-wrapper relative w-full">
            <IconField class="w-full">
              <InputIcon class="ri-barcode-line" />
              <AutoComplete input-id="pos-barcode-scanner-input" v-model="searchQuery" :suggestions="productSuggestions"
                option-label="name" placeholder="Escaneie o código de barras ou digite o nome do produto..." size="small"
                fluid autofocus append-to="self" panel-class="pos-search-overlay" @complete="handleSearchComplete"
                @item-select="onProductSelect" @keydown.enter.prevent="handleBarcodeSubmit">
                <template #option="{ option }">
                  <div class="flex items-center justify-between w-full py-2 px-2 gap-3 hover:bg-rose-50/60 rounded-lg transition-colors">
                    <div class="flex flex-col min-w-0 flex-1">
                      <span class="font-bold text-[0.9rem] text-slate-800 truncate">{{ option.name }}</span>
                      <div class="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        <span class="font-mono text-slate-500 tracking-tight">{{ option.barcode }}</span>
                        <span class="text-slate-300">•</span>
                        <span :class="option.stock_quantity <= option.min_stock_alert ? 'text-amber-600 font-bold' : 'text-slate-500 font-medium'">
                          {{ option.stock_quantity }} {{ option.stock_quantity === 1 ? 'unidade' : 'unidades' }}
                        </span>
                      </div>
                    </div>
                    <span class="font-title font-black text-[1rem] text-(--p-brand-600) whitespace-nowrap">
                      {{ formatCurrency(option.selling_price) }}
                    </span>
                  </div>
                </template>
              </AutoComplete>
            </IconField>
          </div>
        </div>

        <!-- Grid de Produtos Rápidos & Variedades sem Código -->
        <PosQuickProductsGrid @item-added="handleItemAddedFromGrid" />

        <!-- Teclas de Atalho com Accordion Oficial do PrimeVue -->
        <Accordion :value="shortcutsAccordionValue" class="shortcuts-accordion glass-panel" @update:value="onAccordionChange">
          <AccordionPanel value="shortcuts">
            <AccordionHeader>
              <div class="header-left">
                <div class="header-icon-circle">
                  <i class="ri-keyboard-line"></i>
                </div>
                <div class="header-title-meta">
                  <h3 class="header-title">Teclas de Atalho</h3>
                  <span class="header-subtitle">Navegação rápida pelo teclado</span>
                </div>
              </div>
              <template #toggleicon>
                <div class="header-toggle-box">
                  <i :class="shortcutsAccordionValue === 'shortcuts' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'"></i>
                </div>
              </template>
            </AccordionHeader>
            <AccordionContent>
              <div class="shortcuts-list">
                <div class="shortcut-pill">
                  <kbd>F1</kbd>
                  <span>Focar Leitor</span>
                </div>
                <div class="shortcut-pill">
                  <kbd>F4</kbd>
                  <span>Finalizar Venda</span>
                </div>
                <div class="shortcut-pill">
                  <kbd>Esc</kbd>
                  <span>Cancelar</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionPanel>
        </Accordion>
      </div>

      <!-- Coluna Direita: Carrinho de Compras e Totais -->
      <div class="pos-right-panel">
        <PosCart @open-payment="showPaymentDialog = true" />
      </div>
    </div>

    <!-- Modais do PDV -->
    <PosPaymentDialog v-model:visible="showPaymentDialog" @sale-completed="onSaleCompleted" />

    <PosWhatsappReceiptDialog v-model:visible="showWhatsappDialog" :sale="lastSale" />

    <OpenRegisterDialog v-model:visible="showOpenRegisterDialog" @opened="onRegisterOpened" />

    <!-- Área de Impressão Térmica (Oculta na tela, ativada no window.print) -->
    <ThermalReceipt :sale="lastSale" :settings="settingsStore.settings" :change-amount="posStore.changeAmount" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import AutoComplete from 'primevue/autocomplete'
import Button from 'primevue/button'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'
import PosQuickProductsGrid from '@/components/pos/PosQuickProductsGrid.vue'
import PosCart from '@/components/pos/PosCart.vue'
import PosPaymentDialog from '@/components/pos/PosPaymentDialog.vue'
import PosWhatsappReceiptDialog from '@/components/pos/PosWhatsappReceiptDialog.vue'
import OpenRegisterDialog from '@/components/cash/OpenRegisterDialog.vue'
import ThermalReceipt from '@/components/pos/ThermalReceipt.vue'

import { usePosStore } from '@/stores/posStore'
import { useProductStore } from '@/stores/productStore'
import { useCashRegisterStore } from '@/stores/cashRegisterStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useBarcodeScanner } from '@/composables/useBarcodeScanner'
import { usePosKeyboardShortcuts } from '@/composables/usePosKeyboardShortcuts'
import { useThermalPrinter } from '@/composables/useThermalPrinter'
import type { IProduct } from '@/types/product'
import type { ISale } from '@/types/sale'
import { formatCurrency } from '@/utils/currency'
import { useToast } from 'primevue/usetoast'
import { IconField, InputIcon } from 'primevue'

const posStore = usePosStore()
const productStore = useProductStore()
const cashRegisterStore = useCashRegisterStore()
const settingsStore = useSettingsStore()
const { printReceipt } = useThermalPrinter()
const toast = useToast()

const searchQuery = ref<string | IProduct>('')
const productSuggestions = ref<IProduct[]>([])
const showPaymentDialog = ref<boolean>(false)
const showWhatsappDialog = ref<boolean>(false)
const showOpenRegisterDialog = ref<boolean>(false)
const lastSale = ref<ISale | null>(null)
const shortcutsAccordionValue = ref<string | null>(typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'shortcuts' : null)

function onAccordionChange(val: string | string[] | null | undefined): void {
  shortcutsAccordionValue.value = Array.isArray(val) ? (val[0] || null) : (val || null)
}

const isRegisterOpen = computed(() => cashRegisterStore.isRegisterOpen)

function focusBarcodeInput(): void {
  if (typeof window !== 'undefined' && window.innerWidth < 1024) return
  nextTick(() => {
    const el = (document.getElementById('pos-barcode-scanner-input') as HTMLInputElement | null)
      ?? document.querySelector<HTMLInputElement>('.pos-left-panel .p-autocomplete-input, .p-autocomplete input')
    if (el) {
      el.focus()
      el.select()
    }
  })
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    shortcutsAccordionValue.value = window.innerWidth >= 1024 ? 'shortcuts' : null
  }
  focusBarcodeInput()
})

// Filtro de sugestões para o AutoComplete
function handleSearchComplete(event: { query: string }): void {
  const query = event.query?.trim().toLowerCase() || ''
  if (!query) {
    productSuggestions.value = []
    return
  }

  productSuggestions.value = productStore.products.filter(
    (p) => p.name.toLowerCase().includes(query) || p.barcode.toLowerCase().includes(query)
  ).slice(0, 8)
}

// Quando o usuário seleciona um item na lista de sugestões
function onProductSelect(event: { value: IProduct }): void {
  if (!isRegisterOpen.value) {
    toast.add({ severity: 'warn', summary: 'Caixa Fechado', detail: 'Abra o caixa antes de adicionar itens.', life: 3000 })
    return
  }
  posStore.addToCart(event.value, 1)
  searchQuery.value = ''
  productSuggestions.value = []
  toast.add({ severity: 'success', summary: 'Item Adicionado', detail: event.value.name, life: 2000 })
  focusBarcodeInput()
}

function handleItemAddedFromGrid(prod: IProduct): void {
  toast.add({ severity: 'success', summary: 'Item Adicionado', detail: prod.name, life: 1800 })
  focusBarcodeInput()
}

// Leitor de Código de Barras Físico Global (Bipe instantâneo)
useBarcodeScanner({
  onScan: async (barcode) => {
    if (!isRegisterOpen.value) {
      toast.add({ severity: 'warn', summary: 'Caixa Fechado', detail: 'Abra o caixa antes de bipar itens.', life: 3000 })
      return
    }
    const success = await posStore.addByBarcode(barcode)
    if (success) {
      toast.add({ severity: 'success', summary: 'Item Bipado', detail: `Código: ${barcode}`, life: 2000 })
      searchQuery.value = ''
    } else {
      toast.add({ severity: 'error', summary: 'Não Encontrado', detail: `Produto com código "${barcode}" não cadastrado.`, life: 3000 })
    }
    focusBarcodeInput()
  }
})

// Atalhos de Teclado no PDV
usePosKeyboardShortcuts({
  onSearchProduct: () => {
    focusBarcodeInput()
  },
  onCheckout: () => {
    if (!isRegisterOpen.value) {
      toast.add({ severity: 'warn', summary: 'Caixa Fechado', detail: 'Abra o caixa antes de finalizar a venda.', life: 3000 })
      return
    }
    if (posStore.cart.length === 0) {
      toast.add({ severity: 'info', summary: 'Carrinho Vazio', detail: 'Adicione produtos ao carrinho antes de finalizar a venda.', life: 2500 })
      return
    }
    showPaymentDialog.value = true
  },
  onCancelOrClose: () => {
    showPaymentDialog.value = false
    showWhatsappDialog.value = false
  }
})

// Quando pressiona Enter ou clica no botão "Adicionar"
async function handleBarcodeSubmit(): Promise<void> {
  if (!isRegisterOpen.value) {
    toast.add({ severity: 'warn', summary: 'Caixa Fechado', detail: 'Abra o caixa antes de adicionar itens.', life: 3000 })
    return
  }

  // Se já for um objeto IProduct selecionado
  if (typeof searchQuery.value === 'object' && searchQuery.value !== null) {
    onProductSelect({ value: searchQuery.value as IProduct })
    return
  }

  const rawQuery = String(searchQuery.value || '').trim()
  if (!rawQuery) return

  // 1. Tenta adicionar se for correspondência exata de código de barras
  const exactByBarcode = productStore.products.find((p) => p.barcode === rawQuery)
  if (exactByBarcode) {
    posStore.addToCart(exactByBarcode, 1)
    searchQuery.value = ''
    productSuggestions.value = []
    toast.add({ severity: 'success', summary: 'Item Adicionado', detail: exactByBarcode.name, life: 2000 })
    focusBarcodeInput()
    return
  }

  // 2. Se houver 1 único resultado com nome idêntico exato
  const exactByName = productStore.products.find((p) => p.name.toLowerCase() === rawQuery.toLowerCase())
  if (exactByName) {
    posStore.addToCart(exactByName, 1)
    searchQuery.value = ''
    productSuggestions.value = []
    toast.add({ severity: 'success', summary: 'Item Adicionado', detail: exactByName.name, life: 2000 })
    focusBarcodeInput()
    return
  }

  // 3. Se for uma busca parcial com sugestões abertas
  if (productSuggestions.value.length === 1) {
    // Apenas 1 sugestão evidente encontrada
    const singleProd = productSuggestions.value[0]
    if (singleProd) {
      posStore.addToCart(singleProd, 1)
      searchQuery.value = ''
      productSuggestions.value = []
      toast.add({ severity: 'success', summary: 'Item Adicionado', detail: singleProd.name, life: 2000 })
      focusBarcodeInput()
      return
    }
  }

  if (productSuggestions.value.length > 1) {
    toast.add({
      severity: 'info',
      summary: 'Selecione o Produto',
      detail: `Foram encontrados ${productSuggestions.value.length} produtos. Selecione o item desejado na lista.`,
      life: 3000
    })
    return
  }

  toast.add({
    severity: 'error',
    summary: 'Não Encontrado',
    detail: `Nenhum produto cadastrado para "${rawQuery}".`,
    life: 3000
  })
}

async function onSaleCompleted(sale: ISale, shouldPrint: boolean, shouldOpenWhatsapp?: boolean): Promise<void> {
  lastSale.value = sale
  toast.add({
    severity: 'success',
    summary: 'Venda Concluída!',
    detail: `Total: ${formatCurrency(sale.total_amount)}`,
    life: 3000
  })

  // Impressão Térmica Automática
  if (shouldPrint) {
    await nextTick()
    await printReceipt()
  }

  // Se a opção de envio por WhatsApp estiver ativa
  if (shouldOpenWhatsapp || (typeof shouldOpenWhatsapp === 'undefined' && sale.customer_phone)) {
    showWhatsappDialog.value = true
  }
}

function onRegisterOpened(): void {
  focusBarcodeInput()
}

onMounted(async () => {
  await Promise.all([
    productStore.fetchAll(),
    cashRegisterStore.checkActiveRegister()
  ])
  focusBarcodeInput()
})
</script>

<style scoped>
.pos-view {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
}

.cash-closed-banner {
  background: #fff5f5;
  border-color: #fed7d7;
  padding: 1.25rem 1.5rem;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.banner-icon-box {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: #fee2e2;
  color: #dc2626;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.banner-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #991b1b;
}

.banner-desc {
  font-size: 0.84rem;
  color: #b91c1c;
}

.pos-grid {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: 1rem;
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

@media (max-width: 1024px) {
  .pos-view {
    height: auto !important;
    max-height: none !important;
    overflow-y: visible !important;
    overflow-x: hidden !important;
    padding-bottom: 0.5rem;
    gap: 1rem;
  }

  .pos-grid {
    display: flex;
    flex-direction: column;
    height: auto !important;
    min-height: auto !important;
    overflow: visible !important;
    gap: 1rem;
    width: 100%;
  }

  .pos-left-panel,
  .pos-right-panel {
    height: auto !important;
    min-height: auto !important;
    overflow: visible !important;
    width: 100%;
  }

  .shortcuts-panel {
    display: flex !important;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: space-between;
  }

  .shortcuts-list {
    gap: 0.75rem !important;
    flex-wrap: wrap;
  }
}

.pos-grid.is-disabled {
  opacity: 0.55;
  pointer-events: none;
  filter: grayscale(0.2);
}

.pos-left-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.pos-right-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.scanner-search-box {
  padding: 1rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;
  flex-shrink: 0;
  z-index: 40;
  overflow: visible !important;
}

.box-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.header-icon-circle {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--p-brand-50);
  border: 1px solid var(--p-brand-200);
  color: var(--p-brand-600);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.header-title-meta {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.header-title {
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 0.98rem;
  color: var(--text-primary);
  line-height: 1.1;
  margin: 0;
}

.header-subtitle {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-secondary);
}

:deep(.p-autocomplete) {
  width: 100% !important;
}

:deep(.pos-search-overlay),
:deep(.p-autocomplete-overlay) {
  width: 100% !important;
  min-width: 100% !important;
  border-radius: var(--radius-md) !important;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15) !important;
  border: 1px solid var(--border-color) !important;
  background: #ffffff !important;
  margin-top: 6px !important;
  z-index: 1000 !important;
  overflow: hidden !important;
}

:deep(.pos-search-overlay .p-autocomplete-list),
:deep(.p-autocomplete-overlay .p-autocomplete-list) {
  padding: 0.35rem !important;
  gap: 0.25rem !important;
}

:deep(.pos-search-overlay .p-autocomplete-option),
:deep(.p-autocomplete-overlay .p-autocomplete-option) {
  border-radius: var(--radius-sm) !important;
  padding: 0.35rem 0.5rem !important;
}

:deep(.pos-search-overlay .p-autocomplete-option:hover),
:deep(.p-autocomplete-overlay .p-autocomplete-option:hover) {
  background: var(--p-brand-50) !important;
}

.p-name {
  font-weight: 700;
  font-size: 0.88rem;
  color: var(--text-primary);
  display: block;
}

.p-meta {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.p-price {
  font-family: var(--font-title);
  font-weight: 800;
  color: var(--p-brand-600);
  font-size: 0.95rem;
}

:deep(.shortcuts-accordion) {
  border: 1px solid var(--border-color) !important;
  border-radius: var(--radius-md) !important;
  overflow: hidden !important;
  flex-shrink: 0 !important;
}

:deep(.shortcuts-accordion .p-accordionpanel) {
  border: none !important;
  background: transparent !important;
}

:deep(.shortcuts-accordion .p-accordionheader) {
  background: transparent !important;
  border: none !important;
  padding: 0.75rem 1.15rem !important;
  color: inherit !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  cursor: pointer !important;
  transition: opacity 0.15s ease !important;
}

:deep(.shortcuts-accordion .p-accordionheader:hover) {
  background: transparent !important;
  opacity: 0.9 !important;
}

.header-toggle-box {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: var(--p-surface-50);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

:deep(.shortcuts-accordion .p-accordionheader:hover) .header-toggle-box {
  background: var(--p-brand-50);
  border-color: var(--p-brand-200);
  color: var(--p-brand-600);
}

:deep(.shortcuts-accordion .p-accordioncontent) {
  background: transparent !important;
  border: none !important;
}

:deep(.shortcuts-accordion .p-accordioncontent-content) {
  padding: 0.65rem 1.15rem 0.85rem 1.15rem !important;
  background: transparent !important;
  border-top: 1px solid var(--border-color) !important;
}

.shortcuts-list {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.shortcut-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: var(--p-brand-50);
  border: 1px solid var(--border-color);
  padding: 0.28rem 0.65rem;
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-secondary);
  transition: all 0.15s ease;
}

.shortcut-pill:hover {
  background: var(--p-brand-100);
  border-color: var(--p-brand-300);
  color: var(--text-primary);
}

.shortcut-pill kbd {
  background: var(--grad-primary);
  color: #ffffff;
  padding: 0.1rem 0.45rem;
  border-radius: var(--radius-xs);
  font-weight: 800;
  font-size: 0.72rem;
  box-shadow: var(--shadow-xs);
  border: none;
}
</style>
