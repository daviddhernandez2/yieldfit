// Definición compartida de los items de navegación.
// Tanto Sidebar (desktop) como TabBar (mobile) consumen este array.
// Si se añade una sección nueva, basta con tocarlo aquí.

// Cada item nombra su icono de Icono (iconos de interfaz del design system): así el menú y el resto
// de la app comparten los mismos trazos (bloque 10: antes había dos mancuernas distintas).
export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Inicio', icono: 'inicio' },
  { path: '/history', label: 'Historial', icono: 'historial' },
  { path: '/workouts', label: 'Entrenar', icono: 'entrenar' },
  { path: '/exercises', label: 'Ejercicios', icono: 'ejercicios' },
  { path: '/profile', label: 'Perfil', icono: 'perfil' },
];