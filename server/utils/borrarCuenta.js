import User from '../models/User.js';
import Exercise from '../models/Exercise.js';
import Workout from '../models/Workout.js';
import Session from '../models/Session.js';
import Chart from '../models/Chart.js';
import BugReport from '../models/BugReport.js';
import RefreshToken from '../models/RefreshToken.js';
import PasswordReset from '../models/PasswordReset.js';
import Dashboard from '../models/Dashboard.js';

// Todo lo que pertenece a un usuario (campo userId). Al borrar la cuenta se borra todo, sin
// excepciones (bloque 11b): ejercicios, rutinas, sesiones, grupos, reportes de fallos (la
// privacidad va primero, decisión de David), tokens de renovación (sus otros dispositivos
// dejan de poder renovar), enlaces de recuperación de contraseña y el dashboard (bloque 9d).
//
// SI SE AÑADE UNA COLECCIÓN CON userId, TIENE QUE IR EN ESTA LISTA (lo comprueba
// borrarCuenta.test.js). Si no, al borrar una cuenta quedarían datos huérfanos, como los de
// los 4 usuarios borrados a mano (deuda en CLAUDE.md).
export const MODELOS_DEL_USUARIO = [
  Exercise,
  Workout,
  Session,
  Chart,
  BugReport,
  RefreshToken,
  PasswordReset,
  Dashboard,
];

// Borra el usuario y todos sus datos dentro de la transacción `session`: o se borra todo
// o no se borra nada. Primero los datos y el usuario al final: si algo fallara a mitad, la
// transacción lo deshace igualmente, pero el orden deja claro qué depende de qué.
// Devuelve cuántos documentos se borraron de cada colección (para el log).
export const borrarUsuarioYDatos = async (userId, session) => {
  const borrados = {};
  for (const Modelo of MODELOS_DEL_USUARIO) {
    const { deletedCount } = await Modelo.deleteMany({ userId }, { session });
    borrados[Modelo.collection.collectionName] = deletedCount;
  }
  const { deletedCount } = await User.deleteOne({ _id: userId }, { session });
  if (deletedCount !== 1) {
    // Lanzar aborta la transacción: no se borra nada de lo anterior.
    throw new Error('El usuario no existe o ya se había borrado');
  }
  borrados.users = 1;
  return borrados;
};
