import express from 'express';
import cors from 'cors';
import { notFoundHandler, errorHandler } from './middlewares/errorHandlers.js';

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Rutas
app.get('/', (req, res) => {
  res.json({
    message: 'Yield Fit API',
    status: 'running',
    version: '1.0.0'
  });
});

// Manejo de errores (siempre al FINAL)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;