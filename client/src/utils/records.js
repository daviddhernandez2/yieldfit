// Récords personales de una sesión, tal como los marca el servidor (bloque 4b, DECISIONS 0051).
// Aquí no se decide nada: solo se leen esPR y prAnterior de cada ejercicio de la sesión.
// Lo usan la fila del Historial, el detalle de la sesión y el aviso al terminar un entreno.

// [{ exerciseId, nombre, anterior, nuevo }] en el orden de la sesión, con el 1RM estimado
// anterior y el nuevo. Vacío si la sesión no tiene récords (o si aún no llegan los campos).
export const recordsDeSesion = (sesion) =>
  (sesion?.ejercicios ?? [])
    .filter((ej) => ej.esPR)
    .map((ej) => ({
      exerciseId: ej.exerciseId,
      nombre: ej.nombreSnapshot,
      anterior: ej.prAnterior,
      nuevo: ej.mejor1RM,
    }));

// "Press banca", "Press banca y Sentadilla", "Press banca, Sentadilla y Remo".
export const listarNombres = (nombres) =>
  nombres.length <= 1 ? (nombres[0] ?? '') : `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`;
