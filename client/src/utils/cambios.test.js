// Pruebas de hayCambios. Ejecutar desde client/: node src/utils/cambios.test.js
import assert from 'node:assert/strict';
import { hayCambios } from './cambios.js';

// Cargando: sin foto inicial no hay cambios.
assert.equal(hayCambios(null, { nombre: 'x' }), false);

// Recién abierto: nada cambiado.
assert.equal(hayCambios({ nombre: '', ejercicios: [] }, { nombre: '', ejercicios: [] }), false);

// Escribir algo es un cambio; escribirlo y borrarlo, no.
assert.equal(hayCambios({ nombre: '' }, { nombre: 'Pierna' }), true);
assert.equal(hayCambios({ nombre: '' }, { nombre: '' }), false);

// Al editar: lo que llegó del servidor, tal cual, no es un cambio.
const rutina = { nombre: 'Torso', ejercicios: [{ exerciseId: 'a', numSeries: 3 }, { exerciseId: 'b', numSeries: 4 }] };
assert.equal(hayCambios(rutina, structuredClone(rutina)), false);

// Cambiar un número dentro de la lista, sí.
assert.equal(hayCambios(rutina, { ...rutina, ejercicios: [{ exerciseId: 'a', numSeries: 5 }, rutina.ejercicios[1]] }), true);

// Reordenar los ejercicios es un cambio (el orden de la rutina importa).
assert.equal(hayCambios(rutina, { ...rutina, ejercicios: [rutina.ejercicios[1], rutina.ejercicios[0]] }), true);

// Las propiedades en otro orden no son un cambio.
assert.equal(hayCambios({ a: 1, b: 2 }, { b: 2, a: 1 }), false);

// Sets (ejercicios marcados de un grupo): el orden en que se marcaron no importa.
assert.equal(hayCambios({ sel: new Set(['a', 'b']) }, { sel: new Set(['b', 'a']) }), false);
assert.equal(hayCambios({ sel: new Set(['a', 'b']) }, { sel: new Set(['a']) }), true);

// Marcar y desmarcar el mismo vuelve a "sin cambios".
assert.equal(hayCambios({ sel: new Set(['a']) }, { sel: new Set(['a']) }), false);

console.log('cambios: todas las pruebas pasan');
