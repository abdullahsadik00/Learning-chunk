// ═══════════════════════════════════════════════════════════════
// MODULE 3: SCOPE & SCOPE CHAIN
// Run: node 02-scope-chain.js
// ═══════════════════════════════════════════════════════════════
//
// SCOPE = the region of code where a variable is accessible.
//
//   Global scope    → outside everything; accessible everywhere
//   Function scope  → inside a function; var/let/const all respect this
//   Block scope     → inside { }; only let and const respect this (var leaks out)
//   Lexical scope   → scope is determined WHERE the function is WRITTEN, not called

// ───────────────────────────────────────────────────────────────
// 1. GLOBAL SCOPE
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Global Scope ===");

var globalVar = "global var";
let globalLet = "global let";
const GLOBAL_CONST = "global const";

function readGlobals() {
    console.log(globalVar);    // ✅
    console.log(globalLet);    // ✅
    console.log(GLOBAL_CONST); // ✅
}
readGlobals();

// ───────────────────────────────────────────────────────────────
// 2. FUNCTION SCOPE
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. Function Scope ===");

function greet() {
    var message = "Hello from inside";
    let count = 10;
    console.log(message, count); // ✅ both accessible here
}
greet();
// console.log(message); // ❌ ReferenceError — trapped inside greet

// ───────────────────────────────────────────────────────────────
// 3. BLOCK SCOPE — var vs let vs const
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. Block Scope ===");

if (true) {
    var  blockVar   = "var in block";   // leaks out (function-scoped)
    let  blockLet   = "let in block";   // stays inside
    const blockConst = "const in block"; // stays inside
    console.log(blockVar, blockLet, blockConst); // all accessible inside
}

console.log(blockVar);   // "var in block" — escaped the block!
// console.log(blockLet);   // ❌ ReferenceError
// console.log(blockConst); // ❌ ReferenceError

// Same with for loops:
for (var i = 0; i < 3; i++) { /* empty */ }
console.log("var i after loop:", i); // 3 — leaked!

for (let j = 0; j < 3; j++) { /* empty */ }
// console.log(j); // ❌ ReferenceError — j is block-scoped

// ───────────────────────────────────────────────────────────────
// 4. NESTED SCOPE — inner can read outer, not vice versa
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. Nested Scope ===");

var x = 1;

function outer() {
    var y = 2;

    function inner() {
        var z = 3;
        console.log(x, y, z); // ✅ 1 2 3 — can see all ancestors
    }

    inner();
    console.log(x, y);  // ✅ 1 2
    // console.log(z);  // ❌ inner's variable not visible here
}

outer();

// ───────────────────────────────────────────────────────────────
// 5. LEXICAL ENVIRONMENT
//
// Every execution context carries:
//   - Environment Record: current scope's variables
//   - Outer Reference: pointer to the parent scope's environment
//
// This chain of outer references = the SCOPE CHAIN.
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Scope Chain Lookup ===");

const level1 = "level-1";

function scopeA() {
    const level2 = "level-2";

    function scopeB() {
        const level3 = "level-3";

        function scopeC() {
            // Scope chain: scopeC → scopeB → scopeA → global
            console.log(level3); // found in scopeC itself
            console.log(level2); // found 1 level up
            console.log(level1); // found 2 levels up
        }

        scopeC();
    }

    scopeB();
}

scopeA();

// ───────────────────────────────────────────────────────────────
// 6. VARIABLE SHADOWING
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. Variable Shadowing ===");

const name = "Global";

function first() {
    const name = "First";    // shadows global name

    function second() {
        const name = "Second"; // shadows first's name
        console.log(name);     // "Second"
    }

    console.log(name);  // "First"
    second();
}

console.log(name);  // "Global"
first();
// Output order: "Global", "First", "Second"

// ───────────────────────────────────────────────────────────────
// 7. LEXICAL SCOPE (most important concept)
//
// Scope is determined WHERE a function is WRITTEN, not where it is CALLED.
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. Lexical Scope (Static Scope) ===");

const value = "global-value";

function defineHere() {
    const value = "defineHere-value";

    function inner() {
        console.log(value); // reads from WHERE inner was DEFINED, not where it's CALLED
    }

    return inner;
}

function callFromHere() {
    const value = "callFromHere-value"; // irrelevant — inner doesn't see this
    const fn = defineHere();
    fn(); // called here, but scope chain is from defineHere
}

callFromHere(); // "defineHere-value" — NOT "callFromHere-value"

// Key insight: the word "lexical" means "relating to the source code text."
// JS reads the source once, fixes the scope chain at that point, forever.

// ───────────────────────────────────────────────────────────────
// 8. SCOPE CHAIN TRACING — what does JS find?
// ───────────────────────────────────────────────────────────────

console.log("\n=== 8. Scope Chain Trace ===");

var color = "global-red";

function layer1() {
    var color = "layer1-blue";

    function layer2() {
        // no color here

        function layer3() {
            console.log(color); // which color?
            // layer3 → layer2 (no color) → layer1 (found!) → "layer1-blue"
        }

        layer3();
    }

    layer2();
}

layer1(); // "layer1-blue"

function layer1NoColor() {
    function layer2() {
        function layer3() {
            console.log(color); // which color?
            // layer3 → layer2 → layer1NoColor → global (found!) → "global-red"
        }
        layer3();
    }
    layer2();
}

layer1NoColor(); // "global-red"

// ───────────────────────────────────────────────────────────────
// 9. COMMON BUG — global pollution with var
// ───────────────────────────────────────────────────────────────

console.log("\n=== 9. Avoiding Global Pollution ===");

// BAD: every var/function here pollutes global scope
var counter = 0;
function increment() { counter++; }

// GOOD: wrap in an IIFE to create private scope
const CounterModule = (function () {
    let count = 0;              // private
    return {
        increment() { count++; },
        get()       { return count; },
    };
})();

CounterModule.increment();
CounterModule.increment();
console.log(CounterModule.get()); // 2
// console.log(count);           // ❌ ReferenceError — private

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice ===");

// Q1: What does this print?
const p = "outer-p";
function fn1() {
    const p = "inner-p";
    function fn2() { console.log(p); }
    fn2();
}
function fn3() {
    const p = "fn3-p";
    fn1(); // calls fn1, but fn2's scope chain doesn't include fn3
}
fn3();
// Answer: "inner-p"  (lexical scope — fn2 sees fn1's p, not fn3's)

// Q2: What prints?
{
    let blockA = "blockA";
    {
        let blockB = "blockB";
        console.log(blockA); // ?
    }
    // console.log(blockB); // ?
}
// Answer: "blockA"  |  the second line would throw ReferenceError

// Q3: Fix the loop variable leak
function makeTimers() {
    const handlers = [];
    for (let k = 0; k < 3; k++) {    // let gives each iteration its own k
        handlers.push(() => k);
    }
    return handlers;
}
const timers = makeTimers();
console.log(timers[0](), timers[1](), timers[2]()); // 0 1 2  ✅
