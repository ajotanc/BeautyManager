<template>
  <div class="kits-view">
    <!-- Cabeçalho da Página -->
    <div class="view-header">
      <div class="header-left">
        <h1 class="page-title">
          <i class="ri-gift-2-line text-(--p-brand-600)"></i> Kits & Combos Promocionais
        </h1>
        <p class="page-subtitle">
          Gerencie presentes sazonais, datas comemorativas e combos com baixa automática nos componentes
        </p>
      </div>

      <div class="header-actions">
        <Button label="Novo Kit Promocional" icon="ri-add-line" severity="primary" size="small" class="btn-new-kit"
          @click="openCreateDialog" />
      </div>
    </div>

    <!-- Cards de Métricas Oficiais do Design System -->
    <div class="metrics-grid">
      <MetricCard label="Total de Kits" :value="kitStore.kits.length" icon="ri-gift-line" color="rose"
        :is-clickable="true" :is-active="selectedStatusFilter === 'all'" @click="selectedStatusFilter = 'all'" />

      <MetricCard label="Kits Ativos" :value="kitStore.activeKits.length" icon="ri-checkbox-circle-line" color="emerald"
        :is-clickable="true" :is-active="selectedStatusFilter === 'active'" @click="selectedStatusFilter = 'active'" />

      <MetricCard label="Sem Estoque de Montagem" :value="outOfStockCount" icon="ri-error-warning-line" color="amber"
        :is-clickable="true" :is-active="selectedStatusFilter === 'out_of_stock'"
        @click="selectedStatusFilter = 'out_of_stock'" />

      <MetricCard label="Campanhas Ativas" :value="activeCampaignsCount" icon="ri-calendar-check-line" color="purple" />
    </div>

    <!-- Barra de Filtros & Visualização -->
    <div class="filters-bar glass-panel">
      <!-- Busca Textual -->
      <div class="search-box">
        <IconField class="w-full">
          <InputIcon class="ri-search-line" />
          <InputText v-model="searchQuery" placeholder="Buscar por nome do kit ou código de barras..." size="small"
            fluid />
        </IconField>
      </div>

      <!-- Filtro por Campanha -->
      <div class="filter-campaign">
        <Select v-model="selectedCampaignFilter" :options="campaignFilterOptions" option-label="label"
          option-value="value" :filter="true" filter-placeholder="Buscar campanha..." placeholder="Filtrar por Campanha"
          size="small" class="w-full md:w-56" />
      </div>

      <!-- Filtro por Status -->
      <div class="filter-status">
        <Select v-model="selectedStatusFilter" :options="statusFilterOptions" option-label="label" option-value="value"
          :filter="true" filter-placeholder="Buscar status..." placeholder="Status" size="small"
          class="w-full md:w-44" />
      </div>

      <!-- Alternador de Visualização (Cards vs Tabela) com Botões Square -->
      <div class="view-toggle flex items-center gap-1.5 ml-auto">
        <Button icon="ri-grid-fill" :severity="viewMode === 'grid' ? 'primary' : 'secondary'"
          :variant="viewMode === 'grid' ? 'solid' : 'outlined'" size="small" class="w-9! h-9!"
          title="Visualização em Grade de Cards" @click="viewMode = 'grid'" />
        <Button icon="ri-table-line" :severity="viewMode === 'table' ? 'primary' : 'secondary'"
          :variant="viewMode === 'table' ? 'solid' : 'outlined'" size="small" class="w-9! h-9!"
          title="Visualização em Tabela" @click="viewMode = 'table'" />
      </div>
    </div>

    <!-- Visualização em Grade (Grid de Cards) -->
    <div v-if="viewMode === 'grid'" class="kits-container">
      <div v-if="filteredKits.length === 0 && !kitStore.isLoading" class="empty-state glass-panel">
        <div class="empty-icon-circle">
          <i class="ri-gift-line"></i>
        </div>
        <h3 class="empty-title">Nenhum kit promocional encontrado</h3>
        <p class="empty-desc">
          {{ searchQuery || selectedCampaignFilter !== 'all' ? 'Tente ajustar os filtros de busca.' : 'Crie seu primeiro combo comemorativo para alavancar as vendas.' }}
        </p>
        <Button label="Cadastrar Primeiro Kit" icon="ri-add-line" severity="primary" size="small"
          @click="openCreateDialog" />
      </div>

      <div v-else class="kits-grid">
        <KitCard v-for="kit in filteredKits" :key="kit.$id" :kit="kit" @edit="openEditDialog" @delete="confirmDeleteKit"
          @toggle-status="handleToggleStatus" />
      </div>
    </div>

    <!-- Visualização em Tabela DataTable -->
    <div v-else class="table-container glass-panel">
      <DataTable :value="filteredKits" paginator :rows="10" :rows-per-page-options="[10, 20, 50]" data-key="$id"
        :loading="kitStore.isLoading" responsive-layout="scroll" empty-message="Nenhum kit encontrado.">
        <!-- Campanha -->
        <Column field="campaign_event" header="Campanha" sortable style="min-width: 150px">
          <template #body="{ data }">
            <div class="flex items-center gap-1.5">
              <i :class="getCampaignEvent(data.campaign_event).icon"
                :style="{ color: getCampaignEvent(data.campaign_event).color }"></i>
              <span class="font-bold text-xs" :style="{ color: getCampaignEvent(data.campaign_event).color }">
                {{ getCampaignEvent(data.campaign_event).label }}
              </span>
            </div>
            <span v-if="data.event_date" class="text-[0.7rem] text-slate-400 font-mono">{{ data.event_date }}</span>
          </template>
        </Column>

        <!-- Código -->
        <Column field="barcode" header="Código" sortable style="min-width: 120px">
          <template #body="{ data }">
            <span class="font-mono text-xs font-semibold text-slate-600">{{ data.barcode }}</span>
          </template>
        </Column>

        <!-- Nome e Componentes -->
        <Column field="name" header="Nome do Kit & Componentes" sortable style="min-width: 260px">
          <template #body="{ data }">
            <div class="flex flex-col gap-0.5">
              <strong class="text-sm text-slate-900">{{ data.name }}</strong>
              <span class="text-xs text-slate-500">
                {{ formatKitItemsSummary(data) }}
              </span>
            </div>
          </template>
        </Column>

        <!-- Preço de Venda -->
        <Column field="selling_price" header="Preço do Kit" sortable style="min-width: 120px">
          <template #body="{ data }">
            <strong class="text-(--p-brand-600) font-black text-sm">{{ formatCurrency(data.selling_price) }}</strong>
          </template>
        </Column>

        <!-- Estoque Disponível para Montagem -->
        <Column header="Estoque Montável" sortable style="min-width: 140px">
          <template #body="{ data }">
            <span class="font-bold text-xs px-2 py-0.5 rounded"
              :class="kitStore.getAvailableStock(data) > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'">
              {{ kitStore.getAvailableStock(data) }} kits
            </span>
          </template>
        </Column>

        <!-- Status -->
        <Column field="is_active" header="Status" sortable style="min-width: 100px">
          <template #body="{ data }">
            <ToggleSwitch :model-value="data.is_active" @update:model-value="handleToggleStatus(data)" />
          </template>
        </Column>

        <!-- Ações -->
        <Column header="Ações" style="min-width: 110px" body-class="text-right">
          <template #body="{ data }">
            <div class="flex items-center justify-end gap-1">
              <Button icon="ri-edit-line" severity="secondary" variant="text" rounded size="small" title="Editar"
                @click="openEditDialog(data)" />
              <Button icon="ri-delete-bin-line" severity="danger" variant="text" rounded size="small" title="Excluir"
                @click="confirmDeleteKit(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Modal de Cadastro / Edição -->
    <KitFormDialog v-model:visible="showFormDialog" :editing-kit="selectedKitForEdit" @saved="kitStore.fetchKits" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useAppConfirm } from '@/composables/useAppConfirm'
import { useToast } from 'primevue/usetoast'

import type { IKit } from '@/types/kit'
import { CAMPAIGN_EVENT_OPTIONS, getCampaignEvent } from '@/types/kit'
import { useKitStore } from '@/stores/kitStore'
import { useProductStore } from '@/stores/productStore'
import MetricCard from '@/components/common/MetricCard.vue'
import KitCard from '@/components/kits/KitCard.vue'
import KitFormDialog from '@/components/kits/KitFormDialog.vue'
import { formatCurrency } from '@/utils/currency'
import { parseErrorMessage } from '@/types/errors'

const { requireConfirm } = useAppConfirm()
const toast = useToast()
const kitStore = useKitStore()
const productStore = useProductStore()

const viewMode = ref<'grid' | 'table'>('grid')
const searchQuery = ref<string>('')
const selectedCampaignFilter = ref<string>('all')
const selectedStatusFilter = ref<string>('all')

const showFormDialog = ref<boolean>(false)
const selectedKitForEdit = ref<IKit | null>(null)

const campaignFilterOptions = [
  { label: 'Todas as Campanhas', value: 'all' },
  ...CAMPAIGN_EVENT_OPTIONS
]

const statusFilterOptions = [
  { label: 'Todos os Status', value: 'all' },
  { label: 'Apenas Ativos', value: 'active' },
  { label: 'Apenas Inativos', value: 'inactive' },
  { label: 'Sem Estoque de Montagem', value: 'out_of_stock' }
]

onMounted(async () => {
  await Promise.all([
    kitStore.fetchKits(),
    productStore.fetchAll()
  ])
})

const outOfStockCount = computed(() => {
  return kitStore.kits.filter((k) => kitStore.getAvailableStock(k) === 0).length
})

const activeCampaignsCount = computed(() => {
  const campaigns = new Set(kitStore.activeKits.map((k) => k.campaign_event))
  return campaigns.size
})

const filteredKits = computed(() => {
  return kitStore.kits.filter((kit) => {
    // Filtro por texto
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      const matchName = kit.name.toLowerCase().includes(q)
      const matchBarcode = kit.barcode.toLowerCase().includes(q)
      if (!matchName && !matchBarcode) return false
    }

    // Filtro por campanha
    if (selectedCampaignFilter.value !== 'all') {
      if (kit.campaign_event !== selectedCampaignFilter.value) return false
    }

    // Filtro por status
    if (selectedStatusFilter.value === 'active' && !kit.is_active) return false
    if (selectedStatusFilter.value === 'inactive' && kit.is_active) return false
    if (selectedStatusFilter.value === 'out_of_stock') {
      if (kitStore.getAvailableStock(kit) > 0) return false
    }

    return true
  })
})

function formatKitItemsSummary(kit: IKit): string {
  if (!kit.items || kit.items.length === 0) return 'Nenhum item'
  return kit.items.map((i) => `${i.quantity}x ${i.product?.name || 'Item'}`).join(', ')
}

function openCreateDialog(): void {
  selectedKitForEdit.value = null
  showFormDialog.value = true
}

function openEditDialog(kit: IKit): void {
  selectedKitForEdit.value = kit
  showFormDialog.value = true
}

async function handleToggleStatus(kit: IKit): Promise<void> {
  try {
    await kitStore.toggleStatus(kit)
    toast.add({
      severity: 'info',
      summary: kit.is_active ? 'Kit Ativado' : 'Kit Desativado',
      detail: `O status do kit "${kit.name}" foi alterado.`,
      life: 3000
    })
  } catch (error: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Erro ao alterar status',
      detail: parseErrorMessage(error),
      life: 3000
    })
  }
}

function confirmDeleteKit(kit: IKit): void {
  requireConfirm({
    message: `Tem certeza que deseja excluir o kit "${kit.name}"? Os produtos originais continuarão no catálogo normalmente.`,
    header: 'Excluir Kit Promocional',
    icon: 'ri-alert-line',
    acceptLabel: 'Excluir Kit',
    rejectLabel: 'Cancelar',
    severity: 'error',
    accept: async () => {
      try {
        await kitStore.removeKit(kit)
        toast.add({
          severity: 'success',
          summary: 'Kit Excluído',
          detail: `O kit "${kit.name}" foi removido com sucesso.`,
          life: 3000
        })
      } catch (error: unknown) {
        toast.add({
          severity: 'error',
          summary: 'Erro ao excluir kit',
          detail: parseErrorMessage(error),
          life: 3000
        })
      }
    }
  })
}
</script>

<style scoped>
.kits-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.page-title {
  font-family: var(--font-title);
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.page-subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Métricas com MetricCard */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

/* Barra de Filtros */
.filters-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 240px;
}

.view-toggle {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: auto;
}

/* Grid de Kits */
.kits-container {
  width: 100%;
}

.kits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3.5rem 1.5rem;
  text-align: center;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  gap: 0.75rem;
}

.empty-icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--p-brand-50);
  color: var(--p-brand-600);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.empty-title {
  font-family: var(--font-title);
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.empty-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  max-width: 380px;
  margin: 0 0 0.5rem 0;
}

.table-container {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

@media (max-width: 1024px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .view-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .btn-new-kit {
    width: 100%;
    justify-content: center;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .view-toggle {
    margin-left: 0;
    justify-content: flex-end;
  }

  .kits-grid {
    grid-template-columns: 1fr;
  }
}
</style>
