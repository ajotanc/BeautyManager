<template>
  <AppDialog :visible="visible" :title="isEditing ? 'Editar Cliente' : 'Novo Cliente'"
    :subtitle="isEditing ? 'Atualize os dados e preferências do cliente' : 'Cadastre as informações e data de aniversário'"
    icon="ri-user-heart-line" width="620px" :contentStyle="{ maxHeight: '80vh', overflowY: 'auto', padding: '1.25rem' }"
    @update:visible="(val) => emit('update:visible', val)">
    <Fluid v-if="visible">
      <Form id="customer-form-element" ref="formRef" :key="props.customerToEdit?.$id || 'new'"
        :initialValues="initialValues" :resolver="resolver" @submit="handleSubmit" class="flex flex-col gap-4">
        <!-- Linha 1: Nome Completo -->
        <FormField name="name" v-slot="$field" class="flex flex-col gap-1">
          <FloatLabel variant="in">
            <InputText id="cust_name" v-model="$field.value" fluid :invalid="$field?.invalid" />
            <label for="cust_name">Nome Completo *</label>
          </FloatLabel>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- Linha 2: WhatsApp e Data de Aniversário -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField name="phone" v-slot="$field" class="flex flex-col gap-1">
            <FloatLabel variant="in">
              <InputMask id="cust_phone" v-model="$field.value" mask="(99) 99999-9999" fluid
                :invalid="$field?.invalid" />
              <label for="cust_phone">WhatsApp *</label>
            </FloatLabel>
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
              {{ $field.error?.message }}
            </Message>
          </FormField>

          <FormField name="birth_date" v-slot="$field" class="flex flex-col gap-1">
            <FloatLabel variant="in">
              <DatePicker id="cust_birth" v-model="$field.value" dateFormat="dd/mm/yy" fluid show-icon
                :invalid="$field?.invalid" />
              <label for="cust_birth">Data de Aniversário</label>
            </FloatLabel>
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
              {{ $field.error?.message }}
            </Message>
          </FormField>
        </div>

        <!-- Linha 3: CPF e E-mail -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField name="document_number" v-slot="$field" class="flex flex-col gap-1">
            <FloatLabel variant="in">
              <InputMask id="cust_doc" v-model="$field.value" mask="999.999.999-99" fluid :invalid="$field?.invalid" />
              <label for="cust_doc">CPF (Opcional)</label>
            </FloatLabel>
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
              {{ $field.error?.message }}
            </Message>
          </FormField>

          <FormField name="email" v-slot="$field" class="flex flex-col gap-1">
            <FloatLabel variant="in">
              <InputText id="cust_email" v-model="$field.value" type="email" fluid :invalid="$field?.invalid" />
              <label for="cust_email">E-mail (Opcional)</label>
            </FloatLabel>
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
              {{ $field.error?.message }}
            </Message>
          </FormField>
        </div>

        <!-- Linha 4: Observações e Preferências -->
        <FormField name="notes" v-slot="$field" class="flex flex-col gap-1">
          <FloatLabel variant="in">
            <Textarea id="cust_notes" v-model="$field.value" rows="3" autoResize fluid />
            <label for="cust_notes">Observações / Preferências</label>
          </FloatLabel>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error?.message }}
          </Message>
        </FormField>
      </Form>
    </Fluid>

    <!-- Footer Fixo do Diálogo -->
    <template #footer>
      <div class="flex items-center justify-end gap-2.5 w-full">
        <Button label="Fechar" icon="ri-close-line" severity="secondary" variant="text" size="small"
          @click="emit('update:visible', false)" />
        <Button type="button" :label="isEditing ? 'Salvar Alterações' : 'Cadastrar Cliente'" icon="ri-check-line"
          severity="primary" size="small" :loading="isSubmitting" @click="triggerFormSubmit" />
      </div>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AppDialog from '@/components/common/AppDialog.vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputMask from 'primevue/inputmask'
import DatePicker from 'primevue/datepicker'
import Textarea from 'primevue/textarea'
import FloatLabel from 'primevue/floatlabel'
import Message from 'primevue/message'
import Fluid from 'primevue/fluid'
import { Form, FormField, type FormSubmitEvent } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { customerSchema, type CustomerFormData } from '@/schemas/customerSchema'
import type { ICustomer } from '@/types/customer'
import { useCustomerStore } from '@/stores/customerStore'
import { useToast } from 'primevue/usetoast'
import { parseErrorMessage } from '@/types/errors'
import { dayjs } from '@/utils/date'

interface Props {
  visible: boolean
  customerToEdit?: ICustomer | null
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  customerToEdit: null
})

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'saved', customer: ICustomer): void
}>()

const customerStore = useCustomerStore()
const toast = useToast()
const isSubmitting = ref<boolean>(false)
const resolver = ref(zodResolver(customerSchema))

const isEditing = computed(() => !!props.customerToEdit?.$id)

const initialValues = computed<CustomerFormData>(() => {
  let birthDateVal: Date | string | null = null
  if (props.customerToEdit?.birth_date) {
    const raw = props.customerToEdit.birth_date
    const parsed = dayjs(raw, ['YYYY-MM-DD', 'DD/MM/YYYY', 'DD/MM'])
    birthDateVal = parsed.isValid() ? parsed.toDate() : null
  }

  return {
    name: props.customerToEdit?.name || '',
    phone: props.customerToEdit?.phone || '',
    email: props.customerToEdit?.email || '',
    document_number: props.customerToEdit?.document_number || '',
    birth_date: birthDateVal,
    notes: props.customerToEdit?.notes || ''
  }
})

function triggerFormSubmit(): void {
  const formElement = document.getElementById('customer-form-element') as HTMLFormElement | null
  if (formElement) {
    formElement.requestSubmit()
  }
}

async function handleSubmit(event: FormSubmitEvent): Promise<void> {
  if (!event.valid) {
    toast.add({
      severity: 'warn',
      summary: 'Campos Obrigatórios',
      detail: 'Por favor, revise os campos destacados no formulário.',
      life: 3000
    })
    return
  }

  const data = event.values as CustomerFormData

  let formattedBirthDate: string | null = null
  if (data.birth_date) {
    if (data.birth_date instanceof Date) {
      formattedBirthDate = dayjs(data.birth_date).format('DD/MM/YYYY')
    } else if (typeof data.birth_date === 'string' && data.birth_date.trim()) {
      formattedBirthDate = data.birth_date.trim()
    }
  }

  isSubmitting.value = true
  try {
    const savedCustomer = await customerStore.saveCustomer({
      $id: props.customerToEdit?.$id,
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      document_number: data.document_number || null,
      birth_date: formattedBirthDate,
      notes: data.notes || null,
      total_purchases: props.customerToEdit?.total_purchases || 0
    })

    toast.add({
      severity: 'success',
      summary: isEditing.value ? 'Cliente Atualizado' : 'Cliente Cadastrado',
      detail: `${savedCustomer.name} foi salvo com sucesso.`,
      life: 3000
    })

    emit('saved', savedCustomer)
    emit('update:visible', false)
  } catch (error: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Erro ao salvar cliente',
      detail: parseErrorMessage(error),
      life: 3000
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>
