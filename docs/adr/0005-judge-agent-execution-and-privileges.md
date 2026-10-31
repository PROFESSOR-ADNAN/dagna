# ADR 0005: Judge Agent Execution Model and Least-Privilege Daemon Architecture

## Status
Accepted

## Context
The judge agent must poll for jobs, download test packages, compile code, execute tests inside sandboxes, verify hygiene, and return verdicts to the Core Host gateway. We must choose how the judge agent runs on the Judge Host and determine the minimal set of privileges required.

## Decision
1. **Systemd Daemon:** The judge agent executes as a native systemd service (`dagna-judge-agent.service`) on the Judge Host under an unprivileged system user (`dagna-judge`, UID 1001).
2. **Delegated cgroup v2 Subtree:** Systemd delegates a dedicated cgroup subtree (`/sys/fs/cgroup/dagna`) to the `dagna-judge` user using `Delegate=yes` in the unit configuration. This grants the unprivileged agent full authority to create, configure, and tear down per-job child cgroups without running as root or using `sudo`.
3. **No Docker Daemon on Judge Host:** Untrusted code is never passed to Docker containers on the judge host. Docker socket mounting is strictly forbidden.
4. **Kill Switch:** `scripts/pause-judging.sh` and systemd unit stops permit clean process shutdown, clearing scratch storage and active cgroups in < 1 second.

## Alternatives Considered
- *Agent running as Root:* Unacceptable attack surface. Any bug in the agent binary could result in immediate host takeover.
- *Agent running inside Docker:* Requires `--privileged` or mounting the Docker socket to create namespaces and cgroups, defeating the purpose of containerization.

## Consequences
- Requires host systemd configuration during initial Ansible provisioning.
- Keeps host OS clean, easily auditable, and minimizes operational complexity.
