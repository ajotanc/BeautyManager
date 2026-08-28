<template>
  <div>
    <!-- Backdrop Overlay para Mobile -->
    <transition name="fade">
      <div
        v-if="isMobileSidebarOpen"
        class="sidebar-backdrop"
        @click="closeMobileSidebar"
      ></div>
    </transition>

    <aside class="app-sidebar" :class="{ 'is-mobile-open': isMobileSidebarOpen }">
      <!-- Header do Sidebar Mobile -->
      <div class="sidebar-mobile-header">
        <div class="flex items-center gap-2">
          <div class="mobile-logo-circle">
            <img src="/images/bm.svg" alt="Beauty Manager" class="brand-logo" />
          </div>
          <span class="font-bold text-sm text-(--text-primary)">Navegação</span>
        </div>
        <Button
          icon="ri-close-line"
          severity="secondary"
          variant="text"
          size="small"
          rounded
          aria-label="Fechar Menu"
          @click="closeMobileSidebar"
        />
      </div>

      <nav class="sidebar-nav">
        <!-- Seção Operacional (Para todos) -->
        <div class="nav-group">
          <span class="group-label">ATENDIMENTO & VENDAS</span>
          
          <router-link to="/checkout" class="nav-item" active-class="is-active" @click="closeMobileSidebar">
            <i class="ri-shopping-bag-3-line"></i>
            <span>Frente de Caixa</span>
            <span class="badge-shortcut">F1</span>
          </router-link>

          <router-link to="/cashier" class="nav-item" active-class="is-active" @click="closeMobileSidebar">
            <i class="ri-wallet-3-line"></i>
            <span>Caixa Diário</span>
            <span class="badge-shortcut">F2</span>
          </router-link>

          <router-link to="/sales" class="nav-item" active-class="is-active" @click="closeMobileSidebar">
            <i class="ri-file-list-3-line"></i>
            <span>Vendas</span>
            <span class="badge-shortcut">F3</span>
          </router-link>
        </div>

        <!-- Seção Administrativa / Gestão (Apenas role: admin) -->
        <div v-if="authStore.isAdmin" class="nav-group">
          <span class="group-label">GESTÃO & CONTROLE</span>

          <router-link to="/dashboard" class="nav-item" active-class="is-active" @click="closeMobileSidebar">
            <i class="ri-dashboard-3-line"></i>
            <span>Dashboard</span>
            <span class="badge-shortcut">F4</span>
          </router-link>

          <router-link to="/products" class="nav-item" active-class="is-active" @click="closeMobileSidebar">
            <i class="ri-price-tag-3-line"></i>
            <span>Produtos</span>
            <span class="badge-shortcut">F5</span>
          </router-link>

          <router-link to="/customers" class="nav-item" active-class="is-active" @click="closeMobileSidebar">
            <i class="ri-user-heart-line"></i>
            <span>Clientes</span>
            <span class="badge-shortcut">F6</span>
          </router-link>

          <router-link to="/inventory" class="nav-item" active-class="is-active" @click="closeMobileSidebar">
            <i class="ri-archive-line"></i>
            <span>Estoque</span>
            <span class="badge-shortcut">F7</span>
          </router-link>

          <router-link to="/settings" class="nav-item" active-class="is-active" @click="closeMobileSidebar">
            <i class="ri-settings-4-line"></i>
            <span>Configurações</span>
            <span class="badge-shortcut">F8</span>
          </router-link>
        </div>
      </nav>

      <!-- Seção Inferior: Perfil do Usuário e Informações -->
      <div class="sidebar-bottom-block">
        <div class="sidebar-user-card">
          <div class="user-card-top">
            <Avatar
              icon="ri-user-3-line"
              shape="circle"
              class="user-card-avatar"
            />
            <div class="user-card-meta">
              <span class="user-card-name" :title="authStore.userName">{{ authStore.userName }}</span>
              <span class="user-card-role" :class="{ 'is-admin': authStore.isAdmin }">
                <i :class="authStore.isAdmin ? 'ri-vip-crown-fill' : 'ri-user-3-fill'"></i>
                {{ authStore.isAdmin ? 'Administrador' : 'Operador' }}
              </span>
            </div>
            <Button
              icon="ri-logout-box-r-line"
              severity="danger"
              variant="text"
              rounded
              size="small"
              class="logout-icon-btn"
              title="Encerrar Sessão"
              @click="handleLogout"
            />
          </div>
        </div>

      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/authStore'
import { useLayout } from '@/composables/useLayout'
import { useToast } from 'primevue/usetoast'
import { parseErrorMessage } from '@/types/errors'

const router = useRouter()
const authStore = useAuthStore()
const { isMobileSidebarOpen, closeMobileSidebar } = useLayout()
const toast = useToast()

async function handleLogout(): Promise<void> {
  try {
    await authStore.logout()
    closeMobileSidebar()
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
.app-sidebar {
  width: 256px;
  background: var(--bg-card);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1rem;
  flex-shrink: 0;
  min-height: calc(100vh - 63px);
  z-index: 40;
  overflow-x: hidden;
}

.sidebar-mobile-header {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.85rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-subtle);
}

.mobile-logo-circle {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
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

/* Responsividade Mobile Drawer */
@media (max-width: 1024px) {
  .app-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    height: 100vh;
    min-height: 100vh;
    z-index: 100;
    box-shadow: var(--shadow-xl);
    transform: translateX(-100%);
    transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    overflow-x: hidden;
  }

  .app-sidebar.is-mobile-open {
    transform: translateX(0);
  }

  .sidebar-mobile-header {
    display: flex;
  }
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 90;
  transition: opacity 0.25s ease;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  scrollbar-width: none;
}

.sidebar-nav::-webkit-scrollbar {
  display: none;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.group-label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--p-gold-700);
  padding: 0 0.75rem 0.35rem 0.75rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.88rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-item i {
  font-size: 1.15rem;
  color: var(--text-muted);
  transition: all 0.25s ease;
}

.nav-item:hover {
  background: var(--p-brand-50);
  color: var(--p-brand-700);
  transform: translateX(3px);
}

.nav-item:hover i {
  color: var(--p-brand-600);
  transform: scale(1.1);
}

.nav-item.is-active {
  background: var(--grad-primary);
  color: #ffffff;
  font-weight: 700;
  box-shadow: var(--shadow-md);
  border: none;
}

.nav-item.is-active i {
  color: #ffffff;
}

.badge-shortcut {
  margin-left: auto;
  font-size: 0.65rem;
  font-weight: 700;
  background: var(--border-subtle);
  color: var(--text-muted);
  padding: 0.15rem 0.4rem;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-color);
}

.nav-item.is-active .badge-shortcut {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.4);
}

.sidebar-bottom-block {
  margin-top: auto;
  padding-top: 0.65rem;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.sidebar-user-card {
  padding: 0.55rem 0.65rem;
  background: var(--p-surface-50);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.sidebar-user-card:hover {
  background: var(--p-brand-50);
  border-color: var(--p-brand-200);
}

.user-card-top {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.user-card-avatar {
  background: #ffffff !important;
  color: var(--p-brand-600) !important;
  border: 1px solid var(--p-brand-200);
  width: 32px !important;
  height: 32px !important;
  flex-shrink: 0;
}

.user-card-meta {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  overflow: hidden;
  flex: 1;
}

.user-card-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-card-role {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.user-card-role.is-admin {
  color: var(--p-gold-700);
}

.user-card-role i {
  font-size: 0.75rem;
}

.logout-icon-btn {
  width: 28px !important;
  height: 28px !important;
  color: #dc2626 !important;
  flex-shrink: 0;
  transition: all 0.15s ease !important;
}

.logout-icon-btn:hover {
  background: #fee2e2 !important;
  transform: scale(1.08);
}

.sidebar-footer {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.pwa-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.68rem;
  color: var(--text-secondary);
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  background: var(--p-brand-50);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xs);
}

.developer-copyright {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  font-size: 0.68rem;
  color: var(--text-muted);
  text-decoration: none;
  padding: 0.2rem 0.35rem;
  border-radius: var(--radius-xs);
  transition: all 0.2s ease;
}

.developer-copyright i {
  font-size: 0.82rem;
  color: #e1306c;
}

.developer-copyright:hover {
  background: var(--p-brand-50);
  color: var(--p-brand-700);
}

.developer-copyright strong {
  color: var(--text-secondary);
}
</style>
