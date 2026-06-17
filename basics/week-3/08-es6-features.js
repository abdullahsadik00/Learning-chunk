// ═══════════════════════════════════════════════════════════════
// MODULE 8: ES6+ CORE FEATURES
// Run: node 08-es6-features.js
// ═══════════════════════════════════════════════════════════════
//
// Key additions since ES6 (2015):
//   Destructuring, Spread/Rest, Template Literals,
//   Default Parameters, Optional Chaining (?.),
//   Nullish Coalescing (??), Logical Assignment,
//   Short-circuit evaluation, Modules (syntax overview)

// ───────────────────────────────────────────────────────────────
// 1. ARRAY DESTRUCTURING
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Array Destructuring ===");

const nums = [10, 20, 30, 40, 50];

const [first, second, third] = nums;
console.log(first, second, third); // 10 20 30

// Skipping elements:
const [a, , b, , c] = nums;
console.log(a, b, c); // 10 30 50

// Rest:
const [head, ...tail] = nums;
console.log(head);  // 10
console.log(tail);  // [20, 30, 40, 50]

// Default values (used only when element is undefined):
const [x = 99, y = 99, z = 99] = [1, 2];
console.log(x, y, z); // 1 2 99

// Swap variables — no temp variable needed:
let p = 1, q = 2;
[p, q] = [q, p];
console.log(p, q); // 2 1

// Function returning multiple values:
function minMax(arr) {
    return [Math.min(...arr), Math.max(...arr)];
}
const [min, max] = minMax([5, 2, 8, 1, 9]);
console.log(min, max); // 1 9

// ───────────────────────────────────────────────────────────────
// 2. OBJECT DESTRUCTURING
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. Object Destructuring ===");

const person = {
    name: "Sadik",
    age: 25,
    city: "Mumbai",
    job: { title: "Developer", company: "TechCorp" },
};

// Basic:
const { name, age } = person;
console.log(name, age); // Sadik 25

// Rename (alias):
const { name: fullName, age: years } = person;
console.log(fullName, years); // Sadik 25

// Default value:
const { name: n, country = "India" } = person;
console.log(n, country); // Sadik India

// Nested:
const { job: { title, company } } = person;
console.log(title, company); // Developer TechCorp

// Rest in objects:
const { city, ...rest } = person;
console.log(city);  // Mumbai
console.log(rest);  // { name: "Sadik", age: 25, job: {...} }

// In function parameters:
function greet({ name: nm, country: ct = "India" }) {
    console.log(`Hello ${nm} from ${ct}`);
}
greet({ name: "Priya" }); // Hello Priya from India

// ───────────────────────────────────────────────────────────────
// 3. SPREAD OPERATOR (...)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. Spread Operator ===");

// Array spreading:
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const combined = [...arr1, 0, ...arr2];
console.log(combined); // [1, 2, 3, 0, 4, 5, 6]

// Shallow clone (avoids mutation):
const original = [1, 2, 3];
const clone = [...original];
clone.push(99);
console.log(original); // [1, 2, 3] — unchanged
console.log(clone);    // [1, 2, 3, 99]

// Object spreading:
const defaults = { theme: "dark", lang: "en", size: 14 };
const overrides = { theme: "light", size: 16 };
const config = { ...defaults, ...overrides };
console.log(config); // { theme: "light", lang: "en", size: 16 }
// Later spread wins for duplicate keys.

// Shallow clone + override:
const updated = { ...person, age: 26 }; // doesn't mutate original
console.log(person.age);  // 25 — unchanged
console.log(updated.age); // 26

// Function calls:
function sum3(a, b, c) { return a + b + c; }
console.log(sum3(...[10, 20, 30])); // 60

// ───────────────────────────────────────────────────────────────
// 4. REST OPERATOR (...) — same syntax, opposite role
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. Rest Operator ===");

// Collects remaining arguments into an array:
function sum(...numbers) {
    return numbers.reduce((acc, n) => acc + n, 0);
}
console.log(sum(1, 2, 3));       // 6
console.log(sum(1, 2, 3, 4, 5)); // 15

// First param + rest:
function log(level, ...messages) {
    console.log(`[${level}]`, messages.join(" | "));
}
log("INFO", "Server started", "Port 3000"); // [INFO] Server started | Port 3000

// Spread vs Rest rule of thumb:
//   Spread → IN a call or literal (expanding)
//   Rest   → IN a parameter list or destructuring (collecting)

// ───────────────────────────────────────────────────────────────
// 5. TEMPLATE LITERALS
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Template Literals ===");

const user = { name: "Sadik", age: 25 };

// Embedding expressions:
console.log(`Hello, ${user.name}! You are ${user.age} years old.`);
console.log(`Is adult: ${user.age >= 18 ? "Yes" : "No"}`);
console.log(`Next year: ${user.age + 1}`);

// Multi-line (preserves newlines):
const address = `
  Name: ${user.name}
  Age:  ${user.age}
`.trim();
console.log(address);

// Tagged template literals — custom processing:
function highlight(strings, ...vals) {
    return strings.reduce((acc, str, i) =>
        acc + str + (vals[i] !== undefined ? `[${vals[i]}]` : ""), "");
}
const score = 95;
console.log(highlight`Player ${user.name} scored ${score} points`);
// "Player [Sadik] scored [95] points"

// ───────────────────────────────────────────────────────────────
// 6. DEFAULT PARAMETERS
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. Default Parameters ===");

function greetUser(name = "Guest", greeting = "Hello") {
    console.log(`${greeting}, ${name}!`);
}
greetUser();                  // Hello, Guest!
greetUser("Sadik");           // Hello, Sadik!
greetUser("Sadik", "Namaste"); // Namaste, Sadik!
greetUser(undefined, "Hi");   // Hi, Guest! — undefined triggers default
greetUser(null, "Hi");        // Hi, null   — null does NOT trigger default

// Default can use earlier params:
function createRange(start, end = start + 10) {
    return [start, end];
}
console.log(createRange(5));      // [5, 15]
console.log(createRange(5, 20)); // [5, 20]

// ───────────────────────────────────────────────────────────────
// 7. OPTIONAL CHAINING (?.)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. Optional Chaining (?.) ===");

const userData = {
    profile: {
        address: { city: "Mumbai" },
    },
    greet() { return "Hello!"; },
};
const empty = null;

// Without ?. you'd get TypeError on null/undefined:
console.log(userData?.profile?.address?.city);   // "Mumbai"
console.log(userData?.profile?.phone?.number);   // undefined (no error)
console.log(empty?.anything?.deep);              // undefined (no error)

// With arrays:
const arr = [{ id: 1 }, { id: 2 }];
console.log(arr?.[0]?.id);   // 1
console.log(arr?.[9]?.id);   // undefined

// With function calls:
console.log(userData.greet?.());    // "Hello!"
console.log(userData.missing?.());  // undefined (no error)

// ───────────────────────────────────────────────────────────────
// 8. NULLISH COALESCING (??) vs OR (||)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 8. Nullish Coalescing (??) ===");

// || triggers on ANY falsy: false, 0, "", null, undefined, NaN
// ?? triggers ONLY on null or undefined

const count = 0;
console.log(count || 10); // 10 — BUG: 0 is a valid value but treated as falsy
console.log(count ?? 10); // 0  — CORRECT: 0 is not null/undefined

console.log("" || "default");   // "default" — empty string is falsy
console.log("" ?? "default");   // ""         — empty string is not null/undefined

console.log(null ?? "fallback");      // "fallback"
console.log(undefined ?? "fallback"); // "fallback"
console.log(false ?? "fallback");     // false — false is not null/undefined

// Combine with optional chaining:
const settings = { timeout: 0, retries: null };
const timeout = settings?.timeout ?? 5000;  // 0 (not null/undefined)
const retries = settings?.retries ?? 3;     // 3 (null → use default)
console.log(timeout, retries); // 0 3

// ───────────────────────────────────────────────────────────────
// 9. LOGICAL ASSIGNMENT OPERATORS (ES2021)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 9. Logical Assignment ===");

let val1 = null;
let val2 = "existing";
let val3 = 0;

// ??= (assign only if null/undefined):
val1 ??= "default";  console.log(val1); // "default"
val2 ??= "default";  console.log(val2); // "existing" — not null/undefined
val3 ??= "default";  console.log(val3); // 0 — not null/undefined

// ||= (assign only if falsy):
let a2 = 0;
let b2 = "hello";
a2 ||= "default"; console.log(a2); // "default" — 0 is falsy
b2 ||= "default"; console.log(b2); // "hello"   — truthy, not replaced

// &&= (assign only if truthy):
let c2 = "truthy";
let d2 = null;
c2 &&= "updated"; console.log(c2); // "updated" — was truthy
d2 &&= "updated"; console.log(d2); // null      — was falsy, left alone

// ───────────────────────────────────────────────────────────────
// 10. MODULES — syntax overview (can't run as modules in this file,
//     but this is the syntax used in React/Node ES module projects)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 10. Modules (syntax overview) ===");

// Named exports (multiple per file):
//   export function add(a, b) { return a + b; }
//   export const PI = 3.14;
//   export class User { ... }

// Default export (one per file):
//   export default function main() { ... }

// Importing:
//   import { add, PI } from './math.js';       // named
//   import main from './main.js';              // default
//   import * as math from './math.js';         // namespace
//   import main, { add } from './utils.js';    // both

// Dynamic import (lazy loading):
//   const { default: fn } = await import('./heavy.js');

// CommonJS (Node.js default without "type":"module"):
//   const { add } = require('./math');
//   module.exports = { add };

console.log("(Modules run in their own scope — no global pollution)");
console.log("(Use 'type': 'module' in package.json to enable ESM in Node)");

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice ===");

// Q1: Array destructuring with rest and default
const [f, s = 99, ...remaining] = [1, undefined, 3, 4];
console.log(f, s, remaining); // 1 99 [3, 4]

// Q2: Object spread merge (later wins)
const base = { a: 1, b: 2, c: 3 };
const patch = { b: 20, d: 40 };
const merged = { ...base, ...patch, a: 100 };
console.log(merged); // { a: 100, b: 20, c: 3, d: 40 }
const { a: aVal, ...withoutA } = merged;
console.log(aVal, withoutA); // 100, { b: 20, c: 3, d: 40 }

// Q3: Optional chaining + nullish coalescing
const u = null;
console.log(u?.name ?? "Anonymous"); // "Anonymous"
console.log(u?.age ?? 0);            // 0
console.log(u?.greet?.() ?? "hi");   // "hi"

// Q4: ?? vs ||
console.log(0 ?? "default");    // 0
console.log(0 || "default");    // "default"
console.log("" ?? "default");   // ""
console.log("" || "default");   // "default"
