#!/usr/bin/env bash
set -euo pipefail

NODE_ID="${1:-}"

if [ -z "$NODE_ID" ]; then
  echo "Usage: ./scripts/quarantine-node.sh <nodeId>"
  exit 1
fi

echo "Quarantining judge node: $NODE_ID..."
curl -s -X POST "http://127.0.0.1:4000/api/v1/admin/nodes/$NODE_ID/state" \
  -H "Authorization: Bearer ${ADMIN_TOKEN:-}" \
  -H "Content-Type: application/json" \
  -d '{"state": "quarantined"}'

echo "Node $NODE_ID transitioned to quarantined state. Future lease claims rejected."
