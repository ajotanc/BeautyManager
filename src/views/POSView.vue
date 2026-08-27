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
            <span class="box-title"><i class="ri-barcode-line"></i> Leitor de Código de Barras / Busca</span>
            <span class="kbd-badge">F1</span>
          </div>

          <IconField class="w-full">
            <InputIcon class="ri-barcode-line" />
            <AutoComplete input-id="pos-barcode-scanner-input" v-model="searchQuery" :suggestions="productSuggestions"
              option-label="name" placeholder="Escaneie o código de barras ou digite o nome do produto..." size="small"
              fluid autofocus @complete="handleSearchComplete" @item-select="onProductSelect"
              @keydown.enter.prevent="handleBarcodeSubmit">
              <template #option="{ option }">
                <div class="flex items-center justify-between w-full py-1 gap-4">
                  <div class="flex flex-col">
                    <span class="font-bold text-sm text-surface-900">{{ option.name }}</span>
                    <span class="text-xs text-surface-500">{{ option.barcode }} • Estoque: {{ option.stock_quantity }}
                      un.</span>
                  </div>
                  <strong class="text-primary font-bold text-sm whitespace-nowrap">{{
                    formatCurrency(option.selling_price) }}</strong>
                </div>
              </template>
            </AutoComplete>
          </IconField>
        </div>

        <!-- Grid de Produtos Rápidos & Variedades sem Código -->
        <PosQuickProductsGrid />

        <div class="shortcuts-panel glass-panel">
          <span class="shortcuts-title"><i class="ri-keyboard-line"></i> Teclas de Atalho:</span>
          <div class="shortcuts-list">
            <span class="shortcut-item"><kbd>F1</kbd> <span>Focar Leitor</span></span>
            <span class="shortcut-item"><kbd>F4</kbd> <span>Finalizar Venda</span></span>
            <span class="shortcut-item"><kbd>Esc</kbd> <span>Cancelar</span></span>
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

    <PosWhatsappReceiptDialog v-model:visible="showWhatsappDialog" :sale="lastSale"
      :settings="settingsStore.settings" />

    <OpenRegisterDialog v-model:visible="showOpenRegisterDialog" @opened="onRegisterOpened" />

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

const isRegisterOpen = computed(() => cashRegisterStore.isRegisterOpen)

function focusBarcodeInput(): void {
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

async function onSaleCompleted(sale: ISale, shouldPrint: boolean): Promise<void> {
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

  // Se o cliente tiver WhatsApp informado, abre diálogo de envio
  if (sale.customer_phone) {
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
  padding: 1rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  position: relative;
  flex-shrink: 0;
}

.box-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.box-title {
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.box-title i {
  color: var(--p-brand-600);
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 30;
  max-height: 240px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.search-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: all 0.15s ease;
}

.search-item-row:hover {
  background: var(--p-brand-50);
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

.shortcuts-panel {
  padding: 0.65rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.shortcuts-title {
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.shortcuts-list {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.shortcut-item {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.shortcuts-list kbd {
  background: var(--p-brand-100);
  color: var(--p-brand-900);
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-xs);
  font-weight: 700;
  border: 1px solid var(--p-brand-300);
}
</style>
