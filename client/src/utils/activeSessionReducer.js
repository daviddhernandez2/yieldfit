// Todo lo que le puede pasar a una sesión activa, en una sola función (DECISIONS.md, 0031).
//
// Cómo se usa: ActiveSession.jsx hace `const [session, dispatch] = useReducer(sesionReducer,
// null)` y, en vez de cambiar la sesión, "cuenta lo que ha pasado":
//   dispatch({ type: 'alternarCompletada', exerciseIndex: 0, setIndex: 1 })
// y esta función devuelve la sesión nueva.
//
// Reglas de un reducer, y por qué importan aquí:
//   - Es PURA: con la misma sesión y la misma acción devuelve siempre lo mismo. Nada de
//     Date.now() ni crypto.randomUUID() dentro: los valores aleatorios o de tiempo los pone
//     el componente en la acción. Así se puede probar sin React (activeSessionReducer.test.js).
//   - NO modifica la sesión que recibe: devuelve una copia con el cambio. React compara si
//     el objeto es otro para saber que tiene que repintar y guardar en localStorage.
//
// La forma de la sesión es EXACTAMENTE la que ya se guarda en localStorage (ver
// buildActiveSessionFromWorkout en activeSession.js): una sesión a medias de antes de este
// cambio sigue funcionando después del deploy. El reducer no añade ni quita campos, salvo
// grupoMuscular y tipo al reemplazar un ejercicio (opcionales, bloque 9b).

import { serieAnterior, rellenarConAnterior } from './activeSession.js';
import { moverElemento } from './orden.js';

// Cuántas series tendrá el ejercicio que reemplaza a este: las mismas, y al menos 1 (si
// se hubieran quitado todas, el nuevo no tendría ninguna que hacer). La pantalla la usa
// para generar un id por serie antes de llamar al reducer.
export const seriesAlReemplazar = (ejercicio) => Math.max(1, ejercicio.sets.length);

// Devuelve la sesión con un ejercicio cambiado. El resto de ejercicios son los mismos
// objetos (no se copian): solo cambia lo que tiene que cambiar.
const cambiarEjercicio = (sesion, exerciseIndex, cambio) => ({
  ...sesion,
  ejercicios: sesion.ejercicios.map((ej, i) => (i === exerciseIndex ? cambio(ej) : ej)),
});

// Igual, para una serie de un ejercicio.
const cambiarSerie = (sesion, exerciseIndex, setIndex, cambio) =>
  cambiarEjercicio(sesion, exerciseIndex, (ej) => ({
    ...ej,
    sets: ej.sets.map((set, j) => (j === setIndex ? cambio(set) : set)),
  }));

export const sesionReducer = (sesion, accion) => {
  switch (accion.type) {
    // La sesión leída de localStorage al abrir la pantalla.
    case 'cargar':
      return accion.sesion;

    // Escribir en un campo de una serie: { exerciseIndex, setIndex, cambios: { peso } }.
    case 'actualizarSerie':
      return cambiarSerie(sesion, accion.exerciseIndex, accion.setIndex, (set) => ({
        ...set,
        ...accion.cambios,
      }));

    // Marcar o desmarcar una serie. Al marcarla, los campos vacíos se rellenan con la vez
    // anterior (atajo de repetir, 0029); al desmarcarla, lo rellenado se queda.
    case 'alternarCompletada':
      return cambiarSerie(sesion, accion.exerciseIndex, accion.setIndex, (set) =>
        set.completada
          ? { ...set, completada: false }
          : {
              ...set,
              completada: true,
              ...rellenarConAnterior(set, serieAnterior(sesion, accion.exerciseIndex, accion.setIndex)),
            },
      );

    // Añadir una serie vacía al final. El id lo genera el componente (crypto.randomUUID)
    // para que el reducer siga siendo puro.
    case 'añadirSerie':
      return cambiarEjercicio(sesion, accion.exerciseIndex, (ej) => ({
        ...ej,
        sets: [...ej.sets, { id: accion.id, peso: '', reps: '', completada: false }],
      }));

    case 'quitarSerie':
      return cambiarEjercicio(sesion, accion.exerciseIndex, (ej) => ({
        ...ej,
        sets: ej.sets.filter((_, j) => j !== accion.setIndex),
      }));

    // Lo que devuelve GET /api/sessions/previous-sets (bloque 5).
    case 'guardarAnteriores':
      return { ...sesion, anteriores: accion.anteriores };

    // La vez anterior de un ejercicio que entra a mitad de sesión (al reemplazar). Se suma a
    // la que ya había. Si la sesión aún no tiene `anteriores` (la carga inicial falló), no
    // se crea: así la sesión sigue "sin anteriores" y la próxima vez que se abra los pide
    // todos, incluido este.
    case 'añadirAnteriores':
      if (!sesion.anteriores) return sesion;
      return { ...sesion, anteriores: { ...sesion.anteriores, ...accion.anteriores } };

    // Reemplazar un ejercicio por otro (bloque 6, 0031): el nuevo ocupa el mismo sitio, con
    // el mismo número de series (al menos 1) y el mismo descanso, y los campos vacíos. Lo
    // hecho del ejercicio anterior se pierde (la pantalla lo confirma antes).
    // { exerciseIndex, exerciseId, exerciseNombre, grupoMuscular?, tipo?, ids: [uno por serie] }
    case 'reemplazarEjercicio':
      return cambiarEjercicio(sesion, accion.exerciseIndex, (ej) => ({
        exerciseId: accion.exerciseId,
        exerciseNombre: accion.exerciseNombre,
        // Grupo y tipo para "Pecho · Máquinas" (bloque 9b), si la acción los trae.
        ...(accion.grupoMuscular && { grupoMuscular: accion.grupoMuscular, tipo: accion.tipo }),
        // Solo se puede elegir un ejercicio disponible (el catálogo no deja otros).
        bloqueado: false,
        descansoSegundos: ej.descansoSegundos,
        sets: accion.ids.map((id) => ({ id, peso: '', reps: '', completada: false })),
      }));

    // Añadir ejercicios al final de la sesión (bloque 11d), solo para esta sesión: la rutina no
    // cambia. Cada uno entra con las series vacías que digan sus ids (la pantalla genera
    // SERIES_POR_DEFECTO) y el descanso que traiga la acción.
    // { ejercicios: [{ exerciseId, exerciseNombre, grupoMuscular?, tipo?, descansoSegundos, ids }] }
    case 'añadirEjercicios':
      return {
        ...sesion,
        ejercicios: [
          ...sesion.ejercicios,
          ...accion.ejercicios.map((nuevo) => ({
            exerciseId: nuevo.exerciseId,
            exerciseNombre: nuevo.exerciseNombre,
            ...(nuevo.grupoMuscular && { grupoMuscular: nuevo.grupoMuscular, tipo: nuevo.tipo }),
            // Como al reemplazar: el buscador solo deja elegir ejercicios disponibles.
            bloqueado: false,
            descansoSegundos: nuevo.descansoSegundos,
            sets: nuevo.ids.map((id) => ({ id, peso: '', reps: '', completada: false })),
          })),
        ],
      };

    // Notas de la sesión (bloque 11d): el texto tal cual se escribe; se recorta al guardar.
    // { texto }
    case 'escribirNotas':
      return { ...sesion, notas: accion.texto };

    // Cambiar el orden de los ejercicios arrastrando (bloque 9b): { desde, hasta }.
    case 'moverEjercicio':
      return { ...sesion, ejercicios: moverElemento(sesion.ejercicios, accion.desde, accion.hasta) };

    default:
      // Una acción desconocida es un error de programación: mejor verlo que ignorarlo.
      throw new Error(`Acción desconocida en sesionReducer: ${accion.type}`);
  }
};
