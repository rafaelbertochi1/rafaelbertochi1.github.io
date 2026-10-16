"""Baixa as fontes do Google Fonts para assets/fonts e gera css/fonts.css.

Hospedar as fontes no próprio site evita duas conexões a mais (googleapis +
gstatic) antes do primeiro desenho da página, que no celular com rede lenta
custava alguns segundos, e não manda o IP de quem visita para o Google.
Só o subconjunto "latin" (cobre português e inglês, acentos inclusive).

Uso: python scripts/fontes.py  (só precisa rodar de novo se mudar as fontes)
"""
import re
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
URL = ("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600"
       "&family=Press+Start+2P&family=Silkscreen&display=swap")
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")


def baixar(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req) as r:
        return r.read()


css = baixar(URL).decode("utf-8")
pasta = RAIZ / "assets" / "fonts"
pasta.mkdir(parents=True, exist_ok=True)
saida = ["/* Gerado por scripts/fontes.py (fontes sob a SIL Open Font License) */"]
nomes = {}  # fonte variável: os dois pesos do JetBrains Mono vêm do mesmo arquivo
for subconjunto, bloco in re.findall(r"/\*\s*([\w-]+)\s*\*/\s*(@font-face\s*{[^}]+})", css):
    if subconjunto != "latin":
        continue
    familia = re.search(r"font-family:\s*'([^']+)'", bloco).group(1)
    url = re.search(r"url\((https://[^)]+\.woff2)\)", bloco).group(1)
    if url not in nomes:
        nomes[url] = f"{familia.lower().replace(' ', '-')}.woff2"
        (pasta / nomes[url]).write_bytes(baixar(url))
        print(nomes[url])
    saida.append(bloco.replace(url, f"../assets/fonts/{nomes[url]}"))
(RAIZ / "css" / "fonts.css").write_text("\n".join(saida) + "\n", encoding="utf-8")
