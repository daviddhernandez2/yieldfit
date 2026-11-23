// Lee un color del design system (una variable CSS de variables.css) y lo devuelve como
// [r, g, b] entre 0 y 1, el formato que esperan los shaders de WebGL (bloque 9c).
//
// Así el fondo animado de las pantallas con sesión (DarkVeil) usa el mismo negro que el resto
// de la app sin copiar el valor: si cambia el token, cambia él. La portada (Dither) mantiene su
// negro puro a propósito (decisión de David).
//
// getComputedStyle devuelve el valor ya resuelto aunque el token apunte a otro
// (--color-bg: var(--surface-0) → "#08090a"). Acepta #rgb y #rrggbb; si el valor no se puede
// leer, devuelve negro, el color que tenían antes estos fondos.
export const leerColorToken = (nombre) => {
  const valor = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(valor)?.[1];
  if (!hex) return [0, 0, 0];
  const largo = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;
  return [0, 2, 4].map((i) => parseInt(largo.slice(i, i + 2), 16) / 255);
};
