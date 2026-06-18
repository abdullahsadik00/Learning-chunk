# Day 7 Assessment — Debounce · Throttle · Deep Clone · EventEmitter · LRU · Utilities

**Theme:** You are shipping the final modules of your internal SDK library. These are the utilities teams across the company will use in production every day.

---

### Q1 — Debounce use case identification ⭐

**Scenario:** A frontend developer asks when to use debounce vs throttle. They have four scenarios: (a) live search input, (b) scroll position tracker, (c) auto-save form, (d) resize handler that redraws a canvas.

**Task:** For each of the four scenarios, state whether you would use debounce or throttle, and why.

**Acceptance Criteria:**
- [ ] (a) Live search → **debounce**: fire only after the user stops typing; no need for intermediate results
- [ ] (b) Scroll tracker → **throttle**: fire at regular intervals while scrolling; too infrequent would feel laggy
- [ ] (c) Auto-save → **debounce**: save after editing pauses, not on every keystroke
- [ ] (d) Canvas resize → **debounce** or **throttle**: debounce if redraw is expensive (fire once when done); throttle if you need a smooth animation during resize
- [ ] Explains the core difference: debounce = "after last call"; throttle = "at most once per interval"

---

### Q2 — Debounce implementation ⭐

**Scenario:** Implement a production-quality `debounce(fn, delay)` for your SDK.

**Task:** Write `debounce(fn, delay)` that delays `fn` until `delay` ms have passed since the last call. Include a `.cancel()` method on the returned function.

**Acceptance Criteria:**
- [ ] Timer is cleared and reset on each call
- [ ] `fn` receives the latest arguments (from the last call)
- [ ] `fn` is called after `delay` ms of inactivity
- [ ] `.cancel()` clears the pending timer without calling `fn`
- [ ] Multiple rapid calls result in exactly one execution

---

### Q3 — Throttle implementation ⭐

**Scenario:** Implement `throttle(fn, interval)`. The function should fire immediately on the first call, then at most once per `interval` ms thereafter.

**Task:** Write `throttle(fn, interval)` using a timestamp-based approach (not `setInterval`).

**Acceptance Criteria:**
- [ ] First call executes `fn` immediately
- [ ] Subsequent calls within `interval` ms are ignored
- [ ] After `interval` ms has elapsed, the next call executes `fn` again
- [ ] `fn` receives the correct arguments on each execution
- [ ] Uses `Date.now()` to compare timestamps — not `setInterval`

---

### Q4 — Shallow vs deep clone ⭐

**Scenario:** A developer uses the spread operator to clone a product config object before modifying it, but the modification still affects the original.

**Task:** Explain why shallow cloning fails for nested objects. Show the bug, then show that a deep clone fixes it.

```js
const config = { api: { timeout: 5000, retries: 3 } };
const copy = { ...config };
copy.api.timeout = 9999;
console.log(config.api.timeout); // still 9999 — why?
```

**Acceptance Criteria:**
- [ ] Explains shallow clone: top-level properties are copied by value, but nested objects share the same reference
- [ ] `copy.api` and `config.api` point to the same object in memory
- [ ] Deep clone creates completely independent copies at all nesting levels
- [ ] Shows fix: `JSON.parse(JSON.stringify(config))` for simple cases
- [ ] Notes JSON approach loses: `Date` objects, `undefined`, functions, `Symbol`s

---

### Q5 — EventEmitter: on / emit / off ⭐

**Scenario:** Your SDK needs an event system so different modules can communicate without being directly coupled.

**Task:** Implement a minimal `EventEmitter` with `on(event, fn)`, `emit(event, ...args)`, and `off(event, fn)`.

**Acceptance Criteria:**
- [ ] `on` registers a listener for an event (multiple listeners per event are supported)
- [ ] `emit` calls all registered listeners for the event with the given args
- [ ] `off` removes a specific listener by reference
- [ ] Emitting an event with no listeners does nothing (no error)
- [ ] `off` on a non-existent listener does nothing (no error)

---

### Q6 — deepClone implementation ⭐⭐

**Scenario:** Your SDK's `deepClone(value)` must handle: primitives, arrays, plain objects, `Date`, `RegExp`, and circular references.

**Task:** Implement `deepClone(value, seen = new WeakMap())` that recursively clones all the above types.

**Acceptance Criteria:**
- [ ] Primitives (`string`, `number`, `boolean`, `null`, `undefined`, `Symbol`) are returned as-is
- [ ] `Date` is cloned as `new Date(value.getTime())`
- [ ] `RegExp` is cloned as `new RegExp(value.source, value.flags)`
- [ ] Arrays are recursively cloned
- [ ] Plain objects are recursively cloned (own enumerable properties)
- [ ] Circular references are detected via `WeakMap` — same object returns the already-cloned copy

---

### Q7 — deepEqual implementation ⭐⭐

**Scenario:** Your SDK needs a `deepEqual(a, b)` utility for test assertions and cache invalidation checks.

**Task:** Implement `deepEqual(a, b)` that performs structural equality comparison. Handle: primitives, `null`, `Date`, arrays, and plain objects (key order independent).

**Acceptance Criteria:**
- [ ] Primitives: uses `===`
- [ ] Both `null`: `true`; one `null`, one not: `false`
- [ ] `Date`: compares `.getTime()` values
- [ ] Arrays: same length and all elements `deepEqual`
- [ ] Objects: same number of own keys, and every key's value is `deepEqual`
- [ ] Key order does not matter for objects (`{a:1, b:2}` equals `{b:2, a:1}`)

---

### Q8 — EventEmitter: once ⭐⭐

**Scenario:** Some SDK events (like `'ready'`) should only fire the handler once, even if emitted multiple times.

**Task:** Add a `once(event, fn)` method to your `EventEmitter`. The handler fires exactly once and then auto-removes itself. `off(event, fn)` must still work to cancel a `once` listener before it fires.

**Acceptance Criteria:**
- [ ] `once` wraps `fn` in a one-time wrapper and registers it
- [ ] The wrapper calls `fn` and then removes itself from the listener list
- [ ] Emitting after the first fire does not call `fn` again
- [ ] `off(event, fn)` (passing the original `fn`) removes the `once` listener before it fires
- [ ] This requires the wrapper to carry a reference to the original `fn` (e.g. `wrapper._original = fn`)

---

### Q9 — LRU Cache with Map ⭐⭐

**Scenario:** Your SDK caches API responses with an LRU eviction policy. Maximum 100 entries; least recently accessed is evicted first.

**Task:** Implement an `LRUCache` class with `get(key)` and `put(key, value)`. Use JavaScript's `Map` (which preserves insertion order) to simulate LRU.

**Acceptance Criteria:**
- [ ] Constructor accepts `capacity`
- [ ] `get(key)`: returns value if found (and marks as recently used by delete + re-insert); returns `-1` if not found
- [ ] `put(key, value)`: if key exists, updates value (and marks recently used); if new and at capacity, deletes the LRU entry (first key in Map)
- [ ] After `put` that evicts, the evicted key is gone
- [ ] All operations are O(1) amortised

---

### Q10 — Curry utility ⭐⭐

**Scenario:** Implement a general-purpose `curry(fn)` utility that works for functions of any arity.

**Task:** Write `curry(fn)` that converts a multi-argument function into a chain of single-argument functions. It should also support partial application (passing multiple arguments at once).

**Acceptance Criteria:**
- [ ] `curry(fn)(a)(b)(c)` gives same result as `fn(a, b, c)`
- [ ] `curry(fn)(a, b)(c)` also works (partial application with multiple args)
- [ ] Uses `fn.length` to know when all arguments have been collected
- [ ] Returns `fn` result when argument count reaches arity
- [ ] Works for any arity ≥ 1

---

### Q11 — mySetInterval using setTimeout ⭐⭐

**Scenario:** Native `setInterval` can have drift — if the callback takes longer than the interval, calls pile up. Your SDK needs a drift-free interval built from recursive `setTimeout`.

**Task:** Implement `mySetInterval(fn, delay)` that fires `fn` at roughly `delay` ms intervals. It should return a `{ stop() }` object to cancel it.

**Acceptance Criteria:**
- [ ] Uses recursive `setTimeout` (not `setInterval`)
- [ ] Schedules the next call only **after** `fn` completes (prevents pileup)
- [ ] Returns an object with a `stop()` method
- [ ] `stop()` prevents any future calls from firing
- [ ] The first call fires after `delay` ms (not immediately)

---

### Q12 — LRU with doubly linked list ⭐⭐⭐

**Scenario:** You need a version of LRU Cache where `get` and `put` are provably O(1) (not just amortised). Implement it using a doubly linked list + a `Map`.

**Task:** Implement `LRUCache` using a `Map<key, Node>` and a doubly linked list with sentinel head/tail nodes.

**Acceptance Criteria:**
- [ ] Each node: `{ key, value, prev, next }`
- [ ] Sentinel `head` = most recently used end; sentinel `tail` = least recently used end
- [ ] `get(key)`: finds node via Map, moves it to head, returns value (or -1)
- [ ] `put(key, value)`: updates or inserts at head; if over capacity, removes tail sentinel's previous node and its Map entry
- [ ] `_addToFront(node)` and `_removeNode(node)` are helper methods
- [ ] All operations are strictly O(1) (no Map iteration, no array operations)

---

### Q13 — flattenObject / unflattenObject ⭐⭐⭐

**Scenario:** Your SDK serialises nested configuration objects into flat key-value pairs for a legacy system that only supports dot-notation keys.

**Task:** Implement `flattenObject(obj, prefix = '')` and `unflattenObject(flat)`.

```
flattenObject({ a: { b: { c: 1 } }, d: 2 })
→ { 'a.b.c': 1, 'd': 2 }

unflattenObject({ 'a.b.c': 1, 'd': 2 })
→ { a: { b: { c: 1 } }, d: 2 }
```

**Acceptance Criteria:**
- [ ] `flattenObject` recursively builds dot-notation keys for all primitive values
- [ ] `unflattenObject` splits each key on `.` and builds nested objects
- [ ] Round-trip: `unflattenObject(flattenObject(obj))` equals the original `obj`
- [ ] Handles arrays (treat array elements as keys: `items.0`, `items.1`)
- [ ] Empty objects `{}` are not flattened (produce no keys)

---

### Q14 — Throttle with leading AND trailing edge ⭐⭐⭐

**Scenario:** Your canvas resize handler must draw immediately when the user starts resizing (leading edge) AND draw one final time after they stop (trailing edge), even if the last call was throttled.

**Task:** Implement `throttle(fn, interval, { leading = true, trailing = true })` that supports all four combinations of leading/trailing options.

**Acceptance Criteria:**
- [ ] `leading: true, trailing: true` (default): fires immediately, then fires once after the last throttled call
- [ ] `leading: true, trailing: false`: fires immediately, ignores trailing call
- [ ] `leading: false, trailing: true`: ignores the first call, fires once after the interval
- [ ] `leading: false, trailing: false`: never fires (valid but useless configuration — handle gracefully)
- [ ] Uses `setTimeout` for the trailing call and `Date.now()` for leading timing
- [ ] Trailing call carries the most recent arguments

---

### Q15 — classNames utility ⭐⭐⭐

**Scenario:** Your SDK ships a `classNames(...args)` utility for building CSS class strings conditionally. It must accept strings, numbers, arrays, and objects.

**Task:** Implement `classNames(...args)` that:
- Strings/numbers → include directly
- Arrays → recursively flatten and include
- Objects → include keys whose value is truthy
- Ignores `null`, `undefined`, `false`, `''`

```js
classNames('btn', { 'btn-primary': true, 'btn-disabled': false }, ['extra', null])
// → 'btn btn-primary extra'
```

**Acceptance Criteria:**
- [ ] Strings and numbers are included in output
- [ ] Objects: only keys with truthy values are included
- [ ] Arrays are recursively processed (can contain any of the above types)
- [ ] `null`, `undefined`, `false`, `''`, `0` are ignored
- [ ] Result is a single space-separated string
- [ ] Empty result is `''` (not `' '` or `undefined`)
