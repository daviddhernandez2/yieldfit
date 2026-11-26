// Colecciones con datos de un usuario (campo userId), para los scripts de mantenimiento.
//
// Es la misma lista que MODELOS_DEL_USUARIO (utils/borrarCuenta.js), pero con los nombres de
// las colecciones y sin importar los modelos: los scripts no cargan Mongoose (cargar un modelo
// intentaría crear sus índices en producción). utils/borrarCuenta.test.js comprueba que las dos
// listas coinciden: si se añade un modelo con userId, la prueba falla hasta que se añade aquí.
export const COLECCIONES_DEL_USUARIO = [
  'exercises',
  'workouts',
  'sessions',
  'charts',
  'bugreports',
  'refreshtokens',
  'passwordresets',
  'dashboards',
  'emparejamientoimports',
];
