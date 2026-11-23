// Pruebas de utils/orden.js. Desde /client: node src/utils/orden.test.js
import { moverElemento, indiceTrasMover } from './orden.js';

let fallos = 0;
const ok = (desc, real, esperado) => {
  const bien = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bien) fallos++;
  console.log(`${bien ? 'OK   ' : 'FALLO'} ${desc}${bien ? '' : `\n      real:     ${JSON.stringify(real)}\n      esperado: ${JSON.stringify(esperado)}`}`);
};

const l = ['A', 'B', 'C', 'D'];
ok('bajar A a la posición 2', moverElemento(l, 0, 2), ['B', 'C', 'A', 'D']);
ok('subir D a la posición 1', moverElemento(l, 3, 1), ['A', 'D', 'B', 'C']);
ok('mismo sitio: misma lista', moverElemento(l, 1, 1) === l, true);
ok('fuera de rango: misma lista', moverElemento(l, 0, 9) === l, true);
ok('no modifica la original', l, ['A', 'B', 'C', 'D']);

// Comprobación cruzada: para cada movimiento y cada índice, el índice nuevo señala al mismo
// elemento en la lista movida.
let coincide = true;
for (let desde = 0; desde < 4; desde++) {
  for (let hasta = 0; hasta < 4; hasta++) {
    const movida = moverElemento(l, desde, hasta);
    for (let i = 0; i < 4; i++) if (movida[indiceTrasMover(i, desde, hasta)] !== l[i]) coincide = false;
  }
}
ok('indiceTrasMover sigue al mismo elemento en los 16 movimientos posibles', coincide, true);

console.log(fallos === 0 ? '\nTODO CORRECTO' : `\n${fallos} FALLOS`);
if (fallos > 0) process.exitCode = 1;
