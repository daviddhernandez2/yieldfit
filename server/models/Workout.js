import mongoose from 'mongoose';
import { ICONOS_RUTINA } from '../../compartido/pictogramas.js';

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
    // Icono de la rutina (bloque 10): opcional, de una lista cerrada. Son las claves de
    // ICONOS_RUTINA en compartido/pictogramas.js, la misma lista que ofrece el selector del
    // cliente: si alguien manda otra cosa, el enum la rechaza. Sin icono, la app muestra el
    // marco vacío. Se guarda la clave ("empuje"), no el id de la figura, para poder cambiar el
    // dibujo sin migrar las rutinas.
    icono: {
      type: String,
      enum: {
        values: Object.keys(ICONOS_RUTINA),
        message: 'Icono de rutina no válido',
      },
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