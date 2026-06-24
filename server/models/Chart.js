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
  },
  {
    timestamps: true,
  }
);

const Chart = mongoose.model('Chart', chartSchema);

export default Chart;