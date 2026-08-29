<template>
  <div class="box-header flex flex-wrap items-center justify-between gap-3 border-b border-border">
    <div class="header-left flex items-center gap-2.5">
      <div v-if="icon" class="header-icon-box">
        <i :class="icon"></i>
      </div>
      <div class="header-title-meta flex flex-col gap-0.5">
        <h3 class="header-title">{{ title }}</h3>
        <span v-if="subtitle" class="header-subtitle">{{ subtitle }}</span>
      </div>
    </div>

    <!-- Slot para ações ou badge (ex: F1, botões ou contadores) -->
    <div v-if="$slots.actions || badge" class="header-actions flex items-center gap-2" :class="actionsClass">
      <span v-if="badge" class="kbd-badge">{{ badge }}</span>
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  icon?: string
  badge?: string
  actionsClass?: string
}>()
</script>

<style scoped>
.box-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.header-icon-box {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #e11d48;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(225, 29, 72, 0.05);
}

.header-title-meta {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.header-title {
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 0.95rem;
  color: var(--text-primary);
  line-height: 1.2;
  margin: 0;
}

.header-subtitle {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.kbd-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.15rem 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: #9f1239;
  background-color: #ffe4e6;
  border: 1px solid #fecdd3;
  border-radius: var(--radius-xs);
  box-shadow: 0 1px 2px rgba(225, 29, 72, 0.08);
}
</style>
