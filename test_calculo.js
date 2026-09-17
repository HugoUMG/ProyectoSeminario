const assert = require('assert');
const { actitudinal, notaUnidad, notaFinal, pocasClases, mostrar } = require('./calculo');

const rep = (marca, n, amonestacion = false) => Array.from({ length: n }, () => ({ marca, amonestacion }));

// Ejemplo de referencia del PDF: 20 clases, 2 P, 14 ✓, 2 X, 1 ✓+△, 1 * → 55.00
const ejemplo = [...rep('P', 2), ...rep('✓', 14), ...rep('X', 2), ...rep('✓', 1, true), ...rep('*', 1)];
assert.strictEqual(mostrar(actitudinal(ejemplo)), 55);

// Todo ✓ → 60 exactos; P/E no penalizan
assert.strictEqual(actitudinal([...rep('✓', 9), ...rep('P', 1), ...rep('E', 3)]), 60);
// Sin clases calificables → 0
assert.strictEqual(actitudinal(rep('P', 5)), 0);
// Amonestación: ✓→50, X→40, *→20
assert.strictEqual(actitudinal(rep('✓', 1, true)), 30);
assert.strictEqual(actitudinal(rep('X', 1, true)), 24);
assert.strictEqual(actitudinal(rep('*', 1, true)), 12);
// Unidad = actitudinal + examen, examen acotado a 0..40
assert.strictEqual(notaUnidad(rep('✓', 5), 35), 95);
assert.strictEqual(notaUnidad(rep('✓', 5), 99), 100);
// Final = promedio simple, sin redondeo acumulado
assert.strictEqual(mostrar(notaFinal([91.666, 88.333, 100, 70])), 87.5);

// RF-17: 3 clases frente a una sección con mediana 18 → aviso; 10 no; inicio de unidad (mediana < 4) nunca
const seccion = [18, 18, 17, 18, 3, 10, 18];
assert.strictEqual(pocasClases(3, seccion), true);
assert.strictEqual(pocasClases(10, seccion), false);
assert.strictEqual(pocasClases(0, [2, 2, 0, 2]), false);
assert.strictEqual(pocasClases(0, []), false);

console.log('OK');
