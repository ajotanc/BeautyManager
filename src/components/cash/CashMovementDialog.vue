<template>
  <AppDialog
    :visible="visible"
    title="Movimentação de Caixa"
    subtitle="Registre sangrias (retiradas) ou suprimentos (entradas) de dinheiro"
    icon="ri-exchange-dollar-line"
    width="500px"
    @update:visible="(val) => emit('update:visible', val)"
  >
    <Fluid>
      <form id="cash-movement-form" @submit.prevent="handleSubmit" class="flex flex-col gap-4">
        <!-- Tipo de Movimentação -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-bold text-(--text-secondary) uppercase tracking-wider">Tipo de Movimentação *</label>
          <div class="grid grid-cols-2 gap-3">
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

        <!-- Valor -->
        <div class="flex flex-col gap-1">
          <FloatLabel variant="in">
            <InputNumber
              id="movement_amount"
              v-model="amount"
              mode="currency"
              currency="BRL"
              locale="pt-BR"
              fluid
              class="w-full text-lg font-bold"
              :min="0.01"
              required
            />
            <label for="movement_amount">Valor (R$) *</label>
          </FloatLabel>
        </div>

        <!-- Motivo / Justificativa -->
        <div class="flex flex-col gap-1">
          <FloatLabel variant="in">
            <InputText
              id="movement_reason"
              v-model="reason"
              fluid
              required
            />
            <label for="movement_reason">Motivo / Justificativa *</label>
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
          label="Confirmar Movimentação"
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
import { ref } from 'vue'
import AppDialog from '@/components/common/AppDialog.vue'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import FloatLabel from 'primevue/floatlabel'
import Fluid from 'primevue/fluid'
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

function triggerSubmit(): void {
  const form = document.getElementById('cash-movement-form') as HTMLFormElement | null
  if (form) {
    form.requestSubmit()
  }
}

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
.type-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: var(--radius-md, 10px);
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
</style>

