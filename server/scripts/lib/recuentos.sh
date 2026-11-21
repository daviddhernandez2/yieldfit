# Lectura de los recuentos de documentos de los logs de mongodump y mongorestore.
# La usan backup.sh y restore-test.sh, para que el formato esperado esté en un solo
# sitio. Se carga con `source`.
#
# Formato real de mongodump/mongorestore 100.x (con comillas invertidas):
#   done dumping `yieldfit.sessions` (30 documents)
#   finished restoring `yieldfit-restore-test.sessions` (30 documents, 0 failures)
#   680 document(s) restored successfully. 0 document(s) failed to restore.
# Las comillas se aceptan como opcionales por si otra versión no las pone.
#
# Se usa perl y no grep: grep devuelve error cuando no encuentra nada y, con
# `set -e -o pipefail`, eso detenía el script en silencio. perl termina bien aunque
# no haya coincidencias; quien llama comprueba si el resultado está vacío.

# Imprime "coleccion documentos" por cada colección volcada.
leer_volcados() {
  local log="$1" base="$2"
  BASE_LOG="$base" perl -ne '
    print "$1 $2\n" if /done dumping `?\Q$ENV{BASE_LOG}\E\.([\w-]+)`? \((\d+) documents?\)/
  ' "$log"
}

# Imprime "coleccion documentos fallos" por cada colección restaurada.
leer_restaurados() {
  local log="$1" base="$2"
  BASE_LOG="$base" perl -ne '
    print "$1 $2 $3\n" if /finished restoring `?\Q$ENV{BASE_LOG}\E\.([\w-]+)`? \((\d+) documents?, (\d+) failures?\)/
  ' "$log"
}

# Imprime el número total de documentos que no se pudieron restaurar (línea final).
leer_total_fallidos() {
  perl -ne 'print "$1\n" if /(\d+) document\(s\) failed to restore/' "$1"
}
