"""Testes do agente de impressão: python -m unittest discover -s print-agent -p "test_*.py" """
import base64
import json
import unittest
import urllib.error
import urllib.request
from unittest import mock

import agent

ORIGIN = "https://beauty.ajotanc.com.br"


class OriginTests(unittest.TestCase):
    patterns = ["https://*.ajotanc.com.br", "http://localhost:5173"]

    def test_sem_origin_passa(self):
        self.assertTrue(agent.origin_allowed(None, self.patterns))

    def test_curinga_aceita_subdominios(self):
        for origin in ("https://dev.ajotanc.com.br", ORIGIN, "http://localhost:5173"):
            self.assertTrue(agent.origin_allowed(origin, self.patterns), origin)

    def test_barra_dominios_parecidos_e_protocolo_errado(self):
        for origin in ("https://evil.com", "https://ajotanc.com.br.evil.com", "http://dev.ajotanc.com.br", "http://localhost:9999"):
            self.assertFalse(agent.origin_allowed(origin, self.patterns), origin)


class WidthTestTests(unittest.TestCase):
    def rows(self, dots, margin):
        data = agent.width_test_bytes(dots, margin)
        row_bytes = int.from_bytes(data[8:10], "little")
        height = int.from_bytes(data[10:12], "little")
        body = data[12:12 + row_bytes * height]
        return row_bytes, ["".join(f"{b:08b}" for b in body[i * row_bytes:(i + 1) * row_bytes]) for i in range(height)]

    def test_moldura_nunca_passa_da_largura_total(self):
        row_bytes, rows = self.rows(384, 24)
        self.assertEqual(row_bytes, 48)  # 384 pontos: cabe na cabeça da KP-IM607
        middle = rows[45]
        self.assertEqual(middle.index("1"), 24)  # começa na margem
        self.assertEqual(middle.rindex("1"), 383)  # termina na borda

    def test_sem_margem_comeca_na_borda(self):
        _, rows = self.rows(384, 0)
        self.assertEqual(rows[45].index("1"), 0)


class PrinterTests(unittest.TestCase):
    def test_nao_cai_na_impressora_padrao(self):
        # ESC/POS numa impressora comum (ex.: PDF) só gera lixo
        with mock.patch.object(agent, "list_printers", return_value=["Microsoft Print to PDF"]):
            self.assertIsNone(agent.resolve_printer(dict(agent.DEFAULTS)))

    def test_acha_a_knup_pelo_nome(self):
        with mock.patch.object(agent, "list_printers", return_value=["PDF", "KNUP KP-IM607"]):
            self.assertEqual(agent.resolve_printer(dict(agent.DEFAULTS)), "KNUP KP-IM607")

    def test_impressora_pedida_que_nao_existe(self):
        with mock.patch.object(agent, "list_printers", return_value=["KNUP KP-IM607"]):
            self.assertIsNone(agent.resolve_printer(dict(agent.DEFAULTS), "Outra"))


class PrepareJobTests(unittest.TestCase):
    cupom = b"\x1b@texto\n\x1d\x56\x01"

    def cfg(self, **extra):
        return dict(agent.DEFAULTS, **extra)

    def test_padrao_e_sem_corte(self):
        self.assertEqual(agent.prepare_job(self.cupom, self.cfg()), b"@texto
")

    def test_corte_parcial_mantem_o_cupom(self):
        self.assertEqual(agent.prepare_job(self.cupom, self.cfg(cut_mode="partial")), self.cupom)

    def test_corte_total_sem_corte_e_avanco(self):
        self.assertTrue(agent.prepare_job(self.cupom, self.cfg(cut_mode="full")).endswith(b"\x1d\x56\x00"))
        self.assertEqual(agent.prepare_job(self.cupom, self.cfg(cut_mode="none")), b"\x1b@texto\n")
        self.assertTrue(agent.prepare_job(self.cupom, self.cfg(cut_mode="partial", cut_feed_lines=2)).endswith(b"\n\n\x1d\x56\x01"))

    def test_gaveta_so_no_cupom(self):
        self.assertTrue(agent.prepare_job(self.cupom, self.cfg(open_drawer=True, cut_mode="partial")).endswith(agent.DRAWER_PULSE))
        etiqueta = b"\x1b@etiqueta\n\n"
        self.assertEqual(agent.prepare_job(etiqueta, self.cfg(open_drawer=True, cut_mode="full")), etiqueta)


class RetryTests(unittest.TestCase):
    def test_tenta_de_novo_e_depois_desiste(self):
        cfg = dict(agent.DEFAULTS, print_retries=2, retry_delay_ms=0)
        with mock.patch.object(agent, "send_raw", side_effect=[OSError("x"), OSError("x"), None]) as send, mock.patch.object(agent, "log_line"):
            agent.send_with_retry("P", b"a", cfg)
        self.assertEqual(send.call_count, 3)
        with mock.patch.object(agent, "send_raw", side_effect=OSError("x")) as send, mock.patch.object(agent, "log_line") as log:
            with self.assertRaises(OSError):
                agent.send_with_retry("P", b"a", cfg)
        self.assertEqual((send.call_count, log.call_count), (3, 3))


class InstallTests(unittest.TestCase):
    def test_url_com_nome_estranho_e_recusada_antes_de_baixar(self):
        # o nome do arquivo iria para um script de administrador (aspa simples escaparia do texto)
        cfg = dict(agent.DEFAULTS, driver_url="https://x.com/driver';calc;'.bin")
        with mock.patch.object(agent.urllib.request, "urlretrieve") as download:
            with self.assertRaises(ValueError):
                agent.install_printer(cfg)
        download.assert_not_called()

    def test_aceita_zip_e_exe_com_parametros_na_url(self):
        for url in ("https://x.com/a/driver.zip?token=1", "https://x.com/Driver.EXE"):
            cfg = dict(agent.DEFAULTS, driver_url=url)
            with mock.patch.object(agent.urllib.request, "urlretrieve", side_effect=OSError("sem rede")):
                with self.assertRaises(OSError):  # passou da validação e tentou baixar
                    agent.install_printer(cfg)


class ServerTests(unittest.TestCase):
    def setUp(self):
        self.cfg = dict(agent.DEFAULTS, port=0, allowed_origins=[ORIGIN], paper_dots=384, left_margin_dots=8)
        self.printers = mock.patch.object(agent, "list_printers", return_value=["KNUP KP-IM607"])
        self.sent = mock.patch.object(agent, "send_raw")
        self.printers.start()
        self.send_raw = self.sent.start()
        self.server = agent.start_server(self.cfg)
        self.base = f"http://127.0.0.1:{self.server.server_address[1]}"

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        mock.patch.stopall()

    def call(self, path, body=None, origin=ORIGIN, method=None):
        headers = {"Origin": origin} if origin else {}
        data = body if isinstance(body, bytes) else (json.dumps(body).encode() if body is not None else None)
        request = urllib.request.Request(self.base + path, data=data, headers=headers, method=method or ("POST" if data is not None else "GET"))
        try:
            with urllib.request.urlopen(request) as response:
                return response.status, dict(response.headers), json.loads(response.read() or b"{}")
        except urllib.error.HTTPError as err:
            with err:
                return err.code, dict(err.headers), json.loads(err.read() or b"{}")

    def test_status_traz_a_configuracao_para_o_site(self):
        status, headers, body = self.call("/status")
        self.assertEqual(status, 200)
        self.assertEqual(headers["Access-Control-Allow-Origin"], ORIGIN)
        self.assertEqual(headers["Access-Control-Allow-Private-Network"], "true")
        self.assertEqual((body["printer"], body["paper_dots"], body["left_margin_dots"], body["text_mode"]), ("KNUP KP-IM607", 384, 8, "native"))

    def test_origem_nao_autorizada_leva_403_sem_cors(self):
        status, headers, _ = self.call("/status", origin="https://evil.com")
        self.assertEqual(status, 403)
        self.assertNotIn("Access-Control-Allow-Origin", headers)

    def test_preflight(self):
        self.assertEqual(self.call("/print", origin=ORIGIN, method="OPTIONS")[0], 204)
        self.assertEqual(self.call("/print", origin="https://evil.com", method="OPTIONS")[0], 403)

    def test_rota_desligada_leva_404(self):
        self.cfg["allowed_routes"] = ["/status"]
        self.assertEqual(self.call("/print", {"data": "AA=="})[0], 404)
        self.assertEqual(self.call("/status")[0], 200)

    def test_imprime_os_bytes_recebidos(self):
        payload = b"\x1b@hello"
        status, _, body = self.call("/print", {"data": base64.b64encode(payload).decode()})
        self.assertEqual((status, body["printer"]), (200, "KNUP KP-IM607"))
        self.send_raw.assert_called_once_with("KNUP KP-IM607", payload)

    def test_payload_invalido_leva_400(self):
        self.assertEqual(self.call("/print", {"data": "!!nao-e-base64!!"})[0], 400)
        self.assertEqual(self.call("/print", b"nao e json")[0], 400)
        self.send_raw.assert_not_called()

    def test_payload_grande_leva_413(self):
        self.cfg["max_payload_mb"] = 1
        self.assertEqual(self.call("/print", b"x" * (1024 * 1024 + 10))[0], 413)

    def test_sem_impressora_leva_404(self):
        self.printers.stop()
        with mock.patch.object(agent, "list_printers", return_value=["PDF"]):
            status, _, body = self.call("/print", {"data": "AA=="})
        self.assertEqual((status, body["error"]), (404, "printer_not_found"))


if __name__ == "__main__":
    unittest.main()
