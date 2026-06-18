# Day 1 Assessment — Hoisting & Scope Chain

**Theme:** You are debugging JavaScript on an e-commerce product page that was written by a developer who mixed `var`, `let`, and `const` without understanding scoping rules. The bugs are subtle and only appear in production.

---

### Q1 — var hoisting ⭐

**Scenario:** A junior developer added a discount banner that reads a `discount` variable before it is declared with `var`. On every page load, the banner briefly shows `undefined` instead of hiding.

**Task:** Without running the code, predict the console output of this snippet and explain why:

```js
console.log(discount);
var discount = 0.2;
console.log(discount);
```

**Acceptance Criteria:**
- [ ] Correctly identifies the first log as `undefined` (not a ReferenceError)
- [ ] Explains that `var` declarations are hoisted to the top of their scope with value `undefined`
- [ ] Correctly identifies the second log as `0.2`
- [ ] Mentions the concept of the "memory-creation phase" vs the "execution phase"

---

### Q2 — Function declaration hoisting ⭐

**Scenario:** The checkout page calls `calculateTax()` before the function is defined in the file. It works fine. A new developer is confused and asks why.

**Task:** Explain why calling a function declaration before its definition works, but calling a function expression before its definition throws a `TypeError`.

**Acceptance Criteria:**
- [ ] States that function declarations are fully hoisted (name + body)
- [ ] States that function expressions assigned to `var` are hoisted as `undefined`, so calling them throws `TypeError: X is not a function`
- [ ] States that function expressions assigned to `let`/`const` are in the Temporal Dead Zone and throw `ReferenceError`
- [ ] Gives a concrete example of each case

---

### Q3 — Temporal Dead Zone ⭐

**Scenario:** You replace a `var` declaration with `let` to fix a scoping bug. Now a different line throws a `ReferenceError: Cannot access 'price' before initialization`. The variable is declared later in the same block.

**Task:** Explain what the Temporal Dead Zone (TDZ) is, where it starts and ends, and why `let`/`const` behave differently from `var`.

**Acceptance Criteria:**
- [ ] Defines TDZ as the zone from the start of the block until the `let`/`const` declaration line is reached
- [ ] States that accessing a variable in the TDZ throws `ReferenceError`
- [ ] Explains that `let`/`const` are still hoisted — they just aren't initialised, unlike `var` which initialises to `undefined`
- [ ] Explains this is intentional to catch bugs

---

### Q4 — Block scope vs function scope ⭐

**Scenario:** A for-loop builds a list of product card click handlers. All handlers alert the same (last) index. A senior dev says "use `let` instead of `var`". Fix it.

**Task:** Write a corrected version of the loop below. Then explain exactly why `var` causes the bug and `let` fixes it.

```js
for (var i = 0; i < 3; i++) {
  document.getElementById('card-' + i).addEventListener('click', function () {
    alert('Product ' + i);
  });
}
```

**Acceptance Criteria:**
- [ ] Replaces `var i` with `let i`
- [ ] Explains that `var` is function-scoped — all three closures share the same `i` variable
- [ ] Explains that `let` creates a new binding per iteration — each closure captures its own `i`
- [ ] Mentions the IIFE approach as a pre-ES6 alternative

---

### Q5 — Scope chain lookup ⭐

**Scenario:** You are reviewing code and need to trace which variable each `console.log` reads.

**Task:** Without running the code, state what each `console.log` prints and which scope the variable is resolved from:

```js
const env = 'global';

function outer() {
  const env = 'outer';
  function inner() {
    console.log(env); // A
  }
  inner();
}

function standalone() {
  console.log(env); // B
}

outer();
standalone();
```

**Acceptance Criteria:**
- [ ] Log A → `'outer'` (resolved from `outer`'s scope, not global)
- [ ] Log B → `'global'` (resolved from global scope, no local `env` in `standalone`)
- [ ] Correctly explains the scope chain walk: inner → outer → global
- [ ] States that scope is determined lexically (where the function is **written**, not where it is **called**)

---

### Q6 — Variable shadowing ⭐⭐

**Scenario:** A product search component has a bug: filtering by category always ignores the user's selected category and uses a hardcoded default instead.

**Task:** Identify the bug, explain what variable shadowing is, and rewrite the function so it correctly uses the parameter.

```js
const category = 'electronics';

function filterProducts(products, category) {
  if (category) {
    var category = category.toLowerCase();  // bug is here
    return products.filter(p => p.category === category);
  }
  return products;
}
```

**Acceptance Criteria:**
- [ ] Identifies that `var category = category.toLowerCase()` is self-referential — `var` hoists the declaration to the top of the function, so `category` is `undefined` when `.toLowerCase()` is called
- [ ] Explains variable shadowing: a local variable with the same name as a parameter/outer variable
- [ ] Fixes by using `let` or `const` for the local variable, or a different name
- [ ] Explains why `var` inside a block does NOT create a new block scope

---

### Q7 — Lexical scope + module pattern ⭐⭐

**Scenario:** You are writing a cart module for the e-commerce site. The cart's item count must be private — external code should not be able to set it to an arbitrary number, only increment/decrement it.

**Task:** Implement a `createCart()` factory using closure to make `itemCount` private. Return an object with `addItem`, `removeItem`, and `getCount` methods.

**Acceptance Criteria:**
- [ ] `itemCount` is declared inside the factory function — not accessible from outside
- [ ] `addItem()` increments the count
- [ ] `removeItem()` decrements the count but does not go below 0
- [ ] `getCount()` returns the current count
- [ ] Calling `cart.itemCount` from outside returns `undefined` (not accessible)
- [ ] Two separate carts created with `createCart()` have independent counts

---

### Q8 — Hoisting with conditionals ⭐⭐

**Scenario:** A feature-flag function uses a conditional function declaration. The QA team reports it behaves differently in Chrome vs Firefox in strict mode.

**Task:** Predict the output of the snippet below, explain why it is unreliable, and rewrite it safely.

```js
function processOrder(isPriority) {
  if (isPriority) {
    function ship() { return 'express'; }
  } else {
    function ship() { return 'standard'; }
  }
  return ship();
}

console.log(processOrder(true));
console.log(processOrder(false));
```

**Acceptance Criteria:**
- [ ] Explains that function declarations inside blocks are non-standard and browser-dependent
- [ ] In non-strict mode, the last declaration wins in some engines (both return `'standard'`)
- [ ] In strict mode, `ship` is block-scoped to the `if`/`else` and throws `ReferenceError` in the `return`
- [ ] Rewrites using function expressions assigned to `let` or `const`
- [ ] Rewritten version always returns `'express'` for `true` and `'standard'` for `false`

---

### Q9 — IIFE for scope isolation ⭐⭐

**Scenario:** Two third-party scripts on the product page both declare a global variable called `config`. They conflict and break each other. You need to wrap one of them without changing its internal logic.

**Task:** Wrap the following code in an IIFE so its `config` variable cannot conflict with other scripts on the page.

```js
var config = { apiKey: 'abc123', timeout: 5000 };
function init() { console.log('Init with', config.apiKey); }
init();
```

**Acceptance Criteria:**
- [ ] The code is wrapped in `(function() { ... })()` or `(() => { ... })()`
- [ ] `config` is no longer accessible on `window`/global scope after the wrap
- [ ] `init()` still executes correctly inside the IIFE
- [ ] Explains that IIFE creates a new function scope that contains the variables

---

### Q10 — Scope + async callbacks ⭐⭐

**Scenario:** An analytics tracker fires a `reportClick` callback for each product. The developer used `var` in the setup loop and the reports always show the same product ID.

**Task:** Given the broken code below, (a) explain the bug, (b) fix it with `let`, (c) fix it without changing `var` (using a closure/IIFE).

```js
var products = ['p1', 'p2', 'p3'];
for (var i = 0; i < products.length; i++) {
  setTimeout(function() {
    console.log('Clicked product:', products[i]);
  }, i * 100);
}
```

**Acceptance Criteria:**
- [ ] Explains that by the time the callbacks run, the loop has finished and `i === 3`, so `products[3]` is `undefined`
- [ ] Fix 1: changes `var i` to `let i` — each iteration has its own `i`
- [ ] Fix 2 (no `let`): wraps the `setTimeout` in an IIFE that receives `i` as a parameter
- [ ] Both fixes produce `'Clicked product: p1'`, `'p2'`, `'p3'` in order

---

### Q11 — Nested scope chain trace ⭐⭐

**Scenario:** A pricing module has three levels of nesting. You need to trace the variable lookup chain to find a bug.

**Task:** Without running it, state what `getPrice()` returns and trace every scope lookup step.

```js
const basePrice = 100;

function applyRegion(region) {
  const multiplier = region === 'IN' ? 0.9 : 1.0;

  function applyDiscount(code) {
    const discount = code === 'SAVE10' ? 0.10 : 0;

    function getPrice() {
      return basePrice * multiplier * (1 - discount);
    }

    return getPrice();
  }

  return applyDiscount;
}

const inPricing = applyRegion('IN');
console.log(inPricing('SAVE10'));
```

**Acceptance Criteria:**
- [ ] Returns `81` (100 × 0.9 × 0.9)
- [ ] Traces: `getPrice` → finds `basePrice` in global scope → `multiplier` in `applyRegion`'s scope → `discount` in `applyDiscount`'s scope
- [ ] States that each lookup walks the scope chain outward until found or global is reached
- [ ] Correctly identifies this is lexical scope determined at write-time

---

### Q12 — Identify the leak + fix it ⭐⭐⭐

**Scenario:** A product gallery component runs in a single-page app. The memory profiler shows memory climbing with every navigation. The developer suspects a scope/variable issue.

**Task:** Find the memory leak in the code below and fix it.

```js
function setupGallery(images) {
  loadedImages = []; // loads all image data into memory
  for (let i = 0; i < images.length; i++) {
    loadedImages.push({ src: images[i], data: new ArrayBuffer(1024 * 1024) });
  }
  document.getElementById('gallery').innerHTML = images
    .map(src => `<img src="${src}">`)
    .join('');
}
```

**Acceptance Criteria:**
- [ ] Identifies `loadedImages` as an accidental global (missing `let`/`const`/`var`)
- [ ] Explains that globals are never garbage-collected as long as the page is open
- [ ] Fixes by adding `const loadedImages = []` inside the function
- [ ] Optionally mentions clearing `loadedImages` at function end if the data is only needed during setup

---

### Q13 — Hoisting order puzzle ⭐⭐⭐

**Scenario:** You inherited a legacy checkout script. Before refactoring it, you need to predict exactly what it does.

**Task:** Trace through the execution and state the console output line-by-line with a reason for each.

```js
var total = 'pending';

function calculateTotal() {
  console.log(total);         // A
  var total = 500;
  console.log(total);         // B
  function applyTax() {
    console.log(total);       // C
    return total * 1.18;
  }
  return applyTax();
}

console.log(total);           // D
calculateTotal();
console.log(total);           // E
```

**Acceptance Criteria:**
- [ ] D → `'pending'` (global `total` before function call)
- [ ] A → `undefined` (local `var total` inside `calculateTotal` is hoisted, shadows global, but not yet assigned)
- [ ] B → `500` (now assigned)
- [ ] C → `500` (closure over `calculateTotal`'s `total` = 500)
- [ ] E → `'pending'` (global `total` never changed — `calculateTotal`'s `total` is local)
- [ ] Explains function-scope hoisting shadowing the global variable

---

### Q14 — Dynamic scope illusion ⭐⭐⭐

**Scenario:** A new developer on the team claims "JavaScript uses dynamic scope because the function reads a variable from the calling context." You need to prove them wrong.

**Task:** Write a snippet that demonstrates JavaScript is lexically (statically) scoped, not dynamically scoped — even when a function is passed as a callback and called from a different context. Explain your proof.

**Acceptance Criteria:**
- [ ] Snippet defines a variable in an outer function and a callback that references it
- [ ] Callback is passed to and called from a completely different function with its own variable of the same name
- [ ] Demonstrates the callback reads the value from where it was **defined**, not where it was **called**
- [ ] Explicitly states the difference: lexical scope = determined at write time; dynamic scope = determined at call time
- [ ] Mentions JavaScript uses lexical scope everywhere (except `this`, which is dynamic)

---

### Q15 — Block scope inside switch ⭐⭐⭐

**Scenario:** A shipping calculator uses a `switch` statement. Two cases both declare a `const rate` and the linter reports a duplicate declaration error.

**Task:** Explain why declaring `const rate` in two separate `case` blocks of the same `switch` causes an error, and show two different ways to fix it.

**Acceptance Criteria:**
- [ ] Explains that a `switch` statement is one block — all `case` labels share the same block scope
- [ ] So two `const rate` declarations in two cases are in the same scope → duplicate declaration error
- [ ] Fix 1: wrap each `case` body in its own `{}` block to create a new scope
- [ ] Fix 2: declare `let rate` once before the switch and assign inside each case
- [ ] Explains that `let`/`const` errors on re-declaration but `var` would silently allow it (which is worse)
