// ═══════════════════════════════════════════════════════════════
// TYPESCRIPT 01: FUNDAMENTALS
// Run: npx ts-node 01-fundamentals.ts
// ═══════════════════════════════════════════════════════════════
//
// TypeScript = JavaScript + Static Type System
//
//  • Superset of JavaScript (all JS is valid TS)
//  • Compiles to plain JavaScript
//  • Types are erased at runtime — ZERO runtime overhead
//  • Catches bugs at COMPILE TIME, not at runtime
//
// WHY USE IT?
//  1. Catch errors before code runs
//  2. Better IDE autocomplete and refactoring
//  3. Types serve as inline documentation
//  4. Safer team collaboration (types = contracts)

// ───────────────────────────────────────────────────────────────
// 1. The Problem TypeScript Solves
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Why TypeScript ===");

// JavaScript silently does unexpected things
function addJS(a: any, b: any) { return a + b; }
console.log(addJS("5", 3));   // "53" — string concat, not math!
console.log(addJS(null, 5));  // 5   — null coerced to 0
console.log(addJS({}, []));   // "[object Object]" — WAT?

// TypeScript catches this at compile time:
function addTS(a: number, b: number): number { return a + b; }
console.log(addTS(5, 3)); // 8 — always correct
// addTS("5", 3);         // ❌ Compile error: string not assignable to number

// ───────────────────────────────────────────────────────────────
// 2. Primitive Types
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. Primitive Types ===");

// string
const firstName: string = "Sadik";
const greeting: string = `Hello, ${firstName}`;
console.log(greeting);

// number — integers, floats, hex, binary, octal all use 'number'
const age: number       = 30;
const price: number     = 99.99;
const hex: number       = 0xff;
const binary: number    = 0b1010;
const octal: number     = 0o744;
console.log(hex, binary, octal); // 255, 10, 484

// boolean
const isActive: boolean   = true;
const hasPermission: boolean = false;
console.log(isActive, hasPermission);

// null & undefined — are separate types with strictNullChecks
const nullValue: null           = null;
const undefinedValue: undefined = undefined;

// Union with null (the idiomatic nullable type)
let maybeString: string | null = null;
maybeString = "hello";
console.log(maybeString);

// symbol — always unique
const sym1: symbol = Symbol("key");
const sym2: symbol = Symbol("key");
console.log(sym1 === sym2); // false — symbols are unique

// bigint — for numbers beyond Number.MAX_SAFE_INTEGER
const bigNum: bigint = 9007199254740991n;
const anotherBig: bigint = BigInt(100);
console.log(bigNum + anotherBig);

// ───────────────────────────────────────────────────────────────
// 3. Special Types
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. Special Types ===");

// any — turns off type checking. AVOID when possible.
let anything: any = 4;
anything = "string";   // ✅ no error
anything = false;      // ✅ no error
anything.nonExistent;  // ✅ no compile error — but crashes at runtime!

// unknown — type-safe alternative to any. PREFER over any.
let unknownVal: unknown = "hello";
unknownVal = 42;       // ✅ can be anything
// unknownVal.length;  // ❌ Error: must narrow first

if (typeof unknownVal === "number") {
    console.log("unknown as number:", unknownVal.toFixed(2));
}

// void — functions that don't return a value
function logMsg(msg: string): void {
    console.log("[LOG]", msg);
    // return; or nothing — both fine
}
logMsg("void example");

// never — functions that NEVER return (throw or infinite loop)
function throwError(message: string): never {
    throw new Error(message);
}

// never is also used for exhaustive checking:
type Shape = "circle" | "square" | "triangle";

function getArea(shape: Shape): number {
    switch (shape) {
        case "circle":   return Math.PI * 10 ** 2;
        case "square":   return 10 ** 2;
        case "triangle": return 0.5 * 10 * 10;
        default:
            // If you add a new shape without handling it,
            // TypeScript errors here:
            const _exhaustive: never = shape;
            throw new Error(`Unknown shape: ${_exhaustive}`);
    }
}
console.log("circle area:", getArea("circle").toFixed(2));

// ───────────────────────────────────────────────────────────────
// 4. Object Types
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. Object Types ===");

// Inline object type annotation
let person: { name: string; age: number } = { name: "Rahul", age: 30 };
console.log(person);

// Optional property (?)
let config: { host: string; port?: number } = { host: "localhost" };
// config.port is number | undefined

// Readonly property
let point: { readonly x: number; readonly y: number } = { x: 10, y: 20 };
// point.x = 5; // ❌ Error: Cannot assign to 'x' — it is read-only

// Index signature — dynamic keys
let dict: { [key: string]: number } = { apples: 3, bananas: 5 };
dict.cherries = 2; // ✅ valid new key
console.log(dict);

// ───────────────────────────────────────────────────────────────
// 5. Array Types
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Array Types ===");

const nums: number[]          = [1, 2, 3];
const strs: Array<string>     = ["a", "b", "c"]; // generic syntax
const mixed: (string | number)[] = [1, "two", 3];

const readOnly: readonly number[] = [1, 2, 3];
// readOnly.push(4); // ❌ Error

console.log(nums, strs, mixed);

// ───────────────────────────────────────────────────────────────
// 6. Tuple Types
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. Tuples ===");

// Fixed-length, fixed-type arrays
let coordinate: [number, number] = [10, 20];
let entry: [string, number] = ["Alice", 95];

// Named tuple elements (TypeScript 4.0+)
let record: [name: string, age: number, active: boolean] = ["Bob", 25, true];
const [rName, rAge, rActive] = record;
console.log(rName, rAge, rActive);

// Optional element
let maybe: [string, number?] = ["hello"];

// Rest elements in tuple
let csv: [string, ...number[]] = ["scores", 90, 85, 78];

// Readonly tuple
const immutable: readonly [string, number] = ["fixed", 42];
// immutable[0] = "other"; // ❌ Error

// ───────────────────────────────────────────────────────────────
// 7. Enums
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. Enums ===");

// Numeric enum (auto-increments from 0)
enum Direction { Up, Down, Left, Right }
console.log(Direction.Up, Direction[0]); // 0, "Up" — reverse mapping!

// Custom values
enum HttpStatus { OK = 200, NotFound = 404, Error = 500 }
console.log(HttpStatus.OK); // 200

// String enum — preferred for debugging (values are readable)
enum LogLevel { Debug = "DEBUG", Info = "INFO", Warn = "WARN", Error = "ERROR" }
console.log(LogLevel.Info); // "INFO"

// const enum — inlined at compile time, smaller output
const enum CardSuit { Hearts, Diamonds, Clubs, Spades }
const suit: CardSuit = CardSuit.Hearts; // compiled to: const suit = 0
console.log(suit); // 0

// ───────────────────────────────────────────────────────────────
// 8. Type Assertions
// ───────────────────────────────────────────────────────────────

console.log("\n=== 8. Type Assertions ===");

// "as" syntax — tell the compiler "trust me, I know the type"
// Does NOT change runtime value, only affects compile-time checking
const rawValue: unknown = "this is a string";
const strLen: number = (rawValue as string).length;
console.log("length:", strLen);

// Non-null assertion (!) — assert value is not null/undefined
function maybeNull(): string | null {
    return Math.random() > 0.5 ? "value" : null;
}
// If you're SURE the value isn't null:
// const definite = maybeNull()!;  // asserts non-null

// const assertion — freezes literal types
const config2 = { endpoint: "/api", method: "GET" } as const;
// config2.endpoint type is "/api" (literal), not string
// config2.method  type is "GET"  (literal), not string
console.log(config2.method); // "GET"

const ROLES = ["admin", "user", "guest"] as const;
type Role = typeof ROLES[number]; // "admin" | "user" | "guest"
const r: Role = "admin";
console.log(r);

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice ===");

// Q1: What's the difference between any and unknown?
// any    → turns off ALL type checking for that variable
// unknown → type-safe: must narrow before using methods/properties
// Rule: prefer unknown over any when you don't know the type

// Q2: When does TypeScript infer 'never'?
// - Return type of functions that always throw
// - Return type of infinite loops
// - Default case in exhaustive switch after all union members are handled
// - Intersection of incompatible types: string & number → never

// Q3: Fix this code:
function badLength(x: string | null): number {
    // return x.length;  // ❌ x could be null
    return x?.length ?? 0;  // ✅ optional chaining + nullish coalescing
}
console.log("Q3:", badLength("hello"), badLength(null)); // 5, 0

// Q4: What does 'as const' do?
const arr = [1, 2, 3] as const;
// Without as const: number[]
// With    as const: readonly [1, 2, 3] — tuple with literal types
// arr.push(4); // ❌ Error: Property 'push' does not exist on readonly
console.log("Q4 type is readonly tuple:", arr[0]); // 1

export {};
