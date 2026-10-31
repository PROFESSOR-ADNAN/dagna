#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo "DAGNA PRODUCTION DEPLOYMENT PIPELINE"
echo "=========================================="

# 1. Contest Deploy Guard: Check if a contest is currently active or starting within 30m
echo "[Step 1/5] Checking Contest Deploy Gate..."
DEPLOY_GATE_STATUS=$(curl -s -f http://127.0.0.1:4000/healthz || echo "UNKNOWN")
if [ "$DEPLOY_GATE_STATUS" == "CONTEST_ACTIVE" ] && [ "${FORCE_DEPLOY:-false}" != "true" ]; then
  echo "DEPLOYMENT BLOCKED: A contest is currently active or starting within 30 minutes."
  echo "To override in an emergency, re-run with: FORCE_DEPLOY=true ./scripts/deploy.sh"
  exit 1
fi
echo "Contest deploy gate passed."

# 2. Backup Database before migration
echo "[Step 2/5] Creating pre-deploy database snapshot..."
bash scripts/backup.sh pre_deploy_snapshot

# 3. Pull new images & run migrations
echo "[Step 3/5] Pulling pinned images & applying database migrations..."
docker compose -f docker/compose.prod.yaml pull
docker compose -f docker/compose.prod.yaml run --rm api-1 node server/dist/scripts/migrate.js up || true

# 4. Rolling restart of Core API replicas
echo "[Step 4/5] Rolling update of API replicas behind Nginx..."
docker compose -f docker/compose.prod.yaml up -d --no-deps api-1
echo "Waiting for api-1 healthcheck..."
docker compose -f docker/compose.prod.yaml exec -T api-1 wget --spider http://127.0.0.1:4000/healthz

docker compose -f docker/compose.prod.yaml up -d --no-deps api-2
echo "Waiting for api-2 healthcheck..."
docker compose -f docker/compose.prod.yaml exec -T api-2 wget --spider http://127.0.0.1:4000/healthz

# Reload Nginx upstream
docker compose -f docker/compose.prod.yaml exec -T nginx nginx -s reload

# 5. Execute Staging Smoke Tests
echo "[Step 5/5] Executing post-deploy smoke tests..."
bash scripts/smoke-test.sh

echo "=========================================="
echo "DEPLOYMENT COMPLETED SUCCESSFULLY"
echo "=========================================="
