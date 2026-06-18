// ═══════════════════════════════════════════════════════════════
// TYPESCRIPT 07: DECORATORS
// Run: npx ts-node 07-decorators.ts
// ═══════════════════════════════════════════════════════════════
//
// Requires: "experimentalDecorators": true in tsconfig.json
//
// Decorators are a METAPROGRAMMING feature — they modify or annotate
// classes, methods, and properties WITHOUT changing their source code.
//
// TYPES OF DECORATORS:
//  • Class decorator     — wraps/modifies a class constructor
//  • Method decorator    — wraps a method (logging, caching, timing)
//  • Property decorator  — adds validation or behavior to a property
//  • Accessor decorator  — wraps a getter or setter
//  • Parameter decorator — marks a parameter (metadata, injection)
//
// EXECUTION ORDER:
//  Factory functions execute TOP → BOTTOM
//  Decorator functions execute BOTTOM → TOP (innermost first)

// ───────────────────────────────────────────────────────────────
// 1. Class Decorators
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Class Decorators ===");

// Basic class decorator — receives the constructor function
function Sealed(constructor: Function): void {
    Object.seal(constructor);
    Object.seal(constructor.prototype);
    console.log(`Sealed class: ${constructor.name}`);
}

@Sealed
class Config {
    version = "1.0.0";
    debug   = false;
}

// Class decorator factory — takes arguments, returns the decorator
function Logger(prefix: string) {
    return function <T extends new (...args: any[]) => object>(Constructor: T): T {
        return class extends Constructor {
            constructor(...args: any[]) {
                super(...args);
                console.log(`${prefix}: Created ${Constructor.name}`);
            }
        };
    };
}

@Logger("DEBUG")
class UserService {
    constructor(public name: string) {}
    greet(): string { return `Hello from ${this.name}`; }
}

const svc = new UserService("UserService"); // logs "DEBUG: Created UserService"
console.log(svc.greet());

// ───────────────────────────────────────────────────────────────
// 2. Method Decorators
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. Method Decorators ===");

// Signature: (target, propertyKey, descriptor) => PropertyDescriptor | void
// target        — prototype (for instance methods) or constructor (for static)
// propertyKey   — method name
// descriptor    — PropertyDescriptor with { value, writable, enumerable, configurable }

// Log decorator — logs calls and results
function Log(_target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const original = descriptor.value;
    descriptor.value = function (...args: any[]) {
        console.log(`  → ${propertyKey}(${args.map(a => JSON.stringify(a)).join(", ")})`);
        const result = original.apply(this, args);
        console.log(`  ← ${propertyKey} returned ${JSON.stringify(result)}`);
        return result;
    };
    return descriptor;
}

// Measure decorator — tracks execution time
function Measure(_target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const original = descriptor.value;
    descriptor.value = function (...args: any[]) {
        const start = Date.now();
        const result = original.apply(this, args);
        const elapsed = Date.now() - start;
        console.log(`  ⏱ ${propertyKey} took ${elapsed}ms`);
        return result;
    };
    return descriptor;
}

// Memoize decorator — cache results by args
function Memoize(_target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const original = descriptor.value;
    const cache = new Map<string, any>();

    descriptor.value = function (...args: any[]) {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
            console.log(`  💾 ${propertyKey} cache hit for ${key}`);
            return cache.get(key);
        }
        const result = original.apply(this, args);
        cache.set(key, result);
        return result;
    };
    return descriptor;
}

class MathService {
    @Log
    add(a: number, b: number): number {
        return a + b;
    }

    @Memoize
    fibonacci(n: number): number {
        if (n <= 1) return n;
        return this.fibonacci(n - 1) + this.fibonacci(n - 2);
    }

    @Log
    @Measure
    expensiveCalc(n: number): number {
        // Simulate work
        let result = 0;
        for (let i = 0; i < n * 1000; i++) result += i;
        return result;
    }
}

const math = new MathService();
math.add(5, 3);
console.log("fib(10):", math.fibonacci(10)); // cached subsequent calls
math.fibonacci(10); // cache hit
math.expensiveCalc(100);

// ───────────────────────────────────────────────────────────────
// 3. Property Decorators
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. Property Decorators ===");

// Signature: (target, propertyKey) => void
// Cannot modify value directly — must use Object.defineProperty

function MinLength(min: number) {
    return function (target: any, propertyKey: string): void {
        let value: string;
        Object.defineProperty(target, propertyKey, {
            get: () => value,
            set: (newVal: string) => {
                if (newVal.length < min) {
                    throw new Error(`${propertyKey} must be at least ${min} chars`);
                }
                value = newVal;
            },
            enumerable: true,
            configurable: true,
        });
    };
}

function NonEmpty(target: any, propertyKey: string): void {
    let value: string;
    Object.defineProperty(target, propertyKey, {
        get: () => value,
        set: (newVal: string) => {
            if (!newVal || !newVal.trim()) {
                throw new Error(`${propertyKey} cannot be empty`);
            }
            value = newVal.trim();
        },
        enumerable: true,
        configurable: true,
    });
}

class Person {
    @MinLength(2)
    name!: string;

    @NonEmpty
    email!: string;

    constructor(name: string, email: string) {
        this.name  = name;
        this.email = email;
    }
}

const p1 = new Person("Alice", "alice@example.com");
console.log("person:", p1.name, p1.email);

try {
    const p2 = new Person("A", "too-short@x.com"); // name only 1 char
    console.log(p2.name);
} catch (e: any) {
    console.log("validation error:", e.message); // "name must be at least 2 chars"
}

// ───────────────────────────────────────────────────────────────
// 4. Accessor Decorator
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. Accessor Decorator ===");

function Configurable(writable: boolean) {
    return function (_target: any, _key: string, descriptor: PropertyDescriptor) {
        descriptor.configurable = writable;
        return descriptor;
    };
}

class Circle {
    private _radius: number;

    constructor(radius: number) { this._radius = radius; }

    @Configurable(false)
    get radius(): number { return this._radius; }

    getArea(): number { return Math.PI * this._radius ** 2; }
}

const c = new Circle(5);
console.log("radius:", c.radius, "area:", c.getArea().toFixed(2));

// ───────────────────────────────────────────────────────────────
// 5. Decorator Factories and Composition
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Decorator Composition ===");

// Execution order demo
function First() {
    console.log("  First() — factory");
    return function (_t: any, _k: string, d: PropertyDescriptor) {
        console.log("  First() — applied");
        return d;
    };
}

function Second() {
    console.log("  Second() — factory");
    return function (_t: any, _k: string, d: PropertyDescriptor) {
        console.log("  Second() — applied");
        return d;
    };
}

console.log("Order demo (factories top→bottom, decorators bottom→top):");
class OrderDemo {
    @First()
    @Second()
    method(): void {}
}

// ───────────────────────────────────────────────────────────────
// 6. Real-world: Route decorator (Express-like)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. Real-world Route Decorator ===");

const routeMap: { method: string; path: string; handler: string }[] = [];

function Get(path: string) {
    return function (_target: any, propertyKey: string, _descriptor: PropertyDescriptor) {
        routeMap.push({ method: "GET", path, handler: propertyKey });
    };
}

function Post(path: string) {
    return function (_target: any, propertyKey: string, _descriptor: PropertyDescriptor) {
        routeMap.push({ method: "POST", path, handler: propertyKey });
    };
}

function Controller(basePath: string) {
    return function <T extends new (...args: any[]) => object>(constructor: T): T {
        Reflect.defineProperty(constructor, "basePath", { value: basePath });
        return constructor;
    };
}

@Controller("/api/users")
class UserController {
    @Get("/")
    getAll(): string { return "get all users"; }

    @Get("/:id")
    getById(): string { return "get user by id"; }

    @Post("/")
    create(): string { return "create user"; }
}

console.log("Registered routes:");
routeMap.forEach(r => console.log(`  ${r.method} ${r.path} → ${r.handler}()`));

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice ===");

// Q1: Write a @Throttle(ms) method decorator that limits call rate
function Throttle(intervalMs: number) {
    return function (_target: any, _key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
        const original = descriptor.value;
        let lastCall = 0;
        descriptor.value = function (...args: any[]) {
            const now = Date.now();
            if (now - lastCall >= intervalMs) {
                lastCall = now;
                return original.apply(this, args);
            }
            console.log("  throttled — skipped");
        };
        return descriptor;
    };
}

class ScrollHandler {
    @Throttle(100)
    onScroll(pos: number): void {
        console.log("  scroll handler fired at pos:", pos);
    }
}

const handler = new ScrollHandler();
handler.onScroll(100);  // fires
handler.onScroll(200);  // throttled (too soon)
handler.onScroll(300);  // throttled
setTimeout(() => handler.onScroll(400), 150); // fires after 150ms

// Q2: What's the execution order for stacked method decorators?
// Factories:   evaluated top → bottom
// Decorators:  applied  bottom → top (innermost/closest to method first)
// So @A @B method() → B runs first (wraps method), A runs around B's wrapper
console.log("Q2: Bottom-up application, top decorator is outermost wrapper");

export {};
