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
| 2 | `presetId` en los ejercicios, snapshot del pictograma en las sesiones y migración | `b3dd8f4` `6e09793` `9e89c8a` |
| 3 | Icono de rutina: campo validado por el servidor y selector en el formulario | `421ec90` `33388f9` |
| 4 | Pictogramas en las pantallas y `presetId` en la sesión activa | pendiente |

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

## Dónde se ven (paso 4)

| Pantalla | Tamaño | Qué figura |
|---|---|---|
| Lista y buscador de ejercicios | 40, zona de 48 | preset → grupo |
| Sesión activa | 48, zona de 48 | preset → grupo (`presetId` guardado en la sesión local) |
| Detalle de sesión | 32 | la del snapshot; sesión antigua → marco vacío |
| Lista de rutinas | 48 | el icono; sin icono → recuadro discontinuo con la mancuerna (`IconoRutina`). Sustituye a la insignia de iniciales |

En las filas, el pictograma es **hermano** del botón de la fila, no va dentro
(`PictogramaEjercicio`): en el paso 5 será su propio botón. En el buscador, el fondo de elegido
pasa del botón a la fila para cubrir también la figura.

Con el pictograma, la lista de ejercicios a 375 px dejaba los nombres de cardio en "Bi…". En el
móvil, el tipo pasa a la línea gris bajo el nombre ("Cardio · Cardio", como en el diseño) y la
columna "Tipo" solo se ve desde 600 px (`NombreEjercicio` acepta `claseTipo`). Si el grupo y el tipo
coinciden ("Cardio · Cardio"), se muestran una sola vez.

La mancuerna es un icono del design system (`rutina.svg` en el grupo Icons, versión 53). En la app,
los iconos propios salen de `BotonIcono` a un componente `Icono` (`components/Icono/`), que usan
`BotonIcono` y `IconoRutina`.

De paso: el detalle de sesión tenía su propia copia de `formatDuracion`, sin el arreglo del 7b, y
las sesiones de Strong sin duración salían como "NaNh NaN min". Se borró la copia y usa la de
`utils/formato.js`.

## Deuda vista en este bloque

- `--font-size-md` se usa en cuatro secciones de la portada (`pages/Welcome/sections/`) pero no
  existe en `variables.css`: esos textos heredan el tamaño del contenedor.
- Copias de funciones de formato en las páginas (pendiente de decidir): `formatFecha` en History,
  SessionDetail y Profile; `formatFecha` en UsuariosAdmin y `formatFechaHora` en ReportesAdmin;
  `fechaCorta` en WidgetRecordEjercicio y `fecha` en WidgetFrecuencia y WidgetRacha.
- El estilo de 12 px del design system (0,75rem) no tiene variable y aparece suelto en 9 sitios
  y en `SelectorIcono`.
