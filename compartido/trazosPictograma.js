import { PICTOGRAMAS, PICTOGRAMA_POR_PRESET, PICTOGRAMA_POR_GRUPO, ICONOS_RUTINA } from './pictogramas.js';

// Lógica pura de los pictogramas (bloque 10): qué figura le toca a cada cosa y cómo se convierten
// sus datos en trazos SVG. Sin React ni DOM: el componente de la web solo pinta lo que devuelve
// esto, y la app de React Native (react-native-svg usa los mismos atributos "d") podrá hacer igual.

// Qué figura le toca a un ejercicio: la de su preset si la tiene (aunque lo haya renombrado) y,
// si no, la imagen de su grupo muscular. null si no hay ninguna de las dos, por ejemplo una
// sesión antigua sin esos datos: quien lo muestra deja el hueco vacío (decisión de David).
export const elegirPictograma = ({ presetId, grupoMuscular } = {}) =>
  PICTOGRAMA_POR_PRESET[presetId] ?? PICTOGRAMA_POR_GRUPO[grupoMuscular] ?? null;

// Figura del icono de una rutina, o null si no tiene icono (es opcional) o no existe.
export const pictogramaDeRutina = (icono) => ICONOS_RUTINA[icono]?.[0] ?? null;

// "x,y x,y|x,y x,y" (polilíneas separadas por "|") → "M x y L x y M x y L x y".
const polilineas = (texto) =>
  (texto ?? '')
    .split('|')
    .filter((tramo) => tramo.trim())
    .map((tramo) => 'M' + tramo.trim().split(/\s+/).map((punto) => punto.replace(',', ' ')).join(' L'))
    .join(' ');

// [cx, cy, r] → un círculo como path (dos arcos), para poder juntar todos los discos en un solo
// <path> y dibujarlos con un único borde del color del fondo.
const circulo = ([cx, cy, r]) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`;

// Torsos de frente [x1, y1, x2, y2, esVerde]: los grises o los verdes, como segmentos.
const torsos = (lista, verdes) =>
  (lista ?? [])
    .filter((t) => Boolean(t[4]) === verdes)
    .map(([x1, y1, x2, y2]) => `M${x1} ${y1} L${x2} ${y2}`)
    .join(' ');

// Los trazos de una figura, en el orden en que se dibujan (de atrás adelante). Cada capa es un
// "d" de SVG (cadena vacía si la figura no la tiene) salvo la cabeza, que es [x, y].
// null si el id no existe.
export const trazosDe = (id) => {
  const f = PICTOGRAMAS[id];
  if (!f) return null;
  return {
    equipo: f.eq ?? '',
    equipoGrueso: f.eg ?? '',
    cables: f.ca ?? '',
    torsoGris: torsos(f.gr, false),
    torsoVerde: torsos(f.gr, true),
    cuerpo: polilineas(f.g),
    trabaja: polilineas(f.v),
    relleno: f.relleno ?? '',
    discos: (f.d ?? []).map(circulo).join(' '),
    cabeza: f.cab,
  };
};
