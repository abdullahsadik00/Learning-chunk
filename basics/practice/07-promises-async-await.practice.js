// ═══════════════════════════════════════════════════════════════
// PRACTICE: PROMISES & ASYNC/AWAIT
// Run: node 07-promises-async-await.practice.js
// ═══════════════════════════════════════════════════════════════

function check(label, got, expected) {
    const pass = JSON.stringify(got) === JSON.stringify(expected);
    console.log(pass
        ? `✅  ${label}`
        : `❌  ${label}\n    got:      ${JSON.stringify(got)}\n    expected: ${JSON.stringify(expected)}`
    );
}

// ─── PREDICT 1: executor runs synchronously ──────────────────
console.log("\n── Predict 1 ──");
// The Promise executor runs SYNCHRONOUSLY.
// .then() callbacks run as microtasks (after sync code).
// Output: ???

const p = new Promise((resolve) => {
    console.log("executor");   // A
    resolve(42);
});
p.then(v => console.log("then:", v)); // B — when does this run?
console.log("after new Promise");     // C

// ─── PREDICT 2: .then() chain values ─────────────────────────
setTimeout(() => {
    console.log("\n── Predict 2 ──");
    // Values flow through .then() — each returns the next input.
    // Throwing skips subsequent .then() until a .catch().
    // Output: ???

    Promise.resolve(1)
        .then(v => { console.log("step1:", v); return v * 10; })
        .then(v => { console.log("step2:", v); throw new Error("oops"); })
        .then(v => console.log("step3:", v))   // skipped?
        .catch(e => { console.log("catch:", e.message); return "recovered"; })
        .then(v => console.log("after catch:", v));
}, 100);

// ─── PREDICT 3: Promise.all vs allSettled ────────────────────
setTimeout(() => {
    console.log("\n── Predict 3 ──");
    // Promise.all → rejects immediately if ANY rejects.
    // Promise.allSettled → waits for all, never rejects.
    // Predict what each logs:

    const quick = ms => new Promise(r => setTimeout(() => r(`ok-${ms}`), ms));
    const fail  = ms => new Promise((_, r) => setTimeout(() => r(`fail-${ms}`), ms));

    // A: what does Promise.all log? Does it log anything from the resolved ones?
    Promise.all([quick(50), fail(10), quick(30)])
        .then(vals => console.log("all resolved:", vals))
        .catch(err => console.log("all rejected:", err));  // A: ???

    // B: what does allSettled log?
    Promise.allSettled([quick(50), fail(10), quick(30)])
        .then(results => results.forEach(r => {
            console.log(r.status === "fulfilled"
                ? "fulfilled: " + r.value
                : "rejected:  " + r.reason
            );
        }));
}, 200);

// ─── IMPLEMENT 1: wrap a callback-style function ─────────────
console.log("\n── Implement 1 ──");
// Convert this callback-based function into one that returns a Promise.
// promisifiedDelay(ms, value) → resolves with `value` after `ms` ms.

function legacyDelay(ms, value, callback) {
    setTimeout(() => callback(null, value), ms);
}

function promisifiedDelay(ms, value) {
    // YOUR CODE
    return new Promise(() => {});  // fix this
}

promisifiedDelay(50, "hello")
    .then(v => check("promisified resolves correctly", v, "hello"));

// ─── IMPLEMENT 2: sequential vs parallel ─────────────────────
setTimeout(async () => {
    console.log("\n── Implement 2 ──");

    const delay = (ms, val) => new Promise(r => setTimeout(() => r(val), ms));

    // Sequential: total time ≈ 100ms + 100ms = ~200ms
    async function fetchSequential() {
        // YOUR CODE — two awaits in sequence
        // const a = await ...
        // const b = await ...
        return ["?", "?"]; // fix this
    }

    // Parallel: total time ≈ max(100ms, 100ms) = ~100ms
    async function fetchParallel() {
        // YOUR CODE — use Promise.all
        return ["?", "?"]; // fix this
    }

    const t1 = Date.now();
    const seqResult = await fetchSequential();
    check("sequential returns both values", seqResult, ["A", "B"]);
    check("sequential takes ~200ms", Date.now() - t1 >= 180, true);

    const t2 = Date.now();
    const parResult = await fetchParallel();
    check("parallel returns both values", parResult, ["A", "B"]);
    check("parallel takes ~100ms (not 200ms)", Date.now() - t2 < 180, true);
}, 600);

// ─── IMPLEMENT 3: retry with async/await ─────────────────────
setTimeout(async () => {
    console.log("\n── Implement 3 ──");
    // Implement retry(fn, maxAttempts).
    // Calls fn(). If it rejects, retry up to maxAttempts times total.
    // If all attempts fail, reject with the last error.
    // If it succeeds, resolve with the value.

    async function retry(fn, maxAttempts) {
        // YOUR CODE — replace stub below
        return fn(); // stub: tries once only
    }

    let attempts = 0;
    const flakyFn = () => new Promise((resolve, reject) => {
        attempts++;
        if (attempts < 3) reject(new Error(`attempt ${attempts} failed`));
        else resolve("success on attempt 3");
    });

    attempts = 0;
    try {
        const result = await retry(flakyFn, 3);
        check("retry succeeds on 3rd attempt", result, "success on attempt 3");
        check("fn was called 3 times",         attempts, 3);
    } catch(e) { console.log("❌  retry threw unexpectedly:", e.message); }

    // Should reject when max attempts exhausted:
    attempts = 0;
    const alwaysFail = () => new Promise((_, r) => { attempts++; r(new Error("always fails")); });
    try {
        await retry(alwaysFail, 2);
        console.log("❌  Should have thrown");
    } catch (e) {
        check("rejects after max attempts", e.message, "always fails");
        check("fn called exactly maxAttempts times", attempts, 2);
    }
}, 1000);

// ─── IMPLEMENT 4: async/await error handling ─────────────────
setTimeout(async () => {
    console.log("\n── Implement 4 ──");
    // fetchUser(id) simulates an API call.
    // Implement a wrapper that:
    //   - returns the user on success
    //   - returns { error: "not found" } if the fetch rejects
    //   - always logs "fetch complete" regardless of outcome

    const delay = (ms, val) => new Promise(r => setTimeout(() => r(val), ms));
    const fetchUser = (id) => id > 0
        ? delay(20, { id, name: "Sadik" })
        : Promise.reject(new Error("not found"));

    async function safeGetUser(id) {
        // YOUR CODE — use try/catch/finally
        return null;
    }

    const user = await safeGetUser(1);
    check("valid id returns user",    user && user.name, "Sadik");

    const notFound = await safeGetUser(-1);
    check("invalid id returns error object", notFound, { error: "not found" });
}, 1500);

setTimeout(() => {}, 2500); // keep process alive
