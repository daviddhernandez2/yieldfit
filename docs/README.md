# Documentación de Yield Fit

Documentación técnica del proyecto. Son archivos Markdown pensados para leerse en GitHub, que
renderiza los diagramas mermaid de forma nativa (ver [0016](../DECISIONS.md)).

> Este repo es público: aquí nunca van secretos, URLs de conexión ni datos de usuarios.

## Índice

| Documento | Qué explica |
|---|---|
| [Arquitectura](arquitectura.md) | Despliegue, capas del backend y del cliente, recorrido de una petición |
| [Modelo de datos](modelo-datos.md) | Colecciones, qué va embebido y qué referenciado, snapshots, índices |
| [Autenticación](auth.md) | Registro, login, `requireAuth` y cómo el cliente guarda y usa el token |
| [Operaciones](operaciones.md) | Backups de producción, prueba de restauración y reparaciones puntuales |
| [Decisiones](../DECISIONS.md) | Registro de decisiones técnicas y de producto (fuente única, no se duplica aquí) |

## Bloques del roadmap

Una página por bloque, que se añade al cerrarlo. El roadmap completo está en
[CLAUDE.md](../CLAUDE.md#roadmap-por-bloques).

| Bloque | Página |
|---|---|
| 0 — Fundaciones | [bloques/0-fundaciones.md](bloques/0-fundaciones.md) |
| 1 — Saneamiento | [bloques/1-saneamiento.md](bloques/1-saneamiento.md) |
| 2 — Máquina de discos | [bloques/2-maquina-de-discos.md](bloques/2-maquina-de-discos.md) |
| 3 — Loader de arranque | [bloques/3-loader-arranque.md](bloques/3-loader-arranque.md) |

## Cómo mantener esta documentación

- La doc se actualiza **en el mismo commit** que el código que describe.
- Si un cambio tiene cierta complejidad (flujo, modelo, arquitectura), lleva un diagrama mermaid
  en la página que corresponda.
- El *porqué* de las decisiones va en [DECISIONS.md](../DECISIONS.md); aquí se describe *cómo
  funciona* y se enlaza a la decisión.
