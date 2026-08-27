<template>
  <div class="app-empty-state">
    <div class="empty-icon-circle">
      <i :class="icon"></i>
    </div>
    <h3 class="empty-title">{{ title }}</h3>
    <p v-if="description" class="empty-description">{{ description }}</p>
    <div v-if="$slots.action || actionLabel" class="empty-actions">
      <slot name="action">
        <Button
          v-if="actionLabel"
          :label="actionLabel"
          :icon="actionIcon"
          :severity="actionSeverity"
          size="small"
          @click="emit('action')"
        />
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'

interface Props {
  icon?: string
  title?: string
  description?: string
  actionLabel?: string
  actionIcon?: string
  actionSeverity?: 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | 'contrast'
}

withDefaults(defineProps<Props>(), {
  icon: 'ri-inbox-2-line',
  title: 'Nenhum registro encontrado',
  description: '',
  actionLabel: '',
  actionIcon: '',
  actionSeverity: 'secondary'
})

const emit = defineEmits<{
  (e: 'action'): void
}>()
</script>

<style scoped>
.app-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2.5rem 1.5rem;
  gap: 0.75rem;
  width: 100%;
  flex: 1;
  min-height: 0;
}

.empty-icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--p-brand-50, #ffebf0);
  color: var(--p-brand-500, #fd0054);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.85rem;
  margin-bottom: 0.25rem;
  border: 1px solid var(--p-brand-200, #ffa3bc);
  box-shadow: 0 4px 14px rgba(253, 0, 84, 0.08);
}

.empty-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary, #101828);
  margin: 0;
}

.empty-description {
  font-size: 0.86rem;
  color: var(--text-secondary, #64748b);
  max-width: 420px;
  margin: 0;
  line-height: 1.45;
}

.empty-actions {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
