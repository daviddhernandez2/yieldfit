// Esfuerzo por serie (bloque 5c, DECISIONS 0056): el RPE y la preferencia de cómo verlo. Es la
// única fuente de verdad: el modelo Session valida con esRpeValido, y el cliente recibe el rango
// y las opciones con GET /api/exercises/opciones (no los copia a mano).
//
// Solo se guarda el RPE (Rate of Perceived Exertion: de 6 a 10, cuánto costó la serie). El RIR
// (Reps In Reserve: repeticiones que quedaban) es 10 − RPE y se calcula al mostrarlo: así no hay
// dos datos que puedan contradecirse.

export const RPE = { min: 6, max: 10, paso: 0.5 };

// ¿Es un RPE permitido? De 6 a 10 en pasos de 0,5. Vacío (undefined o null) también vale: el
// esfuerzo es opcional en cada serie.
export const esRpeValido = (valor) => {
  if (valor === undefined || valor === null) return true;
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return false;
  if (valor < RPE.min || valor > RPE.max) return false;
  // En pasos de 0,5: el doble del valor tiene que ser un número entero.
  return Number.isInteger(valor / RPE.paso);
};

// Cómo ve cada usuario el esfuerzo (Perfil). "no": no aparece en ningún sitio, aunque haya datos.
export const OPCIONES_ESFUERZO = [
  { value: 'no', label: 'No mostrar' },
  { value: 'rpe', label: 'RPE' },
  { value: 'rir', label: 'RIR' },
];
export const VALORES_ESFUERZO = OPCIONES_ESFUERZO.map((o) => o.value);
export const ESFUERZO_POR_DEFECTO = 'no';
