// ═══════════════════════════════════════════════════════════════
// POLYFILLS 02: FUNCTION METHODS — bind, call, apply
// Run: node 02-function-polyfills.js
// ═══════════════════════════════════════════════════════════════
//
// All three methods do the same thing — invoke a function with
// a specified `this` context — but differ in how args are passed:
//
//   call(ctx, a, b, c)     → spread args
//   apply(ctx, [a, b, c])  → array of args
//   bind(ctx, a, b)        → returns a NEW function (partial application)

var globalCtx = typeof globalThis !== "undefined" ? globalThis : global;

// ───────────────────────────────────────────────────────────────
// 1. Function.prototype.call  — invoke with context, spread args
// ───────────────────────────────────────────────────────────────

console.log("=== 1. myCall ===");

// Strategy: temporarily attach `this` as a property of `context`,
// call it, then delete the property.

Function.prototype.myCall = function(context) {
    var ctx = (context === null || context === undefined) ? globalCtx : Object(context);
    var fnKey = Symbol("__fn__"); // unique key avoids property conflicts
    ctx[fnKey] = this;

    var args = [];
    for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
    }

    var result = ctx[fnKey].apply(ctx, args);
    delete ctx[fnKey];
    return result;
};

function greet(greeting, punctuation) {
    return greeting + ", " + this.name + punctuation;
}

var person = { name: "Rahul" };
console.log(greet.myCall(person, "Hello", "!"));   // "Hello, Rahul!"
console.log(greet.myCall(person, "Namaste", ".")); // "Namaste, Rahul."

// null context → global
function whoAmI() {
    return typeof this === "object" ? "object" : typeof this;
}
console.log(whoAmI.myCall(null)); // "object" (globalCtx)

// ───────────────────────────────────────────────────────────────
// 2. Function.prototype.apply  — invoke with context, array args
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. myApply ===");

// apply is like call but takes an array instead of spread args.
// Useful when args are already in an array (Math.max, etc.)

Function.prototype.myApply = function(context, argsArray) {
    var ctx = (context === null || context === undefined) ? globalCtx : Object(context);
    var fnKey = Symbol("__fn__");
    ctx[fnKey] = this;

    var result;
    if (!argsArray || argsArray.length === 0) {
        result = ctx[fnKey]();
    } else {
        result = ctx[fnKey].apply(ctx, argsArray);
    }

    delete ctx[fnKey];
    return result;
};

function sum(a, b, c) {
    return this.base + a + b + c;
}

var obj = { base: 100 };
console.log(sum.myApply(obj, [1, 2, 3])); // 106

// Classic use: Math.max on an array
var nums = [3, 1, 4, 1, 5, 9, 2, 6];
console.log(Math.max.myApply(null, nums)); // 9

// call vs apply:
//   call(ctx, 1, 2, 3)   ← you already know the args
//   apply(ctx, [1, 2, 3]) ← args come from an array

// ───────────────────────────────────────────────────────────────
// 3. Function.prototype.bind  — return a pre-bound function
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. myBind ===");

// bind returns a NEW function. The returned function:
//   - always uses the bound `this`
//   - prepends the bound args (partial application)
//   - when invoked with `new`, the `new` binding overrides `this`

Function.prototype.myBind = function(context) {
    if (typeof this !== "function") {
        throw new TypeError("myBind must be called on a function");
    }

    var fn = this;
    var outerArgs = Array.prototype.slice.call(arguments, 1); // args provided at bind time

    var boundFunction = function() {
        var innerArgs = Array.prototype.slice.call(arguments); // args provided at call time
        var allArgs = outerArgs.concat(innerArgs);

        // If called with `new`, the newly created object should be `this`
        if (this instanceof boundFunction) {
            return fn.apply(this, allArgs);
        }
        return fn.apply(context, allArgs);
    };

    // Preserve the prototype so `instanceof` works on the bound constructor
    if (fn.prototype) {
        boundFunction.prototype = Object.create(fn.prototype);
    }

    return boundFunction;
};

// Basic binding:
function greetBound(greeting, punct) {
    return greeting + ", " + this.name + punct;
}
var rahul = { name: "Rahul" };
var sayHello = greetBound.myBind(rahul, "Hello");
console.log(sayHello("!"));  // "Hello, Rahul!"
console.log(sayHello("?")); // "Hello, Rahul?"

// Partial application — bind fixes some args, caller provides the rest:
function multiply(a, b) { return a * b; }
var double = multiply.myBind(null, 2);
var triple = multiply.myBind(null, 3);
console.log(double(5));  // 10
console.log(triple(5)); // 15

// bind + new: the bound `this` is ignored, the new object wins
function User(name) { this.name = name; }
var BoundUser = User.myBind({ name: "ignored" });
var u = new BoundUser("Priya");
console.log(u.name);              // "Priya" — new binding won
console.log(u instanceof User);   // true — prototype chain maintained

// ───────────────────────────────────────────────────────────────
// COMPARISON TABLE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Summary ===");
console.log([
    "call   → fn.myCall(ctx, a, b)     — invoke now, spread args",
    "apply  → fn.myApply(ctx, [a, b])  — invoke now, array args",
    "bind   → fn.myBind(ctx, a)        — return new fn, don't invoke",
].join("\n"));

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice ===");

// Q1: Borrow a method with call — Array.prototype.slice on an array-like
var arrLike = { 0: "a", 1: "b", 2: "c", length: 3 };
var sliced = Array.prototype.slice.myCall(arrLike, 1);
console.log("Q1:", sliced); // ["b", "c"]

// Q2: Partial application with bind
function power(base, exp) { return Math.pow(base, exp); }
// power.myBind(null, 2) fixes base=2: power(2, exp). Not used directly below.
var squareFn = power.myBind(null, 3); // fixes base=3 → squareFn(2) = power(3, 2) = 9
console.log("Q2:", squareFn(2)); // 9

// Q3: What does bind return? (function, not a value)
var bound = (function() { return 42; }).myBind(null);
console.log("Q3 type:", typeof bound);   // "function"
console.log("Q3 call:", bound());        // 42
