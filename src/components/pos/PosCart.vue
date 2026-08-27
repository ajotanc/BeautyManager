<template>
  <div class="pos-cart-panel glass-panel">
    <!-- Cabeçalho do Carrinho -->
    <div class="cart-header">
      <div class="header-title-wrap">
        <i class="ri-shopping-cart-2-line header-icon"></i>
        <h3 class="cart-title">Carrinho de Compras</h3>
      </div>
      
      <div class="header-right">
        <Tag severity="secondary" :value="`${posStore.totalItemsCount} itens`" />
        <Button
          v-if="posStore.cart.length > 0"
          icon="ri-delete-bin-line"
          label="Limpar"
          severity="danger"
          variant="text"
          size="small"
          @click="confirmClearCart"
        />
      </div>
    </div>

    <!-- Lista de Itens do Carrinho -->
    <div v-if="posStore.cart.length === 0" class="cart-empty">
      <i class="ri-shopping-bag-3-line empty-icon"></i>
      <h4 class="empty-title">Carrinho Vazio</h4>
      <p class="empty-desc">Escaneie um código de barras ou selecione produtos no catálogo para iniciar a venda.</p>
    </div>

    <div v-else class="cart-items-list">
      <div
        v-for="item in posStore.cart"
        :key="item.product.$id"
        class="cart-item-row"
      >
        <div class="item-main">
          <span class="item-name">{{ item.product.name }}</span>
          <div class="item-meta">
            <span class="item-barcode">{{ item.product.barcode }}</span>
            <span class="item-unit-price">{{ formatCurrency(item.unit_price) }}/un</span>
          </div>
        </div>

        <div class="item-actions">
          <div class="item-qty-controls">
            <button
              type="button"
              class="qty-btn"
              title="Diminuir quantidade"
              @click="posStore.updateQuantity(item.product.$id, item.quantity - 1)"
            >
              <i class="ri-subtract-line"></i>
            </button>
            <span class="qty-val font-semibold">{{ item.quantity }}</span>
            <button
              type="button"
              class="qty-btn"
              title="Aumentar quantidade"
              @click="posStore.updateQuantity(item.product.$id, item.quantity + 1)"
            >
              <i class="ri-add-line"></i>
            </button>
          </div>

          <div class="item-subtotal font-bold">
            {{ formatCurrency(item.subtotal) }}
          </div>

          <Button
            icon="ri-delete-bin-line"
            severity="danger"
            variant="text"
            rounded
            size="small"
            class="item-remove-btn"
            title="Remover item"
            @click="posStore.removeFromCart(item.product.$id)"
          />
        </div>
      </div>
    </div>

    <!-- Rodapé: Desconto, Totais e Botão de Finalizar -->
    <div class="cart-summary">
      <div class="summary-line">
        <span class="text-muted">Subtotal:</span>
        <span class="font-bold">{{ formatCurrency(posStore.subtotal) }}</span>
      </div>

      <div class="summary-line discount-line">
        <span class="discount-label"><i class="ri-discount-percent-line"></i> Desconto:</span>
        <div class="discount-control">
          <InputNumber
            v-model="posStore.discount"
            mode="currency"
            currency="BRL"
            locale="pt-BR"
            :min="0"
            :max="posStore.subtotal"
            size="small"
            class="discount-input"
          />
        </div>
      </div>

      <div class="summary-line grand-total-line">
        <span class="total-label">TOTAL:</span>
        <span class="total-val font-bold">{{ formatCurrency(posStore.totalAmount) }}</span>
      </div>

      <Button
        :disabled="posStore.cart.length === 0"
        severity="primary"
        class="checkout-btn w-full"
        @click="emit('open-payment')"
      >
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
import { useConfirm } from 'primevue/useconfirm'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { usePosStore } from '@/stores/posStore'
import { formatCurrency } from '@/utils/currency'

const emit = defineEmits<{
  (e: 'open-payment'): void
}>()

const posStore = usePosStore()
const confirm = useConfirm()

function confirmClearCart(): void {
  confirm.require({
    message: 'Deseja realmente limpar todos os itens do carrinho?',
    header: 'Confirmar Limpeza',
    icon: 'ri-alert-line',
    acceptLabel: 'Sim, limpar',
    rejectLabel: 'Cancelar',
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

.cart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.header-title-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-icon {
  color: var(--p-brand-600);
  font-size: 1.2rem;
}

.cart-title {
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 1rem;
  color: var(--text-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  padding: 0.65rem 0.25rem 0.65rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.cart-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  background: white;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.cart-item-row:hover {
  border-color: var(--p-brand-300);
  box-shadow: var(--shadow-xs);
}

.item-main {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2px;
}

.item-barcode {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.item-unit-price {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--p-brand-700);
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.item-qty-controls {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: var(--p-surface-50);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 0.15rem;
}

.qty-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xs);
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 0.85rem;
  transition: all 0.15s ease;
}

.qty-btn:hover {
  background: var(--p-brand-500);
  border-color: var(--p-brand-500);
  color: white;
}

.qty-val {
  font-weight: 800;
  font-size: 0.82rem;
  min-width: 22px;
  text-align: center;
  color: var(--text-primary);
}

.item-subtotal {
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 0.92rem;
  color: var(--p-brand-700);
  min-width: 75px;
  text-align: right;
}

.cart-summary {
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

.btn-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-left i {
  font-size: 1.25rem;
}
</style>
