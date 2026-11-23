// Cálculo del progreso (DECISIONS.md, 0026). Función pura: recibe datos ya leídos de la
// base y devuelve números; no consulta nada. Así se puede probar sin MongoDB.
//
// Dos ideas, explicadas con un ejemplo:
//
// 1. % de un ejercicio, "tipo bolsa": del primer punto del rango al último.
//    Mejor 1RM por sesión 100 → 110 → 104  ⇒  (104 / 100 − 1) × 100 = +4 %.
//    Límite: un día malo justo al principio o al final del rango mueve mucho el número.
//    Usar el MEJOR 1RM de cada sesión (no la media de sus series) lo suaviza.
//
// 2. Índice base 100 para el grupo (la línea del gráfico):
//    cada ejercicio vale 100 en su primer punto del rango; después, su valor / primero × 100.
//    En cada sesión, la línea es la media de los índices de todos los ejercicios ya
//    empezados; el que no se hizo ese día mantiene su último valor.
//      Sentadilla 150 → 165 (índice 110) y curl 20 → 21 (índice 105) ⇒ línea 107,5.
//    Así todos los ejercicios pesan lo mismo (la sentadilla no aplasta al curl) y el día
//    de piernas no hunde la línea. El último punto de la línea − 100 = % del grupo.
//    Límite: un ejercicio que empieza a mitad del rango entra con 100 y tira de la media
//    hacia 100 ese día, aunque nadie haya empeorado.

const redondear = (n) => Math.round(n * 100) / 100;

// sesiones: [{ fecha, ejercicios: [{ exerciseId, mejor1RM }] }] ordenadas por fecha ascendente.
// nombres: Map(exerciseId → nombre) con los ejercicios que existen hoy (los borrados no
//          cuentan en el progreso, 0020).
export const calcularProgreso = (sesiones, nombres) => {
  // Paso 1: el mejor 1RM de cada ejercicio en cada sesión. Si un ejercicio aparece dos
  // veces en la misma sesión, cuenta su mejor valor. Cardio (null) y 0 no cuentan.
  const porSesion = sesiones.map((sesion) => {
    const mejores = new Map();
    for (const ej of sesion.ejercicios) {
      const id = String(ej.exerciseId);
      if (!nombres.has(id) || !(ej.mejor1RM > 0)) continue;
      mejores.set(id, Math.max(mejores.get(id) ?? 0, ej.mejor1RM));
    }
    return { fecha: sesion.fecha, mejores };
  });

  // Paso 2: primer y último valor de cada ejercicio, y en cuántas sesiones aparece.
  const resumen = new Map(); // id → { primero, ultimo, puntos }
  for (const { mejores } of porSesion) {
    for (const [id, valor] of mejores) {
      const r = resumen.get(id);
      if (r) {
        r.ultimo = valor;
        r.puntos += 1;
      } else {
        resumen.set(id, { primero: valor, ultimo: valor, puntos: 1 });
      }
    }
  }

  // Solo cuentan los ejercicios con al menos 2 puntos en el rango: con uno no hay
  // "desde" y "hasta" que comparar.
  const ejercicios = [];
  for (const [id, r] of resumen) {
    if (r.puntos < 2) continue;
    ejercicios.push({
      exerciseId: id,
      nombre: nombres.get(id),
      porcentaje: redondear((r.ultimo / r.primero - 1) * 100),
    });
  }
  ejercicios.sort((a, b) => b.porcentaje - a.porcentaje);
  const elegibles = new Set(ejercicios.map((e) => e.exerciseId));

  // Paso 3: la línea del índice base 100.
  const indiceActual = new Map(); // id → último índice conocido
  const serie = [];
  for (const { fecha, mejores } of porSesion) {
    let tocaElegible = false;
    for (const [id, valor] of mejores) {
      if (!elegibles.has(id)) continue;
      indiceActual.set(id, (valor / resumen.get(id).primero) * 100);
      tocaElegible = true;
    }
    // Un punto por sesión que movió algún ejercicio; las demás no cambian la línea.
    if (!tocaElegible) continue;
    let suma = 0;
    for (const indice of indiceActual.values()) suma += indice;
    serie.push({ fecha, indice: redondear(suma / indiceActual.size) });
  }

  // % del grupo = media de los % de sus ejercicios (= último punto de la línea − 100).
  const porcentaje =
    ejercicios.length === 0
      ? null
      : redondear(ejercicios.reduce((s, e) => s + e.porcentaje, 0) / ejercicios.length);

  return { sesiones: sesiones.length, porcentaje, ejercicios, serie };
};

// Reduce la línea del gráfico a como mucho `maximo` puntos (bloque 9, DECISIONS.md 0034).
// Con el rango "Total" de 10 años hay ~1.400 puntos (uno por sesión): más de los que se
// distinguen en una pantalla y más trabajo para el navegador. Se parte la serie en
// `maximo` tramos seguidos y se queda el ÚLTIMO punto de cada tramo, más el primero de
// todos. Así la línea empieza en 100 y acaba exactamente donde acaba la serie completa
// (último punto − 100 = % del grupo). El % se calcula antes, con todos los puntos.
export const reducirSerie = (serie, maximo = 150) => {
  if (serie.length <= maximo) return serie;
  const reducida = [serie[0]];
  for (let tramo = 1; tramo < maximo; tramo++) {
    // Índice del último punto de este tramo (el último tramo acaba en el último punto).
    const indice = Math.round((tramo * (serie.length - 1)) / (maximo - 1));
    if (reducida.at(-1) !== serie[indice]) reducida.push(serie[indice]);
  }
  return reducida;
};

