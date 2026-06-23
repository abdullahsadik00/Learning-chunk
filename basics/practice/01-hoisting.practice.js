// ═══════════════════════════════════════════════════════════════
// PRACTICE: HOISTING
// Run: node 01-hoisting.practice.js
//
// PREDICT → write expected output as a comment, then run.
// IMPLEMENT → fill in the function body until all ✅.
// No peeking at week-3/01-hoisting.js until you're done.
// ═══════════════════════════════════════════════════════════════

function check(label, got, expected) {
    const pass = JSON.stringify(got) === JSON.stringify(expected);
    console.log(pass
        ? `✅  ${label}`
        : `❌  ${label}\n    got:      ${JSON.stringify(got)}\n    expected: ${JSON.stringify(expected)}`
    );
}

// ─── PREDICT 1: var hoisting ─────────────────────────────────
console.log("\n── Predict 1 ──");
// Write your predictions before running.
//   A: ???
//   B: ???
//   C: ???  (country is never declared at all)

console.log(typeof city);       // A
var city = "Mumbai";
console.log(city);              // B
console.log(typeof country);    // C — no `var country` anywhere

// ─── PREDICT 2: function declaration vs expression ────────────
console.log("\n── Predict 2 ──");
// Predict before running:
//   A: ???
//   B: ???
//   C: ???

console.log(typeof sayHi);      // A
console.log(typeof greetFn);    // B

function sayHi() { return "hi"; }
var greetFn = function() { return "hello"; };

console.log(typeof sayHi);      // C — after the declaration

// ─── PREDICT 3: var inside a function ────────────────────────
console.log("\n── Predict 3 ──");
// Predict:
//   A: ???   (first line inside testHoist)
//   B: ???   (second line inside testHoist)
//   C: ???   (after calling testHoist)

var role = "admin";

function testHoist() {
    console.log(role);   // A
    var role = "user";
    console.log(role);   // B
}

testHoist();
console.log(role);       // C

// ─── PREDICT 4: the interview trap ───────────────────────────
console.log("\n── Predict 4 ──");
// This one trips up most developers. Predict:
//   Output: ???

var n = 1;
function tricky() {
    n = 10;
    return;
    function n() {}   // hoisting hint: what scope does this create n in?
}
tricky();
console.log(n);       // ???

// ─── PREDICT 5: TDZ ──────────────────────────────────────────
console.log("\n── Predict 5 ──");
// Predict what kind of error each commented line would throw,
// and explain WHY there is a difference between var and let.
//
//   console.log(a);   ← var a = 1 declared below. Error? Value?
//   console.log(b);   ← let b = 1 declared below. Error? Value?
//
// Write your prediction, then uncomment ONE at a time to verify.

var a = 1;
let b = 2;
console.log(a, b);   // just to confirm they exist after declaration

// ─── IMPLEMENT 1: fix the silent var bug ─────────────────────
console.log("\n── Implement 1 ──");
// The function below uses `var` inside an `if` block.
// Because var is function-scoped, accessing it outside the if
// returns undefined instead of throwing — a silent bug.
//
// Rewrite using `let` so that accessing it when isAdmin=false
// throws a ReferenceError (caught below).

function processUser(isAdmin) {
    if (isAdmin) {
        var accessLevel = "admin";   // CHANGE THIS: use let
    }
    return accessLevel;              // should throw when isAdmin=false
}

try {
    processUser(false);
    console.log("❌  Should have thrown a ReferenceError");
} catch (e) {
    check("non-admin throws ReferenceError", e instanceof ReferenceError, true);
}
check("admin returns 'admin'", processUser(true), "admin");

// ─── IMPLEMENT 2: rewrite with let/const ─────────────────────
console.log("\n── Implement 2 ──");
// Rewrite getDiscount using let/const only (no var).
// Both branches must set a discount and the function must return it.
// Behaviour: isPremium → 0.3, else → 0.1

function getDiscount(isPremium) {
    // YOUR CODE — no var allowed
    var discount;                    // replace this block
    if (isPremium) {
        discount = 0.3;
    } else {
        discount = 0.1;
    }
    return discount;
}

check("premium discount",  getDiscount(true),  0.3);
check("standard discount", getDiscount(false), 0.1);

// ─── IMPLEMENT 3: explain the IIFE hoisting result ───────────
console.log("\n── Implement 3 ──");
// Before running, predict what prints for each ?.
// Then explain in a comment WHY double() works but `val` is undefined.

var iife_result = (function () {
    console.log(val);         // ?   Your prediction:
    console.log(double());    // ?   Your prediction:
    var val = 5;
    function double() { return "double called: " + (val * 2); }
    return val + 10;
})();

console.log("iife_result:", iife_result);  // ?  Your prediction:

// Explanation (write in a comment):
// double() works because ___
// val is undefined (not 5) because ___
