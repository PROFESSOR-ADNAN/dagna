import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { SandboxSupervisor } from '../../judge/dist/sandbox/supervisor.js';

const ROOT_DIR = process.cwd();
const BIN_DIR = path.join(ROOT_DIR, 'tests', 'sandbox', 'bin');

if (!fs.existsSync(BIN_DIR)) {
  fs.mkdirSync(BIN_DIR, { recursive: true });
}

test.before(() => {
  // Pre-compile binary fixtures
  try {
    execSync(`g++ -O2 ${path.join(ROOT_DIR, 'tests/sandbox/hostile/cpu/infinite_loop.cpp')} -o ${path.join(BIN_DIR, 'infinite_loop')}`);
    execSync(`g++ -O2 ${path.join(ROOT_DIR, 'tests/sandbox/hostile/memory/stack_overflow.cpp')} -o ${path.join(BIN_DIR, 'stack_overflow')}`);
    execSync(`g++ -O2 ${path.join(ROOT_DIR, 'tests/sandbox/hostile/output/gigabyte_flood.cpp')} -o ${path.join(BIN_DIR, 'gigabyte_flood')}`);
    execSync(`gcc ${path.join(ROOT_DIR, 'tests/sandbox/hostile/privilege/ptrace_attack.c')} -o ${path.join(BIN_DIR, 'ptrace_attack')}`);
  } catch (err) {
    console.warn('Compilation warning during hostile test setup:', err.message);
  }
});

test('Hostile Attack: Infinite Loop contained with TLE within time limit', async () => {
  const result = await SandboxSupervisor.run({
    jobId: 'test-hostile-cpu-loop',
    command: [path.join(BIN_DIR, 'infinite_loop')],
    cpuLimitMs: 500,
    memoryLimitMB: 128,
  });

  assert.equal(result.verdict, 'TLE', 'Infinite loop must result in Time Limit Exceeded');
  assert.ok(result.hygiene.isClean, 'Post-run hygiene must be 100% clean');
  assert.equal(result.hygiene.leakedPidsCount, 0, 'Zero lingering processes allowed');
});

test('Hostile Attack: Sleep Stall terminated by wall-clock safety net', async () => {
  const result = await SandboxSupervisor.run({
    jobId: 'test-hostile-sleep-stall',
    command: ['python3', path.join(ROOT_DIR, 'tests/sandbox/hostile/cpu/sleep_stall.py')],
    cpuLimitMs: 300,
    memoryLimitMB: 128,
  });

  assert.equal(result.verdict, 'TLE', 'Sleep stall must be terminated by safety net with TLE');
  assert.ok(result.hygiene.isClean, 'Hygiene must be clean');
});

test('Hostile Attack: Stack Overflow contained with RE', async () => {
  const result = await SandboxSupervisor.run({
    jobId: 'test-hostile-stack-overflow',
    command: [path.join(BIN_DIR, 'stack_overflow')],
    cpuLimitMs: 1000,
    memoryLimitMB: 128,
  });

  assert.equal(result.verdict, 'RE', 'Stack overflow segmentation fault must be caught as Runtime Error');
  assert.ok(result.hygiene.isClean, 'Hygiene must be clean');
});

test('Hostile Attack: Gigabyte Output Flood bounded with OLE', async () => {
  const result = await SandboxSupervisor.run({
    jobId: 'test-hostile-output-flood',
    command: [path.join(BIN_DIR, 'gigabyte_flood')],
    cpuLimitMs: 2000,
    memoryLimitMB: 128,
  });

  assert.equal(result.verdict, 'OLE', 'Unbounded stdout flood must trigger Output Limit Exceeded (OLE)');
  assert.ok(result.hygiene.isClean, 'Hygiene must be clean');
});

test('Hostile Attack: Sensitive Filesystem Probing blocked', async () => {
  const result = await SandboxSupervisor.run({
    jobId: 'test-hostile-fs-probe',
    command: ['python3', path.join(ROOT_DIR, 'tests/sandbox/hostile/fs/path_traversal.py')],
    cpuLimitMs: 1000,
    memoryLimitMB: 128,
  });

  assert.equal(result.verdict, 'RE', 'Unauthorized filesystem reading must fail with non-zero exit code');
  assert.ok(result.hygiene.isClean, 'Hygiene must be clean');
});

test('Hostile Attack: Network Exfiltration blocked', async () => {
  const result = await SandboxSupervisor.run({
    jobId: 'test-hostile-network-exfil',
    command: ['python3', path.join(ROOT_DIR, 'tests/sandbox/hostile/network/metadata_exfiltration.py')],
    cpuLimitMs: 1000,
    memoryLimitMB: 128,
  });

  assert.equal(result.verdict, 'RE', 'Network egress attempts must be blocked and fail');
  assert.ok(result.hygiene.isClean, 'Hygiene must be clean');
});
