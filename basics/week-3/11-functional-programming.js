// ═══════════════════════════════════════════════════════════════
// MODULE 11: FUNCTIONAL PROGRAMMING PATTERNS
// Run: node 11-functional-programming.js
// ═══════════════════════════════════════════════════════════════
//
// Functional Programming (FP) = writing programs using pure functions
// and avoiding shared mutable state.
//
// Core ideas:
//   Pure functions    → same input, same output, no side effects
//   Immutability      → never mutate data; create new data instead
//   Higher-order fns  → functions that take/return other functions
//   Composition       → build complex behavior from small functions
//   Currying          → transform multi-arg functions into chains

// ───────────────────────────────────────────────────────────────
// 1. PURE FUNCTIONS
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Pure Functions ===");

// ❌ IMPURE — depends on external state AND has a side effect
let taxRate = 0.18;
function impureTotal(price) {
    console.log("fetching price"); // side effect
    return price + price * taxRate; // depends on external variable
}

// ✅ PURE — same input → same output, no side effects
function total(price, rate) {
    return +(price + price * rate).toFixed(2);
}

console.log(total(100, 0.18)); // always 118
console.log(total(100, 0.18)); // always 118

// Why pure functions matter:
//   - Easy to test (no setup needed)
//   - Cacheable (memoizable — same input → cache the output)
//   - Safe to run in parallel (no shared state)
//   - Easy to reason about

// ───────────────────────────────────────────────────────────────
// 2. IMMUTABILITY — create new, never mutate
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. Immutability ===");

const users = [
    { id: 1, name: "Sadik", age: 25 },
    { id: 2, name: "Priya", age: 22 },
];

// ❌ MUTATION (bad):
// users.push({ id: 3, name: "Amit" });
// users[0].age = 26;

// ✅ ADD — return new array:
const withAmit = [...users, { id: 3, name: "Amit", age: 28 }];

// ✅ UPDATE — map + spread:
const updatedUsers = users.map(u =>
    u.id === 1 ? { ...u, age: 26 } : u
);

// ✅ REMOVE — filter:
const withoutPriya = users.filter(u => u.id !== 2);

console.log("original:", users.map(u => u.age));     // [25, 22] — untouched
console.log("updated:",  updatedUsers.map(u => u.age)); // [26, 22]
console.log("added:",    withAmit.length);            // 3
console.log("removed:",  withoutPriya.length);        // 1

// ───────────────────────────────────────────────────────────────
// 3. MAP — transform each element
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. map ===");

const nums = [1, 2, 3, 4, 5];

console.log(nums.map(n => n * 2));        // [2, 4, 6, 8, 10]
console.log(nums.map(n => n ** 2));       // [1, 4, 9, 16, 25]
console.log(users.map(u => u.name));      // ["Sadik", "Priya"]

// map always returns a NEW array of the same length.
// The original is never modified.

// ───────────────────────────────────────────────────────────────
// 4. FILTER — keep elements that pass a test
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. filter ===");

console.log(nums.filter(n => n % 2 === 0));       // [2, 4]
console.log(nums.filter(n => n > 3));             // [4, 5]
console.log(users.filter(u => u.age >= 23));      // [{ id:1, Sadik, 25 }]

// filter always returns a NEW array, length 0..N.

// ───────────────────────────────────────────────────────────────
// 5. REDUCE — accumulate to a single value
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. reduce ===");

// Sum:
const sum = nums.reduce((acc, n) => acc + n, 0);
console.log("sum:", sum); // 15

// Product:
const product = nums.reduce((acc, n) => acc * n, 1);
console.log("product:", product); // 120

// Max:
const max = nums.reduce((m, n) => n > m ? n : m, -Infinity);
console.log("max:", max); // 5

// Build an object (group by):
const people = [
    { name: "Sadik",  dept: "Eng" },
    { name: "Priya",  dept: "Design" },
    { name: "Amit",   dept: "Eng" },
    { name: "Sara",   dept: "Design" },
];

const byDept = people.reduce((groups, person) => {
    const key = person.dept;
    groups[key] = groups[key] || [];
    groups[key].push(person.name);
    return groups;
}, {});

console.log("grouped:", byDept);
// { Eng: ["Sadik", "Amit"], Design: ["Priya", "Sara"] }

// Count occurrences:
const fruits = ["apple", "banana", "apple", "orange", "banana", "apple"];
const counts = fruits.reduce((acc, f) => {
    acc[f] = (acc[f] || 0) + 1;
    return acc;
}, {});
console.log("counts:", counts);
// { apple: 3, banana: 2, orange: 1 }

// Flatten nested arrays:
const nested = [[1, 2], [3, 4], [5]];
const flat = nested.reduce((acc, arr) => [...acc, ...arr], []);
console.log("flattened:", flat); // [1, 2, 3, 4, 5]

// ───────────────────────────────────────────────────────────────
// 6. CHAINING map / filter / reduce
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. Chaining ===");

const orders = [
    { id: 1, product: "Laptop",  price: 1000, qty: 2, active: true },
    { id: 2, product: "Phone",   price: 500,  qty: 1, active: false },
    { id: 3, product: "Tablet",  price: 300,  qty: 3, active: true },
    { id: 4, product: "Monitor", price: 400,  qty: 1, active: true },
];

const totalRevenue = orders
    .filter(o => o.active)                       // only active orders
    .map(o => ({ ...o, lineTotal: o.price * o.qty })) // add lineTotal
    .reduce((sum, o) => sum + o.lineTotal, 0);   // sum them up

console.log("total revenue:", totalRevenue); // (1000*2) + (300*3) + (400*1) = 3300

// ───────────────────────────────────────────────────────────────
// 7. FUNCTION COMPOSITION
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. Function Composition ===");

const add10 = x => x + 10;
const double = x => x * 2;
const subtract3 = x => x - 3;

// Manual: right to left (maths notation)
console.log(subtract3(double(add10(5)))); // add10→15, double→30, subtract3→27

// compose — applies functions RIGHT to LEFT:
function compose(...fns) {
    return x => fns.reduceRight((acc, fn) => fn(acc), x);
}

// pipe — applies functions LEFT to RIGHT (more intuitive to read):
function pipe(...fns) {
    return x => fns.reduce((acc, fn) => fn(acc), x);
}

const transform = pipe(add10, double, subtract3);
console.log(transform(5));  // 5+10=15, *2=30, -3=27

const transform2 = compose(subtract3, double, add10); // same order of operations
console.log(transform2(5)); // 27

// Build data processing pipelines:
const processOrders = pipe(
    orders => orders.filter(o => o.active),
    orders => orders.map(o => ({ ...o, tax: o.price * 0.18 })),
    orders => orders.map(o => `${o.product}: ₹${o.price + o.tax}`),
);
console.log(processOrders(orders));

// ───────────────────────────────────────────────────────────────
// 8. CURRYING
// ───────────────────────────────────────────────────────────────

console.log("\n=== 8. Currying ===");

// Transform f(a, b, c) → f(a)(b)(c)

// Manual currying:
function multiply(a) {
    return function (b) {
        return a * b;
    };
}
const triple = multiply(3);
const times10 = multiply(10);
console.log(triple(5), times10(7)); // 15 70

// Generic curry function:
function curry(fn) {
    return function curried(...args) {
        if (args.length >= fn.length) return fn(...args);
        return (...more) => curried(...args, ...more);
    };
}

function add3(a, b, c) { return a + b + c; }

const curriedAdd3 = curry(add3);
console.log(curriedAdd3(1)(2)(3));   // 6
console.log(curriedAdd3(1, 2)(3));   // 6
console.log(curriedAdd3(1)(2, 3));   // 6
console.log(curriedAdd3(1, 2, 3));   // 6

// Partial application — specialize a function:
const add5 = curriedAdd3(5);
const add5and10 = add5(10);
console.log(add5and10(3));  // 18
console.log(add5and10(7));  // 22

// Real-world: curried validator
function validate(schema) {
    return function (field) {
        return function (value) {
            const rule = schema[field];
            if (!rule) return true;
            if (rule.required && !value) return `${field} is required`;
            if (rule.min && value.length < rule.min)
                return `${field} must be at least ${rule.min} chars`;
            return true;
        };
    };
}

const validateUser2 = validate({
    name:  { required: true, min: 2 },
    email: { required: true },
});

const checkName  = validateUser2("name");
const checkEmail = validateUser2("email");

console.log(checkName(""));      // "name is required"
console.log(checkName("S"));     // "name must be at least 2 chars"
console.log(checkName("Sadik")); // true
console.log(checkEmail(""));     // "email is required"

// ───────────────────────────────────────────────────────────────
// 9. MEMOIZATION (pure function caching)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 9. Memoization ===");

function memoize(fn) {
    const cache = new Map();
    return function (...args) {
        const key = JSON.stringify(args);
        if (cache.has(key)) return cache.get(key);
        const result = fn(...args);
        cache.set(key, result);
        return result;
    };
}

// Expensive fibonacci without memoization:
function fib(n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}

// With memoization — the memoized version is used recursively:
const memoFib = memoize(function fib(n) {
    if (n <= 1) return n;
    return memoFib(n - 1) + memoFib(n - 2); // uses memoized self
});

console.log(memoFib(10)); // 55
console.log(memoFib(40)); // 102334155 — would be very slow without memo

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice ===");

// Q1: Filter odds, then square them:
const q1 = [1, 2, 3, 4, 5].filter(n => n % 2 !== 0).map(n => n * n);
console.log("Q1:", q1); // [1, 9, 25]

// Q2: reduce to sum values by category:
const data = [
    { cat: "A", val: 10 }, { cat: "B", val: 20 },
    { cat: "A", val: 30 }, { cat: "B", val: 40 },
];
const q2 = data.reduce((acc, item) => {
    acc[item.cat] = (acc[item.cat] || 0) + item.val;
    return acc;
}, {});
console.log("Q2:", q2); // { A: 40, B: 60 }

// Q3: pipe transform:
const q3 = pipe(x => x + 1, x => x * 3, x => x - 2)(5);
console.log("Q3:", q3); // 5→6→18→16

// Q4: Is this function pure? Why / why not?
let counter = 0;
function incrementAndLog(x) {
    counter++;           // side effect: modifies external state
    console.log(x);      // side effect: I/O
    return x + counter;  // depends on external state → NOT deterministic
}
// Answer: NOT pure.
// - Modifies external `counter` (side effect)
// - console.log (side effect)
// - Output depends on `counter` which changes across calls
console.log("Q4:", incrementAndLog(5), incrementAndLog(5)); // 6, 7 — different results!
