#!/usr/bin/env bash
set -euo pipefail

BACKUP_NAME="${1:-backup_$(date +%Y%m%d_%H%M%S)}"
BACKUP_DIR="/tmp/dagna_backups/$BACKUP_NAME"

mkdir -p "$BACKUP_DIR"
echo "[BACKUP] Creating point-in-time MongoDB snapshot with oplog..."

docker exec -t dagna-mongo mongodump --oplog --out /data/db/dump_tmp
docker cp dagna-mongo:/data/db/dump_tmp "$BACKUP_DIR/mongo"
docker exec -t dagna-mongo rm -rf /data/db/dump_tmp

echo "[BACKUP] Compressing backup snapshot..."
tar -czf "$BACKUP_DIR.tar.gz" -C "/tmp/dagna_backups" "$BACKUP_NAME"
rm -rf "$BACKUP_DIR"

echo "[BACKUP] Snapshot saved: $BACKUP_DIR.tar.gz"
