import mongoose from 'mongoose';

// Subschema embebido: cada ejercicio dentro de una rutina
// No genera modelo propio, vive solo dentro de Workout
const workoutExerciseSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: [true, 'El ejercicio es obligatorio'],
    },
    numSeries: {
      type: Number,
      required: [true, 'El número de series es obligatorio'],
      min: [1, 'Debe haber al menos 1 serie'],
      max: [20, 'No se permiten más de 20 series por ejercicio'],
    },
    descansoSegundos: {
      type: Number,
      required: [true, 'El descanso entre series es obligatorio'],
      min: [0, 'El descanso no puede ser negativo'],
      max: [900, 'El descanso máximo es 15 minutos (900 segundos)'],
    },
    orden: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: true,
  }
);

const workoutSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    nombre: {
      type: String,
      required: [true, 'El nombre de la rutina es obligatorio'],
      trim: true,
      minlength: [1, 'El nombre debe tener al menos 1 carácter'],
      maxlength: [60, 'El nombre no puede superar los 60 caracteres'],
    },
    ejercicios: {
      type: [workoutExerciseSchema],
      validate: {
        validator: function (arr) {
          return arr.length >= 1;
        },
        message: 'Una rutina debe tener al menos 1 ejercicio',
      },
    },
  },
  {
    timestamps: true,
  }
);

const Workout = mongoose.model('Workout', workoutSchema);

export default Workout;