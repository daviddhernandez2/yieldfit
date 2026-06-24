import mongoose from 'mongoose';

const GRUPOS_MUSCULARES = [
  'Pecho',
  'Espalda',
  'Hombros',
  'Brazos',
  'Piernas',
  'Core',
  'Cardio',
];

const TIPOS = [
  'Peso corporal',
  'Pesas libres',
  'Maquinas',
  'Poleas',
  'Cardio',
];

const TRACKINGS = ['1RM', 'tiempo_distancia'];

const exerciseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    nombre: {
      type: String,
      required: [true, 'El nombre del ejercicio es obligatorio'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [100, 'El nombre no puede superar los 100 caracteres'],
    },
    grupoMuscular: {
      type: String,
      required: [true, 'El grupo muscular es obligatorio'],
      enum: {
        values: GRUPOS_MUSCULARES,
        message: 'Grupo muscular no válido',
      },
    },
    tipo: {
      type: String,
      required: [true, 'El tipo es obligatorio'],
      enum: {
        values: TIPOS,
        message: 'Tipo no válido',
      },
    },
    tracking: {
      type: String,
      enum: {
        values: TRACKINGS,
        message: 'Tracking no válido',
      },
    },
    esPreset: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Exercise = mongoose.model('Exercise', exerciseSchema);

export default Exercise;