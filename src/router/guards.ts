import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { isLocalEnvironment } from '@/utils/security'

export async function authGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
): Promise<void> {
  const authStore = useAuthStore()

  // Verificação de ambiente local
  if (!isLocalEnvironment()) {
    console.warn('Acesso fora do ambiente local detectado.')
  }

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
    next({ name: 'pos' })
    return
  }

  // Verifica permissão de Administrador / Gestor
  const requiresAdmin = to.meta.requiresAdmin === true
  if (requiresAdmin && !authStore.isAdmin) {
    // Redireciona operadores para o PDV caso tentem acessar área restrita de gestão
    next({ name: 'pos' })
    return
  }

  next()
}
