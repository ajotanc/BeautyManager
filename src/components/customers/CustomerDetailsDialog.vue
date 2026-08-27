<template>
  <AppDialog
    :visible="visible"
    title="Ficha do Cliente"
    subtitle="Histórico, contato e preferências do cliente"
    icon="ri-user-smile-line"
    width="520px"
    @update:visible="(val) => emit('update:visible', val)"
  >
    <div v-if="customer" class="customer-details-card flex flex-col gap-4">
      <!-- Header do Perfil -->
      <div class="profile-header flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]">
        <div class="avatar-box flex items-center justify-center w-12 h-12 rounded-full bg-[var(--p-brand-100)] text-[var(--p-brand-700)] text-xl font-bold">
          {{ customer.name.charAt(0).toUpperCase() }}
        </div>
        <div class="flex-1">
          <h4 class="text-base font-bold text-[var(--text-primary)] m-0 leading-tight">
            {{ customer.name }}
          </h4>
          <span class="text-xs text-[var(--text-secondary)]">
            Cliente cadastrado em {{ formatDateTime(customer.$createdAt) }}
          </span>
        </div>
        <Tag
          v-if="isBirthdayToday"
          value="🎉 Aniversário Hoje!"
          severity="success"
          size="small"
        />
        <Tag
          v-else-if="isBirthdayThisMonth"
          value="🎂 Aniversário no Mês"
          severity="info"
          size="small"
        />
      </div>

      <!-- Informações Principais -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="info-box p-3 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)]">
          <span class="text-xs text-[var(--text-secondary)] block mb-1">WhatsApp / Telefone</span>
          <div class="flex items-center justify-between">
            <strong class="text-sm text-[var(--text-primary)]">{{ customer.phone }}</strong>
            <Button
              icon="ri-whatsapp-line"
              severity="success"
              variant="text"
              rounded
              size="small"
              title="Abrir WhatsApp"
              @click="openWhatsApp(customer.phone)"
            />
          </div>
        </div>

        <div class="info-box p-3 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)]">
          <span class="text-xs text-[var(--text-secondary)] block mb-1">Data de Aniversário</span>
          <strong class="text-sm text-[var(--text-primary)]">
            {{ customer.birth_date || 'Não informada' }}
          </strong>
        </div>

        <div class="info-box p-3 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)]">
          <span class="text-xs text-[var(--text-secondary)] block mb-1">E-mail</span>
          <strong class="text-sm text-[var(--text-primary)] truncate block">
            {{ customer.email || 'Não informado' }}
          </strong>
        </div>

        <div class="info-box p-3 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)]">
          <span class="text-xs text-[var(--text-secondary)] block mb-1">CPF / Documento</span>
          <strong class="text-sm text-[var(--text-primary)]">
            {{ customer.document_number || 'Não informado' }}
          </strong>
        </div>
      </div>

      <!-- Observações & Preferências -->
      <div v-if="customer.notes" class="notes-box p-3 rounded-md border border-amber-200 bg-amber-50/60">
        <span class="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-1 flex items-center gap-1">
          <i class="ri-sticky-note-line"></i>
          Preferências / Observações
        </span>
        <p class="text-sm text-amber-950 m-0 whitespace-pre-wrap leading-relaxed">
          {{ customer.notes }}
        </p>
      </div>

      <!-- Ações do Rodapé -->
      <div class="dialog-actions flex justify-between items-center pt-3 border-t border-[var(--border-color)]">
        <Button
          v-if="customer.phone"
          label="Enviar Mensagem"
          icon="ri-whatsapp-line"
          severity="success"
          size="small"
          @click="openWhatsApp(customer.phone)"
        />
        <div class="flex gap-2 ml-auto">
          <Button
            label="Fechar"
            severity="secondary"
            variant="outlined"
            size="small"
            @click="emit('update:visible', false)"
          />
          <Button
            label="Editar Cadastro"
            icon="ri-edit-line"
            severity="primary"
            size="small"
            @click="emit('edit', customer)"
          />
        </div>
      </div>
    </div>
  </AppDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppDialog from '@/components/common/AppDialog.vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import type { ICustomer } from '@/types/customer'
import { formatDateTime, dayjs } from '@/utils/date'

interface Props {
  visible: boolean
  customer: ICustomer | null
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  customer: null
})

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'edit', customer: ICustomer): void
}>()

const isBirthdayToday = computed<boolean>(() => {
  if (!props.customer?.birth_date) return false
  const todayStr = dayjs().format('DD/MM')
  const parsed = dayjs(props.customer.birth_date, ['DD/MM/YYYY', 'DD/MM', 'YYYY-MM-DD'], true)
  if (!parsed.isValid()) {
    const fallback = dayjs(props.customer.birth_date)
    return fallback.isValid() && fallback.format('DD/MM') === todayStr
  }
  return parsed.format('DD/MM') === todayStr
})

const isBirthdayThisMonth = computed<boolean>(() => {
  if (!props.customer?.birth_date) return false
  const currentMonth = dayjs().month()
  const parsed = dayjs(props.customer.birth_date, ['DD/MM/YYYY', 'DD/MM', 'YYYY-MM-DD'], true)
  if (!parsed.isValid()) {
    const fallback = dayjs(props.customer.birth_date)
    return fallback.isValid() && fallback.month() === currentMonth
  }
  return parsed.month() === currentMonth
})

function openWhatsApp(phone: string): void {
  const clean = phone.replace(/\D/g, '')
  if (!clean) return
  const fullPhone = clean.length <= 11 ? `55${clean}` : clean
  window.open(`https://wa.me/${fullPhone}`, '_blank')
}
</script>
