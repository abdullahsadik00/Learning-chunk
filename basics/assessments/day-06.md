# Day 6 Assessment — Array, Function & Promise Polyfills

**Theme:** You are building an internal SDK library. The runtime doesn't guarantee modern browser APIs, so you are asked to polyfill core methods from scratch. Interviews at top companies heavily test this.

---

### Q1 — Array.map polyfill ⭐

**Scenario:** Your SDK must run in an environment where `Array.prototype.map` is not available. You need to polyfill it.

**Task:** Implement `Array.prototype.myMap(callback, thisArg)` that behaves identically to the native `.map()`. Handle: calling with a `thisArg`, passing `(element, index, array)` to the callback, and skipping empty slots in sparse arrays.

**Acceptance Criteria:**
- [ ] Calls `callback.call(thisArg, element, index, originalArray)` for each element
- [ ] Returns a new array of the same length
- [ ] Does not mutate the original array
- [ ] Uses `i in this` (not just checking index) to skip empty slots in sparse arrays
- [ ] Returns `undefined` for skipped slots in sparse arrays (native behaviour)

---

### Q2 — Array.filter polyfill ⭐

**Scenario:** Polyfill `Array.prototype.filter` for the same SDK. The result array must only include elements for which the callback returns truthy.

**Task:** Implement `Array.prototype.myFilter(callback, thisArg)`.

**Acceptance Criteria:**
- [ ] Returns a new array containing only elements where `callback` returns truthy
- [ ] Result array length is ≤ original length
- [ ] Calls `callback.call(thisArg, element, index, originalArray)` for each element
- [ ] Does not mutate the original array
- [ ] Skips empty slots in sparse arrays

---

### Q3 — Array.reduce polyfill ⭐

**Scenario:** Polyfill `Array.prototype.reduce`. The tricky edge case: if no `initialValue` is provided and the array is empty, it should throw `TypeError`.

**Task:** Implement `Array.prototype.myReduce(callback, initialValue)`. Handle both with and without `initialValue`.

**Acceptance Criteria:**
- [ ] With `initialValue`: accumulator starts as `initialValue`, iterates from index 0
- [ ] Without `initialValue`: accumulator starts as `array[0]`, iterates from index 1
- [ ] Throws `TypeError` if called on an empty array without `initialValue`
- [ ] Calls `callback(accumulator, currentValue, currentIndex, array)` on each iteration
- [ ] Returns the final accumulated value

---

### Q4 — Array.find and Array.findIndex polyfills ⭐

**Scenario:** Polyfill both `find` and `findIndex` for your SDK.

**Task:** Implement `Array.prototype.myFind(callback, thisArg)` and `Array.prototype.myFindIndex(callback, thisArg)`.

**Acceptance Criteria:**
- [ ] `myFind` returns the **element** of the first match, or `undefined` if not found
- [ ] `myFindIndex` returns the **index** of the first match, or `-1` if not found
- [ ] Both stop iterating after the first match (short-circuit)
- [ ] Both call `callback.call(thisArg, element, index, array)`
- [ ] Neither mutates the original array

---

### Q5 — Array.flat polyfill ⭐

**Scenario:** Your SDK receives deeply nested category trees and needs to flatten them. Polyfill `Array.prototype.flat`.

**Task:** Implement `Array.prototype.myFlat(depth = 1)` that flattens nested arrays to the given depth.

**Acceptance Criteria:**
- [ ] Default depth is `1` — only flattens one level
- [ ] `[1, [2, [3]]].myFlat(1)` → `[1, 2, [3]]`
- [ ] `[1, [2, [3]]].myFlat(2)` → `[1, 2, 3]`
- [ ] `[1, [2, [3]]].myFlat(Infinity)` → fully flattens all levels
- [ ] Recursively processes nested arrays up to `depth`
- [ ] Does not mutate the original array

---

### Q6 — Function.call polyfill ⭐⭐

**Scenario:** Polyfill `Function.prototype.myCall(context, ...args)`.

**Task:** Implement `myCall` without using `.call()`, `.apply()`, or `.bind()`.

**Acceptance Criteria:**
- [ ] Temporarily assigns the function as a property on the context object to set `this`
- [ ] Uses a `Symbol` (or unique string key) to avoid overwriting existing properties
- [ ] Calls the function and captures the result
- [ ] Deletes the temporary property from the context before returning
- [ ] Handles `null`/`undefined` context (defaults to global object)
- [ ] Returns the function's return value

---

### Q7 — Function.apply polyfill ⭐⭐

**Scenario:** Polyfill `Function.prototype.myApply(context, argsArray)`.

**Task:** Implement `myApply`. The difference from `myCall`: the second argument is an array (or array-like).

**Acceptance Criteria:**
- [ ] Second parameter is spread into the call: `fn.myApply(obj, [a, b, c])` → calls with `a, b, c`
- [ ] Uses `Symbol` to set `this` (same technique as `myCall`)
- [ ] Handles `null`/`undefined` args array (calls with no arguments)
- [ ] Returns the function's return value
- [ ] Does not use native `.apply()` or `.call()`

---

### Q8 — Function.bind polyfill ⭐⭐

**Scenario:** Polyfill `Function.prototype.myBind(context, ...partialArgs)`.

**Task:** Implement `myBind`. The returned function must: (1) be permanently bound to `context`, (2) support partial application, and (3) work correctly when called with `new` (where `new` overrides the bound context).

**Acceptance Criteria:**
- [ ] Returns a **new function** — does not invoke immediately
- [ ] Calling the returned function merges partial args with any new args
- [ ] When called with `new`, `this` is the newly created object (not the bound context)
- [ ] Prototype of the bound function is set to the original function's prototype (for `instanceof` to work)
- [ ] Does not use native `.bind()`

---

### Q9 — Promise.all polyfill ⭐⭐

**Scenario:** Polyfill `Promise.all(promises)` for environments without it.

**Task:** Implement `Promise.myAll(promises)`.

**Acceptance Criteria:**
- [ ] Accepts an array of values/Promises
- [ ] Resolves with an array of results in **input order** (not resolution order)
- [ ] Rejects immediately if any promise rejects (with that rejection reason)
- [ ] Handles non-Promise values in the input array (wraps them with `Promise.resolve`)
- [ ] Resolves with `[]` for an empty input array
- [ ] Uses a counter to know when all promises have resolved

---

### Q10 — Promise.allSettled polyfill ⭐⭐

**Scenario:** Polyfill `Promise.allSettled(promises)`.

**Task:** Implement `Promise.myAllSettled(promises)`. It must never reject — always resolve with all outcomes.

**Acceptance Criteria:**
- [ ] Always resolves, never rejects
- [ ] Result array has `{ status: 'fulfilled', value }` for each resolved promise
- [ ] Result array has `{ status: 'rejected', reason }` for each rejected promise
- [ ] Results are in input order
- [ ] Handles non-Promise values (treats as fulfilled)

---

### Q11 — Promise.race and Promise.any polyfills ⭐⭐

**Scenario:** Polyfill both `Promise.race` and `Promise.any`.

**Task:** Implement `Promise.myRace(promises)` and `Promise.myAny(promises)`.

**Acceptance Criteria:**

`myRace`:
- [ ] Resolves or rejects with the first promise to settle (whichever comes first)
- [ ] Including rejections — `race` is won by the first settler regardless of outcome

`myAny`:
- [ ] Resolves with the first promise to **resolve** (ignores rejections)
- [ ] Rejects with an `AggregateError` only if **all** promises reject
- [ ] `AggregateError` contains an array of all rejection reasons
- [ ] Handles empty input array (immediately rejects)

---

### Q12 — MyPromise core: constructor + .then ⭐⭐⭐

**Scenario:** Implement the core of a Promise from scratch. This is one of the most common senior-level interview questions.

**Task:** Implement a `MyPromise` class with: `constructor(executor)`, `.then(onFulfilled, onRejected)` that returns a new `MyPromise` (enabling chaining), and `.catch(onRejected)`.

**Acceptance Criteria:**
- [ ] Three internal states: `pending`, `fulfilled`, `rejected`
- [ ] Executor runs synchronously; errors in executor cause rejection
- [ ] `.then()` callbacks run asynchronously (use `setTimeout` to approximate microtask)
- [ ] `.then()` returns a new `MyPromise` — enabling chaining
- [ ] If `onFulfilled`/`onRejected` returns a value, the next `.then` receives it
- [ ] If `onFulfilled`/`onRejected` returns a Promise, it is unwrapped
- [ ] Multiple `.then()` calls on the same promise all receive the value
- [ ] `.catch(fn)` is `this.then(null, fn)`

---

### Q13 — Array.some and Array.every polyfills ⭐⭐

**Scenario:** Polyfill `some` and `every` for your SDK. An important edge case: what does `every` return for an empty array?

**Task:** Implement `Array.prototype.mySome(callback, thisArg)` and `Array.prototype.myEvery(callback, thisArg)`.

**Acceptance Criteria:**

`mySome`:
- [ ] Returns `true` if at least one element passes (short-circuits after first truthy)
- [ ] Returns `false` for an empty array (vacuous false)

`myEvery`:
- [ ] Returns `true` if ALL elements pass (short-circuits after first falsy)
- [ ] Returns `true` for an empty array (vacuous truth)
- [ ] Both pass `(element, index, array)` to the callback
- [ ] Both stop early (do not iterate the whole array when result is determined)

---

### Q14 — Chaining .then / .catch behaviour trace ⭐⭐⭐

**Scenario:** A Promise chain has a rejection in the middle. You need to predict exactly which `.then` and `.catch` handlers run and what value each receives.

**Task:** Without running the code, trace which handlers execute and what value/error each receives:

```js
Promise.resolve(1)
  .then(v  => { throw new Error('bad'); })  // A
  .then(v  => v * 2)                        // B
  .catch(e => e.message)                    // C
  .then(v  => v + '!')                      // D
  .catch(e => 'fallback');                  // E
```

**Acceptance Criteria:**
- [ ] A: receives `1`, throws `Error('bad')` → chain enters rejected state
- [ ] B: **skipped** (chain is rejected, no rejection handler here)
- [ ] C: receives `Error('bad')`, returns `'bad'` → chain resumes resolved with `'bad'`
- [ ] D: receives `'bad'`, returns `'bad!'` → chain resolved with `'bad!'`
- [ ] E: **not invoked** (chain is resolved, not rejected)
- [ ] Final resolved value: `'bad!'`

---

### Q15 — forEach polyfill + why it returns undefined ⭐⭐⭐

**Scenario:** A developer chains `.forEach()` like `.map()` and wonders why they get `undefined`. They try to implement their own version that returns `this` to enable chaining.

**Task:** (a) Implement `Array.prototype.myForEach(callback, thisArg)` that matches native behaviour. (b) Explain why native `forEach` returns `undefined`. (c) Explain why making it return `this` for chaining violates the principle of least surprise and is not a good idea.

**Acceptance Criteria:**
- [ ] `myForEach` calls `callback.call(thisArg, element, index, array)` for each element
- [ ] Returns `undefined` (matching native behaviour)
- [ ] Explains: `forEach` is for **side effects** only — it signals "I don't need a return value"
- [ ] Returning `this` would allow chaining but `forEach` is a terminal operation (signals end of pipeline)
- [ ] If you need a return value, use `map`, `filter`, or `reduce` instead
- [ ] Explains: `[].forEach()` on an empty array runs the callback zero times (unlike `reduce` which needs an `initialValue`)
