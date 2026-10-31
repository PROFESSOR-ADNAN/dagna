#!/usr/bin/env bash
set -euo pipefail

BACKUP_TAR="${1:-}"

if [ -z "$BACKUP_TAR" ] || [ ! -f "$BACKUP_TAR" ]; then
  echo "Usage: ./scripts/restore.sh <path_to_backup.tar.gz>"
  exit 1
fi

RESTORE_DIR="/tmp/dagna_restore_scratch"
rm -rf "$RESTORE_DIR"
mkdir -p "$RESTORE_DIR"

echo "[RESTORE] Extracting backup snapshot..."
tar -xzf "$BACKUP_TAR" -C "$RESTORE_DIR"

BACKUP_FOLDER=$(find "$RESTORE_DIR" -mindepth 1 -maxdepth 1 -type d | head -n 1)

echo "[RESTORE] Restoring MongoDB with oplogReplay and drop..."
docker cp "$BACKUP_FOLDER/mongo" dagna-mongo:/data/db/restore_tmp
docker exec -t dagna-mongo mongorestore --oplogReplay --drop /data/db/restore_tmp
docker exec -t dagna-mongo rm -rf /data/db/restore_tmp

rm -rf "$RESTORE_DIR"
echo "[RESTORE] Database restored successfully. Verifying integrity..."
bash scripts/smoke-test.sh
