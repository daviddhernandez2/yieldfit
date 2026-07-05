import express from 'express';
import cors from 'cors';
import { notFoundHandler, errorHandler } from './middlewares/errorHandlers.js';
import authRoutes from './routes/authRoutes.js';
import exerciseRoutes from './routes/exerciseRoutes.js';
import chartRoutes from './routes/chartRoutes.js';
import workoutRoutes from './routes/workoutRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';

const app = express();

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