// Lógica de la pantalla de importar desde Strong (bloque 7b), sin React: qué decisión lleva cada
// ejercicio, qué falta, qué se juntará, qué se manda al servidor y qué mensaje se enseña si algo
// falla. La pantalla (pages/Importar) solo pinta. Pruebas en importar.test.js.

// La decisión de cada ejercicio de Strong: { exerciseId } (uno tuyo), { crear: { nombre,
// grupoMuscular, tipo } } (uno nuevo, que se crea al importar), { omitir: true } ("No importar") o
// null (sin emparejar). Al abrir la vista previa, la que propone el servidor.
export const decisionesIniciales = (ejercicios) =>
  Object.fromEntries(
    ejercicios.map((e) => [
      e.nombreStrong,
      e.estado === 'omitido' ? { omitir: true } : e.exerciseId ? { exerciseId: e.exerciseId } : e.crear ? { crear: e.crear } : null,
    ])
  );

export const sinEmparejar = (ejercicios, decisiones) => ejercicios.filter((e) => !decisiones[e.nombreStrong]).length;

// Lo que se manda al servidor: solo las decisiones (el servidor vuelve a leer el CSV).
export const cuerpoDecisiones = (decisiones) => {
  const emparejamientos = {};
  const crear = {};
  const omitir = [];
  for (const [nombre, d] of Object.entries(decisiones)) {
    if (d?.exerciseId) emparejamientos[nombre] = d.exerciseId;
    else if (d?.crear) crear[nombre] = d.crear;
    else if (d?.omitir) omitir.push(nombre);
  }
  return { emparejamientos, crear, omitir };
};

// "No importar": cuántos ejercicios y series se quedan fuera.
export const omitidos = (ejercicios, decisiones) => {
  const fuera = ejercicios.filter((e) => decisiones[e.nombreStrong]?.omitir);
  return { ejercicios: fuera.length, series: fuera.reduce((n, e) => n + e.series, 0) };
};

// Sesiones que se saltan porque solo tienen ejercicios que no importas. Sale de las combinaciones
// de la vista previa (cada conjunto distinto de ejercicios, con cuántas sesiones lo tienen). Las
// que ya se saltan por coincidir con un día tuyo (y no las has incluido) no se cuentan otra vez.
export const saltadasPorOmitir = (vista, decisiones, incluidas) =>
  (vista.combinaciones ?? [])
    .filter((c) => c.ejercicios.every((n) => decisiones[n]?.omitir))
    .reduce((total, c) => total + c.sesiones - c.coincidencias.filter((clave) => !incluidas.has(clave)).length, 0);

// Decisión 2: dos ejercicios de Strong que salen en el mismo entreno y van al mismo ejercicio de
// Yield Fit se juntan en uno. Devuelve los pares, para avisar: [{ a, b, exerciseId }].
// Solo los emparejados con un ejercicio tuyo: dos "crear" con el mismo nombre no se permiten.
export const paresQueSeJuntan = (ejercicios, decisiones) => {
  const pares = [];
  for (const e of ejercicios) {
    const destino = decisiones[e.nombreStrong]?.exerciseId;
    if (!destino) continue;
    for (const otro of e.coincideCon ?? []) {
      if (otro <= e.nombreStrong) continue; // cada par una vez
      if (decisiones[otro]?.exerciseId === destino) pares.push({ a: e.nombreStrong, b: otro, exerciseId: destino });
    }
  }
  return pares;
};

// Sesiones que se importarán: las nuevas menos los días que coinciden con sesiones tuyas y no
// has incluido (decisión B: se saltan por defecto) y menos las que solo tienen ejercicios que no
// importas.
export const sesionesAImportar = (vista, incluidas, decisiones = {}) =>
  vista.resumen.sesiones - vista.coincidencias.filter((c) => !incluidas.has(c.clave)).length - saltadasPorOmitir(vista, decisiones, incluidas);

// Sin mayúsculas, tildes ni espacios de más: la misma regla con la que el servidor rechaza un
// nombre repetido. Aquí solo sirve para avisar antes de enviar.
export const normalizarNombre = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

// ¿Ya tienes un ejercicio con ese nombre? Devuelve el tuyo o null.
export const ejercicioConNombre = (catalogo, nombre) => {
  const clave = normalizarNombre(nombre);
  return clave ? catalogo.find((e) => normalizarNombre(e.nombre) === clave) ?? null : null;
};

// ¿Otro ejercicio de Strong de esta importación ya va a crear uno con ese nombre? Devuelve su
// nombre de Strong o null.
export const otroQueCrea = (decisiones, nombre, nombreStrong) => {
  const clave = normalizarNombre(nombre);
  const [otro] = Object.entries(decisiones).find(([n, d]) => n !== nombreStrong && d?.crear && normalizarNombre(d.crear.nombre) === clave) ?? [];
  return otro ?? null;
};

// Tamaño para leer: "275 KB", "2,7 MB".
export const formatTamano = (bytes) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toLocaleString('es-ES', { maximumFractionDigits: 1 })} MB`;

// Quinta condición de David: el tamaño se comprueba antes de enviar, sin llamar al servidor.
// Devuelve el mensaje de error o null. El límite llega del servidor (GET /api/importar/opciones).
export const errorTamano = (bytes, maxBytes) =>
  bytes > maxBytes
    ? `El archivo pasa de ${formatTamano(maxBytes)}. Exporta desde Strong un periodo más corto.`
    : null;

// "26 nov 2026" (la fecha de un lote).
export const formatFechaLote = (fecha) =>
  new Date(fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');

// Texto de la confirmación de deshacer (decisión de David): número de sesiones y fecha del lote.
export const textoDeshacer = ({ sesiones, fecha }) =>
  `${sesiones === 1 ? 'Se borrará 1 sesión importada' : `Se borrarán ${sesiones} sesiones importadas`} el ${formatFechaLote(fecha)}. ` +
  'Los récords se recalculan. Los ejercicios creados y los emparejamientos se quedan.';

// El mensaje de un fallo. Sin respuesta del servidor (se cortó la conexión, el móvil se quedó sin
// cobertura) no se sabe si llegó a hacerse: no se dice "ha fallado" sin más, sino dónde mirarlo
// (primera condición de David). `que` es 'previa', 'importar' o 'deshacer'. La vista previa no
// escribe nada: ahí basta con decir que no se ha podido conectar.
export const mensajeError = (err, que) => {
  if (!err?.response) {
    if (que === 'previa') return 'No se ha podido conectar con el servidor. Revisa la conexión y vuelve a probar.';
    return que === 'deshacer'
      ? 'Se ha cortado la conexión y no sabemos si se ha deshecho. Mira en Importaciones anteriores si sigue en la lista antes de repetirlo.'
      : 'Se ha cortado la conexión y no sabemos si la importación se ha hecho. Mira en Importaciones anteriores antes de repetirla: lo ya importado no se duplica.';
  }
  const datos = err.response.data;
  return datos?.details?.[0] || datos?.message || 'Algo ha fallado. Inténtalo de nuevo.';
};

// La zona horaria del dispositivo ("Europe/Madrid"): las fechas de Strong son de reloj.
export const zonaDelDispositivo = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
