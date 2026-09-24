import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
// defineConfig recibe una función (en vez de un objeto) para tener acceso a `mode`
// y poder leer las variables de entorno antes de arrancar o compilar.
export default defineConfig(({ mode }) => {
  // loadEnv lee los .env del proyecto y también process.env, que es donde Vercel
  // inyecta las variables configuradas en su dashboard.
  const env = loadEnv(mode, process.cwd())

  // VITE_API_URL se incrusta en el bundle al compilar. Si faltara, la app se
  // desplegaría apuntando a ninguna parte y solo lo notaríamos en producción.
  // Fallar aquí hace que el error salga en `npm run dev` o en el build de Vercel.
  if (!env.VITE_API_URL) {
    throw new Error(
      'VITE_API_URL no está definida. Crea client/.env a partir de client/.env.example ' +
        'o configúrala en las variables de entorno de Vercel.'
    )
  }

  return {
    plugins: [react()],
    resolve: {
      // Alias '@' -> src, para poder usar importaciones absolutas del tipo
      // '@/components/Button/Button.jsx' en vez de rutas relativas '../../'.
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
