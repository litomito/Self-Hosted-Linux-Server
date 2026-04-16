#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HEAL_SCRIPT="$ROOT_DIR/scripts/heal.sh"
WRITE_CONTAINER_HEALTH_METRICS="$ROOT_DIR/scripts/write-container-health-metrics.sh"

echo "[listener] starting docker event listener..."

docker events \
  --filter type=container \
  --format '{{.Actor.Attributes.name}}|{{.Action}}' |
while IFS='|' read -r container action; do
  case "$container" in
    app_blue|app_green)
      ;;
    *)
      continue
      ;;
  esac

  case "$action" in
    "die"|"health_status: unhealthy"|"health_status: healthy"|"start"|"restart")
      echo "[listener] event: container=$container action=$action"
      "$WRITE_CONTAINER_HEALTH_METRICS" || true
      ;;
    *)
      continue
      ;;
  esac

  if [[ "$action" == "health_status: unhealthy" ]]; then
    "$HEAL_SCRIPT" "$container" "health_status_unhealthy" || true
  elif [[ "$action" == "die" ]]; then
    "$HEAL_SCRIPT" "$container" "container_died" || true
  fi
done
