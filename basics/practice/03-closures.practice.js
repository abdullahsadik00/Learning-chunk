// ═══════════════════════════════════════════════════════════════
// PRACTICE: CLOSURES
// Run: node 03-closures.practice.js
// ═══════════════════════════════════════════════════════════════

function check(label, got, expected) {
    const pass = JSON.stringify(got) === JSON.stringify(expected);
    console.log(pass
        ? `✅  ${label}`
        : `❌  ${label}\n    got:      ${JSON.stringify(got)}\n    expected: ${JSON.stringify(expected)}`
    );
}

// ─── PREDICT 1: reference, not snapshot ──────────────────────
console.log("\n── Predict 1 ──");
// Closures capture variables by REFERENCE.
// Predict:
//   Output: ???

function makeGreeter() {
    let who = "World";
    const greet = () => console.log(`Hello, ${who}!`);
    who = "Sadik";          // changed AFTER greet is created
    return greet;
}
makeGreeter()();

// ─── PREDICT 2: independent closures ─────────────────────────
console.log("\n── Predict 2 ──");
// Each call to makeSimpleCounter() creates a FRESH closure with its own count.
// Predict the sequence of numbers:
//   ???, ???, ???, ???, ???

function makeSimpleCounter() {
    let count = 0;
    return () => ++count;
}

const c1 = makeSimpleCounter();
const c2 = makeSimpleCounter();

console.log(c1()); // ?
console.log(c1()); // ?
console.log(c2()); // ?
console.log(c1()); // ?
console.log(c2()); // ?

// ─── PREDICT 3: classic var-in-loop ──────────────────────────
console.log("\n── Predict 3 ──");
// Predict what buggy[0](), buggy[1](), buggy[2]() print:
//   Buggy: ???, ???, ???
// Then predict what fixed[0](), fixed[1](), fixed[2]() print:
//   Fixed: ???, ???, ???

const buggy = [];
for (var b = 0; b < 3; b++) { buggy.push(() => b); }

const fixed = [];
for (let f = 0; f < 3; f++) { fixed.push(() => f); }

console.log("buggy:", buggy[0](), buggy[1](), buggy[2]());
console.log("fixed:", fixed[0](), fixed[1](), fixed[2]());

// Why is buggy broken? Write your explanation:
// Because all three closures share the _____ variable `b`, and by the time
// they run the loop has finished so b === ___.

// ─── IMPLEMENT 1: counter factory ────────────────────────────
console.log("\n── Implement 1 ──");
// Implement createCounter(start).
// Returns an object with: inc(), dec(), reset(), value().
// `start` defaults to 0 if not provided.

function createCounter(start = 0) {
    // YOUR CODE
    return {
        inc()   {},
        dec()   {},
        reset() {},
        value() { return 0; },
    };
}

const ct = createCounter(10);
ct.inc(); ct.inc(); ct.inc();
check("inc 3 times from 10",  ct.value(), 13);
ct.dec();
check("dec once",             ct.value(), 12);
ct.reset();
check("reset goes back to 10",ct.value(), 10);

const ct2 = createCounter();
ct2.inc();
check("independent counter",  ct2.value(), 1);
check("ct still at 10",       ct.value(),  10);

// ─── IMPLEMENT 2: function factory ───────────────────────────
console.log("\n── Implement 2 ──");
// Implement createMultiplier(factor).
// Returns a function that multiplies its argument by factor.

function createMultiplier(factor) {
    // YOUR CODE — one line
    return () => 0; // stub — replace with real implementation
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

check("double(5)",  double(5),  10);
check("triple(5)",  triple(5),  15);
check("double(11)", double(11), 22);
check("triple(4)",  triple(4),  12);

// ─── IMPLEMENT 3: memoize ─────────────────────────────────────
console.log("\n── Implement 3 ──");
// Implement memoize(fn).
// Returns a wrapped version of fn that caches results.
// Same arguments → return cached value without calling fn again.
// Use JSON.stringify(args) as the cache key.

function memoize(fn) {
    // YOUR CODE — replace the stub below
    return function(...args) { return fn(...args); }; // stub: no caching
}

let callCount = 0;
function expensive(n) {
    callCount++;
    return n * n;
}

const fastSquare = memoize(expensive);

fastSquare(5);
fastSquare(5);
fastSquare(5);
check("fn only called once for same arg", callCount, 1);
fastSquare(6);
check("fn called again for new arg",      callCount, 2);
check("cached result is correct",         fastSquare(5), 25);

// ─── IMPLEMENT 4: private bank account ───────────────────────
console.log("\n── Implement 4 ──");
// Implement createBankAccount(initialBalance).
// Returns: { deposit(n), withdraw(n), balance() }
// Rules:
//   - balance is PRIVATE (not directly accessible)
//   - withdraw rejects if amount > balance (return "insufficient funds")
//   - deposit/withdraw return the new balance on success

function createBankAccount(initialBalance) {
    // YOUR CODE
    return {
        deposit(amount)  { return 0; },
        withdraw(amount) { return ""; },
        balance()        { return 0; },
    };
}

const acct = createBankAccount(1000);
check("initial balance",        acct.balance(),     1000);
check("deposit 500",            acct.deposit(500),  1500);
check("withdraw 200",           acct.withdraw(200), 1300);
check("balance after ops",      acct.balance(),     1300);
check("overdraft rejected",     acct.withdraw(9999), "insufficient funds");
check("balance unchanged",      acct.balance(),     1300);
check("balance is private",     typeof acct._balance === "undefined", true);
