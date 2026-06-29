// ══════════════════════════════════════════════════════
// JS REFRESHER: Everything you need to write real JS
// Run: node 00-modern-javascript.js
// ══════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// 1. VARIABLES — var / let / const
// ─────────────────────────────────────────────
// Why it matters: picking the wrong one causes subtle bugs that only
// show up at runtime, usually at 2am during a prod incident.

function section1_variables() {
  console.log('\n── 1. VARIABLES ──');

  // const: a tattoo. You picked it, you're stuck with it.
  const MAX_RETRIES = 3;
  // MAX_RETRIES = 4; // TypeError — can't reassign

  // let: a dry-erase board. Rewrite it as many times as you want.
  let count = 0;
  count += 1;
  console.log('count:', count); // 1

  // var: haunted. It leaks out of blocks (not functions), gets hoisted
  // to the top of the function, and generally causes confusion.
  // Just don't. Use it only if you're maintaining legacy code.

  // --- HOISTING ---
  // var declarations are hoisted AND initialized to undefined.
  console.log(typeof hoistedVar); // 'undefined' (not ReferenceError!)
  var hoistedVar = 'too late';

  // function declarations are fully hoisted — body and all.
  console.log(hoistedFn()); // works!
  function hoistedFn() { return 'I was hoisted'; }

  // let/const are hoisted but NOT initialized → Temporal Dead Zone (TDZ)
  // Accessing them before declaration throws ReferenceError.
  // console.log(inTDZ); // ReferenceError: Cannot access before initialization
  let inTDZ = 'now safe';
  console.log(inTDZ); // 'now safe'

  // ⚠️ GOTCHA: const doesn't freeze the VALUE, it freezes the BINDING.
  // The object at the other end of the binding is still fully mutable.
  const user = { name: 'Alice' };
  user.name = 'Bob';          // totally fine
  user.age = 30;              // also fine
  // user = { name: 'Carol' }; // TypeError — can't rebind
  console.log(user);          // { name: 'Bob', age: 30 }
  // Use Object.freeze(user) if you want true immutability.
}

// ─────────────────────────────────────────────
// 2. TYPES AND TYPE COERCION
// ─────────────────────────────────────────────
// Why it matters: JS will happily add a string to an array and give you
// a result. Whether that result makes sense is up to you.

function section2_types() {
  console.log('\n── 2. TYPES & COERCION ──');

  // 7 primitives: string, number, bigint, boolean, null, undefined, symbol
  console.log(typeof 'hello');     // 'string'
  console.log(typeof 42);          // 'number'
  console.log(typeof 9007199254740993n); // 'bigint'
  console.log(typeof true);        // 'boolean'
  console.log(typeof undefined);   // 'undefined'
  console.log(typeof Symbol('id')); // 'symbol'

  // typeof quirks that will bite you
  console.log(typeof null);        // 'object' ← famous bug, not a feature
  console.log(typeof function(){}); // 'function' (technically an object)
  console.log(typeof []);          // 'object' (not 'array'!)
  // Correct array check:
  console.log(Array.isArray([]));  // true

  // === vs == — always use ===
  // == does type coercion before comparing. === never does.
  console.log(0 == '0');   // true  ← coercion
  console.log(0 === '0');  // false ← honest
  console.log(null == undefined);  // true (one of the few useful == cases)
  console.log(null === undefined); // false

  // The 6 falsy values — memorize these
  // false, 0, '' (empty string), null, undefined, NaN
  // Everything else is truthy — including '0', [], {}
  console.log(Boolean('0')); // true  ← surprise!
  console.log(Boolean([]));  // true  ← surprise!
  console.log(Boolean({}));  // true  ← surprise!

  // Coercion surprises (great interview fodder)
  console.log([] + []);    // '' — both become empty strings
  console.log([] + {});    // '[object Object]'
  console.log({} + []);    // '[object Object]' (when inside an expr)
  console.log(1 + '2');    // '12' — number coerced to string
  console.log('3' - 1);    // 2   — string coerced to number

  // ⚠️ GOTCHA: NaN is the only value in JS that isn't equal to itself.
  console.log(NaN === NaN);        // false — yes, really
  console.log(NaN !== NaN);        // true
  console.log(Number.isNaN(NaN));  // true  ← correct way
  console.log(isNaN('hello'));     // true  ← wrong! converts first, then checks
  console.log(Number.isNaN('hello')); // false ← correct
}

// ─────────────────────────────────────────────
// 3. FUNCTIONS — declarations, expressions, arrows
// ─────────────────────────────────────────────
// Why it matters: understanding which kind to use determines whether
// `this` works, whether the function exists before you call it, and
// whether you can use it as a constructor.

function section3_functions() {
  console.log('\n── 3. FUNCTIONS ──');

  // Declaration: hoisted fully — can call before definition (see above)
  function greet(name) {
    return `Hello, ${name}`;
  }

  // Expression: assigned to a variable — NOT hoisted
  const greetExpr = function(name) {
    return `Hi, ${name}`;
  };

  // Arrow: concise, shares `this` with surrounding scope
  // Use for callbacks. Don't use when you need your own `this`.
  const greetArrow = (name) => `Hey, ${name}`;

  console.log(greet('Alice'));
  console.log(greetExpr('Bob'));
  console.log(greetArrow('Carol'));

  // Default parameters
  function createUser(name, role = 'viewer', active = true) {
    return { name, role, active };
  }
  console.log(createUser('Dan'));                   // role: 'viewer', active: true
  console.log(createUser('Eve', 'admin'));           // role: 'admin', active: true

  // Rest parameters — collects remaining args into an array
  function sum(...numbers) {
    return numbers.reduce((acc, n) => acc + n, 0);
  }
  console.log(sum(1, 2, 3, 4)); // 10

  // IIFE — Immediately Invoked Function Expression
  // Useful for creating a private scope, or running async code at the top level.
  const result = (function() {
    const secret = 42;
    return secret * 2;
  })();
  console.log('IIFE result:', result); // 84

  // Arrow functions and `this` — they inherit from lexical scope
  const timer = {
    seconds: 0,
    // Regular function: `this` is the timer object — correct
    startRegular: function() {
      // setTimeout(function() { this.seconds++ }, 1000); // `this` would be window/undefined
    },
    // Arrow: `this` stays as the timer object — correct
    startArrow: function() {
      // setTimeout(() => { this.seconds++ }, 1000); // works as expected
    },
  };
  void timer; // just to reference it

  // ⚠️ GOTCHA: Arrow functions can't be constructors and have no `arguments` object.
  const Foo = () => {};
  try {
    new Foo(); // TypeError: Foo is not a constructor
  } catch (e) {
    console.log('Arrow constructor error:', e.message);
  }

  const arrowWithArgs = () => {
    try {
      // console.log(arguments); // ReferenceError in strict mode
    } catch(e) {}
  };
  arrowWithArgs(1, 2, 3);
}

// ─────────────────────────────────────────────
// 4. DESTRUCTURING AND SPREAD/REST
// ─────────────────────────────────────────────
// Why it matters: 90% of the code you read in React and Node
// uses destructuring everywhere. It's not just sugar — it's the idiom.

function section4_destructuring() {
  console.log('\n── 4. DESTRUCTURING & SPREAD ──');

  // Array destructuring
  const [first, second, , fourth = 'default'] = [1, 2, 3];
  console.log(first, second, fourth); // 1 2 'default'

  // Swap without a temp variable
  let a = 1, b = 2;
  [a, b] = [b, a];
  console.log(a, b); // 2 1

  // Object destructuring
  const profile = { name: 'Alice', age: 30, city: 'NYC' };
  const { name, age } = profile;
  console.log(name, age); // Alice 30

  // Rename on the way out: original_key: new_name
  const { name: firstName, city: hometown = 'Unknown' } = profile;
  console.log(firstName, hometown); // Alice NYC

  // Nested destructuring
  const response = { data: { user: { id: 1, role: 'admin' } } };
  const { data: { user: { id, role } } } = response;
  console.log(id, role); // 1 admin

  // Destructuring in function parameters — very common in React
  function renderUser({ name: n, age: a, active = false }) {
    return `${n} (${a}) — ${active ? 'active' : 'inactive'}`;
  }
  console.log(renderUser({ name: 'Bob', age: 25 }));

  // Spread: unpack an iterable into individual elements
  const arr1 = [1, 2, 3];
  const arr2 = [...arr1, 4, 5];          // copy + extend
  console.log(arr2);                      // [1, 2, 3, 4, 5]

  const obj1 = { x: 1, y: 2 };
  const obj2 = { ...obj1, z: 3, x: 99 }; // later keys win
  console.log(obj2);                      // { x: 99, y: 2, z: 3 }

  // Rest in destructuring — collect the remainder
  const [head, ...tail] = [10, 20, 30, 40];
  console.log(head, tail); // 10 [20, 30, 40]

  const { name: pName, ...rest } = profile;
  console.log(pName, rest); // Alice { age: 30, city: 'NYC' }

  // ⚠️ GOTCHA: Spread is a SHALLOW copy. Nested objects share the same reference.
  const original = { a: 1, nested: { b: 2 } };
  const copy = { ...original };
  copy.nested.b = 999;         // mutates original.nested too!
  console.log(original.nested.b); // 999 — oops
  // For deep copies: structuredClone(original) (Node 17+, modern browsers)
}

// ─────────────────────────────────────────────
// 5. ARRAYS — methods every JS dev must know
// ─────────────────────────────────────────────
// Why it matters: you'll use these every single day. map/filter/reduce
// are the backbone of functional data transformation in JS.

function section5_arrays() {
  console.log('\n── 5. ARRAYS ──');

  const cart = [
    { name: 'Coffee', price: 4.5, qty: 2 },
    { name: 'Bagel',  price: 3.0, qty: 1 },
    { name: 'Juice',  price: 5.5, qty: 1 },
  ];

  // map — transform each element, returns new array of same length
  const names = cart.map(item => item.name);
  console.log('Items:', names); // ['Coffee', 'Bagel', 'Juice']

  // filter — keep elements that pass the test
  const expensive = cart.filter(item => item.price > 4);
  console.log('Expensive:', expensive.map(i => i.name)); // ['Coffee', 'Juice']

  // reduce — collapse to a single value (running total, grouping, etc.)
  const total = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  console.log('Total: $' + total.toFixed(2)); // $17.50

  // find / findIndex — first match or -1/undefined
  const bagel = cart.find(item => item.name === 'Bagel');
  console.log('Found:', bagel?.name); // Bagel

  const juiceIdx = cart.findIndex(item => item.name === 'Juice');
  console.log('Juice index:', juiceIdx); // 2

  // some / every — boolean checks
  console.log('Any > $5?', cart.some(item => item.price > 5));   // true
  console.log('All > $2?', cart.every(item => item.price > 2));   // true

  // includes — for primitives (uses ===)
  console.log([1, 2, 3].includes(2)); // true

  // flat / flatMap
  const nested = [[1, 2], [3, [4, 5]]];
  console.log(nested.flat());     // [1, 2, 3, [4, 5]] — one level
  console.log(nested.flat(2));    // [1, 2, 3, 4, 5]  — two levels

  const sentences = ['hello world', 'foo bar'];
  console.log(sentences.flatMap(s => s.split(' '))); // ['hello', 'world', 'foo', 'bar']

  // sort — MUTATES the original
  const nums = [10, 1, 21, 2];
  console.log(nums.sort());                      // [1, 10, 2, 21] — lexicographic!
  console.log(nums.sort((a, b) => a - b));       // [1, 2, 10, 21] — numeric

  // forEach vs map — forEach returns undefined, use it for side effects only
  const log = [];
  [1, 2, 3].forEach(n => log.push(n * 2));
  console.log('forEach side effect:', log); // [2, 4, 6]
  // const doubled = [1,2,3].forEach(n => n * 2); // undefined — classic bug

  // ⚠️ GOTCHA: sort() mutates in place. Slice first if you need the original.
  const original = [3, 1, 2];
  const sorted = [...original].sort((a, b) => a - b); // safe copy
  console.log('original:', original, '| sorted:', sorted);
}

// ─────────────────────────────────────────────
// 6. OBJECTS AND CLASSES
// ─────────────────────────────────────────────
// Why it matters: everything in JS is an object (or lies about it).
// Knowing how objects and classes work explains most runtime surprises.

function section6_objects() {
  console.log('\n── 6. OBJECTS & CLASSES ──');

  // Shorthand properties and methods
  const x = 1, y = 2;
  const point = { x, y, toString() { return `(${this.x}, ${this.y})`; } };
  console.log(point.toString()); // (1, 2)

  // Computed keys — useful for dynamic property names
  const key = 'status';
  const state = { [key]: 'active', [`${key}Code`]: 200 };
  console.log(state); // { status: 'active', statusCode: 200 }

  // Optional chaining — short-circuits on null/undefined instead of throwing
  const data = { user: null };
  console.log(data.user?.address?.city); // undefined — no crash
  console.log(data.user?.getName?.());   // undefined — works on methods too

  // Nullish coalescing (??) — only falls back for null/undefined (not 0, '')
  const port = 0;
  console.log(port || 3000);   // 3000 — 0 is falsy, so || falls back (wrong!)
  console.log(port ?? 3000);   // 0    — ?? only cares about null/undefined

  // Object utilities
  const obj = { a: 1, b: 2, c: 3 };
  console.log(Object.keys(obj));    // ['a', 'b', 'c']
  console.log(Object.values(obj));  // [1, 2, 3]
  console.log(Object.entries(obj)); // [['a',1],['b',2],['c',3]]

  // Merge objects (Object.assign mutates target!)
  const defaults = { theme: 'dark', lang: 'en' };
  const userPrefs = { lang: 'fr' };
  const merged = Object.assign({}, defaults, userPrefs);
  console.log(merged); // { theme: 'dark', lang: 'fr' }
  // Or cleaner: const merged = { ...defaults, ...userPrefs };

  // Deep clone (Node 17+, modern browsers)
  const deep = { a: { b: { c: 42 } } };
  const clone = structuredClone(deep);
  clone.a.b.c = 0;
  console.log('original preserved:', deep.a.b.c); // 42

  // Class syntax
  class BankAccount {
    #balance = 0;                          // private field — truly private
    static bank = 'First National';       // shared across all instances

    constructor(owner, initialBalance = 0) {
      this.owner = owner;
      this.#balance = initialBalance;
    }

    deposit(amount) {
      if (amount <= 0) throw new RangeError('Amount must be positive');
      this.#balance += amount;
      return this;                         // enable chaining
    }

    get balance() { return this.#balance; } // read-only accessor

    toString() {
      return `${BankAccount.bank}: ${this.owner} — $${this.#balance}`;
    }
  }

  class SavingsAccount extends BankAccount {
    constructor(owner, balance, rate = 0.02) {
      super(owner, balance);
      this.rate = rate;
    }
    applyInterest() {
      this.deposit(Math.floor(this.balance * this.rate));
      return this;
    }
  }

  const acct = new SavingsAccount('Alice', 1000);
  acct.applyInterest().deposit(500);
  console.log(acct.toString()); // First National: Alice — $1520

  // Prototype chain in one paragraph:
  // Every object has a hidden [[Prototype]] link. When you access a property,
  // JS walks up the chain until it finds it or hits null (Object.prototype).
  // class/extends just wires up that chain for you. No magic.
  console.log(acct instanceof SavingsAccount); // true
  console.log(acct instanceof BankAccount);    // true

  // ⚠️ GOTCHA: class is syntactic sugar over prototypes.
  // typeof BankAccount is 'function' — not 'class'.
  console.log(typeof BankAccount); // 'function'
}

// ─────────────────────────────────────────────
// 7. ASYNC JAVASCRIPT — the real explanation
// ─────────────────────────────────────────────
// Why it matters: async bugs are the hardest to debug. If you understand
// the event loop, you can reason about execution order every time.

function section7_async() {
  console.log('\n── 7. ASYNC JAVASCRIPT ──');

  // Event loop in 3 sentences:
  // JS is single-threaded. The call stack runs your code synchronously.
  // When async work (timers, I/O, fetch) finishes, its callback waits in a
  // queue. The event loop picks from that queue only when the stack is empty.
  // Microtasks (Promises) drain before macrotasks (setTimeout, setInterval).

  // Order of execution
  console.log('1 sync');
  setTimeout(() => console.log('3 macrotask (setTimeout)'), 0);
  Promise.resolve().then(() => console.log('2 microtask (Promise)'));
  // Output order: 1, 2, 3 — even though setTimeout is 0ms

  // Promises — a contract for a future value
  function fetchUser(id) {
    return new Promise((resolve, reject) => {
      if (id <= 0) {
        reject(new Error(`Invalid id: ${id}`));
        return;
      }
      setTimeout(() => resolve({ id, name: `User ${id}` }), 10);
    });
  }

  // .then/.catch chaining
  fetchUser(1)
    .then(user => { console.log('Promise resolved:', user.name); return user.id; })
    .then(id => console.log('Chained:', id))
    .catch(err => console.error('Promise error:', err.message))
    .finally(() => console.log('Promise done'));

  // async/await — same machinery, prettier syntax
  async function loadUsers() {
    try {
      const user = await fetchUser(2);
      console.log('Async/await got:', user.name);

      // WRONG — runs sequentially (each await waits for the previous)
      // const u1 = await fetchUser(3);
      // const u2 = await fetchUser(4);

      // RIGHT — run in parallel with Promise.all
      const [u1, u2] = await Promise.all([fetchUser(3), fetchUser(4)]);
      console.log('Parallel:', u1.name, u2.name);

    } catch (err) {
      console.error('loadUsers error:', err.message);
    }
  }
  loadUsers();

  // Promise combinators
  // Promise.all       — all must resolve; one rejection = whole thing rejects
  // Promise.allSettled— wait for all, get results+errors for each
  // Promise.race      — resolves/rejects with the first settled
  // Promise.any       — resolves with the first success; rejects if all fail

  Promise.allSettled([
    fetchUser(5),
    fetchUser(-1), // will reject
  ]).then(results => {
    results.forEach(r => {
      if (r.status === 'fulfilled') console.log('Settled OK:', r.value.name);
      else console.log('Settled ERR:', r.reason.message);
    });
  });

  // ⚠️ GOTCHA: await in a for loop is sequential — each waits for the last.
  // Use Promise.all to run them in parallel. The difference is HUGE on real APIs.
  async function sequential() {
    const ids = [1, 2, 3];
    const results = [];
    for (const id of ids) {
      results.push(await fetchUser(id)); // 3 × network round trips, in series
    }
    return results;
  }
  async function parallel() {
    const ids = [1, 2, 3];
    return await Promise.all(ids.map(id => fetchUser(id))); // 1 round trip
  }
  void sequential;
  void parallel;
}

// ─────────────────────────────────────────────
// 8. MODULES (ESM)
// ─────────────────────────────────────────────
// Why it matters: every modern JS project uses modules. Mixing up
// named vs default exports, or ESM vs CommonJS, breaks builds silently.

function section8_modules() {
  console.log('\n── 8. MODULES ──');

  // Named export — explicit, tree-shakeable, easy to auto-import
  // export function add(a, b) { return a + b; }
  // export const PI = 3.14159;

  // Default export — one per file, loses its name on import
  // export default class UserService { ... }

  // Named import
  // import { add, PI } from './math.js';

  // Rename on import
  // import { add as sum } from './math.js';

  // Import everything into a namespace
  // import * as MathUtils from './math.js';
  // MathUtils.add(1, 2)

  // Default import
  // import UserService from './UserService.js';

  // Re-export (barrel file pattern — index.js that re-exports everything)
  // export { add, PI } from './math.js';
  // export { default as UserService } from './UserService.js';

  // Dynamic import — lazy-load a module at runtime
  // const module = await import('./heavy-chart-lib.js');
  // module.render(data);
  // Useful for code splitting in bundlers (Vite, Webpack).

  // CommonJS (require) — what Node uses by default, what you see in older code
  // const fs = require('fs');
  // module.exports = { add };
  // You'll see this in Node scripts, tooling configs, Jest tests.

  // ESM in Node: either rename file to .mjs, or add "type": "module" in package.json
  // In that mode, require() is gone — use import/export everywhere.

  // Why default exports can be bad:
  // import User from './User.js';    // works
  // import Whatever from './User.js'; // also "works" — typos get no warnings
  // Named exports self-document and give you IDE refactoring for free.

  console.log('Module pattern: named exports > default exports for libraries');

  // ⚠️ GOTCHA: ESM runs in strict mode automatically. No implicit globals,
  // no `with` statement, and `this` at the top level is undefined (not window).
  // CommonJS files run in sloppy mode unless you add 'use strict' manually.
}

// ─────────────────────────────────────────────
// 9. ERROR HANDLING
// ─────────────────────────────────────────────
// Why it matters: unhandled errors in production are user-facing bugs.
// Proper error handling is what separates throwaway scripts from real software.

function section9_errors() {
  console.log('\n── 9. ERROR HANDLING ──');

  // try / catch / finally
  function divide(a, b) {
    if (b === 0) throw new RangeError('Cannot divide by zero');
    return a / b;
  }

  try {
    console.log(divide(10, 2));  // 5
    console.log(divide(10, 0));  // throws
  } catch (err) {
    // err is always the thrown value — usually an Error object
    console.log('Caught:', err.message, `(${err.name})`);
  } finally {
    // Runs regardless — good for cleanup (close DB connections, etc.)
    console.log('finally always runs');
  }

  // Built-in error types
  // TypeError     — wrong type: null.doSomething()
  // RangeError    — out of range: new Array(-1)
  // ReferenceError— bad reference: accessing undeclared variable
  // SyntaxError   — bad code: usually thrown by JSON.parse

  try {
    JSON.parse('not json');
  } catch (err) {
    console.log('JSON parse error:', err instanceof SyntaxError); // true
  }

  // Custom error classes — essential for APIs and domain logic
  class ApiError extends Error {
    constructor(message, statusCode) {
      super(message);         // sets .message
      this.name = 'ApiError'; // override default 'Error'
      this.statusCode = statusCode;
    }
  }

  class NotFoundError extends ApiError {
    constructor(resource) {
      super(`${resource} not found`, 404);
      this.name = 'NotFoundError';
    }
  }

  try {
    throw new NotFoundError('User');
  } catch (err) {
    if (err instanceof NotFoundError) {
      console.log(`${err.statusCode}: ${err.message}`); // 404: User not found
    } else {
      throw err; // re-throw errors you can't handle
    }
  }

  // Async error handling
  async function riskyFetch() {
    // Without try/catch, a rejected await is an unhandled rejection
    try {
      const data = await Promise.reject(new Error('Network error'));
      return data;
    } catch (err) {
      console.log('Async caught:', err.message);
      return null;
    }
  }
  riskyFetch();

  // Global safety net (don't rely on this — it's a last resort)
  // process.on('unhandledRejection', (reason) => {
  //   console.error('Unhandled rejection:', reason);
  //   process.exit(1);
  // });

  // ⚠️ GOTCHA: catch catches EVERYTHING — including bugs you didn't expect.
  // Be specific. Check err.name or instanceof before handling.
  // If you can't handle it, re-throw it. Swallowing errors silently is worse
  // than crashing — the bug becomes invisible.
  try {
    throw new TypeError('Unexpected type');
  } catch (err) {
    if (err instanceof RangeError) {
      console.log('Handled range error');
    } else {
      // This is a different error — don't swallow it
      console.log('Re-throwing:', err.message);
      // throw err; // would re-throw in real code
    }
  }
}

// ─────────────────────────────────────────────
// 10. MODERN SYNTAX QUICK-REFERENCE
// ─────────────────────────────────────────────
// Why it matters: these are the patterns you'll see in every modern
// codebase. Not knowing them means reading code in a foreign language.

function section10_modern() {
  console.log('\n── 10. MODERN SYNTAX ──');

  // Template literals
  const name = 'World';
  console.log(`Hello, ${name}!`);
  console.log(`Multi
line
string`);

  // Tagged templates — a function that processes a template literal
  function highlight(strings, ...values) {
    return strings.reduce((acc, str, i) =>
      acc + str + (values[i] !== undefined ? `[${values[i]}]` : ''), '');
  }
  console.log(highlight`Status: ${200} for user ${'Alice'}`);
  // Status: [200] for user [Alice]

  // Optional chaining
  const config = { db: { host: 'localhost' } };
  console.log(config?.db?.host);      // 'localhost'
  console.log(config?.cache?.host);   // undefined — no crash
  console.log(config?.getDb?.());     // undefined — works on methods too

  // Nullish coalescing + logical assignment operators
  let username = null;
  username ??= 'Anonymous';    // assign only if null or undefined
  console.log(username);       // 'Anonymous'

  let count = 0;
  count ||= 10;                // assign only if falsy — 0 is falsy!
  console.log(count);          // 10 (might not be what you wanted)

  let flag = true;
  flag &&= false;              // assign only if truthy
  console.log(flag);           // false

  // Object.fromEntries — the inverse of Object.entries
  const entries = [['a', 1], ['b', 2], ['c', 3]];
  const obj = Object.fromEntries(entries);
  console.log(obj); // { a: 1, b: 2, c: 3 }

  // Useful pattern: transform object values
  const prices = { apple: 1.5, banana: 0.75, cherry: 2.0 };
  const discounted = Object.fromEntries(
    Object.entries(prices).map(([k, v]) => [k, +(v * 0.9).toFixed(2)])
  );
  console.log(discounted); // { apple: 1.35, banana: 0.68, cherry: 1.8 }

  // Array.from — create arrays from iterables or array-like objects
  console.log(Array.from('hello'));           // ['h','e','l','l','o']
  console.log(Array.from({ length: 5 }, (_, i) => i * 2)); // [0,2,4,6,8]

  // structuredClone — deep clone without JSON.parse hacks
  const original = { a: 1, b: { c: [1, 2, 3] }, d: new Date() };
  const cloned = structuredClone(original);
  cloned.b.c.push(4);
  console.log('original.b.c:', original.b.c); // [1,2,3] — untouched

  // WeakMap / WeakSet — store object references without preventing garbage collection
  // Use WeakMap when you need private data keyed by an object instance,
  // or to cache computation results without causing memory leaks.
  const cache = new WeakMap();
  function expensiveCalc(obj) {
    if (cache.has(obj)) return cache.get(obj);
    const result = obj.value * 42; // pretend this is expensive
    cache.set(obj, result);
    return result;
  }
  const target = { value: 10 };
  console.log(expensiveCalc(target)); // 420
  console.log(expensiveCalc(target)); // 420 (from cache)
  // When `target` goes out of scope, the WeakMap entry is garbage-collected.
  // A regular Map would hold the reference and leak memory.

  // ⚠️ GOTCHA: ??= vs ||= — they look similar but differ on 0 and ''
  let a = 0;
  a ??= 99; console.log('??= on 0:', a); // 0  — 0 is not null/undefined
  a ||= 99; console.log('||= on 0:', a); // 99 — 0 is falsy
}

// ─────────────────────────────────────────────
// SELF-ASSESSMENT
// ─────────────────────────────────────────────

function selfAssessment() {
  console.log('\n── SELF-ASSESSMENT ──');
  console.log('Read each question, answer it mentally, then check the answer below.');
  console.log('Scoring: 0-4 re-study the sections | 5-9 progressing | 10-12 solid | 13-15 ready\n');

  const questions = [
    {
      q: 'Q1. What does this output?\n    console.log(typeof null);',
      a: '"object". It\'s a historical bug in JS that was never fixed. Use `=== null` to check for null.'
    },
    {
      q: 'Q2. What does this output?\n    console.log(0 == false, 0 === false);',
      a: 'true, false. == coerces both to numbers (false → 0), === checks type too.'
    },
    {
      q: 'Q3. What\'s wrong with this?\n    const arr = [3, 1, 10, 2];\n    arr.sort();\n    console.log(arr); // expecting numeric order',
      a: '[1, 10, 2, 3] — sort converts to strings by default. Fix: arr.sort((a,b) => a-b).'
    },
    {
      q: 'Q4. What are the 6 falsy values in JS?',
      a: 'false, 0, "" (empty string), null, undefined, NaN. Note: "0" and [] and {} are all truthy.'
    },
    {
      q: 'Q5. What does this print, and why?\n    console.log(1);\n    setTimeout(() => console.log(2), 0);\n    Promise.resolve().then(() => console.log(3));\n    console.log(4);',
      a: '1, 4, 3, 2. Sync runs first (1, 4), then microtasks (Promise → 3), then macrotasks (setTimeout → 2).'
    },
    {
      q: 'Q6. What\'s the output?\n    const obj = { a: 1 };\n    const copy = { ...obj };\n    copy.a = 99;\n    console.log(obj.a);',
      a: '1. Spread makes a shallow copy of the top-level. Primitives (like a:1) are copied by value, so obj.a is unaffected.'
    },
    {
      q: 'Q7. Fix the bug:\n    const double = nums => {\n      return nums.forEach(n => n * 2);\n    };',
      a: 'forEach returns undefined. Replace with .map(n => n * 2).'
    },
    {
      q: 'Q8. What does this output?\n    console.log(NaN === NaN);',
      a: 'false. NaN is the only value not equal to itself. Use Number.isNaN(value) instead.'
    },
    {
      q: 'Q9. What\'s the difference between ?? and ||?',
      a: '|| falls back on any falsy value (0, "", false, null, undefined). ?? only falls back on null or undefined. Use ?? when 0 or "" are valid values.'
    },
    {
      q: 'Q10. Is this code correct?\n    async function getAll(ids) {\n      const results = [];\n      for (const id of ids) {\n        results.push(await fetch(`/api/${id}`));\n      }\n      return results;\n    }',
      a: 'It works but is slow — each fetch waits for the previous. Fix: return Promise.all(ids.map(id => fetch(`/api/${id}`))). Runs in parallel.'
    },
    {
      q: 'Q11. What does this output and why?\n    function test() {\n      console.log(x);\n      var x = 5;\n    }\n    test();',
      a: 'undefined. var declarations are hoisted to the top of the function, but the assignment is not. So x exists but is undefined when logged.'
    },
    {
      q: 'Q12. What\'s wrong?\n    const Greet = (name) => `Hello ${name}`;\n    const obj = new Greet("Alice");',
      a: 'TypeError: Greet is not a constructor. Arrow functions cannot be used with new. Use a regular function or class.'
    },
    {
      q: 'Q13. What does this return?\n    [1, 2, 3].reduce((acc, n) => acc + n);',
      a: '6. When no initial value is provided, reduce uses the first element (1) as the initial accumulator. It\'s fine here, but always pass an explicit initial value to avoid bugs with empty arrays.'
    },
    {
      q: 'Q14. What is the Temporal Dead Zone (TDZ)?',
      a: 'The period between when a let/const variable is hoisted (at scope creation) and when it is initialized (at the declaration line). Accessing the variable in this window throws a ReferenceError.'
    },
    {
      q: 'Q15. What\'s the difference between structuredClone and JSON.parse(JSON.stringify(x))?',
      a: 'structuredClone handles Date objects, RegExp, Map, Set, circular references, and undefined values correctly. JSON.parse/stringify converts Dates to strings, drops functions and undefined, and crashes on circular refs.'
    },
  ];

  questions.forEach(({ q, a }) => {
    console.log(q);
    console.log(`   → ${a}\n`);
  });
}

// ─────────────────────────────────────────────
// RUN ALL EXAMPLES
// ─────────────────────────────────────────────

function runAllExamples() {
  section1_variables();
  section2_types();
  section3_functions();
  section4_destructuring();
  section5_arrays();
  section6_objects();
  section7_async();
  section8_modules();
  section9_errors();
  section10_modern();
  selfAssessment();

  console.log('\n══════════════════════════════════════════════════════');
  console.log('Done. Some async output (Promises/setTimeout) may appear below.');
  console.log('══════════════════════════════════════════════════════\n');
}

runAllExamples();
