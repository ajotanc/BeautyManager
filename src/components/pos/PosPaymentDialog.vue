<template>
  <Dialog
    :visible="visible"
    modal
    header="Finalizar Venda & Pagamento"
    :style="{ width: '580px', maxWidth: '95vw' }"
    :closable="!posStore.isProcessingSale"
    @update:visible="(val) => emit('update:visible', val)"
  >
    <Fluid>
      <div class="payment-dialog-content">
        <!-- Total a Pagar em Destaque -->
        <div class="total-banner">
          <span class="total-label">TOTAL A PAGAR</span>
          <span class="total-value">{{ formatCurrency(posStore.totalAmount) }}</span>
          <div v-if="posStore.discount > 0" class="discount-badge">
            Desconto: {{ formatCurrency(posStore.discount) }}
          </div>
        </div>

        <!-- Seleção da Forma de Pagamento -->
        <div class="field-group">
          <label class="field-label">Forma de Pagamento</label>
          <div class="payment-methods-grid">
            <button
              v-for="method in paymentMethods"
              :key="method.value"
              type="button"
              class="method-btn"
              :class="{ 'is-selected': posStore.selectedPaymentMethod === method.value }"
              @click="selectPaymentMethod(method.value)"
            >
              <i :class="method.icon"></i>
              <span>{{ method.label }}</span>
            </button>
          </div>
        </div>

        <!-- Pagamento em Dinheiro com Cédulas Rápidas e Troco -->
        <div v-if="posStore.selectedPaymentMethod === 'Cash'" class="cash-section">
          <span class="section-title"><i class="ri-money-dollar-circle-line"></i> Valor Recebido em Dinheiro</span>

          <!-- Botões de Cédulas Rápidas -->
          <div class="bills-quick-grid">
            <button
              v-for="bill in quickBills"
              :key="bill"
              type="button"
              class="bill-btn"
              @click="setQuickBill(bill)"
            >
              R$ {{ bill }}
            </button>
            <button type="button" class="bill-btn exact-bill" @click="setExactAmount">
              <i class="ri-check-double-line"></i>
              <span>Valor Exato</span>
            </button>
          </div>

          <div class="cash-inputs-row">
            <div class="input-col">
              <FloatLabel variant="in">
                <InputNumber
                  id="amount_paid"
                  v-model="posStore.amountPaid"
                  mode="currency"
                  currency="BRL"
                  locale="pt-BR"
                  size="small"
                  fluid
                  :min="0"
                  class="font-bold"
                />
                <label for="amount_paid">Valor Entregue pelo Cliente</label>
              </FloatLabel>
            </div>

            <div class="change-box" :class="{ 'has-change': posStore.changeAmount > 0 }">
              <span class="change-label">Troco a Devolver</span>
              <span class="change-val">{{ formatCurrency(posStore.changeAmount) }}</span>
            </div>
          </div>
        </div>

        <!-- Dados Opcionais da Cliente (para WhatsApp) -->
        <div class="customer-section">
          <span class="section-title"><i class="ri-user-3-line"></i> Dados da Cliente (Opcional para Recibo Digital)</span>
          <div class="customer-grid">
            <div>
              <FloatLabel variant="in">
                <InputText id="customer_name" v-model="posStore.customerName" size="small" fluid />
                <label for="customer_name">Nome da Cliente</label>
              </FloatLabel>
            </div>
            <div>
              <FloatLabel variant="in">
                <InputText id="customer_phone" v-model="posStore.customerPhone" size="small" fluid />
                <label for="customer_phone">WhatsApp (com DDD)</label>
              </FloatLabel>
            </div>
          </div>
        </div>

        <!-- Opção de Impressão -->
        <div class="print-option">
          <Checkbox v-model="autoPrintReceipt" :binary="true" input-id="auto-print" />
          <label for="auto-print" class="print-label">Imprimir cupom térmico automaticamente</label>
        </div>
      </div>
    </Fluid>

    <template #footer>
      <div class="dialog-actions">
        <Button
          label="Cancelar (Esc)"
          icon="ri-close-line"
          severity="secondary"
          variant="text"
          size="small"
          :disabled="posStore.isProcessingSale"
          @click="emit('update:visible', false)"
        />
        <Button
          label="Concluir Venda (Enter)"
          icon="ri-check-line"
          severity="primary"
          size="small"
          :loading="posStore.isProcessingSale"
          class="confirm-sale-btn"
          @click="handleConfirmSale"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import FloatLabel from 'primevue/floatlabel'
import Fluid from 'primevue/fluid'
import type { PaymentMethod, ISale } from '@/types/sale'
import { usePosStore } from '@/stores/posStore'
import { formatCurrency } from '@/utils/currency'

interface Props {
  visible: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'sale-completed', sale: ISale, shouldPrint: boolean): void
}>()

const posStore = usePosStore()
const autoPrintReceipt = ref<boolean>(true)

const paymentMethods: { label: string; value: PaymentMethod; icon: string }[] = [
  { label: 'Dinheiro', value: 'Cash', icon: 'ri-money-dollar-circle-line' },
  { label: 'PIX', value: 'Pix', icon: 'ri-qr-code-line' },
  { label: 'Cartão Crédito', value: 'Credit', icon: 'ri-bank-card-line' },
  { label: 'Cartão Débito', value: 'Debit', icon: 'ri-wallet-3-line' }
]

const quickBills = [10, 20, 50, 100, 200]

function selectPaymentMethod(method: PaymentMethod): void {
  posStore.selectedPaymentMethod = method
  if (method === 'Cash' && posStore.amountPaid === 0) {
    posStore.amountPaid = posStore.totalAmount
  }
}

function setQuickBill(amount: number): void {
  posStore.amountPaid = amount
}

function setExactAmount(): void {
  posStore.amountPaid = posStore.totalAmount
}

async function handleConfirmSale(): Promise<void> {
  try {
    const sale = await posStore.checkout()
    emit('sale-completed', sale, autoPrintReceipt.value)
    emit('update:visible', false)
  } catch {
    // Erro tratado pela store e toast
  }
}
</script>

<style scoped>
.payment-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 0.25rem 0;
}

.total-banner {
  background: var(--grad-primary);
  color: white;
  padding: 1.1rem 1.25rem;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
}

.total-label {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  opacity: 0.92;
}

.total-value {
  font-family: var(--font-title);
  font-size: 2rem;
  font-weight: 900;
  line-height: 1.1;
}

.discount-badge {
  margin-top: 0.35rem;
  font-size: 0.78rem;
  background: rgba(255, 255, 255, 0.22);
  padding: 0.15rem 0.6rem;
  border-radius: var(--radius-full);
}

.field-label {
  font-weight: 700;
  font-size: 0.82rem;
  color: var(--text-primary);
  display: block;
  margin-bottom: 0.35rem;
}

.payment-methods-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.method-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.75rem 0.5rem;
  border: 1px solid var(--border-color);
  background: #ffffff;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 700;
  font-size: 0.8rem;
  color: var(--text-secondary);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.method-btn i {
  font-size: 1.25rem;
  color: var(--p-brand-600);
}

.method-btn:hover {
  background: var(--p-brand-50);
  border-color: var(--p-brand-400);
  color: var(--text-primary);
}

.method-btn.is-selected {
  background: var(--p-brand-50);
  border: 2px solid var(--p-brand-600);
  color: var(--p-brand-900);
  box-shadow: var(--shadow-sm);
}

.cash-section,
.customer-section {
  background: #f8fafc;
  padding: 0.85rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.section-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.section-title i {
  color: var(--p-brand-600);
}

.bills-quick-grid {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.bill-btn {
  padding: 0.3rem 0.65rem;
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-weight: 700;
  font-size: 0.78rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.bill-btn:hover {
  background: var(--p-brand-50);
  color: var(--p-brand-700);
  border-color: var(--p-brand-300);
}

.exact-bill {
  background: #f0fdf4;
  color: #166534;
  border-color: #bbf7d0;
}

.exact-bill:hover {
  background: #dcfce7;
  color: #14532d;
  border-color: #86efac;
}

.cash-inputs-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  align-items: stretch;
}

.change-box {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.35rem 0.75rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 46px;
  transition: all 0.2s ease;
}

.change-box.has-change {
  border-color: #86efac;
  background: #f0fdf4;
}

.change-label {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-muted);
  line-height: 1;
}

.change-val {
  font-family: var(--font-title);
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
}

.change-box.has-change .change-val {
  color: #15803d;
}

.customer-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.print-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.print-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
}

.dialog-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
