// Pruebas de la validación de EmparejamientoImport (models/EmparejamientoImport.js, bloque 7b): un
// documento es un emparejamiento (exerciseId) o un "No importar" (omitir: true), nunca las dos
// cosas ni ninguna. Sin base de datos: desde /server,
//   node models/EmparejamientoImport.test.js
// Usa validate() y no validateSync(): validateSync no ejecuta los pre('validate') del modelo.

import mongoose from 'mongoose';
import EmparejamientoImport from './EmparejamientoImport.js';

let fallos = 0;
const ok = (desc, real, esperado) => {
  const bien = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bien) fallos++;
  console.log(`${bien ? 'OK   ' : 'FALLO'} ${desc}: ${JSON.stringify(real)}${bien ? '' : '  (esperado ' + JSON.stringify(esperado) + ')'}`);
};
const base = { userId: new mongoose.Types.ObjectId(), origen: 'strong', nombreOrigen: 'Stretching' };
const exerciseId = new mongoose.Types.ObjectId();
// Los campos con error, o [] si es válido.
const errores = async (datos) => {
  try {
    await new EmparejamientoImport(datos).validate();
    return [];
  } catch (e) {
    return Object.keys(e.errors).sort();
  }
};

ok('emparejado', await errores({ ...base, exerciseId }), []);
ok('"No importar", sin ejercicio', await errores({ ...base, omitir: true }), []);
ok('las dos cosas a la vez', await errores({ ...base, exerciseId, omitir: true }), ['omitir']);
ok('ninguna de las dos', await errores({ ...base }), ['exerciseId']);
ok('omitir: false es como no tenerlo (y sin ejercicio, falta)', await errores({ ...base, omitir: false }), ['exerciseId']);
const conFalse = new EmparejamientoImport({ ...base, exerciseId, omitir: false });
await conFalse.validate();
ok('omitir: false con ejercicio vale, y no se guarda el false', [conFalse.omitir, conFalse.toObject().omitir], [undefined, undefined]);

console.log(fallos === 0 ? '\nTODO CORRECTO' : `\n${fallos} FALLOS`);
if (fallos > 0) process.exitCode = 1;
