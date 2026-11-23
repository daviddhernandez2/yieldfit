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
// cambio sigue funcionando después del deploy. El reducer no añade ni quita campos.

import { serieAnterior, rellenarConAnterior } from './activeSession.js';

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

    default:
      // Una acción desconocida es un error de programación: mejor verlo que ignorarlo.
      throw new Error(`Acción desconocida en sesionReducer: ${accion.type}`);
  }
};
