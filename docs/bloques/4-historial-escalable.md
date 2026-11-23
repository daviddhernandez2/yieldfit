# Bloque 4 — Historial escalable

[← Índice](../README.md)

Estado: cerrado (2026-11-23)

## Objetivo

Que la app funcione igual con 10 años de historial que con 10 semanas (0015): dejar de
descargar todas las sesiones para calcular el progreso en el navegador, y paginar el historial.

## Qué se ha hecho

| Paso | Qué | Commit |
|---|---|---|
| 4.1 | Cada ejercicio de sesión guarda `mejor1RM`, calculado al crearla con `utils/unaRM.js` (única copia de Epley) | `2632736` |
| 4.2 | Migración `npm run migrar:1rm`: repetible, simula por defecto, exige backup reciente | `9ac1d51` |
| 4.3 | `GET /api/progress?desde&hasta`: % tipo bolsa e índice base 100, con pruebas (`node utils/progreso.test.js`) | `1dbde1d` |
| 4.4 | El Dashboard usa el endpoint; desaparece `utils/performance.js`; eje X con año en rangos de más de un año | `e16ffdf` |
| 4.5 | `GET /api/sessions` paginado por cursor; botón "Cargar más" en el Historial | `b0159cd` |
| 4.6 | Producción: backup, usuario temporal, 27 sesiones migradas, 0 pendientes (lo hizo David) | — |
| — | Documentación: 0026, 0027, modelo de datos, arquitectura, operaciones | `bbcbb77` |

Cómo se calcula el progreso, con diagrama: [modelo-datos.md](../modelo-datos.md#cómo-se-calcula-el-progreso).

## Mediciones

Servidor local contra Atlas, seed de 10 años (1.402 sesiones), mediana de 7 peticiones:

| | Antes | Después |
|---|---|---|
| `GET /api/sessions` | 491 ms · 2.758 KB (todas) | 97 ms · 41 KB (página de 20) |
| Dashboard | 535 ms · 2.772 KB + cálculo en el navegador | 164 ms · 73 KB (todo) · 132 ms · 8 KB (1 año) |

El coste de antes crecía con cada sesión guardada; el de ahora depende del rango pedido (la
consulta de 1 año examina 145 de 1.402 documentos, por el índice `{ userId, fecha }`).

## Decisiones del bloque

| # | Decisión |
|---|---|
| 0026 | Progreso en el servidor: 1RM precalculado, % tipo bolsa e índice base 100 (**sustituye a 0007**) |
| 0027 | Historial paginado por cursor |

## Qué cambió por el camino

- **La métrica:** el plan era mover el cálculo al servidor tal cual. Al revisarlo apareció que la
  media de variaciones engañaba (100 → 200 → 100 daba +25 %), y David eligió el % tipo bolsa y el
  índice base 100 ya en este bloque, en vez de en el 9.
- **Ruta:** `/api/progress`, en inglés como el resto de recursos (en el plan se llamó
  `/api/progreso`).
- **Despliegue en dos fases:** servidor que guarda `mejor1RM` → migración → endpoint y cliente,
  para que ningún momento el progreso leyera sesiones sin el campo.
- **Eje X:** con 10 años las etiquetas "11 oct" se repetían; ahora el formato depende de lo que
  abarca el gráfico.

## Para el bloque 9

- Con rangos cortos (1 semana) puede no haber ningún ejercicio con 2 puntos: el grupo sale sin %.
- Con el rango total, ~1.400 puntos en la línea; si el gráfico se vuelve lento, agrupar por
  semana en rangos largos.
- El servidor no comprime las respuestas (gzip): sería otra mejora barata, pero es una
  dependencia nueva (`compression`) y queda para cuando se decida.
