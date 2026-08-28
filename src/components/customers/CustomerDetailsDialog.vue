<template>
  <AppDialog
    :visible="visible"
    title="Ficha do Cliente"
    subtitle="Histórico, preferências e dados de contato"
    icon="ri-user-heart-line"
    width="580px"
    @update:visible="(val: boolean) => emit('update:visible', val)"
  >
    <div v-if="customer" class="customer-dossier flex flex-col gap-4">
      <!-- Banner de Perfil VIP do Cliente -->
      <div class="profile-hero-card">
        <div class="profile-avatar-wrapper">
          <div class="profile-avatar">
            {{ getInitials(customer.name) }}
          </div>
          <div v-if="isBirthdayToday" class="avatar-celebration-badge" title="Aniversariante do dia!">
            <i class="ri-cake-2-line text-rose-500"></i>
          </div>
        </div>

        <div class="profile-main-info">
          <div class="profile-header-line">
            <h3 class="profile-name">
              {{ customer.name }}
            </h3>
            <Tag
              v-if="isBirthdayToday"
              value="Aniversário Hoje!"
              icon="ri-gift-line"
              severity="success"
              class="birthday-pill birthday-pill-today"
            />
            <Tag
              v-else-if="isBirthdayThisMonth"
              value="Aniversário no Mês"
              icon="ri-cake-2-line"
              severity="warn"
              class="birthday-pill"
            />
          </div>

          <!-- Badges de Histórico e Fidelidade -->
          <div class="profile-stats-row">
            <span class="stat-pill" title="Data do primeiro cadastro">
              <i class="ri-calendar-check-line"></i>
              Desde {{ formatRegistrationDate(customer.$createdAt) }}
            </span>

            <span class="stat-pill stat-pill-purchases" title="Total de compras registradas no sistema">
              <i class="ri-shopping-bag-3-line"></i>
              {{ Number(customer.total_purchases || 0) }} compra{{ Number(customer.total_purchases || 0) === 1 ? '' : 's' }}
            </span>

            <span v-if="customer.last_purchase_at" class="stat-pill stat-pill-recent" title="Data da última compra realizada">
              <i class="ri-history-line"></i>
              Última compra: {{ customer.last_purchase_at }}
            </span>
            <span v-else class="stat-pill stat-pill-empty">
              <i class="ri-time-line"></i>
              Sem compras registradas
            </span>
          </div>
        </div>
      </div>

      <!-- Grade de Informações com Ícones e Ações Rápidas -->
      <div class="info-grid">
        <!-- WhatsApp / Telefone -->
        <div class="info-tile">
          <div class="tile-header">
            <div class="tile-icon-box whatsapp-icon-box">
              <i class="ri-whatsapp-line"></i>
            </div>
            <span class="tile-label">WhatsApp / Telefone</span>
          </div>
          <div class="tile-content">
            <span class="tile-value truncate" :class="{ 'text-muted': !customer.phone }">
              {{ customer.phone || 'Não informado' }}
            </span>
            <div v-if="customer.phone" class="tile-actions">
              <Button
                icon="ri-file-copy-line"
                text
                rounded
                size="small"
                severity="secondary"
                class="action-icon-btn"
                title="Copiar número"
                @click="copyText(customer.phone, 'Telefone')"
              />
              <Button
                icon="ri-external-link-line"
                text
                rounded
                size="small"
                severity="success"
                class="action-icon-btn"
                title="Abrir no WhatsApp"
                @click="openWhatsApp(customer.phone)"
              />
            </div>
          </div>
        </div>

        <!-- Data de Aniversário -->
        <div class="info-tile">
          <div class="tile-header">
            <div class="tile-icon-box birthday-icon-box">
              <i class="ri-cake-2-line"></i>
            </div>
            <span class="tile-label">Data de Nascimento</span>
          </div>
          <div class="tile-content">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="tile-value" :class="{ 'text-muted': !customer.birth_date }">
                {{ customer.birth_date || 'Não informada' }}
              </span>
              <span v-if="formattedAge" class="age-badge">
                {{ formattedAge }}
              </span>
            </div>
            <div v-if="customer.birth_date && customer.phone" class="tile-actions">
              <Button
                v-if="isBirthdayToday || isBirthdayThisMonth"
                icon="ri-gift-line"
                text
                rounded
                size="small"
                severity="warn"
                class="action-icon-btn"
                title="Enviar parabéns"
                @click="sendBirthdayMessage(customer.phone, customer.name)"
              />
            </div>
          </div>
        </div>

        <!-- E-mail -->
        <div class="info-tile">
          <div class="tile-header">
            <div class="tile-icon-box email-icon-box">
              <i class="ri-mail-line"></i>
            </div>
            <span class="tile-label">E-mail</span>
          </div>
          <div class="tile-content">
            <span class="tile-value truncate" :class="{ 'text-muted': !customer.email }" :title="customer.email || ''">
              {{ customer.email || 'Não informado' }}
            </span>
            <div v-if="customer.email" class="tile-actions">
              <Button
                icon="ri-file-copy-line"
                text
                rounded
                size="small"
                severity="secondary"
                class="action-icon-btn"
                title="Copiar e-mail"
                @click="copyText(customer.email, 'E-mail')"
              />
            </div>
          </div>
        </div>

        <!-- CPF / Documento -->
        <div class="info-tile">
          <div class="tile-header">
            <div class="tile-icon-box doc-icon-box">
              <i class="ri-id-card-line"></i>
            </div>
            <span class="tile-label">CPF / Documento</span>
          </div>
          <div class="tile-content">
            <span class="tile-value truncate" :class="{ 'text-muted': !customer.document_number }">
              {{ customer.document_number ? (isCpfVisible ? customer.document_number : maskCpf(customer.document_number)) : 'Não informado' }}
            </span>
            <div v-if="customer.document_number" class="tile-actions">
              <Button
                :icon="isCpfVisible ? 'ri-eye-off-line' : 'ri-eye-line'"
                text
                rounded
                size="small"
                severity="secondary"
                class="action-icon-btn"
                :title="isCpfVisible ? 'Ocultar CPF (LGPD)' : 'Exibir CPF completo'"
                @click="isCpfVisible = !isCpfVisible"
              />
              <Button
                icon="ri-file-copy-line"
                text
                rounded
                size="small"
                severity="secondary"
                class="action-icon-btn"
                title="Copiar documento"
                @click="copyText(customer.document_number, 'CPF')"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Observações & Preferências da Cliente -->
      <div v-if="customer.notes" class="notes-card">
        <div class="notes-card-header">
          <div class="notes-badge">
            <i class="ri-sparkling-fill text-amber-500"></i>
            <span>Preferências & Observações</span>
          </div>
        </div>
        <p class="notes-card-body">
          {{ customer.notes }}
        </p>
      </div>
    </div>

    <!-- Footer do Diálogo -->
    <template #footer>
      <div class="dialog-footer-content">
        <Button
          v-if="customer?.phone"
          label="Conversar no WhatsApp"
          icon="ri-whatsapp-line"
          severity="success"
          size="small"
          class="whatsapp-main-btn"
          @click="openWhatsApp(customer.phone)"
        />
        <div v-else class="flex-1"></div>

        <div class="flex items-center justify-end gap-2.5">
          <Button
            label="Fechar"
            icon="ri-close-line"
            severity="secondary"
            variant="text"
            size="small"
            @click="emit('update:visible', false)"
          />
          <Button
            label="Editar Cadastro"
            icon="ri-edit-line"
            severity="primary"
            size="small"
            @click="customer && emit('edit', customer)"
          />
        </div>
      </div>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AppDialog from '@/components/common/AppDialog.vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import type { ICustomer } from '@/types/customer'
import { dayjs } from '@/utils/date'
import { maskCpf } from '@/utils/security'
import { useToast } from 'primevue/usetoast'

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

const toast = useToast()
const isCpfVisible = ref<boolean>(false)

function getInitials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatRegistrationDate(dateString?: string): string {
  if (!dateString) return 'Data não informada'
  const parsed = dayjs(dateString)
  if (!parsed.isValid()) return 'Data não informada'
  return parsed.format('DD/MM/YYYY')
}

const formattedAge = computed<string | null>(() => {
  if (!props.customer?.birth_date) return null
  const parsed = dayjs(props.customer.birth_date, ['DD/MM/YYYY', 'YYYY-MM-DD'], true)
  if (parsed.isValid() && parsed.year() > 1900 && parsed.year() < dayjs().year()) {
    const age = dayjs().diff(parsed, 'year')
    return `${age} anos`
  }
  return null
})

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

async function copyText(text: string, label: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    toast.add({
      severity: 'info',
      summary: 'Copiado',
      detail: `${label} copiado para a área de transferência.`,
      life: 2500
    })
  } catch {
    toast.add({
      severity: 'warn',
      summary: 'Não foi possível copiar',
      detail: text,
      life: 3000
    })
  }
}

function openWhatsApp(phone: string): void {
  const clean = phone.replace(/\D/g, '')
  if (!clean) return
  const fullPhone = clean.length <= 11 ? `55${clean}` : clean
  const greeting = props.customer ? `Olá, ${props.customer.name}! Tudo bem?` : 'Olá! Tudo bem?'
  window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(greeting)}`, '_blank')
}

function sendBirthdayMessage(phone: string, customerName: string): void {
  const clean = phone.replace(/\D/g, '')
  if (!clean) return
  const fullPhone = clean.length <= 11 ? `55${clean}` : clean
  const msg = `Parabéns, ${customerName}! Desejamos a você um feliz aniversário repleto de realizações! Passe aqui na loja para comemorar com a gente!`
  window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank')
}
</script>

<style scoped>
.customer-dossier {
  animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* =========================================================
 * Hero Card do Cliente (Estilo Boutique VIP)
 * ========================================================= */
.profile-hero-card {
  display: flex;
  align-items: center;
  gap: 1.15rem;
  padding: 1.1rem 1.25rem;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, #fff0f3 0%, #ffe4e8 35%, #ffffff 100%);
  border: 1px solid rgba(225, 29, 72, 0.14);
  box-shadow: 0 4px 16px -2px rgba(225, 29, 72, 0.06);
}

.profile-avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.profile-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff4d6d 0%, #e11d48 100%);
  color: #ffffff;
  font-family: var(--font-title);
  font-size: 1.15rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(225, 29, 72, 0.25);
  border: 2px solid #ffffff;
  letter-spacing: -0.5px;
}

.avatar-celebration-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  font-size: 0.9rem;
  background: #ffffff;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  border: 1.5px solid #ffffff;
}

.profile-main-info {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
  flex: 1;
}

.profile-header-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.profile-name {
  font-family: var(--font-title);
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
  margin: 0;
  letter-spacing: -0.01em;
}

.profile-stats-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.stat-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(225, 29, 72, 0.12);
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-xs);
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-secondary);
  line-height: 1.2;
}

.stat-pill i {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.stat-pill-purchases {
  background: #fff1f2;
  border-color: #fecdd3;
  color: #be123c;
  font-weight: 700;
}

.stat-pill-purchases i {
  color: #e11d48;
}

.stat-pill-recent {
  background: #ecfdf5;
  border-color: #a7f3d0;
  color: #047857;
  font-weight: 700;
}

.stat-pill-recent i {
  color: #10b981;
}

.stat-pill-empty {
  background: #f8fafc;
  border-color: #e2e8f0;
  color: #94a3b8;
}

.stat-pill-empty i {
  color: #94a3b8;
}

.birthday-pill {
  font-size: 0.7rem !important;
  padding: 0.12rem 0.45rem !important;
  border-radius: var(--radius-xs) !important;
}

.birthday-pill-today {
  animation: pulseSubtle 2s infinite ease-in-out;
}

/* =========================================================
 * Grid de Informações dos Clientes
 * ========================================================= */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

@media (max-width: 520px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}

.info-tile {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 0.85rem 0.95rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.4rem;
  transition: all 0.2s ease;
}

.info-tile:hover {
  border-color: var(--border-color);
  box-shadow: 0 4px 12px rgba(225, 29, 72, 0.04);
  transform: translateY(-1px);
}

.tile-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tile-icon-box {
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.whatsapp-icon-box {
  background: #ecfdf5;
  color: #10b981;
}

.birthday-icon-box {
  background: #fff1f2;
  color: #e11d48;
}

.email-icon-box {
  background: #f5f3ff;
  color: #8b5cf6;
}

.doc-icon-box {
  background: #f1f5f9;
  color: #64748b;
}

.tile-label {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.tile-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.tile-value {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-primary);
}

.text-muted {
  color: var(--text-muted);
  font-weight: 400;
  font-style: italic;
}

.age-badge {
  font-size: 0.68rem;
  font-weight: 600;
  background: var(--p-brand-50);
  color: var(--p-brand-700);
  padding: 0.05rem 0.4rem;
  border-radius: var(--radius-xs);
}

.tile-actions {
  display: flex;
  align-items: center;
  gap: 0.1rem;
}

.action-icon-btn {
  width: 26px !important;
  height: 26px !important;
  padding: 0 !important;
}

/* =========================================================
 * Card de Preferências & Observações
 * ========================================================= */
.notes-card {
  background: linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%);
  border: 1px solid #fde68a;
  border-radius: var(--radius-md);
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.notes-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.notes-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.73rem;
  font-weight: 700;
  color: #92400e;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.notes-card-body {
  margin: 0;
  font-size: 0.83rem;
  line-height: 1.5;
  color: #78350f;
  white-space: pre-wrap;
}

/* =========================================================
 * Footer do Diálogo
 * ========================================================= */
.dialog-footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 0.75rem;
}

.whatsapp-main-btn {
  font-weight: 600;
}
</style>
