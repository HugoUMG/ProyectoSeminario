const assert = require('assert');
const { alumnosDesdeHoja } = require('./importar');

const hoja = [
  ['ESCUELA OFICIAL RURAL MIXTA'],
  ['No.', 'Nombre del alumno', 'Sexo'],
  [1, 'Ana  López Pérez', 'F'],
  [2, 'Juan Carlos Tzul', 'M'],
  [],
  [3, 'María Ixchel Chuc', 'F'],
];
const a = alumnosDesdeHoja(hoja, '5', 'a');
assert.deepStrictEqual(a.map(x => x.id), ['5A-01', '5A-02', '5A-03']);
assert.strictEqual(a[0].nombre, 'Ana López Pérez');
assert.strictEqual(a[0].seccionId, '5A');
assert.strictEqual(a[0].estado, 'activo');
assert.deepStrictEqual(alumnosDesdeHoja([], '1', 'B'), []);
console.log('OK');
