# CLAUDE.md — Yield Fit

Instrucciones para Claude Code en este repositorio. Se leen al inicio de cada sesión.
Mantener este archivo corto: si algo es documentación extensa, va en `/docs`, no aquí.

## Qué es el proyecto

App MERN de seguimiento de gimnasio con metáfora de inversión: cada ejercicio es un
activo, cada sesión una operación, y el progreso se lee como rendimiento de cartera
(% en verde/rojo) a partir del 1RM estimado con la fórmula de Epley.

- Repo (público): https://github.com/daviddhernandez2/yieldfit — rama `main`.
- Producción: https://yieldfit.app — frontend en Vercel; API en https://api.yieldfit.app (Render,
  Frankfurt; `yieldfit.onrender.com` sigue respondiendo); MongoDB Atlas M0.
- Proyecto personal post-curso. El dueño (David) lo desarrolla para aprender y tener un producto sólido.
  **El objetivo principal es que David entienda y pueda explicar todo el código.**

## Protocolo de trabajo (obligatorio)

1. **Un bloque cada vez.** El roadmap está dividido en bloques ([docs/roadmap.md](docs/roadmap.md)). No empieces
   el siguiente bloque ni adelantes trabajo de otro sin que David confirme que el actual
   está terminado y entendido.
2. **Explicación antes que código.** Antes de escribir código para algo no trivial:
   - explica el "por qué" del enfoque,
   - enumera las alternativas descartadas y por qué,
   - lista los archivos que vas a tocar,
   - espera confirmación.
3. **Pasos pequeños.** Dentro de un bloque, avanza en pasos que se puedan revisar de uno
   en uno (p. ej. modelo → controlador → ruta → API cliente → UI). Las paradas, en la regla 13.
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
12. **Preguntar antes de instalar fuera del repo.** Herramientas de prueba en el scratchpad,
    `npx … install`, navegadores (p. ej. Playwright y su WebKit) o paquetes globales: antes,
    decir qué paquete y versión, dónde se instala, cuánto ocupa y cómo se desinstala, y esperar
    confirmación. Las dependencias del proyecto siguen su regla (ver Stack).
13. **Paradas e informes** (para gastar menos, 2026-11-26). Se para solo en: el plan del bloque,
    el diseño en el artefacto, las decisiones que sean de David y el cierre del bloque. Entre
    medias, si pasan todas las pruebas, se preparan los commits de cada paso y se sigue tras su
    confirmación de git, sin informe largo. **Informes de 10 líneas como mucho:** qué se hizo, qué
    falló y cómo se arregló, qué tiene que decidir David. Sin tablas ni repetir lo acordado.
14. **Todas las pruebas antes de proponer commits:** las del servidor (`server/utils` y
    `server/models`, `*.test.js`) y las del cliente (`client/src`), no solo las del paso, más
    `npm run lint` del cliente; el resultado se muestra.
15. **Navegador al cerrar cada bloque:** 375, 390, 1024 y 1280 px y WebKit, una vez, salvo que un
    paso toque algo táctil o de iOS. Las cuentas inventadas de las pruebas se crean dentro y se
    borran **siempre en un `finally`**; si hay que limpiar restos, solo por email exacto, nunca por
    patrón (`dev@yieldfit.test` es el seed).
16. **Tablero** (GitHub Projects **privado** de David, items de borrador; nunca Issues del repo
    público ni bug reports de usuarios). Lleva el **estado** de bloques y pasos (Estado, Bloque,
    Tipo). Se actualiza con una línea de `gh project item-edit`, sin informe ni confirmación, al
    empezar un bloque, al terminar cada paso y al cerrarlo (los comandos de git sí se confirman).
    Los ids van en `.claude/tablero.local.json` (ignorado por git) o se buscan con
    `gh project list`. `docs/bloques` y `DECISIONS.md` llevan el porqué; `docs/roadmap.md`, el
    orden y qué es cada bloque, sin estados.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19, Vite 8, react-router-dom 7, axios, Recharts, CSS Modules, Geist y Geist Mono (fontsource), dnd-kit (arrastrar) |
| Efectos | three.js + @react-three/fiber + postprocessing (Dither, solo Welcome); ogl (DarkVeil, fondo global en `Layout`) |
| Backend | Node 20, Express 5 (ESM), Mongoose 9, bcrypt, jsonwebtoken, helmet, cors, morgan, express-rate-limit, csv-parse (7b) |
| Lint | oxlint (cliente) |
| Tests | Scripts `*.test.js` con `node` y sin dependencias (funciones puras), junto a lo que prueban |

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
npm run diagnostico:huerfanos  # solo lectura en producción: datos de usuarios que ya no existen (1c)
npm run reparar:borrados       # ESCRIBE en producción con usuario temporal; simula sin -- --aplicar (ver docs/operaciones.md)
npm run reparar:huerfanos      # ESCRIBE en producción: borra esos datos; mismo procedimiento (1c)
npm run migrar:1rm             # ESCRIBE en producción: rellena mejor1RM (bloque 4); mismo procedimiento
npm run migrar:pr              # ESCRIBE en producción: marca los récords (bloque 4b); mismo procedimiento
npm run admin -- correo        # ESCRIBE en producción: da el rol de admin (--quitar); mismo procedimiento
npm run restablecer -- correo  # ESCRIBE en producción: contraseña temporal (bloque 11b); mismo procedimiento

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
  utils/        # activeSession.js (localStorage), wakingUp.js (arranque en frío), borradoEjercicio.js, records.js, importar.js (7b)
  styles/       # variables.css — tokens de diseño
server/
  models/       # User, Exercise, Workout, Session, Chart, Dashboard, EmparejamientoImport (7b)
  controllers/  # lógica por recurso (list/getOne/create/update/remove)
  routes/       # un router por recurso; requireAuth aplicado a nivel router
  middlewares/  # requireAuth, notFoundHandler, errorHandler
  data/         # exercisePresets.js (ejercicios clonados al registrarse), catalogoWidgets.js (9d),
                # importacion.js y equivalenciasStrong.js (7b)
  utils/        # jwt.js, presets.js (clonado de presets), unaRM.js (Epley), progreso.js (+ .test.js);
                # importación de Strong (7b): importarStrong, emparejarStrong, vistaPreviaStrong,
                # construirImportacion, operacionPesada y zona (fechaLocalAUtc)
  scripts/      # seed.js (datos de desarrollo), backup.sh, restore-test.sh, diagnostico-borrados.js y reparar-borrados.js;
                # lib/ (credenciales.sh oculta la URI; recuentos.sh lee los logs;
                # conexion.js: conexión y filtro de credenciales de los scripts Node)
```

Import alias en cliente: `@` → `client/src`.

## Modelo de datos (resumen)

- **User**: credenciales (bcrypt en `pre('save')`), datos de perfil y `preferencias.esfuerzo`
  (`no` | `rpe` | `rir`, bloque 5c). `toJSON` elimina `password`.
- **Exercise**: por usuario. `tipo` y `grupoMuscular` son enums; `tracking` (`1RM` |
  `tiempo_distancia`) se deriva en `pre('save')`. Borrarlo lo quita de rutinas y grupos,
  pero las sesiones lo conservan y el progreso lo ignora (0020; 409 si es el único de una rutina).
- **Workout**: rutina (plantilla) con ejercicios embebidos (`numSeries`, `descansoSegundos`, `orden`).
- **Session**: entrenamiento realizado. Ejercicios embebidos con **snapshots** (`nombreSnapshot`,
  `trackingSnapshot`) para que el historial sea inmutable, y `mejor1RM` calculado al guardar.
  Índice `{ userId: 1, fecha: -1 }`. El progreso lo calcula `GET /api/progress` (0026) y el
  historial se pagina por cursor (0027). Récords personales (0051): `esPR` y `prAnterior` en el
  ejercicio de la sesión que batió la marca; se marcan al guardar y se recalculan al borrar.
  Esfuerzo (0056): solo `rpe` por serie (1–10, pasos de 0,5; rango en `server/utils/esfuerzo.js`);
  el RIR (10 − RPE) solo se muestra. No cambia el 1RM ni los récords.
  Importadas (0057): `importacion { origen, clave, lote }`, con índice único parcial (sin
  duplicados) y otro parcial por lote, que se consulta con `{ $eq: lote, $type: 'objectId' }`.
- **Exercise.record1RM**: la marca actual de cada ejercicio, copia reconstruible de las sesiones
  (`npm run migrar:pr`). Solo la escribe el servidor (`utils/records.js`).
- **Chart**: grupo de progreso del usuario (`nombre`, `exerciseIds`); en la app se llama "grupo".
  Su progreso lo calcula `GET /api/progress?grupo=<id>` con el mismo cálculo que "Todos" (0034).
  "Todos" es un grupo con `todos: true` y sin lista (0052).
- **Dashboard**: widgets del Dashboard de cada usuario en orden (tipo, tamaño P/M/G, referencia y
  rango). Catálogo en `server/data/catalogoWidgets.js` (0052).
- **EmparejamientoImport** (0057): por nombre de Strong, el ejercicio tuyo (`exerciseId`) o "no
  importar" (`omitir: true`), nunca las dos cosas. Borrar el ejercicio borra su emparejamiento.

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

**Fuente de verdad del diseño** (desde el bloque 9c, DECISIONS 0047): el design system de Yield Fit
en un artefacto de claude.ai, https://claude.ai/artifact/FRZyFL1pqgwGnvcaMCLoR3 (privado). Se lee
`project/README.md`, `project/tokens.json`, `project/components/<Comp>/README.md` y el CSS compilado
de `project/components/bundle.css`. Si no se puede leer, se dice y no se inventan valores.
Figma (fileKey `FM0tXObXUAJsRipf0D0gXs`) queda como referencia histórica, desactualizada.

Tema único **Premium** (valores en `:root`) con los ajustes de David (DECISIONS 0048): superficies
por niveles (`surface-0..3`), texto `#ededed`, verde `#3EF87E` para datos, estados,
selección y foco, y en el botón primario como borde de luz y texto sobre cristal oscuro (0059;
tokens `color-action-*`), y rojo `#ec5850` para
pérdidas, errores y peligro (siempre tonal, nunca sólido). La portada sin sesión y la intro
mantienen el negro puro. Botones de solo icono con `BotonIcono` (círculo para navegar, sin fondo
dentro de tarjetas, zona táctil de 48 px). Tipografía Geist; cifras y datos técnicos en Geist Mono
(`--font-mono`).
Colores, espaciados, sombras y movimiento siempre desde `styles/variables.css`, nunca valores sueltos.
**Responsive obligatorio:** todo cambio de interfaz se comprueba a 375 y 390 px de ancho (y en
escritorio), sin desbordes ni scroll horizontal. Los fallos se arreglan en el componente común,
no página a página: dos o más botones juntos van siempre en `GrupoBotones` (se apilan a ancho
completo si no caben); `Input` y `Select` ya se estrechan dentro de una fila.
**Anchos de maqueta** (bloque 8b): cada página usa `--ancho-pagina` (1120 px: listas y resumen) o
`--ancho-formulario` (700 px: formularios, detalles y lectura), nunca un ancho propio. Todos los
elementos de una página van al mismo ancho.
**Radios** (bloque 8b): tarjetas y contenedores `radius-lg`; campos y avisos `radius-md`; botones
pequeños y elementos dentro de una tarjeta `radius-sm` o `radius-xs`; botones, chips, barras y
círculos `radius-pill`. Nunca un valor suelto. **Botones:** su texto nunca se parte en dos líneas;
si dos no caben, `GrupoBotones` los apila.
**Widgets del Dashboard** (bloque 9d): todos siguen la anatomía común de la tarjeta **Widget** del
design system (relleno de 16 px, cabecera de 20 px con etiqueta y dato secundario, contenido
alineado arriba, separaciones fijas, escala de texto por tamaño y nada que se estire para
rellenar). **Cada widget nuevo se diseña con esa anatomía en todos sus tamaños (P, M, G) y David lo
aprueba en el artefacto (tarjetas Widget y Dashboard) antes de implementarlo.**

## Criterios de escalabilidad

Aplicar en cada cambio y avisar cuando algo existente no los cumpla:

- **Estabilidad a largo plazo** (ver `DECISIONS.md`): la app registra datos durante años y debe
  funcionar igual con 5 años de historial que con 5 semanas.
- Las consultas que crecen con el historial deben estar indexadas y, si devuelven listas, limitadas o paginadas.
- Las fuentes de verdad no se duplican: si un enum existe en el backend, el frontend no lo reescribe a mano.
- Lógica de negocio fuera de los componentes (en `utils/`, hooks o backend), UI solo presenta.
- Los archivos binarios (imágenes) nunca van a MongoDB: almacenamiento externo + URL en el documento.
- Nada que dependa de que el cliente sea un navegador de escritorio: la API también la usará la app móvil
  (React Native con Expo, iOS y Android; [0058](DECISIONS.md)), que no tiene cookies de navegador ni DOM.

## Roadmap, tablero y deuda técnica

- **Estado** de bloques y pasos: tablero privado de GitHub Projects (ver Tablero, en el protocolo).
- **Orden de trabajo, qué es cada bloque y deuda técnica:** [docs/roadmap.md](docs/roadmap.md).
- **Porqué:** `DECISIONS.md` y `docs/bloques/`.

## Informe de corrección del curso (CEI)

Hallazgos del análisis estático ya verificados como **falsos positivos**. No "arreglarlos":
variables `VITE_` ausentes (existe `VITE_API_URL`), dotenv no usado (se carga con
`import 'dotenv/config'`), rutas de escritura sin auth (`requireAuth` va a nivel router),
falta de `runValidators` (las actualizaciones usan `save()`), `JSON.parse` sin try/catch en
`activeSession.js` (sí lo tiene), `useEffect` sin efecto en `ActiveSession.jsx` (escribe en localStorage).
