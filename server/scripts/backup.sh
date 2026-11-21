#!/usr/bin/env bash
# Backup completo de la base de PRODUCCIÓN (ver DECISIONS.md, 0018, y docs/operaciones.md).
#
# Uso (desde /server):  npm run backup
#
# Qué hace:
#   1. Lee la URI del usuario de solo lectura (yieldfit-backup) del Llavero de macOS.
#      La URI solo existe en memoria mientras dura el script: no está en ningún
#      archivo ni en el historial de la terminal.
#   2. Vuelca la base "yieldfit" en un único archivo comprimido en
#      ~/yieldfit-backups/AAAA-MM-DD_HHMM/ (fuera del repo; contiene datos personales).
#   3. Comprueba que el archivo está íntegro (gzip -t lo descomprime entero en memoria
#      y verifica su CRC) y guarda su huella SHA-256. Que además se puede RESTAURAR
#      solo lo demuestra `npm run backup:restore-test`.
#   4. Si BACKUP_COPIA_DIR está definida (p. ej. una carpeta del NAS), copia ahí el
#      backup y comprueba que la copia es idéntica. Si no lo está, avisa.
#
# Requisitos: mongodb-database-tools (brew) y la URI guardada en el Llavero con el
# servicio "yieldfit-backup".

# -E: el trap ERR también se aplica dentro de funciones y subshells.
# -e: para en el primer error. -u: error si se usa una variable sin definir.
# -o pipefail: un fallo en cualquier parte de una tubería (cmd | tee) cuenta como fallo.
set -Eeuo pipefail

# Red de seguridad: si algo detiene el script sin pasar por error(), lo decimos.
# Un script de backup o verificación nunca puede terminar en silencio.
trap 'echo "ERROR: el script se ha detenido de forma inesperada (línea $LINENO). Revisa la salida anterior." >&2' ERR

# Todo lo que cree este script (carpetas, archivos) será legible solo por tu usuario.
umask 077

readonly SERVICIO_LLAVERO="yieldfit-backup"
readonly BASE="yieldfit"
readonly RAIZ_BACKUPS="$HOME/yieldfit-backups"

error() { echo "ERROR: $*" >&2; exit 1; }

# Lectura de la URI del Llavero y filtro que oculta la contraseña en toda la salida.
source "$(dirname "$0")/lib/credenciales.sh"
# Lectura de los recuentos de documentos de los logs.
source "$(dirname "$0")/lib/recuentos.sh"

for cmd in security mongodump shasum perl gzip; do
  command -v "$cmd" >/dev/null || error "no se encuentra '$cmd'. ¿Has instalado mongodb-database-tools? (ver docs/operaciones.md)"
done

leer_uri_del_llavero "$SERVICIO_LLAVERO"

FECHA="$(date +%Y-%m-%d_%H%M)"
DIR="$RAIZ_BACKUPS/$FECHA"
ARCHIVO="$DIR/$BASE.archive.gz"

[ -e "$DIR" ] && error "ya existe $DIR (¿otro backup en el mismo minuto?)"
mkdir -p "$DIR"

echo "→ Volcando la base '$BASE' en $ARCHIVO"
# --archive + --gzip: un solo archivo comprimido, fácil de copiar y verificar.
# La salida de mongodump (va por stderr) pasa por el filtro y se guarda en un log para
# poder comparar después los documentos por colección con los de la restauración.
mongodump --config=<(config_uri) --db "$BASE" --archive="$ARCHIVO" --gzip 2>&1 | ocultar_credenciales | tee "$DIR/mongodump.log"

# No se usa `mongorestore --dryRun`: termina con "0 document(s) restored" y no está
# claro que lea el archivo entero, así que no demostraría nada.
echo "→ Comprobando la integridad del archivo (gzip -t)"
gzip -t "$ARCHIVO" || error "el archivo está dañado: no supera gzip -t"

# La huella permite comprobar que cualquier copia (NAS, otro disco) es idéntica.
(cd "$DIR" && shasum -a 256 "$BASE.archive.gz" > "$BASE.archive.gz.sha256")

VOLCADOS="$(leer_volcados "$DIR/mongodump.log" "$BASE")"
# Sin recuentos, restore-test no podría comparar nada: es un error, aunque el
# archivo exista.
[ -n "$VOLCADOS" ] \
  || error "backup en $DIR, pero no se han podido leer los documentos por colección de mongodump.log (¿ha cambiado el formato del log?)"

echo
echo "Documentos por colección:"
while read -r coleccion documentos; do
  echo "  $coleccion: $documentos"
done <<< "$VOLCADOS"
echo "Tamaño: $(du -h "$ARCHIVO" | cut -f1)"
echo "Archivo íntegro (gzip -t) y huella SHA-256 guardada."
echo "Backup local: $DIR"
echo "Pendiente: demostrar que se puede restaurar → npm run backup:restore-test"

# --- Segunda copia fuera del portátil ---
if [ -z "${BACKUP_COPIA_DIR:-}" ]; then
  echo
  echo "AVISO: BACKUP_COPIA_DIR no está definida. Solo existe la copia local de este portátil."
  exit 0
fi

# Si la variable está definida pero el destino no está disponible (p. ej. el NAS
# no está montado), la copia local es válida pero la externa ha fallado: lo
# tratamos como error para que no pase desapercibido.
[ -d "$BACKUP_COPIA_DIR" ] && [ -w "$BACKUP_COPIA_DIR" ] \
  || error "la copia local está bien ($DIR), pero BACKUP_COPIA_DIR ($BACKUP_COPIA_DIR) no existe o no se puede escribir. ¿Está montado el NAS?"

DESTINO="$BACKUP_COPIA_DIR/$FECHA"
mkdir -p "$DESTINO"
cp "$ARCHIVO" "$ARCHIVO.sha256" "$DIR/mongodump.log" "$DESTINO/"
(cd "$DESTINO" && shasum -a 256 -c "$BASE.archive.gz.sha256" >/dev/null) \
  || error "la copia en $DESTINO no coincide con el original"

echo "Segunda copia verificada: $DESTINO"
