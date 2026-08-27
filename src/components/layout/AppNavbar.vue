<template>
  <header class="app-navbar">
    <div class="navbar-left">
      <div class="brand-badge">
        <div class="logo-circle">
          <img src="/images/bm.svg" alt="Beauty Manager" class="brand-logo" />
        </div>
        <div class="brand-info">
          <span class="brand-title">Beauty Manager</span>
          <span class="brand-subtitle">Cosméticos & Variedades</span>
        </div>
      </div>

      <!-- Indicador do Caixa Diário -->
      <Tag
        :severity="isRegisterOpen ? 'success' : 'danger'"
        :value="isRegisterOpen ? 'Caixa Aberto' : 'Caixa Fechado'"
        :icon="isRegisterOpen ? 'ri-checkbox-circle-line' : 'ri-lock-line'"
        size="small"
      />
    </div>

    <div class="navbar-right">
      <div class="user-profile">
        <Avatar
          icon="ri-user-3-line"
          shape="circle"
          class="user-avatar"
        />
        <div class="user-meta">
          <span class="user-name">{{ authStore.userName }}</span>
          <Tag
            :severity="authStore.isAdmin ? 'warn' : 'info'"
            :value="authStore.isAdmin ? 'Administrador' : 'Operador'"
            :icon="authStore.isAdmin ? 'ri-vip-crown-line' : 'ri-user-line'"
            size="small"
          />
        </div>
      </div>

      <Button
        label="Sair"
        icon="ri-logout-box-r-line"
        severity="secondary"
        variant="outlined"
        size="small"
        @click="handleLogout"
        class="logout-btn"
      />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Avatar from 'primevue/avatar'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/authStore'
import { useCashRegisterStore } from '@/stores/cashRegisterStore'
import { useToast } from 'primevue/usetoast'
import { parseErrorMessage } from '@/types/errors'

const router = useRouter()
const authStore = useAuthStore()
const cashRegisterStore = useCashRegisterStore()
const toast = useToast()

const isRegisterOpen = computed(() => cashRegisterStore.isRegisterOpen)

async function handleLogout(): Promise<void> {
  try {
    await authStore.logout()
    toast.add({
      severity: 'info',
      summary: 'Sessão Encerrada',
      detail: 'Você saiu do sistema com sucesso.',
      life: 3000
    })
    router.push({ name: 'login' })
  } catch (error: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Erro ao sair',
      detail: parseErrorMessage(error),
      life: 3000
    })
  }
}
</script>

<style scoped>
.app-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background: var(--bg-card);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 50;
  box-shadow: var(--shadow-xs);
}

.navbar-left, .navbar-right {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.brand-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-circle {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  background: var(--p-brand-50);
  border: 1px solid var(--p-brand-100);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.brand-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.brand-info {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 1.12rem;
  color: var(--text-primary);
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.brand-subtitle {
  font-size: 0.72rem;
  color: var(--text-secondary);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.user-avatar {
  background: var(--p-brand-100) !important;
  color: var(--p-brand-700) !important;
  border: 1px solid var(--p-brand-300);
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.user-name {
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--text-primary);
}

.logout-btn {
  font-weight: 600;
}
</style>
