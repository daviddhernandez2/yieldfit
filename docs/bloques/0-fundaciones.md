# Bloque 0 — Fundaciones

[← Índice](../README.md)

Estado: en curso

## Objetivo

Preparar el terreno antes de tocar código: reglas de trabajo, registro de decisiones y
documentación. El objetivo del proyecto es que David entienda y pueda explicar todo el código, y
estas tres piezas son las que lo sostienen.

## Qué se ha hecho

| Pieza | Para qué sirve |
|---|---|
| [CLAUDE.md](../../CLAUDE.md) | Protocolo de trabajo, convenciones, criterios de escalabilidad, deuda técnica y roadmap |
| [DECISIONS.md](../../DECISIONS.md) | Registro de decisiones: 11 retroactivas (0001–0011) y las del bloque 0 (0012–0016) |
| `docs/` | Esta documentación: [arquitectura](../arquitectura.md), [modelo de datos](../modelo-datos.md) y [autenticación](../auth.md) |
| `.gitignore` | Excluye `.postman/` y `postman/`, que pueden guardar tokens |

## Decisiones del bloque

| # | Decisión |
|---|---|
| 0012 | El repo sigue público; la documentación nunca contiene secretos, URLs de conexión ni datos de usuarios |
| 0013 | Documentación con VitePress (**sustituida por 0016**) |
| 0014 | Conventional Commits en español; Claude prepara los comandos de git y solo los ejecuta con confirmación |
| 0015 | Principio de estabilidad a largo plazo: igual con 5 años de historial que con 5 semanas |
| 0016 | Documentación en Markdown en `/docs`, leída en GitHub |

## Qué cambió por el camino

- **Documentación:** se empezó con VitePress desplegado en Vercel con protección de acceso. Se
  descartó porque era demasiada infraestructura para empezar y porque, con el repo público, la
  protección no aporta privacidad real (0013 → 0016).
- **Cascada `$pull`:** se había anotado como bug, pero es una decisión de producto deliberada
  (0005). Queda como decisión vigente con tres consecuencias por resolver en el bloque 1.
- **Roadmap:** se reordenó para meter el bloque 4 (historial escalable) antes que las features
  que leen historial, por el principio de estabilidad (0015), y el bloque 11 (auth robusta).

## Deuda detectada durante el bloque

Registrada en CLAUDE.md o en DECISIONS.md para los bloques que la tocan:

- Derivación de `tracking` duplicada en `pre('save')` y en `derivarTracking` (0002, 0006).
- Dither y DarkVeil son código de terceros (React Bits, MIT + Commons Clause) sin el aviso de
  copyright que exige la licencia (0011, bloque 1).
- DarkVeil se renderiza en todas las pantallas privadas, también durante el entrenamiento
  (0011, bloque 12).
