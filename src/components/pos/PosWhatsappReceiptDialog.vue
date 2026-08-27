<template>
  <AppDialog
    :visible="visible"
    title="Comprovante no WhatsApp"
    subtitle="Envie o comprovante digital da compra diretamente para o WhatsApp"
    icon="ri-whatsapp-line"
    width="480px"
    @update:visible="(val) => emit('update:visible', val)"
  >
    <Fluid>
      <div class="whatsapp-dialog-content">
        <div class="field-item">
          <FloatLabel variant="in">
            <InputText id="whatsapp_dest_phone" v-model="phoneInput" size="small" fluid />
            <label for="whatsapp_dest_phone">WhatsApp da Cliente (DDD + Número)</label>
          </FloatLabel>
        </div>

        <div class="field-item">
          <label class="field-label">Pré-visualização da Mensagem</label>
          <div class="message-preview">
            {{ formattedMessage }}
          </div>
        </div>
      </div>
    </Fluid>

    <template #footer>
      <div class="dialog-actions">
        <Button label="Fechar" icon="ri-close-line" severity="secondary" text size="small" @click="emit('update:visible', false)" />
        <Button label="Abrir WhatsApp" icon="ri-whatsapp-line" severity="success" size="small" :disabled="!isValidPhone"
          @click="openWhatsApp" />
      </div>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AppDialog from '@/components/common/AppDialog.vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import FloatLabel from 'primevue/floatlabel'
import Fluid from 'primevue/fluid'
import type { ISale } from '@/types/sale'
import { generateSaleReceiptText } from '@/utils/receipt'
import { useSettingsStore } from '@/stores/settingsStore'

interface Props {
  visible: boolean
  sale: ISale | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
}>()

const settingsStore = useSettingsStore()
const phoneInput = ref<string>('')

watch(
  () => props.sale,
  (s) => {
    if (s && s.customer_phone) {
      phoneInput.value = s.customer_phone
    } else {
      phoneInput.value = ''
    }
  },
  { immediate: true }
)

const formattedMessage = computed<string>(() => {
  if (!props.sale) return ''
  return generateSaleReceiptText(props.sale, settingsStore.settings)
})

const isValidPhone = computed<boolean>(() => {
  const clean = phoneInput.value.replace(/\D/g, '')
  return clean.length >= 10 && clean.length <= 11
})

function openWhatsApp(): void {
  if (!isValidPhone.value) return
  const clean = phoneInput.value.replace(/\D/g, '')
  const fullPhone = `55${clean}`
  const encodedText = encodeURIComponent(formattedMessage.value)
  window.open(`https://wa.me/${fullPhone}?text=${encodedText}`, '_blank')
}
</script>

<style scoped>
.whatsapp-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  padding-top: 0.25rem;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.message-preview {
  background: var(--bg-card-soft);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.85rem;
  font-size: 0.78rem;
  color: var(--text-primary);
  white-space: pre-wrap;
  max-height: 180px;
  overflow-y: auto;
  line-height: 1.4;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  width: 100%;
}
</style>
