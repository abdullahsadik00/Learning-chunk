# Phase 0 — Exercises (NO answers — you write every line)

Each exercise follows the same shape so you always know what's being asked:

- **Why it matters** — where this shows up in real code / interviews.
- **What to build** — a plain-English description of the behavior.
- **Signature** — the function name and its parameters.
- **Examples** — concrete input → output (this is the *spec* — test against it, don't copy from your console).
- **Edge cases** — the sneaky inputs that separate correct from "works on the happy path."
- **Done when** — the bar for calling it finished.

**Rules:** blank file first · 20-min peek budget · run everything · a test must encode the SPEC,
not mirror your output · untested code is unfinished code. Write each day in `day-NN/`.

---

## DAY 1 — Warm-up: loops & logic  ✅ (done)
See git history / your `day-01/array-utils.js`. Functions: `sum, max, average, reverseString,
countOccurrences, isPalindrome, fizzBuzz, range`.

---

## DAY 2 — Array polyfills  ✅ (in progress)
Rebuild from scratch, matching the native `(element, index, array)` callback signature:
`myForEach, myMap, myFilter, myReduce, myFind, mySome, myEvery, myFlat`. See notes below for
`myReduce` (Day 2's boss) — the no-initial-value rule has a subtlety.

### myReduce — read this carefully before writing it
- **Why it matters:** `reduce` is the most powerful array method — `map`, `filter`, `sum`, `max`,
  `groupBy` can all be built on top of it. Understanding it deeply is a genuine level-up.
- **What to build:** boil an array down to a single value by repeatedly combining an "accumulator"
  with each element via the callback.
- **Signature:** `myReduce(arr, callback, initialValue?)` where `callback(acc, element, index, array)`.
- **Examples:**
  - With init: `myReduce([1,2,3], (acc, x) => acc + x, 10)` → `16`
  - Without init: `myReduce([1,2,3], (acc, x) => acc + x)` → `6` (the **first element** seeds the accumulator, and the loop starts from the **second**).
- **Edge cases:**
  - `myReduce([], (a,b)=>a+b, 0)` → `0` (empty array with init → returns the init).
  - `myReduce([], (a,b)=>a+b)` → **throw** a `TypeError` ("Reduce of empty array with no initial value") — this is what the native method does.
- **Done when:** both the with-init and no-init paths work, and the empty-no-init case throws.

---

## DAY 3 — Functions, `this`, closures  (`day-03/functions.js`)

### 1. `myCall(fn, thisArg, ...args)`
- **Why it matters:** `call`/`apply`/`bind` are how JavaScript controls what `this` points to —
  a top interview topic and the foundation of function borrowing.
- **What to build:** invoke `fn` immediately, but with `this` set to `thisArg`, passing the rest as args.
- **Hint on the trick:** if you attach `fn` as a *temporary property* of `thisArg` and call it as
  `thisArg.tempFn(...)`, then `this` inside `fn` becomes `thisArg` automatically. Clean up the temp property after.
- **Example:**
  ```
  function whoAmI(greeting) { return greeting + " " + this.name; }
  myCall(whoAmI, { name: "Sam" }, "Hi") === "Hi Sam"
  ```
- **Done when:** `this` correctly resolves to `thisArg` and args pass through.

### 2. `myApply(fn, thisArg, argsArray)`
- **What to build:** identical to `myCall`, except arguments arrive as a single **array**.
- **Example:** `myApply(Math.max, null, [3, 9, 2])` behaves like `Math.max(3, 9, 2)` → `9`.

### 3. `myBind(fn, thisArg, ...boundArgs)`
- **Why it matters:** `bind` returns a *new function* with `this` and some args pre-locked — huge in
  event handlers and React class components.
- **What to build:** return a new function; when later called with more args, it runs `fn` with
  `this=thisArg` and `boundArgs` followed by the new args.
- **Example:**
  ```
  function greet(greeting, punct) { return greeting + ", " + this.name + punct; }
  const g = myBind(greet, { name: "Sam" }, "Hi");
  g("!") === "Hi, Sam!"
  ```

### 4. `makeCounter()`
- **Why it matters:** the canonical closure — a private variable no one outside can touch.
- **What to build:** return a function; each call returns the next integer starting at `1`.
- **Examples:** `const c = makeCounter(); c() === 1; c() === 2`
- **Edge case:** two counters must be **independent** — `makeCounter()` and another `makeCounter()`
  don't share state.

### 5. `once(fn)`
- **What to build:** return a function that runs `fn` only on its **first** call; every later call
  returns the value from that first call (and does NOT re-run `fn`).
- **How to prove it:** put a `console.log` (or a counter) inside `fn`; it must fire exactly once.

### 6. `memoize(fn)`
- **Why it matters:** caching expensive results by input — the idea behind `useMemo`, DP tables, etc.
- **What to build:** return a function that caches results keyed by its arguments (assume args are
  JSON-serializable — `JSON.stringify(args)` is a fine key). A repeat call with the same args returns
  the cached value **without** re-running `fn`.
- **How to prove it:** increment a counter inside `fn`; call with the same args twice → counter is `1`.

### 7. `curry(fn)`
- **Why it matters:** transforming a multi-arg function into a chain of single-arg calls — a core
  functional-programming pattern.
- **What to build:** if enough args have been supplied to satisfy `fn.length`, call `fn`; otherwise
  return a function that collects more.
- **Examples (all equal `6`):**
  ```
  const add = curry((a, b, c) => a + b + c);
  add(1)(2)(3);  add(1, 2)(3);  add(1)(2, 3);  add(1, 2, 3);
  ```

---

## DAY 4 — Async & Promises  (`day-04/async.js`)

### 1. `sleep(ms)`
- **What to build:** return a Promise that resolves after `ms` milliseconds.
- **How to prove it:** `console.time("s"); await sleep(200); console.timeEnd("s")` → ~200ms.

### 2. `promisify(fn)`
- **Why it matters:** converting old Node callback-style APIs into modern `async/await` — you'll do
  this in real backends.
- **What to build:** take a function whose last argument is a `(err, data) => ...` callback, and
  return a new function that returns a Promise instead (rejects on `err`, resolves with `data`).
- **Example:**
  ```
  function readFakeFile(name, cb) { setTimeout(() => cb(null, "contents of " + name), 20); }
  const readP = promisify(readFakeFile);
  await readP("a.txt") === "contents of a.txt"
  ```

### 3. `retry(fn, attempts)`
- **What to build:** call the async `fn`; if it rejects, try again, up to `attempts` total. Resolve
  with the first success; reject if all attempts fail.
- **How to prove it:** make an `fn` that throws the first 2 times then resolves — `retry(fn, 3)` succeeds.
- **Edge case:** if every attempt fails, the returned promise **rejects** with the last error.

### 4. `MyPromise` (a mini Promise class)
- **Why it matters:** building a Promise from scratch makes the event loop and async chaining click.
- **What to build:** a class you construct as `new MyPromise((resolve, reject) => { ... })` with a
  `.then(onFulfilled)` (and ideally `.catch(onRejected)`). Focus on: a promise settles **once**
  (pending → fulfilled/rejected, never back), it works when `resolve` is called **asynchronously**
  (inside a `setTimeout`), and `.then` **chains** (returns a new MyPromise).
- **Example:**
  ```
  new MyPromise(res => setTimeout(() => res(1), 50))
    .then(x => x + 1)
    .then(x => console.log(x));   // logs 2
  ```
- **Note:** you do NOT need the full Promises/A+ spec — pending-once + async resolve + then-chaining is the goal.

### 5. `myPromiseAll(promises)`
- **What to build:** given an array of promises, resolve to an array of their results **in the same
  order as the input**, even if they finish out of order. If any promise rejects, the whole thing rejects.
- **Example:** `await myPromiseAll([Promise.resolve(1), sleep(30).then(() => 2), Promise.resolve(3)])` → `[1, 2, 3]`
- **Edge cases:** empty input → resolves to `[]`; order must follow **input index**, not completion time.

---

## DAY 5 — Real-world utilities  (`day-05/utils.js`)

### 1. `debounce(fn, delay)`
- **Why it matters:** the #1 performance util — search-as-you-type, resize handlers, autosave.
- **What to build:** return a function that postpones calling `fn` until `delay` ms have passed
  **without another call**. Each new call resets the timer.
- **How to prove it:** call the debounced fn 5× rapidly in a loop → `fn` runs **once**, after the delay.
- **Bonus:** preserve `this` and forward the latest arguments.

### 2. `throttle(fn, limit)`
- **What to build:** return a function that lets `fn` run at most **once per `limit` ms**, ignoring
  extra calls in between.
- **How to prove it:** fire it repeatedly for ~1s with `limit = 300` → `fn` runs ~3–4 times, not 100.
- **Contrast:** debounce waits for silence; throttle enforces a steady max rate. Say the difference out loud.

### 3. `deepClone(obj)`
- **Why it matters:** shallow copies (`{...obj}`) share nested references — a common source of bugs.
- **What to build:** a recursive clone where mutating the copy never affects the original, at any depth.
- **Examples / edge cases:**
  ```
  const a = { x: 1, nested: { y: 2 }, list: [1, [2, 3]] };
  const b = deepClone(a);
  b.nested.y = 99;
  a.nested.y === 2   // original untouched
  ```
  Handle: nested objects, arrays, and primitives. (Stretch: `Date`, `Map`, `Set`, circular refs.)

### 4. `EventEmitter` (class)
- **Why it matters:** the pub/sub pattern behind Node's events, DOM events, and (soon) your Logly worker.
- **What to build:** `.on(event, cb)` subscribes, `.off(event, cb)` unsubscribes that exact callback,
  `.emit(event, ...args)` calls every subscriber for that event with the args.
- **Example:**
  ```
  const e = new EventEmitter();
  const h = x => console.log("got", x);
  e.on("ping", h); e.emit("ping", 42);   // logs "got 42"
  e.off("ping", h); e.emit("ping", 99);  // logs nothing
  ```
- **Edge case:** emitting an event with no subscribers does nothing (no crash); multiple subscribers
  all fire, in subscription order.

---

## DAY 6 — Build from nothing #1: CLI Todo  (`day-06/todo-cli/`)

- **Why it matters:** your first *program* (not a function) — parsing input, persisting state, handling
  bad input. This is the muscle that builds real apps.
- **What to build:** a Node CLI run as `node index.js <command> [args]`:
  - `add "Buy milk"` → adds a todo, prints its id.
  - `list` → prints every todo as `id  [ ]/[x]  text`.
  - `done <id>` → marks that todo complete.
  - `delete <id>` → removes it.
- **Persistence:** store todos in a `todos.json` file in the folder — read it on startup, write it on
  every change, so data survives between runs.
- **Edge cases (write these on purpose):** unknown command → friendly usage message; `done`/`delete`
  with a missing or non-existent id → clear error, **not** a stack trace; empty todo text → rejected.
- **Done when:** `add` then a fresh `list` shows the item; `done` flips status; `delete` removes it;
  bad input never crashes with a raw stack trace.

---

## DAY 7 — Consolidate

No new exercises. Open a blank file and re-write, **cold**, every polyfill/util from Days 2–5 you had
to peek at. In `day-07/NOTES.md` record: (a) what you can now write from memory, (b) what still needs a
peek, (c) any concept that still feels fuzzy. That honesty is what I analyze.

---

## DAY 8 — TypeScript fundamentals  (`day-08/typed-utils.ts`)

- **Why it matters:** types catch bugs before you run the code and document intent. Everything from
  here (React, Logly) is TypeScript.
- **What to build:** re-implement Day 1's functions in TS, fully typed, **zero `any`**. Then:
  1. `type User = { id: number; name: string; email?: string }` → `formatUser(u: User): string`.
  2. A discriminated union `type Shape = { kind: "circle"; r: number } | { kind: "square"; side: number }`
     → `area(s: Shape): number`, narrowing on `s.kind`.
  3. Type `max` as `(nums: number[]) => number | undefined`.
- **Done when:** `npx tsc --noEmit` is clean and there is not one `any`.

---

## DAY 9 — Generics  (`day-09/generics.ts`)

- **Why it matters:** generics let one function work for many types **without losing type safety** —
  the difference between `any[]` (unsafe) and `T[]` (precise).
- **What to build:**
  1. `identity<T>(x: T): T`
  2. `firstElement<T>(arr: T[]): T | undefined`
  3. Re-type your polyfills generically: `myMap<T, U>(arr: T[], cb: (el: T, i: number) => U): U[]`
     (and `myFilter<T>`, `myReduce<T, U>`). Verify inference: `myMap([1,2,3], n => n.toString())`
     is inferred as `string[]`, not `any[]`.
  4. `pluck<T, K extends keyof T>(arr: T[], key: K): T[K][]` —
     `pluck([{id:1},{id:2}], "id")` returns `number[]` equal to `[1, 2]`.
- **Done when:** hovering results in your editor shows **precise** types (no `any`), tsc clean.

---

## DAY 10 — Utility types + challenges  (`day-10/utility-types.ts`)

- **Why it matters:** `Partial`, `Pick`, `Omit`, `Record` are everyday tools for reshaping types
  without redefining them.
- **What to build:** given `interface Todo { id:number; title:string; done:boolean; note:string }`:
  - `TodoPreview` = only `title` + `done` (`Pick`)
  - `TodoUpdate` = everything optional (`Partial`)
  - `TodoNoNote` = without `note` (`Omit`)
  - `TodoMap` = `Record<number, Todo>`
  - `updateTodo(t: Todo, patch: Partial<Todo>): Todo` (return a new object)
- **Then solve** `basics/typescript/challenges/c01` and `c02` — run them, every `assert()` passes
  (`cd basics/typescript && npm run challenge:01`).

---

## DAY 11 — Type guards & discriminated unions  (`day-11/guards.ts`)

- **Why it matters:** safely narrowing `unknown`/union types is how you handle real API data and
  Redux-style actions without `any`.
- **What to build:**
  1. `type Action = { type:"add"; text:string } | { type:"remove"; id:number } | { type:"clear" }`
     → `reducer(state: Todo[], action: Action): Todo[]` narrowing on `action.type`, with a `default`
     branch containing an **exhaustiveness check** (`const _exhaustive: never = action`). Adding a new
     action type without handling it must then cause a compile error.
  2. A user-defined type guard `isString(x: unknown): x is string`; use it to filter an `unknown[]`
     down to `string[]`.
- **Then solve** challenges `c03` and `c04`.

---

## DAY 12 — Classes / OOP  (`day-12/classes.ts`)

- **Why it matters:** generic classes model reusable, type-safe data structures.
- **What to build:**
  1. `class Stack<T>` — `push(x: T): void`, `pop(): T | undefined`, `peek(): T | undefined`,
     `size(): number`, `isEmpty(): boolean`. Prove LIFO with numbers **and** strings (same generic class).
  2. `class TypedEmitter<Events extends Record<string, unknown[]>>` — `on<K extends keyof Events>(e: K,
     cb: (...args: Events[K]) => void)` and `emit<K extends keyof Events>(e: K, ...args: Events[K])`.
     Passing wrong arg types to `emit` must be a **compile error** (that's the real test).
- **Then solve** challenges `c05` and `c06`.

---

## DAY 13 — Finish challenges + typed todo  (`day-13/todo-store.ts`)

- **What to build:**
  1. Solve challenges `c07` and `c08` — all 8 challenge files now pass.
  2. `TodoStore` — in-memory, fully typed: `add(text: string): Todo`, `toggle(id: number): void`,
     `remove(id: number): void`, `all(): readonly Todo[]`, `filter(status: "active" | "done"): Todo[]`.
- **Done when:** no `any`, `tsc --noEmit` clean, a runner exercises every method.

---

## DAY 14 — Capstone mini: generic data store  (`day-14/data-store.ts`)

- **Why it matters:** ties together generics, utility types, and clean API design — a mini version of
  the kind of typed data layer you'll write in Logly.
- **What to build:** from a blank file,
  ```ts
  createStore<T extends { id: number }>(): {
    add(item: T): T
    get(id: number): T | undefined
    update(id: number, patch: Partial<Omit<T, "id">>): T | undefined
    remove(id: number): boolean
    query(predicate: (item: T) => boolean): T[]
    all(): readonly T[]
  }
  ```
- **Prove it:** use it with **two different `T`s** (e.g. `User` and `Product`) in the same file, fully
  typed, `tsc --noEmit` clean, with a runner exercising every method.
- **Then** tell me **"Phase 0 done, review my code"** and I'll analyze all of it.

---

### The self-check habit (every single exercise)
1. Does it **run**? 2. Does it match the **examples** (the spec)? 3. Did you cover the **edge cases**?
4. Could you re-write it tomorrow from a blank file? Only when all four are "yes" is it done.
