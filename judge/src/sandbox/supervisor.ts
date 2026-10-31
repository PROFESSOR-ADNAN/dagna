import { spawn, ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { CgroupManager } from './cgroup.js';
import { HygieneChecker, HygieneReport } from './hygiene.js';
import { VERDICTS, Verdict, DEFAULT_LIMITS } from '@dagna/shared';

export interface SandboxOptions {
  jobId: string;
  command: string[];
  stdin?: string | Buffer;
  cpuLimitMs: number;
  memoryLimitMB: number;
  scratchDir?: string;
  env?: Record<string, string>;
  pidsLimit?: number;
}

export interface SandboxResult {
  verdict: Verdict;
  timeMs: number;
  memoryKB: number;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: string | null;
  hygiene: HygieneReport;
}

export class SandboxSupervisor {
  static async run(options: SandboxOptions): Promise<SandboxResult> {
    const {
      jobId,
      command,
      stdin,
      cpuLimitMs,
      memoryLimitMB,
      pidsLimit = 64,
      env = {},
    } = options;

    const scratchDir = options.scratchDir || path.join(process.cwd(), 'judge', 'scratch', jobId);
    fs.mkdirSync(scratchDir, { recursive: true });

    const cgroup = new CgroupManager(jobId);
    await cgroup.setup({ cpuLimitMs, memoryLimitMB, pidsMax: pidsLimit });

    const wallClockLimitMs = Math.max(cpuLimitMs * 2, cpuLimitMs + 2000);
    const maxStdoutBytes = DEFAULT_LIMITS.MAX_OUTPUT_BYTES;
    const maxStderrBytes = DEFAULT_LIMITS.MAX_STDERR_CAPTURED_BYTES;

    let stdoutChunks: Buffer[] = [];
    let stderrChunks: Buffer[] = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let outputLimitExceeded = false;
    let isWallTimeExceeded = false;

    const startHr = process.hrtime.bigint();

    return new Promise<SandboxResult>((resolve) => {
      const [cmd, ...args] = command;

      // Unshare isolation options when available on Linux
      let execCmd = cmd;
      let execArgs = args;

      // Minimal safe execution environment (no leaked host credentials or tokens)
      const cleanEnv = {
        PATH: '/usr/local/bin:/usr/bin:/bin',
        HOME: scratchDir,
        TMPDIR: scratchDir,
        LANG: 'C.UTF-8',
        ...env,
      };

      const child = spawn(execCmd, execArgs, {
        cwd: scratchDir,
        env: cleanEnv,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Attach PID to cgroup v2 subtree
      if (child.pid) {
        cgroup.attachProcess(child.pid);
      }

      // Write stdin if provided
      if (stdin) {
        child.stdin.write(stdin);
        child.stdin.end();
      } else {
        child.stdin.end();
      }

      // Wall-clock watchdog timer
      const wallTimer = setTimeout(() => {
        isWallTimeExceeded = true;
        cgroup.kill();
        try {
          child.kill('SIGKILL');
        } catch {
          // Process already terminated
        }
      }, wallClockLimitMs);

      // Bounded stdout capture
      child.stdout.on('data', (chunk: Buffer) => {
        stdoutBytes += chunk.length;
        if (stdoutBytes > maxStdoutBytes) {
          outputLimitExceeded = true;
          cgroup.kill();
          try {
            child.kill('SIGKILL');
          } catch {}
          return;
        }
        stdoutChunks.push(chunk);
      });

      // Bounded stderr capture
      child.stderr.on('data', (chunk: Buffer) => {
        stderrBytes += chunk.length;
        if (stderrBytes <= maxStderrBytes) {
          stderrChunks.push(chunk);
        }
      });

      child.on('close', (exitCode, signal) => {
        clearTimeout(wallTimer);

        const endHr = process.hrtime.bigint();
        const wallElapsedMs = Number((endHr - startHr) / 1000000n);

        // Read direct kernel cgroup metrics
        const metrics = cgroup.readMetrics();
        let measuredCpuTime = metrics.cpuTimeMs;
        let measuredMemory = metrics.peakMemoryKB;

        // Fallback for environments where cgroups v2 write permissions are restricted
        if (measuredCpuTime === 0) {
          measuredCpuTime = wallElapsedMs;
        }

        // Run post-execution hygiene check and cleanup
        const hygiene = HygieneChecker.verifyAndClean(jobId, scratchDir);

        // Classify Verdict
        let verdict: Verdict = VERDICTS.AC;

        if (outputLimitExceeded) {
          verdict = VERDICTS.OLE;
        } else if (metrics.isOomKilled || (measuredMemory > memoryLimitMB * 1024 && memoryLimitMB > 0)) {
          verdict = VERDICTS.MLE;
        } else if (isWallTimeExceeded || measuredCpuTime > cpuLimitMs) {
          verdict = VERDICTS.TLE;
        } else if (signal === 'SIGSEGV' || signal === 'SIGABRT' || signal === 'SIGFPE' || (exitCode !== null && exitCode !== 0)) {
          verdict = VERDICTS.RE;
        }

        const stdoutText = Buffer.concat(stdoutChunks).toString('utf-8');
        const stderrText = Buffer.concat(stderrChunks).toString('utf-8').slice(0, maxStderrBytes);

        resolve({
          verdict,
          timeMs: measuredCpuTime,
          memoryKB: measuredMemory,
          stdout: stdoutText,
          stderr: stderrText,
          exitCode,
          signal,
          hygiene,
        });
      });

      child.on('error', (err) => {
        clearTimeout(wallTimer);
        const hygiene = HygieneChecker.verifyAndClean(jobId, scratchDir);
        resolve({
          verdict: VERDICTS.RE,
          timeMs: 0,
          memoryKB: 0,
          stdout: '',
          stderr: err.message,
          exitCode: 1,
          signal: null,
          hygiene,
        });
      });
    });
  }
}
