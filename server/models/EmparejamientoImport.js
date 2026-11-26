import mongoose from 'mongoose';
import { ORIGENES_IMPORTACION } from '../data/importacion.js';

// Emparejamiento recordado de la importación (bloque 7b): "Squat (Barbell)" de Strong es mi
// "Sentadilla". Se guarda al importar para que la próxima vez la vista previa lo proponga ya
// emparejado y solo haya que revisar los ejercicios nuevos.
//
// `nombreOrigen` es el nombre tal cual sale en el CSV (sin normalizar): Strong siempre escribe
// igual el mismo ejercicio, y así lo que se ve en la vista previa es lo que se guarda.
//
// Cada documento es UNA respuesta a "¿qué hago con este ejercicio de Strong?", y solo una:
//   - emparejado: lleva `exerciseId` (uno tuyo, o el que se creó al importar);
//   - "No importar" (decisión de David): `omitir: true` y SIN exerciseId. Sus series no se
//     importan y la próxima vista previa lo propone igual, al final de la lista.
// Las dos a la vez, o ninguna, no se guardan (validación de abajo). Cambiar de una a otra es el
// mismo documento: el índice único deja una sola respuesta por nombre de Strong.
//
// Ciclo de vida:
//   - borrar el ejercicio de Yield Fit borra sus emparejamientos (exerciseController.remove): si
//     no, la vista previa propondría un ejercicio que ya no existe. A los "No importar" no les
//     afecta: no tienen ejercicio, y omitir no depende de ninguno tuyo;
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
    // Obligatorio salvo en un "No importar".
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: [
        function () {
          return this.omitir !== true;
        },
        'Falta el ejercicio del emparejamiento',
      ],
    },
    // Solo existe con true. Un false no significa nada distinto a no tenerlo: se quita antes de
    // validar (abajo), para que "tiene omitir" sea siempre "es un No importar".
    omitir: {
      type: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

// Emparejado u "No importar", nunca las dos cosas.
emparejamientoImportSchema.pre('validate', function () {
  if (this.omitir === false) this.omitir = undefined;
  if (this.omitir === true && this.exerciseId) {
    this.invalidate('omitir', 'Un ejercicio que no se importa no lleva emparejamiento');
  }
});

// Un nombre de Strong tiene una sola respuesta (emparejado o "No importar"): al importar se hace
// upsert sobre esta clave. También sirve para leer los de un usuario (prefijo userId), así que no hace falta otro
// índice por userId.
emparejamientoImportSchema.index({ userId: 1, origen: 1, nombreOrigen: 1 }, { unique: true });

const EmparejamientoImport = mongoose.model('EmparejamientoImport', emparejamientoImportSchema);

export default EmparejamientoImport;
