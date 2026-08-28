<template>
  <div class="receipt-preview-wrapper">
    <div class="paper-roll" :style="{ maxWidth: previewWidth }">
      <!-- Serrilha / Picote Superior da Bobina -->
      <div class="paper-edge-top"></div>

      <!-- Conteúdo da Nota -->
      <div class="paper-content">
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
          <div>DATA: {{ formatDateTime(nowIso()) }}</div>
          <div>CUPOM: #PREVIEW</div>
          <div>CLIENTE: Consumidor Final</div>
          <div class="receipt-divider">----------------------------------------------</div>
        </div>

        <!-- Lista de Itens Demonstrativos -->
        <div class="items-table">
          <div class="items-header">
            <span>DESCRIÇÃO</span>
            <span>QTD x UN</span>
            <span>TOTAL</span>
          </div>
          <div class="receipt-divider">----------------------------------------------</div>

          <div v-for="(item, idx) in sampleItems" :key="idx" class="item-line">
            <div class="item-title">{{ item.name }}</div>
            <div class="item-details">
              <span>{{ item.qty }}x {{ formatCurrency(item.unit) }}</span>
              <span class="font-bold">{{ formatCurrency(item.subtotal) }}</span>
            </div>
          </div>
        </div>

        <div class="receipt-divider">----------------------------------------------</div>

        <!-- Totais -->
        <div class="totals-block">
          <div class="row">
            <span>SUBTOTAL:</span>
            <span>{{ formatCurrency(sampleTotal) }}</span>
          </div>
          <div class="row grand-total">
            <span>TOTAL PAGO:</span>
            <span>{{ formatCurrency(sampleTotal) }}</span>
          </div>
          <div class="row">
            <span>FORMA PAGTO:</span>
            <span class="font-bold">PIX / Dinheiro</span>
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

      <!-- Serrilha / Picote Inferior -->
      <div class="paper-edge-bottom"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import QrcodeVue from 'qrcode.vue'
import type { ISettings } from '@/types/storeSettings'
import { formatCurrency } from '@/utils/currency'
import { dayjs, formatDateTime, nowIso } from '@/utils/date'

interface Props {
  settings?: Partial<ISettings> | null
}

const year = dayjs().year();

const props = withDefaults(defineProps<Props>(), {
  settings: null
})

const previewWidth = computed(() => {
  return props.settings?.receipt_width === '80mm' ? '320px' : '260px'
})

const qrSize = computed(() => {
  return props.settings?.receipt_width === '80mm' ? 120 : 100
})

const sampleItems = [
  { name: 'Batom Matte Rosa Luxo', qty: 1, unit: 29.90, subtotal: 29.90 },
  { name: 'Máscara de Cílios Volume', qty: 1, unit: 39.90, subtotal: 39.90 },
  { name: 'Esmalte Gel Efeito Brilho', qty: 2, unit: 8.50, subtotal: 17.00 }
]

const sampleTotal = computed(() => {
  return sampleItems.reduce((acc, i) => acc + i.subtotal, 0)
})

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
.receipt-preview-wrapper {
  display: flex;
  justify-content: center;
  padding: 1.5rem 1rem;
  background: var(--p-surface-50, #f8fafc);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: auto;
}

@media (max-width: 640px) {
  .receipt-preview-wrapper {
    padding: 1rem 0.5rem;
  }
}

.paper-roll {
  width: 100%;
  max-width: 100%;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.08);
  border-radius: 4px;
  position: relative;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.paper-edge-top {
  height: 8px;
  background: radial-gradient(circle, transparent, transparent 50%, #ffffff 50%, #ffffff 100%);
  background-size: 10px 8px;
  transform: rotate(180deg);
}

.paper-edge-bottom {
  height: 8px;
  background: radial-gradient(circle, transparent, transparent 50%, #ffffff 50%, #ffffff 100%);
  background-size: 10px 8px;
}

.paper-content {
  padding: 1rem 0.85rem;
  font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
  font-size: 11px;
  line-height: 1.25;
  color: #111111;
}

.text-center {
  text-align: center;
}

.font-bold {
  font-weight: 700;
}

.store-name {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.5px;
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
