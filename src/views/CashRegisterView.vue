<template>
  <div class="cash-register-view">
    <div class="view-header">
      <div>
        <h1 class="page-title"><i class="ri-wallet-3-line"></i> Controle de Caixa Diário</h1>
        <p class="page-subtitle">Abertura de turno, conferência de sangrias/suprimentos e fechamento com balanço</p>
      </div>

      <div class="header-actions">
        <Button v-if="!cashRegisterStore.isRegisterOpen" label="Abrir Caixa" icon="ri-lock-unlock-line"
          severity="primary" size="small" @click="showOpenDialog = true" />
        <template v-else>
          <Button label="Movimentação (Sangria/Suprimento)" icon="ri-exchange-line" severity="secondary"
            variant="outlined" size="small" @click="showMovementDialog = true" />
          <Button label="Fechar Caixa" icon="ri-lock-line" severity="danger" size="small"
            @click="showCloseDialog = true" />
        </template>
      </div>
    </div>

    <!-- Painel do Caixa Atual (Aberto) -->
    <div v-if="cashRegisterStore.isRegisterOpen && cashRegisterStore.currentRegister"
      class="current-register-card glass-panel">
      <div class="card-status-header">
        <div class="status-left">
          <Tag severity="success" value="Caixa Aberto" icon="ri-checkbox-circle-line" />
          <span class="open-time">Aberto em: {{ formatDateTime(cashRegisterStore.currentRegister.opened_at) }}</span>
        </div>
      </div>

      <div class="metrics-grid">
        <div class="metric-box">
          <span class="m-label">Fundo de Abertura</span>
          <span class="m-val">{{ formatCurrency(cashRegisterStore.currentRegister.opening_balance) }}</span>
        </div>

        <div class="metric-box">
          <span class="m-label">Total Entradas (+ Dinheiro)</span>
          <span class="m-val text-emerald-600">+ {{ formatCurrency(cashRegisterStore.currentRegister.total_in) }}</span>
        </div>

        <div class="metric-box">
          <span class="m-label">Total Saídas (- Sangrias)</span>
          <span class="m-val text-rose-600">- {{ formatCurrency(cashRegisterStore.currentRegister.total_out) }}</span>
        </div>

        <div class="metric-box highlight-box">
          <span class="m-label">Saldo Esperado na Gaveta</span>
          <span class="m-val grand-val">{{ formatCurrency(cashRegisterStore.currentExpectedBalance) }}</span>
        </div>
      </div>

      <div v-if="cashRegisterStore.currentRegister.notes" class="notes-display">
        <strong>Histórico de Movimentações / Observações:</strong>
        <pre>{{ cashRegisterStore.currentRegister.notes }}</pre>
      </div>
    </div>

    <!-- Aviso de Caixa Fechado -->
    <div v-else class="closed-notice glass-panel">
      <div class="lock-icon-box">
        <i class="ri-lock-line lock-icon"></i>
      </div>
      <h3 class="notice-title">Nenhum Caixa Aberto no Momento</h3>
      <p class="notice-desc">Clique no botão abaixo para abrir o caixa e começar a registrar as movimentações do dia.
      </p>
      <Button label="Abrir Caixa Agora" icon="ri-lock-unlock-line" severity="primary" @click="showOpenDialog = true" />
    </div>

    <!-- Histórico de Caixas Anteriores -->
    <div class="history-container glass-panel">
      <div class="history-header">
        <h3 class="history-title"><i class="ri-calendar-line"></i> Histórico de Fechamentos Anteriores</h3>
      </div>

      <DataTable :value="cashRegisterStore.history" paginator :rows="8" :rows-per-page-options="[8, 16, 24]"
        :loading="cashRegisterStore.isLoading" responsive-layout="scroll"
        empty-message="Nenhum histórico de fechamento anterior.">
        <Column field="opened_at" header="Abertura" sortable style="min-width: 150px">
          <template #body="{ data }">
            <span class="text-sm">{{ formatDateTime(data.opened_at) }}</span>
          </template>
        </Column>

        <Column field="closed_at" header="Fechamento" sortable style="min-width: 150px">
          <template #body="{ data }">
            <span class="text-sm">{{ formatDateTime(data.closed_at) }}</span>
          </template>
        </Column>

        <Column field="opening_balance" header="Abertura" style="min-width: 110px">
          <template #body="{ data }">
            <span class="text-sm">{{ formatCurrency(data.opening_balance) }}</span>
          </template>
        </Column>

        <Column field="total_in" header="Entradas" style="min-width: 110px">
          <template #body="{ data }">
            <span class="text-emerald-600 text-sm font-bold">+ {{ formatCurrency(data.total_in) }}</span>
          </template>
        </Column>

        <Column field="total_out" header="Saídas" style="min-width: 110px">
          <template #body="{ data }">
            <span class="text-rose-600 text-sm font-bold">- {{ formatCurrency(data.total_out) }}</span>
          </template>
        </Column>

        <Column field="closing_balance" header="Saldo Final" style="min-width: 120px">
          <template #body="{ data }">
            <strong class="text-brand">{{ formatCurrency(data.closing_balance) }}</strong>
          </template>
        </Column>

        <Column field="status" header="Status" style="min-width: 110px">
          <template #body="{ data }">
            <Tag :severity="data.status === 'open' ? 'success' : 'secondary'"
              :value="data.status === 'open' ? 'Aberto' : 'Fechado'" />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Modais -->
    <OpenRegisterDialog v-model:visible="showOpenDialog" />
    <CloseRegisterDialog v-model:visible="showCloseDialog" />
    <CashMovementDialog v-model:visible="showMovementDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import OpenRegisterDialog from '@/components/cash/OpenRegisterDialog.vue'
import CloseRegisterDialog from '@/components/cash/CloseRegisterDialog.vue'
import CashMovementDialog from '@/components/cash/CashMovementDialog.vue'

import { useCashRegisterStore } from '@/stores/cashRegisterStore'
import { formatCurrency } from '@/utils/currency'
import { formatDateTime } from '@/utils/date'

const cashRegisterStore = useCashRegisterStore()

const showOpenDialog = ref<boolean>(false)
const showCloseDialog = ref<boolean>(false)
const showMovementDialog = ref<boolean>(false)

onMounted(async () => {
  await Promise.all([
    cashRegisterStore.checkActiveRegister(),
    cashRegisterStore.fetchHistory()
  ])
})
</script>

<style scoped>
.cash-register-view {
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

.current-register-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.card-status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.open-time {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.metric-box {
  background: white;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  box-shadow: var(--shadow-xs);
}

.m-label {
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.m-val {
  font-family: var(--font-title);
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--text-primary);
}

.highlight-box {
  background: linear-gradient(135deg, var(--p-brand-50) 0%, #ffffff 100%);
  border-color: var(--p-brand-300);
}

.grand-val {
  color: var(--p-brand-600);
  font-size: 1.5rem;
}

.notes-display {
  background: var(--p-brand-50);
  border: 1px solid var(--border-color);
  padding: 0.85rem;
  border-radius: var(--radius-md);
  font-size: 0.82rem;
  color: var(--text-secondary);
}

.notes-display pre {
  margin-top: 0.4rem;
  font-family: var(--font-sans);
  white-space: pre-line;
  color: var(--text-primary);
}

.closed-notice {
  padding: 3.5rem 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.lock-icon-box {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-full);
  background: var(--p-brand-100);
  color: var(--p-brand-700);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.notice-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-primary);
}

.notice-desc {
  font-size: 0.88rem;
  color: var(--text-secondary);
  max-width: 420px;
  margin-bottom: 0.75rem;
}

.history-container {
  padding: 1.25rem;
}

.history-title {
  font-family: var(--font-title);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.history-title i {
  color: var(--p-brand-600);
}

.text-brand {
  color: var(--p-brand-600);
}
</style>
