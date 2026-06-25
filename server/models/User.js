import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

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

// Middleware: hashea la contraseña antes de guardar
// Solo se ejecuta si el campo password ha cambiado (creación o cambio explícito)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Método de instancia: compara una contraseña en texto plano con el hash guardado
// Devuelve true si coinciden, false si no
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

// Método de instancia: convierte el documento a JSON eliminando datos sensibles
// Se llama automáticamente cuando haces res.json(user)
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;