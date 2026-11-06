# Agente de impressão (KNUP KP-IM607)

App Windows em Python, com ícone na bandeja. Recebe bytes ESC/POS do Beauty Manager em `127.0.0.1` e imprime direto na térmica (modo RAW), sem `window.print()`.

## Usar

1. Gere o executável com `./build.ps1` (saída em `dist/BeautyPrintAgent.exe`) e abra-o. Ele inicia com o Windows (configurável).
2. Clique duas vezes no ícone da bandeja para abrir as **Configurações**. O **X** só fecha a janela; o botão **Fechar** encerra o agente.
3. **Instalar driver** cria a impressora no Windows (pede administrador). Com `URL do driver` preenchida, baixa o driver antes (confere o SHA256); sem URL, usa o driver "Generic / Text Only", que basta para RAW/ESC-POS. O site da Knup só publica drivers numa pasta OneDrive, sem link direto.
4. No site: **Configurações → Destino da Impressão → Impressora térmica direta**. É o padrão quando o agente é encontrado.

A impressora é escolhida pelo nome (KNUP/IM607) ou pelo que estiver em **Impressora de destino**. Nunca cai na impressora padrão do Windows, para não mandar ESC/POS para um PDF.

## Configurações

Salvas em `%APPDATA%\BeautyPrintAgent\config.json`. As mudanças valem na hora; só trocar a porta exige reiniciar.

| Aba | Campo | Para que serve |
|---|---|---|
| Impressora | Largura e margem (pontos) | 58 mm = 384 pontos no máximo. A margem esquerda (8 pontos = 1 mm) fica **dentro** da largura e centraliza o conteúdo. **Teste de largura** imprime uma moldura para medir. |
| Impressora | Modo do texto do cupom | **Texto** (padrão, nativo e sem acentos) ou **Imagem** (mantém acentos, mas as letras mudam). |
| Impressora | URL e SHA256 do driver | download automático do driver (opcional). |
| Corte e envio | Tipo de corte e espaço antes | Sem corte (padrão), parcial ou total; linhas em branco antes de cortar (padrão 0). Vale só para cupom. |
| Corte e envio | Gaveta de dinheiro | pulso ESC p ao imprimir o cupom (precisa da gaveta ligada na impressora). |
| Corte e envio | Novas tentativas | até 5 reenvios se a impressora não responder (padrão 2); a falha vai para o log. |
| Conexão | Porta | padrão 9101. |
| Conexão | Rotas aceitas | `GET /status` e `POST /print`; a desmarcada responde 404. |
| Conexão | Sites autorizados | um por linha, aceita curinga (`https://*.ajotanc.com.br`). Sem estar na lista: 403. |
| Conexão | Tamanho máximo do envio | padrão 4 MB (413 acima). |
| Sistema | Iniciar com o Windows, abrir a janela ao iniciar, log de requisições, botão **Ver log** | `agent.log` na mesma pasta do config; falhas de impressão são sempre gravadas. |

## API

- `GET /status` → `{ ok, printers[], printer, text_mode, paper_dots, left_margin_dots }`. O site lê isso antes de cada impressão.
- `POST /print` com `{ data: <base64 ESC/POS>, printer?: string }` → `{ ok, printer }`.

Erros: `403 origin_not_allowed`, `404 not_found`/`printer_not_found`, `400 invalid_payload`, `413 payload_too_large`, `500` com a causa do spooler.

## Desenvolvimento

```bash
python agent.py --headless     # sem bandeja, para depurar
python -m unittest discover -s . -p "test_*.py"   # testes (ou `pnpm test:agent` na raiz)
./build.ps1                    # gera o .exe (PyInstaller)
```

Dependências: `requirements.txt` (`pystray`, `pillow`; `pyinstaller` só no build). O `.exe` não vai para o repositório (`public/print-agent/` está no `.gitignore`).

## Observações da KP-IM607

- Não aceita acentos em texto; por isso o cupom e as etiquetas saem normalizados.
- Perde dados de imagens grandes enviadas de uma vez e reimprime as últimas linhas de uma imagem se receber `ESC J` logo depois dela. O site evita as duas coisas (texto nativo, quebras de linha comuns para avançar o papel).
- A posição horizontal do texto usa `ESC $`; uma linha em branco logo após o QR nativo deve ser só a quebra de linha, senão o QR desloca e não lê.
