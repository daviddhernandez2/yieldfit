# Operaciones: backups, restauración y reparaciones

[← Índice](README.md)

Atlas M0 **no tiene backups automáticos**. Las copias de producción se hacen con `mongodump`
desde el portátil ([0018](../DECISIONS.md)).

## Cuándo hacer un backup

- **Obligatorio:** justo antes de cualquier cambio que modifique documentos existentes (p. ej. la
  migración de sesiones del bloque 4).
- **Rutina:** una vez al mes.
- Después de cada backup importante, la prueba de restauración (ver abajo).

## Requisitos (una sola vez, en este orden)

1. **FileVault activado** (Ajustes del Sistema → Privacidad y seguridad → FileVault). Los backups
   contienen datos personales de los usuarios; sin cifrado de disco, perder el portátil es perder
   esos datos.
2. **Herramientas de MongoDB:**
   ```bash
   brew install mongodb-database-tools
   ```
3. **Usuario de Atlas `yieldfit-backup`** (Security → Database Access → Add New Database User,
   autenticación por contraseña autogenerada, *Specific Privileges*):
   - `read` sobre `yieldfit`: puede copiar producción, nunca modificarla.
   - `readWrite` sobre `yieldfit-restore-test`: solo para la prueba de restauración.
4. **Guardar su URI en el Llavero** (te la pide sin mostrarla y no queda en el historial):
   ```bash
   security add-generic-password -s yieldfit-backup -a "$USER" -w
   ```
   La URI es la de conexión de Atlas con ese usuario. Los scripts la leen del Llavero en cada
   ejecución; no está en ningún archivo.

> **Las credenciales nunca salen en pantalla.** `mongodump` y `mongorestore` imprimen la URI
> completa, con contraseña, cuando no pueden conectar. Por eso los scripts
> (`server/scripts/lib/credenciales.sh`) pasan la URI por `--config` y no como argumento (los
> argumentos se ven con `ps`), y filtran toda su salida, terminal y logs, sustituyendo la
> contraseña por `***`. No ejecutes `mongodump` o `mongorestore` a mano con `--uri`: usa los
> scripts.
## Hacer un backup

```bash
cd server
npm run backup
```

```mermaid
flowchart TD
    A["Llavero → URI de yieldfit-backup"] --> B["mongodump --db yieldfit<br/>→ yieldfit.archive.gz"]
    B --> C["gzip -t<br/>(descomprime en memoria y comprueba el CRC)"]
    C --> D["huella SHA-256"]
```

`gzip -t` demuestra que el archivo está **íntegro**; que se puede **restaurar** solo lo demuestra la
prueba de restauración. Si el script no puede leer los recuentos por colección del log, falla
con un mensaje explícito: nunca termina en silencio.

Resultado en `~/yieldfit-backups/AAAA-MM-DD_HHMM/` (permisos `700`, solo tu usuario):

| Archivo | Contenido |
|---|---|
| `yieldfit.archive.gz` | la base completa, comprimida |
| `yieldfit.archive.gz.sha256` | huella para comprobar que el archivo no ha cambiado |
| `mongodump.log` | documentos volcados por colección |

## Probar la restauración

```bash
npm run backup:restore-test                                   # el backup más reciente
npm run backup:restore-test -- ~/yieldfit-backups/AAAA-MM-DD_HHMM
```

1. Comprueba la huella SHA-256 del archivo.
2. Lo restaura en **`yieldfit-restore-test`** (nunca en `yieldfit`; además, el usuario de backup
   no tiene permiso de escritura en producción).
3. Compara colección por colección los documentos restaurados con los volcados: cada colección
   tiene que aparecer, con los mismos documentos y 0 fallos, y la línea final de `mongorestore`
   tiene que confirmar 0 documentos fallidos. Cualquier cosa que no pueda leer cuenta como fallo.

Al terminar, **borra `yieldfit-restore-test` desde Atlas** (Browse Collections → la base → Drop):
es una copia de producción y ocupa espacio de los 512 MB del M0.

## Restaurar producción de verdad

Solo en caso de pérdida de datos. Es una operación manual y deliberada, sin script: hace falta un
usuario con escritura sobre `yieldfit` (el de producción) y `mongorestore --drop` sobre esa base.
Antes, haz un backup del estado actual, aunque esté dañado.

## Reparaciones puntuales de producción

Para corregir o migrar datos de producción con un script:

| Script | Qué hace | Comprobación del paso 6 |
|---|---|---|
| `npm run reparar:borrados` | Borra las sesiones vacías y limpia las rutinas que apuntan a ejercicios inexistentes (bloque 1) | `npm run diagnostico:borrados`: apartados 1 y 2 a 0 |
| `npm run migrar:1rm` | Rellena `mejor1RM` en las sesiones guardadas antes del bloque 4. Se puede repetir sin efecto | la propia salida: "quedan pendientes: 0" |
| `npm run admin -- correo` | Da el rol de admin a ese usuario (`--quitar` lo devuelve a `usuario`). Bloque 11b | la propia salida: rol nuevo y "Admins en esta base: 1" |

Los pasos de abajo usan `reparar:borrados` como ejemplo; con los demás son los mismos. Ningún usuario
permanente puede escribir en producción salvo el de la app, así que cada reparación usa un
**usuario temporal** que se crea para ella y desaparece después.

1. **Usuario temporal en Atlas** (Security → Database Access → Add New Database User):
   - nombre `yieldfit-reparacion`, contraseña autogenerada;
   - *Specific Privileges*: `readWrite` sobre `yieldfit` y nada más;
   - activa **Temporary User** con duración de **6 horas**. Atlas lo borra solo al caducar,
     aunque se te olvide hacerlo a mano.
2. **Su URI en el Llavero:**
   ```bash
   security add-generic-password -s yieldfit-reparacion -a "$USER" -w
   ```
3. **Backup y prueba de restauración**, justo antes:
   ```bash
   npm run backup
   npm run backup:restore-test
   ```
4. **Simulación** (no escribe nada). Comprueba que los ids y los números coinciden con el
   diagnóstico:
   ```bash
   npm run reparar:borrados
   ```
5. **Aplicar.** El script se niega si el último backup tiene más de 60 minutos, si encuentra
   muchos más cambios de los esperados o si alguna rutina se quedaría sin ejercicios. Todo
   va en una transacción: o se aplica entero o no se aplica nada.
   ```bash
   npm run reparar:borrados -- --aplicar
   ```
6. **Comprobar**: los apartados 1 y 2 deben salir a 0.
   ```bash
   npm run diagnostico:borrados
   ```
7. **Limpiar.** Borra el usuario en Atlas (Database Access → Delete) sin esperar a que
   caduque, y su URI del Llavero:
   ```bash
   security delete-generic-password -s yieldfit-reparacion
   ```

```mermaid
flowchart TD
    A["Usuario temporal<br/>(readWrite yieldfit, 6 h)"] --> B["backup + restore-test"]
    B --> C["simulación"]
    C -->|"números correctos"| D["--aplicar<br/>(transacción)"]
    D --> E["diagnóstico = 0"]
    E --> F["borrar usuario<br/>(Atlas + Llavero)"]
```

Antes de producción, el script se prueba en desarrollo con `-- --desarrollo` (usa el `.env`).

## Dónde se guardan

**Solo en este portátil** ([0019](../DECISIONS.md)): es una decisión consciente. Si el portátil se
pierde o se estropea, se pierden también los backups. FileVault protege los datos si alguien se lo
lleva, pero no los recupera.

## Mantenimiento

- Los scripts no borran backups antiguos: hazlo a mano.
- Revisión prevista ([0018](../DECISIONS.md)): backups automáticos fuera del portátil cuando la app
  tenga usuarios reales además de David.

## Variables de entorno de Vercel

- `VITE_API_URL` = `https://api.yieldfit.app/api` (Production).
- **Tiene que ser de tipo normal ("Config"), no "Secret".** Vercel no deja marcar como secreta una
  variable que empieza por `VITE_`, y tiene sentido: Vite incrusta en el JavaScript publicado
  todas las variables `VITE_`, así que cualquiera puede leerlas en el navegador. Por eso en el
  cliente nunca va nada secreto; los secretos (JWT, base de datos) viven solo en Render.
- Las `VITE_` se leen **al compilar**: después de cambiar una hay que volver a desplegar
  (Redeploy) para que el cliente la use.

