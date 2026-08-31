<template>
  <Dialog :visible="visible" :modal="modal" :dismissable-mask="dismissableMask" :closable="closable"
    :style="{ width, maxWidth, maxHeight: '90vh' }" :content-style="computedContentStyle" class="app-dialog"
    @update:visible="(val) => emit('update:visible', val)">
    <!-- Custom Unified Header -->
    <template #header>
      <slot name="header">
        <div class="dialog-custom-header flex items-center justify-between w-full pr-2">
          <div class="flex items-center gap-3">
            <div v-if="icon" class="header-icon-box">
              <i :class="icon"></i>
            </div>
            <div class="header-text flex flex-col">
              <h3 class="header-title m-0">
                {{ title }}
              </h3>
              <p v-if="subtitle" class="header-subtitle m-0">
                {{ subtitle }}
              </p>
            </div>
          </div>

          <slot name="header-actions" />
        </div>
      </slot>
    </template>

    <!-- Dialog Body -->
    <slot />

    <!-- Dialog Footer -->
    <template v-if="$slots.footer" #footer>
      <div class="app-dialog-footer">
        <slot name="footer" />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Dialog from 'primevue/dialog'
import type { StyleValue } from 'vue'

interface Props {
  visible: boolean
  title?: string
  subtitle?: string
  icon?: string
  width?: string
  maxWidth?: string
  dismissableMask?: boolean
  modal?: boolean
  closable?: boolean
  contentStyle?: StyleValue
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '',
  subtitle: '',
  icon: '',
  width: '520px',
  maxWidth: '95vw',
  dismissableMask: true,
  modal: true,
  closable: true,
  contentStyle: undefined
})

const computedContentStyle = computed<StyleValue>(() => {
  if (props.contentStyle) return props.contentStyle
  return {
    padding: '1.25rem',
    overflowY: 'auto'
  }
})

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
}>()
</script>

<style scoped>
.dialog-custom-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.header-title {
  font-family: var(--font-title);
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
}

.header-subtitle {
  font-size: 0.76rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.app-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.625rem;
  width: 100%;
  background: #ffffff;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-subtle);
}
</style>
