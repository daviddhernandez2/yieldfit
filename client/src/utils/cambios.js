// ¿Ha cambiado un formulario desde que se abrió? (bloque 11b, paso 11b.7)
//
// Se compara la "foto" del estado inicial (vacío al crear, lo que llegó del servidor al
// editar) con el estado actual. Por valor, no por referencia: si escribes algo y lo borras,
// no hay cambios.
//
// inicial === null significa "todavía cargando": sin foto no hay nada que perder.

// Deja los valores en una forma comparable:
//   - un Set se compara como lista ordenada (el orden en que se marcaron no importa);
//   - las claves de los objetos, ordenadas (el orden de las propiedades no importa);
//   - el orden de las listas SÍ importa: reordenar los ejercicios de una rutina es un cambio.
const normalizar = (valor) => {
  if (valor instanceof Set) return [...valor].map(String).sort();
  if (Array.isArray(valor)) return valor.map(normalizar);
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(
      Object.keys(valor)
        .sort()
        .map((clave) => [clave, normalizar(valor[clave])])
    );
  }
  return valor;
};

export const hayCambios = (inicial, actual) =>
  inicial !== null && JSON.stringify(normalizar(inicial)) !== JSON.stringify(normalizar(actual));
