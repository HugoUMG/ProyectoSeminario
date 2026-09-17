// Almacenamiento local (IndexedDB). Sin servidor. Ver CLAUDE.md § Stack.
//
// Modelo (todos los registros llevan `id` como clave):
//   secciones: { id:'5A', grado:'5', seccion:'A', entregaNotas:true }
//   alumnos:   { id:'5A-01', nombre, seccionId:'5A', estado:'activo'|'intermitente'|'retirado', fechaRetiro:null }
//   clases:    { id:'5A|2026-09-16', seccionId, fecha, unidad:1..4,
//                marcas:{ '5A-01': { m:'✓'|'X'|'*'|'P'|'E', obs:{ nivel:1|2, texto } | null } } }
//   unidades:  { id:'5A|1', seccionId, unidad, examenes:{ '5A-01': 35 }, cerrada:false }
//   config:    { id:'config', docente:'', unidadActual:1, pin:null }

const DB = (() => {
  const STORES = ['secciones', 'alumnos', 'clases', 'unidades', 'config'];
  let db;
  const abrir = () => db ? Promise.resolve(db) : new Promise((res, rej) => {
    const r = indexedDB.open('edfisica', 1);
    r.onupgradeneeded = () => STORES.forEach(s => r.result.createObjectStore(s, { keyPath: 'id' }));
    r.onsuccess = () => res(db = r.result);
    r.onerror = () => rej(r.error);
  });
  const tx = (store, modo, fn) => abrir().then(d => new Promise((res, rej) => {
    const t = d.transaction(store, modo);
    const out = fn(t.objectStore(store));
    t.oncomplete = () => res(out && 'result' in out ? out.result : out);
    t.onerror = () => rej(t.error);
  }));
  return {
    get: (s, id) => tx(s, 'readonly', o => o.get(id)),
    todos: s => tx(s, 'readonly', o => o.getAll()),
    put: (s, obj) => tx(s, 'readwrite', o => o.put(obj)),
    putMuchos: (s, objs) => tx(s, 'readwrite', o => objs.forEach(x => o.put(x))),
    del: (s, id) => tx(s, 'readwrite', o => o.delete(id)),
    // Respaldo completo (RF-16): { secciones:[...], alumnos:[...], ... }
    exportar: async () => Object.fromEntries(await Promise.all(STORES.map(async s => [s, await DB.todos(s)]))),
    // Restaurar reemplaza todo lo que hay.
    restaurar: async datos => { for (const s of STORES) { await tx(s, 'readwrite', o => o.clear()); if (datos[s]) await DB.putMuchos(s, datos[s]); } },
  };
})();
