#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION_FILE="$ROOT_DIR/VERSION"
METRICS_DIR="/tmp/node-exporter"
METRICS_FILE="$METRICS_DIR/platform_version.prom"

mkdir -p "$METRICS_DIR"

if [[ ! -f "$VERSION_FILE" ]]; then
  echo "ERROR: VERSION file not found at $VERSION_FILE"
  exit 1
fi

APP_VERSION="$(tr -d '[:space:]' < "$VERSION_FILE")"

if [[ -z "$APP_VERSION" ]]; then
  echo "ERROR: VERSION file is empty"
  exit 1
fi

cat > "$METRICS_FILE" <<EOF
# HELP platform_version_info Current platform version from VERSION file
# TYPE platform_version_info gauge
platform_version_info{version="$APP_VERSION"} 1
EOF

echo "Wrote version metrics to $METRICS_FILE"
