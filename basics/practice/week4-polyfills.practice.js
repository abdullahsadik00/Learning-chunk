// ═══════════════════════════════════════════════════════════════
// PRACTICE: POLYFILLS FROM SCRATCH
// Run: node week4-polyfills.practice.js
//
// THIS IS THE HARDEST FILE.
// Implement each polyfill from memory. Do NOT look at week-4/.
// Read the contract carefully — the test cases define exact behaviour.
// ═══════════════════════════════════════════════════════════════

function check(label, got, expected) {
    const pass = JSON.stringify(got) === JSON.stringify(expected);
    console.log(pass
        ? `✅  ${label}`
        : `❌  ${label}\n    got:      ${JSON.stringify(got)}\n    expected: ${JSON.stringify(expected)}`
    );
}

// ─── 1. Array.prototype.myMap ────────────────────────────────
console.log("\n── 1. myMap ──");
//
// Contract:
//   - Returns a NEW array of the same length
//   - Calls callback(element, index, originalArray) for each element
//   - Supports optional thisArg as second argument
//   - Does NOT modify the original array
//   - Throws TypeError if callback is not a function
//   - Skips empty slots in sparse arrays (use "i in arr")

Array.prototype.myMap = function(callback, thisArg) {
    if (typeof callback !== "function") throw new TypeError(callback + " is not a function");
    // YOUR CODE — replace the stub below
    return new Array(this.length); // stub: right length, wrong values
};

const nums = [1, 2, 3, 4, 5];
check("doubles",             nums.myMap(n => n * 2),      [2, 4, 6, 8, 10]);
check("squares",             nums.myMap(n => n * n),      [1, 4, 9, 16, 25]);
check("original unchanged",  nums,                        [1, 2, 3, 4, 5]);
check("index passed",        [10, 20].myMap((v, i) => i), [0, 1]);
// eslint-disable-next-line no-sparse-arrays
const sparse = [1, , 3];
check("sparse array length", sparse.myMap(x => x * 2).length, 3);
try { nums.myMap("not a fn"); console.log("❌  should throw"); }
catch(e) { check("throws TypeError", e instanceof TypeError, true); }

// ─── 2. Array.prototype.myFilter ────────────────────────────
console.log("\n── 2. myFilter ──");
//
// Contract:
//   - Returns a NEW array containing only elements for which callback returns truthy
//   - Callback receives (element, index, originalArray)
//   - Does NOT modify the original array
//   - Supports optional thisArg

Array.prototype.myFilter = function(callback, thisArg) {
    if (typeof callback !== "function") throw new TypeError(callback + " is not a function");
    // YOUR CODE — replace the stub below
    return []; // stub
};

check("evens",          [1,2,3,4,5].myFilter(n => n % 2 === 0), [2, 4]);
check("greater than 3", [1,2,3,4,5].myFilter(n => n > 3),       [4, 5]);
check("empty result",   [1,2,3].myFilter(n => n > 10),           []);
check("all pass",       [1,2,3].myFilter(n => n > 0),            [1,2,3]);
check("original unchanged", nums, [1, 2, 3, 4, 5]);

// ─── 3. Array.prototype.myReduce ────────────────────────────
console.log("\n── 3. myReduce ──");
//
// Contract:
//   - Reduces array to a single value using callback(accumulator, current, index, array)
//   - If initialValue is provided, acc starts as initialValue and loop starts at index 0
//   - If NO initialValue, acc starts as arr[0] and loop starts at index 1
//   - Throws TypeError on empty array with no initialValue

Array.prototype.myReduce = function(callback, initialValue) {
    if (this.length === 0 && arguments.length < 2) throw new TypeError("Reduce of empty array with no initial value");
    // YOUR CODE — replace the stub below
    // Hint: check arguments.length to detect missing initialValue
    return initialValue; // stub
};

check("sum with initial",   [1,2,3,4,5].myReduce((a, n) => a + n, 0),   15);
check("sum without initial",[1,2,3,4,5].myReduce((a, n) => a + n),      15);
check("product",            [1,2,3,4].myReduce((a, n) => a * n, 1),     24);
check("max",                [3,1,4,1,5,9].myReduce((m,n) => n > m ? n : m), 9);
check("build object",
    ["a","b","a","c","b","a"].myReduce((acc, ch) => {
        acc[ch] = (acc[ch] || 0) + 1; return acc;
    }, {}),
    { a: 3, b: 2, c: 1 }
);
try { [].myReduce((a,b) => a+b); console.log("❌  should throw"); }
catch(e) { check("empty array no init throws", e instanceof TypeError, true); }

// ─── 4. Function.prototype.myBind ───────────────────────────
console.log("\n── 4. myBind ──");
//
// Contract:
//   - Returns a NEW function with `this` permanently set to context
//   - Pre-fills any args passed to myBind (partial application)
//   - The returned function can receive additional args at call time
//   - When invoked with `new`, `new` wins (this becomes the new object)

Function.prototype.myBind = function(context, ...outerArgs) {
    // YOUR CODE — replace the stub below
    const fn = this;
    return function(...innerArgs) { return fn.apply(context, []); }; // stub: wrong args
};

function greet(greeting, punct) {
    return `${greeting}, ${this.name}${punct}`;
}

const sayHi   = greet.myBind({ name: "Sadik" }, "Hello");
check("pre-filled arg",        sayHi("!"),  "Hello, Sadik!");
check("different second arg",  sayHi("?"),  "Hello, Sadik?");
check("no pre-fill",           greet.myBind({ name: "Priya" })("Hi", "."), "Hi, Priya.");

// ─── 5. debounce ─────────────────────────────────────────────
console.log("\n── 5. debounce ──");
//
// Contract:
//   - debounce(fn, delay) returns a wrapped function
//   - If the wrapped function is called multiple times rapidly,
//     fn fires only ONCE, after `delay` ms of silence
//   - Each new call resets the timer

function debounce(fn, delay) {
    // YOUR CODE — replace the stub below
    // Hint: use a closure to hold `timer`, clearTimeout + setTimeout
    return function(...args) { fn(...args); }; // stub: no delay, always fires
}

let fireCount = 0;
const debouncedFn = debounce(() => fireCount++, 100);

// Rapid calls — should trigger only once after 100ms silence
debouncedFn();
debouncedFn();
debouncedFn();

setTimeout(() => {
    check("fires only once after rapid calls", fireCount, 1);
}, 250);

// Second burst after silence — should fire again
setTimeout(() => {
    debouncedFn();
    debouncedFn();
}, 350);

setTimeout(() => {
    check("fires once more after second burst", fireCount, 2);
}, 600);

// ─── 6. memoize ──────────────────────────────────────────────
setTimeout(() => {
    console.log("\n── 6. memoize ──");
    //
    // Contract:
    //   - memoize(fn) returns a wrapped version of fn
    //   - First call with given args: calls fn, caches and returns result
    //   - Subsequent calls with same args: returns cached result WITHOUT calling fn
    //   - Use JSON.stringify(args) as cache key

    function memoize(fn) {
        // YOUR CODE — replace the stub below
        return function(...args) { return fn(...args); }; // stub: no caching
    }

    let calls = 0;
    function slowFib(n) {
        calls++;
        if (n <= 1) return n;
        return slowFib(n - 1) + slowFib(n - 2);
    }

    // Basic memoize:
    calls = 0;
    const fastFib = memoize(function fib(n) {
        calls++;
        if (n <= 1) return n;
        return fastFib(n - 1) + fastFib(n - 2);
    });

    check("fib(10) correct",  fastFib(10), 55);
    const callsAfterFirst = calls;
    fastFib(10);  // second call — should use cache
    check("cache hit on second call", calls, callsAfterFirst);  // no new calls
    check("fib(6) correct",   fastFib(6), 8);
}, 700);

// ─── 7. EventEmitter (bonus — harder) ───────────────────────
setTimeout(() => {
    console.log("\n── 7. EventEmitter (bonus) ──");
    //
    // Contract:
    //   - on(event, listener)  → subscribe
    //   - off(event, listener) → unsubscribe
    //   - emit(event, ...args) → call all listeners with args
    //   - once(event, listener)→ subscribe but auto-remove after first call

    class EventEmitter {
        constructor() {
            // YOUR CODE — initialise listeners store
        }

        on(event, listener) {
            // YOUR CODE
        }

        off(event, listener) {
            // YOUR CODE
        }

        emit(event, ...args) {
            // YOUR CODE
        }

        once(event, listener) {
            // YOUR CODE
            // Hint: wrap listener in a one-shot wrapper that calls off after firing
        }
    }

    const emitter = new EventEmitter();
    const received = [];

    const handler = (val) => received.push(val);
    emitter.on("data", handler);
    emitter.emit("data", 1);
    emitter.emit("data", 2);
    emitter.off("data", handler);
    emitter.emit("data", 3);   // should NOT be received

    check("on/off/emit", received, [1, 2]);

    const onceReceived = [];
    emitter.once("ping", v => onceReceived.push(v));
    emitter.emit("ping", "first");
    emitter.emit("ping", "second");  // should NOT fire
    check("once fires only once", onceReceived, ["first"]);
}, 900);

setTimeout(() => {}, 1200); // keep process alive
