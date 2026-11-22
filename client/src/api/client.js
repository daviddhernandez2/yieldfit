import axios from 'axios';

// Instancia de axios configurada para el backend de Yield Fit.
// Usamos baseURL para no repetir la URL completa en cada llamada.
// VITE_API_URL viene de client/.env en local y de las variables de Vercel en
// producción. No hay valor por defecto: vite.config.js ya impide arrancar o
// compilar si falta, así que aquí siempre está definida.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Interceptor de request: se ejecuta antes de enviar cualquier petición.
// Lee el token JWT del localStorage y lo añade a la cabecera Authorization
// si está disponible. Así los componentes no tienen que preocuparse de
// adjuntar el token manualmente en cada llamada.
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('yieldfit_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Avisos de "sesión caducada". Este archivo vive fuera de React y no puede navegar
// ni cambiar el estado de la app, así que solo anuncia el hecho: AuthContext se
// suscribe con alCaducarSesion() y cierra la sesión; después PrivateRoute, que ya
// redirige a /login cuando no hay sesión, hace la navegación con React Router.
// Antes se hacía window.location.href = '/login', que recargaba la app entera.
const oyentesSesionCaducada = new Set();

// Registra una función que se llamará cuando la sesión caduque. Devuelve otra
// función para darse de baja (la que usa el return de un useEffect).
export const alCaducarSesion = (oyente) => {
  oyentesSesionCaducada.add(oyente);
  return () => oyentesSesionCaducada.delete(oyente);
};

// Interceptor de response: un 401 en una petición que LLEVABA token significa que
// el token caducó o es inválido. Un 401 sin token (p. ej. contraseña incorrecta en
// el login) no es una sesión caducada: no hay sesión, y el formulario muestra el error.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      localStorage.removeItem('yieldfit_token');
      oyentesSesionCaducada.forEach((oyente) => oyente());
    }
    return Promise.reject(error);
  }
);

export default apiClient;