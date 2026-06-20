// ════════════════════════════════════════════════════════════════
// DAY 36 — CHILD PROCESSES
// ════════════════════════════════════════════════════════════════
//
// Node.js is single-threaded — CPU-intensive work blocks the event loop.
// While Node is computing primes, it cannot accept HTTP requests.
// Solution: spawn the work in a child process (separate OS process).
//
// THREE MAIN METHODS:
//   exec()   — runs a shell command, buffers the FULL output in memory.
//              Use for: short commands with small output (git, ls, grep).
//              ❌ Don't use for: commands with >200KB output (buffer overflows).
//
//   spawn()  — streams stdout/stderr incrementally as Readable streams.
//              Use for: long-running processes, large output (ffmpeg, docker logs).
//              More control, no shell injection risk (no shell by default).
//
//   fork()   — a specialised spawn() for another Node.js script.
//              Creates an IPC (Inter-Process Communication) channel automatically.
//              Can send/receive JS objects between parent and child.
//              Use for: CPU-intensive Node.js work (image processing, ML inference).
//
// WORKER THREADS vs Child Processes:
//   child_process: separate OS process, separate memory, higher overhead (~30ms startup)
//   worker_threads: same process, shared memory via SharedArrayBuffer, lower overhead
//   Use worker_threads for CPU work that needs to share data with parent.
//   Use child_process for isolating untrusted code or non-Node processes.

import { exec, spawn, fork } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const execAsync = promisify(exec);

// ─────────────────────────────────────────────────────────────────
// DEMO 1: exec() — simple shell command, buffered output
// ─────────────────────────────────────────────────────────────────
export async function demo1_exec(): Promise<void> {
  console.log('\n─── DEMO 1: exec() ───');

  // exec() runs a shell — this means shell features work: pipes, &&, $()
  // But it also means SHELL INJECTION is possible if you interpolate user input!
  // ❌ DANGER: exec(`ls ${userInput}`) — if userInput = '; rm -rf /', you're done.
  // ✅ SAFE:   spawn('ls', [userInput])  — arguments are passed directly, no shell.

  try {
    // Simple command
    const { stdout, stderr } = await execAsync('node --version');
    console.log('  node --version:', stdout.trim());
    if (stderr) console.warn('  stderr:', stderr.trim());

    // Pipe in shell (exec supports this; spawn does not without shell:true)
    const { stdout: nodeInfo } = await execAsync(
      'node -e "process.stdout.write(JSON.stringify({v: process.version, arch: process.arch}))"'
    );
    const info = JSON.parse(nodeInfo);
    console.log('  Node info:', info);

    // maxBuffer: default is 1MB. If output exceeds this, exec throws.
    // Always set it explicitly for commands that may produce large output.
    const { stdout: listing } = await execAsync('ls -la ' + os.tmpdir(), {
      maxBuffer: 5 * 1024 * 1024, // 5MB
      timeout: 5000,              // kill if it takes > 5 seconds
    });
    const lines = listing.trim().split('\n');
    console.log(`  ls ${os.tmpdir()}: ${lines.length} entries (showing first 3):`);
    lines.slice(0, 3).forEach(l => console.log('   ', l));

  } catch (err) {
    // exec() rejects if the process exits with non-zero status
    const e = err as { message: string; code: number; stderr: string };
    console.error('  exec failed:', e.message);
  }
}

// ─────────────────────────────────────────────────────────────────
// DEMO 2: spawn() — streaming stdout, no shell, precise control
// ─────────────────────────────────────────────────────────────────
export function demo2_spawn(): Promise<void> {
  console.log('\n─── DEMO 2: spawn() ───');

  return new Promise((resolve, reject) => {
    // spawn(command, args, options) — args is an array, never a shell string
    // This is injection-safe: each element is passed as a distinct argument to execvp()
    const child = spawn('node', ['--version']);

    let output = '';

    // stdout is a Readable stream — ideal for large output
    child.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString();
      console.log('  stdout chunk:', chunk.toString().trim());
    });

    child.stderr.on('data', (chunk: Buffer) => {
      console.error('  stderr:', chunk.toString().trim());
    });

    // 'close' fires when both stdout and stderr have finished (streams closed)
    // 'exit' fires when the process exits — but streams may still be draining
    // Always use 'close' if you need all output to be available
    child.on('close', (code: number | null) => {
      console.log(`  Process exited with code ${code}`);
      console.log(`  Full output: "${output.trim()}"`);
      resolve();
    });

    child.on('error', (err: Error) => {
      // 'error' fires if the process couldn't be spawned (e.g., command not found)
      console.error('  Spawn error:', err.message);
      reject(err);
    });

    // You can write to child.stdin to send input to the process
    // child.stdin.write('some input\n');
    // child.stdin.end(); // signal EOF
  });
}

// ─────────────────────────────────────────────────────────────────
// DEMO 3: fork() — spawn a Node.js worker, communicate via IPC
// ─────────────────────────────────────────────────────────────────
// fork() creates a new Node.js process and sets up an IPC channel.
// Parent and child can send arbitrary JS objects to each other
// via process.send() / process.on('message').
//
// This is how cluster module works under the hood.
export async function demo3_fork(): Promise<void> {
  console.log('\n─── DEMO 3: fork() ───');

  // We need to write a worker script to disk for fork() to run.
  // In production, this would be a real file in your project.
  const workerCode = `
// This script runs in a separate Node.js process.
// It receives a task via IPC, does the work, and sends back the result.

process.on('message', (task) => {
  const { type, data } = task;

  if (type === 'COMPUTE') {
    // Simulate CPU-intensive work: sum of squares
    let result = 0;
    for (let i = 0; i < data.n; i++) {
      result += i * i;
    }
    // Send result back to parent
    process.send({ type: 'RESULT', result, pid: process.pid });
  }

  if (type === 'SHUTDOWN') {
    process.send({ type: 'BYE' });
    process.exit(0);
  }
});

// Tell the parent we're ready
process.send({ type: 'READY' });
`;

  const workerPath = path.join(os.tmpdir(), 'worker-demo.js');
  fs.writeFileSync(workerPath, workerCode);

  return new Promise((resolve, reject) => {
    const worker = fork(workerPath, [], {
      // stdio: 'inherit' lets the child's console.log appear in parent's terminal
      // stdio: 'pipe' captures it
      silent: false, // inherit parent's stdio
    });

    worker.on('message', (msg: { type: string; result?: number; pid?: number }) => {
      if (msg.type === 'READY') {
        console.log(`  Worker is ready (PID: ${worker.pid})`);
        // Send it a task
        worker.send({ type: 'COMPUTE', data: { n: 1_000_000 } });
      }

      if (msg.type === 'RESULT') {
        console.log(`  Result from worker PID ${msg.pid}: ${msg.result}`);
        console.log(`  Parent PID: ${process.pid} — note they are different!`);
        // Shut the worker down gracefully
        worker.send({ type: 'SHUTDOWN' });
      }

      if (msg.type === 'BYE') {
        console.log('  Worker acknowledged shutdown');
      }
    });

    worker.on('close', (code) => {
      console.log(`  Worker exited with code ${code}`);
      fs.unlinkSync(workerPath);
      resolve();
    });

    worker.on('error', reject);
  });
}

// ─────────────────────────────────────────────────────────────────
// DEMO 4: Event loop blocking — direct call vs. forked process
// ─────────────────────────────────────────────────────────────────
// This demo shows WHY you need child processes for CPU work.
// "Is the event loop free?" is measured by a heartbeat timer.
// If the timer fires late, the event loop was blocked.
export async function demo4_blockingVsFork(): Promise<void> {
  console.log('\n─── DEMO 4: Event Loop Blocking ───');

  // Helper: count primes up to n (deliberately slow, no sieve)
  function countPrimes(n: number): number {
    let count = 0;
    for (let i = 2; i <= n; i++) {
      let isPrime = true;
      for (let j = 2; j * j <= i; j++) {
        if (i % j === 0) { isPrime = false; break; }
      }
      if (isPrime) count++;
    }
    return count;
  }

  const N = 500_000; // 500k — takes ~300ms on modern hardware

  // ── Part A: Direct call — BLOCKS the event loop ──────────────
  let heartbeats = 0;
  const heartbeat = setInterval(() => {
    heartbeats++;
    // This should fire every ~10ms — if the event loop is blocked, it won't
  }, 10);

  const startBlocking = Date.now();
  const primeCount = countPrimes(N);
  const blockingTime = Date.now() - startBlocking;

  clearInterval(heartbeat);
  console.log(`  Direct call: found ${primeCount} primes in ${blockingTime}ms`);
  console.log(`  Heartbeats fired during blocking: ${heartbeats} (expected ~${Math.floor(blockingTime / 10)})`);
  console.log(`  → Event loop was BLOCKED for ${blockingTime}ms — no requests could be handled`);

  // ── Part B: Fork — event loop stays free ─────────────────────
  const forkWorkerCode = `
const { parentPort } = require('worker_threads');
process.on('message', ({ n }) => {
  let count = 0;
  for (let i = 2; i <= n; i++) {
    let isPrime = true;
    for (let j = 2; j * j <= i; j++) {
      if (i % j === 0) { isPrime = false; break; }
    }
    if (isPrime) count++;
  }
  process.send({ count });
  process.exit(0);
});
process.send({ ready: true });
`;

  const forkPath = path.join(os.tmpdir(), 'prime-worker.js');
  fs.writeFileSync(forkPath, forkWorkerCode);

  await new Promise<void>((resolve) => {
    let forkHeartbeats = 0;
    const forkBeat = setInterval(() => forkHeartbeats++, 10);

    const worker = fork(forkPath, [], { silent: true });
    const forkStart = Date.now();

    worker.on('message', (msg: { ready?: boolean; count?: number }) => {
      if (msg.ready) {
        worker.send({ n: N });
      } else if (msg.count !== undefined) {
        const forkTime = Date.now() - forkStart;
        clearInterval(forkBeat);
        console.log(`\n  Fork: found ${msg.count} primes in ${forkTime}ms`);
        console.log(`  Heartbeats fired during fork: ${forkHeartbeats}`);
        console.log(`  → Event loop stayed FREE — other requests could be handled`);
        fs.unlinkSync(forkPath);
        resolve();
      }
    });

    worker.on('error', () => {
      clearInterval(forkBeat);
      fs.unlinkSync(forkPath);
      resolve();
    });
  });
}

// Export runner
export async function runChildProcessDemos(): Promise<void> {
  console.log('\n════════════════════════════════════════');
  console.log('  CHILD PROCESSES — DAY 36');
  console.log('════════════════════════════════════════');

  await demo1_exec();
  await demo2_spawn();
  await demo3_fork();
  await demo4_blockingVsFork();
}
