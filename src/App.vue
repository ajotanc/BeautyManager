<template>
  <div class="app-root">
    <!-- Toast Global para notificações -->
    <Toast position="top-right" />
    <ConfirmDialog />

    <!-- Tela de Login sem Navbar/Sidebar -->
    <template v-if="isLoginRoute">
      <router-view />
    </template>

    <!-- Layout Principal para Telas Autenticadas -->
    <template v-else>
      <AppNavbar />
      <div class="app-body">
        <AppSidebar />
        <main class="app-content">
          <router-view />
        </main>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { useAuthStore } from '@/stores/authStore'
import { useCashRegisterStore } from '@/stores/cashRegisterStore'
import { useSettingsStore } from '@/stores/settingsStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const cashRegisterStore = useCashRegisterStore()
const settingsStore = useSettingsStore()

const isLoginRoute = computed(() => route.name === 'login')

function handleGlobalKeydown(event: KeyboardEvent): void {
  if (isLoginRoute.value) return

  // F1 - Frente de Caixa / Foco no Scanner
  if (event.key === 'F1') {
    event.preventDefault()
    if (route.name !== 'pos') {
      router.push({ name: 'pos' })
    } else {
      nextTick(() => {
        const inputEl = (document.getElementById('pos-barcode-scanner-input') as HTMLInputElement | null)
          ?? document.querySelector<HTMLInputElement>('.pos-left-panel .p-autocomplete-input, .p-autocomplete input')
        if (inputEl) {
          inputEl.focus()
          inputEl.select()
        }
      })
    }
    return
  }

  // F2 - Caixa Diário
  if (event.key === 'F2') {
    event.preventDefault()
    if (route.name !== 'cash-register') {
      router.push({ name: 'cash-register' })
    }
    return
  }

  // F3 - Dashboard (Apenas Admin)
  if (event.key === 'F3') {
    event.preventDefault()
    if (authStore.isAdmin && route.name !== 'dashboard') {
      router.push({ name: 'dashboard' })
    }
    return
  }

  // F4 - Produtos (quando fora da Frente de Caixa)
  if (event.key === 'F4') {
    if (route.name !== 'pos') {
      event.preventDefault()
      if (authStore.isAdmin) {
        router.push({ name: 'products' })
      }
    }
    return
  }

  // F8 - Configurações (Apenas Admin)
  if (event.key === 'F8') {
    event.preventDefault()
    if (authStore.isAdmin && route.name !== 'settings') {
      router.push({ name: 'settings' })
    }
    return
  }
}

onMounted(async () => {
  window.addEventListener('keydown', handleGlobalKeydown)
  try {
    await Promise.all([
      cashRegisterStore.checkActiveRegister(),
      settingsStore.fetchSettings()
    ])
  } catch {
    // Ignora erro inicial caso o usuário ainda não esteja logado
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<style scoped>
.app-root {
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
  overflow: hidden;
}

.app-body {
  display: flex;
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow: hidden;
}

.app-content {
  flex: 1;
  min-height: 0;
  padding: 1.25rem;
  overflow-y: auto;
  max-width: 100%;
}

.app-content:has(.pos-view) {
  overflow: hidden !important;
  padding: 0.85rem 1.15rem;
}

@media print {
  .app-navbar, .app-sidebar, .app-content {
    display: none !important;
  }
}
</style>
