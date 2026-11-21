# Funciones compartidas por backup.sh y restore-test.sh para manejar la URI de
# producción sin que la contraseña llegue nunca a la terminal ni a un log.
# Se carga con `source`; no se ejecuta por sí solo.

# Lee la URI del Llavero y deja en variables globales:
#   URI   → la URI completa (solo en memoria mientras dura el script)
#   CLAVE → la contraseña sacada de la URI, para el filtro
leer_uri_del_llavero() {
  local servicio="$1" credenciales
  # 2>/dev/null: si no existe la entrada, security imprime su propio mensaje.
  URI="$(security find-generic-password -s "$servicio" -w 2>/dev/null)" \
    || error "no hay ninguna entrada '$servicio' en el Llavero (ver docs/operaciones.md)"

  # Lo que hay entre "://" y la primera "@" son las credenciales "usuario:contraseña".
  credenciales="${URI#*://}"
  credenciales="${credenciales%%@*}"
  CLAVE=""
  if [[ "$credenciales" == *:* ]]; then
    CLAVE="${credenciales#*:}"
  fi
}

# Configuración para --config de mongodump/mongorestore. Se usa con process substitution:
#   mongodump --config=<(config_uri) ...
# Así la URI no va en los argumentos del proceso (que `ps` muestra a cualquier proceso
# del usuario mientras dura el backup) ni se escribe en disco: <(...) es un descriptor
# /dev/fd/N que solo existe mientras dura el comando.
config_uri() {
  printf 'uri: "%s"\n' "$URI"
}

# mongodump y mongorestore NO ocultan la contraseña: si no pueden conectar, imprimen
# "failed to connect to mongodb+srv://usuario:CONTRASEÑA@...". Toda su salida
# (estándar y de error) pasa por este filtro antes de llegar a la terminal o a un log.
# Dos reglas, porque una sola no basta:
#   1. cualquier URI mongodb:// o mongodb+srv:// con credenciales → usuario:***@
#   2. la contraseña concreta, también decodificada (p. ej. %40 → @), en cualquier
#      sitio, por si alguna herramienta la imprime fuera de una URI.
# Se usa perl (incluido en macOS) porque \Q...\E sustituye texto literal sin tener que
# escapar caracteres especiales de la contraseña. $| = 1 escribe línea a línea.
ocultar_credenciales() {
  CLAVE="${CLAVE:-}" perl -pe '
    BEGIN {
      $| = 1;
      $clave = $ENV{CLAVE} // "";
      ($decodificada = $clave) =~ s/%([0-9A-Fa-f]{2})/chr(hex($1))/ge;
    }
    s{(mongodb(?:\+srv)?://[^:/\@\s]+):[^\@\s]*\@}{$1:***\@}g;
    if (length $clave) { s/\Q$clave\E/***/g; s/\Q$decodificada\E/***/g; }
  '
}
