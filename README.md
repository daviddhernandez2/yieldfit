<div align="center">

<img src="./client/public/favicon.svg" alt="Yield Fit" width="80" />

# Yield Fit

**Aplicación web fullstack para el seguimiento del entrenamiento con análisis de progreso.**

[![Deploy](https://img.shields.io/badge/deploy-vercel-black?logo=vercel)](https://yieldfit.app)
[![Node](https://img.shields.io/badge/node-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/mongodb-atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)

**[🌐 Ver la app en producción](https://yieldfit.app)**

</div>

---

## Sobre el proyecto

Yield Fit nace de una observación: las aplicaciones de fitness registran bien el entrenamiento pero visualizan mal el progreso. En cambio, las apps de inversión resuelven la lectura de la evolución de un activo con una claridad ejemplar — porcentajes en verde y rojo, gráficas de tendencia, curvas de rentabilidad.

La propuesta de Yield Fit es trasladar esa lógica visual al dominio del entrenamiento de fuerza: cada ejercicio se trata como un activo, cada sesión como una operación, y el progreso se lee de un vistazo con métricas basadas en el 1RM estimado (fórmula de Epley).

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19, Vite 8, React Router 7, Axios, Recharts, CSS Modules, dnd-kit |
| Efectos WebGL | three.js + @react-three/fiber + postprocessing (fondo de la bienvenida); ogl (fondo de la app) |
| Backend | Node.js 20, Express 5, Mongoose 9, bcrypt, JWT, helmet, cors, morgan, express-rate-limit |
| Base de datos | MongoDB Atlas |
| Despliegue | Vercel (frontend), Render en Frankfurt (backend), MongoDB Atlas M0 |

---

## Arrancar en local

### Requisitos

- **Node.js 20** o superior.
- **Un clúster de MongoDB Atlas** (el M0 gratuito sirve). Tiene que ser un *replica set*, como los
  de Atlas: la app usa transacciones (registro de usuario, borrado de ejercicios) y un MongoDB
  local sin replica set no las admite.
- En Atlas, un **usuario de base de datos con `readWrite` solo sobre `yieldfit-dev`**. Nunca uses
  en local el usuario de producción ([0017](DECISIONS.md)).

### 1. Instalar dependencias

No hay `package.json` en la raíz: cliente y servidor se instalan por separado.

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Variables de entorno

Copia los ejemplos y rellénalos. Los `.env` no se suben al repo.

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

| Variable | Dónde | Qué es |
|---|---|---|
| `MONGO_URI` | `server/.env` | URI de Atlas con el usuario de desarrollo y la base `yieldfit-dev` |
| `JWT_SECRET` | `server/.env` | Secreto para firmar los tokens. Genera uno con `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_EXPIRES_IN` | `server/.env` | Duración del token (`7d`) |
| `CLIENT_ORIGINS` | `server/.env` | Orígenes permitidos por CORS (`http://localhost:5173`) |
| `PORT`, `NODE_ENV` | `server/.env` | `3000` y `development` |
| `VITE_API_URL` | `client/.env` | URL de la API (`http://localhost:3000/api`) |

Las variables obligatorias no tienen valor por defecto: si falta alguna, el servidor o Vite se
niegan a arrancar con un mensaje que dice cuál. Además, el servidor no arranca en desarrollo si la
base es la de producción.

### 3. Datos de prueba

```bash
cd server
npm run seed
```

**Vacía `yieldfit-dev`** y la rellena con un usuario de prueba (`dev@yieldfit.test` /
`desarrollo123`), los ejercicios predefinidos, tres rutinas y unas 3 sesiones por semana durante 2
años. `npm run seed -- --anios 5` genera más historial. Se niega a ejecutarse si la base no
termina en `-dev`.

### 4. Arrancar

En dos terminales:

```bash
cd server && npm run dev     # API en http://localhost:3000
cd client && npm run dev     # App en http://localhost:5173
```

---

## Scripts

**Servidor** (`server/`):

| Script | Qué hace |
|---|---|
| `npm run dev` | API con recarga automática (nodemon) |
| `npm start` | API sin recarga (lo que ejecuta Render) |
| `npm run seed` | Vacía y rellena `yieldfit-dev` con datos de prueba |
| `npm run backup` | Backup de producción en el portátil ([docs/operaciones.md](docs/operaciones.md)) |
| `npm run backup:restore-test` | Prueba que el último backup se puede restaurar |
| `npm run diagnostico:borrados` | Diagnóstico de solo lectura de datos huérfanos (`-- --desarrollo` para `yieldfit-dev`) |
| `npm run reparar:borrados` | Reparación puntual de producción; solo simula sin `-- --aplicar` |
| `npm run migrar:1rm` | Rellena `mejor1RM` en sesiones antiguas (bloque 4); solo simula sin `-- --aplicar` |

Los de producción necesitan credenciales en el Llavero de macOS y un procedimiento concreto:
síguelo en [docs/operaciones.md](docs/operaciones.md).

**Cliente** (`client/`):

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo de Vite |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build en local |
| `npm run lint` | oxlint |

---

## Estructura

```
yieldfit/
├── client/                 # Frontend React + Vite
│   └── src/
│       ├── api/            # Una capa por recurso sobre axios (client.js)
│       ├── components/     # Componentes reutilizables (Carpeta/Componente.jsx + .module.css)
│       ├── pages/          # Una carpeta por vista, cargadas con lazy()
│       ├── context/        # AuthContext
│       ├── hooks/          # Hooks propios (sesión activa, arranque de sesión…)
│       ├── utils/          # Lógica sin UI: sesión activa, aviso de arranque en frío
│       └── styles/         # Tokens de diseño (variables.css)
├── server/                 # Backend Node + Express
│   ├── index.js            # Punto de entrada: conecta a MongoDB y arranca Express
│   ├── app.js              # Configuración de Express (middlewares y rutas)
│   ├── config/             # Conexión a la base de datos
│   ├── models/             # Esquemas de Mongoose
│   ├── controllers/        # Lógica por recurso
│   ├── routes/             # Un router por recurso
│   ├── middlewares/        # Autenticación, 404 y errores
│   ├── data/               # Ejercicios predefinidos
│   ├── utils/              # JWT, presets, 1RM (Epley) y cálculo del progreso
│   └── scripts/            # Seed, backups, diagnóstico y reparación
├── docs/                   # Documentación técnica
├── DECISIONS.md            # Registro de decisiones
└── THIRD_PARTY_NOTICES.md  # Código de terceros y sus licencias
```

---

## Documentación

- **[docs/](docs/README.md):** arquitectura, modelo de datos, autenticación, operaciones (backups)
  y una página por bloque del roadmap. Los diagramas se ven directamente en GitHub.
- **[DECISIONS.md](DECISIONS.md):** por qué el proyecto es como es. Cada decisión técnica o de
  producto, con las alternativas descartadas y sus consecuencias.

---

## Licencia

Sin licencia: **todos los derechos reservados**. El código es público para que se pueda leer,
pero no se concede permiso para copiarlo, modificarlo ni distribuirlo
([DECISIONS.md, 0022](DECISIONS.md)).

Incluye código de terceros con su propia licencia: ver [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
