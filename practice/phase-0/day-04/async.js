// Day 4 — async
// -----------------------------------------------------------------------------
// sleep(ms): resolve a promise after `ms` milliseconds.
// This is the building block — `await sleep(x)` pauses an async fn without
// blocking the thread (setTimeout schedules the resolve; the event loop keeps going).

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Spec: awaiting sleep should pause execution ~the requested time, and code
// after the await runs only once the timer fires (ordering, not blocking).
async function demo() {
    console.log("start");
    const before = Date.now();

    await sleep(100);

    const elapsed = Date.now() - before;
    console.assert(elapsed >= 95, `sleep should pause ~100ms, waited ${elapsed}ms`);
    console.log(`resumed after ${elapsed}ms`);
}

// "resumed" logs AFTER the line below — proving sleep is non-blocking.
demo();
console.log("this runs before demo resumes (sleep is async, not blocking)");

// -----------------------------------------------------------------------------
// promisify(fn): turn an error-first callback API into one that returns a promise.
// The wrapped fn keeps its own args; we append our (err, result) callback.

function promisify(fn) {
    return function (...args) {
        return new Promise((resolve, reject) => {
            fn(...args, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    };
}

// -----------------------------------------------------------------------------
// retry(fn, retries): call an async fn; on rejection, try again up to `retries`
// extra times. Total attempts = 1 + retries. Throw the last error if all fail.

async function retry(fn, retries) {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
        }
    }
    throw lastError;
}

// -----------------------------------------------------------------------------
// MyPromise — the exit bar. A Promises/A+-flavoured implementation:
//   - three states: pending → fulfilled | rejected (transition once, then frozen)
//   - .then callbacks always fire asynchronously (queueMicrotask)
//   - resolving with a thenable adopts it (this is what makes chaining flatten)
//   - .then returns a NEW MyPromise so chains compose

class MyPromise {
    constructor(executor) {
        this.state = "pending";
        this.value = undefined;
        this.callbacks = []; // queued while pending: { onFulfilled, onRejected, resolve, reject }

        const resolve = (value) => {
            if (this.state !== "pending") return;
            // adopt any thenable (a MyPromise OR a native promise) instead of nesting it
            if (value && (typeof value === "object" || typeof value === "function") && typeof value.then === "function") {
                value.then(resolve, reject);
                return;
            }
            this.state = "fulfilled";
            this.value = value;
            this.callbacks.forEach((cb) => this._schedule(cb));
            this.callbacks = [];
        };

        const reject = (reason) => {
            if (this.state !== "pending") return;
            this.state = "rejected";
            this.value = reason;
            this.callbacks.forEach((cb) => this._schedule(cb));
            this.callbacks = [];
        };

        try {
            executor(resolve, reject);
        } catch (err) {
            reject(err);
        }
    }

    // run one queued callback on the microtask queue, forwarding the outcome
    // to the child promise this callback belongs to
    _schedule(cb) {
        queueMicrotask(() => {
            const handler = this.state === "fulfilled" ? cb.onFulfilled : cb.onRejected;
            if (typeof handler !== "function") {
                // no handler for this state → pass the value/reason straight through
                if (this.state === "fulfilled") cb.resolve(this.value);
                else cb.reject(this.value);
                return;
            }
            try {
                cb.resolve(handler(this.value)); // resolve adopts a returned thenable → chain flattens
            } catch (err) {
                cb.reject(err);
            }
        });
    }

    then(onFulfilled, onRejected) {
        return new MyPromise((resolve, reject) => {
            const cb = { onFulfilled, onRejected, resolve, reject };
            if (this.state === "pending") {
                this.callbacks.push(cb);
            } else {
                this._schedule(cb);
            }
        });
    }

    catch(onRejected) {
        return this.then(undefined, onRejected);
    }

    static resolve(value) {
        return new MyPromise((resolve) => resolve(value));
    }

    static reject(reason) {
        return new MyPromise((_, reject) => reject(reason));
    }
}

// -----------------------------------------------------------------------------
// myPromiseAll(promises): resolve to an array of results IN INPUT ORDER once all
// settle; reject as soon as any one rejects. Non-promise values pass through.

function myPromiseAll(promises) {
    return new MyPromise((resolve, reject) => {
        const results = [];
        let completed = 0;
        if (promises.length === 0) {
            resolve(results);
            return;
        }
        promises.forEach((p, i) => {
            MyPromise.resolve(p).then(
                (value) => {
                    results[i] = value; // index, not push → order is preserved
                    completed++;
                    if (completed === promises.length) resolve(results);
                },
                (reason) => reject(reason)
            );
        });
    });
}

// -----------------------------------------------------------------------------
// Specs. MyPromise is a thenable, so `await` drives it just like a native promise.

async function asyncSpecs() {
    // --- promisify ---
    const cbAdd = (a, b, cb) => setTimeout(() => cb(null, a + b), 5);
    const addAsync = promisify(cbAdd);
    console.assert((await addAsync(2, 3)) === 5, "promisify should resolve with the callback result");

    const cbFail = (cb) => setTimeout(() => cb(new Error("boom")), 5);
    const failAsync = promisify(cbFail);
    let promisifyRejected = false;
    try { await failAsync(); } catch (e) { promisifyRejected = e.message === "boom"; }
    console.assert(promisifyRejected, "promisify should reject on an error-first callback");

    // --- retry ---
    let attempts = 0;
    const flaky = () => { attempts++; return attempts < 3 ? Promise.reject(new Error("fail")) : Promise.resolve("ok"); };
    console.assert((await retry(flaky, 5)) === "ok", "retry should succeed once the fn stops failing");
    console.assert(attempts === 3, "retry should stop retrying after the first success");

    let doomedCalls = 0;
    const doomed = () => { doomedCalls++; return Promise.reject(new Error("nope")); };
    let retryThrew = false;
    try { await retry(doomed, 2); } catch (e) { retryThrew = true; }
    console.assert(retryThrew, "retry should throw after exhausting retries");
    console.assert(doomedCalls === 3, "retry(fn, 2) should attempt 1 + 2 = 3 times");

    // --- MyPromise: resolve / reject ---
    console.assert((await new MyPromise((res) => res(42))) === 42, "MyPromise should resolve with its value");
    let mpRejected = false;
    try { await new MyPromise((_, rej) => rej(new Error("x"))); } catch (e) { mpRejected = true; }
    console.assert(mpRejected, "MyPromise should reject");

    // --- MyPromise: chaining transforms the value ---
    const chained = await new MyPromise((res) => res(1))
        .then((v) => v + 1)
        .then((v) => v * 10);
    console.assert(chained === 20, "MyPromise .then should chain transformed values");

    // --- MyPromise: .catch recovers a rejection ---
    const recovered = await new MyPromise((_, rej) => rej("err")).catch(() => "recovered");
    console.assert(recovered === "recovered", "MyPromise .catch should recover a rejection");

    // --- MyPromise: a returned thenable is adopted (chain flattens, no nesting) ---
    const flattened = await new MyPromise((res) => res(1))
        .then((v) => new MyPromise((res) => res(v + 100)));
    console.assert(flattened === 101, "MyPromise should adopt a returned thenable");

    // --- MyPromise: callbacks are async (microtask), not synchronous ---
    let order = "";
    new MyPromise((res) => res()).then(() => { order += "B"; });
    order += "A";
    await Promise.resolve();
    console.assert(order === "AB", "MyPromise .then must fire asynchronously (A before B)");

    // --- myPromiseAll: order preserved despite differing timings ---
    const all = await myPromiseAll([
        MyPromise.resolve(1),
        new MyPromise((res) => setTimeout(() => res(2), 20)),
        3, // non-promise passes through
    ]);
    console.assert(JSON.stringify(all) === JSON.stringify([1, 2, 3]), "myPromiseAll should preserve input order");

    // --- myPromiseAll: rejects if any input rejects ---
    let allRejected = false;
    try {
        await myPromiseAll([MyPromise.resolve(1), MyPromise.reject(new Error("bad"))]);
    } catch (e) { allRejected = e.message === "bad"; }
    console.assert(allRejected, "myPromiseAll should reject if any promise rejects");

    console.log("day-04 async: all specs green");
}
asyncSpecs();
