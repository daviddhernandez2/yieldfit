# Arquitectura

[← Índice](README.md)

## Despliegue

Tres piezas independientes, cada una en un servicio con plan gratuito ([0001](../DECISIONS.md)).
El frontend y el backend se despliegan por separado desde el mismo repo (`client/` y `server/`).

```mermaid
flowchart LR
    U["Navegador<br/>(yieldfit.app)"]
    subgraph Vercel
        FE["client/<br/>React + Vite<br/>(estáticos)"]
    end
    subgraph Render["Render (Frankfurt)"]
        API["server/<br/>Express 5 API"]
    end
    subgraph Atlas["MongoDB Atlas M0"]
        DB[("Base de datos")]
    end

    U -- "descarga HTML/JS/CSS" --> FE
    U -- "peticiones /api con<br/>Authorization: Bearer" --> API
    API -- "Mongoose" --> DB
```

- El navegador descarga la app de Vercel y después habla **directamente** con la API de Render.
  Por eso son dos dominios distintos y la API necesita CORS (`CLIENT_ORIGINS`).
- **Cold start:** Render duerme el servicio tras un periodo sin tráfico; la primera petición
  tarda decenas de segundos. Se aborda en el bloque 3.

## Entornos

Desarrollo y producción usan bases distintas dentro del mismo clúster de Atlas
([0017](../DECISIONS.md)).

```mermaid
flowchart LR
    subgraph Local["Portátil (NODE_ENV=development)"]
        DEV["server/ local"]
        SEED["npm run seed"]
    end
    subgraph Render["Render (NODE_ENV=production)"]
        PROD["server/ producción"]
    end
    subgraph Atlas["Clúster Atlas M0"]
        DBDEV[("yieldfit-dev")]
        DBPROD[("yieldfit")]
    end

    DEV -- "usuario yieldfit-dev<br/>(readWrite solo sobre yieldfit-dev)" --> DBDEV
    SEED -- "vacía y rellena" --> DBDEV
    PROD -- "usuario de producción" --> DBPROD
    DEV -. "bloqueado" .-x DBPROD
```

Tres barreras impiden que el entorno local escriba en producción:

| Barrera | Dónde | Qué hace |
|---|---|---|
| Permisos de Atlas | usuario `yieldfit-dev` | solo tiene `readWrite` sobre `yieldfit-dev`; Atlas rechaza cualquier operación sobre `yieldfit` |
| Comprobación al arrancar | `server/config/database.js` | si `NODE_ENV` no es `production` y la base es `yieldfit`, el servidor no arranca |
| Seed | `server/scripts/seed.js` | se niega a ejecutarse si la base no termina en `-dev` |

**Datos de desarrollo:** `npm run seed` (desde `server/`) vacía `yieldfit-dev` y crea un usuario de
prueba (`dev@yieldfit.test` / `desarrollo123`), los presets, tres rutinas, un grupo de progreso y
unas 3 sesiones por semana durante 2 años (`npm run seed -- --anios 5` para más historial). Los
datos son deterministas: siempre los mismos para los mismos argumentos.

## Backend (`server/`)

```mermaid
flowchart TB
    IDX["index.js<br/>carga .env, conecta a MongoDB, arranca el servidor"]
    APP["app.js<br/>helmet → morgan → cors → express.json"]
    R["routes/<br/>un router por recurso"]
    AUTH["middlewares/authMiddleware.js<br/>requireAuth"]
    C["controllers/<br/>list · getOne · create · update · remove"]
    M["models/<br/>User · Exercise · Workout · Session · Chart"]
    ERR["middlewares/errorHandlers.js<br/>notFoundHandler · errorHandler"]

    IDX --> APP --> R
    R -- "router.use(requireAuth)" --> AUTH --> C
    C --> M
    C -- "next(error)" --> ERR
```

| Prefijo | Router | Protección |
|---|---|---|
| `/api/auth` | `authRoutes.js` | pública, salvo `GET /me` |
| `/api/exercises` | `exerciseRoutes.js` | `requireAuth` a nivel router |
| `/api/workouts` | `workoutRoutes.js` | `requireAuth` a nivel router |
| `/api/sessions` | `sessionRoutes.js` | `requireAuth` a nivel router |
| `/api/charts` | `chartRoutes.js` | `requireAuth` a nivel router (sin uso en el cliente todavía) |

**Errores:** los controladores pasan los errores inesperados con `next(error)` a `errorHandler`.
En producción, un 500 responde siempre con un mensaje genérico, porque el cliente muestra
`response.data.message` y el mensaje original puede revelar detalles internos. El error completo
queda en los logs de Render. En desarrollo se devuelven el mensaje real y el `stack`. Los errores
< 500 (p. ej. un 400 por JSON mal formado) se devuelven tal cual.

Todos los recursos siguen el mismo patrón: cada query filtra por `userId: req.user._id` y, cuando
un documento referencia otros ids (`exerciseId`, `workoutId`), el controlador comprueba que
pertenecen al usuario antes de guardar.

## Cliente (`client/src/`)

```mermaid
flowchart TB
    P["pages/<br/>una vista por carpeta, cargadas con lazy()"]
    CO["components/<br/>UI reutilizable + Layout, PrivateRoute"]
    H["hooks/<br/>useAuth · useActiveSession · useStartSession"]
    CTX["context/AuthContext"]
    U["utils/<br/>performance.js (1RM, progreso)<br/>activeSession.js (localStorage)"]
    API["api/<br/>auth · exercises · workouts · sessions"]
    AX["api/client.js<br/>axios + interceptores"]

    P --> CO
    P --> H
    H --> CTX
    H --> U
    P --> U
    CTX --> API
    P --> API
    API --> AX
```

- **`api/client.js`** es el único punto que habla con el backend: añade el token en cada
  petición y, si recibe un 401, borra el token y manda a `/login` (ver [auth.md](auth.md)).
- **Lógica de negocio fuera de los componentes:** el cálculo del 1RM y del progreso vive en
  `utils/performance.js` ([0007](../DECISIONS.md)); la sesión en curso, en
  `utils/activeSession.js` ([0009](../DECISIONS.md)).
- **Fondos WebGL** ([0011](../DECISIONS.md)): `Dither` solo en Welcome (carga diferida);
  `DarkVeil` dentro de `Layout`, así que está en todas las pantallas privadas.

### Rutas

| Ruta | Página | Privada |
|---|---|---|
| `/` | Welcome | no |
| `/login`, `/register` | Login, Register | no |
| `/dashboard` | Dashboard | sí |
| `/exercises`, `/exercises/new`, `/exercises/:id/edit` | Exercises, ExerciseForm | sí |
| `/workouts`, `/workouts/new`, `/workouts/:id/edit` | Workouts, WorkoutForm | sí |
| `/sessions/active` | ActiveSession | sí |
| `/history`, `/history/:id` | History, SessionDetail | sí |
| `/profile` | Profile | sí |

Las rutas privadas van envueltas en `PrivateRoute` + `Layout`. Cualquier otra ruta redirige a `/`.

## Recorrido de una petición: guardar una sesión

```mermaid
sequenceDiagram
    participant AS as ActiveSession.jsx
    participant LS as localStorage
    participant AX as api/client.js
    participant RA as requireAuth
    participant SC as sessionController.create
    participant DB as MongoDB

    Note over AS,LS: Durante el entrenamiento, cada cambio se guarda solo en local
    AS->>LS: writeActiveSession(sesión)
    AS->>AX: POST /api/sessions (al terminar)
    AX->>RA: Authorization: Bearer <token>
    RA->>DB: User.findById(payload.userId)
    RA->>SC: req.user
    SC->>DB: comprobar ownership de workoutId y exerciseIds
    SC->>DB: Exercise.find → copiar nombre y tracking (snapshots)
    SC->>DB: session.save()
    SC-->>AS: 201 { session }
    AS->>LS: clearActiveSession()
```
