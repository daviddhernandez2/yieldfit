# shellcheck shell=bash
# Rotación de backups (DECISIONS.md 0039): conserva solo los N backups completos más recientes
# y borra el resto. La usa backup.sh al terminar un backup que ha pasado todas sus
# comprobaciones; la prueba está en rotacion.test.sh.
#
# Por qué: los backups contienen datos personales. Sin borrarlos, los datos de una cuenta
# eliminada seguirían en el portátil para siempre. Con 3 backups mensuales, como mucho unos
# 3 meses (lo que promete la nota de privacidad de la app).
#
# Qué cuenta como backup: una carpeta (no un enlace) con nombre AAAA-MM-DD_HHMM dentro de la
# raíz. Ese nombre ordena alfabéticamente igual que por fecha.
#   - Completo: tiene el archivo y su huella (<base>.archive.gz y .sha256), lo mismo que exige
#     backupReciente.js. Se conservan los N más recientes.
#   - Incompleto (un backup que falló a medias): no cuenta para los N y se borra. Si contara,
#     podría quedar una copia rota ocupando el sitio de una buena.
# Nada más se toca: ni archivos sueltos ni carpetas con otro nombre.
#
# Compatible con el bash 3.2 de macOS (sin mapfile).

# Uso: rotar_backups <raíz> <cuántos conservar> <base>
rotar_backups() {
  local raiz="${1:-}" conservar="${2:-}" base="${3:-}"

  # Protecciones antes de borrar nada.
  if [ -z "$raiz" ] || [ "$raiz" = "/" ] || [ ! -d "$raiz" ]; then
    echo "ERROR: rotar_backups necesita una carpeta de backups que exista (recibido: '$raiz')" >&2
    return 1
  fi
  if ! [[ "$conservar" =~ ^[1-9][0-9]*$ ]]; then
    echo "ERROR: rotar_backups necesita conservar al menos 1 (recibido: '$conservar')" >&2
    return 1
  fi
  if [ -z "$base" ]; then
    echo "ERROR: rotar_backups necesita el nombre de la base" >&2
    return 1
  fi

  # Se separan completos e incompletos. El glob de bash devuelve los nombres en orden
  # alfabético, que aquí es el cronológico: del más antiguo al más reciente.
  local completos=() incompletos=() ruta nombre
  for ruta in "$raiz"/*; do
    nombre="$(basename "$ruta")"
    if [ -d "$ruta" ] && [ ! -L "$ruta" ] && [[ "$nombre" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}_[0-9]{4}$ ]]; then
      if [ -f "$ruta/$base.archive.gz" ] && [ -f "$ruta/$base.archive.gz.sha256" ]; then
        completos+=("$nombre")
      else
        incompletos+=("$nombre")
      fi
    fi
  done

  local sobran=$(( ${#completos[@]} - conservar )) i
  local borrar=()
  if [ "$sobran" -gt 0 ]; then
    for (( i = 0; i < sobran; i++ )); do borrar+=("${completos[$i]}"); done
  fi
  if [ "${#incompletos[@]}" -gt 0 ]; then
    for nombre in "${incompletos[@]}"; do borrar+=("$nombre"); done
  fi

  if [ "${#borrar[@]}" -eq 0 ]; then
    echo "Rotación: ${#completos[@]} backups completos (se conservan hasta $conservar); no se borra ninguno."
    return 0
  fi
  for nombre in "${borrar[@]}"; do
    echo "→ Rotación: borrando el backup $nombre"
    rm -rf -- "${raiz:?}/$nombre"
  done
  local quedan=$(( ${#completos[@]} < conservar ? ${#completos[@]} : conservar ))
  echo "Rotación: se conservan los $quedan backups completos más recientes."
}
