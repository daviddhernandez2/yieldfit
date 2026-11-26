// La vista previa de la importación de Strong (bloque 7b), montada sin tocar la base de datos: el
// controlador lee lo que hace falta (ejercicios, emparejamientos recordados, claves ya importadas
// y las sesiones registradas a mano en esas fechas) y esta función lo junta con lo que salió del
// CSV. Así se puede probar entera sin servidor.

import { diaLocal } from './actividad.js';
import { proponerEmparejamientos, resumirEjercicios } from './emparejarStrong.js';

const UN_DIA = 24 * 60 * 60 * 1000;

// Las sesiones del CSV que todavía no están importadas (por su clave: origen + fecha de inicio).
export const separarYaImportadas = (sesiones, clavesYaImportadas) => {
  const ya = new Set(clavesYaImportadas);
  return {
    nuevas: sesiones.filter((s) => !ya.has(s.clave)),
    yaImportadas: sesiones.filter((s) => ya.has(s.clave)).length,
  };
};

// El rango de fechas que hay que mirar para encontrar sesiones registradas a mano el mismo día
// (con un día de margen a cada lado: el día de la zona del usuario puede empezar antes o después
// que el día en UTC). null si no hay sesiones.
export const rangoParaCoincidencias = (nuevas) => {
  if (nuevas.length === 0) return null;
  const tiempos = nuevas.map((s) => s.fecha.getTime());
  return { desde: new Date(Math.min(...tiempos) - UN_DIA), hasta: new Date(Math.max(...tiempos) + UN_DIA) };
};

// Decisión B: los días en los que ya hay una sesión registrada en la app. Cada sesión del CSV de
// ese día sale en la lista (con las de la app, para que el usuario compare) y se salta salvo que
// el usuario la incluya. Los días son los de la zona del usuario.
export const buscarCoincidencias = (nuevas, sesionesApp, zona) => {
  const appPorDia = new Map();
  for (const s of sesionesApp) {
    const dia = diaLocal(s.fecha, zona);
    if (!appPorDia.has(dia)) appPorDia.set(dia, []);
    appPorDia.get(dia).push({ nombre: s.nombre, fecha: s.fecha });
  }
  return nuevas
    .map((s) => ({ s, dia: diaLocal(s.fecha, zona) }))
    .filter(({ dia }) => appPorDia.has(dia))
    .map(({ s, dia }) => ({ clave: s.clave, dia, nombre: s.nombre, fecha: s.fecha, sesionesApp: appPorDia.get(dia) }));
};

// Decisión 2: qué ejercicios de Strong salen juntos en algún entreno. Si el usuario empareja dos de
// ellos con el mismo ejercicio de Yield Fit, se juntarán en uno (series seguidas) y la vista previa
// lo avisa; el aviso depende de lo que elija, así que el cliente lo comprueba con esta lista.
const coincidenEnSesion = (nuevas) => {
  const con = new Map();
  for (const s of nuevas) {
    const nombres = s.ejercicios.map((e) => e.nombreStrong);
    for (const n of nombres) {
      if (!con.has(n)) con.set(n, new Set());
      for (const otro of nombres) if (otro !== n) con.get(n).add(otro);
    }
  }
  return con;
};

// Monta la respuesta de la vista previa.
//   agrupado: lo que devuelve agruparSesiones (sesiones, errores, totalErrores, seriesDescartadas, avisos);
//   ejercicios, recordados: los del usuario (ver proponerEmparejamientos);
//   clavesYaImportadas: las claves de este CSV que ya están en la base;
//   sesionesApp: las sesiones registradas a mano en el rango de rangoParaCoincidencias;
//   zona: la del usuario.
export const montarVistaPrevia = ({ agrupado, ejercicios, recordados, clavesYaImportadas, sesionesApp, zona }) => {
  const { nuevas, yaImportadas } = separarYaImportadas(agrupado.sesiones, clavesYaImportadas);
  const juntos = coincidenEnSesion(nuevas);
  const propuestas = proponerEmparejamientos({ resumen: resumirEjercicios(nuevas), ejercicios, recordados }).map((p) => ({
    ...p,
    coincideCon: [...(juntos.get(p.nombreStrong) ?? [])].sort(),
  }));

  return {
    resumen: {
      sesiones: nuevas.length,
      series: nuevas.reduce((n, s) => n + s.ejercicios.reduce((m, e) => m + e.series.length, 0), 0),
      ejercicios: propuestas.length,
      yaImportadas,
      desde: nuevas.length ? diaLocal(nuevas[0].fecha, zona) : null,
      hasta: nuevas.length ? diaLocal(nuevas[nuevas.length - 1].fecha, zona) : null,
      notasCortadas: nuevas.filter((s) => s.notasCortadas).length,
    },
    ejercicios: propuestas,
    coincidencias: buscarCoincidencias(nuevas, sesionesApp, zona),
    errores: agrupado.errores,
    totalErrores: agrupado.totalErrores,
    seriesDescartadas: agrupado.seriesDescartadas,
    avisos: agrupado.avisos,
  };
};
