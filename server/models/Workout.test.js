// Pruebas del icono de rutina (bloque 10). Sin dependencias ni base de datos: desde /server,
//   node models/Workout.test.js
// Solo valida documentos en memoria (validate()), no guarda nada.

import Workout from './Workout.js';
import { ICONOS_RUTINA } from '../../compartido/pictogramas.js';

let fallos = 0;
const ok = (desc, real, esperado) => {
  const bien = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bien) fallos++;
  console.log(`${bien ? 'OK   ' : 'FALLO'} ${desc}: ${JSON.stringify(real)}${bien ? '' : '  (esperado ' + JSON.stringify(esperado) + ')'}`);
};

// Mensaje de error del campo icono, o null si la rutina es válida.
const errorIcono = async (datos) => {
  const rutina = new Workout({
    userId: '64b000000000000000000001',
    nombre: 'Empuje A',
    ejercicios: [{ exerciseId: '64b000000000000000000002', numSeries: 3, descansoSegundos: 90, orden: 0 }],
    ...datos,
  });
  try {
    await rutina.validate();
    return null;
  } catch (error) {
    return error.errors?.icono?.message ?? `otro error: ${error.message}`;
  }
};

ok('sin icono es válida', await errorIcono({}), null);
const sinError = [];
for (const clave of Object.keys(ICONOS_RUTINA)) {
  if ((await errorIcono({ icono: clave })) !== null) sinError.push(clave);
}
ok('los 13 iconos de la lista son válidos', [Object.keys(ICONOS_RUTINA).length, sinError], [13, []]);
ok('un icono que no existe se rechaza', await errorIcono({ icono: 'yoga' }), 'Icono de rutina no válido');
ok('el id de la figura no vale, solo la clave', await errorIcono({ icono: 'r-empuje' }), 'Icono de rutina no válido');
ok('mayúsculas: no se normaliza', await errorIcono({ icono: 'Empuje' }), 'Icono de rutina no válido');

console.log(fallos === 0 ? '\nTODO CORRECTO' : `\n${fallos} FALLOS`);
if (fallos > 0) process.exitCode = 1;
