# Bloque 6 — Reemplazar ejercicio en la sesión activa

[← Índice](../README.md)

Estado: cerrado (2026-11-23)

## Objetivo

Cambiar un ejercicio por otro sin salir de la sesión (máquina ocupada, molestia…). Antes, pasar
el estado de la sesión activa a `useReducer`, para que la lógica se pueda leer y probar entera.

## Qué se ha hecho

| Paso | Qué | Commit |
|---|---|---|
| 6.1 | `sesionReducer` con pruebas; `ActiveSession` con `useReducer`, sin cambios visibles | `0a88a17` |
| 6.2 | `ExercisePicker` extraído de `WorkoutForm`, sin cambios visibles | `481a28a` |
| 6.3 | Reemplazar: acción en el reducer, confirmación y serie anterior del nuevo (en ventana) | `e54b6ff` |
| 6.4 | Reemplazar pasa a página completa (la ventana no cabía en el iPhone) | `bd65a4d` |
| 6.5 | Botón para confirmar el reemplazo tras marcar el ejercicio | (cierre) |

## Cómo funciona reemplazar

```mermaid
sequenceDiagram
    participant AS as ActiveSession
    participant LS as localStorage
    participant RE as ReplaceExercise<br/>/sessions/active/replace/:index
    participant API as API

    AS->>LS: la sesión se guarda en cada cambio
    AS->>RE: "Reemplazar ejercicio"
    RE->>LS: lee la sesión
    RE->>API: GET /api/exercises (catálogo)
    RE->>RE: marcar en ExercisePicker<br/>(sin los de la sesión; cardio "Próximamente")
    RE->>RE: botón "Reemplazar por «X»"
    alt el ejercicio tenía series hechas
        RE->>RE: confirmación "se perderán"
    end
    RE->>RE: sesionReducer: reemplazarEjercicio
    RE->>LS: guarda la sesión
    RE->>API: previous-sets del nuevo (máx. 4 s)
    RE->>LS: añadirAnteriores
    RE->>AS: vuelve
    AS->>LS: lee la sesión
```

## Pruebas

`node src/utils/activeSessionReducer.test.js` (desde `client/`): 26 casos, incluidos una sesión
con la forma actual de localStorage y otra de antes de los bloques 5 y 5b, que conservan todas
sus claves tras todas las acciones.

## Decisiones del bloque

| # | Decisión |
|---|---|
| 0031 | Sesión activa con `useReducer` |
| 0032 | Reemplazar un ejercicio en la sesión activa |

## Qué cambió por el camino

- **Ventana → página:** en tamaño iPhone la ventana emergente no se adaptaba. La página propia
  reutiliza el reducer sobre la sesión de localStorage, sin tocar `ActiveSession` más que el
  botón.
- **Botón de confirmar:** en la primera versión de la página, tocar un ejercicio lo reemplazaba
  directamente. Ahora lo marca y se confirma con un botón pegado abajo.
- **Temporizador:** al ir a la página de reemplazar se pierde el descanso en curso, como al
  salir de la sesión a cualquier otra pantalla (no se guarda en localStorage).
