<template>
  <aside class="app-sidebar">
    <nav class="sidebar-nav">
      <!-- Seção Operacional (Para todos) -->
      <div class="nav-group">
        <span class="group-label">ATENDIMENTO & VENDAS</span>
        
        <router-link to="/checkout" class="nav-item" active-class="is-active">
          <i class="ri-shopping-bag-3-line"></i>
          <span>Frente de Caixa</span>
          <span class="badge-shortcut">F1</span>
        </router-link>

        <router-link to="/cashier" class="nav-item" active-class="is-active">
          <i class="ri-wallet-3-line"></i>
          <span>Caixa Diário</span>
          <span class="badge-shortcut">F2</span>
        </router-link>

        <router-link to="/sales" class="nav-item" active-class="is-active">
          <i class="ri-file-list-3-line"></i>
          <span>Vendas</span>
          <span class="badge-shortcut">F3</span>
        </router-link>
      </div>

      <!-- Seção Administrativa / Gestão (Apenas role: admin) -->
      <div v-if="authStore.isAdmin" class="nav-group">
        <span class="group-label">GESTÃO & CONTROLE</span>

        <router-link to="/dashboard" class="nav-item" active-class="is-active">
          <i class="ri-dashboard-3-line"></i>
          <span>Dashboard</span>
          <span class="badge-shortcut">F4</span>
        </router-link>

        <router-link to="/products" class="nav-item" active-class="is-active">
          <i class="ri-price-tag-3-line"></i>
          <span>Produtos</span>
          <span class="badge-shortcut">F5</span>
        </router-link>

        <router-link to="/customers" class="nav-item" active-class="is-active">
          <i class="ri-user-heart-line"></i>
          <span>Clientes</span>
          <span class="badge-shortcut">F6</span>
        </router-link>

        <router-link to="/inventory" class="nav-item" active-class="is-active">
          <i class="ri-archive-line"></i>
          <span>Estoque</span>
          <span class="badge-shortcut">F7</span>
        </router-link>

        <router-link to="/settings" class="nav-item" active-class="is-active">
          <i class="ri-settings-4-line"></i>
          <span>Configurações</span>
          <span class="badge-shortcut">F8</span>
        </router-link>
      </div>
    </nav>

    <!-- Versão / Info rodapé -->
    <div class="sidebar-footer">
      <div class="pwa-badge">
        <i class="ri-store-3-line"></i>
        <span>Beauty Manager v1.0</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
</script>

<style scoped>
.app-sidebar {
  width: 256px;
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.25rem 0.85rem;
  flex-shrink: 0;
  min-height: calc(100vh - 61px);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.group-label {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--text-muted);
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
  color: var(--p-brand-600);
  transition: transform 0.2s ease;
}

.nav-item:hover {
  background: var(--p-brand-50);
  color: var(--p-brand-900);
  transform: translateX(3px);
}

.nav-item:hover i {
  transform: scale(1.1);
}

.nav-item.is-active {
  background: var(--grad-primary);
  color: #ffffff;
  box-shadow: var(--shadow-sm);
}

.nav-item.is-active i {
  color: #ffffff;
}

.badge-shortcut {
  margin-left: auto;
  font-size: 0.68rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.22);
  padding: 0.1rem 0.4rem;
  border-radius: var(--radius-xs);
}

.sidebar-footer {
  padding-top: 1rem;
  border-top: 1px solid var(--border-subtle);
}

.pwa-badge {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 600;
  padding: 0.45rem 0.75rem;
  background: var(--p-brand-50);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}
</style>
