<template>
  <div class="app-empty-state">
    <div class="header-icon-box xl">
      <i :class="icon"></i>
    </div>
    <h3 class="empty-title">{{ title }}</h3>
    <p v-if="description" class="empty-description">{{ description }}</p>
    <div v-if="$slots.action || actionLabel" class="empty-actions">
      <slot name="action">
        <Button v-if="actionLabel" :label="actionLabel" :icon="actionIcon" :severity="actionSeverity" size="small"
          @click="emit('action')" />
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
  padding: 1.75rem 1.25rem;
  gap: 0.5rem;
  width: 100%;
  flex: 1;
  min-height: 0;
}

.empty-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary, #101828);
  margin: 0;
}

.empty-description {
  font-size: 0.8rem;
  color: var(--text-secondary, #64748b);
  max-width: 360px;
  margin: 0;
  line-height: 1.4;
}

.empty-actions {
  margin-top: 0.35rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
