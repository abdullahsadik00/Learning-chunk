// ═══════════════════════════════════════════════════════════════
// PRACTICE: FUNCTIONAL PROGRAMMING
// Run: node 11-functional-programming.practice.js
// ═══════════════════════════════════════════════════════════════

function check(label, got, expected) {
    const pass = JSON.stringify(got) === JSON.stringify(expected);
    console.log(pass
        ? `✅  ${label}`
        : `❌  ${label}\n    got:      ${JSON.stringify(got)}\n    expected: ${JSON.stringify(expected)}`
    );
}

// ─── PREDICT 1: pure vs impure ────────────────────────────────
console.log("\n── Predict 1 ──");
// A PURE function: same input → same output, no side effects.
// Label each function below as PURE or IMPURE, and explain why.

let tax = 0.18;

function calcTotal(price)       { return price + price * tax; }
function calcTotalPure(p, rate) { return p + p * rate; }
function greetUser(name)        { console.log("Hello, " + name); return name; }
function double(n)              { return n * 2; }

// calcTotal is ___  because: ___
// calcTotalPure is ___ because: ___
// greetUser is ___ because: ___
// double is ___ because: ___

// ─── PREDICT 2: map / filter / reduce chain ───────────────────
console.log("\n── Predict 2 ──");
// Trace the result step by step.  Output: ???

const orders = [
    { product: "Laptop",  price: 1000, qty: 2, active: true  },
    { product: "Phone",   price: 500,  qty: 1, active: false },
    { product: "Tablet",  price: 300,  qty: 3, active: true  },
    { product: "Monitor", price: 400,  qty: 1, active: true  },
];

const result = orders
    .filter(o => o.active)
    .map(o => o.price * o.qty)
    .reduce((sum, v) => sum + v, 0);

console.log(result);   // ???

// ─── IMPLEMENT 1: map / filter / reduce from a description ───
console.log("\n── Implement 1 ──");
// Given an array of students, write a single chain that:
//   1. Keeps only students who passed (score >= 50)
//   2. Transforms each to { name, grade } where grade = score >= 70 ? "A" : "B"
//   3. Sorts by name alphabetically (use .sort after the chain)
// No for-loops allowed.

const students = [
    { name: "Zara",  score: 80 },
    { name: "Amit",  score: 40 },
    { name: "Priya", score: 65 },
    { name: "Rahul", score: 90 },
    { name: "Sara",  score: 45 },
];

const gradedStudents = students
    // YOUR CODE — filter, map, sort chain
    ;

check("only passing students",   gradedStudents.length, 3);
check("first student (sorted)",  gradedStudents[0], { name: "Priya", grade: "B" });
check("second student",          gradedStudents[1], { name: "Rahul", grade: "A" });
check("third student",           gradedStudents[2], { name: "Zara",  grade: "A" });

// ─── IMPLEMENT 2: reduce to build an object ───────────────────
console.log("\n── Implement 2 ──");
// Use reduce to group these transactions by category.
// Result: { Food: 55, Transport: 40, Entertainment: 120 }

const transactions = [
    { cat: "Food",          amount: 30 },
    { cat: "Transport",     amount: 15 },
    { cat: "Food",          amount: 25 },
    { cat: "Entertainment", amount: 60 },
    { cat: "Transport",     amount: 25 },
    { cat: "Entertainment", amount: 60 },
];

const grouped = transactions.reduce((acc, tx) => {
    // YOUR CODE
    return acc;
}, {});

check("Food total",          grouped.Food,          55);
check("Transport total",     grouped.Transport,     40);
check("Entertainment total", grouped.Entertainment, 120);

// ─── IMPLEMENT 3: pipe ────────────────────────────────────────
console.log("\n── Implement 3 ──");
// Implement pipe(...fns).
// Returns a function that passes its input through each fn left to right.
// pipe(f, g, h)(x) === h(g(f(x)))

function pipe(...fns) {
    // YOUR CODE — use reduce
    return (x) => x; // stub: passes through unchanged
}

const pipeTransform = pipe(
    x => x + 1,       // 5 → 6
    x => x * 3,       // 6 → 18
    x => x - 2,       // 18 → 16
);

check("pipe(add1, mul3, sub2)(5)", pipeTransform(5), 16);
check("pipe with 2 fns",          pipe(x => x * 2, x => x + 10)(5), 20);
check("pipe with 1 fn",           pipe(x => x ** 2)(4), 16);

// ─── IMPLEMENT 4: curry ───────────────────────────────────────
console.log("\n── Implement 4 ──");
// Implement curry(fn).
// Returns a curried version — you can call it with any number of args
// at a time until all args are satisfied.
// curry(f)(a)(b)(c) === f(a, b, c)
// curry(f)(a, b)(c) === f(a, b, c)

function curry(fn) {
    // YOUR CODE
    // Hint: check if enough args collected; if yes, call fn, else return another function.
    return function curried(...args) { return fn(...args); }; // stub: no partial application
}

function add(a, b, c) { return a + b + c; }
const curriedAdd = curry(add);

check("all at once",       curriedAdd(1, 2, 3),    6);
try { check("one by one",  curriedAdd(1)(2)(3),    6); }
catch(e) { console.log("❌  one by one threw:", e.message); }
try { check("two then one",curriedAdd(1, 2)(3),    6); }
catch(e) { console.log("❌  two then one threw:", e.message); }
try { check("one then two",curriedAdd(1)(2, 3),    6); }
catch(e) { console.log("❌  one then two threw:", e.message); }

try {
    const add10 = curriedAdd(10);
    check("partial application", add10(5)(3), 18);
} catch(e) { console.log("❌  partial application threw:", e.message); }

// ─── IMPLEMENT 5: immutable update helpers ───────────────────
console.log("\n── Implement 5 ──");
// Implement these three pure update functions. NO mutation allowed.
// Each must return a NEW array/object; the original must be unchanged.

const users = [
    { id: 1, name: "Sadik", age: 25 },
    { id: 2, name: "Priya", age: 22 },
    { id: 3, name: "Amit",  age: 28 },
];

// addUser(arr, user) → new array with user appended
function addUser(arr, user) {
    // YOUR CODE
    return arr; // stub: returns original (mutate-free but wrong length)
}

// removeUser(arr, id) → new array without the user with that id
function removeUser(arr, id) {
    // YOUR CODE
    return arr; // stub
}

// updateUser(arr, id, changes) → new array with that user's fields merged
function updateUser(arr, id, changes) {
    // YOUR CODE
    return arr; // stub
}

const withKaran = addUser(users, { id: 4, name: "Karan", age: 30 });
check("addUser length",     withKaran.length, 4);
check("original unchanged", users.length, 3);

const without2 = removeUser(users, 2);
check("removeUser length",      without2.length, 2);
check("removed correct user",   without2.find(u => u.id === 2), undefined);

const aged = updateUser(users, 1, { age: 26 });
check("updateUser age changed",   aged.find(u => u.id === 1).age, 26);
check("updateUser name unchanged",aged.find(u => u.id === 1).name, "Sadik");
check("original user age still 25", users.find(u => u.id === 1).age, 25);
