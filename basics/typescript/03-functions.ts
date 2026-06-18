// ═══════════════════════════════════════════════════════════════
// TYPESCRIPT 03: FUNCTIONS
// Run: npx ts-node 03-functions.ts
// ═══════════════════════════════════════════════════════════════
//
// KEY CONCEPTS:
//  • Function type annotations (params + return)
//  • Optional, default, rest parameters
//  • Function overloads — same name, different signatures
//  • Function type expressions and call signatures
//  • Generic functions — preserve types across calls
//  • this parameter — explicit context typing

// ───────────────────────────────────────────────────────────────
// 1. Function Type Annotations
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Function Annotations ===");

// Function declaration
function add(a: number, b: number): number {
    return a + b;
}

// Arrow function
const subtract = (a: number, b: number): number => a - b;

// Return type inferred (TypeScript figures it out)
const multiply = (a: number, b: number) => a * b; // returns number

console.log(add(5, 3), subtract(5, 3), multiply(5, 3));

// void — no return value
function log(message: string): void {
    console.log("[LOG]", message);
}

// never — never returns (always throws or loops forever)
function fail(msg: string): never {
    throw new Error(msg);
}

log("example");

// ───────────────────────────────────────────────────────────────
// 2. Optional, Default, Rest Parameters
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. Optional / Default / Rest ===");

// Optional parameter — must come AFTER required params
function greet(name: string, greeting?: string): string {
    return `${greeting ?? "Hello"}, ${name}!`;
}
console.log(greet("Rahul"));          // "Hello, Rahul!"
console.log(greet("Rahul", "Namaste")); // "Namaste, Rahul!"

// Default parameter — provides fallback value
function createUser(name: string, role: string = "user", active: boolean = true) {
    return { name, role, active };
}
console.log(createUser("Alice"));                    // role="user", active=true
console.log(createUser("Bob", undefined, false));    // role="user" (default), active=false
console.log(createUser("Carol", "admin"));

// Rest parameter — typed as array
function sum(...nums: number[]): number {
    return nums.reduce((acc, n) => acc + n, 0);
}
console.log("sum:", sum(1, 2, 3, 4, 5));

// Mixed: required + rest
function tagged(tag: string, ...items: string[]): string {
    return items.map(i => `[${tag}] ${i}`).join(", ");
}
console.log(tagged("INFO", "started", "running", "done"));

// ───────────────────────────────────────────────────────────────
// 3. Function Type Expressions
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. Function Types ===");

// Type alias for a function signature
type MathOp = (a: number, b: number) => number;

const divide: MathOp = (a, b) => a / b;
const modulo: MathOp = (a, b) => a % b;

// Higher-order function — function that takes another function
function applyTwice(fn: MathOp, a: number, b: number): number {
    return fn(fn(a, b), b);
}
console.log("applyTwice add:", applyTwice(add, 5, 3)); // add(add(5,3), 3) = 11

// Callable interface (function with extra properties)
interface Formatter {
    (value: string): string;
    version: string;
}

const uppercase: Formatter = Object.assign(
    (v: string) => v.toUpperCase(),
    { version: "1.0" }
);
console.log(uppercase("hello"), uppercase.version);

// ───────────────────────────────────────────────────────────────
// 4. Function Overloads
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. Function Overloads ===");

// Overload SIGNATURES (appear before the implementation)
function reverse(value: string): string;
function reverse(value: number[]): number[];
// Implementation signature — not callable directly
function reverse(value: string | number[]): string | number[] {
    if (typeof value === "string") {
        return value.split("").reverse().join("");
    }
    return value.slice().reverse();
}

console.log(reverse("hello"));          // "olleh"   — TypeScript knows: string
console.log(reverse([1, 2, 3, 4, 5])); // [5,4,3,2,1] — TypeScript knows: number[]

// DOM-specific overload example (for illustration — browser only)
// function createElement(tag: "a"): HTMLAnchorElement;
// function createElement(tag: "canvas"): HTMLCanvasElement;
// function createElement(tag: string): HTMLElement;
// function createElement(tag: string): HTMLElement {
//     return document.createElement(tag);
// }

// Format overload (Node-compatible)
function format(value: Date): string;
function format(value: number): string;
function format(value: string): string;
function format(value: Date | number | string): string {
    if (value instanceof Date) return value.toISOString().split("T")[0];
    if (typeof value === "number") return `$${value.toFixed(2)}`;
    return value.trim().toLowerCase();
}

console.log(format(new Date("2024-01-15")));  // "2024-01-15"
console.log(format(99.999));                  // "$100.00"
console.log(format("  HELLO WORLD  "));        // "hello world"

// ───────────────────────────────────────────────────────────────
// 5. Generic Functions
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Generic Functions ===");

// T is a TYPE PARAMETER — inferred from the argument
function identity<T>(value: T): T {
    return value;
}

const s = identity("hello"); // T = string
const n = identity(42);      // T = number
const b = identity(true);    // T = boolean
console.log(s, n, b);

// Multiple type parameters
function pair<T, U>(first: T, second: U): [T, U] {
    return [first, second];
}
const p = pair("name", 30); // [string, number]
console.log("pair:", p);

// Generic constraint — T must have a 'length' property
interface Lengthwise { length: number; }

function logLength<T extends Lengthwise>(val: T): T {
    console.log("length:", val.length);
    return val;
}
logLength("hello");    // ✅ string has length
logLength([1, 2, 3]);  // ✅ array has length
// logLength(123);     // ❌ number doesn't have length

// keyof constraint — K must be a key of T
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
    return obj[key];
}

const user = { name: "Alice", age: 30, email: "a@b.com" };
console.log(getProperty(user, "name"));  // string
console.log(getProperty(user, "age"));   // number
// getProperty(user, "invalid");         // ❌ Error

// Generic with default type parameter
function createArray<T = string>(length: number, fill: T): T[] {
    return Array(length).fill(fill);
}
const strs = createArray(3, "x");     // string[]
const nums2 = createArray(3, 0);       // number[] (inferred)
console.log(strs, nums2);

// Generic arrow function (TSX files need trailing comma)
const identityArrow = <T,>(value: T): T => value;

// Async generic function
async function fetchData<T>(url: string): Promise<T> {
    // In real usage: const res = await fetch(url); return res.json() as T;
    // Simulated for demonstration:
    const fake: Record<string, unknown> = { id: 1, name: "Alice", url };
    return fake as T;
}

(async () => {
    interface FakeUser { id: number; name: string; url: string; }
    const fetched = await fetchData<FakeUser>("/api/user/1");
    console.log("fetched:", fetched.name);
})();

// ───────────────────────────────────────────────────────────────
// 6. this Parameter
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. this Parameter ===");

// Declare the expected 'this' type as the first parameter
interface Counter {
    count: number;
    increment(this: Counter): Counter;
    reset(this: Counter): Counter;
}

const counter: Counter = {
    count: 0,
    increment() { this.count++; return this; },
    reset()     { this.count = 0; return this; },
};

counter.increment().increment().increment();
console.log("count:", counter.count); // 3
counter.reset();
console.log("after reset:", counter.count); // 0

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice ===");

// Q1: Type a callback-based function
type NodeCallback<T> = (err: Error | null, data: T | null) => void;

function fakeRead<T>(path: string, callback: NodeCallback<T>): void {
    // simulate async read
    setTimeout(() => {
        if (path === "bad") callback(new Error("not found"), null);
        else callback(null, { path } as unknown as T);
    }, 0);
}
fakeRead<{ path: string }>("/etc/hosts", (err, data) => {
    if (err) console.log("Q1 err:", err.message);
    else     console.log("Q1 data:", data?.path);
});

// Q2: Type-safe compose
function compose<A, B, C>(f: (b: B) => C, g: (a: A) => B): (a: A) => C {
    return (a) => f(g(a));
}
const double = (x: number) => x * 2;
const addOne = (x: number) => x + 1;
const doubleAddOne = compose(addOne, double); // addOne(double(x))
console.log("Q2 compose:", doubleAddOne(5)); // double(5)=10, addOne(10)=11

// Q3: Overload — process(number) returns string, process(string) returns number
function process(value: number): string;
function process(value: string): number;
function process(value: number | string): string | number {
    if (typeof value === "number") return String(value);
    return Number(value);
}
console.log("Q3:", process(42), process("99")); // "42", 99

export {};
