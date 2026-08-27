<template>
  <AppDialog
    :visible="visible"
    title="Gerenciar Marcas"
    subtitle="Cadastre, edite ou remova as marcas dos produtos"
    icon="ri-bookmark-3-line"
    width="480px"
    @update:visible="(val) => emit('update:visible', val)"
  >
    <div class="flex flex-col gap-4">
      <!-- Barra de Inserção / Edição Rápida -->
      <InputGroup>
        <InputText
          id="brand_input"
          v-model="brandName"
          :invalid="!!errorMsg"
          @keyup.enter="saveBrand"
          placeholder="Nome da Marca..."
        />
        
        <Button
          v-if="selectedBrand.$id"
          icon="ri-close-line"
          severity="secondary"
          title="Cancelar edição"
          @click="cancelEdit"
        />
        <Button
          :label="selectedBrand.$id ? 'Salvar' : 'Adicionar'"
          :icon="selectedBrand.$id ? 'ri-check-line' : 'ri-add-line'"
          severity="primary"
          class="font-semibold px-4"
          :loading="isSubmitting"
          @click="saveBrand"
        />
      </InputGroup>
      
      <Message v-if="errorMsg" severity="error" size="small" variant="simple">
        {{ errorMsg }}
      </Message>

      <!-- Tabela de Marcas -->
      <DataTable
        :value="productStore.brands"
        scrollable
        scrollHeight="260px"
        size="small"
        data-key="$id"
        class="border rounded-lg overflow-hidden border-(--border-color)"
        empty-message="Nenhuma marca cadastrada."
      >
        <Column field="name" header="Nome">
          <template #body="{ data }">
            <span
              class="text-sm"
              :class="selectedBrand.$id === data.$id ? 'font-bold text-(--p-brand-600)' : 'font-medium text-(--text-primary)'"
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
                @click="editBrand(data)"
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
      <div class="flex justify-end w-full pt-3 border-t border-(--border-subtle)">
        <Button
          label="Pronto"
          icon="ri-check-line"
          severity="secondary"
          variant="text"
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
import { BrandService } from '@/services/brands'
import type { IBrand } from '@/types/brand'
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
const confirm = useConfirm()

const selectedBrand = ref<IBrand>({} as IBrand)
const brandName = ref<string>('')
const isSubmitting = ref<boolean>(false)
const errorMsg = ref<string>('')

function editBrand(brand: IBrand): void {
  selectedBrand.value = { ...brand }
  brandName.value = brand.name
  errorMsg.value = ''
}

function cancelEdit(): void {
  selectedBrand.value = {} as IBrand
  brandName.value = ''
  errorMsg.value = ''
}

async function saveBrand(): Promise<void> {
  errorMsg.value = ''
  const validation = brandSchema.safeParse({ name: brandName.value })
  if (!validation.success) {
    errorMsg.value = validation.error.issues[0]?.message || 'Nome inválido'
    return
  }

  isSubmitting.value = true
  try {
    const response = await BrandService.upsert(selectedBrand.value.$id, {
      name: validation.data.name
    })

    const index = productStore.brands.findIndex((item) => item.$id === response.$id)
    if (index !== -1) {
      productStore.brands[index] = response
    } else {
      productStore.brands.push(response)
    }

    productStore.brands.sort((a, b) => a.name.localeCompare(b.name))

    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: selectedBrand.value.$id ? 'Marca atualizada.' : 'Marca cadastrada.',
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

function confirmDelete(brand: IBrand): void {
  confirm.require({
    header: 'Excluir Marca',
    message: `Tem certeza que deseja excluir "${brand.name}"? Esta ação não pode ser desfeita.`,
    icon: 'ri-alert-line',
    acceptLabel: 'Excluir',
    acceptClass: 'p-button-danger',
    rejectLabel: 'Cancelar',
    accept: async () => {
      try {
        await BrandService.delete(brand.$id)
        productStore.brands = productStore.brands.filter((b) => b.$id !== brand.$id)
        toast.add({ severity: 'success', summary: 'Excluída', detail: 'Marca removida com sucesso.', life: 3000 })
        if (selectedBrand.value.$id === brand.$id) {
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