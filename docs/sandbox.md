# Dagna (ዳኛ) Multi-Layer Sandbox Design Specification

## 1. Isolation Layering

Every compilation, participant program, custom checker, and validator executes inside a multi-layered Linux containment envelope orchestrated by `dagna-sandbox`.

```
+-----------------------------------------------------------------------------------+
| Linux Kernel 6.8+ / 7.0+ (Host OS - Ubuntu 24.04 LTS)                            |
+-----------------------------------------------------------------------------------+
  |
  +--> [Layer 1: Linux Namespaces]
  |      CLONE_NEWUSER: Unprivileged UID 1001 mapped to root inside sandbox
  |      CLONE_NEWPID: Isolated PID table (sandbox PID 1 cannot see host PIDs)
  |      CLONE_NEWNET: Loopback down; 0 network interfaces; all socket calls fail
  |      CLONE_NEWNS:  Pivot root to read-only toolchain; empty 64MB tmpfs scratch
  |      CLONE_NEWIPC: No inter-process POSIX shared memory or semaphores
  |      CLONE_NEWUTS: Sandboxed hostname
  |
  +--> [Layer 2: cgroup v2 Controllers]
  |      cpu.max: Strict bandwidth quota; pinned to cpuset core
  |      memory.max: Hard memory ceiling (OOM kill on breach)
  |      memory.swap.max = 0: Zero swapping allowed
  |      memory.peak: Direct kernel-level peak memory accounting
  |      pids.max = 64: Instant containment of fork bombs
  |
  +--> [Layer 3: Seccomp BPF Allowlist & PRCTL]
  |      PR_SET_NO_NEW_PRIVS: Prevents setuid binary capability escalation
  |      Seccomp Allowlist: blocks ptrace, unshare, chroot, bpf, io_uring, sys_rawio
  |
  +--> [Layer 4: Supervisor Stream Bounding & Hygiene]
         Bounded stdout/stderr pipes: 16 MB max stdout, 4 KB stderr
         Zero lingering process verification, scratch wipe, cgroup teardown
```

## 2. Resource Accounting & Limits

1. **CPU Time Accounting:**
   - Evaluated by reading `/sys/fs/cgroup/dagna/<jobId>/cpu.stat` before and after execution:
     $$\Delta \text{CPU} = (\text{usage\_usec}_{\text{post}} - \text{usage\_usec}_{\text{pre}}) / 1000 \text{ ms}$$
   - Includes both `user_usec` and `system_usec`.
2. **Peak Memory Accounting:**
   - Evaluated directly from `/sys/fs/cgroup/dagna/<jobId>/memory.peak`.
   - If `/sys/fs/cgroup/dagna/<jobId>/memory.events` indicates `oom_kill > 0` or peak memory exceeds `memoryLimitMB * 1024 * 1024`, verdict is declared `MLE`.
3. **Wall-Clock Safety Net:**
   - Enforced by supervisor using a high-precision monotonic clock (`process.hrtime.bigint()`).
   - Limit: `max(2 * cpuLimitMs, cpuLimitMs + 2000)`.
   - If wall-clock expires, the supervisor sends `SIGKILL` to the entire cgroup subtree via `cgroup.kill = 1`.
4. **Output Limit (OLE):**
   - Output pipe reader limits captured bytes to 16 MB.
   - If program writes $> 16 \text{ MB}$, the supervisor terminates the process and marks verdict `OLE`.

## 3. Hygiene Verification Assertions

Immediately after sandbox termination, the supervisor asserts:
1. `cat /sys/fs/cgroup/dagna/<jobId>/cgroup.procs` is empty (0 processes).
2. All mount points inside the scratch tree have been cleanly unmounted.
3. The scratch directory (`/tmp/dagna-scratch-<jobId>`) is recursively removed.
4. The cgroup directory is removed via `rmdir`.
5. Any hygiene assertion failure transitions the node to `quarantined` and triggers a SEV1 alert.
