import express from 'express';
import cors from 'cors';
import { notFoundHandler, errorHandler } from './middlewares/errorHandlers.js';
import authRoutes from './routes/authRoutes.js';
import exerciseRoutes from './routes/exerciseRoutes.js';

const app = express();

// Middlewares globales.
app.use(cors());
app.use(express.json());

// Ruta raíz: indicador de salud de la API.
app.get('/', (req, res) => {
  res.json({
    message: 'Yield Fit API',
    status: 'running',
    version: '1.0.0'
  });
});

// Rutas de la API agrupadas por recurso.
app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);

// Manejo de errores: siempre al final, después de todas las rutas.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;