// Pruebas de los pictogramas (bloque 10). Sin dependencias: desde la raíz del repo,
//   node compartido/pictogramas.test.js
// Comprueban que los datos están completos (cada grupo muscular tiene imagen y toda referencia
// apunta a una figura que existe) y la lógica de elegirPictograma y trazosDe. Que cada preset
// del servidor tenga figura se comprueba en server/utils/presets.test.js, junto a los presets.
import { PICTOGRAMAS, PICTOGRAMA_POR_PRESET, PICTOGRAMA_POR_GRUPO, ICONOS_RUTINA } from './pictogramas.js';
import { elegirPictograma, pictogramaDeRutina, trazosDe } from './trazosPictograma.js';
import { OPCIONES_GRUPO_MUSCULAR } from '../server/models/Exercise.js';

let fallos = 0;
const ok = (desc, real, esperado) => {
  const bien = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bien) fallos++;
  console.log(`${bien ? 'OK   ' : 'FALLO'} ${desc}: ${JSON.stringify(real)}${bien ? '' : '  (esperado ' + JSON.stringify(esperado) + ')'}`);
};
const noExisten = (ids) => ids.filter((id) => !PICTOGRAMAS[id]);

// Datos completos
ok('cada grupo muscular del servidor tiene imagen', OPCIONES_GRUPO_MUSCULAR.map((g) => g.value).filter((g) => !PICTOGRAMA_POR_GRUPO[g]), []);
ok('las imágenes de grupo existen', noExisten(Object.values(PICTOGRAMA_POR_GRUPO)), []);
ok('las figuras de los presets existen', noExisten(Object.values(PICTOGRAMA_POR_PRESET)), []);
ok('los iconos de rutina existen y tienen etiqueta', Object.values(ICONOS_RUTINA).filter(([id, etiqueta]) => !PICTOGRAMAS[id] || !etiqueta), []);
ok('13 iconos de rutina', Object.keys(ICONOS_RUTINA).length, 13);
ok('toda figura tiene cabeza [x, y] dentro de la caja de 120', Object.entries(PICTOGRAMAS).filter(([, f]) => !(Array.isArray(f.cab) && f.cab.every((n) => n >= 0 && n <= 120))).map(([id]) => id), []);

// elegirPictograma
ok('con presetId, su figura', elegirPictograma({ presetId: 'banca-barra', grupoMuscular: 'Pecho' }), 'banca-barra');
ok('el presetId manda sobre el grupo (si se cambió de grupo)', elegirPictograma({ presetId: 'jalon', grupoMuscular: 'Brazos' }), 'jalon');
ok('sin presetId, la de su grupo', elegirPictograma({ grupoMuscular: 'Core' }), 'g-core');
ok('presetId desconocido, la de su grupo', elegirPictograma({ presetId: 'no-existe', grupoMuscular: 'Piernas' }), 'g-piernas');
ok('sin datos (sesión antigua), null', [elegirPictograma({}), elegirPictograma()], [null, null]);

// pictogramaDeRutina
ok('icono de rutina', pictogramaDeRutina('empuje'), 'r-empuje');
ok('sin icono o inexistente, null', [pictogramaDeRutina(undefined), pictogramaDeRutina('nada')], [null, null]);

// trazosDe
const banca = trazosDe('banca-barra');
ok('polilíneas a path', banca.trabaja, 'M36 74 L52 74 M42 74 L42 50');
ok('disco a dos arcos', banca.discos, 'M32 40 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 Z');
ok('capas que no tiene, vacías', [banca.cables, banca.torsoGris, banca.relleno], ['', '', '']);
const aperturas = trazosDe('aperturas');
ok('torsos separados en gris y verde', [aperturas.torsoGris, aperturas.torsoVerde], ['M60 40 L60 66', 'M60 36 L60 46']);
ok('id inexistente, null', trazosDe('no-existe'), null);
ok('todas las figuras dan trazos', Object.keys(PICTOGRAMAS).filter((id) => !trazosDe(id)?.cabeza), []);

console.log(fallos === 0 ? '\nTODO CORRECTO' : `\n${fallos} FALLOS`);
if (fallos > 0) process.exitCode = 1;
