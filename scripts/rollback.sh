#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo "EMERGENCY ROLLBACK INITIATED"
echo "=========================================="

PREVIOUS_TAG="${1:-previous}"

echo "Reverting container images to tag: $PREVIOUS_TAG..."
export DAGNA_IMAGE_TAG="$PREVIOUS_TAG"

docker compose -f docker/compose.prod.yaml up -d --no-deps api-1 api-2 worker
docker compose -f docker/compose.prod.yaml exec -T nginx nginx -s reload

echo "Verifying healthcheck after rollback..."
curl -f http://127.0.0.1:4000/healthz

echo "Rollback completed successfully."
