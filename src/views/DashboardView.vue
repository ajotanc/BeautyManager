<template>
  <div class="dashboard-view">
    <div class="view-header">
      <div>
        <h1 class="page-title"><i class="ri-dashboard-3-line"></i> Dashboard & Indicadores</h1>
        <p class="page-subtitle">Visão geral do faturamento, vendas, ticket médio e alertas de estoque/validade</p>
      </div>

      <div class="header-actions">
        <Button label="Atualizar Indicadores" icon="ri-refresh-line" severity="primary" size="small"
          :loading="isLoading" @click="loadDashboardData" />
      </div>
    </div>

    <!-- Cards de Métricas Principais -->
    <div class="metrics-row">
      <MetricCard
        label="Faturamento Total"
        :value="formatCurrency(totalRevenue)"
        icon="ri-money-dollar-circle-line"
        color="rose"
      />

      <MetricCard
        label="Vendas Concluídas"
        :value="completedSalesCount"
        icon="ri-shopping-bag-3-line"
        color="gold"
      />

      <MetricCard
        label="Ticket Médio"
        :value="formatCurrency(averageTicket)"
        icon="ri-line-chart-line"
        color="emerald"
      />

      <MetricCard
        label="Estoque Baixo"
        :value="`${productStore.lowStockProducts.length} itens`"
        icon="ri-alert-line"
        color="amber"
      />
    </div>

    <!-- Alertas Especiais & Destaques de Cosméticos -->
    <div class="dashboard-grid">
      <!-- Tabela de Produtos Perto de Vencer (Crucial para Cosméticos) -->
      <div class="section-card glass-panel">
        <div class="card-heading">
          <span class="heading-title"><i class="ri-time-line"></i> Cosméticos Próximos do Vencimento</span>
          <Tag :severity="productStore.expiringProducts.length > 0 ? 'danger' : 'success'"
            :value="`${productStore.expiringProducts.length} itens`" />
        </div>

        <div v-if="productStore.expiringProducts.length === 0" class="empty-notice">
          <i class="ri-checkbox-circle-line text-emerald-500"></i>
          <span>Nenhum cosmético com validade próxima! Seu estoque está em dia.</span>
        </div>

        <div v-else class="expiring-list">
          <div v-for="prod in productStore.expiringProducts.slice(0, 5)" :key="prod.$id" class="expiring-item">
            <div class="item-left">
              <strong>{{ prod.name }}</strong>
              <span class="text-xs text-muted">Estoque: {{ prod.stock_quantity }} un. • {{
                formatCurrency(prod.selling_price) }}</span>
            </div>
            <Tag severity="warn" :value="`Vence em: ${formatDate(prod.expiry_date)}`" icon="ri-time-line" />
          </div>
        </div>
      </div>

      <!-- Tabela de Produtos com Estoque Baixo -->
      <div class="section-card glass-panel">
        <div class="card-heading">
          <span class="heading-title"><i class="ri-alert-line"></i> Reposição Urgente (Estoque Baixo)</span>
          <Tag :severity="productStore.lowStockProducts.length > 0 ? 'warn' : 'success'"
            :value="`${productStore.lowStockProducts.length} itens`" />
        </div>

        <div v-if="productStore.lowStockProducts.length === 0" class="empty-notice">
          <i class="ri-checkbox-circle-line text-emerald-500"></i>
          <span>Todos os produtos estão com estoque acima do limite mínimo.</span>
        </div>

        <div v-else class="low-stock-list">
          <div v-for="prod in productStore.lowStockProducts.slice(0, 5)" :key="prod.$id" class="low-stock-item">
            <div class="item-left">
              <strong>{{ prod.name }}</strong>
              <span class="text-xs text-muted">{{ prod.barcode }}</span>
            </div>
            <div class="stock-tag-right">
              <span class="stock-danger-badge">{{ prod.stock_quantity }} un.</span>
              <span class="text-xs text-muted">(Mín: {{ prod.min_stock_alert }})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MetricCard from '@/components/common/MetricCard.vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { useProductStore } from '@/stores/productStore'
import { sales } from '@/services/sales'
import type { ISale } from '@/types/sale'
import { formatCurrency, toNumber } from '@/utils/currency'
import { formatDate } from '@/utils/date'

const productStore = useProductStore()
const salesList = ref<ISale[]>([])
const isLoading = ref<boolean>(false)

async function loadDashboardData(): Promise<void> {
  isLoading.value = true
  try {
    const [list] = await Promise.all([
      sales.listRecent(300),
      productStore.fetchAll()
    ])
    salesList.value = list
  } finally {
    isLoading.value = false
  }
}

const completedSales = computed(() => salesList.value.filter((s) => s.status === 'completed'))
const completedSalesCount = computed(() => completedSales.value.length)

const totalRevenue = computed(() => {
  return completedSales.value.reduce((acc, s) => acc + toNumber(s.total_amount), 0)
})

const averageTicket = computed(() => {
  if (completedSalesCount.value === 0) return 0
  return totalRevenue.value / completedSalesCount.value
})

onMounted(async () => {
  await loadDashboardData()
})
</script>

<style scoped>
.dashboard-view {
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

.metrics-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.15rem;
}

.text-brand {
  color: var(--p-brand-600);
}

.text-emerald {
  color: #059669;
}

.text-amber {
  color: #d97706;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.section-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.heading-title {
  font-family: var(--font-title);
  font-size: 0.98rem;
  font-weight: 800;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.heading-title i {
  color: var(--p-brand-600);
}

.empty-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
  background: var(--bg-card-soft);
  padding: 0.85rem;
  border-radius: var(--radius-md);
  border: 1px dashed var(--border-color);
}

.expiring-list,
.low-stock-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.expiring-item,
.low-stock-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 0.9rem;
  background: white;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.expiring-item:hover,
.low-stock-item:hover {
  border-color: var(--p-brand-300);
  box-shadow: var(--shadow-sm);
}

.item-left {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.stock-tag-right {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.stock-danger-badge {
  background: #fee2e2;
  color: #dc2626;
  font-weight: 800;
  font-size: 0.82rem;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-xs);
}
</style>
