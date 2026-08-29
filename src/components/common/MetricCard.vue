<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  value: string | number
  icon: string
  color: 'rose' | 'gold' | 'emerald' | 'amber' | 'purple' | 'brand' | string
  isActive?: boolean
  isClickable?: boolean
}>()

defineEmits(['click'])

const colorClass = computed(() => {
  if (props.color === 'rose' || props.color === 'brand') return 'bg-rose'
  return `bg-${props.color}`
})
</script>

<template>
  <div
    class="metric-card glass-panel floating-card"
    :class="[
      isClickable ? 'cursor-pointer' : '',
      isActive ? 'ring-2 ring-(--p-brand-500) ring-offset-2' : ''
    ]"
    @click="isClickable ? $emit('click') : undefined"
  >
    <div class="icon-wrap" :class="colorClass">
      <i :class="icon"></i>
    </div>
    <div class="card-info">
      <span class="c-label">{{ label }}</span>
      <span class="c-val" :class="`text-${color}`">{{ value }}</span>
    </div>
  </div>
</template>

<style scoped>
.metric-card {
  padding: 1.15rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  transition: transform var(--transition-normal), box-shadow var(--transition-normal), border-color var(--transition-normal);
  min-width: 0;
}

.icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
  border: none;
  box-shadow: var(--shadow-xs);
}

.bg-rose, .bg-brand {
  background: var(--grad-primary);
  color: #ffffff;
}

.bg-gold {
  background: var(--grad-gold);
  color: #ffffff;
}

.bg-emerald {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
}

.bg-amber {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #ffffff;
}

.bg-purple {
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  color: #ffffff;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
  flex: 1;
}

.c-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.c-val {
  font-family: var(--font-title);
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  line-height: 1.1;
  white-space: nowrap;
}

.text-brand, .text-rose { color: var(--p-brand-600); }
.text-gold { color: var(--p-gold-600); }
.text-emerald { color: #059669; }
.text-amber { color: #d97706; }
.text-purple { color: #7c3aed; }
</style>
