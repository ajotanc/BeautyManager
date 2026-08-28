<template>
  <div class="products-view">
    <!-- Cabeçalho da Página -->
    <div class="view-header">
      <div>
        <h1 class="page-title"><i class="ri-price-tag-3-line"></i> Produtos & Catálogo</h1>
        <p class="page-subtitle">Gerencie o estoque, categorias, marcas, formação de preço (markup) e etiquetas</p>
      </div>

      <div class="header-actions">
        <Button label="Exportar Excel" icon="ri-file-excel-2-line" severity="success" variant="outlined" size="small"
          @click="handleExportExcel" />
        <Button label="Categorias" icon="ri-folder-3-line" severity="secondary" variant="outlined" size="small"
          @click="showCategoryDialog = true" />
        <Button label="Marcas" icon="ri-bookmark-3-line" severity="secondary" variant="outlined" size="small"
          @click="showBrandDialog = true" />
        <Button label="Novo Produto" icon="ri-add-line" severity="primary" size="small" @click="newProduct" />
      </div>
    </div>

    <!-- Tabela de Produtos -->
    <div class="table-container glass-panel">
      <DataTable v-model:filters="filters" :value="productStore.products" paginator :rows="12"
        :rows-per-page-options="[12, 24, 48]" data-key="$id" :loading="productStore.isLoading" filter-display="row"
        :global-filter-fields="['name', 'barcode']" responsive-layout="scroll"
        empty-message="Nenhum produto cadastrado.">
        <template #header>
          <div class="table-header-bar">
            <IconField>
              <InputIcon class="ri-search-line" />
              <InputText v-model="filters['global'].value" placeholder="Buscar por nome ou código de barras..."
                size="small" class="global-search-input" />
            </IconField>

            <div class="stock-alerts-summary">
              <Tag v-if="productStore.lowStockProducts.length > 0" severity="warn"
                :value="`${productStore.lowStockProducts.length} estoque baixo`" icon="ri-alert-line" />
              <Tag v-if="productStore.expiringProducts.length > 0" severity="danger"
                :value="`${productStore.expiringProducts.length} vencendo logo`" icon="ri-time-line" />
            </div>
          </div>
        </template>

        <!-- Código de Barras -->
        <Column field="barcode" header="Cód. Barras" sortable style="min-width: 140px">
          <template #body="{ data }">
            <span class="barcode-cell font-medium">{{ data.barcode }}</span>
          </template>
        </Column>

        <!-- Nome do Produto -->
        <Column field="name" header="Produto" sortable style="min-width: 220px">
          <template #body="{ data }">
            <div class="product-name-cell">
              <span class="name-text">{{ data.name }}</span>
              <div class="meta-tags">
                <span class="cat-brand-tag">{{ data.category.name }} • {{ data.brand.name }}</span>
                <Tag v-if="data.is_quick_sale" severity="info" value="Venda Rápida" class="mini-tag" />
              </div>
            </div>
          </template>
        </Column>

        <!-- Preço de Custo -->
        <Column field="cost_price" header="Custo" sortable style="min-width: 110px">
          <template #body="{ data }">
            <span class="text-sm">{{ formatCurrency(data.cost_price) }}</span>
          </template>
        </Column>

        <!-- Margem (%) -->
        <Column field="profit_margin" header="Margem" sortable style="min-width: 100px">
          <template #body="{ data }">
            <span class="margin-badge font-semibold">{{ formatPercent(data.profit_margin) }}</span>
          </template>
        </Column>

        <!-- Preço de Venda -->
        <Column field="selling_price" header="Preço Venda" sortable style="min-width: 120px">
          <template #body="{ data }">
            <strong class="selling-price-cell font-bold">{{ formatCurrency(data.selling_price) }}</strong>
          </template>
        </Column>

        <!-- Estoque -->
        <Column field="stock_quantity" header="Estoque" sortable style="min-width: 110px">
          <template #body="{ data }">
            <div class="stock-badge-wrapper">
              <span class="stock-num font-semibold" :class="{
                'stock-empty': data.stock_quantity === 0,
                'stock-low': data.stock_quantity > 0 && data.stock_quantity <= data.min_stock_alert,
                'stock-ok': data.stock_quantity > data.min_stock_alert
              }">
                {{ data.stock_quantity }} un.
              </span>
            </div>
          </template>
        </Column>

        <!-- Validade -->
        <Column field="expiry_date" header="Validade" sortable style="min-width: 120px">
          <template #body="{ data }">
            <span v-if="!data.expiry_date" class="text-muted">-</span>
            <span v-else class="text-sm" :class="{
              'text-danger font-bold': isExpired(data.expiry_date),
              'text-warning font-bold': isExpiringSoon(data.expiry_date, 60)
            }">
              {{ formatDate(data.expiry_date) }}
            </span>
          </template>
        </Column>

        <!-- Ações -->
        <Column header="Ações" style="min-width: 160px" body-class="text-right">
          <template #body="{ data }">
            <div class="actions-row">
              <Button icon="ri-archive-line" severity="secondary" variant="text" rounded size="small"
                title="Ajuste / Entrada de Estoque" @click="openStockAdjustment(data)" />
              <Button icon="ri-printer-line" severity="secondary" variant="text" rounded size="small"
                title="Imprimir Etiquetas" @click="openBarcodePrint(data)" />
              <Button icon="ri-pencil-line" severity="primary" variant="text" rounded size="small"
                title="Editar Produto" @click="editProduct(data)" />
              <Button icon="ri-delete-bin-line" severity="danger" variant="text" rounded size="small"
                title="Excluir Produto" @click="confirmDelete(data)" />
            </div>
          </template>
        </Column>

        <template #empty>
          <AppEmptyState
            icon="ri-box-3-line"
            title="Nenhum produto cadastrado"
            description="Cadastre seu primeiro produto para gerenciar estoque, preços e realizar vendas."
          />
        </template>
      </DataTable>
    </div>

    <!-- Modais de Produtos -->
    <ProductFormDialog v-model:visible="showProductDialog" :product-to-edit="selectedProduct"
      @open-category-manage="showCategoryDialog = true" @open-brand-manage="showBrandDialog = true" />

    <CategoryManageDialog v-model:visible="showCategoryDialog" />
    <BrandManageDialog v-model:visible="showBrandDialog" />

    <StockAdjustmentDialog v-model:visible="showStockDialog" :product="selectedProduct" />

    <BarcodeLabelPrintDialog v-model:visible="showBarcodePrintDialog" :product="selectedProduct" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Tag from 'primevue/tag'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import ProductFormDialog from '@/components/products/ProductFormDialog.vue'
import CategoryManageDialog from '@/components/products/CategoryManageDialog.vue'
import BrandManageDialog from '@/components/products/BrandManageDialog.vue'
import StockAdjustmentDialog from '@/components/products/StockAdjustmentDialog.vue'
import BarcodeLabelPrintDialog from '@/components/products/BarcodeLabelPrintDialog.vue'

import { useProductStore } from '@/stores/productStore'
import type { IProduct } from '@/types/product'
import { formatCurrency, formatPercent } from '@/utils/currency'
import { formatDate, isExpiringSoon, isExpired } from '@/utils/date'
import { exportToExcel } from '@/utils/exportExcel'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { FilterMatchMode } from '@primevue/core/api'

import { ProductService } from '@/services/products'
import { parseErrorMessage } from '@/types/errors'

const productStore = useProductStore()
const confirm = useConfirm()
const toast = useToast()

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
})

const showProductDialog = ref<boolean>(false)
const showCategoryDialog = ref<boolean>(false)
const showBrandDialog = ref<boolean>(false)
const showStockDialog = ref<boolean>(false)
const showBarcodePrintDialog = ref<boolean>(false)
const selectedProduct = ref<IProduct>({} as IProduct)

function newProduct(): void {
  selectedProduct.value = {} as IProduct
  showProductDialog.value = true
}

function editProduct(product: IProduct): void {
  selectedProduct.value = product;
  showProductDialog.value = true
}

function openStockAdjustment(product: IProduct): void {
  selectedProduct.value = product;
  showStockDialog.value = true
}

function openBarcodePrint(product: IProduct): void {
  selectedProduct.value = product;
  showBarcodePrintDialog.value = true
}

function confirmDelete(product: IProduct): void {
  confirm.require({
    message: `Você tem certeza que deseja excluir o produto "${product.name}"?`,
    header: 'Excluir Produto',
    icon: 'ri-error-warning-line text-rose-500',
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
        await ProductService.delete(product.$id)
        productStore.products = productStore.products.filter((item) => item.$id !== product.$id)
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Produto excluído com sucesso!', life: 3000 })
      } catch (error: unknown) {
        toast.add({ severity: 'error', summary: 'Erro', detail: parseErrorMessage(error), life: 3000 })
      }
    }
  })
}

function handleExportExcel(): void {
  const exportData = productStore.products.map((p) => ({
    'Código de Barras': p.barcode,
    'Nome do Produto': p.name,
    'Categoria': p.category?.name,
    'Marca': p.brand?.name,
    'Preço Custo (R$)': p.cost_price,
    'Margem (%)': p.profit_margin,
    'Preço Venda (R$)': p.selling_price,
    'Estoque': p.stock_quantity,
    'Alerta Mínimo': p.min_stock_alert,
    'Data Validade': p.expiry_date ? formatDate(p.expiry_date) : 'N/A'
  }))
  exportToExcel(exportData, 'Produtos_Beauty_Manager')
  toast.add({ severity: 'success', summary: 'Exportado!', detail: 'Arquivo Excel gerado com sucesso.', life: 3000 })
}

onMounted(async () => {
  await productStore.fetchAll()
})
</script>

<style scoped>
.products-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .view-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.85rem;
  }

  .header-actions {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }
}

.page-title {
  font-family: var(--font-title);
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

@media (max-width: 640px) {
  .page-title {
    font-size: 1.2rem;
  }
}

.page-title i {
  color: var(--p-brand-600);
}

.page-subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.table-container {
  padding: 1.25rem;
}

.table-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.global-search-input {
  width: 320px;
}

.stock-alerts-summary {
  display: flex;
  gap: 0.5rem;
}

.barcode-cell {
  font-size: 0.8rem;
  color: var(--text-secondary);
  background: var(--p-brand-50);
  padding: 0.2rem 0.45rem;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-subtle);
}

.product-name-cell {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.name-text {
  font-weight: 700;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.meta-tags {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.cat-brand-tag {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.mini-tag {
  font-size: 0.65rem !important;
  padding: 0.08rem 0.35rem !important;
}

.margin-badge {
  font-weight: 700;
  font-size: 0.8rem;
  color: var(--p-brand-800);
  background: var(--p-brand-100);
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-xs);
}

.selling-price-cell {
  font-family: var(--font-title);
  font-size: 0.98rem;
  color: var(--p-brand-600);
}

.stock-num {
  font-weight: 800;
  font-size: 0.82rem;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-xs);
}

.stock-empty {
  background: #fee2e2;
  color: #dc2626;
}

.stock-low {
  background: #fef3c7;
  color: #d97706;
}

.stock-ok {
  background: #ecfdf5;
  color: #059669;
}

.actions-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.2rem;
}

.text-danger {
  color: #dc2626;
}

.text-warning {
  color: #d97706;
}

.text-muted {
  color: var(--text-muted);
}
</style>
