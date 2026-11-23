# CLAUDE.md — Yield Fit

Instrucciones para Claude Code en este repositorio. Se leen al inicio de cada sesión.
Mantener este archivo corto: si algo es documentación extensa, va en `/docs`, no aquí.

## Qué es el proyecto

App MERN de seguimiento de gimnasio con metáfora de inversión: cada ejercicio es un
activo, cada sesión una operación, y el progreso se lee como rendimiento de cartera
(% en verde/rojo) a partir del 1RM estimado con la fórmula de Epley.

- Repo (público): https://github.com/daviddhernandez2/yieldfit — rama `main`.
- Producción: https://yieldfit.app — frontend en Vercel, backend en Render (Frankfurt), MongoDB Atlas M0.
- Proyecto personal post-curso. El dueño (David) lo desarrolla para aprender y tener un producto sólido.
  **El objetivo principal es que David entienda y pueda explicar todo el código.**

## Protocolo de trabajo (obligatorio)

1. **Un bloque cada vez.** El roadmap está dividido en bloques (ver abajo). No empieces
   el siguiente bloque ni adelantes trabajo de otro sin que David confirme que el actual
   está terminado y entendido.
2. **Explicación antes que código.** Antes de escribir código para algo no trivial:
   - explica el "por qué" del enfoque,
   - enumera las alternativas descartadas y por qué,
   - lista los archivos que vas a tocar,
   - espera confirmación.
3. **Pasos pequeños.** Dentro de un bloque, avanza en pasos que se puedan revisar de uno
   en uno (p. ej. modelo → controlador → ruta → API cliente → UI). Tras cada paso, para.
4. **Comentarios para David, no para un evaluador.** Explican el razonamiento y las
   decisiones, no parafrasean la línea. Español.
5. **Deuda de comprensión.** Si ves código que David probablemente no sabría explicar,
   o que es frágil/confuso, dilo explícitamente aunque no forme parte de la tarea.
6. **Diagramas.** Para cambios con cierta complejidad (flujo de auth, modelo de datos,
   flujo de una feature, arquitectura de componentes) genera un diagrama mermaid en el `.md`
   correspondiente de `/docs` (GitHub lo renderiza de forma nativa).
7. **Cierre de bloque.** Al terminar un bloque, propone:
   - la entrada correspondiente en `DECISIONS.md`,
   - la actualización de la página correspondiente de `/docs`,
   - el mensaje de commit.
8. **Git con confirmación.** Al cerrar cada paso confirmado, prepara los comandos completos
   (`pwd`, `git add` con rutas explícitas —nunca `git add .`—, `git commit -m "..."` con el
   formato de la sección Git, `git push`) y enséñaselos a David. Ejecútalos solo cuando él
   los haya verificado y confirmado. **Nunca** ejecutes un comando de git que modifique el
   repo o el remoto sin su confirmación explícita para ese comando concreto.
   Nunca ejecutar git dentro de otros comandos, scripts, heredocs o subprocesos (Python,
   Node, etc.). Los mensajes que imprima un comando deben describir lo que hace de verdad.
   Un hook (`.claude/hooks/confirmar-git.mjs`) pide confirmación como segunda capa; no
   sustituye a esta regla.
9. **Nunca** leas, muestres ni edites archivos `.env`. Usa los `.env.example`.
10. Sé directo. Si una petición es una mala decisión técnica, dilo y explica por qué.
11. **El repo es público.** `/docs`, `DECISIONS.md` y los README nunca contienen secretos,
    URLs de conexión (p. ej. cadenas de MongoDB) ni datos de usuarios.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19, Vite 8, react-router-dom 7, axios, Recharts, CSS Modules, Geist (fontsource), dnd-kit (arrastrar) |
| Efectos | three.js + @react-three/fiber + postprocessing (Dither, solo Welcome); ogl (DarkVeil, fondo global en `Layout`) |
| Backend | Node 20, Express 5 (ESM), Mongoose 9, bcrypt, jsonwebtoken, helmet, cors, morgan, express-rate-limit |
| Lint | oxlint (cliente) |
| Tests | No hay todavía |

Cualquier librería nueva o cambio de stack es una decisión consciente: justifícala
(qué resuelve, alternativas, coste en bundle/mantenimiento) antes de instalar nada.

## Comandos

No hay `package.json` en la raíz; cada parte se gestiona por separado.

```bash
# Backend (desde /server) — requiere server/.env (ver .env.example), base yieldfit-dev
npm run dev      # nodemon, http://localhost:3000
npm start
npm run seed     # BORRA yieldfit-dev y la rellena con datos de prueba (--anios N)
npm run backup   # backup de producción (ver docs/operaciones.md)
npm run backup:restore-test
npm run diagnostico:borrados   # solo lectura en producción (usuario de backup); -- --desarrollo para yieldfit-dev
npm run reparar:borrados       # ESCRIBE en producción con usuario temporal; simula sin -- --aplicar (ver docs/operaciones.md)
npm run migrar:1rm             # ESCRIBE en producción: rellena mejor1RM (bloque 4); mismo procedimiento

# Frontend (desde /client) — requiere client/.env con VITE_API_URL
npm run dev      # http://localhost:5173
npm run build
npm run lint     # oxlint
```

## Estructura

```
client/src/
  api/          # una capa por recurso (auth, exercises, workouts, sessions) sobre client.js (axios)
  components/   # componentes reutilizables: Carpeta/Componente.jsx + Componente.module.css
  pages/        # una carpeta por vista; todas cargadas con lazy() en App.jsx
  context/      # AuthContext
  hooks/        # useAuth, useActiveSession, useStartSession, useInView
  utils/        # activeSession.js (localStorage), wakingUp.js (arranque en frío), borradoEjercicio.js
  styles/       # variables.css — tokens de diseño
server/
  models/       # User, Exercise, Workout, Session, Chart
  controllers/  # lógica por recurso (list/getOne/create/update/remove)
  routes/       # un router por recurso; requireAuth aplicado a nivel router
  middlewares/  # requireAuth, notFoundHandler, errorHandler
  data/         # exercisePresets.js — ejercicios clonados a cada usuario al registrarse
  utils/        # jwt.js, presets.js (clonado de presets), unaRM.js (Epley), progreso.js (+ .test.js)
  scripts/      # seed.js (datos de desarrollo), backup.sh, restore-test.sh, diagnostico-borrados.js y reparar-borrados.js;
                # lib/ (credenciales.sh oculta la URI; recuentos.sh lee los logs;
                # conexion.js: conexión y filtro de credenciales de los scripts Node)
```

Import alias en cliente: `@` → `client/src`.

## Modelo de datos (resumen)

- **User**: credenciales (bcrypt en `pre('save')`), datos de perfil. `toJSON` elimina `password`.
- **Exercise**: por usuario. `tipo` y `grupoMuscular` son enums; `tracking` (`1RM` |
  `tiempo_distancia`) se deriva en `pre('save')`. Borrarlo lo quita de rutinas y grupos,
  pero las sesiones lo conservan y el progreso lo ignora (0020; 409 si es el único de una rutina).
- **Workout**: rutina (plantilla) con ejercicios embebidos (`numSeries`, `descansoSegundos`, `orden`).
- **Session**: entrenamiento realizado. Ejercicios embebidos con **snapshots** (`nombreSnapshot`,
  `trackingSnapshot`) para que el historial sea inmutable, y `mejor1RM` calculado al guardar.
  Índice `{ userId: 1, fecha: -1 }`. El progreso lo calcula `GET /api/progress` (0026) y el
  historial se pagina por cursor (0027).
- **Chart**: grupo de progreso del usuario (`nombre`, `exerciseIds`); en la app se llama "grupo".
  Su progreso lo calcula `GET /api/progress?grupo=<id>` con el mismo cálculo que "Todos" (0034).

Todas las queries filtran por `userId: req.user._id`; los controladores verifican
ownership de los ids referenciados. Mantener siempre ese patrón.

## Convenciones

- Variables y funciones: `camelCase`. Componentes React: `PascalCase`. Env vars: `UPPER_SNAKE_CASE`.
- Archivos: componentes y páginas en `PascalCase` (`Button/Button.jsx`); resto de módulos
  JS en `camelCase` (`authController.js`, `activeSession.js`). Seguir lo existente.
- **Idioma del dominio en español** (`nombre`, `peso`, `reps`, `grupoMuscular`, `fecha`,
  funciones como `calcularUnaRM`). Verbos CRUD de controladores en inglés (`list`, `create`...).
  No mezclar idiomas dentro de un mismo concepto.
- Respuestas de la API: `{ recurso }` / `{ recursos }` en éxito; `{ error, message }` en error.
- Errores del backend: `next(error)` hacia `errorHandler`; `CastError` de ids se responde como 404.
- Código de terceros copiado (hoy `Dither` y `DarkVeil`, de React Bits): cabecera `/*! ... */`
  con autor, licencia y lista de cambios, y entrada en `THIRD_PARTY_NOTICES.md`. Al modificarlo,
  actualizar la lista de cambios de la cabecera.

## Git

- Un commit por paso confirmado. No acumular cambios de varios pasos en un commit.
- **Push siempre**, al cerrar cada paso confirmado, sea un cambio menor o no. No se dejan commits
  sin subir.
- Formato de mensaje (Conventional Commits, deducido del historial):

  ```
  tipo(ámbito): descripción
  ```

  - Tipos: `feat` | `fix` | `refactor` | `perf` | `style` | `docs` | `chore`.
    `style` = solo formato de código; los cambios de CSS son `feat` o `fix`.
  - Ámbito opcional, en kebab-case: recurso o zona (`client`, `server`, `sessions`,
    `active-session`, `docs`…).
  - Descripción en español, 3ª persona del presente (`añade`, `corrige`, `elimina`),
    en minúscula, sin punto final, ≤72 caracteres en total.
  - Un cambio lógico por commit: si el mensaje necesita "y", son dos commits.
  - Cuerpo opcional, separado por una línea en blanco, para explicar el porqué.
  - Sin líneas de autoría (`Co-Authored-By`) ni firmas de herramientas.

## Diseño

Dark mode. Verde `#3EF87E` (ganancia) / rojo `#FF3000` (pérdida). Tipografía Geist.
Colores y espaciados siempre desde `styles/variables.css`, nunca valores sueltos.
Fuente de verdad visual: Figma, fileKey `FM0tXObXUAJsRipf0D0gXs` (arquitectura de variables).

## Criterios de escalabilidad

Aplicar en cada cambio y avisar cuando algo existente no los cumpla:

- **Estabilidad a largo plazo** (ver `DECISIONS.md`): la app registra datos durante años y debe
  funcionar igual con 5 años de historial que con 5 semanas.
- Las consultas que crecen con el historial deben estar indexadas y, si devuelven listas, limitadas o paginadas.
- Las fuentes de verdad no se duplican: si un enum existe en el backend, el frontend no lo reescribe a mano.
- Lógica de negocio fuera de los componentes (en `utils/`, hooks o backend), UI solo presenta.
- Los archivos binarios (imágenes) nunca van a MongoDB: almacenamiento externo + URL en el documento.
- Nada que dependa de que el cliente sea un navegador de escritorio: la app acabará dentro de Capacitor (iOS).

## Deuda técnica conocida

No arreglar sin pedirlo, pero tenerla en cuenta y avisar si un bloque la toca:

- `window.__yieldfitReplayIntro` se asigna durante el render de `App.jsx` (efecto secundario en render).
- JWT de 7 días en `localStorage` (`yieldfit_token`), sin refresh token (el límite de intentos ya
  está, 11.1).
  Bloque 11 (en iPhone, almacenamiento seguro nativo en el bloque 12).
- **Datos huérfanos de usuarios inexistentes:** en producción hay ejercicios de 11 usuarios
  distintos pero solo 7 usuarios (diagnóstico de cardio, 2026-11-23). Parece que se borraron 4
  usuarios a mano sin borrar sus datos: ejercicios y quizá rutinas, sesiones o grupos. Pendiente:
  un diagnóstico de solo lectura que los cuente y una limpieza con el procedimiento de
  reparaciones (`docs/operaciones.md`). No existe forma de borrar un usuario desde la app.
- **Cardio en la sesión activa:** solo tiene campos de peso y reps, así que hoy no se puede
  registrar tiempo y distancia desde la app (los ejercicios `tiempo_distancia` se guardan con
  peso y reps a 0). El seed sí crea sesiones de cardio porque escribe directamente en la base.
  Mientras tanto, el cardio está bloqueado en la app con "Próximamente" (bloque 5b, 0030).
  **Sin bloque asignado en el roadmap.** Análisis para cuando se implemente (si se le da
  número, uno con letra como "6b": no renumerar, DECISIONS y el código citan los números):
  - **Dónde:** después del 6, que refactoriza `ActiveSession.jsx` (quizá a `useReducer`), y antes
    del 7, para que el CSV nazca con tiempo y distancia reales. El 8 y el 9 no dependen de él.
  - **Alcance:** la sesión activa conoce el tracking de cada ejercicio; filas de cardio con
    tiempo (mm:ss) y distancia (km); enviar `tiempoSegundos` y `distanciaMetros`; serie anterior
    y atajo de repetir también para cardio; Historial y detalle muestran tiempo y distancia;
    quitar el bloqueo (una línea en `OPCIONES_TIPO`). Las sesiones de cardio guardadas con
    peso y reps a 0 no se pueden recuperar.
- **Verdes translúcidos sueltos:** la app usa `rgba(62, 248, 126, α)` con 11 opacidades
  distintas en varios CSS. Desde el bloque 8 existen `--color-accent-soft` (0.08) y
  `--color-accent-medium` (0.25) en `variables.css`: sustituir los sueltos por tokens.
- `Dither.jsx`: `useFrame` incompleto (solo actualiza el tiempo; las props no reaccionan tras
  montar y `prevColor` no se usa). Bloque 12.

## Informe de corrección del curso (CEI)

Hallazgos del análisis estático ya verificados como **falsos positivos**. No "arreglarlos":
variables `VITE_` ausentes (existe `VITE_API_URL`), dotenv no usado (se carga con
`import 'dotenv/config'`), rutas de escritura sin auth (`requireAuth` va a nivel router),
falta de `runValidators` (las actualizaciones usan `save()`), `JSON.parse` sin try/catch en
`activeSession.js` (sí lo tiene), `useEffect` sin efecto en `ActiveSession.jsx` (escribe en localStorage).

## Roadmap por bloques

Estado: marcar `[x]` solo cuando David confirme el cierre.

- [x] **0 — Fundaciones**: este CLAUDE.md, `DECISIONS.md`, documentación en Markdown en `/docs`
      (leída en GitHub, sin dependencias ni despliegue; índice en `docs/README.md`).
- [x] **1 — Saneamiento**: resolver las consecuencias de la cascada `$pull` al borrar
      ejercicios (si cambia la decisión, entrada nueva en `DECISIONS.md`), eliminar
      `PUT /api/sessions/:id` mientras no se use o corregirlo para que conserve los snapshots, quitar fallbacks de URL en env vars, cierre ordenado del
      servidor con SIGTERM (Render lo envía en cada deploy), separar la base de datos de
      desarrollo de la de producción (ver `DECISIONS.md`), backups de producción (Atlas M0 no
      los incluye), marcar Dither y DarkVeil como
      código de terceros (React Bits) con atribución y licencia, limpiar comentarios
      obsoletos del curso, completar README raíz y sustituir el de `client/`, resolver la licencia (el README enlaza
      un `LICENSE` MIT inexistente y `server/package.json` declara ISC).
- [x] **2 — Máquina de discos**: nuevo valor en los tipos de ejercicio.
- [x] **3 — Loader de arranque (cold start de Render)**: arquitectura ya acordada:
      interceptores en `api/client.js` que detectan respuestas lentas (>4 s), módulo
      pub-sub `utils/wakingUp.js`, hook `useServerWakingUp`, cambios mínimos en
      `PrivateRoute.jsx`, `Login.jsx` y `Register.jsx`. Incluye sustituir el
      `window.location` del interceptor 401 por navegación de React Router.
- [x] **4 — Historial escalable**: cálculo del progreso en el backend, 1RM precalculado al
      guardar la sesión (con migración de las sesiones existentes), `GET /api/sessions` paginado.
      Requiere del bloque 1 la base de desarrollo separada (la migración no se prueba en
      producción) y un backup completo de producción justo antes de migrar.
      **Requisito:** el endpoint de progreso acepta un rango (desde/hasta) desde el principio,
      para que el selector de rango del bloque 9 no obligue a rehacerlo.
- [x] **5 — Serie anterior**: mostrar en cada serie de la sesión activa lo hecho en la sesión anterior.
- [x] **5b — Cardio bloqueado**: el tipo Cardio se marca como no disponible en las opciones del
      servidor y la app lo muestra como "Próximamente" en todos los sitios donde se elige o se
      registra. Desbloquearlo es quitar `disponible: false` en `OPCIONES_TIPO`.
- [x] **6 — Reemplazar ejercicio en sesión activa**: cambiar un ejercicio por otro sin salir de la
      sesión. Valorar antes pasar el estado de `ActiveSession.jsx` a `useReducer`.
- [ ] **7 — Exportar CSV** · **aplazado** (2026-11-23, decisión de David; el botón del Historial
      sigue con "Próximamente"): historial exportable, generado en el backend. Propuesta:
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
        **Para el bloque 12:** en Capacitor esa descarga no funciona igual; habrá que usar el
        menú de compartir.
- [x] **8 — Calendario de días entrenados**: endpoint que devuelva solo fechas por rango
      (sin traer sesiones completas).
- [x] **9 — Grupos de progreso**: botón "Nuevo grupo" en el Dashboard usando el modelo Chart;
      misma lógica de cálculo que el grupo "Todos", aplicada a los ejercicios seleccionados.
      Además, en cada grupo (incluido "Todos"):
      - selector de rango: 1 semana, 1 mes, 1 año, 5 años, 10 años y total. El % se mide desde
        el primer punto del rango elegido, como en las apps de bolsa;
      - desplegable para ocultar la lista de ejercicios y dejar solo el gráfico; cada grupo
        recuerda si está plegado.
- [x] **9b — Mejoras de uso**: crear un ejercicio desde el buscador, grupo y tipo bajo el nombre
      ("Pecho · Máquinas"), descanso y series con selector por pasos (1:30), arrastrar para
      reordenar (rutina, sesión activa y grupos del Dashboard) y animaciones de carga
      (esqueletos y ticker de servidor dormido).
- [ ] **10 — Icono de ejercicio**: imagen por ejercicio con almacenamiento externo.
- [ ] **11 — Auth robusta**: rate limiting en login y registro (prioritario, **hecho en el 11.1**),
      access token corto + refresh token (11.2 y 11.3, después del bloque 9b).
- [ ] **12 — App iPhone**: Capacitor, notificaciones locales (fin de descanso; aviso de
      entrenamiento activo sin actividad), almacenamiento seguro nativo del token,
      sincronización híbrida de la sesión activa y revisión de DarkVeil (batería) y
      del `useFrame` incompleto de Dither.
