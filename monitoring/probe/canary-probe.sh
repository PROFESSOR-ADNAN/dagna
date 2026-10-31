#!/usr/bin/env bash
set -euo pipefail

echo "[CANARY PROBE] Initiating synthetic verdict assertions on Judge Fleet..."

# Executes the canary suite
node --test tests/integration/gateway_fencing.test.ts

echo "[CANARY PROBE] All canary tests exact. Fleet healthy."
