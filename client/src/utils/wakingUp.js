// Detecta si el servidor está "despertando" (arranque en frío de Render) y lo anuncia.
//
// Con el plan gratuito, Render apaga el servidor tras ~15 min sin uso y la siguiente
// petición tarda 30-60 s. No hay forma de saber desde el cliente si el servidor está
// dormido; lo que sí se ve es que una petición tarda. Regla: si alguna petición lleva
// más de UMBRAL_MS sin respuesta, el estado es "despertando" hasta que todas las
// peticiones lentas terminen (con respuesta o con error).
//
// Es un "tablón de anuncios" (pub-sub) porque quien detecta la lentitud son los
// interceptores de axios, que viven fuera de React. Los componentes lo leen con el
// hook useServerWakingUp (DECISIONS.md, 0025).

// 4 s: por debajo es una carga normal; por encima, casi seguro un arranque en frío.
// Si el aviso saliera antes, aparecería en cada carga en una red móvil lenta.
const UMBRAL_MS = 4000;

let peticionesLentas = 0;
let despertando = false;
const oyentes = new Set();

// Solo avisa si el valor cambia: así los componentes no se repintan sin motivo.
const publicar = () => {
  const ahora = peticionesLentas > 0;
  if (ahora === despertando) return;
  despertando = ahora;
  oyentes.forEach((oyente) => oyente());
};

// Las dos funciones que pide useSyncExternalStore: suscribirse y leer el valor.
export const suscribirse = (oyente) => {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
};

export const estaDespertando = () => despertando;

// Se llama cuando sale una petición. Devuelve la función que hay que llamar cuando
// termine. Si termina antes de UMBRAL_MS, el temporizador se cancela y nadie se entera.
export const vigilarPeticion = () => {
  let esLenta = false;
  const temporizador = setTimeout(() => {
    esLenta = true;
    peticionesLentas += 1;
    publicar();
  }, UMBRAL_MS);

  let terminada = false;
  return () => {
    if (terminada) return; // por si se llama dos veces: no restar de más
    terminada = true;
    clearTimeout(temporizador);
    if (esLenta) {
      peticionesLentas -= 1;
      publicar();
    }
  };
};
