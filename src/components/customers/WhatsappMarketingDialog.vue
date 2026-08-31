<template>
  <AppDialog :visible="visible" title="Marketing & Mensagens Rápidas" subtitle="Gere mensagens e anúncios usando IA"
    icon="ri-sparkling-fill" width="650px" @update:visible="(val: boolean) => emit('update:visible', val)">
    <div class="marketing-dialog-content flex flex-col gap-4">

      <!-- Seletor de Modo (Custom Segmented Control) -->
      <SelectButton v-model="activeMode" :options="modes" optionLabel="label" optionValue="value" :allowEmpty="false"
        fluid size="small" />

      <!-- Modo: Clientes -->
      <template v-if="activeMode === 'customer'">
        <FloatLabel variant="in">
          <Select id="customer-select" v-model="selectedCustomer" :options="customerStore.customerList"
            optionLabel="name" filter class="w-full">
            <template #value="slotProps">
              <div v-if="slotProps.value" class="flex items-center gap-2">
                <i class="ri-user-line text-slate-400"></i>
                <span>{{ slotProps.value.name }}</span>
              </div>
            </template>
            <template #option="slotProps">
              <div class="flex items-center justify-between w-full py-1!">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                    <i class="ri-user-smile-line text-lg"></i>
                  </div>
                  <span class="font-medium text-(--text-primary)">{{ slotProps.option.name }}</span>
                </div>
                <span class="text-xs font-medium px-2.5 py-1 bg-(--bg-secondary) rounded-md text-(--p-brand-600)">{{
                  slotProps.option.phone || 'Sem número' }}</span>
              </div>
            </template>
          </Select>
          <label for="customer-select">Selecione o Cliente</label>
        </FloatLabel>
      </template>

      <!-- Modo: Produtos -->
      <template v-if="activeMode === 'product'">
        <FloatLabel variant="in">
          <Select id="product-select" v-model="selectedProduct" :options="sortedProducts" optionLabel="name" filter
            class="w-full">
            <template #value="slotProps">
              <div v-if="slotProps.value" class="flex items-center gap-2">
                <i class="ri-shopping-bag-3-line text-slate-400"></i>
                <span>{{ slotProps.value.name }}</span>
              </div>
            </template>
            <template #option="slotProps">
              <div class="flex items-center justify-between w-full py-1!">
                <div class="flex items-center gap-2.5">
                  <div
                    class="w-8 h-8 rounded-full bg-(--bg-secondary) flex items-center justify-center text-(--p-brand-500)">
                    <i class="ri-shopping-bag-line text-lg"></i>
                  </div>
                  <span class="font-medium text-(--text-primary)">{{ slotProps.option.name }}</span>
                </div>
                <Tag v-if="isExpiringSoonFn(slotProps.option.expiry_date)" severity="danger" value="Perto Vencer"
                  class="text-[10px] px-2!" />
                <span v-else
                  class="text-xs font-medium px-2.5 py-1 bg-(--bg-secondary) rounded-md text-(--text-secondary)">Est: {{
                    slotProps.option.stock_quantity }}</span>
              </div>
            </template>
          </Select>
          <label for="product-select">Selecione o Produto</label>
        </FloatLabel>
      </template>

      <!-- Tipo de Mensagem -->
      <div v-if="(activeMode === 'customer' && selectedCustomer) || (activeMode === 'product' && selectedProduct)"
        class="flex flex-col gap-2">
        <label class="block text-xs font-bold tracking-wider text-(--p-brand-600) uppercase mt-2 mb-1">
          {{ activeMode === 'customer' ? 'Tipo de Mensagem' : 'Estratégia de Venda' }}
        </label>

        <div class="grid gap-2"
          :class="activeMode === 'customer' ? 'grid-cols-2 md:grid-cols-3' : 'grid-rows-1 md:grid-cols-2'">
          <Button v-for="type in currentMessageTypes" :key="type.value" :severity="type.severity" type="button"
            :outlined="selectedType !== type.value" :icon="type.icon" @click="selectType(type.value)"
            :label="type.label" size="small" />
        </div>

        <FloatLabel v-if="selectedType === 'generic'" class="mt-3" variant="in">
          <InputText id="custom-subject" v-model="customSubject" class="w-full" />
          <label for="custom-subject">Qual o assunto da mensagem?</label>
        </FloatLabel>
      </div>

      <!-- Caixa de Mensagem Final -->
      <div class="message-box mt-3 p-4 glass-panel"
        v-if="selectedType && ((activeMode === 'customer' && selectedCustomer) || (activeMode === 'product' && selectedProduct))">

        <div class="flex items-center gap-2 mb-3">
          <div class="w-6 h-6 rounded-sm bg-(--p-gold-100) flex items-center justify-center">
            <i class="ri-magic-line text-(--p-gold-600) text-xs"></i>
          </div>
          <span class="text-sm font-bold text-(--text-primary)">Resultado da IA</span>
        </div>

        <Textarea v-model="generatedMessage" rows="6" fluid :disabled="isGenerating" class="text-sm! leading-relaxed!"
          placeholder="O anúncio ou mensagem aparecerá aqui..." />

        <p class="text-[11px] font-medium text-(--p-brand-600) mt-2.5 flex items-center gap-1.5">
          <i class="ri-edit-line text-sm"></i>
          Você pode editar o texto livremente antes de copiar ou enviar.
        </p>
      </div>
    </div>

    <!-- Footer do Diálogo -->
    <template #footer>
      <div class="flex flex-1 flex-col md:flex-row justify-end gap-3">
        <!-- Botão Gerar -->
        <Button v-if="canGenerate" label="Gerar com IA" icon="ri-sparkling-fill" size="small" severity="warn"
          :loading="isGenerating" class="w-full md:w-auto mr-auto" @click="generateAIMessage" />

        <div class="flex justify-end gap-2">
          <Button label="Cancelar" icon="ri-close-line" size="small" severity="secondary" variant="text"
            @click="emit('update:visible', false)" />

          <!-- Ação final dependendo do modo -->
          <Button v-if="activeMode === 'customer'" label="Enviar WhatsApp" icon="ri-whatsapp-line" size="small"
            severity="success" :disabled="!selectedCustomer || !selectedCustomer.phone || !generatedMessage"
            @click="sendWhatsApp" />

          <Button v-if="activeMode === 'product'" label="Copiar Texto" icon="ri-clipboard-line" size="small"
            severity="primary" :disabled="!selectedProduct || !generatedMessage" @click="copyToClipboard" />
        </div>
      </div>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import AppDialog from '@/components/common/AppDialog.vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import FloatLabel from 'primevue/floatlabel'
import Tag from 'primevue/tag'
import { useCustomerStore } from '@/stores/customerStore'
import { useProductStore } from '@/stores/productStore'
import { useToast } from 'primevue/usetoast'
import type { ICustomer } from '@/types/customer'
import type { IProduct } from '@/types/product'
import { functions } from '@/services/appwrite'
import { ExecutionMethod } from 'appwrite'
import { isExpiringSoon } from '@/utils/date'

const props = withDefaults(defineProps<{ visible: boolean }>(), { visible: false })
const emit = defineEmits<{ (e: 'update:visible', val: boolean): void }>()

const customerStore = useCustomerStore()
const productStore = useProductStore()
const toast = useToast()

const activeMode = ref<'customer' | 'product'>('customer')
const modes = [
  { label: 'Relacionamento', value: 'customer', icon: 'ri-user-heart-line' },
  { label: 'Vendas', value: 'product', icon: 'ri-shopping-bag-3-line' }
]

const selectedCustomer = ref<ICustomer | null>(null)
const selectedProduct = ref<IProduct | null>(null)
const selectedType = ref<string>('')
const customSubject = ref<string>('')
const generatedMessage = ref<string>('')
const isGenerating = ref<boolean>(false)

const isExpiringSoonFn = (dateStr?: string | null) => dateStr ? isExpiringSoon(dateStr, 90) : false

const sortedProducts = computed(() => {
  if (!productStore.products) return []
  return [...productStore.products].sort((a, b) => {
    const aExp = isExpiringSoonFn(a.expiry_date)
    const bExp = isExpiringSoonFn(b.expiry_date)
    if (aExp && !bExp) return -1
    if (!aExp && bExp) return 1
    return (a.name || '').localeCompare(b.name || '')
  })
})

const customerMessageTypes = [
  { label: 'Aniversário', value: 'birthday', icon: 'ri-cake-2-line', severity: 'warn' },
  { label: 'Novidades', value: 'news', icon: 'ri-megaphone-line', severity: 'info' },
  { label: 'Saudades', value: 'missing', icon: 'ri-emotion-happy-line', severity: 'help' },
  { label: 'Promoção', value: 'promotion', icon: 'ri-price-tag-3-line', severity: 'danger' },
  { label: 'Agradecimento', value: 'thanks', icon: 'ri-heart-3-line', severity: 'success' },
  { label: 'Outros', value: 'generic', icon: 'ri-chat-smile-3-line', severity: 'primary' }
] as const

const productMessageTypes = [
  { label: 'Queima de Estoque', value: 'clearance', icon: 'ri-fire-line', severity: 'danger' },
  { label: 'Oferta Imperdível', value: 'unmissable', icon: 'ri-price-tag-3-line', severity: 'warn' },
  { label: 'Novidade', value: 'news', icon: 'ri-sparkling-2-line', severity: 'info' },
  { label: 'Benefícios', value: 'generic', icon: 'ri-magic-line', severity: 'primary' }
] as const

const currentMessageTypes = computed(() => activeMode.value === 'customer' ? customerMessageTypes : productMessageTypes)

const canGenerate = computed(() => {
  if (activeMode.value === 'customer') {
    return !!selectedCustomer.value
  } else {
    return !!selectedProduct.value
  }
})

watch(() => props.visible, (val) => {
  if (val) {
    if (!customerStore.customerList || customerStore.customerList.length === 0) {
      customerStore.fetchAll()
    }
    if (!productStore.products || productStore.products.length === 0) {
      productStore.fetchAll()
    }
  } else {
    // Reset state on close
    activeMode.value = 'customer'
    selectedCustomer.value = null
    selectedProduct.value = null
    selectedType.value = ''
    customSubject.value = ''
    generatedMessage.value = ''
  }
})

watch(activeMode, () => {
  selectedType.value = ''
  generatedMessage.value = ''
})

function selectType(type: string) {
  selectedType.value = type
  generatedMessage.value = ''
}

async function generateAIMessage() {
  if (!canGenerate.value || !selectedType.value) return

  isGenerating.value = true
  try {
    const payload = {
      marketingMode: activeMode.value,
      customerName: activeMode.value === 'customer' ? selectedCustomer.value?.name : undefined,
      productName: activeMode.value === 'product' ? selectedProduct.value?.name : undefined,
      messageType: selectedType.value,
      customSubject: selectedType.value === 'generic' ? customSubject.value : undefined
    }

    const execution = await functions.createExecution({
      functionId: 'whatsapp-ai',
      body: JSON.stringify(payload),
      async: false,
      xpath: '/',
      method: ExecutionMethod.POST
    })

    let result: any = null
    try {
      result = execution.responseBody ? JSON.parse(execution.responseBody) : null
    } catch (e) {
      console.warn('Could not parse response body', e)
    }

    if (execution.status === 'completed' && result?.message) {
      generatedMessage.value = result.message
      toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Anúncio gerado com IA!', life: 3000 })
    } else if (result?.message) {
      generatedMessage.value = result.message
      toast.add({ severity: 'warn', summary: 'Aviso', detail: result.error || 'IA indisponível. Usando texto padrão.', life: 3000 })
    } else {
      throw new Error(`Falha na execução: ${execution.responseBody || execution.errors || execution.status}`)
    }
  } catch (error) {
    console.error('Erro ao gerar mensagem via IA:', error)
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Erro na IA. O texto precisará ser escrito manualmente.', life: 3000 })
  } finally {
    isGenerating.value = false
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
  const params = new URLSearchParams({ phone: fullPhone, text: generatedMessage.value })
  window.open(`https://api.whatsapp.com/send?${params.toString()}`, '_blank')
}

async function copyToClipboard() {
  if (!generatedMessage.value) return

  try {
    await navigator.clipboard.writeText(generatedMessage.value)
    toast.add({ severity: 'success', summary: 'Copiado!', detail: 'Texto copiado para a área de transferência.', life: 3000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao copiar o texto.', life: 3000 })
  }
}
</script>