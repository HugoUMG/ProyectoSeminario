#!/bin/bash
# Genera Documentacion_Tecnica.docx y .pdf. Requiere Node (npm install en docs/), LibreOffice y PyMuPDF (pip install pymupdf).
# Repite la generación hasta que los números de página del índice no cambien.
D="$(cd "$(dirname "$0")" && pwd)"; P="$(dirname "$D")"
cd "$D"; rm -f toc.json; prev=""
for i in 1 2 3 4; do
  if [ -f toc.json ]; then node generar.js toc.json >/dev/null; else node generar.js >/dev/null; fi
  "/c/Program Files/LibreOffice/program/soffice.exe" --headless --convert-to pdf --outdir "$P" "$P/Documentacion_Tecnica.docx" >/dev/null 2>&1
  PYTHONIOENCODING=utf-8 python - "$P" "$D" <<'PY'
import fitz, json, sys
P, D = sys.argv[1], sys.argv[2]
d = fitz.open(P + '/Documentacion_Tecnica.pdf'); titulos = json.load(open(D + '/titulos.json', encoding='utf-8'))
ini = next(i for i in range(len(d)) if 'Índice' in d[i].get_text()[:200]) + 1
toc = {}
for nivel, t in titulos:
    for i in range(ini, len(d)):
        if t in d[i].get_text(): toc[t] = i + 1; break
json.dump(toc, open(D + '/toc.json', 'w', encoding='utf-8'), ensure_ascii=False)
print(len(d), 'paginas;', len(toc), 'de', len(titulos), 'titulos')
PY
  cur=$(md5sum toc.json | cut -c1-8); if [ "$cur" = "$prev" ]; then echo "convergió en pasada $i"; break; fi; prev=$cur
done
