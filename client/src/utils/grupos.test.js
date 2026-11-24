// Pruebas de utils/grupos.js. Desde /client: node src/utils/grupos.test.js
process.env.TZ = 'Europe/Madrid';

const { desdeDeRango, limpiarPreferenciasAntiguas } = await import('./grupos.js');

let fallos = 0;
const ok = (desc, real, esperado) => {
  const bien = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bien) fallos++;
  console.log(`${bien ? 'OK   ' : 'FALLO'} ${desc}${bien ? '' : `\n      real:     ${JSON.stringify(real)}\n      esperado: ${JSON.stringify(esperado)}`}`);
};

const ahora = new Date('2026-11-23T10:00:00Z');
ok('1 semana', desdeDeRango('1S', ahora), '2026-11-16T10:00:00.000Z');
// Cruza el cambio de hora (25 oct): se conserva la hora LOCAL (11:00 en Madrid), que en
// octubre, con horario de verano, son las 09:00 UTC.
ok('1 mes (cruza el cambio de hora)', desdeDeRango('1M', ahora), '2026-10-23T09:00:00.000Z');
ok('1 año', desdeDeRango('1A', ahora), '2025-11-23T10:00:00.000Z');
ok('5 años', desdeDeRango('5A', ahora), '2021-11-23T10:00:00.000Z');
ok('10 años', desdeDeRango('10A', ahora), '2016-11-23T10:00:00.000Z');
ok('Total: sin límite', desdeDeRango('TOTAL', ahora), undefined);
ok('rango desconocido: sin límite', desdeDeRango('3D', ahora), undefined);

// localStorage simulado: en Node no existe.
const almacen = { yieldfit_grupo_abc: '{}', yieldfit_grupo_todos: '{}', yieldfit_orden_grupos: '[]', yieldfit_con_sesion: '1', otra: 'x' };
globalThis.localStorage = {
  get length() { return Object.keys(almacen).length; },
  key: (i) => Object.keys(almacen)[i] ?? null,
  removeItem: (k) => { delete almacen[k]; },
};
limpiarPreferenciasAntiguas();
ok('borra solo las preferencias antiguas de los grupos', Object.keys(almacen).sort(), ['otra', 'yieldfit_con_sesion']);
limpiarPreferenciasAntiguas();
ok('segunda vez: no hace nada', Object.keys(almacen).sort(), ['otra', 'yieldfit_con_sesion']);
delete globalThis.localStorage;
limpiarPreferenciasAntiguas();
ok('sin localStorage: no falla', true, true);

console.log(fallos === 0 ? '\nTodo bien.' : `\n${fallos} fallo(s).`);
process.exitCode = fallos === 0 ? 0 : 1;
