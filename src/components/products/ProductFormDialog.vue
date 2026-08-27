<template>
  <AppDialog :visible="visible" :title="isEditing ? 'Editar Produto' : 'Novo Produto'" :subtitle="isEditing
    ? 'Atualize as informações, preços e estoque do item'
    : 'Cadastre preços (markup), estoque e especificações'
    " icon="ri-box-3-line" width="680px" :contentStyle="{
      maxHeight: '80vh',
      overflowY: 'auto',
      padding: '1.25rem'
    }" @update:visible="(val) => emit('update:visible', val)">
    <Fluid v-if="visible">
      <Form id="product-form-element" ref="formRef" :key="props.productToEdit?.$id || 'new'"
        :initialValues="initialValues" :resolver="resolver" @submit="handleSubmit" class="flex flex-col gap-4">
        <!-- Linha 1: Nome do Produto e Código de Barras -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField name="name" v-slot="$field" class="flex flex-col gap-1">
            <FloatLabel variant="in">
              <InputText id="prod_name" v-model="$field.value" fluid :invalid="$field?.invalid" />
              <label for="prod_name">Nome do Produto *</label>
            </FloatLabel>
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
              {{ $field.error?.message }}
            </Message>
          </FormField>

          <FormField name="barcode" v-slot="$field" class="flex flex-col gap-1">
            <InputGroup>
              <FloatLabel variant="in" class="flex-1">
                <InputText id="prod_barcode" v-model="$field.value" fluid :invalid="$field?.invalid" />
                <label for="prod_barcode">Cód. Barras *</label>
              </FloatLabel>
              <Button type="button" icon="ri-flashlight-line" severity="secondary" variant="outlined"
                title="Gerar código interno automático" @click="generateRandomBarcode($field)" />
            </InputGroup>
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
              {{ $field.error?.message }}
            </Message>
          </FormField>
        </div>

        <!-- Linha 2: Categoria e Marca -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField name="category" v-slot="$field" class="flex flex-col gap-1">
            <InputGroup>
              <FloatLabel variant="in" class="flex-1">
                <Select id="prod_category" v-model="$field.value" :options="productStore.categories" option-label="name"
                  fluid show-clear :invalid="$field?.invalid" />
                <label for="prod_category">Categoria</label>
              </FloatLabel>
              <Button type="button" icon="ri-add-line" severity="secondary" variant="outlined"
                title="Gerenciar Categorias" @click="emit('open-category-manage')" />
            </InputGroup>
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
              {{ $field.error?.message }}
            </Message>
          </FormField>

          <FormField name="brand" v-slot="$field" class="flex flex-col gap-1">
            <InputGroup>
              <FloatLabel variant="in" class="flex-1">
                <Select id="prod_brand" v-model="$field.value" :options="productStore.brands" option-label="name" fluid
                  show-clear :invalid="$field?.invalid" />
                <label for="prod_brand">Marca / Fabricante</label>
              </FloatLabel>
              <Button type="button" icon="ri-add-line" severity="secondary" variant="outlined" title="Gerenciar Marcas"
                @click="emit('open-brand-manage')" />
            </InputGroup>
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
              {{ $field.error?.message }}
            </Message>
          </FormField>
        </div>

        <!-- PRECIFICAÇÃO -->
        <div class="markup-card">
          <div class="markup-header">
            <span class="markup-header-title">
              <i class="ri-money-dollar-circle-line text-primary"></i>
              Precificação Inteligente (Markup)
            </span>
            <span class="markup-header-sub">
              Altere custo, margem ou preço final e o cálculo é sincronizado automaticamente
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="flex flex-col gap-1">
              <FloatLabel variant="in">
                <InputNumber id="prod_cost_price" v-model="costPrice" mode="currency" currency="BRL" locale="pt-BR"
                  fluid :invalid="pricingErrors.costPrice.invalid" @update:model-value="setCostPrice" show-clear
                  @blur="validatePricing" />
                <label for="prod_cost_price">Preço de Custo (R$) *</label>
              </FloatLabel>
              <Message v-if="pricingErrors.costPrice.invalid" severity="error" size="small" variant="simple">
                {{ pricingErrors.costPrice.message }}
              </Message>
            </div>

            <div class="flex flex-col gap-1">
              <FloatLabel variant="in">
                <InputNumber id="prod_profit_margin" v-model="profitMargin" suffix="%" locale="pt-BR" fluid
                  :max-fraction-digits="2" :invalid="pricingErrors.profitMargin.invalid"
                  @update:model-value="setProfitMargin" show-clear @blur="validatePricing" />
                <label for="prod_profit_margin">Margem de Lucro (%) *</label>
              </FloatLabel>
              <Message v-if="pricingErrors.profitMargin.invalid" severity="error" size="small" variant="simple">
                {{ pricingErrors.profitMargin.message }}
              </Message>
            </div>

            <div class="flex flex-col gap-1">
              <FloatLabel variant="in">
                <InputNumber id="prod_selling_price" v-model="sellingPrice" mode="currency" currency="BRL"
                  locale="pt-BR" fluid :invalid="pricingErrors.sellingPrice.invalid"
                  @update:model-value="setSellingPrice" show-clear @blur="validatePricing" />
                <label for="prod_selling_price">Preço de Venda (R$) *</label>
              </FloatLabel>
              <Message v-if="pricingErrors.sellingPrice.invalid" severity="error" size="small" variant="simple">
                {{ pricingErrors.sellingPrice.message }}
              </Message>
            </div>
          </div>

          <div class="markup-profit-row">
            <span class="font-medium text-surface-600 dark:text-surface-400">
              Lucro Bruto Estimado por Unidade:
            </span>
            <strong class="text-emerald-600 text-base font-bold">
              {{ formatCurrency(profitAmount) }}
            </strong>
          </div>
        </div>

        <!-- Linha 3: Estoque Inicial, Alerta Mínimo e Validade -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField name="stock_quantity" v-slot="$field" class="flex flex-col gap-1">
            <FloatLabel variant="in">
              <InputNumber id="prod_stock" v-model="$field.value" fluid :min="0" :invalid="$field?.invalid" />
              <label for="prod_stock">Estoque Inicial *</label>
            </FloatLabel>
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
              {{ $field.error?.message }}
            </Message>
          </FormField>

          <FormField name="min_stock_alert" v-slot="$field" class="flex flex-col gap-1">
            <FloatLabel variant="in">
              <InputNumber id="prod_min_alert" v-model="$field.value" fluid :min="1" :invalid="$field?.invalid" />
              <label for="prod_min_alert">Alerta Mínimo *</label>
            </FloatLabel>
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
              {{ $field.error?.message }}
            </Message>
          </FormField>

          <FormField name="expiry_date" v-slot="$field" class="flex flex-col gap-1">
            <FloatLabel variant="in">
              <DatePicker id="prod_expiry" v-model="$field.value" dateFormat="dd/mm/yy" fluid show-icon
                :invalid="$field?.invalid" />
              <label for="prod_expiry">Data de Validade</label>
            </FloatLabel>
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
              {{ $field.error?.message }}
            </Message>
          </FormField>
        </div>

        <!-- Venda rápida -->
        <FormField name="is_quick_sale" v-slot="$field" class="quick-sale-card">
          <Checkbox v-model="$field.value" :binary="true" input-id="quick-sale-check" />
          <label for="quick-sale-check" class="quick-sale-label">
            Exibir na grade de "Venda Rápida"
            (ex: sacolas de presente, laços, itens sem código de barras)
          </label>
        </FormField>
      </Form>
    </Fluid>

    <template #footer>
      <div class="flex items-center justify-end gap-2.5 w-full pt-2">
        <Button label="Cancelar" icon="ri-close-line" severity="secondary" variant="text"
          @click="emit('update:visible', false)" />
        <Button type="button" :label="isEditing ? 'Atualizar Produto' : 'Salvar Produto'" icon="ri-check-line"
          severity="primary" :loading="isSubmitting" @click="triggerFormSubmit" />
      </div>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

import AppDialog from '@/components/common/AppDialog.vue'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Checkbox from 'primevue/checkbox'
import InputGroup from 'primevue/inputgroup'
import FloatLabel from 'primevue/floatlabel'
import Message from 'primevue/message'
import Fluid from 'primevue/fluid'

import {
  Form,
  FormField,
  type FormSubmitEvent
} from '@primevue/forms'

import { zodResolver } from '@primevue/forms/resolvers/zod'

import { productSchema } from '@/schemas/productSchema'
import { useProductStore } from '@/stores/productStore'
import { useMarkupCalculator } from '@/composables/useMarkupCalculator'

import type { IProduct } from '@/types/product'

import {
  formatCurrency,
  toNumber,
  toDecimalString
} from '@/utils/currency'

import { useToast } from 'primevue/usetoast'
import { parseErrorMessage } from '@/types/errors'
import { dayjs } from '@/utils/date'

interface Props {
  visible: boolean
  productToEdit?: IProduct | null
}

interface IFormFieldSlot<T> {
  value: T
  invalid?: boolean
  error?: {
    message?: string
  }
}

const props = withDefaults(
  defineProps<Props>(),
  {
    productToEdit: null
  }
)

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'saved', product: IProduct): void
  (e: 'open-category-manage'): void
  (e: 'open-brand-manage'): void
}>()

const productStore = useProductStore()
const toast = useToast()

const isSubmitting = ref(false)
const formRef = ref()

const isEditing = computed(() => {
  return !!props.productToEdit?.$id
})

const resolver = zodResolver(productSchema)

const {
  costPrice,
  profitMargin,
  sellingPrice,
  profitAmount,
  errors: pricingErrors,
  setCostPrice,
  setProfitMargin,
  setSellingPrice,
  validate: validatePricing,
  reset: resetMarkup
} = useMarkupCalculator(null, null, null)

const initialValues = ref<IProduct>({
  barcode: '',
  name: '',
  category: null,
  brand: null,
  stock_quantity: 0,
  min_stock_alert: 5,
  expiry_date: null,
  is_quick_sale: false
} as IProduct)

watch(
  () => [props.productToEdit?.$id, props.visible],
  () => {
    if (!props.visible) {
      return
    }

    const prod = props.productToEdit

    if (prod?.$id) {
      const cost = toNumber(prod.cost_price)
      const margin = toNumber(prod.profit_margin)
      const sell = toNumber(prod.selling_price)

      resetMarkup(
        cost > 0 ? cost : null,
        margin >= 0 ? margin : null,
        sell > 0 ? sell : null
      )

      initialValues.value = {
        ...prod,
        category: prod.category || null,
        brand: prod.brand || null
      } as IProduct

    } else {
      resetMarkup(null, null, null)

      initialValues.value = {
        barcode: '',
        name: '',
        category: null,
        brand: null,
        stock_quantity: 0,
        min_stock_alert: 5,
        expiry_date: null,
        is_quick_sale: false
      } as IProduct

    }
  },
  {
    immediate: true
  }
)

function generateRandomBarcode(
  fieldState: IFormFieldSlot<string>
): void {
  const randomSuffix = Math.floor(
    10000000 + Math.random() * 90000000
  )

  const code = `789${randomSuffix}`

  if (formRef.value?.setFieldValue) {
    formRef.value.setFieldValue('barcode', code)
  }

  fieldState.value = code
  fieldState.invalid = false
  fieldState.error = undefined

  if (formRef.value?.validate) {
    formRef.value.validate('barcode')
  }
}

async function handleSubmit(
  event: FormSubmitEvent
): Promise<void> {
  const isPricingValid = validatePricing()

  if (!event.valid || !isPricingValid) {
    toast.add({
      severity: 'warn',
      summary: 'Campos Obrigatórios',
      detail: 'Por favor, revise os campos destacados no formulário.',
      life: 3000
    })
    return
  }

  isSubmitting.value = true

  try {
    const values = event.values as IProduct

    const payload: Partial<IProduct> = {
      $id: props.productToEdit?.$id,
      name: values.name.trim(),
      barcode: values.barcode.trim(),
      category: values.category || null,
      brand: values.brand || null,
      cost_price: toDecimalString(costPrice.value ?? 0),
      profit_margin: toDecimalString(profitMargin.value ?? 0),
      selling_price: toDecimalString(sellingPrice.value ?? 0),
      stock_quantity: Number(values.stock_quantity),
      min_stock_alert: Number(values.min_stock_alert),
      expiry_date: values.expiry_date ? dayjs(values.expiry_date).toISOString() : null,
      is_quick_sale: values.is_quick_sale
    }

    const result = await productStore.saveProduct(payload)

    toast.add({
      severity: 'success',
      summary: isEditing.value ? 'Produto Atualizado' : 'Produto Cadastrado',
      detail: result.name,
      life: 3000
    })

    emit('saved', result)
    emit('update:visible', false)

  } catch (error: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Erro ao salvar produto',
      detail: parseErrorMessage(error),
      life: 4000
    })
  } finally {
    isSubmitting.value = false
  }
}

function triggerFormSubmit(): void {
  const formEl = document.getElementById('product-form-element') as HTMLFormElement | null

  if (formEl) {
    formEl.requestSubmit()
  } else {
    formRef.value?.submit()
  }
}
</script>

<style scoped>
.markup-card {
  background: var(--p-surface-50);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.markup-header {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.markup-header-title {
  font-size: 0.88rem;
  font-weight: 800;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.markup-header-sub {
  font-size: 0.74rem;
  color: var(--text-muted);
}

.markup-profit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.75rem;
  border-top: 1px dashed var(--border-color);
  font-size: 0.84rem;
}

.quick-sale-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--p-surface-50);
  border: 1px solid var(--border-color);
  border-radius: 10px;
}

.quick-sale-label {
  font-size: 0.82rem;
  color: var(--text-secondary);
  font-weight: 500;
  cursor: pointer;
  line-height: 1.35;
}

:deep(.p-inputgroup > .p-button) {
  background: #ffffff !important;
  border: 1px solid var(--border-color) !important;
  border-left: none !important;
  color: var(--text-secondary) !important;
  min-width: 44px !important;
}

:deep(.p-inputgroup > .p-button:hover) {
  background: var(--p-surface-100) !important;
  color: var(--p-brand-600) !important;
}
</style>