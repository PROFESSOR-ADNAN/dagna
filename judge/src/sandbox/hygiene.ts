import fs from 'node:fs';
import path from 'node:path';

export interface HygieneReport {
  isClean: boolean;
  leakedPidsCount: number;
  scratchRemoved: boolean;
  cgroupRemoved: boolean;
  errors: string[];
}

export class HygieneChecker {
  static verifyAndClean(jobId: string, scratchDir: string): HygieneReport {
    const report: HygieneReport = {
      isClean: true,
      leakedPidsCount: 0,
      scratchRemoved: false,
      cgroupRemoved: false,
      errors: [],
    };

    const cgroupPath = path.join('/sys/fs/cgroup/dagna', jobId);

    // 1. Check for leaked processes in cgroup
    if (fs.existsSync(cgroupPath)) {
      try {
        const procsFile = path.join(cgroupPath, 'cgroup.procs');
        if (fs.existsSync(procsFile)) {
          const procs = fs.readFileSync(procsFile, 'utf-8').trim();
          if (procs.length > 0) {
            const pids = procs.split('\n').filter(Boolean);
            report.leakedPidsCount = pids.length;
            report.errors.push(`Hygiene failure: ${pids.length} lingering processes detected in cgroup: ${procs}`);
            report.isClean = false;

            // Force kill remaining
            try {
              fs.writeFileSync(path.join(cgroupPath, 'cgroup.kill'), '1\n');
            } catch {
              // Best effort
            }
          }
        }

        // Remove cgroup
        fs.rmdirSync(cgroupPath);
        report.cgroupRemoved = true;
      } catch (err: any) {
        report.errors.push(`Failed to remove cgroup directory: ${err.message}`);
        report.isClean = false;
      }
    } else {
      report.cgroupRemoved = true;
    }

    // 2. Clean and remove scratch directory
    if (fs.existsSync(scratchDir)) {
      try {
        fs.rmSync(scratchDir, { recursive: true, force: true });
        report.scratchRemoved = true;
      } catch (err: any) {
        report.errors.push(`Failed to remove scratch directory: ${err.message}`);
        report.isClean = false;
      }
    } else {
      report.scratchRemoved = true;
    }

    return report;
  }
}
