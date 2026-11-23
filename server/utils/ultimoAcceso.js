import User from '../models/User.js';

// Último acceso del usuario (bloque 11b), para la lista de usuarios de /developer.
//
// Se llama al registrarse, al iniciar sesión y al renovar el token. Con la app abierta, la
// renovación llega cada 15 minutos (lo que dura el token de acceso), así que el dato tiene
// como mucho una hora de margen. Por eso no se actualiza en requireAuth, que pasa por
// todas las peticiones: sería más exacto, pero una escritura por petición para nada.
const INTERVALO_MS = 60 * 60 * 1000; // como mucho una escritura por hora

export const registrarAcceso = async (user) => {
  const ahora = new Date();
  if (user.ultimoAcceso && ahora - user.ultimoAcceso < INTERVALO_MS) return;

  try {
    // updateOne y no user.save(): solo cambia este campo, sin pasar por pre('save') ni por
    // las validaciones del documento entero. timestamps: false para que updatedAt siga
    // diciendo cuándo cambió el perfil, no cuándo entró.
    await User.updateOne({ _id: user._id }, { $set: { ultimoAcceso: ahora } }, { timestamps: false });
    user.ultimoAcceso = ahora; // la respuesta de esta misma petición ya lo lleva
  } catch (error) {
    // Es un dato de estadística: si falla, se anota y se entra igual.
    console.error('No se pudo guardar el último acceso:', error.message);
  }
};
