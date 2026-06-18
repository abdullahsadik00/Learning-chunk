# Day 11 Assessment — TypeScript Decorators & Type Guards

**Theme:** You are adding cross-cutting concerns (logging, validation, rate limiting) to your ORM layer via decorators, and writing type-safe narrowing for external API data.

---

### Q1 — typeof type guard ⭐

**Scenario:** Your API utility function `formatValue(val)` receives a value that might be a `string`, `number`, or `boolean`. Each type must be formatted differently.

**Task:** Write `formatValue(val: string | number | boolean): string` using `typeof` narrowing. Handle all three cases. Show that TypeScript narrows the type inside each branch.

**Acceptance Criteria:**
- [ ] `typeof val === 'string'` branch — TypeScript narrows to `string`
- [ ] `typeof val === 'number'` branch — TypeScript narrows to `number` (format with `.toFixed(2)`)
- [ ] `typeof val === 'boolean'` branch — TypeScript narrows to `boolean`
- [ ] After all branches, TypeScript knows the union is exhausted (no `never` warning)
- [ ] Calling `formatValue(null)` is a TypeScript error (not in the union)

---

### Q2 — instanceof type guard ⭐

**Scenario:** Your error handling middleware receives an `unknown` error (could be `Error`, `PaymentError`, or an arbitrary object thrown by a third-party library).

**Task:** Write `handleError(error: unknown): string` that uses `instanceof` to check for `PaymentError` (subclass of `Error`), then generic `Error`, then falls through to a generic message.

**Acceptance Criteria:**
- [ ] `error instanceof PaymentError` — narrowed to `PaymentError`, accesses `.code`
- [ ] `error instanceof Error` — narrowed to `Error`, accesses `.message`
- [ ] Default case handles anything else (returns a generic `'Unknown error'` string)
- [ ] TypeScript knows `error.message` is safe only inside the `Error` branch
- [ ] Explains: `instanceof` checks the prototype chain at runtime

---

### Q3 — in operator type guard ⭐

**Scenario:** Your API response can be either a `SuccessResponse { data: T }` or an `ErrorResponse { error: string, code: number }`. They share no discriminant field.

**Task:** Write a type guard using `'error' in response` to determine the type, and use it in a handler function.

**Acceptance Criteria:**
- [ ] `'error' in response` narrows to `ErrorResponse`
- [ ] `'data' in response` (else branch) narrows to `SuccessResponse<T>`
- [ ] Both fields are accessible without type assertions inside their branches
- [ ] Explains: `in` operator checks property existence on the object and its prototype chain
- [ ] Shows why this is preferable to casting with `as` (safer — runtime check)

---

### Q4 — User-defined type guard ⭐

**Scenario:** After parsing JSON from an API, you have `unknown` data. You need a type guard `isUser(value: unknown): value is User` that validates the shape.

**Task:** Implement `isUser` that checks the value is an object with `id: string`, `name: string`, and `email: string`. Use it to safely access user fields without casting.

**Acceptance Criteria:**
- [ ] Return type is `value is User` (type predicate)
- [ ] Checks: value is not null, is an object, and has the required string fields
- [ ] After `if (isUser(parsed)) { ... }`, TypeScript treats `parsed` as `User` in that block
- [ ] `isUser({ id: 1, name: 'Alice' })` returns `false` (id is not a string)
- [ ] Explains: `value is User` tells TypeScript to narrow the type at the call site

---

### Q5 — Discriminated union narrowing ⭐

**Scenario:** Your API models payment methods as a discriminated union. Each type has a different set of required fields.

**Task:** Define `PaymentMethod = CardPayment | UpiPayment | NetbankingPayment` with a shared `type` discriminant. Write a function that switches on `type` and accesses the correct fields.

**Acceptance Criteria:**
- [ ] `CardPayment: { type: 'card', cardNumber: string, expiry: string }`
- [ ] `UpiPayment: { type: 'upi', vpa: string }`
- [ ] `NetbankingPayment: { type: 'netbanking', bankCode: string }`
- [ ] `switch(payment.type)` narrows correctly in each case
- [ ] Accessing `payment.cardNumber` inside the `'card'` case is valid; in other cases it's a TS error
- [ ] Exhaustiveness check with `never` in the `default` case

---

### Q6 — Assertion functions ⭐⭐

**Scenario:** Before processing a payment, you need to assert that the order ID is defined and non-empty. If not, throw a descriptive error. TypeScript should narrow the type after the assertion.

**Task:** Implement `assertDefined<T>(val: T | null | undefined, name: string): asserts val is T`. Show that after calling `assertDefined(orderId, 'orderId')`, TypeScript treats `orderId` as `string` (not `string | undefined`).

**Acceptance Criteria:**
- [ ] Return type is `asserts val is T`
- [ ] Throws `Error` if `val` is `null` or `undefined` (includes the `name` in the message)
- [ ] After the call, TypeScript narrows the type — no need for `!` operator
- [ ] Works for `orderId: string | undefined` → after assertion, treated as `string`
- [ ] Explains: `asserts val is T` is an assertion function signature — TypeScript knows if the function returns normally, the value is `T`

---

### Q7 — Class decorator ⭐⭐

**Scenario:** You want to seal all ORM model classes after definition so no new properties can be added (defence against prototype pollution and accidental mutation).

**Task:** Write a `@Sealed` class decorator that calls `Object.seal` on both the class constructor and its prototype.

**Acceptance Criteria:**
- [ ] Decorator receives the constructor function as its argument
- [ ] Calls `Object.seal(constructor)` and `Object.seal(constructor.prototype)`
- [ ] After applying `@Sealed`, trying to add a property to an instance at runtime silently fails (strict mode throws)
- [ ] `@Sealed` can be applied to any class without changing its interface
- [ ] Requires `experimentalDecorators: true` in `tsconfig.json`

---

### Q8 — Method decorator ⭐⭐

**Scenario:** You want to add execution time logging to any ORM method by decorating it. The `@Log` decorator should print the method name, arguments, and how long it took.

**Task:** Implement a `@Log` method decorator. It should wrap the original method: log inputs before calling, log the result and elapsed time after.

**Acceptance Criteria:**
- [ ] Decorator receives `(target, propertyKey, descriptor)`
- [ ] Wraps `descriptor.value` with a new function
- [ ] Logs: `[MethodName] called with: [args]` before the call
- [ ] Logs: `[MethodName] completed in Xms, result: [result]` after
- [ ] Returns the original result — does not change the method's behaviour
- [ ] Works for both sync and async methods (bonus: check if result is a Promise)

---

### Q9 — Decorator factory ⭐⭐

**Scenario:** You need a `@RateLimit(maxCalls, windowMs)` decorator that prevents a method from being called more than `maxCalls` times within `windowMs` milliseconds. If the limit is exceeded, throw a `RateLimitError`.

**Task:** Implement the decorator factory. Show it applied to a `PaymentService.charge()` method.

**Acceptance Criteria:**
- [ ] Outer function accepts `(maxCalls: number, windowMs: number)` and returns the actual decorator
- [ ] Decorator wraps the method and tracks call timestamps in a closure array
- [ ] On each call, filters out timestamps older than `windowMs`
- [ ] If filtered count ≥ `maxCalls`, throws `RateLimitError`
- [ ] Otherwise, records the current timestamp and calls the original method
- [ ] State (timestamps) is per-method-per-instance (not global)

---

### Q10 — Property decorator ⭐⭐

**Scenario:** ORM model fields must be validated when set. The `@MinLength(n)` decorator should throw if a string property is assigned a value shorter than `n`.

**Task:** Implement `@MinLength(n: number)` as a property decorator using `Object.defineProperty` to intercept the setter.

**Acceptance Criteria:**
- [ ] Decorator factory accepts `n: number`
- [ ] Uses `Object.defineProperty` to replace the property with a getter/setter pair
- [ ] Setter throws `Error` if the string length is less than `n`
- [ ] Setter stores the valid value in a private backing variable
- [ ] Getter returns the backing variable
- [ ] Applied as `@MinLength(3) name: string` on a class property

---

### Q11 — Decorator execution order ⭐⭐

**Scenario:** Three decorators are stacked on the same method. A developer asks what order they run in.

**Task:** Explain the two-phase execution order for stacked decorators. Given `@A @B @C method()`, state which decorator factory runs first and which decorator (wrapping function) runs first.

**Acceptance Criteria:**
- [ ] Decorator **factories** run top-to-bottom: A evaluates first, then B, then C
- [ ] Decorator **functions** (the returned decorators) run bottom-to-top: C wraps first, then B, then A
- [ ] The outermost wrapper (A) runs when the method is **called**
- [ ] Uses an analogy: "outer layers of an onion" — A wraps B wraps C wraps the original
- [ ] Demonstrates with a concrete example showing logged execution order

---

### Q12 — Control-flow analysis (assignments + truthiness) ⭐⭐

**Scenario:** A function receives `userId: string | null`. The developer assigns it inside an `if` block and TypeScript still reports it as possibly null after the block.

**Task:** Show how TypeScript tracks type through assignments, early returns, and truthiness checks. Demonstrate three patterns that make `userId` safe to use as `string` after the check.

**Acceptance Criteria:**
- [ ] Early return: `if (!userId) throw new Error(...)` — after this line, TypeScript knows `userId` is `string`
- [ ] Truthiness guard: `if (userId) { /* userId is string here */ }` — narrowed inside block only
- [ ] Ternary/assignment: `const id = userId ?? defaultId` — `id` is always `string`
- [ ] Explains control-flow analysis: TypeScript tracks type through branches and assignments
- [ ] Shows that reassigning `userId = null` after a guard widens the type back to `null`

---

### Q13 — isApiUser complex type guard ⭐⭐⭐

**Scenario:** Your API parsing layer receives raw JSON. You need a runtime validator that checks nested structures before using the data.

**Task:** Implement `isApiOrder(value: unknown): value is ApiOrder` where `ApiOrder = { id: string, user: { id: string, name: string }, items: { sku: string, qty: number }[], total: number }`.

**Acceptance Criteria:**
- [ ] Checks `value` is a non-null object
- [ ] Checks `value.id` is a string
- [ ] Checks `value.user` is an object with `id: string` and `name: string`
- [ ] Checks `value.items` is an array where every element has `sku: string` and `qty: number`
- [ ] Checks `value.total` is a number
- [ ] Returns `false` (not throw) if any check fails
- [ ] TypeScript narrows to `ApiOrder` after `if (isApiOrder(parsed))`

---

### Q14 — State machine with discriminated union + transitions ⭐⭐⭐

**Scenario:** An order's lifecycle is a state machine: `draft → submitted → processing → shipped → delivered`. Invalid transitions (e.g. draft → shipped) must be type errors.

**Task:** Model each state as an interface with a discriminant `status`. Write a `transition(order: OrderState, event: OrderEvent): OrderState` function that only allows valid transitions, using discriminated unions to enforce this.

**Acceptance Criteria:**
- [ ] States: `DraftOrder`, `SubmittedOrder`, `ProcessingOrder`, `ShippedOrder`, `DeliveredOrder` — each with a unique `status` literal
- [ ] Events: `SubmitEvent`, `StartProcessingEvent`, `ShipEvent`, `DeliverEvent`
- [ ] `transition` switches on `order.status` and `event.type`
- [ ] Invalid transitions (e.g. shipping a draft order) are unreachable code / `never` type errors
- [ ] TypeScript knows which fields are available in each state (e.g. `ShippedOrder` has `trackingNumber`)

---

### Q15 — Combining decorators and type guards in a validator ⭐⭐⭐

**Scenario:** Your `@Validate` method decorator should run user-defined type guards on each argument before calling the method.

**Task:** Implement `@Validate(...guards: Array<(v: unknown) => boolean>)`. Each guard in the array validates the corresponding argument. If any guard returns `false`, throw a `ValidationError` with the argument index. Demonstrate on a `createOrder(userId: string, amount: number)` method.

**Acceptance Criteria:**
- [ ] Decorator factory accepts an array of guard functions (one per parameter)
- [ ] Wraps the method to run each guard against the corresponding argument
- [ ] Throws `ValidationError` if any guard fails, including which argument index failed
- [ ] If all guards pass, calls the original method with original arguments
- [ ] Demonstrates with: `@Validate(isString, isPositiveNumber) createOrder(userId, amount)`
- [ ] `createOrder(42, -100)` → `ValidationError: argument 0 failed validation`
