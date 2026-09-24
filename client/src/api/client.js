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

// Interceptor de response: si el backend responde 401 (Unauthorized),
// asumimos que el token caducó o es inválido. Limpiamos el storage y
// redirigimos a /login. El componente que dispara la petición no necesita
// gestionar este caso a mano.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('yieldfit_token');
      // window.location fuerza una navegación completa.
      // Más adelante refinaremos esto con el router para una transición suave.
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;