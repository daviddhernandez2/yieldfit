import mongoose from 'mongoose';

// Nombre de la base de datos de producción. Fuera de producción está prohibido
// conectarse a ella (ver DECISIONS.md, 0017).
const BASE_PRODUCCION = 'yieldfit';

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      throw new Error('MONGO_URI no está definida en las variables de entorno');
    }

    const conn = await mongoose.connect(uri);

    console.log(`MongoDB conectado: ${conn.connection.host}`);
    console.log(`Base de datos: ${conn.connection.name}`);

    // Segunda barrera tras el usuario de Atlas de desarrollo (que ya no tiene
    // permisos sobre producción). Esta no depende de Atlas: si el .env local
    // apuntara a producción con credenciales que sí tienen acceso, el servidor
    // se niega a arrancar en vez de escribir en datos reales.
    // Se comprueba después de conectar porque el nombre de la base solo se conoce
    // con certeza una vez que el driver ha interpretado la URI.
    if (process.env.NODE_ENV !== 'production' && conn.connection.name === BASE_PRODUCCION) {
      await mongoose.disconnect();
      console.error(
        `Bloqueado: NODE_ENV es "${process.env.NODE_ENV}" pero la base es "${BASE_PRODUCCION}" ` +
          '(producción). En local usa la base de desarrollo (ver server/.env.example).'
      );
      process.exit(1);
    }
  } catch (error) {
    console.error('Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};
