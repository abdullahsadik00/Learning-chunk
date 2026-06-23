// ═══════════════════════════════════════════════════════════════
// PRACTICE: EVENT LOOP
// Run: node 06-event-loop.practice.js
//
// This file is almost entirely PREDICT exercises.
// The event loop is a mental model — you can only learn it
// by tracing code in your head, then verifying.
//
// RULE:
//   1. All synchronous code runs first (call stack)
//   2. Drain ALL microtasks (Promise.then, queueMicrotask)
//   3. Run ONE macrotask (setTimeout/setInterval callback)
//   4. Go back to step 2
//
// Priority: Sync > Microtask > Macrotask
// ═══════════════════════════════════════════════════════════════

// ─── PREDICT 1: basic ordering ───────────────────────────────
console.log("\n── Predict 1 ──");
// Write the output sequence before running:
//   Output: ???

console.log("A");
setTimeout(() => console.log("B"), 0);
console.log("C");

// ─── PREDICT 2: microtask beats macrotask ────────────────────
console.log("\n── Predict 2 ──");
// Write the output sequence:
//   Output: ???
//
// Think: when does Promise.then run vs setTimeout?

setTimeout(() => console.log("T"), 0);
Promise.resolve().then(() => console.log("M"));
console.log("S");

// ─── PREDICT 3: multiple microtasks drain before macrotask ───
console.log("\n── Predict 3 ──");
// ALL microtasks drain — including ones added during the drain —
// before the next macrotask runs.
// Write the full output sequence:
//   Output: ???

setTimeout(() => console.log("timeout-1"), 0);

Promise.resolve()
    .then(() => {
        console.log("M1");
        return Promise.resolve(); // queues another microtask
    })
    .then(() => console.log("M2 — chained"));

Promise.resolve().then(() => console.log("M3"));

console.log("Sync");

// ─── PREDICT 4: microtask spawning a macrotask ───────────────
console.log("\n── Predict 4 ──");
// This is the hardest one. Trace step by step:
//   Output: ???

setTimeout(() => {
    console.log("[T1] timeout-1");
    Promise.resolve().then(() => console.log("[M-in-T1] microtask inside T1"));
}, 0);

Promise.resolve().then(() => {
    console.log("[M1] microtask-1");
    setTimeout(() => console.log("[T2] timeout-2 queued from microtask"), 0);
});

setTimeout(() => console.log("[T3] timeout-3"), 0);

console.log("[S] sync");

// Trace:
// Sync phase:     [S]
// Microtask drain: ___
// 1st macrotask:  ___
// Microtask drain: ___
// 2nd macrotask:  ___
// 3rd macrotask:  ___

// ─── PREDICT 5: async/await execution order ──────────────────
console.log("\n── Predict 5 ──");
// await suspends the async function — the rest of it becomes a microtask.
// Code AFTER the async call continues synchronously.
// Output: ???

async function asyncFn() {
    console.log("A — inside async (before await)");
    await Promise.resolve();    // suspends here
    console.log("C — resumed after microtask");
}

asyncFn();
console.log("B — sync code after asyncFn() call");

// ─── PREDICT 6: nested async calls (hardest interview question) ──
console.log("\n── Predict 6 ──");
// Predict the full sequence.
// Hint: each `await` is one microtask hop.
// Output: ???

async function alpha() {
    console.log("α1");
    await beta();
    console.log("α3");
}
async function beta() {
    console.log("β1");
    await gamma();
    console.log("β3");
}
async function gamma() {
    console.log("γ1");
    // no await — resolves immediately
}

alpha();
console.log("sync-after");

// ─── EXPLAIN: answer these in comments ───────────────────────
console.log("\n── Explain ──");

// Q1: Why does setTimeout(() => ..., 0) NOT run before other code?
// Answer: ___

// Q2: What is the difference between a microtask and a macrotask? Name one of each.
// Microtask example: ___
// Macrotask example: ___

// Q3: What happens if a microtask queues another microtask?
// Answer: ___

// Q4: In the browser, what would happen to click events and rendering
//     if you had an infinite loop in a microtask?
// Answer: ___

setTimeout(() => {}, 500); // keep process alive for the async examples
