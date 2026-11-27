// Pruebas de los presets y su pictograma (bloque 10). Sin dependencias: desde /server,
//   node utils/presets.test.js
// Repetirlas siempre que se añada o cambie un preset: un preset sin figura no debe llegar a
// producción.

import { exercisePresets } from '../data/exercisePresets.js';
import { PICTOGRAMAS, PICTOGRAMA_POR_PRESET } from '../../compartido/pictogramas.js';
import Exercise from '../models/Exercise.js';
import { presetIdDe } from './presets.js';

let fallos = 0;
const ok = (desc, real, esperado) => {
  const bien = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bien) fallos++;
  console.log(`${bien ? 'OK   ' : 'FALLO'} ${desc}: ${JSON.stringify(real)}${bien ? '' : '  (esperado ' + JSON.stringify(esperado) + ')'}`);
};

// --- Cada preset tiene su figura ---
ok('todos los presets tienen presetId', exercisePresets.filter((p) => !p.presetId).map((p) => p.nombre), []);
const ids = exercisePresets.map((p) => p.presetId);
ok('ningún presetId se repite', ids.filter((id, i) => ids.indexOf(id) !== i), []);
ok('cada presetId está en la tabla de pictogramas', ids.filter((id) => !PICTOGRAMA_POR_PRESET[id]), []);
ok('y su figura existe', ids.filter((id) => !PICTOGRAMAS[PICTOGRAMA_POR_PRESET[id]]), []);
ok('la tabla no tiene presets que ya no existen', Object.keys(PICTOGRAMA_POR_PRESET).filter((id) => !ids.includes(id)), []);
ok('58 presets', exercisePresets.length, 58);

// --- presetIdDe (la migración) ---
ok('por nombre y grupo exactos', presetIdDe('Sentadilla libre', 'Piernas'), 'sentadilla');
ok('los dos "Press en máquina" se distinguen por el grupo',
  [presetIdDe('Press en máquina', 'Pecho'), presetIdDe('Press en máquina', 'Hombros')],
  ['press-maquina-pecho', 'press-maquina-hombros']);
ok('renombrado: no se reconoce', presetIdDe('Sentadilla', 'Piernas'), null);
ok('con otro grupo: no se reconoce', presetIdDe('Sentadilla libre', 'Core'), null);
ok('el nombre no se normaliza (mayúsculas)', presetIdDe('sentadilla libre', 'Piernas'), null);

// --- El modelo solo acepta presets que existen ---
const errorDe = async (datos) => {
  const e = new Exercise({ userId: '64b000000000000000000001', nombre: 'Prueba', grupoMuscular: 'Pecho', tipo: 'Maquinas', ...datos });
  try {
    await e.validate();
    return null;
  } catch (error) {
    return error.errors?.presetId?.message ?? null;
  }
};
ok('un presetId que existe es válido', await errorDe({ presetId: 'banca-barra' }), null);
ok('sin presetId es válido (creado por el usuario)', await errorDe({}), null);
ok('un presetId inventado se rechaza', await errorDe({ presetId: 'no-existe' }), 'Preset no válido');
ok('una figura de grupo no es un preset', await errorDe({ presetId: 'g-pecho' }), 'Preset no válido');

console.log(fallos === 0 ? '\nTODO CORRECTO' : `\n${fallos} FALLOS`);
if (fallos > 0) process.exitCode = 1;
