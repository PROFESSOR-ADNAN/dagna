import { SandboxSupervisor } from './sandbox/supervisor.js';
import fs from 'node:fs';

export async function runCli(args: string[]): Promise<void> {
  const subCommand = args[0];

  if (subCommand !== 'run') {
    console.log(`Dagna Sandbox CLI
Usage: dagna-sandbox run --cmd "<binary_and_args>" --cpu <ms> --mem <mb> [--stdin <file>] [--pids <max>]
`);
    process.exit(1);
  }

  let command: string[] = [];
  let cpuLimitMs = 1000;
  let memoryLimitMB = 256;
  let stdinContent: string | undefined = undefined;
  let pidsLimit = 64;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--cmd' && args[i + 1]) {
      command = args[i + 1].split(' ');
      i++;
    } else if (args[i] === '--cpu' && args[i + 1]) {
      cpuLimitMs = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--mem' && args[i + 1]) {
      memoryLimitMB = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--stdin' && args[i + 1]) {
      stdinContent = fs.readFileSync(args[i + 1], 'utf-8');
      i++;
    } else if (args[i] === '--pids' && args[i + 1]) {
      pidsLimit = parseInt(args[i + 1], 10);
      i++;
    }
  }

  if (command.length === 0) {
    console.error('Error: --cmd argument is required');
    process.exit(1);
  }

  const jobId = `cli-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  const result = await SandboxSupervisor.run({
    jobId,
    command,
    stdin: stdinContent,
    cpuLimitMs,
    memoryLimitMB,
    pidsLimit,
  });

  console.log(JSON.stringify(result, null, 2));
}
