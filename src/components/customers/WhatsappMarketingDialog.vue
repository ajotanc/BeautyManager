<template>
  <AppDialog :visible="visible" title="Marketing & Mensagens Rápidas"
    subtitle="Envie mensagens personalizadas via WhatsApp com IA" icon="ri-whatsapp-line" width="600px"
    @update:visible="(val: boolean) => emit('update:visible', val)">
    <div class="marketing-dialog-content flex flex-col gap-3">
      <!-- Seleção de Cliente -->
      <FloatLabel variant="in">
        <Select id="customer-select" v-model="selectedCustomer" :options="customerStore.customerList" optionLabel="name"
          filter class="w-full">
          <template #value="slotProps">
            <div v-if="slotProps.value" class="flex items-center gap-2">
              <i class="ri-user-line text-slate-400"></i>
              <span>{{ slotProps.value.name }}</span>
            </div>
          </template>
          <template #option="slotProps">
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center gap-2">
                <i class="ri-user-smile-line text-emerald-500"></i>
                <span class="font-medium">{{ slotProps.option.name }}</span>
              </div>
              <span class="text-xs text-slate-400">{{ slotProps.option.phone || 'Sem número' }}</span>
            </div>
          </template>
        </Select>
        <label for="customer-select">Selecione o Cliente</label>
      </FloatLabel>

      <!-- Tipo de Mensagem -->
      <div v-if="selectedCustomer" class="flex flex-col gap-2">
        <label class="block text-sm font-semibold text-slate-700">Tipo de Mensagem</label>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
          <Button v-for="type in messageTypes" :key="type.value" :label="type.label" :icon="type.icon" size="small"
            :severity="selectedType === type.value ? type.severity : 'secondary'"
            :variant="selectedType === type.value ? undefined : 'outlined'" @click="selectType(type.value)" />
        </div>

        <FloatLabel v-if="selectedType === 'generic'" class="mt-3" variant="in">
          <InputText id="custom-subject" v-model="customSubject" class="w-full" />
          <label for="custom-subject">Qual o assunto da mensagem?</label>
        </FloatLabel>
      </div>

      <!-- Caixa de Mensagem Final -->
      <div class="message-box" v-if="selectedType && selectedCustomer">

        <FloatLabel variant="in">
          <Textarea v-model="generatedMessage" rows="5" class="w-full" placeholder="A mensagem aparecerá aqui..."
            :disabled="isGenerating" />
          <label for="generated-message">Mensagem Gerada</label>
        </FloatLabel>
        <p class="text-xs text-slate-500 mt-1 flex items-center gap-1">
          <i class="ri-information-line"></i>
          Você pode editar a mensagem antes de enviar.
        </p>
      </div>
    </div>

    <!-- Footer do Diálogo -->
    <template #footer>
      <div class="flex flex-1 flex-col md:flex-row justify-end gap-3">
        <Button v-if="selectedCustomer?.phone && generatedMessage" label="Gerar com IA" icon="ri-sparkling-fill" size="small" severity="warn" :loading="isGenerating"
          class="w-full md:w-auto mr-auto" @click="generateAIMessage" />
        <div class="flex justify-end">
          <Button label="Cancelar" icon="ri-close-line" size="small" severity="secondary" variant="text"
            @click="emit('update:visible', false)" />
          <Button label="Enviar via WhatsApp" icon="ri-whatsapp-line" size="small" severity="success"
            :disabled="!selectedCustomer || !selectedCustomer.phone || !generatedMessage" @click="sendWhatsApp" />
        </div>
      </div>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import AppDialog from '@/components/common/AppDialog.vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import FloatLabel from 'primevue/floatlabel'
import { useCustomerStore } from '@/stores/customerStore'
import { useToast } from 'primevue/usetoast'
import type { ICustomer } from '@/types/customer'
import { functions } from '@/services/appwrite'
import { ExecutionMethod } from 'appwrite'

const props = withDefaults(defineProps<{ visible: boolean }>(), { visible: false })
const emit = defineEmits<{ (e: 'update:visible', val: boolean): void }>()

const customerStore = useCustomerStore()
const toast = useToast()

const selectedCustomer = ref<ICustomer | null>(null)
const selectedType = ref<string>('')
const customSubject = ref<string>('')
const generatedMessage = ref<string>('')
const isGenerating = ref<boolean>(false)

const FUNCTION_ID = import.meta.env.VITE_APPWRITE_FUNCTION_WHATSAPP_AI || 'whatsapp-ai'

const messageTypes = [
  { label: 'Aniversário', value: 'birthday', icon: 'ri-cake-2-line', severity: 'warn' },
  { label: 'Novidades', value: 'news', icon: 'ri-megaphone-line', severity: 'info' },
  { label: 'Saudades', value: 'missing', icon: 'ri-emotion-happy-line', severity: 'help' },
  { label: 'Promoção', value: 'promotion', icon: 'ri-price-tag-3-line', severity: 'danger' },
  { label: 'Agradecimento', value: 'thanks', icon: 'ri-heart-3-line', severity: 'success' },
  { label: 'Outros', value: 'generic', icon: 'ri-chat-smile-3-line', severity: 'primary' }
] as const

watch(() => props.visible, (val) => {
  if (val) {
    if (!customerStore.customerList || customerStore.customerList.length === 0) {
      customerStore.fetchAll()
    }
  } else {
    // Reset state on close
    selectedCustomer.value = null
    selectedType.value = ''
    customSubject.value = ''
    generatedMessage.value = ''
  }
})

watch([selectedCustomer, selectedType, customSubject], () => {
  if (selectedCustomer.value && selectedType.value && !isGenerating.value) {
    generatedMessage.value = getFallbackMessage(selectedCustomer.value.name, selectedType.value, customSubject.value)
  }
})

function selectType(type: string) {
  selectedType.value = type
  if (selectedCustomer.value) {
    generatedMessage.value = getFallbackMessage(selectedCustomer.value.name, type, customSubject.value)
  }
}

async function generateAIMessage() {
  if (!selectedCustomer.value || !selectedType.value) return

  isGenerating.value = true
  try {
    const payload = {
      customerName: selectedCustomer.value.name,
      messageType: selectedType.value,
      customSubject: selectedType.value === 'generic' ? customSubject.value : undefined
    }

    const execution = await functions.createExecution(
      FUNCTION_ID,
      JSON.stringify(payload),
      false, // async = false, wait for result
      '/',
      ExecutionMethod.POST
    )

    let result: any = null
    try {
      result = execution.responseBody ? JSON.parse(execution.responseBody) : null
    } catch (e) {
      console.warn('Could not parse response body', e)
    }

    if (execution.status === 'completed' && result?.message) {
      generatedMessage.value = result.message
      toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Mensagem gerada com IA!', life: 2500 })
    } else if (result?.message) {
      generatedMessage.value = result.message
      toast.add({ severity: 'warn', summary: 'Aviso', detail: result.error || 'IA indisponível. Usando mensagem padrão.', life: 4000 })
    } else {
      throw new Error(`Falha na execução da função: ${execution.responseBody || execution.errors || execution.status}`)
    }
  } catch (error) {
    console.error('Erro ao gerar mensagem via IA:', error)
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Usando mensagem padrão. A IA pode estar indisponível.', life: 4000 })
    generatedMessage.value = getFallbackMessage(selectedCustomer.value.name, selectedType.value, customSubject.value)
  } finally {
    isGenerating.value = false
  }
}

function getFallbackMessage(name: string, type: string, subject?: string) {
  const firstName = name ? name.split(' ')[0] : 'Cliente'
  switch (type) {
    case 'birthday':
      return `Parabéns, ${firstName}! Desejamos a você um feliz aniversário repleto de realizações! Passe aqui na loja para comemorar com a gente! 🎉🎁`
    case 'news':
      return `Oi, ${firstName}! Chegaram os novos produtos que você adora! Vem conferir as novidades aqui na loja. ✨💖`
    case 'missing':
      return `Oi, ${firstName}! Estamos com saudades de você por aqui! Apareça qualquer dia para ver as novidades e bater um papo. 🥰`
    case 'promotion':
      return `Oi, ${firstName}! Preparamos umas promoções super especiais pra você. Vem aproveitar os nossos descontos! 🛍️🤑`
    case 'thanks':
      return `Olá, ${firstName}! Tudo bem? Passando para agradecer pela sua última visita aqui na loja. Ficamos muito felizes em ter você como cliente! 🥰💖`
    default:
      if (subject) {
        return `Olá, ${firstName}! Tudo bem? Passando para falar sobre: ${subject}. 😊`
      }
      return `Olá, ${firstName}! Tudo bem? Passando para deixar um oi e nos colocar à disposição! 😊`
  }
}

function sendWhatsApp() {
  if (!selectedCustomer.value?.phone || !generatedMessage.value) {
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Cliente sem número de WhatsApp.', life: 3000 })
    return
  }
  const clean = selectedCustomer.value.phone.replace(/\D/g, '')
  if (!clean) return
  const fullPhone = clean.length <= 11 ? `55${clean}` : clean
  window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(generatedMessage.value)}`, '_blank')
}
</script>