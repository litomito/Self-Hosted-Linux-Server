#!/usr/bin/env bash
set -euo pipefail

# Root för repo (så scriptet funkar oavsett var du kör ifrån)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

ACTIVE_FILE="$ROOT_DIR/infra/nginx/active_upstream.conf"

# Läs nuvarande aktiv upstream från filen.
current_active() {
  if grep -q "app_green" "$ACTIVE_FILE"; then
    echo "green"
  else
    echo "blue"
  fi
}

# Skriv ny upstream i filen.
set_active() {
  local slot="$1" # blue eller green
  echo "include /etc/nginx/conf.d/upstream_${slot}.conf;" > "$ACTIVE_FILE"
}

# Reload Nginx inuti nginx-containern så den läser nya active_upstream.conf
reload_nginx() {
  docker exec nginx nginx -s reload
}

# --- Main ---
if [[ "${1:-}" != "blue" && "${1:-}" != "green" ]]; then
  echo "Usage: $0 <blue|green>"
  echo "Current active: $(current_active)"
  exit 1
fi

target="$1"
echo "Switching active upstream -> $target"

set_active "$target"
reload_nginx
"$ROOT_DIR/scripts/write-slot-metrics.sh"

echo "Done. Active is now: $target"
