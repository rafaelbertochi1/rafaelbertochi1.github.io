"""Carimba uma versão nos links de CSS e JS do index.html.

Assim o navegador baixa os arquivos novos logo depois de cada publicação,
em vez de usar a cópia guardada em cache. Rode antes de cada commit:

    python scripts/versionar.py
"""
import re
import time
from pathlib import Path

index = Path(__file__).resolve().parent.parent / "index.html"
html = index.read_text(encoding="utf-8")
versao = time.strftime("%Y%m%d%H%M%S")
novo = re.sub(r'((?:href|src)="(?:css|js)/[\w.-]+\.(?:css|js))(?:\?v=\d+)?"', rf'\1?v={versao}"', html)
index.write_text(novo, encoding="utf-8")
print("versão", versao)
