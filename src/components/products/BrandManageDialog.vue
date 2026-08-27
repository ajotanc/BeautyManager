<template>
  <Dialog
    :visible="visible"
    modal
    header="Gerenciar Marcas & Fabricantes"
    :style="{ width: '480px', maxWidth: '95vw' }"
    :contentStyle="{ padding: '1.25rem' }"
    @update:visible="(val) => emit('update:visible', val)"
  >
    <Fluid>
      <div class="flex flex-col gap-4">
        <!-- Formulário de Criação -->
        <div class="flex flex-col gap-1">
          <InputGroup>
            <FloatLabel variant="in" class="flex-1">
              <InputText
                id="new_brand_name"
                v-model="newBrandName"
                fluid
                :invalid="!!errorMsg"
                @keyup.enter="handleAdd"
              />
              <label for="new_brand_name">Nome</label>
            </FloatLabel>
            <Button
              label="Adicionar"
              icon="ri-add-line"
              severity="primary"
              :loading="isAdding"
              @click="handleAdd"
            />
          </InputGroup>
          <Message v-if="errorMsg" severity="error" size="small" variant="simple">
            {{ errorMsg }}
          </Message>
        </div>

        <!-- Lista de Marcas -->
        <div class="list-container">
          <div v-if="productStore.brands.length === 0" class="empty-list">
            Nenhuma marca cadastrada.
          </div>
          <div
            v-for="brand in productStore.brands"
            :key="brand.$id"
            class="list-item-row"
          >
            <span class="item-title">{{ brand.name }}</span>
            <Button
              icon="ri-delete-bin-line"
              severity="danger"
              variant="text"
              rounded
              size="small"
              title="Excluir marca"
              @click="handleDelete(brand.$id, brand.name)"
            />
          </div>
        </div>
      </div>
    </Fluid>

    <template #footer>
      <div class="flex justify-end w-full pt-2">
        <Button
          label="Fechar"
          icon="ri-close-line"
          severity="secondary"
          variant="text"
          @click="emit('update:visible', false)"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputGroup from 'primevue/inputgroup'
import FloatLabel from 'primevue/floatlabel'
import Message from 'primevue/message'
import Fluid from 'primevue/fluid'
import { useProductStore } from '@/stores/productStore'
import { brands } from '@/services/brands'
import { useToast } from 'primevue/usetoast'
import { parseErrorMessage } from '@/types/errors'
import { z } from 'zod'

const brandSchema = z.object({
  name: z.string().trim().min(2, 'O nome da marca deve ter pelo menos 2 caracteres')
})

interface Props {
  visible: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
}>()

const productStore = useProductStore()
const toast = useToast()

const newBrandName = ref<string>('')
const isAdding = ref<boolean>(false)
const errorMsg = ref<string>('')

async function handleAdd(): Promise<void> {
  errorMsg.value = ''
  const validation = brandSchema.safeParse({ name: newBrandName.value })
  if (!validation.success) {
    errorMsg.value = validation.error.issues[0]?.message || 'Nome inválido'
    return
  }

  isAdding.value = true
  try {
    const created = await brands.create({ name: newBrandName.value.trim() })
    productStore.brands.push(created)
    productStore.brands.sort((a, b) => a.name.localeCompare(b.name))
    newBrandName.value = ''
    toast.add({ severity: 'success', summary: 'Marca Criada', detail: created.name, life: 3000 })
  } catch (error: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Erro ao criar marca',
      detail: parseErrorMessage(error),
      life: 3000
    })
  } finally {
    isAdding.value = false
  }
}

async function handleDelete(id: string, name: string): Promise<void> {
  try {
    await brands.delete(id)
    productStore.brands = productStore.brands.filter((b) => b.$id !== id)
    toast.add({ severity: 'info', summary: 'Marca Removida', detail: name, life: 3000 })
  } catch (error: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Erro ao excluir marca',
      detail: parseErrorMessage(error),
      life: 3000
    })
  }
}
</script>

<style scoped>
.manage-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.25rem 0;
}

.add-section {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.add-box {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}

.add-action-btn {
  height: 42px !important;
  white-space: nowrap !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 1.15rem !important;
  font-weight: 700 !important;
}

.list-container {
  max-height: 260px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: #ffffff;
}

.empty-list {
  padding: 1.5rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-style: italic;
}

.list-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.85rem;
  border-bottom: 1px solid var(--border-subtle);
}

.list-item-row:last-child {
  border-bottom: none;
}

.item-title {
  font-weight: 600;
  font-size: 0.88rem;
  color: var(--text-primary);
}
</style>
