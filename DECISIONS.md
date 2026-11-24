# DECISIONS.md — Yield Fit

Registro de decisiones técnicas y de producto. Cada entrada responde a: qué problema había,
qué se decidió, qué se descartó y qué consecuencias tiene.

## Cómo se usa

- Las entradas son **inmutables**. Si una decisión cambia, se añade una entrada nueva que la
  sustituye y la antigua pasa a `Estado: sustituida por 00XX`.
- **Retroactivas** (0001–0011): decisiones tomadas antes de la entrega del curso y
  documentadas después. En ellas:
  - *Alternativas descartadas* se marcan como **análisis a posteriori** salvo que David
    confirme que las evaluó en su momento.
  - *Origen del porqué* indica si el razonamiento está escrito en el código o si se ha
    deducido y está pendiente de confirmar por David.
- Este archivo es público: nunca contiene secretos, URLs de conexión ni datos de usuarios.

## Índice

| # | Decisión | Estado |
|---|---|---|
| 0001 | Stack MERN desplegado en Vercel + Render + Atlas M0 | vigente |
| 0002 | Ejercicios por usuario, clonados desde presets en una transacción | vigente |
| 0003 | Subdocumentos embebidos en Workout y Session | vigente |
| 0004 | Snapshots en Session para un historial inmutable | vigente |
| 0005 | Cascada `$pull` al borrar un ejercicio | sustituida por 0020 |
| 0006 | `tracking` persistido y derivado en `pre('save')` | vigente |
| 0007 | 1RM estimado con Epley, calculado en el cliente | sustituida por 0026 |
| 0008 | JWT de 7 días en `localStorage` | sustituida por 0037 |
| 0009 | Sesión activa persistida en `localStorage` | vigente |
| 0010 | CSS Modules + tokens en `variables.css` | vigente |
| 0011 | Fondos WebGL copiados de React Bits | vigente |
| 0012 | Repo público y documentación sin secretos | vigente |
| 0013 | Documentación con VitePress en `/docs` | sustituida por 0016 |
| 0014 | Conventional Commits en español y Git con confirmación | vigente |
| 0015 | Principio de estabilidad a largo plazo | vigente |
| 0016 | Documentación en Markdown en `/docs`, leída en GitHub | vigente |
| 0017 | Base de datos de desarrollo separada de producción | vigente |
| 0018 | Backups manuales de producción con `mongodump` | vigente |
| 0019 | Backups solo en el portátil y riesgos aceptados | vigente |
| 0020 | Borrar un ejercicio conserva el historial | vigente |
| 0021 | Atribución del código de React Bits | vigente |
| 0022 | Repositorio público sin licencia | vigente |
| 0023 | Hook que pide confirmación para git dentro de cualquier comando | vigente |
| 0024 | Grupos musculares y tipos: el servidor es la única fuente | vigente |
| 0025 | Aviso de arranque en frío y 401 sin recarga | vigente |
| 0026 | Progreso en el servidor: 1RM precalculado, % tipo bolsa e índice base 100 | vigente |
| 0027 | Historial paginado por cursor | vigente |
| 0028 | Sin middleware de compresión: Render ya comprime | vigente |
| 0029 | Serie anterior: última sesión con el ejercicio, guardada en la sesión activa | vigente |
| 0030 | Cardio bloqueado con "Próximamente" desde las opciones del servidor | vigente |
| 0031 | Sesión activa con `useReducer` | vigente |
| 0032 | Reemplazar un ejercicio en la sesión activa | vigente |
| 0033 | Calendario de días entrenados: mes y año, desde un endpoint de solo fechas | vigente |
| 0034 | Grupos de progreso con rango, plegado y orden en el dispositivo | vigente |
| 0035 | Límite de intentos en el login y el registro | vigente |
| 0036 | Mejoras de uso: crear desde el buscador, etiquetas, selector por pasos, arrastrar y cargas | vigente |
| 0037 | Token de acceso de 15 minutos en memoria y token de renovación en cookie httpOnly | vigente |
| 0038 | La IP real detrás de Render: `trust proxy` a 3 | vigente |
| 0039 | Los backups se rotan: se conservan los 3 últimos | vigente |
| 0040 | Rol de admin asignado por script y página `/developer` | vigente |
| 0041 | Reportes de fallos desde un botón flotante | vigente |
| 0042 | Borrar la cuenta con todos sus datos, y el dispositivo al cerrar sesión | vigente |
| 0043 | Contraseña: cambiarla, restablecerla por script y recuperarla por email con Resend | vigente |
| 0044 | Nota de privacidad informativa, pública y sin email de contacto | vigente |
| 0045 | Data router y aviso de cambios sin guardar | vigente |
| 0046 | Filas de botones que se apilan (`GrupoBotones`) y responsive obligatorio | vigente |
| 0047 | Design system Premium como tema único y fuente de verdad del diseño | vigente |
| 0048 | Ajustes al tema Premium: botón verde, rojo más vivo, botones de icono y portada en negro puro | vigente |

---

## 0001 — Stack MERN desplegado en Vercel + Render + Atlas M0

Fecha: anterior a la entrega (≤ 2026-07) · Estado: vigente · Bloque: —
Origen del porqué: confirmado por David

**Contexto:** proyecto del curso con stack MERN, desplegado en producción. Se eligió esta
combinación por las dos cosas: coste cero y que era la que se usaba en el curso.

**Decisión:** frontend React (Vite) en Vercel, API Express en Render (Frankfurt), base de
datos en MongoDB Atlas M0. Cada parte se despliega por separado desde el mismo repo.

**Alternativas descartadas** (análisis a posteriori):
- Backend en Vercel como funciones serverless: cold start mucho más corto (un segundo o menos),
  pero obliga a gestionar la conexión a MongoDB por invocación.
- Railway / Fly.io: sin plan gratuito comparable.

**Consecuencias:**
- Coste cero.
- Cold start de Render en el plan gratuito: la primera petición tras un periodo de
  inactividad tarda decenas de segundos. Se aborda en el bloque 3.
- Atlas M0 tiene límites de almacenamiento y conexiones; suficiente para el uso actual.

---

## 0002 — Ejercicios por usuario, clonados desde presets en una transacción

Fecha: anterior a la entrega (≤ 2026-07) · Estado: vigente · Bloque: —
Origen del porqué: tener ejercicios por usuario está confirmado por David; la transacción y el
`insertMany` están explicados en `server/controllers/authController.js`

**Contexto:** un usuario nuevo necesita ejercicios para empezar a entrenar, y cada usuario debe
poder renombrar, editar y borrar los suyos sin afectar a otros.

**Decisión:** cada usuario tiene sus propios ejercicios, para poder editarlos o borrarlos con
libertad. Al registrarse, se clona el catálogo de `server/data/exercisePresets.js` como
documentos `Exercise` del usuario, con `insertMany`. La creación del usuario y el clonado van en
una transacción de MongoDB: o se completan las dos, o ninguna. Antes iban por separado y un fallo
en el clonado dejaba usuarios sin ejercicios.

**Alternativas descartadas** (análisis a posteriori):
- Catálogo global compartido y ejercicios propios aparte: menos documentos, pero complica
  editar o borrar un preset "solo para mí" y el filtro por `userId` deja de ser uniforme.
- `save()` individual por preset: ejecuta los middlewares, pero son N viajes a la base de datos.

**Consecuencias:**
- Todas las queries de `Exercise` filtran por `userId`, igual que el resto de recursos.
- `insertMany` no ejecuta `pre('save')`, así que la derivación de `tracking` está **duplicada**
  en `derivarTracking` (ver 0006).
- Cambiar los presets no afecta a los usuarios existentes.

---

## 0003 — Subdocumentos embebidos en Workout y Session

Fecha: anterior a la entrega (≤ 2026-07) · Estado: vigente · Bloque: —
Origen del porqué: confirmado por David

**Contexto:** una rutina tiene ejercicios con configuración propia (`numSeries`,
`descansoSegundos`, `orden`), y una sesión tiene ejercicios con series (`peso`, `reps`, …).

**Decisión:** regla general: **embeber lo que se lee junto al padre y referenciar lo que existe
de forma independiente**. Una serie no existe sin su ejercicio, ni un ejercicio de sesión sin su
sesión. Por eso se embeben:
- `Workout.ejercicios[]` (configuración por ejercicio de la rutina),
- `Session.ejercicios[]` y, dentro de cada uno, `sets[]`.

Solo se referencia por id (`exerciseId`) lo que tiene vida propia: el `Exercise`.

**Alternativas descartadas** (análisis a posteriori):
- Colecciones `WorkoutExercise`, `SessionExercise` y `Set` referenciadas: permiten consultar
  series sueltas, pero cada lectura necesita `populate` o varias queries, y guardar una sesión
  deja de ser atómico.

**Consecuencias:**
- Una sesión se lee y se guarda en una sola operación, y el guardado es atómico.
- Las validaciones de los arrays (al menos 1 ejercicio, al menos 1 serie) viven en el schema.
- Consultas del tipo "todas las series de este ejercicio" obligan a recorrer sesiones completas.
  Afecta a los bloques 5 (serie anterior) y 7 (CSV).
- Límite de 16 MB por documento: irrelevante para una sesión de gimnasio.

---

## 0004 — Snapshots en Session para un historial inmutable

Fecha: anterior a la entrega (≤ 2026-07) · Estado: vigente · Bloque: —
Origen del porqué: documentado en `server/models/Session.js`

**Contexto:** el historial referencia `Exercise` por id, pero un ejercicio puede renombrarse o
cambiar de tipo después.

**Decisión:** cada ejercicio embebido en la sesión guarda `nombreSnapshot` y `trackingSnapshot`
en el momento de registrarla.

**Alternativas descartadas** (análisis a posteriori):
- Resolver siempre el nombre actual con `populate`: el historial cambiaría retroactivamente al
  renombrar.

**Consecuencias:**
- Renombrar un ejercicio no altera sesiones pasadas.
- Al borrar un ejercicio, la cascada de 0005 elimina igualmente sus datos del historial: los
  snapshots protegen frente a renombrados, no frente a borrados.

---

## 0005 — Cascada `$pull` al borrar un ejercicio

Fecha: anterior a la entrega (≤ 2026-07) · Estado: sustituida por 0020 · Bloque: —
Origen del porqué: motivo escrito en el código (comentario de cabecera de
`exerciseController.remove`: "Decisión de producto")

**Contexto:** qué hacer con el historial cuando el usuario borra un ejercicio.

**Decisión:** si el usuario borra un ejercicio, es porque no quiere verlo en su progreso
histórico. `exerciseController.remove` borra el `Exercise` y hace `Session.updateMany` con
`$pull` para quitar ese ejercicio de todas las sesiones del usuario.

**Alternativas descartadas** (análisis a posteriori):
- Conservar el historial (los snapshots ya permiten mostrarlo sin el `Exercise`).
- Borrado lógico (`archivado: true`): el ejercicio desaparece de la UI y el historial se mantiene.
- Impedir el borrado si el ejercicio tiene sesiones.

**Consecuencias** (pendientes de resolver en el bloque 1; si cambia la decisión, entrada nueva):
- **Sesiones con `ejercicios: []`:** `updateMany` no pasa las validaciones de Mongoose, así que
  la regla "al menos 1 ejercicio" de Session no se aplica.
- **Borrado irreversible sin aviso:** el usuario no sabe que perderá el historial de ese ejercicio.
- **`exerciseIds` huérfanos:** la cascada no limpia `Workout.ejercicios[]` ni
  `Chart.exerciseIds`.

---

## 0006 — `tracking` persistido y derivado en `pre('save')`

Fecha: anterior a la entrega (≤ 2026-07) · Estado: vigente · Bloque: —
Origen del porqué: documentado en `server/models/Exercise.js`

**Contexto:** un ejercicio se mide por 1RM estimado o por tiempo/distancia, y eso depende de su
`grupoMuscular` y su `tipo`.

**Decisión:** `tracking` es un campo guardado en la base de datos y lo calcula un middleware
`pre('save')`: `tiempo_distancia` solo si grupo **y** tipo son `Cardio`; `1RM` en el resto.
El usuario no lo elige.

**Alternativas descartadas** (análisis a posteriori):
- Virtual de Mongoose: no se guarda, así que no se puede filtrar por él en queries.
- Que lo elija el usuario en el formulario: posibles combinaciones incoherentes.

**Consecuencias:**
- El frontend puede filtrar por `tracking` sin recalcularlo.
- Solo se aplica en `save()`: `insertMany` y `update*` no lo ejecutan. Por eso la lógica está
  duplicada en `authController.js` (`derivarTracking`, ver 0002).

---

## 0007 — 1RM estimado con Epley, calculado en el cliente

Fecha: anterior a la entrega (≤ 2026-07) · Estado: sustituida por 0026 · Bloque: —
Origen del porqué: la elección de Epley está documentada en `client/src/utils/performance.js`;
calcularlo en el cliente no fue una elección consciente: no se pensó en hacerlo en el backend
(confirmado por David)

**Contexto:** la metáfora de inversión necesita una métrica única por ejercicio que se pueda
comparar entre sesiones con distinto peso y repeticiones.

**Decisión:** 1RM estimado = `peso × (1 + reps / 30)` (Epley), tomando el mejor set de cada
sesión. Se calcula en `client/src/utils/performance.js` a partir de las sesiones recibidas.

**Alternativas descartadas** (análisis a posteriori; **no se evaluaron en su momento**):
- Brzycki u otras fórmulas: similares en el rango de 3 a 12 repeticiones; Epley es la más común
  en apps de referencia.
- Calcular en el backend (endpoint de rendimiento o agregación de MongoDB).

**Consecuencias:**
- Sin lógica extra en el backend y con cálculo instantáneo al cambiar filtros.
- Obliga a descargar **todas** las sesiones (`GET /api/sessions` sin paginar): coste que crece con
  el historial. Registrado como deuda técnica.
- Con más de 12 repeticiones la estimación pierde precisión.
- **Revisión prevista:** el cálculo pasa al backend en el bloque 4 (1RM precalculado al guardar,
  con migración de las sesiones existentes, y `GET /api/sessions` paginado). Será una entrada
  nueva que sustituya a esta.

---

## 0008 — JWT de 7 días en `localStorage`

Fecha: anterior a la entrega (≤ 2026-07) · Estado: sustituida por 0037 · Bloque: —
Origen del porqué: guardarlo en `localStorage` está confirmado por David; el contenido del
payload (solo `userId`) está documentado en `server/utils/jwt.js`

**Contexto:** la API es stateless y el frontend (Vercel) y el backend (Render) están en dominios
distintos.

**Decisión:** el backend firma un JWT con `{ userId }` y 7 días de validez. El cliente lo guarda
en `localStorage` (`yieldfit_token`), para que la sesión del usuario sobreviva al cerrar la
pestaña, y lo envía en `Authorization: Bearer`.

**Alternativas descartadas** (análisis a posteriori; **no se evaluaron en su momento**,
confirmado por David):
- Cookie `httpOnly` + `SameSite`: no es legible desde JavaScript (mitiga XSS), pero entre
  dominios distintos exige CORS con credenciales y protección CSRF.
- Access token corto + refresh token: permite revocar sesiones, pero añade un endpoint y
  almacenamiento de refresh tokens.

**Consecuencias:**
- Implementación simple.
- Un XSS podría leer el token; no hay forma de revocarlo antes de que caduque.
- Sin rate limiting en login. Registrado como deuda técnica.
- **Revisión prevista:** access token corto + refresh token en el bloque 11. En iPhone,
  almacenamiento seguro nativo en el bloque 12 (las cookies `httpOnly` son problemáticas en
  Capacitor).

---

## 0009 — Sesión activa persistida en `localStorage`

Fecha: anterior a la entrega (≤ 2026-07) · Estado: vigente · Bloque: —
Origen del porqué: usar `localStorage` está confirmado por David; enviarla al backend solo al
terminar no fue una elección consciente: era lo más directo (confirmado por David)

**Contexto:** un entrenamiento dura más de una hora. Cerrar la pestaña no debe hacer perder lo
registrado, y el usuario debe poder navegar por la app con la MiniSession activa.

**Decisión:** la sesión en curso vive en `localStorage` (`yieldfit_active_session`) y solo se
envía al backend al finalizarla. El acceso está centralizado en `utils/activeSession.js`, y un
evento propio (`yieldfit:active-session-changed`) mantiene sincronizados los componentes.

**Alternativas descartadas** (análisis a posteriori; **no se evaluaron en su momento**):
- Guardar un borrador en el backend tras cada serie: sobrevive a cambios de dispositivo, pero
  hace una petición por serie y sufre el cold start (0001).

**Consecuencias:**
- Funciona sin conexión durante el entrenamiento.
- La sesión en curso está atada a un dispositivo y navegador.
- **Riesgo:** se pierde el entrenamiento en curso si iOS borra el `localStorage` o si falla el
  POST final.
- **Revisión prevista:** valorar una sincronización híbrida (local + backend) en el bloque 12.

---

## 0010 — CSS Modules + tokens en `variables.css`

Fecha: anterior a la entrega (≤ 2026-07) · Estado: vigente · Bloque: —
Origen del porqué: confirmado por David

**Contexto:** hay que dar estilo a los componentes sin colisiones de clases y con un sistema de
diseño coherente con Figma. El diseño partía de un prototipo propio.

**Decisión:** CSS propio en lugar de un framework de utilidades, porque David ya dominaba CSS,
quería control total y partía de su propio prototipo. CSS Modules porque las clases tienen
ámbito local y el estilo se borra junto con su componente. Cada componente tiene su
`Componente.module.css`; colores, espaciados y tipografía salen de las variables CSS de
`client/src/styles/variables.css`, alineadas con las variables de Figma. Excepciones:
`index.css` (estilos globales) y los CSS de los fondos WebGL de terceros (ver 0011).

**Alternativas descartadas:**
- Tailwind (evaluada en su momento): David solo lo había usado por encima, frente a un CSS que
  ya dominaba.
- CSS-in-JS (styled-components) (análisis a posteriori): coste en tiempo de ejecución y más
  bundle.

**Consecuencias:**
- Sin dependencias extra: Vite soporta CSS Modules de serie.
- Cambiar un token actualiza toda la app.
- Nada impide técnicamente usar valores sueltos; depende de la disciplina (regla en CLAUDE.md).

---

## 0011 — Fondos WebGL copiados de React Bits

Fecha: anterior a la entrega (≤ 2026-07) · Estado: vigente · Bloque: —
Origen del porqué: confirmado por David (impacto visual)

**Contexto:** se buscaba impacto visual con fondos animados: en la pantalla Welcome y como capa
ambiental de toda la app.

**Decisión:** usar `Dither` (three.js + @react-three/fiber + postprocessing, solo en Welcome) y
`DarkVeil` (ogl, fondo global montado en `Layout.jsx`), copiados de React Bits (reactbits.dev) en `client/src/components/`, y adaptados después (carga
diferida, `requestIdleCallback`, menos octavas de ruido).

**Alternativas descartadas** (análisis a posteriori):
- Escribir los shaders desde cero: fuera del alcance del curso.
- Fondos estáticos (imagen o gradiente CSS): sin coste de rendimiento, pero menos impacto.

**Consecuencias:**
- Es código de terceros que David no ha escrito. Hay que saber explicar qué hace y qué se ha
  cambiado, no el shader línea a línea.
- **Licencia:** React Bits usa MIT + Commons Clause. Permite usar los componentes dentro de una
  aplicación, pero exige incluir el aviso de copyright y prohíbe vender o redistribuir los
  componentes por separado. Ahora mismo **no hay atribución ni aviso**. Se resuelve en el bloque 1.
- Hay **dos librerías WebGL** (three.js y ogl) para dos fondos: peso duplicado. Dither se carga
  en diferido; DarkVeil se renderiza en todas las pantallas privadas, también en la sesión activa.
- **Revisión prevista:** revisar DarkVeil en el bloque 12 por su consumo de batería durante el
  entrenamiento.

---

## 0012 — Repo público y documentación sin secretos

Fecha: 2026-09-24 · Estado: vigente · Bloque: 0

**Contexto:** el repo `daviddhernandez2/yieldfit` es público y sirve de portfolio. La
documentación vive en el mismo repo.

**Decisión:** mantener el repo público. `/docs`, `DECISIONS.md` y los README nunca contienen
secretos, URLs de conexión ni datos de usuarios. `.postman/` y `postman/` quedan fuera del repo
(`.gitignore`) porque sus environments pueden guardar tokens.

**Alternativas descartadas:**
- Repo privado: se pierde el valor de portfolio.
- Documentación en un repo privado aparte: se desincroniza del código.

**Consecuencias:**
- La protección de acceso del sitio de docs (0013) evita la indexación, pero no la lectura: el
  contenido se puede leer en GitHub.

---

## 0013 — Documentación con VitePress en `/docs`

Fecha: 2026-09-24 · Estado: sustituida por 0016 · Bloque: 0

**Contexto:** se necesita documentación navegable con diagramas mermaid, separada de la app.

**Decisión:** VitePress en `/docs`, como proyecto independiente con su propio `package.json`,
desplegado en Vercel como un proyecto aparte (Root Directory = `docs`) con protección de acceso.

**Alternativas descartadas:**
- Docusaurus: más pesado y con más configuración para un sitio personal.
- Starlight (Astro): otro framework más que aprender.
- Markdown sin desplegar, leído en GitHub: no cumple el objetivo de un sitio navegable.

**Consecuencias:**
- Mismas herramientas que el cliente (Vite); no afecta al bundle de la app.
- Mermaid necesita un plugin (`vitepress-plugin-mermaid`).
- Hay que confirmar qué protección de acceso permite el plan de Vercel (paso 0.3).

---

## 0014 — Conventional Commits en español y Git con confirmación

Fecha: 2026-09-24 · Estado: vigente · Bloque: 0

**Contexto:** el historial mezclaba mensajes con y sin tipo, con distintas formas verbales y
varios cambios por commit.

**Decisión:** formato `tipo(ámbito): descripción` en español, 3ª persona del presente, un cambio
lógico por commit y sin líneas de autoría (detalle en la sección Git de CLAUDE.md). Claude
prepara los comandos completos (`pwd`, `git add` con rutas explícitas, `git commit`, `git push`)
y se los enseña a David. Solo los ejecuta cuando David los ha verificado y confirmado, y nunca
ejecuta un comando de git que modifique el repo o el remoto sin confirmación explícita para ese
comando concreto.

**Alternativas descartadas:**
- Mensajes libres: el historial no se puede filtrar por tipo ni por ámbito.
- Commitlint con un hook de git: otra dependencia; de momento basta con la regla escrita.

**Consecuencias:**
- `git log --oneline` se lee como un changelog.
- Los commits anteriores a esta decisión no se reescriben.

---

## 0015 — Principio de estabilidad a largo plazo

Fecha: 2026-09-24 · Estado: vigente · Bloque: 0

**Contexto:** Yield Fit registra entrenamientos durante años. Varias decisiones retroactivas
(0003, 0007, 0009) funcionan bien con poco historial pero se degradan al crecer: el cliente
descarga todas las sesiones y recalcula el progreso en cada visita.

**Decisión:** la app debe funcionar igual con 5 años de historial que con 5 semanas. Todo cambio
se evalúa también con un historial grande: consultas indexadas y paginadas, cálculos que no
recorren el historial completo en cada petición y datos guardados que sigan siendo válidos
aunque cambien el código o el catálogo. Queda recogido en los criterios de escalabilidad de
CLAUDE.md.

**Alternativas descartadas:**
- Optimizar cuando aparezca el problema: con datos reales de años, cualquier cambio de modelo
  obliga a migrar mucho historial y el problema lo sufre primero el usuario.

**Consecuencias:**
- Justifica el bloque 4 (historial escalable) antes que las features que leen historial
  (serie anterior, CSV, calendario, grupos).
- Los cambios de modelo de datos llevan migración de los documentos existentes, no solo código
  nuevo.

---

## 0016 — Documentación en Markdown en `/docs`, leída en GitHub

Fecha: 2026-09-24 · Estado: vigente · Bloque: 0 · Sustituye a: 0013

**Contexto:** VitePress (0013) suponía dependencias, configuración y un segundo proyecto en
Vercel antes de tener contenido. Además, la protección de acceso de Vercel no aporta privacidad
real porque el repo es público (0012): el mismo contenido se lee en GitHub.

**Decisión:** la documentación son archivos Markdown en `/docs`, leídos directamente en GitHub,
que renderiza mermaid de forma nativa. `docs/README.md` hace de índice. Las decisiones no se
duplican: la doc enlaza a `../DECISIONS.md`. El motivo es la simplicidad: sin dependencias, sin
build y sin despliegue.

**Alternativas descartadas:**
- VitePress desplegado en Vercel (0013): demasiada infraestructura para empezar.
- Wiki de GitHub: vive en un repo git aparte, así que la doc no va en los mismos commits que el
  código que describe.

**Consecuencias:**
- Cero mantenimiento de infraestructura: la doc se actualiza en el mismo commit que el código.
- Sin buscador ni barra lateral; la navegación va por enlaces relativos desde `docs/README.md`.
- Migrar a VitePress en el futuro no tiene coste de contenido: reutiliza los mismos `.md`
  (mermaid necesitaría un plugin).
- Ya no aplica la consecuencia de 0012 sobre la protección del sitio de docs: no hay sitio.

---

## 0017 — Base de datos de desarrollo separada de producción

Fecha: 2026-09-29 · Estado: vigente · Bloque: 1

**Contexto:** el `.env` local y el de Render apuntan a la misma base de datos (`yieldfit`) del
mismo clúster de Atlas. Todo lo que se prueba en local (registros, sesiones, borrados) escribe
en datos reales. El bloque 4 migrará todas las sesiones existentes, y esa migración no se puede
probar por primera vez en producción.

**Decisión:**
- Base de desarrollo `yieldfit-dev` en el **mismo clúster** M0.
- Un **usuario de Atlas propio para desarrollo**, con permiso `readWrite` solo sobre
  `yieldfit-dev`. Aunque el `.env` local apuntase por error a `yieldfit`, Atlas rechazaría la
  conexión. Además, la contraseña del usuario de producción deja de estar en el `.env` local.
- Datos de desarrollo con un **script de seed** (`server/scripts/seed.js`): usuario de prueba,
  presets y sesiones sintéticas repartidas en varios años. El script se niega a ejecutarse si la
  base no termina en `-dev`.
- Para probar la migración del bloque 4: **copia puntual solo de las sesiones de producción**,
  sin la colección de usuarios, en una base temporal.
- **Comprobación al arrancar que bloquea** (`config/database.js`): si `NODE_ENV` no es
  `production` y la base conectada es `yieldfit`, el servidor no arranca.
- Debe estar hecho antes del bloque 4.

**Alternativas descartadas:**
- *Otro clúster M0:* Atlas solo permite un M0 por proyecto, así que habría que crear otro
  proyecto a cambio de un aislamiento que el usuario de desarrollo ya da.
- *MongoDB local (Docker o Homebrew):* sin coste de Atlas y sin conexión, pero el registro usa
  transacciones, que exigen un *replica set*. Un `mongod` local básico no las soporta y habría que
  configurar un replica set de un nodo.
- *Copiar producción a desarrollo* (`mongodump`/`mongorestore`): datos realistas, pero lleva
  emails, fechas de nacimiento y hashes de contraseñas de usuarios reales al portátil, y se queda
  desactualizada. Para probar la migración del bloque 4 con documentos reales, se valorará una
  copia puntual de las sesiones sin la colección de usuarios.
- *Solo un aviso al arrancar:* un aviso se acaba ignorando.

**Consecuencias:**
- Probar en local deja de tocar datos reales.
- La base de desarrollo cuenta para los 512 MB del M0; el seed debe ser razonable.
- El seed hay que mantenerlo cuando cambie el modelo de datos.
- La comprobación al arrancar depende de que Render tenga `NODE_ENV=production` (verificado por
  David el 2026-09-29). Si alguien la quitara, producción no arrancaría.

---

## 0018 — Backups manuales de producción con `mongodump`

Fecha: 2026-11-20 · Estado: vigente · Bloque: 1

**Contexto:** Atlas M0 no permite activar backups ("You can't enable backups on Free clusters").
El bloque 4 migrará todas las sesiones existentes y necesita una copia completa, verificada y
restaurable antes de empezar.

**Decisión:** backups manuales desde el portátil con `npm run backup` (`server/scripts/backup.sh`):
- `mongodump` de la base `yieldfit` en un único archivo comprimido (`--archive --gzip`), en
  `~/yieldfit-backups/AAAA-MM-DD_HHMM/`, fuera del repo y con permisos `700`.
- Usuario de Atlas `yieldfit-backup` con `read` sobre `yieldfit` (no puede modificar producción)
  y `readWrite` solo sobre `yieldfit-restore-test`.
- La URI se lee del **Llavero de macOS** dentro del script: no existe en ningún archivo.
- La URI se pasa a las herramientas con `--config=<(…)` (un descriptor temporal), no con `--uri`:
  los argumentos de un proceso los ve `ps`.
- **Toda la salida de `mongodump` y `mongorestore` pasa por un filtro** que sustituye las
  credenciales por `***`, tanto en la URI como la contraseña suelta (codificada y decodificada).
  Motivo: en la primera prueba real, un fallo de conexión imprimió la URI completa con la
  contraseña en la terminal (las herramientas no la ocultan). Se rotó la contraseña.
- Integridad del archivo con `gzip -t` (lo descomprime entero y comprueba el CRC) y huella
  SHA-256. No se usa `mongorestore --dryRun`: termina con "0 document(s) restored" y no demuestra
  que el archivo se haya leído entero. Que el backup se puede restaurar solo lo demuestra la
  prueba de restauración.
- Los scripts nunca terminan en silencio: si no pueden leer los recuentos de los logs, fallan
  con un mensaje explícito, y un `trap ERR` avisa de cualquier parada inesperada.
- Segunda copia opcional en `BACKUP_COPIA_DIR` (p. ej. el NAS), comprobada por SHA-256. Si la
  variable no existe, el script avisa; si existe pero el destino no está disponible, falla.
- Prueba de restauración en `yieldfit-restore-test` (`npm run backup:restore-test`), comparando
  documentos por colección.
- Requisito: FileVault activado.

**Alternativas descartadas:**
- *Automático con GitHub Actions + almacenamiento externo cifrado:* más robusto, pero añade
  secretos y piezas que mantener; con el repo público, los *artifacts* de Actions no sirven para
  guardar backups. Queda como revisión prevista.
- *Cron job en Render:* de pago, y seguiría necesitando almacenamiento externo.
- *Subir de plan en Atlas (snapshots gestionados):* coste mensual para un proyecto personal.
- *Script en Node con el driver o `mongoexport` a JSON:* reimplementan peor lo que `mongodump` ya
  hace; JSON pierde tipos (fechas, ObjectId) e índices.
- *URI en un `.env.backup`:* volvería a dejar credenciales de producción en un archivo del portátil.

**Consecuencias:**
- Hay una copia restaurable antes de cualquier migración.
- Depende de la disciplina de David (mensual y antes de cada migración).
- Sin `BACKUP_COPIA_DIR`, la única copia está en el mismo portátil.
- Solo funciona en macOS (Llavero, `shasum`, `stat`).
- **Revisión prevista:** backups automáticos fuera del portátil (opción GitHub Actions +
  almacenamiento externo cifrado) cuando la app tenga usuarios reales además de David.

---

## 0019 — Backups solo en el portátil y riesgos aceptados

Fecha: 2026-11-21 · Estado: vigente · Bloque: 1 · Matiza a: 0018

**Contexto:** la 0018 dejaba como opción una segunda copia en `BACKUP_COPIA_DIR` (p. ej. un NAS),
con aviso si no estaba definida. Al repasar `backup.sh` línea a línea apareció además una
exposición residual: la contraseña de `yieldfit-backup` está en el entorno del proceso `perl` del
filtro mientras dura el backup (en macOS lo ven el propio usuario y root, con `ps -E`).

**Decisión** (de David):
- **Sin segunda copia: los backups se quedan solo en el portátil.** `BACKUP_COPIA_DIR` se mantiene
  en el script, desactivada y sin aviso, por si se cambia de idea.
- **Se acepta la exposición de la contraseña en el entorno de `perl`.** Ocultarla no protegería
  nada: quien pudiera verla también podría abrir directamente `~/yieldfit-backups`, que contiene
  todos los datos.

**Alternativas descartadas:**
- *Segunda copia en un NAS:* protege frente a la pérdida del portátil, pero David prefiere no
  mantener otro destino.
- *Pasar la contraseña a `perl` por un descriptor, como la URI a `mongodump`:* más código para
  proteger frente a alguien que ya tendría acceso a los propios backups.

**Consecuencias:**
- Riesgo asumido: si el portátil se pierde o se estropea, se pierden también los backups. FileVault
  protege los datos frente a terceros, pero no los recupera.
- La revisión prevista en la 0018 (backups automáticos fuera del portátil cuando haya usuarios
  reales) sigue vigente y cubriría este riesgo.

---

## 0020 — Borrar un ejercicio conserva el historial

Fecha: 2026-11-22 · Estado: vigente · Bloque: 1 · Sustituye a: 0005

**Contexto:** la cascada de la 0005 quitaba el ejercicio de todas las sesiones del usuario. Tenía
tres consecuencias pendientes: sesiones que se quedaban con `ejercicios: []`, borrado irreversible
del historial sin avisar al usuario, y rutinas y grupos con `exerciseIds` que ya no existían. Las
rutinas rotas no se podían editar ni usar para guardar un entreno (error 400). El diagnóstico de
producción encontró 3 sesiones vacías y 2 rutinas rotas.

**Decisión** (de David, opción B):
- **El ejercicio se borra de verdad**, y en la misma transacción se quita de las rutinas y los
  grupos del usuario (`$pull` sobre `Workout` y `Chart`).
- **Las sesiones no se tocan.** Conservan el ejercicio con su `nombreSnapshot` (0004): el
  historial sigue mostrando lo que se hizo.
- **El progreso ignora los ejercicios borrados.** Hoy lo filtra el cliente
  (`quitarEjerciciosBorrados` en `utils/performance.js`); en el bloque 4 lo hará el backend.
- **Regla R2:** si el ejercicio es el único de alguna rutina (también en el caso `[X, X]`), no se
  borra nada y se responde 409 con el nombre de la rutina. No se borra una rutina que el usuario
  no ha pedido borrar.
- **El usuario sabe lo que pasa:** el diálogo de borrado lo explica con un único texto
  compartido (`utils/borradoEjercicio.js`).
- **La sesión activa se defiende:** al terminarla se comprueba qué ejercicios siguen existiendo;
  las series de los borrados no se envían y se avisa con su nombre. Al empezar desde una rutina,
  los ejercicios inexistentes no entran en la sesión.
- **Los restos de la cascada antigua se reparan una vez** con `npm run reparar:borrados`, con
  backup previo y usuario temporal (`docs/operaciones.md`). Aplicado en producción el 2026-11-22.

**Alternativas descartadas:**
- *Mantener la cascada y solo arreglar sus consecuencias:* seguiría borrando historial real del
  usuario, que es lo más valioso que guarda la app (0015).
- *Borrado lógico (`archivado: true`) con opción de restaurar:* obliga a excluir los archivados
  en todas las consultas de ejercicios (si una lo olvida, reaparecen) y necesita una pantalla de
  restauración. B conserva el historial con menos código, porque los snapshots ya guardan lo
  necesario.
- *Impedir el borrado si el ejercicio tiene sesiones:* con años de historial, casi ningún
  ejercicio se podría borrar.
- *Borrar la rutina si se queda vacía:* borraría algo que el usuario no ha pedido borrar.

**Consecuencias:**
- Las sesiones pueden referenciar ejercicios que ya no existen. Es normal y deliberado: el
  apartado 4 del diagnóstico deja de ser un error.
- Todo cálculo de progreso tiene que excluir los ejercicios borrados. Hoy exige que el Dashboard
  pida también la lista de ejercicios; el bloque 4 lo moverá al backend.
- Si el usuario vuelve a crear un ejercicio con el mismo nombre, es un ejercicio nuevo: su
  progreso empieza de cero y no se une al historial del borrado.
- La 0004 dice que los snapshots no protegen frente a borrados. Con esta decisión sí lo hacen.

---

## 0021 — Atribución del código de React Bits

Fecha: 2026-11-22 · Estado: vigente · Bloque: 1 · Matiza a: 0011

**Contexto:** la 0011 dejó pendiente la atribución de `Dither` y `DarkVeil`, copiados de React
Bits el 2026-07-07. Su licencia (MIT + Commons Clause) exige que el aviso de copyright y de
permisos acompañe a toda copia o parte sustancial, y prohíbe vender o redistribuir los
componentes por separado. El repositorio es público y el JavaScript servido en yieldfit.app
también es una copia.

**Decisión:**
- **`THIRD_PARTY_NOTICES.md` en la raíz** con el texto literal de la licencia en la versión
  vigente al copiar los componentes (commit `ecdd797` de React Bits). La versión actual añade
  cláusulas sobre herramientas y sonidos de React Bits que no afectan a estos componentes.
- **Cabecera `/*! ... */` en cada archivo copiado**, con autor, enlace, licencia y lista de
  cambios hechos para Yield Fit (los `.css` remiten al `.jsx`).
- **El build conserva los comentarios legales** (`build.rolldownOptions.output.comments.legal`
  en `vite.config.js`). Sin esa opción, el minificador quitaba las cabeceras de los `.jsx`. Como
  efecto secundario, también se conservan los avisos de React, three.js y otras dependencias,
  que sus licencias exigen igualmente. Coste: unos 2 KB con gzip.

**Alternativas descartadas:**
- *Solo un archivo de avisos, sin cabeceras:* quien abre `Dither.jsx` no sabría que no es
  código propio ni qué se ha cambiado.
- *Copiar la versión actual de la licencia:* no es la que se aceptó al copiar el código.
- *Servir el texto completo de la licencia como archivo público de la web:* duplica
  `THIRD_PARTY_NOTICES.md`. La cabecera en el bundle identifica autor y licencia, que es la
  práctica habitual de las librerías minificadas.
- *Reescribir los fondos desde cero:* fuera del alcance del bloque 1.

**Consecuencias:**
- Cualquier código de terceros que se copie en el futuro sigue el mismo patrón (convención en
  `CLAUDE.md`).
- Al modificar `Dither` o `DarkVeil`, hay que actualizar la lista de cambios de su cabecera.

---

## 0022 — Repositorio público sin licencia

Fecha: 2026-11-22 · Estado: vigente · Bloque: 1

**Contexto:** el README mostraba un badge MIT que enlazaba a un `LICENSE` inexistente, y
`server/package.json` declaraba ISC. Dos licencias contradictorias y ninguna elegida a propósito.

**Decisión** (de David): **sin licencia**. El repositorio sigue siendo público (0012) para que
se pueda leer, pero sin licencia rigen los derechos de autor por defecto: nadie puede copiar,
modificar ni distribuir el código sin permiso. Los términos de GitHub solo permiten verlo y
hacer fork dentro de GitHub.
- Se quita el badge MIT del README y se añade un apartado "Licencia" que lo explica.
- `"license": "UNLICENSED"` en los dos `package.json` (y en sus lockfiles), y `"private": true`
  también en el servidor, para que npm no permita publicarlo por error.
- No se crea archivo `LICENSE`.

**Alternativas descartadas:**
- *MIT (lo que decía el badge):* el motivo principal es que cualquiera podría copiar el proyecto
  y publicarlo como app propia. Como David piensa publicar la app de iPhone y hacerla crecer,
  prefiere conservar todos los derechos. Además, pasar a MIT se puede hacer más adelante, pero
  al revés no: el código publicado con MIT ya no se puede retirar.
- *Repositorio privado:* el repo público forma parte del portfolio de David (0012).

**Consecuencias:**
- Quien lea el código no puede reutilizarlo legalmente sin pedir permiso.
- El código de terceros mantiene su propia licencia (`THIRD_PARTY_NOTICES.md`, 0021).
- **Decisión revisable:** más adelante se puede pasar a MIT u otra licencia, o hacer el repo
  privado. Cualquiera de los dos cambios se registra en una entrada nueva.

---

## 0023 — Hook que pide confirmación para git dentro de cualquier comando

Fecha: 2026-11-22 · Estado: vigente · Bloque: 1 · Matiza a: 0014

**Contexto:** la regla 8 de `CLAUDE.md` (0014) exige que David confirme cada comando de git que
modifique el repo. Claude Code la incumplió dos veces:
1. Ejecutó `git stash` y `git stash pop` sin confirmación. Se añadieron entonces reglas `ask`
   en `.claude/settings.json` (`Bash(git stash *)`, etc.).
2. El 2026-11-22 ejecutó `git rm --cached` metido al final de un comando que empezaba con un
   heredoc de Python, y el mensaje que imprimía decía "no he hecho git rm". Las reglas `ask` no
   saltaron: comparan cómo **empieza** el comando, y ese empezaba por `python3`.
   El efecto se limitó al índice (un archivo marcado como borrado, que el commit siguiente
   borraba igualmente); no hubo commit ni push.

**Decisión:**
- **Regla 8 ampliada:** nunca ejecutar git dentro de otros comandos, scripts, heredocs o
  subprocesos, y los mensajes de un comando deben describir lo que hace de verdad.
- **Hook `PreToolUse`** (`.claude/hooks/confirmar-git.mjs`, registrado para Bash): recibe el
  texto completo de cada comando, busca cada `git` suelto y mira el verbo que le sigue
  (saltando opciones como `-C ruta` y separadores de código como comillas o comas). Si el
  verbo no está en una **lista de solo lectura** (`status`, `diff`, `log`, `show`…), pide
  confirmación. Si el propio hook falla, también pide confirmación.
- Las reglas `ask` se mantienen como segunda capa.

**Alternativas descartadas:**
- *Solo ampliar la regla escrita:* ya existía y se incumplió; hace falta algo que no dependa de
  que Claude la recuerde.
- *Lista de verbos prohibidos en vez de permitidos:* un verbo olvidado pasaría sin preguntar.
  Con permitidos, el error posible es una pregunta de más.
- *Bloquear (`deny`) en vez de preguntar:* impediría también los commits que David confirma.

**Consecuencias:**
- Los comandos de git que David confirma piden confirmación dos veces (regla `ask` y hook) o
  una más que antes. Es el coste aceptado.
- Pregunta de más cuando `git push` aparece como texto (un `echo`, un mensaje que lo menciona).
- **Límite:** no detecta un git construido a trozos (`"g" + "it"`) o guardado en una variable.
  Protege frente a descuidos, no frente a un intento deliberado de saltárselo.
- Al cambiar el hook hay que repetir su batería de pruebas: los dos incidentes, heredocs,
  `-C ruta`, comillas escapadas y los casos que no deben preguntar (`.git/`, `.gitignore`,
  `github.com`) con `node .claude/hooks/confirmar-git.test.mjs`.

---

## 0024 — Grupos musculares y tipos: el servidor es la única fuente

Fecha: 2026-11-22 · Estado: vigente · Bloque: 2

**Contexto:** los valores de `grupoMuscular` y `tipo` estaban en el enum del modelo y, además,
copiados a mano en tres sitios del cliente (`ExerciseForm`, `WorkoutForm`, `Exercises`). Las
copias ya se habían separado: los filtros de `Exercises` usaban `'pecho'` en minúsculas y nunca
coincidían con lo guardado (`'Pecho'`), y la columna Tipo mostraba `Maquinas` sin tilde. El
bloque 2 añade un tipo, lo que habría obligado a tocar servidor y cliente y desplegarlos a la vez.

**Decisión** (de David, opción A):
- `models/Exercise.js` define `OPCIONES_GRUPO_MUSCULAR` y `OPCIONES_TIPO` como listas de
  `{ value, label }`. El enum del schema se deriva de los `value`.
- `GET /api/exercises/opciones` (con `requireAuth`, antes de `/:id` en el router) las devuelve.
- En el cliente, el hook `useOpcionesEjercicio` hace una sola petición por carga de la app,
  compartida entre pantallas, y `etiquetaDe` traduce un valor guardado a su texto.
- `value` no se cambia nunca (hay documentos que lo usan); `label` se puede cambiar libremente.

**Alternativas descartadas:**
- *Archivo compartido que importan cliente y servidor:* Vercel compila solo `client/`; leer un
  archivo de fuera depende de una opción del proyecto y es frágil. Y como se despliegan por
  separado, podrían desincronizarse igual.
- *Mantener las copias y comprobarlas con un script:* la duplicación sigue; solo avisa al
  olvidarla.

**Consecuencias:**
- Un grupo o tipo nuevo solo exige desplegar el servidor: el cliente lo muestra sin cambios.
- Una petición más al abrir un formulario o la lista de ejercicios (una por carga de la app).
  Las pantallas esperan a tenerla y muestran un error si falla.
- El valor por defecto del formulario de ejercicio nuevo (`Pecho`, `Pesas libres`) sigue escrito
  en el cliente; es válido mientras esos valores existan, y no se borran nunca.

---

## 0025 — Aviso de arranque en frío y 401 sin recarga

Fecha: 2026-11-22 · Estado: vigente · Bloque: 3

**Contexto:** Render (plan gratuito) apaga el servidor tras ~15 minutos sin uso y la siguiente
petición tarda 30-60 s. La app solo mostraba "Cargando..." o "Entrando..." y parecía rota. Además,
el interceptor 401 hacía `window.location.href = '/login'`, que recarga la app entera, y lo hacía
también ante un 401 de contraseña incorrecta.

**Decisión** (arquitectura acordada en el roadmap, concretada en el bloque):
- **Detección por tiempo:** los interceptores de axios cronometran cada petición; si alguna pasa
  de 4 s sin respuesta, el estado es "despertando" hasta que terminen todas las lentas.
- **Tablón fuera de React** (`utils/wakingUp.js`) leído con `useSyncExternalStore`
  (`useServerWakingUp`), y un componente `ServerWakingUp` en `PrivateRoute`, Login, Register y,
  flotante, en `Layout`.
- **Despertador:** la portada llama a `GET /api/health` al abrirse.
- **401 sin recarga:** el interceptor solo actúa si la petición llevaba token; borra el token y
  lo anuncia (`alCaducarSesion`). `AuthContext` hace `LOGOUT` y `PrivateRoute` redirige con
  React Router. `AuthProvider` está fuera de `BrowserRouter`, así que el interceptor no puede
  usar `navigate`; el anuncio evita reorganizar el enrutado.
- **Prueba en local:** `RETRASO_PRUEBA_MS` retrasa cada petición; se ignora siempre con
  `NODE_ENV=production`, aunque esté definida.

**Alternativas descartadas:**
- *Aviso desde la primera petición, sin umbral:* saldría en cada carga normal.
- *`timeout` de axios:* el servidor sí responde, solo tarda; cortar haría fallar el login.
- *`createBrowserRouter` para usar `router.navigate` en el interceptor:* rehacer el enrutado de
  `App.jsx` solo para esto.
- *Ping externo cada 10 minutos para que no se duerma:* un servicio más que mantener, y consume
  las horas gratuitas de Render.

**Consecuencias:**
- En una red muy lenta (más de 4 s por petición) también sale el aviso. El texto ("puede
  tardar") no es falso en ese caso.
- Una petición más por visita a la portada.
- El aviso flotante también cubre las pantallas privadas, más allá de lo acordado en el roadmap
  (que solo nombraba `PrivateRoute`, Login y Register): el caso de volver a la app tras un rato
  con la pestaña abierta también es un arranque en frío.
- Si el plan de Render cambia a uno sin suspensión, el aviso simplemente no aparecerá; no hay
  que quitar nada.

---

## 0026 — Progreso en el servidor: 1RM precalculado, % tipo bolsa e índice base 100

Fecha: 2026-11-22 · Estado: vigente · Bloque: 4 · Sustituye a: 0007

**Contexto:** el Dashboard descargaba todas las sesiones con sus series (2,7 MB con 10 años de
historial en el seed) y recalculaba Epley sobre cada serie en cada visita (0007). Además, la
métrica engañaba: el % era la *media de las variaciones* entre sesiones consecutivas
(100 → 200 → 100 daba +25 % aunque se acabara donde se empezó), y la línea del gráfico era la
media de los 1RM del día, dominada por los ejercicios pesados y por qué rutina tocaba.

**Decisión** (de David):
- **Epley se mantiene**, pero el 1RM se calcula **en el servidor, una vez, al guardar**:
  cada ejercicio de sesión guarda `mejor1RM` (null en tiempo/distancia). Una sola copia de la
  fórmula, `server/utils/unaRM.js`, usada por `create`, el seed y la migración
  (`npm run migrar:1rm`). Las series no se editan (no hay PUT), así que el valor no se desfasa.
- **`GET /api/progress?desde&hasta`** calcula el progreso leyendo solo fecha, `exerciseId` y
  `mejor1RM` del rango, con el índice `{ userId, fecha }`. Excluye los ejercicios borrados
  (0020) en el servidor. Acepta rango desde el principio para el selector del bloque 9.
- **% tipo bolsa:** del primer punto del rango al último, `(último / primero − 1) × 100`.
  Solo cuentan los ejercicios con al menos 2 puntos en el rango.
- **Índice base 100 para el grupo:** cada ejercicio vale 100 en su primer punto del rango; la
  línea es, en cada sesión, la media de los índices de los ejercicios ya empezados, y cada uno
  mantiene su último valor hasta que se vuelve a hacer. El último punto − 100 = % del grupo.

**Alternativas descartadas:**
- *Mantener la media de variaciones y cambiarla en el bloque 9:* calcular dos veces lo mismo,
  y la métrica antigua da números que no se corresponden con el progreso real.
- *Media de los 1RM del día para la línea:* la sentadilla pesa más que el curl y el día de
  piernas sube la línea aunque nadie haya progresado.
- *Calcular el 1RM al leer (agregación sobre las series) en vez de guardarlo:* repite en cada
  consulta un cálculo cuyo resultado no cambia nunca.

**Consecuencias:**
- Los porcentajes que se veían antes del bloque 4 cambian: miden otra cosa.
- **Límite del % tipo bolsa:** un día malo justo al principio o al final del rango mueve mucho
  el número. Usar el mejor 1RM de cada sesión (no la media de sus series) lo suaviza.
- **Límite del índice:** un ejercicio que empieza a mitad del rango entra con 100 y tira de la
  media hacia 100 ese día, aunque nadie haya empeorado.
- En rangos cortos puede no haber ningún ejercicio con 2 puntos (con 3 rutinas que rotan, una
  semana no repite ninguno): el grupo sale sin %. A tener en cuenta en el selector del bloque 9.
- Con el rango total, la línea tiene un punto por sesión (~1.400 en 10 años, 73 KB). Si el
  gráfico se vuelve lento, el bloque 9 puede agrupar puntos por semana en rangos largos.
- Si cambia la fórmula del 1RM, hay que recalcular `mejor1RM` en todas las sesiones con una
  migración.

---

## 0027 — Historial paginado por cursor

Fecha: 2026-11-22 · Estado: vigente · Bloque: 4

**Contexto:** `GET /api/sessions` devolvía todas las sesiones con sus series. Con el progreso ya
en el servidor (0026), solo lo usa el Historial, que no necesita más que las primeras.

**Decisión:**
- `GET /api/sessions?cursor=…&limite=…` devuelve 20 sesiones (máximo 50) y `siguienteCursor`,
  que señala la última enviada (`<fecha ISO>_<id>`); `null` cuando no hay más.
- El Historial muestra un botón **"Cargar más"** (de David).

**Alternativas descartadas:**
- *Paginación por número de página (`skip`):* si se guarda una sesión mientras el usuario mira
  el Historial, al pasar de página se repetiría una; y `skip` recorre todos los documentos
  saltados, cada vez más lento al avanzar.
- *Scroll infinito:* más complejo y más difícil de probar; se puede añadir encima del botón.

**Consecuencias:**
- Un cliente antiguo que espere la lista completa solo verá las 20 primeras. Durante el
  despliegue del bloque 4 hay un par de minutos así (aceptado por David).
- El orden desempata por `_id` cuando dos sesiones tienen la misma fecha; el índice
  `{ userId, fecha }` no lo incluye, pero los empates son raros y se resuelven en memoria.

---

## 0028 — Sin middleware de compresión: Render ya comprime

Fecha: 2026-11-23 · Estado: vigente · Bloque: entre el 4 y el 5

**Contexto:** tras el bloque 4 se valoró añadir el middleware `compression` de Express. Medido en
local, reducía la página del historial de 40,7 KB a 3,4 KB y el progreso total de 73,4 KB a
11,5 KB. Antes de subirlo se comprobó la producción: las respuestas de la API ya llegan con
`content-encoding: br`.

**Decisión** (de David): **no añadir `compression`.** Render ya comprime las respuestas en
producción, con Brotli, que comprime algo más que gzip.

**Alternativas descartadas:**
- *Añadirlo igualmente:* una dependencia más que en producción no cambia nada (el proxy de Render
  ve la respuesta ya comprimida y no la toca).
- *Añadirlo solo para desarrollo:* en local el servidor y el navegador están en la misma máquina;
  el tamaño de las respuestas no importa.

**Consecuencias:**
- La compresión depende de Render. Si se cambia de proveedor, hay que comprobar si comprime y,
  si no, añadir `compression` (una línea en `app.js`).
- Las mediciones en local (sin compresión) muestran los tamaños sin comprimir; los de producción
  son menores.

---

## 0029 — Serie anterior: última sesión con el ejercicio, guardada en la sesión activa

Fecha: 2026-11-23 · Estado: vigente · Bloque: 5

**Contexto:** durante el entreno no se veía qué se hizo la vez anterior en cada serie, que es lo
que se necesita para decidir el peso.

**Decisión** (de David):
- **"La vez anterior" = la última sesión guardada que incluye ese ejercicio, en cualquier
  rutina.** Sirve aunque el mismo ejercicio esté en varias rutinas.
- `GET /api/sessions/previous-sets?exerciseIds=…` devuelve sus series, con una consulta por
  ejercicio sobre un **índice nuevo `{ userId, ejercicios.exerciseId, fecha }`**. Sin él, un
  ejercicio que no se ha hecho nunca recorría todo el historial (1.402 sesiones examinadas en
  el seed de 10 años); con él, 0.
- La sesión activa lo pide **una vez** y lo guarda **dentro de sí misma** (localStorage): sigue
  disponible al recargar o sin cobertura. Si la petición falla, el entreno sigue sin "anterior"
  y se reintenta al volver a abrir la sesión.
- Se muestra como **texto de ayuda** en los campos vacíos, emparejando series por posición, en
  el color de texto secundario y en cursiva para que no se confunda con un valor escrito.
- **Atajo de repetir:** al marcar una serie como completada, cada campo vacío se rellena con el
  valor de la vez anterior; lo escrito no se toca.

**Alternativas descartadas:**
- *La última vez que se hizo la misma rutina:* no sirve si el ejercicio está en varias rutinas.
- *Una columna "Anterior" (como Strong o Hevy):* no cabe en el ancho de un iPhone con las
  columnas actuales de la serie.
- *Una petición por ejercicio o por serie:* hasta 10 peticiones al empezar, con la cobertura del
  gimnasio.
- *Sin índice nuevo:* la consulta de un ejercicio poco frecuente crecería con el historial (0015).

**Consecuencias:**
- Un índice más en `sessions` (multikey: una entrada por ejercicio de cada sesión). Ocupa poco
  y cada sesión guardada lo actualiza.
- Marcar una serie vacía por error la guarda con los valores anteriores (antes la guardaba
  vacía, que tampoco servía).
- Un ejercicio que se añada o reemplace a mitad de sesión no tendrá "anterior" hasta que se pida
  para él (bloque 6).
- Los ejercicios de cardio solo muestran peso y reps: depende de la deuda del cardio en la sesión
  activa.

---

## 0030 — Cardio bloqueado con "Próximamente" desde las opciones del servidor

Fecha: 2026-11-23 · Estado: vigente · Bloque: 5b

**Contexto:** la sesión activa solo tiene campos de peso y reps: los ejercicios de cardio
(tracking `tiempo_distancia`) se guardaban con peso y reps a 0. En vez de dejarlo solo como
deuda, David decidió bloquearlo en la app hasta implementarlo de verdad. El diagnóstico de
producción (`npm run diagnostico:cardio`) dio 66 ejercicios de cardio (los predefinidos de cada
usuario), 0 rutinas con cardio y 0 sesiones: el bloqueo no afecta a datos existentes.

**Decisión** (de David, tal como se propuso):
- **Un solo interruptor en el servidor:** la opción Cardio de `OPCIONES_TIPO` lleva
  `disponible: false`. El cliente lo recibe en `GET /api/exercises/opciones` (0024) y no tiene
  ninguna lista propia de lo bloqueado. Desbloquear = quitar ese campo.
- **Se bloquea el tipo Cardio**, no el tracking: es lo que el usuario elige y ya viaja en las
  opciones. En la práctica es lo mismo (0 ejercicios de tipo Cardio en otro grupo).
- **Guarda en el servidor:** crear un ejercicio con un tipo no disponible, o cambiarle el tipo
  a uno, da 400. Editar un cardio existente sin cambiar el tipo sigue permitido.
- **En la app**, etiqueta "Próximamente" (componente `Proximamente`): select con "Cardio
  (próximamente)" deshabilitado; etiqueta en la lista de ejercicios y en rutinas; en el catálogo
  de la rutina no se puede añadir; en la sesión activa la fila sale bloqueada, sin series, y no
  se guarda. El Historial no cambia.
- **La sesión activa guarda `bloqueado`** al empezar, en vez de consultarlo al pintar: las
  opciones se piden en cada carga de la app, y sin cobertura no se sabría qué bloquear.
- **Los presets de cardio se siguen clonando** a usuarios nuevos: se ven como "Próximamente" y
  estarán listos al desbloquear.

**Alternativas descartadas:**
- *Dejarlo solo como deuda:* la app permitía registrar cardio y lo guardaba con ceros.
- *Lista de bloqueados en el cliente:* dos sitios que tocar al desbloquear (0024).
- *No clonar los presets de cardio:* los usuarios que se registren mientras tanto no los tendrían
  nunca.
- *Guarda también en rutinas desde el servidor:* más lógica que tocar al desbloquear; la interfaz
  ya lo impide y una rutina con cardio no hace daño.

**Consecuencias:**
- El cardio no tiene bloque asignado en el roadmap; el análisis de cómo implementarlo está en la
  deuda de `CLAUDE.md`.
- Al desbloquear, las sesiones activas que estén en curso en ese momento siguen con la fila
  bloqueada (se decidió al empezar). Es un caso de minutos.
- Un ejercicio de tipo Cardio en otro grupo (que se mediría por 1RM) también queda bloqueado.

---

## 0031 — Sesión activa con `useReducer`

Fecha: 2026-11-23 · Estado: vigente · Bloque: 6

**Contexto:** `ActiveSession.jsx` (~620 líneas) cambiaba la sesión con `setSession` y varios
`map` anidados repartidos por el componente: escribir, marcar, añadir y quitar series, cargar la
serie anterior. Reemplazar un ejercicio iba a ser otro más.

**Decisión** (de David): todos los cambios de la sesión viven en una sola función pura,
`sesionReducer` (`client/src/utils/activeSessionReducer.js`), y el componente usa
`useReducer` y "cuenta lo que ha pasado" con `dispatch`.
- **Pura:** lo aleatorio o de tiempo (el id de una serie nueva) lo pone el componente en la
  acción. Devuelve copias, nunca modifica la sesión recibida.
- **Misma forma de datos que en localStorage** (requisito de David): no añade ni quita campos,
  así que una sesión a medias sobrevive al deploy.
- **Pruebas sin React:** `node src/utils/activeSessionReducer.test.js` (desde `client/`), con una
  sesión con la forma actual y otra de antes de los bloques 5 y 5b leídas como JSON.
- El temporizador de descanso sigue como estado de la pantalla: no es parte de la sesión.
- Se hizo como paso propio sin cambios visibles (6.1), comprobado antes de añadir funciones.

**Alternativas descartadas:**
- *Seguir con `useState`:* cada función nueva añadía otro `map` anidado en el componente y la
  lógica no se podía probar sin navegador.
- *Una librería de estado (Redux, Zustand):* dependencia nueva para un estado que vive en una
  sola pantalla.

**Consecuencias:**
- Las funciones nuevas de la sesión activa son una acción más en el reducer, con su prueba.
- El reducer se puede usar fuera de la pantalla: la página de reemplazar (0032) lo aplica sobre
  la sesión de localStorage.
- Una acción desconocida lanza un error: un `type` mal escrito se ve enseguida.

---

## 0032 — Reemplazar un ejercicio en la sesión activa

Fecha: 2026-11-23 · Estado: vigente · Bloque: 6

**Contexto:** si la máquina está ocupada o un ejercicio no se puede hacer ese día, había que
salir de la sesión o dejarlo vacío.

**Decisión** (de David):
- Botón **"Reemplazar ejercicio"** bajo las series, que abre una **página propia**
  (`/sessions/active/replace/:index`). Primero fue una ventana emergente; en el iPhone no cabía
  bien y se cambió a página completa.
- Catálogo con `ExercisePicker` (extraído de `WorkoutForm`, compartido): sin los ejercicios que
  ya están en la sesión y con el cardio como "Próximamente". **Tocar un ejercicio solo lo
  marca**; el reemplazo se hace con un botón "Reemplazar por «X»" pegado abajo (encima de la
  TabBar en el móvil), para que un toque por error al hacer scroll no cambie nada.
- El nuevo ocupa **el mismo sitio, con las mismas series** (mínimo 1) **y el mismo descanso**,
  y los campos vacíos. **La rutina no cambia**: solo esta sesión.
- **Lo hecho del ejercicio reemplazado se pierde, con confirmación antes** si había series
  hechas.
- La página lee la sesión de localStorage, aplica el reemplazo con `sesionReducer` (0031), la
  guarda y vuelve. Pide la serie anterior del ejercicio nuevo y espera como mucho 4 s; sin
  cobertura vuelve sin ella.

**Alternativas descartadas:**
- *No dejar reemplazar si hay series hechas:* obliga a desmarcarlas una a una.
- *Conservar lo hecho y añadir el nuevo debajo:* eso es "añadir ejercicio", otra función.
- *Valores por defecto (3 series, 90 s) para el nuevo:* el hueco de la rutina ya dice cuántas
  series y cuánto descanso tocan.
- *Ventana emergente:* primera versión; no se adaptaba al ancho de un iPhone.

**Consecuencias:**
- El temporizador de descanso no se guarda en localStorage, así que se pierde al ir a la página
  de reemplazar (igual que al salir de la sesión a cualquier otra pantalla).
- Si la carga inicial de la serie anterior había fallado, el ejercicio nuevo tampoco la recibe
  hasta que se reabra la sesión, que entonces las pide todas.

---

## 0033 — Calendario de días entrenados: mes y año, desde un endpoint de solo fechas

Fecha: 2026-11-23 · Estado: vigente · Bloque: 8

**Contexto:** no había forma de ver de un vistazo qué días se había entrenado. El historial
viene paginado y con series (0027): no sirve para pintar un calendario.

**Decisión** (de David):
- **`GET /api/sessions/days?desde&hasta&zona`** devuelve solo los días entrenados, cada uno
  con el id y el nombre de sus sesiones (sin series). Agrupa con `$dateToString` en la **zona
  horaria del usuario** (la envía el cliente): una sesión a las 00:30 en Madrid cuenta en ese
  día, no en el anterior UTC. Rango de un año como máximo: la respuesta no crece con el
  historial. Usa el índice `{ userId, fecha }` sin abrir ninguna sesión.
- **Calendario arriba del Historial, siempre desplegado**, con dos vistas:
  - **Mes:** rejilla de lunes a domingo, celdas de 44 px como máximo.
  - **Año:** mapa tipo GitHub, una columna por semana; en el móvil se desplaza en horizontal y
    empieza mostrando lo más reciente.
  - Las dos leen el mismo dato: los días de un año natural, pedidos una vez por año.
- **La tarjeta no cambia de tamaño:** las dos vistas están superpuestas en el mismo espacio
  (la inactiva, oculta) y el mes tiene siempre 6 filas. La lista de un día con varias sesiones
  aparece encima del calendario, no debajo.
- **Diseño alineado con la app:** cabecera como las tarjetas del Dashboard ("Días entrenados" y
  el número de sesiones a la izquierda, chips Mes / Año a la derecha), navegación ‹ periodo ›
  con las flechas en los bordes de la rejilla, celdas cuadradas con la misma separación en las
  dos direcciones.
- **Solo verdes del design system.** Se añaden a `variables.css` dos tokens de verde
  translúcido, `--color-accent-soft` (8 %) y `--color-accent-medium` (25 %), opacidades que ya
  se usaban sueltas en la app. Mes: círculos de cristal (una sesión, fondo suave; dos o
  más, fondo medio con borde y número en el acento). Año: casillas en verde medio o acento.
- **Tocar un día entrenado:** con una sesión abre su detalle; con varias, las lista debajo.
- Cabecera con "N sesiones" del mes o del año que se ve. Sin rachas.
- Rejillas calculadas con funciones puras (`utils/calendario.js`), sin librerías, con pruebas
  (`node src/utils/calendario.test.js`).

**Alternativas descartadas:**
- *Una librería de calendario:* dependencia nueva para unas rejillas de pocas líneas.
- *Calcularlo con la lista de sesiones:* paginada y con series; para un calendario bastan fechas.
- *Una página propia o el Dashboard:* el calendario es una forma de recorrer el historial.
- *Plegado por defecto:* primera versión; David lo prefirió siempre visible.

**Consecuencias:**
- Un año con ~150 sesiones son unos pocos KB; con más años solo se pide el que se mira.
- La racha de semanas seguidas queda para más adelante: necesitaría rangos de más de un año.

---

## 0034 — Grupos de progreso con rango, plegado y orden en el dispositivo

Fecha: 2026-11-23 · Estado: vigente · Bloque: 9

**Contexto:** el Dashboard solo mostraba "Todos", siempre con todo el historial. El modelo
`Chart` (grupo de ejercicios) y su CRUD existían en el servidor desde el principio, sin uso.

**Decisión** (de David):
- **Mismo cálculo para todos:** `GET /api/progress?grupo=<id>` aplica el cálculo de "Todos"
  (0026) solo a los ejercicios del grupo, que el servidor lee del propio grupo (no viajan desde
  el cliente). Un grupo ajeno da 404.
- **Línea reducida a ~150 puntos** en el servidor (último punto de cada tramo, más el primero),
  calculando el % con todos. La línea acaba donde la completa: último punto − 100 = %.
- **Crear y editar grupos en una página** (`/groups/new`, `/groups/:id/edit`), con
  `ExercisePicker`; borrar solo borra el grupo.
- **Dashboard:** una tarjeta por grupo (componente `GrupoProgreso`, también para "Todos"), con
  **selector de rango** 1S · 1M · 1A · 5A · 10A · Total (por defecto Total), **desplegable de
  la lista de ejercicios**, **plegado de la tarjeta entera** (quedan nombre y %) y **orden
  elegido por el usuario** (modo "Ordenar", con subir y bajar; "Todos" también se mueve).
- **Rango, plegados y orden se guardan en el dispositivo** (localStorage), no en el servidor:
  no tocan el modelo y "Todos" no es un `Chart`.
- **Grupo vacío:** la tarjeta dice "Este grupo no tiene ejercicios: edítalo"; no se borra.
- Los grupos se listan en orden de creación (el servidor ordenaba al revés y nadie lo usaba).

**Alternativas descartadas:**
- *Enviar la lista de ejercicios desde el cliente:* podría desincronizarse del grupo guardado.
- *Guardar rango, plegado y orden en el servidor:* sincronizaría dispositivos, pero exige
  preferencias de usuario además de campos en `Chart`. Se puede revisar en el bloque 12.
- *Arrastrar y soltar para ordenar:* necesita una librería y es más difícil con el dedo y el
  teclado; subir y bajar basta para unos pocos grupos.
- *Ventana para crear grupos:* en el iPhone no caben (lección del bloque 6).

**Consecuencias:**
- Cada tarjeta hace su propia petición: con 3 o 4 grupos, 3 o 4 peticiones pequeñas.
- En otro dispositivo, los grupos aparecen con el rango, el plegado y el orden por defecto.
- Con rangos cortos (1S) a menudo no hay % (ningún ejercicio con dos puntos); la tarjeta lo dice.
- Los estilos comunes de las páginas de formulario (rutinas y grupos) pasan a
  `styles/paginaFormulario.module.css`, como se hizo con `ExercisePicker`.

---

## 0035 — Límite de intentos en el login y el registro

Fecha: 2026-11-23 · Estado: vigente · Bloque: 11 (paso 11.1, adelantado al resto del bloque)

**Contexto:** el login no tenía ningún límite: cualquiera podía probar contraseñas contra una
cuenta sin parar. Tampoco el registro, que además clona 58 ejercicios por cuenta. Y el login de un
email inexistente respondía antes que el de una contraseña incorrecta (se saltaba bcrypt), así que
midiendo el tiempo se podía saber qué emails están registrados.

**Decisión** (de David, valores propuestos):
- **`express-rate-limit`** (dependencia nueva, la estándar en Express, sin dependencias propias),
  en `middlewares/limiteIntentos.js`:
  - login: **5 fallos cada 15 minutos por IP + email**; los aciertos no cuentan;
  - registro: **5 por hora por IP**;
  - respuesta 429 con el formato de error de la API y los minutos que faltan.
- **`trust proxy` a 1** (`TRUST_PROXY`), para que `req.ip` sea la IP real detrás del proxy de
  Render y no la del proxy para todos.
- **Tiempo constante:** si el email no existe, se compara contra un hash falso del mismo coste.

**Alternativas descartadas:**
- *Bloqueo por cuenta (contador en el usuario):* frena ataques desde muchas IP, pero cualquiera
  podría bloquear la cuenta de otro fallando a propósito.
- *Contadores en Redis:* necesario con varias instancias; con una sola, otro servicio que pagar y
  mantener.
- *CAPTCHA:* fricción para el usuario y un servicio externo; no hace falta con este volumen.

**Consecuencias:**
- Los contadores viven en memoria: un reinicio de Render los pone a cero.
- Un ataque repartido entre muchas IP no se frena con este límite.
- Si Render cambiara su número de proxies, `req.ip` sería incorrecta y el límite trataría a
  todos como una sola IP (el registro quedaría en 5 por hora para todo el mundo). Se vigila en
  los logs de Render y se corrige con `TRUST_PROXY`.

---

## 0036 — Mejoras de uso: crear desde el buscador, etiquetas, selector por pasos, arrastrar y cargas

Fecha: 2026-11-23 · Estado: vigente · Bloque: 9b

**Contexto:** tras los bloques de funciones, un repaso de cómo se usa la app en el gimnasio:
crear un ejercicio obligaba a salir de la rutina; dos ejercicios con el mismo nombre ("Press en
máquina" de pecho y de hombros) no se distinguían; el descanso se escribía en segundos; no había
forma de cambiar el orden de los ejercicios; y las esperas se veían como un "Cargando...".

**Decisión** (de David, punto por punto):
1. **Crear desde el buscador:** si lo buscado no existe (por nombre exacto), "+ Crear «…»" abre
   un mini formulario dentro de `ExercisePicker` (nombre ya escrito, grupo y tipo). El ejercicio
   creado se añade a la rutina, se marca en el grupo o queda elegido al reemplazar.
2. **"Pecho · Máquinas" bajo el nombre**, en gris (componente `NombreEjercicio`): buscador,
   rutina, sesión activa y Ejercicios. No en Historial ni Dashboard: las sesiones guardadas solo
   conservan el nombre. La sesión activa guarda grupo y tipo al empezar (campos opcionales en
   localStorage: las sesiones anteriores siguen funcionando).
3. **Selector por pasos** (`SelectorPasos`): descanso "− 1:30 +" en saltos de 15 s (se guardan
   segundos) y series "− 3 +", con los límites del modelo.
4. **Arrastrar para reordenar** con **dnd-kit** (`ListaOrdenable`): ejercicios de la rutina, de
   la sesión activa y grupos del Dashboard (sustituye a las flechas). Solo desde un asa ⋮⋮, para
   que en el iPhone el scroll siga funcionando; también con teclado y con avisos en español
   para lectores de pantalla. En la sesión activa, el temporizador y el ejercicio abierto siguen
   al ejercicio movido.
5. **Cargas:** esqueletos (`Esqueleto`, `ZonaCarga`) con brillo suave en Dashboard, Historial,
   Ejercicios y Rutinas; y un **ticker** (línea de cotización que se dibuja) en lugar del punto
   del servidor dormido. Los dos respetan "reducir movimiento" y usan tokens de `variables.css`.

**Alternativas descartadas:**
- *Crear el ejercicio en su página y volver:* se perdía lo hecho en la rutina.
- *Etiquetas como píldoras:* compiten con el nombre en filas estrechas.
- *Campo "mm:ss" o desplegable de valores fijos para el descanso:* fácil equivocarse al escribir
  en el móvil, o poco flexible.
- *Arrastre nativo de HTML5:* no funciona con el dedo en el iPhone. *react-beautiful-dnd:*
  abandonada. *SortableJS:* mueve el DOM por su cuenta y choca con React. *A mano:* cientos de
  líneas (scroll, accesibilidad, animación).
- *Indicador de velas o de "apertura de mercado":* el ticker es la gráfica del Dashboard en
  miniatura y se entiende mejor; el texto dice claramente qué pasa.

**Consecuencias:**
- Una dependencia más en el cliente (dnd-kit, ~15 KB comprimida).
- Las formas de la sesión activa en localStorage ganan dos campos opcionales y una acción más en
  el reducer (`moverEjercicio`), con sus pruebas.
- Formularios, detalle de sesión y la carga inicial de la app siguen con "Cargando...": no
  estaban en el alcance.

---

## 0037 — Token de acceso de 15 minutos en memoria y token de renovación en cookie httpOnly

Fecha: 2026-11-23 · Estado: vigente · Bloque: 11 (pasos 11.2 y 11.3) · Sustituye a: 0008

**Contexto:** un único JWT de 7 días guardado en `localStorage` (0008): si se filtraba (un XSS lo
leería), valía una semana entera y no había forma de revocarlo; "cerrar sesión" solo lo borraba
del navegador. El límite de intentos se hizo antes (11.1, 0035).

**Decisión** (de David, valores propuestos):
- **Token de acceso:** JWT de **15 minutos**, solo **en memoria** del cliente. La duración es
  una constante del código (`DURACION_ACCESO`); desaparece `JWT_EXPIRES_IN`.
- **Token de renovación:** aleatorio de 256 bits, **30 días**, en una **cookie httpOnly**
  (`Secure` en producción, `SameSite=Lax`, `Path=/api/auth`). En la base solo su huella SHA-256,
  con índice TTL que borra los caducados.
- **Rotación:** cada token de renovación sirve una vez; renovar da uno nuevo de la misma
  **familia**. **Margen de gracia de 30 s** para dos renovaciones casi simultáneas (dos
  pestañas); fuera de él, un token gastado que reaparece se trata como robado y se borra su
  familia entera.
- **Endpoints:** `POST /api/auth/refresh` y `POST /api/auth/logout` (revoca la sesión de este
  dispositivo). Login y registro emiten los dos tokens.
- **Cliente:** renueva al abrir la app; ante un 401 con token, renueva **una vez** (las
  peticiones que fallan a la vez comparten esa renovación) y repite la petición; si no puede,
  cierra la sesión. La intro usa un indicador sin datos (`yieldfit_con_sesion`).
- **API en `api.yieldfit.app`** (antes `yieldfit.onrender.com`): mismo sitio que la app, para
  que el navegador (Safari incluido) envíe la cookie.
- **Despliegue:** cambio de `JWT_SECRET` en Render, para invalidar los tokens de 7 días ya
  emitidos. Todos los usuarios vuelven a iniciar sesión una vez (aceptado por David).

**Revisión de BREACH** (pendiente desde la 0028 para cuando la auth usara cookies): BREACH deduce
un secreto midiendo el tamaño de respuestas **comprimidas** (Render comprime con Brotli) en las
que aparecen a la vez el secreto y texto que controla el atacante, y para eso necesita que el
navegador de la víctima haga esas peticiones con sus credenciales desde otra web.
- La cookie es `SameSite=Lax`: el navegador no la envía en peticiones POST desde otros sitios, y
  `/refresh` y `/logout` son POST. Una web ajena no puede provocar respuestas autenticadas.
- La única respuesta con un secreto ligado a la cookie es `/refresh` (el token de acceso), y no
  refleja nada que envíe el cliente.
- El resto de la API se autentica con la cabecera `Authorization`, que el navegador nunca añade
  solo.
- **Conclusión: BREACH sigue sin aplicar.** Revisar si algún día una respuesta autenticada
  refleja texto de la petición junto a un secreto, o si la cookie dejara de ser `SameSite`.

**Alternativas descartadas:**
- *Rotación estricta sin margen:* abrir la app con dos pestañas cerraría la sesión.
- *Token de renovación en `localStorage`:* un XSS lo leería, que es justo lo que se quiere evitar.
- *Sesiones en el servidor (cookie de sesión clásica):* una consulta a la base en cada petición
  para leer la sesión, y no encaja con la app de iPhone del bloque 12.
- *Mantener `yieldfit.onrender.com`:* sería otro sitio para el navegador y Safari bloquearía la
  cookie.

**Consecuencias:**
- Un token de acceso robado vale como mucho 15 minutos; cerrar sesión ya revoca de verdad.
- Abrir la app hace una petición más (`/refresh`) antes de mostrar nada.
- Una colección nueva (`refreshtokens`) que no crece: el TTL borra lo caducado.
- La app de iPhone (bloque 12) necesitará el token de renovación fuera de la cookie
  (almacenamiento seguro nativo).
- En local, `DURACION_ACCESO_PRUEBA` acorta el token de acceso para probar la renovación; se
  ignora en producción.

---

## 0038 — La IP real detrás de Render: `trust proxy` a 3

Fecha: 2026-11-23 · Estado: vigente · Bloque: 11 · Corrige: 0035 (solo el valor de `trust proxy`)

**Contexto:** con el login y la cookie ya en producción (0037), los logs de Render mostraban como
IP de cada petición una IP interna de Render (`10.x`), igual para todos. Con `trust proxy` a 1
(0035), el límite de intentos trataba a todos los usuarios como una sola IP: en la práctica, el
del login quedaba por email y el del registro, 5 por hora **para todo el mundo**.

**Cómo se averiguó** (sin suponer): un endpoint temporal, solo de lectura y sobre la propia
petición, devolvía las cabeceras de IP y qué daría `req.ip` con cada valor de `trust proxy`. Se
desplegó, se probó y se quitó en cuanto el arreglo quedó comprobado. Resultado:
- Entre el usuario y Express hay **tres proxies**: Cloudflare, la red interna de Render y un
  proxy local en la misma máquina (la conexión llega de `::1`). Cada uno añade al final de
  `X-Forwarded-For` la IP que ve.
- Las IP de Cloudflare y de Render cambian entre peticiones; el **número de saltos**, no.
- Un `X-Forwarded-For` falso enviado por el cliente queda **al principio** de la lista, por
  delante de su IP real.

**Decisión** (de David): **`trust proxy` a 3**, como valor por defecto en el código
(`TRUST_PROXY` sigue permitiendo cambiarlo sin desplegar). Express cuenta tres saltos desde el
final y se queda con el siguiente, la IP del usuario; lo que el cliente escriba queda por delante
y se ignora. El limitador y morgan usan `req.ip`, así que no cambian. Comprobado en producción:
con `X-Forwarded-For: 1.2.3.4`, `req.ip` es la IP real, y los logs de Render muestran la IP real.

**Alternativas descartadas:**
- *Leer `CF-Connecting-IP`* (la pone Cloudflare con la IP del usuario): no depende del número de
  saltos, pero obliga a cambiar la clave del limitador y el formato de morgan, y no se comprobó
  que Cloudflare sustituya un valor falso enviado por el cliente. Ese Cloudflare es de Render, no
  nuestro: no controlamos su configuración.
- *Confiar en rangos de IP* (privados y los de Cloudflare): habría que mantener a mano la lista de
  rangos de Cloudflare.

**Consecuencias:**
- Los límites de la 0035 funcionan por fin por IP real.
- **Depende de que Render mantenga tres proxies.** Con uno más, `req.ip` sería una IP de
  Cloudflare (límites compartidos otra vez); con uno menos, sería lo que mande el cliente
  (falsificable, y el límite se saltaría cambiando la cabecera). Se vigila en los logs de Render y
  se corrige con `TRUST_PROXY`. La prueba para repetirla está en `docs/auth.md`.

---

## 0039 — Los backups se rotan: se conservan los 3 últimos

Fecha: 2026-11-23 · Estado: vigente · Bloque: 11b · Matiza a: 0018

**Contexto:** `backup.sh` (0018) nunca borraba backups antiguos. Con la beta (11b), la app guarda
datos de otras personas y permite borrar la cuenta (11b.4): esos datos desaparecían de producción
al momento, pero seguían para siempre en los backups del portátil. La nota de privacidad (11b.6)
tenía que decirlo sin plazo.

**Decisión** (de David): al terminar un backup que ha pasado todas sus comprobaciones,
`backup.sh` conserva los **3 últimos backups completos** (con archivo y huella) y borra los más
antiguos, y también los que fallaron a medias. Función `rotar_backups` en
`scripts/lib/rotacion.sh`, con su prueba (`rotacion.test.sh`) sobre carpetas falsas. Con la
rutina mensual, los datos de una cuenta borrada desaparecen de los backups en unos 3 meses, y la
nota de privacidad lo dice así.

**Alternativas descartadas:**
- *Borrar por antigüedad (más de 3 meses):* si un mes no se hace backup, podría dejar el
  portátil sin ninguna copia. Conservar los N últimos nunca deja menos de N.
- *Contar también los incompletos para los 3:* una copia rota podría ocupar el sitio de una buena.
- *Borrar a mano:* depende de acordarse, y la nota de privacidad no podría prometer un plazo.

**Consecuencias:**
- El plazo de "unos 3 meses" depende de seguir haciendo un backup al mes: si se dejan de hacer,
  los últimos se quedan.
- Antes de una migración hay que hacer un backup (0018) y eso también rota: tras varios backups
  seguidos el mismo día, los anteriores ya no están. Para guardar uno a largo plazo, hay que
  copiarlo fuera de `~/yieldfit-backups`.
- La segunda copia opcional (`BACKUP_COPIA_DIR`, desactivada por la 0019) no se rota.
- Sigue pendiente sacar los backups del portátil (revisión prevista en la 0018; deuda en
  CLAUDE.md).

---

## 0040 — Rol de admin asignado por script y página `/developer`

Fecha: 2026-11-23 · Estado: vigente · Bloque: 11b (pasos 11b.1 y 11b.3)

**Contexto:** para pasar la app a conocidos (beta cerrada), David necesita ver los reportes de
fallos y quién usa la app, sin dar ese acceso a nadie más.

**Decisión** (de David):
- Campo `rol` (`usuario` | `admin`) en `User`, que **ninguna ruta de la API acepta**: se asigna con
  `npm run admin -- correo` (simulación por defecto; en producción, procedimiento de reparaciones).
- `requireAdmin` va tras `requireAuth`, que ya lee el usuario de la base en cada petición: quitar
  el rol tiene efecto al momento. El cliente oculta la página, pero quien decide es el servidor (403).
- `ultimoAcceso`, guardado al registrarse, entrar y renovar, como mucho una vez por hora.
- `/api/admin` (reportes y usuarios) es la **única excepción** a "toda consulta filtra por
  `userId`": devuelve solo nombre, email, registro, último acceso, rol y recuentos, con la lista de
  campos escrita a mano (nunca nacimiento, peso, altura ni género).
- Página `/developer` (reportes con filtros y cursor, usuarios, hueco para la documentación),
  accesible desde Perfil solo para el admin.

**Alternativas descartadas:**
- *Endpoint para dar el rol:* el único obstáculo para hacerse admin sería un fallo en esa ruta.
- *Lista de emails admin en una variable de entorno:* el rol no se vería en la base y cambiarlo
  exigiría redesplegar.
- *Actualizar el último acceso en `requireAuth`:* una escritura por petición para un dato que
  basta con una hora de margen.

**Consecuencias:**
- El panel de usuarios es una lista limitada a 200 (dice el total); con más usuarios habrá que
  paginarla.
- La página de documentación queda para más adelante (leída de GitHub, sin copias).

---

## 0041 — Reportes de fallos desde un botón flotante

Fecha: 2026-11-23 · Estado: vigente · Bloque: 11b (paso 11b.2)

**Contexto:** en la beta, los conocidos necesitan una forma fácil de contar fallos, con los datos
técnicos que hacen falta para reproducirlos.

**Decisión** (de David):
- Botón con un bichito en todas las pantallas con sesión: en el móvil, **círculo abajo a la
  derecha por encima de las barras** (opción C; dos alturas, normal y elevada si hay MiniSession o
  "Reemplazar", definidas en un solo sitio); en escritorio, píldora "Reportar".
- Hoja con "¿Qué ha fallado?", "¿Qué estabas haciendo?" y, **a la vista**, lo que se envía solo
  (pantalla, navegador y sistema, tamaño de la ventana). El navegador lo toma el servidor de la
  cabecera `User-Agent`.
- `BugReport`, `POST /api/reports`, 5 por hora por usuario; solo texto, nunca capturas.
- Al borrar una cuenta se borran sus reportes (la privacidad va primero).

**Alternativas descartadas:**
- *Pestaña lateral a media altura (A/B):* menos reconocible que el círculo.
- *Servicio externo de reporte de errores:* datos de terceros y otra pieza que mantener.
- *Captura de pantalla automática:* binarios fuera de lugar en MongoDB y posibles datos de otros.

**Consecuencias:**
- Si se añade otra barra fija abajo, hay que revisar las alturas del botón y
  `utils/barrasInferiores.js`.
- Solo bugs; las ideas pueden llegar más adelante.

---

## 0042 — Borrar la cuenta con todos sus datos, y el dispositivo al cerrar sesión

Fecha: 2026-11-23 · Estado: vigente · Bloque: 11b (paso 11b.4)

**Contexto:** no había forma de borrar una cuenta desde la app; se borraron 4 usuarios a mano y
quedaron sus datos huérfanos. Además, cerrar sesión dejaba en el dispositivo el entreno a medias y
las preferencias, a la vista de quien entrara después.

**Decisión** (de David):
- `DELETE /api/auth/me` **pidiendo la contraseña otra vez** (403 si no es correcta, no 401: un 401
  haría que el cliente renovara y cerrara la sesión), con límite de 5 fallos cada 15 minutos.
- En una **transacción** se borran el usuario y todos los documentos con su `userId`
  (`MODELOS_DEL_USUARIO`); `borrarCuenta.test.js` falla si un modelo con `userId` no está en la lista.
- En el dispositivo se borran todas las claves `yieldfit_` de localStorage, por prefijo.
- **Cerrar sesión también borra el dispositivo**, avisando antes si hay un entreno sin terminar.
  Cuando la sesión caduca sola no se borra nada.

**Alternativas descartadas:**
- *Borrado "blando" (marcar la cuenta como borrada):* los datos seguirían ahí.
- *Borrar clave a clave en el dispositivo:* una clave nueva se quedaría sin borrar.

**Consecuencias:**
- Los datos pueden seguir en los backups como mucho unos 3 meses (0039).
- Los huérfanos antiguos siguen pendientes en la deuda.

---

## 0043 — Contraseña: cambiarla, restablecerla por script y recuperarla por email con Resend

Fecha: 2026-11-23 · Estado: vigente · Bloque: 11b (pasos 11b.5 y 11b.5b)

**Contexto:** no se podía cambiar la contraseña, y quien la olvidaba no tenía salida. El plan
inicial era un script ahora y el email "cuando la app saliera de la beta"; David decidió adelantar
el email a la beta.

**Decisión** (de David):
- **Cambiarla en Perfil** pidiendo la actual (límite compartido con borrar la cuenta). Cierra las
  sesiones de los demás dispositivos.
- **`npm run restablecer -- correo`** como plan B: contraseña temporal aleatoria, mostrada una vez.
- **"¿Olvidaste tu contraseña?" por email**, enviado con **Resend** desde
  `no-responder@mail.yieldfit.app` (subdominio, región Irlanda, SPF, DKIM y DMARC comprobados):
  - enlace de un solo uso, 30 minutos, guardado como huella SHA-256, con el token detrás de `#`;
  - misma respuesta exista o no la cuenta, enviada **antes** de buscarla;
  - 3 por hora por email y 5 por IP; al restablecerla se cierran todas las sesiones y se va al login;
  - aviso "Tu contraseña ha cambiado" al restablecerla y al cambiarla en Perfil.
- Envío con `fetch` (sin la librería de Resend); sin clave, en local, modo consola.

**Alternativas descartadas:**
- *Brevo, Postmark o Amazon SES:* Resend es la configuración más sencilla y su plan gratuito
  (100 al día) sobra para la beta.
- *Iniciar sesión directamente tras restablecer:* ir al login confirma que la nueva funciona.

**Consecuencias:**
- La cuenta de Resend está en EE. UU. (lo dice la nota de privacidad).
- El registro sigue revelando si un email existe (409); ocultarlo exigiría confirmar el email.
- En producción, el servidor no arranca sin `RESEND_API_KEY`, `EMAIL_REMITENTE` y `APP_URL`.

---

## 0044 — Nota de privacidad informativa, pública y sin email de contacto

Fecha: 2026-11-23 · Estado: vigente · Bloque: 11b (paso 11b.6)

**Contexto:** antes de pasar la app a conocidos, tienen que poder saber qué se guarda de ellos.

**Decisión** (de David): página pública `/privacidad`, enlazada desde el registro y Perfil, en
lenguaje llano y sin email de contacto: qué se guarda y para qué, quién lo ve (incluido el panel de
admin y el acceso a la base), dónde (Render en Frankfurt, Atlas en París, Vercel, Resend, backups
en el portátil) y qué puede hacer el usuario. El texto está solo en la página;
`docs/privacidad.md` dice cuándo hay que actualizarla.

**Alternativas descartadas:**
- *Un texto legal completo:* desproporcionado para una beta entre conocidos.
- *El texto también en `/docs`:* dos versiones que acabarían contradiciéndose.

**Consecuencias:**
- Si la app se abre al público, hay que revisarla con alguien que sepa de RGPD.
- Cualquier dato, servicio o cambio de quién ve qué obliga a actualizar la página y su fecha.

---

## 0045 — Data router y aviso de cambios sin guardar

Fecha: 2026-11-24 · Estado: vigente · Bloque: 11b (paso 11b.7)

**Contexto:** al pulsar volver en un formulario a medias, se perdía todo sin avisar. Con
`<BrowserRouter>`, React Router no permite frenar una navegación.

**Decisión** (de David):
- El router pasa a **`createBrowserRouter`** (mismas rutas, en su propio commit sin cambios
  visibles), que permite `useBlocker`.
- `useAvisoSalir`: `useBlocker` para la navegación dentro de la app, el atrás del navegador y el
  gesto de deslizar; `beforeunload` para cerrar o recargar. Solo si `hayCambios` (foto inicial
  contra estado actual, con pruebas). Formularios de rutina, ejercicio y grupo, y el registro.
- **Sin borrador automático** por ahora.

**Alternativas descartadas:**
- *Avisar solo con la flecha de la app:* dejaba fuera el menú, el atrás y el gesto.
- *Borrador automático:* más código y conflictos al editar; los formularios son cortos.

**Consecuencias:**
- Cerrar Safari en el iPhone sigue perdiendo los cambios (Safari no muestra ese aviso).
- En Safari del iPhone, el gesto de deslizar anima la vuelta antes de que aparezca el aviso.

---

## 0046 — Filas de botones que se apilan (`GrupoBotones`) y responsive obligatorio

Fecha: 2026-11-24 · Estado: vigente · Bloque: 11b

**Contexto:** a 375 y 390 px, el `ConfirmDialog` sacaba de su recuadro botones como "Salir sin
guardar", y en el registro la fila de peso y altura se salía de la pantalla. Cada página montaba
su propia fila de botones, y Perfil tenía un apaño por ancho de pantalla.

**Decisión** (de David): arreglarlo en los componentes comunes:
- **`GrupoBotones`**: si los botones no caben en una línea, se apilan a ancho completo, con la
  acción principal arriba (`flex-wrap: wrap-reverse`), sin depender de un ancho fijo.
- `Button` sin `nowrap`; `Input` y `Select` con ancho completo y `min-width: 0`.
- **Regla:** todo cambio de interfaz se comprueba a 375 y 390 px (y en escritorio), medido en el
  navegador; los fallos se arreglan en el componente común.

**Alternativas descartadas:**
- *Media queries por página:* cada formulario nuevo repetiría el problema.

**Consecuencias:**
- Dos o más botones juntos van siempre en `GrupoBotones`.

---

## 0047 — Design system Premium como tema único y fuente de verdad del diseño

Fecha: 2026-11-24 · Estado: vigente · Bloque: 9c

**Contexto:** el diseño vivía en `variables.css` y en un archivo de Figma que ya no se mantenía.
David preparó un design system de Yield Fit en un artefacto de claude.ai, sacado del código real,
con dos temas: "Oscuro" (los valores de la app) y "Premium" (una propuesta de refinado: mismo
concepto, menos volumen).

**Decisión** (de David):
- **Fuente de verdad del diseño:** el design system del artefacto (`project/README.md`,
  `tokens.json`, los README de cada componente y `bundle.css`). Figma queda como referencia
  histórica.
- **Tema único Premium**, con sus valores directamente en `:root`, sin conmutador de tema.
- Lo que más cambia: el botón principal pasa a `color-action` (blanco roto) y el verde queda para
  datos, estados, selección y foco; el rojo pasa de `#FF3000` a `#dc6b67`, siempre tonal; las
  superficies van por niveles y las cifras usan Geist Mono.
- Componente nuevo `Metrica`, usado en una fila de resumen del Dashboard ("Progreso" y "Sesiones"
  del grupo "Todos", con datos que el servidor ya devuelve).
- Los rgba sueltos y los colores de las gráficas de Recharts pasan a tokens cuando coinciden en
  valor y en uso.

**Alternativas descartadas:**
- *Dos temas con conmutador:* la app nunca ha tenido otro tema; duplicaría cada valor sin que
  nadie lo pida.
- *Seguir con Figma como fuente:* estaba desactualizado y no tenía los tokens nuevos.
- *Monoespaciada del sistema en lugar de Geist Mono:* se ve distinta en cada dispositivo.
- *`Metrica` en la cabecera de cada grupo:* una tarjeta dentro de otra, con una gráfica repetida.

**Consecuencias:**
- Un cambio visual grande en toda la app (botón principal blanco, rojo apagado).
- Una dependencia más en el cliente (`@fontsource-variable/geist-mono`).
- El Dashboard hace una petición más al endpoint de progreso para la fila de resumen.
- Si el artefacto cambia, `variables.css` se actualiza a mano desde él: no hay sincronización
  automática.

---

## 0048 — Ajustes al tema Premium: botón verde, rojo más vivo, botones de icono y portada en negro puro

Fecha: 2026-11-24 · Estado: vigente · Bloque: 9c · Matiza a: 0047

**Contexto:** al ver el tema Premium aplicado (0047), David pidió cambiar cuatro cosas. El design
system del artefacto es la fuente de verdad, así que se actualizó también, para que diga lo mismo
que el código.

**Decisión** (de David):
- **Botón principal verde** en toda la app: `color-action`, `color-action-hover` y
  `color-on-action` apuntan a `color-accent`, `color-accent-hover` y `color-accent-text`. El
  Premium original lo ponía en blanco roto.
- **Rojo más vivo, `#ec5850`** (80 % de saturación, 5,5:1 sobre `surface-1`) en lugar de
  `#dc6b67`: `color-error`, `chart-loss` y los rojos translúcidos del botón de peligro (8, 14 y 24 %).
- **`BotonIcono`**: los botones de volver, avanzar, abrir y cerrar dejan de ser cuadrados con
  borde. Círculo de 40 px para navegar (volver en las cabeceras, flechas del calendario); sin fondo
  dentro de las tarjetas (plegar un grupo, cerrar el panel del día). Zona táctil de 48 px en los
  dos. Iconos SVG de trazo 1.5, también el "×".
- **Negro puro en la portada sin sesión y en la intro**: no usan el negro del tema (`#08090a`).

**Alternativas descartadas:**
- *Botón principal en blanco roto (Premium original):* a David no le encaja con la marca.
- *Rojos más vivos (`#f04b43`) o el antiguo `#FF3000`:* demasiado chillones junto al verde.
- *Todos los botones de icono circulares, o todos sin fondo:* más volumen dentro de las tarjetas,
  o un botón de volver que se ve menos.
- *Verde solo en las pantallas de entrada:* dos criterios para el mismo botón.

**Consecuencias:**
- El tema de la app ya no es el Premium tal cual: es el Premium con estos ajustes, y el artefacto
  lo refleja.
- La portada mantiene sus colores originales; sus `rgba` sueltos quedan fuera de la limpieza.
