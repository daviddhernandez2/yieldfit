import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { notFoundHandler, errorHandler } from './middlewares/errorHandlers.js';
import authRoutes from './routes/authRoutes.js';
import exerciseRoutes from './routes/exerciseRoutes.js';
import chartRoutes from './routes/chartRoutes.js';
import workoutRoutes from './routes/workoutRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';

const app = express();

// Helmet añade cabeceras HTTP de seguridad por defecto (X-Content-Type-Options,
// X-Frame-Options, Strict-Transport-Security, etc.) sin necesidad de configurarlas
// una a una manualmente.
app.use(helmet());

// Morgan registra cada petición HTTP (método, ruta, status, tiempo de respuesta).
// 'dev' es compacto y coloreado, pensado para desarrollo; en producción usamos
// 'combined' (formato Apache, más detallado) para facilitar la depuración en los
// logs del PaaS.
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS configurable por variable de entorno. Acepta una lista separada por comas
// en CLIENT_ORIGINS. En desarrollo se usa localhost; en producción, la URL de Vercel.
const clientOrigins = (process.env.CLIENT_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

app.use(
  cors({
    origin: clientOrigins,
    credentials: true,
  })
);
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Yield Fit API',
    status: 'running',
    version: '1.0.0'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/charts', chartRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/sessions', sessionRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;