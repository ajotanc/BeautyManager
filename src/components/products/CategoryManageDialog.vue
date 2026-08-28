<template>
  <AppDialog
    :visible="visible"
    title="Gerenciar Categorias"
    subtitle="Cadastre, edite ou remova as categorias dos produtos"
    icon="ri-folder-3-line"
    width="480px"
    @update:visible="(val) => emit('update:visible', val)"
  >
    <div class="flex flex-col gap-4">
      <!-- Barra de Inserção / Edição Rápida -->
      <InputGroup>
        <InputText
          id="category_input"
          v-model="categoryName"
          :invalid="!!errorMsg"
          @keyup.enter="saveCategory"
          placeholder="Nome da Categoria..."
        />
        
        <Button
          v-if="selectedCategory.$id"
          icon="ri-close-line"
          severity="secondary"
          @click="cancelEdit"
        />
        <Button
          :label="selectedCategory.$id ? 'Salvar' : 'Adicionar'"
          :icon="selectedCategory.$id ? 'ri-check-line' : 'ri-add-line'"
          severity="primary"
          class="font-semibold px-4"
          :loading="isSubmitting"
          @click="saveCategory"
        />
      </InputGroup>

      <Message v-if="errorMsg" severity="error" size="small" variant="simple">
        {{ errorMsg }}
      </Message>

      <!-- Tabela de Categorias -->
      <DataTable
        :value="productStore.categories"
        scrollable
        scrollHeight="260px"
        size="small"
        data-key="$id"
        class="border rounded-lg overflow-hidden border-(--border-color)"
        empty-message="Nenhuma categoria cadastrada."
      >
        <Column field="name" header="Nome">
          <template #body="{ data }">
            <span
              class="text-sm"
              :class="selectedCategory.$id === data.$id ? 'font-bold text-(--p-brand-600)' : 'font-medium text-(--text-primary)'"
            >
              {{ data.name }}
            </span>
          </template>
        </Column>

        <Column header="Ações" style="width: 88px" bodyClass="text-right">
          <template #body="{ data }">
            <div class="flex items-center justify-end gap-1">
              <Button
                icon="ri-pencil-line"
                severity="secondary"
                variant="text"
                rounded
                size="small"
                title="Editar"
                @click="editCategory(data)"
              />
              <Button
                icon="ri-delete-bin-line"
                severity="danger"
                variant="text"
                rounded
                size="small"
                title="Excluir"
                @click="confirmDelete(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2.5 w-full">
        <Button
          label="Fechar"
          icon="ri-close-line"
          severity="secondary"
          variant="text"
          size="small"
          @click="emit('update:visible', false)"
        />
      </div>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppDialog from '@/components/common/AppDialog.vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputGroup from 'primevue/inputgroup'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Message from 'primevue/message'
import { useConfirm } from 'primevue/useconfirm'
import { useProductStore } from '@/stores/productStore'
import { CategoryService } from '@/services/categories'
import type { ICategory } from '@/types/category'
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
const confirm = useConfirm()

const selectedCategory = ref<ICategory>({} as ICategory)
const categoryName = ref<string>('')
const isSubmitting = ref<boolean>(false)
const errorMsg = ref<string>('')

function editCategory(category: ICategory): void {
  selectedCategory.value = category
  categoryName.value = category.name
  errorMsg.value = ''
}

function cancelEdit(): void {
  selectedCategory.value = {} as ICategory
  categoryName.value = ''
  errorMsg.value = ''
}

async function saveCategory(): Promise<void> {
  errorMsg.value = ''
  const validation = categorySchema.safeParse({ name: categoryName.value })
  if (!validation.success) {
    errorMsg.value = validation.error.issues[0]?.message || 'Nome inválido'
    return
  }

  isSubmitting.value = true
  try {
    const response = await CategoryService.upsert(selectedCategory.value.$id, {
      name: validation.data.name
    })

    const index = productStore.categories.findIndex((item) => item.$id === response.$id)
    if (index !== -1) {
      productStore.categories[index] = response
    } else {
      productStore.categories.push(response)
    }

    productStore.categories.sort((a, b) => a.name.localeCompare(b.name))

    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: selectedCategory.value.$id ? 'Categoria atualizada.' : 'Categoria cadastrada.',
      life: 3000
    })

    cancelEdit()
  } catch (error: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Erro ao salvar',
      detail: parseErrorMessage(error),
      life: 3000
    })
  } finally {
    isSubmitting.value = false
  }
}

function confirmDelete(cat: ICategory): void {
  confirm.require({
    header: 'Excluir Categoria',
    message: `Tem certeza que deseja excluir "${cat.name}"? Esta ação não pode ser desfeita.`,
    icon: 'ri-alert-line',
    acceptLabel: 'Excluir',
    acceptClass: 'p-button-danger',
    rejectLabel: 'Cancelar',
    accept: async () => {
      try {
        await CategoryService.delete(cat.$id)
        productStore.categories = productStore.categories.filter((c) => c.$id !== cat.$id)
        toast.add({ severity: 'success', summary: 'Excluída', detail: 'Categoria removida com sucesso.', life: 3000 })
        if (selectedCategory.value.$id === cat.$id) {
          cancelEdit()
        }
      } catch (error: unknown) {
        toast.add({ severity: 'error', summary: 'Erro', detail: parseErrorMessage(error), life: 3000 })
      }
    }
  })
}
</script>

<style scoped>
:deep(.p-datatable .p-datatable-thead > tr > th) {
  background-color: var(--bg-primary, #ffffff);
  padding: 0.5rem 1rem;
  z-index: 10;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.25rem 1rem;
}
</style>
