// ═══════════════════════════════════════════════════════════════
// MODULE 12: JS ENGINE ARCHITECTURE — PUTTING IT ALL TOGETHER
// Run: node 12-architecture-summary.js
// ═══════════════════════════════════════════════════════════════
//
// This module ties together every concept from Modules 1–11
// by tracing a single realistic scenario through the entire
// JavaScript runtime.
//
// ┌──────────────────────────────────────────────────────────┐
// │              JAVASCRIPT RUNTIME ARCHITECTURE             │
// │                                                          │
// │  ┌────────────┐    ┌──────────────────────────────────┐  │
// │  │ CALL STACK │    │         HEAP MEMORY              │  │
// │  │ (LIFO)     │    │  objects, closures, prototypes   │  │
// │  │            │    │  garbage collected (mark+sweep)  │  │
// │  └────────────┘    └──────────────────────────────────┘  │
// │         │                                                │
// │         │ delegates async work                           │
// │         ▼                                                │
// │  ┌──────────────────────────────────────────────────┐    │
// │  │  Node / Browser APIs (setTimeout, I/O, fetch)    │    │
// │  └──────────────────────────────────────────────────┘    │
// │         │ completion callbacks                           │
// │         ▼                                                │
// │  MICROTASK QUEUE   (Promise .then, queueMicrotask)       │
// │  MACROTASK QUEUE   (setTimeout, setInterval, I/O)        │
// │         │                                                │
// │  EVENT LOOP: stack empty? → drain ALL microtasks →       │
// │             run ONE macrotask → repeat                   │
// └──────────────────────────────────────────────────────────┘

// ───────────────────────────────────────────────────────────────
// 1. ONE SNIPPET THAT TOUCHES EVERY LAYER
// ───────────────────────────────────────────────────────────────

console.log("=== 1. All layers in one snippet ===");

// ── SCOPE & HOISTING ──────────────────────────────────────────
// console.log(declared);   // TDZ — ReferenceError if let/const
// console.log(hoisted);    // undefined — var declaration hoisted

// ── SYNCHRONOUS CODE (Call Stack) ─────────────────────────────
console.log("1. Sync — runs on call stack");

// ── HEAP (object created, reference on stack) ─────────────────
const user = { name: "Sadik", role: "dev" }; // user → heap object

// ── CLOSURE ───────────────────────────────────────────────────
function makeLogger(prefix) {
    // `prefix` lives in the closure environment on the heap
    return msg => console.log(`[${prefix}] ${msg}`);
}
const log = makeLogger("APP"); // closure captures `prefix`

// ── PROTOTYPE CHAIN ───────────────────────────────────────────
class EventService {
    constructor(name) { this.name = name; }
    tag() { return `[${this.name}]`; }      // on prototype
}
const svc = new EventService("OrderService"); // svc.__proto__ = EventService.prototype

// ── this KEYWORD ──────────────────────────────────────────────
const handler = {
    prefix: "HANDLER",
    handle(msg) { console.log(`2. this.prefix = "${this.prefix}" | ${msg}`); },
};
handler.handle("implicit binding");

// ── MACROTASK (setTimeout) ────────────────────────────────────
setTimeout(() => log("4. Macrotask — setTimeout fired"), 0);

// ── MICROTASK (Promise) ───────────────────────────────────────
Promise.resolve()
    .then(() => log("3. Microtask — Promise fired"))
    .then(() => log("3b. Chained microtask (before macrotask)"));

// ── ASYNC/AWAIT ───────────────────────────────────────────────
async function asyncWork() {
    await null;            // yields to event loop
    log("3c. async/await continuation (microtask)");
}
asyncWork();

console.log("1b. Still sync — microtasks/macrotasks queued above haven't fired yet");

// Output order:
// 1. Sync
// 1b. Still sync
// 3. Microtask
// 3b. Chained microtask
// 3c. async/await continuation
// 4. Macrotask

// ───────────────────────────────────────────────────────────────
// 2. REALISTIC SCENARIO: User places an order
// ───────────────────────────────────────────────────────────────

setTimeout(() => {
    console.log("\n=== 2. Realistic Scenario: Place Order ===");

    // ── ES6 FEATURES ────────────────────────────────────────────
    const { name: userName, role } = user;        // destructuring
    const config = { timeout: 0, retries: 3 };
    const maxRetries = config.retries ?? 5;       // nullish coalescing
    const timeout   = config?.timeout ?? 1000;    // optional chaining + ??

    // ── PURE FUNCTION & IMMUTABILITY ────────────────────────────
    function applyDiscount({ price, qty }, discountPct) {
        const discount = price * qty * (discountPct / 100);
        return { price, qty, discount, total: price * qty - discount };
    }

    const item = { price: 500, qty: 2 };
    const priced = applyDiscount(item, 10); // new object, item unchanged
    console.log("item unchanged:", item);   // { price: 500, qty: 2 }
    console.log("priced:", priced);         // { price:500, qty:2, discount:100, total:900 }

    // ── HIGHER-ORDER + map/filter/reduce ─────────────────────────
    const cart = [
        { id: 1, name: "Laptop", price: 1000, qty: 1, active: true },
        { id: 2, name: "Mouse",  price: 50,   qty: 2, active: true },
        { id: 3, name: "HDMI",   price: 20,   qty: 0, active: false }, // out of stock
    ];

    const cartTotal = cart
        .filter(i => i.active && i.qty > 0)
        .map(i => i.price * i.qty)
        .reduce((sum, v) => sum + v, 0);

    console.log("cart total:", cartTotal); // 1100

    // ── ERROR HANDLING + CUSTOM ERRORS ──────────────────────────
    class OrderError extends Error {
        constructor(msg, code) {
            super(msg);
            this.name = "OrderError";
            this.code = code;
        }
    }

    function placeOrder(cart, userRole) {
        if (!cart.length) throw new OrderError("Cart is empty", 400);
        if (userRole !== "dev" && userRole !== "customer")
            throw new OrderError("Unauthorized", 403);
        return { orderId: 42, items: cart.length, status: "placed" };
    }

    try {
        const order = placeOrder(cart.filter(i => i.active), role);
        console.log("order placed:", order);
    } catch (e) {
        if (e instanceof OrderError) {
            console.log(`order error [${e.code}]:`, e.message);
        } else throw e;
    }

    // ── CLOSURES as factory ──────────────────────────────────────
    function createOrderProcessor(taxRate) {
        return {
            process(order) {
                const tax = order.total * taxRate;
                return { ...order, tax, grandTotal: order.total + tax };
            },
        };
    }
    const processor = createOrderProcessor(0.18);
    console.log("with tax:", processor.process({ total: 1000 }));

    // ── ASYNC FLOW ───────────────────────────────────────────────
    function fakeDB(data) {
        return new Promise(r => setTimeout(() => r({ saved: true, ...data }), 10));
    }

    async function saveOrder(orderData) {
        try {
            const [dbResult, emailResult] = await Promise.all([
                fakeDB({ type: "order", ...orderData }),
                fakeDB({ type: "email", to: userName }),
            ]);
            return { dbResult, emailResult };
        } catch (err) {
            throw new OrderError("Save failed: " + err.message, 500);
        }
    }

    saveOrder({ items: 2, total: 1100 })
        .then(r => console.log("saved:", r.dbResult.saved, r.emailResult.saved))
        .catch(e => console.log("save error:", e.message));

    // ── MEMORY ───────────────────────────────────────────────────
    // The processor closure is eligible for GC when no references remain.
    // The WeakMap pattern would work here for private order state.

}, 50); // offset so this block runs after module 1's output is visible

// ───────────────────────────────────────────────────────────────
// 3. CONCEPT MAP — how everything connects
// ───────────────────────────────────────────────────────────────

setTimeout(() => {
    console.log("\n=== 3. Concept Map ===");

    console.log(`
  Execution Context & Call Stack
        │
        ├── Hoisting (creation phase populates the context)
        │
        ├── Scope & Scope Chain (lexical environments linked)
        │     └── Closures (functions + captured environments)
        │
        ├── this Keyword (5 rules; arrow uses lexical this)
        │
        └── Prototypes (objects linked via __proto__)
              └── ES6 Classes (syntactic sugar over prototypes)

  Event Loop (orchestrates async)
        │
        ├── Microtask Queue: Promise.then, queueMicrotask, await
        │
        └── Macrotask Queue: setTimeout, setInterval, I/O

  Promises & async/await (built on Event Loop)
        └── Error Handling (try/catch, custom errors, .catch)

  ES6+ Features (language improvements)
        └── Destructuring, Spread/Rest, ?., ??, Template Literals

  Memory Management
        └── GC (Mark-and-Sweep), WeakMap/WeakSet, Leak patterns

  Functional Programming (patterns, not a separate engine)
        └── Pure functions, Immutability, map/filter/reduce,
            Compose/Pipe, Currying, Memoization

  ALL of the above run on the SINGLE-THREADED JS engine,
  managed by the EVENT LOOP.
  `);

}, 100);

// ───────────────────────────────────────────────────────────────
// 4. QUICK INTERVIEW CHECKLIST — test yourself
// ───────────────────────────────────────────────────────────────

setTimeout(() => {
    console.log("=== 4. Self-Test Checklist ===\n");

    const checks = [
        ["Hoisting",         "var → undefined; function → full body; let/const → TDZ"],
        ["Scope Chain",      "inner can read outer; determined at WRITE time (lexical)"],
        ["Closures",         "function + captured environment; captures by REFERENCE"],
        ["this (default)",   "global (non-strict) | undefined (strict)"],
        ["this (implicit)",  "object before the dot"],
        ["this (explicit)",  "call/apply/bind first argument"],
        ["this (new)",       "newly created object"],
        ["this (arrow)",     "inherits from enclosing lexical scope; can't rebind"],
        ["Prototype chain",  "obj → __proto__ → ... → Object.prototype → null"],
        ["__proto__ vs .prototype", "__proto__ on instances; .prototype on functions"],
        ["Event Loop order", "sync → drain microtasks → one macrotask → repeat"],
        ["Microtasks",       "Promise.then, queueMicrotask, await continuation"],
        ["Macrotasks",       "setTimeout, setInterval, I/O"],
        ["Promise states",   "pending → fulfilled | rejected (immutable once settled)"],
        ["Promise.all",      "all resolve → array; any reject → reject"],
        ["Promise.allSettled","never rejects; reports each result"],
        ["async/await",      "syntactic sugar; await → microtask after it"],
        ["Destructuring",    "array: position-based; object: key-based"],
        ["Spread vs Rest",   "spread: expands; rest: collects"],
        ["?? vs ||",         "?? → null/undefined only; || → any falsy"],
        ["GC Mark+Sweep",    "reachable = alive; unreachable = collected"],
        ["WeakMap",          "keys are objects; weak refs; not iterable"],
        ["Pure function",    "same input → same output; no side effects"],
        ["Immutability",     "return new data; never mutate original"],
        ["Currying",         "f(a,b,c) → f(a)(b)(c); enables partial application"],
        ["Compose/Pipe",     "compose: right→left; pipe: left→right"],
    ];

    checks.forEach(([topic, summary]) =>
        console.log(`  ✅ ${topic.padEnd(22)} → ${summary}`)
    );

    console.log("\n  All 4 days complete. 12 modules. ✓");
}, 200);
