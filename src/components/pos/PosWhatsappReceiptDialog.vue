<template>
  <Dialog :visible="visible" modal header="Enviar Comprovante no WhatsApp" :style="{ width: '480px', maxWidth: '95vw' }"
    @update:visible="(val) => emit('update:visible', val)">
    <Fluid>
      <div class="whatsapp-dialog-content">
        <div class="whatsapp-banner">
          <i class="ri-whatsapp-line"></i>
          <span>Envie o comprovante digital da compra diretamente para o WhatsApp da sua cliente.</span>
        </div>

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
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import FloatLabel from 'primevue/floatlabel'
import Fluid from 'primevue/fluid'
import type { ISale } from '@/types/sale'
import type { ISettings } from '@/types/storeSettings'
import { formatCurrency } from '@/utils/currency'

interface Props {
  visible: boolean
  sale: ISale | null
  settings: Partial<ISettings> | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
}>()

const phoneInput = ref<string>('')

watch(
  () => props.sale,
  (newSale) => {
    if (newSale?.customer_phone) {
      phoneInput.value = newSale.customer_phone.replace(/\D/g, '')
    } else {
      phoneInput.value = ''
    }
  },
  { immediate: true }
)

const cleanPhone = computed(() => phoneInput.value.replace(/\D/g, ''))
const isValidPhone = computed(() => cleanPhone.value.length >= 10)

const formattedMessage = computed(() => {
  const storeName = props.settings?.store_name || 'Beauty Manager'
  const customer = props.sale?.customer_name ? `Olá, *${props.sale.customer_name}*! ` : 'Olá! '
  const total = formatCurrency(props.sale?.total_amount || 0)

  let text = `🌸 *${storeName}*\n\n`
  text += `${customer}Muito obrigada pela sua compra conosco! ✨\n\n`
  text += `🛒 *Resumo do seu Pedido:*\n`

  if (props.sale?.items) {
    props.sale.items.forEach((item) => {
      const pName = typeof item.product === 'object' && item.product && 'name' in item.product
        ? item.product.name
        : 'Produto'
      text += `• ${item.quantity}x ${pName} - ${formatCurrency(item.subtotal)}\n`
    })
  }

  text += `\n💰 *Total:* ${total}\n`
  text += `💳 *Forma de Pagamento:* ${props.sale?.payment_method || 'Confirmado'}\n\n`
  text += `Dúvidas ou novidades? Fale com a gente por aqui! Tenha um dia maravilhoso! 💖`

  return text
})

function openWhatsApp(): void {
  const phone = cleanPhone.value
  const fullPhone = phone.startsWith('55') ? phone : `55${phone}`
  const encoded = encodeURIComponent(formattedMessage.value)
  const url = `https://wa.me/${fullPhone}?text=${encoded}`
  window.open(url, '_blank')
  emit('update:visible', false)
}
</script>

<style scoped>
.whatsapp-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.intro-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 8px;
  color: #065f46;
  font-size: 0.85rem;
  font-weight: 600;
}

.intro-box i {
  font-size: 1.5rem;
  color: #10b981;
}

.field-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary);
  display: block;
  margin-bottom: 0.3rem;
}

.field-hint {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 0.2rem;
  display: block;
}

.message-preview {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.85rem;
  font-family: var(--font-sans);
  font-size: 0.82rem;
  white-space: pre-line;
  max-height: 180px;
  overflow-y: auto;
  color: #334155;
}
</style>
