import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

export async function authGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
): Promise<void> {
  const authStore = useAuthStore()

  // Se a store ainda não verificou a sessão, faz a verificação
  if (!authStore.isInitialized) {
    await authStore.checkSession()
  }

  const isPublicRoute = to.meta.public === true

  if (!authStore.isAuthenticated && !isPublicRoute) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  if (authStore.isAuthenticated && isPublicRoute && to.name === 'login') {
    next({ name: 'checkout' })
    return
  }

  // Verifica permissão de Administrador / Gestor
  const requiresAdmin = to.meta.requiresAdmin === true
  if (requiresAdmin && !authStore.isAdmin) {
    // Redireciona operadores para o Checkout caso tentem acessar área restrita de gestão
    next({ name: 'checkout' })
    return
  }

  next()
}
