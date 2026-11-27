import Exercise, { derivarTracking } from '../models/Exercise.js';
import { exercisePresets } from '../data/exercisePresets.js';

// Clona el catálogo de ejercicios preset a un usuario en una única operación bulk.
// Más eficiente que recorrer la lista con save() individuales.
// Vive aquí (y no dentro de authController) porque lo usan dos sitios: el
// registro de usuarios y el script de seed de desarrollo.
//
// `session` es opcional: el registro pasa la sesión de su transacción para que el
// clonado quede atado a la creación del usuario; el seed no usa transacción.
export const clonarPresetsAUsuario = async (userId, session) => {
  const documentos = exercisePresets.map((preset) => ({
    userId,
    presetId: preset.presetId,
    nombre: preset.nombre,
    grupoMuscular: preset.grupoMuscular,
    tipo: preset.tipo,
    // insertMany no ejecuta pre('save'), así que el tracking se calcula aquí
    // con la misma función que usa el modelo.
    tracking: derivarTracking(preset.grupoMuscular, preset.tipo),
  }));

  await Exercise.insertMany(documentos, { session });
};

// presetId de un ejercicio que se clonó ANTES del bloque 10 (sin el campo), por su nombre y
// grupo EXACTOS de hoy. Lo usa `npm run migrar:preset`. Hace falta el grupo porque hay dos
// "Press en máquina" (Pecho y Hombros). Si el usuario lo renombró o le cambió el grupo, ya no
// se reconoce y devuelve null: es preferible la figura del grupo a adivinar mal.
const presetPorNombreYGrupo = new Map(
  exercisePresets.map((p) => [`${p.nombre}|${p.grupoMuscular}`, p.presetId])
);
export const presetIdDe = (nombre, grupoMuscular) =>
  presetPorNombreYGrupo.get(`${nombre}|${grupoMuscular}`) ?? null;
