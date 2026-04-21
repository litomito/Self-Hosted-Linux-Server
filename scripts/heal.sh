#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/compose/docker-compose.yml"
ACTIVE_FILE="$ROOT_DIR/infra/nginx/active_upstream.conf"
INCIDENT_DIR="$ROOT_DIR/docs/incidents"
STATE_DIR="$ROOT_DIR/.state"
VERSION_FILE="$ROOT_DIR/VERSION"

mkdir -p "$INCIDENT_DIR" "$STATE_DIR"
chmod 755 "$STATE_DIR" 2>/dev/null || true

BLUE_HEALTH_URL="http://localhost:3001/health"
GREEN_HEALTH_URL="http://localhost:3002/health"

MAX_WAIT_SECONDS=30
SLEEP_SECONDS=2
COOLDOWN_SECONDS=20

timestamp() {
  date +"%Y-%m-%dT%H:%M:%S%z"
}

platform_version() {
  if [[ -f "$VERSION_FILE" ]]; then
    tr -d '[:space:]' < "$VERSION_FILE"
  else
    echo "unknown"
  fi
}

git_tag() {
git -C "$ROOT_DIR" tag --points-at HEAD | tail -n 1 || true
}

git_commit() {
git -C "$ROOT_DIR" rev-parse --short HEAD || true
}

active_slot() {
  if grep -q "upstream_green.conf" "$ACTIVE_FILE"; then
    echo "green"
  else
    echo "blue"
  fi
}

inactive_slot() {
  [[ "$(active_slot)" == "blue" ]] && echo "green" || echo "blue"
}

service_name_for_slot() {
  local slot="$1"
  [[ "$slot" == "blue" ]] && echo "app_blue" || echo "app_green"
}

slot_for_service() {
  local service="$1"
  case "$service" in
    app_blue) echo "blue" ;;
    app_green) echo "green" ;;
    *)
      echo "unknown"
      ;;
  esac
}

health_url_for_slot() {
  local slot="$1"
  [[ "$slot" == "blue" ]] && echo "$BLUE_HEALTH_URL" || echo "$GREEN_HEALTH_URL"
}

container_health_status() {
  local service="$1"
  docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$service" 2>/dev/null || echo "missing"
}

wait_for_health() {
  local url="$1"
  local waited=0

  while (( waited < MAX_WAIT_SECONDS )); do
    if curl -fsS --max-time 2 "$url" >/dev/null; then
      return 0
    fi

    sleep "$SLEEP_SECONDS"
    waited=$(( waited + SLEEP_SECONDS ))
  done

  return 1
}

log_incident() {
  local service="$1"
  local slot="$2"
  local event="$3"
  local action="$4"
  local result="$5"

  local ts file
  ts="$(timestamp)"
  file="$INCIDENT_DIR/incident-${ts//:/-}-${service}.log"

cat > "$file" <<EOF
timestamp: $ts
platform_version: $(platform_version)
git_tag: $(git_tag)
git_commit: $(git_commit)
service: $service
slot: $slot
event: $event
action: $action
result: $result
active_slot_at_time: $(active_slot)
inactive_slot_at_time: $(inactive_slot)
service_state: $(container_health_status "$service")
EOF

  echo "[incident] wrote $file"
}

cooldown_ok() {
  local service="$1"
  local stamp_file="$STATE_DIR/${service}.cooldown"
  local now last

  now="$(date +%s)"

  if [[ -f "$stamp_file" ]]; then
    last="$(cat "$stamp_file")"
    if (( now - last < COOLDOWN_SECONDS )); then
      echo "[heal] cooldown active for $service"
      return 1
    fi
  fi

  echo "$now" > "$stamp_file"
  return 0
}

restart_service() {
  local service="$1"
  docker compose -f "$COMPOSE_FILE" restart "$service"
}

ensure_service_running() {
  local service="$1"
  docker compose -f "$COMPOSE_FILE" up -d --no-deps "$service"
}

main() {
  local service="${1:-}"
  local event="${2:-unknown}"

  if [[ -z "$service" ]]; then
    echo "Usage: $0 <app_blue|app_green> [event]"
    exit 1
  fi

  if [[ "$service" != "app_blue" && "$service" != "app_green" ]]; then
    echo "[heal] ignoring unsupported service: $service"
    exit 0
  fi

  if ! cooldown_ok "$service"; then
    exit 0
  fi

  local slot active inactive other_service this_health other_health
  slot="$(slot_for_service "$service")"
  active="$(active_slot)"
  inactive="$(inactive_slot)"
	
  if [[ "$slot" == "blue" ]]; then
	other_slot="green"
  else
	other_slot="blue"
  fi

  other_service="$(service_name_for_slot "$other_slot")"

  

  echo "[heal] event=$event service=$service slot=$slot active=$active inactive=$inactive"

  ensure_service_running "$service"

  this_health="$(container_health_status "$service")"
  other_health="$(container_health_status "$other_service")"

  echo "[heal] current status: $service=$this_health, $other_service=$other_health"

  if [[ "$slot" != "$active" ]]; then
    echo "[heal] unhealthy service is inactive slot, trying restart"
    restart_service "$service"

    if wait_for_health "$(health_url_for_slot "$slot")"; then
      echo "[heal] inactive slot recovered"
      log_incident "$service" "$slot" "$event" "restart_inactive" "success"
      exit 0
    else
      echo "[heal] inactive slot failed recovery"
      log_incident "$service" "$slot" "$event" "restart_inactive" "failed"
      exit 1
    fi
  fi

  echo "[heal] unhealthy service is ACTIVE slot"

  if wait_for_health "$(health_url_for_slot "$inactive")"; then
    echo "[heal] inactive slot is healthy, switching traffic first"
    "$ROOT_DIR/scripts/switch.sh" "$inactive"

    echo "[heal] trying to recover failed active slot in background role"
    restart_service "$service"

    if wait_for_health "$(health_url_for_slot "$slot")"; then
      log_incident "$service" "$slot" "$event" "switch_then_restart_active" "success"
      exit 0
    else
      log_incident "$service" "$slot" "$event" "switch_then_restart_active" "failed_recovery_but_traffic_preserved"
      exit 0
    fi
  fi

  echo "[heal] no healthy standby slot available, attempting in-place restart"
  restart_service "$service"

  if wait_for_health "$(health_url_for_slot "$slot")"; then
    echo "[heal] active slot recovered in place"
    log_incident "$service" "$slot" "$event" "restart_active_in_place" "success"
    exit 0
  fi

  echo "[heal] active slot did not recover"
  log_incident "$service" "$slot" "$event" "restart_active_in_place" "failed"
  exit 1
}

main "$@"
