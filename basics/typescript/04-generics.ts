// ═══════════════════════════════════════════════════════════════
// TYPESCRIPT 04: GENERICS — COMPLETE MASTERY
// Run: npx ts-node 04-generics.ts
// ═══════════════════════════════════════════════════════════════
//
// Generics let you write REUSABLE code that works with many types
// while preserving full type safety.
//
// KEY TOPICS:
//  • Generic interfaces and classes
//  • Generic constraints and defaults
//  • Conditional types  — T extends U ? X : Y
//  • infer keyword      — extract type from another type
//  • Mapped types       — transform object types property-by-property
//  • Template literal types with mapped types

// ───────────────────────────────────────────────────────────────
// 1. Generic Interfaces
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Generic Interfaces ===");

interface Box<T> {
    value: T;
    getValue(): T;
}

const strBox: Box<string> = {
    value: "hello",
    getValue() { return this.value; },
};
console.log(strBox.getValue());

// Multi-param generic
interface KeyValuePair<K, V> {
    key: K;
    value: V;
    swap(): KeyValuePair<V, K>;
}

// Repository pattern — reusable with any entity
interface Entity { id: string; }

interface Repository<T extends Entity> {
    findById(id: string): T | undefined;
    findAll(): T[];
    save(entity: T): T;
    delete(id: string): boolean;
}

interface Product extends Entity { name: string; price: number; }

class ProductRepository implements Repository<Product> {
    private items: Product[] = [];

    findById(id: string): Product | undefined {
        return this.items.find(p => p.id === id);
    }
    findAll(): Product[] { return this.items; }
    save(entity: Product): Product {
        const existing = this.items.findIndex(p => p.id === entity.id);
        if (existing >= 0) this.items[existing] = entity;
        else this.items.push(entity);
        return entity;
    }
    delete(id: string): boolean {
        const before = this.items.length;
        this.items = this.items.filter(p => p.id !== id);
        return this.items.length < before;
    }
}

const repo = new ProductRepository();
repo.save({ id: "1", name: "Laptop", price: 999 });
repo.save({ id: "2", name: "Phone",  price: 499 });
console.log("all products:", repo.findAll().map(p => p.name));

// ───────────────────────────────────────────────────────────────
// 2. Generic Classes
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. Generic Classes ===");

// Stack<T> — type-safe push/pop
class Stack<T> {
    private items: T[] = [];

    push(item: T): void { this.items.push(item); }
    pop(): T | undefined { return this.items.pop(); }
    peek(): T | undefined { return this.items[this.items.length - 1]; }
    isEmpty(): boolean { return this.items.length === 0; }
    size(): number { return this.items.length; }
    toArray(): T[] { return [...this.items]; }
}

const numStack = new Stack<number>();
numStack.push(10);
numStack.push(20);
numStack.push(30);
console.log("stack:", numStack.toArray(), "pop:", numStack.pop());

// Queue<T>
class Queue<T> {
    private items: T[] = [];
    enqueue(item: T): void { this.items.push(item); }
    dequeue(): T | undefined { return this.items.shift(); }
    front(): T | undefined { return this.items[0]; }
    isEmpty(): boolean { return this.items.length === 0; }
    size(): number { return this.items.length; }
}

const strQueue = new Queue<string>();
strQueue.enqueue("first");
strQueue.enqueue("second");
console.log("queue dequeue:", strQueue.dequeue()); // "first"

// Observable<T> — extends a generic class
class ObservableBox<T> extends Stack<T> {
    private listeners: Array<(value: T) => void> = [];

    subscribe(fn: (value: T) => void): () => void {
        this.listeners.push(fn);
        return () => { this.listeners = this.listeners.filter(l => l !== fn); };
    }

    push(item: T): void {
        super.push(item);
        this.listeners.forEach(fn => fn(item));
    }
}

const obs = new ObservableBox<number>();
const unsub = obs.subscribe(v => console.log("observed:", v));
obs.push(1);   // logs "observed: 1"
obs.push(2);   // logs "observed: 2"
unsub();       // unsubscribe
obs.push(3);   // no log — unsubscribed

// ───────────────────────────────────────────────────────────────
// 3. Conditional Types
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. Conditional Types ===");

// Syntax: T extends U ? X : Y
// "If T is assignable to U, the result type is X, otherwise Y"

type IsString<T> = T extends string ? true : false;

type A = IsString<string>;   // true
type B = IsString<number>;   // false
type C = IsString<"hello">;  // true (literal string)

// Distributive conditional types
// When T is a union, condition distributes over each member
type ToArray<T> = T extends unknown ? T[] : never;
type StrOrNumArr = ToArray<string | number>; // string[] | number[]

// Prevent distribution — wrap in tuple
type ToArrayFixed<T> = [T] extends [unknown] ? T[] : never;
type StrOrNumArrFixed = ToArrayFixed<string | number>; // (string | number)[]

// ───────────────────────────────────────────────────────────────
// 4. infer Keyword
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. infer Keyword ===");

// infer R — capture the type that would appear there
// "If T matches this pattern, extract R from it"

// Extract return type of a function
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
type FR = MyReturnType<() => string>;           // string
type FR2 = MyReturnType<(a: number) => boolean>; // boolean

// Extract parameter types
type MyParameters<T> = T extends (...args: infer P) => any ? P : never;
type Params = MyParameters<(a: string, b: number) => void>; // [string, number]

// Unwrap Promise value
type Awaited2<T> = T extends Promise<infer U> ? Awaited2<U> : T;
type PV = Awaited2<Promise<string>>;                  // string
type PV2 = Awaited2<Promise<Promise<number>>>;        // number

// Extract array element type
type ElementOf<T> = T extends (infer E)[] ? E : never;
type Elem = ElementOf<string[]>; // string

// Extract first and last of a tuple
type Head<T extends any[]> = T extends [infer H, ...any[]] ? H : never;
type Tail<T extends any[]> = T extends [...any[], infer L] ? L : never;

type H = Head<[1, 2, 3]>; // 1
type L = Tail<[1, 2, 3]>; // 3

// Runtime demo of infer-based ReturnType
function greetUser(name: string): string { return `Hello, ${name}`; }
type GreetReturn = MyReturnType<typeof greetUser>; // string
const gr: GreetReturn = greetUser("World");
console.log(gr);

// ───────────────────────────────────────────────────────────────
// 5. Mapped Types
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Mapped Types ===");

// { [K in keyof T]: ... } — iterate over all keys of T
type MyPartial<T> = { [K in keyof T]?: T[K] };         // all optional
type MyRequired<T> = { [K in keyof T]-?: T[K] };       // all required
type MyReadonly<T> = { readonly [K in keyof T]: T[K] };// all readonly
type Mutable<T> = { -readonly [K in keyof T]: T[K] }; // remove readonly

interface UserProfile {
    readonly id: number;
    name: string;
    email?: string;
}

type PartialUser = MyPartial<UserProfile>;
// { id?: number; name?: string; email?: string }

type MutableUser = Mutable<UserProfile>;
// { id: number; name: string; email?: string }

// Key remapping with 'as' (TypeScript 4.1+)
type Getters<T> = {
    [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

interface PersonProfile { name: string; age: number; }

type PersonGetters = Getters<PersonProfile>;
// { getName: () => string; getAge: () => number }

// Filter properties by type using 'never'
type OnlyStrings<T> = {
    [K in keyof T as T[K] extends string ? K : never]: T[K];
};

interface Mixed { id: number; name: string; active: boolean; email: string; }
type StringProps = OnlyStrings<Mixed>; // { name: string; email: string }

// Build getter implementation
function makeGetters<T extends object>(obj: T): Getters<T> {
    const result = {} as Getters<T>;
    for (const key in obj) {
        const getterKey = `get${key.charAt(0).toUpperCase()}${key.slice(1)}` as keyof Getters<T>;
        (result[getterKey] as () => T[typeof key]) = () => obj[key];
    }
    return result;
}

const profileGetters = makeGetters({ name: "Sadik", age: 25 });
console.log("getter:", (profileGetters as any).getName()); // "Sadik"

// ───────────────────────────────────────────────────────────────
// 6. Template Literal Types + Mapped Types
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. Template Literal + Mapped Types ===");

// Event change handlers
type EventMap2<T> = {
    [K in keyof T as `on${Capitalize<string & K>}Change`]: (
        newVal: T[K], oldVal: T[K]
    ) => void;
};

interface FormValues { username: string; age: number; }
type FormHandlers = EventMap2<FormValues>;
// { onUsernameChange: (n: string, o: string) => void;
//   onAgeChange:      (n: number, o: number) => void; }

// State setters
type StateSetter<T> = {
    [K in keyof T as `set${Capitalize<string & K>}`]: (v: T[K]) => void;
};

// Deep partial
type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

interface AppConfig {
    db:    { host: string; port: number; };
    cache: { ttl: number; enabled: boolean; };
}

const partial: DeepPartial<AppConfig> = {
    db: { host: "localhost" }, // port omitted — OK with DeepPartial
};
console.log("deep partial:", JSON.stringify(partial));

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice ===");

// Q1: Implement a generic pipe function
function pipe<A, B, C>(fn1: (a: A) => B, fn2: (b: B) => C): (a: A) => C {
    return (a) => fn2(fn1(a));
}
const strToNum = pipe((s: string) => s.length, (n: number) => n * 2);
console.log("Q1 pipe:", strToNum("hello")); // 5 * 2 = 10

// Q2: Implement Flatten<T> with conditional types
type Flatten<T> = T extends (infer U)[] ? Flatten<U> : T;
type Nested = number[][][];
type Flat = Flatten<Nested>; // number
const flatNum: Flat = 42;
console.log("Q2 flatten:", flatNum);

// Q3: Build a type-safe pick function
function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    keys.forEach(k => { result[k] = obj[k]; });
    return result;
}
const full = { id: 1, name: "Alice", email: "a@b.com", age: 30 };
const partial2 = pick(full, ["id", "name"]);
console.log("Q3 pick:", partial2); // { id: 1, name: "Alice" }

// Q4: Create a DeepReadonly type
type DeepReadonly<T> = {
    readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

interface Config2 { db: { host: string }; }
const cfg: DeepReadonly<Config2> = { db: { host: "localhost" } };
// cfg.db.host = "other"; // ❌ Error: readonly at all levels
console.log("Q4 deep readonly:", cfg.db.host);

export {};
