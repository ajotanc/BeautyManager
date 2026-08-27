import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { authGuard } from './guards'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    redirect: '/pos'
  },
  {
    path: '/pos',
    name: 'pos',
    component: () => import('@/views/POSView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/products',
    name: 'products',
    component: () => import('@/views/ProductsView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/inventory',
    name: 'inventory',
    component: () => import('@/views/InventoryView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/sales',
    name: 'sales',
    component: () => import('@/views/SalesHistoryView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cash-register',
    name: 'cash-register',
    component: () => import('@/views/CashRegisterView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/pos'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(authGuard)

export default router
