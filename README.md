# Beauty Manager

Sistema de gestão para loja de cosméticos e variedades: estoque com markup dinâmico, frente de caixa (PDV) com leitor de código de barras, caixa diário, kits promocionais, clientes com fidelidade, histórico de vendas e impressão de cupom e etiquetas em impressora térmica.

**Stack:** Vue 3 + Vite + TypeScript, Pinia, Vue Router, PrimeVue, Tailwind CSS 4, Zod, Appwrite (TablesDB). PWA instalável.

## Começando

Requisitos: Node 20+, pnpm e uma instância Appwrite com o projeto configurado (`appwrite.json`).

```bash
pnpm install
cp .env.example .env   # ajuste endpoint, projeto e database
pnpm dev
```

| Script | O que faz |
|---|---|
| `pnpm dev` | servidor de desenvolvimento |
| `pnpm build` | confere os tipos (`vue-tsc`) e gera o `dist/` |
| `pnpm typecheck` | só a checagem de tipos |
| `pnpm test` | testes do site (Vitest) |
| `pnpm test:agent` | testes do agente de impressão (Python, `unittest`) |

### Variáveis de ambiente

Um único `.env` na raiz (`.env.example` mostra todas). Só as variáveis `VITE_*` chegam ao navegador; **`APPWRITE_API_KEY` nunca vai para o front**.

## Estrutura

```text
src/
├── components/   componentes por área (pos, products, kits, customers, cash, common, layout)
├── composables/  lógica reutilizável (impressão, fidelidade, leitor de código, atalhos do PDV)
├── services/     acesso ao Appwrite, um arquivo por tabela
├── stores/       Pinia (PDV, caixa, produtos, kits, clientes, configurações, auth)
├── schemas/      validação com Zod
├── router/       rotas e guarda de autenticação
├── types/        tipos do domínio
├── utils/        moeda, datas, máscaras, ESC/POS, cupom
└── views/        telas
print-agent/      agente local de impressão (Python)
appwrite.json     tabelas, permissões e configurações do projeto Appwrite
```

Código e rotas em inglês; textos exibidos e comentários em português.

## Dados e segurança (Appwrite)

Tabelas: `products`, `categories`, `brands`, `inventory_transactions`, `sales`, `sale_items`, `cash_register`, `customers`, `kits`, `kit_items` e `settings`. Valores monetários são guardados como texto decimal (`"3.50"`) e lidos por `toNumber`.

- Todas as tabelas dão acesso a `Role.users()`. **Qualquer sessão (inclusive anônima) é "users"**; por isso a autenticação anônima fica **desligada** em `appwrite.json` (`auth.methods.anonymous: false`). Depois de alterar o arquivo, aplique no servidor: `appwrite push settings`.
- A função `whatsapp-ai` (mensagens com Gemini) só executa para usuários logados (`execute: ["users"]`) e corta os textos de entrada em 100 caracteres. Aplique com `appwrite push functions`.
- As telas administrativas são restritas por papel **só no navegador** (`requiresAdmin` no router). Para restrição real no servidor, use Teams e permissões por papel nas tabelas.
- A coluna `settings.loyalty_milestone` (meta de fidelidade) precisa existir no banco; está em `appwrite.json`. Aplique com `appwrite push tables`.

## Impressão

Cupom e etiquetas saem de dois jeitos, escolhidos em **Configurações → Destino da Impressão** (por navegador):

1. **Navegador:** abre a janela de impressão (`window.print()`); a etiqueta usa folha A4 de 96 etiquetas (31 × 17 mm).
2. **Impressora térmica direta:** o site monta os comandos ESC/POS e envia ao **agente local** (`print-agent/`), que imprime sem abrir diálogo. É o padrão assim que o agente é encontrado.
   - **Logo da loja (opcional):** enviada em Configurações para o bucket `logos` (só usuários logados) e impressa no topo do cupom; sem logo, o cupom sai como antes.

O texto na térmica sai **sem acentos** (`ç→c`, `ã→a`), porque a KNUP KP-IM607 não aceita acentos como texto; o QR e o código de barras (EAN-13) usam os comandos da própria impressora. Instalação, configuração e API do agente: [print-agent/README.md](print-agent/README.md).

## MCP do Appwrite (ferramentas de IA)

`.mcp.json` liga o servidor MCP do Appwrite por `scripts/mcp-appwrite.mjs`, que lê `VITE_APPWRITE_ENDPOINT`, `VITE_APPWRITE_PROJECT_ID` e `APPWRITE_API_KEY` do `.env` e roda `uvx mcp-server-appwrite`. A chave nunca fica no `.mcp.json`.

1. No console do Appwrite, crie uma chave de API só com os escopos necessários (comece só com leitura: tabelas, funções, usuários e times).
2. Adicione `APPWRITE_API_KEY=...` ao `.env` (ele não vai para o git) e reinicie a ferramenta de IA.

## Testes

`pnpm test` cobre moeda, ESC/POS (texto, código de barras, etiquetas, cupom), fidelidade e o estado do agente no site. `pnpm test:agent` cobre origens autorizadas, rotas, limites e a escolha da impressora no agente.

## Deploy

`netlify.toml` publica o `dist/` com redirecionamento de SPA. Após o deploy, o site precisa estar em **Sites autorizados** do agente de cada computador com impressora.
