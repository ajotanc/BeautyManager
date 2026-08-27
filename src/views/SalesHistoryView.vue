<template>
  <div class="sales-history-view">
    <div class="view-header">
      <div>
        <h1 class="page-title"><i class="ri-file-list-3-line"></i> Histórico de Vendas</h1>
        <p class="page-subtitle">Consulte todas as vendas realizadas, reimprima cupons e envie comprovantes via WhatsApp
        </p>
      </div>

      <div class="header-actions">
        <Button label="Exportar Excel" icon="ri-file-excel-2-line" severity="success" variant="outlined" size="small"
          :disabled="salesList.length === 0" @click="handleExportExcel" />
        <Button label="Atualizar" icon="ri-refresh-line" severity="secondary" size="small" :loading="isLoading"
          @click="fetchSales" />
      </div>
    </div>

    <!-- Tabela de Vendas -->
    <div class="table-container glass-panel">
      <DataTable :value="salesList" paginator :rows="12" :rows-per-page-options="[12, 24, 48]" :loading="isLoading"
        responsive-layout="scroll" empty-message="Nenhuma venda registrada.">
        <Column field="$createdAt" header="Data / Hora" sortable style="min-width: 160px">
          <template #body="{ data }">
            <span class="text-sm">{{ formatDateTime(data.$createdAt) }}</span>
          </template>
        </Column>

        <Column field="$id" header="Código" style="min-width: 110px">
          <template #body="{ data }">
            <span class="sale-id-badge font-semibold">#{{ data.$id.slice(-6).toUpperCase() }}</span>
          </template>
        </Column>

        <Column field="customer_name" header="Cliente" style="min-width: 160px">
          <template #body="{ data }">
            <span>{{ data.customer_name || 'Consumidor Final' }}</span>
          </template>
        </Column>

        <Column field="payment_method" header="Pagamento" sortable style="min-width: 140px">
          <template #body="{ data }">
            <span class="pay-badge">{{ translatePayment(data.payment_method) }}</span>
          </template>
        </Column>

        <Column field="total_amount" header="Total" sortable style="min-width: 120px">
          <template #body="{ data }">
            <strong class="total-val-cell font-bold">{{ formatCurrency(data.total_amount) }}</strong>
          </template>
        </Column>

        <Column field="status" header="Status" sortable style="min-width: 120px">
          <template #body="{ data }">
            <Tag :severity="data.status === 'completed' ? 'success' : 'danger'"
              :value="data.status === 'completed' ? 'Concluída' : 'Cancelada'" />
          </template>
        </Column>

        <Column header="Ações" style="min-width: 170px" body-class="text-right">
          <template #body="{ data }">
            <div class="actions-row">
              <Button icon="ri-eye-line" severity="secondary" variant="text" rounded size="small" title="Ver Itens"
                @click="openSaleDetails(data)" />
              <Button icon="ri-printer-line" severity="primary" variant="text" rounded size="small"
                title="Reimprimir Cupom" @click="handleReprint(data)" />
              <Button v-if="data.customer_phone" icon="ri-whatsapp-line" severity="success" variant="text" rounded
                size="small" title="Enviar no WhatsApp" @click="openWhatsapp(data)" />
              <Button v-if="data.status === 'completed' && authStore.isAdmin" icon="ri-close-circle-line"
                severity="danger" variant="text" rounded size="small" title="Cancelar Venda e Estornar Estoque"
                @click="confirmCancelSale(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Modal de Detalhes dos Itens da Venda -->
    <Dialog v-model:visible="showDetailsDialog" modal header="Detalhes da Venda" :style="{ width: '560px' }">
      <div v-if="selectedSale" class="sale-details-content">
        <div class="details-meta-box">
          <div><strong>Data / Hora:</strong> <span>{{ formatDateTime(selectedSale.$createdAt) }}</span></div>
          <div><strong>Cliente:</strong> {{ selectedSale.customer_name || 'Consumidor Final' }}</div>
          <div><strong>Forma de Pagamento:</strong> {{ translatePayment(selectedSale.payment_method) }}</div>
        </div>

        <div class="items-table-sub">
          <span class="sub-heading">Itens da Compra:</span>
          <div v-if="selectedSale.items && selectedSale.items.length > 0" class="items-sub-list">
            <div v-for="item in selectedSale.items" :key="item.$id" class="sub-item-line">
              <div>
                <span class="font-bold">{{ item.product.name }}</span>
                <div class="text-xs text-muted">{{ item.quantity }}x a {{ formatCurrency(item.unit_price) }}</div>
              </div>
              <strong class="text-brand font-bold">{{ formatCurrency(item.subtotal) }}</strong>
            </div>
          </div>
        </div>

        <div class="total-bar-modal">
          <span>Total Geral:</span>
          <strong class="font-bold">{{ formatCurrency(selectedSale.total_amount) }}</strong>
        </div>
      </div>
      <template #footer>
        <Button label="Fechar" severity="secondary" variant="text" @click="showDetailsDialog = false" />
        <Button label="Reimprimir Cupom" icon="ri-printer-line" severity="primary"
          @click="handleReprint(selectedSale)" />
      </template>
    </Dialog>

    <!-- Dialog de Envio WhatsApp -->
    <PosWhatsappReceiptDialog v-model:visible="showWhatsappDialog" :sale="selectedSale"
      :settings="settingsStore.settings" />

    <!-- Área de Impressão Térmica Oculta -->
    <ThermalReceipt :sale="selectedSale" :settings="settingsStore.settings" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import PosWhatsappReceiptDialog from '@/components/pos/PosWhatsappReceiptDialog.vue'
import ThermalReceipt from '@/components/pos/ThermalReceipt.vue'

import { sales } from '@/services/sales'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useThermalPrinter } from '@/composables/useThermalPrinter'
import type { ISale, PaymentMethod } from '@/types/sale'
import { formatCurrency } from '@/utils/currency'
import { formatDateTime } from '@/utils/date'
import { exportToExcel } from '@/utils/exportExcel'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const confirm = useConfirm()
const toast = useToast()
const { printReceipt } = useThermalPrinter()

const salesList = ref<ISale[]>([])
const isLoading = ref<boolean>(false)
const selectedSale = ref<ISale | null>(null)
const showDetailsDialog = ref<boolean>(false)
const showWhatsappDialog = ref<boolean>(false)

async function fetchSales(): Promise<void> {
  isLoading.value = true
  try {
    salesList.value = await sales.listRecent(150)
  } finally {
    isLoading.value = false
  }
}

async function openSaleDetails(sale: ISale): Promise<void> {
    selectedSale.value = sale
    showDetailsDialog.value = true
}

async function handleReprint(sale: ISale | null): Promise<void> {
  if (!sale) return
  selectedSale.value = sale
  await nextTick()
  await printReceipt()
}

function openWhatsapp(sale: ISale): void {
  selectedSale.value = sale
  showWhatsappDialog.value = true
}

function confirmCancelSale(sale: ISale): void {
  confirm.require({
    message: `Deseja realmente cancelar a venda #${sale.$id.slice(-6).toUpperCase()} no valor de ${formatCurrency(sale.total_amount)}? Os produtos retornarão ao estoque.`,
    header: 'Cancelar Venda',
    icon: 'ri-alert-line',
    acceptLabel: 'Sim, Cancelar Venda',
    rejectLabel: 'Não',
    accept: async () => {
      try {
        await sales.cancelSale(sale)
        toast.add({ severity: 'warn', summary: 'Venda Cancelada', detail: 'Estoque estornado com sucesso.', life: 3000 })
        await fetchSales()
      } catch {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao cancelar venda.', life: 3000 })
      }
    }
  })
}

function translatePayment(method: PaymentMethod): string {
  const map: Record<PaymentMethod, string> = {
    pix: 'PIX',
    credit: 'Cartão Crédito',
    debit: 'Cartão Débito',
    cash: 'Dinheiro'
  }
  return map[method] || method
}

function handleExportExcel(): void {
  const exportData = salesList.value.map((s) => ({
    'Código': s.$id.slice(-6).toUpperCase(),
    'Data / Hora': formatDateTime(s.$createdAt),
    'Cliente': s.customer_name || 'Consumidor Final',
    'Telefone': s.customer_phone || '-',
    'Pagamento': translatePayment(s.payment_method),
    'Desconto (R$)': s.discount_amount || 0,
    'Total (R$)': s.total_amount,
    'Status': s.status === 'completed' ? 'Concluída' : 'Cancelada'
  }))
  exportToExcel(exportData, 'Historico_Vendas_Beauty_Manager')
  toast.add({ severity: 'success', summary: 'Exportado!', detail: 'Arquivo Excel gerado com sucesso.', life: 3000 })
}

onMounted(async () => {
  await fetchSales()
})
</script>

<style scoped>
.sales-history-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-family: var(--font-title);
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-title i {
  color: var(--p-brand-600);
}

.page-subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.header-actions {
  display: flex;
  gap: 0.6rem;
}

.table-container {
  padding: 1.25rem;
}

.sale-id-badge {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-secondary);
  background: var(--p-brand-50);
  padding: 0.2rem 0.45rem;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-subtle);
}

.pay-badge {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.total-val-cell {
  font-family: var(--font-title);
  font-size: 1rem;
  color: var(--p-brand-600);
}

.actions-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.2rem;
}

.sale-details-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.details-meta-box {
  background: var(--p-brand-50);
  border: 1px solid var(--border-color);
  padding: 0.85rem 1rem;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.details-meta-box strong {
  color: var(--text-primary);
}

.items-table-sub {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sub-heading {
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--text-primary);
}

.items-sub-list {
  max-height: 220px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.sub-item-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: white;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.total-bar-modal {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1.15rem;
  background: var(--p-brand-50);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  font-family: var(--font-title);
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-primary);
}

.text-brand {
  color: var(--p-brand-600);
}
</style>
