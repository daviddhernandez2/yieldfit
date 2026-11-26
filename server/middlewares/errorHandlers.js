// Middleware 404: ruta no encontrada
// Se ejecuta cuando ninguna ruta anterior ha respondido a la petición
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `La ruta ${req.method} ${req.originalUrl} no existe`,
  });
};

// Middleware 500: error genérico del servidor
// Express detecta los middlewares de error porque tienen CUATRO parámetros (err, req, res, next)
// Captura cualquier error que se haya pasado con next(error) o lanzado en un handler async con try/catch
export const errorHandler = (err, req, res, next) => {
  // El log siempre lleva el error completo: es donde se depura (logs de Render).
  console.error('Error capturado:', err);

  const status = err.status || 500;

  // Un cuerpo que pasa del límite de express.json() (100 KB en la API; 12 MB en la importación).
  // Su mensaje en inglés ("request entity too large") no le dice nada al usuario.
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload Too Large', message: 'La petición es demasiado grande' });
  }

  // Un 500 es un fallo nuestro, no del usuario, y su mensaje puede revelar detalles
  // internos (p. ej. "user is not allowed to do action [find] on [yieldfit.users]").
  // Como el cliente muestra response.data.message en pantalla, en producción lo
  // sustituimos por uno genérico. Los errores < 500 (p. ej. un 400 por JSON mal
  // formado) sí describen lo que el usuario hizo mal y se devuelven tal cual.
  const ocultarDetalle = status >= 500 && process.env.NODE_ENV === 'production';
  const message = ocultarDetalle
    ? 'Error interno del servidor. Inténtalo de nuevo.'
    : err.message || 'Error interno del servidor';

  res.status(status).json({
    error: status === 500 ? 'Internal Server Error' : 'Error',
    message,
    // En desarrollo mostramos el stack trace para depurar; en producción lo ocultamos
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};