#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ACTIVE_FILE="$ROOT_DIR/infra/nginx/active_upstream.conf"
OUT_DIR="/tmp/node-exporter"
OUT_FILE="$OUT_DIR/platform_slot.prom"

mkdir -p "$OUT_DIR"

if grep -q "upstream_green.conf" "$ACTIVE_FILE"; then
  ACTIVE="green"
  STANDBY="blue"
else
  ACTIVE="blue"
  STANDBY="green"
fi

cat > "$OUT_FILE" <<EOF
platform_active_slot{slot="blue"} $( [[ "$ACTIVE" == "blue" ]] && echo 1 || echo 0 )
platform_active_slot{slot="green"} $( [[ "$ACTIVE" == "green" ]] && echo 1 || echo 0 )
platform_standby_slot{slot="blue"} $( [[ "$STANDBY" == "blue" ]] && echo 1 || echo 0 )
platform_standby_slot{slot="green"} $( [[ "$STANDBY" == "green" ]] && echo 1 || echo 0 )
EOF

echo "Wrote $OUT_FILE"
