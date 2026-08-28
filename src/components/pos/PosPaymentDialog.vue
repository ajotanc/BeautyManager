<template>
  <AppDialog :visible="visible" title="Finalizar Venda & Pagamento"
    subtitle="Selecione a forma de pagamento, troco e cliente" icon="ri-bank-card-line" width="580px"
    :closable="!posStore.isProcessingSale" @update:visible="(val) => emit('update:visible', val)">
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
            <button v-for="method in paymentMethods" :key="method.value" type="button" class="method-btn"
              :class="{ 'is-selected': posStore.selectedPaymentMethod === method.value }"
              @click="selectPaymentMethod(method.value)">
              <i :class="method.icon"></i>
              <span>{{ method.label }}</span>
            </button>
          </div>
        </div>

        <!-- Pagamento em Dinheiro com Cédulas Rápidas e Troco -->
        <div v-if="posStore.selectedPaymentMethod === 'cash'" class="cash-section">
          <span class="section-title"><i class="ri-money-dollar-circle-line"></i> Valor Recebido em Dinheiro</span>

          <!-- Botões de Cédulas Rápidas -->
          <div class="bills-quick-grid">
            <button v-for="bill in quickBills" :key="bill" type="button" class="bill-btn" @click="setQuickBill(bill)">
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
                <InputNumber id="amount_paid" v-model="posStore.amountPaid" mode="currency" currency="BRL"
                  locale="pt-BR" size="small" fluid :min="0" class="font-bold" />
                <label for="amount_paid">Valor Entregue pelo Cliente</label>
              </FloatLabel>
            </div>

            <div class="change-box" :class="{ 'has-change': posStore.changeAmount > 0 }">
              <span class="change-label">Troco a Devolver</span>
              <span class="change-val">{{ formatCurrency(posStore.changeAmount) }}</span>
            </div>
          </div>
        </div>

        <!-- Dados da Cliente (Busca Rápida de Clientes Cadastrados ou Digitação Livre) -->
        <div class="customer-section">
          <div class="flex items-center justify-between mb-2">
            <span class="section-title m-0"><i class="ri-user-3-line"></i> Identificação da Cliente</span>
            <span class="text-xs text-(--text-secondary)">Opcional para recibo</span>
          </div>

          <div class="customer-grid">
            <div class="autocomplete-container relative">
              <FloatLabel variant="in">
                <AutoComplete id="customer_name" v-model="posStore.customerName" :suggestions="customerSuggestions"
                  option-label="name" size="small" fluid append-to="self" @complete="handleCustomerSearch"
                  @item-select="onCustomerSelect">
                  <template #option="{ option }">
                    <div class="flex items-center justify-between w-full py-0.5 gap-2">
                      <div class="flex flex-col">
                        <span class="font-bold text-xs text-(--text-primary)">{{ option.name }}</span>
                        <span v-if="option.phone" class="text-[11px] text-(--text-secondary)">{{ option.phone }}</span>
                      </div>
                      <span v-if="option.birth_date"
                        class="text-[10px] text-(--p-brand-600) font-semibold flex items-center gap-1">
                        <i class="ri-cake-2-line"></i> {{ option.birth_date }}
                      </span>
                    </div>
                  </template>
                </AutoComplete>
                <label for="customer_name">Nome</label>
              </FloatLabel>
            </div>
            <div>
              <FloatLabel variant="in">
                <InputText id="customer_phone" v-model="posStore.customerPhone" size="small" fluid />
                <label for="customer_phone">WhatsApp</label>
              </FloatLabel>
            </div>
          </div>
        </div>

        <!-- Opções de Pós-Venda (Impressão e WhatsApp) -->
        <div class="post-sale-options">
          <div class="option-item">
            <Checkbox v-model="autoPrintReceipt" :binary="true" input-id="auto-print" />
            <label for="auto-print" class="option-label">
              <i class="ri-printer-line text-rose-500"></i>
              <span>Imprimir cupom térmico automaticamente</span>
            </label>
          </div>

          <div class="option-item">
            <Checkbox v-model="openWhatsappReceipt" :binary="true" input-id="open-whatsapp" />
            <label for="open-whatsapp" class="option-label">
              <i class="ri-whatsapp-line text-emerald-500"></i>
              <span>Enviar comprovante por WhatsApp</span>
            </label>
          </div>
        </div>
      </div>
    </Fluid>

    <template #footer>
      <div class="flex items-center justify-end gap-2.5 w-full">
        <Button label="Fechar" icon="ri-close-line" severity="secondary" variant="text" size="small"
          :disabled="posStore.isProcessingSale" @click="emit('update:visible', false)" />
        <Button label="Concluir Venda" icon="ri-check-line" severity="primary" size="small"
          :loading="posStore.isProcessingSale" class="confirm-sale-btn" @click="handleConfirmSale" />
      </div>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import AppDialog from '@/components/common/AppDialog.vue'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import AutoComplete from 'primevue/autocomplete'
import Checkbox from 'primevue/checkbox'
import FloatLabel from 'primevue/floatlabel'
import Fluid from 'primevue/fluid'
import { PAYMENT_METHOD_OPTIONS, type PaymentMethod, type ISale } from '@/types/sale'
import type { ICustomer } from '@/types/customer'
import { usePosStore } from '@/stores/posStore'
import { useCustomerStore } from '@/stores/customerStore'
import { formatCurrency } from '@/utils/currency'

interface Props {
  visible: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'sale-completed', sale: ISale, shouldPrint: boolean, shouldOpenWhatsapp: boolean): void
}>()

const posStore = usePosStore()
const customerStore = useCustomerStore()
const autoPrintReceipt = ref<boolean>(true)
const openWhatsappReceipt = ref<boolean>(false)
const customerSuggestions = ref<ICustomer[]>([])

watch(
  () => props.visible,
  (val) => {
    if (val && customerStore.customerList.length === 0) {
      customerStore.fetchAll()
    }
  }
)

function handleCustomerSearch(event: { query: string }): void {
  const q = event.query?.toLowerCase()?.trim() || ''
  if (!q) {
    customerSuggestions.value = customerStore.customerList.slice(0, 6)
  } else {
    customerSuggestions.value = customerStore.customerList
      .filter((c) => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)))
      .slice(0, 6)
  }
}

function onCustomerSelect(event: { value: ICustomer }): void {
  posStore.selectedCustomer = event.value
  posStore.customerName = event.value.name
  if (event.value.phone) {
    posStore.customerPhone = event.value.phone
    openWhatsappReceipt.value = true
  }
}

watch(
  () => posStore.customerName,
  (name) => {
    if (posStore.selectedCustomer && posStore.selectedCustomer.name !== name) {
      posStore.selectedCustomer = null
    }
  }
)

watch(
  () => posStore.customerPhone,
  (phone) => {
    if (phone && phone.trim().length > 0) {
      openWhatsappReceipt.value = true
    }
  }
)

const paymentMethods = PAYMENT_METHOD_OPTIONS

const quickBills = [10, 20, 50, 100, 200]

function selectPaymentMethod(method: PaymentMethod): void {
  posStore.selectedPaymentMethod = method
  if (method === 'cash' && posStore.amountPaid === 0) {
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
    emit('sale-completed', sale, autoPrintReceipt.value, openWhatsappReceipt.value)
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

.post-sale-options {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.75rem 0.95rem;
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.option-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  user-select: none;
}

.option-label i {
  font-size: 1rem;
}
</style>
