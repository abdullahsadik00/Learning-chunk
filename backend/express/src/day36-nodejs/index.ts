// ════════════════════════════════════════════════════════════════
// DAY 36 — NODE.JS INTERNALS: MASTER RUNNER
// ════════════════════════════════════════════════════════════════
//
// Run with: npm run day36
//
// This file imports every Day 36 demo module and calls them in sequence.
// Each module covers a different pillar of Node.js internals:
//
//   streams.ts      — Readable, Writable, Transform, backpressure, pipe()
//   buffers.ts      — Binary data, encodings, binary protocol encoding
//   eventEmitter.ts — EventEmitter pattern, pub/sub, memory leak warnings
//   childProcess.ts — exec, spawn, fork, event loop blocking demo

import { runStreamDemos }       from './streams';
import { runBufferDemos }       from './buffers';
import { runEventEmitterDemos } from './eventEmitter';
import { runChildProcessDemos } from './childProcess';

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║           DAY 36 — NODE.JS INTERNALS                    ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('\nRunning all demos in sequence...\n');

  // ── 1. Streams ────────────────────────────────────────────────
  // Why first? Streams are foundational — everything in Node (HTTP, fs,
  // crypto, zlib) uses streams under the hood. Understanding them unlocks
  // all other APIs.
  await runStreamDemos();

  // ── 2. Buffers ────────────────────────────────────────────────
  // Why second? Streams operate on Buffers. Understanding Buffer encoding,
  // slicing, and binary protocol design prepares you for working with
  // raw TCP data, file I/O, and cryptography.
  runBufferDemos();

  // ── 3. EventEmitter ───────────────────────────────────────────
  // Why third? Nearly every Node.js API emits events (streams, servers,
  // child processes, fs.watch). The EventEmitter class is the glue.
  await runEventEmitterDemos();

  // ── 4. Child Processes ────────────────────────────────────────
  // Why last? This ties everything together: child processes use streams
  // for stdio, emit events for lifecycle, and communicate via Buffers.
  // Also the most advanced topic — seeing blocking vs. non-blocking
  // concretely motivates the architecture.
  await runChildProcessDemos();

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                 ALL DEMOS COMPLETE                      ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('\nKey takeaways from Day 36:');
  console.log('  • Streams process data in chunks — use pipeline(), not .pipe()');
  console.log('  • Buffers hold raw bytes — alloc() is safe, allocUnsafe() is fast');
  console.log('  • EventEmitter is synchronous — always add an "error" listener');
  console.log('  • exec() for short commands, spawn() for streams, fork() for Node workers');
  console.log('  • CPU-bound work BLOCKS the event loop — always offload it');
}

main().catch((err: Error) => {
  console.error('\nFatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
