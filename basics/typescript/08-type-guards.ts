// ═══════════════════════════════════════════════════════════════
// TYPESCRIPT 08: TYPE GUARDS & NARROWING
// Run: npx ts-node 08-type-guards.ts
// ═══════════════════════════════════════════════════════════════
//
// TYPE NARROWING — TypeScript uses control-flow analysis to track
// what type a variable can be at each point in the code.
//
// NARROWING TECHNIQUES:
//  • typeof       — primitive type check
//  • instanceof   — class/constructor check
//  • in operator  — property existence check
//  • Discriminated unions — tag-based narrowing
//  • User-defined type guards — custom 'is' predicates
//  • Assertion functions  — 'asserts value is T'
//  • Truthiness narrowing
//  • Equality narrowing
//  • Control-flow analysis (assignments, early returns)

// ───────────────────────────────────────────────────────────────
// 1. typeof Type Guard
// ───────────────────────────────────────────────────────────────

console.log("=== 1. typeof ===");

function processValue(v: string | number | boolean): string {
    if (typeof v === "string")  return v.toUpperCase();     // string here
    if (typeof v === "number")  return v.toFixed(2);        // number here
    return v ? "YES" : "NO";                                // boolean here
}

console.log(processValue("hello"), processValue(3.14159), processValue(true));

// typeof works for: string, number, boolean, bigint, symbol, object, function, undefined
function mystery(x: string | number | null | undefined): number {
    if (x == null) return 0;            // null or undefined
    if (typeof x === "string") return x.length;
    return x;                           // must be number here
}
console.log(mystery("hello"), mystery(42), mystery(null), mystery(undefined));

// ───────────────────────────────────────────────────────────────
// 2. instanceof Type Guard
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. instanceof ===");

class DateRange {
    constructor(public start: Date, public end: Date) {}
    days(): number {
        return Math.ceil((this.end.getTime() - this.start.getTime()) / 86400000);
    }
}

class SingleDate {
    constructor(public date: Date) {}
    label(): string { return this.date.toDateString(); }
}

type DateInput = DateRange | SingleDate | Date;

function formatDateInput(input: DateInput): string {
    if (input instanceof DateRange) {
        return `Range: ${input.days()} days`;
    }
    if (input instanceof SingleDate) {
        return `Single: ${input.label()}`;
    }
    return `Date: ${input.toDateString()}`; // must be Date here
}

console.log(formatDateInput(new DateRange(new Date("2024-01-01"), new Date("2024-01-31"))));
console.log(formatDateInput(new SingleDate(new Date("2024-06-17"))));
console.log(formatDateInput(new Date("2024-12-25")));

// ───────────────────────────────────────────────────────────────
// 3. 'in' Operator Type Guard
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. in operator ===");

interface Fish  { swim(): void; }
interface Bird2 { fly(): void;  }
interface Duck  extends Fish, Bird2 { quack(): void; }

type Creature = Fish | Bird2;

function makeMove(creature: Creature): void {
    if ("swim" in creature && "fly" in creature) {
        (creature as Duck).quack?.();
        console.log("  duck: swims and flies");
    } else if ("swim" in creature) {
        creature.swim();
        console.log("  fish: swims");
    } else {
        creature.fly();
        console.log("  bird: flies");
    }
}

makeMove({ swim: () => {} });                             // fish
makeMove({ fly:  () => {} });                             // bird
makeMove({ swim: () => {}, fly: () => {}, quack: () => {} } as Duck); // duck

// ───────────────────────────────────────────────────────────────
// 4. Discriminated Unions (Tagged Unions)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. Discriminated Unions ===");

// Every member has a LITERAL type discriminant (e.g. 'type' or 'kind')
interface CircleShape  { kind: "circle";    radius: number; }
interface SquareShape  { kind: "square";    side: number; }
interface RectShape    { kind: "rectangle"; width: number; height: number; }

type Shape = CircleShape | SquareShape | RectShape;

function getArea(shape: Shape): number {
    switch (shape.kind) {
        case "circle":    return Math.PI * shape.radius ** 2;
        case "square":    return shape.side ** 2;
        case "rectangle": return shape.width * shape.height;
        default:
            // Exhaustiveness check — if you add a new shape without
            // handling it here, TypeScript errors:
            const _check: never = shape;
            throw new Error(`Unhandled shape: ${JSON.stringify(_check)}`);
    }
}

console.log("circle:", getArea({ kind: "circle",    radius: 5 }).toFixed(2));
console.log("square:", getArea({ kind: "square",    side: 4 }));
console.log("rect:  ", getArea({ kind: "rectangle", width: 3, height: 7 }));

// Fetch state machine using discriminated unions
interface IdleState    { status: "idle"; }
interface LoadingState { status: "loading"; startedAt: Date; }
interface SuccessState<T> { status: "success"; data: T; }
interface ErrorState   { status: "error"; error: Error; retries: number; }

type FetchState<T> = IdleState | LoadingState | SuccessState<T> | ErrorState;

function renderState<T>(state: FetchState<T>): string {
    switch (state.status) {
        case "idle":    return "Ready";
        case "loading": return `Loading since ${state.startedAt.toISOString()}`;
        case "success": return `Data: ${JSON.stringify(state.data)}`;
        case "error":   return `Error: ${state.error.message} (retry #${state.retries})`;
    }
}

console.log(renderState<number>({ status: "idle" }));
console.log(renderState<number>({ status: "loading", startedAt: new Date() }));
console.log(renderState<number>({ status: "success", data: 42 }));
console.log(renderState<number>({ status: "error",   error: new Error("timeout"), retries: 2 }));

// ───────────────────────────────────────────────────────────────
// 5. User-Defined Type Guards (type predicates)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. User-Defined Type Guards ===");

// Return type 'value is T' — TypeScript narrows based on the result
function isString(value: unknown): value is string {
    return typeof value === "string";
}

function isNumber(value: unknown): value is number {
    return typeof value === "number" && !isNaN(value);
}

function processInput(input: unknown): string {
    if (isString(input))  return input.toUpperCase();
    if (isNumber(input))  return input.toFixed(2);
    return String(input);
}

console.log(processInput("hello"), processInput(3.14), processInput(true));

// Complex type guard for an API response
interface ApiUser {
    id: number;
    name: string;
    email: string;
}

function isApiUser(value: unknown): value is ApiUser {
    return (
        typeof value === "object" &&
        value !== null &&
        "id" in value && typeof (value as ApiUser).id === "number" &&
        "name" in value && typeof (value as ApiUser).name === "string" &&
        "email" in value && typeof (value as ApiUser).email === "string"
    );
}

const raw: unknown = { id: 1, name: "Alice", email: "a@b.com" };
if (isApiUser(raw)) {
    console.log("valid user:", raw.name.toUpperCase()); // TypeScript knows: ApiUser
}

// Array type guard
function isStringArray(arr: unknown): arr is string[] {
    return Array.isArray(arr) && arr.every(item => typeof item === "string");
}

const data: unknown = ["hello", "world"];
if (isStringArray(data)) {
    console.log("strings:", data.join(", ").toUpperCase()); // TypeScript knows: string[]
}

// ───────────────────────────────────────────────────────────────
// 6. Assertion Functions
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. Assertion Functions ===");

// 'asserts value is T' — narrows type after the function returns
// If the assertion fails, the function throws

function assertString(value: unknown): asserts value is string {
    if (typeof value !== "string") {
        throw new TypeError(`Expected string, got ${typeof value}`);
    }
}

function assertDefined<T>(value: T | null | undefined, name = "value"): asserts value is T {
    if (value === null || value === undefined) {
        throw new Error(`${name} must not be null or undefined`);
    }
}

function processData(raw: unknown): void {
    assertString(raw);
    // After this point, TypeScript KNOWS raw is string
    console.log("processed:", raw.toUpperCase());
}

processData("hello");
try {
    processData(42);
} catch (e: any) {
    console.log("assertion error:", e.message);
}

// ───────────────────────────────────────────────────────────────
// 7. Truthiness and Equality Narrowing
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. Truthiness & Equality ===");

// Truthiness — checks if value is truthy
function optionalGreet(name: string | null | undefined): string {
    if (name) {
        return `Hello, ${name}`;   // name is string here (truthy)
    }
    return "Hello, stranger";
}
console.log(optionalGreet("Alice"), optionalGreet(null));

// ⚠️ Beware falsy values!
function doubleIfNumber(n: number | null): number {
    if (n !== null) return n * 2;   // better than `if (n)` — won't skip 0
    return 0;
}
console.log(doubleIfNumber(0),  doubleIfNumber(5), doubleIfNumber(null));
// 0, 10, 0  — correctly handles 0

// Equality narrowing
function equal(a: string | number, b: string | boolean): void {
    if (a === b) {
        // Both must be string (only common type that satisfies both)
        console.log("equal strings:", a.toUpperCase(), b.toUpperCase());
    }
}
equal("hello", "hello");
equal(42, true);

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice ===");

// Q1: Write a type guard that checks if something is a non-empty array
function isNonEmptyArray<T>(arr: T | T[]): arr is T[] {
    return Array.isArray(arr) && arr.length > 0;
}
console.log("Q1:", isNonEmptyArray([1, 2, 3])); // true
console.log("Q1:", isNonEmptyArray([]));          // false
console.log("Q1:", isNonEmptyArray("hello"));     // false

// Q2: Discriminated union state transition
type TrafficLight = "red" | "yellow" | "green";
function nextLight(current: TrafficLight): TrafficLight {
    switch (current) {
        case "red":    return "green";
        case "green":  return "yellow";
        case "yellow": return "red";
    }
}
let light: TrafficLight = "red";
console.log("Q2 lights:", light, "→", nextLight(light), "→", nextLight(nextLight(light)));

// Q3: What type is `x` in the default case?
function processUnion(x: "a" | "b" | "c"): void {
    if (x === "a") return;
    if (x === "b") return;
    // x is now "c" — TypeScript knows it's the only remaining possibility
    const onlyC: "c" = x;
    console.log("Q3: x is exactly:", onlyC);
}
processUnion("c");

export {};
