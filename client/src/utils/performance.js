// Utilidades de cálculo de rendimiento del entrenamiento.
// Centralizadas aquí para reutilizarlas en Inicio, Historial y futuras vistas.

// Fórmula de Epley: estima el 1RM (una repetición máxima) desde una serie real.
// Es el estándar de la industria para tracking de fuerza (Strong, Hevy usan lo mismo).
// Perdona precisión con reps > 12; para el rango típico de entrenamiento (3-12) es fiable.
export const calcularUnaRM = (peso, reps) => {
  const pesoNum = Number(peso) || 0;
  const repsNum = Number(reps) || 0;
  if (pesoNum <= 0 || repsNum <= 0) return 0;
  return pesoNum * (1 + repsNum / 30);
};

// Dado un array de sets, devuelve el 1RM estimado más alto (el "mejor set").
// Se ignoran los sets no válidos (peso 0 o reps 0).
export const mejor1RMDeSets = (sets) => {
  let mejor = 0;
  for (const set of sets) {
    const est = calcularUnaRM(set.peso, set.reps);
    if (est > mejor) mejor = est;
  }
  return mejor;
};

// Dado un array de sesiones ordenadas cronológicamente para UN ejercicio,
// devuelve el array de 1RM estimados (mejor set por sesión).
// Ejemplo entrada: [{fecha, sets: [...]}, {fecha, sets: [...]}]
// Ejemplo salida: [101.3, 107.7, 108.0]
export const seriesTemporal1RM = (sesionesDelEjercicio) => {
  return sesionesDelEjercicio.map((sesion) => mejor1RMDeSets(sesion.sets));
};

// Dada la serie temporal de 1RMs, calcula la media de las variaciones porcentuales.
// Ejemplo: [100, 103, 101, 105] → variaciones [+3%, -1.94%, +3.96%] → media +1.67%.
// Devuelve null si hay menos de 2 puntos (no hay variaciones que promediar).
export const mediaVariaciones = (serieTemporal) => {
  if (serieTemporal.length < 2) return null;
  const variaciones = [];
  for (let i = 1; i < serieTemporal.length; i++) {
    const anterior = serieTemporal[i - 1];
    const actual = serieTemporal[i];
    if (anterior <= 0) continue;
    variaciones.push(((actual - anterior) / anterior) * 100);
  }
  if (variaciones.length === 0) return null;
  return variaciones.reduce((s, v) => s + v, 0) / variaciones.length;
};

// Agrupa las sesiones por ejercicio.
// Recibe el array de sesiones tal cual viene del backend y devuelve un Map:
//   Map<exerciseId, { nombreSnapshot, sesiones: [{fecha, sets}] }>
// Las sesiones dentro de cada ejercicio quedan ordenadas cronológicamente ascendente.
export const agruparPorEjercicio = (sesiones) => {
  const mapa = new Map();

  for (const sesion of sesiones) {
    for (const ej of sesion.ejercicios) {
      const key = String(ej.exerciseId);
      if (!mapa.has(key)) {
        mapa.set(key, {
          exerciseId: key,
          nombreSnapshot: ej.nombreSnapshot,
          sesiones: [],
        });
      }
      mapa.get(key).sesiones.push({
        fecha: sesion.fecha,
        sets: ej.sets,
      });
    }
  }

  // Ordenamos cronológicamente ascendente (más antiguo primero) para
  // que el cálculo de variaciones vaya de pasado a presente.
  for (const grupo of mapa.values()) {
    grupo.sesiones.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  }

  return mapa;
};

// Calcula el rendimiento por ejercicio para el grupo "Todos".
// Solo incluye ejercicios con >= 2 sesiones (necesarias para calcular una variación).
// Devuelve un array de objetos { exerciseId, nombre, porcentaje, iniciales }.
export const calcularProgresoTodos = (sesiones) => {
  const mapa = agruparPorEjercicio(sesiones);
  const resultado = [];

  for (const grupo of mapa.values()) {
    if (grupo.sesiones.length < 2) continue;
    const serie = seriesTemporal1RM(grupo.sesiones);
    const porcentaje = mediaVariaciones(serie);
    if (porcentaje === null) continue;

    resultado.push({
      exerciseId: grupo.exerciseId,
      nombre: grupo.nombreSnapshot,
      porcentaje,
      iniciales: generarIniciales(grupo.nombreSnapshot),
    });
  }

  // Orden descendente por porcentaje para destacar arriba los ejercicios
  // que más han progresado.
  resultado.sort((a, b) => b.porcentaje - a.porcentaje);
  return resultado;
};

// Media del progreso del grupo entero.
export const mediaGrupo = (progresosPorEjercicio) => {
  if (progresosPorEjercicio.length === 0) return null;
  const suma = progresosPorEjercicio.reduce((s, p) => s + p.porcentaje, 0);
  return suma / progresosPorEjercicio.length;
};

// Serie temporal para la gráfica agregada del grupo "Todos".
// Solo se consideran los ejercicios con >= 2 sesiones, el mismo criterio
// que usa la lista de progreso: un ejercicio con una sola medición no
// aporta variación y distorsionaría la media del día.
export const serieAgregadaTodos = (sesiones) => {
  // 1. Determinamos qué ejercicios son elegibles (>= 2 sesiones)
  const mapa = agruparPorEjercicio(sesiones);
  const elegibles = new Set();
  for (const [key, grupo] of mapa) {
    if (grupo.sesiones.length >= 2) elegibles.add(key);
  }

  const puntos = [];
  const sesionesOrdenadas = [...sesiones].sort(
    (a, b) => new Date(a.fecha) - new Date(b.fecha)
  );

  for (const sesion of sesionesOrdenadas) {
    let sumaEj = 0;
    let numEj = 0;
    for (const ej of sesion.ejercicios) {
      if (!elegibles.has(String(ej.exerciseId))) continue; // ← el filtro nuevo
      const mejor = mejor1RMDeSets(ej.sets);
      if (mejor > 0) {
        sumaEj += mejor;
        numEj += 1;
      }
    }
    if (numEj > 0) {
      puntos.push({
        fecha: new Date(sesion.fecha).getTime(),
        media1RM: sumaEj / numEj,
        etiqueta: new Date(sesion.fecha).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
        }),
      });
    }
  }
  return puntos;
};

// Genera iniciales de 2 letras del nombre del ejercicio para el badge.
// "Press banca con barra" → "PB"; "Sentadilla" → "SE".
const generarIniciales = (nombre) => {
  if (!nombre) return '?';
  const palabras = nombre.trim().split(/\s+/);
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
};