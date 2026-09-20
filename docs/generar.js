// Genera ../Documentacion_Tecnica.docx. Uso: node generar.js [toc.json]  (requiere: npm install)
// toc.json (opcional): { "Título de sección": página, ... } para el índice con números de página (segunda pasada).
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType,
  ShadingType, BorderStyle, ImageRun, PageBreak, Footer, Header, PageNumber, LevelFormat, TabStopType,
  LeaderType, VerticalAlign,
} = require('docx');

const P = path.resolve(__dirname, '..'); // raíz del repositorio
const IMG = path.join(__dirname, 'img');
const toc = process.argv[2] ? JSON.parse(fs.readFileSync(process.argv[2], 'utf8')) : null;

const AZUL = '1E3A8A', AZUL2 = '1D4ED8', GRIS = '4B5563', LINEA = 'D1D5DB', FONDO = 'F3F4F6';
const FUENTE = 'Calibri';
const ANCHO = 9360; // 6.5" útiles en carta con márgenes de 1"

// ---------- helpers ----------
const inline = (texto, base = {}) => {
  // **negrita**, `código`
  const partes = texto.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return partes.map(p => {
    if (p.startsWith('**')) return new TextRun({ text: p.slice(2, -2), bold: true, ...base });
    if (p.startsWith('`')) return new TextRun({ text: p.slice(1, -1), font: 'Consolas', size: 19, ...base });
    return new TextRun({ text: p, ...base });
  });
};
const h1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const h2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const h3 = t => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] });
const p = (t, opts = {}) => new Paragraph({ children: inline(t), spacing: { after: 120 }, ...opts });
const nota = t => new Paragraph({ children: inline(t, { italics: true, color: GRIS, size: 20 }), spacing: { after: 120 } });
const vineta = (t, nivel = 0) => new Paragraph({ children: inline(t), numbering: { reference: 'vinetas', level: nivel }, spacing: { after: 60 } });
const numerada = (t, ref) => new Paragraph({ children: inline(t), numbering: { reference: ref, level: 0 }, spacing: { after: 60 } });
const salto = () => new Paragraph({ children: [new PageBreak()] });
const espacio = (n = 120) => new Paragraph({ spacing: { after: n } });

const celda = (contenido, ancho, opts = {}) => new TableCell({
  width: { size: ancho, type: WidthType.DXA },
  shading: opts.sombra ? { type: ShadingType.CLEAR, fill: opts.sombra, color: 'auto' } : undefined,
  verticalAlign: VerticalAlign.CENTER,
  margins: { top: 60, bottom: 60, left: 100, right: 100 },
  children: Array.isArray(contenido) ? contenido : [new Paragraph({ children: inline(String(contenido), opts.run || {}), spacing: { after: 0 } })],
});
const bordes = { style: BorderStyle.SINGLE, size: 4, color: LINEA };
function tabla(encabezados, filas, anchos) {
  const tot = anchos.reduce((a, b) => a + b, 0);
  const esc = ANCHO / tot; anchos = anchos.map(a => Math.round(a * esc));
  return new Table({
    width: { size: ANCHO, type: WidthType.DXA }, columnWidths: anchos,
    borders: { top: bordes, bottom: bordes, left: bordes, right: bordes, insideHorizontal: bordes, insideVertical: bordes },
    rows: [
      new TableRow({ tableHeader: true, children: encabezados.map((e, i) => celda(e, anchos[i], { sombra: AZUL, run: { bold: true, color: 'FFFFFF', size: 20 } })) }),
      ...filas.map((f, r) => new TableRow({ children: f.map((c, i) => celda(c, anchos[i], { sombra: r % 2 ? 'F9FAFB' : undefined, run: { size: 20 } })) })),
    ],
  });
}
const pie = t => new Paragraph({ children: [new TextRun({ text: t, italics: true, color: GRIS, size: 18 })], alignment: AlignmentType.CENTER, spacing: { before: 80, after: 240 } });
function imagen(archivo, anchoPulg, leyenda) {
  const data = fs.readFileSync(archivo);
  const { width, height } = tamano(data);
  const w = Math.round(anchoPulg * 96), h = Math.round(w * height / width);
  const out = [new Paragraph({ children: [new ImageRun({ type: 'png', data, transformation: { width: w, height: h } })], alignment: AlignmentType.CENTER, spacing: { before: 120 } })];
  if (leyenda) out.push(pie(leyenda));
  return out;
}
function tamano(buf) { return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }; } // PNG IHDR
function codigo(texto) {
  return texto.split('\n').map(l => new Paragraph({
    children: [new TextRun({ text: l || ' ', font: 'Consolas', size: 18 })],
    shading: { type: ShadingType.CLEAR, fill: FONDO, color: 'auto' }, spacing: { after: 0, line: 260 }, indent: { left: 200, right: 200 },
  }));
}
function capturaFila(archivo, titulo, desc) {
  const data = fs.readFileSync(path.join(P, 'capturas', archivo)); const { width, height } = tamano(data);
  const w = Math.round(1.7 * 96), h = Math.round(w * height / width);
  return new Table({
    width: { size: ANCHO, type: WidthType.DXA }, columnWidths: [3300, 6060],
    borders: { top: bordes, bottom: bordes, left: bordes, right: bordes, insideHorizontal: bordes, insideVertical: bordes },
    rows: [new TableRow({ children: [
      new TableCell({ width: { size: 3300, type: WidthType.DXA }, margins: { top: 100, bottom: 100, left: 100, right: 100 },
        children: [new Paragraph({ children: [new ImageRun({ type: 'png', data, transformation: { width: w, height: h } })], alignment: AlignmentType.CENTER })] }),
      new TableCell({ width: { size: 6060, type: WidthType.DXA }, verticalAlign: VerticalAlign.TOP, margins: { top: 100, bottom: 100, left: 160, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: titulo, bold: true, size: 24, color: AZUL })], spacing: { after: 100 } }),
          ...desc.map(d => new Paragraph({ children: inline(d), spacing: { after: 100 } }))] }),
    ] })],
  });
}

// ---------- índice ----------
const TITULOS = [];
function T(nivel, t) { TITULOS.push([nivel, t]); return nivel === 1 ? h1(t) : nivel === 2 ? h2(t) : h3(t); }
function indice() {
  if (!toc) return [p('(El índice se completa en la segunda pasada.)')];
  const previos = JSON.parse(fs.readFileSync(path.join(__dirname, 'titulos.json'), 'utf8'));
  return previos.filter(([n]) => n <= 2).map(([n, t]) => new Paragraph({
    spacing: { after: n === 1 ? 40 : 20, before: n === 1 ? 100 : 0, line: 240 }, indent: { left: n === 1 ? 0 : 400 },
    tabStops: [{ type: TabStopType.RIGHT, position: ANCHO, leader: LeaderType.DOT }],
    children: [new TextRun({ text: t, bold: n === 1, size: n === 1 ? 22 : 21 }), new TextRun({ text: '	' + String(toc[t] ?? ''), size: 21 })],
  }));
}

// ---------- contenido ----------
const cuerpo = [];
const add = (...x) => x.forEach(i => Array.isArray(i) ? cuerpo.push(...i) : cuerpo.push(i));

// Portada
add(
  espacio(1800),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'DOCUMENTACIÓN TÉCNICA', bold: true, size: 26, color: GRIS, characterSpacing: 60 })], spacing: { after: 200 } }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Sistema de control de asistencia y calificación', bold: true, size: 48, color: AZUL })], spacing: { after: 80 } }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Curso de Educación Física', bold: true, size: 36, color: AZUL2 })], spacing: { after: 400 } }),
  new Paragraph({ alignment: AlignmentType.CENTER, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: AZUL, space: 8 } }, children: [new TextRun('')], spacing: { after: 400 } }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Escuela Oficial Rural Mixta "20 de Octubre" JM', size: 26 })], spacing: { after: 60 } }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'San Francisco El Alto, Totonicapán, Guatemala', size: 26 })], spacing: { after: 800 } }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Aplicación web progresiva (PWA) sin servidor · Versión 1.0', size: 24, color: GRIS })], spacing: { after: 60 } }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Seminario de Tecnologías de la Información · Septiembre de 2026', size: 24, color: GRIS })], spacing: { after: 1400 } }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Repositorio: https://github.com/HugoUMG/ProyectoSeminario', size: 20, color: GRIS })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Aplicación: https://hugoumg.github.io/ProyectoSeminario/', size: 20, color: GRIS })] }),
  salto(),
);

// Control del documento
add(h1('Control del documento'),
  tabla(['Versión', 'Fecha', 'Descripción', 'Estado'], [
    ['1.0', '20 de septiembre de 2026', 'Documentación técnica de la versión 1.0 del sistema (funcionalidad completa según el levantado de requerimientos v1.0).', 'Vigente'],
  ], [12, 22, 50, 12]),
  espacio(200),
  tabla(['Campo', 'Valor'], [
    ['Producto', 'Sistema de control de asistencia y calificación — Educación Física'],
    ['Versión del software', '1.0 (caché de la aplicación: edfisica-v8)'],
    ['Documento fuente de requerimientos', 'Levantado de requerimientos, versión 1.0, 12 de septiembre de 2026'],
    ['Repositorio de código', 'https://github.com/HugoUMG/ProyectoSeminario (rama main)'],
    ['Aplicación publicada', 'https://hugoumg.github.io/ProyectoSeminario/'],
    ['Licencia de terceros', 'SheetJS Community Edition (Apache 2.0)'],
  ], [30, 70]),
  salto(),
  h1('Índice'), ...indice(), salto(),
);

// 1. Introducción
add(T(1, '1. Introducción'),
  T(2, '1.1 Propósito del documento'),
  p('Este documento describe la arquitectura, el diseño, las reglas de negocio implementadas, las pruebas realizadas y los procedimientos de despliegue y operación del sistema de control de asistencia y calificación del curso de Educación Física. Su finalidad es permitir que cualquier persona con conocimientos de desarrollo web pueda comprender, mantener y evolucionar el sistema sin depender de sus autores originales.'),
  T(2, '1.2 Alcance'),
  p('Cubre la versión 1.0 del sistema: una aplicación web progresiva (PWA) de un solo usuario que funciona sin conexión en el teléfono de la docente. Incluye la importación del listado de alumnos, el registro diario de marcas y observaciones, el cálculo automático de la nota actitudinal y de unidad, la consolidación anual, la exportación a Excel, el respaldo de datos y el control de acceso mediante PIN. No cubre la sincronización entre dispositivos ni el acceso de alumnos o padres, excluidos explícitamente del alcance del proyecto.'),
  T(2, '1.3 Audiencia'),
  tabla(['Lector', 'Secciones de mayor interés'], [
    ['Evaluadores del seminario', 'Todo el documento; en particular 2, 4, 6 y 9'],
    ['Desarrolladores de mantenimiento', '4, 5, 6, 8, 10 y anexos'],
    ['Personal técnico del establecimiento', '10 (despliegue y operación) y 12.3 (riesgos)'],
  ], [35, 65]),
  T(2, '1.4 Documentos relacionados'),
  tabla(['Documento', 'Contenido'], [
    ['Levantado de requerimientos v1.0 (PDF)', 'Contexto, reglas de negocio, RF, RNF, restricciones y pendientes. Es la fuente normativa del cálculo.'],
    ['README.md / Instrucciones_Docente.pdf', 'Manual de uso para la docente, sin vocabulario técnico.'],
    ['Capturas_App.pdf', 'Pantallas de la aplicación con descripción.'],
    ['CLAUDE.md', 'Resumen operativo para desarrollo: reglas de negocio, stack, estado y convenciones.'],
  ], [38, 62]),
  T(2, '1.5 Convenciones'),
  vineta('**RF-nn** y **RNF-nn** identifican requerimientos funcionales y no funcionales con la numeración del documento de requerimientos.'),
  vineta('Los símbolos **✓, X, \\*, P, E** son las marcas de clase; **○** y **△** son los niveles de observación (advertencia y amonestación).'),
  vineta('Los nombres en `monoespaciado` corresponden a archivos, funciones o campos del código.'),
);

// 2. Descripción general
add(T(1, '2. Descripción general del sistema'),
  T(2, '2.1 Problema y contexto'),
  p('La calificación del curso se llevaba de forma manual: la docente registraba en papel el desempeño de cada alumno clase por clase y, al cierre de cada unidad, transcribía los resultados a una hoja de cálculo. El proceso presentaba tres problemas: el divisor de la nota actitudinal es distinto para cada alumno (las clases con permiso o ensayo de banda no cuentan), lo que hace la transcripción lenta y propensa a error; el registro ocurre en exteriores, de pie y con muy poco tiempo por alumno; y al cierre del ciclo hay que consolidar cuatro unidades para unos 300 expedientes.'),
  p('El establecimiento no puede mantener un servidor propio por el suministro eléctrico inestable de la zona y por la imposibilidad administrativa de justificar un equipo encendido de forma permanente. La solución debía apoyarse en el propio dispositivo de la docente o en servicios en la nube sin costo.'),
  T(2, '2.2 Objetivos'),
  p('**Objetivo general.** Reemplazar el registro manual por una aplicación móvil que capture el desempeño durante la clase y genere automáticamente los cuadros de notas por unidad y el consolidado anual, cumpliendo exactamente el modelo de calificación del curso.'),
  p('**Objetivos específicos.**'),
  vineta('Registrar la marca de cada alumno con un solo toque y completar una sección en menos de dos minutos.'),
  vineta('Calcular la nota actitudinal con divisor individual por alumno, aplicando la reducción del 50 % por amonestación.'),
  vineta('Funcionar sin conexión a internet y sin servidor propio, con los datos almacenados en el dispositivo.'),
  vineta('Exportar los cuadros de notas en Excel y permitir respaldar y restaurar toda la información.'),
  vineta('Proteger el acceso a los datos académicos de menores mediante autenticación local.'),
  T(2, '2.3 Actores'),
  tabla(['Actor', 'Descripción', 'Interacción con el sistema'], [
    ['Docente', 'Único usuario. Tiene a su cargo 14 secciones (11 con entrega de notas), aproximadamente 300 alumnos.', 'Carga listados, registra marcas y observaciones, ingresa exámenes, cierra unidades, exporta cuadros y respalda.'],
    ['Establecimiento', 'Receptor de los cuadros de notas. No accede al sistema.', 'Recibe los archivos Excel exportados.'],
  ], [16, 42, 42]),
  T(2, '2.4 Alcance funcional'),
  tabla(['Incluido en la versión 1.0', 'Excluido'], [
    [[
      vineta('Importación del listado de alumnos desde Excel por grado y sección.'),
      vineta('Registro diario de asistencia y desempeño mediante marcas.'),
      vineta('Observaciones con dos niveles de gravedad y texto obligatorio.'),
      vineta('Cálculo automático de la nota actitudinal sobre 60 puntos.'),
      vineta('Captura del examen final sobre 40 puntos y nota de unidad sobre 100.'),
      vineta('Cierre de unidad, consolidación de las cuatro unidades y promedio final.'),
      vineta('Exportación de cuadros a Excel; respaldo y restauración; PIN de acceso; uso sin conexión.'),
    ], [
      vineta('Acceso de alumnos o padres de familia.'),
      vineta('Sincronización entre varios dispositivos (prevista para una versión posterior).'),
      vineta('Gestión de otros cursos distintos a Educación Física.'),
      vineta('Infraestructura de servidor propio.'),
    ]],
  ], [55, 45]),
  T(2, '2.5 Restricciones del entorno'),
  vineta('**Sin servidor local**: cortes de energía frecuentes y restricción administrativa (Contraloría).'),
  vineta('**Condiciones de uso**: registro en cancha o patio, de pie, en movimiento y bajo luz solar directa; tiempo efectivo de clase limitado.'),
  vineta('**Un solo dispositivo** de captura en la primera versión: el teléfono Android de la docente.'),
  vineta('**Conectividad intermitente**: la aplicación debe operar sin internet y aprovechar la conexión solo para actualizarse.'),
);

// 3. Requerimientos
add(T(1, '3. Requerimientos'),
  T(2, '3.1 Requerimientos funcionales'),
  p('La tabla resume los requerimientos del documento de levantado, su prioridad, el estado de implementación en la versión 1.0 y el módulo responsable.'),
  tabla(['ID', 'Requerimiento', 'Prioridad', 'Estado', 'Módulo'], [
    ['RF-01', 'Cargar el listado de alumnos desde Excel, organizado por grado y sección.', 'Alta', 'Implementado', '`importar.js`, pantalla Importar'],
    ['RF-02', 'Asignar a cada alumno una clave por sección (p. ej. 5A-01).', 'Alta', 'Implementado', '`importar.js`'],
    ['RF-03', 'Registrar asistencia y desempeño por sección y fecha con ✓, X, *, P o E.', 'Alta', 'Implementado', 'Pantalla Pase de lista'],
    ['RF-04', 'Excluir del divisor las clases marcadas con P o E.', 'Alta', 'Implementado', '`calculo.js`'],
    ['RF-05', 'Calcular el divisor de forma individual por alumno.', 'Alta', 'Implementado', '`calculo.js`'],
    ['RF-06', 'Registrar observaciones con nivel y descripción obligatoria.', 'Alta', 'Implementado', 'Diálogo Observación'],
    ['RF-07', 'Aplicar la reducción del 50 % cuando la observación es amonestación.', 'Alta', 'Implementado', '`calculo.js`'],
    ['RF-08', 'Capturar la nota de examen final sobre 40 puntos.', 'Alta', 'Implementado', 'Pantalla Notas'],
    ['RF-09', 'Calcular y mostrar la nota de unidad sobre 100 puntos.', 'Alta', 'Implementado', '`calculo.js`, Notas'],
    ['RF-10', 'Permitir corregir una marca u observación previa.', 'Alta', 'Implementado', 'Pase de lista (clases registradas)'],
    ['RF-11', 'Diferenciar secciones con y sin entrega de notas.', 'Media', 'Implementado', 'Importar, Secciones'],
    ['RF-12', 'Consolidar las cuatro unidades y calcular el promedio final.', 'Alta', 'Implementado', '`calculo.js`, `exportar.js`'],
    ['RF-13', 'Cerrar una unidad para evitar modificaciones, permitiendo consulta.', 'Media', 'Implementado', 'Notas, Pase de lista'],
    ['RF-14', 'Exportar el cuadro por sección con grado, sección y docente en el encabezado.', 'Alta', 'Implementado (formato genérico)', '`exportar.js`'],
    ['RF-15', 'Exportar el consolidado de las cuatro unidades con promedio final.', 'Alta', 'Implementado (formato genérico)', '`exportar.js`'],
    ['RF-16', 'Generar un respaldo descargable de todos los datos.', 'Alta', 'Implementado', '`db.js`, Secciones'],
    ['RF-17', 'Advertir cuando un alumno tenga un número inusualmente bajo de clases calificables.', 'Baja', 'Implementado', '`calculo.js` (`pocasClases`), Notas'],
  ], [9, 45, 11, 17, 18]),
  nota('RF-14 y RF-15 se entregan con un formato propio porque el establecimiento aún no ha entregado su archivo Excel oficial (pendiente 9.1 del documento de requerimientos). Adaptarlo requiere cambiar únicamente `exportar.js`.'),
  T(2, '3.2 Requerimientos no funcionales'),
  tabla(['ID', 'Requerimiento', 'Cómo se cumple'], [
    ['RNF-01', 'No depender de un servidor propio encendido de forma permanente.', 'Aplicación estática publicada en GitHub Pages; toda la lógica y los datos residen en el dispositivo.'],
    ['RNF-02', 'Registrar sin conexión y sincronizar cuando haya conexión.', 'Service worker con caché de la aplicación; datos en IndexedDB. La "sincronización" en v1 consiste en descargar actualizaciones de la aplicación; los datos no viajan por red.'],
    ['RNF-03', 'Diseño responsive, mobile-first.', 'Maquetación de una columna, botones de 50–62 px, reglas específicas para pantallas de menos de 420 px.'],
    ['RNF-04', 'Alto contraste y tipografía legible bajo sol directo.', 'Texto negro sobre blanco, marcas en verde, naranja y rojo saturados, fuente del sistema de 16–26 px.'],
    ['RNF-05', 'Un solo toque por alumno; sección completa en menos de dos minutos.', 'Todos los alumnos inician con ✓; cada toque cicla la marca y guarda al instante (21 ms medidos).'],
    ['RNF-06', 'Interfaz en español sin vocabulario técnico.', 'Todos los textos en español; términos de la docente (marca, unidad, cuadro, respaldo).'],
    ['RNF-07', 'Respaldo y restauración manuales.', 'Archivo JSON descargable con las cinco tablas; restauración con confirmación; recordatorio a los 7 días.'],
    ['RNF-08', '300 alumnos en 14 secciones sin degradación.', 'Medido con 308 alumnos, 1 120 clases y 24 640 marcas: todas las pantallas responden en menos de 100 ms (sección 9.3).'],
    ['RNF-09', 'Acceso protegido mediante autenticación.', 'PIN de 4 a 8 dígitos almacenado como hash SHA-256; se solicita en cada apertura.'],
  ], [10, 35, 55]),
);

// 4. Arquitectura
add(T(1, '4. Arquitectura'),
  T(2, '4.1 Decisión arquitectónica'),
  p('Se evaluaron tres alternativas frente a las restricciones del entorno. La decisión fue una **aplicación web progresiva sin servidor**: un único documento HTML con JavaScript, almacenamiento local en el navegador y publicación como sitio estático.'),
  tabla(['Alternativa', 'Ventajas', 'Inconvenientes', 'Decisión'], [
    ['Servidor en el establecimiento', 'Datos centralizados; acceso desde varios equipos.', 'Inviable: cortes de energía, costo no justificable ante Contraloría, requiere administración.', 'Descartada'],
    ['Aplicación con backend en la nube', 'Sincronización multi-dispositivo; respaldo automático.', 'Requiere conexión para registrar; cuenta y costos recurrentes; complejidad de autenticación y privacidad de datos de menores.', 'Pospuesta (v2)'],
    ['PWA local sin servidor', 'Funciona sin internet; costo cero; un solo archivo desplegable; los datos no salen del dispositivo.', 'Un solo dispositivo; el respaldo depende de la docente.', 'Seleccionada'],
  ], [22, 28, 36, 14]),
  T(2, '4.2 Vista de componentes'),
  ...imagen(path.join(IMG, 'arquitectura.png'), 6.3, 'Figura 1. Componentes del sistema y su entorno.'),
  p('La interfaz (`index.html`) contiene las cinco pantallas y los diálogos, y orquesta tres módulos de lógica pura sin acceso al DOM: `calculo.js` (reglas de calificación), `importar.js` (lectura del listado) y `exportar.js` (construcción de los cuadros). `db.js` encapsula IndexedDB con seis operaciones. `sw.js` implementa el funcionamiento sin conexión. La única dependencia externa es SheetJS, que se descarga del CDN la primera vez y queda en caché.'),
  T(2, '4.3 Tecnologías'),
  tabla(['Componente', 'Tecnología', 'Versión', 'Justificación'], [
    ['Interfaz', 'HTML5, CSS3, JavaScript (ES2022)', 'Estándar', 'Sin framework: 40 KB, sin compilación, mantenible con un editor de texto.'],
    ['Almacenamiento', 'IndexedDB', 'Estándar', 'Capacidad de decenas de MB, transaccional, disponible sin conexión.'],
    ['Sin conexión / instalación', 'Service Worker + Web App Manifest', 'Estándar', 'Caché de la aplicación e instalación como app en Android.'],
    ['Excel', 'SheetJS Community Edition', '0.18.5', 'Lectura y escritura de .xlsx en el navegador.'],
    ['Seguridad', 'Web Crypto API (SHA-256)', 'Estándar', 'Hash del PIN sin bibliotecas adicionales.'],
    ['Publicación', 'GitHub Pages', '—', 'Hosting estático gratuito con HTTPS, requisito de los service workers.'],
    ['Pruebas', 'Node.js (módulo `assert`)', '22', 'Pruebas unitarias sin dependencias.'],
  ], [20, 30, 12, 38]),
  T(2, '4.4 Estructura del repositorio'),
  tabla(['Archivo', 'Responsabilidad', 'Líneas aprox.'], [
    ['`index.html`', 'Interfaz completa: estilos, pantallas, diálogos y lógica de presentación.', '470'],
    ['`db.js`', 'Envoltorio de IndexedDB: `get`, `todos`, `put`, `putMuchos`, `del`, `exportar`, `restaurar`.', '35'],
    ['`calculo.js`', 'Reglas de negocio: `actitudinal`, `notaUnidad`, `notaFinal`, `pocasClases`, `mostrar`.', '45'],
    ['`importar.js`', 'Conversión de una hoja de Excel en registros de alumnos con clave.', '30'],
    ['`exportar.js`', 'Construcción de las filas del cuadro de unidad y del consolidado.', '40'],
    ['`sw.js`', 'Service worker: caché versionada, estrategia cache-first, limpieza de versiones anteriores.', '12'],
    ['`manifest.json`', 'Nombre, ícono y colores para la instalación como aplicación.', '5'],
    ['`test_calculo.js`, `test_importar.js`, `test_exportar.js`', 'Pruebas unitarias ejecutables con Node.js.', '60'],
    ['`README.md`, `hacer_pdf.py`', 'Manual de la docente y script que lo convierte a PDF.', '—'],
    ['`capturas/`, `hacer_capturas_pdf.py`', 'Capturas de pantalla y script que genera Capturas_App.pdf.', '—'],
  ], [34, 52, 14]),
);

// 5. Datos
add(T(1, '5. Diseño de datos'),
  T(2, '5.1 Modelo de datos'),
  ...imagen(path.join(IMG, 'modelo.png'), 6.3, 'Figura 2. Almacenes de IndexedDB y sus relaciones.'),
  p('La base de datos `edfisica` (versión 1) contiene cinco almacenes de objetos. Todos usan la propiedad `id` como clave primaria y no hay índices secundarios: el volumen (unos 1 500 registros para un ciclo completo) permite filtrar en memoria sin costo apreciable.'),
  T(2, '5.2 Diccionario de datos'),
  p('**secciones**'),
  tabla(['Campo', 'Tipo', 'Descripción'], [
    ['id', 'texto', 'Grado + sección, p. ej. "5A". Clave primaria.'],
    ['grado', 'texto', 'Grado escolar ("5").'],
    ['seccion', 'texto', 'Letra de sección ("A").'],
    ['entregaNotas', 'booleano', 'Verdadero si la sección entrega cuadro de notas (RF-11).'],
  ], [22, 16, 62]),
  p('**alumnos**'),
  tabla(['Campo', 'Tipo', 'Descripción'], [
    ['id', 'texto', 'Clave del alumno "{sección}-{nn}", p. ej. "5A-01" (RF-02).'],
    ['nombre', 'texto', 'Nombre completo tal como aparece en el listado.'],
    ['seccionId', 'texto', 'Referencia a `secciones.id`.'],
    ['estado', 'texto', '"activo", "intermitente" o "retirado".'],
    ['fechaRetiro', 'texto | null', 'Fecha ISO (AAAA-MM-DD) desde la que el alumno deja de aparecer en el pase de lista.'],
  ], [22, 16, 62]),
  p('**clases** — un registro por sección y fecha'),
  tabla(['Campo', 'Tipo', 'Descripción'], [
    ['id', 'texto', '"{sección}|{fecha}", p. ej. "5A|2026-09-17".'],
    ['seccionId', 'texto', 'Referencia a `secciones.id`.'],
    ['fecha', 'texto', 'Fecha ISO de la clase.'],
    ['unidad', 'entero', 'Unidad (bimestre) 1 a 4 a la que pertenece la clase.'],
    ['marcas', 'objeto', 'Mapa `alumnoId → { m, obs }`. `m` es la marca (✓, X, *, P, E); `obs` es `null` o `{ nivel: 1|2, texto }`.'],
  ], [22, 16, 62]),
  p('**unidades** — un registro por sección y unidad'),
  tabla(['Campo', 'Tipo', 'Descripción'], [
    ['id', 'texto', '"{sección}|{unidad}", p. ej. "5A|1".'],
    ['seccionId', 'texto', 'Referencia a `secciones.id`.'],
    ['unidad', 'entero', '1 a 4.'],
    ['examenes', 'objeto', 'Mapa `alumnoId → nota` (0 a 40). Ausente si no se ha ingresado.'],
    ['cerrada', 'booleano', 'Verdadero si la unidad está cerrada (RF-13): bloquea marcas y exámenes.'],
  ], [22, 16, 62]),
  p('**config** — registro único con `id = "config"`'),
  tabla(['Campo', 'Tipo', 'Descripción'], [
    ['docente', 'texto', 'Nombre que aparece en el encabezado de los cuadros.'],
    ['unidadActual', 'entero', 'Última unidad usada en el pase de lista; se propone por defecto.'],
    ['pin', 'texto', 'SHA-256 (hexadecimal) de "edfisica:" + PIN. Nunca se guarda el PIN en claro.'],
    ['ultimoRespaldo', 'texto', 'Fecha ISO del último respaldo descargado; alimenta el recordatorio.'],
  ], [22, 16, 62]),
  T(2, '5.3 Decisiones sobre el modelo'),
  vineta('**Una clase por registro.** Las ~30 marcas de una clase viven en un solo objeto. Un toque escribe un objeto pequeño y una unidad completa (20 clases) se lee con una sola consulta filtrada.'),
  vineta('**Claves compuestas legibles** ("5A|2026-09-17") evitan índices secundarios y hacen que el respaldo JSON sea inspeccionable a simple vista.'),
  vineta('**Sin borrado en cascada.** Reimportar una sección reemplaza sus alumnos; las clases anteriores conservan las marcas por clave, de modo que una reimportación accidental no destruye el historial.'),
  vineta('**Notas nunca almacenadas.** Actitudinal, unidad y final se recalculan siempre a partir de marcas y exámenes; no existe riesgo de inconsistencia entre datos y resultados.'),
  T(2, '5.4 Volumen y rendimiento medidos'),
  p('Se cargó un conjunto sintético del tamaño previsto en RNF-08 y se midió en Chrome de escritorio (los tiempos en un teléfono de gama media suelen ser de 3 a 5 veces mayores, aún muy por debajo del segundo):'),
  tabla(['Métrica', 'Valor'], [
    ['Alumnos / secciones', '308 / 14'],
    ['Clases registradas (20 por unidad × 4 unidades × 14 secciones)', '1 120'],
    ['Marcas individuales', '24 640'],
    ['Restauración completa del respaldo', '74 ms'],
    ['Abrir pase de lista (22 alumnos)', '9 ms'],
    ['Abrir notas de unidad (22 alumnos, 20 clases)', '93 ms'],
    ['Guardar un toque de marca', '21 ms'],
    ['Generar consolidado en Excel', '47 ms'],
    ['Tamaño del respaldo JSON', '897 KB'],
    ['Espacio ocupado en IndexedDB', '2,7 MB'],
  ], [60, 40]),
);

// 6. Reglas de negocio
add(T(1, '6. Reglas de negocio y cálculo'),
  p('Esta sección es la especificación normativa del cálculo. Está implementada en `calculo.js` como funciones puras, sin acceso a la interfaz ni a la base de datos, y verificada por `test_calculo.js`.'),
  T(2, '6.1 Estructura de la nota'),
  tabla(['Componente', 'Puntos', 'Origen'], [
    ['Actitudinal', '60', 'Promedio del desempeño en las clases calificables de la unidad.'],
    ['Examen final', '40', 'Ingreso numérico directo de la docente.'],
    ['Nota de unidad', '100', 'Suma de ambos componentes.'],
    ['Nota final del curso', '100', 'Promedio simple de las cuatro unidades (mismo peso).'],
  ], [25, 12, 63]),
  T(2, '6.2 Marcas de clase'),
  tabla(['Marca', 'Porcentaje', 'Criterio', 'Efecto en el divisor'], [
    ['✓', '100 %', 'Uniforme completo, buen comportamiento y buena técnica.', 'Cuenta'],
    ['X', '80 %', 'Ropa deportiva sin uniforme; técnica deficiente pero aceptable.', 'Cuenta'],
    ['*', '40 %', 'Sin uniforme; asiste con ropa no deportiva.', 'Cuenta'],
    ['P', '—', 'Permiso.', 'Se excluye'],
    ['E', '—', 'Ensayo de banda.', 'Se excluye'],
  ], [10, 14, 52, 24]),
  nota('El documento de requerimientos muestra P y E como "50 %" en la tabla 4.2, pero el algoritmo (4.4) y el supuesto 8 establecen que se excluyen del cálculo sin penalización. Se implementó la exclusión; cambiar al 50 % requiere modificar una línea de `calculo.js` (véase 12.2).'),
  T(2, '6.3 Observaciones'),
  tabla(['Nivel', 'Símbolo', 'Efecto sobre la nota', 'Requisito'], [
    ['Advertencia', '○', 'Ninguno; queda como antecedente.', 'Texto libre obligatorio'],
    ['Amonestación', '△', 'Reduce al 50 % el porcentaje obtenido ese día: ✓ → 50 %, X → 40 %, * → 20 %.', 'Texto libre obligatorio'],
  ], [18, 12, 45, 25]),
  p('La elección del nivel queda a criterio de la docente; no existe un número mínimo de advertencias que obligue a amonestar.'),
  T(2, '6.4 Algoritmo de la nota actitudinal'),
  ...imagen(path.join(IMG, 'calculo.png'), 6.3, 'Figura 3. Flujo de cálculo de la nota.'),
  codigo(`clases_calificables = clases de la unidad − marcas P − marcas E     (por alumno)
suma = Σ porcentaje(marca) × (0.5 si tiene amonestación, 1 si no)   (solo calificables)
actitudinal = (suma ÷ clases_calificables) × 60                      (0 si no hay calificables)
nota_unidad = actitudinal + examen                                   (examen acotado a 0..40)
nota_final  = promedio de las notas de unidad existentes`),
  espacio(),
  p('El divisor se calcula **por alumno**, no por sección: dos alumnos de la misma sección pueden tener divisores distintos según sus permisos y ensayos. Las clases en las que el alumno no aparece (por ejemplo, tras su fecha de retiro) tampoco cuentan.'),
  T(2, '6.5 Redondeo'),
  p('Todas las notas se almacenan y propagan con decimales completos. El redondeo a dos decimales ocurre únicamente en la función `mostrar` (pantalla) y en `exportar.js` (Excel). Así el promedio de las cuatro unidades no acumula errores de redondeo.'),
  T(2, '6.6 Estados del alumno'),
  tabla(['Estado', 'Comportamiento'], [
    ['Activo', 'Aparece en el pase de lista y en las notas de todas las unidades.'],
    ['Intermitente', 'Aparece normalmente; simplemente acumula menos clases calificables. Puede activar la alerta de RF-17.'],
    ['Retirado', 'Deja de aparecer en el pase de lista desde la fecha de retiro; conserva el historial de las unidades cursadas y aparece tachado en las notas y con la anotación "Retirado" en los cuadros.'],
  ], [20, 80]),
  T(2, '6.7 Ejemplo de referencia'),
  p('Alumno con 20 clases en la unidad, dos marcadas con permiso. De las 18 restantes: 14 con ✓, 2 con X, 1 con ✓ y amonestación, 1 con *.'),
  tabla(['Detalle', 'Cantidad', 'Porcentaje', 'Subtotal'], [
    ['✓', '14', '100 %', '1 400'], ['X', '2', '80 %', '160'], ['✓ con △', '1', '50 %', '50'], ['*', '1', '40 %', '40'], ['Suma', '18', '—', '1 650'],
  ], [40, 20, 20, 20]),
  p('1 650 ÷ 18 = 91,67 % → 91,67 % × 60 = **55,00 puntos actitudinales**. Este caso es la primera aserción de `test_calculo.js`.'),
  T(2, '6.8 Alerta de pocas clases (RF-17)'),
  p('`pocasClases(n, conteos)` compara las clases calificables del alumno con la mediana de su sección (excluidos los retirados). Se marca al alumno cuando tiene menos de la mitad de la mediana y la mediana es al menos 4, para no generar avisos al inicio de la unidad. El umbral está documentado en el código como una simplificación deliberada y puede ajustarse en un solo lugar.'),
);

// 7. Interfaz
add(T(1, '7. Diseño de la interfaz'),
  T(2, '7.1 Principios'),
  vineta('**Un toque por acción frecuente.** La clase nueva nace con todos los alumnos en ✓; la docente solo toca las excepciones. Cada toque guarda de inmediato; no existe botón "Guardar".'),
  vineta('**Alto contraste.** Fondo blanco, texto negro, marcas en colores saturados (verde, naranja, rojo, gris) con el símbolo grande en blanco.'),
  vineta('**Objetivos táctiles amplios.** Botones de marca de 62 × 56 px y controles de al menos 50 px de alto; `touch-action: manipulation` elimina el retardo del doble toque.'),
  vineta('**Sin vocabulario técnico.** "Marca", "unidad", "cuadro", "respaldo", "clave"; los mensajes explican la consecuencia ("si el teléfono se pierde, se pierde todo").'),
  vineta('**Acciones peligrosas diferenciadas.** Cerrar unidad en ámbar, eliminar clase en rojo suave, siempre con confirmación explícita que nombra lo que se afecta.'),
  T(2, '7.2 Navegación'),
  ...imagen(path.join(IMG, 'navegacion.png'), 6.3, 'Figura 4. Mapa de pantallas.'),
  T(2, '7.3 Pantallas'),
  capturaFila('pin.png', 'Entrada con PIN', ['Se solicita al abrir la aplicación. La primera vez se crea con confirmación; después solo se ingresa. El diálogo es modal y no puede cerrarse sin el PIN correcto.', 'Los dígitos se muestran ocultos y con tamaño grande para facilitar la entrada con el pulgar.']),
  espacio(),
  capturaFila('secciones.png', 'Secciones', ['Pantalla principal. Cada sección muestra su cantidad de alumnos y si entrega notas. **Lista** (azul) abre el pase de lista; **Notas** abre el cuadro de la unidad.', 'Debajo: guardar y restaurar respaldo, cambiar PIN. Un aviso ámbar recuerda respaldar cuando han pasado más de 7 días.']),
  espacio(),
  capturaFila('importar.png', 'Importar alumnos', ['Se elige el archivo Excel, la hoja y se indican grado y sección. La vista previa muestra cuántos alumnos se detectaron y las claves que recibirán.', 'La casilla "Esta sección entrega notas" implementa RF-11. Reimportar una sección existente pide confirmación.']),
  salto(),
  capturaFila('pase.png', 'Pase de lista', ['Fecha (hoy por defecto), unidad y desplegable de clases registradas para volver a un día anterior.', 'Cada fila tiene el botón de observación (○ o △) y la marca de color; un toque cicla ✓ → X → * → P → E y guarda al instante.', 'Con la unidad cerrada las marcas se atenúan y no responden. "Eliminar esta clase" borra un día creado por error.']),
  espacio(),
  capturaFila('obs.png', 'Observación de conducta', ['Se elige el nivel en tarjetas táctiles: advertencia (sin efecto) o amonestación (50 % del día). El texto de la falta es obligatorio; "Quitar" elimina la observación.']),
  espacio(),
  capturaFila('notas.png', 'Notas de la unidad', ['Por alumno: clases calificables, actitudinal sobre 60, examen sobre 40 (editable) y total sobre 100. Los retirados aparecen tachados; los alumnos con muy pocas clases se marcan con ⚠.', '**Cerrar unidad** bloquea marcas y exámenes; **Cuadro unidad** y **Consolidado** exportan a Excel.']),
  espacio(),
  capturaFila('estado.png', 'Estado del alumno', ['Al tocar el nombre en Notas: activo, intermitente o retirado con fecha. El retirado desaparece del pase de lista desde esa fecha y conserva su historial.']),
  espacio(),
  T(2, '7.4 Sistema visual'),
  tabla(['Elemento', 'Valor', 'Uso'], [
    ['Color primario', '#1E3A8A / #1D4ED8', 'Encabezado, botones principales, total de la nota.'],
    ['Fondo / tarjetas', '#F3F4F6 / #FFFFFF', 'Fondo de página y tarjetas con sombra suave.'],
    ['Marcas', 'Verde #15803D · Naranja #F59E0B · Rojo #B91C1C · Gris #6B7280', '✓ · X · * · P/E.'],
    ['Avisos', 'Azul #EFF6FF · Ámbar #FFFBEB · Rojo #FEF2F2', 'Información, precaución (unidad cerrada, respaldo), error (PIN).'],
    ['Tipografía', 'Fuente del sistema (Segoe UI / Roboto), 16–17 px cuerpo, 24 px títulos', 'Sin descarga de fuentes: legibilidad y funcionamiento sin conexión.'],
    ['Radio y sombra', '12 px · 0 1px 3px rgba(0,0,0,.10)', 'Tarjetas, botones y campos.'],
  ], [22, 40, 38]),
);

// 8. Funciones transversales
add(T(1, '8. Funciones transversales'),
  T(2, '8.1 Importación del listado (RF-01, RF-02)'),
  p('SheetJS lee el archivo en el navegador y entrega la hoja como matriz de filas. `alumnosDesdeHoja(hoja, grado, sección)` detecta la columna de nombres como aquella con más celdas de texto que no sean encabezados ("No.", "Nombre", "Alumno"…), descarta filas vacías y numera los alumnos en el orden del listado: `5A-01`, `5A-02`… Si el nombre de la hoja tiene la forma "5A", la pantalla rellena grado y sección automáticamente.'),
  nota('La heurística se validará con el listado real del establecimiento (pendiente). El formato de la clave también depende de confirmar si ya existe un código oficial de alumno.'),
  T(2, '8.2 Exportación de cuadros (RF-14, RF-15)'),
  p('`exportar.js` produce matrices de filas con encabezado institucional (escuela, curso, unidad, grado, sección, docente) y una fila por alumno. La pantalla las convierte en libros de Excel con SheetJS y los descarga como `Cuadro_5A_U1.xlsx` o `Consolidado_5A.xlsx`. En el consolidado, una unidad sin clases queda vacía y no entra al promedio; los retirados llevan la anotación "Retirado". El nombre de la docente se solicita una sola vez y se guarda en `config`.'),
  T(2, '8.3 Respaldo y restauración (RF-16, RNF-07)'),
  p('`DB.exportar()` serializa las cinco tablas a un objeto JSON que se descarga como `respaldo_edfisica_AAAA-MM-DD.json`. `DB.restaurar()` valida la estructura, vacía cada tabla y carga el contenido del archivo: restaurar **reemplaza**, no mezcla. La operación pide confirmación indicando cuántos alumnos y clases se cargarán. La aplicación recuerda la fecha del último respaldo y muestra un aviso cuando han pasado más de siete días.'),
  T(2, '8.4 Seguridad y privacidad (RNF-09)'),
  vineta('El PIN (4 a 8 dígitos) se almacena como SHA-256 de `"edfisica:" + PIN`, calculado con la Web Crypto API; el valor en claro nunca se persiste.'),
  vineta('Se solicita en cada apertura de la aplicación; el diálogo no se puede cerrar con Escape ni tocando fuera.'),
  vineta('Cambiar el PIN exige el PIN actual. No existe recuperación: si se olvida, se reinstala la aplicación y se carga el último respaldo.'),
  vineta('Los datos nunca salen del dispositivo salvo por acción explícita de la docente (exportar o respaldar). No hay telemetría ni servicios de terceros aparte del CDN de SheetJS.'),
  nota('Alcance del control: protege frente al uso casual del teléfono por terceros. No cifra la base de datos; un atacante con acceso físico y herramientas de desarrollo podría leer IndexedDB. Es un compromiso aceptado para la v1 y documentado en 12.3.'),
  T(2, '8.5 Funcionamiento sin conexión y actualización (RNF-01, RNF-02)'),
  ...imagen(path.join(IMG, 'offline.png'), 6.3, 'Figura 5. Ciclo de vida del service worker.'),
  p('`sw.js` mantiene una caché nombrada por versión (`edfisica-v8`). En la instalación descarga todos los archivos de la aplicación con `cache: "reload"` para no arrastrar copias obsoletas de la caché HTTP del navegador; en la activación elimina las cachés de versiones anteriores. Cada petición se responde desde la caché y solo se va a la red si el recurso no está. Cuando se publica una versión nueva, la siguiente apertura con red instala el service worker actualizado y la página se recarga una única vez mediante el evento `controllerchange`, de modo que la docente siempre ve la versión vigente sin intervención.'),
);

// 9. Pruebas
add(T(1, '9. Pruebas y verificación'),
  T(2, '9.1 Pruebas unitarias'),
  p('Las reglas de negocio y los conversores de datos están cubiertos por pruebas ejecutables con Node.js, sin dependencias. Todas pasan en la versión 1.0.'),
  tabla(['Archivo', 'Caso', 'Resultado esperado'], [
    ['test_calculo.js', 'Ejemplo de referencia del documento (20 clases, 2 P, 14 ✓, 2 X, 1 ✓△, 1 *)', '55,00'],
    ['test_calculo.js', 'Todo ✓ con P y E intercalados', '60 exactos; P/E no penalizan'],
    ['test_calculo.js', 'Solo marcas P', '0 (sin clases calificables)'],
    ['test_calculo.js', 'Amonestación sobre ✓, X y *', '30, 24 y 12 puntos respectivamente'],
    ['test_calculo.js', 'Examen fuera de rango (99)', 'Se acota a 40; unidad = 100'],
    ['test_calculo.js', 'Promedio final de 91,666 · 88,333 · 100 · 70', '87,50 sin redondeo acumulado'],
    ['test_calculo.js', 'pocasClases: 3 frente a mediana 18; 10 frente a 18; mediana < 4', 'true; false; false'],
    ['test_importar.js', 'Hoja con título, encabezados, fila vacía y espacios dobles', '3 alumnos 5A-01..03, nombres normalizados'],
    ['test_importar.js', 'Hoja vacía', 'Lista vacía sin error'],
    ['test_exportar.js', 'Cuadro de unidad con decimales largos', 'Encabezado correcto; 55,0001 → 55'],
    ['test_exportar.js', 'Consolidado con dos unidades y alumno retirado', 'Promedio de las existentes; "Retirado" en observación'],
  ], [20, 50, 30]),
  T(2, '9.2 Pruebas funcionales en navegador'),
  p('Se ejecutaron en Chrome (escritorio y emulación de teléfono de 375 px) sobre la aplicación real con datos de prueba, verificando el estado de IndexedDB tras cada acción.'),
  tabla(['Escenario', 'Verificación', 'Resultado'], [
    ['Importar hoja con encabezados y guardar', 'Sección y alumnos creados con claves 5A-01…; reimportar pide confirmación', 'Correcto'],
    ['Pase de lista: toques sucesivos', 'La marca cicla ✓ → X → * y cada toque queda persistido', 'Correcto'],
    ['Observación con texto vacío', 'Se rechaza y se vuelve a pedir el texto', 'Correcto'],
    ['Amonestación y cálculo', 'Alumno con ✓△ + ✓ → 75 % → 45 puntos; con examen 35 → 80', 'Correcto'],
    ['Cerrar unidad', 'Exámenes deshabilitados; pase de lista bloqueado y sin crear clases nuevas; reabrir revierte', 'Correcto'],
    ['Estado retirado con fecha', 'Desaparece del pase de lista desde esa fecha; aparece tachado en notas', 'Correcto'],
    ['Exportar cuadro y consolidado', 'Encabezado con grado, sección y docente; valores redondeados; nombres de archivo', 'Correcto'],
    ['Respaldo → alterar datos → restaurar', 'Estado idéntico al respaldo; archivo inválido rechazado', 'Correcto'],
    ['PIN: crear, no coincidente, incorrecto, correcto, cambiar, cancelar', 'Mensajes de error adecuados; hash actualizado; cancelación sin cambios', 'Correcto'],
    ['Eliminar clase creada por error', 'La clase desaparece del desplegable y de los conteos', 'Correcto'],
    ['Recordatorio de respaldo', 'Aparece con 10 días o sin respaldo; desaparece al respaldar', 'Correcto'],
    ['Actualización de versión', 'Nuevo sw.js instala, limpia caché anterior y recarga una vez', 'Correcto'],
    ['Sin scroll horizontal a 375 px', 'scrollWidth = 375 en todas las pantallas', 'Correcto'],
  ], [32, 50, 18]),
  T(2, '9.3 Verificación de requerimientos no funcionales'),
  tabla(['RNF', 'Método', 'Evidencia'], [
    ['RNF-01 Sin servidor', 'Inspección de la arquitectura', 'Sitio estático; ninguna petición a servicios propios.'],
    ['RNF-02 Sin conexión', 'Desregistrar/registrar SW y verificar Cache Storage', 'Los 8 recursos quedan en caché; la app abre sin red tras la primera visita.'],
    ['RNF-03 / RNF-04 Mobile-first y contraste', 'Emulación de 375 × 812 px; capturas', 'Sin desbordes; texto negro sobre blanco; marcas saturadas.'],
    ['RNF-05 Un toque', 'Medición del guardado tras un toque', '21 ms; 30 alumnos con excepciones típicas se registran en menos de un minuto.'],
    ['RNF-07 Respaldo', 'Ciclo respaldo/restauración', 'Restauración idéntica; recordatorio semanal.'],
    ['RNF-08 Volumen', 'Carga sintética de 308 alumnos / 24 640 marcas', 'Todas las operaciones por debajo de 100 ms (sección 5.4).'],
    ['RNF-09 Autenticación', 'Pruebas del diálogo de PIN', 'Hash SHA-256; sin acceso sin PIN.'],
  ], [26, 34, 40]),
  T(2, '9.4 Ejecución de las pruebas'),
  codigo(`node test_calculo.js && node test_importar.js && node test_exportar.js
# Servidor local para pruebas manuales (el service worker exige http/https)
python -m http.server 8765`),
  espacio(),
);

// 10. Despliegue
add(T(1, '10. Despliegue y operación'),
  T(2, '10.1 Publicación'),
  p('La aplicación se sirve desde GitHub Pages a partir de la rama `main` del repositorio. No hay proceso de compilación: los archivos se publican tal cual. Procedimiento para publicar un cambio:'),
  numerada('Modificar los archivos y ejecutar las pruebas unitarias.', 'pasos1'),
  numerada('Incrementar `VERSION` en `sw.js` (por ejemplo, de `edfisica-v8` a `edfisica-v9`). Sin este paso los dispositivos seguirían usando la caché anterior.', 'pasos1'),
  numerada('Confirmar los cambios (`git commit`) y publicarlos (`git push`). GitHub Pages actualiza el sitio en aproximadamente un minuto.', 'pasos1'),
  numerada('En el teléfono, abrir la aplicación con conexión: la versión nueva se instala y se recarga automáticamente.', 'pasos1'),
  T(2, '10.2 Instalación en el dispositivo'),
  numerada('Abrir https://hugoumg.github.io/ProyectoSeminario/ en Chrome para Android con conexión a internet.', 'pasos2'),
  numerada('Crear el PIN.', 'pasos2'),
  numerada('En el menú de Chrome, elegir "Agregar a pantalla de inicio" o "Instalar aplicación".', 'pasos2'),
  numerada('Abrir la aplicación desde el ícono; a partir de ese momento funciona sin conexión.', 'pasos2'),
  T(2, '10.3 Operación'),
  tabla(['Situación', 'Procedimiento'], [
    ['Respaldo periódico', 'Secciones → Guardar respaldo; conservar el archivo fuera del teléfono (Drive, correo, WhatsApp). La aplicación lo recuerda cada 7 días.'],
    ['Cambio o pérdida del teléfono', 'Instalar la aplicación en el nuevo dispositivo, crear PIN y usar Restaurar con el último respaldo.'],
    ['PIN olvidado', 'No hay recuperación. Desinstalar, reinstalar y restaurar el último respaldo.'],
    ['Nuevo ciclo escolar', 'Guardar el respaldo final del ciclo anterior y reimportar los listados; las clases del ciclo anterior pueden eliminarse restaurando un respaldo vacío o borrando los datos del sitio.'],
    ['Clase registrada en una fecha equivocada', 'Abrir ese día en el pase de lista y usar "Eliminar esta clase".'],
    ['Cambio del formato de cuadro del establecimiento', 'Editar `filasCuadro` y `filasConsolidado` en `exportar.js`; no afecta a los datos.'],
  ], [30, 70]),
  T(2, '10.4 Requisitos del dispositivo'),
  vineta('Android con Chrome 105 o superior (uso de `:has()` en CSS y `<dialog>`); también funciona en navegadores de escritorio modernos.'),
  vineta('Aproximadamente 5 MB de almacenamiento para la aplicación y los datos de un ciclo completo.'),
  vineta('Conexión a internet solo para la instalación inicial y para recibir actualizaciones.'),
);

// 11. Trazabilidad
add(T(1, '11. Matriz de trazabilidad'),
  p('Relación entre cada requerimiento funcional, el componente que lo implementa y la prueba que lo verifica.'),
  tabla(['RF', 'Componente', 'Función / elemento', 'Prueba'], [
    ['RF-01', 'importar.js, Importar', '`alumnosDesdeHoja`, `btnGuardar`', 'test_importar; funcional "Importar"'],
    ['RF-02', 'importar.js', 'Generación de `id` "{sección}-{nn}"', 'test_importar'],
    ['RF-03', 'index.html', '`cargarClase`, `pintarAlumnos`, ciclo de marcas', 'Funcional "toques sucesivos"'],
    ['RF-04 / RF-05', 'calculo.js', '`actitudinal` (filtro P/E, divisor por alumno)', 'test_calculo (referencia, todo ✓, solo P)'],
    ['RF-06', 'index.html', '`editarObs` (texto obligatorio)', 'Funcional "texto vacío"'],
    ['RF-07', 'calculo.js', 'Factor 0,5 por amonestación', 'test_calculo (amonestación)'],
    ['RF-08 / RF-09', 'index.html, calculo.js', 'Entrada de examen, `notaUnidad`', 'test_calculo (examen); funcional "cálculo"'],
    ['RF-10', 'index.html', 'Desplegable de clases registradas; edición de días previos', 'Funcional "eliminar clase" y corrección'],
    ['RF-11', 'index.html', 'Casilla `entrega`; etiqueta "sin entrega"', 'Funcional "Importar"'],
    ['RF-12', 'calculo.js, exportar.js', '`notaFinal`, `filasConsolidado`', 'test_calculo (final); test_exportar'],
    ['RF-13', 'index.html', '`btnCerrar`, bloqueo en pase de lista', 'Funcional "Cerrar unidad"'],
    ['RF-14 / RF-15', 'exportar.js', '`filasCuadro`, `filasConsolidado`, `descargarXlsx`', 'test_exportar; funcional "Exportar"'],
    ['RF-16', 'db.js, index.html', '`DB.exportar`, `DB.restaurar`, botones de respaldo', 'Funcional "Respaldo"'],
    ['RF-17', 'calculo.js, index.html', '`pocasClases`, aviso ⚠', 'test_calculo (pocasClases)'],
  ], [14, 22, 36, 28]),
);

// 12. Decisiones, riesgos
add(T(1, '12. Decisiones, supuestos, riesgos y trabajo futuro'),
  T(2, '12.1 Decisiones de diseño'),
  tabla(['Decisión', 'Alternativa considerada', 'Justificación'], [
    ['JavaScript sin framework', 'React / Vue', 'Un solo usuario y cinco pantallas: un framework añadiría compilación y dependencias sin resolver ningún problema del sistema. Mantenible con un editor de texto.'],
    ['IndexedDB', 'localStorage', 'localStorage es síncrono y limitado a ~5 MB; IndexedDB soporta el volumen del ciclo y transacciones.'],
    ['Una clase por registro', 'Una marca por registro', 'Menos registros, escritura mínima por toque, respaldo legible.'],
    ['Todos ✓ al crear la clase', 'Lista en blanco', 'RNF-05: la mayoría de los alumnos cumple; tocar solo excepciones reduce el tiempo por sección.'],
    ['Notas calculadas, nunca almacenadas', 'Guardar notas', 'Elimina inconsistencias y hace trivial corregir marcas pasadas.'],
    ['PIN con hash local', 'Sin autenticación / cuenta en la nube', 'Cumple RNF-09 sin servidor; costo mínimo para la docente.'],
    ['Cache-first con versión manual', 'Network-first', 'Prioriza el funcionamiento sin conexión; la versión explícita evita servir mezclas de archivos.'],
    ['Formato de exportación genérico', 'Esperar el formato oficial', 'Permite entregar la v1 completa; el cambio queda aislado en `exportar.js`.'],
  ], [24, 24, 52]),
  T(2, '12.2 Supuestos y pendientes con el establecimiento'),
  tabla(['Tema', 'Supuesto adoptado en v1', 'Pendiente'], [
    ['Marcas P y E', 'Se excluyen del divisor sin penalización (§4.4 del levantado).', 'Confirmar con la docente; si valen 50 %, cambiar `PORCENTAJE` en `calculo.js`.'],
    ['Formato oficial del cuadro', 'Formato propio con encabezado institucional.', 'Recibir el Excel oficial y replicar su estructura.'],
    ['Clave del alumno', '"{sección}-{nn}" en el orden del listado.', 'Confirmar si existe un código oficial de alumno.'],
    ['Calendario de unidades', 'La docente elige la unidad; la app recuerda la última.', 'Con las fechas de cada unidad, la app podría seleccionarla automáticamente.'],
    ['Aprobación y retirados', 'No se calcula aprobado/reprobado; los retirados se marcan en el consolidado.', 'Definir nota mínima y tratamiento de retirados en el promedio.'],
    ['Peso de las unidades', 'Las cuatro unidades pesan igual.', '—'],
  ], [22, 40, 38]),
  T(2, '12.3 Riesgos y mitigaciones'),
  tabla(['Riesgo', 'Impacto', 'Mitigación'], [
    ['Pérdida o daño del teléfono', 'Pérdida de los datos del ciclo', 'Respaldo manual descargable, recordatorio semanal, restauración probada. Mitigación definitiva: sincronización en la nube (v2).'],
    ['PIN olvidado', 'Acceso bloqueado', 'Reinstalación y restauración del último respaldo; procedimiento documentado para la docente.'],
    ['Borrado de datos del sitio por el navegador', 'Pérdida de datos', 'La instalación como PWA reduce el riesgo de desalojo; el respaldo es la salvaguarda.'],
    ['Listado real con formato distinto al previsto', 'Importación incorrecta', 'Vista previa antes de guardar; heurística ajustable en `importar.js`.'],
    ['Acceso físico con herramientas técnicas', 'Lectura de datos', 'Aceptado en v1; cifrado de IndexedDB evaluable en v2.'],
    ['Cambio del formato de entrega', 'Retrabajo en exportación', 'Lógica aislada en `exportar.js` con pruebas.'],
  ], [26, 22, 52]),
  T(2, '12.4 Trabajo futuro'),
  vineta('Sincronización opcional con un servicio gratuito (por ejemplo Google Drive) para respaldo automático y uso en más de un dispositivo.'),
  vineta('Adaptación de la exportación al formato oficial del establecimiento.'),
  vineta('Selección automática de la unidad según el calendario del ciclo.'),
  vineta('Cálculo de aprobación y reporte de alumnos en riesgo.'),
  vineta('Cifrado de los datos en reposo.'),
);

// Anexos
add(T(1, 'Anexo A. Código de las reglas de negocio (calculo.js)'),
  codigo(fs.readFileSync(path.join(P, 'calculo.js'), 'utf8').trimEnd()),
  espacio(),
  T(1, 'Anexo B. Glosario'),
  tabla(['Término', 'Definición'], [
    ['Actitudinal', 'Componente de 60 puntos de la nota de unidad, obtenido del promedio de las marcas de clase.'],
    ['Amonestación (△)', 'Observación de conducta que reduce a la mitad el porcentaje de la clase en que ocurre.'],
    ['Advertencia (○)', 'Observación de conducta sin efecto en la nota; queda como antecedente.'],
    ['Clase calificable', 'Clase de la unidad cuya marca no es P ni E; forma parte del divisor.'],
    ['Clave del alumno', 'Identificador único "{grado}{sección}-{nn}", por ejemplo 5A-01.'],
    ['IndexedDB', 'Base de datos integrada en el navegador, persistente y disponible sin conexión.'],
    ['PWA', 'Aplicación web progresiva: sitio web instalable que funciona sin conexión gracias a un service worker.'],
    ['Service worker', 'Script del navegador que intercepta las peticiones de la aplicación y las sirve desde caché.'],
    ['Unidad', 'Bimestre del ciclo escolar; hay cuatro, de igual peso.'],
  ], [25, 75]),
  T(1, 'Anexo C. Comandos útiles'),
  codigo(`# Pruebas unitarias
node test_calculo.js && node test_importar.js && node test_exportar.js

# Servidor local (http://localhost:8765)
python -m http.server 8765

# Publicar una versión nueva
#   1) subir VERSION en sw.js   2) git commit -am "..."   3) git push

# Regenerar manual de la docente y capturas en PDF
python hacer_pdf.py
python hacer_capturas_pdf.py`),
);

// ---------- documento ----------
const doc = new Document({
  creator: 'Proyecto de Seminario', title: 'Documentación técnica — Sistema de asistencia y calificación de Educación Física',
  styles: {
    default: { document: { run: { font: FUENTE, size: 22 }, paragraph: { spacing: { line: 276 } } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, bold: true, color: AZUL, font: FUENTE }, paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0, keepNext: true } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, color: AZUL2, font: FUENTE }, paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1, keepNext: true } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 23, bold: true, color: GRIS, font: FUENTE }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2, keepNext: true } },
    ],
  },
  numbering: { config: [
    { reference: 'vinetas', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
    { reference: 'pasos1', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
    { reference: 'pasos2', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
  ] },
  sections: [{
    properties: { titlePage: true, page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
    headers: { first: new Header({ children: [new Paragraph('')] }), default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINEA, space: 4 } },
      children: [new TextRun({ text: 'Documentación técnica · Sistema de asistencia y calificación — Educación Física', size: 17, color: GRIS })] })] }) },
    footers: { first: new Footer({ children: [new Paragraph('')] }), default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Página ', size: 17, color: GRIS }), new TextRun({ children: [PageNumber.CURRENT], size: 17, color: GRIS }), new TextRun({ text: ' de ', size: 17, color: GRIS }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 17, color: GRIS })] })] }) },
    children: cuerpo,
  }],
});

Packer.toBuffer(doc).then(buf => {
  const salida = path.join(P, 'Documentacion_Tecnica.docx');
  fs.writeFileSync(salida, buf);
  fs.writeFileSync(path.join(__dirname, 'titulos.json'), JSON.stringify(TITULOS));
  console.log('OK', salida, `${Math.round(buf.length / 1024)} KB`);
});
