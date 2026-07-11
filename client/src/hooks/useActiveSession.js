import { useState, useEffect } from 'react';
import { readActiveSession } from '@/utils/activeSession.js';

// Hook global de sesión activa. Devuelve la sesión activa actual o null.
// Se sincroniza con localStorage tanto para cambios locales (evento
// personalizado 'yieldfit:active-session-changed') como para cambios
// entre pestañas (evento nativo 'storage').
export function useActiveSession() {
  const [session, setSession] = useState(() => readActiveSession());

  useEffect(() => {
    const actualizar = () => setSession(readActiveSession());

    window.addEventListener('yieldfit:active-session-changed', actualizar);
    window.addEventListener('storage', actualizar);

    return () => {
      window.removeEventListener('yieldfit:active-session-changed', actualizar);
      window.removeEventListener('storage', actualizar);
    };
  }, []);

  return session;
}
