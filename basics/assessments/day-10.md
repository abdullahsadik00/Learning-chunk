# Day 10 Assessment — TypeScript Utility Types · Classes & OOP

**Theme:** You are building a class-based ORM layer for your application. Every model has a base class, access modifiers enforce data integrity, and TypeScript utility types keep your DTOs DRY.

---

### Q1 — Partial and Required ⭐

**Scenario:** Your ORM has a `User` model with ten required fields. The update endpoint only needs to send changed fields (all optional). The create endpoint requires exactly four fields.

**Task:** Given `User { id, name, email, phone, address, role, createdAt, updatedAt, isActive, metadata }`, derive:
- `UpdateUserDTO` — all fields optional
- `CreateUserDTO` — only `name`, `email`, `role`, `isActive` required

**Acceptance Criteria:**
- [ ] `UpdateUserDTO = Partial<User>` — every field is optional
- [ ] `CreateUserDTO = Required<Pick<User, 'name' | 'email' | 'role' | 'isActive'>>` — only those four, all required
- [ ] Demonstrates that `Partial<T>` makes everything optional without changing types
- [ ] Demonstrates that `Required<T>` removes `?` from all properties
- [ ] TypeScript error if a required field is missing from a `CreateUserDTO` literal

---

### Q2 — Pick and Omit ⭐

**Scenario:** Your API response includes all 10 user fields, but the `UserListItem` view only needs `id`, `name`, and `email`. The `UserPublicProfile` should exclude internal fields: `metadata`, `isActive`, and `updatedAt`.

**Task:** Derive both types using `Pick` and `Omit`.

**Acceptance Criteria:**
- [ ] `UserListItem = Pick<User, 'id' | 'name' | 'email'>`
- [ ] `UserPublicProfile = Omit<User, 'metadata' | 'isActive' | 'updatedAt'>`
- [ ] Both have correct TypeScript types — no `any`
- [ ] Explains: `Pick` is better when the desired set is small; `Omit` is better when the excluded set is small
- [ ] Demonstrates that the derived types enforce their structure at assignment

---

### Q3 — Record ⭐

**Scenario:** Your application has a permissions map: each user role maps to an array of allowed actions. The roles are a fixed union. You need a type-safe permission table.

**Task:** Define `type Role = 'admin' | 'editor' | 'viewer'` and `type Action = 'read' | 'write' | 'delete'`. Create a `Permissions` type using `Record` so every role must have an entry and actions are type-checked.

**Acceptance Criteria:**
- [ ] `Permissions = Record<Role, Action[]>`
- [ ] A `Permissions` literal must include all three roles — missing one is a TypeScript error
- [ ] Each role's value must be `Action[]` — `'publish'` would be a TypeScript error
- [ ] Explains: `Record<K, V>` is shorthand for `{ [key in K]: V }`
- [ ] Shows `Record<string, unknown>` as a safer alternative to `{ [key: string]: any }`

---

### Q4 — ReturnType and Parameters ⭐

**Scenario:** You need to create a memoized version of an existing function. The memoizer must preserve the exact input and output types without re-typing them.

**Task:** Using `ReturnType<typeof fn>` and `Parameters<typeof fn>`, write a generic `memoize(fn)` that correctly types its arguments and return value without `any`.

**Acceptance Criteria:**
- [ ] `ReturnType<typeof fn>` extracts the return type
- [ ] `Parameters<typeof fn>` extracts the parameter types as a tuple
- [ ] `memoize<T extends (...args: any[]) => any>(fn: T): (...args: Parameters<T>) => ReturnType<T>`
- [ ] The returned function has identical call signature to `fn`
- [ ] TypeScript error if you call the memoized function with wrong argument types

---

### Q5 — Basic class with access modifiers ⭐

**Scenario:** Your `Product` ORM model has an internal `_dirty` flag that tracks unsaved changes. It should not be accessible from outside the class.

**Task:** Write a `Product` class with: `public` readable properties (`id`, `name`, `price`), a `private _dirty` flag set by setters, and a `protected _validate()` method that subclasses can call.

**Acceptance Criteria:**
- [ ] `id`, `name` — `public readonly` (set in constructor, never changed)
- [ ] `price` — `private`, exposed via getter/setter; setter sets `_dirty = true`
- [ ] `_dirty: private boolean` — not accessible outside the class
- [ ] `_validate(): protected void` — accessible in class and subclasses, not external code
- [ ] Accessing `product._dirty` from outside the class is a TypeScript error

---

### Q6 — Parameter properties shorthand ⭐

**Scenario:** Your base model constructors have boilerplate: declare a field, accept it in the constructor, assign it.

**Task:** Rewrite the verbose constructor below using TypeScript parameter property shorthand:

```ts
class Order {
  public id: string;
  public total: number;
  private status: string;
  constructor(id: string, total: number, status: string) {
    this.id = id;
    this.total = total;
    this.status = status;
  }
}
```

**Acceptance Criteria:**
- [ ] `constructor(public id: string, public total: number, private status: string)`
- [ ] The class body has no explicit property declarations
- [ ] TypeScript generates the same property assignments automatically
- [ ] `order.id` and `order.total` are accessible; `order.status` is a TypeScript error
- [ ] `readonly` can also be used in parameter properties

---

### Q7 — Getters, setters, and validation ⭐⭐

**Scenario:** Your `Inventory` model must ensure `quantity` is never set to a negative number. Attempting to set a negative value should throw a `RangeError`.

**Task:** Add a `get quantity()` / `set quantity(value)` pair to `Inventory`. The setter validates the value and sets a `_lastModified` timestamp.

**Acceptance Criteria:**
- [ ] `private _quantity: number` — internal storage
- [ ] `get quantity(): number` — returns `_quantity`
- [ ] `set quantity(value: number)` — throws `RangeError` if `value < 0`; otherwise updates `_quantity` and `_lastModified = new Date()`
- [ ] `inventory.quantity = -1` — `RangeError` at runtime
- [ ] Accessing `inventory.quantity` reads through the getter — transparent to callers

---

### Q8 — Static members and Singleton ⭐⭐

**Scenario:** Your `DatabaseConnection` class should only ever have one instance. Using the Singleton pattern, expose the instance via a static method.

**Task:** Implement `DatabaseConnection` with a `private constructor`, a `private static instance`, and a `public static getInstance(): DatabaseConnection` method.

**Acceptance Criteria:**
- [ ] `new DatabaseConnection()` is a TypeScript error (constructor is private)
- [ ] First call to `getInstance()` creates and stores the instance
- [ ] Subsequent calls return the same instance (`===`)
- [ ] Static `instance` is lazily initialised
- [ ] Explains: `static` members belong to the class, not to instances

---

### Q9 — Inheritance and method overriding ⭐⭐

**Scenario:** Your ORM has a base `Model` class with a `save()` method that sends to a generic endpoint. `UserModel` and `OrderModel` override `save()` to hit their specific endpoints while also calling the parent's common validation.

**Task:** Implement `Model` with a `save()` method and `UserModel`/`OrderModel` that override it, calling `super.save()` first.

**Acceptance Criteria:**
- [ ] `Model.save()` performs common logic (e.g. validation, timestamp update)
- [ ] `UserModel.save()` calls `super.save()`, then hits `/api/users`
- [ ] `OrderModel.save()` calls `super.save()`, then hits `/api/orders`
- [ ] TypeScript enforces the return type matches the parent's `save()` return type
- [ ] `model instanceof Model` is `true` for both subclass instances

---

### Q10 — Abstract class ⭐⭐

**Scenario:** All ORM models must implement `getTableName(): string` and `validate(): boolean`. These differ per model and cannot have a shared default. You want TypeScript to enforce this at class definition time.

**Task:** Define an `abstract class BaseModel` with `abstract getTableName(): string` and `abstract validate(): boolean`, plus a concrete `save()` method that calls `validate()`. Show that instantiating `BaseModel` directly or failing to implement an abstract method is a TypeScript error.

**Acceptance Criteria:**
- [ ] `abstract class BaseModel` — cannot be instantiated directly (TS error)
- [ ] `abstract getTableName(): string` and `abstract validate(): boolean` — must be implemented by subclasses
- [ ] Concrete `save()` can call `this.validate()` and `this.getTableName()`
- [ ] `class UserModel extends BaseModel` without `getTableName` is a TypeScript error
- [ ] `new BaseModel()` is a TypeScript error

---

### Q11 — Implementing multiple interfaces ⭐⭐

**Scenario:** Your `PaymentProcessor` must satisfy two contracts: `Loggable` (with a `log()` method) and `Auditable` (with an `audit()` method). Using `implements`, enforce both.

**Task:** Define both interfaces and write `PaymentProcessor implements Loggable, Auditable`. Show what happens if either method is missing.

**Acceptance Criteria:**
- [ ] `interface Loggable { log(message: string): void }`
- [ ] `interface Auditable { audit(action: string, userId: string): void }`
- [ ] `PaymentProcessor` implements both — provides both methods
- [ ] Missing either method causes a TypeScript error at the class declaration
- [ ] Explains: `implements` is a compile-time check; it does not affect runtime behaviour

---

### Q12 — Conditional types ⭐⭐⭐

**Scenario:** You need a `Nullable<T>` utility that adds `null` to a type — but only if `T` is not already `null`. And a `NonNullable<T>` to strip it.

**Task:** Implement `MakeNullable<T>` (adds null if T doesn't include it) and verify that `NonNullable<string | null>` removes null. Then implement `IsArray<T>` as a conditional type that returns `true` or `false` as literal types.

**Acceptance Criteria:**
- [ ] `MakeNullable<T> = T extends null ? T : T | null`
- [ ] `MakeNullable<string>` → `string | null`
- [ ] `MakeNullable<string | null>` → `string | null` (no double null)
- [ ] `NonNullable<string | null | undefined>` → `string`
- [ ] `IsArray<string[]>` → `true`; `IsArray<string>` → `false`
- [ ] Explains: conditional types are distributed over unions by default

---

### Q13 — Mapped types ⭐⭐⭐

**Scenario:** You need three custom variants of your `User` model: one where all properties are optional, one where all are readonly, and one where all `string` properties are replaced with `string[]`.

**Task:** Implement `MyPartial<T>`, `MyReadonly<T>`, and `StringsToArrays<T>` using mapped types.

**Acceptance Criteria:**
- [ ] `MyPartial<T> = { [K in keyof T]?: T[K] }`
- [ ] `MyReadonly<T> = { readonly [K in keyof T]: T[K] }`
- [ ] `StringsToArrays<T> = { [K in keyof T]: T[K] extends string ? string[] : T[K] }`
- [ ] All three work correctly on `User` type
- [ ] Explains: `[K in keyof T]` iterates over all keys; `?` makes optional; `readonly` makes immutable

---

### Q14 — infer keyword ⭐⭐⭐

**Scenario:** You need `UnwrapPromise<T>` — a utility that extracts the resolved type from a `Promise<T>`. It should work recursively for nested promises.

**Task:** Implement `UnwrapPromise<T>` using `infer`. Show it working for `Promise<string>`, `Promise<Promise<number>>`, and `string` (non-promise).

**Acceptance Criteria:**
- [ ] `UnwrapPromise<T> = T extends Promise<infer U> ? UnwrapPromise<U> : T`
- [ ] `UnwrapPromise<Promise<string>>` → `string`
- [ ] `UnwrapPromise<Promise<Promise<number>>>` → `number`
- [ ] `UnwrapPromise<string>` → `string` (not a Promise, returned as-is)
- [ ] Explains: `infer U` creates a type variable that TypeScript fills in when the pattern matches

---

### Q15 — PartialBy utility (combining Omit + Partial + required fields) ⭐⭐⭐

**Scenario:** Your `UpdateOrderDTO` needs most fields required, but `notes` and `metadata` should be optional. No built-in utility does this for specific keys.

**Task:** Implement `PartialBy<T, K extends keyof T>` that makes only the specified keys optional and keeps the rest required. Use it to derive `UpdateOrderDTO = PartialBy<Order, 'notes' | 'metadata'>`.

**Acceptance Criteria:**
- [ ] `PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>`
- [ ] `UpdateOrderDTO` has all `Order` fields required except `notes` and `metadata` which are optional
- [ ] TypeScript error if a required field (e.g. `id`) is missing from a `UpdateOrderDTO` literal
- [ ] `notes` and `metadata` can be omitted without error
- [ ] Demonstrates the "intersection of Omit and Partial Pick" pattern is a standard TypeScript idiom
