# Documentación de Yield Fit

Documentación técnica del proyecto. Son archivos Markdown pensados para leerse en GitHub, que
renderiza los diagramas mermaid de forma nativa (ver [0016](../DECISIONS.md)).

> Este repo es público: aquí nunca van secretos, URLs de conexión ni datos de usuarios.

## Índice

| Documento | Qué explica |
|---|---|
| [Arquitectura](arquitectura.md) | Despliegue, capas del backend y del cliente, recorrido de una petición |
| [Modelo de datos](modelo-datos.md) | Colecciones, qué va embebido y qué referenciado, snapshots, índices |
| [Autenticación](auth.md) | Registro, login, tokens de acceso y de renovación, límite de intentos e IP real |
| [Operaciones](operaciones.md) | Backups de producción, prueba de restauración y reparaciones puntuales |
| [Privacidad](privacidad.md) | Dónde está la nota de privacidad de la app y cuándo hay que actualizarla |
| [Decisiones](../DECISIONS.md) | Registro de decisiones técnicas y de producto (fuente única, no se duplica aquí) |

## Bloques del roadmap

Una página por bloque, que se añade al cerrarlo. El roadmap completo está en
[CLAUDE.md](../CLAUDE.md#roadmap-por-bloques).

| Bloque | Página |
|---|---|
| 0 — Fundaciones | [bloques/0-fundaciones.md](bloques/0-fundaciones.md) |
| 1 — Saneamiento | [bloques/1-saneamiento.md](bloques/1-saneamiento.md) |
| 1c — Dependencias del cliente y datos huérfanos | [bloques/1c-dependencias-y-huerfanos.md](bloques/1c-dependencias-y-huerfanos.md) |
| 2 — Máquina de discos | [bloques/2-maquina-de-discos.md](bloques/2-maquina-de-discos.md) |
| 3 — Loader de arranque | [bloques/3-loader-arranque.md](bloques/3-loader-arranque.md) |
| 4 — Historial escalable | [bloques/4-historial-escalable.md](bloques/4-historial-escalable.md) |
| 4b — Récords personales | [bloques/4b-records-personales.md](bloques/4b-records-personales.md) |
| 5 — Serie anterior | [bloques/5-serie-anterior.md](bloques/5-serie-anterior.md) |
| 5b — Cardio bloqueado | [bloques/5b-cardio-bloqueado.md](bloques/5b-cardio-bloqueado.md) |
| 6 — Reemplazar ejercicio | [bloques/6-reemplazar-ejercicio.md](bloques/6-reemplazar-ejercicio.md) |
| 8 — Calendario | [bloques/8-calendario.md](bloques/8-calendario.md) |
| 8b — Calendario en escritorio | [bloques/8b-calendario-escritorio.md](bloques/8b-calendario-escritorio.md) |
| 9 — Grupos de progreso | [bloques/9-grupos-progreso.md](bloques/9-grupos-progreso.md) |
| 9b — Mejoras de uso | [bloques/9b-mejoras-uso.md](bloques/9b-mejoras-uso.md) |
| 9c — Design system Premium | [bloques/9c-design-system-premium.md](bloques/9c-design-system-premium.md) |
| 9d — Dashboard personalizable | [bloques/9d-dashboard-personalizable.md](bloques/9d-dashboard-personalizable.md) |
| 11 — Auth robusta | [bloques/11-auth-robusta.md](bloques/11-auth-robusta.md) |
| 11b — Beta cerrada | [bloques/11b-beta-cerrada.md](bloques/11b-beta-cerrada.md) |
| 11c — Registro en iOS | [bloques/11c-registro-ios.md](bloques/11c-registro-ios.md) |
| 11d — Feedback de la beta | [bloques/11d-feedback-beta.md](bloques/11d-feedback-beta.md) |

## Cómo mantener esta documentación

- La doc se actualiza **en el mismo commit** que el código que describe.
- Si un cambio tiene cierta complejidad (flujo, modelo, arquitectura), lleva un diagrama mermaid
  en la página que corresponda.
- El *porqué* de las decisiones va en [DECISIONS.md](../DECISIONS.md); aquí se describe *cómo
  funciona* y se enlaza a la decisión.
