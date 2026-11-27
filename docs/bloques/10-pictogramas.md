# Bloque 10 — Pictogramas de ejercicios y rutinas

[← Índice](../README.md)

Estado: en curso

## Objetivo

Que cada ejercicio y cada rutina se reconozcan de un vistazo con una figura propia (diseño
aprobado en el lienzo "Imágenes de ejercicios" y en la tarjeta Pictograma del design system).

## Qué se ha hecho

| Paso | Qué | Commits |
|---|---|---|
| 1 | Datos en `compartido/` y componente `Pictograma` | `3be8a77` `25668fc` |
| 2 | `presetId` en los ejercicios, snapshot del pictograma en las sesiones y migración | pendiente |
| 3 | Icono de rutina: campo validado por el servidor y selector en el formulario | pendiente |

## Migración de producción (paso 2)

`npm run migrar:preset`, aplicada el 2026-11-27 con el procedimiento de
[operaciones.md](../operaciones.md#reparaciones-puntuales-de-producción) (backup, prueba de
restauración y usuario temporal; la limpieza está hecha).

- **582** ejercicios actualizados, **0** pendientes en la comprobación.
- **20** no se reconocen (renombrados, con otro grupo o creados por el usuario): se quedan con la
  figura de su grupo, como se decidió.
- Las sesiones no se migran: las anteriores al bloque 10 muestran el marco vacío.

## Icono de rutina (paso 3)

`Workout.icono` guarda la **clave** (`empuje`), no el id de la figura, para poder cambiar el
dibujo sin migrar rutinas. El enum son las claves de `ICONOS_RUTINA` (`compartido/`), la misma
lista que pinta el selector, así que no hay copia en el cliente. `null` o `''` lo quitan; sin el
campo en la petición, no cambia. Prueba: `server/models/Workout.test.js`.

## Deuda vista en este bloque

- `--font-size-md` se usa en cuatro secciones de la portada (`pages/Welcome/sections/`) pero no
  existe en `variables.css`: esos textos heredan el tamaño del contenedor.
- El estilo de 12 px del design system (0,75rem) no tiene variable y aparece suelto en 9 sitios
  y en `SelectorIcono`.
