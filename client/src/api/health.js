import apiClient from '@/api/client.js';

// GET /api/health
// "Despertador": no devuelve nada útil, solo hace que el servidor arranque si estaba
// dormido (Render, plan gratuito). La portada lo llama al abrirse para que el servidor
// vaya arrancando mientras el usuario lee o pulsa "Iniciar sesión".
export const despertarServidor = () => {
  return apiClient.get('/health');
};
