# ADR 0020: Observability Stack, Cardinality Rules, and Synthetic Probes

## Status
Accepted

## Context
Operating an online judge requires real-time insight into queue depth, judging latency, sandbox health, and error rates. Unbounded metric label cardinality (e.g. labeling metrics with user IDs, submission IDs, or problem IDs) causes Prometheus memory exhaustion.

## Decision
1. **Metrics Collection:**
   Prometheus scrapes Core services (API, worker) and Judge Node exporters.
2. **Strict Cardinality Rules:**
   - **Allowed Labels:** `verdict` (AC, WA, TLE, MLE, RE, OLE, CE, SE), `language` (cpp, python, java, javascript), `priority` (0, 1, 2, 3), `node_id` (bounded to fleet size ≤ 20), `status_code` (2xx, 4xx, 5xx), `route_group` (auth, submissions, problems, contests).
   - **Banned Labels:** User IDs, submission IDs, problem IDs, contest IDs, client IPs, cursors.
3. **Logs:**
   Structured JSON logs ingested via Grafana Alloy to Loki. Sensitive fields (`source`, `test input`, `tokens`, `passwords`) are scrubbed at source.
4. **Synthetic Canary Probes:**
   A synthetic probe executes every 60 seconds on every active judge node, submitting canary solutions (known AC, WA, TLE, MLE, RE, CE) and asserting exact verdicts. Mismatches trigger immediate SEV2 (or SEV1 for sandbox failure) alerts.
