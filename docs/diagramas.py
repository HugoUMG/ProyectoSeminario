# Genera los diagramas SVG -> PNG (Chrome headless). Estilo consistente para el documento técnico.
import os, subprocess
S = os.path.dirname(os.path.abspath(__file__))
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
os.makedirs(f'{S}/img', exist_ok=True)

STYLE = """
<style>
  text { font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; fill: #111827; }
  .t { font-size: 15px; font-weight: 700; }
  .s { font-size: 12.5px; fill: #4b5563; }
  .w { fill: #fff; }
  .wt { fill: #fff; font-weight: 700; font-size: 15px; }
  .box { fill: #fff; stroke: #1e3a8a; stroke-width: 2; rx: 10; }
  .dark { fill: #1e3a8a; stroke: none; rx: 10; }
  .soft { fill: #eff6ff; stroke: #93c5fd; stroke-width: 1.5; rx: 10; }
  .amber { fill: #fffbeb; stroke: #f59e0b; stroke-width: 1.5; rx: 10; }
  .green { fill: #ecfdf5; stroke: #10b981; stroke-width: 1.5; rx: 10; }
  .grp { fill: none; stroke: #9ca3af; stroke-width: 1.5; stroke-dasharray: 6 4; rx: 14; }
  .ln { stroke: #374151; stroke-width: 2; fill: none; marker-end: url(#ar); }
  .ln2 { stroke: #9ca3af; stroke-width: 2; fill: none; marker-end: url(#ar2); stroke-dasharray: 5 4; }
  .mono { font-family: Consolas, monospace; font-size: 13px; }
</style>
<defs>
  <marker id="ar" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#374151"/></marker>
  <marker id="ar2" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#9ca3af"/></marker>
</defs>
"""

def box(x, y, w, h, title, sub=None, cls='box', tcls='t', scls='s'):
    out = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" class="{cls}"/>'
    cy = y + h/2 + (5 if not sub else -3)
    out += f'<text x="{x+w/2}" y="{cy}" text-anchor="middle" class="{tcls}">{title}</text>'
    if sub:
        for i, line in enumerate(sub.split('|')):
            out += f'<text x="{x+w/2}" y="{cy+18+i*15}" text-anchor="middle" class="{scls}">{line}</text>'
    return out

def arrow(x1, y1, x2, y2, label=None, cls='ln', dx=0, dy=-6):
    out = f'<path d="M{x1},{y1} L{x2},{y2}" class="{cls}"/>'
    if label:
        out += f'<text x="{(x1+x2)/2+dx}" y="{(y1+y2)/2+dy}" text-anchor="middle" class="s">{label}</text>'
    return out

def elbow(x1, y1, x2, y2, label=None, cls='ln', dx=0, dy=-6):
    xm = (x1 + x2) / 2
    out = f'<path d="M{x1},{y1} L{xm},{y1} L{xm},{y2} L{x2},{y2}" class="{cls}"/>'
    if label:
        out += f'<text x="{xm+dx}" y="{(y1+y2)/2+dy}" text-anchor="middle" class="s">{label}</text>'
    return out

diagramas = {}

# 1. Arquitectura
d = STYLE
d += f'<rect x="20" y="20" width="620" height="440" class="grp"/><text x="40" y="48" class="t">Teléfono de la docente (Android · Chrome · PWA instalada)</text>'
d += box(50, 70, 560, 60, 'index.html — Interfaz (HTML + CSS + JS vanilla)', 'Secciones · Importar · Pase de lista · Notas · Diálogos (PIN, observación, estado)', 'dark', 'wt', 'w')
d = d.replace('class="w">Secciones', 'class="w" style="fill:#dbeafe">Secciones')
d += box(50, 160, 170, 70, 'calculo.js', 'reglas de negocio|(puro, sin DOM)')
d += box(245, 160, 170, 70, 'importar.js', 'Excel → alumnos|(puro)')
d += box(440, 160, 170, 70, 'exportar.js', 'cuadros → filas|(puro)')
d += box(50, 265, 265, 70, 'db.js', 'envoltorio de IndexedDB|get · todos · put · del · exportar · restaurar')
d += box(345, 265, 265, 70, 'sw.js — Service Worker', 'caché cache-first, versionado|recarga automática al actualizar')
d += box(50, 370, 265, 70, 'IndexedDB «edfisica»', 'secciones · alumnos · clases · unidades · config', 'soft')
d += box(345, 370, 265, 70, 'Cache Storage', 'index.html, *.js, manifest, SheetJS', 'soft')
d += arrow(135, 130, 135, 160) + arrow(330, 130, 330, 160) + arrow(525, 130, 525, 160)
d += arrow(182, 335, 182, 370) + arrow(477, 335, 477, 370)
d += arrow(182, 230, 182, 265)
# externos
d += box(700, 70, 200, 60, 'GitHub Pages', 'hosting estático gratuito|https://hugoumg.github.io/…', 'green')
d += box(700, 160, 200, 60, 'CDN jsDelivr', 'SheetJS (xlsx) 0.18.5|única dependencia', 'green')
d += box(700, 290, 200, 60, 'Archivos Excel', 'listado de alumnos (entra)|cuadros de notas (salen)', 'amber')
d += box(700, 380, 200, 60, 'Respaldo .json', 'Drive / WhatsApp / correo', 'amber')
d += arrow(700, 100, 640, 100, 'descarga 1.ª vez', dx=-8, dy=-10) + arrow(700, 190, 640, 190, 'se cachea', dx=-8, dy=-10)
d += arrow(700, 320, 640, 320, 'importar / exportar', dx=-8, dy=-10) + arrow(640, 410, 700, 410, 'guardar / restaurar', dx=-8, dy=-10)
d += '<text x="330" y="485" text-anchor="middle" class="s">Sin servidor propio: los datos viven en el dispositivo; el hosting solo entrega archivos estáticos.</text>'
diagramas['arquitectura'] = (920, 500, d)

# 2. Modelo de datos
def entity(x, y, w, name, fields, key):
    h = 44 + 20*len(fields)
    out = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" class="box"/>'
    out += f'<rect x="{x}" y="{y}" width="{w}" height="30" class="dark" style="rx:10"/><rect x="{x}" y="{y+18}" width="{w}" height="12" fill="#1e3a8a"/>'
    out += f'<text x="{x+w/2}" y="{y+20}" text-anchor="middle" class="wt">{name}</text>'
    for i, f in enumerate(fields):
        cls = 'mono' + (' t' if f.split()[0] == key else '')
        out += f'<text x="{x+12}" y="{y+52+i*20}" class="{cls}">{f}</text>'
    return out, h
d = STYLE
d += entity(300, 30, 250, 'secciones', ['id  "5A"', 'grado  "5"', 'seccion  "A"', 'entregaNotas  bool'], 'id')[0]
d += entity(620, 30, 300, 'alumnos', ['id  "5A-01"  (clave del alumno)', 'nombre', 'seccionId  → secciones.id', 'estado  activo | intermitente | retirado', 'fechaRetiro  "AAAA-MM-DD" | null'], 'id')[0]
d += entity(30, 260, 340, 'clases  (una por sección y fecha)', ['id  "5A|2026-09-17"', 'seccionId  → secciones.id', 'fecha  "AAAA-MM-DD"', 'unidad  1..4', 'marcas  { alumnoId → { m, obs } }', 'marcas.m  ✓ | X | * | P | E', 'marcas.obs  { nivel 1|2, texto } | null'], 'id')[0]
d += entity(440, 260, 320, 'unidades  (una por sección y unidad)', ['id  "5A|1"', 'seccionId  → secciones.id', 'unidad  1..4', 'examenes  { alumnoId → 0..40 }', 'cerrada  bool'], 'id')[0]
d += entity(830, 260, 250, 'config  (registro único)', ['id  "config"', 'docente', 'unidadActual  1..4', 'pin  SHA-256 (hex)', 'ultimoRespaldo  fecha'], 'id')[0]
d += arrow(620, 70, 550, 70, 'N : 1', dy=-8)
d += f'<path d="M200,260 L200,150 L300,150" class="ln"/><text x="215" y="200" class="s">N : 1</text>'
d += f'<path d="M600,260 L600,180 L550,180" class="ln"/><text x="612" y="225" class="s">N : 1</text>'
d += '<text x="555" y="470" text-anchor="middle" class="s">Cada clase guarda las marcas de sus ~30 alumnos en un solo registro: un toque escribe un objeto pequeño. Las marcas y los exámenes</text>'
d += '<text x="555" y="490" text-anchor="middle" class="s">referencian al alumno por su clave. Todos los registros usan «id» como clave primaria; no hay índices secundarios (volumen pequeño, filtrado en memoria).</text>'
diagramas['modelo'] = (1110, 510, d)

# 3. Flujo de cálculo
d = STYLE
steps = [
  ('Marcas de la unidad', 'clases de la sección|con unidad = N', 'soft'),
  ('Filtrar P y E', 'salen del divisor|(sin penalización)', 'box'),
  ('Porcentaje por clase', '✓ 100 · X 80 · * 40|× 0.5 si △', 'box'),
  ('Promedio × 60', 'suma ÷ clases_calificables|→ actitudinal (0..60)', 'box'),
  ('+ Examen (0..40)', 'ingreso directo|→ nota de unidad (0..100)', 'box'),
]
x = 20
for i, (t, s_, c) in enumerate(steps):
    d += box(x, 40, 170, 80, t, s_, c)
    if i < len(steps)-1: d += arrow(x+170, 80, x+195, 80)
    x += 195
d += box(215, 170, 560, 60, 'Nota final = promedio simple de las 4 unidades', 'redondeo a 2 decimales solo al mostrar/exportar; internamente con decimales', 'dark', 'wt', 'w')
d += arrow(885, 120, 885, 200) + f'<path d="M885,200 L775,200" class="ln"/>'
d += '<rect x="20" y="260" width="960" height="92" class="amber"/>'
d += '<text x="36" y="284" class="t">Ejemplo de referencia (documento de requerimientos §4.4)</text>'
d += '<text x="36" y="306" class="mono">20 clases − 2 P = 18 calificables · 14×100 + 2×80 + 1×50 (✓ con △) + 1×40 = 1650</text>'
d += '<text x="36" y="328" class="mono">1650 ÷ 18 = 91.67 % → × 60 = 55.00 puntos actitudinales   (verificado en test_calculo.js)</text>'
diagramas['calculo'] = (1000, 370, d)

# 4. Navegación
d = STYLE
d += box(30, 150, 150, 60, 'PIN', 'crear / ingresar', 'dark', 'wt', 'w')
d += box(240, 150, 190, 60, 'Secciones', 'lista · respaldo · cambiar PIN', 'box')
d += box(500, 40, 190, 60, 'Importar', 'Excel → alumnos', 'box')
d += box(500, 150, 190, 60, 'Pase de lista', 'marcas por fecha', 'box')
d += box(500, 260, 190, 60, 'Notas de unidad', 'examen · cierre · exportar', 'box')
d += box(760, 150, 190, 60, 'Observación', 'advertencia / amonestación', 'soft')
d += box(760, 260, 190, 60, 'Estado del alumno', 'activo / intermitente / retirado', 'soft')
d += box(760, 350, 190, 60, 'Archivos', 'cuadro · consolidado (.xlsx)|respaldo (.json)', 'amber')
d += arrow(180, 180, 240, 180, 'PIN correcto', dy=20)
d += elbow(430, 165, 500, 70, '+ Importar', dx=-42, dy=-36) + arrow(430, 180, 500, 180, 'Lista', dy=-10) + elbow(430, 195, 500, 290, 'Notas', dx=-30, dy=30)
d += arrow(690, 180, 760, 180, 'toque ○', dy=-10) + arrow(690, 290, 760, 290, 'toque nombre', dy=-10)
d += elbow(690, 300, 760, 380, 'exportar', dx=-45, dy=8)
d += f'<path d="M335,210 L335,380 L760,380" class="ln2"/><text x="345" y="300" class="s">guardar respaldo</text>'
d += '<text x="490" y="440" text-anchor="middle" class="s">Una sola página; cada pantalla es una &lt;section&gt; que se muestra u oculta. Los diálogos son &lt;dialog&gt; nativos.</text>'
diagramas['navegacion'] = (980, 460, d)

# 5. Offline y actualización
d = STYLE
d += box(20, 40, 200, 70, '1.ª visita (con internet)', 'GitHub Pages entrega|index.html + sw.js', 'green')
d += box(260, 40, 200, 70, 'SW: install', 'cache.addAll(archivos)|cache:"reload" → sin caché HTTP', 'box')
d += box(500, 40, 200, 70, 'SW: activate', 'borra cachés de versiones|anteriores · clients.claim()', 'box')
d += box(740, 40, 200, 70, 'App instalada', '"Agregar a pantalla de inicio"|manifest.json', 'dark', 'wt', 'w')
d += arrow(220, 75, 260, 75) + arrow(460, 75, 500, 75) + arrow(700, 75, 740, 75)
d += box(20, 170, 300, 70, 'Uso diario (sin internet)', 'fetch → cache-first: responde desde|Cache Storage; datos en IndexedDB', 'soft')
d += box(360, 170, 300, 70, 'Publicar cambio', 'subir VERSION en sw.js → commit → push|GitHub Pages actualiza en ~1 min', 'amber')
d += box(700, 170, 240, 70, 'Siguiente apertura con red', 'Chrome detecta sw.js distinto →|install/activate nueva versión', 'box')
d += arrow(660, 205, 700, 205)
d += box(360, 280, 300, 60, 'controllerchange → location.reload()', 'la docente ve la versión nueva sin hacer nada', 'dark', 'wt', 'w')
d += elbow(820, 240, 660, 310, cls='ln')
d += '<text x="480" y="380" text-anchor="middle" class="s">Los datos nunca pasan por la red: IndexedDB no forma parte de la caché ni del despliegue.</text>'
diagramas['offline'] = (960, 400, d)

for nombre, (w, h, cuerpo) in diagramas.items():
    html = f'<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{{margin:0;background:#fff}}</style></head><body><svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{cuerpo}</svg></body></html>'
    path = f'{S}/img/{nombre}.html'
    open(path, 'w', encoding='utf-8').write(html)
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', f'--window-size={w},{h}', '--force-device-scale-factor=2',
                    f'--screenshot={S}/img/{nombre}.png', 'file:///' + path.replace('\\', '/')], check=True, capture_output=True)
    print(nombre, 'ok')
