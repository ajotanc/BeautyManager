<template>
  <Dialog
    :visible="visible"
    modal
    header="Movimentação de Caixa (Sangria / Suprimento)"
    :style="{ width: '500px' }"
    @update:visible="(val) => emit('update:visible', val)"
  >
    <form @submit.prevent="handleSubmit" class="movement-form">
      <div class="field-item">
        <label class="field-label">Tipo de Movimentação *</label>
        <div class="type-grid">
          <button
            type="button"
            class="type-btn out-type"
            :class="{ 'is-active': movementType === 'OUT' }"
            @click="movementType = 'OUT'"
          >
            <i class="ri-indeterminate-circle-line"></i>
            <span>Sangria (Retirada)</span>
          </button>
          <button
            type="button"
            class="type-btn in-type"
            :class="{ 'is-active': movementType === 'IN' }"
            @click="movementType = 'IN'"
          >
            <i class="ri-add-circle-line"></i>
            <span>Suprimento (Entrada)</span>
          </button>
        </div>
      </div>

      <div class="field-item">
        <label class="field-label">Valor (R$) *</label>
        <InputNumber
          v-model="amount"
          mode="currency"
          currency="BRL"
          locale="pt-BR"
          class="w-full text-lg font-bold"
          :min="0.01"
          required
        />
      </div>

      <div class="field-item">
        <label class="field-label">Motivo / Justificativa *</label>
        <InputText
          v-model="reason"
          placeholder="Ex: Pagamento Fornecedor de Laços, Troco Adicional..."
          class="w-full"
          required
        />
      </div>

      <div class="form-actions">
        <Button
          label="Cancelar"
          icon="ri-close-line"
          severity="secondary"
          variant="text"
          @click="emit('update:visible', false)"
        />
        <Button
          type="submit"
          label="Confirmar Movimentação"
          icon="ri-check-line"
          severity="primary"
          :loading="isSubmitting"
        />
      </div>
    </form>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import { useCashRegisterStore } from '@/stores/cashRegisterStore'
import { useToast } from 'primevue/usetoast'
import { parseErrorMessage } from '@/types/errors'
import { formatCurrency } from '@/utils/currency'

interface Props {
  visible: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'completed'): void
}>()

const cashRegisterStore = useCashRegisterStore()
const toast = useToast()

const movementType = ref<'IN' | 'OUT'>('OUT')
const amount = ref<number>(50)
const reason = ref<string>('')
const isSubmitting = ref<boolean>(false)

async function handleSubmit(): Promise<void> {
  const justification = reason.value.trim()
  if (!justification || !amount.value) return

  isSubmitting.value = true
  try {
    await cashRegisterStore.recordMovement({
      type: movementType.value,
      amount: amount.value,
      reason: justification
    })
    toast.add({
      severity: 'success',
      summary: movementType.value === 'OUT' ? 'Sangria Realizada' : 'Suprimento Registrado',
      detail: `${formatCurrency(amount.value)} - ${justification}`,
      life: 3000
    })
    reason.value = ''
    emit('completed')
    emit('update:visible', false)
  } catch (error: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Erro na movimentação',
      detail: parseErrorMessage(error),
      life: 4000
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.movement-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary);
}

.type-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.type-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: white;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.out-type.is-active {
  background: #fff1f2;
  border-color: #f43f5e;
  color: #9f1239;
}

.in-type.is-active {
  background: #ecfdf5;
  border-color: #10b981;
  color: #065f46;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-color);
}
</style>
