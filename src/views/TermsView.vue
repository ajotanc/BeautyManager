<template>
  <div class="min-h-screen bg-(--bg-body,#fff) px-4 py-8">
    <main id="main-content" class="mx-auto max-w-3xl">
      <h1 class="text-2xl font-bold mb-1">Termos de Serviço</h1>
      <p class="text-sm opacity-70 mb-6">Versão 1.0 • Atualizada em 05/11/2026</p>

      <section class="mb-5">
        <h2 class="text-lg font-semibold mb-1">O que é</h2>
        <p>O Beauty Manager é um sistema de gestão de estoque, frente de caixa e relacionamento para lojas de cosméticos e variedades, de uso restrito a usuários autorizados pela loja. Responsável: Alerson Jorge (ajotanc@gmail.com).</p>
      </section>

      <section class="mb-5">
        <h2 class="text-lg font-semibold mb-1">O que não é</h2>
        <p>Os cupons emitidos são <strong>não fiscais</strong> e não substituem nota fiscal. O sistema não presta consultoria contábil, tributária ou financeira.</p>
      </section>

      <section class="mb-5">
        <h2 class="text-lg font-semibold mb-1">Uso</h2>
        <p>Cada usuário responde pelas credenciais que recebe e pelas operações feitas com elas. É proibido tentar acessar dados sem permissão.</p>
      </section>

      <section class="mb-5">
        <h2 class="text-lg font-semibold mb-1">Custo e reembolso</h2>
        <p>O sistema é de uso interno e gratuito para os usuários; não há cobrança nem política de reembolso aplicável.</p>
      </section>

      <section class="mb-5">
        <h2 class="text-lg font-semibold mb-1">Privacidade</h2>
        <p>O tratamento de dados está descrito na <router-link to="/privacy" class="underline">Política de Privacidade</router-link>.</p>
      </section>

      <router-link to="/login" class="underline">Voltar</router-link>
    </main>
  </div>
</template>
