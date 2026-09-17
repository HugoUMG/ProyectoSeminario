// Lógica de calificación. Pura, sin DOM. Ver CLAUDE.md § Reglas de negocio.

const PORCENTAJE = { '✓': 100, 'X': 80, '*': 40 };
// P y E: sin porcentaje → salen del divisor (decisión: exclusión, no 50%).

// clases: [{ marca: '✓'|'X'|'*'|'P'|'E', amonestacion?: bool }]
// Devuelve nota actitudinal sobre 60, sin redondear. 0 si no hay clases calificables.
function actitudinal(clases) {
  const calificables = clases.filter(c => c.marca in PORCENTAJE);
  if (calificables.length === 0) return 0;
  const suma = calificables.reduce((s, c) => s + PORCENTAJE[c.marca] * (c.amonestacion ? 0.5 : 1), 0);
  return (suma / calificables.length) * 0.6;
}

// examen: número 0..40. Devuelve nota de unidad sobre 100, sin redondear.
function notaUnidad(clases, examen) {
  return actitudinal(clases) + Math.min(40, Math.max(0, Number(examen) || 0));
}

// unidades: array de hasta 4 notas de unidad. Promedio simple.
function notaFinal(unidades) {
  const n = unidades.filter(u => typeof u === 'number');
  return n.length ? n.reduce((a, b) => a + b, 0) / n.length : 0;
}

// RF-17: ¿n clases calificables es inusualmente bajo frente a la sección?
// ponytail: bajo = menos de la mitad de la mediana, y solo cuando ya hay al menos 4 clases.
function pocasClases(n, conteosSeccion) {
  const s = [...conteosSeccion].sort((a, b) => a - b);
  if (!s.length) return false;
  const mediana = s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  return mediana >= 4 && n < mediana / 2;
}

// Redondeo solo para mostrar/exportar.
const mostrar = x => Math.round(x * 100) / 100;

if (typeof module !== 'undefined') module.exports = { PORCENTAJE, actitudinal, notaUnidad, notaFinal, pocasClases, mostrar };
