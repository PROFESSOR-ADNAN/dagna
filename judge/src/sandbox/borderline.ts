import { SandboxSupervisor, SandboxOptions, SandboxResult } from './supervisor.js';
import { VERDICTS } from '@dagna/shared';

export class BorderlineRunner {
  static async runWithBorderlineStabilization(options: SandboxOptions): Promise<SandboxResult & { rerunCount: number }> {
    let result = await SandboxSupervisor.run(options);
    let rerunCount = 0;

    const lowerBound = options.cpuLimitMs * 0.85;
    const upperBound = options.cpuLimitMs * 1.15;

    // Check if measured time falls in the +/-15% borderline noise band
    if (result.timeMs >= lowerBound && result.timeMs <= upperBound) {
      const attempts = [result];

      for (let i = 0; i < 2; i++) {
        rerunCount++;
        const rerunResult = await SandboxSupervisor.run({
          ...options,
          jobId: `${options.jobId}-rerun-${i + 1}`,
        });
        attempts.push(rerunResult);
      }

      // Pick the attempt with the minimum measured CPU time
      attempts.sort((a, b) => a.timeMs - b.timeMs);
      result = attempts[0];
    }

    return {
      ...result,
      rerunCount,
    };
  }
}
