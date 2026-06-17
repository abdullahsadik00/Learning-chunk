// ═══════════════════════════════════════════════════════════════
// MODULE 5: THE `this` KEYWORD
// Run: node 04-this-keyword.js
// ═══════════════════════════════════════════════════════════════
//
// `this` refers to the object that is currently executing the function.
//
// CRITICAL RULE: `this` is NOT set by where a function is written.
//                `this` is set by HOW the function is CALLED.
//   (Exception: arrow functions — they inherit `this` from their lexical scope.)
//
// 5 RULES (highest priority first):
//   1. Arrow function  → inherits from enclosing scope (lexical this)
//   2. new binding     → the newly created object
//   3. Explicit        → object passed to call / apply / bind
//   4. Implicit        → object to the LEFT of the dot
//   5. Default         → global (non-strict) | undefined (strict)

// ───────────────────────────────────────────────────────────────
// RULE 5: DEFAULT BINDING
// ───────────────────────────────────────────────────────────────

console.log("=== Rule 5: Default Binding ===");

function showDefaultThis() {
    // In Node.js (non-strict mode) `this` is the global object.
    // In strict mode, `this` is undefined.
    console.log("this === global?", this === global); // true in Node non-strict
}
showDefaultThis();

// Strict mode:
function strictFn() {
    "use strict";
    console.log("strict this:", this); // undefined
}
strictFn();

// ───────────────────────────────────────────────────────────────
// RULE 4: IMPLICIT BINDING
// ───────────────────────────────────────────────────────────────

console.log("\n=== Rule 4: Implicit Binding ===");

const person = {
    name: "Sadik",
    greet() {
        console.log("Hello,", this.name); // this = person (object before the dot)
    },
};

person.greet(); // Hello, Sadik

// Only the IMMEDIATE object before the dot matters:
const company = {
    name: "TechCorp",
    dept: {
        name: "Engineering",
        show() { console.log(this.name); },
    },
};
company.dept.show(); // "Engineering" — dept is before the dot, not company

// ─── IMPLICIT BINDING LOSS (Most common JS bug) ───

console.log("\n--- Binding Loss ---");

const obj = {
    name: "Rahul",
    greet() { console.log("Hello,", this.name); },
};

const fn = obj.greet;  // extract the function — loses the object context
fn();                  // Hello, undefined — default binding now applies

// Loss via callback:
function callIt(callback) { callback(); } // callback called without any object
callIt(obj.greet);  // Hello, undefined

// Fix 1 — bind:
callIt(obj.greet.bind(obj)); // Hello, Rahul ✅

// Fix 2 — arrow wrapper:
callIt(() => obj.greet());   // Hello, Rahul ✅

// ───────────────────────────────────────────────────────────────
// RULE 3: EXPLICIT BINDING — call, apply, bind
// ───────────────────────────────────────────────────────────────

console.log("\n=== Rule 3: Explicit Binding ===");

function introduce(greeting, punctuation) {
    console.log(`${greeting}, I'm ${this.name}${punctuation}`);
}

const alice = { name: "Alice" };
const bob   = { name: "Bob" };

// call — args listed individually, invokes immediately
introduce.call(alice, "Hello", "!");   // Hello, I'm Alice!
introduce.call(bob,   "Hi",   ".");    // Hi, I'm Bob.

// apply — args as array, invokes immediately
introduce.apply(alice, ["Namaste", "!"]);  // Namaste, I'm Alice!

// bind — returns NEW function with `this` permanently fixed
const aliceIntro = introduce.bind(alice, "Hey");
aliceIntro("!");  // Hey, I'm Alice!
aliceIntro("?");  // Hey, I'm Alice?

// Memory aid:
//   Call  → Comma-separated args
//   Apply → Array of args
//   Bind  → returns Bound function (not invoked yet)

// ─── Partial application with bind ───
function multiply(a, b) { return a * b; }

const double = multiply.bind(null, 2);  // a is fixed as 2; null = don't care about this
const triple = multiply.bind(null, 3);

console.log(double(5));  // 10
console.log(triple(5));  // 15

// ─── bind Polyfill (interview question) ───
console.log("\n--- bind Polyfill ---");

Function.prototype.myBind = function (context, ...outerArgs) {
    const fn = this;
    return function (...innerArgs) {
        return fn.apply(context, [...outerArgs, ...innerArgs]);
    };
};

function greetUser(greeting, punctuation) {
    console.log(`${greeting}, ${this.name}${punctuation}`);
}

const boundGreet = greetUser.myBind({ name: "Priya" }, "Hello");
boundGreet("!");  // Hello, Priya!

// ───────────────────────────────────────────────────────────────
// RULE 2: new BINDING
// ───────────────────────────────────────────────────────────────

console.log("\n=== Rule 2: new Binding ===");

// What `new` does in 4 steps:
//   1. Creates a fresh empty object {}
//   2. Sets its [[Prototype]] to Constructor.prototype
//   3. Binds `this` to the new object
//   4. Returns the new object (unless constructor explicitly returns another object)

function User(name, age) {
    // this = {} automatically
    this.name = name;
    this.age  = age;
    // return this automatically
}

const u1 = new User("Sadik", 25);
const u2 = new User("Priya", 22);

console.log(u1.name, u1.age); // Sadik 25
console.log(u2.name, u2.age); // Priya 22
console.log(u1 === u2);       // false — separate objects

// new overrides explicit binding:
function Widget(color) { this.color = color; }
const fixedWidget = Widget.bind({ color: "blue" });
const w = new fixedWidget("red"); // new wins — this is the new object
console.log(w.color); // "red"

// ───────────────────────────────────────────────────────────────
// RULE 1: ARROW FUNCTIONS — lexical this
// ───────────────────────────────────────────────────────────────

console.log("\n=== Rule 1: Arrow Functions ===");

// Arrow functions do NOT have their own `this`.
// They capture `this` from the ENCLOSING scope at definition time.

const timer = {
    label: "Timer",
    start() {
        // `this` here = timer (implicit binding on start())
        setTimeout(() => {
            // Arrow inherits `this` from start() — which is `timer`
            console.log(this.label, "done"); // "Timer done" ✅
        }, 10);

        // Compare with regular function in same position:
        setTimeout(function () {
            console.log(this.label, "regular done"); // undefined — binding lost
        }, 10);
    },
};
timer.start();

// Arrow as object METHOD — common mistake:
const widget = {
    name: "Button",
    // ❌ Arrow function as method — inherits global `this`, NOT widget
    badClick: () => console.log("arrow method this.name:", this.name),
    // ✅ Regular function as method — gets implicit binding
    goodClick() { console.log("regular method this.name:", this.name); },
};

widget.badClick();   // undefined — `this` is module scope (global-like in Node)
widget.goodClick();  // "Button"  ✅

// Arrow functions CANNOT be called with new:
// const arr = new (() => {});  // TypeError: not a constructor

// call/apply/bind cannot override arrow's this:
const arrowFn = () => console.log("arrow this:", this === global ? "global" : this);
arrowFn.call({ name: "ignored" }); // still logs arrow's lexical this

// ───────────────────────────────────────────────────────────────
// this IN CLASSES
// ───────────────────────────────────────────────────────────────

console.log("\n=== this in Classes ===");

class Counter {
    constructor(start) {
        this.count = start;
        // Binding in constructor — fixes the method permanently
        this.tick = this.tick.bind(this);
    }

    tick() {
        this.count++;
        return this.count;
    }

    // Alternative: class field arrow (auto-bound, no need for constructor bind)
    tickArrow = () => {
        this.count++;
        return this.count;
    };
}

const c = new Counter(0);
const extractedTick = c.tick; // extracting — would normally lose binding
console.log(extractedTick()); // 1 — works because constructor bound it

const extractedArrow = c.tickArrow;
console.log(extractedArrow()); // 2 — works because arrow captures lexical this

// ───────────────────────────────────────────────────────────────
// DECISION FLOWCHART — how to find `this`
// ───────────────────────────────────────────────────────────────

//  Is it an arrow function?
//    YES → this = enclosing scope's this
//    NO ↓
//  Called with `new`?
//    YES → this = new empty object
//    NO ↓
//  Called with call / apply / bind?
//    YES → this = first argument
//    NO ↓
//  Called as method (obj.fn())?
//    YES → this = obj (object before the dot)
//    NO ↓
//  Default:
//    strict mode → undefined
//    non-strict  → global object

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice ===");

// Q1: What prints?
const o = {
    val: 42,
    getVal() { return this.val; },
};
const extracted = o.getVal;
console.log(o.getVal());  // 42  (implicit binding)
console.log(extracted()); // undefined  (binding lost — default binding)

// Q2: What prints?
function Foo(v) { this.v = v; }
const bound = Foo.bind({ v: 99 });
const instance = new bound(1);
console.log(instance.v); // 1  (new wins over bind)

// Q3: What prints?
const obj2 = {
    name: "Obj",
    outer() {
        const inner = () => this.name; // arrow: inherits outer()'s this = obj2
        return inner();
    },
};
console.log(obj2.outer()); // "Obj"

// Q4: What prints?
function make() {
    const val = "captured";
    return {
        val: "own",
        getArrow: () => "arrow-this-val: " + this.val,  // this = module scope
        getRegular() { return "regular-this-val: " + this.val; },
    };
}
const m = make();
console.log(m.getArrow());   // "arrow-this-val: undefined"
console.log(m.getRegular()); // "regular-this-val: own"

// Q5: Tricky — arguments object as `this`
function callMe(fn) {
    arguments[0](); // calling fn via arguments object — this = arguments
}
function showLen() {
    console.log("this.length:", this.length);
}
callMe(showLen, "extra1", "extra2");
// arguments = [showLen, "extra1", "extra2"] — length = 3
// Answer: 3

setTimeout(() => {}, 200); // keep process alive for timer examples above
