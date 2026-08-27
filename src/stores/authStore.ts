import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth } from '@/services/auth'
import type { AuthUser, LoginCredentials, UserPreferences } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<AuthUser | null>(null)
  const isLoading = ref<boolean>(false)
  const isInitialized = ref<boolean>(false)

  const isAuthenticated = computed<boolean>(() => currentUser.value !== null)
  
  const isAdmin = computed<boolean>(() => {
    if (!currentUser.value) return false
    const prefs = currentUser.value.prefs as UserPreferences
    return prefs?.role === 'admin'
  })

  const userName = computed<string>(() => {
    return currentUser.value?.name || 'Operador'
  })

  async function checkSession(): Promise<boolean> {
    isLoading.value = true
    try {
      const user = await auth.getCurrentUser()
      currentUser.value = user
      return user !== null
    } catch {
      currentUser.value = null
      return false
    } finally {
      isLoading.value = false
      isInitialized.value = true
    }
  }

  async function login(credentials: LoginCredentials): Promise<void> {
    isLoading.value = true
    try {
      await auth.login(credentials)
      await checkSession()
    } finally {
      isLoading.value = false
    }
  }

  async function logout(): Promise<void> {
    isLoading.value = true
    try {
      await auth.logout()
      currentUser.value = null
    } finally {
      isLoading.value = false
    }
  }

  return {
    currentUser,
    isLoading,
    isInitialized,
    isAuthenticated,
    isAdmin,
    userName,
    checkSession,
    login,
    logout
  }
})
