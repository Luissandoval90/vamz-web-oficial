#!/usr/bin/env bash
set -euo pipefail
umask 077
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"
test -d "$project_dir/data" || { echo "No existe el directorio de datos."; exit 1; }
backup_dir="${BACKUP_DIR:-$project_dir/backups}"
mkdir -p "$backup_dir"
required_kb="$(docker compose run --rm --no-deps -T --entrypoint du app -sk /data | awk '{print $1}')"
available_kb="$(df -Pk "$backup_dir" | awk 'NR == 2 {print $4}')"
if (( available_kb < required_kb + required_kb / 10 + 102400 )); then
  echo "No hay espacio suficiente para la copia. Usa BACKUP_DIR en otro disco o copia los datos a otro equipo."
  exit 1
fi
archive="$backup_dir/vamz-$(date -u +%Y%m%dT%H%M%SZ)-$RANDOM.tar.gz"
docker compose stop -t 30 app
trap 'docker compose start app >/dev/null' EXIT
docker compose run --rm --no-deps -T --entrypoint tar app -C / -czf - data > "$archive.part"
mv -- "$archive.part" "$archive"
echo "Copia creada: $archive"
