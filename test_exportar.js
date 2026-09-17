const assert = require('assert');
const { filasCuadro, filasConsolidado } = require('./exportar');
const enc = { grado: '5', seccion: 'A', docente: 'Profa. X', unidad: 1 };

const c = filasCuadro(enc, [{ id: '5A-01', nombre: 'Ana', estado: 'activo', clases: 18, actitudinal: 55.0001, examen: 35, total: 90.0001 }]);
assert.deepStrictEqual(c[2], ['Grado: 5', 'Sección: A', 'Docente: Profa. X']);
assert.deepStrictEqual(c[5], [1, '5A-01', 'Ana', 18, 55, 35, 90, '']);

const k = filasConsolidado(enc, [{ id: '5A-01', nombre: 'Ana', estado: 'retirado', unidades: [91.666, 88.333, null, null] }]);
assert.deepStrictEqual(k[5], [1, '5A-01', 'Ana', 91.67, 88.33, '', '', 90, 'Retirado']);
console.log('OK');
