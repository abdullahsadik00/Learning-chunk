// ═══════════════════════════════════════════════════════════════
// POLYFILLS 07: UTILITY FUNCTIONS
// Run: node 07-utilities.js
// ═══════════════════════════════════════════════════════════════
//
// Covered:
//   curry          — transform f(a,b,c) into f(a)(b)(c)
//   memoize        — cache results of pure functions
//   mySetInterval  — implement setInterval using setTimeout
//   compose / pipe — function composition
//   flattenObject  — deep key-path flattening
//   classNames     — conditional CSS class utility

// ───────────────────────────────────────────────────────────────
// 1. Curry
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Curry ===");

// Transform f(a, b, c) → f(a)(b)(c)
// If all required args are provided at once, execute immediately.
// Otherwise return a partial function that waits for more args.

function curry(fn) {
    var arity = fn.length; // number of declared parameters

    return function curried() {
        var args = Array.prototype.slice.call(arguments);

        if (args.length >= arity) {
            return fn.apply(this, args); // enough args → execute
        }

        return function() {
            var moreArgs = Array.prototype.slice.call(arguments);
            return curried.apply(this, args.concat(moreArgs));
        };
    };
}

function add3(a, b, c) { return a + b + c; }
var cAdd = curry(add3);

console.log(cAdd(1)(2)(3));    // 6 — one arg at a time
console.log(cAdd(1, 2)(3));    // 6 — two then one
console.log(cAdd(1)(2, 3));    // 6 — one then two
console.log(cAdd(1, 2, 3));    // 6 — all at once

// Partial application — specialize a generic function
var add10 = cAdd(10); // fixes first arg to 10
var add10and5 = add10(5); // fixes second arg to 5
console.log(add10and5(3));  // 18
console.log(add10and5(7));  // 22

// Real-world: curried validator
function validate(schema) {
    return function(field) {
        return function(value) {
            var rule = schema[field];
            if (!rule) { return true; }
            if (rule.required && !value) { return field + " is required"; }
            if (rule.min && value.length < rule.min) {
                return field + " must be at least " + rule.min + " chars";
            }
            return true;
        };
    };
}

var checkUser = validate({ name: { required: true, min: 2 }, email: { required: true } });
var checkName  = checkUser("name");
var checkEmail = checkUser("email");

console.log(checkName(""));      // "name is required"
console.log(checkName("S"));     // "name must be at least 2 chars"
console.log(checkName("Sadik")); // true
console.log(checkEmail(""));     // "email is required"

// Infinite curry: sum(1)(2)(3)() — call with no args to get result
function sum() {
    var args = Array.prototype.slice.call(arguments);

    return function next() {
        var newArgs = Array.prototype.slice.call(arguments);
        if (newArgs.length === 0) {
            return args.reduce(function(acc, n) { return acc + n; }, 0);
        }
        return sum.apply(null, args.concat(newArgs));
    };
}

console.log(sum(1)(2)(3)(4)()); // 10

// ───────────────────────────────────────────────────────────────
// 2. Memoize
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. Memoize ===");

// Cache the result of a PURE function for a given set of arguments.
// Same args → return cached result without re-executing.
// Only valid for pure functions (same input → same output, no side effects).

function memoize(fn) {
    var cache = new Map();

    var memoized = function() {
        var key = JSON.stringify(Array.prototype.slice.call(arguments));
        if (cache.has(key)) {
            return cache.get(key);
        }
        var result = fn.apply(this, arguments);
        cache.set(key, result);
        return result;
    };

    memoized.clear = function() { cache.clear(); };
    memoized.size  = function() { return cache.size; };

    return memoized;
}

// Fibonacci — exponential without memo, linear with memo
var computeCount = 0;
var memoFib = memoize(function fib(n) {
    computeCount++;
    if (n <= 1) { return n; }
    return memoFib(n - 1) + memoFib(n - 2);
});

console.log(memoFib(10));  // 55
console.log("computations for fib(10):", computeCount); // 11 (each value computed once)

computeCount = 0;
console.log(memoFib(10));  // 55 (from cache)
console.log("computations for cached fib(10):", computeCount); // 0

console.log(memoFib(12));  // 144 (only computes 11 and 12, rest cached)

// ───────────────────────────────────────────────────────────────
// 3. setInterval using setTimeout
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. mySetInterval ===");

// setInterval has a known issue: if the callback takes longer than
// the interval, callbacks pile up. Using setTimeout recursively
// ensures the next call doesn't start until the current one finishes.

function mySetInterval(callback, delay) {
    var id = { cleared: false, timerId: null };

    function loop() {
        if (!id.cleared) {
            callback();
            id.timerId = setTimeout(loop, delay);
        }
    }

    id.timerId = setTimeout(loop, delay);
    return id;
}

function myClearInterval(id) {
    id.cleared = true;
    clearTimeout(id.timerId);
}

// Test: tick 5 times then stop
var tickCount = 0;
var intervalId = mySetInterval(function() {
    tickCount++;
    process.stdout.write("tick-" + tickCount + " ");
    if (tickCount >= 5) {
        myClearInterval(intervalId);
        console.log("\nstopped after 5 ticks");
    }
}, 50);

// ───────────────────────────────────────────────────────────────
// 4. Compose & Pipe
// ───────────────────────────────────────────────────────────────

setTimeout(function() {
    console.log("\n=== 4. Compose & Pipe ===");

    // compose: applies functions RIGHT → LEFT (mathematical notation)
    // pipe:    applies functions LEFT  → RIGHT (more readable for pipelines)
    //
    // compose(f, g, h)(x) = f(g(h(x)))
    // pipe(f, g, h)(x)    = h(g(f(x)))

    function compose() {
        var fns = Array.prototype.slice.call(arguments);
        return function(x) {
            return fns.reduceRight(function(acc, fn) { return fn(acc); }, x);
        };
    }

    function pipe() {
        var fns = Array.prototype.slice.call(arguments);
        return function(x) {
            return fns.reduce(function(acc, fn) { return fn(acc); }, x);
        };
    }

    function double(x)    { return x * 2; }
    function addTen(x)    { return x + 10; }
    function square(x)    { return x * x; }

    // Both produce the same result when written in reverse order
    var via_compose = compose(square, addTen, double); // right-to-left: double → addTen → square
    var via_pipe    = pipe(double, addTen, square);    // left-to-right: double → addTen → square

    console.log(via_compose(5)); // double(5)=10 → addTen(10)=20 → square(20)=400
    console.log(via_pipe(5));    // 400

    // Data processing pipeline:
    var orders = [
        { product: "Laptop", price: 1000, qty: 2, active: true },
        { product: "Phone",  price: 500,  qty: 1, active: false },
        { product: "Tablet", price: 300,  qty: 3, active: true },
    ];

    var processOrders = pipe(
        function(os) { return os.filter(function(o) { return o.active; }); },
        function(os) { return os.map(function(o) { return Object.assign({}, o, { tax: o.price * 0.18 }); }); },
        function(os) { return os.map(function(o) { return o.product + ": ₹" + (o.price + o.tax); }); }
    );

    console.log(processOrders(orders));

    // Async pipe: each step returns a Promise
    function asyncPipe() {
        var fns = Array.prototype.slice.call(arguments);
        return function(x) {
            return fns.reduce(function(promise, fn) {
                return promise.then(fn);
            }, Promise.resolve(x));
        };
    }

    var asyncTransform = asyncPipe(
        function(x) { return Promise.resolve(x * 2); },
        function(x) { return Promise.resolve(x + 10); },
        function(x) { return Promise.resolve(x * x); }
    );

    asyncTransform(5).then(function(result) {
        console.log("asyncPipe(5):", result); // 400
    });

}, 350); // after mySetInterval test

// ───────────────────────────────────────────────────────────────
// 5. Flatten Object
// ───────────────────────────────────────────────────────────────

setTimeout(function() {
    console.log("\n=== 5. flattenObject / unflattenObject ===");

    // flattenObject: converts nested object to dot-notation keys
    //   { a: { b: { c: 1 } } } → { "a.b.c": 1 }

    function flattenObject(obj, prefix, result) {
        if (prefix === undefined) { prefix = ""; }
        if (result === undefined) { result = {}; }

        var keys = Object.keys(obj);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var fullKey = prefix ? prefix + "." + key : key;
            var val = obj[key];

            if (val !== null && typeof val === "object" && !Array.isArray(val)) {
                flattenObject(val, fullKey, result);
            } else {
                result[fullKey] = val;
            }
        }
        return result;
    }

    // unflattenObject: reverses flattenObject
    function unflattenObject(obj) {
        var result = {};
        var keys = Object.keys(obj);
        for (var i = 0; i < keys.length; i++) {
            var parts = keys[i].split(".");
            var current = result;
            for (var j = 0; j < parts.length; j++) {
                if (j === parts.length - 1) {
                    current[parts[j]] = obj[keys[i]];
                } else {
                    if (!current[parts[j]]) { current[parts[j]] = {}; }
                    current = current[parts[j]];
                }
            }
        }
        return result;
    }

    var nested = {
        a: { b: { c: 1, d: 2 }, e: 3 },
        f: 4,
        g: { h: 5, arr: [1, 2, 3] },
    };

    var flattened = flattenObject(nested);
    console.log(flattened);
    // { "a.b.c": 1, "a.b.d": 2, "a.e": 3, "f": 4, "g.h": 5, "g.arr": [1,2,3] }

    var unflattened = unflattenObject({ "a.b.c": 1, "a.b.d": 2, "a.e": 3 });
    console.log(JSON.stringify(unflattened)); // {"a":{"b":{"c":1,"d":2},"e":3}}

    // Round-trip
    var roundTrip = unflattenObject(flattenObject({ x: { y: 42 } }));
    console.log(roundTrip.x.y); // 42

}, 500);

// ───────────────────────────────────────────────────────────────
// 6. classNames utility
// ───────────────────────────────────────────────────────────────

setTimeout(function() {
    console.log("\n=== 6. classNames ===");

    // Joins class names conditionally.
    // Accepts: strings, numbers, arrays, objects { className: boolean }
    // Falsy values are ignored.

    function classNames() {
        var classes = [];

        for (var i = 0; i < arguments.length; i++) {
            var arg = arguments[i];
            if (!arg) { continue; }

            var type = typeof arg;

            if (type === "string" || type === "number") {
                classes.push(arg);
            } else if (Array.isArray(arg)) {
                var inner = classNames.apply(null, arg);
                if (inner) { classes.push(inner); }
            } else if (type === "object") {
                var keys = Object.keys(arg);
                for (var j = 0; j < keys.length; j++) {
                    if (arg[keys[j]]) { classes.push(keys[j]); }
                }
            }
        }

        return classes.join(" ");
    }

    console.log(classNames("btn", "btn-primary"));
    // "btn btn-primary"

    console.log(classNames("btn", { "btn-active": true, "btn-disabled": false }));
    // "btn btn-active"

    console.log(classNames("btn", ["extra", { special: true }]));
    // "btn extra special"

    console.log(classNames(null, undefined, false, "valid", 0, ""));
    // "valid" — falsy values skipped

    console.log(classNames("a", "b", { c: true, d: false }, ["e", { f: true }]));
    // "a b c e f"

    // Practical React usage:
    //   <button className={classNames("btn", { active: isActive, disabled: isLoading })}>
    //     Submit
    //   </button>

}, 700);

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

setTimeout(function() {
    console.log("\n=== Practice ===");

    // Q1: curry — what does curry(fn)(1)(2) return if fn needs 3 args?
    var q1fn = curry(function(a, b, c) { return a + b + c; });
    var partial = q1fn(1)(2); // only 2 of 3 args provided
    console.log("Q1 type:", typeof partial); // "function" — waiting for 3rd arg
    console.log("Q1 call:", partial(3));     // 6

    // Q2: memoize — is it safe on impure functions?
    var counter = 0;
    var memoImpure = memoize(function(x) { counter++; return x + counter; });
    console.log("Q2 first:", memoImpure(5));  // 6 (x=5, counter=1)
    console.log("Q2 second:", memoImpure(5)); // 6 (from cache — counter NOT incremented)
    // Answer: NO — memoize is only safe on pure functions.
    // With impure functions, the cached result may be stale.

    // Q3: pipe vs compose argument order
    function inc(x) { return x + 1; }
    function dbl(x) { return x * 2; }
    var viaCompose = (function() {
        var fns = [dbl, inc]; // right-to-left: inc(5)=6, dbl(6)=12
        return function(x) { return fns.reduceRight(function(acc, fn) { return fn(acc); }, x); };
    })();
    var viaPipe = (function() {
        var fns = [inc, dbl]; // left-to-right: inc(5)=6, dbl(6)=12
        return function(x) { return fns.reduce(function(acc, fn) { return fn(acc); }, x); };
    })();
    console.log("Q3 compose:", viaCompose(5)); // 12
    console.log("Q3 pipe:",    viaPipe(5));    // 12 — same result, different arg order

}, 900);
