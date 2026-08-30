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
      <div class="flex flex-col gap-4 pt-1">
        <FloatLabel variant="in">
          <InputText id="whatsapp_dest_phone" v-model="phoneInput" size="small" fluid />
          <label for="whatsapp_dest_phone">WhatsApp</label>
        </FloatLabel>

        <FloatLabel variant="in">
          <Textarea
            id="whatsapp_message"
            v-model="formattedMessage"
            rows="6"
            auto-resize
            readonly
            class="text-xs leading-relaxed"
          />
          <label for="whatsapp_message">Pré-visualização da Mensagem</label>
        </FloatLabel>
      </div>
    </Fluid>

    <template #footer>
      <div class="flex items-center justify-end gap-2.5 w-full">
        <Button
          label="Fechar"
          icon="ri-close-line"
          severity="secondary"
          variant="text"
          size="small"
          @click="emit('update:visible', false)"
        />
        <Button
          label="Abrir WhatsApp"
          icon="ri-whatsapp-line"
          severity="success"
          size="small"
          :disabled="!isValidPhone"
          @click="openWhatsApp"
        />
      </div>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AppDialog from '@/components/common/AppDialog.vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import FloatLabel from 'primevue/floatlabel'
import Fluid from 'primevue/fluid'
import type { ISale } from '@/types/sale'
import { generateSaleReceiptText } from '@/utils/receipt'
import { useSettingsStore } from '@/stores/settingsStore'

interface Props {
  visible: boolean
  sale: ISale | null
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  sale: null
})
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
  const params = new URLSearchParams({ phone: fullPhone, text: formattedMessage.value })
  window.open(`https://api.whatsapp.com/send?${params.toString()}`, '_blank')
}
</script>
