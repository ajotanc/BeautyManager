<template>
  <AppDialog :visible="visible" :title="editingKit ? 'Editar Kit / Combo Promocional' : 'Novo Kit / Combo Promocional'"
    :subtitle="editingKit
      ? 'Atualize os produtos componentes, precificação e data da campanha'
      : 'Monte presentes sazonais com baixa automática de estoque nos itens'" icon="ri-gift-2-line" width="740px"
    :contentStyle="{
      maxHeight: '85vh',
      overflowY: 'auto',
      padding: '1.25rem'
    }" @update:visible="(val) => emit('update:visible', val)">
    <Fluid v-if="visible">
      <Form id="kit-form-element" ref="formRef" :key="editingKit?.$id || 'new'" :initialValues="initialValues"
        :resolver="resolver" @submit="handleSubmit" class="flex flex-col gap-4">
        <!-- Linha 1: Nome do Kit -->
        <FormField name="name" v-slot="$field">
          <FloatLabel variant="in">
            <InputText id="kit_name" v-model="$field.value" fluid :invalid="$field?.invalid" />
            <label for="kit_name">Nome do Kit / Combo *</label>
          </FloatLabel>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- Linha 2: Código de Barras com Botão de Gerar Automático + Campanha -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField name="barcode" v-slot="$field">
            <InputGroup>
              <FloatLabel variant="in">
                <InputText id="kit_barcode" v-model="$field.value" fluid :invalid="$field?.invalid" />
                <label for="kit_barcode">Código de Barras / SKU *</label>
              </FloatLabel>
              <InputGroupAddon>
                <Button type="button" icon="ri-flashlight-line" severity="danger" variant="text" iconOnly
                  class="w-full h-full" @click="generateRandomBarcode($field)" />
              </InputGroupAddon>
            </InputGroup>
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
              {{ $field.error?.message }}
            </Message>
          </FormField>

          <FormField name="campaign_event" v-slot="$field">
            <FloatLabel variant="in">
              <Select id="kit_campaign_event" v-model="$field.value" :options="CAMPAIGN_EVENT_OPTIONS"
                option-label="label" option-value="value" fluid :invalid="$field?.invalid"
                @update:model-value="(val) => handleCampaignChange(val)">
                <template #option="{ option }">
                  <div class="flex items-center gap-2 py-1">
                    <i :class="option.icon" :style="{ color: option.color }" class="text-sm"></i>
                    <span>{{ option.label }}</span>
                  </div>
                </template>
                <template #value="{ value }">
                  <div v-if="value" class="flex items-center gap-2">
                    <i :class="getCampaignEvent(value).icon" :style="{ color: getCampaignEvent(value).color }"></i>
                    <span>{{ getCampaignEvent(value).label }}</span>
                  </div>
                  <span v-else class="text-slate-400 text-xs">Selecione o evento</span>
                </template>
              </Select>
              <label for="kit_campaign_event">Data Comemorativa / Campanha *</label>
            </FloatLabel>
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
              {{ $field.error?.message }}
            </Message>
          </FormField>
        </div>

        <!-- Linha 3: Data do Evento + Custo da Embalagem -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField name="event_date" v-slot="$field">
            <FloatLabel variant="in">
              <InputText id="kit_event_date" v-model="$field.value" fluid />
              <label for="kit_event_date">Data do Evento</label>
            </FloatLabel>
          </FormField>

          <FormField name="packaging_cost" v-slot="$field">
            <FloatLabel variant="in">
              <InputNumber id="kit_packaging_cost" v-model="$field.value" mode="currency" currency="BRL" locale="pt-BR"
                fluid @update:model-value="val => packagingCostNum = Number(val || 0)" />
              <label for="kit_packaging_cost">Custo da Embalagem / Sacola (R$)</label>
            </FloatLabel>
          </FormField>
        </div>

        <!-- Linha 4: Preço de Venda do Kit + Toggle Ativo -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <FormField name="selling_price" v-slot="$field">
            <FloatLabel variant="in">
              <InputNumber id="kit_selling_price" v-model="$field.value" mode="currency" currency="BRL" locale="pt-BR"
                fluid :invalid="$field?.invalid" @update:model-value="val => sellingPriceNum = Number(val || 0)" />
              <label for="kit_selling_price">Preço de Venda do Kit (R$) *</label>
            </FloatLabel>
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
              {{ $field.error?.message }}
            </Message>
          </FormField>

          <FormField name="is_active" v-slot="$field" class="flex items-center gap-3 pt-2">
            <ToggleSwitch id="kit_is_active" v-model="$field.value" />
            <label for="kit_is_active" class="text-xs font-bold text-slate-700 cursor-pointer">
              Kit Ativo
            </label>
          </FormField>
        </div>

        <!-- Linha 5: Descrição Opcional -->
        <FormField name="description" v-slot="$field">
          <FloatLabel variant="in">
            <Textarea id="kit_description" v-model="$field.value" rows="2" fluid auto-resize />
            <label for="kit_description">Descrição / Apresentação (Opcional)</label>
          </FloatLabel>
        </FormField>

        <!-- SEÇÃO: COMPOSIÇÃO DOS PRODUTOS (COMBO) -->
        <div class="kit-composition-card">
          <AppSectionHeader title="Produtos Componentes do Kit"
            subtitle="Produtos que terão baixa automática de estoque ao vender" icon="ri-gift-2-line"
            actions-class="w-full sm:w-auto">
            <template #actions>
              <Button type="button" label="Adicionar Produto" icon="ri-add-line" size="small" severity="primary"
                variant="outlined" @click="addEmptyItem" />
            </template>
          </AppSectionHeader>

          <!-- Estado Vazio usando AppEmptyState -->
          <AppEmptyState v-if="itemsList.length === 0" icon="ri-archive-line" title="Nenhum produto adicionado ao kit"
            description="Clique em 'Adicionar Produto' acima para compor este kit promocional." />

          <!-- Lista de Produtos com InputGroup Perfeito -->
          <div v-else class="flex flex-col gap-2.5">
            <div v-for="(item, index) in itemsList" :key="index" class="flex flex-col sm:flex-row gap-2">

              <!-- 1. Select do Produto -->
              <InputGroup>
                <Select v-model="item.product" :options="productStore.products" option-label="name" data-key="$id"
                  :filter="true" filter-placeholder="Buscar produto..." size="small"
                  @change="(e) => onProductSelect(index, e.value)">
                  <template #value="{ value, placeholder }">
                    <div class="flex items-center gap-2 h-full">
                      <span v-if="value">{{ value.name }}</span>
                      <span v-else>{{ placeholder }}</span>
                    </div>
                  </template>
                  <template #option="{ option }">
                    <div class="flex items-center justify-between w-full py-1 text-xs">
                      <div class="flex flex-col">
                        <span class="font-bold text-slate-800">{{ option.name }}</span>
                        <span class="text-slate-400 font-mono text-[0.68rem]">{{ option.barcode }} • Estoque: {{
                          option.stock_quantity }} un</span>
                      </div>
                      <span class="font-bold text-pink-600 ml-2 whitespace-nowrap">{{
                        formatCurrency(option.selling_price)
                      }}</span>
                    </div>
                  </template>
                </Select>
                <InputGroupAddon class="text-sm font-semibold">
                  {{ formatCurrency(toNumber(item.product?.selling_price) * (Number(item.quantity) || 1)) }}
                </InputGroupAddon>
              </InputGroup>

              <InputGroup class="w-full md:w-80">
                <InputGroupAddon class="text-sm font-semibold">
                  Qtd
                </InputGroupAddon>
                <InputNumber v-model="item.quantity" :min="1" size="small" showButtons />
                <InputGroupAddon>
                  <Button type="button" icon="ri-delete-bin-line" severity="danger" variant="text" iconOnly size="small"
                    class="w-full h-full" @click="removeItem(index)" />
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>
        </div>

        <!-- RESUMO FINANCEIRO E MARGEM DO COMBO (ESTILO BOUTIQUE) -->
        <div class="kit-summary-card">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div class="summary-tile">
              <span class="summary-tile-label">Soma Avulsa</span>
              <strong class="summary-tile-val text-slate-700">{{ formatCurrency(sumProductsSelling) }}</strong>
            </div>

            <div class="summary-tile">
              <span class="summary-tile-label">Custo Total + Emb.</span>
              <strong class="summary-tile-val text-slate-700">{{ formatCurrency(totalCost) }}</strong>
            </div>

            <div class="summary-tile is-highlight">
              <span class="summary-tile-label text-pink-600">Preço do Kit</span>
              <strong class="summary-tile-val text-pink-600 text-base">{{ formatCurrency(sellingPriceNum) }}</strong>
            </div>

            <div class="summary-tile">
              <span class="summary-tile-label">Desconto Combo</span>
              <div class="mt-0.5">
                <span class="text-[0.7rem] font-bold px-2! py-0.5! rounded-md inline-block"
                  :class="discountPercent > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'">
                  {{ discountPercent.toFixed(0) }}% OFF
                </span>
              </div>
            </div>
          </div>

          <!-- Indicador de Economia / Lucro -->
          <div v-if="sellingPriceNum > 0 && customerSavings > 0"
            class="flex items-center justify-between pt-2.5! border-t border-dashed border-pink-200/80 text-xs">
            <span class="text-slate-500 font-medium">
              Economia direta para a cliente:
            </span>
            <strong class="text-emerald-700 font-bold">
              {{ formatCurrency(customerSavings) }}
            </strong>
          </div>
        </div>
      </Form>
    </Fluid>

    <!-- Rodapé Padrão do Modal (AppDialog #footer) -->
    <template #footer>
      <div class="flex items-center justify-end gap-2.5 w-full">
        <Button type="button" label="Fechar" icon="ri-close-line" severity="secondary" variant="text" size="small"
          class="rounded-md" @click="emit('update:visible', false)" />
        <Button type="button" :label="editingKit ? 'Atualizar Kit' : 'Salvar Kit'" icon="ri-check-line"
          severity="primary" size="small" class="rounded-md" :loading="isSaving" @click="triggerFormSubmit" />
      </div>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AppDialog from '@/components/common/AppDialog.vue'
import AppSectionHeader from '@/components/common/AppSectionHeader.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import FloatLabel from 'primevue/floatlabel'
import Message from 'primevue/message'
import Fluid from 'primevue/fluid'

import { Form, FormField, type FormSubmitEvent } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { kitSchema, type KitFormData } from '@/schemas/kitSchema'

import type { IKit, IKitItem } from '@/types/kit'
import { CAMPAIGN_EVENT_OPTIONS, getCampaignEvent } from '@/types/kit'
import type { IProduct } from '@/types/product'
import { useProductStore } from '@/stores/productStore'
import { useKitStore } from '@/stores/kitStore'
import { formatCurrency, toNumber, toDecimalString } from '@/utils/currency'
import { useToast } from 'primevue/usetoast'
import { parseErrorMessage } from '@/types/errors'

interface Props {
  visible: boolean
  editingKit?: IKit | null
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  editingKit: null
})

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'saved'): void
}>()

const productStore = useProductStore()
const kitStore = useKitStore()
const toast = useToast()

const isSaving = ref<boolean>(false)
const formRef = ref()
const resolver = zodResolver(kitSchema)

const packagingCostNum = ref<number>(0)
const sellingPriceNum = ref<number>(0)

const itemsList = ref<Array<{ product: IProduct; quantity: number }>>([])

const initialValues = computed<KitFormData>(() => {
  if (props.editingKit) {
    return {
      name: props.editingKit.name || '',
      barcode: props.editingKit.barcode || '',
      campaign_event: props.editingKit.campaign_event || 'custom',
      event_date: props.editingKit.event_date || '',
      packaging_cost: toNumber(props.editingKit.packaging_cost),
      selling_price: toNumber(props.editingKit.selling_price),
      description: props.editingKit.description || '',
      is_active: props.editingKit.is_active ?? true
    }
  }
  return {
    name: '',
    barcode: '',
    campaign_event: 'mothers_day',
    event_date: '10/05',
    packaging_cost: 0,
    selling_price: 0,
    description: '',
    is_active: true
  }
})

function loadItemsFromKit(kit?: IKit): void {
  if (!kit?.items?.length) {
    itemsList.value = []
    return
  }

  packagingCostNum.value = toNumber(kit.packaging_cost)
  sellingPriceNum.value = toNumber(kit.selling_price)

  itemsList.value = kit.items.map((item) => ({
    product: item.product,
    quantity: Number(item.quantity) || 1
  }))
}

watch(
  () => [props.visible, props.editingKit],
  ([newVisible, newKit]) => {
    if (newVisible) {
      if (newKit) {
        loadItemsFromKit(newKit as IKit)
      } else {
        packagingCostNum.value = 0
        sellingPriceNum.value = 0
        itemsList.value = []
        generateInternalBarcode()
      }
    }
  },
  { immediate: true }
)

function generateRandomBarcode(field?: { value: string; invalid?: boolean; error?: any }): void {
  const randomSuffix = Math.floor(10000000 + Math.random() * 90000000)
  const code = `KIT${randomSuffix}`
  if (formRef.value?.setFieldValue) {
    formRef.value.setFieldValue('barcode', code)
  }
  if (field) {
    field.value = code
    field.invalid = false
    field.error = undefined
  }
  if (formRef.value?.validate) {
    formRef.value.validate('barcode')
  }
}

function generateInternalBarcode(): void {
  // Inicialização se necessário
}

function handleCampaignChange(val: string): void {
  const meta = getCampaignEvent(val)
  if (meta?.defaultDate && formRef.value?.setFieldValue) {
    formRef.value.setFieldValue('event_date', meta.defaultDate)
  }
}

function addEmptyItem(): void {
  const firstProd = productStore.products[0]
  if (firstProd) {
    itemsList.value.push({ product: firstProd, quantity: 1 })
  }
}

function removeItem(index: number): void {
  itemsList.value.splice(index, 1)
}

function onProductSelect(index: number, prod: IProduct): void {
  if (itemsList.value[index]) {
    itemsList.value[index].product = prod
  }
}

// CÁLCULOS DO RESUMO
const sumProductsCost = computed<number>(() => {
  return itemsList.value.reduce((acc, item) => {
    const cost = toNumber(item.product?.cost_price)
    return acc + cost * (Number(item.quantity) || 1)
  }, 0)
})

const sumProductsSelling = computed<number>(() => {
  return itemsList.value.reduce((acc, item) => {
    const price = toNumber(item.product?.selling_price)
    return acc + price * (Number(item.quantity) || 1)
  }, 0)
})

const totalCost = computed<number>(() => {
  return sumProductsCost.value + packagingCostNum.value
})

const customerSavings = computed<number>(() => {
  if (sellingPriceNum.value <= 0 || sumProductsSelling.value <= 0) return 0
  return Math.max(0, (sumProductsSelling.value + packagingCostNum.value) - sellingPriceNum.value)
})

const discountPercent = computed<number>(() => {
  const fullSum = sumProductsSelling.value + packagingCostNum.value
  if (fullSum <= 0 || sellingPriceNum.value <= 0) return 0
  const diff = fullSum - sellingPriceNum.value
  if (diff <= 0) return 0
  return (diff / fullSum) * 100
})

async function handleSubmit(event: FormSubmitEvent): Promise<void> {
  if (!event.valid) {
    toast.add({ severity: 'warn', summary: 'Dados Incompletos', detail: 'Verifique os campos obrigatórios.', life: 3000 })
    return
  }

  if (itemsList.value.length === 0 || itemsList.value.some((i) => !i.product?.$id)) {
    toast.add({ severity: 'warn', summary: 'Itens Obrigatórios', detail: 'Adicione ao menos 1 produto válido ao kit.', life: 3000 })
    return
  }

  isSaving.value = true
  try {
    const values = event.values as KitFormData

    const payload = {
      $id: props.editingKit?.$id,
      name: values.name.trim(),
      barcode: values.barcode.trim(),
      campaign_event: values.campaign_event,
      event_date: values.event_date?.trim() || null,
      packaging_cost: toDecimalString(packagingCostNum.value),
      selling_price: toDecimalString(sellingPriceNum.value),
      description: values.description?.trim() || null,
      is_active: values.is_active,
      items: itemsList.value as unknown as IKitItem[]
    }

    await kitStore.saveKit(payload)

    toast.add({
      severity: 'success',
      summary: props.editingKit ? 'Kit Atualizado' : 'Kit Cadastrado',
      detail: `O kit "${payload.name}" foi salvo com sucesso.`,
      life: 3000
    })

    emit('saved')
    emit('update:visible', false)
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

function triggerFormSubmit(): void {
  const formEl = document.getElementById('kit-form-element') as HTMLFormElement | null
  if (formEl) {
    formEl.requestSubmit()
  } else {
    formRef.value?.submit()
  }
}
</script>

<style scoped>
.kit-composition-card {
  background: #fafafa;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.kit-composition-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.kit-empty-box {
  padding: 1.5rem 1rem;
  text-align: center;
  background: #ffffff;
  border: 1px dashed var(--border-color);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.kit-summary-card {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: var(--shadow-xs);
}

.summary-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.65rem 0.5rem;
  background: #fafafa;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  text-align: center;
}

.summary-tile.is-highlight {
  background: #fdf2f8;
  border-color: #fbcfe8;
}

.summary-tile-label {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.summary-tile-val {
  font-family: var(--font-title);
  font-size: 0.95rem;
  font-weight: 800;
  margin-top: 0.15rem;
}
</style>
