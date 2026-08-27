<template>
  <Dialog
    :visible="visible"
    modal
    header="Gerenciar Categorias"
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
                id="new_category_name"
                v-model="newCategoryName"
                fluid
                :invalid="!!errorMsg"
                @keyup.enter="handleAdd"
              />
              <label for="new_category_name">Nome</label>
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

        <!-- Lista de Categorias -->
        <div class="list-container">
          <div v-if="productStore.categories.length === 0" class="empty-list">
            Nenhuma categoria cadastrada.
          </div>
          <div
            v-for="cat in productStore.categories"
            :key="cat.$id"
            class="list-item-row"
          >
            <span class="item-title">{{ cat.name }}</span>
            <Button
              icon="ri-delete-bin-line"
              severity="danger"
              variant="text"
              rounded
              size="small"
              title="Excluir categoria"
              @click="handleDelete(cat.$id, cat.name)"
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
import { categories } from '@/services/categories'
import { useToast } from 'primevue/usetoast'
import { parseErrorMessage } from '@/types/errors'
import { z } from 'zod'

const categorySchema = z.object({
  name: z.string().trim().min(2, 'O nome da categoria deve ter pelo menos 2 caracteres')
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

const newCategoryName = ref<string>('')
const isAdding = ref<boolean>(false)
const errorMsg = ref<string>('')

async function handleAdd(): Promise<void> {
  errorMsg.value = ''
  const validation = categorySchema.safeParse({ name: newCategoryName.value })
  if (!validation.success) {
    errorMsg.value = validation.error.issues[0]?.message || 'Nome inválido'
    return
  }

  isAdding.value = true
  try {
    const created = await categories.create({ name: newCategoryName.value.trim() })
    productStore.categories.push(created)
    productStore.categories.sort((a, b) => a.name.localeCompare(b.name))
    newCategoryName.value = ''
    toast.add({ severity: 'success', summary: 'Categoria Criada', detail: created.name, life: 3000 })
  } catch (error: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Erro ao criar categoria',
      detail: parseErrorMessage(error),
      life: 3000
    })
  } finally {
    isAdding.value = false
  }
}

async function handleDelete(id: string, name: string): Promise<void> {
  try {
    await categories.delete(id)
    productStore.categories = productStore.categories.filter((c) => c.$id !== id)
    toast.add({ severity: 'info', summary: 'Categoria Removida', detail: name, life: 3000 })
  } catch (error: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Erro ao excluir categoria',
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
