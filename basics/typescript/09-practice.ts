// ═══════════════════════════════════════════════════════════════
// TYPESCRIPT 09: PRACTICE QUESTIONS — ALL LEVELS
// Run: npx ts-node 09-practice.ts
// ═══════════════════════════════════════════════════════════════
//
// LEVELS:
//  • Easy   (E1–E10) — basic types, functions, interfaces
//  • Medium (M1–M10) — generics, utility types, classes
//  • Hard   (H1–H10) — advanced types, conditional, mapped, decorators
//
// Each question: problem statement → solution → runtime verification

// ───────────────────────────────────────────────────────────────
// EASY QUESTIONS
// ───────────────────────────────────────────────────────────────

console.log("══════════════════════════════════════════");
console.log("  EASY QUESTIONS (E1–E10)");
console.log("══════════════════════════════════════════");

// ─── E1 ─────────────────────────────────────────────────────────
// Q: Annotate a function that takes a name (string) and age (number)
//    and returns a greeting string.

console.log("\n--- E1: Basic Function Types ---");

function greet(name: string, age: number): string {
    return `Hello, ${name}! You are ${age} years old.`;
}

console.log(greet("Alice", 30));

// ─── E2 ─────────────────────────────────────────────────────────
// Q: Define an interface for a Point with x and y coordinates.
//    Write a function that calculates the distance from the origin.

console.log("\n--- E2: Interfaces ---");

interface Point {
    x: number;
    y: number;
}

function distanceFromOrigin(p: Point): number {
    return Math.sqrt(p.x ** 2 + p.y ** 2);
}

console.log("distance:", distanceFromOrigin({ x: 3, y: 4 })); // 5

// ─── E3 ─────────────────────────────────────────────────────────
// Q: Create a union type for string | number | boolean.
//    Write a stringify function that returns its string representation.

console.log("\n--- E3: Union Types ---");

type Primitive = string | number | boolean;

function stringify(value: Primitive): string {
    if (typeof value === "boolean") return value ? "true" : "false";
    return String(value);
}

console.log(stringify("hello"), stringify(42), stringify(true));

// ─── E4 ─────────────────────────────────────────────────────────
// Q: Define a tuple type for [name, age, isAdmin] and format it.

console.log("\n--- E4: Tuple Types ---");

type UserRecord = [name: string, age: number, isAdmin: boolean];

function formatUser([name, age, isAdmin]: UserRecord): string {
    return `${name} (${age})${isAdmin ? " [ADMIN]" : ""}`;
}

console.log(formatUser(["Alice", 30, true]));
console.log(formatUser(["Bob", 25, false]));

// ─── E5 ─────────────────────────────────────────────────────────
// Q: Create a string enum for HTTP methods. Check if a method is read-only.

console.log("\n--- E5: Enums ---");

enum HttpMethod {
    GET    = "GET",
    POST   = "POST",
    PUT    = "PUT",
    PATCH  = "PATCH",
    DELETE = "DELETE",
}

function isReadOnly(method: HttpMethod): boolean {
    return method === HttpMethod.GET;
}

console.log("GET readonly:", isReadOnly(HttpMethod.GET));    // true
console.log("POST readonly:", isReadOnly(HttpMethod.POST));  // false

// ─── E6 ─────────────────────────────────────────────────────────
// Q: Write pad(str, width?, char?) with optional and default params.

console.log("\n--- E6: Optional & Default Params ---");

function pad(str: string, width: number = 10, char: string = " "): string {
    if (str.length >= width) return str;
    return str + char.repeat(width - str.length);
}

console.log(`|${pad("hello")}|`);          // |hello     |
console.log(`|${pad("hi", 8, "-")}|`);     // |hi------|

// ─── E7 ─────────────────────────────────────────────────────────
// Q: Define a NumberCallback type and use it in eachNumber.

console.log("\n--- E7: Function Types ---");

type NumberCallback = (value: number, index: number) => void;

function eachNumber(arr: number[], cb: NumberCallback): void {
    arr.forEach(cb);
}

eachNumber([1, 2, 3], (v, i) => console.log(`  [${i}] = ${v}`));

// ─── E8 ─────────────────────────────────────────────────────────
// Q: Use 'as const' so that CONFIG values are literal types, not widened.

console.log("\n--- E8: as const ---");

const CONFIG = {
    host:  "localhost",
    port:  3000,
    debug: true,
} as const;

// typeof CONFIG.host is "localhost" (literal), not string
type ConfigHost = typeof CONFIG.host;  // "localhost"
console.log("host:", CONFIG.host, "port:", CONFIG.port);

// ─── E9 ─────────────────────────────────────────────────────────
// Q: Write a typeof guard: return string length or numeric value.

console.log("\n--- E9: typeof Guard ---");

function measure(value: string | number): number {
    if (typeof value === "string") return value.length;
    return value;
}

console.log(measure("hello"), measure(42)); // 5, 42

// ─── E10 ────────────────────────────────────────────────────────
// Q: Interface with optional + readonly property. Two object examples.

console.log("\n--- E10: Optional & Readonly ---");

interface ProductItem {
    readonly id: string;
    name: string;
    description?: string;
    price: number;
}

const item1: ProductItem = { id: "p1", name: "Laptop", price: 999 };
const item2: ProductItem = { id: "p2", name: "Phone", description: "Latest", price: 499 };

console.log(item1.name, item1.description ?? "(none)");
console.log(item2.name, item2.description);

// ───────────────────────────────────────────────────────────────
// MEDIUM QUESTIONS
// ───────────────────────────────────────────────────────────────

console.log("\n══════════════════════════════════════════");
console.log("  MEDIUM QUESTIONS (M1–M10)");
console.log("══════════════════════════════════════════");

// ─── M1 ─────────────────────────────────────────────────────────
// Q: Write a generic identity function and a generic pair function.

console.log("\n--- M1: Generic Functions ---");

function identity<T>(value: T): T {
    return value;
}

function makePair<A, B>(a: A, b: B): [A, B] {
    return [a, b];
}

console.log(identity("hello"), identity(42));
console.log(makePair("name", 42), makePair(true, [1, 2, 3]));

// ─── M2 ─────────────────────────────────────────────────────────
// Q: Create a generic Stack class with push, pop, peek, isEmpty.

console.log("\n--- M2: Generic Stack ---");

class GenericStack<T> {
    private items: T[] = [];

    push(item: T): this {
        this.items.push(item);
        return this;
    }

    pop(): T {
        if (this.items.length === 0) throw new Error("Stack is empty");
        return this.items.pop()!;
    }

    peek(): T {
        if (this.items.length === 0) throw new Error("Stack is empty");
        return this.items[this.items.length - 1];
    }

    isEmpty(): boolean { return this.items.length === 0; }
    size(): number     { return this.items.length; }
}

const numStack = new GenericStack<number>();
numStack.push(1).push(2).push(3);
console.log("peek:", numStack.peek(), "pop:", numStack.pop(), "size:", numStack.size());

// ─── M3 ─────────────────────────────────────────────────────────
// Q: Use Partial<T> + Required<T> to build a settings merge function.

console.log("\n--- M3: Partial / Required ---");

interface AppSettings {
    theme:         "light" | "dark";
    language:      string;
    fontSize:      number;
    notifications: boolean;
}

const DEFAULT_SETTINGS: Required<AppSettings> = {
    theme: "light", language: "en", fontSize: 14, notifications: true,
};

function mergeSettings(overrides: Partial<AppSettings>): Required<AppSettings> {
    return { ...DEFAULT_SETTINGS, ...overrides };
}

const userSettings = mergeSettings({ theme: "dark", fontSize: 16 });
console.log("merged:", JSON.stringify(userSettings));

// ─── M4 ─────────────────────────────────────────────────────────
// Q: Use Pick and Omit to create DTO types for a User entity.

console.log("\n--- M4: Pick / Omit ---");

interface UserEntity {
    id:        string;
    name:      string;
    email:     string;
    password:  string;
    role:      "admin" | "user";
    createdAt: Date;
}

type CreateUserDTO  = Omit<UserEntity, "id" | "createdAt">;
type UserSummaryDTO = Pick<UserEntity, "id" | "name" | "email">;

const newUser: CreateUserDTO = {
    name: "Bob", email: "bob@x.com", password: "hashed", role: "user",
};
const summary: UserSummaryDTO = { id: "u1", name: "Bob", email: "bob@x.com" };
console.log("create:", newUser.name, "summary:", summary.id);

// ─── M5 ─────────────────────────────────────────────────────────
// Q: Overload format(): number→"$X.XX", Date→"YYYY-MM-DD", string→trimmed+capitalised.

console.log("\n--- M5: Function Overloads ---");

function format(n: number): string;
function format(d: Date): string;
function format(s: string): string;
function format(value: number | Date | string): string {
    if (typeof value === "number") return `$${value.toFixed(2)}`;
    if (value instanceof Date) return value.toISOString().split("T")[0];
    const t = value.trim();
    return t.charAt(0).toUpperCase() + t.slice(1);
}

console.log(format(9.99));
console.log(format(new Date("2024-06-17")));
console.log(format("  hello world"));

// ─── M6 ─────────────────────────────────────────────────────────
// Q: Class with private constructor, static factory, getters/setters.

console.log("\n--- M6: Class Modifiers ---");

class CircleModel {
    private static _count = 0;
    private _radius: number;

    private constructor(radius: number) {
        if (radius <= 0) throw new RangeError("Radius must be positive");
        this._radius = radius;
        CircleModel._count++;
    }

    static create(radius: number): CircleModel { return new CircleModel(radius); }
    static get count(): number { return CircleModel._count; }

    get radius(): number { return this._radius; }
    set radius(v: number) {
        if (v <= 0) throw new RangeError("Radius must be positive");
        this._radius = v;
    }
    get area(): number { return Math.PI * this._radius ** 2; }
}

const cm1 = CircleModel.create(5);
const cm2 = CircleModel.create(10);
console.log("created:", CircleModel.count, "area:", cm1.area.toFixed(2));
cm1.radius = 7;
console.log("new radius:", cm1.radius);
void cm2; // suppress unused-var warning

// ─── M7 ─────────────────────────────────────────────────────────
// Q: Type-safe generic event emitter.

console.log("\n--- M7: Generic EventEmitter ---");

type ListenerFn<T> = (payload: T) => void;

class TypedEmitter<Events> {
    private listeners = {} as {
        [K in keyof Events]?: ListenerFn<Events[K]>[];
    };

    on<K extends keyof Events>(event: K, fn: ListenerFn<Events[K]>): this {
        (this.listeners[event] ??= [] as ListenerFn<Events[K]>[]).push(fn);
        return this;
    }

    emit<K extends keyof Events>(event: K, payload: Events[K]): void {
        this.listeners[event]?.forEach(fn => fn(payload));
    }
}

interface AppEvents {
    login:  { userId: string; timestamp: Date };
    error:  { message: string; code: number };
}

const emitter = new TypedEmitter<AppEvents>();
emitter.on("login",  ({ userId }) => console.log("  login:", userId));
emitter.on("error",  ({ code, message }) => console.log("  error", code, message));
emitter.emit("login",  { userId: "u1", timestamp: new Date() });
emitter.emit("error",  { message: "Not found", code: 404 });

// ─── M8 ─────────────────────────────────────────────────────────
// Q: Record<K, V>-based permission system.

console.log("\n--- M8: Record Type ---");

type UserRole   = "admin" | "editor" | "viewer";
type UserAction = "create" | "read" | "update" | "delete";

const permissions: Record<UserRole, UserAction[]> = {
    admin:  ["create", "read", "update", "delete"],
    editor: ["create", "read", "update"],
    viewer: ["read"],
};

function can(role: UserRole, action: UserAction): boolean {
    return permissions[role].includes(action);
}

console.log("admin delete:", can("admin", "delete"));    // true
console.log("viewer create:", can("viewer", "create"));  // false
console.log("editor update:", can("editor", "update"));  // true

// ─── M9 ─────────────────────────────────────────────────────────
// Q: Abstract Shape class with Circle and Rectangle, static compare.

console.log("\n--- M9: Abstract Class ---");

abstract class AbstractShape {
    abstract getArea(): number;
    abstract getPerimeter(): number;
    abstract readonly shapeName: string;

    toString(): string {
        return `${this.shapeName}(area=${this.getArea().toFixed(2)})`;
    }

    static compare(a: AbstractShape, b: AbstractShape): number {
        return a.getArea() - b.getArea();
    }
}

class CircleShape extends AbstractShape {
    readonly shapeName = "Circle";
    constructor(public radius: number) { super(); }
    getArea(): number      { return Math.PI * this.radius ** 2; }
    getPerimeter(): number { return 2 * Math.PI * this.radius; }
}

class RectangleShape extends AbstractShape {
    readonly shapeName = "Rectangle";
    constructor(public w: number, public h: number) { super(); }
    getArea(): number      { return this.w * this.h; }
    getPerimeter(): number { return 2 * (this.w + this.h); }
}

const abstractShapes: AbstractShape[] = [
    new CircleShape(3),
    new RectangleShape(4, 5),
    new CircleShape(1),
];

abstractShapes.sort(AbstractShape.compare);
abstractShapes.forEach(s => console.log(" ", s.toString()));

// ─── M10 ────────────────────────────────────────────────────────
// Q: Use ReturnType<T> and Parameters<T> to wrap any function with logging.

console.log("\n--- M10: ReturnType / Parameters ---");

function wrapFn<T extends (...args: any[]) => any>(
    fn: T,
    label: string
): (...args: Parameters<T>) => ReturnType<T> {
    return (...args: Parameters<T>): ReturnType<T> => {
        console.log(`  ${label}(${args.map(a => JSON.stringify(a)).join(", ")})`);
        const result = fn(...args);
        console.log(`  → ${JSON.stringify(result)}`);
        return result;
    };
}

function addNums(a: number, b: number): number { return a + b; }
const wrappedAdd = wrapFn(addNums, "add");
wrappedAdd(3, 4);

// ───────────────────────────────────────────────────────────────
// HARD QUESTIONS
// ───────────────────────────────────────────────────────────────

console.log("\n══════════════════════════════════════════");
console.log("  HARD QUESTIONS (H1–H10)");
console.log("══════════════════════════════════════════");

// ─── H1 ─────────────────────────────────────────────────────────
// Q: Implement DeepReadonly<T> — recursive mapped type.

console.log("\n--- H1: DeepReadonly ---");

type DeepReadonly<T> = T extends (infer U)[]
    ? ReadonlyArray<DeepReadonly<U>>
    : T extends object
        ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
        : T;

interface DbConfig {
    db: {
        host: string;
        port: number;
        credentials: { user: string; pass: string };
    };
    cache: { ttl: number };
}

const dbCfg: DeepReadonly<DbConfig> = {
    db:    { host: "localhost", port: 5432, credentials: { user: "admin", pass: "secret" } },
    cache: { ttl: 300 },
};

// dbCfg.db.host = "other";             // ❌ readonly
// dbCfg.db.credentials.pass = "hack";  // ❌ deep readonly
console.log("H1 host:", dbCfg.db.host, "pass:", dbCfg.db.credentials.pass);

// ─── H2 ─────────────────────────────────────────────────────────
// Q: IsNever<T> that returns true when T is never. NonNeverKeys<T>.

console.log("\n--- H2: IsNever / NonNeverKeys ---");

type IsNever<T> = [T] extends [never] ? true : false;

// Filters out properties whose value type is never
type NonNeverKeys<T> = {
    [K in keyof T]: IsNever<T[K]> extends true ? never : K;
}[keyof T];

interface MixedFields {
    a: string;
    b: never;
    c: number;
    d: never;
}

type GoodKeys = NonNeverKeys<MixedFields>; // "a" | "c"

const goodObj: Pick<MixedFields, GoodKeys> = { a: "hello", c: 42 };
console.log("H2 non-never:", goodObj.a, goodObj.c);

// ─── H3 ─────────────────────────────────────────────────────────
// Q: Type-safe curry function.

console.log("\n--- H3: Type-safe Curry ---");

type Curry<Args extends unknown[], Return> =
    Args extends [infer First, ...infer Rest]
        ? (arg: First) => Curry<Rest, Return>
        : Return;

function curry<Args extends unknown[], Return>(
    fn: (...args: Args) => Return
): Curry<Args, Return> {
    const arity = fn.length;
    function curried(...args: unknown[]): unknown {
        if (args.length >= arity) {
            return (fn as (...a: unknown[]) => Return)(...args);
        }
        return (...more: unknown[]) => curried(...args, ...more);
    }
    return curried as Curry<Args, Return>;
}

function add3(a: number, b: number, c: number): number { return a + b + c; }

const curriedAdd = curry(add3);
console.log("H3 curry:", curriedAdd(1)(2)(3));        // 6
console.log("H3 curry:", curriedAdd(10)(20)(30));     // 60

// ─── H4 ─────────────────────────────────────────────────────────
// Q: Build a composable pipe() that chains unary functions.
//    pipe(f, g, h)(x) === h(g(f(x)))

console.log("\n--- H4: Pipe ---");

// Type-safe overloads for 2-4 function chains
function pipe<A, B>(f1: (a: A) => B): (a: A) => B;
function pipe<A, B, C>(f1: (a: A) => B, f2: (b: B) => C): (a: A) => C;
function pipe<A, B, C, D>(f1: (a: A) => B, f2: (b: B) => C, f3: (c: C) => D): (a: A) => D;
function pipe(...fns: Array<(x: any) => any>): (x: any) => any {
    return (x) => fns.reduce((v, f) => f(v), x);
}

const processStr = pipe(
    (s: string) => s.trim(),
    (s: string) => s.toUpperCase(),
    (s: string) => s.split("").reverse().join("")
);

console.log("H4 pipe:", processStr("  hello  ")); // "OLLEH"

const double = pipe(
    (n: number) => n * 2,
    (n: number) => n + 1
);
console.log("H4 pipe:", double(5)); // 11

// ─── H5 ─────────────────────────────────────────────────────────
// Q: Template literal types for a typed event bus.
//    Event names follow "on<Entity><EventAction>" pattern.

console.log("\n--- H5: Template Literal Event Types ---");

type BusEntity     = "User" | "Order" | "Product";
type BusAction     = "Create" | "Update" | "Delete" | "Fetch";
type BusEventName  = `on${BusEntity}${BusAction}`;

// Generic payload — avoids distributive mapped type indexing issues
interface BusPayload<E extends string> {
    event:     E;
    timestamp: Date;
    data:      unknown;
}

class TypedEventBus {
    private handlers = new Map<string, Array<(p: BusPayload<string>) => void>>();

    subscribe<E extends BusEventName>(
        event: E,
        handler: (payload: BusPayload<E>) => void
    ): void {
        const list = this.handlers.get(event) ?? [];
        this.handlers.set(event, [...list, handler as (p: BusPayload<string>) => void]);
    }

    publish<E extends BusEventName>(event: E, data: unknown): void {
        const payload: BusPayload<E> = { event, timestamp: new Date(), data };
        this.handlers.get(event)?.forEach(h => h(payload as BusPayload<string>));
    }
}

const bus = new TypedEventBus();
bus.subscribe("onUserCreate", ({ event, data }) => {
    console.log("H5 event:", event, JSON.stringify(data));
});
bus.publish("onUserCreate", { userId: "u1", name: "Alice" });

// ─── H6 ─────────────────────────────────────────────────────────
// Q: Type-safe Builder pattern with a build() that throws if
//    required fields are missing. Method chaining returns this.

console.log("\n--- H6: Type-safe Builder ---");

interface RequestConfig {
    url:     string;
    method:  "GET" | "POST" | "PUT" | "DELETE";
    headers: Record<string, string>;
    body?:   string;
    timeout: number;
}

class RequestBuilder {
    private _url:     string | undefined;
    private _method:  RequestConfig["method"] | undefined;
    private _headers: Record<string, string> = {};
    private _body:    string | undefined;
    private _timeout  = 5000;

    setUrl(url: string): this { this._url = url; return this; }
    setMethod(method: RequestConfig["method"]): this { this._method = method; return this; }
    setHeader(key: string, val: string): this { this._headers[key] = val; return this; }
    setBody(body: string): this { this._body = body; return this; }
    setTimeout(ms: number): this { this._timeout = ms; return this; }

    build(): RequestConfig {
        if (!this._url)    throw new Error("url is required");
        if (!this._method) throw new Error("method is required");
        return {
            url:     this._url,
            method:  this._method,
            headers: { ...this._headers },
            body:    this._body,
            timeout: this._timeout,
        };
    }
}

const req = new RequestBuilder()
    .setUrl("https://api.example.com/users")
    .setMethod("POST")
    .setHeader("Content-Type", "application/json")
    .setBody('{"name":"Alice"}')
    .build();

console.log("H6 request:", req.method, req.url);

try {
    new RequestBuilder().build(); // no url set
} catch (e: any) {
    console.log("H6 missing url:", e.message);
}

// ─── H7 ─────────────────────────────────────────────────────────
// Q: @Validate decorator factory that validates method args at runtime.

console.log("\n--- H7: Validate Decorator ---");

type ArgValidator = (value: unknown) => boolean;

function Validate(schema: ArgValidator[]) {
    return function (_target: unknown, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
        const original = descriptor.value;
        descriptor.value = function (...args: unknown[]) {
            schema.forEach((validate, i) => {
                if (i < args.length && !validate(args[i])) {
                    throw new TypeError(
                        `Argument ${i} of ${propertyKey} failed validation (got ${JSON.stringify(args[i])})`
                    );
                }
            });
            return original.apply(this, args);
        };
        return descriptor;
    };
}

const isStr      = (v: unknown): boolean => typeof v === "string";
const isPositive = (v: unknown): boolean => typeof v === "number" && v > 0;

class OrderService {
    @Validate([isStr, isPositive])
    createOrder(productId: string, quantity: number): string {
        return `Order: ${quantity}x ${productId}`;
    }
}

const orderSvc = new OrderService();
console.log(orderSvc.createOrder("laptop", 2));

try {
    orderSvc.createOrder("phone", -1);
} catch (e: any) {
    console.log("H7 validation error:", e.message);
}

// ─── H8 ─────────────────────────────────────────────────────────
// Q: Discriminated union state machine — traffic light with strict transitions.

console.log("\n--- H8: State Machine ---");

interface RedLight    { state: "red";    duration: 30 }
interface YellowLight { state: "yellow"; duration: 5  }
interface GreenLight  { state: "green";  duration: 25 }

type LightState = RedLight | YellowLight | GreenLight;

// Each state maps to exactly one successor
type NextLight<T extends LightState> =
    T["state"] extends "red"    ? GreenLight  :
    T["state"] extends "green"  ? YellowLight :
    T["state"] extends "yellow" ? RedLight    :
    never;

function transition<T extends LightState>(current: T): NextLight<T> {
    switch (current.state) {
        case "red":    return { state: "green",  duration: 25 } as NextLight<T>;
        case "green":  return { state: "yellow", duration: 5  } as NextLight<T>;
        case "yellow": return { state: "red",    duration: 30 } as NextLight<T>;
    }
}

const red:       RedLight   = { state: "red",    duration: 30 };
const green2                 = transition(red);      // GreenLight
const yellow2                = transition(green2);   // YellowLight
const backToRed              = transition(yellow2);  // RedLight

console.log("H8 cycle:", red.state, "→", green2.state, "→", yellow2.state, "→", backToRed.state);

// ─── H9 ─────────────────────────────────────────────────────────
// Q: Type-safe ORM query builder — where() args are typed to the entity.

console.log("\n--- H9: Type-safe Query Builder ---");

type WhereOp = "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE";

class OrmQuery<T> {
    private _table  = "";
    private _select: (keyof T)[] | null = null;
    private _where:  { field: keyof T; op: WhereOp; value: T[keyof T] }[] = [];
    private _order:  { field: keyof T; dir: "ASC" | "DESC" } | null = null;
    private _limit:  number | null = null;

    from(table: string): this  { this._table = table; return this; }

    select(...cols: (keyof T)[]): this { this._select = cols; return this; }

    where(field: keyof T, op: WhereOp, value: T[keyof T]): this {
        this._where.push({ field, op, value });
        return this;
    }

    orderBy(field: keyof T, dir: "ASC" | "DESC" = "ASC"): this {
        this._order = { field, dir };
        return this;
    }

    limit(n: number): this { this._limit = n; return this; }

    toSQL(): string {
        const cols = this._select ? this._select.map(f => String(f)).join(", ") : "*";
        let sql = `SELECT ${cols} FROM ${this._table}`;
        if (this._where.length) {
            sql += " WHERE " + this._where
                .map(c => `${String(c.field)} ${c.op} ${JSON.stringify(c.value)}`)
                .join(" AND ");
        }
        if (this._order) sql += ` ORDER BY ${String(this._order.field)} ${this._order.dir}`;
        if (this._limit !== null) sql += ` LIMIT ${this._limit}`;
        return sql;
    }
}

interface UserRow { id: number; name: string; age: number; role: string; }

const ormSQL = new OrmQuery<UserRow>()
    .from("users")
    .select("id", "name", "role")
    .where("age", ">=", 18)
    .where("role", "=", "admin")
    .orderBy("name", "ASC")
    .limit(10)
    .toSQL();

console.log("H9 SQL:", ormSQL);

// ─── H10 ────────────────────────────────────────────────────────
// Q: Typed middleware pipeline (like Koa). Each middleware gets
//    (ctx, next) and can modify ctx. The pipeline is composable.

console.log("\n--- H10: Typed Middleware Pipeline ---");

interface HttpContext {
    request:  { method: string; path: string; body?: unknown };
    response: { status: number; body?: unknown };
    state:    Record<string, unknown>;
}

type NextFn = () => Promise<void>;
type MiddlewareFn = (ctx: HttpContext, next: NextFn) => Promise<void>;

class Pipeline {
    private mw: MiddlewareFn[] = [];

    use(fn: MiddlewareFn): this { this.mw.push(fn); return this; }

    async run(ctx: HttpContext): Promise<HttpContext> {
        let idx = -1;
        const dispatch = async (i: number): Promise<void> => {
            if (i <= idx) throw new Error("next() called multiple times");
            idx = i;
            const fn = this.mw[i];
            if (fn) await fn(ctx, () => dispatch(i + 1));
        };
        await dispatch(0);
        return ctx;
    }
}

const loggerMw: MiddlewareFn = async (ctx, next) => {
    console.log(`  → ${ctx.request.method} ${ctx.request.path}`);
    await next();
    console.log(`  ← ${ctx.response.status}`);
};

const authMw: MiddlewareFn = async (ctx, next) => {
    ctx.state.user = { id: "u1", role: "admin" };
    await next();
};

const handlerMw: MiddlewareFn = async (ctx) => {
    ctx.response.status = 200;
    ctx.response.body   = { message: "OK", user: ctx.state.user };
};

const pipeline = new Pipeline().use(loggerMw).use(authMw).use(handlerMw);

const httpCtx: HttpContext = {
    request:  { method: "GET", path: "/api/users" },
    response: { status: 500 },
    state:    {},
};

pipeline.run(httpCtx).then(result => {
    console.log("H10 result:", JSON.stringify(result.response));
});

// ───────────────────────────────────────────────────────────────
// SUMMARY
// ───────────────────────────────────────────────────────────────

console.log("\n══════════════════════════════════════════");
console.log("  PHASE 2 COMPLETE — TypeScript Mastery");
console.log("══════════════════════════════════════════");
console.log("  01-fundamentals.ts   — types, enums, assertions");
console.log("  02-type-system.ts    — unions, intersections, inference");
console.log("  03-functions.ts      — overloads, generics, this param");
console.log("  04-generics.ts       — conditional types, mapped, infer");
console.log("  05-utility-types.ts  — Partial, Pick, Record, ReturnType");
console.log("  06-classes-oop.ts    — modifiers, abstract, implements");
console.log("  07-decorators.ts     — class/method/property decorators");
console.log("  08-type-guards.ts    — narrowing, discriminated unions");
console.log("  09-practice.ts       — E1-E10 / M1-M10 / H1-H10");

export {};
