// ═══════════════════════════════════════════════════════════════
// TYPESCRIPT 02: TYPE SYSTEM DEEP DIVE
// Run: npx ts-node 02-type-system.ts
// ═══════════════════════════════════════════════════════════════
//
// KEY CONCEPTS:
//  • Type Annotations — you explicitly declare the type
//  • Type Inference   — TypeScript figures it out automatically
//  • Union  (|)       — type can be A OR B
//  • Intersection (&) — type must be A AND B
//  • Literal types    — exact value as a type
//  • Type alias (type) vs Interface — when to use which

// ───────────────────────────────────────────────────────────────
// 1. Type Inference
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Type Inference ===");

// let — infers widened type
let inferredStr = "hello";    // string
let inferredNum = 42;          // number
let inferredBool = true;       // boolean
let inferredArr = [1, 2, 3];  // number[]

// const — infers narrowed literal type
const constStr = "hello";   // "hello" (string literal)
const constNum = 42;         // 42      (numeric literal)

// Object inference — keys widened, not literal
const person = { name: "John", age: 30 };
// type: { name: string; age: number }
// name is NOT "John" — objects widen by default

// Contextual typing — TypeScript infers from context
const nums = [1, 2, 3];
const doubled = nums.map(n => n * 2); // n inferred as number

// Best common type — TypeScript picks the union
const mixed = [1, "two", true]; // (string | number | boolean)[]

// When to annotate explicitly:
// 1. Function parameters (always)
// 2. When inference is too broad
// 3. Delayed initialization
let userId: string; // annotate when initializing later
userId = "user_123";

console.log(inferredStr, constStr, userId);

// ───────────────────────────────────────────────────────────────
// 2. Union Types (|)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. Union Types ===");

// "can be A or B"
type StringOrNumber = string | number;

let val: StringOrNumber = "hello";
val = 42; // ✅ also fine

// Union in function params
function printId(id: string | number): void {
    console.log("ID:", id);
}
printId(101);
printId("usr_1");

// Narrowing required before accessing type-specific members
function getLength(v: string | number): number {
    if (typeof v === "string") {
        return v.length; // TypeScript knows v is string here
    }
    return String(v).length;
}
console.log("lengths:", getLength("hello"), getLength(12345));

// Union of literal types (very powerful)
type Status = "pending" | "approved" | "rejected";
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

function request(method: HttpMethod, url: string): void {
    console.log(`${method} ${url}`);
}
request("GET", "/api/users");
// request("PATCH", "/api"); // ❌ Error: "PATCH" not in union

// Union of object types
interface Bird { type: "bird"; flySpeed: number; }
interface Fish { type: "fish"; swimSpeed: number; }
type Animal = Bird | Fish;

function getSpeed(animal: Animal): number {
    if (animal.type === "bird") return animal.flySpeed;
    return animal.swimSpeed;
}
console.log("speed:", getSpeed({ type: "bird", flySpeed: 120 }));

// ───────────────────────────────────────────────────────────────
// 3. Intersection Types (&)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. Intersection Types ===");

// "must be A AND B" — combines all properties
interface Identifiable { id: string; }
interface Timestamped  { createdAt: Date; updatedAt: Date; }
interface SoftDeletable { isDeleted: boolean; deletedAt: Date | null; }

// Compose a full entity type
type Entity = Identifiable & Timestamped;
type DeletableEntity = Entity & SoftDeletable;

const entity: DeletableEntity = {
    id: "e1",
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    deletedAt: null,
};
console.log("entity id:", entity.id);

// Intersection + Union for API responses
interface SuccessResponse<T> { status: "success"; data: T; }
interface ErrorResponse       { status: "error"; error: { code: string; message: string }; }
type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

interface UserData { id: number; name: string; }

function handleResponse(res: ApiResponse<UserData>): string {
    if (res.status === "success") return `Got user: ${res.data.name}`;
    return `Error: ${res.error.message}`;
}
console.log(handleResponse({ status: "success", data: { id: 1, name: "Rahul" } }));

// ───────────────────────────────────────────────────────────────
// 4. Literal Types
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. Literal Types ===");

// String literal
type Direction = "north" | "south" | "east" | "west";
function move(dir: Direction): void { console.log("Moving:", dir); }
move("north");

// Numeric literal
type DiceRoll = 1 | 2 | 3 | 4 | 5 | 6;
const roll: DiceRoll = 4;
console.log("roll:", roll);

// Boolean literal
type Truthy = true;
const yes: Truthy = true;

// Template literal types (TypeScript 4.1+)
type EventName = "click" | "focus" | "blur";
type HandlerName = `on${Capitalize<EventName>}`; // "onClick" | "onFocus" | "onBlur"

type CSSProp = "margin" | "padding";
type CSSDir  = "top" | "right" | "bottom" | "left";
type CSSSpacing = `${CSSProp}-${CSSDir}`; // "margin-top" | ... | "padding-left"

const spacing: CSSSpacing = "margin-top";
console.log("spacing:", spacing);

// as const widens literal access
const METHODS = ["GET", "POST", "PUT", "DELETE"] as const;
type Method = typeof METHODS[number]; // "GET" | "POST" | "PUT" | "DELETE"
const m: Method = "GET";
console.log("method:", m);

// ───────────────────────────────────────────────────────────────
// 5. Type Aliases
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Type Aliases ===");

// Can represent ANY type
type ID = string | number;
type Name = string;
type Callback = (data: string) => void;
type Point = [number, number];
type MaybeUser = UserData | null;

const cb: Callback = (data) => console.log("cb:", data);
cb("test");

const pt: Point = [10, 20];
console.log("point:", pt);

// Generic type alias
type Nullable<T> = T | null;
type Optional<T> = T | undefined;
type Maybe<T> = T | null | undefined;

let maybeUser: Maybe<UserData> = null;
maybeUser = { id: 1, name: "Alice" };
console.log("maybe:", maybeUser);

// ───────────────────────────────────────────────────────────────
// 6. Interfaces
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. Interfaces ===");

interface Vehicle {
    brand: string;
    speed: number;
    readonly vin: string; // can't be changed after creation
    fuel?: string;        // optional
}

interface ElectricVehicle extends Vehicle {
    batteryCapacity: number;
    charge(): void;
}

const tesla: ElectricVehicle = {
    brand: "Tesla",
    speed: 250,
    vin: "ABC123",
    batteryCapacity: 100,
    charge() { console.log("Charging..."); },
};
tesla.charge();

// Declaration merging — interfaces with the same name are merged
interface Box { height: number; }
interface Box { width: number; }
// Result: Box has BOTH height and width
const box: Box = { height: 10, width: 20 };
console.log("box:", box);

// ───────────────────────────────────────────────────────────────
// 7. Type Alias vs Interface — When to Use Which
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. Type Alias vs Interface ===");

/*
USE INTERFACE WHEN:
  • Defining object shapes (especially for public APIs)
  • You need declaration merging
  • Defining contracts for classes (implements)
  • Extending other types

USE TYPE ALIAS WHEN:
  • Creating union or intersection types
  • Working with tuples
  • Creating function types
  • Using mapped or conditional types
  • Aliasing primitives
*/

// Interface can extend interface and type alias
type HasName = { name: string };
interface Employee extends HasName {
    employeeId: string;
    department: string;
}

// Type can reference interface
type CreateEmployeeDTO = Omit<Employee, "employeeId">;

// Type for union (interface CANNOT do this)
type EventResult = "success" | "failure" | "pending";
// interface EventResult = "success" | ...; // ❌ Not possible

// Both can be used with generics
interface Container<T> { value: T; }
type Wrapper<T> = { wrapped: T };

const c: Container<number> = { value: 42 };
const w: Wrapper<string> = { wrapped: "hello" };
console.log(c, w);

// Key difference: type aliases CANNOT be reopened
// interface can be reopened (declaration merging)
// type Point = { x: number };
// type Point = { y: number }; // ❌ Duplicate identifier

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice ===");

// Q1: What's the type of `x` after narrowing?
function q1(x: string | number | null): void {
    if (x === null) return;
    // x is string | number here
    if (typeof x === "string") {
        console.log("Q1 string:", x.toUpperCase()); // string
    }
}
q1("hello");
q1(null);

// Q2: Intersection gotcha — what type is x.value below?
interface A2 { value: string; }
interface B2 { value: number; }
type AB2 = A2 & B2;
// AB2.value is string & number = never (impossible to satisfy both!)
// This makes AB2 impossible to create.

// Q3: Why prefer union of interfaces over mixed objects?
// Union with discriminant: TypeScript narrows exhaustively
// Mixed object: every property must exist on both

// Q4: Build an ApiResponse type
type ApiRes<T> = { status: "ok"; data: T } | { status: "err"; message: string };
function parseRes<T>(res: ApiRes<T>): T | null {
    return res.status === "ok" ? res.data : null;
}
console.log("Q4:", parseRes<number>({ status: "ok", data: 42 }));      // 42
console.log("Q4:", parseRes<number>({ status: "err", message: "fail" })); // null

export {};
