# capturas/*.png -> Capturas_App.pdf, una pantalla por página con su descripción.
import re
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Image, PageBreak, Table
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.fonts import addMapping

# Fuentes con los símbolos ✓ ○ △ ⚠ (Helvetica los pinta como cuadros negros)
pdfmetrics.registerFont(TTFont('Segoe', r'C:\Windows\Fonts\segoeui.ttf'))
pdfmetrics.registerFont(TTFont('SegoeB', r'C:\Windows\Fonts\segoeuib.ttf'))
pdfmetrics.registerFont(TTFont('SegoeSym', r'C:\Windows\Fonts\seguisym.ttf'))
addMapping('Segoe', 0, 0, 'Segoe'); addMapping('Segoe', 1, 0, 'SegoeB')
sym = lambda t: re.sub('([✓○△⚠→])', lambda m: f'<font name="SegoeSym">{m.group(1)}</font>', t)

PANTALLAS = [
  ('pin', 'Entrada con PIN',
   'Al abrir la app se pide el PIN (4 a 8 dígitos). La primera vez se crea con confirmación. '
   'Protege las notas de los alumnos si alguien más toma el teléfono. El diálogo no se puede cerrar sin el PIN correcto.'),
  ('secciones', 'Secciones (pantalla principal)',
   'Lista de secciones cargadas con la cantidad de alumnos. Las que no entregan notas aparecen marcadas "sin entrega". '
   'Cada sección tiene dos botones: <b>Notas</b> (cuadro de la unidad) y <b>Lista</b> (pase de lista). '
   'Abajo: <b>Guardar respaldo</b> (descarga un archivo con todos los datos), <b>Restaurar</b> y <b>Cambiar PIN</b>.'),
  ('importar', 'Importar alumnos desde Excel',
   'Se hace una vez al inicio del ciclo por cada sección. Se elige el archivo, la hoja, y se escribe el grado y la sección. '
   'La vista previa muestra cuántos alumnos se encontraron y las claves que recibirán (5A-01, 5A-02…). '
   'La casilla "Esta sección entrega notas" permite distinguir las secciones a las que no se les pasa cuadro.'),
  ('pase', 'Pase de lista',
   'La pantalla que se usa en la cancha. Arriba, la fecha (viene la de hoy) y la unidad. '
   'Todos los alumnos empiezan con ✓; la docente solo toca a quien sea distinto. Cada toque en la marca la cambia en orden '
   '✓ → X → * → P → E, con colores de alto contraste: verde ✓ (100 %), naranja X (80 %), rojo * (40 %), gris P/E (no cuentan). '
   'El botón ○ abre la observación; si hay amonestación se vuelve △ rojo. Todo se guarda al instante.'),
  ('obs', 'Observación de conducta',
   'Diálogo que aparece al tocar ○. Se elige el nivel: <b>Advertencia</b> (queda registrada, no afecta la nota) o '
   '<b>Amonestación</b> (baja a la mitad el porcentaje de ese día). El texto de la falta es obligatorio. '
   '"Quitar" elimina la observación.'),
  ('notas', 'Notas de la unidad',
   'Cuadro por alumno: clases que cuentan (sin P ni E), nota actitudinal sobre 60 calculada automáticamente, examen sobre 40 '
   '(se escribe aquí) y total sobre 100. Los retirados aparecen tachados. Si un alumno tiene muchas menos clases que el resto '
   'se marca con ⚠. Abajo: <b>Cerrar unidad</b> (bloquea cambios), <b>Cuadro unidad</b> y <b>Consolidado</b> (exportan a Excel).'),
  ('estado', 'Estado del alumno',
   'Al tocar el nombre en Notas se cambia el estado: <b>Activo</b>, <b>Intermitente</b> (asiste poco, acumula menos clases) o '
   '<b>Retirado</b> con fecha. El retirado deja de aparecer en el pase de lista desde esa fecha pero conserva su historial.'),
]

est = getSampleStyleSheet()
titulo = ParagraphStyle('t', parent=est['Title'], fontName='SegoeB', fontSize=20, spaceAfter=4)
sub = ParagraphStyle('s', parent=est['Normal'], fontName='Segoe', fontSize=11, textColor='#444', spaceAfter=14)
h = ParagraphStyle('h', parent=est['Heading1'], fontName='SegoeB', fontSize=16, spaceAfter=8)
cuerpo = ParagraphStyle('c', parent=est['Normal'], fontName='Segoe', fontSize=11, leading=15)

doc = SimpleDocTemplate('Capturas_App.pdf', pagesize=letter, leftMargin=2*cm, rightMargin=2*cm, topMargin=1.8*cm, bottomMargin=1.8*cm)
story = [Paragraph('Sistema de asistencia y calificación — Educación Física', titulo),
         Paragraph('Pantallas de la aplicación en teléfono (390 × 844). Escuela Oficial Rural Mixta "20 de Octubre" JM, San Francisco el Alto. Seminario TI, 2026.', sub)]
for i, (archivo, nombre, desc) in enumerate(PANTALLAS):
    if i: story.append(PageBreak())
    alto = 15.5*cm
    ancho = alto*390/844
    img = Image(f'capturas/{archivo}.png', width=ancho, height=alto)
    story += [Paragraph(f'{i+1}. {nombre}', h),
              Table([[img, Paragraph(sym(desc), cuerpo)]], colWidths=[ancho + 0.5*cm, None], style=[('VALIGN', (0,0), (-1,-1), 'TOP')])]
doc.build(story)
print('OK Capturas_App.pdf')
