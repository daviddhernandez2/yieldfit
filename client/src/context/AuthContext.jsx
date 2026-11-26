import { createContext, useReducer, useEffect } from 'react';
import {
  login as loginApi,
  register as registerApi,
  logout as logoutApi,
  deleteAccount,
  changePassword,
  updatePreferencias,
} from '@/api/auth.js';
import { alCaducarSesion, ponerTokenAcceso, renovarSesion } from '@/api/client.js';
import { marcarSesion } from '@/utils/indicadorSesion.js';
import { borrarDatosLocales } from '@/utils/datosLocales.js';

// Estado de la sesión. `status` dice en qué fase está la autenticación; la app lo usa para
// decidir qué mostrar (un loader en "loading", la app en "authenticated").
// El token de acceso NO está aquí: vive en memoria dentro de api/client.js (bloque 11), que
// es quien lo pone en cada petición.
const initialState = {
  user: null,
  status: 'loading', // 'loading' | 'authenticated' | 'unauthenticated'
};

// Reducer: todas las transiciones de estado posibles.
function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_SUCCESS':
      return { user: action.payload.user, status: 'authenticated' };
    case 'AUTH_FAIL':
    case 'LOGOUT':
      return { user: null, status: 'unauthenticated' };
    default:
      return state;
  }
}

// El contexto en sí. Lo exportamos para que el hook useAuth lo consuma.
export const AuthContext = createContext(null);

// Provider: el componente que envuelve la app y expone el contexto (DECISIONS.md 0037).
//  1. Al abrir la app, pide un token de acceso con la cookie de renovación: si la sesión
//     sigue viva (30 días), se entra sin escribir la contraseña.
//  2. Expone login, register y logout.
//  3. Mantiene el indicador "hay sesión" que usa la intro (utils/indicadorSesion.js).
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const entrar = (token, user) => {
    ponerTokenAcceso(token);
    marcarSesion(true);
    dispatch({ type: 'AUTH_SUCCESS', payload: { user } });
  };

  const salir = () => {
    ponerTokenAcceso(null);
    marcarSesion(false);
    dispatch({ type: 'LOGOUT' });
  };

  useEffect(() => {
    // Limpieza única: hasta el bloque 11 el token de 7 días se guardaba en localStorage.
    // Ya no sirve (el servidor cambió de secreto al desplegar) y no debe quedarse ahí.
    try {
      localStorage.removeItem('yieldfit_token');
    } catch {
      // Sin localStorage no había nada que limpiar.
    }

    // ¿Sigue viva la sesión? La cookie de renovación lo dice. Si no hay cookie, ha caducado
    // o el servidor no responde, se trata como "sin sesión" y se va al login.
    renovarSesion()
      .then(({ token, user }) => entrar(token, user))
      .catch(() => {
        marcarSesion(false);
        dispatch({ type: 'AUTH_FAIL' });
      });
  }, []);

  // Si una petición acaba en sesión caducada (la renovación falló), api/client.js lo
  // anuncia y aquí se cierra la sesión. PrivateRoute redirige a /login sin recargar.
  useEffect(
    () =>
      alCaducarSesion(() => {
        marcarSesion(false);
        dispatch({ type: 'LOGOUT' });
      }),
    []
  );

  // Login y registro: el servidor devuelve el token de acceso en el cuerpo (se guarda en
  // memoria) y el de renovación en una cookie httpOnly (la gestiona el navegador).
  const login = async (credentials) => {
    const response = await loginApi(credentials);
    entrar(response.data.token, response.data.user);
    return response.data.user;
  };

  const register = async (userData) => {
    const response = await registerApi(userData);
    entrar(response.data.token, response.data.user);
    return response.data.user;
  };

  // Cerrar sesión: el servidor invalida el token de renovación de este dispositivo. Si esa
  // petición falla (sin conexión), se sale igualmente en el cliente: el token de acceso
  // desaparece de la memoria y la cookie caducará sola.
  // Además se borra lo guardado en el dispositivo (bloque 11b): si otra persona entra después
  // en este mismo móvil, no verá el entreno a medias ni las preferencias del anterior. Por
  // eso Perfil avisa antes si hay un entreno sin terminar.
  // Cuando la sesión caduca sola (alCaducarSesion) NO se borra nada: al volver a entrar, el
  // entreno sigue donde estaba.
  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // Se ignora a propósito: salir no puede depender de la red.
    }
    borrarDatosLocales();
    salir();
  };

  // Borrar la cuenta (bloque 11b). Si el servidor la rechaza (contraseña incorrecta, límite),
  // el error sube a la pantalla y no se toca nada. Si la borra, se limpia también lo que
  // había en este dispositivo y se sale: PrivateRoute lleva a /login.
  const eliminarCuenta = async (password) => {
    await deleteAccount(password);
    borrarDatosLocales();
    salir();
  };

  // Cambiar la contraseña (bloque 11b). El servidor cierra las sesiones de los demás
  // dispositivos y devuelve una nueva para este: se guarda como al iniciar sesión.
  const cambiarContrasena = async (actual, nueva) => {
    const response = await changePassword(actual, nueva);
    entrar(response.data.token, response.data.user);
  };

  // Preferencias de la app (bloque 5c). El servidor devuelve el usuario actualizado y se
  // sustituye en memoria: el token no cambia. Si falla, el error sube a la pantalla.
  const cambiarPreferencias = async (preferencias) => {
    const response = await updatePreferencias(preferencias);
    dispatch({ type: 'AUTH_SUCCESS', payload: { user: response.data.user } });
  };

  const value = {
    user: state.user,
    status: state.status,
    login,
    register,
    logout,
    eliminarCuenta,
    cambiarContrasena,
    cambiarPreferencias,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
