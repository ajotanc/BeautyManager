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
        <div class="pos-box-panel glass-panel">
          <AppSectionHeader title="Leitor de Código / Busca" subtitle="Escaneie o código ou busque pelo nome"
            icon="ri-barcode-line" badge="F1" />

          <div class="search-input-wrapper relative w-full">
            <IconField class="w-full">
              <InputIcon class="ri-barcode-line" />
              <AutoComplete input-id="pos-barcode-scanner-input" v-model="searchQuery" :suggestions="searchSuggestions"
                option-label="name" placeholder="Escaneie o código ou busque por produto ou kit..." size="small" fluid
                autofocus panel-class="pos-search-overlay" @complete="handleSearchComplete"
                @item-select="onItemSelect" @keydown.enter.prevent="handleBarcodeSubmit">
                <template #option="{ option }">
                  <div
                    class="flex items-center justify-between w-full py-2 px-2 gap-3 hover:bg-rose-50/60 rounded-lg transition-colors">
                    <div class="flex flex-col min-w-0 flex-1">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <div v-if="option.type === 'kit'"
                          class="flex align-center gap-1 text-[0.65rem] font-bold px-1.5! py-0.2! rounded bg-pink-100 text-pink-700">
                          <i class="ri-gift-line"></i>
                          <span>KIT</span>
                        </div>
                        <span class="font-bold text-[0.9rem] text-slate-800 truncate">{{ option.name }}</span>
                      </div>
                      <div class="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        <span class="font-mono text-slate-500 tracking-tight">{{ option.barcode }}</span>
                        <span class="text-slate-300">•</span>
                        <span :class="option.is_low_stock ? 'text-amber-600 font-bold' : 'text-slate-500 font-medium'">
                          {{ option.stock_label }}
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

        <div class="pos-box-panel glass-panel hidden! md:flex!">
          <AppSectionHeader title="Teclas de Atalho" subtitle="Navegação rápida pelo teclado" icon="ri-keyboard-line" />
          <div class="shortcuts-list">
            <div class="shortcut-pill">
              <kbd>F1</kbd>
              <span>Focar Leitor</span>
            </div>
            <div class="shortcut-pill">
              <kbd>F4</kbd>
              <span>Finalizar Venda</span>
            </div>
            <div class="shortcut-pill" @click="showMarketingDialog = true">
              <kbd>F6</kbd>
              <span>Marketing IA</span>
            </div>
            <div class="shortcut-pill">
              <kbd>Esc</kbd>
              <span>Cancelar</span>
            </div>
          </div>
        </div>
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

    <WhatsappMarketingDialog v-model:visible="showMarketingDialog" />

    <!-- Área de Impressão Térmica (Oculta na tela, ativada no window.print) -->
    <ThermalReceipt :sale="lastSale" :settings="settingsStore.settings" :change-amount="posStore.changeAmount" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import AutoComplete from 'primevue/autocomplete'
import Button from 'primevue/button'
import PosQuickProductsGrid from '@/components/pos/PosQuickProductsGrid.vue'
import PosCart from '@/components/pos/PosCart.vue'
import PosPaymentDialog from '@/components/pos/PosPaymentDialog.vue'
import PosWhatsappReceiptDialog from '@/components/pos/PosWhatsappReceiptDialog.vue'
import OpenRegisterDialog from '@/components/cash/OpenRegisterDialog.vue'
import WhatsappMarketingDialog from '@/components/customers/WhatsappMarketingDialog.vue'
import ThermalReceipt from '@/components/pos/ThermalReceipt.vue'

import { usePosStore } from '@/stores/posStore'
import { useProductStore } from '@/stores/productStore'
import { useKitStore } from '@/stores/kitStore'
import { useCashRegisterStore } from '@/stores/cashRegisterStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useBarcodeScanner } from '@/composables/useBarcodeScanner'
import { usePosKeyboardShortcuts } from '@/composables/usePosKeyboardShortcuts'
import { useThermalPrinter } from '@/composables/useThermalPrinter'
import type { IProduct } from '@/types/product'
import type { IKit } from '@/types/kit'
import type { ISale } from '@/types/sale'
import { formatCurrency } from '@/utils/currency'
import { useToast } from 'primevue/usetoast'
import { IconField, InputIcon } from 'primevue'
import AppSectionHeader from '@/components/common/AppSectionHeader.vue'

interface PosSearchItem {
  id: string
  type: 'product' | 'kit'
  name: string
  barcode: string
  selling_price: string | number | null | undefined
  stock_label: string
  is_low_stock?: boolean
  product?: IProduct
  kit?: IKit
}

const posStore = usePosStore()
const productStore = useProductStore()
const kitStore = useKitStore()
const cashRegisterStore = useCashRegisterStore()
const settingsStore = useSettingsStore()
const { printReceipt } = useThermalPrinter()
const toast = useToast()

const searchQuery = ref<string | PosSearchItem>('')
const searchSuggestions = ref<PosSearchItem[]>([])
const showPaymentDialog = ref<boolean>(false)
const showWhatsappDialog = ref<boolean>(false)
const showOpenRegisterDialog = ref<boolean>(false)
const showMarketingDialog = ref<boolean>(false)
const lastSale = ref<ISale | null>(null)
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
  focusBarcodeInput()
})

// Filtro de sugestões para o AutoComplete (Produtos e Kits)
function handleSearchComplete(event: { query: string }): void {
  const query = event.query?.trim().toLowerCase() || ''
  if (!query) {
    searchSuggestions.value = []
    return
  }

  const prodResults: PosSearchItem[] = productStore.products
    .filter((p) => p.name.toLowerCase().includes(query) || p.barcode.toLowerCase().includes(query))
    .slice(0, 6)
    .map((p) => ({
      id: p.$id,
      type: 'product',
      name: p.name,
      barcode: p.barcode,
      selling_price: p.selling_price,
      stock_label: `${p.stock_quantity} un.`,
      is_low_stock: p.stock_quantity <= p.min_stock_alert,
      product: p
    }))

  const kitResults: PosSearchItem[] = kitStore.activeKits
    .filter((k) => k.name.toLowerCase().includes(query) || k.barcode.toLowerCase().includes(query))
    .slice(0, 4)
    .map((k) => {
      const stock = kitStore.getAvailableStock(k)
      return {
        id: k.$id,
        type: 'kit',
        name: k.name,
        barcode: k.barcode,
        selling_price: k.selling_price,
        stock_label: `${stock} kits montáveis`,
        is_low_stock: stock === 0,
        kit: k
      }
    })

  searchSuggestions.value = [...prodResults, ...kitResults]
}

// Quando o usuário seleciona um item na lista de sugestões
function onItemSelect(event: { value: PosSearchItem }): void {
  if (!isRegisterOpen.value) {
    toast.add({ severity: 'warn', summary: 'Caixa Fechado', detail: 'Abra o caixa antes de adicionar itens.', life: 3000 })
    return
  }

  if (event.value.type === 'product' && event.value.product) {
    posStore.addToCart(event.value.product, 1)
    toast.add({ severity: 'success', summary: 'Item Adicionado', detail: event.value.name, life: 2000 })
  } else if (event.value.type === 'kit' && event.value.kit) {
    posStore.addKitToCart(event.value.kit, 1)
    toast.add({ severity: 'success', summary: 'Kit Adicionado', detail: event.value.name, life: 2000 })
  }

  searchQuery.value = ''
  searchSuggestions.value = []
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
      searchSuggestions.value = []
    } else {
      toast.add({ severity: 'error', summary: 'Não Encontrado', detail: `Produto ou Kit com código "${barcode}" não cadastrado.`, life: 3000 })
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
  onMarketing: () => {
    showMarketingDialog.value = true
  },
  onCancelOrClose: () => {
    showPaymentDialog.value = false
    showWhatsappDialog.value = false
    showMarketingDialog.value = false
  }
})

// Quando pressiona Enter ou clica no botão "Adicionar"
async function handleBarcodeSubmit(): Promise<void> {
  if (!isRegisterOpen.value) {
    toast.add({ severity: 'warn', summary: 'Caixa Fechado', detail: 'Abra o caixa antes de adicionar itens.', life: 3000 })
    return
  }

  // Se já for um objeto selecionado
  if (typeof searchQuery.value === 'object' && searchQuery.value !== null) {
    onItemSelect({ value: searchQuery.value as PosSearchItem })
    return
  }

  const rawQuery = String(searchQuery.value || '').trim()
  if (!rawQuery) return

  // 1. Tenta adicionar se for correspondência exata de código de barras em produto ou kit
  const exactByBarcode = productStore.products.find((p) => p.barcode === rawQuery)
  if (exactByBarcode) {
    posStore.addToCart(exactByBarcode, 1)
    searchQuery.value = ''
    searchSuggestions.value = []
    toast.add({ severity: 'success', summary: 'Item Adicionado', detail: exactByBarcode.name, life: 2000 })
    focusBarcodeInput()
    return
  }

  const exactKitByBarcode = kitStore.activeKits.find((k) => k.barcode === rawQuery)
  if (exactKitByBarcode) {
    posStore.addKitToCart(exactKitByBarcode, 1)
    searchQuery.value = ''
    searchSuggestions.value = []
    toast.add({ severity: 'success', summary: 'Kit Adicionado', detail: exactKitByBarcode.name, life: 2000 })
    focusBarcodeInput()
    return
  }

  // 2. Se houver correspondência exata de nome em produto ou kit
  const exactByName = productStore.products.find((p) => p.name.toLowerCase() === rawQuery.toLowerCase())
  if (exactByName) {
    posStore.addToCart(exactByName, 1)
    searchQuery.value = ''
    searchSuggestions.value = []
    toast.add({ severity: 'success', summary: 'Item Adicionado', detail: exactByName.name, life: 2000 })
    focusBarcodeInput()
    return
  }

  const exactKitByName = kitStore.activeKits.find((k) => k.name.toLowerCase() === rawQuery.toLowerCase())
  if (exactKitByName) {
    posStore.addKitToCart(exactKitByName, 1)
    searchQuery.value = ''
    searchSuggestions.value = []
    toast.add({ severity: 'success', summary: 'Kit Adicionado', detail: exactKitByName.name, life: 2000 })
    focusBarcodeInput()
    return
  }

  // 3. Se houver 1 único resultado nas sugestões
  if (searchSuggestions.value.length === 1) {
    const single = searchSuggestions.value[0]
    onItemSelect({ value: single })
    return
  }

  if (searchSuggestions.value.length > 1) {
    toast.add({
      severity: 'info',
      summary: 'Selecione o Item',
      detail: `Foram encontrados ${searchSuggestions.value.length} itens. Selecione o item desejado na lista.`,
      life: 3000
    })
    return
  }

  toast.add({
    severity: 'error',
    summary: 'Não Encontrado',
    detail: `Nenhum produto ou kit cadastrado para "${rawQuery}".`,
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
    kitStore.fetchKits(),
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
  background: var(--color-danger-bg);
  border-color: var(--p-brand-200);
  border-width: 1px;
  border-style: solid;
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
  background: var(--p-brand-100);
  color: var(--p-brand-600);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.banner-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--p-brand-800);
}

.banner-desc {
  font-size: 0.84rem;
  color: var(--p-brand-700);
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

.pos-box-panel {
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

@media (max-width: 1023px) {
  .shortcuts-accordion {
    display: none !important;
  }
}
</style>
