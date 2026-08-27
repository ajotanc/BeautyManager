<template>
  <div class="customers-view">
    <!-- Cabeçalho da Página -->
    <div class="view-header">
      <div>
        <h1 class="page-title"><i class="ri-user-heart-line"></i> Gestão de Clientes</h1>
        <p class="page-subtitle">Cadastro de clientes, preferências e acompanhamento de aniversariantes</p>
      </div>

      <div class="header-actions">
        <Button label="Novo Cliente" icon="ri-add-line" severity="primary" size="small" @click="newCustomer" />
      </div>
    </div>

    <!-- Cards de Métricas no Estilo Oficial do Dashboard -->
    <div class="metrics-row">
      <MetricCard
        label="Total de Clientes"
        :value="customerStore.totalCustomers"
        icon="ri-team-line"
        color="rose"
        is-clickable
        :is-active="activeFilter === 'all'"
        @click="activeFilter = 'all'"
      />

      <MetricCard
        label="Aniversariantes do Mês"
        :value="customerStore.birthdaysThisMonth.length"
        icon="ri-cake-2-line"
        color="purple"
        is-clickable
        :is-active="activeFilter === 'month'"
        @click="toggleFilter('month')"
      />

      <MetricCard
        label="Aniversariantes de Hoje"
        :value="customerStore.birthdaysToday.length"
        icon="ri-gift-line"
        color="emerald"
        is-clickable
        :is-active="activeFilter === 'today'"
        @click="toggleFilter('today')"
      />
    </div>

    <!-- Tabela de Clientes -->
    <div class="table-container glass-panel">
      <DataTable
        v-model:filters="filters"
        :value="filteredCustomers"
        paginator
        :rows="12"
        :rows-per-page-options="[12, 24, 48]"
        data-key="$id"
        :loading="customerStore.isLoading"
        filter-display="row"
        :global-filter-fields="['name', 'phone', 'document_number']"
        responsive-layout="scroll"
        empty-message="Nenhum cliente cadastrado."
      >
        <template #header>
          <div class="table-header-bar">
            <IconField>
              <InputIcon class="ri-search-line" />
              <InputText
                v-model="filters['global'].value"
                placeholder="Buscar por nome, telefone ou CPF..."
                size="small"
                class="global-search-input"
              />
            </IconField>

            <div class="stock-alerts-summary">
              <Tag
                v-if="customerStore.birthdaysToday.length > 0"
                severity="success"
                :value="`${customerStore.birthdaysToday.length} aniversariante(s) hoje`"
                icon="ri-gift-line"
                class="cursor-pointer"
                @click="toggleFilter('today')"
              />
              <Tag
                v-if="customerStore.birthdaysThisMonth.length > 0"
                severity="warn"
                :value="`${customerStore.birthdaysThisMonth.length} aniversariante(s) no mês`"
                icon="ri-cake-2-line"
                class="cursor-pointer"
                @click="toggleFilter('month')"
              />
            </div>
          </div>
        </template>

        <!-- Nome do Cliente -->
        <Column field="name" header="Cliente" sortable style="min-width: 220px">
          <template #body="{ data }">
            <div class="product-name-cell">
              <span class="name-text">{{ data.name }}</span>
              <div v-if="data.notes" class="meta-tags">
                <span class="cat-brand-tag truncate max-w-xs">{{ data.notes }}</span>
              </div>
            </div>
          </template>
        </Column>

        <!-- WhatsApp / Telefone -->
        <Column field="phone" header="WhatsApp" sortable style="min-width: 170px">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-(--text-primary)">{{ data.phone }}</span>
              <Button
                v-if="data.phone"
                icon="ri-whatsapp-line"
                severity="success"
                variant="text"
                rounded
                size="small"
                title="Abrir WhatsApp"
                @click="openWhatsApp(data)"
              />
            </div>
          </template>
        </Column>

        <!-- Data de Aniversário -->
        <Column field="birth_date" header="Aniversário" sortable style="min-width: 150px">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <span v-if="data.birth_date" class="text-sm font-medium text-(--text-primary)">{{ data.birth_date }}</span>
              <span v-else class="text-muted">-</span>
              <Tag v-if="isToday(data.birth_date)" severity="success" value="Hoje!" class="mini-tag" />
              <Tag v-else-if="isThisMonth(data.birth_date)" severity="info" value="No Mês" class="mini-tag" />
            </div>
          </template>
        </Column>

        <!-- CPF / Documento -->
        <Column field="document_number" header="CPF" sortable style="min-width: 130px">
          <template #body="{ data }">
            <span class="text-sm text-(--text-secondary)">{{ data.document_number || '-' }}</span>
          </template>
        </Column>

        <!-- Ações -->
        <Column header="Ações" style="min-width: 160px" body-class="text-right">
          <template #body="{ data }">
            <div class="actions-row">
              <Button
                v-if="isToday(data.birth_date)"
                icon="ri-gift-line"
                severity="success"
                variant="text"
                rounded
                size="small"
                title="Enviar Felicitações no WhatsApp"
                @click="sendBirthdayWishes(data)"
              />
              <Button
                icon="ri-eye-line"
                severity="secondary"
                variant="text"
                rounded
                size="small"
                title="Ver Detalhes"
                @click="openDetailsModal(data)"
              />
              <Button
                icon="ri-pencil-line"
                severity="primary"
                variant="text"
                rounded
                size="small"
                title="Editar Cliente"
                @click="editCustomer(data)"
              />
              <Button
                icon="ri-delete-bin-line"
                severity="danger"
                variant="text"
                rounded
                size="small"
                title="Excluir Cliente"
                @click="confirmDelete(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Modais de Clientes -->
    <CustomerFormDialog
      v-model:visible="isFormModalOpen"
      :customer-to-edit="selectedCustomer"
      @saved="handleCustomerSaved"
    />

    <CustomerDetailsDialog
      v-model:visible="isDetailsModalOpen"
      :customer="selectedCustomer"
      @edit="handleEditFromDetails"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import MetricCard from '@/components/common/MetricCard.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Tag from 'primevue/tag'
import CustomerFormDialog from '@/components/customers/CustomerFormDialog.vue'
import CustomerDetailsDialog from '@/components/customers/CustomerDetailsDialog.vue'
import { useCustomerStore } from '@/stores/customerStore'
import { CustomerService } from '@/services/customers'
import type { ICustomer } from '@/types/customer'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { parseErrorMessage } from '@/types/errors'
import { dayjs } from '@/utils/date'
import { FilterMatchMode } from '@primevue/core/api'

const customerStore = useCustomerStore()
const confirm = useConfirm()
const toast = useToast()

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
})

const activeFilter = ref<'all' | 'today' | 'month'>('all')

const isFormModalOpen = ref<boolean>(false)
const isDetailsModalOpen = ref<boolean>(false)
const selectedCustomer = ref<ICustomer>({} as ICustomer)

onMounted(async () => {
  try {
    await customerStore.fetchAll()
  } catch (error: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Erro ao carregar clientes',
      detail: parseErrorMessage(error),
      life: 4000
    })
  }
})

function isToday(birthDate?: string | null): boolean {
  if (!birthDate) return false
  const todayStr = dayjs().format('DD/MM')
  const parsed = dayjs(birthDate, ['DD/MM/YYYY', 'DD/MM', 'YYYY-MM-DD'], true)
  if (!parsed.isValid()) {
    const fallback = dayjs(birthDate)
    return fallback.isValid() && fallback.format('DD/MM') === todayStr
  }
  return parsed.format('DD/MM') === todayStr
}

function isThisMonth(birthDate?: string | null): boolean {
  if (!birthDate) return false
  const currentMonth = dayjs().month()
  const parsed = dayjs(birthDate, ['DD/MM/YYYY', 'DD/MM', 'YYYY-MM-DD'], true)
  if (!parsed.isValid()) {
    const fallback = dayjs(birthDate)
    return fallback.isValid() && fallback.month() === currentMonth
  }
  return parsed.month() === currentMonth
}

function toggleFilter(filter: 'today' | 'month'): void {
  activeFilter.value = activeFilter.value === filter ? 'all' : filter
}

const filteredCustomers = computed<ICustomer[]>(() => {
  if (activeFilter.value === 'today') {
    return customerStore.birthdaysToday
  }
  if (activeFilter.value === 'month') {
    return customerStore.birthdaysThisMonth
  }
  return customerStore.customerList
})

function newCustomer(): void {
  selectedCustomer.value = {} as ICustomer
  isFormModalOpen.value = true
}

function editCustomer(customer: ICustomer): void {
  selectedCustomer.value = { ...customer }
  isFormModalOpen.value = true
}

function openDetailsModal(customer: ICustomer): void {
  selectedCustomer.value = { ...customer }
  isDetailsModalOpen.value = true
}

function handleEditFromDetails(customer: ICustomer): void {
  isDetailsModalOpen.value = false
  editCustomer(customer)
}

function handleCustomerSaved(): void {
  customerStore.fetchAll()
}

function confirmDelete(customer: ICustomer): void {
  confirm.require({
    message: `Você tem certeza que deseja excluir o cadastro de "${customer.name}"?`,
    header: 'Excluir Cliente',
    icon: 'ri-error-warning-line text-rose-500',
    rejectProps: {
      label: 'Não',
      severity: 'secondary',
      outlined: true
    },
    acceptProps: {
      label: 'Sim',
      severity: 'danger'
    },
    accept: async () => {
      try {
        await CustomerService.delete(customer.$id)
        customerStore.customerList = customerStore.customerList.filter((item) => item.$id !== customer.$id)
        toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Cliente excluído com sucesso!',
          life: 3000
        })
      } catch (error: unknown) {
        toast.add({
          severity: 'error',
          summary: 'Erro ao excluir',
          detail: parseErrorMessage(error),
          life: 4000
        })
      }
    }
  })
}

function openWhatsApp(customer: ICustomer): void {
  const cleanPhone = customer.phone?.replace(/\D/g, '') || ''
  if (!cleanPhone) return
  const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone
  window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(`Olá, ${customer.name}! Tudo bem?`)}`, '_blank')
}

function sendBirthdayWishes(customer: ICustomer): void {
  const cleanPhone = customer.phone?.replace(/\D/g, '') || ''
  if (!cleanPhone) return
  const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone
  const msg = `Parabéns, ${customer.name}! 🎂🎉 Toda a equipe da Beauty Manager deseja um dia incrível e repleto de alegrias! Venha nos visitar para comemorar seu aniversário com um carinho especial da loja!`
  window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank')
}
</script>

<style scoped>
.customers-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
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
  align-items: center;
  gap: 0.5rem;
  flex-wrap: nowrap;
}

/* Metrics Row (Estilo Oficial Dashboard) */
.metrics-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 768px) {
  .metrics-row {
    grid-template-columns: 1fr;
  }
}

.text-purple {
  color: #9333ea;
}

.text-emerald {
  color: #059669;
}

.table-container {
  padding: 1.25rem;
}

.table-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.global-search-input {
  width: 320px;
}

.stock-alerts-summary {
  display: flex;
  gap: 0.5rem;
}

.product-name-cell {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.name-text {
  font-weight: 700;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.meta-tags {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.cat-brand-tag {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.mini-tag {
  font-size: 0.65rem !important;
  padding: 0.08rem 0.35rem !important;
}

.actions-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.2rem;
}

.text-muted {
  color: var(--text-muted);
}
</style>
