// Textos del diálogo de borrar un ejercicio. Están aquí, y no en cada pantalla, porque
// se borra desde dos sitios (la lista de ejercicios y su formulario de edición) y el
// texto tiene que ser idéntico y describir exactamente lo que hace el servidor
// (DECISIONS.md, 0020). Antes estaba duplicado y decía lo contrario de lo que pasaba.

export const tituloBorrarEjercicio = (nombre) => `¿Eliminar «${nombre}»?`;

export const MENSAJE_BORRAR_EJERCICIO =
  'Esta acción no se puede deshacer. Se quitará de tus rutinas y grupos. ' +
  'Tus sesiones pasadas lo conservan en el historial, pero dejará de contar en tu progreso.';
