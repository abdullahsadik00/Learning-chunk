// ═══════════════════════════════════════════════════════════════
// POLYFILLS 03: PROMISE FROM SCRATCH
// Run: node 03-promise-polyfills.js
// ═══════════════════════════════════════════════════════════════
//
// NOTE: This implementation uses setTimeout (macrotask) to
// simulate async callbacks. Real Promises use microtasks
// (queueMicrotask). The behavior is equivalent for learning
// purposes but ordering differs from the native Promise.
//
// THREE STATES:
//   pending   → initial, can transition to fulfilled or rejected
//   fulfilled → resolved with a value (immutable)
//   rejected  → rejected with a reason (immutable)

// ───────────────────────────────────────────────────────────────
// 1. MyPromise core
// ───────────────────────────────────────────────────────────────

console.log("=== 1. MyPromise core ===");

function MyPromise(executor) {
    var self = this;
    self.state = "pending";
    self.value = undefined;
    self.reason = undefined;
    self.onFulfilledCallbacks = [];
    self.onRejectedCallbacks  = [];

    function resolve(value) {
        if (self.state === "pending") {
            self.state = "fulfilled";
            self.value = value;
            self.onFulfilledCallbacks.forEach(function(fn) { fn(self.value); });
        }
    }

    function reject(reason) {
        if (self.state === "pending") {
            self.state = "rejected";
            self.reason = reason;
            self.onRejectedCallbacks.forEach(function(fn) { fn(self.reason); });
        }
    }

    try {
        executor(resolve, reject);
    } catch (err) {
        reject(err);
    }
}

// .then() returns a new Promise so chains are possible
MyPromise.prototype.then = function(onFulfilled, onRejected) {
    var self = this;

    // Default pass-through handlers
    onFulfilled = typeof onFulfilled === "function" ? onFulfilled : function(v) { return v; };
    onRejected  = typeof onRejected  === "function" ? onRejected  : function(r) { throw r; };

    var promise2 = new MyPromise(function(resolve, reject) {
        function handleFulfilled(value) {
            setTimeout(function() {
                try {
                    var result = onFulfilled(value);
                    resolvePromise(promise2, result, resolve, reject);
                } catch (err) {
                    reject(err);
                }
            }, 0);
        }

        function handleRejected(reason) {
            setTimeout(function() {
                try {
                    var result = onRejected(reason);
                    resolvePromise(promise2, result, resolve, reject);
                } catch (err) {
                    reject(err);
                }
            }, 0);
        }

        if (self.state === "fulfilled") {
            handleFulfilled(self.value);
        } else if (self.state === "rejected") {
            handleRejected(self.reason);
        } else {
            // Still pending — store callbacks for later
            self.onFulfilledCallbacks.push(handleFulfilled);
            self.onRejectedCallbacks.push(handleRejected);
        }
    });

    return promise2;
};

function resolvePromise(promise2, result, resolve, reject) {
    // Prevent circular chain: promise.then(() => promise)
    if (promise2 === result) {
        return reject(new TypeError("Chaining cycle detected"));
    }
    if (result instanceof MyPromise) {
        result.then(resolve, reject);
    } else {
        resolve(result);
    }
}

MyPromise.prototype.catch = function(onRejected) {
    return this.then(null, onRejected);
};

MyPromise.prototype.finally = function(callback) {
    return this.then(
        function(value) { callback(); return value; },
        function(reason) { callback(); throw reason; }
    );
};

MyPromise.resolve = function(value) {
    if (value instanceof MyPromise) { return value; } // already a MyPromise — return as-is
    return new MyPromise(function(resolve) { resolve(value); });
};

MyPromise.reject = function(reason) {
    return new MyPromise(function(resolve, reject) { reject(reason); });
};

// Test 1 — async resolve
var p1 = new MyPromise(function(resolve) {
    setTimeout(function() { resolve("async value"); }, 10);
});
p1.then(function(v) { console.log("async:", v); }); // "async: async value"

// Test 2 — executor throws (caught by the try/catch in the constructor)
var p2 = new MyPromise(function() {
    throw new Error("executor error");
});
p2.catch(function(e) { console.log("threw:", e.message); }); // "threw: executor error"

// Test 3 — chaining
MyPromise.resolve(1)
    .then(function(v) { return v + 1; })
    .then(function(v) { return v * 3; })
    .then(function(v) { console.log("chain:", v); }); // "chain: 6"

// Test 4 — .finally()
MyPromise.resolve("ok")
    .finally(function() { console.log("finally ran"); })
    .then(function(v) { console.log("after finally:", v); }); // value passes through

// ───────────────────────────────────────────────────────────────
// 2. Promise.all  — all must succeed
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. MyPromise.all ===");

MyPromise.all = function(promises) {
    return new MyPromise(function(resolve, reject) {
        if (!Array.isArray(promises)) {
            return reject(new TypeError("Argument must be an array"));
        }

        var results = [];
        var completed = 0;
        var total = promises.length;

        if (total === 0) { return resolve([]); }

        promises.forEach(function(promise, index) {
            MyPromise.resolve(promise).then(
                function(value) {
                    results[index] = value; // preserve order, not arrival order
                    completed++;
                    if (completed === total) { resolve(results); }
                },
                function(reason) {
                    reject(reason); // reject immediately on first failure
                }
            );
        });
    });
};

MyPromise.all([
    MyPromise.resolve(1),
    MyPromise.resolve(2),
    MyPromise.resolve(3),
]).then(function(v) { console.log("all:", v); }); // [1, 2, 3]

MyPromise.all([
    MyPromise.resolve(1),
    MyPromise.reject("boom"),
    MyPromise.resolve(3),
]).catch(function(e) { console.log("all failed:", e); }); // "boom"

// ───────────────────────────────────────────────────────────────
// 3. Promise.allSettled  — never rejects; reports all outcomes
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. MyPromise.allSettled ===");

MyPromise.allSettled = function(promises) {
    return new MyPromise(function(resolve) {
        if (!Array.isArray(promises)) { return resolve([]); }

        var results = [];
        var completed = 0;
        var total = promises.length;

        if (total === 0) { return resolve([]); }

        promises.forEach(function(promise, index) {
            MyPromise.resolve(promise).then(
                function(value) {
                    results[index] = { status: "fulfilled", value: value };
                    completed++;
                    if (completed === total) { resolve(results); }
                },
                function(reason) {
                    results[index] = { status: "rejected", reason: reason };
                    completed++;
                    if (completed === total) { resolve(results); }
                }
            );
        });
    });
};

MyPromise.allSettled([
    MyPromise.resolve("ok"),
    MyPromise.reject("fail"),
    MyPromise.resolve("also ok"),
]).then(function(results) {
    results.forEach(function(r) {
        if (r.status === "fulfilled") {
            console.log("  fulfilled:", r.value);
        } else {
            console.log("  rejected: ", r.reason);
        }
    });
});

// ───────────────────────────────────────────────────────────────
// 4. Promise.race  — first to SETTLE wins
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. MyPromise.race ===");

MyPromise.race = function(promises) {
    return new MyPromise(function(resolve, reject) {
        if (!Array.isArray(promises)) {
            return reject(new TypeError("Argument must be an array"));
        }
        promises.forEach(function(promise) {
            MyPromise.resolve(promise).then(resolve, reject);
        });
    });
};

MyPromise.race([
    new MyPromise(function(resolve) { setTimeout(function() { resolve("slow"); }, 100); }),
    new MyPromise(function(resolve) { setTimeout(function() { resolve("fast"); }, 30); }),
]).then(function(winner) { console.log("race winner:", winner); }); // "fast"

// ───────────────────────────────────────────────────────────────
// 5. Promise.any  — first to RESOLVE wins; rejects only if ALL reject
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. MyPromise.any ===");

MyPromise.any = function(promises) {
    return new MyPromise(function(resolve, reject) {
        if (!Array.isArray(promises)) {
            return reject(new TypeError("Argument must be an array"));
        }

        var errors = [];
        var rejectedCount = 0;
        var total = promises.length;

        if (total === 0) { return reject(new Error("All promises were rejected")); }

        promises.forEach(function(promise, index) {
            MyPromise.resolve(promise).then(
                function(value) {
                    resolve(value); // first success wins
                },
                function(error) {
                    errors[index] = error;
                    rejectedCount++;
                    if (rejectedCount === total) {
                        reject(new Error("All promises were rejected"));
                    }
                }
            );
        });
    });
};

MyPromise.any([
    MyPromise.reject("err1"),
    MyPromise.resolve("winner"),
    MyPromise.reject("err2"),
]).then(function(v) { console.log("any:", v); }); // "winner"

MyPromise.any([
    MyPromise.reject("a"),
    MyPromise.reject("b"),
]).catch(function(e) { console.log("any all failed:", e.message); }); // "All promises were rejected"

// ───────────────────────────────────────────────────────────────
// COMPARISON
// ───────────────────────────────────────────────────────────────

setTimeout(function() {
    console.log("\n=== Static Method Comparison ===");
    console.log([
        "all         → all resolve → [values]; one rejects → reject",
        "allSettled  → always resolves → [{status, value/reason}]",
        "race        → first to SETTLE (resolve OR reject) wins",
        "any         → first to RESOLVE wins; rejects only if ALL reject",
    ].join("\n"));
}, 300);

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

setTimeout(function() {
    console.log("\n=== Practice ===");

    // Q1: What does MyPromise.resolve(42).then(v => v) return?
    MyPromise.resolve(42)
        .then(function(v) { return v; })
        .then(function(v) { console.log("Q1:", v); }); // 42

    // Q2: Does allSettled ever reject?
    MyPromise.allSettled([MyPromise.reject("x"), MyPromise.reject("y")])
        .then(function(r) { console.log("Q2: allSettled resolved with", r.length, "results"); })
        .catch(function() { console.log("Q2: WRONG — allSettled should not reject"); });

    // Q3: race vs any on [reject, resolve]
    MyPromise.race([MyPromise.reject("r"), MyPromise.resolve("v")])
        .then(function(v) { console.log("Q3 race then:", v); })
        .catch(function(e) { console.log("Q3 race catch:", e); }); // depends on timing

    MyPromise.any([MyPromise.reject("r"), MyPromise.resolve("v")])
        .then(function(v) { console.log("Q3 any:", v); }); // "v" — any always picks first RESOLVE
}, 500);
