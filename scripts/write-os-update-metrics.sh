#!/usr/bin/env bash
set -euo pipefail

METRICS_DIR="/tmp/node-exporter"
METRICS_FILE="$METRICS_DIR/platform_os_update.prom"

RESULT="${1:-unknown}"
TIMESTAMP="$(date +%s)"

mkdir -p "$METRICS_DIR"

case "$RESULT" in
  success)
    VALUE=1
    ;;
  failed)
    VALUE=0
    ;;
  rollback)
    VALUE=-1
    ;;
  *)
    VALUE=0
    ;;
esac

cat > "$METRICS_FILE" <<EOF
# HELP platform_os_update_result Last OS update result. 1=success, 0=failed, -1=rollback
# TYPE platform_os_update_result gauge
platform_os_update_result{result="$RESULT"} $VALUE

# HELP platform_os_update_timestamp_seconds Unix timestamp of last OS update attempt
# TYPE platform_os_update_timestamp_seconds gauge
platform_os_update_timestamp_seconds $TIMESTAMP
EOF

echo "Wrote OS update metrics to $METRICS_FILE"
