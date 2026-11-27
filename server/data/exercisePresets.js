// Lista de ejercicios preestablecidos que se clonan a cada usuario nuevo al registrarse.
// Cada usuario recibirá su propia copia editable de estos ejercicios.
//
// El campo `tracking` se omite a propósito: lo calcula derivarTracking (en
// models/Exercise.js) a partir de grupoMuscular y tipo al clonarlos
// (utils/presets.js).
//
// `presetId` (bloque 10) identifica el preset para siempre, aunque el usuario lo renombre, y
// es también el id de su pictograma (compartido/pictogramas.js). No se cambia nunca: está
// guardado en los ejercicios de los usuarios y en sus sesiones. Un preset nuevo necesita su
// figura antes (lo comprueba utils/presets.test.js).

export const exercisePresets = [
  // ───────────── PECHO ─────────────
  { presetId: 'banca-barra', nombre: 'Press banca con barra', grupoMuscular: 'Pecho', tipo: 'Pesas libres' },
  { presetId: 'banca-mancuernas', nombre: 'Press banca con mancuernas', grupoMuscular: 'Pecho', tipo: 'Pesas libres' },
  { presetId: 'inclinado-barra', nombre: 'Press inclinado con barra', grupoMuscular: 'Pecho', tipo: 'Pesas libres' },
  { presetId: 'inclinado-mancuernas', nombre: 'Press inclinado con mancuernas', grupoMuscular: 'Pecho', tipo: 'Pesas libres' },
  { presetId: 'aperturas', nombre: 'Aperturas con mancuernas', grupoMuscular: 'Pecho', tipo: 'Pesas libres' },
  { presetId: 'cruces-polea', nombre: 'Cruces en polea', grupoMuscular: 'Pecho', tipo: 'Poleas' },
  { presetId: 'press-maquina-pecho', nombre: 'Press en máquina', grupoMuscular: 'Pecho', tipo: 'Maquinas' },
  { presetId: 'fondos-paralelas', nombre: 'Fondos en paralelas', grupoMuscular: 'Pecho', tipo: 'Peso corporal' },
  { presetId: 'flexiones', nombre: 'Flexiones', grupoMuscular: 'Pecho', tipo: 'Peso corporal' },

  // ───────────── ESPALDA ─────────────
  { presetId: 'dominadas', nombre: 'Dominadas', grupoMuscular: 'Espalda', tipo: 'Peso corporal' },
  { presetId: 'jalon', nombre: 'Jalón al pecho', grupoMuscular: 'Espalda', tipo: 'Poleas' },
  { presetId: 'remo-barra', nombre: 'Remo con barra', grupoMuscular: 'Espalda', tipo: 'Pesas libres' },
  { presetId: 'remo-mancuerna', nombre: 'Remo con mancuerna', grupoMuscular: 'Espalda', tipo: 'Pesas libres' },
  { presetId: 'remo-maquina', nombre: 'Remo en máquina', grupoMuscular: 'Espalda', tipo: 'Maquinas' },
  { presetId: 'remo-polea-baja', nombre: 'Remo en polea baja', grupoMuscular: 'Espalda', tipo: 'Poleas' },
  { presetId: 'pullover-polea', nombre: 'Pullover en polea', grupoMuscular: 'Espalda', tipo: 'Poleas' },
  { presetId: 'peso-muerto', nombre: 'Peso muerto', grupoMuscular: 'Espalda', tipo: 'Pesas libres' },

  // ───────────── HOMBROS ─────────────
  { presetId: 'militar-barra', nombre: 'Press militar con barra', grupoMuscular: 'Hombros', tipo: 'Pesas libres' },
  { presetId: 'militar-mancuernas', nombre: 'Press militar con mancuernas', grupoMuscular: 'Hombros', tipo: 'Pesas libres' },
  { presetId: 'press-maquina-hombros', nombre: 'Press en máquina', grupoMuscular: 'Hombros', tipo: 'Maquinas' },
  { presetId: 'laterales-mancuernas', nombre: 'Elevaciones laterales con mancuernas', grupoMuscular: 'Hombros', tipo: 'Pesas libres' },
  { presetId: 'laterales-polea', nombre: 'Elevaciones laterales en polea', grupoMuscular: 'Hombros', tipo: 'Poleas' },
  { presetId: 'frontales', nombre: 'Elevaciones frontales', grupoMuscular: 'Hombros', tipo: 'Pesas libres' },
  { presetId: 'pajaros', nombre: 'Pájaros con mancuernas', grupoMuscular: 'Hombros', tipo: 'Pesas libres' },
  { presetId: 'face-pull', nombre: 'Face pull', grupoMuscular: 'Hombros', tipo: 'Poleas' },

  // ───────────── BRAZOS ─────────────
  { presetId: 'curl-barra', nombre: 'Curl con barra', grupoMuscular: 'Brazos', tipo: 'Pesas libres' },
  { presetId: 'curl-mancuernas', nombre: 'Curl con mancuernas', grupoMuscular: 'Brazos', tipo: 'Pesas libres' },
  { presetId: 'curl-martillo', nombre: 'Curl martillo', grupoMuscular: 'Brazos', tipo: 'Pesas libres' },
  { presetId: 'curl-polea', nombre: 'Curl en polea', grupoMuscular: 'Brazos', tipo: 'Poleas' },
  { presetId: 'curl-predicador', nombre: 'Curl predicador', grupoMuscular: 'Brazos', tipo: 'Maquinas' },
  { presetId: 'triceps-polea', nombre: 'Extensión de tríceps en polea', grupoMuscular: 'Brazos', tipo: 'Poleas' },
  { presetId: 'press-frances', nombre: 'Press francés', grupoMuscular: 'Brazos', tipo: 'Pesas libres' },
  { presetId: 'fondos-banco', nombre: 'Fondos en banco', grupoMuscular: 'Brazos', tipo: 'Peso corporal' },
  { presetId: 'triceps-mancuerna', nombre: 'Extensión tríceps con mancuerna', grupoMuscular: 'Brazos', tipo: 'Pesas libres' },

  // ───────────── PIERNAS ─────────────
  { presetId: 'sentadilla', nombre: 'Sentadilla libre', grupoMuscular: 'Piernas', tipo: 'Pesas libres' },
  { presetId: 'sentadilla-frontal', nombre: 'Sentadilla frontal', grupoMuscular: 'Piernas', tipo: 'Pesas libres' },
  { presetId: 'bulgara', nombre: 'Sentadilla búlgara', grupoMuscular: 'Piernas', tipo: 'Pesas libres' },
  { presetId: 'prensa', nombre: 'Prensa de piernas', grupoMuscular: 'Piernas', tipo: 'Maquinas' },
  { presetId: 'extension-cuadriceps', nombre: 'Extensión de cuádriceps', grupoMuscular: 'Piernas', tipo: 'Maquinas' },
  { presetId: 'femoral-tumbado', nombre: 'Curl femoral tumbado', grupoMuscular: 'Piernas', tipo: 'Maquinas' },
  { presetId: 'femoral-sentado', nombre: 'Curl femoral sentado', grupoMuscular: 'Piernas', tipo: 'Maquinas' },
  { presetId: 'rumano', nombre: 'Peso muerto rumano', grupoMuscular: 'Piernas', tipo: 'Pesas libres' },
  { presetId: 'hip-thrust', nombre: 'Hip thrust', grupoMuscular: 'Piernas', tipo: 'Pesas libres' },
  { presetId: 'zancadas', nombre: 'Zancadas con mancuernas', grupoMuscular: 'Piernas', tipo: 'Pesas libres' },
  { presetId: 'talones', nombre: 'Elevación de talones de pie', grupoMuscular: 'Piernas', tipo: 'Maquinas' },

  // ───────────── CORE ─────────────
  { presetId: 'plancha', nombre: 'Plancha frontal', grupoMuscular: 'Core', tipo: 'Peso corporal' },
  { presetId: 'plancha-lateral', nombre: 'Plancha lateral', grupoMuscular: 'Core', tipo: 'Peso corporal' },
  { presetId: 'crunch', nombre: 'Crunch abdominal', grupoMuscular: 'Core', tipo: 'Peso corporal' },
  { presetId: 'crunch-polea', nombre: 'Crunch en polea', grupoMuscular: 'Core', tipo: 'Poleas' },
  { presetId: 'elevacion-piernas', nombre: 'Elevación de piernas colgado', grupoMuscular: 'Core', tipo: 'Peso corporal' },
  { presetId: 'rueda', nombre: 'Rueda abdominal', grupoMuscular: 'Core', tipo: 'Peso corporal' },
  { presetId: 'russian-twist', nombre: 'Russian twist con peso', grupoMuscular: 'Core', tipo: 'Pesas libres' },

  // ───────────── CARDIO ─────────────
  { presetId: 'carrera', nombre: 'Carrera continua', grupoMuscular: 'Cardio', tipo: 'Cardio' },
  { presetId: 'cinta', nombre: 'Cinta de correr', grupoMuscular: 'Cardio', tipo: 'Cardio' },
  { presetId: 'bici', nombre: 'Bicicleta estática', grupoMuscular: 'Cardio', tipo: 'Cardio' },
  { presetId: 'eliptica', nombre: 'Elíptica', grupoMuscular: 'Cardio', tipo: 'Cardio' },
  { presetId: 'remo-cardio', nombre: 'Remo en máquina (cardio)', grupoMuscular: 'Cardio', tipo: 'Cardio' },
  { presetId: 'comba', nombre: 'Saltos a la comba', grupoMuscular: 'Cardio', tipo: 'Cardio' },
];