// ═══════════════════════════════════════════════════════════════
// PRACTICE: THE `this` KEYWORD
// Run: node 04-this-keyword.practice.js
//
// The 5 rules (highest priority first):
//   1. Arrow function  → lexical this (inherits from enclosing scope)
//   2. new             → new empty object
//   3. Explicit        → first arg of call/apply/bind
//   4. Implicit        → object to the LEFT of the dot
//   5. Default         → global (non-strict) | undefined (strict)
// ═══════════════════════════════════════════════════════════════

function check(label, got, expected) {
    const pass = JSON.stringify(got) === JSON.stringify(expected);
    console.log(pass
        ? `✅  ${label}`
        : `❌  ${label}\n    got:      ${JSON.stringify(got)}\n    expected: ${JSON.stringify(expected)}`
    );
}

// ─── PREDICT 1: implicit binding ─────────────────────────────
console.log("\n── Predict 1 ──");
// Rule: `this` = object IMMEDIATELY to the left of the dot.
// Predict:
//   A: ???
//   B: ???   (only the immediately preceding object matters)

const user = {
    name: "Sadik",
    getName() { return this.name; },
};
const company = {
    name: "TechCorp",
    dept: {
        name: "Engineering",
        show() { return this.name; },
    },
};

console.log(user.getName());       // A
console.log(company.dept.show());  // B

// ─── PREDICT 2: binding loss ──────────────────────────────────
console.log("\n── Predict 2 ──");
// This is the most common real-world `this` bug.
// Predict:
//   A: ???
//   B: ???

const obj = { name: "Rahul", greet() { return this.name; } };

const extracted = obj.greet;    // extracted from the object
console.log(obj.greet());       // A — method call
console.log(extracted());       // B — plain function call

// ─── PREDICT 3: arrow vs regular in setTimeout ───────────────
console.log("\n── Predict 3 ──");
// Arrow functions inherit `this` from the enclosing scope.
// Predict what each setTimeout prints after 50ms:

const timer = {
    label: "MyTimer",
    startArrow() {
        setTimeout(() => {
            console.log("Arrow:", this.label);   // A: ???
        }, 50);
    },
    startRegular() {
        setTimeout(function () {
            console.log("Regular:", this.label); // B: ???
        }, 50);
    },
};

timer.startArrow();
timer.startRegular();

// ─── PREDICT 4: new vs bind ───────────────────────────────────
console.log("\n── Predict 4 ──");
// `new` wins over `bind` — the new object is always `this`.
// Predict:
//   A: ???

function Foo(v) { this.v = v; }
const boundFoo = Foo.bind({ v: 999 });
const instance = new boundFoo(42);
console.log(instance.v);   // A

// ─── PREDICT 5: arrow as object method (common mistake) ──────
console.log("\n── Predict 5 ──");
// Arrow functions do NOT have their own `this`.
// When used as a method, they capture the module-level `this` (not the object).
// Predict:
//   A: ???   (arrow method)
//   B: ???   (regular method)

const widget = {
    name: "Button",
    badClick: () => this.name,         // arrow — captures module-level `this`
    goodClick() { return this.name; }, // regular — implicit binding
};

console.log(widget.badClick());    // A
console.log(widget.goodClick());   // B

// ─── IMPLEMENT 1: myCall ─────────────────────────────────────
console.log("\n── Implement 1 ──");
// Implement Function.prototype.myCall(context, ...args).
// It should call `this` (the function) with `context` as `this`
// and spread the remaining args.

Function.prototype.myCall = function(context, ...args) {
    // YOUR CODE
    // Hint: temporarily set a property on context to hold the function,
    //       call it, then delete it.
    return undefined; // stub — replace with real implementation
};

function greet(greeting, punct) {
    return `${greeting}, ${this.name}${punct}`;
}

const alice = { name: "Alice" };
check("myCall basic",         greet.myCall(alice, "Hello", "!"), "Hello, Alice!");
check("myCall different obj", greet.myCall({ name: "Bob" }, "Hi", "."), "Hi, Bob.");

// ─── IMPLEMENT 2: myBind ─────────────────────────────────────
console.log("\n── Implement 2 ──");
// Implement Function.prototype.myBind(context, ...outerArgs).
// Returns a NEW function with `this` fixed and optional pre-filled args.

Function.prototype.myBind = function(context, ...outerArgs) {
    // YOUR CODE
    // Hint: capture `this` (the function), return a new function
    //       that calls the original with apply.
    return function(...innerArgs) {}; // stub — replace with real implementation
};

function introduce(greeting, punct) {
    return `${greeting}, I'm ${this.name}${punct}`;
}

const priyaBound = introduce.myBind({ name: "Priya" }, "Namaste");
check("myBind with preset arg",   priyaBound("!"),  "Namaste, I'm Priya!");
check("myBind different punct",   priyaBound("?"),  "Namaste, I'm Priya?");

const noPreset = introduce.myBind({ name: "Amit" });
check("myBind no preset args",    noPreset("Hey", "."), "Hey, I'm Amit.");

// ─── IMPLEMENT 3: fix binding loss ───────────────────────────
console.log("\n── Implement 3 ──");
// All three calls to `callIt` below print undefined.
// Fix each one WITHOUT modifying callIt or the logger object.
// Use bind / arrow wrapper for each.

const logger = {
    prefix: "[LOG]",
    log(msg) { return `${this.prefix} ${msg}`; },
};

function callIt(fn) { return fn("hello"); }   // DO NOT change this

// Fix 1: use .bind()   hint: logger.log.bind(logger)
const fix1 = callIt(logger.log);
// Fix 2: use an arrow wrapper that forwards the arg   hint: msg => logger.log(msg)
const fix2 = callIt(logger.log);

check("fix1 with bind",         fix1, "[LOG] hello");
check("fix2 with arrow wrapper",fix2, "[LOG] hello");

// Bonus: what is the difference between these two approaches?
// bind: ___
// arrow: ___
