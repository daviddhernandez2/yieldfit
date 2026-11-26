// Pruebas de esRpeValido (utils/esfuerzo.js). Sin dependencias: desde /server,
//   node utils/esfuerzo.test.js
import { esRpeValido } from './esfuerzo.js';

let fallos = 0;
const ok = (desc, real, esperado) => {
  const bien = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bien) fallos++;
  console.log(`${bien ? 'OK   ' : 'FALLO'} ${desc}: ${JSON.stringify(real)}${bien ? '' : '  (esperado ' + JSON.stringify(esperado) + ')'}`);
};

ok('vacío vale (el esfuerzo es opcional)', [esRpeValido(undefined), esRpeValido(null)], [true, true]);
ok('de 1 a 10 en pasos de 0,5 (19 valores)', Array.from({ length: 19 }, (_, i) => 1 + i * 0.5).every(esRpeValido), true);
ok('fuera del rango', [esRpeValido(0.5), esRpeValido(0), esRpeValido(10.5), esRpeValido(-1)], [false, false, false, false]);
ok('fuera del paso de 0,5', [esRpeValido(8.25), esRpeValido(7.1)], [false, false]);
ok('no es un número', [esRpeValido('8'), esRpeValido(NaN), esRpeValido(Infinity), esRpeValido({})], [false, false, false, false]);

console.log(fallos === 0 ? '\nTODO CORRECTO' : `\n${fallos} FALLOS`);
if (fallos > 0) process.exitCode = 1;
