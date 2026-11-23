import mongoose from 'mongoose';

// Subschema más anidado: cada serie individual del ejercicio.
const setSchema = new mongoose.Schema(
  {
    numeroSerie: {
      type: Number,
      required: true,
      min: 1,
    },
    peso: {
      type: Number,
      min: 0,
      max: 1000,
    },
    reps: {
      type: Number,
      min: 0,
      max: 1000,
    },
    tiempoSegundos: {
      type: Number,
      min: 0,
    },
    distanciaMetros: {
      type: Number,
      min: 0,
    },
    rpe: {
      type: Number,
      min: 0,
      max: 10,
    },
  },
  {
    _id: true,
  }
);

// Subschema intermedio: cada ejercicio dentro de la sesión.
// Guarda snapshots del nombre y tracking para que el historial sea inmutable
// aunque el Exercise original se renombre o se elimine.
const sessionExerciseSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true,
    },
    nombreSnapshot: {
      type: String,
      required: true,
      trim: true,
    },
    trackingSnapshot: {
      type: String,
      required: true,
      enum: ['1RM', 'tiempo_distancia'],
    },
    descansoSegundos: {
      type: Number,
      min: 0,
      max: 900,
    },
    orden: {
      type: Number,
      required: true,
      min: 0,
    },
    // Mejor 1RM estimado de las series de este ejercicio en esta sesión, calculado UNA
    // vez al guardar (utils/unaRM.js). El progreso lo lee de aquí sin tocar las series.
    // null en ejercicios de tiempo/distancia. Las series no se editan nunca (no hay
    // PUT), así que este valor no se desfasa; si cambiara la fórmula, se recalcula con
    // scripts/migrar-1rm.js. No es required: las sesiones anteriores al bloque 4 no
    // lo tenían hasta la migración.
    mejor1RM: {
      type: Number,
      min: 0,
    },
    sets: {
      type: [setSchema],
      validate: {
        validator: function (arr) {
          return arr.length >= 1;
        },
        message: 'Un ejercicio en sesión debe tener al menos 1 serie',
      },
    },
  },
  {
    _id: true,
  }
);

// Schema principal: la sesión de entrenamiento registrada.
const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    workoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workout',
    },
    nombre: {
      type: String,
      required: [true, 'El nombre de la sesión es obligatorio'],
      trim: true,
      minlength: 1,
      maxlength: 60,
    },
    fecha: {
      type: Date,
      required: [true, 'La fecha de la sesión es obligatoria'],
      default: Date.now,
    },
    duracionSegundos: {
      type: Number,
      min: 0,
    },
    ejercicios: {
      type: [sessionExerciseSchema],
      validate: {
        validator: function (arr) {
          return arr.length >= 1;
        },
        message: 'Una sesión debe tener al menos 1 ejercicio',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto crítico para el cálculo dinámico de rendimiento.
// Permite encontrar rápidamente la "sesión anterior del mismo usuario"
// ordenando por fecha descendente.
sessionSchema.index({ userId: 1, fecha: -1 });

const Session = mongoose.model('Session', sessionSchema);

export default Session;