"""Agente local de impressão do Beauty Manager.

Recebe bytes ESC/POS por HTTP (somente 127.0.0.1) e envia em modo RAW para a impressora
térmica (KNUP KP-IM607). Fica na bandeja do Windows, com janela de configurações e
início automático com o sistema.
"""
import base64
import ctypes
import fnmatch
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import threading
import urllib.request
import winreg
from datetime import datetime
import zipfile
from ctypes import wintypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

APP_NAME = "BeautyPrintAgent"
CONFIG_PATH = Path(os.environ.get("APPDATA", str(Path.home()))) / APP_NAME / "config.json"
ROUTES = {"/status": "GET /status (listar impressoras)", "/print": "POST /print (imprimir)"}
RUN_KEY = r"Software\Microsoft\Windows\CurrentVersion\Run"

DEFAULTS = {
    "port": 9101,
    "printer_name": "",
    "text_mode": "native",
    "paper_dots": 384,  # KP-IM607 é 58 mm: 384 pontos úteis
    "left_margin_dots": 0,
    "allowed_origins": [
        "https://*.ajotanc.com.br",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    "allowed_routes": list(ROUTES),
    "max_payload_mb": 4,
    "log_requests": False,
    "autostart": True,
    "open_settings_on_start": False,
    "printer_install_name": "KNUP KP-IM607",
    "driver_url": "",
    "driver_sha256": "",
    "driver_name": "",
}


def load_config() -> dict:
    cfg = dict(DEFAULTS)
    try:
        cfg.update(json.loads(CONFIG_PATH.read_text(encoding="utf-8")))
    except (OSError, ValueError):
        pass
    return cfg


def save_config(cfg: dict) -> None:
    CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    CONFIG_PATH.write_text(json.dumps(cfg, indent=2, ensure_ascii=False), encoding="utf-8")


# ---------- Windows: spooler (impressão RAW) ----------
winspool = ctypes.WinDLL("winspool.drv", use_last_error=True)


class DocInfo1(ctypes.Structure):
    _fields_ = [("pDocName", wintypes.LPWSTR), ("pOutputFile", wintypes.LPWSTR), ("pDatatype", wintypes.LPWSTR)]


class PrinterInfo4(ctypes.Structure):
    _fields_ = [("pPrinterName", wintypes.LPWSTR), ("pServerName", wintypes.LPWSTR), ("Attributes", wintypes.DWORD)]


def list_printers() -> list[str]:
    needed, returned = wintypes.DWORD(), wintypes.DWORD()
    flags = 2 | 4  # PRINTER_ENUM_LOCAL | PRINTER_ENUM_CONNECTIONS
    winspool.EnumPrintersW(flags, None, 4, None, 0, ctypes.byref(needed), ctypes.byref(returned))
    if needed.value == 0:
        return []
    buf = ctypes.create_string_buffer(needed.value)
    if not winspool.EnumPrintersW(flags, None, 4, buf, needed, ctypes.byref(needed), ctypes.byref(returned)):
        return []
    items = ctypes.cast(buf, ctypes.POINTER(PrinterInfo4))
    return [items[i].pPrinterName for i in range(returned.value)]


def default_printer() -> str | None:
    size = wintypes.DWORD(0)
    winspool.GetDefaultPrinterW(None, ctypes.byref(size))
    if size.value == 0:
        return None
    buf = ctypes.create_unicode_buffer(size.value)
    return buf.value if winspool.GetDefaultPrinterW(buf, ctypes.byref(size)) else None


def resolve_printer(cfg: dict, requested: str | None = None) -> str | None:
    """Impressora pedida, senão a configurada, senão KNUP/IM607. Nunca cai na padrão do Windows:
    bytes ESC/POS numa impressora comum (ex.: PDF) só geram lixo."""
    names = list_printers()
    if requested:
        return requested if requested in names else None
    if cfg["printer_name"] in names:
        return cfg["printer_name"]
    for name in names:
        if re.search(r"IM607|KNUP", name, re.I):
            return name
    return None


def text_test_bytes() -> bytes:
    """ESC/POS de teste: texto simples (ASCII), com o modo chinês (FS .) desligado."""
    return b"\x1b@\x1c.Beauty Manager\nTeste de impressao OK\n\n\n\n\x1d\x56\x01"


def width_test_bytes(dots: int, margin: int = 0) -> bytes:
    """Moldura da área útil (largura total - margem esquerda), com régua a cada 96 pontos, para medir o papel."""
    from PIL import Image, ImageDraw, ImageOps

    height = 90
    img = Image.new("L", (dots, height), 255)
    draw = ImageDraw.Draw(img)
    draw.rectangle((margin, 0, dots - 1, height - 1), outline=0, width=4)
    for x in range(96, dots - margin, 96):
        draw.line((margin + x, 0, margin + x, 24), fill=0, width=2)
    draw.text((margin + 12, 40), f"largura {dots}, margem {margin}", fill=0)
    row_bytes = (dots + 7) // 8
    bitmap = ImageOps.invert(img).convert("1").tobytes()  # 1 = ponto preto
    header = b"\x1d\x76\x30\x00" + row_bytes.to_bytes(2, "little") + height.to_bytes(2, "little")
    return b"\x1b@\x1c." + header + bitmap + b"\n\n\n\x1d\x56\x01"


def send_raw(printer: str, data: bytes) -> None:
    handle = wintypes.HANDLE()
    if not winspool.OpenPrinterW(printer, ctypes.byref(handle), None):
        raise OSError(f"OpenPrinter falhou ({ctypes.get_last_error()})")
    try:
        if not winspool.StartDocPrinterW(handle, 1, ctypes.byref(DocInfo1("Beauty Manager", None, "RAW"))):
            raise OSError(f"StartDocPrinter falhou ({ctypes.get_last_error()})")
        try:
            winspool.StartPagePrinter(handle)
            written = wintypes.DWORD()
            if not winspool.WritePrinter(handle, data, len(data), ctypes.byref(written)) or written.value != len(data):
                raise OSError(f"WritePrinter falhou ({ctypes.get_last_error()})")
            winspool.EndPagePrinter(handle)
        finally:
            winspool.EndDocPrinter(handle)
    finally:
        winspool.ClosePrinter(handle)


# ---------- Início automático e instalação de driver ----------
def resource_path(name: str) -> Path:
    """Arquivo empacotado no exe (PyInstaller) ou ao lado do script."""
    return Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent)) / name


def launch_command() -> str:
    if getattr(sys, "frozen", False):
        return f'"{sys.executable}"'
    return f'"{sys.executable.replace("python.exe", "pythonw.exe")}" "{Path(__file__).resolve()}"'


def set_autostart(enabled: bool) -> None:
    with winreg.OpenKey(winreg.HKEY_CURRENT_USER, RUN_KEY, 0, winreg.KEY_SET_VALUE) as key:
        if enabled:
            winreg.SetValueEx(key, APP_NAME, 0, winreg.REG_SZ, launch_command())
        else:
            try:
                winreg.DeleteValue(key, APP_NAME)
            except FileNotFoundError:
                pass


def install_printer(cfg: dict) -> str:
    """Baixa o driver (se configurado) e cria a impressora no Windows. Pede administrador (UAC)."""
    work = Path(tempfile.mkdtemp(prefix="bm-driver-"))
    lines = ["$ErrorActionPreference='Stop'"]
    driver = cfg["driver_name"] or "Generic / Text Only"  # RAW/ESC-POS não depende do driver do fabricante
    if cfg["driver_url"]:
        # O nome do arquivo vai para um script de administrador: nunca usa o texto da URL, só a extensão permitida.
        suffix = Path(cfg["driver_url"].split("?")[0]).suffix.lower()
        if suffix not in (".zip", ".exe"):
            raise ValueError("A URL do driver deve apontar para um arquivo .zip ou .exe.")
        file = work / f"driver{suffix}"
        urllib.request.urlretrieve(cfg["driver_url"], file)
        if cfg["driver_sha256"]:
            if hashlib.sha256(file.read_bytes()).hexdigest().lower() != cfg["driver_sha256"].lower():
                raise ValueError("SHA256 do driver não confere; instalação abortada.")
        if file.suffix.lower() == ".zip":
            with zipfile.ZipFile(file) as z:
                z.extractall(work / "x")
            lines.append(f"Get-ChildItem '{work / 'x'}' -Recurse -Filter *.inf | ForEach-Object {{ pnputil /add-driver $_.FullName /install | Out-Null }}")
        else:
            lines.append(f"Start-Process '{file}' -ArgumentList '/S' -Wait")  # assume instalador silencioso /S
    name = cfg["printer_install_name"].replace("'", "")
    safe_driver = driver.replace("'", "")
    result_file = work / "result.txt"
    body = chr(10).join(lines)
    script_text = f"""
try {{
{body}
  $port = Get-PrinterPort | Where-Object Name -match '^USB[0-9]+' | Select-Object -First 1
  if (-not $port) {{
    $usb = (Get-PnpDevice -PresentOnly -ErrorAction SilentlyContinue | Where-Object {{ $_.InstanceId -like 'USB*' -and $_.FriendlyName -match 'IM607|KNUP|KP-|Print|POS|Thermal' }} | ForEach-Object FriendlyName) -join ', '
    throw "Windows nao criou porta USB de impressora. Dispositivos USB parecidos: [$usb]. Ligue/religue a impressora e instale o driver do fabricante (preencha a URL do driver)."
  }}
  if (-not (Get-PrinterDriver -Name '{safe_driver}' -ErrorAction SilentlyContinue)) {{
    Add-PrinterDriver -Name '{safe_driver}'
  }}
  if (-not (Get-Printer -Name '{name}' -ErrorAction SilentlyContinue)) {{
    Add-Printer -Name '{name}' -DriverName '{safe_driver}' -PortName $port.Name
  }}
  'OK' | Set-Content -Encoding UTF8 '{result_file}'
}} catch {{
  ('ERRO: ' + $_.Exception.Message) | Set-Content -Encoding UTF8 '{result_file}'
}}
"""
    script = work / "install.ps1"
    script.write_text(script_text, encoding="utf-8")
    run = subprocess.run(
        ["powershell", "-NoProfile", "-Command",
         f"Start-Process powershell -Verb RunAs -Wait -WindowStyle Hidden -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File','{script}'"],
        capture_output=True, text=True,
    )
    if run.returncode != 0:
        return f"Não foi possível executar como administrador: {run.stderr.strip() or 'UAC cancelado.'}"
    if not result_file.exists():
        return "O instalador não retornou resultado (UAC cancelado ou bloqueado)."
    outcome = result_file.read_text(encoding="utf-8-sig").strip()
    if outcome == "OK" and any(n == cfg["printer_install_name"] for n in list_printers()):
        return f"Impressora '{cfg['printer_install_name']}' instalada."
    return outcome if outcome != "OK" else "O Windows não listou a impressora após a instalação."


def origin_allowed(origin: str | None, patterns: list[str]) -> bool:
    """Sem Origin (curl, teste local) passa; com Origin, só se casar com algum padrão (aceita curinga *)."""
    return origin is None or any(fnmatch.fnmatchcase(origin, p) for p in patterns)


# ---------- Servidor HTTP ----------
class Handler(BaseHTTPRequestHandler):
    cfg: dict = {}

    def log_message(self, *_args) -> None:
        pass

    def _log(self, message: str) -> None:
        if not self.cfg["log_requests"]:
            return
        log = CONFIG_PATH.parent / "agent.log"
        if log.exists() and log.stat().st_size > 1024 * 1024:
            log.unlink()
        with log.open("a", encoding="utf-8") as f:
            f.write(f"{datetime.now():%Y-%m-%d %H:%M:%S} {self.client_address[0]} {message}\n")

    def _route_ok(self) -> bool:
        return self.path in self.cfg["allowed_routes"]

    def _origin_ok(self) -> bool:
        return origin_allowed(self.headers.get("Origin"), self.cfg["allowed_origins"])

    def _reply(self, status: int, body: dict | None = None) -> None:
        raw = json.dumps(body).encode() if body is not None else b""
        self._log(f"{self.command} {self.path} Origin={self.headers.get('Origin')} -> {status}")
        self.send_response(status)
        origin = self.headers.get("Origin")
        if origin and self._origin_ok():
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self) -> None:
        self._reply(204 if self._origin_ok() else 403)

    def do_GET(self) -> None:
        if not self._origin_ok():
            return self._reply(403, {"ok": False, "error": "origin_not_allowed"})
        if self.path != "/status" or not self._route_ok():
            return self._reply(404, {"ok": False, "error": "not_found"})
        self._reply(200, {"ok": True, "printers": list_printers(), "printer": resolve_printer(self.cfg), "text_mode": self.cfg["text_mode"], "paper_dots": int(self.cfg["paper_dots"]), "left_margin_dots": int(self.cfg["left_margin_dots"])})

    def do_POST(self) -> None:
        if not self._origin_ok():
            return self._reply(403, {"ok": False, "error": "origin_not_allowed"})
        if self.path != "/print" or not self._route_ok():
            return self._reply(404, {"ok": False, "error": "not_found"})
        length = int(self.headers.get("Content-Length") or 0)
        if length > int(self.cfg["max_payload_mb"]) * 1024 * 1024:
            return self._reply(413, {"ok": False, "error": "payload_too_large"})
        try:
            body = json.loads(self.rfile.read(length))
            data = base64.b64decode(body["data"], validate=True)
        except (ValueError, KeyError, TypeError):
            return self._reply(400, {"ok": False, "error": "invalid_payload"})
        printer = resolve_printer(self.cfg, body.get("printer"))
        if not printer:
            return self._reply(404, {"ok": False, "error": "printer_not_found"})
        try:
            send_raw(printer, data)
        except OSError as err:
            return self._reply(500, {"ok": False, "error": str(err)})
        self._reply(200, {"ok": True, "printer": printer})


def start_server(cfg: dict) -> ThreadingHTTPServer:
    Handler.cfg = cfg
    server = ThreadingHTTPServer(("127.0.0.1", int(cfg["port"])), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


# ---------- Interface: janela de configurações e bandeja ----------
_settings_open = threading.Lock()
_tray_icon = None  # ícone da bandeja ativo (None em --headless)


def quit_agent() -> None:
    """Encerra o agente de vez: tira o ícone da bandeja e o processo termina."""
    if _tray_icon is not None:
        _tray_icon.stop()
    else:
        os._exit(0)


BRAND = "#fd0054"
BRAND_DARK = "#d90046"
BG = "#f5f5f7"
CARD = "#ffffff"
LINE = "#e5e7eb"
TEXT = "#1f2330"
MUTED = "#6b7280"
OK_COLOR = "#16a34a"
ERR_COLOR = "#dc2626"
FONT = "Segoe UI"


def open_settings(cfg: dict) -> None:
    if not _settings_open.acquire(blocking=False):
        return
    import tkinter as tk
    from tkinter import messagebox, ttk

    root = tk.Tk()
    root.title("Beauty Manager — Agente de impressão")
    root.configure(bg=BG)
    root.iconbitmap(str(resource_path("icon.ico")))
    root.resizable(False, False)

    style = ttk.Style(root)
    style.theme_use("clam")
    style.configure(".", font=(FONT, 10), background=CARD, foreground=TEXT)
    style.configure("TFrame", background=CARD)
    style.configure("TLabel", background=CARD, foreground=TEXT)
    style.configure("Muted.TLabel", foreground=MUTED, font=(FONT, 9))
    style.configure("Field.TLabel", font=(FONT, 9, "bold"))
    style.configure("TCheckbutton", background=CARD, focuscolor=CARD)
    style.map("TCheckbutton", background=[("active", CARD)])
    style.configure("TEntry", fieldbackground="white", bordercolor=LINE, lightcolor=LINE, darkcolor=LINE, padding=5)
    style.configure("TCombobox", fieldbackground="white", bordercolor=LINE, lightcolor=LINE, darkcolor=LINE, padding=5)
    style.configure("TSpinbox", fieldbackground="white", bordercolor=LINE, lightcolor=LINE, darkcolor=LINE, padding=5,
                    arrowcolor=BRAND, background="#fff0f4", arrowsize=14)
    style.map("TSpinbox", background=[("active", "#ffe0e8")])
    # Seta do dropdown na cor da marca, com botão suave
    style.configure("TCombobox", arrowcolor=BRAND, background="#fff0f4", arrowsize=18)
    style.map("TCombobox", background=[("active", "#ffe0e8"), ("readonly", "#fff0f4")], arrowcolor=[("active", BRAND_DARK)],
              fieldbackground=[("readonly", "white")])
    root.option_add("*TCombobox*Listbox.font", (FONT, 10))
    root.option_add("*TCombobox*Listbox.selectBackground", BRAND)
    root.option_add("*TCombobox*Listbox.selectForeground", "white")
    style.configure("TNotebook", background=BG, borderwidth=0, tabmargins=(0, 0, 0, 0))
    style.configure("TNotebook.Tab", background=BG, foreground=MUTED, padding=(18, 9), font=(FONT, 10, "bold"), borderwidth=0)
    style.map("TNotebook.Tab", background=[("selected", CARD)], foreground=[("selected", BRAND)])
    # clam aumenta a aba selecionada; fixa o mesmo tamanho para todas
    style.map("TNotebook.Tab", expand=[("selected", [0, 0, 0, 0])], padding=[("selected", (18, 9)), ("!selected", (18, 9))])
    style.configure("Accent.TButton", background=BRAND, foreground="white", padding=(16, 8), borderwidth=0, font=(FONT, 10, "bold"))
    style.map("Accent.TButton", background=[("active", BRAND_DARK), ("pressed", BRAND_DARK)])
    style.configure("Soft.TButton", background="#fff0f4", foreground=BRAND, padding=(14, 8), borderwidth=0, font=(FONT, 10, "bold"))
    style.map("Soft.TButton", background=[("active", "#ffe0e8")])
    style.configure("Plain.TButton", background="#eceef2", foreground=TEXT, padding=(14, 8), borderwidth=0)
    style.map("Plain.TButton", background=[("active", "#dfe2e8")])

    # ---- Cabeçalho com status ao vivo da impressora ----
    header = tk.Frame(root, bg=BRAND)
    header.pack(fill="x")
    titles = tk.Frame(header, bg=BRAND)
    titles.pack(side="left", padx=20, pady=14)
    tk.Label(titles, text="Beauty Manager", bg=BRAND, fg="white", font=(FONT, 16, "bold")).pack(anchor="w")
    tk.Label(titles, text="Agente de impressão térmica", bg=BRAND, fg="#ffd1de", font=(FONT, 9)).pack(anchor="w")
    pill = tk.Label(header, bg="white", font=(FONT, 9, "bold"), padx=12, pady=5)
    pill.pack(side="right", padx=20)

    printer_var = tk.StringVar(value=cfg["printer_name"] or resolve_printer(cfg) or "")
    mode_labels = {"native": "Texto (sem acentos: ç vira c)", "image": "Imagem (com acentos)"}
    mode_var = tk.StringVar(value=mode_labels.get(cfg["text_mode"], mode_labels["native"]))
    dots_var = tk.StringVar(value=str(cfg["paper_dots"]))
    margin_var = tk.StringVar(value=str(cfg["left_margin_dots"]))
    port_var = tk.StringVar(value=str(cfg["port"]))
    payload_var = tk.StringVar(value=str(cfg["max_payload_mb"]))
    auto_var = tk.BooleanVar(value=cfg["autostart"])
    open_var = tk.BooleanVar(value=cfg["open_settings_on_start"])
    log_var = tk.BooleanVar(value=cfg["log_requests"])
    url_var = tk.StringVar(value=cfg["driver_url"])
    sha_var = tk.StringVar(value=cfg["driver_sha256"])
    route_vars = {r: tk.BooleanVar(value=r in cfg["allowed_routes"]) for r in ROUTES}

    def refresh_status(*_args) -> None:
        names = list_printers()
        chosen = printer_var.get().strip()
        found = chosen if chosen in names else resolve_printer(cfg)
        if found:
            pill.configure(text=f"●  {found}", fg=OK_COLOR)
        else:
            pill.configure(text="●  Nenhuma impressora térmica", fg=ERR_COLOR)

    # ---- Abas ----
    tabs = ttk.Notebook(root)
    tabs.pack(fill="both", expand=True, padx=14, pady=(12, 0))

    def new_tab(title: str) -> ttk.Frame:
        outer = tk.Frame(tabs, bg=CARD, highlightthickness=1, highlightbackground=LINE)
        tabs.add(outer, text=title)
        inner = ttk.Frame(outer, padding=18)
        inner.pack(fill="both", expand=True)
        inner.columnconfigure(0, weight=1)
        return inner

    def field(parent: ttk.Frame, row: int, label: str, hint: str, widget) -> None:
        ttk.Label(parent, text=label, style="Field.TLabel").grid(row=row * 3, column=0, sticky="w")
        if hint:
            ttk.Label(parent, text=hint, style="Muted.TLabel", wraplength=470).grid(row=row * 3 + 1, column=0, sticky="w")
        widget.grid(row=row * 3 + 2, column=0, sticky="ew", pady=(4, 14))

    # Aba 1: Impressora
    t1 = new_tab("Impressora")
    combo = ttk.Combobox(t1, textvariable=printer_var, width=48)
    combo.configure(postcommand=lambda: combo.configure(values=[""] + list_printers()))
    combo.bind("<<ComboboxSelected>>", refresh_status)
    field(t1, 1, "Impressora de destino", "Já vem selecionada quando o driver da KNUP está instalado. Vazio = detectar sozinho.", combo)
    dots_row = ttk.Frame(t1)
    ttk.Combobox(dots_row, textvariable=dots_var, values=["320", "352", "384"], width=6).pack(side="left")
    ttk.Label(dots_row, text="pontos   margem esq.", style="Muted.TLabel").pack(side="left", padx=6)
    ttk.Spinbox(dots_row, from_=0, to=200, textvariable=margin_var, width=5).pack(side="left")
    ttk.Button(dots_row, text="Teste de largura", style="Soft.TButton", command=lambda: test_width()).pack(side="left", padx=4)
    field(t1, 0, "Largura e margem (pontos)", "Largura total da cabeça (58 mm = 384). A margem esquerda (8 pontos = 1 mm) fica dentro dela e empurra o conteúdo para a direita.", dots_row)
    mode_combo = ttk.Combobox(t1, textvariable=mode_var, values=list(mode_labels.values()), state="readonly", width=34)
    field(t1, 2, "Modo do texto do cupom", "Texto: nativo e nítido, sem acentos. Imagem: mantém os acentos, mas fica diferente do texto da impressora.", mode_combo)
    url_entry = ttk.Entry(t1, textvariable=url_var)
    field(t1, 3, "URL do driver (opcional)", "Zip com .inf ou instalador silencioso. Sem URL, usa o driver genérico do Windows.", url_entry)
    sha_entry = ttk.Entry(t1, textvariable=sha_var)
    field(t1, 4, "SHA256 do driver", "Confere a integridade do download antes de instalar.", sha_entry)

    # Aba 2: Conexão
    t2 = new_tab("Conexão")
    port_row = ttk.Frame(t2)
    ttk.Entry(port_row, textvariable=port_var, width=8).pack(side="left")
    ttk.Label(port_row, text="   Tamanho máx. do envio (MB)").pack(side="left")
    ttk.Spinbox(port_row, from_=1, to=32, textvariable=payload_var, width=5).pack(side="left", padx=6)
    field(t2, 0, "Porta local", "O agente só escuta em 127.0.0.1. Mudar a porta exige reiniciar.", port_row)
    routes_frame = ttk.Frame(t2)
    for r, label in ROUTES.items():
        ttk.Checkbutton(routes_frame, text=label, variable=route_vars[r]).pack(anchor="w", pady=1)
    field(t2, 1, "Rotas aceitas", "Rotas desmarcadas respondem 404.", routes_frame)
    origins = tk.Text(t2, width=52, height=4, relief="flat", highlightthickness=1, highlightbackground=LINE,
                      highlightcolor=BRAND, font=(FONT, 10), padx=6, pady=5)
    origins.insert("1.0", chr(10).join(cfg["allowed_origins"]))
    field(t2, 2, "Sites autorizados", "Um por linha. Só estes sites conseguem imprimir.", origins)

    # Aba 3: Sistema
    t3 = new_tab("Sistema")
    startup = ttk.Frame(t3)
    for text, var in (
        ("Iniciar com o Windows", auto_var),
        ("Abrir esta janela ao iniciar", open_var),
        ("Gravar log de requisições", log_var),
    ):
        ttk.Checkbutton(startup, text=text, variable=var).pack(anchor="w", pady=3)
    field(t3, 0, "Comportamento", "O agente fica na bandeja do Windows; clique duas vezes no ícone para abrir esta janela.", startup)
    ttk.Label(t3, text=f"Configuração: {CONFIG_PATH}", style="Muted.TLabel", wraplength=470).grid(row=9, column=0, sticky="w")

    # ---- Ações ----
    def collect() -> dict:
        new = dict(cfg)
        new.update(
            printer_name=printer_var.get().strip(),
            text_mode=next((k for k, v in mode_labels.items() if v == mode_var.get()), "native"),
            paper_dots=min(832, max(192, int(dots_var.get()))) // 8 * 8,
            left_margin_dots=min(400, max(0, int(margin_var.get()))),
            port=int(port_var.get()),
            autostart=auto_var.get(),
            open_settings_on_start=open_var.get(),
            log_requests=log_var.get(),
            max_payload_mb=max(1, int(payload_var.get())),
            allowed_routes=[r for r, v in route_vars.items() if v.get()],
            allowed_origins=[o.strip() for o in origins.get("1.0", "end").splitlines() if o.strip()],
            driver_url=url_var.get().strip(),
            driver_sha256=sha_var.get().strip(),
        )
        return new

    def save() -> None:
        try:
            new = collect()
        except ValueError:
            return messagebox.showerror("Erro", "Porta ou tamanho inválido.")
        restart = new["port"] != cfg["port"]
        cfg.update(new)
        save_config(cfg)
        set_autostart(cfg["autostart"])
        refresh_status()
        messagebox.showinfo("Salvo", "Reinicie o agente para aplicar a nova porta." if restart else "Configurações salvas.")

    def test_print() -> None:
        printer = printer_var.get().strip() or resolve_printer(cfg)
        if not printer:
            return messagebox.showerror("Erro", "Nenhuma impressora térmica encontrada.")
        try:
            send_raw(printer, text_test_bytes())
        except OSError as err:
            return messagebox.showerror("Erro", f"Falha ao enviar para {printer}: {err}")
        messagebox.showinfo("Teste", f"Enviado para {printer}.")

    def test_width() -> None:
        printer = printer_var.get().strip() or resolve_printer(cfg)
        if not printer:
            return messagebox.showerror("Erro", "Nenhuma impressora térmica encontrada.")
        try:
            dots = min(832, max(192, int(dots_var.get()))) // 8 * 8
            send_raw(printer, width_test_bytes(dots, min(400, max(0, int(margin_var.get())))))
        except (ValueError, OSError) as err:
            return messagebox.showerror("Erro", f"Falha no teste de largura: {err}")
        messagebox.showinfo("Teste de largura", "Se a moldura tocou as duas bordas, clique em Salvar. Se cortou, diminua o valor; se sobrou espaço, aumente.")

    def run_install() -> None:
        try:
            cfg.update(collect())
            message = install_printer(cfg)
        except Exception as err:  # mostra qualquer falha de download/UAC ao usuário
            return messagebox.showerror("Erro", str(err))
        found = resolve_printer(cfg)
        if found:
            printer_var.set(found)  # a impressora recém-instalada já fica selecionada
        refresh_status()
        messagebox.showinfo("Instalação", message)

    footer = tk.Frame(root, bg=BG)
    footer.pack(fill="x", padx=14, pady=14)
    ttk.Button(footer, text="Instalar driver", style="Soft.TButton", command=run_install).pack(side="left")
    ttk.Button(footer, text="Teste de impressão", style="Soft.TButton", command=test_print).pack(side="left", padx=8)
    ttk.Button(footer, text="Salvar", style="Accent.TButton", command=save).pack(side="right")
    def close_agent() -> None:
        question = "Encerrar o agente? A impressão direta para até ele ser aberto de novo.\n\nPara só fechar esta janela, use o X."
        if messagebox.askyesno("Fechar o agente", question):
            root.destroy()
            quit_agent()

    ttk.Button(footer, text="Fechar", style="Plain.TButton", command=close_agent).pack(side="right", padx=8)

    def on_close() -> None:
        # Avisa quando há alterações digitadas e ainda não salvas (o agente só usa o que está salvo).
        try:
            pending = collect()
            changed = any(pending[k] != cfg[k] for k in pending)
        except ValueError:
            changed = True
        if changed:
            answer = messagebox.askyesnocancel("Alterações não salvas", "Salvar as alterações antes de fechar a janela?")
            if answer is None:
                return
            if answer:
                save()
        root.destroy()

    root.protocol("WM_DELETE_WINDOW", on_close)
    refresh_status()
    combo.selection_clear()
    root.update_idletasks()
    root.geometry(f"+{(root.winfo_screenwidth() - root.winfo_width()) // 2}+{(root.winfo_screenheight() - root.winfo_height()) // 3}")
    try:
        root.mainloop()
    finally:
        _settings_open.release()


def run_tray(cfg: dict) -> None:
    import pystray
    from PIL import Image

    image = Image.open(resource_path("icon.png"))
    menu = pystray.Menu(
        pystray.MenuItem("Configurações", lambda: threading.Thread(target=open_settings, args=(cfg,), daemon=True).start(), default=True),
        pystray.MenuItem("Sair", lambda icon: icon.stop()),
    )
    global _tray_icon
    _tray_icon = pystray.Icon(APP_NAME, image, "Beauty Manager — Impressão", menu)
    _tray_icon.run()


def main() -> None:
    cfg = load_config()
    save_config(cfg)
    set_autostart(cfg["autostart"])
    try:
        server = start_server(cfg)
    except OSError:
        sys.exit(0)  # já existe uma instância usando a porta
    if cfg["open_settings_on_start"] and "--headless" not in sys.argv:
        threading.Thread(target=open_settings, args=(cfg,), daemon=True).start()
    if "--headless" in sys.argv:
        threading.Event().wait()
    else:
        run_tray(cfg)
    server.shutdown()


if __name__ == "__main__":
    main()
