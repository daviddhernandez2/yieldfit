<div align="center">

<img src="./docs/logo.svg" alt="Yield Fit" width="120" />

# Yield Fit

**Aplicación web fullstack para el seguimiento del entrenamiento con análisis de progreso.**

[![Deploy](https://img.shields.io/badge/deploy-vercel-black?logo=vercel)](https://yieldfit.app)
[![Node](https://img.shields.io/badge/node-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/mongodb-atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

**[🌐 Ver la app en producción](https://yieldfit.app)**

</div>

---

## Sobre el proyecto

Yield Fit nace de una observación: las aplicaciones de fitness registran bien el entrenamiento pero visualizan mal el progreso. En cambio, las apps de inversión resuelven la lectura de la evolución de un activo con una claridad ejemplar — porcentajes en verde y rojo, gráficas de tendencia, curvas de rentabilidad.

La propuesta de Yield Fit es trasladar esa lógica visual al dominio del entrenamiento de fuerza: cada ejercicio se trata como un activo, cada sesión como una operación, y el progreso se lee de un vistazo con métricas basadas en el 1RM estimado (fórmula de Epley).

---

## Stack tecnológico

### Backend
- **Node.js** + **Express** — API REST 
- **MongoDB Atlas** + **Mongoose** —  5 modelos y middlewares
- **bcrypt** — hashing de contraseñas
- **JWT** — autenticación mediante tokens 

### Frontend
- **React 19** + **Vite** 
- **React Router v6** 
- **Axios** 
- **Recharts**
- **CSS Modules** 

### Efectos WebGL
- **three.js** + **@react-three/fiber** + **@react-three/postprocessing** 
- **ogl** 

### Despliegue
- **Vercel** — hosting del frontend con despliegue automático
- **Render** (Frankfurt) — hosting del backend 
- **MongoDB Atlas** (M0 gratuito) — base de datos en la nube.
- **Dominio propio** — [yieldfit.app](https://yieldfit.app).

---

## Estructura del monorepo

yieldfit/
├── client/                      # Frontend React + Vite
│   ├── src/
│   │   ├── components/          # Componentes reutilizables
│   │   ├── pages/               # Vistas de nivel superior
│   │   ├── hooks/               # Hooks personalizados
│   │   ├── context/             # Contextos React (auth)
│   │   ├── styles/              # Tokens de diseño (variables.css)
│   │   └── utils/               # Utilidades (activeSession, performance)
│   └── vite.config.js
│
├── server/                      # Backend Node + Express
│   ├── controllers/             # Lógica de negocio por recurso
│   ├── routes/                  # Definición de rutas Express
│   ├── models/                  # Esquemas Mongoose
│   ├── middleware/              # auth, propiedad, 404, error handler
│   └── index.js                 # Entry point
│
└── docs/                        # Recursos del README y memoria

---

## Memoria del proyecto

📄 **[Descargar memoria (PDF)](./docs/memoria-yieldfit.pdf)**

---


