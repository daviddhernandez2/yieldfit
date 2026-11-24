import mongoose from 'mongoose';

// Valores permitidos de grupoMuscular y tipo, con el texto que ve el usuario.
// Son la ÚNICA fuente de verdad: el schema los usa como enum y el cliente los recibe
// de GET /api/exercises/opciones (DECISIONS.md, 0024). El cliente no tiene copias.
//   - value: lo que se guarda en la base. No se cambia nunca: hay documentos que lo usan.
//   - label: lo que se muestra. Se puede cambiar sin migrar nada (p. ej. tildes).
//   - disponible: false → la app lo muestra como "Próximamente" y no deja elegirlo
//     (DECISIONS.md, 0030). Sin el campo, está disponible.
// Un valor nuevo solo exige desplegar el servidor: el cliente lo mostrará solo.
export const OPCIONES_GRUPO_MUSCULAR = [
  { value: 'Pecho', label: 'Pecho' },
  { value: 'Espalda', label: 'Espalda' },
  { value: 'Hombros', label: 'Hombros' },
  { value: 'Brazos', label: 'Brazos' },
  { value: 'Piernas', label: 'Piernas' },
  { value: 'Core', label: 'Core' },
  { value: 'Cardio', label: 'Cardio' },
];

export const OPCIONES_TIPO = [
  { value: 'Peso corporal', label: 'Peso corporal' },
  { value: 'Pesas libres', label: 'Pesas libres' },
  { value: 'Maquinas', label: 'Máquinas' },
  // Máquinas que se cargan con discos (p. ej. Hammer Strength), no con placas. Bloque 2.
  { value: 'Maquinas de discos', label: 'Máquinas de discos' },
  { value: 'Poleas', label: 'Poleas' },
  // Bloqueado hasta el bloque 6b: la sesión activa aún no sabe registrar tiempo y distancia.
  // Para desbloquearlo, basta con quitar `disponible: false`.
  { value: 'Cardio', label: 'Cardio', disponible: false },
];

// ¿Se puede elegir este tipo al crear un ejercicio o al cambiarle el tipo? Un valor que no
// está en la lista devuelve true: lo rechazará el enum del schema con su propio mensaje.
export const tipoDisponible = (tipo) =>
  OPCIONES_TIPO.find((opcion) => opcion.value === tipo)?.disponible !== false;

const GRUPOS_MUSCULARES = OPCIONES_GRUPO_MUSCULAR.map((o) => o.value);
const TIPOS = OPCIONES_TIPO.map((o) => o.value);

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
    // Mejor 1RM estimado de todas las sesiones de este ejercicio (bloque 4b). Es una COPIA
    // de lo que dicen las sesiones, guardada para decidir si una sesión nueva es récord sin
    // recorrer el historial. La escribe solo el servidor (utils/records.js): los
    // controladores no la aceptan del cliente. Si alguna vez no cuadra, se reconstruye con
    // `npm run migrar:pr`. No existe hasta la primera sesión con 1RM.
    record1RM: {
      type: Number,
      min: 0,
    },
  },
  {
    // createdAt y updatedAt gestionados automáticamente por Mongoose.
    timestamps: true,
  }
);

// Regla única para saber cómo se mide un ejercicio. Solo los ejercicios que son
// simultáneamente de grupo Cardio Y tipo Cardio se miden por tiempo/distancia.
// El resto (incluyendo cardio en máquinas usadas como fuerza) se mide por 1RM
// estimado.
// Se exporta porque hay caminos que no pasan por pre('save'): insertMany (el
// clonado de presets) no ejecuta middlewares de documento. Antes esos caminos
// tenían su propia copia de la regla; ahora todos llaman a esta función.
export const derivarTracking = (grupoMuscular, tipo) => {
  if (grupoMuscular === 'Cardio' && tipo === 'Cardio') {
    return 'tiempo_distancia';
  }
  return '1RM';
};

// Recalcula el tracking antes de cada guardado, para que nunca quede
// desalineado si se edita el grupo o el tipo.
exerciseSchema.pre('save', function () {
  this.tracking = derivarTracking(this.grupoMuscular, this.tipo);
});

const Exercise = mongoose.model('Exercise', exerciseSchema);

export default Exercise;