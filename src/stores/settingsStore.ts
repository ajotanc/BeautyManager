import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ISettings } from '@/types/storeSettings'
import { settings } from '@/services/settings'

export const useSettingsStore = defineStore('settings', () => {
  const currentSettings = ref<ISettings | null>(null)
  const isLoading = ref<boolean>(false)

  async function fetchSettings(): Promise<ISettings | null> {
    isLoading.value = true
    try {
      const data = await settings.getSettings()
      currentSettings.value = data
      return data
    } finally {
      isLoading.value = false
    }
  }

  async function saveSettings(dto: Partial<ISettings>): Promise<ISettings> {
    const id = currentSettings.value?.$id
    isLoading.value = true
    try {
      const updated = await settings.saveSettings(id, dto)
      currentSettings.value = updated
      return updated
    } finally {
      isLoading.value = false
    }
  }

  return {
    settings: currentSettings,
    isLoading,
    fetchSettings,
    saveSettings
  }
})
