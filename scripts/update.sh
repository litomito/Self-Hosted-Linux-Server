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

tag_commit() {
  local tag="$1"
  git rev-list -n 1 "$tag"
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

CURRENT_COMMIT_FULL="$(git rev-parse HEAD)"
LATEST_TAG_COMMIT="$(tag_commit "$LATEST_TAG")"

echo "Latest commit:   ${LATEST_TAG_COMMIT:0:7}"

if [[ "$CURRENT_COMMIT_FULL" == "$LATEST_TAG_COMMIT" ]]; then
  echo
  echo "Already up to date ✅"
  echo "No update needed."
  exit 0
fi

echo
echo "Update available:"
echo "Current commit:  ${CURRENT_COMMIT_FULL:0:7}"
echo "Target tag:      $LATEST_TAG"
echo "Target commit:   ${LATEST_TAG_COMMIT:0:7}"

PREVIOUS_COMMIT="$CURRENT_COMMIT_FULL"
PREVIOUS_TAG="$CURRENT_TAG"

echo
echo "Saving rollback point:"
echo "Previous commit: ${PREVIOUS_COMMIT:0:7}"

if [[ -n "$PREVIOUS_TAG" ]]; then
  echo "Previous tag:    $PREVIOUS_TAG"
else
  echo "Previous tag:    none"
fi

echo
echo "Checking out target tag: $LATEST_TAG"
git checkout "$LATEST_TAG"

echo
echo "Checkout complete ✅"
echo "Now at:"
echo "Version: $(current_version)"
echo "Commit:  $(current_commit)"
echo "Tag:     $(current_tag)"

echo
echo "No deploy was performed in this step."
