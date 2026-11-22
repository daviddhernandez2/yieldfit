# Bloque 3 — Loader de arranque (cold start de Render)

[← Índice](../README.md)

Estado: cerrado (2026-11-22)

## Objetivo

Que la app no parezca rota cuando el servidor de Render está dormido (plan gratuito: se apaga
tras ~15 minutos sin uso y tarda 30-60 s en responder), y que un token caducado lleve a `/login`
sin recargar la página.

## Qué se ha hecho

| Paso | Qué | Commit |
|---|---|---|
| 3.1 | Un 401 con token cierra la sesión con un anuncio (`alCaducarSesion`) que escucha `AuthContext`; `PrivateRoute` redirige con React Router. Un 401 sin token (contraseña incorrecta) ya no se trata como sesión caducada | `e6d23c6` |
| 3.2 | Los interceptores cronometran cada petición; si alguna pasa de 4 s, `utils/wakingUp.js` anuncia "despertando" y `useServerWakingUp` lo lee. Retraso de prueba `RETRASO_PRUEBA_MS`, ignorado siempre en producción | `9371178` |
| 3.3 | Componente `ServerWakingUp`: en `PrivateRoute`, bajo los botones de Login y Register, y flotante en `Layout` | `1631df4` |
| 3.4 | Despertador: la portada llama a `GET /api/health` al abrirse | `cf4e64e` |
| — | Documentación: 0025, arquitectura y auth | `06eb792` |

Diagrama y detalle en [arquitectura.md](../arquitectura.md#arranque-en-frío-de-render); el
nuevo flujo del 401 en [auth.md](../auth.md#peticiones-protegidas).

## Decisiones del bloque

| # | Decisión |
|---|---|
| 0025 | Aviso de arranque en frío y 401 sin recarga |

## Qué cambió por el camino

- **401 sin `navigate`:** `AuthProvider` está fuera de `BrowserRouter`, así que el interceptor
  no podía navegar. En vez de reorganizar el enrutado, el interceptor anuncia y `PrivateRoute`,
  que ya redirigía sin sesión, hace la navegación.
- **Aviso flotante en `Layout`:** no estaba en el plan del roadmap. Volver a la app tras un rato
  con la pestaña abierta también choca con el servidor dormido, en cualquier pantalla.

## Cómo probarlo

`RETRASO_PRUEBA_MS=8000 npm run dev` (desde `server/`) y entrar, recargar o navegar: el aviso sale
a los 4 s. Sin la variable no sale nunca. Para el 401: cambiar `yieldfit_token` en Local Storage y
navegar; se llega a `/login` sin recargar.
