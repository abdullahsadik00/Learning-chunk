# Day 3 Assessment — Prototypes & Event Loop

**Theme:** You are building a Node.js API that calls multiple product, inventory, and shipping services. Understanding the prototype chain helps you write efficient shared behaviour; understanding the event loop helps you write non-blocking code.

---

### Q1 — Prototype chain lookup ⭐

**Scenario:** You have a `Product` constructor and instances created from it. A developer is surprised that calling `.toString()` works even though they never defined it.

**Task:** Explain the prototype chain lookup order for `p.toString()` where `p` is a plain `new Product()` instance that has no `toString` defined.

**Acceptance Criteria:**
- [ ] JavaScript first checks the object itself — no `toString` found
- [ ] Then checks `Product.prototype` — not there
- [ ] Then checks `Object.prototype` — finds `toString` here
- [ ] Then the chain ends at `null`
- [ ] Explains that all plain objects ultimately inherit from `Object.prototype`

---

### Q2 — \_\_proto\_\_ vs .prototype ⭐

**Scenario:** A junior developer is confused — they call `Product.prototype.describe` to add a shared method, but also see `__proto__` mentioned in stack traces.

**Task:** Explain the difference between `Function.prototype` (on constructor functions) and `__proto__` (on instances). Which one should you use in production code?

**Acceptance Criteria:**
- [ ] `Constructor.prototype` — the object that will become `__proto__` of instances created by `new Constructor()`
- [ ] `instance.__proto__` — the actual prototype link on the instance object (same object as `Constructor.prototype`)
- [ ] `__proto__` is non-standard (though widely supported); use `Object.getPrototypeOf(instance)` in production
- [ ] `Object.create(proto)` is the preferred way to set up inheritance chains without `new`

---

### Q3 — Methods on prototype vs constructor ⭐

**Scenario:** Your `Product` constructor defines `describe()` inside the constructor body. With 10,000 products in memory, the profiler shows unusually high memory usage.

**Task:** Explain why defining methods inside the constructor wastes memory, and rewrite the constructor to put the method on the prototype instead.

**Acceptance Criteria:**
- [ ] Methods inside the constructor create a **new function object** for every instance
- [ ] With 10,000 instances there are 10,000 identical `describe` functions in memory
- [ ] Prototype methods are defined **once** and shared across all instances
- [ ] Rewrite uses `Product.prototype.describe = function() { ... }`
- [ ] All instances still have access to the shared method via the prototype chain

---

### Q4 — Event loop: sync before async ⭐

**Scenario:** Your API's request handler logs a confirmation, then starts a `setTimeout`. A developer is confused about the print order.

**Task:** Without running the code, state the exact output order and explain why.

```js
console.log('Request received');

setTimeout(() => {
  console.log('Timeout fired');
}, 0);

console.log('Handler done');
```

**Acceptance Criteria:**
- [ ] Output order: `'Request received'` → `'Handler done'` → `'Timeout fired'`
- [ ] Explains synchronous code runs first and clears the call stack
- [ ] `setTimeout(fn, 0)` schedules `fn` as a macrotask — it only runs after the current call stack is empty
- [ ] `setTimeout(fn, 0)` does NOT mean "run immediately"

---

### Q5 — Microtask before macrotask ⭐

**Scenario:** Your API fires a resolved Promise and a `setTimeout` at the same time. You need to know which callback runs first to understand ordering in your request pipeline.

**Task:** Without running it, state the exact output order:

```js
console.log('start');

setTimeout(() => console.log('timeout'), 0);

Promise.resolve().then(() => console.log('promise'));

console.log('end');
```

**Acceptance Criteria:**
- [ ] Output: `'start'` → `'end'` → `'promise'` → `'timeout'`
- [ ] Sync code runs first
- [ ] After sync code, the **entire microtask queue** drains (Promise.then callbacks)
- [ ] Only then does one macrotask (setTimeout callback) run
- [ ] States the priority: Sync > Microtask > Macrotask

---

### Q6 — Prototype-based inheritance ⭐⭐

**Scenario:** Your API models `PhysicalProduct` and `DigitalProduct` as subtypes of `Product`. You need to share common methods while allowing each type to override `deliver()`.

**Task:** Implement prototype-based inheritance (pre-ES6 style) for these three constructors. `PhysicalProduct.deliver()` should return `'Ship to address'`; `DigitalProduct.deliver()` should return `'Send download link'`; both inherit a `describe()` method from `Product`.

**Acceptance Criteria:**
- [ ] `PhysicalProduct.prototype = Object.create(Product.prototype)`
- [ ] `PhysicalProduct.prototype.constructor` is fixed back to `PhysicalProduct`
- [ ] Parent constructor called with `Product.call(this, name, price)` inside child constructors
- [ ] Both child types have their own `deliver()` that overrides any parent version
- [ ] `phys instanceof Product` → `true`; `phys instanceof PhysicalProduct` → `true`

---

### Q7 — ES6 class syntax sugar ⭐⭐

**Scenario:** You want to rewrite the Q6 inheritance using ES6 `class` syntax for readability. Confirm it produces the same prototype structure.

**Task:** Rewrite the `Product`, `PhysicalProduct`, and `DigitalProduct` constructors as ES6 classes. Add a `describe()` method on `Product` and override `deliver()` on each subclass.

**Acceptance Criteria:**
- [ ] Uses `class Product { constructor(...) { } describe() { } }`
- [ ] Uses `class PhysicalProduct extends Product { constructor(...) { super(...); } deliver() { } }`
- [ ] `super()` is called before accessing `this` in child constructor
- [ ] `Object.getPrototypeOf(PhysicalProduct.prototype) === Product.prototype` → `true`
- [ ] Instances behave identically to the prototype-based version

---

### Q8 — hasOwnProperty vs in ⭐⭐

**Scenario:** Your API iterates over product properties to build a JSON payload. You notice it sometimes includes prototype methods in the output.

**Task:** Explain the difference between `for...in` with and without `hasOwnProperty`. Demonstrate how to safely iterate only own properties, and show `Object.keys()` as a modern alternative.

**Acceptance Criteria:**
- [ ] `for...in` iterates all enumerable properties including inherited ones
- [ ] `hasOwnProperty(key)` returns `true` only for own (not inherited) properties
- [ ] `Object.keys(obj)` returns only own enumerable properties (no prototype methods)
- [ ] Demonstrates both approaches with a `Product` that has inherited methods on the prototype
- [ ] Notes that `JSON.stringify()` also skips prototype properties automatically

---

### Q9 — Microtask starvation ⭐⭐

**Scenario:** A developer chains Promise `.then()` calls infinitely in a loop. The server appears frozen — HTTP responses stop arriving. Explain what happened.

**Task:** Explain what happens when microtasks keep spawning new microtasks indefinitely. What is "microtask starvation" and why does it block the event loop?

**Acceptance Criteria:**
- [ ] The event loop drains the **entire** microtask queue before processing any macrotask (including I/O events)
- [ ] If each Promise `.then` schedules another `.then`, the microtask queue never empties
- [ ] Macrotasks (I/O, HTTP handlers, timers) are starved — they never get to run
- [ ] This effectively freezes all I/O on the server
- [ ] Fix: break long promise chains into chunks using `setImmediate`/`setTimeout` to yield to macrotasks

---

### Q10 — Property shadowing ⭐⭐

**Scenario:** You want to give a specific product a custom `describe()` that overrides the shared prototype method, without affecting other products.

**Task:** Demonstrate property shadowing: set a custom `describe()` directly on one instance. Show that the custom method is called on that instance but the shared prototype method is called on other instances. Then show how to delete the shadow to restore prototype access.

**Acceptance Criteria:**
- [ ] Custom method set directly on instance: `productA.describe = function() { return 'custom'; }`
- [ ] `productA.describe()` calls the instance method (shadow)
- [ ] `productB.describe()` calls the prototype method (no shadow)
- [ ] `delete productA.describe` removes the shadow
- [ ] After delete, `productA.describe()` again calls the prototype method
- [ ] Explains `hasOwnProperty` returns `true` for the shadow and `false` after delete

---

### Q11 — Event loop: async/await order ⭐⭐

**Scenario:** Your order processing pipeline mixes async/await with synchronous code. A developer is unsure what order things run in.

**Task:** Without running the code, trace the exact output order:

```js
async function processOrder() {
  console.log('A');
  await Promise.resolve();
  console.log('B');
  await Promise.resolve();
  console.log('C');
}

console.log('1');
processOrder();
console.log('2');
```

**Acceptance Criteria:**
- [ ] Output: `'1'` → `'A'` → `'2'` → `'B'` → `'C'`
- [ ] `processOrder()` starts synchronously — logs `'A'`
- [ ] `await` pauses `processOrder` and returns control to the caller (microtask scheduled)
- [ ] Synchronous `console.log('2')` runs
- [ ] Then microtask resumes `processOrder` — logs `'B'`
- [ ] Another `await` schedules another microtask — `'C'` logs in the next microtask tick

---

### Q12 — Prototype pollution ⭐⭐⭐

**Scenario:** Your API accepts product metadata as JSON. A security researcher reports a prototype pollution vulnerability where a crafted payload like `{"__proto__": {"isAdmin": true}}` gives all objects admin rights.

**Task:** Explain how prototype pollution works, show the attack payload, and provide three different defences.

**Acceptance Criteria:**
- [ ] Explains the attack: setting `obj["__proto__"]["isAdmin"] = true` modifies `Object.prototype`, affecting **all** plain objects
- [ ] After the attack, `{}.isAdmin` returns `true` on any new object
- [ ] Defence 1: validate input keys — reject any key equal to `__proto__`, `constructor`, or `prototype`
- [ ] Defence 2: use `Object.create(null)` as the merge target — no prototype to pollute
- [ ] Defence 3: use `Map` instead of a plain object for untrusted key-value data
- [ ] Bonus: `Object.freeze(Object.prototype)` prevents modification but breaks some libraries

---

### Q13 — Event loop: Promise.all with mixed timing ⭐⭐⭐

**Scenario:** Your API fetches from three services concurrently. You need to predict when each resolves relative to synchronous and async code.

**Task:** Without running it, state the output order:

```js
console.log('fetch start');

Promise.all([
  Promise.resolve('inventory'),
  new Promise(resolve => setTimeout(() => resolve('shipping'), 100)),
  Promise.resolve('pricing'),
]).then(results => console.log('results:', results));

console.log('fetch queued');
```

**Acceptance Criteria:**
- [ ] `'fetch start'` → `'fetch queued'` — sync code runs first
- [ ] After ~100ms, the `shipping` promise resolves → `Promise.all` resolves
- [ ] `'results: ["inventory", "shipping", "pricing"]'` logs after all three settle
- [ ] Explains `Promise.all` waits for the slowest (the 100ms timer)
- [ ] Results array preserves input order regardless of resolution order

---

### Q14 — Classic interview: event loop trace ⭐⭐⭐

**Scenario:** A senior engineer gives you this snippet in an interview and asks for the exact output order.

**Task:** Trace every `console.log` and state the output in order:

```js
console.log('1');

setTimeout(function() {
  console.log('2');
  Promise.resolve().then(function() {
    console.log('3');
  });
}, 0);

Promise.resolve().then(function() {
  console.log('4');
  setTimeout(function() {
    console.log('5');
  }, 0);
});

console.log('6');
```

**Acceptance Criteria:**
- [ ] `'1'` — sync
- [ ] `'6'` — sync
- [ ] `'4'` — microtask (Promise.then after sync)
- [ ] `'2'` — first macrotask (setTimeout registered before Promise.then's setTimeout)
- [ ] `'3'` — microtask spawned inside setTimeout callback (drains before next macrotask)
- [ ] `'5'` — second macrotask (registered during '4', runs after '3')
- [ ] Final order: `1, 6, 4, 2, 3, 5`

---

### Q15 — Object.create inheritance without constructors ⭐⭐⭐

**Scenario:** You want to create a lightweight product variant system using `Object.create` directly (no `class` or constructor function) so you can compose behaviours without classical inheritance.

**Task:** Use `Object.create` to build a `baseProduct` prototype object, then create a `premiumProduct` that inherits from it and overrides `getPrice()` to add a 20% markup. Demonstrate that `premiumProduct` can access `baseProduct`'s methods.

**Acceptance Criteria:**
- [ ] `baseProduct` is a plain object with `getName()` and `getPrice()` methods
- [ ] `premiumProduct = Object.create(baseProduct)` — sets `baseProduct` as prototype
- [ ] `premiumProduct.getPrice` is overridden to call the parent via `Object.getPrototypeOf(this).getPrice.call(this)` and multiply by 1.2
- [ ] `premiumProduct.getName()` correctly delegates to `baseProduct.getName`
- [ ] `Object.getPrototypeOf(premiumProduct) === baseProduct` → `true`
- [ ] No `class` keyword or `new` is used
