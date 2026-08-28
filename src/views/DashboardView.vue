<template>
  <div class="dashboard-view">
    <!-- Banner de Boas-Vindas Personalizado -->
    <div class="welcome-banner glass-panel">
      <div class="welcome-content">
        <h1 class="welcome-title">
          {{ greetingMessage }}, <span class="text-brand">{{ authStore.userName }}</span>! <i class="ri-sparkling-fill text-brand"></i>
        </h1>
        <p class="welcome-subtitle">Pronta para mais um dia de sucesso? Aqui está o resumo da sua loja hoje.</p>
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

    <!-- Seção de Distribuição por Forma de Pagamento -->
    <div class="section-card glass-panel floating-card">
      <div class="card-heading">
        <span class="heading-title">
          <i class="ri-pie-chart-2-line"></i> Vendas por Forma de Pagamento
        </span>
        <span class="text-xs text-muted font-medium">Baseado nas vendas registradas</span>
      </div>

      <div v-if="completedSalesCount === 0" class="empty-notice">
        <i class="ri-information-line text-brand"></i>
        <span>Nenhuma venda concluída para calcular a distribuição de pagamentos ainda.</span>
      </div>

      <div v-else class="payment-distribution-grid">
        <div
          v-for="item in paymentBreakdown"
          :key="item.method"
          class="payment-stat-box"
        >
          <div class="payment-stat-header">
            <div class="method-badge-wrap">
              <i :class="item.icon" class="method-icon" :style="{ color: item.accentColor }"></i>
              <span class="method-name">{{ item.label }}</span>
            </div>
            <span class="method-percent font-bold">{{ item.percentage.toFixed(1) }}%</span>
          </div>

          <div class="progress-bar-bg">
            <div
              class="progress-bar-fill"
              :style="{
                width: `${item.percentage}%`,
                background: item.gradient
              }"
            ></div>
          </div>

          <div class="payment-stat-footer">
            <span class="method-count">{{ item.count }} venda{{ item.count === 1 ? '' : 's' }}</span>
            <strong class="method-total font-bold">{{ formatCurrency(item.total) }}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Alertas Especiais & Destaques de Cosméticos -->
    <div class="dashboard-grid">
      <!-- Tabela de Produtos Perto de Vencer (Crucial para Cosméticos) -->
      <div class="section-card glass-panel floating-card">
        <div class="card-heading">
          <span class="heading-title"><i class="ri-time-line"></i> Cosméticos Próximos do Vencimento</span>
          <Tag :severity="productStore.expiringProducts.length > 0 ? 'danger' : 'success'"
            :value="`${productStore.expiringProducts.length} itens`" />
        </div>

        <div v-if="productStore.expiringProducts.length === 0" class="empty-notice">
          <i class="ri-checkbox-circle-line text-emerald-500"></i>
          <span>Nenhum produto perto do vencimento! Estoque em dia.</span>
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
      <div class="section-card glass-panel floating-card">
        <div class="card-heading">
          <span class="heading-title"><i class="ri-alert-line"></i> Reposição Urgente (Estoque Baixo)</span>
          <Tag :severity="productStore.lowStockProducts.length > 0 ? 'warn' : 'success'"
            :value="`${productStore.lowStockProducts.length} itens`" />
        </div>

        <div v-if="productStore.lowStockProducts.length === 0" class="empty-notice">
          <i class="ri-checkbox-circle-line text-emerald-500"></i>
          <span>Estoque saudável! Todos os itens acima do limite mínimo.</span>
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
import { useAuthStore } from '@/stores/authStore'
import { sales } from '@/services/sales'
import type { ISale, PaymentMethod } from '@/types/sale'
import { formatCurrency, toNumber } from '@/utils/currency'
import { formatDate } from '@/utils/date'

interface IPaymentStat {
  method: PaymentMethod
  label: string
  icon: string
  count: number
  total: number
  percentage: number
  accentColor: string
  gradient: string
}

const productStore = useProductStore()
const authStore = useAuthStore()

const greetingMessage = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
})

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

const paymentBreakdown = computed<IPaymentStat[]>(() => {
  const total = totalRevenue.value || 1
  const map: Record<PaymentMethod, { count: number; total: number }> = {
    pix: { count: 0, total: 0 },
    credit: { count: 0, total: 0 },
    debit: { count: 0, total: 0 },
    cash: { count: 0, total: 0 }
  }

  for (const sale of completedSales.value) {
    const method = sale.payment_method as PaymentMethod
    if (map[method]) {
      map[method].count += 1
      map[method].total += toNumber(sale.total_amount)
    }
  }

  const configs: Record<PaymentMethod, { label: string; icon: string; accentColor: string; gradient: string }> = {
    pix: {
      label: 'PIX Instantâneo',
      icon: 'ri-qr-code-line',
      accentColor: '#10b981',
      gradient: 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
    },
    credit: {
      label: 'Cartão de Crédito',
      icon: 'ri-bank-card-line',
      accentColor: '#fd0054',
      gradient: 'linear-gradient(90deg, #ff5d8f 0%, #fd0054 100%)'
    },
    debit: {
      label: 'Cartão de Débito',
      icon: 'ri-bank-card-2-line',
      accentColor: '#3b82f6',
      gradient: 'linear-gradient(90deg, #60a5fa 0%, #2563eb 100%)'
    },
    cash: {
      label: 'Dinheiro em Espécie',
      icon: 'ri-money-dollar-circle-line',
      accentColor: '#f59e0b',
      gradient: 'linear-gradient(90deg, #fbbf24 0%, #d97706 100%)'
    }
  }

  return (Object.keys(map) as PaymentMethod[]).map((method) => {
    const data = map[method]
    const cfg = configs[method]
    return {
      method,
      label: cfg.label,
      icon: cfg.icon,
      count: data.count,
      total: data.total,
      percentage: totalRevenue.value > 0 ? (data.total / total) * 100 : 0,
      accentColor: cfg.accentColor,
      gradient: cfg.gradient
    }
  })
})

onMounted(async () => {
  await loadDashboardData()
})
</script>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 2rem;
}

/* Welcome Banner */
.welcome-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.4rem;
  margin-bottom: 0.25rem;
  background: linear-gradient(135deg, var(--p-brand-50) 0%, #ffffff 100%);
  border-left: 3px solid var(--p-brand-500);
  border-radius: var(--radius-md);
}

.welcome-title {
  font-family: var(--font-title);
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 0.15rem;
  letter-spacing: -0.015em;
}

.welcome-subtitle {
  font-size: 0.82rem;
  color: var(--text-secondary);
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
  color: #064e3b; /* emerald-900 */
  background: #ecfdf5; /* emerald-50 */
  padding: 0.85rem;
  border-radius: var(--radius-md);
  border: 1px dashed #6ee7b7; /* emerald-300 */
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

/* Payment Distribution Grid */
.payment-distribution-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

@media (max-width: 1100px) {
  .payment-distribution-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .payment-distribution-grid {
    grid-template-columns: 1fr;
  }
}

.payment-stat-box {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 1rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-xs);
}

.payment-stat-box:hover {
  border-color: var(--p-brand-300);
  box-shadow: var(--shadow-sm);
  transform: translateY(-2px);
}

.payment-stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.method-badge-wrap {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.method-icon {
  font-size: 1.15rem;
}

.method-name {
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--text-primary);
}

.method-percent {
  font-size: 0.84rem;
  color: var(--text-secondary);
}

.progress-bar-bg {
  width: 100%;
  height: 7px;
  background: var(--p-brand-50);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.6s var(--ease-spring);
}

.payment-stat-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.78rem;
}

.method-count {
  color: var(--text-muted);
}

.method-total {
  font-family: var(--font-title);
  font-size: 0.95rem;
  color: var(--text-primary);
}
</style>
