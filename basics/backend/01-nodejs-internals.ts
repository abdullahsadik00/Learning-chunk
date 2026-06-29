// ═══════════════════════════════════════════════════════════════
// BACKEND 01: NODE.JS INTERNALS · STREAMS · BUFFERS · EVENTEMITTER · CHILD PROCESSES  (Day 36)
// Run: npx ts-node 01-nodejs-internals.ts
// ═══════════════════════════════════════════════════════════════
//
// Node.js is NOT a language — it is a RUNTIME for JavaScript outside the browser.
//
//  • V8:   Google's JS engine — parses and executes your JS/TS
//  • libuv: C library — provides the event loop, thread pool, async I/O
//  • Node APIs: fs, net, http, crypto, child_process — written in C++, exposed to JS
//
// The magic: a SINGLE thread handles thousands of connections because I/O is
// delegated to the OS (via libuv) and only the callbacks return to your thread.

import { EventEmitter } from "events";
import { Readable, Writable, Transform, pipeline } from "stream";
import { exec, spawn, fork } from "child_process";
import { promisify } from "util";
import * as os from "os";

const execAsync = promisify(exec);

// ───────────────────────────────────────────────────────────────
// 1. Node.js Architecture & Event Loop
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Node.js Architecture & Event Loop ===");

/*
  ARCHITECTURE LAYERS
  ───────────────────
  Your Code (JS/TS)
       ↓
  Node.js APIs  (fs, http, net …)    ← JS wrappers
       ↓
  Node.js Bindings                   ← C++ bridge (node_bindings.cc)
       ↓
  V8 (executes JS)  +  libuv (async I/O)
       ↓
  Operating System


  EVENT LOOP PHASES (libuv)
  ──────────────────────────
  Each iteration ("tick") goes through these phases in order:

  1. timers        — runs setTimeout / setInterval callbacks whose delay has elapsed
  2. I/O callbacks — runs deferred I/O error callbacks (rare; most I/O is in poll)
  3. idle, prepare — internal libuv use
  4. poll          — retrieves new I/O events; blocks here if nothing is queued
  5. check         — runs setImmediate callbacks
  6. close         — runs close events (e.g. socket.on('close'))

  MICROTASK QUEUES (processed BETWEEN every phase transition)
  ────────────────────────────────────────────────────────────
  process.nextTick queue   ← drained FIRST (higher priority)
  Promise microtask queue  ← drained SECOND

  So the order is:
    sync code → nextTick queue → Promise queue → setImmediate → setTimeout
*/

// Demonstration of ordering:
console.log("A — synchronous start");

setTimeout(() => console.log("E — setTimeout (timers phase)"), 0);

setImmediate(() => console.log("D — setImmediate (check phase)"));

Promise.resolve().then(() => console.log("C — Promise.then (microtask)"));

process.nextTick(() => console.log("B — process.nextTick (microtask, higher priority)"));

console.log("A — synchronous end");

// Output order will be: A start, A end, B, C, D, E
// (sync first, then nextTick, then Promise, then setImmediate, then setTimeout)

/*
  CALL STACK vs TASK QUEUE vs MICROTASK QUEUE
  ─────────────────────────────────────────────
  Call Stack      — LIFO stack; where synchronous code executes
  Microtask Queue — nextTick + Promise callbacks; drained completely before
                    the event loop moves to the next phase
  Task Queue      — setTimeout / setInterval / setImmediate callbacks;
                    processed one-per-phase-tick

  Key insight: microtasks can STARVE the event loop if they keep pushing
  more microtasks onto the queue (e.g. recursive process.nextTick).
*/

// ───────────────────────────────────────────────────────────────
// 2. Buffers
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. Buffers ===");

/*
  A Buffer is a fixed-length chunk of RAW BINARY MEMORY outside the V8 heap.
  V8 (and therefore JavaScript) works with UTF-16 strings — but TCP sockets,
  file reads, and crypto all deal in raw bytes. Buffers bridge that gap.

  WHY NOT JUST USE STRINGS?
  ─────────────────────────
  - Strings are immutable; Buffers are mutable
  - Encoding/decoding every read is expensive
  - Network protocols (HTTP, TLS, databases) speak bytes, not characters
  - Crypto operations need raw octets

  USE CASES
  ─────────
  • Reading binary files (images, PDFs)
  • TCP/UDP network sockets
  • Crypto: hashing, encryption, HMAC
  • Piping data through streams
*/

// Buffer.alloc(size) — zero-fills the memory (safe, no leftover data)
const zeroed: Buffer = Buffer.alloc(8);
console.log("alloc(8):", zeroed); // <Buffer 00 00 00 00 00 00 00 00>

// Buffer.alloc with fill value
const filled: Buffer = Buffer.alloc(4, 0xff);
console.log("alloc(4, 0xff):", filled); // <Buffer ff ff ff ff>

// Buffer.from(string, encoding) — encodes a string into bytes
const fromString: Buffer = Buffer.from("Hello", "utf8");
console.log("from('Hello'):", fromString); // <Buffer 48 65 6c 6c 6f>
console.log("length in bytes:", fromString.length); // 5

// Multibyte characters — note that byte length != char count for non-ASCII
const emoji: Buffer = Buffer.from("😀", "utf8");
console.log("emoji byte length:", emoji.length); // 4 — UTF-8 uses 4 bytes

// Buffer.from(array) — raw byte values
const fromArray: Buffer = Buffer.from([0x48, 0x69]); // "Hi" in ASCII
console.log("from([0x48, 0x69]):", fromArray.toString("utf8")); // Hi

// Encoding conversions
const raw: Buffer = Buffer.from("Node.js");
console.log("utf8  :", raw.toString("utf8"));    // Node.js
console.log("hex   :", raw.toString("hex"));     // 4e6f64652e6a73
console.log("base64:", raw.toString("base64"));  // Tm9kZS5qcw==

// Decoding base64 back
const decoded: Buffer = Buffer.from("Tm9kZS5qcw==", "base64");
console.log("decoded base64:", decoded.toString("utf8")); // Node.js

// Slicing — returns a VIEW (same memory, no copy)
const sliced: Buffer = fromString.slice(1, 4);
console.log("slice(1,4):", sliced.toString()); // ell

// Comparing and copying
const a: Buffer = Buffer.from("abc");
const b: Buffer = Buffer.from("abc");
console.log("equals:", a.equals(b));             // true
console.log("compare:", Buffer.compare(a, b));   // 0 (equal)

// ───────────────────────────────────────────────────────────────
// 3. Streams
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. Streams ===");

/*
  WHY STREAMS?
  ────────────
  Without streams, reading a 10 GB file means:
    fs.readFile() → loads all 10 GB into RAM → then you process it

  With streams:
    Data flows in small CHUNKS (default 64 KB) → process each chunk → GC frees it
    Memory usage stays ~constant regardless of file size.

  FOUR STREAM TYPES
  ──────────────────
  Readable   — produces data   (fs.createReadStream, http.IncomingMessage, process.stdin)
  Writable   — consumes data   (fs.createWriteStream, http.ServerResponse, process.stdout)
  Duplex     — both Readable and Writable  (net.Socket — TCP socket)
  Transform  — Duplex that modifies data   (zlib.createGzip, crypto streams)

  KEY EVENTS
  ──────────
  Readable: 'data', 'end', 'error', 'readable', 'close'
  Writable: 'finish', 'drain', 'error', 'close', 'pipe'

  BACKPRESSURE
  ────────────
  If a Readable produces data faster than a Writable can consume it,
  the Writable's internal buffer fills up. writable.write() returns false
  when the highWaterMark is exceeded. The Readable should pause until
  the Writable emits 'drain' (buffer flushed).

  pipe() handles this automatically — but if the destination errors,
  pipe() does NOT clean up the source stream, causing a memory/handle leak.

  pipeline() (Node 10+) is the error-safe replacement:
    - propagates errors to a callback
    - closes all streams on error
    - preferred for production code
*/

// --- 3a. Custom Readable stream ---
class CounterStream extends Readable {
    private current: number;
    private max: number;

    constructor(max: number) {
        super({ objectMode: false });
        this.current = 1;
        this.max = max;
    }

    // _read is called when the consumer is ready for more data
    _read(): void {
        if (this.current > this.max) {
            this.push(null); // null signals end-of-stream
        } else {
            this.push(Buffer.from(`${this.current}\n`));
            this.current++;
        }
    }
}

// --- 3b. Custom Writable stream ---
class CollectorStream extends Writable {
    public collected: string[] = [];

    _write(chunk: Buffer, _encoding: string, callback: () => void): void {
        this.collected.push(chunk.toString().trim());
        callback(); // MUST call callback to signal readiness for next chunk
    }
}

// --- 3c. Transform stream: uppercase each chunk ---
class UpperCaseTransform extends Transform {
    _transform(chunk: Buffer, _encoding: string, callback: (err: Error | null, data: Buffer) => void): void {
        callback(null, Buffer.from(chunk.toString().toUpperCase()));
    }
}

// Wire them together with pipeline (error-safe)
const source    = new CounterStream(5);
const transform = new UpperCaseTransform();
const sink      = new CollectorStream();

pipeline(source, transform, sink, (err) => {
    if (err) {
        console.error("Pipeline failed:", err.message);
    } else {
        console.log("Pipeline result:", sink.collected.join(", ")); // 1, 2, 3, 4, 5
    }
});

// --- 3d. Readable events (data / end pattern) ---
const readable = new CounterStream(3);
const chunks: string[] = [];

readable.on("data", (chunk: Buffer) => {
    chunks.push(chunk.toString().trim());
});

readable.on("end", () => {
    console.log("Stream ended. Chunks:", chunks.join(", "));
});

readable.on("error", (err: Error) => {
    console.error("Stream error:", err.message);
});

/*
  pipe() vs pipeline()
  ─────────────────────
  readable.pipe(writable)
    ✓ simple one-liner
    ✗ does not clean up on error — the source stays open

  stream.pipeline(src, ...transforms, dest, callback)
    ✓ propagates errors and closes all streams
    ✓ use promisify(pipeline) for async/await
    ✓ preferred in production
*/

// ───────────────────────────────────────────────────────────────
// 4. EventEmitter
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. EventEmitter ===");

/*
  EventEmitter is the backbone of Node.js.
  Almost every core API (streams, http, fs watch, child_process) extends it.

  CORE API
  ────────
  emitter.on(event, listener)              — subscribe (stays active)
  emitter.once(event, listener)            — subscribe once, auto-removes
  emitter.emit(event, ...args)             — fire event synchronously
  emitter.off(event, listener)             — unsubscribe specific listener
  emitter.removeAllListeners(event?)       — unsubscribe all (or all for event)
  emitter.listenerCount(event)             — how many listeners
  emitter.setMaxListeners(n)               — suppress leak warning (default 10)
  emitter.eventNames()                     — array of registered event names

  ERROR EVENT — SPECIAL BEHAVIOR
  ───────────────────────────────
  If 'error' is emitted and there is NO listener for 'error',
  Node.js throws the error and crashes the process.
  Always add: emitter.on('error', handler)
*/

// Basic usage
const bus = new EventEmitter();

bus.on("greet", (name: string) => {
    console.log(`Hello, ${name}!`);
});

bus.once("greet", (name: string) => {
    console.log(`[once] First greeting only: ${name}`);
});

bus.emit("greet", "Sadik");   // fires both listeners
bus.emit("greet", "World");   // fires only the persistent .on listener

// Removing a listener
const handler = (x: number) => console.log("value:", x);
bus.on("value", handler);
bus.emit("value", 42);   // fires
bus.off("value", handler);
bus.emit("value", 99);   // silent — no listeners

// Error event
bus.on("error", (err: Error) => {
    console.log("Caught emitter error:", err.message);
});
bus.emit("error", new Error("something broke"));

// Extending EventEmitter for custom classes
class DataFetcher extends EventEmitter {
    private url: string;

    constructor(url: string) {
        super();
        this.url = url;
    }

    fetch(): void {
        // Simulate async work
        process.nextTick(() => {
            try {
                // Pretend we fetched data
                const data = { url: this.url, status: 200, body: "ok" };
                this.emit("data", data);
                this.emit("done");
            } catch (err) {
                this.emit("error", err);
            }
        });
    }
}

const fetcher = new DataFetcher("https://api.example.com/users");
fetcher.on("data", (d: { url: string; status: number; body: string }) => {
    console.log(`Fetched ${d.url} → ${d.status}`);
});
fetcher.on("done", () => console.log("Fetch complete"));
fetcher.on("error", (err: Error) => console.error("Fetch error:", err.message));
fetcher.fetch();

/*
  MEMORY LEAK WARNING
  ────────────────────
  Node prints:
    "MaxListenersExceededWarning: Possible EventEmitter memory leak detected.
     11 data listeners added."

  Cause: You called .on('data', handler) in a loop without removing old ones.
  Each listener holds a closure — they accumulate and prevent GC.

  Fix options:
    1. emitter.setMaxListeners(0)       — unlimited (suppresses warning only)
    2. emitter.setMaxListeners(50)      — raise limit if you legitimately need many
    3. Remove listeners with .off() when done
    4. Use .once() for one-shot subscriptions
    5. Audit the code path that adds listeners — often a missing cleanup in a loop
*/

// ───────────────────────────────────────────────────────────────
// 5. Child Processes
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Child Processes ===");

/*
  Node.js is single-threaded for JS execution. To use multiple CPU cores
  or run other programs, you need child processes (or worker_threads).

  FOUR TOOLS
  ──────────────────────────────────────────────────────────────────────────
  exec(cmd, cb)    — runs command in a SHELL; buffers ALL output in memory;
                     callback receives (error, stdout, stderr) strings.
                     Good for: short commands where output fits in memory.
                     Risk: shell injection if cmd includes user input.

  execFile(file)   — like exec but NO shell; slightly safer/faster.

  spawn(cmd, args) — runs command WITHOUT a shell; stdout/stderr are STREAMS
                     (no buffering limit); returns a ChildProcess.
                     Good for: long-running commands, large output, real-time output.

  fork(modulePath) — like spawn but ONLY for Node.js scripts;
                     creates an IPC channel between parent and child
                     (child.send() / process.on('message')).
                     Good for: offloading CPU-bound work to another Node process.

  worker_threads   — threads sharing memory (SharedArrayBuffer);
                     same process, lighter than fork;
                     Good for: CPU-bound tasks that need shared memory (image processing,
                     compression, parsing large JSON).

  WHEN TO USE WHICH
  ─────────────────
  Short shell command, small output    → exec
  Long-running / large output          → spawn
  Offload CPU work (Node script)       → fork or worker_threads
  Need shared memory                   → worker_threads
*/

// --- 5a. exec: buffered, uses shell ---
(async () => {
    try {
        const { stdout } = await execAsync("node --version");
        console.log("exec node version:", stdout.trim());
    } catch (err) {
        console.error("exec error:", (err as Error).message);
    }
})();

// --- 5b. spawn: streaming, no shell ---
const lsProcess = spawn("ls", ["-1", "/tmp"]);

lsProcess.stdout.on("data", (chunk: Buffer) => {
    const files = chunk.toString().trim().split("\n").slice(0, 3);
    console.log("spawn ls (first 3):", files.join(", "));
});

lsProcess.stderr.on("data", (chunk: Buffer) => {
    console.error("spawn stderr:", chunk.toString());
});

lsProcess.on("close", (code: number | null) => {
    console.log("spawn exited with code:", code);
});

/*
  --- 5c. fork + IPC (illustrative — cannot run inline here) ---

  // parent.js
  const child = fork('./worker.js');
  child.send({ task: 'compute', input: 1_000_000 });
  child.on('message', (result) => {
    console.log('Result from child:', result);
    child.disconnect();
  });

  // worker.js
  process.on('message', (msg) => {
    const result = heavyCompute(msg.input);
    process.send({ result });
  });

  IPC channel: parent ↔ child communicate via serialized JSON messages.
  Each side uses .send() to push and .on('message') to receive.
  Call child.disconnect() or child.kill() when done.
*/

/*
  --- 5d. worker_threads (CPU-bound, shared memory) ---

  import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

  if (isMainThread) {
    const worker = new Worker(__filename, { workerData: { n: 40 } });
    worker.on('message', (result) => console.log('fib:', result));
  } else {
    // This branch runs in the worker thread
    function fib(n: number): number { return n < 2 ? n : fib(n-1) + fib(n-2); }
    parentPort!.postMessage(fib(workerData.n));
  }

  worker_threads vs fork:
  - worker_threads: lighter (same process), can share ArrayBuffer
  - fork: separate process (full isolation), heavier, suited for crash isolation
*/

// ───────────────────────────────────────────────────────────────
// 6. The `process` Object
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. The process Object ===");

/*
  `process` is a global — no import needed.
  It is an EventEmitter that represents the current Node.js process.
*/

// process.env — environment variables (always strings or undefined)
const nodeEnv: string = process.env.NODE_ENV ?? "development";
console.log("NODE_ENV:", nodeEnv);

// process.argv — command-line arguments
// argv[0] = 'node' binary path
// argv[1] = script path
// argv[2+] = user-supplied args
const userArgs: string[] = process.argv.slice(2);
console.log("argv (user args):", userArgs.length ? userArgs : "(none)");

// process.memoryUsage() — heap stats in bytes
const mem = process.memoryUsage();
console.log("heapUsed  :", (mem.heapUsed  / 1024 / 1024).toFixed(2), "MB");
console.log("heapTotal :", (mem.heapTotal / 1024 / 1024).toFixed(2), "MB");
console.log("rss       :", (mem.rss       / 1024 / 1024).toFixed(2), "MB");
// rss (Resident Set Size) = total memory allocated for the process including
// native heap, stack, and code segments.

// process.hrtime.bigint() — nanosecond-precision timer
const t0: bigint = process.hrtime.bigint();
let sum = 0;
for (let i = 0; i < 1_000_000; i++) sum += i;
const t1: bigint = process.hrtime.bigint();
console.log(`1M iterations: ${(t1 - t0) / 1_000_000n} ms, sum=${sum}`);

// process.platform, process.arch, process.version
console.log(`platform: ${process.platform}, arch: ${process.arch}, node: ${process.version}`);

// Uncaught exception handler — last line of defence (do not use for normal flow)
process.on("uncaughtException", (err: Error) => {
    console.error("[uncaughtException] — process will exit:", err.message);
    // Always exit after uncaughtException; the process is in an undefined state
    process.exit(1);
});

// Unhandled promise rejection handler
process.on("unhandledRejection", (reason: unknown) => {
    console.error("[unhandledRejection]:", reason);
    process.exit(1);
});

/*
  process.exit(code)
  ──────────────────
  0  = success (default when main code finishes)
  1  = generic error (convention)
  2  = misuse of shell built-in (convention)
  >0 = non-zero signals failure to the shell / CI pipeline

  IMPORTANT: process.exit() is immediate — 'finish' events on streams are
  NOT guaranteed to fire. Use process.exitCode = 1 instead when you want
  to signal failure but still let the event loop drain.
*/

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice Q&A ===");

/*
  Q1: Why does process.nextTick run before Promise.then even though both
      are microtasks?
  ──────────────────────────────────────────────────────────────────────
  A: Node.js maintains TWO separate microtask queues, processed in this order:
       1. nextTick queue (exclusive to Node.js)
       2. Promise microtask queue (spec-defined)
     After every synchronous operation (and after every event-loop phase
     transition) Node drains the nextTick queue COMPLETELY before even
     checking the Promise queue. This is a deliberate design decision —
     nextTick was built to let Node.js APIs defer callbacks within the
     same phase but before I/O. Promise microtasks followed later, from
     the JS spec. The spec order is: nextTick → Promise. Note: recursive
     nextTick calls can starve Promise callbacks indefinitely.


  Q2: You're processing a 10 GB log file. Should you use fs.readFileSync,
      fs.readFile, or streams? Why?
  ──────────────────────────────────────────────────────────────────────
  A: Use streams (fs.createReadStream).
     • fs.readFileSync: blocks the event loop for the entire read — no other
       requests can be served. Loads 10 GB into RAM. Never in production.
     • fs.readFile: async but still buffers the ENTIRE file before calling back.
       With 10 GB you will likely hit Node's default 2 GB string limit or simply
       exhaust available RAM, crashing the process.
     • fs.createReadStream: delivers data in small chunks (default 64 KB). Memory
       usage stays constant (a few hundred KB) regardless of file size. The event
       loop stays responsive. Combine with pipeline() to transform/write safely.


  Q3: What's the difference between exec and spawn?
  ──────────────────────────────────────────────────────────────────────
  A: exec    — spawns a shell (/bin/sh), passes the command as a string,
               BUFFERS all of stdout/stderr into memory, and calls back
               with (error, stdout, stderr) strings when the process exits.
               Limit: ~200 KB default buffer; configurable but finite.
               Risk: shell injection if the command includes user input.

     spawn   — does NOT spawn a shell; takes the executable and an args array
               separately (safer); stdout/stderr are STREAMS — data flows as
               it arrives with no memory cap. You listen to 'data' events.
               Required for long-running processes or large output.

     Rule of thumb: prefer spawn unless you need shell features (pipes,
     globbing) and your command is short and trusted.


  Q4: Your EventEmitter shows "MaxListenersExceededWarning". What caused
      it and how do you fix it?
  ──────────────────────────────────────────────────────────────────────
  A: Cause: more than 10 listeners (the default max) have been registered on
     the same event. Common mistake — adding a new listener in a loop or inside
     a function that is called repeatedly without removing the old listener first.
     Each listener holds a closure reference, preventing garbage collection.

     Fixes (choose based on situation):
       1. Remove listeners when done:      emitter.off(event, handler)
       2. Use .once() for one-shot cases
       3. If many legitimate listeners:    emitter.setMaxListeners(50)
       4. To suppress globally (not recommended): emitter.setMaxListeners(0)
       5. Investigate: emitter.listenerCount('event') and emitter.rawListeners()
          to audit what is attached.


  Q5: What's backpressure in streams and how does pipeline() handle it
      better than pipe()?
  ──────────────────────────────────────────────────────────────────────
  A: Backpressure occurs when a Readable produces data faster than a Writable
     can consume it. The Writable's internal buffer (bounded by highWaterMark,
     default 16 KB) fills up. writable.write() returns false as a signal to
     pause. The Readable should stop calling push() until the Writable emits
     'drain' (buffer flushed back below highWaterMark).

     pipe() handles the pause/resume cycle automatically. But if the DESTINATION
     stream errors, pipe() does NOT destroy the SOURCE stream — it stays open,
     holding file descriptors or sockets until the process exits (resource leak).

     pipeline() additionally:
       • Propagates errors from any stream in the chain to the final callback
       • Automatically calls destroy() on ALL streams in the pipeline on error
       • Can be promisified: const pipelineAsync = promisify(pipeline)
       • Cleans up even for Transform streams in the middle of the chain
     This makes pipeline() the correct default for any production stream chain.
*/

// ───────────────────────────────────────────────────────────────
// REFERENCE CARD (runDemo)
// ───────────────────────────────────────────────────────────────

function runDemo(): void {
    console.log(`
╔══════════════════════════════════════════════════════════════════╗
║        BACKEND 01 — NODE.JS INTERNALS REFERENCE CARD            ║
╠══════════════════════════════════════════════════════════════════╣
║  EVENT LOOP ORDER (within one tick)                             ║
║    sync → nextTick → Promise.then → setImmediate → setTimeout  ║
╠══════════════════════════════════════════════════════════════════╣
║  BUFFER QUICK REF                                               ║
║    Buffer.alloc(n)           zero-filled, safe                  ║
║    Buffer.from(str, enc)     string → bytes                     ║
║    buf.toString('utf8|hex|base64')   bytes → string             ║
║    buf.length                byte count (not char count)        ║
╠══════════════════════════════════════════════════════════════════╣
║  STREAM TYPES                                                   ║
║    Readable   produces data   (fs.createReadStream)             ║
║    Writable   consumes data   (fs.createWriteStream)            ║
║    Transform  in→modify→out  (zlib, crypto)                     ║
║    Duplex     both            (net.Socket)                      ║
║  pipeline(src, ...xforms, dest, cb)  — error-safe pipe          ║
╠══════════════════════════════════════════════════════════════════╣
║  EVENTEMITTER                                                   ║
║    .on(ev, fn)   persistent    .once(ev, fn)  one-shot          ║
║    .emit(ev, …)  synchronous   .off(ev, fn)   remove            ║
║    'error' with no listener → uncaught throw → crash           ║
║    MaxListeners default = 10  → setMaxListeners(n) to raise     ║
╠══════════════════════════════════════════════════════════════════╣
║  CHILD PROCESSES                                                ║
║    exec   → shell, buffered, callback                           ║
║    spawn  → no shell, streams, large output                     ║
║    fork   → Node only, IPC channel (.send / 'message')          ║
║    worker_threads → threads, shared memory, CPU-bound           ║
╠══════════════════════════════════════════════════════════════════╣
║  PROCESS OBJECT                                                 ║
║    process.env              environment variables               ║
║    process.argv             CLI arguments (argv[2+])            ║
║    process.exit(code)       0=ok, non-zero=error                ║
║    process.memoryUsage()    heapUsed, heapTotal, rss            ║
║    process.hrtime.bigint()  nanosecond timer                    ║
║    'uncaughtException'      last-resort error handler           ║
║    'unhandledRejection'     catch missed promise rejections      ║
╚══════════════════════════════════════════════════════════════════╝
`);
}

runDemo();

export default runDemo;
