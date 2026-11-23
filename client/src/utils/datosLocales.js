import { clearActiveSession } from '@/utils/activeSession.js';

// Borra todo lo que la app guarda en ESTE dispositivo (bloque 11b): la sesión activa, las
// preferencias de los grupos, su orden y el indicador de sesión. Se usa al borrar la cuenta.
//
// Se borra por prefijo ("yieldfit_") y no clave a clave: así una clave nueva que se añada
// mañana también se borra sin acordarse de este archivo. Todas las claves de la app
// empiezan por "yieldfit_" y hay que mantenerlo así.
const PREFIJO = 'yieldfit_';

export const borrarDatosLocales = () => {
  // Primero la sesión activa con su función, que además avisa a la MiniSession para que
  // desaparezca de la pantalla.
  try {
    clearActiveSession();
  } catch {
    // Sin localStorage no hay sesión activa que quitar.
  }
  try {
    // Se copian las claves antes de borrar: borrar mientras se recorre localStorage cambia
    // los índices y se saltaría alguna.
    const claves = Object.keys(localStorage).filter((clave) => clave.startsWith(PREFIJO));
    for (const clave of claves) localStorage.removeItem(clave);
  } catch {
    // Sin localStorage no había nada guardado.
  }
};
