import mongoose from 'mongoose';

// Listas de valores permitidos. Se extraen como constantes para reutilizarlas
// como enums en el schema y poder exportarlas al frontend en el futuro.
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
    // Referencia al usuario dueño del ejercicio. Indexado porque la query
    // más frecuente del recurso es "dame los ejercicios de este usuario".
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
    // No es required porque se deriva automáticamente del middleware pre('save').
    // Mantenerlo como campo persistido (en lugar de virtual) simplifica las queries
    // del frontend, que pueden filtrar por tracking sin recalcular.
    tracking: {
      type: String,
      enum: {
        values: TRACKINGS,
        message: 'Tracking no válido',
      },
    },
  },
  {
    // createdAt y updatedAt gestionados automáticamente por Mongoose.
    timestamps: true,
  }
);

// Deriva el tracking en función del grupo y el tipo antes de cada guardado.
// Solo los ejercicios que son simultáneamente de grupo Cardio Y tipo Cardio
// se miden por tiempo/distancia. El resto (incluyendo cardio en máquinas
// usadas como fuerza) se mide por 1RM estimado.
exerciseSchema.pre('save', function () {
  if (this.grupoMuscular === 'Cardio' && this.tipo === 'Cardio') {
    this.tracking = 'tiempo_distancia';
  } else {
    this.tracking = '1RM';
  }
});

const Exercise = mongoose.model('Exercise', exerciseSchema);

export default Exercise;