# Sistema de asistencia y calificación — Educación Física

Seminario TI. Escuela Oficial Rural Mixta "20 de Octubre" JM, San Francisco el Alto, Totonicapán.
Fuente: `Levantado_Requerimientos_Educacion_Fisica.docx.pdf` v1.0 (12-sep-2026).

## Qué es

App web responsive, **un solo usuario (la docente)**, **un solo dispositivo (teléfono)**, para registrar
desempeño por clase y generar cuadros de notas por unidad y consolidado anual.
~300 alumnos, 14 secciones (solo 11 entregan notas).

## Restricciones duras (no negociables)

- **Sin servidor propio** (cortes de luz, Contraloría). Datos en el dispositivo o nube gratuita.
- **Funciona offline**; sincroniza si hay conexión.
- **Mobile-first**, alto contraste (sol directo), un toque por alumno, sección completa < 2 min.
- Interfaz en **español**, sin jerga técnica.
- Respaldo/restauración manual descargable (RNF-07, RF-16).
- Acceso protegido (datos de menores).

## Reglas de negocio — implementar EXACTAMENTE así

### Nota de unidad = 100 pts
| Componente | Pts | Origen |
|---|---|---|
| Actitudinal | 60 | promedio de marcas de clase |
| Examen final | 40 | ingreso numérico directo |

4 unidades (bimestres), mismo peso. Nota final = promedio simple de las 4.

### Marcas de clase (una por alumno por clase)
| Marca | % | Significado |
|---|---|---|
| `✓` | 100 | uniforme completo, buen comportamiento y técnica |
| `X` | 80 | ropa deportiva sin uniforme / técnica deficiente aceptable |
| `*` | 40 | sin uniforme, ropa no deportiva |
| `P` | — | permiso → **sale del divisor** |
| `E` | — | ensayo de banda → **sale del divisor** |

> El PDF lista P y E como "50%" pero la sección 4.4 y el supuesto 8 dicen que se excluyen del cálculo
> sin penalización. Se implementa la exclusión (4.4 manda). Confirmar con la docente.

### Observaciones (independientes de la marca, texto libre obligatorio)
| Nivel | Símbolo | Efecto |
|---|---|---|
| Advertencia | `○` | ninguno, solo antecedente |
| Amonestación | `△` | **× 0.5** al % del día (✓→50, X→40, *→20) |

Sin mínimo de advertencias para amonestar: criterio libre de la docente.

### Algoritmo actitudinal (divisor POR ALUMNO, no por sección)
```
clases_calificables = clases_del_bimestre − P − E
suma = Σ %(marca) × (0.5 si △ else 1)      // solo clases calificables
actitudinal = (suma / clases_calificables) × 60
```
Ejemplo de referencia (usar como test): 20 clases, 2 P, 14 ✓, 2 X, 1 ✓+△, 1 * → 1650/18 = 91.67% → **55.00**.

### Redondeo
Guardar con decimales. Redondear **solo al mostrar/exportar**. Nunca acumular redondeo entre unidades.

### Estado del alumno
- `activo` — aparece en todas las unidades.
- `intermitente` — aparece normal, acumula menos clases calificables.
- `retirado` — desaparece del registro desde la fecha de retiro; conserva historial.

### Clave de alumno
`{grado}{sección}-{nn}` ej. `5A-01`. Se usa también en observaciones.

## Requerimientos funcionales (resumen)
RF-01 importar alumnos desde Excel (grado/sección) · RF-02 clave por sección · RF-03 marcas por sección+fecha ·
RF-04/05 divisor por alumno excluyendo P/E · RF-06/07 observaciones y −50% · RF-08 examen /40 ·
RF-09 nota unidad /100 · RF-10 corregir marcas/observaciones · RF-11 secciones con/sin entrega ·
RF-12 consolidado 4 unidades + promedio · RF-13 cerrar unidad (solo lectura) · RF-14 exportar cuadro por
sección con grado, sección y docente en encabezado · RF-15 exportar consolidado · RF-16 respaldo descargable ·
RF-17 (baja) avisar si un alumno tiene muy pocas clases calificables vs su sección.

## Pendientes (bloquean partes del desarrollo)
- Excel oficial del formato de entrega → bloquea RF-14/15 exacto.
- Formato de clave / código existente de alumno.
- Fechas de inicio/cierre de las 4 unidades.
- Nota mínima de aprobación y tratamiento de retirados en consolidado.
- Contradicción P/E 50% vs exclusión (ver arriba).

## Stack (decidido)
- PWA de un solo archivo HTML + JS vanilla, sin framework ni build.
- Datos en **IndexedDB** (vía `localStorage` si el volumen lo permite — 300 alumnos × ~80 clases × 4 = ~100k marcas, IndexedDB).
- Excel: **SheetJS** (`xlsx`) desde CDN, único dependency, para RF-01 y RF-14/15/16.
- Service worker mínimo para offline.
- Auth: PIN local (RNF-09). Sin backend → sin usuarios/servidor.
- Sync multi-dispositivo: fuera de alcance v1.

## Estado (16-sep-2026)
Pasos 1–7 hechos: cálculo, modelo+importar, pase de lista, examen/cierre/estado alumno, exportar, respaldo, PIN+offline.
Archivos: `index.html` (UI), `db.js`, `calculo.js`, `importar.js`, `exportar.js`, `sw.js`, `manifest.json`, `test_*.js` (`node test_calculo.js` etc.).
Probar: `python -m http.server 8765` (o `.claude/launch.json`). El service worker exige http(s)/localhost, no `file://`.
Publicar: GitHub Pages u otro hosting estático gratuito. Al cambiar archivos, subir `VERSION` en `sw.js`.
Documentación técnica: `Documentacion_Tecnica.docx/.pdf`, generada con `docs/pasadas.sh` (Node + LibreOffice + PyMuPDF); diagramas en `docs/diagramas.py`.
Compartir: botón «Probar con datos de ejemplo» en estado vacío; `hacer_tarjeta.py` genera `compartir/` (QR, tarjeta PNG/PDF).
Hecho también: eliminar clase, desplegable de clases registradas, recordatorio de respaldo (>7 días), rediseño CSS.
Pendiente: formato Excel oficial. RF-17 hecho (`pocasClases`: < mitad de la mediana de la sección, mediana ≥ 4).

## Convenciones
- Código y UI en español. Comentarios cortos.
- Toda lógica de cálculo en `calculo.js`, pura, sin DOM, con `test_calculo.js` que verifica el ejemplo de referencia.
- Marcar simplificaciones deliberadas con `// ponytail: ...`.
