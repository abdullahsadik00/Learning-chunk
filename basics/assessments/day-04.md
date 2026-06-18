# Day 4 Assessment — Promises, Async/Await & ES6+ Features

**Theme:** Your Node.js API integrates with a payment provider, an inventory service, and a shipping estimator. All three are async. You also refactor old ES5 code to modern ES6+.

---

### Q1 — Promise states ⭐

**Scenario:** A payment response object is passed around through several handlers. A developer asks if a resolved promise can ever become rejected later.

**Task:** List and describe the three Promise states. State the rules about state transitions. Can a resolved promise reject later?

**Acceptance Criteria:**
- [ ] Three states: `pending`, `fulfilled`, `rejected`
- [ ] Transitions: pending → fulfilled OR pending → rejected
- [ ] State transitions are **irreversible** — once settled, a promise never changes state
- [ ] No — a resolved promise cannot reject later
- [ ] The executor function runs **synchronously** when the Promise is constructed

---

### Q2 — Basic Promise chaining ⭐

**Scenario:** Your checkout API calls `validateCard()` then `chargeCard()` sequentially. Both return Promises. A developer nested them (callback-style), creating the "pyramid of doom".

**Task:** Rewrite the nested Promises below as a flat `.then()` chain. Each step should receive the previous step's resolved value.

```js
validateCard(cardData).then(function(isValid) {
  chargeCard(isValid).then(function(receipt) {
    sendConfirmation(receipt).then(function(result) {
      console.log(result);
    });
  });
});
```

**Acceptance Criteria:**
- [ ] `validateCard(cardData).then(...).then(...).then(...)` — flat chain, no nesting
- [ ] Each `.then` returns a value or Promise that the next `.then` receives
- [ ] `.catch(err => ...)` added at the end to handle any error in the chain
- [ ] Explains that returning a Promise inside `.then` automatically unwraps it

---

### Q3 — async/await error handling ⭐

**Scenario:** An order submission function uses `async/await`. When the inventory service returns a 404, the promise rejects but the error is swallowed silently.

**Task:** Rewrite the function to correctly catch errors with `try/catch`. Also show what happens if you forget `await` before a rejecting promise inside `try`.

**Acceptance Criteria:**
- [ ] `try/catch` wraps the `await` calls
- [ ] Caught error is logged and re-thrown or handled appropriately
- [ ] Explains that a rejected promise without `await` inside `try` is **not** caught by that `try/catch`
- [ ] `async` function always returns a Promise — so callers must also handle rejection

---

### Q4 — Destructuring assignment ⭐

**Scenario:** Your API response objects are deeply nested. You receive `{ user: { id: 42, address: { city: 'Mumbai', zip: '400001' } } }` and need to extract `id`, `city`, and `zip` in one line.

**Task:** Write a single destructuring assignment that extracts all three values from the nested object. Also rename `id` to `userId` during destructuring.

**Acceptance Criteria:**
- [ ] Single destructuring expression — no intermediate variables
- [ ] `userId` gets the value `42` (renamed from `id`)
- [ ] `city` gets `'Mumbai'`
- [ ] `zip` gets `'400001'`
- [ ] No mutation of the original object

---

### Q5 — Spread and rest operators ⭐

**Scenario:** You have a `baseConfig` object for your API client. For each region you need to create a merged config that overrides specific keys without mutating `baseConfig`.

**Task:** Show how to create `indiaConfig` from `baseConfig` by spreading it and overriding `baseUrl` and `timeout`. Then show a `mergeConfigs(...configs)` function that uses rest parameters to accept any number of config objects.

**Acceptance Criteria:**
- [ ] `indiaConfig = { ...baseConfig, baseUrl: '...', timeout: 5000 }` — spread creates a new object
- [ ] `baseConfig` is not mutated
- [ ] `mergeConfigs(...configs)` uses rest to collect all configs into an array
- [ ] Merges with `Object.assign({}, ...configs)` or `configs.reduce((acc, c) => ({ ...acc, ...c }), {})`
- [ ] Later configs override earlier ones (same key rule)

---

### Q6 — Promise.all vs Promise.allSettled ⭐⭐

**Scenario:** Your checkout calls inventory, pricing, and recommendations in parallel. If one fails, `Promise.all` cancels everything. But recommendations failing should not block checkout — only inventory and pricing are critical.

**Task:** Show how to use `Promise.all` for the critical calls and `Promise.allSettled` for all three. Explain the difference in reject behaviour.

**Acceptance Criteria:**
- [ ] `Promise.all([inventory, pricing])` — rejects immediately if either rejects
- [ ] `Promise.allSettled([inventory, pricing, recommendations])` — always resolves with all outcomes
- [ ] Result of `allSettled` is an array of `{ status: 'fulfilled', value }` or `{ status: 'rejected', reason }`
- [ ] Shows filtering the settled results to extract only fulfilled values
- [ ] Explains: use `Promise.all` when all must succeed; `allSettled` when you want all outcomes regardless

---

### Q7 — Sequential vs parallel async/await ⭐⭐

**Scenario:** Fetching three independent data sources — inventory, pricing, and reviews — takes 3 seconds total because they are `await`ed sequentially. Refactor them to run in parallel.

**Task:** Rewrite the sequential version to run all three fetches in parallel. Show both the `Promise.all` approach and the "fire then await" approach.

```js
// Sequential — 3 seconds total
const inventory = await fetchInventory(id);
const pricing   = await fetchPricing(id);
const reviews   = await fetchReviews(id);
```

**Acceptance Criteria:**
- [ ] Parallel approach 1: `const [inventory, pricing, reviews] = await Promise.all([fetchInventory(id), fetchPricing(id), fetchReviews(id)])`
- [ ] Parallel approach 2: start all three promises, then await each: `const p1 = fetch...; const p2 = fetch...; const p3 = fetch...; await p1; await p2; await p3;`
- [ ] Both run in ~1 second (limited by the slowest)
- [ ] Explains: `await` immediately means sequential; storing the Promise first means parallel
- [ ] Notes `Promise.all` short-circuits on first rejection; the "fire then await" approach does not

---

### Q8 — Optional chaining and nullish coalescing ⭐⭐

**Scenario:** Your API response sometimes omits nested fields. The old code has many `&&` guards. Refactor it to use optional chaining and nullish coalescing.

**Task:** Refactor the following:

```js
const city = user && user.address && user.address.city ? user.address.city : 'Unknown';
const discount = product.offers && product.offers[0] && product.offers[0].percent || 0;
```

**Acceptance Criteria:**
- [ ] `city = user?.address?.city ?? 'Unknown'`
- [ ] `discount = product.offers?.[0]?.percent ?? 0`
- [ ] Explains `?.` short-circuits and returns `undefined` (not throws) if any step is null/undefined
- [ ] Explains `??` only falls back for `null`/`undefined` — not for `0`, `''`, or `false`
- [ ] Explains why `||` is wrong for `discount` (would fall back to `0` if discount is `0`)

---

### Q9 — async/await inside loops ⭐⭐

**Scenario:** An order batch processor iterates over an array of orders and awaits each payment inside `forEach`. The payments all appear to process simultaneously and some fail silently.

**Task:** Explain why `await` inside `forEach` does NOT work as expected. Show the correct approach for both sequential processing and parallel processing of an array of async tasks.

**Acceptance Criteria:**
- [ ] `forEach` does not await the async callback — all iterations fire immediately
- [ ] Sequential: use `for...of` with `await` inside — processes one at a time
- [ ] Parallel: use `Promise.all(orders.map(order => processPayment(order)))` — fires all, waits for all
- [ ] Explains when sequential is preferred (e.g., rate-limited APIs) vs parallel (independent tasks)
- [ ] Demonstrates that errors in `forEach` async callbacks are uncaught

---

### Q10 — Promise.race for timeout ⭐⭐

**Scenario:** Your payment gateway sometimes hangs indefinitely. You need to reject the payment attempt if it doesn't respond within 5 seconds.

**Task:** Use `Promise.race` to implement a `withTimeout(promise, ms)` wrapper that rejects with a `'Request timed out'` error if the given promise doesn't resolve within `ms` milliseconds.

**Acceptance Criteria:**
- [ ] Creates a "timeout promise" using `new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms))`
- [ ] `Promise.race([originalPromise, timeoutPromise])` — whichever settles first wins
- [ ] If the original resolves first, the timeout promise is ignored (no memory leak note needed for interview but a bonus)
- [ ] `withTimeout(fetchPayment(), 5000)` rejects after 5s if payment doesn't respond
- [ ] Distinguishes `Promise.race` (first to settle, including rejection) vs `Promise.any` (first to resolve)

---

### Q11 — Template literals: tagged templates ⭐⭐

**Scenario:** You are building an SQL query builder. Plain string concatenation creates SQL injection vulnerabilities. You want a tagged template that automatically escapes values.

**Task:** Implement a `safeSQL` tagged template function that escapes any interpolated values by wrapping them in single quotes and replacing internal single quotes with `''`.

```js
const id = "1 OR 1=1";
const query = safeSQL`SELECT * FROM orders WHERE id = ${id}`;
// Should produce: SELECT * FROM orders WHERE id = '1 OR 1=1'
```

**Acceptance Criteria:**
- [ ] `safeSQL` receives `(strings, ...values)` as parameters
- [ ] Reconstructs the string by interleaving `strings` array with escaped `values`
- [ ] Each value is wrapped in single quotes
- [ ] Internal single quotes in values are replaced with `''` (SQL escaping)
- [ ] The resulting query cannot cause SQL injection via the interpolated value

---

### Q12 — Combining ES6 features: real API handler ⭐⭐⭐

**Scenario:** You are writing an order summary endpoint. The raw API response is verbose; you need to destructure, spread, and transform it into a clean summary object.

**Task:** Transform the raw response into the target shape using destructuring, spread, optional chaining, nullish coalescing, and array methods — in a single function with no intermediate variables beyond the destructuring itself.

```js
const raw = {
  orderId: 'ORD-001',
  customer: { id: 'C1', name: 'Priya', address: { city: 'Pune' } },
  items: [
    { sku: 'A1', qty: 2, price: 500 },
    { sku: 'A2', qty: 1, price: 1200 },
  ],
  coupon: null,
};
// Target:
// { id: 'ORD-001', customerName: 'Priya', city: 'Pune', total: 2200, couponApplied: false }
```

**Acceptance Criteria:**
- [ ] `id` from `orderId` via destructuring rename
- [ ] `customerName` from `customer.name` via nested destructuring
- [ ] `city` from `customer.address.city` via nested destructuring or optional chaining
- [ ] `total` computed with `.reduce()` on `items`
- [ ] `couponApplied` uses `?? false` or `!!coupon` — correctly `false` when coupon is `null`
- [ ] Result is a new object — original `raw` is not mutated

---

### Q13 — Promise error propagation ⭐⭐⭐

**Scenario:** Your checkout pipeline is a chain of six steps. An error in step 3 should skip steps 4 and 5 but still run a cleanup step 6. Using `.then()` chains, model this.

**Task:** Write a Promise chain where: steps 1–5 are simulated with `Promise.resolve` (step 3 rejects), and step 6 always runs regardless of error. Show how `.catch()` placement affects which steps are skipped.

**Acceptance Criteria:**
- [ ] Step 3 rejection propagates — steps 4 and 5 are skipped
- [ ] `.catch()` placed after step 5 catches the error
- [ ] Step 6 is implemented with `.finally()` or a `.then()` after `.catch()` and always runs
- [ ] Re-throwing inside `.catch()` continues propagation; returning a value resumes the chain
- [ ] Explains that `.then(onFulfilled, onRejected)` can also handle rejection inline but is rarely preferred over `.catch()`

---

### Q14 — Async generator for paginated API ⭐⭐⭐

**Scenario:** Your product catalogue has 10,000 items returned over multiple pages. You want to iterate lazily — fetch the next page only when needed — using an async generator.

**Task:** Implement an `async function*` called `fetchAllProducts(pageSize)` that yields products one page at a time, fetching the next page from a simulated `fetchPage(page, pageSize)` API. Consume it with `for await...of`.

**Acceptance Criteria:**
- [ ] Uses `async function*` syntax
- [ ] Calls `fetchPage(pageNum, pageSize)` on each iteration
- [ ] `yield`s each page's items (or each item individually — either is acceptable)
- [ ] Stops when the API returns an empty page or a `hasMore: false` flag
- [ ] Consumed with `for await (const products of fetchAllProducts(50)) { ... }`
- [ ] Pages are fetched lazily — page 2 is not fetched until page 1's items are consumed

---

### Q15 — unhandledRejection + .catch placement ⭐⭐⭐

**Scenario:** Your Node.js server intermittently crashes with `UnhandledPromiseRejectionWarning`. The developer added `.catch()` at the end of every chain but one path still slips through.

**Task:** Explain when an unhandled rejection occurs even when you believe you have `.catch()` coverage. Show an example where a Promise is created but the rejection is not caught. Show how to add a global `process.on('unhandledRejection', ...)` safety net. Explain why this safety net should not replace per-promise `.catch()`.

**Acceptance Criteria:**
- [ ] Unhandled rejection occurs when a Promise rejects and has no `.catch()` (or rejection handler) attached within the same microtask tick
- [ ] Example: `const p = Promise.reject(new Error('oops'))` — if nothing chains off `p`, it's unhandled
- [ ] Another example: forking a chain without catching the fork
- [ ] `process.on('unhandledRejection', (reason, promise) => { log(reason); process.exit(1); })`
- [ ] Explains the safety net is a last resort — it masks which specific operation failed, making debugging harder
- [ ] Best practice: every async call site has its own `.catch()` or is inside `try/catch`
