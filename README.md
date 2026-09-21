# Educación Física — Registro de asistencia y notas

Aplicación para el teléfono que reemplaza el cuaderno de marcas. Calcula sola la nota actitudinal, la nota de unidad y el promedio final, y genera los cuadros en Excel.

**Dirección:** https://hugoumg.github.io/ProyectoSeminario/

Funciona en teléfono o computadora con Chrome, sin instalar nada ni crear cuentas. Para conocerla sin un listado real, toque **Probar con datos de ejemplo** en la primera pantalla. Para compartirla, use la tarjeta con código QR en `compartir/` (PNG para WhatsApp, PDF para imprimir).

---

## 1. Instalar en el teléfono (una sola vez)

1. Abra la dirección de arriba en **Chrome** (necesita internet solo esta primera vez).
2. Cree un **PIN** de 4 a 8 dígitos. Anótelo en un lugar seguro: sin él no se puede entrar.
3. En el menú de Chrome (⋮) toque **"Agregar a pantalla de inicio"** o **"Instalar aplicación"**.
4. Desde ahora abra la app desde el ícono ✓ en su pantalla. **Funciona sin internet.**

## 2. Cargar los alumnos (al inicio del ciclo)

1. Toque **+ Importar**.
2. Elija el archivo Excel con el listado. Si tiene varias hojas, elija la hoja de la sección.
3. Escriba el **grado** (ej. `5`) y la **sección** (ej. `A`).
4. Si a esa sección **no** se le entregan notas, desmarque *"Esta sección entrega notas"*.
5. Revise la vista previa (cuántos alumnos encontró) y toque **Guardar alumnos**.
6. Repita por cada sección.

Cada alumno recibe una clave como `5A-01`, `5A-02`… en el orden del listado.

## 3. Pasar lista en clase

1. Toque **Lista →** en la sección.
2. Verifique la **fecha** (viene la de hoy) y la **unidad** (recuerda la última que usó).
3. Todos aparecen con **✓**. Solo toque a quien sea distinto; cada toque cambia la marca.
4. Para anotar una falta toque el **○** del alumno, elija el nivel, escriba qué hizo (es obligatorio) y **Guardar**.

| Marca | Color | Significa |
|---|---|---|
| **✓** | verde | uniforme completo, buen comportamiento y técnica |
| **X** | naranja | ropa deportiva sin uniforme / técnica deficiente |
| **\*** | rojo | sin uniforme, ropa no deportiva |
| **P** | gris | permiso — no cuenta para la nota |
| **E** | gris | ensayo de banda — no cuenta para la nota |

| Observación | Efecto |
|---|---|
| **○ Advertencia** | queda registrada, no baja la nota |
| **△ Amonestación** | baja a la mitad la nota de ese día |

Todo se guarda al instante. No hay botón de guardar.

**Corregir un día anterior:** en Lista, elija el día en **Clases registradas** (o cambie la fecha) y corrija las marcas.

**Clase creada por error** (por ejemplo, abrió una fecha equivocada): abra ese día y toque **Eliminar esta clase**. Se borran solo las marcas de ese día.

## 4. Notas de la unidad

Toque **Notas** en la sección y elija la unidad. Verá por alumno:

- **Clases** — cuántas clases cuentan (sin P ni E). Si alguien tiene ⚠, tiene muchas menos que el resto: revise si le faltan marcas o si se retiró.
- **Act./60** — nota actitudinal, calculada sola.
- **Ex./40** — escriba aquí la nota del examen.
- **Total** — la nota de la unidad sobre 100.

**Alumno retirado o intermitente:** toque su nombre, cambie el estado. Un retirado deja de aparecer en la lista desde esa fecha, pero conserva sus notas.

**Cerrar unidad:** cuando termine el bimestre, toque **Cerrar unidad**. Así no se cambia nada por accidente. Se puede reabrir.

## 5. Entregar los cuadros

En **Notas**:

- **⬇ Cuadro unidad** — Excel de esa unidad (grado, sección y su nombre en el encabezado).
- **⬇ Consolidado** — Excel con las 4 unidades y el promedio final.

La primera vez le pedirá su nombre para el encabezado. Los archivos quedan en la carpeta *Descargas* del teléfono; de ahí los puede enviar por WhatsApp o correo.

## 6. Respaldo — MUY IMPORTANTE

Los datos viven solo en su teléfono. Si se daña o se pierde, se pierde el ciclo entero.

- La app le avisa en Secciones cuando lleva más de 7 días sin respaldo.
- **⬇ Guardar respaldo** (pantalla de Secciones) descarga un archivo `respaldo_edfisica_FECHA.json`. **Hágalo cada semana** y guárdelo en Drive, correo o WhatsApp a usted misma.
- **⬆ Restaurar** carga ese archivo en un teléfono nuevo o después de una pérdida. Reemplaza todo lo que haya.

## 7. Cambiar el PIN

Pantalla de Secciones → **Cambiar PIN** → escriba el actual y luego el nuevo dos veces.

Si olvidó el PIN: desinstale la app, vuelva a instalarla (paso 1) y cargue su último respaldo.

---

## Cómo se calcula la nota

- Cada clase vale: ✓ = 100 %, X = 80 %, \* = 40 %. Con amonestación (△) se reduce a la mitad.
- P y E no cuentan: ni suman ni restan.
- **Actitudinal** = promedio de las clases que cuentan × 60.
- **Unidad** = actitudinal + examen (máximo 100).
- **Final** = promedio de las 4 unidades.

Ejemplo: 20 clases, 2 con permiso. De las 18: 14 ✓, 2 X, 1 ✓ con amonestación, 1 \* → 91.67 % → **55.00** actitudinales.

---

## Para el desarrollador

Sin servidor, sin framework, sin build. `index.html` + JS vanilla + IndexedDB + SheetJS (CDN). Ver `CLAUDE.md`.

```bash
node test_calculo.js && node test_importar.js && node test_exportar.js
```

Probar en local: `python -m http.server 8765`. Publicar: subir `VERSION` en `sw.js`, commit, push (GitHub Pages).
