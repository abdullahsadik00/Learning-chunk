# Day 2 Assessment — Closures & `this` Keyword

**Theme:** You are building interactive product pages and a user-account service. The bugs all trace back to misunderstanding closures and how `this` is bound.

---

### Q1 — Basic closure ⭐

**Scenario:** You need a counter for the number of times a "Add to Wishlist" button is clicked per product, isolated per product instance.

**Task:** Write a `createWishlistCounter()` factory that returns an object with `add()` and `getCount()` methods. Each call to the factory produces an independent counter.

**Acceptance Criteria:**
- [ ] The count variable is enclosed inside the factory function — not on the returned object
- [ ] `add()` increments the count
- [ ] `getCount()` returns the current count
- [ ] Two counters created by separate `createWishlistCounter()` calls have independent counts
- [ ] External code cannot directly set or read the count variable

---

### Q2 — Closure captures by reference ⭐

**Scenario:** A developer expects this code to log `0, 1, 2` but it logs `3, 3, 3`. Explain why.

```js
const fns = [];
for (var i = 0; i < 3; i++) {
  fns.push(function() { return i; });
}
console.log(fns[0](), fns[1](), fns[2]());
```

**Acceptance Criteria:**
- [ ] States closures capture the **variable** (reference), not the **value** at capture time
- [ ] Explains that by the time the functions run, the loop has finished and `i === 3`
- [ ] All three functions share the same `i` variable from the enclosing scope
- [ ] Gives a fix: `let i` in the loop, or an IIFE wrapper

---

### Q3 — Memoization with closure ⭐

**Scenario:** Your product page calls an expensive `fetchProductDetails(id)` function on every hover. You want to cache results so each product ID is only fetched once.

**Task:** Write a `memoize(fn)` higher-order function that caches results using a closure. If the same argument is passed again, return the cached result without calling `fn`.

**Acceptance Criteria:**
- [ ] Cache is stored inside `memoize` via closure — not on a global variable
- [ ] First call with a given argument calls `fn` and stores the result
- [ ] Second call with the same argument returns cached result without calling `fn`
- [ ] Different arguments produce independent cache entries
- [ ] Works for a function that returns a computed value (not just `console.log`)

---

### Q4 — Default binding (this) ⭐

**Scenario:** A helper function `getCartTotal()` uses `this.items` but logs `undefined`. It is called as a plain function, not as a method.

**Task:** Explain what `this` refers to when a function is called with no context (default binding), in both strict mode and non-strict mode.

**Acceptance Criteria:**
- [ ] Non-strict mode: `this` is the global object (`window` in browser, `global` in Node)
- [ ] Strict mode (`'use strict'`): `this` is `undefined`
- [ ] Accessing `this.items` in strict mode throws `TypeError: Cannot read properties of undefined`
- [ ] Suggests a fix: pass items as a parameter, or use a class/method

---

### Q5 — Implicit binding loss ⭐

**Scenario:** A `user` object has a `greet()` method that uses `this.name`. When you pass `user.greet` as a callback to `setTimeout`, it logs `undefined` instead of the user's name.

**Task:** Explain why `this` is lost when a method is extracted or passed as a callback, and show two ways to fix it.

**Acceptance Criteria:**
- [ ] Explains that only the function reference is passed — the object context is lost
- [ ] When called as a plain callback, `this` falls back to default binding (global or undefined)
- [ ] Fix 1: use `.bind(user)` to permanently bind `this`
- [ ] Fix 2: wrap in an arrow function `() => user.greet()` — arrow captures lexical `this`
- [ ] Both fixes produce the correct name output

---

### Q6 — Debounce implementation ⭐⭐

**Scenario:** The product search fires an API request on every keystroke. With 50 keystrokes per second this hits rate limits. You need to debounce the calls so the API is only hit 300 ms after the user stops typing.

**Task:** Implement a `debounce(fn, delay)` function. Return a debounced version of `fn` that only executes `delay` ms after the last invocation.

**Acceptance Criteria:**
- [ ] Uses `setTimeout` and `clearTimeout` stored via closure
- [ ] Each call resets the timer — the function only fires after `delay` ms of silence
- [ ] The debounced function passes all arguments through to `fn`
- [ ] Multiple rapid calls result in only one execution
- [ ] After the delay fires, the next call starts a fresh timer

---

### Q7 — Explicit binding: call vs apply vs bind ⭐⭐

**Scenario:** You have a `formatPrice` utility that uses `this.currency`. You need to call it in three different ways: once immediately with an object, once immediately with arguments as an array, and once as a pre-bound function for later reuse.

**Task:** Using the same `formatPrice` function and a `store` object, demonstrate the correct use of `.call()`, `.apply()`, and `.bind()`. Explain when you would choose each.

```js
function formatPrice(amount, decimals) {
  return `${this.currency}${amount.toFixed(decimals)}`;
}
const store = { currency: '₹' };
```

**Acceptance Criteria:**
- [ ] `.call(store, 1299, 2)` → invokes immediately with spread args
- [ ] `.apply(store, [1299, 2])` → invokes immediately with args as array
- [ ] `.bind(store)` → returns a new function; calling it later with `(1299, 2)` gives same result
- [ ] All three produce `'₹1299.00'`
- [ ] Explains: call = comma-separated args; apply = array of args; bind = deferred call

---

### Q8 — Arrow function & lexical this ⭐⭐

**Scenario:** A `Timer` class starts an interval that is supposed to update `this.elapsed` every second. With a regular function it breaks; with an arrow function it works.

**Task:** Explain why this code fails and rewrite the `start` method so `this.elapsed` increments correctly.

```js
class Timer {
  constructor() { this.elapsed = 0; }
  start() {
    setInterval(function() {
      this.elapsed++;          // breaks
      console.log(this.elapsed);
    }, 1000);
  }
}
```

**Acceptance Criteria:**
- [ ] Explains that the `function` callback has its own `this` binding — in non-strict mode it is `window`, so `this.elapsed` is `NaN` or creates a global variable
- [ ] Fix: replace the callback with an arrow function — arrow functions inherit `this` from the enclosing lexical scope (the class method)
- [ ] Arrow function version correctly increments and logs `1, 2, 3, …`
- [ ] Notes that arrow functions cannot be rebound with `.bind()`, `.call()`, or `.apply()`

---

### Q9 — new binding ⭐⭐

**Scenario:** You are using a constructor function (not a class) to create product objects. A junior dev calls the function without `new` and gets `undefined` instead of a product object.

**Task:** Explain the four steps JavaScript takes when a function is called with `new`. Then write a safe constructor that works correctly with or without `new`.

**Acceptance Criteria:**
- [ ] Lists the four `new` steps: (1) creates a new object, (2) sets its prototype, (3) binds `this` to the new object, (4) returns the new object (unless the function explicitly returns a different object)
- [ ] Explains why calling without `new` makes `this` the global object and returns `undefined`
- [ ] Safe version checks `if (!(this instanceof Product)) return new Product(name, price)`
- [ ] Alternatively, shows how ES6 classes throw on missing `new` automatically

---

### Q10 — Stale closure in React-style pattern ⭐⭐

**Scenario:** A notification component uses a manual setInterval (not React) to check for unread messages. After 10 seconds it always shows the initial count, even if new messages arrived.

**Task:** Identify the stale closure bug in the code below and fix it.

```js
let unread = 0;

function startPolling() {
  const snapshot = unread;  // captured once
  setInterval(function() {
    if (unread !== snapshot) {
      console.log('New messages:', unread - snapshot);
    }
  }, 1000);
}

// Simulated message arrival
setTimeout(() => { unread = 5; }, 3000);
startPolling();
```

**Acceptance Criteria:**
- [ ] Identifies that `snapshot` is captured at the time `startPolling` is called and never updates
- [ ] The interval callback compares `unread` (live) against `snapshot` (stale) — which is fine for a "new since start" use case
- [ ] However, if the goal is "new since last check", explains why a `lastSeen` ref must be updated on each interval tick
- [ ] Provides a corrected version that tracks the last-seen count inside the interval and logs incremental new messages
- [ ] Explains the general rule: closures capture the variable reference — if the goal is "latest value", update a mutable container

---

### Q11 — Closure for data privacy ⭐⭐

**Scenario:** You are building a user authentication module. The session token must be stored privately — readable only through `getToken()`, not directly accessible on the returned object.

**Task:** Implement a `createSession(token)` function that stores `token` privately and returns an object with: `getToken()`, `isValid()` (returns true if token is non-empty), and `revoke()` (clears the token).

**Acceptance Criteria:**
- [ ] `token` is in closure scope — not a property of the returned object
- [ ] `getToken()` returns the token
- [ ] `isValid()` returns `true` when token is a non-empty string, `false` after revoke
- [ ] `revoke()` sets the internal token to `null` or `''`
- [ ] After `revoke()`, `isValid()` returns `false` and `getToken()` returns `null`/`''`
- [ ] `session.token` from outside returns `undefined`

---

### Q12 — Binding priority ⭐⭐⭐

**Scenario:** A developer chains multiple binding methods and is confused about which `this` wins.

**Task:** Without running the code, state what each call logs and explain the binding priority rule that applies.

```js
function identify() { return this.name; }

const obj1 = { name: 'Alice' };
const obj2 = { name: 'Bob' };

const bound = identify.bind(obj1);
console.log(bound.call(obj2));          // A
console.log(bound.apply(obj2));         // B

function Wrapper(name) {
  this.name = name;
}
Wrapper.prototype.identify = identify.bind(obj1);
const w = new Wrapper('Charlie');
console.log(w.identify());              // C
```

**Acceptance Criteria:**
- [ ] A → `'Alice'` — `bind` wins over `call` (explicit bind cannot be overridden by another explicit binding)
- [ ] B → `'Alice'` — same rule for `apply`
- [ ] C → `'Charlie'` — `new` binding overrides `bind` (highest priority)
- [ ] States the priority order: `new` > `bind/call/apply` > implicit (method call) > default

---

### Q13 — Partial application with bind ⭐⭐⭐

**Scenario:** Your discount calculator accepts three arguments: `(basePrice, taxRate, discountCode)`. You want to create a region-specific version pre-set to India's tax rate (18%) so callers only need to pass `(basePrice, discountCode)`.

**Task:** Use `.bind()` to create `calculateINPrice` from the full `calculatePrice` function. Demonstrate it works. Explain what partial application is.

```js
function calculatePrice(basePrice, taxRate, discountCode) {
  const discount = discountCode === 'SAVE10' ? 0.1 : 0;
  return basePrice * (1 + taxRate) * (1 - discount);
}
```

**Acceptance Criteria:**
- [ ] `calculateINPrice = calculatePrice.bind(null, /* basePrice is still free */)` — actually binds `taxRate` as the second arg
- [ ] Correct bind: `calculatePrice.bind(null, ???)` — explains which argument position is being locked
- [ ] Actually: `bind(null)` keeps `this` as global/null; extra arguments are pre-filled left-to-right
- [ ] Calling `calculateINPrice(1000, 'SAVE10')` returns `1062` (1000 × 1.18 × 0.9)
- [ ] Explains partial application: pre-filling some arguments of a function to create a specialized version

---

### Q14 — Currying via closures ⭐⭐⭐

**Scenario:** Your pricing engine needs to support composable price rules: first apply a region multiplier, then apply a discount, then apply tax. Each rule should be a curried function so they can be composed.

**Task:** Implement a `curry(fn)` function that converts any multi-argument function into a series of single-argument functions. Show it working with a three-argument price formula.

**Acceptance Criteria:**
- [ ] `curry(fn)` returns a function that, when not all arguments are provided, returns another function waiting for the next argument
- [ ] `curriedFn(a)(b)(c)` produces the same result as `fn(a, b, c)`
- [ ] Works for any arity (uses `fn.length` to know when all args are received)
- [ ] Calling with all args at once `curriedFn(a, b, c)` also works
- [ ] Demonstrates with a price formula: `curry(price)(1000)(0.18)(0.10)` → correct result

---

### Q15 — this inside class methods passed as callbacks ⭐⭐⭐

**Scenario:** A checkout service class has several methods. When one method is passed to an event emitter as a callback, `this` is lost. You need to solve this for all methods at once without `.bind()` on each call site.

**Task:** Show three techniques to fix `this` binding on class methods so they work correctly when passed as callbacks. Compare their trade-offs.

```js
class CheckoutService {
  constructor(orderId) { this.orderId = orderId; }
  confirm()  { console.log('Confirmed:', this.orderId); }
  cancel()   { console.log('Cancelled:', this.orderId); }
}
```

**Acceptance Criteria:**
- [ ] Technique 1: Class field arrow functions — `confirm = () => { ... }` — lexically bound, no prototype sharing
- [ ] Technique 2: Bind in constructor — `this.confirm = this.confirm.bind(this)` — preserves prototype, explicit
- [ ] Technique 3: Use a `Proxy` or wrapper to auto-bind — advanced, overkill for most cases
- [ ] States trade-off: arrow class fields create a new function per instance (memory); constructor bind is explicit; prototype methods are shared but need binding per use
- [ ] All three techniques produce the correct `orderId` when the method is called as a callback
