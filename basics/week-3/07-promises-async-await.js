// ═══════════════════════════════════════════════════════════════
// MODULE 7: PROMISES & ASYNC/AWAIT
// Run: node 07-promises-async-await.js
// ═══════════════════════════════════════════════════════════════
//
// The PROBLEM: callbacks nest deeply ("callback hell") and
// error handling at every level is painful.
//
// PROMISE = an object representing the eventual result (or failure)
//           of an async operation. A placeholder for a future value.
//
// 3 states (one-way transitions):
//   PENDING   → FULFILLED (resolved with a value)
//   PENDING   → REJECTED  (rejected with a reason)
//   Once settled, the state CANNOT change.

// ───────────────────────────────────────────────────────────────
// 1. CREATING & CONSUMING a Promise
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Creating a Promise ===");

function delay(ms, value) {
    return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function delayFail(ms, reason) {
    return new Promise((_, reject) => setTimeout(() => reject(reason), ms));
}

// Executor runs SYNCHRONOUSLY — important!
const p = new Promise((resolve, reject) => {
    console.log("Executor runs synchronously"); // prints immediately
    resolve(42);
});

p.then(val => console.log("Resolved:", val));  // microtask
console.log("After new Promise()");            // sync — prints before .then

// Output: "Executor runs synchronously", "After new Promise()", "Resolved: 42"

// ───────────────────────────────────────────────────────────────
// 2. PROMISE CHAINING — flat, not nested
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. Promise Chaining ===");

// Old callback hell (conceptual — not runnable):
// step1(function(a) { step2(a, function(b) { step3(b, function(c) { ... }) }) })

// Clean promise chain — values flow through .then():
Promise.resolve(10)
    .then(a => {
        console.log("step1:", a);   // 10
        return a * 2;               // return value → next .then gets it
    })
    .then(b => {
        console.log("step2:", b);   // 20
        return b + 5;
    })
    .then(c => {
        console.log("step3:", c);   // 25
    });

// Returning a Promise from .then() — chain waits for it:
delay(50, "hello")
    .then(val => {
        console.log("got:", val);       // "hello"
        return delay(50, val + " world"); // chain waits for this promise
    })
    .then(val => console.log("chained:", val)); // "hello world"

// ───────────────────────────────────────────────────────────────
// 3. ERROR HANDLING — .catch() and propagation
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. Error Handling ===");

Promise.resolve(1)
    .then(v => { console.log("ok:", v); throw new Error("boom"); })
    .then(() => console.log("skipped — error propagates"))
    .then(() => console.log("also skipped"))
    .catch(err => {
        console.log("caught:", err.message); // "boom"
        return "recovered";                  // returning a value resumes the chain
    })
    .then(v => console.log("after recovery:", v)); // "recovered"

// .finally() — runs on both success AND failure, passes value through
delay(10, "data")
    .then(v => { console.log("success:", v); return v; })
    .catch(e => console.log("error:", e))
    .finally(() => console.log("finally: always runs"));

// ───────────────────────────────────────────────────────────────
// 4. Promise.all() — all must succeed, parallel execution
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. Promise.all ===");

Promise.all([
    delay(30, "A"),
    delay(10, "B"),
    delay(20, "C"),
]).then(([a, b, c]) => {
    console.log("all:", a, b, c); // A B C — ORDER preserved, not arrival order
});

// If ANY rejects, Promise.all rejects immediately:
Promise.all([
    delay(10, "ok"),
    delayFail(5, "oops"),
    delay(20, "ok2"),
]).catch(err => console.log("all failed:", err)); // "oops"

// ───────────────────────────────────────────────────────────────
// 5. Promise.allSettled() — never rejects, reports all outcomes
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Promise.allSettled ===");

Promise.allSettled([
    delay(10, "success"),
    delayFail(5, "failed"),
    delay(20, "also success"),
]).then(results => {
    results.forEach(r => {
        if (r.status === "fulfilled") console.log("fulfilled:", r.value);
        else                          console.log("rejected: ", r.reason);
    });
});

// Output:
//   rejected:  failed
//   fulfilled: success
//   fulfilled: also success

// ───────────────────────────────────────────────────────────────
// 6. Promise.race() / Promise.any()
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. race vs any ===");

// race — first to SETTLE (resolve OR reject) wins:
Promise.race([delay(50, "slow"), delay(10, "fast"), delayFail(30, "medium-fail")])
    .then(v => console.log("race winner:", v))  // "fast"
    .catch(e => console.log("race rejected:", e));

// any — first to RESOLVE wins; rejects only if ALL reject:
Promise.any([
    delayFail(5, "err1"),
    delay(20, "second"),
    delayFail(10, "err2"),
]).then(v => console.log("any winner:", v)); // "second" — first to resolve

// ───────────────────────────────────────────────────────────────
// 7. STATIC SHORTCUTS
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. Promise.resolve / reject shortcuts ===");

// Immediately resolved:
Promise.resolve("instant").then(v => console.log("resolved:", v));

// Immediately rejected:
Promise.reject(new Error("instant fail")).catch(e => console.log("rejected:", e.message));

// ───────────────────────────────────────────────────────────────
// 8. ASYNC/AWAIT — synchronous-looking async code
// ───────────────────────────────────────────────────────────────

console.log("\n=== 8. async/await basics ===");

// async function ALWAYS returns a Promise.
// await PAUSES the function (not the thread) until the promise settles.

async function fetchUser(id) {
    console.log("  fetching user", id);
    const user = await delay(30, { id, name: "Sadik" });
    console.log("  got user:", user.name);
    return user;
}

fetchUser(1).then(u => console.log("  caller got:", u.name));
console.log("  (sync continues while fetch is in flight)");

// ───────────────────────────────────────────────────────────────
// 9. ERROR HANDLING in async/await
// ───────────────────────────────────────────────────────────────

console.log("\n=== 9. Error handling with try/catch ===");

async function riskyOp() {
    try {
        const val = await delay(10, "ok");
        console.log("  step1:", val);
        await delayFail(5, "something broke");
        console.log("  step2: never reached");
    } catch (err) {
        console.log("  caught:", err);
        return "fallback";
    } finally {
        console.log("  finally: always runs");
    }
}

riskyOp().then(v => console.log("  result:", v));

// ───────────────────────────────────────────────────────────────
// 10. PARALLEL vs SEQUENTIAL async/await
// ───────────────────────────────────────────────────────────────

console.log("\n=== 10. Parallel vs Sequential ===");

async function sequential() {
    const start = Date.now();
    const a = await delay(50, "A");  // wait 50ms
    const b = await delay(50, "B");  // wait another 50ms
    console.log("  sequential:", a, b, "→", Date.now() - start, "ms");
}

async function parallel() {
    const start = Date.now();
    const [a, b] = await Promise.all([delay(50, "A"), delay(50, "B")]); // both at once
    console.log("  parallel:  ", a, b, "→", Date.now() - start, "ms");
}

sequential();
parallel();

// sequential ≈ 100ms; parallel ≈ 50ms

// ───────────────────────────────────────────────────────────────
// 11. COMMON MISTAKE — await inside forEach
// ───────────────────────────────────────────────────────────────

console.log("\n=== 11. await in loops ===");

const ids = [1, 2, 3];

// ❌ forEach does NOT await — all run simultaneously unintentionally
async function badLoop() {
    const results = [];
    ids.forEach(async (id) => {     // async callback — forEach ignores the promise
        const v = await delay(10 * id, `item-${id}`);
        results.push(v);
    });
    // results is empty here — forEach finished before any awaits resolved
    console.log("  badLoop results (too early):", results);
}

// ✅ for...of awaits each in sequence (intentional sequential)
async function goodLoopSequential() {
    const results = [];
    for (const id of ids) {
        results.push(await delay(10 * id, `item-${id}`));
    }
    console.log("  sequential loop:", results);
}

// ✅ Promise.all for intentional parallel
async function goodLoopParallel() {
    const results = await Promise.all(ids.map(id => delay(10 * id, `item-${id}`)));
    console.log("  parallel loop:", results);
}

badLoop();
goodLoopSequential();
goodLoopParallel();

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

setTimeout(() => {
    console.log("\n=== Practice ===");

    // Q1: What prints?
    const q1 = new Promise(resolve => {
        console.log("Q1: executor");
        resolve("done");
    });
    q1.then(v => console.log("Q1: then:", v));
    console.log("Q1: sync after");
    // Answer: "Q1: executor", "Q1: sync after", "Q1: then: done"

    // Q2: async return value
    async function q2fn() { return 42; }
    q2fn().then(v => console.log("Q2:", v)); // 42

    // Q3: async/await order
    async function q3() {
        console.log("Q3: A");
        await null;
        console.log("Q3: C");
    }
    q3();
    console.log("Q3: B");
    // Answer: Q3: A, Q3: B, Q3: C
}, 400);
