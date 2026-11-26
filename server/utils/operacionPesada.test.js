// Pruebas del turno único de operaciones pesadas (utils/operacionPesada.js, bloque 7b). Desde
// /server:   node utils/operacionPesada.test.js

import { ocupar } from './operacionPesada.js';

let fallos = 0;
const ok = (desc, real, esperado) => {
  const bien = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bien) fallos++;
  console.log(`${bien ? 'OK   ' : 'FALLO'} ${desc}: ${JSON.stringify(real)}${bien ? '' : '  (esperado ' + JSON.stringify(esperado) + ')'}`);
};

const liberarA = ocupar();
ok('la primera ocupa el turno', typeof liberarA, 'function');
ok('la segunda, mientras tanto, no', ocupar(), null);
liberarA();
const liberarB = ocupar();
ok('al liberarlo, la siguiente sí', typeof liberarB, 'function');
liberarA(); // un finally de más de la operación anterior
ok('liberar dos veces no suelta el turno de la siguiente', ocupar(), null);
liberarB();

// Lo que hacen los controladores: el finally libera aunque la operación falle.
const operacion = async (falla) => {
  const liberar = ocupar();
  if (!liberar) return 'ocupado';
  try {
    await new Promise((r) => setTimeout(r, 20));
    if (falla) throw new Error('fallo a mitad');
    return 'hecha';
  } finally {
    liberar();
  }
};
const [a, b] = await Promise.all([operacion(false), operacion(false)]);
ok('dos a la vez: una se hace y la otra encuentra el turno ocupado', [a, b], ['hecha', 'ocupado']);
await operacion(true).catch(() => {});
ok('tras una que falla, el turno queda libre', await operacion(false), 'hecha');

console.log(fallos === 0 ? '\nTODO CORRECTO' : `\n${fallos} FALLOS`);
if (fallos > 0) process.exitCode = 1;
