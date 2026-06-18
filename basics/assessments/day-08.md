# Day 8 Assessment — TypeScript Fundamentals & Type System

**Theme:** You are typing an existing REST API client that was written in plain JavaScript. The API returns user, product, and order objects. Your goal is to add TypeScript types so the codebase is safe and self-documenting.

---

### Q1 — Primitive type annotations ⭐

**Scenario:** The API client has three helper functions with no type information. A developer accidentally passes `null` as a price and the bug reaches production.

**Task:** Add TypeScript type annotations to the three functions below. The return types should be inferred where possible, but parameters must be explicitly typed.

```ts
function formatPrice(amount, currency) { return `${currency}${amount.toFixed(2)}`; }
function isInStock(quantity) { return quantity > 0; }
function buildUrl(baseUrl, path, version) { return `${baseUrl}/v${version}/${path}`; }
```

**Acceptance Criteria:**
- [ ] `amount: number`, `currency: string` — return type inferred as `string`
- [ ] `quantity: number` — return type inferred as `boolean`
- [ ] `baseUrl: string`, `path: string`, `version: number` — return type inferred as `string`
- [ ] TypeScript would error if `null` is passed for `amount` (strict mode assumed)
- [ ] No unnecessary explicit return types added (inferred is preferred where clear)

---

### Q2 — Special types: any vs unknown ⭐

**Scenario:** An API response parser currently types the response as `any`. A developer accesses `response.data.user.name` without any check and crashes in production when the response is missing `data`.

**Task:** Explain the difference between `any` and `unknown`. Show how typing the response as `unknown` forces you to check the type before accessing properties, preventing the crash.

**Acceptance Criteria:**
- [ ] `any`: TypeScript opts out of type checking — you can access any property without error
- [ ] `unknown`: TypeScript forces you to narrow the type before using it
- [ ] Shows that `response.data` on an `unknown` type is a compile error
- [ ] Shows a type guard or type assertion that narrows `unknown` to a known shape
- [ ] Explains: prefer `unknown` for external data; use `any` only as a last resort escape hatch

---

### Q3 — Object type with optional and readonly ⭐

**Scenario:** Your API returns a `Product` object. The `discountPrice` is optional (not all products have a discount). The `sku` must never be changed after creation.

**Task:** Define a `Product` interface with appropriate modifiers. Then show what TypeScript errors occur when: (a) you try to assign to `sku`, and (b) you try to access `discountPrice` without checking if it exists.

**Acceptance Criteria:**
- [ ] `sku: readonly string` — TypeScript error on reassignment
- [ ] `discountPrice?: number` — type is `number | undefined`
- [ ] Accessing `discountPrice.toFixed(2)` without narrowing is a TS error (`possibly undefined`)
- [ ] Correct narrowing: `if (product.discountPrice !== undefined) { ... }`
- [ ] `readonly` prevents reassignment at compile time only (not runtime)

---

### Q4 — Union types and type narrowing ⭐

**Scenario:** Your API has a `formatId(id)` function that accepts both numeric IDs (from the DB) and string UUIDs (from a legacy system).

**Task:** Type `formatId(id: number | string): string`. Inside the function, use `typeof` narrowing to handle each case: numbers are formatted as `#${id.toString().padStart(6, '0')}`, strings are returned as-is.

**Acceptance Criteria:**
- [ ] Parameter typed as `number | string`
- [ ] `typeof id === 'number'` branch handles the number case
- [ ] `else` branch handles the string case — TypeScript narrows to `string` there
- [ ] Return type is `string`
- [ ] No type assertions used — pure narrowing

---

### Q5 — Literal types and const assertions ⭐

**Scenario:** Order statuses in your API are a fixed set of strings. A developer passes `'CANCELD'` (typo) and it silently passes type checking because the parameter is typed as `string`.

**Task:** Define an `OrderStatus` type as a union of string literals. Update the function signature to use it. Show that the typo now causes a compile error.

**Acceptance Criteria:**
- [ ] `type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'CANCELLED' | 'DELIVERED'`
- [ ] Function parameter typed as `OrderStatus`
- [ ] `'CANCELD'` (typo) causes a TypeScript error — not assignable to `OrderStatus`
- [ ] Shows `as const` on an object or array to infer literal types
- [ ] Explains the difference: `const status = 'PENDING'` (literal type `'PENDING'`) vs `let status = 'PENDING'` (widened to `string`)

---

### Q6 — Intersection types for composing interfaces ⭐⭐

**Scenario:** Your API has a `User` type and an `AuditFields` type (`createdAt`, `updatedAt`, `createdBy`). Every API resource that has audit fields needs both.

**Task:** Define `User`, `AuditFields`, and `AuditedUser = User & AuditFields`. Show that `AuditedUser` requires all fields from both. Then extend it further to `AuditedAdmin = AuditedUser & { permissions: string[] }`.

**Acceptance Criteria:**
- [ ] `User`: `id`, `name`, `email`
- [ ] `AuditFields`: `createdAt: Date`, `updatedAt: Date`, `createdBy: string`
- [ ] `AuditedUser` requires all six fields — missing any causes a compile error
- [ ] `AuditedAdmin` requires all six + `permissions`
- [ ] Explains: `&` combines all required properties; both sides must be fully satisfied

---

### Q7 — Type alias vs interface ⭐⭐

**Scenario:** A developer on your team always uses `type` for everything and another always uses `interface`. You need to settle the debate with a concrete recommendation.

**Task:** Show one thing `interface` can do that `type` cannot, and one thing `type` can do that `interface` cannot. State your recommendation for this API typing project.

**Acceptance Criteria:**
- [ ] Interface exclusive: **declaration merging** — two `interface User` declarations in the same scope merge into one
- [ ] Type alias exclusive: **union types** — `type ID = string | number` cannot be expressed with `interface`
- [ ] Type alias also supports: tuples, mapped types, conditional types as the alias itself
- [ ] Recommendation: use `interface` for object shapes that may be extended by consumers; use `type` for unions, intersections, and computed types
- [ ] Notes: in practice, both work for most object shapes — consistency matters more than dogma

---

### Q8 — Index signatures ⭐⭐

**Scenario:** Your API returns metadata objects with arbitrary string keys but always number values (e.g. `{ 'page_views': 1200, 'clicks': 450 }`). You need a type that represents this.

**Task:** Define a `MetricsMap` type using an index signature. Then show what happens if you try to add a property with a non-number value. Also add a required `reportId: string` alongside the index signature.

**Acceptance Criteria:**
- [ ] `{ [key: string]: number }` allows any string key with number value
- [ ] Adding `someKey: 'string-value'` causes a TypeScript error
- [ ] Adding a fixed `reportId: string` property alongside the index signature requires the index value type to be a union: `string | number`
- [ ] Alternatively, shows `{ reportId: string } & { [key: string]: number }` (intersection approach)
- [ ] Explains that index signatures allow for dynamic keys at the cost of type safety for specific keys

---

### Q9 — Discriminated unions ⭐⭐

**Scenario:** Your API response wrapper has three shapes: success (with `data`), validation error (with `errors` array), and network error (with `message`).

**Task:** Model these as a discriminated union using a `status` or `kind` field. Write a function `handleResponse` that switches on the discriminant and accesses the correct fields in each branch without type assertions.

**Acceptance Criteria:**
- [ ] Three types with a shared literal discriminant field (e.g. `kind: 'success' | 'validation_error' | 'network_error'`)
- [ ] `switch(response.kind)` narrows correctly in each case
- [ ] In `'success'` case, TypeScript knows `response.data` exists
- [ ] In `'validation_error'` case, TypeScript knows `response.errors` exists
- [ ] Exhaustiveness check: `default: const _exhaustive: never = response` causes error if a new kind is added but not handled

---

### Q10 — never type for exhaustive checks ⭐⭐

**Scenario:** You are writing a shipping cost calculator that handles four carrier types. A new carrier is added to the enum but the developer forgets to add a case in the switch.

**Task:** Write a switch statement over a `Carrier` union type that uses `never` as an exhaustiveness check. Show that adding a new carrier member to the union without updating the switch causes a TypeScript error.

**Acceptance Criteria:**
- [ ] `type Carrier = 'FedEx' | 'DHL' | 'UPS' | 'BlueDart'`
- [ ] Switch handles all four cases
- [ ] `default: const _: never = carrier` — this compiles fine when all cases are covered
- [ ] Adding `'IndiaPost'` to `Carrier` without a case causes a TypeScript error in the `default` branch
- [ ] Explains: `never` is the "bottom type" — a value can never be of type `never` in reachable code

---

### Q11 — Template literal types ⭐⭐

**Scenario:** Your API has event names that follow the pattern `on{Resource}{Action}` (e.g. `onOrderCreated`, `onUserDeleted`). You want TypeScript to generate all valid event names automatically.

**Task:** Using template literal types, define `EventName` from `Resource = 'Order' | 'User' | 'Product'` and `Action = 'Created' | 'Updated' | 'Deleted'`. Show that `'onOrderCreated'` is valid and `'onOrderCancelled'` is a type error.

**Acceptance Criteria:**
- [ ] `type EventName = \`on${Resource}${Action}\``
- [ ] TypeScript generates a union of all 9 combinations automatically
- [ ] `'onOrderCreated'` is assignable to `EventName`
- [ ] `'onOrderCancelled'` is NOT assignable (causes compile error)
- [ ] Explains the power: adding a new `Action` automatically extends the union without changing `EventName`

---

### Q12 — Type assertions and non-null assertion ⭐⭐

**Scenario:** You are querying a DOM element that TypeScript types as `HTMLElement | null`. You are certain it exists (it's declared in a server-rendered template). TypeScript blocks you from accessing `.value`.

**Task:** Show three ways to handle the possibly-null type: (a) type assertion with `as`, (b) non-null assertion with `!`, (c) runtime check with `if`. Explain when each is appropriate.

**Acceptance Criteria:**
- [ ] `as HTMLInputElement` — unsafe assertion, no runtime check, use only when you are certain
- [ ] `element!.value` — non-null assertion, tells TS "trust me it's not null", use sparingly
- [ ] `if (element instanceof HTMLInputElement) { element.value }` — safe runtime narrowing, preferred
- [ ] Explains: `as` and `!` suppress TypeScript errors but do nothing at runtime — if wrong, you get a runtime error
- [ ] Recommends: use runtime checks in production code; use `as` only in test code or genuinely provable situations

---

### Q13 — Enum: numeric vs string vs const ⭐⭐

**Scenario:** Your API uses numeric status codes internally but string labels in the API response. You are choosing between numeric enums, string enums, and const enums.

**Task:** Define the same `OrderStatus` as (a) a numeric enum, (b) a string enum, and (c) a const enum. Show the difference in compiled JavaScript output and explain when to use each.

**Acceptance Criteria:**
- [ ] Numeric enum: members get auto-incremented numbers; has reverse mapping (`OrderStatus[0] === 'PENDING'`)
- [ ] String enum: members are explicit strings; no reverse mapping; clearer in debugger/logs
- [ ] `const enum`: inlined at compile time — no runtime enum object exists in JS output
- [ ] Recommends string enum for API-facing code (human-readable in logs)
- [ ] `const enum` for performance-critical internal code where the object isn't needed at runtime

---

### Q14 — Type widening and narrowing in inference ⭐⭐⭐

**Scenario:** A developer is confused why `let` infers a wider type than `const`. A bug occurs because a variable typed as `string` is compared against a `'PENDING' | 'SHIPPED'` union and TypeScript reports it may not match.

**Task:** Explain type widening. Show how `let` widens `'PENDING'` to `string`, why this breaks a narrowed union comparison, and three ways to preserve the literal type.

**Acceptance Criteria:**
- [ ] `let status = 'PENDING'` — TypeScript infers `string` (widened)
- [ ] `const status = 'PENDING'` — TypeScript infers literal type `'PENDING'`
- [ ] `let status: OrderStatus = 'PENDING'` — explicit annotation preserves the union constraint
- [ ] `let status = 'PENDING' as const` — `as const` assertion narrows to literal
- [ ] Explains: widening is a design choice — `let` means "this might change", so TS allows any string value

---

### Q15 — Structurally typed duck typing ⭐⭐⭐

**Scenario:** Your API client has a `sendEmail(to: EmailAddress)` function. A new `User` interface is added that has all the same fields as `EmailAddress`. A developer tries to pass a `User` object directly and asks why it works even though the types don't share an inheritance relationship.

**Task:** Explain structural typing (duck typing) in TypeScript. Show that TypeScript accepts a `User` where an `EmailAddress` is expected as long as `User` has all the required fields. Then show a case where this can bite you (excess property check).

**Acceptance Criteria:**
- [ ] TypeScript uses **structural typing** — compatibility is based on the shape of types, not their names
- [ ] If `User` has all fields required by `EmailAddress`, it is assignable to `EmailAddress`
- [ ] No `implements` or `extends` needed for structural compatibility
- [ ] **Excess property check**: assigning an object literal with extra properties NOT in the target type causes an error
- [ ] But: assigning a variable (not a literal) with extra properties does NOT cause an error
- [ ] Explains: excess property check only applies to object literals — this is by design (common gotcha)
