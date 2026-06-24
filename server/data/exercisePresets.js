// Lista de ejercicios preestablecidos que se clonan a cada usuario nuevo al registrarse.
// Cada usuario recibirá su propia copia editable de estos ejercicios.
//
// El campo `tracking` se omite a propósito: lo deriva el middleware pre('save')
// del modelo Exercise a partir de grupoMuscular y tipo.

export const exercisePresets = [
  // ───────────── PECHO ─────────────
  { nombre: 'Press banca con barra', grupoMuscular: 'Pecho', tipo: 'Pesas libres' },
  { nombre: 'Press banca con mancuernas', grupoMuscular: 'Pecho', tipo: 'Pesas libres' },
  { nombre: 'Press inclinado con barra', grupoMuscular: 'Pecho', tipo: 'Pesas libres' },
  { nombre: 'Press inclinado con mancuernas', grupoMuscular: 'Pecho', tipo: 'Pesas libres' },
  { nombre: 'Aperturas con mancuernas', grupoMuscular: 'Pecho', tipo: 'Pesas libres' },
  { nombre: 'Cruces en polea', grupoMuscular: 'Pecho', tipo: 'Poleas' },
  { nombre: 'Press en máquina', grupoMuscular: 'Pecho', tipo: 'Maquinas' },
  { nombre: 'Fondos en paralelas', grupoMuscular: 'Pecho', tipo: 'Peso corporal' },
  { nombre: 'Flexiones', grupoMuscular: 'Pecho', tipo: 'Peso corporal' },

  // ───────────── ESPALDA ─────────────
  { nombre: 'Dominadas', grupoMuscular: 'Espalda', tipo: 'Peso corporal' },
  { nombre: 'Jalón al pecho', grupoMuscular: 'Espalda', tipo: 'Poleas' },
  { nombre: 'Remo con barra', grupoMuscular: 'Espalda', tipo: 'Pesas libres' },
  { nombre: 'Remo con mancuerna', grupoMuscular: 'Espalda', tipo: 'Pesas libres' },
  { nombre: 'Remo en máquina', grupoMuscular: 'Espalda', tipo: 'Maquinas' },
  { nombre: 'Remo en polea baja', grupoMuscular: 'Espalda', tipo: 'Poleas' },
  { nombre: 'Pullover en polea', grupoMuscular: 'Espalda', tipo: 'Poleas' },
  { nombre: 'Peso muerto', grupoMuscular: 'Espalda', tipo: 'Pesas libres' },

  // ───────────── HOMBROS ─────────────
  { nombre: 'Press militar con barra', grupoMuscular: 'Hombros', tipo: 'Pesas libres' },
  { nombre: 'Press militar con mancuernas', grupoMuscular: 'Hombros', tipo: 'Pesas libres' },
  { nombre: 'Press en máquina', grupoMuscular: 'Hombros', tipo: 'Maquinas' },
  { nombre: 'Elevaciones laterales con mancuernas', grupoMuscular: 'Hombros', tipo: 'Pesas libres' },
  { nombre: 'Elevaciones laterales en polea', grupoMuscular: 'Hombros', tipo: 'Poleas' },
  { nombre: 'Elevaciones frontales', grupoMuscular: 'Hombros', tipo: 'Pesas libres' },
  { nombre: 'Pájaros con mancuernas', grupoMuscular: 'Hombros', tipo: 'Pesas libres' },
  { nombre: 'Face pull', grupoMuscular: 'Hombros', tipo: 'Poleas' },

  // ───────────── BRAZOS ─────────────
  { nombre: 'Curl con barra', grupoMuscular: 'Brazos', tipo: 'Pesas libres' },
  { nombre: 'Curl con mancuernas', grupoMuscular: 'Brazos', tipo: 'Pesas libres' },
  { nombre: 'Curl martillo', grupoMuscular: 'Brazos', tipo: 'Pesas libres' },
  { nombre: 'Curl en polea', grupoMuscular: 'Brazos', tipo: 'Poleas' },
  { nombre: 'Curl predicador', grupoMuscular: 'Brazos', tipo: 'Maquinas' },
  { nombre: 'Extensión de tríceps en polea', grupoMuscular: 'Brazos', tipo: 'Poleas' },
  { nombre: 'Press francés', grupoMuscular: 'Brazos', tipo: 'Pesas libres' },
  { nombre: 'Fondos en banco', grupoMuscular: 'Brazos', tipo: 'Peso corporal' },
  { nombre: 'Extensión tríceps con mancuerna', grupoMuscular: 'Brazos', tipo: 'Pesas libres' },

  // ───────────── PIERNAS ─────────────
  { nombre: 'Sentadilla libre', grupoMuscular: 'Piernas', tipo: 'Pesas libres' },
  { nombre: 'Sentadilla frontal', grupoMuscular: 'Piernas', tipo: 'Pesas libres' },
  { nombre: 'Sentadilla búlgara', grupoMuscular: 'Piernas', tipo: 'Pesas libres' },
  { nombre: 'Prensa de piernas', grupoMuscular: 'Piernas', tipo: 'Maquinas' },
  { nombre: 'Extensión de cuádriceps', grupoMuscular: 'Piernas', tipo: 'Maquinas' },
  { nombre: 'Curl femoral tumbado', grupoMuscular: 'Piernas', tipo: 'Maquinas' },
  { nombre: 'Curl femoral sentado', grupoMuscular: 'Piernas', tipo: 'Maquinas' },
  { nombre: 'Peso muerto rumano', grupoMuscular: 'Piernas', tipo: 'Pesas libres' },
  { nombre: 'Hip thrust', grupoMuscular: 'Piernas', tipo: 'Pesas libres' },
  { nombre: 'Zancadas con mancuernas', grupoMuscular: 'Piernas', tipo: 'Pesas libres' },
  { nombre: 'Elevación de talones de pie', grupoMuscular: 'Piernas', tipo: 'Maquinas' },

  // ───────────── CORE ─────────────
  { nombre: 'Plancha frontal', grupoMuscular: 'Core', tipo: 'Peso corporal' },
  { nombre: 'Plancha lateral', grupoMuscular: 'Core', tipo: 'Peso corporal' },
  { nombre: 'Crunch abdominal', grupoMuscular: 'Core', tipo: 'Peso corporal' },
  { nombre: 'Crunch en polea', grupoMuscular: 'Core', tipo: 'Poleas' },
  { nombre: 'Elevación de piernas colgado', grupoMuscular: 'Core', tipo: 'Peso corporal' },
  { nombre: 'Rueda abdominal', grupoMuscular: 'Core', tipo: 'Peso corporal' },
  { nombre: 'Russian twist con peso', grupoMuscular: 'Core', tipo: 'Pesas libres' },

  // ───────────── CARDIO ─────────────
  { nombre: 'Carrera continua', grupoMuscular: 'Cardio', tipo: 'Cardio' },
  { nombre: 'Cinta de correr', grupoMuscular: 'Cardio', tipo: 'Cardio' },
  { nombre: 'Bicicleta estática', grupoMuscular: 'Cardio', tipo: 'Cardio' },
  { nombre: 'Elíptica', grupoMuscular: 'Cardio', tipo: 'Cardio' },
  { nombre: 'Remo en máquina (cardio)', grupoMuscular: 'Cardio', tipo: 'Cardio' },
  { nombre: 'Saltos a la comba', grupoMuscular: 'Cardio', tipo: 'Cardio' },
];