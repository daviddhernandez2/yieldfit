// Indicador "este dispositivo tiene una sesión abierta", sin ningún dato dentro (bloque 11).
//
// Desde el bloque 11 el token de acceso vive solo en memoria, así que al abrir la app no hay
// nada en localStorage que diga si el usuario había entrado. App.jsx lo necesita para decidir
// si muestra la intro de bienvenida ANTES de preguntar al servidor. Esto no es una prueba de
// identidad: quien decide si la sesión vale es el servidor, con la cookie de renovación.
const CLAVE = 'yieldfit_con_sesion';

export const haySesionGuardada = () => {
  try {
    return localStorage.getItem(CLAVE) === '1';
  } catch {
    return false;
  }
};

export const marcarSesion = (abierta) => {
  try {
    if (abierta) localStorage.setItem(CLAVE, '1');
    else localStorage.removeItem(CLAVE);
  } catch {
    // Sin localStorage, la intro sale siempre. No pasa nada más.
  }
};
