<template>
  <div class="settings-view">
    <div class="view-header">
      <div>
        <h1 class="page-title"><i class="ri-settings-4-line"></i> Configurações & Cupom Térmico</h1>
        <p class="page-subtitle">Personalize os dados da sua loja, mensagem de rodapé, largura da bobina e QR Code do
          comprovante</p>
      </div>

      <div class="header-actions">
        <Button label="Testar Impressão" icon="ri-printer-line" severity="secondary" variant="outlined" size="small"
          @click="handleTestPrint" />
        <Button label="Salvar Alterações" icon="ri-check-line" severity="primary" size="small" :loading="isSaving"
          @click="handleSaveSettings" />
      </div>
    </div>

    <div class="settings-grid">
      <!-- Coluna Esquerda: Formulário de Configurações -->
      <Fluid>
        <div class="settings-form-panel glass-panel">
          <!-- Dados da Loja -->
          <AppSectionHeader title="Dados da Loja" subtitle="Informações exibidas no topo do cupom fiscal e recibos"
            icon="ri-store-2-fill" />

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="field-item">
              <FloatLabel variant="in">
                <InputText id="store_name" v-model="formData.store_name" fluid :invalid="!!errors.store_name" />
                <label for="store_name">Nome Fantasia da Loja *</label>
              </FloatLabel>
              <Message v-if="errors.store_name" severity="error" size="small" variant="simple">
                {{ errors.store_name }}
              </Message>
            </div>

            <div class="field-item">
              <FloatLabel variant="in">
                <InputText id="document_number" v-model="formData.document_number" fluid />
                <label for="document_number">CNPJ ou CPF (Opcional)</label>
              </FloatLabel>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="field-item">
              <FloatLabel variant="in">
                <InputText id="phone" v-model="formData.phone" fluid />
                <label for="phone">WhatsApp da Loja</label>
              </FloatLabel>
            </div>

            <div class="field-item">
              <FloatLabel variant="in">
                <InputText id="instagram" v-model="formData.instagram" fluid />
                <label for="instagram">Instagram (@loja)</label>
              </FloatLabel>
            </div>
          </div>

          <div class="field-item">
            <FloatLabel variant="in">
              <InputText id="address" v-model="formData.address" fluid />
              <label for="address">Endereço Completo</label>
            </FloatLabel>
          </div>

          <div class="divider"></div>

          <!-- Impressora Térmica & QR Code -->
          <AppSectionHeader title="Formato da Impressora Térmica & QR Code"
            subtitle="Dimensões da bobina e código de leitura no comprovante" icon="ri-printer-fill" />

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="field-item">
              <FloatLabel variant="in">
                <Select id="receipt_width" v-model="formData.receipt_width" :options="[
                  { label: '58 mm (Padrão Bobina Pequena)', value: '58mm' },
                  { label: '80 mm (Bobina Larga)', value: '80mm' }
                ]" option-label="label" option-value="value" fluid />
                <label for="receipt_width">Largura da Bobina</label>
              </FloatLabel>
            </div>

            <div class="field-item">
              <FloatLabel variant="in">
                <Select id="qrcode_type" v-model="formData.qrcode_type" :options="[
                  { label: 'WhatsApp da Loja (Link Direto)', value: 'whatsapp' },
                  { label: 'Instagram da Loja', value: 'instagram' },
                  { label: 'Chave PIX', value: 'pix' },
                  { label: 'Link Personalizado', value: 'custom' }
                ]" option-label="label" option-value="value" fluid />
                <label for="qrcode_type">Tipo do QR Code</label>
              </FloatLabel>
            </div>
          </div>

          <div v-if="formData.qrcode_type === 'pix'" class="field-item">
            <FloatLabel variant="in">
              <InputText id="pix_key" v-model="formData.pix_key" fluid />
              <label for="pix_key">Chave PIX da Loja</label>
            </FloatLabel>
          </div>

          <div v-if="formData.qrcode_type === 'custom'" class="field-item">
            <FloatLabel variant="in">
              <InputText id="qrcode_payload" v-model="formData.qrcode_payload" fluid />
              <label for="qrcode_payload">Link ou Conteúdo do QR Code</label>
            </FloatLabel>
          </div>

          <div class="qr-chk-card">
            <Checkbox v-model="formData.show_qrcode" :binary="true" input-id="show-qr-chk" />
            <label for="show-qr-chk" class="qr-chk-label">
              Exibir QR Code no rodapé do comprovante (WhatsApp, Instagram ou PIX)
            </label>
          </div>

          <div class="divider"></div>

          <!-- Programa de Fidelidade -->
          <AppSectionHeader title="Programa de Fidelidade (Mimos)"
            subtitle="Regras para alertas de brindes no PDV" icon="ri-gift-fill" />

          <div class="field-item">
            <FloatLabel variant="in">
              <InputNumber id="loyalty_milestone" v-model="formData.loyalty_milestone" fluid />
              <label for="loyalty_milestone">Meta de Compras para Brinde</label>
            </FloatLabel>
            <p class="text-xs text-slate-500 mt-1">Ex: 2 significa que a cada 2 compras o sistema avisa para dar um brinde. Use 0 para desativar.</p>
          </div>

          <div class="divider"></div>

          <!-- Mensagens Personalizadas -->
          <AppSectionHeader title="Mensagens Personalizadas"
            subtitle="Texto impresso no final da notinha para o cliente" icon="ri-chat-3-fill" />

          <div class="field-item">
            <FloatLabel variant="in">
              <Textarea id="receipt_footer" v-model="formData.receipt_footer" rows="3" fluid auto-resize />
              <label for="receipt_footer">Mensagem de Rodapé (Agradecimento / Trocas)</label>
            </FloatLabel>
          </div>
        </div>
      </Fluid>

      <!-- Coluna Direita: Live Preview da Bobina Térmica em Tempo Real -->
      <div class="preview-panel glass-panel">
        <AppSectionHeader title="Pré-Visualização em Tempo Real"
          :subtitle="`Bobina física de ${ formData.receipt_width }`" icon="ri-eye-fill" />

        <ThermalReceiptPreview :settings="computedSettings" />
      </div>
    </div>

    <!-- Componente de Impressão Térmica para Teste -->
    <ThermalReceipt :settings="computedSettings" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onMounted } from 'vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import FloatLabel from 'primevue/floatlabel'
import Message from 'primevue/message'
import Fluid from 'primevue/fluid'
import ThermalReceiptPreview from '@/components/pos/ThermalReceiptPreview.vue'
import ThermalReceipt from '@/components/pos/ThermalReceipt.vue'

import { useSettingsStore } from '@/stores/settingsStore'
import { useThermalPrinter } from '@/composables/useThermalPrinter'
import type { ReceiptWidth, QrCodeType, ISettings } from '@/types/storeSettings'
import { useToast } from 'primevue/usetoast'
import { parseErrorMessage } from '@/types/errors'
import { settingsSchema } from '@/schemas/settingsSchema'
import AppSectionHeader from '@/components/common/AppSectionHeader.vue'

const settingsStore = useSettingsStore()
const { printReceipt } = useThermalPrinter()
const toast = useToast()

const isSaving = ref<boolean>(false)
const errors = reactive<Record<string, string>>({})

const formData = ref<{
  store_name: string
  document_number: string
  phone: string
  instagram: string
  address: string
  receipt_footer: string
  receipt_width: ReceiptWidth
  show_qrcode: boolean
  qrcode_type: QrCodeType
  qrcode_payload: string
  pix_key: string
  loyalty_milestone: number
}>({
  store_name: '',
  document_number: '',
  phone: '',
  instagram: '',
  address: '',
  receipt_footer: '',
  receipt_width: '58mm',
  show_qrcode: true,
  qrcode_type: 'whatsapp',
  qrcode_payload: '',
  pix_key: '',
  loyalty_milestone: 2
})

function clearErrors(): void {
  Object.keys(errors).forEach((key) => delete errors[key])
}

watch(
  () => settingsStore.settings,
  (s) => {
    if (s) {
      formData.value = {
        store_name: s.store_name || '',
        document_number: s.document_number || '',
        phone: s.phone || '',
        instagram: s.instagram || '',
        address: s.address || '',
        receipt_footer: s.receipt_footer || '',
        receipt_width: s.receipt_width || '58mm',
        show_qrcode: s.show_qrcode ?? true,
        qrcode_type: s.qrcode_type || 'whatsapp',
        qrcode_payload: s.qrcode_payload || '',
        pix_key: s.pix_key || '',
        loyalty_milestone: s.loyalty_milestone !== undefined ? s.loyalty_milestone : 2
      }
    }
  },
  { immediate: true }
)

const computedSettings = computed<Partial<ISettings>>(() => {
  return {
    store_name: formData.value.store_name,
    document_number: formData.value.document_number,
    phone: formData.value.phone,
    instagram: formData.value.instagram,
    address: formData.value.address,
    receipt_header: formData.value.store_name,
    receipt_footer: formData.value.receipt_footer,
    receipt_width: formData.value.receipt_width,
    show_qrcode: formData.value.show_qrcode,
    qrcode_type: formData.value.qrcode_type,
    qrcode_payload: formData.value.qrcode_payload,
    pix_key: formData.value.pix_key,
    loyalty_milestone: formData.value.loyalty_milestone
  }
})

async function handleSaveSettings(): Promise<void> {
  clearErrors()

  // Validação no frontend com Zod
  const validation = settingsSchema.safeParse({
    store_name: formData.value.store_name,
    document_number: formData.value.document_number || undefined,
    phone: formData.value.phone || undefined,
    instagram: formData.value.instagram || undefined,
    address: formData.value.address || undefined,
    receipt_header: formData.value.store_name,
    receipt_footer: formData.value.receipt_footer || undefined,
    receipt_width: formData.value.receipt_width,
    show_qrcode: formData.value.show_qrcode,
    qrcode_type: formData.value.qrcode_type,
    qrcode_payload: formData.value.qrcode_payload || undefined,
    pix_key: formData.value.pix_key || undefined,
    loyalty_milestone: formData.value.loyalty_milestone
  })

  if (!validation.success) {
    validation.error.issues.forEach((err) => {
      const field = String(err.path[0])
      if (field) {
        errors[field] = err.message
      }
    })
    toast.add({
      severity: 'warn',
      summary: 'Campos Obrigatórios',
      detail: 'Por favor, revise os campos do formulário.',
      life: 3000
    })
    return
  }

  isSaving.value = true
  try {
    await settingsStore.saveSettings(validation.data)
    toast.add({
      severity: 'success',
      summary: 'Configurações Salvas!',
      detail: 'As alterações do comprovante foram atualizadas com sucesso.',
      life: 3000
    })
  } catch (error: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Erro ao salvar',
      detail: parseErrorMessage(error),
      life: 4000
    })
  } finally {
    isSaving.value = false
  }
}

async function handleTestPrint(): Promise<void> {
  await printReceipt()
}

onMounted(async () => {
  await settingsStore.fetchSettings()
})
</script>

<style scoped>
.settings-view {
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
  font-size: 1.45rem;
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
  font-size: 0.84rem;
  color: var(--text-secondary);
  margin-top: 0.15rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 1.25rem;
  align-items: start;
}

.settings-form-panel {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
  box-sizing: border-box;
}

@media (max-width: 640px) {
  .settings-form-panel {
    padding: 1rem 0.85rem;
  }
}

.section-heading {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.section-title {
  font-family: var(--font-title);
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.section-title i {
  color: var(--p-brand-600);
}

.section-sub {
  font-size: 0.74rem;
  color: var(--text-muted);
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.qr-chk-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--p-surface-50);
  border: 1px solid var(--border-color);
  border-radius: 10px;
}

.qr-chk-label {
  font-size: 0.82rem;
  color: var(--text-secondary);
  font-weight: 500;
  cursor: pointer;
  line-height: 1.35;
}

.divider {
  height: 1px;
  background: var(--border-subtle);
  margin: 0.25rem 0;
}

.preview-panel {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  width: 100%;
  box-sizing: border-box;
}

@media (max-width: 640px) {
  .preview-panel {
    padding: 1rem 0.85rem;
  }
}

.preview-header {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
}

.preview-title {
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.preview-title i {
  color: var(--p-brand-600);
}

.preview-sub {
  font-size: 0.74rem;
  color: var(--text-muted);
}

@media (max-width: 960px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>
