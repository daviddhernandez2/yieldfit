// Pruebas de la lógica de importar desde Strong (utils/importar.js, bloque 7b). Desde /client:
//   node src/utils/importar.test.js

import {
  omitidos, saltadasPorOmitir,
  cuerpoDecisiones, decisionesIniciales, ejercicioConNombre, errorTamano, formatFechaLote, formatTamano, mensajeError,
  normalizarNombre, otroQueCrea, paresQueSeJuntan, sesionesAImportar, sinEmparejar, textoDeshacer,
} from './importar.js';

let fallos = 0;
const ok = (desc, real, esperado) => {
  const bien = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bien) fallos++;
  console.log(`${bien ? 'OK   ' : 'FALLO'} ${desc}: ${JSON.stringify(real)}${bien ? '' : '  (esperado ' + JSON.stringify(esperado) + ')'}`);
};

const ejercicios = [
  { nombreStrong: 'T Bar Row', estado: 'sinEmparejar', exerciseId: null, crear: null, coincideCon: [] },
  { nombreStrong: 'Triceps Extension (Cable)', estado: 'propuesto', exerciseId: 'triceps', crear: null, coincideCon: ['Triceps Pushdown', 'Squat'] },
  { nombreStrong: 'Triceps Pushdown', estado: 'propuesto', exerciseId: 'triceps', crear: null, coincideCon: ['Triceps Extension (Cable)'] },
  { nombreStrong: 'Squat', estado: 'recordado', exerciseId: 'sentadilla', crear: null, coincideCon: ['Triceps Extension (Cable)'] },
  { nombreStrong: 'Hammer Curl (Cable)', estado: 'propuesto', exerciseId: null, crear: { nombre: 'Hammer Curl (Cable)', grupoMuscular: 'Brazos', tipo: 'Poleas' }, coincideCon: [] },
];
const d = decisionesIniciales(ejercicios);

ok('decisiones iniciales: las propuestas del servidor', d, {
  'T Bar Row': null, 'Triceps Extension (Cable)': { exerciseId: 'triceps' }, 'Triceps Pushdown': { exerciseId: 'triceps' },
  Squat: { exerciseId: 'sentadilla' }, 'Hammer Curl (Cable)': { crear: { nombre: 'Hammer Curl (Cable)', grupoMuscular: 'Brazos', tipo: 'Poleas' } },
});
ok('sin emparejar', sinEmparejar(ejercicios, d), 1);
ok('un "No importar" recordado empieza omitido y no cuenta como sin emparejar', (() => {
  const conOmitido = [...ejercicios, { nombreStrong: 'Stretching', estado: 'omitido', exerciseId: null, crear: null, series: 14, coincideCon: [] }];
  const dd = decisionesIniciales(conOmitido);
  return [dd.Stretching, sinEmparejar(conOmitido, dd)];
})(), [{ omitir: true }, 1]);
ok('lo que se manda: emparejar, crear y no importar por separado, sin los que faltan', cuerpoDecisiones({ ...d, 'T Bar Row': { omitir: true } }), {
  emparejamientos: { 'Triceps Extension (Cable)': 'triceps', 'Triceps Pushdown': 'triceps', Squat: 'sentadilla' },
  crear: { 'Hammer Curl (Cable)': { nombre: 'Hammer Curl (Cable)', grupoMuscular: 'Brazos', tipo: 'Poleas' } },
  omitir: ['T Bar Row'],
});
ok('se juntan los que salen juntos y van al mismo (cada par una vez)', paresQueSeJuntan(ejercicios, d), [
  { a: 'Triceps Extension (Cable)', b: 'Triceps Pushdown', exerciseId: 'triceps' },
]);
ok('si uno cambia de destino, ya no se juntan', paresQueSeJuntan(ejercicios, { ...d, 'Triceps Pushdown': { exerciseId: 'otro' } }), []);
ok('van al mismo pero nunca salen juntos: no se juntan', paresQueSeJuntan(ejercicios, { ...d, Squat: { exerciseId: 'triceps' }, 'Triceps Pushdown': null }), [
  { a: 'Squat', b: 'Triceps Extension (Cable)', exerciseId: 'triceps' },
]);

const vista = { resumen: { sesiones: 90 }, coincidencias: [{ clave: 'a' }, { clave: 'b' }, { clave: 'c' }] };
ok('sesiones a importar: las coincidencias se saltan salvo las incluidas', [sesionesAImportar(vista, new Set()), sesionesAImportar(vista, new Set(['b']))], [87, 88]);

// "No importar": sesiones que se saltan, sin contar dos veces las que ya coinciden con un día tuyo.
const vistaO = {
  resumen: { sesiones: 10 },
  coincidencias: [{ clave: 'x' }],
  combinaciones: [
    { ejercicios: ['Stretching'], sesiones: 3, coincidencias: ['x'] },
    { ejercicios: ['Squat', 'Stretching'], sesiones: 5, coincidencias: [] },
    { ejercicios: ['Running'], sesiones: 2, coincidencias: [] },
  ],
};
const dO = { Stretching: { omitir: true }, Squat: { exerciseId: 's' }, Running: { omitir: true } };
ok('saltadas por omitir: solo las combinaciones con todo omitido', saltadasPorOmitir(vistaO, dO, new Set()), 2 + 2);
ok('…la coincidencia ya saltada no cuenta dos veces; si la incluyes, sí', [saltadasPorOmitir(vistaO, dO, new Set()), saltadasPorOmitir(vistaO, dO, new Set(['x']))], [4, 5]);
ok('sesiones a importar con todo junto', [sesionesAImportar(vistaO, new Set(), dO), sesionesAImportar(vistaO, new Set(['x']), dO)], [10 - 1 - 4, 10 - 0 - 5]);
ok('omitidos: ejercicios y series', omitidos([{ nombreStrong: 'Stretching', series: 14 }, { nombreStrong: 'Squat', series: 30 }, { nombreStrong: 'Running', series: 2 }], dO), { ejercicios: 2, series: 16 });

ok('normalizarNombre', normalizarNombre('  Curl   FEMORAL tumbádo '), 'curl femoral tumbado');
const catalogo = [{ _id: 'x', nombre: 'Curl femoral tumbado' }];
ok('nombre que ya tienes (sin tildes ni mayúsculas)', [ejercicioConNombre(catalogo, 'curl femoral TUMBADO')?._id, ejercicioConNombre(catalogo, 'Otro'), ejercicioConNombre(catalogo, '  ')], ['x', null, null]);
ok('otro de esta importación ya crea ese nombre', [otroQueCrea(d, 'hammer curl (CABLE)', 'T Bar Row'), otroQueCrea(d, 'Hammer Curl (Cable)', 'Hammer Curl (Cable)')], ['Hammer Curl (Cable)', null]);

const MAX = 5 * 1024 * 1024;
ok('tamaños', [formatTamano(275 * 1024), formatTamano(500), formatTamano(2.7 * 1024 * 1024), formatTamano(MAX)], ['275 KB', '1 KB', '2,7 MB', '5 MB']);
ok('tamaño: sin pasarse, nada; pasándose, el mensaje del servidor', [errorTamano(MAX, MAX), errorTamano(MAX + 1, MAX)], [
  null, 'El archivo pasa de 5 MB. Exporta desde Strong un periodo más corto.',
]);

ok('fecha del lote', formatFechaLote('2026-11-26T11:23:32.000Z'), '26 nov 2026');
ok('texto de deshacer, con sesiones y fecha', textoDeshacer({ sesiones: 88, fecha: '2026-11-26T11:23:32.000Z' }),
  'Se borrarán 88 sesiones importadas el 26 nov 2026. Los récords se recalculan. Los ejercicios creados y los emparejamientos se quedan.');
ok('una sola sesión, en singular', textoDeshacer({ sesiones: 1, fecha: '2026-11-26T11:23:32.000Z' }).split(' el ')[0], 'Se borrará 1 sesión importada');

ok('corte de red al importar: dónde mirarlo, no "ha fallado"', mensajeError({ message: 'Network Error' }, 'importar').includes('Importaciones anteriores'), true);
ok('corte de red en la vista previa: no hay nada que comprobar', mensajeError({}, 'previa').includes('Importaciones anteriores'), false);
ok('corte de red al deshacer', mensajeError({}, 'deshacer').includes('Importaciones anteriores'), true);
ok('con respuesta: el mensaje del servidor (o su primer detalle)', [
  mensajeError({ response: { data: { message: 'Hay otra importación en curso, prueba en un minuto' } } }, 'importar'),
  mensajeError({ response: { data: { message: 'Datos no válidos', details: ['Grupo muscular no válido'] } } }, 'importar'),
  mensajeError({ response: { data: null } }, 'importar'),
], ['Hay otra importación en curso, prueba en un minuto', 'Grupo muscular no válido', 'Algo ha fallado. Inténtalo de nuevo.']);

console.log(fallos === 0 ? '\nimportar: todas las pruebas pasan' : `\n${fallos} FALLOS`);
if (fallos > 0) process.exitCode = 1;
