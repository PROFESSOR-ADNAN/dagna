import fs from 'node:fs';
import path from 'node:path';

export interface CgroupLimits {
  cpuLimitMs: number;
  memoryLimitMB: number;
  pidsMax?: number;
}

export interface CgroupMetrics {
  cpuTimeMs: number;
  peakMemoryKB: number;
  isOomKilled: boolean;
}

export class CgroupManager {
  private basePath = '/sys/fs/cgroup/dagna';
  private jobPath: string;
  private isCgroupV2Available = false;

  constructor(public jobId: string) {
    this.jobPath = path.join(this.basePath, jobId);
    this.checkAvailability();
  }

  private checkAvailability(): void {
    try {
      if (fs.existsSync('/sys/fs/cgroup/cgroup.controllers')) {
        this.isCgroupV2Available = true;
      }
    } catch {
      this.isCgroupV2Available = false;
    }
  }

  public isAvailable(): boolean {
    return this.isCgroupV2Available;
  }

  public async setup(limits: CgroupLimits): Promise<boolean> {
    if (!this.isCgroupV2Available) return false;

    try {
      if (!fs.existsSync(this.basePath)) {
        fs.mkdirSync(this.basePath, { recursive: true });
      }

      if (!fs.existsSync(this.jobPath)) {
        fs.mkdirSync(this.jobPath, { recursive: true });
      }

      // 1. Memory limit (bytes) and disable swap completely
      const memBytes = limits.memoryLimitMB * 1024 * 1024;
      fs.writeFileSync(path.join(this.jobPath, 'memory.max'), `${memBytes}\n`);
      try {
        fs.writeFileSync(path.join(this.jobPath, 'memory.swap.max'), '0\n');
      } catch {
        // Swap controller may be omitted if swap is already disabled on host
      }

      // 2. Pids max (fork bomb limit)
      const pids = limits.pidsMax || 64;
      fs.writeFileSync(path.join(this.jobPath, 'pids.max'), `${pids}\n`);

      // 3. Reset peak memory
      try {
        fs.writeFileSync(path.join(this.jobPath, 'memory.peak'), '0\n');
      } catch {
        // Ignored
      }

      return true;
    } catch (err) {
      return false;
    }
  }

  public attachProcess(pid: number): boolean {
    if (!this.isCgroupV2Available || !fs.existsSync(this.jobPath)) return false;

    try {
      fs.writeFileSync(path.join(this.jobPath, 'cgroup.procs'), `${pid}\n`);
      return true;
    } catch {
      return false;
    }
  }

  public readMetrics(): CgroupMetrics {
    let cpuTimeMs = 0;
    let peakMemoryKB = 0;
    let isOomKilled = false;

    if (!this.isCgroupV2Available || !fs.existsSync(this.jobPath)) {
      return { cpuTimeMs, peakMemoryKB, isOomKilled };
    }

    try {
      // 1. CPU Time (user + system in usec)
      const cpuStatPath = path.join(this.jobPath, 'cpu.stat');
      if (fs.existsSync(cpuStatPath)) {
        const content = fs.readFileSync(cpuStatPath, 'utf-8');
        const usageMatch = content.match(/usage_usec\s+(\d+)/);
        if (usageMatch) {
          cpuTimeMs = Math.round(parseInt(usageMatch[1], 10) / 1000);
        }
      }

      // 2. Peak Memory (bytes)
      const memPeakPath = path.join(this.jobPath, 'memory.peak');
      if (fs.existsSync(memPeakPath)) {
        const peakBytes = parseInt(fs.readFileSync(memPeakPath, 'utf-8').trim(), 10);
        peakMemoryKB = Math.round(peakBytes / 1024);
      }

      // 3. OOM Events
      const memEventsPath = path.join(this.jobPath, 'memory.events');
      if (fs.existsSync(memEventsPath)) {
        const content = fs.readFileSync(memEventsPath, 'utf-8');
        const oomMatch = content.match(/oom_kill\s+(\d+)/);
        if (oomMatch && parseInt(oomMatch[1], 10) > 0) {
          isOomKilled = true;
        }
      }
    } catch {
      // Metrics read fallback
    }

    return { cpuTimeMs, peakMemoryKB, isOomKilled };
  }

  public kill(): void {
    if (!this.isCgroupV2Available || !fs.existsSync(this.jobPath)) return;

    try {
      // Send cgroup.kill signal
      const killFile = path.join(this.jobPath, 'cgroup.kill');
      if (fs.existsSync(killFile)) {
        fs.writeFileSync(killFile, '1\n');
      }
    } catch {
      // Best-effort kill
    }
  }

  public teardown(): boolean {
    if (!this.isCgroupV2Available || !fs.existsSync(this.jobPath)) return true;

    try {
      this.kill();
      fs.rmdirSync(this.jobPath);
      return true;
    } catch {
      return false;
    }
  }
}
