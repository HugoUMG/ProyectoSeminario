// Importar alumnos desde Excel (RF-01/02). Puro: recibe la hoja como matriz de filas.

// hoja: array de filas (array de celdas), tal como lo da XLSX.utils.sheet_to_json(ws, {header:1}).
// Devuelve [{ id:'5A-01', nombre, seccionId:'5A', estado:'activo', fechaRetiro:null }, ...]
function alumnosDesdeHoja(hoja, grado, seccion) {
  const seccionId = `${grado}${seccion}`.toUpperCase();
  const esNombre = c => typeof c === 'string' && c.trim().length > 3 && !/^(no\.?|n[úu]mero|nombre|alumno|apellidos?)/i.test(c.trim());
  // ponytail: la columna de nombres es la que más textos tiene; el formato real del Excel está pendiente.
  const ancho = Math.max(0, ...hoja.map(f => f.length));
  let col = 0, mejor = -1;
  for (let c = 0; c < ancho; c++) {
    const n = hoja.filter(f => esNombre(f[c])).length;
    if (n > mejor) { mejor = n; col = c; }
  }
  return hoja
    .map(f => f[col]).filter(esNombre)
    .map((nombre, i) => ({
      id: `${seccionId}-${String(i + 1).padStart(2, '0')}`,
      nombre: nombre.trim().replace(/\s+/g, ' '),
      seccionId, estado: 'activo', fechaRetiro: null,
    }));
}

if (typeof module !== 'undefined') module.exports = { alumnosDesdeHoja };
