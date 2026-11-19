"""Aplica o estilo minimalista da apresentação prática a um .pptx gerado (exceto a capa).

- Caixas e círculos cheios (preto/escuro/cinzento) passam a brancos com contorno fino.
- Texto branco/claro (que estava sobre fundo escuro) passa a preto/cinzento.
- Cabeçalhos de tabela passam a cinzento muito claro com texto preto.
- Imagens (logótipos, capturas) ficam como estão, a cores.

Uso: python estilo_minimalista.py <ficheiro.pptx>
"""
import sys
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.dml import MSO_FILL
from pptx.util import Pt, Inches

DARK = {"111111", "000000", "1F2937", "0284C7", "18181B"}      # fundos cheios -> contorno preto
LIGHT_FILL = {"F2F2F2", "F5F5F5"}                              # fundos claros -> contorno cinzento
TEXT_MAP = {"FFFFFF": "000000", "D4D4D4": "000000", "DDDDDD": "555555", "E4E4E7": "555555"}

def hexof(color):
    try:
        return str(color.rgb)
    except Exception:
        return None

def fix_runs(text_frame):
    for p in text_frame.paragraphs:
        for r in p.runs:
            c = hexof(r.font.color) if r.font.color and r.font.color.type is not None else None
            if c in TEXT_MAP:
                r.font.color.rgb = RGBColor.from_string(TEXT_MAP[c])

def restyle(shape):
    small = shape.width is not None and shape.width < Inches(0.12)   # barras das frases-chave
    if not small and hasattr(shape, "fill"):
        try:
            if shape.fill.type == MSO_FILL.SOLID:
                c = hexof(shape.fill.fore_color)
                if c in DARK or c in LIGHT_FILL:
                    shape.fill.solid()
                    shape.fill.fore_color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
                    shape.line.color.rgb = RGBColor.from_string("000000" if c in DARK else "BFBFBF")
                    shape.line.width = Pt(1)
        except (TypeError, AttributeError):
            pass
    if shape.has_text_frame:
        fix_runs(shape.text_frame)
    if getattr(shape, "has_table", False) and shape.has_table:
        for i, row in enumerate(shape.table.rows):
            for cell in row.cells:
                if i == 0:
                    cell.fill.solid()
                    cell.fill.fore_color.rgb = RGBColor.from_string("F2F2F2")
                fix_runs(cell.text_frame)

path = sys.argv[1]
prs = Presentation(path)
for idx, slide in enumerate(prs.slides):
    if idx == 0:          # a capa fica como está
        continue
    for shape in slide.shapes:
        restyle(shape)
prs.save(path)
print("estilo minimalista aplicado a", len(prs.slides) - 1, "diapositivos")
