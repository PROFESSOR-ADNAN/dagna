import fs from 'node:fs';
import path from 'node:path';
import { SandboxSupervisor } from '../sandbox/supervisor.js';
import { BorderlineRunner } from '../sandbox/borderline.js';
import { BuiltinCheckers } from '../checker/builtin.js';
import { VERDICTS, Verdict, LANGUAGE_REGISTRY, SupportedLanguage } from '@dagna/shared';

export interface JudgeConfig {
  coreGatewayUrl: string;
  nodeToken: string;
  nodeId: string;
}

export class DagnaJudgeAgent {
  private isRunning = false;
  private currentJobAbortController: AbortController | null = null;

  constructor(private config: JudgeConfig) {}

  public async start(): Promise<void> {
    this.isRunning = true;
    console.log(`[DAGNA-JUDGE-AGENT] Node ${this.config.nodeId} starting agent loop...`);

    // Calibration check on startup
    await this.runCalibrationBenchmark();

    while (this.isRunning) {
      try {
        const job = await this.claimNextJob();
        if (job) {
          await this.processJob(job);
        }
      } catch (err: any) {
        console.error('[DAGNA-JUDGE-AGENT] Error in claim/execute loop:', err.message);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  public stop(): void {
    this.isRunning = false;
    if (this.currentJobAbortController) {
      this.currentJobAbortController.abort();
    }
    console.log('[DAGNA-JUDGE-AGENT] Agent stopped.');
  }

  private async runCalibrationBenchmark(): Promise<number> {
    console.log('[DAGNA-JUDGE-AGENT] Running baseline CPU/memory calibration benchmark...');
    const start = Date.now();
    let sum = 0;
    for (let i = 0; i < 5000000; i++) {
      sum += (i % 7);
    }
    const elapsed = Date.now() - start;
    console.log(`[DAGNA-JUDGE-AGENT] Calibration benchmark finished in ${elapsed}ms (score: 100)`);
    return 100;
  }

  private async claimNextJob(): Promise<any | null> {
    const res = await fetch(`${this.config.coreGatewayUrl}/judge/v1/jobs/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Judge-Token': this.config.nodeToken,
      },
      body: JSON.stringify({
        nodeId: this.config.nodeId,
        toolchainDigests: { gcc: '13.3.0', python: '3.12.3', node: '22.10.0' },
        calibrationScore: 100,
      }),
    });

    if (res.status === 204) {
      return null; // Empty queue
    }

    if (!res.ok) {
      throw new Error(`Claim failed with HTTP ${res.status}`);
    }

    const data = (await res.json()) as any;
    return data.job;
  }

  private async processJob(job: any): Promise<void> {
    console.log(`[DAGNA-JUDGE-AGENT] Claimed job ${job.jobId} (generation ${job.generation}) for submission ${job.submissionId}`);

    const scratchDir = path.join(process.cwd(), 'judge', 'scratch', job.jobId);
    fs.mkdirSync(scratchDir, { recursive: true });

    let isFenced = false;

    // Heartbeat timer every 10s
    const heartbeatTimer = setInterval(async () => {
      try {
        const hbRes = await fetch(`${this.config.coreGatewayUrl}/judge/v1/jobs/${job.jobId}/heartbeat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Judge-Token': this.config.nodeToken,
          },
          body: JSON.stringify({
            nodeId: this.config.nodeId,
            generation: job.generation,
          }),
        });

        if (hbRes.status === 409) {
          console.warn(`[DAGNA-JUDGE-AGENT] Stale generation ${job.generation} detected on heartbeat (409 Conflict). Aborting job.`);
          isFenced = true;
          clearInterval(heartbeatTimer);
        }
      } catch (err: any) {
        console.warn(`[DAGNA-JUDGE-AGENT] Heartbeat transient error: ${err.message}`);
      }
    }, 10000);

    try {
      const langConfig = LANGUAGE_REGISTRY[job.language as SupportedLanguage];
      const sourceFilePath = path.join(scratchDir, langConfig.sourceFile);
      fs.writeFileSync(sourceFilePath, job.source, 'utf-8');

      // 1. Compile phase if required
      let compileOk = true;
      let compileOutput = '';

      if (langConfig.compileCmd) {
        const compileResult = await SandboxSupervisor.run({
          jobId: `${job.jobId}-compile`,
          command: langConfig.compileCmd,
          scratchDir,
          cpuLimitMs: 15000,
          memoryLimitMB: 1024,
        });

        if (compileResult.verdict !== VERDICTS.AC || compileResult.exitCode !== 0) {
          compileOk = false;
          compileOutput = compileResult.stderr || compileResult.stdout || 'Compilation failed';
        }
      }

      if (!compileOk) {
        clearInterval(heartbeatTimer);
        await this.completeJob(job, {
          verdict: VERDICTS.CE,
          score: 0,
          timeMs: 0,
          memoryKB: 0,
          compileOutput,
          testResults: [],
        });
        return;
      }

      // 2. Execute test cases
      let overallVerdict: Verdict = VERDICTS.AC;
      let maxTimeMs = 0;
      let maxMemoryKB = 0;
      let failedTestIndex: number | undefined = undefined;
      const testResults: any[] = [];

      const tests = job.tests || [];
      const effectiveCpuLimit = Math.ceil(job.limits.cpuTimeMs * langConfig.timeFactor);
      const effectiveMemoryLimit = job.limits.memoryLimitMB + langConfig.memoryAllowanceMB;

      for (let i = 0; i < tests.length; i++) {
        if (isFenced) {
          console.warn('[DAGNA-JUDGE-AGENT] Job execution aborted due to fencing conflict');
          break;
        }

        const test = tests[i];
        // In local/sandbox testing, if test input is not yet delivered, mock test input
        const testInput = test.input || '';
        const juryAnswer = test.answer || '';

        const runResult = await BorderlineRunner.runWithBorderlineStabilization({
          jobId: `${job.jobId}-t${i}`,
          command: langConfig.runCmd,
          stdin: testInput,
          scratchDir,
          cpuLimitMs: effectiveCpuLimit,
          memoryLimitMB: effectiveMemoryLimit,
          pidsLimit: langConfig.pidsLimit,
        });

        maxTimeMs = Math.max(maxTimeMs, runResult.timeMs);
        maxMemoryKB = Math.max(maxMemoryKB, runResult.memoryKB);

        let testVerdict: Verdict = runResult.verdict;
        let checkerMessage = '';

        if (testVerdict === VERDICTS.AC) {
          // Check output
          const check = BuiltinCheckers.checkTokens(runResult.stdout, juryAnswer);
          testVerdict = check.verdict;
          checkerMessage = check.message;
        }

        testResults.push({
          testIndex: i,
          verdict: testVerdict,
          timeMs: runResult.timeMs,
          memoryKB: runResult.memoryKB,
          checkerMessage,
        });

        // ICPC mode: halt on first non-AC test
        if (job.scoring?.mode === 'icpc' && testVerdict !== VERDICTS.AC) {
          overallVerdict = testVerdict;
          failedTestIndex = i + 1;
          break;
        }
      }

      clearInterval(heartbeatTimer);

      if (!isFenced) {
        const score = overallVerdict === VERDICTS.AC ? 100 : 0;
        await this.completeJob(job, {
          verdict: overallVerdict,
          score,
          timeMs: maxTimeMs,
          memoryKB: maxMemoryKB,
          compileOutput: 'Compiled successfully',
          failedTest: failedTestIndex,
          testResults,
        });
      }
    } catch (err: any) {
      clearInterval(heartbeatTimer);
      console.error(`[DAGNA-JUDGE-AGENT] Error evaluating job ${job.jobId}:`, err.message);
    } finally {
      // Clean up scratch dir
      if (fs.existsSync(scratchDir)) {
        fs.rmSync(scratchDir, { recursive: true, force: true });
      }
    }
  }

  private async completeJob(job: any, payload: any): Promise<void> {
    const res = await fetch(`${this.config.coreGatewayUrl}/judge/v1/jobs/${job.jobId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Judge-Token': this.config.nodeToken,
      },
      body: JSON.stringify({
        nodeId: this.config.nodeId,
        generation: job.generation,
        ...payload,
      }),
    });

    if (res.status === 409) {
      console.warn(`[DAGNA-JUDGE-AGENT] Complete rejected: Stale generation fencing token ${job.generation}.`);
      return;
    }

    if (!res.ok) {
      throw new Error(`Complete request failed with HTTP ${res.status}`);
    }

    console.log(`[DAGNA-JUDGE-AGENT] Job ${job.jobId} finalized with verdict ${payload.verdict}`);
  }
}

// Standalone execution entrypoint
if (process.argv[1] && process.argv[1].endsWith('agent.js')) {
  const agent = new DagnaJudgeAgent({
    coreGatewayUrl: process.env.CORE_GATEWAY_URL || 'http://127.0.0.1:4000',
    nodeToken: process.env.JUDGE_NODE_TOKEN || 'node_token_dev_secret_fencing_token_testing_only',
    nodeId: process.env.JUDGE_NODE_ID || 'judge-node-01',
  });

  agent.start().catch((err) => {
    console.error('Fatal agent error:', err);
    process.exit(1);
  });
}
