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
| 0005 | Cascada `$pull` al borrar un ejercicio | vigente |
| 0006 | `tracking` persistido y derivado en `pre('save')` | vigente |
| 0007 | 1RM estimado con Epley, calculado en el cliente | vigente |
| 0008 | JWT de 7 días en `localStorage` | vigente |
| 0009 | Sesión activa persistida en `localStorage` | vigente |
| 0010 | CSS Modules + tokens en `variables.css` | vigente |
| 0011 | Fondos WebGL copiados de React Bits | vigente |
| 0012 | Repo público y documentación sin secretos | vigente |
| 0013 | Documentación con VitePress en `/docs` | sustituida por 0016 |
| 0014 | Conventional Commits en español y Git con confirmación | vigente |
| 0015 | Principio de estabilidad a largo plazo | vigente |
| 0016 | Documentación en Markdown en `/docs`, leída en GitHub | vigente |

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

Fecha: anterior a la entrega (≤ 2026-07) · Estado: vigente · Bloque: —
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

Fecha: anterior a la entrega (≤ 2026-07) · Estado: vigente · Bloque: —
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

Fecha: anterior a la entrega (≤ 2026-07) · Estado: vigente · Bloque: —
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
