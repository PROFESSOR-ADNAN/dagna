# ADR 0002: Docker Compose on Core Host instead of Kubernetes

## Status
Accepted

## Context
Deploying an online judge platform requires orchestration of several stateless microservices (API replicas, worker, scheduler, web static build) alongside stateful databases (MongoDB, Redis). Kubernetes is often proposed as a default container orchestrator, but introduces significant operational overhead (etcd clusters, CNI networking, ingress controllers, certificate managers, control-plane memory footprint).

## Decision
We utilize Docker Compose with `compose.prod.yaml` on the Core Host. Systemd manages the Docker daemon, while Docker Compose handles health checks, restarts (`unless-stopped`), resource limits (`cpus: 1.5`, `mem_limit: 1.5g`), internal isolated bridge networks, and log rotation via the `json-file` driver with `max-size: 50m`.

## Alternatives Considered
- *Kubernetes (k3s / k8s):* Consumes ~1.5 GB RAM just for control plane components on a 4 GB VPS, leaving insufficient headroom for MongoDB WiredTiger caches and Redis.
- *Nomad:* Lighter than Kubernetes, but adds an additional external binary dependency and complexity without providing proportional benefits for a single core host.

## Consequences
Zero-downtime rolling deploys are executed via a blue-green Nginx upstream reload script (`scripts/deploy.sh`) swapping between container replicas.
