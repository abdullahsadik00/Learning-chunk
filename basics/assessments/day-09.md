# Day 9 Assessment — TypeScript Functions & Generics

**Theme:** You are building a type-safe data layer for your API client. Every fetcher, transformer, and repository must be fully typed with generics so the codebase eliminates `any` completely.

---

### Q1 — Function type annotations ⭐

**Scenario:** Your API client has callback-based functions that are passed around but typed as `Function`. This loses all argument and return type information.

**Task:** Replace `Function` with precise function type expressions for each of the three helpers below:

```ts
type OnSuccess = Function;  // receives data of unknown type, returns void
type Transform = Function;  // receives a string, returns a number
type Middleware = Function; // receives (req: Request, res: Response, next: () => void), returns void
```

**Acceptance Criteria:**
- [ ] `OnSuccess<T> = (data: T) => void` (or generic version)
- [ ] `Transform = (input: string) => number`
- [ ] `Middleware = (req: Request, res: Response, next: () => void) => void`
- [ ] None use `Function` (which is equivalent to `any` for function types)
- [ ] Each type expression shows parameter names and types, and return type

---

### Q2 — Optional and default parameters ⭐

**Scenario:** A `fetchUsers(page, limit, filter)` function breaks when callers omit `filter`. Optional parameters must come after required ones.

**Task:** Annotate the function so `filter` is optional, `limit` defaults to `20`, and `page` is required. Show the TypeScript error if you put an optional param before a required one.

**Acceptance Criteria:**
- [ ] `page: number` — required
- [ ] `limit: number = 20` — has default, effectively optional
- [ ] `filter?: string` — optional (type is `string | undefined`)
- [ ] TypeScript error if `filter?: string` comes before `page: number`
- [ ] Calling `fetchUsers(1)` is valid; `filter` is `undefined` in that case

---

### Q3 — Rest parameters ⭐

**Scenario:** Your logger function should accept a `level` and any number of message strings that it concatenates.

**Task:** Type `log(level: LogLevel, ...messages: string[])`. Show that it works for 1 or 100 messages. Also show a function that accepts a fixed first argument and then a rest tuple.

**Acceptance Criteria:**
- [ ] `...messages: string[]` collects all remaining args as an array of strings
- [ ] `log('info', 'Request received')` and `log('error', 'Step 1', 'Step 2', 'Step 3')` both valid
- [ ] Demonstrates rest params must be the last parameter
- [ ] Bonus: shows a rest tuple `[string, ...number[]]` for a typed variadic function

---

### Q4 — Generic identity function ⭐

**Scenario:** Your SDK needs an `identity<T>(value: T): T` function. Show why it is better than `identity(value: any): any`.

**Task:** Write a generic `identity` function. Demonstrate that it preserves the exact type — calling with a `string` gives back a `string`, not `any`.

**Acceptance Criteria:**
- [ ] `function identity<T>(value: T): T { return value; }`
- [ ] `const s = identity('hello')` — `s` is inferred as `string`, not `any`
- [ ] `const n = identity(42)` — `n` is inferred as `number`
- [ ] With `any`: `identity('hello')` returns `any` — all type info lost
- [ ] Explains: generics preserve type information through the function; `any` discards it

---

### Q5 — Generic constraints with extends ⭐

**Scenario:** A `getProperty<T, K>(obj: T, key: K)` function should only accept keys that actually exist on the object — it should error if you pass a key that doesn't exist on `T`.

**Task:** Add a `K extends keyof T` constraint. Show that `getProperty(user, 'name')` works but `getProperty(user, 'password')` fails if `password` is not on the type.

**Acceptance Criteria:**
- [ ] `function getProperty<T, K extends keyof T>(obj: T, key: K): T[K]`
- [ ] Return type is `T[K]` — the actual type of that property (not just `unknown`)
- [ ] TypeScript error if `key` is not a key of `T`
- [ ] Explains: `keyof T` produces a union of all keys of `T` as string literal types
- [ ] `T[K]` is an indexed access type — looks up the property type

---

### Q6 — Function overloads ⭐⭐

**Scenario:** Your `formatDate(input)` function accepts either a `Date` object or a numeric timestamp (ms since epoch). The return type is always `string`. TypeScript should know this — no `any`.

**Task:** Write overload signatures for `formatDate` with two signatures: one for `Date` input and one for `number` input, both returning `string`. Implement the function body with a union parameter.

**Acceptance Criteria:**
- [ ] Two overload signatures declared before the implementation
- [ ] Implementation signature uses `Date | number` (not visible to callers)
- [ ] TypeScript uses the correct overload when checking call sites
- [ ] Calling with a `boolean` causes a compile error (not matched by any overload)
- [ ] Explains: overload signatures are the public API; implementation signature is private to TypeScript

---

### Q7 — Generic API fetcher ⭐⭐

**Scenario:** Every API call in your client follows the same pattern: fetch → check status → parse JSON → return typed data. You want a single generic `apiFetch<T>(url, options?)` that returns `Promise<T>`.

**Task:** Implement `apiFetch<T>` as a generic async function. Callers should be able to write `apiFetch<User[]>('/api/users')` and get back `Promise<User[]>`.

**Acceptance Criteria:**
- [ ] `async function apiFetch<T>(url: string, options?: RequestInit): Promise<T>`
- [ ] Fetches the URL, checks `response.ok`, throws `Error` on non-2xx
- [ ] Returns `response.json() as Promise<T>`
- [ ] Callers specify `T` at the call site
- [ ] TypeScript error if caller tries to use a property not on `T` without narrowing

---

### Q8 — Generic repository pattern ⭐⭐

**Scenario:** You are building a data layer with `UserRepository`, `OrderRepository`, and `ProductRepository`. Each has the same CRUD interface but for different types.

**Task:** Define a generic `Repository<T>` interface with `findById(id: string): Promise<T>`, `findAll(): Promise<T[]>`, `create(data: Omit<T, 'id'>): Promise<T>`, and `delete(id: string): Promise<void>`. Then write a concrete `UserRepository` class that implements it.

**Acceptance Criteria:**
- [ ] `Repository<T>` is a generic interface with all four methods
- [ ] `create` uses `Omit<T, 'id'>` so callers don't need to provide the ID
- [ ] `UserRepository implements Repository<User>` — TypeScript checks all methods match the interface
- [ ] Methods return `Promise<User>` or `Promise<User[]>` in the concrete class (not `Promise<T>`)
- [ ] Adding a fifth method to the interface without implementing it on `UserRepository` causes a TS error

---

### Q9 — Multiple type parameters ⭐⭐

**Scenario:** Your SDK needs a `transform<TInput, TOutput>(value: TInput, fn: (input: TInput) => TOutput): TOutput` utility that applies a transformation function.

**Task:** Implement `transform`. Then show three usages: `string → number`, `User → UserDTO`, and `string[] → Record<string, boolean>`.

**Acceptance Criteria:**
- [ ] Two type parameters `TInput` and `TOutput`
- [ ] `fn` is typed as `(input: TInput) => TOutput`
- [ ] Return type is `TOutput`
- [ ] TypeScript infers both type params at each call site without explicit annotation
- [ ] Error if the transformation function's parameter type doesn't match the input type

---

### Q10 — Generic default type parameters ⭐⭐

**Scenario:** Your `PaginatedResponse<T = unknown>` type should default to `unknown` so legacy callers don't break, but typed callers can specify `T`.

**Task:** Define `PaginatedResponse<T = unknown>` with `data: T[]`, `page: number`, `total: number`. Show usage without a type argument (gets `unknown[]`) and with `PaginatedResponse<User>` (gets `User[]`).

**Acceptance Criteria:**
- [ ] Generic with default: `interface PaginatedResponse<T = unknown>`
- [ ] Without argument: `PaginatedResponse` — `data` is `unknown[]`
- [ ] With argument: `PaginatedResponse<User>` — `data` is `User[]`
- [ ] Accessing `data[0].name` on `PaginatedResponse` (no arg) is a TS error
- [ ] Accessing `data[0].name` on `PaginatedResponse<User>` is valid

---

### Q11 — this parameter in function typing ⭐⭐

**Scenario:** A `formatCurrency(this: Store, amount: number): string` method uses `this.currency`. When the method is extracted and called as a plain function, TypeScript should report an error.

**Task:** Add a `this` parameter to `formatCurrency`. Show that calling `formatCurrency(500)` without a `this` context causes a TypeScript error, but `formatCurrency.call(store, 500)` is valid.

**Acceptance Criteria:**
- [ ] `function formatCurrency(this: Store, amount: number): string`
- [ ] `this` parameter is first in the signature but is not a real parameter
- [ ] `formatCurrency(500)` — TypeScript error: `void` is not assignable to `Store`
- [ ] `formatCurrency.call(store, 500)` — valid
- [ ] Explains: `this` parameter is a TypeScript-only construct, erased at runtime

---

### Q12 — Generic Stack class ⭐⭐⭐

**Scenario:** Implement a type-safe `Stack<T>` class for your SDK. Operations: `push`, `pop`, `peek`, `isEmpty`, `size`.

**Task:** Write `Stack<T>` as a generic class. `pop()` and `peek()` should return `T | undefined` when the stack is empty rather than throwing.

**Acceptance Criteria:**
- [ ] `push(item: T): this` — returns `this` for chaining
- [ ] `pop(): T | undefined` — returns and removes the top item, or `undefined` if empty
- [ ] `peek(): T | undefined` — returns the top item without removing it
- [ ] `isEmpty(): boolean`
- [ ] `size: number` — getter
- [ ] `Stack<string>` cannot have numbers pushed onto it (TypeScript error)
- [ ] `Stack<string>.pop()` returns `string | undefined` — no `any`

---

### Q13 — Async generic function ⭐⭐⭐

**Scenario:** You need a generic `retry<T>(fn: () => Promise<T>, attempts: number, delay: number): Promise<T>` function that retries a failing async operation.

**Task:** Implement the retry utility. On each failure it should wait `delay` ms and try again. After `attempts` failures, it should throw the last error.

**Acceptance Criteria:**
- [ ] Fully generic — `T` is inferred from `fn`'s return type
- [ ] Attempts are decremented on each failure
- [ ] `await new Promise(r => setTimeout(r, delay))` for the delay
- [ ] After all attempts exhausted, throws the last caught error
- [ ] `retry<User>(() => fetchUser(id), 3, 1000)` returns `Promise<User>`
- [ ] Works with any async function regardless of return type

---

### Q14 — Callable interface ⭐⭐⭐

**Scenario:** Your `Validator` object is both callable as a function and has a `.rules` array property. TypeScript's function type expression can't model this — you need a callable interface.

**Task:** Define a `Validator` callable interface that can be called as `validator(input: string): boolean` AND has a `rules: string[]` property and an `addRule(rule: string): void` method.

**Acceptance Criteria:**
- [ ] `interface Validator { (input: string): boolean; rules: string[]; addRule(rule: string): void; }`
- [ ] A concrete `Validator` object satisfies the interface
- [ ] Calling `validator('test')` is valid
- [ ] `validator.rules` and `validator.addRule('...')` are valid
- [ ] Demonstrates: function types can carry extra properties via callable interfaces

---

### Q15 — Generic factory with constraints ⭐⭐⭐

**Scenario:** Your SDK has a `create<T extends { id: string }>(Constructor: new (...args: any[]) => T, ...args: any[]): T` factory. It must ensure the returned object has at least `id: string`.

**Task:** Write `createInstance<T extends { id: string }>(Constructor: new (...args: unknown[]) => T, ...args: unknown[]): T`. Demonstrate it with `User` and `Order` classes. Show that a class without `id` cannot be used.

**Acceptance Criteria:**
- [ ] Uses `new (...args: unknown[]) => T` to type the constructor
- [ ] `T extends { id: string }` constrains the created type
- [ ] `createInstance(User, 'u1', 'Alice')` returns `User` (with full type information)
- [ ] A class `NoId { name: string }` without `id` causes a TypeScript error at the call site
- [ ] Explains: `new () => T` is how you type a constructor function in TypeScript
