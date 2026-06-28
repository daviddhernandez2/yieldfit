import express from 'express';
import cors from 'cors';
import { notFoundHandler, errorHandler } from './middlewares/errorHandlers.js';
import authRoutes from './routes/authRoutes.js';
import exerciseRoutes from './routes/exerciseRoutes.js';
import chartRoutes from './routes/chartRoutes.js';

const app = express();

app.use(cors());
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

app.use(notFoundHandler);
app.use(errorHandler);

export default app;