#!/usr/bin/env bash
set -euo pipefail

METRIC_DIR="/tmp/node-exporter"
METRIC_FILE="$METRIC_DIR/platform_deploy.prom"

mkdir -p "$METRIC_DIR"

result="${1:-}"
timestamp="$(date +%s)"

if [[ "$result" != "success" && "$result" != "failed" ]]; then
  echo "Usage: $0 <success|failed>"
  exit 1
fi

if [[ "$result" == "success" ]]; then
  success_value=1
else
  success_value=0
fi

cat > "$METRIC_FILE" <<EOF
platform_last_deploy_success $success_value
platform_last_deploy_timestamp $timestamp
EOF

echo "Wrote deploy metrics to $METRIC_FILE"
