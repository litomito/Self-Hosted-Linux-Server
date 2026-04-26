#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

COMPOSE_FILE="$ROOT_DIR/infra/compose/docker-compose.yml"
ACTIVE_FILE="$ROOT_DIR/infra/nginx/active_upstream.conf"
WRITE_DEPLOY_METRICS="$ROOT_DIR/scripts/write-deploy-metrics.sh"
WRITE_VERSION_METRICS="$ROOT_DIR/scripts/write-version-metrics.sh"
VERSION_FILE="$ROOT_DIR/VERSION"

if [[ ! -f "$VERSION_FILE" ]]; then
  echo "ERROR: VERSION file not found at $VERSION_FILE"
  exit 1
fi

APP_VERSION="$(tr -d '[:space:]' < "$VERSION_FILE")"

if [[ -z "$APP_VERSION" ]]; then
  echo "ERROR: VERSION file is empty"
  exit 1
fi

export APP_VERSION

GIT_TAG="$(git -C "$ROOT_DIR" tag --points-at HEAD | tail -n 1 || true)"
GIT_COMMIT="$(git -C "$ROOT_DIR" rev-parse --short HEAD || true)"

echo "Deploy version: $APP_VERSION"

if [[ -n "$GIT_TAG" ]]; then
  echo "Git tag:        $GIT_TAG"
else
  echo "Git commit:     $GIT_COMMIT"
fi

BLUE_HEALTH_URL="http://localhost:3001/health"
GREEN_HEALTH_URL="http://localhost:3002/health"

MAX_WAIT_SECONDS=30
SLEEP_SECONDS=2

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

health_url_for_slot() {
  local slot="$1"
  [[ "$slot" == "blue" ]] && echo "$BLUE_HEALTH_URL" || echo "$GREEN_HEALTH_URL"
}

service_name_for_slot() {
  local slot="$1"
  [[ "$slot" == "blue" ]] && echo "app_blue" || echo "app_green"
}

wait_for_health() {
  local url="$1"
  local waited=0

  echo "Healthcheck: $url"

  while (( waited < MAX_WAIT_SECONDS )); do
    if curl -fsS --max-time 2 "$url" >/dev/null; then
      echo "Health OK ✅"
      return 0
    fi

    sleep "$SLEEP_SECONDS"
    waited=$(( waited + SLEEP_SECONDS ))
    echo "  waiting... (${waited}s/${MAX_WAIT_SECONDS}s)"
  done

  echo "Health FAIL ❌ (timeout)"
  return 1
}

rollback_inactive() {
  local slot="$1"
  local svc
  svc="$(service_name_for_slot "$slot")"

  echo "Rollback: stopping failed slot ($slot) => service $svc"
  APP_VERSION="$APP_VERSION" docker compose -f "$COMPOSE_FILE" stop "$svc" || true
  APP_VERSION="$APP_VERSION" docker compose -f "$COMPOSE_FILE" rm -f "$svc" || true
}

ACTIVE="$(active_slot)"
INACTIVE="$(inactive_slot)"
INACTIVE_SVC="$(service_name_for_slot "$INACTIVE")"
INACTIVE_HEALTH="$(health_url_for_slot "$INACTIVE")"

echo "Active slot:   $ACTIVE"
echo "Inactive slot: $INACTIVE"
echo "Deploying to:  $INACTIVE_SVC"

APP_VERSION="$APP_VERSION" docker compose --project-directory "$ROOT_DIR/infra/compose" -f "$COMPOSE_FILE" build "$INACTIVE_SVC"
APP_VERSION="$APP_VERSION" docker compose --project-directory "$ROOT_DIR/infra/compose" -f "$COMPOSE_FILE" up -d --no-deps --force-recreate "$INACTIVE_SVC"

if wait_for_health "$INACTIVE_HEALTH"; then
  echo "Switching traffic to $INACTIVE..."
  "$ROOT_DIR/scripts/switch.sh" "$INACTIVE"
  "$WRITE_DEPLOY_METRICS" success
  "$WRITE_VERSION_METRICS"

  echo "Deploy complete ✅ (active is now $INACTIVE)"
else
  echo "Deploy failed => rollback 🔁"
  rollback_inactive "$INACTIVE"
  "$WRITE_DEPLOY_METRICS" failed

  echo "Rollback done ✅ (active remains $ACTIVE)"
  exit 1
fi
