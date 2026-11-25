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

// Textos del widget Racha según su estado (bloque 9d) y su tamano ("P" o "M").
// Devuelve { etiqueta, cifra (número o null si está rota), unidad, pie, dato, accesible }.
// En M no hay pie (opción 2 de la tarjeta Espaciado, bloque 9d): las semanas van solas debajo de
// la cifra. "seguidas" pasa a la unidad ("3 semanas seguidas") y el aviso de en riesgo o rota,
// más corto, a la derecha de la cabecera (`dato`).
// En P no hay unidad junto a la cifra: con la llama y la cifra a 32 px, "3 semanas" no cabía en un
// P a 375 px (114 px de ancho). "semanas" va al pie, de hasta dos líneas (unidad: null).
export const textosRacha = ({ semanas, masDe, estado }, tamano = 'M') => {
  const enM = tamano === 'M';
  const unidad = semanas === 1 ? 'semana' : 'semanas';
  const cifra = `${masDe ? '+' : ''}${semanas}`;
  if (estado === 'rota') {
    return {
      etiqueta: 'Racha',
      cifra: null,
      unidad,
      pie: enM ? null : 'Empieza una racha nueva',
      dato: enM ? 'Empieza una nueva' : null,
      accesible: 'Sin racha. Empieza una racha nueva',
    };
  }
  if (estado === 'enRiesgo') {
    return {
      etiqueta: enM ? 'Racha · en riesgo' : 'Racha',
      cifra,
      unidad: enM ? unidad : null,
      pie: enM ? null : `${unidad} · entrena esta semana`,
      dato: enM ? 'Entrena esta semana' : null,
      accesible: `Racha en riesgo: ${textoRacha({ semanas, masDe })}. Entrena esta semana para mantenerla`,
    };
  }
  return {
    etiqueta: 'Racha',
    cifra,
    unidad: enM ? `${unidad} ${semanas === 1 ? 'seguida' : 'seguidas'}` : null,
    pie: enM ? null : `${unidad} ${semanas === 1 ? 'seguida' : 'seguidas'}`,
    dato: null,
    accesible: `Racha: ${textoRacha({ semanas, masDe })} seguidas entrenando`,
  };
};

// Cuántos círculos de semana caben en `ancho` px (círculos de 12 px con 8 px de hueco: 20 px por
// semana, menos el último hueco). Lo que cambia con el ancho es cuántas semanas se ven, no su
// tamaño (anatomía de widget, bloque 9d). Como mucho, las que hay.
export const semanasQueCaben = (ancho, disponibles) =>
  Math.max(0, Math.min(disponibles, Math.floor((ancho + 8) / 20)));
