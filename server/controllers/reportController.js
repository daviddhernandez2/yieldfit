import BugReport from '../models/BugReport.js';

// Número entre 0 y 10000, o undefined si no lo es. El tamaño de pantalla es solo
// informativo: un valor raro no debe impedir que llegue el reporte.
const medida = (valor) => {
  const n = Math.round(Number(valor));
  return Number.isFinite(n) && n >= 0 && n <= 10000 ? n : undefined;
};

// POST /api/reports
// Guarda un reporte de fallo del usuario autenticado (bloque 11b).
// Solo se copian los campos conocidos: estado y userId no los decide el cliente.
export const create = async (req, res, next) => {
  try {
    const { descripcion, contexto, ruta, pantalla } = req.body;

    const report = new BugReport({
      userId: req.user._id,
      descripcion,
      contexto,
      ruta,
      // El navegador se toma de la cabecera User-Agent de la propia petición, no del cuerpo:
      // es lo mismo que el formulario enseña (navigator.userAgent), pero no depende de que
      // el cliente lo mande bien.
      navegador: String(req.headers['user-agent'] ?? '').slice(0, 500),
      pantalla: { ancho: medida(pantalla?.ancho), alto: medida(pantalla?.alto) },
    });
    await report.save();

    res.status(201).json({ report });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        error: 'Validation Error',
        message: messages[0] ?? 'Datos no válidos',
        details: messages,
      });
    }
    next(error);
  }
};
