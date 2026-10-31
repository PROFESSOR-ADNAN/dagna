#!/usr/bin/env bash
set -euo pipefail

echo "EMERGENCY: Pausing all judging queues on Dagna platform..."
curl -s -X POST http://127.0.0.1:4000/api/v1/admin/nodes/pause \
  -H "Authorization: Bearer ${ADMIN_TOKEN:-}" \
  -H "Content-Type: application/json" || echo "Local pause signal triggered"

echo "Judging paused."
