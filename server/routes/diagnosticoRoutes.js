import express from 'express';

// TEMPORAL (bloque 11, investigación de la IP del cliente). Se quita en cuanto se arregle
// cómo se lee la IP detrás de los proxies de Render; ver DECISIONS.md 0035.
//
// GET /api/diagnostico/ip devuelve, SOLO a quien la pide y SOLO sobre su propia petición:
//   - las entradas de X-Forwarded-For, numeradas;
//   - las otras cabeceras que algunos proxies usan para la IP del cliente, si llegan;
//   - la IP que vería Express con trust proxy en 0, 1, 2, 3 y 4.
// No escribe nada en los logs y no devuelve ninguna otra cabecera (ni cookies ni
// Authorization). No pide sesión: cada persona solo ve los datos de su propia petición.

const CABECERAS_IP = [
  'cf-connecting-ip',
  'true-client-ip',
  'x-real-ip',
  'forwarded',
  'x-envoy-external-address',
  'x-client-ip',
];

const router = express.Router();

router.get('/ip', (req, res) => {
  const xff = (req.headers['x-forwarded-for'] ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Así razona Express con trust proxy = N: parte de la IP de la conexión (el último
  // salto) y se fía de N saltos hacia atrás en X-Forwarded-For.
  // Saltos: [conexión, último de XFF, penúltimo de XFF, …].
  const saltos = [req.socket.remoteAddress, ...[...xff].reverse()];
  const ipSegunConfianza = Object.fromEntries(
    [0, 1, 2, 3, 4].map((n) => [`trustProxy_${n}`, saltos[Math.min(n, saltos.length - 1)]])
  );

  const otras = Object.fromEntries(
    CABECERAS_IP.filter((c) => req.headers[c] !== undefined).map((c) => [c, req.headers[c]])
  );

  // no-store: que ningún proxy ni el navegador guarde esta respuesta.
  res.set('Cache-Control', 'no-store');
  res.json({
    xForwardedFor: xff.map((ip, i) => `${i + 1}: ${ip}`),
    entradasXff: xff.length,
    otrasCabeceras: otras,
    conexion: req.socket.remoteAddress,
    reqIpActual: req.ip,
    ipSegunConfianza,
  });
});

export default router;
