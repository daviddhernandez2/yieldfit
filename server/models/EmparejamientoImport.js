import mongoose from 'mongoose';
import { ORIGENES_IMPORTACION } from '../data/importacion.js';

// Emparejamiento recordado de la importación (bloque 7b): "Squat (Barbell)" de Strong es mi
// "Sentadilla". Se guarda al importar para que la próxima vez la vista previa lo proponga ya
// emparejado y solo haya que revisar los ejercicios nuevos.
//
// `nombreOrigen` es el nombre tal cual sale en el CSV (sin normalizar): Strong siempre escribe
// igual el mismo ejercicio, y así lo que se ve en la vista previa es lo que se guarda.
//
// Ciclo de vida:
//   - borrar el ejercicio de Yield Fit borra sus emparejamientos (exerciseController.remove): si
//     no, la vista previa propondría un ejercicio que ya no existe;
//   - deshacer una importación NO los borra (decisión A): la siguiente vez se recuerdan igual;
//   - borrar la cuenta los borra con el resto (utils/borrarCuenta.js).
const emparejamientoImportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    origen: {
      type: String,
      required: true,
      enum: ORIGENES_IMPORTACION,
    },
    nombreOrigen: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Un nombre de Strong se empareja con un solo ejercicio: al importar se hace upsert sobre esta
// clave. También sirve para leer los de un usuario (prefijo userId), así que no hace falta otro
// índice por userId.
emparejamientoImportSchema.index({ userId: 1, origen: 1, nombreOrigen: 1 }, { unique: true });

const EmparejamientoImport = mongoose.model('EmparejamientoImport', emparejamientoImportSchema);

export default EmparejamientoImport;
