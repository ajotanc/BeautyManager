# Agente de impressão (KNUP KP-IM607)

App Windows em Python com ícone na bandeja. Recebe bytes ESC/POS do Beauty Manager (`https://beauty.ajotanc.com.br`) em `127.0.0.1` e imprime direto na térmica, sem `window.print()`.

## Usar
1. Execute `BeautyPrintAgent.exe` (baixe em `/print-agent/BeautyPrintAgent.exe`). Ele inicia com o Windows (configurável).
2. Clique duas vezes no ícone da bandeja para abrir as **Configurações**: impressora, porta, sites autorizados, início automático, URL/SHA256 do driver.
3. **Instalar driver/impressora** baixa o driver (se `URL do driver` estiver preenchida; o site da Knup só publica em pasta OneDrive, sem link direto) e cria a impressora no Windows (pede administrador). Sem URL, usa o driver "Generic / Text Only", suficiente para RAW/ESC-POS.
4. No Beauty Manager: Configurações → Destino da Impressão → Impressora térmica direta.

Config em `%APPDATA%\BeautyPrintAgent\config.json`.

## API
- `GET /status` → `{ ok, printers[], printer }`
- `POST /print` `{ data: <base64 ESC/POS>, printer?: string }`

Só origens em "Sites autorizados" e rotas marcadas em "Rotas aceitas" são atendidas; as demais retornam 403/404. Também configuráveis: tamanho máximo do envio, log de requisições, abrir a janela ao iniciar.

## Build / desenvolvimento
`./build.ps1` gera o `.exe`. Para testar sem bandeja: `python agent.py --headless`.
