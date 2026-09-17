# README.md -> Instrucciones_Docente.pdf. Requiere: pip install markdown, y Chrome instalado.
import markdown, os, subprocess, tempfile

CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
SALIDA = os.path.abspath('Instrucciones_Docente.pdf')
CSS = """@page { size: Letter; margin: 2cm; }
body { font: 12.5pt/1.45 'Segoe UI', Arial, sans-serif; color: #000; }
h1 { font-size: 22pt; border-bottom: 3px solid #000; padding-bottom: 6px; }
h2 { font-size: 16pt; margin-top: 22pt; page-break-after: avoid; }
table { border-collapse: collapse; margin: 8pt 0; page-break-inside: avoid; }
th, td { border: 1.5px solid #000; padding: 5pt 10pt; text-align: left; }
th { background: #eee; }
code { font-family: Consolas, monospace; background: #eee; padding: 1px 4px; }
li { margin: 3pt 0; }
hr { border: 0; border-top: 1.5px solid #000; margin: 18pt 0; }
a { color: #000; }"""

md = open('README.md', encoding='utf-8').read().split('## Para el desarrollador')[0].rstrip().rstrip('-')
html = f'<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><style>{CSS}</style></head><body>{markdown.markdown(md, extensions=["tables"])}</body></html>'
with tempfile.NamedTemporaryFile('w', suffix='.html', encoding='utf-8', delete=False) as f:
    f.write(html)
subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-pdf-header-footer', f'--print-to-pdf={SALIDA}', 'file:///' + f.name.replace(os.sep, '/')], check=True, capture_output=True)
os.unlink(f.name)
print('OK', SALIDA)
