// Pruebas de utils/grupos.js. Desde /client: node src/utils/grupos.test.js
process.env.TZ = 'Europe/Madrid';

const { desdeDeRango, leerPreferencias, guardarPreferencias, RANGOS } = await import('./grupos.js');

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
ok('6 rangos en el selector', RANGOS.map((r) => r.etiqueta), ['1S', '1M', '1A', '5A', '10A', 'Total']);

// localStorage simulado: en Node no existe.
const almacen = {};
globalThis.localStorage = { getItem: (k) => almacen[k] ?? null, setItem: (k, v) => { almacen[k] = v; } };
ok('sin nada guardado: Total y desplegado', leerPreferencias('abc'), { rango: 'TOTAL', plegado: false });
guardarPreferencias('abc', { rango: '1A', plegado: true });
ok('guarda y lee por grupo', leerPreferencias('abc'), { rango: '1A', plegado: true });
ok('"Todos" tiene su propia clave', leerPreferencias(null), { rango: 'TOTAL', plegado: false });
almacen.yieldfit_grupo_roto = '{no es json';
ok('dato roto: valores por defecto', leerPreferencias('roto'), { rango: 'TOTAL', plegado: false });
almacen.yieldfit_grupo_viejo = JSON.stringify({ rango: '3M' });
ok('rango que ya no existe: Total', leerPreferencias('viejo').rango, 'TOTAL');
globalThis.localStorage = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('bloqueado'); } };
ok('localStorage bloqueado: no rompe', [leerPreferencias('x'), guardarPreferencias('x', {})], [{ rango: 'TOTAL', plegado: false }, undefined]);

console.log(fallos === 0 ? '\nTODO CORRECTO' : `\n${fallos} FALLOS`);
if (fallos > 0) process.exitCode = 1;
