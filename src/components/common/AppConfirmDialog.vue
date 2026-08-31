<template>
  <ConfirmDialog :pt="{ root: { class: 'gap-3 p-6 w-md max-w-[90vw] border border-[var(--border-color)]' } }">
    <template #container="{ message, acceptCallback, rejectCallback }">
      <div class="header-section">
        <div v-if="message.icon" class="header-icon-box" :class="[
          message.acceptProps?.severity === 'danger' ? 'is-error' : '',
          message.acceptProps?.severity === 'warn' ? 'is-warning' : '',
          message.acceptProps?.severity === 'success' ? 'is-success' : '',
          message.acceptProps?.severity === 'info' ? 'is-info' : ''
        ]">
          <i :class="message.icon"></i>
        </div>
        <h3 class="header-title">{{ message.header }}</h3>
      </div>

      <div class="message-section">
        <p>{{ message.message }}</p>
      </div>

      <div class="footer-section">
        <Button size="small" v-bind="message.rejectProps" @click="rejectCallback" />
        <Button size="small" v-bind="message.acceptProps" @click="acceptCallback" />
      </div>
    </template>
  </ConfirmDialog>
</template>

<script setup lang="ts">
import ConfirmDialog from 'primevue/confirmdialog'
import Button from 'primevue/button'
</script>

<style scoped>
.header-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-title {
  font-family: var(--font-title);
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.2;
}

.message-section {
  padding: 0.25rem 0;
}

.message-section p {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0;
}

.footer-section {
  display: flex;
  justify-content: flex-end;
  gap: 0.625rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-subtle);
}
</style>
