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
  console.error('Error capturado:', err);

  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(status).json({
    error: status === 500 ? 'Internal Server Error' : 'Error',
    message,
    // En desarrollo mostramos el stack trace para depurar; en producción lo ocultamos
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};