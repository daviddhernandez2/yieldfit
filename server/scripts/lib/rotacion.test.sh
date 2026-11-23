#!/usr/bin/env bash
# Prueba de rotar_backups (lib/rotacion.sh) sobre carpetas falsas en una carpeta temporal:
# nunca toca ~/yieldfit-backups.
# Ejecutar desde server/: bash scripts/lib/rotacion.test.sh
set -Eeuo pipefail

source "$(dirname "$0")/rotacion.sh"

TEMPORAL="$(mktemp -d)"
trap 'rm -rf -- "$TEMPORAL"' EXIT
fallos=0

# Crea un backup falso: completo (archivo + huella) o incompleto (solo el log).
backup() {
  mkdir -p "$1/$2"
  if [ "$3" = completo ]; then
    : > "$1/$2/yieldfit.archive.gz"
    : > "$1/$2/yieldfit.archive.gz.sha256"
  else
    : > "$1/$2/mongodump.log"
  fi
}

comprobar() { # descripción, lista esperada, carpeta
  local obtenido
  obtenido="$(cd "$3" && ls -1 | tr '\n' ' ' | sed 's/ $//')"
  if [ "$obtenido" = "$2" ]; then
    echo "  ok: $1"
  else
    echo "  FALLA: $1"
    echo "    esperado: $2"
    echo "    obtenido: $obtenido"
    fallos=$((fallos + 1))
  fi
}

echo "1. Cinco completos, un incompleto y cosas que no son backups:"
R="$TEMPORAL/caso1"; mkdir -p "$R"
backup "$R" 2026-07-01_1000 completo
backup "$R" 2026-08-01_1000 completo
backup "$R" 2026-08-15_0900 incompleto
backup "$R" 2026-09-01_1000 completo
backup "$R" 2026-10-01_1000 completo
backup "$R" 2026-11-01_1000 completo
mkdir -p "$R/otra-carpeta"; : > "$R/notas.txt"
ln -s "$R/2026-07-01_1000" "$R/2026-06-01_1000" # enlace con nombre de backup: no se sigue
rotar_backups "$R" 3 yieldfit > /dev/null
comprobar "quedan los 3 completos más recientes; lo demás no se toca" \
  "2026-06-01_1000 2026-09-01_1000 2026-10-01_1000 2026-11-01_1000 notas.txt otra-carpeta" "$R"

echo "2. Solo dos completos (menos de 3):"
R="$TEMPORAL/caso2"; mkdir -p "$R"
backup "$R" 2026-10-01_1000 completo
backup "$R" 2026-11-01_1000 completo
rotar_backups "$R" 3 yieldfit > /dev/null
comprobar "no se borra ninguno" "2026-10-01_1000 2026-11-01_1000" "$R"

echo "3. Un incompleto más reciente que todos los completos:"
R="$TEMPORAL/caso3"; mkdir -p "$R"
backup "$R" 2026-10-01_1000 completo
backup "$R" 2026-11-01_1000 incompleto
rotar_backups "$R" 3 yieldfit > /dev/null
comprobar "el incompleto se borra y el completo se queda" "2026-10-01_1000" "$R"

echo "4. Argumentos no válidos (no debe borrar nada):"
R="$TEMPORAL/caso4"; mkdir -p "$R"
backup "$R" 2026-10-01_1000 completo
for argumentos in "/ 3 yieldfit" " 3 yieldfit" "$R 0 yieldfit" "$R tres yieldfit" "$R 3 " "$TEMPORAL/no-existe 3 yieldfit"; do
  # shellcheck disable=SC2086 # se quiere partir los argumentos por espacios
  if rotar_backups $argumentos > /dev/null 2>&1; then
    echo "  FALLA: aceptó argumentos no válidos: '$argumentos'"
    fallos=$((fallos + 1))
  fi
done
comprobar "rechaza argumentos no válidos" "2026-10-01_1000" "$R"

echo
if [ "$fallos" -eq 0 ]; then
  echo "rotacion: todas las pruebas pasan"
else
  echo "rotacion: $fallos prueba(s) fallan"
  exit 1
fi
