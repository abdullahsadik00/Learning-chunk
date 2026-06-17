// ═══════════════════════════════════════════════════════════════
// MODULE 6: EVENT LOOP
// Run: node 06-event-loop.js
// ═══════════════════════════════════════════════════════════════
//
// JS is SINGLE-THREADED — one call stack, one thing at a time.
// Yet it handles timers, I/O, and promises non-blockingly.
// The answer: Event Loop + Task Queues + (Browser/Node) APIs.
//
// RUNTIME PIECES:
//   Call Stack    → executes synchronous code (LIFO)
//   Web/Node APIs → handle async work (timers, I/O, etc.)
//   Microtask Q   → Promise callbacks, queueMicrotask (HIGH priority)
//   Macrotask Q   → setTimeout/setInterval callbacks  (LOW priority)
//   Event Loop    → moves tasks from queues to call stack
//
// EVENT LOOP ALGORITHM (runs forever):
//   1. Execute all synchronous code
//   2. Drain entire microtask queue (ALL of them, including newly added)
//   3. Run ONE macrotask
//   4. Go back to 2
//
// Priority: Synchronous → Microtask → Macrotask

// ───────────────────────────────────────────────────────────────
// 1. BASIC: setTimeout with 0ms delay
// ───────────────────────────────────────────────────────────────

console.log("=== 1. setTimeout(0) does NOT mean 'run immediately' ===");

console.log("Start");               // sync → runs first

setTimeout(() => {
    console.log("Timer");           // macrotask → runs last
}, 0);

console.log("End");                 // sync → runs second

// Output: Start, End, Timer
// "Timer" runs AFTER all sync code finishes, even with 0ms delay.

// ───────────────────────────────────────────────────────────────
// 2. MICROTASK beats MACROTASK
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. Microtask vs Macrotask Priority ===");

setTimeout(() => console.log("Macrotask (setTimeout)"), 0);   // macrotask Q

Promise.resolve().then(() => console.log("Microtask (Promise)")); // microtask Q

console.log("Sync");

// Output:
//   Sync                        ← sync
//   Microtask (Promise)         ← microtask (drained before macrotasks)
//   Macrotask (setTimeout)      ← macrotask

// ───────────────────────────────────────────────────────────────
// 3. DRAINING the entire microtask queue before one macrotask
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. All microtasks drain before macrotask runs ===");

setTimeout(() => console.log("T1 macrotask"), 0);

Promise.resolve()
    .then(() => {
        console.log("M1");
        // Adding a new microtask DURING microtask drain — it ALSO runs before T1
        return Promise.resolve();
    })
    .then(() => console.log("M2 (chained — also runs before T1)"));

Promise.resolve().then(() => console.log("M3"));

console.log("Sync");

// Output: Sync, M1, M3, M2, T1
// M1 fires → returns new promise → M2 queued
// M3 fires (was already queued)
// M2 fires (queued by M1's returned promise)
// ONLY THEN does T1 run

// ───────────────────────────────────────────────────────────────
// 4. COMPLEX: microtask spawning macrotask spawning microtask
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. Complex Interleaving ===");

// Label each callback so the trace is obvious
setTimeout(() => {
    console.log("[T1] timeout 1");
    Promise.resolve().then(() => console.log("[M-inside-T1] microtask inside T1"));
}, 0);

Promise.resolve().then(() => {
    console.log("[M1] microtask 1");
    setTimeout(() => console.log("[T2] timeout 2 — queued inside M1"), 0);
});

setTimeout(() => console.log("[T3] timeout 3"), 0);

console.log("[S] sync");

// Step-by-step trace:
//   SYNC:       [S]
//   MICROTASKS: [M1]  → registers T2
//   MACROTASK:  [T1]  → registers microtask-inside-T1
//   MICROTASKS: [M-inside-T1]
//   MACROTASK:  [T3]  (T2 was registered AFTER T3, so T3 runs first)
//   MACROTASK:  [T2]

// Output: [S], [M1], [T1], [M-inside-T1], [T3], [T2]

// ───────────────────────────────────────────────────────────────
// 5. queueMicrotask() — explicit microtask scheduling
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. queueMicrotask ===");

queueMicrotask(() => console.log("queueMicrotask — runs as microtask"));
setTimeout(() => console.log("setTimeout — runs as macrotask"), 0);
Promise.resolve().then(() => console.log("Promise — runs as microtask"));
console.log("sync");

// Output: sync, queueMicrotask, Promise, setTimeout
// (queueMicrotask and Promise are both microtasks — order between them
//  follows the order they were registered)

// ───────────────────────────────────────────────────────────────
// 6. CLASSIC INTERVIEW: async function execution order
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. async/await and the event loop ===");

async function asyncFn() {
    console.log("A — sync inside async (before await)");
    await Promise.resolve();          // everything after this → microtask
    console.log("C — resumes after microtask");
}

asyncFn();
console.log("B — sync after asyncFn() call");

// Output: A, B, C
// A runs synchronously (async function runs sync until first await)
// await suspends asyncFn → rest (C) queued as microtask
// B runs (still in sync phase)
// Microtask fires → C

// ───────────────────────────────────────────────────────────────
// 7. THE HARDEST CLASSIC INTERVIEW QUESTION
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. Classic Interview Q ===");

async function first() {
    console.log("A");
    await second();      // second() runs sync up to its await, then suspends
    console.log("E");    // microtask after second resolves
}

async function second() {
    console.log("B");
    await third();
    console.log("D");    // microtask after third resolves
}

async function third() {
    console.log("C");    // no await → resolves immediately
}

first();
console.log("F");

// Trace:
//   first() → A (sync)
//   await second() → second() starts → B (sync)
//   await third() → third() starts → C (sync), resolves immediately
//   F (sync — main thread)
//   Microtask: third resolved → D
//   Microtask: second resolved → E

// Output: A, B, C, F, D, E

// ───────────────────────────────────────────────────────────────
// 8. WHY blocking is dangerous
// ───────────────────────────────────────────────────────────────

console.log("\n=== 8. Blocking vs Non-blocking ===");

// This BLOCKS the entire runtime — no timers, no I/O, nothing fires
function blockFor(ms) {
    const end = Date.now() + ms;
    while (Date.now() < end) { /* busy-wait */ }
}

console.log("before block");
// blockFor(3000); // ← uncomment to see blocking effect
console.log("after block (event loop was frozen)");

// Non-blocking equivalent — hand it off to the runtime:
setTimeout(() => console.log("non-blocking delay"), 100);
console.log("sync continues immediately");

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice ===");

// Q1: What prints?
console.log("1");
setTimeout(() => console.log("2"), 0);
console.log("3");
// Answer: 1, 3, 2

// Q2: What prints?
setTimeout(() => console.log("T"), 0);
Promise.resolve().then(() => console.log("P"));
console.log("S");
// Answer: S, P, T

// Q3: Harder — predict the output
setTimeout(() => {
    console.log("Q3-T1");
    Promise.resolve().then(() => console.log("Q3-M2"));
}, 0);

Promise.resolve().then(() => {
    console.log("Q3-M1");
    setTimeout(() => console.log("Q3-T2"), 0);
});

console.log("Q3-S");
// Answer: Q3-S, Q3-M1, Q3-T1, Q3-M2, Q3-T2
