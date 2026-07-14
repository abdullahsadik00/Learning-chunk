// ════════════════════════════════════════════════════════════════
// DAY 36 — EVENTEMITTER
// ════════════════════════════════════════════════════════════════
//
// EventEmitter is the backbone of Node.js. Almost everything
// (streams, http.Server, process, child_process) inherits from it.
//
// WHY IT MATTERS:
// Decouples producers from consumers without them knowing about each other.
// Like the browser's addEventListener but for Node.js objects.
// IMPORTANT: EventEmitter fires synchronously — listeners run in the order
// they were added, and they run before .emit() returns. This is unlike
// browser events which are asynchronous.
//
// MEMORY LEAK WARNING:
// Node.js warns if you add more than 10 listeners to one event on one emitter.
// This is almost always a sign you forgot to remove a listener.
// Always store the handler reference and call .off() when done.
// Or use .once() for one-shot listeners — they auto-remove.
//
// setMaxListeners(n) suppresses the warning but doesn't fix the leak.
// Fix the root cause instead.

import { EventEmitter } from 'events';

// ─────────────────────────────────────────────────────────────────
// DEMO 1: Basic emit / on / once
// ─────────────────────────────────────────────────────────────────
export function demo1_basics(): void {
  console.log('\n─── DEMO 1: emit / on / once ───');

  const emitter = new EventEmitter();

  // .on(event, listener) — listen indefinitely (until removed)
  emitter.on('greet', (name: string) => {
    console.log(`  [on]   Hello, ${name}!`);
  });

  // .once(event, listener) — fires exactly once, then auto-removes
  emitter.once('greet', (name: string) => {
    console.log(`  [once] First greeting ever: ${name}`);
  });

  // .prependListener() — adds to the FRONT of the listener queue
  // Useful when a listener must run before others (e.g., auth check)
  emitter.prependListener('greet', (name: string) => {
    console.log(`  [prepend] Checking if "${name}" is allowed...`);
  });

  console.log('  Emit 1:');
  emitter.emit('greet', 'Alice');
  // prepend fires first, then on, then once

  console.log('  Emit 2:');
  emitter.emit('greet', 'Bob');
  // once is gone — only prepend and on fire

  // Event names can be anything: string or Symbol
  // Using Symbol prevents name collisions in libraries
  const SECRET = Symbol('secret');
  emitter.on(SECRET, () => console.log('  Symbol event fired'));
  emitter.emit(SECRET);

  // .eventNames() — list all registered events
  console.log('  Registered events:', emitter.eventNames());
}

// ─────────────────────────────────────────────────────────────────
// DEMO 2: Custom class extending EventEmitter
// ─────────────────────────────────────────────────────────────────
// This is the idiomatic pattern: wrap EventEmitter in a class that
// defines its own typed events. Used throughout Node core.
interface FileWatcherEvents {
  change:  (filename: string, stats: { size: number; mtime: Date }) => void;
  delete:  (filename: string) => void;
  error:   (err: Error) => void;
}

// TypeScript trick: declare the typed on/emit overloads
class FileWatcher extends EventEmitter {
  private pollInterval: NodeJS.Timeout | null = null;
  private watchedFile: string;
  private lastSize: number = 0;

  constructor(filepath: string) {
    super();
    this.watchedFile = filepath;
  }

  // Typed overloads for .on() and .emit() — gives callers autocomplete
  on<K extends keyof FileWatcherEvents>(event: K, listener: FileWatcherEvents[K]): this {
    return super.on(event, listener as (...args: unknown[]) => void);
  }

  emit<K extends keyof FileWatcherEvents>(
    event: K,
    ...args: Parameters<FileWatcherEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }

  start(intervalMs = 500): void {
    console.log(`  FileWatcher: watching "${this.watchedFile}" every ${intervalMs}ms`);
    let tick = 0;

    this.pollInterval = setInterval(() => {
      tick++;
      // Simulate file system events for the demo
      if (tick === 2) {
        this.emit('change', this.watchedFile, { size: 1024, mtime: new Date() });
      }
      if (tick === 4) {
        this.emit('change', this.watchedFile, { size: 2048, mtime: new Date() });
      }
      if (tick === 6) {
        this.emit('delete', this.watchedFile);
        this.stop();
      }
    }, intervalMs);
  }

  stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      console.log('  FileWatcher: stopped');
    }
  }
}

export function demo2_customClass(): Promise<void> {
  console.log('\n─── DEMO 2: Custom Class Extending EventEmitter ───');

  return new Promise((resolve) => {
    const watcher = new FileWatcher('/tmp/myfile.txt');

    watcher.on('change', (filename, stats) => {
      console.log(`  CHANGE: ${filename} — size=${stats.size} bytes`);
    });

    watcher.on('delete', (filename) => {
      console.log(`  DELETE: ${filename}`);
      resolve();
    });

    watcher.start(100); // fast for demo
  });
}

// ─────────────────────────────────────────────────────────────────
// DEMO 3: Error events — why you MUST always listen
// ─────────────────────────────────────────────────────────────────
// If an 'error' event is emitted and there is NO listener for it,
// Node.js throws the error and crashes the process.
// This is the #1 cause of unexpected crashes in Node.js apps.
export function demo3_errorEvents(): void {
  console.log('\n─── DEMO 3: Error Events ───');

  const emitter = new EventEmitter();

  // WRONG — don't do this:
  // emitter.emit('error', new Error('boom')); // CRASHES if no listener!

  // CORRECT — always add an error listener:
  emitter.on('error', (err: Error) => {
    console.log(`  Caught error safely: ${err.message}`);
  });

  emitter.emit('error', new Error('Something went wrong'));

  // The pattern for async code inside EventEmitter subclasses:
  // If an async function throws, catch it and emit 'error'
  const safeEmitter = new EventEmitter();
  safeEmitter.on('error', (err: Error) => {
    console.log(`  safeEmitter caught: ${err.message}`);
  });

  async function riskyOperation() {
    throw new Error('Async failure inside EventEmitter');
  }

  // This is how you bridge async errors into EventEmitter:
  riskyOperation().catch((err: Error) => safeEmitter.emit('error', err));

  console.log('  (async error will appear after this line — emitters are synchronous,');
  console.log('   but the Promise rejection is scheduled on the microtask queue)');
}

// ─────────────────────────────────────────────────────────────────
// DEMO 4: Listener count and removing listeners
// ─────────────────────────────────────────────────────────────────
export function demo4_listenerManagement(): void {
  console.log('\n─── DEMO 4: Listener Management ───');

  const emitter = new EventEmitter();

  const handler1 = () => console.log('  handler1 fired');
  const handler2 = () => console.log('  handler2 fired');
  const handler3 = () => console.log('  handler3 fired');

  emitter.on('tick', handler1);
  emitter.on('tick', handler2);
  emitter.on('tick', handler3);

  console.log('  Before removal — listener count:', EventEmitter.listenerCount(emitter, 'tick'));
  emitter.emit('tick'); // all three fire

  // .off() is an alias for .removeListener() — preferred in modern Node
  emitter.off('tick', handler2);
  console.log('  After off(handler2) — listener count:', EventEmitter.listenerCount(emitter, 'tick'));
  emitter.emit('tick'); // handler1 and handler3

  // .removeAllListeners() — use with caution!
  // Good for cleanup when an object is being destroyed.
  emitter.removeAllListeners('tick');
  console.log('  After removeAllListeners — listener count:', EventEmitter.listenerCount(emitter, 'tick'));
  emitter.emit('tick'); // nothing fires — no output

  // getMaxListeners() / setMaxListeners() — tune the threshold
  const strictEmitter = new EventEmitter();
  strictEmitter.setMaxListeners(3); // warn if > 3 listeners on any event
  console.log('  Max listeners:', strictEmitter.getMaxListeners());

  // .rawListeners() — get the actual listener functions (useful for debugging)
  const bus = new EventEmitter();
  bus.on('msg', () => {});
  bus.once('msg', () => {}); // .once() wraps the handler in a one-time closure
  console.log('  rawListeners count:', bus.rawListeners('msg').length); // 2
}

// ─────────────────────────────────────────────────────────────────
// DEMO 5: Simple pub/sub system built on EventEmitter
// ─────────────────────────────────────────────────────────────────
// This is the pattern used by Redis pub/sub clients, WebSocket rooms,
// and any system needing a message bus without a full message broker.
type Handler<T> = (payload: T) => void;

class PubSub {
  private bus = new EventEmitter();

  constructor() {
    // In production, increase this to avoid false warnings
    this.bus.setMaxListeners(50);
  }

  subscribe<T>(channel: string, handler: Handler<T>): () => void {
    this.bus.on(channel, handler as (payload: unknown) => void);
    console.log(`  [PubSub] Subscribed to "${channel}" (total: ${EventEmitter.listenerCount(this.bus, channel)})`);

    // Return an unsubscribe function — the caller can call it to clean up
    // This is the "disposer" or "cleanup" pattern common in React, RxJS, etc.
    return () => {
      this.bus.off(channel, handler as (payload: unknown) => void);
      console.log(`  [PubSub] Unsubscribed from "${channel}"`);
    };
  }

  publish<T>(channel: string, payload: T): void {
    const listenerCount = EventEmitter.listenerCount(this.bus, channel);
    console.log(`  [PubSub] Publishing to "${channel}" — ${listenerCount} subscriber(s)`);
    this.bus.emit(channel, payload);
  }
}

export function demo5_pubSub(): void {
  console.log('\n─── DEMO 5: Pub/Sub on EventEmitter ───');

  const pubsub = new PubSub();

  // Subscribe to 'notifications' channel
  const unsubAlice = pubsub.subscribe<{ message: string }>('notifications', ({ message }) => {
    console.log(`    Alice received: "${message}"`);
  });

  const unsubBob = pubsub.subscribe<{ message: string }>('notifications', ({ message }) => {
    console.log(`    Bob received:   "${message}"`);
  });

  pubsub.publish('notifications', { message: 'Server restarting in 5 minutes' });

  // Alice leaves the channel
  unsubAlice();

  pubsub.publish('notifications', { message: 'Server restarting in 1 minute' });
  // Only Bob receives this one

  unsubBob();
  pubsub.publish('notifications', { message: 'Server is down' });
  // Nobody receives — no output
}

// ═════════════════════════════════════════════════════════════════
//  REAL-WORLD SCENARIOS
//  Each demo below maps a concept from DEMO 1-5 onto something you
//  actually ship in production code.
// ═════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────
// REAL-WORLD 1: Graceful shutdown on SIGTERM / SIGINT
//   (concept: process IS an EventEmitter; .once() so double-signal is safe)
// ─────────────────────────────────────────────────────────────────
//
// Where you meet this: EVERY production server. When you deploy, Kubernetes/
// Docker/PM2 sends SIGTERM and gives you a few seconds to finish in-flight
// requests, close the DB pool, and flush logs before it sends SIGKILL.
// Ctrl+C in your terminal sends SIGINT — same idea.
//
// KEY INSIGHT: `process` is an EventEmitter. OS signals arrive as events.
// You register cleanup with process.on('SIGTERM', ...). Use .once()-style
// guarding so hitting Ctrl+C twice doesn't run cleanup twice.
export async function real1_gracefulShutdown(): Promise<void> {
  console.log('\n─── REAL-WORLD 1: Graceful shutdown (SIGTERM/SIGINT) ───');

  // A tiny shutdown manager: register cleanup tasks, run them in order once.
  class GracefulShutdown {
    private tasks: { name: string; fn: () => Promise<void> }[] = [];
    private shuttingDown = false;

    register(name: string, fn: () => Promise<void>): void {
      this.tasks.push({ name, fn });
    }

    listen(signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT']): void {
      for (const sig of signals) {
        // .once() → even if the signal fires twice, this handler runs once.
        // The `shuttingDown` flag guards against two *different* signals racing.
        process.once(sig, () => void this.shutdown(sig));
      }
    }

    private async shutdown(signal: NodeJS.Signals): Promise<void> {
      if (this.shuttingDown) return; // idempotent — second signal is ignored
      this.shuttingDown = true;
      console.log(`  Received ${signal} — running ${this.tasks.length} cleanup task(s)...`);

      // Reverse order: shut down in the opposite order you started up
      // (stop accepting requests BEFORE closing the DB they depend on).
      for (const { name, fn } of [...this.tasks].reverse()) {
        try {
          await fn();
          console.log(`    ✓ ${name}`);
        } catch (err) {
          console.log(`    ✗ ${name} failed: ${(err as Error).message}`);
        }
      }
      console.log('  Cleanup complete — safe to exit. (real code: process.exit(0))');
    }
  }

  const shutdown = new GracefulShutdown();
  // These are the tasks a real server registers:
  shutdown.register('stop accepting new HTTP connections', async () => {
    await new Promise((r) => setTimeout(r, 20)); // server.close()
  });
  shutdown.register('drain in-flight requests', async () => {
    await new Promise((r) => setTimeout(r, 20));
  });
  shutdown.register('close database pool', async () => {
    await new Promise((r) => setTimeout(r, 20)); // pool.end()
  });
  shutdown.listen();

  // Simulate the orchestrator sending SIGTERM (normally you'd never emit this).
  // We emit twice to prove the .once() + flag makes it idempotent.
  process.emit('SIGTERM');
  process.emit('SIGTERM'); // ignored — no double cleanup

  await new Promise((r) => setTimeout(r, 120)); // let the async cleanup finish

  // Clean up our signal listeners so the rest of the demo run behaves normally.
  process.removeAllListeners('SIGTERM');
  process.removeAllListeners('SIGINT');
}

// ─────────────────────────────────────────────────────────────────
// REAL-WORLD 2: Timeout with .once() — race an event against a timer
//   (concept: .once() one-shot + always clean up the loser)
// ─────────────────────────────────────────────────────────────────
//
// Where you meet this: "wait for this operation, but give up after N ms."
// A DB query, an upstream API call, a socket waiting for a reply. Whichever
// happens first — completion or timeout — wins, and you MUST cancel the other
// (clear the timer, remove the listener) or you leak.
export async function real2_requestTimeout(): Promise<void> {
  console.log('\n─── REAL-WORLD 2: Timeout via .once() race ───');

  // Wait for a 'done' event on `op`, but bail out after `ms`.
  function waitWithTimeout(
    op: EventEmitter,
    ms: number,
  ): Promise<{ timedOut: boolean; result?: unknown }> {
    return new Promise((resolve) => {
      // The timeout branch: fires if 'done' hasn't arrived in time.
      const timer = setTimeout(() => {
        op.off('done', onDone);           // remove the loser — no leak
        resolve({ timedOut: true });
      }, ms);

      // The success branch: fires once, then we cancel the timer.
      const onDone = (result: unknown) => {
        clearTimeout(timer);              // cancel the loser — no dangling timer
        resolve({ timedOut: false, result });
      };
      op.once('done', onDone);            // .once() → auto-removes after firing
    });
  }

  // Case A: operation finishes BEFORE the timeout.
  const fastOp = new EventEmitter();
  setTimeout(() => fastOp.emit('done', { rows: 3 }), 30);
  const a = await waitWithTimeout(fastOp, 100);
  console.log('  Fast op (30ms, limit 100ms):', a); // { timedOut: false, result: {rows:3} }

  // Case B: operation is too slow → timeout wins.
  const slowOp = new EventEmitter();
  setTimeout(() => slowOp.emit('done', { rows: 999 }), 200);
  const b = await waitWithTimeout(slowOp, 50);
  console.log('  Slow op (200ms, limit 50ms):', b); // { timedOut: true }
  console.log('    ✓ loser always cleaned up (timer cleared OR listener removed)');
}

// ─────────────────────────────────────────────────────────────────
// REAL-WORLD 3: Reproduce a listener leak — SEE the warning, then fix it
//   (concept: DEMO 4 leak warning — the #1 silent production memory bug)
// ─────────────────────────────────────────────────────────────────
//
// The classic bug: attaching a listener INSIDE a per-request/per-loop path
// without ever removing it. Each iteration adds one more; they never come off.
// Node warns at listener #11 on a single event. Here we trip it on purpose,
// capture the warning (process emits 'warning' — yet another EventEmitter!),
// then show the correct pattern.
export async function real3_listenerLeak(): Promise<void> {
  console.log('\n─── REAL-WORLD 3: Listener leak — trip the warning, then fix ───');

  // Capture Node's leak warning instead of letting it print raw to stderr.
  // NOTE: process emits 'warning' ASYNCHRONOUSLY, so we await a tick below
  // before removing this listener — otherwise it's gone before the warning fires.
  const onWarning = (w: Error) => {
    console.log(`  ⚠ Node warning: ${w.name} — ${w.message.split('\n')[0]}`);
  };
  process.on('warning', onWarning);

  // ── THE BUG ──────────────────────────────────────────────────
  // Imagine `emitter` is a long-lived object (a socket, a DB client) and this
  // loop is really "once per incoming request." We keep adding, never removing.
  const leaky = new EventEmitter();
  for (let i = 0; i < 12; i++) {
    leaky.on('request', () => {}); // never removed → grows unbounded
  }
  console.log(`  Leaky emitter listeners: ${leaky.listenerCount('request')} (warning fired at #11)`);

  // ── THE FIX ──────────────────────────────────────────────────
  // Option A: if it's genuinely one-shot, use .once() — it auto-removes.
  // Option B: keep the handler reference and .off() it when the work is done.
  const fixed = new EventEmitter();
  function handleRequestOnce(): void {
    // ... do work ...
    fixed.off('request', handleRequestOnce); // remove myself when finished
  }
  for (let i = 0; i < 12; i++) {
    fixed.on('request', handleRequestOnce);
    fixed.emit('request');                   // handler runs, then removes itself
  }
  console.log(`  Fixed emitter listeners: ${fixed.listenerCount('request')} (stays flat — no leak)`);

  // Let the async 'warning' event fire and be captured before we detach.
  await new Promise<void>((r) => setImmediate(r));
  process.off('warning', onWarning); // clean up our own listener (practice what we preach)
}

// Export runner
export async function runEventEmitterDemos(): Promise<void> {
  console.log('\n════════════════════════════════════════');
  console.log('  EVENTEMITTER — DAY 36');
  console.log('════════════════════════════════════════');

  // ── Fundamentals (the "reference") ──
  demo1_basics();
  await demo2_customClass();
  demo3_errorEvents();
  demo4_listenerManagement();
  demo5_pubSub();

  // ── Real-world scenarios ──
  await real1_gracefulShutdown();
  await real2_requestTimeout();
  await real3_listenerLeak();
}
