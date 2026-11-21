#!/usr/bin/env bash
# Prueba de restauración de un backup (ver docs/operaciones.md).
#
# Uso (desde /server):
#   npm run backup:restore-test                                  → el backup más reciente
#   npm run backup:restore-test -- ~/yieldfit-backups/AAAA-MM-DD_HHMM
#
# Restaura el backup en la base "yieldfit-restore-test" (NUNCA en "yieldfit") y
# compara, colección por colección, los documentos restaurados con los volcados.
# Un backup que nunca se ha restaurado no garantiza nada: esta prueba es la que
# demuestra que la copia sirve.
#
# Usa la misma URI del Llavero que backup.sh. Ese usuario solo tiene `read` sobre
# "yieldfit", así que aunque este script tuviera un error, Atlas impediría
# escribir en producción.

# -E: el trap ERR también se aplica dentro de funciones y subshells.
# -e: para en el primer error. -u: error si se usa una variable sin definir.
# -o pipefail: un fallo en cualquier parte de una tubería (cmd | tee) cuenta como fallo.
set -Eeuo pipefail

# Red de seguridad: si algo detiene el script sin pasar por error(), lo decimos.
# Un script de backup o verificación nunca puede terminar en silencio.
trap 'echo "ERROR: el script se ha detenido de forma inesperada (línea $LINENO). Revisa la salida anterior." >&2' ERR
umask 077

readonly SERVICIO_LLAVERO="yieldfit-backup"
readonly ORIGEN="yieldfit"
readonly DESTINO="yieldfit-restore-test"
readonly RAIZ_BACKUPS="$HOME/yieldfit-backups"

error() { echo "ERROR: $*" >&2; exit 1; }

# Lectura de la URI del Llavero y filtro que oculta la contraseña en toda la salida.
source "$(dirname "$0")/lib/credenciales.sh"
# Lectura de los recuentos de documentos de los logs.
source "$(dirname "$0")/lib/recuentos.sh"

for cmd in security mongorestore shasum perl; do
  command -v "$cmd" >/dev/null || error "no se encuentra '$cmd'. ¿Has instalado mongodb-database-tools?"
done

# Sin argumento: la carpeta más reciente (los nombres AAAA-MM-DD_HHMM se ordenan bien
# alfabéticamente).
DIR="${1:-$(ls -d "$RAIZ_BACKUPS"/*/ 2>/dev/null | sort | tail -n 1)}"
DIR="${DIR%/}"
ARCHIVO="$DIR/$ORIGEN.archive.gz"
[ -f "$ARCHIVO" ] || error "no hay ningún backup en '$DIR'"

echo "→ Comprobando la huella SHA-256 de $ARCHIVO"
(cd "$DIR" && shasum -a 256 -c "$ORIGEN.archive.gz.sha256") || error "el archivo no coincide con su huella: está dañado"

leer_uri_del_llavero "$SERVICIO_LLAVERO"

echo "→ Restaurando en '$DESTINO'"
# --nsFrom/--nsTo renombran "yieldfit.*" a "yieldfit-restore-test.*" al restaurar.
# --drop vacía antes cada colección de destino, para que la prueba se pueda repetir.
mongorestore --config=<(config_uri) --archive="$ARCHIVO" --gzip \
  --nsInclude "$ORIGEN.*" --nsFrom "$ORIGEN.*" --nsTo "$DESTINO.*" --drop \
  2>&1 | ocultar_credenciales | tee "$DIR/restore-test.log"

# Comparación: documentos volcados (mongodump.log) frente a restaurados.
# Cada colección volcada tiene que aparecer restaurada, con los mismos documentos y
# 0 fallos. Cualquier cosa que no se pueda leer cuenta como fallo, nunca como éxito.
VOLCADOS="$(leer_volcados "$DIR/mongodump.log" "$ORIGEN")"
RESTAURADOS="$(leer_restaurados "$DIR/restore-test.log" "$DESTINO")"
TOTAL_FALLIDOS="$(leer_total_fallidos "$DIR/restore-test.log")"

[ -n "$VOLCADOS" ] \
  || error "no se han podido leer los documentos volcados de $DIR/mongodump.log (¿ha cambiado el formato del log?)"
[ -n "$RESTAURADOS" ] \
  || error "no se han podido leer los documentos restaurados de $DIR/restore-test.log (¿ha cambiado el formato del log?)"

echo
echo "Comparación por colección (volcados → restaurados):"
fallos=0
while read -r coleccion esperados; do
  # awk devuelve vacío (no error) si la colección no aparece en la restauración.
  linea="$(awk -v c="$coleccion" '$1 == c { print $2, $3 }' <<< "$RESTAURADOS")"
  read -r restaurados fallidos <<< "$linea" || true
  if [ "${restaurados:-}" = "$esperados" ] && [ "${fallidos:-}" = "0" ]; then
    echo "  OK    $coleccion: $esperados → $restaurados"
  else
    echo "  FALLO $coleccion: $esperados → ${restaurados:-no aparece} (fallos: ${fallidos:-?})"
    fallos=$((fallos + 1))
  fi
done <<< "$VOLCADOS"

echo
if [ "${TOTAL_FALLIDOS:-}" != "0" ]; then
  error "mongorestore no confirma 0 documentos fallidos (leído: '${TOTAL_FALLIDOS:-nada}'). Revisa $DIR/restore-test.log"
fi
if [ "$fallos" -ne 0 ]; then
  error "$fallos colecciones no coinciden (revisa $DIR/restore-test.log)"
fi

echo "Restauración verificada: todas las colecciones coinciden y 0 documentos fallidos."
echo "Borra '$DESTINO' desde Atlas cuando ya no la necesites: contiene una copia de"
echo "los datos de producción."
