import mongoose from 'mongoose';
import { esRpeValido } from '../utils/esfuerzo.js';
import { ORIGENES_IMPORTACION } from '../data/importacion.js';

// Subschema más anidado: cada serie individual del ejercicio.
const setSchema = new mongoose.Schema(
  {
    numeroSerie: {
      type: Number,
      required: true,
      min: 1,
    },
    peso: {
      type: Number,
      min: 0,
      max: 1000,
    },
    reps: {
      type: Number,
      min: 0,
      max: 1000,
    },
    tiempoSegundos: {
      type: Number,
      min: 0,
    },
    distanciaMetros: {
      type: Number,
      min: 0,
    },
    // Esfuerzo de la serie (bloque 5c, DECISIONS 0056): opcional; de 1 a 10 en pasos de 0,5. Solo
    // se guarda el RPE; el RIR (10 − RPE) se calcula al mostrarlo. Antes del 5c el campo ya
    // existía (de 0 a 10) pero la app nunca lo enviaba: la validación nueva solo se aplica a
    // las sesiones que se guarden desde ahora. No cambia el cálculo del 1RM ni de los récords.
    rpe: {
      type: Number,
      validate: {
        validator: esRpeValido,
        message: 'El RPE va de 1 a 10, en pasos de 0,5',
      },
    },
  },
  {
    _id: true,
  }
);

// Subschema intermedio: cada ejercicio dentro de la sesión.
// Guarda snapshots del nombre y tracking para que el historial sea inmutable
// aunque el Exercise original se renombre o se elimine.
const sessionExerciseSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true,
    },
    nombreSnapshot: {
      type: String,
      required: true,
      trim: true,
    },
    trackingSnapshot: {
      type: String,
      required: true,
      enum: ['1RM', 'tiempo_distancia'],
    },
    descansoSegundos: {
      type: Number,
      min: 0,
      max: 900,
    },
    orden: {
      type: Number,
      required: true,
      min: 0,
    },
    // Mejor 1RM estimado de las series de este ejercicio en esta sesión, calculado UNA
    // vez al guardar (utils/unaRM.js). El progreso lo lee de aquí sin tocar las series.
    // null en ejercicios de tiempo/distancia. Las series no se editan nunca (no hay
    // PUT), así que este valor no se desfasa; si cambiara la fórmula, se recalcula con
    // scripts/migrar-1rm.js. No es required: las sesiones anteriores al bloque 4 no
    // lo tenían hasta la migración.
    mejor1RM: {
      type: Number,
      min: 0,
    },
    // Récord personal (bloque 4b, utils/records.js): true si este mejor1RM superó el mejor
    // de todas las sesiones anteriores del ejercicio, y prAnterior es la marca que batió
    // ("100 → 105 kg"). Solo existen en los récords: en el resto no hay campo, para que el
    // documento no crezca. Se calculan al guardar y se recalculan al borrar una sesión
    // anterior del mismo ejercicio; nunca los envía el cliente.
    esPR: {
      type: Boolean,
    },
    prAnterior: {
      type: Number,
      min: 0,
    },
    sets: {
      type: [setSchema],
      validate: {
        validator: function (arr) {
          return arr.length >= 1;
        },
        message: 'Un ejercicio en sesión debe tener al menos 1 serie',
      },
    },
  },
  {
    _id: true,
  }
);

// De dónde viene una sesión importada (bloque 7b). Solo existe en las importadas: en las
// registradas en la app no hay campo. Lo escribe solo el servidor al importar.
//   - origen: la app de la que viene ('strong');
//   - clave: la fecha de inicio tal cual sale en el CSV ("2026-05-16 13:26:22"). Con el origen,
//     identifica el entreno para no importarlo dos veces (índice único de abajo). No lleva el
//     nombre: renombrar el entreno en Strong no debe duplicarlo;
//   - lote: un id por cada importación, para listarlas y deshacer una entera (decisión A).
const importacionSchema = new mongoose.Schema(
  {
    origen: { type: String, required: true, enum: ORIGENES_IMPORTACION },
    clave: { type: String, required: true, trim: true, maxlength: 40 },
    lote: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { _id: false }
);

// Schema principal: la sesión de entrenamiento registrada.
const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    workoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workout',
    },
    nombre: {
      type: String,
      required: [true, 'El nombre de la sesión es obligatorio'],
      trim: true,
      minlength: 1,
      maxlength: 60,
    },
    fecha: {
      type: Date,
      required: [true, 'La fecha de la sesión es obligatoria'],
      default: Date.now,
    },
    duracionSegundos: {
      type: Number,
      min: 0,
    },
    // Notas libres del usuario sobre el entreno (bloque 11d): "hombro cargado, bajar peso".
    // Opcional; sin campo si no hay nota (el controlador no guarda cadenas vacías). Como el
    // resto de la sesión, no se edita después de guardarla.
    notas: {
      type: String,
      trim: true,
      maxlength: [500, 'Las notas no pueden superar los 500 caracteres'],
    },
    importacion: {
      type: importacionSchema,
    },
    ejercicios: {
      type: [sessionExerciseSchema],
      validate: {
        validator: function (arr) {
          return arr.length >= 1;
        },
        message: 'Una sesión debe tener al menos 1 ejercicio',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto crítico para el cálculo dinámico de rendimiento.
// Permite encontrar rápidamente la "sesión anterior del mismo usuario"
// ordenando por fecha descendente.
sessionSchema.index({ userId: 1, fecha: -1 });

// "Última sesión con este ejercicio" (serie anterior, bloque 5): sin este índice, para un
// ejercicio que hace mucho que no se hace (o nunca), MongoDB recorrería todo el historial
// del usuario hacia atrás buscándolo. Con él, salta directo a la sesión más reciente que
// lo contiene. Es multikey (ejercicios es un array): una entrada por ejercicio de cada
// sesión, ~6 por sesión (DECISIONS.md, 0029).
sessionSchema.index({ userId: 1, 'ejercicios.exerciseId': 1, fecha: -1 });

// "La nota de la última vez" (bloque 11d): la sesión más reciente de una rutina. Sin este
// índice, MongoDB recorrería hacia atrás todas las sesiones del usuario hasta dar con una de
// esa rutina (con años de historial y una rutina que no se hace desde hace meses, miles).
// Con él, salta directo a la más reciente de la rutina. Una entrada por sesión.
sessionSchema.index({ userId: 1, workoutId: 1, fecha: -1 });

// Récords recientes (widget "Nuevos récords" del Dashboard, bloque 9d): parcial, solo con las
// sesiones que tienen algún récord, así que no crece con cada entreno sino con cada récord.
// La consulta tiene que incluir 'ejercicios.esPR': true para poder usarlo.
sessionSchema.index(
  { userId: 1, 'ejercicios.esPR': 1, fecha: -1 },
  { partialFilterExpression: { 'ejercicios.esPR': true } }
);

// Récords de UN ejercicio (widget "Récord de un ejercicio" del Dashboard, bloque 9d): parcial, solo
// con las sesiones que tienen algún récord, y por ejercicio y fecha (entran todos los ejercicios
// de esas sesiones; el $elemMatch de la consulta se queda con los récords del que se pide). Sin él, la consulta leería
// todas las sesiones de ese ejercicio (el índice de arriba) o todas las que tienen un récord de
// cualquier ejercicio (el parcial de arriba): las dos crecen con el historial. No hace falta
// userId: un exerciseId es de un solo usuario, y la consulta lo filtra igual. La consulta tiene
// que incluir 'ejercicios.esPR': true y nombrarlo con hint (estadisticasController.js), porque
// MongoDB podría elegir el índice por ejercicio de arriba.
sessionSchema.index(
  { 'ejercicios.exerciseId': 1, fecha: -1 },
  { name: 'records_por_ejercicio', partialFilterExpression: { 'ejercicios.esPR': true } }
);

// Sin duplicados al importar (bloque 7b): un mismo entreno de Strong (origen + clave) solo puede
// estar una vez por usuario. Es la garantía de verdad: aunque la vista previa ya los salte, dos
// importaciones a la vez o una repetida tras un fallo chocan aquí y no duplican. Parcial: las
// sesiones registradas en la app no tienen importacion y no ocupan sitio en el índice.
sessionSchema.index(
  { userId: 1, 'importacion.origen': 1, 'importacion.clave': 1 },
  { name: 'importacion_unica', unique: true, partialFilterExpression: { 'importacion.clave': { $exists: true } } }
);

// Lotes de importación ("Importaciones anteriores" y "Deshacer esta importación"). Parcial, solo
// con las importadas. Para listar los lotes basta con este índice: el recuento por lote sale de
// las claves sin leer las sesiones, y la fecha de la importación va dentro del propio ObjectId.
// Por eso el filtro es $type y no $exists: con $exists, MongoDB vuelve a leer cada sesión para
// comprobar el campo (lo midió la prueba del 7b con explain). Las consultas tienen que llevar
// SIEMPRE ese $type, también las de un lote concreto: { $eq: lote, $type: 'objectId' }. Con la
// igualdad sola, MongoDB no deduce que el lote cumple el filtro del índice, lo descarta y recorre
// todas las sesiones del usuario (medido en el 4d: 320 leídas en vez de 20). Para eso está
// filtroLote en importarController.js.
sessionSchema.index(
  { userId: 1, 'importacion.lote': 1 },
  { name: 'importacion_lote', partialFilterExpression: { 'importacion.lote': { $type: 'objectId' } } }
);

const Session = mongoose.model('Session', sessionSchema);

export default Session;