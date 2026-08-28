<template>
  <AppDialog :visible="visible" title="Fechamento de Caixa Diário"
    subtitle="Confira as movimentações e realize o balanço final da gaveta" icon="ri-lock-line" width="520px"
    @update:visible="(val) => emit('update:visible', val)">
    <Fluid>
      <form id="close-register-form" @submit.prevent="handleClose" class="flex flex-col gap-4">
        <div v-if="cashRegisterStore.currentRegister" class="register-summary-box">
          <div class="summary-line">
            <span>Saldo Inicial (Abertura):</span>
            <strong>{{ formatCurrency(cashRegisterStore.currentRegister.opening_balance) }}</strong>
          </div>
          <div class="summary-line">
            <span>Total Entradas (+ Vendas em Dinheiro):</span>
            <strong class="text-emerald-600">+ {{ formatCurrency(cashRegisterStore.currentRegister.total_in) }}</strong>
          </div>
          <div class="summary-line">
            <span>Total Saídas (- Sangrias):</span>
            <strong class="text-rose-600">- {{ formatCurrency(cashRegisterStore.currentRegister.total_out) }}</strong>
          </div>
          <div class="divider"></div>
          <div class="summary-line highlight-expected">
            <span>Saldo Esperado em Gaveta:</span>
            <strong class="expected-val">{{ formatCurrency(cashRegisterStore.currentExpectedBalance) }}</strong>
          </div>
        </div>

        <div class="field-item">
          <FloatLabel variant="in">
            <InputNumber id="closing_balance" v-model="closingBalance" mode="currency" currency="BRL" locale="pt-BR"
              size="small" fluid class="font-bold" :min="0" :invalid="!!errors.closing_balance" required />
            <label for="closing_balance">Valor Real Contado na Gaveta (R$) *</label>
          </FloatLabel>
          <Message v-if="errors.closing_balance" severity="error" size="small" variant="simple">
            {{ errors.closing_balance }}
          </Message>
        </div>

        <div v-if="closingBalance !== null" class="diff-box" :class="diffClass">
          <span>Diferença (Real - Esperado):</span>
          <strong>{{ formatCurrency(difference) }}</strong>
        </div>

        <div class="field-item">
          <FloatLabel variant="in">
            <Textarea id="close_notes" v-model="notes" rows="2" size="small" fluid />
            <label for="close_notes">Observações Finais do Turno</label>
          </FloatLabel>
        </div>
      </form>
    </Fluid>

    <!-- Footer do Diálogo -->
    <template #footer>
      <div class="flex items-center justify-end gap-2.5 w-full">
        <Button label="Fechar" icon="ri-close-line" severity="secondary" variant="text" size="small"
          @click="emit('update:visible', false)" />
        <Button type="button" label="Fechar Caixa" icon="ri-lock-line" severity="danger" size="small"
          :loading="isSubmitting" @click="triggerSubmit" />
      </div>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import AppDialog from '@/components/common/AppDialog.vue'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import FloatLabel from 'primevue/floatlabel'
import Message from 'primevue/message'
import Fluid from 'primevue/fluid'
import { useCashRegisterStore } from '@/stores/cashRegisterStore'
import { formatCurrency } from '@/utils/currency'
import { useToast } from 'primevue/usetoast'
import { parseErrorMessage } from '@/types/errors'
import { z } from 'zod'

const closeRegisterSchema = z.object({
  closing_balance: z.number().min(0, 'Informe o valor conferido na gaveta'),
  notes: z.string().optional()
})

interface Props {
  visible: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'closed'): void
}>()

const cashRegisterStore = useCashRegisterStore()
const toast = useToast()

const closingBalance = ref<number | null>(null)
const notes = ref<string>('')
const isSubmitting = ref<boolean>(false)
const errors = reactive<Record<string, string>>({})

const expected = computed<number>(() => cashRegisterStore.currentExpectedBalance)

const difference = computed<number>(() => {
  if (closingBalance.value === null) return 0
  return Number((closingBalance.value - expected.value).toFixed(2))
})

const diffClass = computed<string>(() => {
  if (difference.value === 0) return 'diff-ok'
  if (difference.value > 0) return 'diff-surplus'
  return 'diff-shortage'
})

function clearErrors(): void {
  Object.keys(errors).forEach((key) => delete errors[key])
}

function triggerSubmit(): void {
  const form = document.getElementById('close-register-form') as HTMLFormElement | null
  if (form) {
    form.requestSubmit()
  }
}

async function handleClose(): Promise<void> {
  clearErrors()

  const validation = closeRegisterSchema.safeParse({
    closing_balance: closingBalance.value ?? -1,
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
    await cashRegisterStore.closeRegister({
      closing_balance: validation.data.closing_balance,
      notes: validation.data.notes?.trim() || null
    })

    toast.add({
      severity: 'success',
      summary: 'Caixa Fechado!',
      detail: `Fechamento concluído com saldo de ${formatCurrency(validation.data.closing_balance)}.`,
      life: 3500
    })
    emit('closed')
    emit('update:visible', false)
  } catch (error: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Erro ao fechar caixa',
      detail: parseErrorMessage(error),
      life: 4000
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.close-register-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 0.5rem 0;
}

.register-summary-box {
  background: var(--p-brand-50);
  border: 1px solid var(--border-color);
  padding: 1.15rem;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.divider {
  height: 1px;
  background: var(--border-subtle);
  margin: 0.25rem 0;
}

.highlight-expected {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.expected-val {
  color: var(--p-brand-600);
  font-size: 1.15rem;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.diff-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  font-weight: 700;
  font-size: 0.9rem;
}

.diff-ok {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.diff-surplus {
  background: #eff6ff;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.diff-shortage {
  background: #fff1f2;
  color: #9f1239;
  border: 1px solid #fecdd3;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}
</style>
