<template>
  <div class="login-page">
    <div class="login-card glass-panel">
      <!-- Logo da Marca -->
      <div class="login-header text-center">
        <div class="logo-wrapper">
          <div class="logo-circle">
            <img src="/images/bm.svg" alt="Beauty Manager" class="login-logo" />
          </div>
        </div>
        <h1 class="system-title">Beauty Manager</h1>
        <p class="system-tagline">Gestão & Frente de Caixa para Cosméticos e Variedades</p>
      </div>

      <!-- Formulário de Login -->
      <Fluid>
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="field-item">
            <FloatLabel variant="in">
              <InputText
                id="login_email"
                v-model="email"
                type="email"
                size="small"
                fluid
                :invalid="!!errors.email"
                autofocus
              />
              <label for="login_email">E-mail de Acesso *</label>
            </FloatLabel>
            <Message v-if="errors.email" severity="error" size="small" variant="simple">
              {{ errors.email }}
            </Message>
          </div>

          <div class="field-item">
            <FloatLabel variant="in">
              <InputText
                id="login_password"
                v-model="password"
                type="password"
                size="small"
                fluid
                :invalid="!!errors.password"
              />
              <label for="login_password">Senha de Acesso *</label>
            </FloatLabel>
            <Message v-if="errors.password" severity="error" size="small" variant="simple">
              {{ errors.password }}
            </Message>
          </div>

          <Button
            type="submit"
            label="Entrar no Sistema"
            icon="ri-login-box-line"
            severity="primary"
            size="small"
            :loading="isLoading"
            class="submit-login-btn"
          />
        </form>
      </Fluid>

      <!-- Rodapé / Dica Local -->
      <div class="login-footer">
        <div class="local-badge">
          <i class="ri-shield-check-line"></i>
          <span>Ambiente Seguro • Modo PDV Ativo</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import FloatLabel from 'primevue/floatlabel'
import Message from 'primevue/message'
import Fluid from 'primevue/fluid'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from 'primevue/usetoast'
import { parseErrorMessage } from '@/types/errors'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres')
})

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

const email = ref<string>('')
const password = ref<string>('')
const isLoading = ref<boolean>(false)
const errors = reactive<Record<string, string>>({})

function clearErrors(): void {
  Object.keys(errors).forEach((key) => delete errors[key])
}

async function handleLogin(): Promise<void> {
  clearErrors()

  const validation = loginSchema.safeParse({
    email: email.value,
    password: password.value
  })

  if (!validation.success) {
    validation.error.issues.forEach((err) => {
      const field = String(err.path[0])
      if (field) {
        errors[field] = err.message
      }
    })
    return
  }

  isLoading.value = true
  try {
    await authStore.login({
      email: validation.data.email,
      password: validation.data.password
    })

    toast.add({
      severity: 'success',
      summary: 'Bem-vinda!',
      detail: `Olá, ${authStore.userName}! Login realizado com sucesso.`,
      life: 3000
    })

    const redirectPath = (route.query.redirect as string) || '/pos'
    router.push(redirectPath)
  } catch (error: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Falha no Login',
      detail: parseErrorMessage(error),
      life: 4000
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, var(--p-brand-100), var(--p-brand-50), #ffffff);
  padding: 1.5rem;
}

.login-card {
  width: 100%;
  max-width: 440px;
  padding: 2.5rem 2.2rem;
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  box-shadow: var(--shadow-lg);
}

.login-header {
  text-align: center;
}

.logo-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 0.85rem;
}

.logo-circle {
  width: 58px;
  height: 58px;
  border-radius: var(--radius-lg);
  background: var(--grad-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.login-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.system-title {
  font-family: var(--font-title);
  font-size: 1.7rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
  letter-spacing: -0.02em;
}

.system-tagline {
  font-size: 0.82rem;
  color: var(--text-secondary);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.submit-login-btn {
  margin-top: 0.5rem;
  padding: 0.75rem;
  font-weight: 700;
  font-size: 0.98rem;
}

.login-footer {
  display: flex;
  justify-content: center;
  border-top: 1px dashed var(--border-color);
  padding-top: 1.25rem;
}

.local-badge {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--p-brand-50);
  padding: 0.4rem 0.85rem;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-color);
}
</style>
