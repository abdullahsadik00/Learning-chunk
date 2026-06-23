// ═══════════════════════════════════════════════════════════════
// PRACTICE: SCOPE & SCOPE CHAIN
// Run: node 02-scope-chain.practice.js
// ═══════════════════════════════════════════════════════════════

function check(label, got, expected) {
    const pass = JSON.stringify(got) === JSON.stringify(expected);
    console.log(pass
        ? `✅  ${label}`
        : `❌  ${label}\n    got:      ${JSON.stringify(got)}\n    expected: ${JSON.stringify(expected)}`
    );
}

// ─── PREDICT 1: block scope — var leaks, let doesn't ─────────
console.log("\n── Predict 1 ──");
// Predict the output.  Mark any line you think throws an error with "throws".
//   A: ???
//   B: ???

if (true) {
    var leaked = "I escaped!";
    let trapped = "I stay inside";
}
console.log(leaked);     // A
// console.log(trapped); // B — uncomment to verify your prediction

// ─── PREDICT 2: lexical scope (most important concept) ───────
console.log("\n── Predict 2 ──");
// RULE: scope is determined WHERE a function is WRITTEN, not where it is CALLED.
// Predict:
//   Output: ???

const msg = "global";

function defineHere() {
    const msg = "defineHere";
    function inner() { console.log(msg); }
    return inner;
}

function callFromHere() {
    const msg = "callFromHere";   // does inner() see THIS?
    defineHere()();               // define in defineHere, call here
}

callFromHere();    // What prints?

// ─── PREDICT 3: variable shadowing ───────────────────────────
console.log("\n── Predict 3 ──");
// Trace the output line by line:
//   A: ???
//   B: ???
//   C: ???   (note the call order)

const color = "red";

function first() {
    const color = "blue";
    function second() {
        const color = "green";
        console.log(color);   // A
    }
    console.log(color);       // B
    second();
}

console.log(color);           // C
first();
// Output order is C, B, A — not A, B, C. Write the actual sequence: ???

// ─── PREDICT 4: scope chain with var in a loop ───────────────
console.log("\n── Predict 4 ──");
// Predict what handlers[0](), handlers[1](), handlers[2]() return:
//   With var:  ???, ???, ???
//   With let:  ???, ???, ???

const withVar = [];
for (var i = 0; i < 3; i++) { withVar.push(() => i); }

const withLet = [];
for (let j = 0; j < 3; j++) { withLet.push(() => j); }

console.log("var:", withVar[0](), withVar[1](), withVar[2]());
console.log("let:", withLet[0](), withLet[1](), withLet[2]());

// ─── IMPLEMENT 1: trace the scope chain ──────────────────────
console.log("\n── Implement 1 ──");
// Complete the function. It must walk the scope chain and return
// the value of `target` from the NEAREST enclosing scope.
// (This is conceptual — just fill in what JS would find.)

const target = "global-target";

function level1() {
    const target = "level1-target";
    function level2() {
        // no `target` here
        function level3() {
            return target;   // which target does JS find? Don't change this line.
        }
        return level3();
    }
    return level2();
}

function level1NoTarget() {
    function level2() {
        function level3() {
            return target;
        }
        return level3();
    }
    return level2();
}

check("level1 finds level1-target",    level1(),         "level1-target");
check("level1NoTarget finds global",   level1NoTarget(), "global-target");

// ─── IMPLEMENT 2: IIFE module — private counter ───────────────
console.log("\n── Implement 2 ──");
// Use an IIFE to create a counter module with private state.
// The returned object must have: increment(), decrement(), reset(), get().
// `count` must NOT be accessible from outside.

const Counter = (function () {
    // YOUR CODE — define private `count` and return the public API
    return {
        increment() {},
        decrement() {},
        reset()     {},
        get()       { return 0; },
    };
})();

Counter.increment();
Counter.increment();
Counter.increment();
check("after 3 increments", Counter.get(), 3);
Counter.decrement();
check("after decrement",    Counter.get(), 2);
Counter.reset();
check("after reset",        Counter.get(), 0);
check("count is private",   typeof Counter.count === "undefined", true);

// ─── IMPLEMENT 3: fix the function factory ───────────────────
console.log("\n── Implement 3 ──");
// makeAdders returns an array of 5 functions.
// adders[n](x) should return x + n.
// The broken version uses var — fix it (one character change).

function makeAdders() {
    const adders = [];
    for (var k = 0; k < 5; k++) {   // FIX: change var to let
        adders.push((x) => x + k);
    }
    return adders;
}

const adders = makeAdders();
check("adders[0](10) === 10", adders[0](10), 10);
check("adders[2](10) === 12", adders[2](10), 12);
check("adders[4](10) === 14", adders[4](10), 14);
