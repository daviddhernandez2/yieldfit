# Autenticación

[← Índice](README.md)

JWT stateless: el backend no guarda sesiones. Firma un token con `{ userId }` y 7 días de
validez, y el cliente lo guarda en `localStorage` (`yieldfit_token`) y lo envía en cada petición
([0008](../DECISIONS.md)).

| Pieza | Archivo | Qué hace |
|---|---|---|
| Firmar y verificar | `server/utils/jwt.js` | `signToken(userId)`, `verifyToken(token)` con `JWT_SECRET` |
| Endpoints | `server/controllers/authController.js` | `register`, `login`, `me` |
| Proteger rutas | `server/middlewares/authMiddleware.js` | `requireAuth`: valida el token y carga `req.user` |
| Guardar y enviar el token | `client/src/api/client.js` | interceptores de axios |
| Estado de sesión | `client/src/context/AuthContext.jsx` | `status`: `loading` → `authenticated` / `unauthenticated` |
| Rutas privadas | `client/src/components/PrivateRoute.jsx` | redirige a `/login` si no hay sesión |

## Registro

El usuario y sus ejercicios se crean en una **transacción**: o se guardan los dos, o ninguno
([0002](../DECISIONS.md)). El registro ya devuelve un token, así que el usuario queda logueado
sin pasar por `/login`.

```mermaid
sequenceDiagram
    participant R as Register.jsx
    participant CTX as AuthContext
    participant API as POST /api/auth/register
    participant DB as MongoDB

    R->>CTX: register(datos)
    CTX->>API: datos del formulario
    API->>DB: User.findOne({ email })
    alt email ya registrado
        API-->>CTX: 409 Conflict
    else email libre
        rect rgba(62, 248, 126, 0.12)
        Note over API,DB: transacción
        API->>DB: user.save() → pre('save') hashea la contraseña
        API->>DB: Exercise.insertMany(58 presets)
        end
        API-->>CTX: 201 { token, user }
        CTX->>CTX: localStorage.setItem('yieldfit_token')<br/>status = authenticated
    end
```

## Login

```mermaid
sequenceDiagram
    participant L as Login.jsx
    participant CTX as AuthContext
    participant API as POST /api/auth/login
    participant DB as MongoDB

    L->>CTX: login({ email, password })
    CTX->>API: credenciales
    API->>DB: User.findOne({ email })
    alt el email no existe
        API-->>CTX: 401 "Credenciales incorrectas"
    else existe
        API->>API: user.comparePassword() (bcrypt)
        alt contraseña incorrecta
            API-->>CTX: 401 "Credenciales incorrectas"
        else correcta
            API-->>CTX: 200 { token, user }
            CTX->>CTX: guarda token, status = authenticated
        end
    end
```

El mensaje de error es **el mismo** para "email no existe" y "contraseña incorrecta", para no
revelar qué emails están registrados.

## Peticiones protegidas

```mermaid
sequenceDiagram
    participant P as Página
    participant AX as api/client.js
    participant RA as requireAuth
    participant DB as MongoDB
    participant C as Controlador

    P->>AX: petición
    AX->>AX: interceptor de request:<br/>Authorization: Bearer <token>
    AX->>RA: petición
    alt sin cabecera, token inválido o caducado
        RA-->>AX: 401
    else token válido
        RA->>DB: User.findById(payload.userId)
        alt el usuario ya no existe
            RA-->>AX: 401
        else existe
            RA->>C: req.user = user
            C-->>AX: respuesta
        end
    end
    alt respuesta 401
        AX->>AX: interceptor de response:<br/>borra el token, window.location.href = '/login'
    end
    AX-->>P: respuesta o error
```

`requireAuth` consulta la base de datos en cada petición. Tiene un coste, pero hace que un
usuario borrado deje de tener acceso aunque su token no haya caducado.

## Al abrir la app

```mermaid
flowchart TD
    A["AuthProvider se monta<br/>status = loading"] --> B{"¿hay token en<br/>localStorage?"}
    B -- no --> F["status = unauthenticated"]
    B -- sí --> C["GET /api/auth/me"]
    C -- 200 --> D["status = authenticated<br/>user = respuesta"]
    C -- 401 --> E["el interceptor borra el token<br/>y recarga en /login"] --> F
    F --> G["PrivateRoute → Navigate a /login"]
    D --> H["PrivateRoute renderiza la página"]
```

Mientras `status = loading`, `PrivateRoute` muestra "Cargando...". Con el cold start de Render
esto puede durar decenas de segundos: es lo que resuelve el bloque 3.

## Cerrar sesión

No hay endpoint: como el JWT es stateless, basta con borrar el token del cliente. La contrapartida
es que un token robado sigue siendo válido hasta que caduca.

## Limitaciones conocidas

- Token en `localStorage`: legible por JavaScript si hubiera un XSS.
- Sin refresh token ni revocación. Auth robusta en el bloque 11; almacenamiento seguro nativo en
  iPhone en el bloque 12.
- Sin rate limiting en `/login`.
- El mismo mensaje de error no impide del todo saber si un email existe: cuando no existe, la
  respuesta llega antes porque se salta bcrypt, que es lento a propósito. Es una enumeración por
  tiempo de respuesta; conviene tenerla en cuenta en el bloque 11.
- El interceptor 401 usa `window.location.href`, que recarga la app entera. Se sustituye por
  navegación de React Router en el bloque 3.
