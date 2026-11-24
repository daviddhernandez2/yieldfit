// Cálculos de presentación de la actividad del Dashboard (bloque 9d). Los datos (sesiones por
// semana, racha, meses) los calcula el servidor (GET /api/estadisticas/actividad); aquí solo lo
// que necesita pintar cada widget. Puras: pruebas en actividad.test.js.

// Media de sesiones por semana en las semanas recibidas, con un decimal: 37 en 12 → 3,1.
export const mediaPorSemana = (semanas) => {
  if (semanas.length === 0) return 0;
  const total = semanas.reduce((n, s) => n + s.sesiones, 0);
  return Math.round((total / semanas.length) * 10) / 10;
};

// Alto de cada barra en % del máximo (la semana con más sesiones llega arriba). Sin sesiones,
// 0: la barra se pinta como una línea en la base.
export const alturasBarras = (semanas) => {
  const max = Math.max(0, ...semanas.map((s) => s.sesiones));
  return semanas.map((s) => (max === 0 ? 0 : Math.round((s.sesiones / max) * 100)));
};

// Texto de la racha: "5 semanas", "1 semana", "más de 104 semanas".
export const textoRacha = ({ semanas, masDe }) =>
  `${masDe ? 'más de ' : ''}${semanas} ${semanas === 1 ? 'semana' : 'semanas'}`;
