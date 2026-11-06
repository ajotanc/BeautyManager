<template>
  <div class="logo-field">
    <div class="logo-thumb">
      <img v-if="logoUrl" :src="logoUrl" :alt="label" />
      <i v-else class="ri-image-line"></i>
    </div>
    <div class="logo-actions">
      <strong class="text-sm">{{ label }}</strong>
      <p class="text-xs text-slate-500">{{ hint }} PNG, JPG ou WebP, até 2 MB.</p>
      <div class="flex gap-2 mt-2">
        <Button type="button" :label="fileId ? 'Trocar imagem' : 'Escolher imagem'" icon="ri-upload-2-line" size="small"
          severity="secondary" :loading="busy" @click="input?.click()" />
        <Button v-if="fileId" type="button" label="Remover" icon="ri-delete-bin-line" size="small" severity="danger" text
          :disabled="busy" @click="emit('remove')" />
      </div>
      <input ref="input" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="handlePicked" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import { useStoreLogo } from '@/composables/useStoreLogo'

const props = defineProps<{ fileId: string; label: string; hint: string; busy?: boolean }>()
const emit = defineEmits<{ (e: 'pick', file: File): void; (e: 'remove'): void }>()

const input = ref<HTMLInputElement | null>(null)
const logoUrl = useStoreLogo(computed(() => props.fileId))

function handlePicked(event: Event): void {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = ''
  if (file) emit('pick', file)
}
</script>

<style scoped>
.logo-field {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-thumb {
  width: 5.5rem;
  height: 5.5rem;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border: 1px dashed var(--p-surface-300, #cbd5e1);
  border-radius: 0.75rem;
  background: #fff;
  overflow: hidden;
  font-size: 1.75rem;
  color: var(--p-surface-400, #94a3b8);
}

.logo-thumb img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>
