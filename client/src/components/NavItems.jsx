// Definición compartida de los items de navegación.
// Tanto Sidebar (desktop) como TabBar (mobile) consumen este array.
// Si se añade una sección nueva, basta con tocarlo aquí.

// Iconos SVG inline. Tamaño y stroke se controlan desde el padre con currentColor.
const IconHome = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);

const IconHistory = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <polyline points="3 4 3 9 8 9" />
    <polyline points="12 7 12 12 16 14" />
  </svg>
);

const IconDumbbell = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9v6" />
    <path d="M18 9v6" />
    <rect x="2" y="8" width="4" height="8" rx="1" />
    <rect x="18" y="8" width="4" height="8" rx="1" />
    <line x1="6" y1="12" x2="18" y2="12" />
  </svg>
);

const IconList = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const IconUser = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Inicio', Icon: IconHome },
  { path: '/history', label: 'Historial', Icon: IconHistory },
  { path: '/workouts', label: 'Entrenar', Icon: IconDumbbell },
  { path: '/exercises', label: 'Ejercicios', Icon: IconList },
  { path: '/profile', label: 'Perfil', Icon: IconUser },
];