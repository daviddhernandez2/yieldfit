import { useState, useEffect } from 'react';
import { getOpcionesEjercicio } from '@/api/exercises.js';

// Grupos musculares y tipos de ejercicio, tal como los define el servidor
// (server/models/Exercise.js). El cliente no tiene copias de esas listas: si el
// servidor añade un tipo, aparece aquí sin tocar el cliente (DECISIONS.md, 0024).
//
// Devuelve { opciones, error }:
//   - opciones: null mientras carga; después { gruposMusculares, tipos }, cada uno
//     una lista de { value, label }. `value` es lo que se guarda y se envía a la
//     API; `label` es lo que ve el usuario (p. ej. "Maquinas" → "Máquinas").
//   - error: texto si la petición falla.

// La petición se guarda a nivel de módulo: todas las pantallas comparten la misma,
// y solo se hace una vez por carga de la app. Las listas no cambian mientras la app
// está abierta. Si falla, se olvida, para que la próxima pantalla lo reintente.
let peticion = null;

const cargarOpciones = () => {
  if (!peticion) {
    peticion = getOpcionesEjercicio()
      .then((response) => response.data.opciones)
      .catch((err) => {
        peticion = null;
        throw err;
      });
  }
  return peticion;
};

export default function useOpcionesEjercicio() {
  const [opciones, setOpciones] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Si el componente se desmonta antes de que llegue la respuesta, no se toca
    // su estado (React avisaría de una actualización sobre un componente muerto).
    let montado = true;
    cargarOpciones()
      .then((datos) => {
        if (montado) setOpciones(datos);
      })
      .catch((err) => {
        if (montado) {
          setError(err.response?.data?.message || 'No se han podido cargar los grupos y tipos de ejercicio.');
        }
      });
    return () => {
      montado = false;
    };
  }, []);

  return { opciones, error };
}

// Texto para mostrar de un valor guardado. Si el valor no está en la lista (no
// debería pasar), se muestra tal cual en vez de dejar el hueco vacío.
export const etiquetaDe = (lista, value) =>
  lista.find((opcion) => opcion.value === value)?.label ?? value;
