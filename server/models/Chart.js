import mongoose from 'mongoose';

const chartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    nombre: {
      type: String,
      required: [true, 'El nombre de la gráfica es obligatorio'],
      trim: true,
      minlength: [1, 'El nombre debe tener al menos 1 carácter'],
      maxlength: [60, 'El nombre no puede superar los 60 caracteres'],
    },
    exerciseIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exercise',
      },
    ],
    // Grupo "Todos" (bloque 9d, DECISIONS 0052): todos los ejercicios que existen hoy, también
    // los que se creen después. No guarda lista (exerciseIds vacío): el progreso usa todos. Se
    // puede renombrar, borrar y volver a crear desde el catálogo, pero nunca tener una lista
    // elegida a mano. Solo uno por usuario (índice de abajo). En el resto de grupos no existe.
    todos: {
      type: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

// Un grupo "Todos" no tiene lista de ejercicios: si la tuviera, el progreso la ignoraría y la
// pantalla mentiría.
chartSchema.pre('validate', function () {
  if (this.todos && this.exerciseIds.length > 0) {
    this.invalidate('exerciseIds', 'El grupo Todos incluye todos los ejercicios: no lleva una lista');
  }
});

// Como mucho un grupo "Todos" por usuario. Parcial: solo cuenta los documentos con todos: true,
// así que los demás grupos no se ven afectados. La clave incluye `todos` para no chocar con el
// índice { userId: 1 } que ya tiene el campo (misma clave con otras opciones no se permite en
// todas las versiones de MongoDB).
chartSchema.index({ userId: 1, todos: 1 }, { unique: true, partialFilterExpression: { todos: true } });

const Chart = mongoose.model('Chart', chartSchema);

export default Chart;