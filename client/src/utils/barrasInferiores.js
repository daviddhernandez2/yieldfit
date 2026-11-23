// Qué barras fijas hay abajo en cada pantalla del móvil. Lo usan MiniSession (para saber si
// se muestra) y el botón de reportar (para saber a qué altura ponerse), y así la regla
// existe una sola vez: si cambia, los dos se enteran.

// La MiniSession se ve si hay sesión activa y no se está dentro de ella: en la sesión activa
// y en sus páginas (reemplazar ejercicio) la barra sobra.
export const hayMiniSession = (session, pathname) =>
  Boolean(session) && !pathname.startsWith('/sessions/active');

// Reemplazar ejercicio tiene su botón "Reemplazar" fijo abajo (sticky), a la misma altura
// que la MiniSession.
export const hayBotonReemplazar = (pathname) => pathname.startsWith('/sessions/active/replace/');
