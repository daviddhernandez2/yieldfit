// Esfuerzo por serie en el cliente (bloque 5c, DECISIONS 0056): solo conversión y formato.
// El rango permitido del RPE y las opciones de la preferencia NO están aquí: los manda el
// servidor en GET /api/exercises/opciones (server/utils/esfuerzo.js es la fuente de verdad).
//
// Se guarda siempre el RPE. El RIR (repeticiones que quedaban) es 10 − RPE y solo se muestra.
// `modo` es la preferencia del usuario: 'no' (no mostrar), 'rpe' o 'rir'.

// Los dos se miden sobre 10: con RPE 10 no quedaba ninguna repetición (RIR 0).
const ESCALA = 10;

export const rpeARir = (rpe) => ESCALA - rpe;

// ¿Se muestra el esfuerzo? Con "no mostrar", en ningún sitio, aunque la serie lo tenga.
export const seMuestra = (modo) => modo === 'rpe' || modo === 'rir';

// El número que se ve para un RPE guardado, según el modo: 8,5 en RPE es 1,5 en RIR.
// Con coma decimal, como el resto de la app. Sin RPE, null.
export const valorEsfuerzo = (rpe, modo) => {
  if (rpe === undefined || rpe === null || !seMuestra(modo)) return null;
  const numero = modo === 'rir' ? rpeARir(rpe) : rpe;
  return numero.toLocaleString('es-ES', { maximumFractionDigits: 1 });
};

// "RPE 8,5" / "RIR 1,5". Sin RPE o con "no mostrar", cadena vacía.
export const formatEsfuerzo = (rpe, modo) => {
  const valor = valorEsfuerzo(rpe, modo);
  return valor === null ? '' : `${modo.toUpperCase()} ${valor}`;
};

// Los valores que se pueden elegir, a partir del rango del servidor ({ min, max, paso }), en el
// orden en que se ven: RPE de menos a más esfuerzo (6 … 10); RIR de más a menos repeticiones
// que quedaban (4 … 0), que es el mismo orden de esfuerzo. Cada uno: { rpe, etiqueta }.
export const valoresEsfuerzo = (rango, modo) => {
  const valores = [];
  // Se cuenta en pasos enteros para no acumular errores de coma flotante (6 + 0,5 + 0,5…).
  const pasos = Math.round((rango.max - rango.min) / rango.paso);
  for (let i = 0; i <= pasos; i++) {
    const rpe = rango.min + i * rango.paso;
    valores.push({ rpe, etiqueta: valorEsfuerzo(rpe, modo) });
  }
  return valores;
};
