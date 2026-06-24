import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/database.js';

// Cargar los modelos para que se registren en Mongoose
import './models/User.js';
import './models/Exercise.js';
import './models/Chart.js';
import './models/Workout.js';
import './models/Session.js';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
    console.log(`Entorno: ${process.env.NODE_ENV}`);
  });
};

startServer();