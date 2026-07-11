import { createContext, useReducer, useEffect } from 'react';
import { getMe, login as loginApi, register as registerApi } from '@/api/auth.js';

// Estado inicial del contexto.
// status indica en qué fase está la autenticación; el frontend lo usa para
// decidir qué mostrar (un loader durante "loading", la app durante "authenticated").
const initialState = {
  user: null,
  token: localStorage.getItem('yieldfit_token'),
  status: 'loading', // 'loading' | 'authenticated' | 'unauthenticated'
};

// Reducer: una única función que define todas las transiciones de estado posibles.
// Cada caso del switch documenta una acción válida.
function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_SUCCESS':
      return {
        user: action.payload.user,
        token: action.payload.token,
        status: 'authenticated',
      };
    case 'AUTH_FAIL':
      return { user: null, token: null, status: 'unauthenticated' };
    case 'LOGOUT':
      return { user: null, token: null, status: 'unauthenticated' };
    default:
      return state;
  }
}

// El contexto en sí. Lo exportamos para que el hook useAuth lo consuma.
export const AuthContext = createContext(null);

// Provider: el componente que envuelve la app y expone el contexto.
// Tres responsabilidades:
//  1. Al montar, comprobar si hay token y validarlo contra /me.
//  2. Exponer funciones login/register/logout al resto de la app.
//  3. Mantener el token en localStorage sincronizado con el estado.
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Al cargar la app, comprobamos si el token guardado sigue siendo válido.
  // Si lo es, recuperamos el usuario actualizado del backend.
  // Si no, limpiamos y el usuario tendrá que volver a loguearse.
  useEffect(() => {
    const verificarSesion = async () => {
      const token = localStorage.getItem('yieldfit_token');
      if (!token) {
        dispatch({ type: 'AUTH_FAIL' });
        return;
      }
      try {
        const response = await getMe();
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: response.data.user, token },
        });
      } catch {
        // Si el token está caducado o es inválido, /me devuelve 401
        // y el interceptor de axios ya habrá limpiado el storage.
        dispatch({ type: 'AUTH_FAIL' });
      }
    };
    verificarSesion();
  }, []);

  // Función login: llama a la API, guarda el token y actualiza el estado.
  const login = async (credentials) => {
    const response = await loginApi(credentials);
    const { token, user } = response.data;
    localStorage.setItem('yieldfit_token', token);
    dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
    return user;
  };

  // Función register: misma lógica que login porque el backend ya devuelve
  // un token en el registro (el usuario queda logueado automáticamente).
  const register = async (userData) => {
    const response = await registerApi(userData);
    const { token, user } = response.data;
    localStorage.setItem('yieldfit_token', token);
    dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
    return user;
  };

  // Función logout: limpia el storage y actualiza el estado a no autenticado.
  // No hay endpoint en el backend porque JWT es stateless: solo el cliente
  // necesita actuar para cerrar sesión.
  const logout = () => {
    localStorage.removeItem('yieldfit_token');
    dispatch({ type: 'LOGOUT' });
  };

  const value = {
    user: state.user,
    token: state.token,
    status: state.status,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}