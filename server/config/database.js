import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      throw new Error('MONGO_URI no está definida en las variables de entorno');
    }

    const conn = await mongoose.connect(uri);

    console.log(`MongoDB conectado: ${conn.connection.host}`);
    console.log(`Base de datos: ${conn.connection.name}`);
  } catch (error) {
    console.error('Error conectando a MongoDB:', error.message);
    // Salir del proceso con código de error 1
    // Sin base de datos no tiene sentido arrancar el servidor
    process.exit(1);
  }
};