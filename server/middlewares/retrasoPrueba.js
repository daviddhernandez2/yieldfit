// Retraso artificial para probar en local el aviso de "despertando el servidor"
// (bloque 3). Simula el arranque en frío de Render, que en local no existe.
//
// Uso (desde /server):  RETRASO_PRUEBA_MS=8000 npm run dev
//
// Con NODE_ENV=production se ignora SIEMPRE, aunque la variable esté definida: un
// valor olvidado en Render no puede ralentizar la app real.
// Devuelve el middleware, o null si no hay que retrasar nada.
export const crearRetrasoPrueba = (env = process.env) => {
  if (env.NODE_ENV === 'production') return null;
  const ms = Number(env.RETRASO_PRUEBA_MS);
  if (!Number.isFinite(ms) || ms <= 0) return null;

  console.warn(`Retraso de prueba activo: cada petición espera ${ms} ms (RETRASO_PRUEBA_MS).`);
  return (req, res, next) => {
    setTimeout(next, ms);
  };
};
