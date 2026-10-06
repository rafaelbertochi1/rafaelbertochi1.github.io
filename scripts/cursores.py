"""Gera os cursores em pixel art (mira e mãozinhas) e grava css/cursor.css.

    python scripts/cursores.py

Cada letra do desenho é uma cor; o contorno escuro é calculado sozinho.
Os PNGs vão embutidos no CSS (data URI), então não há arquivo extra para baixar.
"""
import base64
import io
from pathlib import Path

from PIL import Image

ESCALA = 2  # cada "pixel" do desenho vira 2x2 pixels de tela
CONTORNO = (11, 14, 20, 255)
CORES = {
    "C": (92, 225, 230, 255),   # ciano do site
    "A": (255, 204, 77, 255),   # âmbar
    "W": (255, 204, 77, 255),   # luva amarela (cor do site, não confunde com a mão do Windows)
    "S": (201, 151, 31, 255),   # sombra entre os dedos
}

MIRA = [
    "......C......",
    "......C......",
    "......C......",
    "......C......",
    ".............",
    ".............",
    "CCCC..A..CCCC",
    ".............",
    ".............",
    "......C......",
    "......C......",
    "......C......",
    "......C......",
]

MAO = [
    "...WW.......",
    "...WW.......",
    "...WW.......",
    "...WW.WW....",
    "...WWSWWWW..",
    "...WWSWWSWWW",
    ".WWWWWWWSWWW",
    ".WWWWWWWWWWW",
    "..WWWWWWWWWW",
    "..WWWWWWWWWW",
    "...WWWWWWWW.",
    "....CCCCCCC.",
    "....CCCCCCC.",
]
# apertando: o dedo encolhe dois "pixels"
MAO_APERTANDO = ["............", "............"] + MAO[2:]


def desenhar(linhas):
    h, w = len(linhas) + 2, len(linhas[0]) + 2  # +2 para o contorno
    grade = [[None] * w for _ in range(h)]
    for y, linha in enumerate(linhas):
        for x, ch in enumerate(linha):
            if ch != ".":
                grade[y + 1][x + 1] = CORES[ch]
    contorno = [[None] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            if grade[y][x] is None and any(
                0 <= y + dy < h and 0 <= x + dx < w and grade[y + dy][x + dx] is not None
                for dy in (-1, 0, 1) for dx in (-1, 0, 1)
            ):
                contorno[y][x] = CONTORNO
    img = Image.new("RGBA", (w * ESCALA, h * ESCALA), (0, 0, 0, 0))
    for y in range(h):
        for x in range(w):
            cor = grade[y][x] or contorno[y][x]
            if cor:
                for py in range(ESCALA):
                    for px in range(ESCALA):
                        img.putpixel((x * ESCALA + px, y * ESCALA + py), cor)
    buf = io.BytesIO()
    img.save(buf, "PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


# Indicador: a mesma mão, deitada, apontando para a direita (para ficar ao lado dos links)
MAO_DIREITA = ["".join(MAO[len(MAO) - 1 - y][x] for y in range(len(MAO))) for x in range(len(MAO[0]))]

mira = desenhar(MIRA)
indicador = desenhar(MAO_DIREITA)
mao = desenhar(MAO)
mao2 = desenhar(MAO_APERTANDO)
centro = (len(MIRA) // 2 + 1) * ESCALA
ponta_x = int((3.5 + 1) * ESCALA)

css = f"""/* Cursores em pixel art (gerado por scripts/cursores.py, não edite à mão) */
:root {{
  --cur-aim: url("{mira}") {centro} {centro}, crosshair;
  --cur-hand: url("{mao}") {ponta_x} {ESCALA}, pointer;
  --cur-press: url("{mao2}") {ponta_x} {3 * ESCALA}, pointer;
  --ind-hand: url("{indicador}");
}}

@media (pointer: fine) {{
  html, body {{ cursor: var(--cur-aim); }}
  a, button, [role="button"], label, summary, select {{ cursor: var(--cur-hand); }}
  a:active, button:active, [role="button"]:active {{ cursor: var(--cur-press); }}
  button:disabled {{ cursor: not-allowed; }}
  input, textarea, .term__in {{ cursor: text; }}
}}
"""
destino = Path(__file__).resolve().parent.parent / "css" / "cursor.css"
MARCA = "/* Rastro de pixels"
resto = ""
if destino.exists():
    atual = destino.read_text(encoding="utf-8")
    if MARCA in atual:
        resto = "\n" + atual[atual.index(MARCA):]
destino.write_text(css + resto, encoding="utf-8")
print("ok", destino, len(css), "bytes")
