import mongoose from 'mongoose';

// Reporte de un fallo enviado desde el botón de la app (bloque 11b, paso 11b.2).
// Lo lee el admin en /developer (11b.3). Al borrar una cuenta se borran también sus
// reportes (11b.4): la privacidad va primero.
//
// Solo texto y datos técnicos pequeños: nunca capturas de pantalla (los binarios no van a
// MongoDB, ver CLAUDE.md).
const bugReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // "¿Qué ha fallado?" (obligatorio)
    descripcion: {
      type: String,
      required: [true, 'Cuenta qué ha fallado'],
      trim: true,
      maxlength: [2000, 'La descripción no puede superar los 2000 caracteres'],
    },
    // "¿Qué estabas haciendo?" (opcional)
    contexto: {
      type: String,
      trim: true,
      maxlength: [1000, 'El contexto no puede superar los 1000 caracteres'],
    },
    // Lo que se captura solo y el usuario ve antes de enviar:
    // la pantalla (ruta de la app), el navegador y sistema, y el tamaño de la ventana.
    ruta: {
      type: String,
      trim: true,
      maxlength: [300, 'La ruta no puede superar los 300 caracteres'],
    },
    navegador: {
      type: String,
      maxlength: [500, 'El navegador no puede superar los 500 caracteres'],
    },
    pantalla: {
      ancho: { type: Number, min: 0, max: 10000 },
      alto: { type: Number, min: 0, max: 10000 },
    },
    // El admin lo marca resuelto en /developer (11b.3).
    estado: {
      type: String,
      enum: ['pendiente', 'resuelto'],
      default: 'pendiente',
    },
  },
  {
    timestamps: true,
  }
);

// Índices para la bandeja de /developer (11b.3), que ordena del más reciente al más antiguo:
//   - por usuario (también sirve para borrarlos con la cuenta, 11b.4);
//   - por estado (pendiente/resuelto);
//   - sin filtros o solo por fechas.
bugReportSchema.index({ userId: 1, createdAt: -1 });
bugReportSchema.index({ estado: 1, createdAt: -1 });
bugReportSchema.index({ createdAt: -1 });

const BugReport = mongoose.model('BugReport', bugReportSchema);

export default BugReport;
