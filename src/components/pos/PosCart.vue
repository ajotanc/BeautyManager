<template>
  <div class="pos-cart-panel glass-panel">
    <!-- Cabeçalho do Carrinho Refinado -->
    <div class="cart-header">
      <AppSectionHeader title="Carrinho de Compras"
        :subtitle="`${posStore.totalItemsCount} ${posStore.totalItemsCount === 1 ? 'item adicionado' : 'itens adicionados'}`"
        icon="ri-shopping-cart-2-fill">
        <template #actions v-if="posStore.cart.length > 0">
          <button type="button" class="clear-cart-action-btn" title="Esvaziar todos os itens do carrinho"
            @click="confirmClearCart">
            <i class="ri-delete-bin-line"></i>
            <span>Limpar</span>
          </button>
        </template>
      </AppSectionHeader>


    </div>

    <!-- Lista de Itens do Carrinho -->
    <AppEmptyState v-if="posStore.cart.length === 0" icon="ri-shopping-bag-3-line" title="Pronto para a próxima venda!"
      description="Passe o produto no leitor ou escolha no catálogo ao lado para começar." />

    <div v-else class="cart-items-list">
      <div v-for="item in posStore.cart" :key="item.product?.$id || item.kit?.$id"
        class="cart-item-card animate-slide-down" :class="{ 'is-kit-card': Boolean(item.kit) }">
        <!-- Topo do Item: Nome completo e Botão Excluir -->
        <div class="item-card-top">
          <div class="item-name-group">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span v-if="item.kit" class="kit-chip-tag">
                <i class="ri-gift-line"></i> Kit
              </span>
              <span class="item-name" :title="item.product?.name || item.kit?.name">
                {{ item.product?.name || item.kit?.name }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="item-barcode-tag font-mono">{{ item.product?.barcode || item.kit?.barcode }}</span>
              <span v-if="item.kit?.items" class="text-[0.7rem] text-slate-500">
                ({{item.kit.items.map(k => `${k.quantity}x ${k.product?.name || 'Item'}`).join(', ')}})
              </span>
            </div>
          </div>
          <button type="button" class="item-delete-btn" title="Remover item do carrinho"
            @click="posStore.removeFromCart(item.product?.$id || item.kit?.$id || '')">
            <i class="ri-delete-bin-line"></i>
          </button>
        </div>

        <!-- Base do Item: Preço Unitário, Quantidade Pill e Subtotal -->
        <div class="item-card-bottom">
          <div class="item-pricing">
            <span class="item-unit-val">{{ formatCurrency(item.unit_price) }}</span>
            <span class="item-unit-label">/un</span>
          </div>

          <div class="item-qty-pill">
            <button type="button" class="qty-pill-btn" title="Diminuir quantidade"
              @click="posStore.updateQuantity(item.product?.$id || item.kit?.$id || '', item.quantity - 1)">
              <i class="ri-subtract-line"></i>
            </button>
            <span class="qty-pill-val">{{ item.quantity }}</span>
            <button type="button" class="qty-pill-btn" title="Aumentar quantidade"
              @click="posStore.updateQuantity(item.product?.$id || item.kit?.$id || '', item.quantity + 1)">
              <i class="ri-add-line"></i>
            </button>
          </div>

          <div class="item-subtotal-box">
            <span class="item-subtotal-val">{{ formatCurrency(item.subtotal) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Rodapé: Desconto, Totais e Botão de Finalizar -->
    <div class="cart-summary">
      <div class="summary-line">
        <span class="text-muted">Subtotal:</span>
        <span class="font-bold">{{ formatCurrency(posStore.subtotal) }}</span>
      </div>

      <!-- Desconto e Chips Rápidos -->
      <div class="discount-container">
        <div class="summary-line discount-line">
          <span class="discount-label"><i class="ri-discount-percent-line"></i> Desconto:</span>
          <div class="discount-control">
            <InputNumber v-model="posStore.discount" mode="currency" currency="BRL" locale="pt-BR" :min="0"
              :max="posStore.subtotal" size="small" class="discount-input" />
          </div>
        </div>

        <!-- Chips de Desconto Rápido -->
        <div v-if="posStore.subtotal > 0" class="discount-chips-row">
          <button type="button" class="discount-chip" title="Desconto de R$ 5,00" @click="applyFixedDiscount(5)">
            -R$ 5
          </button>
          <button type="button" class="discount-chip" title="Desconto de R$ 10,00" @click="applyFixedDiscount(10)">
            -R$ 10
          </button>
          <button type="button" class="discount-chip" title="Desconto de 5%" @click="applyPercentageDiscount(5)">
            5% OFF
          </button>
          <button type="button" class="discount-chip" title="Desconto de 10%" @click="applyPercentageDiscount(10)">
            10% OFF
          </button>
          <button v-if="posStore.discount > 0" type="button" class="discount-chip chip-clear" title="Remover desconto"
            @click="posStore.discount = 0">
            <i class="ri-close-line"></i> Limpar
          </button>
        </div>
      </div>

      <div class="summary-line grand-total-line">
        <div class="flex flex-col">
          <span class="total-label">TOTAL:</span>
          <span v-if="posStore.discount > 0" class="saved-badge">
            <i class="ri-sparkling-line"></i> Economia de {{ formatCurrency(posStore.discount) }}
          </span>
        </div>
        <span class="total-val font-bold">{{ formatCurrency(posStore.totalAmount) }}</span>
      </div>

      <Button :disabled="posStore.cart.length === 0" severity="primary" class="checkout-btn w-full"
        @click="emit('open-payment')">
        <div class="btn-left">
          <i class="ri-checkbox-circle-line"></i>
          <span>FINALIZAR VENDA</span>
        </div>
        <span class="kbd-badge">F4</span>
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppConfirm } from '@/composables/useAppConfirm'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import { usePosStore } from '@/stores/posStore'
import { formatCurrency } from '@/utils/currency'
import AppSectionHeader from '../common/AppSectionHeader.vue'

const emit = defineEmits<{
  (e: 'open-payment'): void
}>()

const posStore = usePosStore()
const { requireConfirm } = useAppConfirm()

function applyFixedDiscount(amount: number): void {
  const finalDiscount = Math.min(amount, posStore.subtotal)
  posStore.discount = finalDiscount
}

function applyPercentageDiscount(percent: number): void {
  const calculated = (posStore.subtotal * percent) / 100
  posStore.discount = Math.min(calculated, posStore.subtotal)
}

function confirmClearCart(): void {
  requireConfirm({
    message: 'Deseja realmente limpar todos os itens do carrinho?',
    header: 'Confirmar Limpeza',
    icon: 'ri-alert-line',
    acceptLabel: 'Sim, limpar',
    rejectLabel: 'Cancelar',
    severity: 'error',
    accept: () => {
      posStore.clearCart()
    }
  })
}
</script>

<style scoped>
.pos-cart-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 1.15rem;
  overflow: hidden;
}

@media (max-width: 1024px) {
  .pos-cart-panel {
    height: auto;
    min-height: auto;
    overflow: visible;
    padding: 0.85rem;
  }
}

.cart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.cart-header-left {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.cart-icon-circle {
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

.cart-title-meta {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.cart-title {
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 0.98rem;
  color: var(--text-primary);
  line-height: 1.1;
  margin: 0;
}

.cart-subtitle {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.clear-cart-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.76rem;
  font-weight: 700;
  color: #dc2626;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  padding: 0.35rem 0.7rem;
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.clear-cart-action-btn:hover {
  background: #dc2626;
  color: #ffffff;
  border-color: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.25);
}

.clear-cart-action-btn i {
  font-size: 0.85rem;
}

.cart-empty {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 3rem;
  color: var(--p-brand-300);
  margin-bottom: 0.75rem;
}

.empty-title {
  font-weight: 800;
  font-size: 1.05rem;
  color: var(--text-primary);
}

.empty-desc {
  font-size: 0.82rem;
  max-width: 260px;
  margin-top: 0.35rem;
  color: var(--text-secondary);
}

.cart-items-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.75rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  width: 100%;
}

.cart-item-card {
  width: 100%;
  box-sizing: border-box;
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.75rem 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-xs);
}

.cart-item-card:hover {
  border-color: var(--p-brand-300);
  box-shadow: 0 4px 14px rgba(253, 0, 84, 0.07);
}

.item-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.item-name-group {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
  word-break: break-word;
}

.item-barcode-tag {
  font-size: 0.68rem;
  color: var(--text-muted);
  font-weight: 600;
  background: var(--p-surface-50);
  padding: 0.08rem 0.4rem;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-subtle);
  width: fit-content;
}

.item-delete-btn {
  width: 26px;
  height: 26px;
  border-radius: var(--radius-xs);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.item-delete-btn:hover {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fca5a5;
}

.item-card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding-top: 0.45rem;
  border-top: 1px dashed var(--border-subtle);
}

.item-pricing {
  display: flex;
  align-items: baseline;
  gap: 0.15rem;
}

.item-unit-val {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.item-unit-label {
  font-size: 0.68rem;
  color: var(--text-muted);
}

.item-qty-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  background: var(--p-surface-50);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 0.15rem;
}

.qty-pill-btn {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-xs);
  background: #ffffff;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.qty-pill-btn:hover {
  background: var(--p-brand-500);
  border-color: var(--p-brand-500);
  color: #ffffff;
}

.qty-pill-val {
  min-width: 24px;
  text-align: center;
  font-weight: 800;
  font-size: 0.84rem;
  color: var(--text-primary);
}

.item-subtotal-box {
  text-align: right;
}

.item-subtotal-val {
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 1rem;
  color: var(--p-brand-700);
}

.cart-summary {
  margin-top: auto;
  flex-shrink: 0;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.88rem;
}

.discount-line {
  background: var(--p-brand-50);
  padding: 0.4rem 0.6rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
}

.discount-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--p-brand-800);
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.discount-control {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

:deep(.discount-input input) {
  width: 100px !important;
  padding: 0.25rem 0.4rem !important;
  font-size: 0.82rem !important;
  text-align: right;
}

.discount-container {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.discount-chips-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.discount-chip {
  background: var(--p-brand-50);
  border: 1px solid var(--border-color);
  color: var(--p-brand-800);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
}

.discount-chip:hover {
  background: var(--p-brand-500);
  color: #ffffff;
  border-color: var(--p-brand-500);
  transform: translateY(-1px);
}

.discount-chip.chip-clear {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fca5a5;
}

.discount-chip.chip-clear:hover {
  background: #dc2626;
  color: #ffffff;
  border-color: #dc2626;
}

.saved-badge {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--p-gold-700);
  background: var(--p-gold-50);
  border: 1px solid var(--p-gold-300);
  padding: 0.1rem 0.4rem;
  border-radius: var(--radius-xs);
  width: fit-content;
}

.grand-total-line {
  padding: 0.6rem 0;
  border-top: 1px dashed var(--border-color);
  border-bottom: 1px dashed var(--border-color);
}

.total-label {
  font-family: var(--font-title);
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-primary);
}

.total-val {
  font-family: var(--font-title);
  font-size: 1.6rem;
  font-weight: 900;
  color: var(--p-brand-600);
}

.checkout-btn {
  display: flex;
  align-items: center;
  justify-content: space-between !important;
  padding: 0.85rem 1.25rem;
  font-family: var(--font-title);
  font-size: 0.98rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.cart-item-card.is-kit-card {
  border-left: 3px solid #ec4899;
  background: linear-gradient(90deg, rgba(236, 72, 153, 0.04) 0%, rgba(255, 255, 255, 1) 100%);
}

.kit-chip-tag {
  font-size: 0.65rem;
  font-weight: 800;
  color: #ec4899;
  background: rgba(236, 72, 153, 0.12);
  padding: 0.1rem 0.35rem;
  border-radius: var(--radius-xs);
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
}

.btn-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-left i {
  font-size: 1.25rem;
}
</style>
