// Nombres de ejercicios de Strong (su catálogo, en inglés) → el preset de Yield Fit equivalente
// (bloque 7b). Solo sirve para PROPONER en la vista previa: el usuario lo ve y lo cambia si no es
// el suyo, y lo que elija se recuerda (EmparejamientoImport) por encima de esta lista.
//
// Va el nombre del preset y su grupo muscular porque hay presets con el mismo nombre en dos grupos
// ("Press en máquina" en Pecho y en Hombros). Si el usuario renombró o borró ese preset, no hay
// propuesta por aquí y se pasa a la siguiente regla (utils/emparejarStrong.js).
//
// Los nombres se comparan normalizados (sin mayúsculas, tildes ni espacios de más), así que da
// igual "Pull Up" o "pull up". Añadir una línea no rompe nada: como mucho, una propuesta más.
export const EQUIVALENCIAS_STRONG = [
  // Pecho
  ['Bench Press (Barbell)', 'Press banca con barra', 'Pecho'],
  ['Bench Press (Dumbbell)', 'Press banca con mancuernas', 'Pecho'],
  ['Incline Bench Press (Barbell)', 'Press inclinado con barra', 'Pecho'],
  ['Incline Bench Press (Dumbbell)', 'Press inclinado con mancuernas', 'Pecho'],
  ['Chest Fly (Dumbbell)', 'Aperturas con mancuernas', 'Pecho'],
  ['Cable Crossover', 'Cruces en polea', 'Pecho'],
  ['Chest Press (Machine)', 'Press en máquina', 'Pecho'],
  ['Chest Dip', 'Fondos en paralelas', 'Pecho'],
  ['Push Up', 'Flexiones', 'Pecho'],
  // Espalda
  ['Pull Up', 'Dominadas', 'Espalda'],
  ['Lat Pulldown (Cable)', 'Jalón al pecho', 'Espalda'],
  ['Bent Over Row (Barbell)', 'Remo con barra', 'Espalda'],
  ['Bent Over One Arm Row (Dumbbell)', 'Remo con mancuerna', 'Espalda'],
  ['Seated Row (Machine)', 'Remo en máquina', 'Espalda'],
  ['Seated Row (Cable)', 'Remo en polea baja', 'Espalda'],
  ['Deadlift (Barbell)', 'Peso muerto', 'Espalda'],
  // Hombros
  ['Overhead Press (Barbell)', 'Press militar con barra', 'Hombros'],
  ['Overhead Press (Dumbbell)', 'Press militar con mancuernas', 'Hombros'],
  ['Shoulder Press (Dumbbell)', 'Press militar con mancuernas', 'Hombros'],
  ['Shoulder Press (Machine)', 'Press en máquina', 'Hombros'],
  ['Lateral Raise (Dumbbell)', 'Elevaciones laterales con mancuernas', 'Hombros'],
  ['Lateral Raise (Cable)', 'Elevaciones laterales en polea', 'Hombros'],
  ['Front Raise (Dumbbell)', 'Elevaciones frontales', 'Hombros'],
  ['Reverse Fly (Dumbbell)', 'Pájaros con mancuernas', 'Hombros'],
  ['Face Pull (Cable)', 'Face pull', 'Hombros'],
  // Brazos
  ['Bicep Curl (Barbell)', 'Curl con barra', 'Brazos'],
  ['Bicep Curl (Dumbbell)', 'Curl con mancuernas', 'Brazos'],
  ['Hammer Curl (Dumbbell)', 'Curl martillo', 'Brazos'],
  ['Bicep Curl (Cable)', 'Curl en polea', 'Brazos'],
  ['Preacher Curl (Machine)', 'Curl predicador', 'Brazos'],
  ['Triceps Pushdown (Cable - Straight Bar)', 'Extensión de tríceps en polea', 'Brazos'],
  ['Triceps Pushdown (Cable - Rope)', 'Extensión de tríceps en polea', 'Brazos'],
  ['Triceps Extension (Cable)', 'Extensión de tríceps en polea', 'Brazos'],
  ['Skullcrusher (Barbell)', 'Press francés', 'Brazos'],
  ['Bench Dip', 'Fondos en banco', 'Brazos'],
  ['Triceps Extension (Dumbbell)', 'Extensión tríceps con mancuerna', 'Brazos'],
  // Piernas
  ['Squat (Barbell)', 'Sentadilla libre', 'Piernas'],
  ['Front Squat (Barbell)', 'Sentadilla frontal', 'Piernas'],
  ['Bulgarian Split Squat', 'Sentadilla búlgara', 'Piernas'],
  ['Leg Press', 'Prensa de piernas', 'Piernas'],
  ['Leg Extension (Machine)', 'Extensión de cuádriceps', 'Piernas'],
  ['Lying Leg Curl (Machine)', 'Curl femoral tumbado', 'Piernas'],
  ['Seated Leg Curl (Machine)', 'Curl femoral sentado', 'Piernas'],
  ['Romanian Deadlift (Barbell)', 'Peso muerto rumano', 'Piernas'],
  ['Romanian Deadlift (Dumbbell)', 'Peso muerto rumano', 'Piernas'],
  ['Hip Thrust (Barbell)', 'Hip thrust', 'Piernas'],
  ['Lunge (Dumbbell)', 'Zancadas con mancuernas', 'Piernas'],
  ['Standing Calf Raise (Machine)', 'Elevación de talones de pie', 'Piernas'],
  // Core
  ['Plank', 'Plancha frontal', 'Core'],
  ['Side Plank', 'Plancha lateral', 'Core'],
  ['Crunch', 'Crunch abdominal', 'Core'],
  ['Cable Crunch', 'Crunch en polea', 'Core'],
  ['Hanging Leg Raise', 'Elevación de piernas colgado', 'Core'],
  ['Ab Wheel', 'Rueda abdominal', 'Core'],
  ['Russian Twist', 'Russian twist con peso', 'Core'],
  // Cardio
  ['Running', 'Carrera continua', 'Cardio'],
  ['Running (Treadmill)', 'Cinta de correr', 'Cardio'],
  ['Cycling (Indoor)', 'Bicicleta estática', 'Cardio'],
  ['Elliptical Machine', 'Elíptica', 'Cardio'],
  ['Rowing (Machine)', 'Remo en máquina (cardio)', 'Cardio'],
  ['Jump Rope', 'Saltos a la comba', 'Cardio'],
].map(([strong, nombre, grupoMuscular]) => ({ strong, nombre, grupoMuscular }));
