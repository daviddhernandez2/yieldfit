import axios from 'axios';

// Instancia de axios configurada para el backend de Yield Fit.
// Usamos baseURL para no repetir la URL completa en cada llamada.
// En desarrollo el backend corre en localhost:3000; en producción se
// sustituirá por la URL del despliegue (lo haremos en la Semana 3).
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
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