import mongoose from 'mongoose';
import { MAX_WIDGETS, TAMANOS, TIPOS, VALORES_RANGO } from '../data/catalogoWidgets.js';

// Dashboard personalizable de cada usuario (bloque 9d, DECISIONS 0052). Un documento por
// usuario, en el servidor para verlo igual en el ordenador y en el iPhone.
//
// Solo se guarda el ORDEN de los widgets (la posición en el array), no coordenadas: la retícula
// los coloca en filas, en ese orden, a 4 o 2 columnas según el ancho. Guardar x/y obligaría a
// mantener una maqueta por ancho de pantalla.
//
// Las reglas que dependen del tipo (tamaños permitidos, qué referencia necesita) no caben en un
// enum: las comprueba utils/dashboard.js (validarWidgets) antes de guardar.

const widgetSchema = new mongoose.Schema(
  {
    tipo: { type: String, required: true, enum: TIPOS },
    tamano: { type: String, required: true, enum: TAMANOS },
    // Referencias, según el tipo: el grupo de un widget "grupo", el ejercicio de "Récord de un
    // ejercicio" y la rutina de "Empezar rutina". Al borrar el grupo, ejercicio o rutina, se
    // quita el widget (cascada en sus controladores).
    chartId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chart' },
    exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
    workoutId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workout' },
    // Rango del progreso (widgets con conRango). Sin él, "Total". Antes vivía en cada
    // dispositivo (localStorage); desde el 9d se ve igual en todos.
    rango: { type: String, enum: VALORES_RANGO },
  },
  // _id propio: el cliente lo usa como clave estable al arrastrar.
  { _id: true }
);

const dashboardSchema = new mongoose.Schema(
  {
    // unique: un dashboard por usuario. Si dos peticiones lo crean a la vez, la segunda falla
    // con E11000 y asegurarDashboard lee el que ya existe.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // true mientras el usuario no lo haya personalizado (mover, añadir, quitar o cambiar
    // tamaños; cambiar el rango no cuenta): entonces se rehace con el dashboard por defecto
    // cada vez que se pide, así recibe los widgets nuevos y sus grupos (asegurarDashboard).
    // Por defecto true: los dashboards anteriores a este campo nunca se pudieron personalizar.
    porDefecto: {
      type: Boolean,
      default: true,
    },
    widgets: {
      type: [widgetSchema],
      validate: {
        validator: (arr) => arr.length <= MAX_WIDGETS,
        message: `Como mucho ${MAX_WIDGETS} widgets`,
      },
    },
  },
  { timestamps: true }
);

const Dashboard = mongoose.model('Dashboard', dashboardSchema);

export default Dashboard;
