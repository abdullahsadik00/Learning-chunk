// ═══════════════════════════════════════════════════════════════
// MODULE 10: MEMORY MANAGEMENT & GARBAGE COLLECTION
// Run: node 10-memory-management.js
// ═══════════════════════════════════════════════════════════════
//
// JS manages memory automatically — but understanding it helps
// you write code that doesn't leak, and debug when it does.
//
// TWO memory regions:
//   Stack → primitives + references. Fast, limited, auto-managed.
//   Heap  → objects, arrays, functions. Large, garbage-collected.
//
// GARBAGE COLLECTOR (Mark-and-Sweep):
//   1. MARK phase: start from "roots" (global, call stack),
//      follow all references, mark everything reachable.
//   2. SWEEP phase: any object NOT marked → free memory.
//   An object is collected when no reference chain from any
//   root leads to it.

// ───────────────────────────────────────────────────────────────
// 1. STACK vs HEAP — primitives vs objects
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Stack vs Heap ===");

// PRIMITIVES — copied by value (live on the stack):
let n1 = 42;
let n2 = n1;   // n2 gets a COPY of the value
n2 = 99;
console.log(n1, n2); // 42 99 — independent

// OBJECTS — copied by reference (object lives on heap, reference on stack):
const obj1 = { val: 1 };
const obj2 = obj1;    // obj2 holds the SAME reference
obj2.val = 999;
console.log(obj1.val, obj2.val); // 999 999 — same heap object

// To get an independent copy:
const obj3 = { ...obj1 };   // shallow clone
obj3.val = 777;
console.log(obj1.val, obj3.val); // 999 777 — independent

// ───────────────────────────────────────────────────────────────
// 2. WHEN OBJECTS BECOME GARBAGE
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. Reachability ===");

let data = { secret: "abc123" }; // object on heap, `data` variable on stack
data = null; // stack variable cleared → heap object is now unreachable → GC can collect it

// Circular references are handled correctly by mark-and-sweep:
function circularDemo() {
    const a = {};
    const b = {};
    a.other = b;   // a → b
    b.other = a;   // b → a (circular!)
    // When circularDemo() returns, local variables a and b go out of scope.
    // No root points to either — both are garbage, despite the circular reference.
}
circularDemo();
console.log("Circular references handled — no leak.");

// ───────────────────────────────────────────────────────────────
// 3. LEAK 1 — Accidental global variables
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. Leak: Accidental Globals ===");

function leaky() {
    // forgetting var/let/const creates a global in non-strict mode:
    // accidentalGlobal = "I live forever";
    // The fix: strict mode throws ReferenceError instead.
}

function safe() {
    "use strict";
    try {
        // accidentalGlobal = "this throws";
    } catch (e) {
        // ReferenceError caught — good
    }
    const local = "properly scoped"; // no leak
    void local;
}

leaky();
safe();
console.log("Use 'use strict' or always declare with let/const.");

// ───────────────────────────────────────────────────────────────
// 4. LEAK 2 — Forgotten timers
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. Leak: Forgotten Timers ===");

// ❌ BAD: interval holds a reference to `bigData` forever
function badTimer() {
    const bigData = new Array(100).fill("x"); // imagine this is huge
    return setInterval(() => {
        // bigData is captured in the closure — stays in memory forever
        void bigData.length; // using it so engine doesn't optimize away
    }, 100);
}

// ✅ FIX: clear the interval when done, null out data
function goodTimer() {
    let bigData = new Array(100).fill("x");
    const id = setInterval(() => {
        void bigData?.length;
    }, 100);

    // When work is done:
    function cleanup() {
        clearInterval(id);
        bigData = null; // release reference
        console.log("  Timer cleared, data released");
    }

    return cleanup;
}

const cancel = goodTimer();
setTimeout(cancel, 20); // clean up after 20ms

// ───────────────────────────────────────────────────────────────
// 5. LEAK 3 — Closures capturing large data unnecessarily
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Leak: Closures + Large Data ===");

// ❌ BAD: closure captures the entire array even though only .length is needed
function badClosure() {
    const hugeArray = new Array(100000).fill("x");
    return () => hugeArray.length; // entire array kept alive
}

// ✅ FIX: extract only what's needed
function goodClosure() {
    const hugeArray = new Array(100000).fill("x");
    const len = hugeArray.length; // extract the primitive
    // hugeArray can now be GC'd after goodClosure returns
    return () => len;
}

const badFn = badClosure();
const goodFn = goodClosure();
console.log("both return:", badFn(), goodFn()); // 100000 100000
// goodFn keeps only a number in memory, badFn keeps 100k items

// ───────────────────────────────────────────────────────────────
// 6. LEAK 4 — Event listeners not removed (Node.js EventEmitter demo)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. Leak: Event Listeners ===");

const { EventEmitter } = require("events");
const emitter = new EventEmitter();

function createHandler(id) {
    const handlerData = { id, payload: new Array(1000).fill(id) };
    return function handler() {
        void handlerData.id; // uses the closure data
    };
}

// ❌ BAD: add many listeners and never remove them
const leaked = createHandler("leaked");
emitter.on("click", leaked);
// leaked is referenced by emitter → handlerData never GC'd

// ✅ FIX: remove when no longer needed
const managed = createHandler("managed");
emitter.on("click", managed);
emitter.emit("click"); // use it
emitter.off("click", managed); // remove → handler eligible for GC
console.log("managed handler removed");

// Also: emitter.once() auto-removes after first event.
emitter.once("done", () => console.log("once-listener fires once, then removed"));
emitter.emit("done");
emitter.emit("done"); // second emit — listener already gone

// ───────────────────────────────────────────────────────────────
// 7. WeakMap & WeakSet — GC-friendly caches
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. WeakMap / WeakSet ===");

// Regular Map holds STRONG references — object won't be GC'd:
const strongMap = new Map();
let key1 = { id: 1 };
strongMap.set(key1, "data");
key1 = null; // but the map still holds a reference!
console.log("strongMap size:", strongMap.size); // 1 — not collected

// WeakMap holds WEAK references — object CAN be GC'd:
const weakCache = new WeakMap();
let key2 = { id: 2 };
weakCache.set(key2, "cached data");
key2 = null; // no strong reference left — eligible for GC
// weakCache.size → property doesn't exist (WeakMap is not iterable)
console.log("weakMap has key2:", weakCache.has({ id: 2 })); // false — different object
console.log("(key2 object can now be garbage collected)");

// WeakMap rules:
//   Keys must be OBJECTS (not primitives)
//   Not iterable (no .size, no .forEach, no .keys())
//   Perfect for: metadata, caching, private class data

// ───────────────────────────────────────────────────────────────
// 8. PRACTICAL: WeakMap for private class data
// ───────────────────────────────────────────────────────────────

console.log("\n=== 8. WeakMap for private data ===");

const _private = new WeakMap();

class BankAccount {
    constructor(owner, balance) {
        this.owner = owner;
        _private.set(this, { balance, pin: "1234" }); // truly private
    }

    deposit(amount) {
        const data = _private.get(this);
        data.balance += amount;
        return `Deposited. Balance: ${data.balance}`;
    }

    checkBalance(pin) {
        const data = _private.get(this);
        if (pin !== data.pin) return "Wrong PIN";
        return `Balance: ${data.balance}`;
    }
}

const acct = new BankAccount("Sadik", 1000);
console.log(acct.deposit(500));        // Deposited. Balance: 1500
console.log(acct.checkBalance("1234")); // Balance: 1500
console.log(acct.checkBalance("0000")); // Wrong PIN
console.log(acct.balance);             // undefined — truly private!

// When `acct` is set to null, the WeakMap entry is eligible for GC too.

// ───────────────────────────────────────────────────────────────
// 9. MEMORY USAGE in Node.js
// ───────────────────────────────────────────────────────────────

console.log("\n=== 9. Checking Memory Usage ===");

const mem = process.memoryUsage();
console.log("heapUsed: ", Math.round(mem.heapUsed / 1024 / 1024), "MB");
console.log("heapTotal:", Math.round(mem.heapTotal / 1024 / 1024), "MB");
console.log("rss:      ", Math.round(mem.rss / 1024 / 1024), "MB");

// In production tools to detect leaks:
//   - Node.js --inspect + Chrome DevTools Memory panel
//   - clinic.js (npm)
//   - heapdump package
//   - Datadog / New Relic APM

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice ===");

// Q1: Will obj1 be garbage collected?
let obj1Ref = { name: "test" };
let obj1Alias = obj1Ref;
obj1Ref = null;
// Answer: NO — obj1Alias still holds a reference.
// GC happens only when ALL references are gone.
obj1Alias = null; // NOW it can be collected
console.log("Q1: both references cleared");

// Q2: WeakMap vs Map for cache — which allows GC?
const regMap = new Map();
const weakMap2 = new WeakMap();
let tmpKey = { id: "tmp" };
regMap.set(tmpKey, "reg-data");
weakMap2.set(tmpKey, "weak-data");
tmpKey = null;
console.log("Q2: regMap size:", regMap.size);      // 1 — prevents GC
// weakMap2 does not prevent GC of the key object

// Q3: Which function creates a memory leak?
function q3A() {
    const x = new Array(1000);
    return () => x.length; // closes over entire array
}
function q3B() {
    const x = new Array(1000);
    const len = x.length;  // extracts primitive
    return () => len;      // closes over number only
}
// Answer: q3A creates a larger closure (holds array in memory).
// q3B is more memory-efficient (holds only a number).
const fa = q3A(); const fb = q3B();
console.log("Q3:", fa(), fb()); // 1000 1000 — same result, different memory use
