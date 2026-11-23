import axios from 'axios';
import { vigilarPeticion } from '@/utils/wakingUp.js';

// Instancia de axios configurada para el backend de Yield Fit.
// VITE_API_URL viene de client/.env en local y de las variables de Vercel en producción
// (https://api.yieldfit.app/api). vite.config.js impide arrancar o compilar si falta.
//
// withCredentials: envía y recibe cookies de la API. Hace falta para la cookie httpOnly del
// token de renovación (bloque 11); la API solo la acepta desde los orígenes de CLIENT_ORIGINS.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// ---------------------------------------------------------------------------
// Token de acceso EN MEMORIA (bloque 11, DECISIONS.md 0037)
// Vive en esta variable del módulo, no en localStorage: si hubiera un XSS, no encontraría un
// token guardado. Dura 15 minutos; al recargar la página se pierde y se pide otro con la
// cookie de renovación (renovarSesion).
let tokenAcceso = null;

export const ponerTokenAcceso = (token) => {
  tokenAcceso = token;
};

// Pide un token de acceso nuevo con la cookie de renovación. Si varias peticiones lo piden
// a la vez (p. ej. tres pantallas que reciben 401 al mismo tiempo), comparten UNA sola
// petición: la que esté en curso. Devuelve { token, user } o falla si la sesión caducó.
let renovacionEnCurso = null;

export const renovarSesion = () => {
  if (!renovacionEnCurso) {
    renovacionEnCurso = apiClient
      // sinRenovar: si esta misma petición recibe 401, no se intenta renovar otra vez.
      .post('/auth/refresh', null, { sinRenovar: true })
      .then((res) => {
        tokenAcceso = res.data.token;
        return res.data;
      })
      .finally(() => {
        renovacionEnCurso = null;
      });
  }
  return renovacionEnCurso;
};

// Interceptor de request: añade el token de acceso, si hay, y empieza a cronometrar la
// petición para detectar un arranque en frío del servidor (bloque 3). La función para parar
// el cronómetro viaja dentro de la propia config, que axios devuelve en la respuesta.
apiClient.interceptors.request.use(
  (config) => {
    if (tokenAcceso) {
      config.headers.Authorization = `Bearer ${tokenAcceso}`;
    }
    config.terminarVigilancia = vigilarPeticion();
    return config;
  },
  (error) => Promise.reject(error)
);

// Avisos de "sesión caducada". Este archivo vive fuera de React y no puede navegar ni
// cambiar el estado de la app, así que solo anuncia el hecho: AuthContext se suscribe con
// alCaducarSesion() y cierra la sesión; PrivateRoute redirige a /login (bloque 3).
const oyentesSesionCaducada = new Set();

export const alCaducarSesion = (oyente) => {
  oyentesSesionCaducada.add(oyente);
  return () => oyentesSesionCaducada.delete(oyente);
};

const anunciarSesionCaducada = () => {
  tokenAcceso = null;
  oyentesSesionCaducada.forEach((oyente) => oyente());
};

// Interceptor de response. Un 401 en una petición que LLEVABA token significa que el token
// de acceso caducó (lo normal cada 15 minutos) o no vale. Entonces:
//   1. se renueva con la cookie (una sola vez para todas las que fallen a la vez);
//   2. se repite la petición con el token nuevo, sin que la pantalla se entere;
//   3. si la renovación falla, o la petición repetida vuelve a dar 401, la sesión ha
//      caducado de verdad: se anuncia y se vuelve a /login.
// Un 401 sin token (contraseña incorrecta en el login) no es una sesión caducada: no se toca.
apiClient.interceptors.response.use(
  (response) => {
    response.config.terminarVigilancia?.();
    return response;
  },
  async (error) => {
    const config = error.config;
    // También al fallar: una petición con error ya no está "esperando".
    config?.terminarVigilancia?.();

    const conToken = Boolean(config?.headers?.Authorization);
    if (error.response?.status !== 401 || !conToken || config.sinRenovar) {
      return Promise.reject(error);
    }
    if (config.yaReintentada) {
      anunciarSesionCaducada();
      return Promise.reject(error);
    }
    try {
      await renovarSesion();
    } catch {
      anunciarSesionCaducada();
      return Promise.reject(error);
    }
    // El interceptor de request pondrá el token nuevo en la cabecera.
    return apiClient({ ...config, yaReintentada: true });
  }
);

export default apiClient;
