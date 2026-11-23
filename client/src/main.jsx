import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/geist';
// Geist Mono (bloque 9c): cifras y datos técnicos (--font-mono). Cada alfabeto es un archivo
// aparte (unicode-range): el navegador solo descarga el que necesita (el latino, unos 31 KB) y
// solo cuando alguna pantalla usa la fuente.
import '@fontsource-variable/geist-mono';
import '@/index.css';
import App from '@/App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);