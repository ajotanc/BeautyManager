<template>
  <div class="inventory-view">
    <div class="view-header">
      <div>
        <h1 class="page-title"><i class="ri-archive-line"></i> Movimentações de Estoque</h1>
        <p class="page-subtitle">Histórico de entradas, saídas, vendas e ajustes manuais de inventário</p>
      </div>

      <div class="header-actions">
        <Button label="Exportar Excel" icon="ri-file-excel-2-line" severity="success" variant="outlined" size="small"
          :disabled="transactions.length === 0" @click="handleExportExcel" />
        <Button label="Atualizar" icon="ri-refresh-line" severity="secondary" size="small" :loading="isLoading"
          @click="fetchTransactions" />
      </div>
    </div>

    <!-- Tabela de Movimentações -->
    <div class="table-wrapper glass-panel">
      <DataTable :value="transactions" paginator :rows="15" :rows-per-page-options="[15, 30, 50]" :loading="isLoading"
        responsive-layout="scroll" empty-message="Nenhuma movimentação registrada.">
        <Column field="transaction_type" header="Tipo" sortable style="min-width: 130px">
          <template #body="{ data }">
            <Tag :severity="data.transaction_type === 'IN' ? 'success' : 'danger'"
              :value="data.transaction_type === 'IN' ? 'ENTRADA (+)' : 'SAÍDA (-)'"
              :icon="data.transaction_type === 'IN' ? 'ri-arrow-down-line' : 'ri-arrow-up-line'" />
          </template>
        </Column>

        <Column field="$createdAt" header="Data / Hora" sortable style="min-width: 160px">
          <template #body="{ data }">
            <span class="text-sm">{{ formatDateTime(data.$createdAt) }}</span>
          </template>
        </Column>

        <Column header="Produto" style="min-width: 220px">
          <template #body="{ data }">
            <span class="font-bold text-sm">{{ getProductName(data.product) }}</span>
          </template>
        </Column>

        <Column field="quantity" header="Qtd" sortable style="min-width: 100px">
          <template #body="{ data }">
            <strong class="text-sm">{{ data.quantity }} un.</strong>
          </template>
        </Column>

        <Column field="reason" header="Motivo / Origem" sortable style="min-width: 180px">
          <template #body="{ data }">
            <span class="reason-tag">{{ translateReason(data.reason) }}</span>
          </template>
        </Column>

        <template #empty>
          <AppEmptyState icon="ri-archive-line" title="Nenhuma movimentação encontrada"
            description="Ainda não há histórico de entradas, saídas ou vendas registradas no estoque." />
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import { inventory } from '@/services/inventory'
import { useProductStore } from '@/stores/productStore'
import type { IInventoryTransaction, InventoryReason } from '@/types/inventory'
import { formatDateTime } from '@/utils/date'
import { exportToExcel } from '@/utils/exportExcel'
import { useToast } from 'primevue/usetoast'

const productStore = useProductStore()
const toast = useToast()

const transactions = ref<IInventoryTransaction[]>([])
const isLoading = ref<boolean>(false)

async function fetchTransactions(): Promise<void> {
  isLoading.value = true
  try {
    transactions.value = await inventory.listRecent(150)
  } finally {
    isLoading.value = false
  }
}

function getProductName(productId: string | { name?: string; $id?: string }): string {
  if (typeof productId === 'object' && productId.name) {
    return productId.name
  }
  const id = typeof productId === 'string' ? productId : productId?.$id
  const prod = productStore.products.find((p) => p.$id === id)
  return prod ? prod.name : 'Produto Desconhecido'
}

function translateReason(reason: InventoryReason): string {
  const map: Record<InventoryReason, string> = {
    purchase: 'Compra / Reposição',
    sale: 'Venda no PDV',
    adjustment: 'Ajuste de Balanço',
    damage: 'Avaria / Perda / Vencido',
    devolution: 'Devolução / Estorno'
  }
  return map[reason] || reason
}

function handleExportExcel(): void {
  const exportData = transactions.value.map((t) => ({
    'Data / Hora': formatDateTime(t.$createdAt),
    'Produto': getProductName(t.product),
    'Tipo': t.transaction_type === 'IN' ? 'Entrada (+)' : 'Saída (-)',
    'Quantidade': t.quantity,
    'Motivo': translateReason(t.reason)
  }))
  exportToExcel(exportData, 'Movimentacoes_Estoque_Beauty_Manager')
  toast.add({ severity: 'success', summary: 'Exportado!', detail: 'Arquivo Excel gerado com sucesso.', life: 3000 })
}

onMounted(async () => {
  await Promise.all([
    productStore.fetchAll(),
    fetchTransactions()
  ])
})
</script>

<style scoped>
.inventory-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .view-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.85rem;
  }

  .header-actions {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }
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

@media (max-width: 640px) {
  .page-title {
    font-size: 1.2rem;
  }
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
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.table-wrapper {
  padding: 1.25rem;
}

.reason-tag {
  font-weight: 600;
  font-size: 0.82rem;
  color: var(--text-secondary);
}
</style>
