// ═══════════════════════════════════════════════════════════════
// MODULE 4: CLOSURES
// Run: node 03-closures.js
// ═══════════════════════════════════════════════════════════════
//
// A CLOSURE is a function that remembers the variables from its
// lexical scope even after the outer function has finished executing.
//
//   closure = function + its captured lexical environment
//
// Key facts:
//   - Closures capture variables by REFERENCE, not by value.
//   - Each call to the outer function creates a FRESH closure.
//   - Variables captured by a closure are NOT garbage-collected
//     as long as the closure lives.

// ───────────────────────────────────────────────────────────────
// 1. BASIC CLOSURE
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Basic Closure ===");

function createCounter() {
    let count = 0;         // private — not accessible from outside

    return function () {
        count++;
        return count;
    };
}

const counterA = createCounter();
const counterB = createCounter(); // completely independent closure

console.log(counterA()); // 1
console.log(counterA()); // 2
console.log(counterA()); // 3
console.log(counterB()); // 1  — counterB has its own `count`
console.log(counterA()); // 4  — counterA continues from where it left off

// ───────────────────────────────────────────────────────────────
// 2. CLOSURES CAPTURE BY REFERENCE
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. Capture by Reference ===");

function makeGreeter() {
    let who = "World";

    const greeter = () => console.log(`Hello, ${who}!`);

    who = "Sadik"; // modified AFTER greeter is created
    return greeter;
}

const greet = makeGreeter();
greet(); // "Hello, Sadik!" — sees the modified value, not "World"

// Closure holds a LIVE reference to the variable, not a snapshot.

// ───────────────────────────────────────────────────────────────
// 3. CLASSIC BUG — var in a loop
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. Classic var-in-loop Bug ===");

// BUG:
const buggyHandlers = [];
for (var i = 0; i < 3; i++) {
    buggyHandlers.push(() => i); // all capture the SAME i
}
console.log("Buggy:", buggyHandlers[0](), buggyHandlers[1](), buggyHandlers[2]());
// 3 3 3 — by the time these run, loop is done and i = 3

// FIX 1 — let (each iteration gets its own block-scoped i):
const fixedWithLet = [];
for (let k = 0; k < 3; k++) {
    fixedWithLet.push(() => k);
}
console.log("Fixed let:", fixedWithLet[0](), fixedWithLet[1](), fixedWithLet[2]());
// 0 1 2

// FIX 2 — IIFE to create a new scope per iteration:
const fixedWithIIFE = [];
for (var m = 0; m < 3; m++) {
    fixedWithIIFE.push((function (captured) {
        return () => captured;
    })(m));
}
console.log("Fixed IIFE:", fixedWithIIFE[0](), fixedWithIIFE[1](), fixedWithIIFE[2]());
// 0 1 2

// ───────────────────────────────────────────────────────────────
// 4. DATA PRIVACY (Module pattern)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. Data Privacy ===");

function createBankAccount(initialBalance) {
    let balance = initialBalance;
    const history = [];

    function record(type, amount) {
        history.push({ type, amount, balance });
    }

    return {
        deposit(amount) {
            if (amount <= 0) return "Invalid amount";
            balance += amount;
            record("deposit", amount);
            return `Deposited ₹${amount}. Balance: ₹${balance}`;
        },
        withdraw(amount) {
            if (amount <= 0 || amount > balance) return "Invalid / insufficient funds";
            balance -= amount;
            record("withdrawal", amount);
            return `Withdrew ₹${amount}. Balance: ₹${balance}`;
        },
        getBalance() { return balance; },
        getHistory() { return [...history]; }, // return copy, not original
    };
}

const account = createBankAccount(1000);
console.log(account.deposit(500));       // Deposited ₹500. Balance: ₹1500
console.log(account.withdraw(200));      // Withdrew ₹200. Balance: ₹1300
console.log(account.getBalance());       // 1300
console.log(account.balance);           // undefined — truly private
console.log(account.getHistory().length); // 2

// ───────────────────────────────────────────────────────────────
// 5. FUNCTION FACTORY
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Function Factory ===");

function createMultiplier(factor) {
    return (n) => n * factor;
}

const double = createMultiplier(2);
const triple = createMultiplier(3);
const times10 = createMultiplier(10);

console.log(double(5));   // 10
console.log(triple(5));   // 15
console.log(times10(7));  // 70

// Tax calculator factory
function createTaxCalc(rate, name) {
    return (amount) => ({
        name,
        amount,
        tax: +(amount * rate / 100).toFixed(2),
        total: +(amount * (1 + rate / 100)).toFixed(2),
    });
}

const gst = createTaxCalc(18, "GST");
const vat = createTaxCalc(20, "VAT");

console.log(gst(1000));  // { name: 'GST', amount: 1000, tax: 180, total: 1180 }
console.log(vat(1000));  // { name: 'VAT', amount: 1000, tax: 200, total: 1200 }

// ───────────────────────────────────────────────────────────────
// 6. MEMOIZATION (caching expensive results)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. Memoization ===");

function memoize(fn) {
    const cache = {};          // closed-over private cache

    return function (...args) {
        const key = JSON.stringify(args);
        if (key in cache) {
            console.log(`  cache hit: ${key}`);
            return cache[key];
        }
        console.log(`  computing: ${key}`);
        cache[key] = fn(...args);
        return cache[key];
    };
}

function slowSquare(n) {
    // imagine this is expensive
    return n * n;
}

const fastSquare = memoize(slowSquare);

console.log(fastSquare(5));   // computing: [5]  → 25
console.log(fastSquare(5));   // cache hit: [5]  → 25
console.log(fastSquare(10));  // computing: [10] → 100
console.log(fastSquare(10));  // cache hit: [10] → 100

// ───────────────────────────────────────────────────────────────
// 7. DEBOUNCE (delays execution until user stops triggering)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. Debounce ===");

function debounce(fn, delay) {
    let timer; // closed-over — shared across all calls to the returned fn

    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

const search = debounce((query) => console.log(`Searching: "${query}"`), 300);

// Simulate rapid keystrokes — only the last one fires after 300ms
search("j");
search("ja");
search("jav");
search("java");
search("javascript"); // only this fires (after 300ms of silence)

// Wait to see the result
setTimeout(() => {}, 500);

// ───────────────────────────────────────────────────────────────
// 8. CURRYING with closures
// ───────────────────────────────────────────────────────────────

console.log("\n=== 8. Currying ===");

function curry(fn) {
    return function curried(...args) {
        if (args.length >= fn.length) {
            return fn(...args);
        }
        return (...more) => curried(...args, ...more);
    };
}

function add(a, b, c) { return a + b + c; }

const curriedAdd = curry(add);

console.log(curriedAdd(1)(2)(3));   // 6
console.log(curriedAdd(1, 2)(3));   // 6
console.log(curriedAdd(1)(2, 3));   // 6
console.log(curriedAdd(1, 2, 3));   // 6

const add10 = curriedAdd(10);
console.log(add10(5)(3));  // 18
console.log(add10(5)(7));  // 22

// ───────────────────────────────────────────────────────────────
// 9. STALE CLOSURE — common React bug
// ───────────────────────────────────────────────────────────────

console.log("\n=== 9. Stale Closure ===");

function makeStaleDemo() {
    let count = 0;

    const staleLogger = () => {
        // captures count at definition time (by reference)
        // but the reference IS count — so it always sees the current value
        console.log("stale demo count:", count);
    };

    count = 42; // changed after staleLogger was created
    staleLogger(); // 42 — not 0. Captured by reference.

    // The "stale closure" problem in React happens when:
    // a closure is created inside useEffect with an old dependency value
    // and used in a callback that runs later. The fix is the dependency array.
}

makeStaleDemo();

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice ===");

// Q1: What prints?
function outer() {
    let x = 10;
    function inner() { console.log(x); }
    x = 30;
    return inner;
}
outer()();
// Answer: 30  (reference, not snapshot)

// Q2: What prints?
function createFns() {
    const result = [];
    for (let n = 0; n < 3; n++) {
        result.push(() => n);
    }
    return result;
}
const fns = createFns();
console.log(fns[0](), fns[1](), fns[2]());
// Answer: 0 1 2

// Q3: What prints?
function makeCounter() {
    let c = 0;
    return {
        inc: () => ++c,
        reset: () => { const old = c; c = 0; return old; },
    };
}
const cx = makeCounter();
const cy = makeCounter();
console.log(cx.inc());    // 1
console.log(cx.inc());    // 2
console.log(cy.inc());    // 1  — independent
console.log(cx.reset());  // 2  — returns old value
console.log(cx.inc());    // 1  — fresh after reset
console.log(cy.inc());    // 2  — cy unaffected

// Q4: Build a private logger that counts how many times it logs
function createLogger(prefix) {
    let logCount = 0;
    return {
        log(msg)   { logCount++; console.log(`[${prefix}] ${msg}`); },
        getCount() { return logCount; },
    };
}
const logger = createLogger("INFO");
logger.log("App started");  // [INFO] App started
logger.log("User logged in"); // [INFO] User logged in
console.log(logger.getCount()); // 2
