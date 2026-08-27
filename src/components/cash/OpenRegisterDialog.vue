<template>
  <AppDialog
    :visible="visible"
    title="Abertura de Caixa Diário"
    subtitle="Informe o valor em dinheiro presente na gaveta para iniciar as operações do dia"
    icon="ri-lock-unlock-line"
    width="480px"
    @update:visible="(val) => emit('update:visible', val)"
  >
    <Fluid>
      <form id="open-register-form" @submit.prevent="handleOpen" class="flex flex-col gap-4">
        <div class="field-item">
          <FloatLabel variant="in">
            <InputNumber
              id="opening_balance"
              v-model="openingBalance"
              mode="currency"
              currency="BRL"
              locale="pt-BR"
              size="small"
              fluid
              class="font-bold"
              :min="0"
              :invalid="!!errors.opening_balance"
              autofocus
              required
            />
            <label for="opening_balance">Fundo de Troco / Saldo Inicial (R$) *</label>
          </FloatLabel>
          <Message v-if="errors.opening_balance" severity="error" size="small" variant="simple">
            {{ errors.opening_balance }}
          </Message>
        </div>

        <div class="field-item">
          <FloatLabel variant="in">
            <Textarea id="open_notes" v-model="notes" rows="2" size="small" fluid />
            <label for="open_notes">Observações (Opcional)</label>
          </FloatLabel>
        </div>
      </form>
    </Fluid>

    <!-- Footer do Diálogo -->
    <template #footer>
      <div class="flex items-center justify-end gap-2.5 w-full pt-2">
        <Button
          label="Cancelar"
          icon="ri-close-line"
          severity="secondary"
          variant="text"
          size="small"
          @click="emit('update:visible', false)"
        />
        <Button
          type="button"
          label="Abrir Caixa"
          icon="ri-check-line"
          severity="primary"
          size="small"
          :loading="isSubmitting"
          @click="triggerSubmit"
        />
      </div>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import AppDialog from '@/components/common/AppDialog.vue'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import FloatLabel from 'primevue/floatlabel'
import Message from 'primevue/message'
import Fluid from 'primevue/fluid'
import { useCashRegisterStore } from '@/stores/cashRegisterStore'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from 'primevue/usetoast'
import { parseErrorMessage } from '@/types/errors'
import { z } from 'zod'

const openRegisterSchema = z.object({
  opening_balance: z.number().min(0, 'O valor inicial deve ser maior ou igual a zero'),
  notes: z.string().optional()
})

interface Props {
  visible: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'opened'): void
}>()

const cashRegisterStore = useCashRegisterStore()
const authStore = useAuthStore()
const toast = useToast()

const openingBalance = ref<number>(100)
const notes = ref<string>('')
const isSubmitting = ref<boolean>(false)
const errors = reactive<Record<string, string>>({})

function clearErrors(): void {
  Object.keys(errors).forEach((key) => delete errors[key])
}

function triggerSubmit(): void {
  const form = document.getElementById('open-register-form') as HTMLFormElement | null
  if (form) {
    form.requestSubmit()
  }
}

async function handleOpen(): Promise<void> {
  clearErrors()

  const validation = openRegisterSchema.safeParse({
    opening_balance: openingBalance.value,
    notes: notes.value
  })

  if (!validation.success) {
    validation.error.issues.forEach((err) => {
      const field = String(err.path[0])
      if (field) {
        errors[field] = err.message
      }
    })
    return
  }

  isSubmitting.value = true
  try {
    await cashRegisterStore.openRegister({
      opening_balance: validation.data.opening_balance,
      user_id: authStore.currentUser?.$id || 'operador',
      notes: validation.data.notes?.trim() || null
    })
    toast.add({
      severity: 'success',
      summary: 'Caixa Aberto!',
      detail: 'O caixa está pronto para registrar vendas.',
      life: 3000
    })
    emit('opened')
    emit('update:visible', false)
  } catch (error: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Erro ao abrir caixa',
      detail: parseErrorMessage(error),
      life: 4000
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.open-register-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 0.5rem 0;
}

.intro-alert {
  background: var(--p-brand-50);
  border: 1px solid var(--border-color);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--text-primary);
  font-size: 0.85rem;
}

.intro-alert i {
  color: var(--p-brand-600);
  font-size: 1.1rem;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}
</style>
