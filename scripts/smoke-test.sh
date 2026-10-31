#!/usr/bin/env bash
set -euo pipefail

echo "Running Dagna Smoke Tests..."

# 1. Verify Core Healthz
echo "Checking API Health status..."
STATUS=$(curl -s http://127.0.0.1:4000/healthz | grep -o "ok" || echo "failed")
if [ "$STATUS" != "ok" ]; then
  echo "SMOKE TEST FAILED: /healthz did not respond with ok"
  exit 1
fi
echo "API Healthz: PASS"

# 2. Run test execution suite
echo "Running Canary verdict assertions..."
node --test tests/integration/gateway_fencing.test.ts

echo "Smoke tests green!"
