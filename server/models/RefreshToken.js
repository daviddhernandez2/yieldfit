import mongoose from 'mongoose';

// Token de renovación (bloque 11, DECISIONS.md 0037). Permite pedir un token de acceso nuevo
// (15 min) sin volver a escribir la contraseña, durante 30 días.
//
// En la base NO se guarda el token, sino su huella (SHA-256): si alguien leyera la base, no
// podría usar los tokens. Funciona como una contraseña, pero sin bcrypt: el token es un valor
// aleatorio de 256 bits, imposible de adivinar, y una huella rápida basta.
const refreshTokenSchema = new mongoose.Schema(
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
    // Todos los tokens que salen de un mismo inicio de sesión (cada renovación crea uno nuevo
    // de la misma familia). Si se detecta que alguien reutiliza uno viejo, se borra la familia
    // entera: es la señal de que el token se ha copiado.
    familia: {
      type: String,
      required: true,
      index: true,
    },
    // Cuándo se usó para renovar (después ya no vale, salvo unos segundos de gracia).
    usadoEn: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Índice TTL: MongoDB borra solo los documentos cuando pasa expiresAt (lo revisa más o menos
// cada minuto). Así la colección no crece con los años.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshToken;
