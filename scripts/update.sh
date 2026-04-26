#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION_FILE="$ROOT_DIR/VERSION"
COMPOSE_FILE="$ROOT_DIR/infra/compose/docker-compose.yml"
DEPLOY_SCRIPT="$ROOT_DIR/scripts/deploy.sh"

cd "$ROOT_DIR"

current_version() {
  [[ -f "$VERSION_FILE" ]] && tr -d '[:space:]' < "$VERSION_FILE" || echo "unknown"
}

current_commit() {
  git rev-parse --short HEAD
}

current_tag() {
  git tag --points-at HEAD | tail -n 1 || true
}

latest_tag() {
  git tag --sort=-v:refname | head -n 1
}

preflight_checks() {
  echo
  echo "Running preflight checks..."

  command -v git >/dev/null || { echo "ERROR: git is missing"; exit 1; }
  command -v docker >/dev/null || { echo "ERROR: docker is missing"; exit 1; }
  command -v curl >/dev/null || { echo "ERROR: curl is missing"; exit 1; }

  [[ -f "$VERSION_FILE" ]] || { echo "ERROR: VERSION file missing"; exit 1; }
  [[ -f "$COMPOSE_FILE" ]] || { echo "ERROR: docker-compose.yml missing"; exit 1; }
  [[ -x "$DEPLOY_SCRIPT" ]] || { echo "ERROR: deploy.sh missing or not executable"; exit 1; }

  docker compose -f "$COMPOSE_FILE" config >/dev/null

  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "ERROR: Git working tree is not clean."
    echo "Commit or stash your changes before running update."
    exit 1
  fi

  echo "Preflight checks OK ✅"
}

echo "Platform updater"
echo "================"
echo "Current version: $(current_version)"
echo "Current commit:  $(current_commit)"

CURRENT_TAG="$(current_tag)"

if [[ -n "$CURRENT_TAG" ]]; then
  echo "Current tag:     $CURRENT_TAG"
else
  echo "Current tag:     none"
fi

preflight_checks

echo
echo "Fetching latest Git tags..."
git fetch --tags

LATEST_TAG="$(latest_tag)"

if [[ -z "$LATEST_TAG" ]]; then
  echo "No Git tags found."
  exit 1
fi

echo "Latest tag:      $LATEST_TAG"

echo
echo "Update check complete."
echo "No changes were made in this step."
