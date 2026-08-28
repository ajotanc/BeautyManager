<template>
  <header class="app-navbar">
    <div class="navbar-left">
      <!-- Botão Hamburger para Mobile / Tablet -->
      <Button
        icon="ri-menu-2-line"
        severity="secondary"
        variant="text"
        size="small"
        class="mobile-menu-btn"
        aria-label="Abrir Menu"
        @click="toggleMobileSidebar"
      />

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
        class="register-status-tag"
      />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import { useCashRegisterStore } from '@/stores/cashRegisterStore'
import { useLayout } from '@/composables/useLayout'

const cashRegisterStore = useCashRegisterStore()
const { toggleMobileSidebar } = useLayout()

const isRegisterOpen = computed(() => cashRegisterStore.isRegisterOpen)
</script>

<style scoped>
.app-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  background: var(--bg-card);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 50;
  box-shadow: var(--shadow-xs);
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.mobile-menu-btn {
  display: none;
}

@media (max-width: 1024px) {
  .mobile-menu-btn {
    display: inline-flex !important;
  }
}

.brand-badge {
  display: flex;
  align-items: center;
  gap: 0.65rem;
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
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
}

.logo-circle:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-sm);
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
  font-size: 1.1rem;
  color: var(--text-primary);
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.brand-subtitle {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-weight: 600;
  letter-spacing: 0.02em;
}

@media (max-width: 640px) {
  .brand-subtitle {
    display: none;
  }
  .app-navbar {
    padding: 0.6rem 0.85rem;
  }
  .navbar-left {
    gap: 0.6rem;
  }
}
</style>
