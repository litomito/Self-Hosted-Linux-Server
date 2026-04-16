#!/usr/bin/env bash
set -euo pipefail

METRIC_DIR="/tmp/node-exporter"
METRIC_FILE="$METRIC_DIR/platform_container_health.prom"

mkdir -p "$METRIC_DIR"

get_health_value() {
  local container="$1"
  local status

  status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container" 2>/dev/null || echo "missing")"

  case "$status" in
    healthy)
      echo 1
      ;;
    unhealthy|exited|dead|missing)
      echo 0
      ;;
    starting|running|created|restarting)
      echo 0
      ;;
    *)
      echo 0
      ;;
  esac
}

BLUE_VALUE="$(get_health_value app_blue)"
GREEN_VALUE="$(get_health_value app_green)"

cat > "$METRIC_FILE" <<EOF
platform_container_health{container="app_blue"} $BLUE_VALUE
platform_container_health{container="app_green"} $GREEN_VALUE
EOF

echo "Wrote container health metrics to $METRIC_FILE"
