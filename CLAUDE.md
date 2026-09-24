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
   flujo de una feature, arquitectura de componentes) genera un diagrama mermaid para
   `/docs`.
7. **Cierre de bloque.** Al terminar un bloque, propone:
   - la entrada correspondiente en `DECISIONS.md`,
   - la actualización de la página correspondiente de `/docs`,
   - el mensaje de commit.
8. **Git con confirmación.** Al cerrar cada paso confirmado, prepara los comandos completos
   (`pwd`, `git add` con rutas explícitas —nunca `git add .`—, `git commit -m "..."` con el
   formato de la sección Git, `git push`) y enséñaselos a David. Ejecútalos solo cuando él
   los haya verificado y confirmado. **Nunca** ejecutes un comando de git que modifique el
   repo o el remoto sin su confirmación explícita para ese comando concreto.
9. **Nunca** leas, muestres ni edites archivos `.env`. Usa los `.env.example`.
10. Sé directo. Si una petición es una mala decisión técnica, dilo y explica por qué.
11. **El repo es público.** `/docs`, `DECISIONS.md` y los README nunca contienen secretos,
    URLs de conexión (p. ej. cadenas de MongoDB) ni datos de usuarios.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19, Vite 8, react-router-dom 7, axios, Recharts, CSS Modules, Geist (fontsource) |
| Efectos | three.js + @react-three/fiber + postprocessing (Dither, solo Welcome); ogl (DarkVeil, fondo global en `Layout`) |
| Backend | Node 20, Express 5 (ESM), Mongoose 9, bcrypt, jsonwebtoken, helmet, cors, morgan |
| Lint | oxlint (cliente) |
| Tests | No hay todavía |

Cualquier librería nueva o cambio de stack es una decisión consciente: justifícala
(qué resuelve, alternativas, coste en bundle/mantenimiento) antes de instalar nada.

## Comandos

No hay `package.json` en la raíz; cada parte se gestiona por separado.

```bash
# Backend (desde /server) — requiere server/.env (ver .env.example)
npm run dev      # nodemon, http://localhost:3000
npm start

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
  utils/        # performance.js (cálculo de progreso), activeSession.js (localStorage)
  styles/       # variables.css — tokens de diseño
server/
  models/       # User, Exercise, Workout, Session, Chart
  controllers/  # lógica por recurso (list/getOne/create/update/remove)
  routes/       # un router por recurso; requireAuth aplicado a nivel router
  middlewares/  # requireAuth, notFoundHandler, errorHandler
  data/         # exercisePresets.js — ejercicios clonados a cada usuario al registrarse
  utils/        # jwt.js
```

Import alias en cliente: `@` → `client/src`.

## Modelo de datos (resumen)

- **User**: credenciales (bcrypt en `pre('save')`), datos de perfil. `toJSON` elimina `password`.
- **Exercise**: por usuario. `tipo` y `grupoMuscular` son enums; `tracking` (`1RM` |
  `tiempo_distancia`) se deriva en `pre('save')`.
- **Workout**: rutina (plantilla) con ejercicios embebidos (`numSeries`, `descansoSegundos`, `orden`).
- **Session**: entrenamiento realizado. Ejercicios embebidos con **snapshots** (`nombreSnapshot`,
  `trackingSnapshot`) para que el historial sea inmutable. Índice `{ userId: 1, fecha: -1 }`.
- **Chart**: grupo de ejercicios del usuario (`nombre`, `exerciseIds`). CRUD en backend hecho;
  **sin uso en el frontend todavía** (no existe `api/charts.js`).

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

## Git

- Un commit por paso confirmado, push al terminar cada paso. No acumular cambios de varios pasos.
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

- `GET /api/sessions` devuelve **todas** las sesiones sin paginar, y el progreso se calcula
  en el cliente (`utils/performance.js`) sobre esa lista completa. Bloque 4.
- `TIPOS` y `GRUPOS_MUSCULARES` están duplicados: enum en `server/models/Exercise.js` y
  lista a mano en `client/src/pages/ExerciseForm/ExerciseForm.jsx`.
- `window.__yieldfitReplayIntro` se asigna durante el render de `App.jsx` (efecto secundario en render).
- JWT de 7 días en `localStorage` (`yieldfit_token`), sin refresh token ni rate limiting en login.
  Bloque 11 (en iPhone, almacenamiento seguro nativo en el bloque 12).
- Cold start de Render (plan gratuito): se resuelve en el bloque 3.
- **Cascada `$pull` al borrar un Exercise** (decisión deliberada, ver `DECISIONS.md`):
  `exerciseController.remove` quita ese ejercicio de todas las sesiones del usuario.
  Consecuencias pendientes de resolver en el bloque 1: sesiones que pueden quedar con
  `ejercicios: []` (`updateMany` no pasa las validaciones de Mongoose), borrado irreversible
  del historial sin aviso al usuario, y Workouts y Charts con `exerciseIds` huérfanos
  (la cascada no los limpia).
- Fallbacks de URL en env vars: `VITE_API_URL || 'http://localhost...'` (acaba en el bundle) y
  `CLIENT_ORIGINS || 'http://localhost:5173'`. Si falta la variable, debe fallar con un error claro.
- El interceptor 401 de `api/client.js` usa `window.location.href` (recarga completa, rompe el
  flujo de React Router).
- `components/Dither/` y `components/DarkVeil/` son código de terceros copiado de React Bits
  (reactbits.dev, licencia MIT + Commons Clause) sin atribución ni aviso de copyright, que la
  licencia exige.
- Licencia incoherente: badge MIT sin archivo `LICENSE`; `server/package.json` dice ISC.
- READMEs: el raíz no explica instalación, arranque ni variables; `client/README.md` es la plantilla de Vite.
- Comentarios obsoletos del curso (p. ej. "lo haremos en la Semana 3" en `api/client.js`).
- README indica React Router v6; la dependencia instalada es v7.

## Informe de corrección del curso (CEI)

Hallazgos del análisis estático ya verificados como **falsos positivos**. No "arreglarlos":
variables `VITE_` ausentes (existe `VITE_API_URL`), dotenv no usado (se carga con
`import 'dotenv/config'`), rutas de escritura sin auth (`requireAuth` va a nivel router),
falta de `runValidators` (las actualizaciones usan `save()`), `JSON.parse` sin try/catch en
`activeSession.js` (sí lo tiene), `useEffect` sin efecto en `ActiveSession.jsx` (escribe en localStorage).

## Roadmap por bloques

Estado: marcar `[x]` solo cuando David confirme el cierre.

- [ ] **0 — Fundaciones**: este CLAUDE.md, `DECISIONS.md`, web de documentación en `/docs`
      (sitio aparte, desplegado en Vercel con protección de acceso).
- [ ] **1 — Saneamiento**: resolver las consecuencias de la cascada `$pull` al borrar
      ejercicios (si cambia la decisión, entrada nueva en `DECISIONS.md`), quitar fallbacks de URL en env vars, cierre ordenado del
      servidor con SIGTERM (Render lo envía en cada deploy), marcar Dither y DarkVeil como
      código de terceros (React Bits) con atribución y licencia, limpiar comentarios
      obsoletos del curso, completar README raíz y sustituir el de `client/`, resolver la licencia (el README enlaza
      un `LICENSE` MIT inexistente y `server/package.json` declara ISC).
- [ ] **2 — Máquina de discos**: nuevo valor en los tipos de ejercicio.
- [ ] **3 — Loader de arranque (cold start de Render)**: arquitectura ya acordada:
      interceptores en `api/client.js` que detectan respuestas lentas (>4 s), módulo
      pub-sub `utils/wakingUp.js`, hook `useServerWakingUp`, cambios mínimos en
      `PrivateRoute.jsx`, `Login.jsx` y `Register.jsx`. Incluye sustituir el
      `window.location` del interceptor 401 por navegación de React Router.
- [ ] **4 — Historial escalable**: cálculo del progreso en el backend, 1RM precalculado al
      guardar la sesión (con migración de las sesiones existentes), `GET /api/sessions` paginado.
- [ ] **5 — Serie anterior**: mostrar en cada serie de la sesión activa lo hecho en la sesión anterior.
- [ ] **6 — Reemplazar ejercicio en sesión activa**: cambiar un ejercicio por otro sin salir de la
      sesión. Valorar antes pasar el estado de `ActiveSession.jsx` a `useReducer`.
- [ ] **7 — Exportar CSV**: historial exportable, generado en el backend.
- [ ] **8 — Calendario de días entrenados**: endpoint que devuelva solo fechas por rango
      (sin traer sesiones completas).
- [ ] **9 — Grupos de progreso**: botón "Nuevo grupo" en el Dashboard usando el modelo Chart;
      misma lógica de cálculo que el grupo "Todos", aplicada a los ejercicios seleccionados.
- [ ] **10 — Icono de ejercicio**: imagen por ejercicio con almacenamiento externo.
- [ ] **11 — Auth robusta**: access token corto + refresh token.
- [ ] **12 — App iPhone**: Capacitor, notificaciones locales (fin de descanso; aviso de
      entrenamiento activo sin actividad), almacenamiento seguro nativo del token,
      sincronización híbrida de la sesión activa y revisión de DarkVeil (batería).
