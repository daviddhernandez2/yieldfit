# Modelo de datos

[← Índice](README.md)

Cinco colecciones en MongoDB (una por modelo de Mongoose en `server/models/`). La regla de
diseño ([0003](../DECISIONS.md)): **embeber lo que se lee junto al padre y referenciar lo que
existe de forma independiente**.

## Diagrama

Las entidades marcadas como *embebido* no son colecciones: viven dentro del documento padre.

```mermaid
erDiagram
    User ||--o{ Exercise : "tiene (userId)"
    User ||--o{ Workout : "tiene (userId)"
    User ||--o{ Session : "tiene (userId)"
    User ||--o{ Chart : "tiene (userId)"
    User ||--o{ BugReport : "envía (userId)"
    User ||--o{ PasswordReset : "pide (userId)"

    Workout ||--|{ WorkoutExercise_embebido : "ejercicios[]"
    Session ||--|{ SessionExercise_embebido : "ejercicios[]"
    SessionExercise_embebido ||--|{ Set_embebido : "sets[]"

    WorkoutExercise_embebido }o--|| Exercise : "exerciseId"
    SessionExercise_embebido }o--|| Exercise : "exerciseId"
    Session }o--o| Workout : "workoutId (opcional)"
    Chart }o--o{ Exercise : "exerciseIds[]"

    User {
        string email UK "único, minúsculas"
        string password "hash bcrypt, nunca sale en JSON"
        string nombreCompleto
        date fechaNacimiento
        number peso "opcional"
        number altura "opcional"
        string genero "enum, opcional"
        string rol "usuario | admin, por defecto usuario"
        date ultimoAcceso "opcional"
    }
    Exercise {
        ObjectId userId FK "indexado"
        string nombre
        string grupoMuscular "enum"
        string tipo "enum"
        string tracking "1RM o tiempo_distancia, derivado"
    }
    Workout {
        ObjectId userId FK "indexado"
        string nombre
    }
    WorkoutExercise_embebido {
        ObjectId exerciseId FK
        number numSeries "1-20"
        number descansoSegundos "0-900"
        number orden
    }
    Session {
        ObjectId userId FK
        ObjectId workoutId FK "opcional"
        string nombre
        date fecha "índice userId + fecha"
        number duracionSegundos
    }
    SessionExercise_embebido {
        ObjectId exerciseId FK
        string nombreSnapshot "copia al guardar"
        string trackingSnapshot "copia al guardar"
        number mejor1RM "calculado al guardar; null en cardio"
        number descansoSegundos
        number orden
    }
    Set_embebido {
        number numeroSerie
        number peso
        number reps
        number tiempoSegundos
        number distanciaMetros
        number rpe "0-10"
    }
    Chart {
        ObjectId userId FK "indexado"
        string nombre
    }
    BugReport {
        ObjectId userId FK "índice con createdAt"
        string descripcion "obligatorio, ≤2000"
        string contexto "opcional, ≤1000"
        string ruta
        string navegador "User-Agent de la petición"
        object pantalla "ancho, alto"
        string estado "pendiente | resuelto"
    }
```

Todos los modelos tienen además `createdAt` y `updatedAt` (`timestamps: true`).

## Modelos

### User
- La contraseña se hashea con bcrypt en `pre('save')`, solo si ha cambiado (`isModified`).
- `toJSON` borra `password`, así que nunca sale en una respuesta de la API.
- `comparePassword()` se usa en el login (ver [auth.md](auth.md)).
- `rol` (`usuario` | `admin`, bloque 11b): ninguna ruta de la API lo acepta; se asigna con
  `npm run admin` ([operaciones.md](operaciones.md)). Los usuarios anteriores no tienen el campo:
  Mongoose les aplica `usuario` al leerlos.
- `ultimoAcceso`: se guarda al registrarse, iniciar sesión y renovar el token, como mucho una vez
  por hora (`utils/ultimoAcceso.js`), sin tocar `updatedAt`.
- **Borrar la cuenta** (bloque 11b, [auth.md](auth.md#borrar-la-cuenta)) borra en una transacción
  el usuario y todos los documentos con su `userId` en las demás colecciones.

### Exercise
- **Por usuario:** al registrarse, se clonan 58 presets de `server/data/exercisePresets.js`
  ([0002](../DECISIONS.md)).
- `grupoMuscular` y `tipo` son enums. Sus valores, con el texto que ve el usuario, viven
  **solo** en `models/Exercise.js` (`OPCIONES_GRUPO_MUSCULAR`, `OPCIONES_TIPO`). El cliente los
  pide a `GET /api/exercises/opciones` con el hook `useOpcionesEjercicio`
  ([0024](../DECISIONS.md)):

```mermaid
flowchart LR
    M["models/Exercise.js<br/>OPCIONES_* { value, label }"] -->|"enum"| S["schema de Exercise<br/>(valida al guardar)"]
    M -->|"GET /api/exercises/opciones"| H["useOpcionesEjercicio<br/>(una petición por carga)"]
    H --> F1["ExerciseForm<br/>selects"]
    H --> F2["WorkoutForm<br/>chips de grupo"]
    H --> F3["Exercises<br/>filtros + columna Tipo"]
```

  `value` es lo que se guarda y no se cambia nunca; `label` es solo presentación (por eso
  `Maquinas` se muestra como "Máquinas"). Una opción con `disponible: false` (hoy, Cardio) se
  muestra como "Próximamente" y no se puede elegir ([0030](../DECISIONS.md)).
- `tracking` no lo elige el usuario: lo calcula `pre('save')` ([0006](../DECISIONS.md)).

```mermaid
flowchart LR
    A{"grupoMuscular = Cardio<br/>y tipo = Cardio?"}
    A -- sí --> B["tracking = tiempo_distancia"]
    A -- no --> C["tracking = 1RM"]
```

La regla vive en una sola función, `derivarTracking`, exportada desde `models/Exercise.js`. La
usan el `pre('save')` y el clonado de presets (`utils/presets.js`). El clonado no puede depender
del middleware porque usa `insertMany`, que no ejecuta `pre('save')`.

### Workout
Plantilla de rutina. `ejercicios[]` embebido, con al menos 1 elemento (validador del schema).

### Session
Entrenamiento realizado.
- `ejercicios[]` (al menos 1) y, dentro de cada uno, `sets[]` (al menos 1).
- **Snapshots** ([0004](../DECISIONS.md)): al crear la sesión, el controlador lee cada
  `Exercise` y copia `nombre → nombreSnapshot` y `tracking → trackingSnapshot`. Así, renombrar
  un ejercicio no cambia el historial.
- **No se editan:** no hay `PUT /api/sessions/:id`. El que había regeneraba los snapshots con
  los nombres actuales y el cliente nunca lo usó; se eliminó en el bloque 1. Una sesión solo se
  crea o se borra.
- **`mejor1RM`** en cada ejercicio ([0026](../DECISIONS.md)): el mejor 1RM estimado (Epley) de sus
  series, calculado una vez al guardar con `utils/unaRM.js`; null en tiempo/distancia. Las
  sesiones anteriores al bloque 4 lo recibieron con `npm run migrar:1rm`.
- **Índice `{ userId: 1, fecha: -1 }`:** lo usan las dos consultas que crecen con el historial:
  la lista paginada (`GET /api/sessions`, de la más reciente a la más antigua) y el progreso de
  un rango (`GET /api/progress`).
- **Índice `{ userId: 1, 'ejercicios.exerciseId': 1, fecha: -1 }`** ([0029](../DECISIONS.md)):
  la serie anterior (`GET /api/sessions/previous-sets`) busca la última sesión con cada
  ejercicio. Es multikey: una entrada por ejercicio de cada sesión. Sin él, un ejercicio que no
  se ha hecho nunca recorría todo el historial.

#### Cómo se calcula el progreso

`GET /api/progress?desde&hasta` lee solo fecha, `exerciseId` y `mejor1RM` de las sesiones del
rango, y `utils/progreso.js` calcula:

```mermaid
flowchart LR
    S["sesiones del rango<br/>(fecha, exerciseId, mejor1RM)"] --> P["puntos por ejercicio<br/>(mejor por sesión;<br/>sin borrados ni cardio)"]
    P --> E["% por ejercicio<br/>último / primero − 1"]
    P --> I["índice base 100<br/>media de los índices,<br/>cada uno con su último valor"]
    E --> G["% del grupo<br/>media de los %"]
    I --> L["línea del gráfico<br/>(último punto − 100 = % del grupo)"]
```

Ejemplo: sentadilla 150 → 165 (+10 %, índice 110) y curl 20 → 21 (+5 %, índice 105): el grupo
sube un 7,5 % y la línea acaba en 107,5.

### Chart
Grupo de progreso (`nombre`, `exerciseIds[]`); en la app se llama "grupo" ([0034](../DECISIONS.md)).
Se crea y edita en `/groups/new` y `/groups/:id/edit`. Su progreso lo calcula
`GET /api/progress?grupo=<id>` con **exactamente el mismo cálculo que "Todos"**, solo con sus
ejercicios: la lista la lee el servidor del propio grupo. Al borrar un ejercicio se quita de
los grupos (0020); un grupo puede quedarse vacío y la tarjeta lo avisa.

### BugReport
Reporte de un fallo enviado con el botón de la app (bloque 11b): `POST /api/reports`, 5 por hora
por usuario. El cliente manda `descripcion`, `contexto`, `ruta` y `pantalla`; el navegador lo toma
el servidor de la cabecera `User-Agent`, y `estado` (`pendiente` por defecto) solo lo cambia el
admin. Solo texto: nunca capturas de pantalla. Se borran con la cuenta del usuario (11b.4).
Índices `{ userId, createdAt }`, `{ estado, createdAt }` y `{ createdAt }`: la bandeja de
`/developer` ordena del más reciente al más antiguo y filtra por usuario, por estado o por fechas,
paginada por cursor como el Historial.

### PasswordReset
Enlace para recuperar la contraseña por email (bloque 11b): `userId`, `hash` (SHA-256 del token;
el token en claro solo va en el email), `usadoEn` y `expiresAt` (30 minutos, con índice TTL que
borra los caducados). Como mucho uno sin usar por usuario. Ver [auth.md](auth.md#recuperar-la-contraseña-por-email).

## Borrar un ejercicio: el historial se conserva

Decisión [0020](../DECISIONS.md), que sustituye a la cascada de la 0005. El ejercicio se borra de
verdad y desaparece de rutinas y grupos, pero **las sesiones pasadas lo conservan**: su nombre está
en `nombreSnapshot`. Lo que cambia es que deja de contar en el progreso.

```mermaid
sequenceDiagram
    participant C as exerciseController.remove
    participant E as Exercise
    participant W as Workout
    participant G as Chart
    Note over C,G: Todo dentro de una transacción
    C->>E: findOne({ _id, userId })
    C->>W: ¿alguna rutina se quedaría vacía? (también [X, X])
    alt sí
        C-->>C: 409 con el nombre de la rutina, no se borra nada
    else no
        C->>E: deleteOne
        C->>W: updateMany $pull ejercicios.exerciseId
        C->>G: updateMany $pull exerciseIds
        C-->>C: 204
    end
    Note over C: Session no se toca
```

Dónde se nota en el cliente:

| Sitio | Qué hace |
|---|---|
| Diálogo de borrado (`utils/borradoEjercicio.js`) | Explica que se quita de rutinas y grupos y que el historial se conserva |
| Progreso (`GET /api/progress`) | El servidor excluye del cálculo los ejercicios que ya no existen |
| Historial | Muestra la sesión tal cual, con el nombre del snapshot |
| Empezar sesión desde rutina (`useStartSession`) | No incluye ejercicios inexistentes; si no queda ninguno, pide editar la rutina |
| Terminar sesión activa (`ActiveSession.jsx`) | Comprueba qué ejercicios siguen existiendo; no envía las series de los borrados y avisa con su nombre |

Los restos de la cascada antigua (sesiones vacías, rutinas con ids inexistentes) se detectan con
`npm run diagnostico:borrados` y se repararon una vez con `npm run reparar:borrados`
([operaciones.md](operaciones.md)).

## Qué crece con el tiempo

Según el principio de estabilidad ([0015](../DECISIONS.md)), lo que importa es qué colecciones
crecen sin límite:

| Colección | Crecimiento | Estado |
|---|---|---|
| Session | una por entrenamiento, indefinidamente | indexada; lista paginada por cursor, progreso por rango sin leer las series (bloque 4) y serie anterior por índice (bloque 5) |
| Exercise | ~58 + los que cree el usuario | acotada |
| Workout, Chart | pocas por usuario | acotadas |
