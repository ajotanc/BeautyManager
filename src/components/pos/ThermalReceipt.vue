<template>
  <Teleport to="body">
    <div id="thermal-receipt-print-area" class="paper-content thermal-receipt print-only"
      :style="{ width: settings?.receipt_width === '80mm' ? '320px' : '260px' }">
      <!-- Cabeçalho -->
      <div class="text-center">
        <div class="store-name">{{ settings?.store_name || 'BEAUTY MANAGER COSMÉTICOS' }}</div>
        <div v-if="settings?.document_number" class="sub-text">CNPJ: {{ settings.document_number }}</div>
        <div v-if="settings?.address" class="sub-text">{{ settings.address }}</div>
        <div v-if="settings?.phone" class="sub-text">WhatsApp: {{ settings.phone }}</div>
        <div v-if="settings?.instagram" class="sub-text">Instagram: {{ settings.instagram }}</div>
        <div class="receipt-divider">==============================================</div>
        <div class="font-bold">** CUPOM NÃO FISCAL **</div>
        <div class="receipt-divider">==============================================</div>
      </div>

      <!-- Info da Venda / Simulação -->
      <div class="sale-meta">
        <div>DATA: {{ formattedDateTime }}</div>
        <div>CUPOM: {{ saleIdentifier }}</div>
        <div>CLIENTE: {{ sale?.customer_name || 'Consumidor Final' }}</div>
        <div class="receipt-divider">----------------------------------------------</div>
      </div>

      <!-- Lista de Itens Demonstrativos / Reais -->
      <div class="items-table">
        <div class="items-header">
          <span>DESCRIÇÃO</span>
          <span>QTD x UN</span>
          <span>TOTAL</span>
        </div>
        <div class="receipt-divider">----------------------------------------------</div>

        <div v-for="item in receiptItems" :key="item.id" class="item-line">
          <div class="item-title">{{ item.name }}</div>
          <div class="item-details">
            <span>{{ item.quantity }}x {{ formatCurrency(item.unitPrice) }}</span>
            <span class="font-bold">{{ formatCurrency(item.subtotal) }}</span>
          </div>
        </div>
      </div>

      <div class="receipt-divider">----------------------------------------------</div>

      <!-- Totais -->
      <div class="totals-block">
        <div class="row">
          <span>SUBTOTAL:</span>
          <span>{{ formatCurrency(subtotalAmount) }}</span>
        </div>
        <div v-if="discountAmount > 0" class="row">
          <span>DESCONTO:</span>
          <span>- {{ formatCurrency(discountAmount) }}</span>
        </div>
        <div class="row grand-total">
          <span>TOTAL PAGO:</span>
          <span>{{ formatCurrency(finalTotalAmount) }}</span>
        </div>
        <div class="row">
          <span>FORMA PAGTO:</span>
          <span class="font-bold">{{ paymentMethodLabel }}</span>
        </div>
        <div v-if="changeAmount > 0" class="row">
          <span>TROCO:</span>
          <span>{{ formatCurrency(changeAmount) }}</span>
        </div>
      </div>

      <div class="receipt-divider">==============================================</div>

      <!-- QR Code Preview em Tempo Real -->
      <div v-if="settings?.show_qrcode && qrPayload" class="text-center qrcode-block">
        <div class="font-bold qrcode-header">{{ qrLabel }}</div>
        <div class="qrcode-render">
          <QrcodeVue :value="qrPayload" :size="qrSize" level="M" render-as="svg" />
        </div>
        <div class="sub-text">Aponte a câmera do seu celular</div>
        <div class="receipt-divider">==============================================</div>
      </div>

      <!-- Mensagem de Rodapé -->
      <div class="text-center footer-block">
        <div class="footer-text">{{ settings?.receipt_footer || 'Obrigada pela preferência! Volte sempre!' }}</div>
        <div class="tech-sub">{{ year }} &copy; Beauty Manager / @ajotanc</div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import QrcodeVue from 'qrcode.vue'
import { formatPaymentMethod, type ISale, type ICartItem, type IReceiptItem } from '@/types/sale'
import type { ISettings } from '@/types/storeSettings'
import { formatCurrency, toNumber } from '@/utils/currency'
import { dayjs, formatDateTime, nowIso } from '@/utils/date'

interface Props {
  sale?: ISale | null
  cartItems?: ICartItem[]
  settings?: Partial<ISettings> | null
  changeAmount?: number
}

const props = withDefaults(defineProps<Props>(), {
  sale: null,
  cartItems: () => [],
  settings: null,
  changeAmount: 0
})

const year = dayjs().year();

/**
 * Normalização dos itens para impressão idêntica ao preview
 */
const receiptItems = computed<IReceiptItem[]>(() => {
  if (props.sale?.items && props.sale.items.length > 0) {
    return props.sale.items.map((item) => {
      const productName = typeof item.product === 'object' && item.product
        ? item.product.name
        : 'Produto Cosmético'

      return {
        id: item.$id,
        name: productName,
        quantity: item.quantity,
        unitPrice: toNumber(item.unit_price),
        subtotal: toNumber(item.subtotal)
      }
    })
  }

  if (props.cartItems && props.cartItems.length > 0) {
    return props.cartItems.map((item) => ({
      id: item.product.$id,
      name: item.product.name,
      quantity: item.quantity,
      unitPrice: toNumber(item.unit_price),
      subtotal: toNumber(item.subtotal)
    }))
  }

  // Itens padrão idênticos ao preview
  return [
    { id: '1', name: 'Batom Matte Rosa Luxo', quantity: 1, unitPrice: 29.90, subtotal: 29.90 },
    { id: '2', name: 'Máscara de Cílios Volume', quantity: 1, unitPrice: 39.90, subtotal: 39.90 },
    { id: '3', name: 'Esmalte Gel Efeito Brilho', quantity: 2, unitPrice: 8.50, subtotal: 17.00 }
  ]
})

const formattedDateTime = computed<string>(() => {
  return formatDateTime(props.sale?.$createdAt || nowIso())
})

const saleIdentifier = computed<string>(() => {
  return props.sale?.$id ? `#${props.sale.$id.slice(-6).toUpperCase()}` : '#PREVIEW'
})

const subtotalAmount = computed<number>(() => {
  if (props.sale) {
    return toNumber(props.sale.total_amount) + toNumber(props.sale.discount_amount)
  }
  return receiptItems.value.reduce((acc, item) => acc + item.subtotal, 0)
})

const discountAmount = computed<number>(() => {
  return toNumber(props.sale?.discount_amount)
})

const finalTotalAmount = computed<number>(() => {
  if (props.sale) return toNumber(props.sale.total_amount)
  return subtotalAmount.value - discountAmount.value
})

const paymentMethodLabel = computed<string>(() => {
  if (props.sale?.payment_method) {
    return formatPaymentMethod(props.sale.payment_method)
  }
  return 'PIX / Dinheiro'
})

const qrSize = computed(() => (props.settings?.receipt_width === '80mm' ? 120 : 100))

const qrPayload = computed(() => {
  if (!props.settings) return 'https://beautymanager.loja'
  if (props.settings.qrcode_type === 'whatsapp') {
    const rawPhone = props.settings.phone?.replace(/\D/g, '') || ''
    return rawPhone ? `https://wa.me/55${rawPhone}` : props.settings.qrcode_payload || 'https://wa.me'
  }
  if (props.settings.qrcode_type === 'instagram') {
    const cleanUser = props.settings.instagram?.replace('@', '').trim() || ''
    return cleanUser ? `https://instagram.com/${cleanUser}` : props.settings.qrcode_payload || 'https://instagram.com'
  }
  if (props.settings.qrcode_type === 'pix') {
    return props.settings.pix_key || props.settings.qrcode_payload || 'pix-chave'
  }
  return props.settings.qrcode_payload || 'https://beautymanager.loja'
})

const qrLabel = computed(() => {
  if (props.settings?.qrcode_type === 'whatsapp') return 'WHATSAPP DA LOJA'
  if (props.settings?.qrcode_type === 'instagram') return 'INSTAGRAM DA LOJA'
  if (props.settings?.qrcode_type === 'pix') return 'CHAVE PIX'
  return 'ESCANEIE AQUI'
})
</script>

<style scoped>
@media screen {

  #thermal-receipt-print-area,
  .print-only {
    display: none !important;
  }
}

.paper-content {
  padding: 1rem 0.85rem;
  font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
  font-size: 11px;
  line-height: 1.25;
  color: #111111;
  background: #ffffff;
  box-sizing: border-box;
}

.text-center {
  text-align: center;
}

.font-bold {
  font-weight: 700;
}

.store-name {
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.2px;
  margin-bottom: 2px;
  white-space: nowrap;
}

.sub-text {
  font-size: 10px;
  color: #444;
}

.receipt-divider {
  overflow: hidden;
  white-space: nowrap;
  letter-spacing: -1px;
  font-size: 10px;
  margin: 3px 0;
  color: #777;
}

.sale-meta {
  font-size: 10px;
}

.items-header {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
  font-size: 10px;
}

.item-line {
  margin-bottom: 4px;
}

.item-title {
  font-weight: 600;
}

.item-details {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
}

.totals-block .row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  margin-bottom: 2px;
}

.totals-block .grand-total {
  font-size: 13px;
  font-weight: 800;
  margin: 4px 0;
  color: #000;
}

.qrcode-block {
  margin: 6px 0;
}

.qrcode-header {
  font-size: 10px;
  margin-bottom: 4px;
}

.qrcode-render {
  display: flex;
  justify-content: center;
  padding: 6px;
  background: white;
}

.footer-block {
  margin-top: 6px;
}

.footer-text {
  font-size: 10px;
  white-space: pre-line;
}

.tech-sub {
  font-size: 8px;
  color: #888;
  margin-top: 4px;
}
</style>
