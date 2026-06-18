# Day 5 Assessment — Error Handling · Memory Management · Functional Programming

**Theme:** You are hardening a payment gateway service. It must retry gracefully, avoid memory leaks under sustained load, and use pure functional pipelines for order processing.

---

### Q1 — Built-in error types ⭐

**Scenario:** Your team catches all errors with a generic `catch(e)` block. You want to add specific handling for type errors, reference errors, and range errors.

**Task:** Name four built-in JavaScript error types, give a one-line description of when each occurs, and write a `catch` block that handles each type differently.

**Acceptance Criteria:**
- [ ] `TypeError` — wrong type (calling a non-function, accessing property of null/undefined)
- [ ] `ReferenceError` — variable not declared
- [ ] `RangeError` — value out of valid range (array negative length, recursion stack overflow)
- [ ] `SyntaxError` — invalid JavaScript (only at parse time, not catchable at runtime in the usual way)
- [ ] `catch` block uses `instanceof` to distinguish and handle each differently

---

### Q2 — Custom error class ⭐

**Scenario:** Payment failures have different root causes (insufficient funds, expired card, network timeout). You want each to be a distinct, catchable error type.

**Task:** Create a `PaymentError` base class that extends `Error`, then `InsufficientFundsError` and `NetworkTimeoutError` as subclasses. Each should carry a `code` string property.

**Acceptance Criteria:**
- [ ] `PaymentError extends Error` — sets `this.name = 'PaymentError'`, calls `super(message)`
- [ ] `InsufficientFundsError extends PaymentError` — has `code = 'INSUFFICIENT_FUNDS'`
- [ ] `NetworkTimeoutError extends PaymentError` — has `code = 'NETWORK_TIMEOUT'`
- [ ] `catch(e)` can check `e instanceof InsufficientFundsError` or `e instanceof PaymentError`
- [ ] `e.message`, `e.name`, `e.code`, and `e.stack` are all populated

---

### Q3 — finally guarantees ⭐

**Scenario:** Your payment function acquires a database connection at the start. It must release the connection whether the payment succeeds, fails, or throws an unexpected error.

**Task:** Write a `processPayment()` function using `try/catch/finally` to model: acquire connection → process → release. Verify `finally` runs in all three outcomes: success, caught error, and uncaught re-throw.

**Acceptance Criteria:**
- [ ] `finally` block calls `releaseConnection()` in all cases
- [ ] If payment succeeds, `finally` runs after `try` completes
- [ ] If payment throws and is caught, `finally` runs after `catch`
- [ ] If `catch` re-throws, `finally` still runs before the error propagates
- [ ] `finally` return value does NOT override the `try`/`catch` return (explains the gotcha)

---

### Q4 — Pure functions ⭐

**Scenario:** A developer modified the `applyDiscount` function to update a global `stats` counter. QA reports tests are order-dependent — running them in a different sequence gives different results.

**Task:** Explain what a pure function is, identify why the modified `applyDiscount` is impure, and rewrite it as a pure function.

```js
let stats = { discountsApplied: 0 };
function applyDiscount(price, rate) {
  stats.discountsApplied++;  // side effect
  return price * (1 - rate);
}
```

**Acceptance Criteria:**
- [ ] Defines pure function: same input → same output, no side effects
- [ ] Identifies `stats.discountsApplied++` as the side effect (mutates external state)
- [ ] Rewritten version: takes `price` and `rate`, returns `price * (1 - rate)` — no mutations
- [ ] Explains: pure functions are testable, cacheable, and parallelisable
- [ ] The `stats` update should happen at the call site by the caller, not inside the function

---

### Q5 — map / filter / reduce pipeline ⭐

**Scenario:** Your orders array needs to be processed into a report: filter only completed orders, extract total amounts, and sum them.

**Task:** Using a single chained expression (no loops), filter orders where `status === 'completed'`, map to `order.total`, and reduce to a grand total.

```js
const orders = [
  { id: 1, status: 'completed', total: 1200 },
  { id: 2, status: 'pending',   total: 800 },
  { id: 3, status: 'completed', total: 450 },
];
```

**Acceptance Criteria:**
- [ ] Single expression: `orders.filter(...).map(...).reduce(..., 0)`
- [ ] Result is `1650`
- [ ] Original `orders` array is not mutated
- [ ] No intermediate variables (pure expression)
- [ ] Each method gets a clear, named callback or clear arrow function

---

### Q6 — Async error handling pitfalls ⭐⭐

**Scenario:** A developer wraps an async operation in `try/catch` but the error is still uncaught. There are three separate bugs — one with `setTimeout`, one with a missing `await`, and one with `.then` without `.catch`.

**Task:** Identify and fix all three bug patterns:

```js
// Bug 1
try {
  setTimeout(() => { throw new Error('timer error'); }, 100);
} catch(e) { console.log('caught:', e.message); }

// Bug 2
async function load() {
  try {
    const data = fetchData(); // missing await
    return data;
  } catch(e) { console.log('caught'); }
}

// Bug 3
fetchPayment().then(process); // no .catch
```

**Acceptance Criteria:**
- [ ] Bug 1: `try/catch` cannot catch errors thrown inside a `setTimeout` callback — fix with `try/catch` inside the callback or use a Promise
- [ ] Bug 2: without `await`, `fetchData()` returns a pending Promise — the `try/catch` catches synchronous errors only — fix by adding `await`
- [ ] Bug 3: adds `.catch(handleError)` to the chain
- [ ] Explains general rule: `try/catch` only catches synchronous code or `await`ed rejections

---

### Q7 — Memory leak: forgotten timer ⭐⭐

**Scenario:** Your dashboard polls for live payment status every second. After navigating away, the dashboard component is removed from the DOM but the server logs show the polling continues indefinitely.

**Task:** Write a `startPolling(callback, interval)` function that returns a `stop()` method. Show that calling `stop()` prevents the callback from ever firing again.

**Acceptance Criteria:**
- [ ] `setInterval` or recursive `setTimeout` is stored in a variable accessible by the returned `stop()`
- [ ] `stop()` calls `clearInterval` or `clearTimeout`
- [ ] After `stop()`, the callback never fires again
- [ ] Explains why forgetting to clear timers causes memory leaks and CPU waste (the callback closure keeps all its referenced variables alive)

---

### Q8 — WeakMap for private data ⭐⭐

**Scenario:** You are storing sensitive session metadata (internal audit flags) per user object. Using a regular `Map` holds a strong reference to the user object — it is never garbage-collected even after the user session ends.

**Task:** Use a `WeakMap` to associate private audit data with each user object. Show that when the user object goes out of scope, the metadata is eligible for GC. Explain why `WeakMap` allows this but `Map` does not.

**Acceptance Criteria:**
- [ ] `const auditData = new WeakMap()` created outside the function
- [ ] `auditData.set(userObj, { loginTime, ip })` associates data without exposing it on the object
- [ ] `auditData.get(userObj)` retrieves it
- [ ] Explains `WeakMap` holds **weak references** — the key object is not kept alive by the WeakMap
- [ ] Explains `Map` holds **strong references** — the key is never GC'd while the Map exists
- [ ] `WeakMap` keys must be objects; they are not iterable (no `.keys()`, `.values()`)

---

### Q9 — Function composition ⭐⭐

**Scenario:** Your order processing pipeline has five transformations: `validateOrder → enrichOrder → calculateTax → applyDiscount → formatResponse`. You want to compose them into a single function.

**Task:** Implement `pipe(...fns)` that takes any number of single-argument functions and returns a new function that applies them left-to-right. Also implement `compose(...fns)` that applies them right-to-left.

**Acceptance Criteria:**
- [ ] `pipe(f, g, h)(x)` → `h(g(f(x)))`
- [ ] `compose(f, g, h)(x)` → `f(g(h(x)))`
- [ ] Both use `reduce` (pipe) and `reduceRight` (compose) internally
- [ ] Works with any number of functions
- [ ] Demonstrates with the order pipeline: `const processOrder = pipe(validateOrder, enrichOrder, calculateTax, applyDiscount, formatResponse)`

---

### Q10 — Immutability in state updates ⭐⭐

**Scenario:** Your order management function mutates the incoming order object directly. In a React-style reactive system, this means the UI never updates because the object reference hasn't changed.

**Task:** Rewrite the three update functions below to be immutable — they should return new objects/arrays without mutating the original.

```js
function addItem(order, item)          { order.items.push(item); return order; }
function updateStatus(order, status)   { order.status = status; return order; }
function removeItem(order, sku)        { order.items = order.items.filter(i => i.sku !== sku); return order; }
```

**Acceptance Criteria:**
- [ ] `addItem` returns `{ ...order, items: [...order.items, item] }`
- [ ] `updateStatus` returns `{ ...order, status }`
- [ ] `removeItem` returns `{ ...order, items: order.items.filter(i => i.sku !== sku) }`
- [ ] All three return new objects — original `order` is unchanged
- [ ] Demonstrates with a test: `const original = ...; const updated = addItem(original, ...); original.items.length` is unchanged

---

### Q11 — Error chaining with .cause ⭐⭐

**Scenario:** Your payment service wraps third-party errors. When a network error is re-thrown as a `PaymentError`, the original cause is lost. Debugging becomes impossible.

**Task:** Use the `cause` option when throwing a new error to preserve the original error. Show how to log the full error chain.

**Acceptance Criteria:**
- [ ] `throw new PaymentError('Payment failed', { cause: originalError })`
- [ ] `error.cause` accesses the original error
- [ ] Error chain is logged: `error.message` → `error.cause.message`
- [ ] Explains that `{ cause }` was introduced in ES2022 and is now supported in modern Node.js/browsers
- [ ] Demonstrates a helper function that walks the `cause` chain and prints all messages

---

### Q12 — Currying for validation pipeline ⭐⭐⭐

**Scenario:** Your payment validation needs a composable rule system: each rule is a curried function that takes a config, then the value to validate.

**Task:** Implement three curried validators: `minLength(min)(str)`, `matches(regex)(str)`, and `isRequired()(value)`. Then compose them into a `validateCardNumber` that runs all three rules and returns an array of error messages.

**Acceptance Criteria:**
- [ ] Each validator is a curried function returning `null` on pass or an error string on fail
- [ ] `minLength(16)('1234')` → `'Must be at least 16 characters'`
- [ ] `matches(/^\d+$/)('1234abc')` → `'Must contain only digits'`
- [ ] `isRequired()('')` → `'Field is required'`
- [ ] `validateCardNumber` runs all validators and returns an array of non-null messages
- [ ] Demonstrates partial application: `const validatePin = [minLength(4), matches(/^\d+$/)]`

---

### Q13 — Stack vs heap + GC tracing ⭐⭐⭐

**Scenario:** You are presenting a memory model talk to junior developers. You need to explain why local variables in a function are cheap but objects passed between functions can accumulate.

**Task:** Draw (in words) the call stack and heap state at the point where `processPayment` is executing. Identify which values are on the stack and which are on the heap, and explain what happens when the function returns.

```js
function processPayment(orderId, amount) {
  const fee = 0.02;
  const order = { id: orderId, amount, fee: amount * fee };
  return chargeGateway(order);
}
processPayment('O1', 5000);
```

**Acceptance Criteria:**
- [ ] Stack frame for `processPayment`: contains `orderId` reference, `amount` (number on stack), `fee` (number on stack), `order` reference
- [ ] Heap: the `order` object `{ id: 'O1', amount: 5000, fee: 100 }` lives on the heap
- [ ] When `processPayment` returns: stack frame is popped; `order` is eligible for GC if nothing else holds a reference
- [ ] If `chargeGateway` stores `order` in a module-level cache, it stays alive (not GC'd)
- [ ] Explains: primitives are typically on the stack (or inlined); objects are always on the heap

---

### Q14 — Memoization with cache invalidation ⭐⭐⭐

**Scenario:** Your pricing engine memoizes `calculatePrice(productId)`. But prices change daily. You need the cache to expire after 60 seconds.

**Task:** Extend a `memoize(fn, ttlMs)` function so cached results expire after `ttlMs` milliseconds. After expiry, the next call should re-execute `fn` and cache the fresh result.

**Acceptance Criteria:**
- [ ] Each cache entry stores `{ value, timestamp }`
- [ ] On cache hit: checks if `Date.now() - timestamp < ttlMs`; if expired, re-fetches
- [ ] On cache miss or expiry: calls `fn`, stores new `{ value, timestamp: Date.now() }`, returns value
- [ ] Works for synchronous functions (async version is a bonus)
- [ ] Old expired entries are replaced, not accumulated

---

### Q15 — Pure functional order processor ⭐⭐⭐

**Scenario:** You need to build an order processor that is 100% pure and testable. The pipeline: filter invalid orders → apply regional pricing → sort by total descending → take top 10 → produce a report.

**Task:** Build `processOrders(orders, region)` as a pure pipeline using `filter`, `map`, `sort`, and `slice`. No mutations, no side effects, all transforms return new arrays.

**Acceptance Criteria:**
- [ ] Filters orders where `order.status === 'valid'`
- [ ] Maps each order to apply a regional multiplier (e.g. `IN` → 0.9, others → 1.0) to `total`
- [ ] Sorts by `total` descending without mutating the array (uses `[...arr].sort(...)`)
- [ ] Takes the top 10 with `.slice(0, 10)`
- [ ] Returns a summary object: `{ count, grandTotal, orders }`
- [ ] The original `orders` array is completely unchanged after calling the function
