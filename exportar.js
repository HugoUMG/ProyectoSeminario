// Cuadros de notas como matrices de filas (RF-14/15). Puro; index.html las convierte a Excel con SheetJS.
// ponytail: formato genérico; ajustar al Excel oficial del establecimiento cuando lo entreguen.

const r2 = x => Math.round(x * 100) / 100;

// enc: { grado, seccion, docente, unidad }
// filas: [{ id, nombre, estado, clases, actitudinal, examen, total }]
function filasCuadro(enc, filas) {
  return [
    ['Escuela Oficial Rural Mixta "20 de Octubre" JM'],
    ['Curso: Educación Física', '', `Unidad: ${enc.unidad}`],
    [`Grado: ${enc.grado}`, `Sección: ${enc.seccion}`, `Docente: ${enc.docente}`],
    [],
    ['No.', 'Clave', 'Nombre', 'Clases', 'Actitudinal (60)', 'Examen (40)', 'Total (100)', 'Observación'],
    ...filas.map((f, i) => [i + 1, f.id, f.nombre, f.clases, r2(f.actitudinal), f.examen ?? '', r2(f.total), f.estado === 'retirado' ? 'Retirado' : '']),
  ];
}

// filas: [{ id, nombre, estado, unidades: [u1, u2, u3, u4] (número o null) }]
function filasConsolidado(enc, filas) {
  return [
    ['Escuela Oficial Rural Mixta "20 de Octubre" JM'],
    ['Curso: Educación Física', '', 'Consolidado anual'],
    [`Grado: ${enc.grado}`, `Sección: ${enc.seccion}`, `Docente: ${enc.docente}`],
    [],
    ['No.', 'Clave', 'Nombre', 'Unidad 1', 'Unidad 2', 'Unidad 3', 'Unidad 4', 'Promedio', 'Observación'],
    ...filas.map((f, i) => {
      const u = f.unidades.map(x => typeof x === 'number' ? r2(x) : '');
      const n = f.unidades.filter(x => typeof x === 'number');
      const prom = n.length ? r2(n.reduce((a, b) => a + b, 0) / n.length) : '';
      return [i + 1, f.id, f.nombre, ...u, prom, f.estado === 'retirado' ? 'Retirado' : ''];
    }),
  ];
}

if (typeof module !== 'undefined') module.exports = { filasCuadro, filasConsolidado };
