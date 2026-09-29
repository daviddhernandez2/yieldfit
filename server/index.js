import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';
import { connectDB } from './config/database.js';

// Cargar los modelos para que se registren en Mongoose
import './models/User.js';
import './models/Exercise.js';
import './models/Chart.js';
import './models/Workout.js';
import './models/Session.js';

const PORT = process.env.PORT || 3000;

// Margen máximo para cerrar ordenadamente. Render espera un tiempo tras enviar
// SIGTERM antes de matar el proceso con SIGKILL; 10 s queda dentro de ese margen
// y basta de sobra para terminar peticiones de esta API.
const SHUTDOWN_TIMEOUT_MS = 10_000;

const startServer = async () => {
  await connectDB();

  // Guardamos la referencia al servidor HTTP: sin ella no podríamos pedirle
  // que deje de aceptar conexiones cuando llegue la señal de apagado.
  const server = app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
    console.log(`Entorno: ${process.env.NODE_ENV}`);
  });

  // Evita que una segunda señal (p. ej. pulsar Ctrl+C dos veces) arranque
  // otro cierre en paralelo mientras el primero sigue en marcha.
  let cerrando = false;

  // Cierre ordenado. Render envía SIGTERM en cada deploy; sin esto, Node moriría
  // al instante y cortaría peticiones a medias (como el POST que guarda una
  // sesión al terminar un entrenamiento).
  const cerrarOrdenadamente = (senal) => {
    if (cerrando) return;
    cerrando = true;
    console.log(`${senal} recibido: cerrando el servidor...`);

    // Red de seguridad: si algo se queda colgado, salimos igualmente.
    // unref() hace que este temporizador no mantenga vivo el proceso por sí solo.
    setTimeout(() => {
      console.error('Cierre forzado: se agotó el tiempo de espera');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS).unref();

    // close() deja de aceptar conexiones nuevas y ejecuta el callback cuando
    // han terminado todas las peticiones en curso.
    server.close(async () => {
      console.log('Servidor HTTP cerrado');
      await mongoose.connection.close();
      console.log('MongoDB desconectado');
      process.exit(0);
    });

    // Las conexiones keep-alive sin petición activa mantendrían close() esperando
    // hasta que el navegador las soltase. Las cerramos ya; las que están
    // atendiendo una petición siguen hasta terminarla.
    server.closeIdleConnections();
  };

  process.on('SIGTERM', () => cerrarOrdenadamente('SIGTERM')); // Render
  process.on('SIGINT', () => cerrarOrdenadamente('SIGINT')); // Ctrl+C en local
};

startServer();
