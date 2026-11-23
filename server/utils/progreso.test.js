// Pruebas de calcularProgreso (utils/progreso.js). Sin dependencias: desde /server,
//   node utils/progreso.test.js
// Repetirlas siempre que se cambie el cálculo del progreso.

import { calcularProgreso, reducirSerie } from './progreso.js';
const S = 'sentadilla', C = 'curl', B = 'borrado', K = 'cardio';
const nombres = new Map([[S, 'Sentadilla'], [C, 'Curl'], [K, 'Bici']]);
const ses = (dia, ...ejs) => ({ fecha: new Date(2026, 0, dia), ejercicios: ejs.map(([exerciseId, mejor1RM]) => ({ exerciseId, mejor1RM })) });
let fallos = 0;
const ok = (desc, real, esperado) => {
  const bien = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bien) fallos++;
  console.log(`${bien ? 'OK   ' : 'FALLO'} ${desc}: ${JSON.stringify(real)}${bien ? '' : '  (esperado ' + JSON.stringify(esperado) + ')'}`);
};

// Los dos ejemplos del plan
let r = calcularProgreso([ses(1, [S, 100]), ses(2, [S, 110]), ses(3, [S, 100]), ses(4, [S, 110])], nombres);
ok('100→110→100→110 da +10 % (antes +3,6 %)', r.porcentaje, 10);
r = calcularProgreso([ses(1, [S, 100]), ses(2, [S, 200]), ses(3, [S, 100])], nombres);
ok('100→200→100 da 0 % (antes +25 %)', r.porcentaje, 0);

// Índice base 100 con dos ejercicios en días distintos y arrastre del último valor
r = calcularProgreso([ses(1, [S, 150]), ses(2, [C, 20]), ses(3, [S, 165]), ses(4, [C, 21])], nombres);
ok('% por ejercicio', r.ejercicios.map((e) => [e.nombre, e.porcentaje]), [['Sentadilla', 10], ['Curl', 5]]);
ok('línea del índice', r.serie.map((p) => p.indice), [100, 100, 105, 107.5]);
ok('último punto − 100 = % del grupo', [r.serie.at(-1).indice - 100, r.porcentaje], [7.5, 7.5]);

// Exclusiones
r = calcularProgreso([ses(1, [S, 100], [B, 50], [K, null]), ses(2, [S, 120], [B, 90], [K, null])], nombres);
ok('borrado y cardio no cuentan', r.ejercicios.map((e) => e.nombre), ['Sentadilla']);
r = calcularProgreso([ses(1, [S, 100], [C, 20])], nombres);
ok('un solo punto: sin %', [r.porcentaje, r.ejercicios.length, r.serie.length], [null, 0, 0]);
r = calcularProgreso([ses(1, [S, 100], [S, 105]), ses(2, [S, 110])], nombres);
ok('ejercicio repetido en una sesión: cuenta el mejor', r.porcentaje, 4.76);
r = calcularProgreso([], nombres);
ok('sin sesiones', r, { sesiones: 0, porcentaje: null, ejercicios: [], serie: [] });

// Reducción de la línea (bloque 9)
const larga = Array.from({ length: 1400 }, (_, i) => ({ fecha: i, indice: 100 + i / 10 }));
const corta = reducirSerie(larga);
ok('serie de 1.400 puntos se reduce a 150 como mucho', corta.length <= 150 && corta.length > 140, true);
ok('conserva el primer y el último punto', [corta[0], corta.at(-1)], [larga[0], larga.at(-1)]);
ok('los puntos siguen en orden', corta.every((p, i) => i === 0 || p.fecha > corta[i - 1].fecha), true);
const pequena = larga.slice(0, 40);
ok('una serie de 150 o menos no se toca (mismo objeto)', reducirSerie(pequena) === pequena, true);

console.log(fallos === 0 ? '\nTODO CORRECTO' : `\n${fallos} FALLOS`);

if (fallos > 0) process.exitCode = 1;
