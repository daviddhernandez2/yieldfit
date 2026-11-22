import { useSyncExternalStore } from 'react';
import { suscribirse, estaDespertando } from '@/utils/wakingUp.js';

// true mientras alguna petición al servidor tarde más de 4 s (arranque en frío de
// Render); false el resto del tiempo. Ver utils/wakingUp.js.
//
// useSyncExternalStore es la forma que da React de leer un valor que vive FUERA de
// React: le pasas cómo suscribirse y cómo leer el valor, y el componente se repinta
// solo cuando ese valor cambia.
export function useServerWakingUp() {
  return useSyncExternalStore(suscribirse, estaDespertando);
}
