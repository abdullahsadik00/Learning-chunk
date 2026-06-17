// ═══════════════════════════════════════════════════════════════
// MODULE 2: HOISTING
// Run: node 01-hoisting.js
// ═══════════════════════════════════════════════════════════════
//
// Hoisting = JS engine moves declarations to the top of their
// scope BEFORE code executes (during the memory-creation phase).
//
// WHAT gets hoisted:
//   var        → declaration hoisted, value is undefined
//   function   → entire function body hoisted (fully usable)
//   let/const  → hoisted but stay in TDZ (Temporal Dead Zone)
//               accessing before declaration → ReferenceError

// ───────────────────────────────────────────────────────────────
// 1. VAR HOISTING
// ───────────────────────────────────────────────────────────────

console.log("=== 1. var Hoisting ===");

console.log(city);   // undefined  (declaration hoisted, not value)
var city = "Mumbai";
console.log(city);   // "Mumbai"

// What JS actually sees (mentally):
//   var city;              ← hoisted to top
//   console.log(city);     ← undefined
//   city = "Mumbai";
//   console.log(city);     ← "Mumbai"

// ───────────────────────────────────────────────────────────────
// 2. FUNCTION DECLARATION HOISTING
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. Function Declaration Hoisting ===");

sayHello();   // Works! "Hello, world"  ← called BEFORE definition

function sayHello() {
    console.log("Hello, world");
}

sayHello();   // Works again

// Entire function body is hoisted, so it's safe to call before definition.

// ───────────────────────────────────────────────────────────────
// 3. FUNCTION EXPRESSION — NOT fully hoisted
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. Function Expression vs Declaration ===");

console.log(typeof greet);   // "undefined" — var is hoisted, but not the function value

// greet();  // ← would throw: TypeError: greet is not a function

var greet = function() {
    return "Hi!";
};

console.log(typeof greet);   // "function"
console.log(greet());        // "Hi!"

// Rule: var is hoisted as undefined. The assignment (= function) happens at runtime.

// ───────────────────────────────────────────────────────────────
// 4. let & const — TEMPORAL DEAD ZONE (TDZ)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. TDZ with let/const ===");

// console.log(score);  // ← ReferenceError: Cannot access 'score' before initialization
// let score = 100;

// let IS hoisted, but accessing it before the line throws — this gap is the TDZ.
// This is intentional: forces you to declare before using.

let score = 100;
console.log(score);  // 100

// ───────────────────────────────────────────────────────────────
// 5. HOISTING IN FUNCTIONS (function scope)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Hoisting Inside a Function ===");

var role = "admin";

function testScope() {
    console.log(role);   // undefined — local `role` is hoisted, shadows global
    var role = "user";
    console.log(role);   // "user"
}

testScope();
console.log(role);       // "admin" — global unchanged

// What JS sees inside testScope:
//   var role;               ← local hoisted
//   console.log(role);      ← undefined (local, not global)
//   role = "user";
//   console.log(role);      ← "user"

// ───────────────────────────────────────────────────────────────
// 6. PRODUCTION BUG — hoisting + conditionals
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. Real-World Bug ===");

function processUser(isAdmin) {
    // BUG: developer expects accessLevel to be undefined only for non-admin.
    // It IS undefined for non-admin — but no error is thrown, which is the bug.
    if (isAdmin) {
        var accessLevel = "admin";
    }
    console.log("Access level:", accessLevel); // undefined for non-admin (no error!)
}

processUser(false);  // Access level: undefined
processUser(true);   // Access level: admin

// FIX: use let so it stays block-scoped and throws if accessed outside
function processUserFixed(isAdmin) {
    if (isAdmin) {
        let accessLevel = "admin";
        console.log("Access level:", accessLevel);
    }
    // console.log(accessLevel); // ReferenceError — caught early ✅
}
processUserFixed(false);  // (nothing printed — no silent bug)
processUserFixed(true);   // Access level: admin

// ───────────────────────────────────────────────────────────────
// 7. CLASSIC INTERVIEW TRAP — function inside function
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. Classic Interview: function a() inside b() ===");

var a = 1;

function b() {
    a = 10;
    return;
    function a() {}   // hoisted to top of b — creates LOCAL a
}

b();
console.log(a);  // 1 — NOT 10! b() modified its LOCAL a, not the global one

// What JS sees inside b():
//   function a() {}   ← hoisted to top, creates local `a`
//   a = 10;           ← modifies local `a`
//   return;

// ───────────────────────────────────────────────────────────────
// PRACTICE — predict the output before reading the answer
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice ===");

// Q1:
console.log(x);
var x = 5;
console.log(x);
// Answer: undefined, 5

// Q2:
go();
function go() { console.log("go!"); }
go();
// Answer: go!, go!

// Q3 — IIFE with hoisting
var result = (function () {
    console.log(n);       // ?
    console.log(inner()); // ?

    var n = 10;

    function inner() {
        return "inner called";
    }

    return n + 20;
})();

console.log(result);
// Answer: undefined, "inner called", 30

// Q4 — parameter + var same name
function test(a) {
    console.log(a);    // ?
    var a = 100;
    console.log(a);    // ?
}
test(10);
// Answer: 10, 100
// Parameter a is like var a = 10 at the start.
// var a = 100 reuses the same binding (no new variable created).
