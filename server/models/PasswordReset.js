import mongoose from 'mongoose';

// Enlace de recuperación de contraseña (bloque 11b). Como los tokens de renovación: en la
// base solo está la huella SHA-256 del token; el token en claro solo viaja en el email.
// Quien leyera esta colección no podría usar ningún enlace.
const passwordResetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    hash: {
      type: String,
      required: true,
      unique: true,
    },
    // Momento en que se usó. null = sin usar. Cada enlace sirve una sola vez.
    usadoEn: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índice TTL: MongoDB borra solo los enlaces caducados (unos minutos después de expiresAt).
// La caducidad de verdad la comprueba el código (expiresAt > ahora): el TTL solo limpia.
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);

export default PasswordReset;
