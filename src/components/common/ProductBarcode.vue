<template>
  <div class="product-barcode-wrap">
    <svg ref="svgRef" class="barcode-svg"></svg>
    <span v-if="hasError" class="barcode-fallback">{{ value }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import JsBarcode from 'jsbarcode'

interface Props {
  value: string
  width?: number
  height?: number
  fontSize?: number
  displayValue?: boolean
  format?: string
}

const props = withDefaults(defineProps<Props>(), {
  width: 1.1,
  height: 22,
  fontSize: 9,
  displayValue: true,
  format: 'CODE128'
})

const svgRef = ref<SVGSVGElement | null>(null)
const hasError = ref<boolean>(false)

function renderBarcode(): void {
  if (!svgRef.value || !props.value) return
  try {
    hasError.value = false
    JsBarcode(svgRef.value, String(props.value).trim(), {
      format: props.format,
      width: props.width,
      height: props.height,
      displayValue: props.displayValue,
      fontSize: props.fontSize,
      font: 'Plus Jakarta Sans, sans-serif',
      textMargin: 0,
      margin: 0,
      background: 'transparent',
      lineColor: '#000000'
    })
  } catch {
    hasError.value = true
  }
}

onMounted(() => {
  nextTick(renderBarcode)
})

watch(
  () => [props.value, props.width, props.height, props.displayValue],
  () => {
    nextTick(renderBarcode)
  }
)
</script>

<style scoped>
.product-barcode-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.barcode-svg {
  max-width: 100%;
  max-height: 38px;
  height: auto;
  display: block;
}

.barcode-fallback {
  font-size: 0.72rem;
  color: #334155;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
