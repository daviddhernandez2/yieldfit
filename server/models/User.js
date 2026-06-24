import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'El email no tiene un formato válido'],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
    },
    nombreCompleto: {
      type: String,
      required: [true, 'El nombre completo es obligatorio'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [100, 'El nombre no puede superar los 100 caracteres'],
    },
    fechaNacimiento: {
      type: Date,
      required: [true, 'La fecha de nacimiento es obligatoria'],
    },
    peso: {
      type: Number,
      min: [20, 'El peso debe ser al menos 20 kg'],
      max: [400, 'El peso no puede superar los 400 kg'],
    },
    altura: {
      type: Number,
      min: [100, 'La altura debe ser al menos 100 cm'],
      max: [250, 'La altura no puede superar los 250 cm'],
    },
    genero: {
      type: String,
      enum: {
        values: ['masculino', 'femenino', 'otro', 'prefiero-no-decirlo'],
        message: 'Género no válido',
      },
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

export default User;