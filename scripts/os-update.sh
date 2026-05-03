#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="/var/lib/self-healing-linux/os-state"
LOG_DIR="$ROOT_DIR/docs/os-updates"
COMPOSE_FILE="$ROOT_DIR/infra/compose/docker-compose.yml"
WRITE_OS_UPDATE_METRICS="$ROOT_DIR/scripts/write-os-update-metrics.sh"

mkdir -p "$STATE_DIR" "$LOG_DIR"

TS="$(date +"%Y-%m-%dT%H-%M-%S%z")"
PACKAGE_STATE="$STATE_DIR/packages-before-$TS.txt"
GIT_STATE="$STATE_DIR/git-before-$TS.txt"
LOG_FILE="$LOG_DIR/os-update-$TS.log"

log() {
  echo "[$(date +"%Y-%m-%dT%H:%M:%S%z")] $*" | tee -a "$LOG_FILE"
}

verify_platform() {
  log "Verifying Docker..."
  docker info >/dev/null

  log "Verifying Docker Compose config..."
  docker compose -f "$COMPOSE_FILE" config >/dev/null

  log "Verifying containers..."
  docker compose -f "$COMPOSE_FILE" ps

  log "Verifying Nginx health..."
  curl -fsS --max-time 5 http://localhost/_nginx_health >/dev/null

  log "Verifying app health via Nginx..."
  curl -fsS --max-time 5 http://localhost/health >/dev/null

  log "Verifying Prometheus..."
  curl -fsS --max-time 5 http://localhost:9090/-/healthy >/dev/null

  log "Platform verification OK ✅"
}

rollback_packages() {
  log "Attempting package rollback..."

  if [[ ! -f "$PACKAGE_STATE" ]]; then
    log "No package state found. Cannot rollback packages."
    return 1
  fi

  sudo apt-get update

  while IFS= read -r pkg; do
    if [[ -n "$pkg" ]]; then
      sudo apt-get install -y --allow-downgrades "$pkg" || true
    fi
  done < "$PACKAGE_STATE"

  log "Package rollback attempt finished."
}

main() {
  log "OS Update Guard started"
  log "Saving package state..."
  dpkg-query -W -f='${binary:Package}=${Version}\n' > "$PACKAGE_STATE"

  log "Saving Git state..."
  {
    echo "branch: $(git -C "$ROOT_DIR" branch --show-current || true)"
    echo "commit: $(git -C "$ROOT_DIR" rev-parse HEAD || true)"
    echo "tag: $(git -C "$ROOT_DIR" tag --points-at HEAD | tail -n 1 || true)"
  } > "$GIT_STATE"

  log "Running pre-update platform verification..."
  verify_platform

  log "Running apt update..."
  sudo apt-get update

  log "Running apt upgrade..."
  if sudo apt-get upgrade -y; then
    log "APT upgrade completed ✅"
  else
    log "APT upgrade failed ❌"
    rollback_packages
    exit 1
  fi

  log "Restarting platform stack..."
  "$ROOT_DIR/scripts/deploy.sh"

  log "Running post-update platform verification..."
  if verify_platform; then
    "$WRITE_OS_UPDATE_METRICS" success
    log "OS update completed successfully ✅"
    exit 0
  fi

  log "Post-update verification failed ❌"
  rollback_packages

  log "Restarting platform after rollback..."
  "$ROOT_DIR/scripts/deploy.sh"

  log "Verifying platform after rollback..."
  verify_platform

  "$WRITE_OS_UPDATE_METRICS" rollback
  log "Rollback completed ✅"
}

main "$@"
