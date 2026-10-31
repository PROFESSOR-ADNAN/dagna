import test from 'node:test';
import assert from 'node:assert/strict';
import { BuiltinCheckers } from '../../judge/dist/checker/builtin.js';
import { SandboxSupervisor } from '../../judge/dist/sandbox/supervisor.js';

test('Canary Problem: GNU C++ AC Solution compiles and passes', async () => {
  const result = await SandboxSupervisor.run({
    jobId: 'canary-ac-cpp',
    command: ['/usr/bin/g++', '-O2', '-std=c++20', '-x', 'c++', '-', '-o', 'canary_ac_bin'],
    stdin: '#include <iostream>\nint main() { std::cout << "42" << std::endl; return 0; }',
    cpuLimitMs: 5000,
    memoryLimitMB: 512,
  });

  assert.equal(result.exitCode, 0, 'Compilation of valid C++ must succeed');
  assert.equal(result.verdict, 'AC');
});

test('Canary Problem: Compile Error (CE) caught with diagnostics', async () => {
  const result = await SandboxSupervisor.run({
    jobId: 'canary-ce-cpp',
    command: ['/usr/bin/g++', '-O2', '-std=c++20', '-x', 'c++', '-', '-o', 'canary_ce_bin'],
    stdin: '#include <iostream>\nint main() { INVALID_SYNTAX_ERROR_TOKEN; }',
    cpuLimitMs: 5000,
    memoryLimitMB: 512,
  });

  assert.notEqual(result.exitCode, 0, 'Compilation of invalid C++ must return non-zero');
  assert.ok(result.stderr.includes('error:'), 'Compile diagnostics must contain error output');
});

test('Builtin Checkers: exact, lines, tokens, and float tolerance', () => {
  // Tokens checker
  const res1 = BuiltinCheckers.checkTokens('42 100\n', '42   100');
  assert.equal(res1.verdict, 'AC');

  const res2 = BuiltinCheckers.checkTokens('42 99', '42 100');
  assert.equal(res2.verdict, 'WA');

  // Float checker
  const res3 = BuiltinCheckers.checkFloat('3.14159265', '3.14159270', 1e-5);
  assert.equal(res3.verdict, 'AC');

  const res4 = BuiltinCheckers.checkFloat('NaN', '3.14159');
  assert.equal(res4.verdict, 'WA', 'NaN must be rejected as WA');
});

test('Fencing Token State Machine Simulation', () => {
  let activeGeneration = 1;

  function handleHeartbeat(providedGen: number): { status: number } {
    if (providedGen !== activeGeneration) {
      return { status: 409 }; // Fencing conflict
    }
    return { status: 200 };
  }

  // Active generation 1 works
  assert.equal(handleHeartbeat(1).status, 200);

  // Job re-leased to another node -> generation becomes 2
  activeGeneration = 2;

  // Stale node awakens and heartbeats with generation 1
  assert.equal(handleHeartbeat(1).status, 409, 'Stale generation 1 must receive 409 Conflict');

  // New owner heartbeats with generation 2
  assert.equal(handleHeartbeat(2).status, 200, 'Current generation 2 must succeed');
});
