# Roadmap

[← Índice](README.md)

**El estado de cada bloque y de sus pasos está en el tablero privado de GitHub Projects de David:**
https://github.com/users/daviddhernandez2/projects/1 (fuente única del estado). Aquí, solo el
orden de trabajo y qué es cada bloque; el porqué de cada decisión, en [DECISIONS.md](../DECISIONS.md)
y en las páginas de [bloques](README.md#bloques-del-roadmap).

## Orden de trabajo

Decisión de David (2026-11-26). Los bloques llevan número con letra, junto al bloque del que nacen,
para no renumerar (DECISIONS y el código citan los números):

1. **7b — Importar desde Strong** ([página](bloques/7b-importar-strong.md)).
2. **1b — Backups automáticos fuera del portátil** (revisión prevista en la 0018).
3. **12a — Prueba de viabilidad de la app móvil** con React Native y Expo
   ([página](bloques/12a-app-movil.md), [0058](../DECISIONS.md)).
4. **12 — App móvil** (iOS y Android).
5. **6b — Cardio** en la sesión activa (análisis en la deuda técnica, abajo).
6. **4c — Editar sesiones.**

Sin fecha: **7 — Exportar CSV** (aplazado) y **10 — Icono de ejercicio**.

## Bloques

- **1c — Dependencias del cliente y datos huérfanos** (0050): `npm audit fix` en el cliente (sin
   `--force`); diagnóstico de solo lectura de los datos de usuarios inexistentes y su limpieza con
   el procedimiento de reparaciones.
- **4b — Récords personales (PR)** (0051): icono de PR en Historial (fila y ejercicio), detalle de la
   sesión, calendario (móvil y escritorio) y aviso al terminar el entreno. PR = superar el mejor
   1RM estimado anterior del ejercicio; la primera vez no cuenta; sin cardio. Cálculo en el
   servidor sin traer el historial entero; el widget "Nuevos récords" del 9d usa el mismo.
- **11c — Registro en iOS** (0053): campos de fecha que se salen
   por la derecha en iOS (en `Input`, para toda la app), pista visible en la fecha vacía,
   placeholders que no parezcan valores y revisión de la pantalla de registro en iOS (teclado
   numérico, fuente mínima de 16 px, autocompletado).
- **9d — Dashboard personalizable** (0052, 0054): bento con widgets y
   grupos al mismo nivel; modo "Editar dashboard" (mover, añadir desde un catálogo, quitar, cambiar
   entre tamaños fijos); "Todos" pasa a ser un grupo normal; retícula estricta.
- **11d — Feedback de la beta** (0055): hoja de reportar por encima de todo,
   aviso de servidor dormido en el móvil, barra del descanso en el iPhone, cronómetro con horas,
   añadir ejercicios a una sesión en curso y notas de la sesión con "la última vez".
- **5c — Esfuerzo por serie (RPE/RIR)** (0056): opcional, preferencia en
   Perfil (no mostrar / RPE / RIR), pastilla bajo cada serie en la sesión activa, serie anterior y
   detalle. Se guarda solo el RPE (1–10). Fase 2, sin hacer: ajustar el 1RM con el RPE.
- **0 — Fundaciones**: este CLAUDE.md, `DECISIONS.md`, documentación en Markdown en `/docs`
      (leída en GitHub, sin dependencias ni despliegue; índice en `docs/README.md`).
- **1 — Saneamiento**: resolver las consecuencias de la cascada `$pull` al borrar
      ejercicios (si cambia la decisión, entrada nueva en `DECISIONS.md`), eliminar
      `PUT /api/sessions/:id` mientras no se use o corregirlo para que conserve los snapshots, quitar fallbacks de URL en env vars, cierre ordenado del
      servidor con SIGTERM (Render lo envía en cada deploy), separar la base de datos de
      desarrollo de la de producción (ver `DECISIONS.md`), backups de producción (Atlas M0 no
      los incluye), marcar Dither y DarkVeil como
      código de terceros (React Bits) con atribución y licencia, limpiar comentarios
      obsoletos del curso, completar README raíz y sustituir el de `client/`, resolver la licencia (el README enlaza
      un `LICENSE` MIT inexistente y `server/package.json` declara ISC).
- **2 — Máquina de discos**: nuevo valor en los tipos de ejercicio.
- **3 — Loader de arranque (cold start de Render)**: arquitectura ya acordada:
      interceptores en `api/client.js` que detectan respuestas lentas (>4 s), módulo
      pub-sub `utils/wakingUp.js`, hook `useServerWakingUp`, cambios mínimos en
      `PrivateRoute.jsx`, `Login.jsx` y `Register.jsx`. Incluye sustituir el
      `window.location` del interceptor 401 por navegación de React Router.
- **4 — Historial escalable**: cálculo del progreso en el backend, 1RM precalculado al
      guardar la sesión (con migración de las sesiones existentes), `GET /api/sessions` paginado.
      Requiere del bloque 1 la base de desarrollo separada (la migración no se prueba en
      producción) y un backup completo de producción justo antes de migrar.
      **Requisito:** el endpoint de progreso acepta un rango (desde/hasta) desde el principio,
      para que el selector de rango del bloque 9 no obligue a rehacerlo.
- **5 — Serie anterior**: mostrar en cada serie de la sesión activa lo hecho en la sesión anterior.
- **5b — Cardio bloqueado**: el tipo Cardio se marca como no disponible en las opciones del
      servidor y la app lo muestra como "Próximamente" en todos los sitios donde se elige o se
      registra. Desbloquearlo es quitar `disponible: false` en `OPCIONES_TIPO`.
- **6 — Reemplazar ejercicio en sesión activa**: cambiar un ejercicio por otro sin salir de la
      sesión. Valorar antes pasar el estado de `ActiveSession.jsx` a `useReducer`.
- **7 — Exportar CSV** (aplazado el 2026-11-23 por David; el botón del Historial sigue
      con "Próximamente"): historial exportable, generado en el backend. Propuesta:
      - `GET /api/sessions/export` que escribe el CSV **por partes con un cursor** de MongoDB: la
        memoria del servidor no crece con el historial (0015).
      - **Una fila por serie**: `fecha`, `hora`, `sesion`, `ejercicio`, `serie`, `peso_kg`, `reps`,
        `1rm_estimado_kg`, `tiempo_s`, `distancia_m`, `rpe`, `duracion_sesion_min`. Ejercicios
        borrados con su nombre del snapshot.
      - **Formato Excel en español**: separador `;`, decimales con coma y BOM UTF-8. Opción
        futura: formato internacional (`,` y punto decimal) para programas.
      - **Zona horaria del cliente** (el cliente la envía, p. ej. `Europe/Madrid`): las fechas
        se guardan en UTC y el servidor está en Frankfurt.
      - **Protección contra CSV injection** (OWASP): comilla delante de los valores que empiezan
        por `=`, `+`, `-` o `@`; escape estándar de comillas, separadores y saltos de línea.
        Formato en funciones puras con pruebas.
      - Cliente: descarga con axios (el token va en cabecera, un `<a href>` no lo envía).
        **En la app móvil (bloque 12):** la descarga no funciona igual; habrá que usar el menú de
        compartir del sistema.
- **8 — Calendario de días entrenados**: endpoint que devuelva solo fechas por rango
      (sin traer sesiones completas).
- **8b — Calendario en escritorio** (0049): con espacio (el calendario ≥ 860 px), dos
      columnas: el mes con celdas altas y píldoras de sesión, y un panel del día seleccionado
      (sesiones con hora, duración y ejercicios; el mes comparado con el anterior). Cabecera con
      el mes en grande, semana y ‹ Hoy ›. Sin mapa de actividad (ya está la vista Año). En el
      móvil, como antes, con hora y duración en la lista del día. El endpoint de días añade
      `fecha`, `duracionSegundos` y `numEjercicios` (sin series).
- **9 — Grupos de progreso**: botón "Nuevo grupo" en el Dashboard usando el modelo Chart;
      misma lógica de cálculo que el grupo "Todos", aplicada a los ejercicios seleccionados.
      Además, en cada grupo (incluido "Todos"):
      - selector de rango: 1 semana, 1 mes, 1 año, 5 años, 10 años y total. El % se mide desde
        el primer punto del rango elegido, como en las apps de bolsa;
      - desplegable para ocultar la lista de ejercicios y dejar solo el gráfico; cada grupo
        recuerda si está plegado.
- **9b — Mejoras de uso**: crear un ejercicio desde el buscador, grupo y tipo bajo el nombre
      ("Pecho · Máquinas"), descanso y series con selector por pasos (1:30), arrastrar para
      reordenar (rutina, sesión activa y grupos del Dashboard) y animaciones de carga
      (esqueletos y ticker de servidor dormido).
- **9c — Design system Premium** (0047, 0048): el tema Premium del design system del artefacto
      como tema único: tokens nuevos en `variables.css`, Geist Mono, Button (tamaños, `ghost`,
      `primary` en `color-action`, `danger` tonal), foco suave en campos, iconos de trazo 1.5,
      componente `Metrica` (fila "Progreso" y "Sesiones" en el Dashboard), transiciones por
      propiedad, y rgba sueltos y colores de Recharts pasados a tokens.
- **10 — Icono de ejercicio**: imagen por ejercicio con almacenamiento externo.
- **11 — Auth robusta**: rate limiting en login y registro (11.1), access token corto +
      refresh token (11.2 y 11.3) e IP real detrás de los proxies de Render (11.4, 0038).
- **11b — Beta cerrada** (0040–0046): lo necesario para pasar la app a conocidos. Decisiones de David:
      - **11b.1 Rol de admin:** campo `rol` (`usuario` | `admin`) que ninguna ruta de la API acepta;
        se asigna con `npm run admin` (en producción, con el procedimiento de reparaciones).
        `requireAdmin` va tras `requireAuth`, así que el rol se comprueba en cada petición.
        Campo `ultimoAcceso`, actualizado al entrar y al renovar, como mucho una vez por hora.
      - **11b.2 Reportar bugs:** modelo `BugReport`, `POST /api/reports` (5 por hora por usuario).
        Botón en todas las pantallas privadas: en el móvil, **círculo abajo a la derecha por encima
        de todas las barras** (opción C; su altura se define en un solo sitio, documentado); en
        escritorio, píldora "Reportar" abajo a la derecha. Hoja con "¿Qué ha fallado?" (obligatorio),
        "¿Qué estabas haciendo?" (opcional) y, a la vista, lo que se envía solo (ruta, navegador y
        sistema, tamaño de pantalla). Solo bugs; las ideas, más adelante.
      - **11b.3 Página `/developer`** (solo admin): reportes con filtros (estado, usuario, fechas),
        estado pendiente/resuelto y paginación por cursor; usuarios con nombre, email, registro,
        último acceso y recuentos (sesiones, ejercicios, rutinas), **sin** nacimiento, peso ni
        altura (el endpoint no los lee); hueco "Próximamente" para la documentación (en el futuro,
        leída de GitHub, sin copias).
      - **11b.4 Borrar la cuenta:** `DELETE /api/auth/me` pidiendo la contraseña; en una
        transacción, el usuario y todos sus datos, tokens **y sus reportes**.
      - **11b.5 Contraseña:** "Cambiar contraseña" en Perfil y script de restablecimiento (plan B).
        **Sin códigos de invitación.**
      - **11b.5b Recuperar por email** (cambio de plan de David: ya en la beta, no después):
        Resend desde `no-responder@mail.yieldfit.app` (región Irlanda); enlace de un solo uso, 30
        minutos, guardado como huella; misma respuesta exista o no el email; límites por email y
        por IP; al restablecer se cierran todas las sesiones y se va al login; aviso "Tu
        contraseña ha cambiado" al restablecerla y al cambiarla en Perfil.
      - **11b.6 Nota de privacidad:** página pública `/privacidad`, enlazada desde el registro y
        Perfil, **sin email de contacto**. Informativa, no un texto legal. Menciona Resend (cuenta
        en EE. UU., envío desde Irlanda, historial de envíos de 30 días).
      - **11b.7 Cambios sin guardar:** data router y aviso al salir de rutina, ejercicio, grupo y
        registro; sin borrador automático. Botones que se apilan si no caben (`GrupoBotones`).
- **12a — Prueba de viabilidad de la app móvil** ([página](bloques/12a-app-movil.md)): React
      Native con Expo; nueve preguntas que se plantean antes de escribir código.
- **12 — App móvil** (iOS y Android, Expo; [0058](../DECISIONS.md)): iniciar sesión, empezar una
      rutina, sesión activa con el descanso animado con el móvil bloqueado (Live Activity en iOS,
      notificación fija con cuenta atrás en Android) y un widget en cada sistema; refresh token en
      almacenamiento seguro (Keychain y Keystore). El cardio, bloqueado como en la web hasta el 6b,
      con la sesión activa pensada para añadirlo. El resto, en la web de momento.
- **4c — Editar sesiones.**
- **1b — Backups automáticos fuera del portátil** (revisión prevista en la 0018; ver la deuda técnica).
- **6b — Cardio en la sesión activa** (análisis en la deuda técnica).

## Deuda técnica

No se arregla sin pedirlo, pero se tiene en cuenta y se avisa si un bloque la toca:

- `window.__yieldfitReplayIntro` se asigna durante el render de `App.jsx` (efecto secundario en render).
- **Cardio en la sesión activa:** solo tiene campos de peso y reps, así que hoy no se puede
  registrar tiempo y distancia desde la app (los ejercicios `tiempo_distancia` se guardan con
  peso y reps a 0). El seed sí crea sesiones de cardio porque escribe directamente en la base.
  Mientras tanto, el cardio está bloqueado en la app con "Próximamente" (bloque 5b, 0030).
  **Bloque 6b**, después del 12 (la app móvil nace preparada para añadirlo). La importación de
  Strong (7b) ya guarda el cardio con tiempo y distancia. Análisis para cuando se implemente:
  - **Dónde:** después del 12 y antes del 7 (exportar CSV), para que el CSV nazca con tiempo y
    distancia reales.
  - **Alcance:** la sesión activa conoce el tracking de cada ejercicio; filas de cardio con
    tiempo (mm:ss) y distancia (km); enviar `tiempoSegundos` y `distanciaMetros`; serie anterior
    y atajo de repetir también para cardio; Historial y detalle muestran tiempo y distancia;
    quitar el bloqueo (una línea en `OPCIONES_TIPO`). Las sesiones de cardio guardadas con
    peso y reps a 0 no se pueden recuperar.
- **Colores translúcidos sin token** (revisado en el 9c: TabBar, ConfirmDialog, bordes, banners
  de error y el verde al 8 % ya usan tokens). Quedan los que no coinciden con ningún token en valor
  y uso: verdes al 4, 5, 6, 12, 15, 20, 30, 35 y 50 % (estados de la sesión activa, MiniSession,
  TabBar, ExercisePicker, Workouts, Profile, History), fondos negros al 30 y 50 % (campos internos,
  velo del modal de rutina) y el cristal de Sidebar y MiniSession. Proponer tokens (p. ej. la
  escala `green-*` o un `--color-accent-strong`) antes de cambiarlos: alterarían el aspecto. La
  portada (`pages/Welcome`) queda fuera a propósito: mantiene su aspecto original.
- **Backups solo en el portátil:** la revisión prevista en la 0018 ("backups automáticos fuera
  del portátil cuando haya usuarios reales además de David") ya aplica: la beta empezó el
  2026-11-24 y ya hay usuarios registrados además de David. Si el portátil se pierde o se
  estropea, no hay copia. Desde la 0039 se conservan los 3 últimos.
- **Vulnerabilidades de dependencias** (`npm audit`): servidor y cliente actualizados con
  `npm audit fix` el 2026-11-24 (bloques 9c y 1c): 0 en producción y 0 en el cliente. Queda
  `nodemon` (2 moderadas, solo desarrollo), cuyo arreglo es un cambio incompatible
  (`npm audit fix --force`).
- `Dither.jsx`: `useFrame` incompleto (solo actualiza el tiempo; las props no reaccionan tras
  montar y `prevColor` no se usa). Solo en la web (la portada); sin bloque asignado.
