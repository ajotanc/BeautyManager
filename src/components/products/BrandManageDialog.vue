<template>
  <AppDialog
    :visible="visible"
    title="Gerenciar Marcas"
    subtitle="Cadastre, edite ou remova as marcas dos produtos"
    icon="ri-bookmark-3-line"
    width="480px"
    @update:visible="(val) => emit('update:visible', val)"
  >
    <div class="flex flex-col gap-3">
      <!-- Barra de Inserção / Edição Rápida -->
      <div class="flex flex-col gap-1">
        <InputGroup>
          <InputText
            id="brand_input"
            v-model="brandName"
            :placeholder="selectedBrand.$id ? 'Nome da marca...' : 'Nova marca...'"
            class="text-sm"
            :invalid="!!errorMsg"
            @keyup.enter="saveBrand"
          />
          <Button
            v-if="selectedBrand.$id"
            icon="ri-close-line"
            severity="secondary"
            variant="outlined"
            title="Cancelar edição"
            @click="cancelEdit"
          />
          <Button
            :label="selectedBrand.$id ? 'Atualizar' : 'Adicionar'"
            :icon="selectedBrand.$id ? 'ri-check-line' : 'ri-add-line'"
            severity="primary"
            class="font-semibold"
            :loading="isSubmitting"
            @click="saveBrand"
          />
        </InputGroup>

        <Message v-if="errorMsg" severity="error" size="small" variant="simple">
          {{ errorMsg }}
        </Message>
      </div>

      <!-- Tabela de Marcas -->
      <DataTable
        :value="productStore.brands"
        scrollable
        scrollHeight="260px"
        size="small"
        data-key="$id"
        class="border rounded-lg overflow-hidden border-[var(--border-color)]"
        empty-message="Nenhuma marca cadastrada."
      >
        <Column field="name" header="Nome da Marca">
          <template #body="{ data }">
            <span
              class="text-sm"
              :class="selectedBrand.$id === data.$id ? 'font-bold text-[var(--p-brand-600)]' : 'font-medium text-[var(--text-primary)]'"
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
      <div class="flex justify-end w-full pt-1">
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
import Message from 'primevue/message'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
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
    message: `Deseja realmente excluir a marca "${brand.name}"?`,
    header: 'Excluir Marca',
    rejectProps: {
      label: 'Não',
      severity: 'secondary',
      outlined: true
    },
    acceptProps: {
      label: 'Sim',
      severity: 'danger'
    },
    accept: async () => {
      try {
        await BrandService.delete(brand.$id)
        productStore.brands = productStore.brands.filter((b) => b.$id !== brand.$id)
        if (selectedBrand.value.$id === brand.$id) {
          cancelEdit()
        }
        toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Marca excluída com sucesso!',
          life: 3000
        })
      } catch (error: unknown) {
        toast.add({
          severity: 'error',
          summary: 'Erro ao excluir',
          detail: parseErrorMessage(error),
          life: 3000
        })
      }
    }
  })
}
</script>
