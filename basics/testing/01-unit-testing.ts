// ═══════════════════════════════════════════════════════════════
// TESTING 01: UNIT TESTING WITH VITEST  (Day 31)
// Run tests:      npm test
// Run with UI:    npm run test:ui
// Coverage:       npm run test:coverage
// Type-check:     npm run check
// ═══════════════════════════════════════════════════════════════
//
// WHAT IS A UNIT TEST?
//  A unit test verifies ONE piece of logic in complete isolation.
//  "Unit" = function, class, or module — something with a clear boundary.
//  Every external dependency (APIs, timers, other modules) is replaced
//  with a controlled fake so the test only fails for ONE reason.
//
// THE TESTING TROPHY (Kent C. Dodds — preferred over pyramid):
//
//          /   E2E   \           ← few, slow, expensive — full browser
//         /─────────────\
//        / Integration   \      ← moderate — multiple units together
//       /─────────────────\
//      /    Unit Tests      \   ← many, fast, isolated
//     /─────────────────────\
//    /   Static (TypeScript)  \  ← cheapest — catches type errors at compile
//   ─────────────────────────────
//
//  The trophy says: invest the MOST in integration tests (they give the
//  best confidence:effort ratio), a solid base in unit tests (for pure logic),
//  a small layer of E2E for critical user flows, and rely heavily on types.
//
// WHY VITEST INSTEAD OF JEST?
//  • Same API as Jest — every Jest pattern works in Vitest
//  • Runs inside Vite — instant HMR, native ESM, no babel config
//  • globals:true means describe/it/expect/vi are auto-imported
//  • 10-30× faster on large repos because of Vite's module graph caching
//
// HOW THIS PROJECT IS CONFIGURED (vite.config.ts):
//
//  test: {
//    globals: true,                     ← describe/it/expect/vi are global
//    environment: 'jsdom',              ← browser-like DOM (for component tests)
//    setupFiles: ['./src/mocks/setup.ts'], ← runs before every test file
//    include: ['src/__tests__/**/*.test.{ts,tsx}'],
//    coverage: { provider: 'v8', reporter: ['text', 'html'] }
//  }
//
//  The '@' path alias maps to 'src/', so:
//    import { calculateCartTotal } from '@/utils/calculations'
//  resolves to src/utils/calculations.ts
//
// ───────────────────────────────────────────────────────────────

// ───────────────────────────────────────────────────────────────
// 1. TEST ANATOMY: describe / it / test / expect
// ───────────────────────────────────────────────────────────────
//
// describe(name, fn)
//   Groups related tests. Describes WHAT is being tested.
//   Can be nested — outer for the module, inner for each function.
//
// it(name, fn) or test(name, fn)
//   Defines one test case. 'it' reads more like English:
//   "it returns 0 for an empty cart".
//   Convention: "it <does something> when <condition>"
//
// expect(actual).matcher(expected)
//   Makes an assertion. If the assertion fails, the test fails
//   with a diff showing actual vs expected.
//
// GOOD TEST NAMING PATTERN:
//   it('returns the discounted price when a valid discount is applied')
//   NOT: it('discount test') ← too vague
//   NOT: it('test_applyDiscount_001') ← too mechanical
//
// EXAMPLE STRUCTURE:
//
//   describe('calculateCartTotal', () => {
//     describe('with an empty cart', () => {
//       it('returns 0', () => {
//         expect(calculateCartTotal([])).toBe(0);
//       });
//     });
//
//     describe('with multiple items', () => {
//       it('sums price × quantity for each item', () => {
//         const items = [
//           { id: 'a', name: 'Apple', price: 2, quantity: 3 },   // 6
//           { id: 'b', name: 'Bread', price: 1.5, quantity: 2 }, // 3
//         ];
//         expect(calculateCartTotal(items)).toBeCloseTo(9);
//       });
//     });
//   });
//
// ARRANGE – ACT – ASSERT (AAA pattern):
//   Every test follows three steps:
//   1. ARRANGE: set up the data and dependencies
//   2. ACT:     call the function under test
//   3. ASSERT:  verify the result with expect()
//
//   const items = [makeItem('a', 10, 2)];  // ← ARRANGE
//   const total = calculateCartTotal(items); // ← ACT
//   expect(total).toBe(20);                 // ← ASSERT

// ───────────────────────────────────────────────────────────────
// 2. MATCHERS — FULL REFERENCE
// ───────────────────────────────────────────────────────────────
//
// EQUALITY MATCHERS:
//
//  toBe(value)
//    Strict equality (===). Use for primitives: numbers, strings, booleans.
//    ❌ WRONG: expect([1,2,3]).toBe([1,2,3]) — different object references!
//    ✅ RIGHT: expect(2 + 2).toBe(4)
//    ✅ RIGHT: expect(user.name).toBe('Alice')
//
//  toEqual(value)
//    Deep equality — recursively compares object/array structure.
//    ✅ Use for objects and arrays.
//    expect({ a: 1, b: { c: 2 } }).toEqual({ a: 1, b: { c: 2 } }) ✅
//    expect([1, 2, 3]).toEqual([1, 2, 3]) ✅
//
//  toStrictEqual(value)
//    Like toEqual but also checks:
//    - undefined properties (toEqual ignores them)
//    - object types (Date, Map, Set must match exactly)
//    expect({ a: 1, b: undefined }).toEqual({ a: 1 })       // ✅ passes
//    expect({ a: 1, b: undefined }).toStrictEqual({ a: 1 }) // ❌ fails
//
// NUMBER MATCHERS:
//
//  toBeCloseTo(number, numDigits?)
//    Floating-point safe comparison. 0.1 + 0.2 = 0.30000000000000004 in JS.
//    numDigits defaults to 2 (checks within 0.005).
//    expect(0.1 + 0.2).toBeCloseTo(0.3)       ✅
//    expect(0.1 + 0.2).toBeCloseTo(0.3, 5)    ❌ too precise
//
//  toBeGreaterThan(n) / toBeGreaterThanOrEqual(n)
//  toBeLessThan(n) / toBeLessThanOrEqual(n)
//    expect(5).toBeGreaterThan(4)
//    expect(3).toBeLessThanOrEqual(3)
//
// STRING MATCHERS:
//
//  toContain(substring)        expect('hello world').toContain('world')
//  toMatch(regex | string)     expect('foo bar').toMatch(/foo/)
//  toHaveLength(n)             expect('hello').toHaveLength(5)
//
// ARRAY / ITERABLE MATCHERS:
//
//  toContain(item)             expect([1,2,3]).toContain(2)
//  toHaveLength(n)             expect([1,2,3]).toHaveLength(3)
//  toContainEqual(object)      deep equality for one item in array
//    expect([{ a: 1 }, { a: 2 }]).toContainEqual({ a: 1 })
//  toEqual(expect.arrayContaining([...]))
//    Subset match — array must contain ALL listed items, order doesn't matter
//    expect([1,2,3,4]).toEqual(expect.arrayContaining([2, 4]))
//
// NULL / BOOLEAN MATCHERS:
//
//  toBeNull()                  expect(null).toBeNull()
//  toBeUndefined()             expect(undefined).toBeUndefined()
//  toBeDefined()               expect(42).toBeDefined()
//  toBeTruthy()                expect(1).toBeTruthy()   // anything truthy
//  toBeFalsy()                 expect(0).toBeFalsy()    // 0, '', null, undefined, false, NaN
//  toBeNaN()                   expect(NaN).toBeNaN()
//
// ERROR MATCHERS:
//
//  toThrow(message?)
//    ⚠️ WRAP in arrow function — the throw must happen inside expect's callback!
//    expect(() => applyDiscount(100, -1)).toThrow()
//    expect(() => applyDiscount(100, -1)).toThrow('Discount must be between 0 and 100')
//    expect(() => applyDiscount(100, -1)).toThrow(/between 0 and 100/)
//    expect(() => applyDiscount(100, -1)).toThrow(Error)
//
//    WHY the arrow function?
//    If you write: expect(applyDiscount(100, -1)).toThrow()
//    The throw happens BEFORE expect() runs, crashing the whole test runner.
//    The arrow function delays the call so Vitest can catch the throw.
//
//  toThrowError()   — alias for toThrow()
//
// PROMISE MATCHERS:
//
//  await expect(Promise.resolve(42)).resolves.toBe(42)
//  await expect(Promise.reject(new Error('boom'))).rejects.toThrow('boom')
//  await expect(fetchUser(1)).resolves.toEqual({ id: 1, name: 'Alice' })
//
// NEGATION:
//
//  .not reverses any matcher:
//  expect(5).not.toBe(6)
//  expect([1,2,3]).not.toContain(4)
//  expect(() => validFn()).not.toThrow()

// ───────────────────────────────────────────────────────────────
// 3. MOCK FUNCTIONS — vi.fn()
// ───────────────────────────────────────────────────────────────
//
// A mock function is a spy + fake — it records every call AND lets
// you control what it returns. Use when:
//  - You want to verify a callback was called
//  - You want to control the return value without a real implementation
//  - The real function has side effects (network, timers, localStorage)
//
// CREATING A MOCK:
//   const mockFn = vi.fn()
//   const mockFn = vi.fn(() => 'default return')
//   const mockFn = vi.fn().mockReturnValue('always return this')
//
// CONTROLLING RETURN VALUES:
//
//  mockReturnValue(value)          — always return this value
//  mockReturnValueOnce(value)      — return this once, then fall through
//  mockResolvedValue(value)        — return Promise.resolve(value)
//  mockResolvedValueOnce(value)    — once
//  mockRejectedValue(error)        — return Promise.reject(error)
//  mockImplementation(fn)          — full implementation override
//  mockImplementationOnce(fn)      — once
//
//  Example:
//    const fetchUser = vi.fn()
//      .mockResolvedValueOnce({ id: 1, name: 'Alice' })  // first call
//      .mockResolvedValueOnce({ id: 2, name: 'Bob' })    // second call
//      .mockRejectedValue(new Error('Not found'));         // all subsequent
//
// INSPECTING CALLS:
//
//  mockFn.mock.calls          — array of argument arrays: [[arg1, arg2], ...]
//  mockFn.mock.results        — array of return value descriptors
//  mockFn.mock.instances      — 'this' context for each call
//
//  expect(mockFn).toHaveBeenCalled()
//  expect(mockFn).toHaveBeenCalledTimes(3)
//  expect(mockFn).toHaveBeenCalledWith('arg1', 42)
//  expect(mockFn).toHaveBeenLastCalledWith('last arg')
//  expect(mockFn).toHaveBeenNthCalledWith(2, 'second call arg')
//
// RESETTING:
//
//  mockFn.mockClear()    — clears mock.calls, mock.results (keeps implementation)
//  mockFn.mockReset()    — clears calls + implementation (returns undefined)
//  mockFn.mockRestore()  — only for vi.spyOn — restores original function
//
//  Use beforeEach(() => vi.clearAllMocks()) to auto-clear between tests.

function demonstrateMockFn() {
  // This is NOT a Vitest test — it shows the patterns in plain TS
  // so you understand what happens inside tests.

  // Creating a mock
  const greet = (name: string): string => `Hello, ${name}!`;

  // In a test you'd do:
  // const mockGreet = vi.fn().mockReturnValue('Hello, Mock!');
  // mockGreet('anyone');         // returns 'Hello, Mock!'
  // expect(mockGreet).toHaveBeenCalledWith('anyone');

  // Simulating: mock.calls inspection
  type Call = [string];
  const calls: Call[] = [];
  const spiedGreet = (name: string) => {
    calls.push([name]);
    return greet(name);
  };

  spiedGreet('Alice');
  spiedGreet('Bob');

  console.log('calls:', calls); // [['Alice'], ['Bob']]
  console.log('first call arg:', calls[0][0]); // 'Alice'
}

// ───────────────────────────────────────────────────────────────
// 4. SPYING ON REAL FUNCTIONS — vi.spyOn()
// ───────────────────────────────────────────────────────────────
//
// vi.spyOn() wraps an EXISTING function so you can:
//  a) Track calls without changing behavior
//  b) Override behavior temporarily for one test
//
// SYNTAX:
//   vi.spyOn(object, 'methodName')
//   vi.spyOn(object, 'methodName').mockReturnValue(value)
//   vi.spyOn(object, 'methodName').mockImplementation(fn)
//
// IMPORTANT: Always call .mockRestore() in afterEach (or use vi.restoreAllMocks())
// to put the original function back. Otherwise later tests get the spy behavior.
//
// EXAMPLE — spy on console.error:
//
//   it('logs an error when fetch fails', async () => {
//     const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
//     // ... trigger the error path
//     expect(spy).toHaveBeenCalledWith(expect.stringContaining('Network error'));
//     spy.mockRestore();
//   });
//
// EXAMPLE — spy on a module export:
//
//   import * as validators from '@/utils/validators';
//
//   it('calls validateEmail during form submission', () => {
//     const spy = vi.spyOn(validators, 'validateEmail').mockReturnValue({ valid: true });
//     // ... render form, fill it, submit
//     expect(spy).toHaveBeenCalledWith('test@example.com');
//   });
//
// DIFFERENCE: vi.fn() vs vi.spyOn()
//
//  vi.fn()        — creates a brand-new mock from scratch
//  vi.spyOn()     — wraps an EXISTING method on an object
//
//  Use vi.fn() when you're passing a callback prop or creating a handler.
//  Use vi.spyOn() when you want to intercept a real module's method.

// ───────────────────────────────────────────────────────────────
// 5. MODULE MOCKING — vi.mock()
// ───────────────────────────────────────────────────────────────
//
// vi.mock() replaces an ENTIRE module with a fake version.
// It's hoisted to the top of the file by Vitest's transform pipeline,
// so it runs BEFORE any imports — even before describe().
//
// BASIC AUTO-MOCK:
//   vi.mock('@/api/userService')
//   Every function in userService becomes vi.fn() returning undefined.
//
// MOCK WITH FACTORY:
//   vi.mock('@/api/userService', () => ({
//     fetchUser: vi.fn().mockResolvedValue({ id: 1, name: 'Alice' }),
//     deleteUser: vi.fn().mockResolvedValue({ success: true }),
//   }));
//
// ACCESS THE MOCK INSIDE A TEST:
//   import { fetchUser } from '@/api/userService';
//   // fetchUser is now the vi.fn() you defined above
//   expect(fetchUser).toHaveBeenCalledWith(1);
//
// OVERRIDE IN A SPECIFIC TEST:
//   it('handles error', async () => {
//     vi.mocked(fetchUser).mockRejectedValueOnce(new Error('Server down'));
//     // ... your test
//   });
//
// vi.mocked(fn) — TypeScript helper that types the mock correctly
//
// PARTIAL MOCKS — mock only some exports:
//   vi.mock('@/utils/calculations', async (importOriginal) => {
//     const real = await importOriginal<typeof import('@/utils/calculations')>();
//     return {
//       ...real,                                    // keep real implementations
//       applyDiscount: vi.fn().mockReturnValue(80), // override only this one
//     };
//   });
//
// RESET MOCKS BETWEEN TESTS:
//   In vite.config.ts test section:
//     clearMocks: true      — clears calls/instances/results
//     resetMocks: true      — also resets implementations
//     restoreMocks: true    — also restores vi.spyOn() originals

// ───────────────────────────────────────────────────────────────
// 6. FAKE TIMERS — vi.useFakeTimers()
// ───────────────────────────────────────────────────────────────
//
// setTimeout, setInterval, Date.now() — all replaced with fake versions
// you control. Without fake timers you'd have to actually wait 300ms
// for a debounce. With them, you jump time forward programmatically.
//
// SETUP:
//   beforeEach(() => { vi.useFakeTimers(); });
//   afterEach(() => { vi.useRealTimers(); });
//
// KEY METHODS:
//
//  vi.advanceTimersByTime(ms)    — advance fake clock by ms
//  vi.runAllTimers()             — run all pending timers to completion
//  vi.runOnlyPendingTimers()     — run timers queued right now (not new ones)
//  vi.clearAllTimers()           — cancel all pending timers
//  vi.setSystemTime(date)        — set what Date.now() returns
//
// TESTING A DEBOUNCE FUNCTION:
//
//   import { useDebounce } from '@/hooks/useDebounce';
//
//   // useDebounce waits 300ms before returning the new value
//   it('updates value after the delay', () => {
//     vi.useFakeTimers();
//
//     let debounced = useDebounce('initial', 300);
//     // ... (in a hook test context with renderHook)
//
//     vi.advanceTimersByTime(299);
//     // still old value — delay hasn't elapsed
//
//     vi.advanceTimersByTime(1); // total: 300ms
//     // now debounced === new value
//
//     vi.useRealTimers();
//   });
//
// TESTING A FUNCTION WITH setTimeout DIRECTLY:
//
//   function delay(ms: number): Promise<void> {
//     return new Promise(resolve => setTimeout(resolve, ms));
//   }
//
//   it('resolves after the delay', async () => {
//     vi.useFakeTimers();
//     const promise = delay(1000);
//     vi.advanceTimersByTime(1000);
//     await promise; // resolves immediately now
//     vi.useRealTimers();
//   });
//
// TESTING Date.now():
//
//   it('stamps the correct timestamp', () => {
//     vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
//     const result = createEvent('Meeting');
//     expect(result.createdAt).toBe('2024-01-15T10:00:00.000Z');
//     vi.useRealTimers();
//   });

// ───────────────────────────────────────────────────────────────
// 7. LIFECYCLE HOOKS — beforeEach / afterEach / beforeAll / afterAll
// ───────────────────────────────────────────────────────────────
//
// beforeEach(fn)   — runs before EACH test in the describe block
// afterEach(fn)    — runs after EACH test in the describe block
// beforeAll(fn)    — runs ONCE before all tests in the describe block
// afterAll(fn)     — runs ONCE after all tests in the describe block
//
// SCOPE: Hooks apply to the describe block they're in + all nested blocks.
//
// WHEN TO USE EACH:
//
//  beforeEach: reset mocks, re-render components, set up fresh state
//              Use this most — each test should start clean.
//
//  afterEach:  cleanup subscriptions, timers, DOM changes
//              if you modified global state, restore it here.
//
//  beforeAll:  expensive one-time setup (DB connection, server start)
//              Risky: if it mutates shared state, tests can bleed into each other.
//
//  afterAll:   close connections, stop servers
//
// EXAMPLE PATTERN:
//
//   describe('UserService', () => {
//     let mockFetch: ReturnType<typeof vi.fn>;
//
//     beforeEach(() => {
//       mockFetch = vi.fn();
//       vi.spyOn(global, 'fetch').mockImplementation(mockFetch);
//     });
//
//     afterEach(() => {
//       vi.restoreAllMocks();   // put real fetch back
//     });
//
//     it('fetches a user by id', async () => {
//       mockFetch.mockResolvedValue({ ok: true, json: () => ({ id: 1, name: 'Alice' }) });
//       const user = await fetchUser(1);
//       expect(user.name).toBe('Alice');
//     });
//
//     it('throws on network error', async () => {
//       mockFetch.mockRejectedValue(new Error('Network error'));
//       await expect(fetchUser(1)).rejects.toThrow('Network error');
//     });
//   });
//
// SHORTCUT GLOBALS (from vite.config.ts globals:true):
//   vi.clearAllMocks()    — call in afterEach to reset mock.calls
//   vi.resetAllMocks()    — call in afterEach to also reset implementations
//   vi.restoreAllMocks()  — call in afterEach to restore vi.spyOn() originals

// ───────────────────────────────────────────────────────────────
// 8. COVERAGE — what it is and what it isn't
// ───────────────────────────────────────────────────────────────
//
// Run: npm run test:coverage
// Output: text table in terminal + HTML report in coverage/
//
// COVERAGE TYPES:
//
//  Statements     % of individual statements executed
//  Branches       % of if/else/ternary branches taken
//  Functions      % of functions called
//  Lines          % of source lines executed
//
// WHAT 100% COVERAGE DOES NOT MEAN:
//  - It does NOT mean your code is bug-free
//  - It does NOT mean your tests are meaningful
//  - A test that calls a function but asserts nothing gives 100% coverage
//
// WHAT COVERAGE IS GOOD FOR:
//  - Finding UNTESTED paths (functions you forgot to test)
//  - Highlighting dead code
//  - As a CI gate: "fail if coverage drops below 80%"
//
// CONFIGURING THRESHOLDS (in vite.config.ts):
//
//   coverage: {
//     provider: 'v8',
//     thresholds: { statements: 80, branches: 75, functions: 85, lines: 80 }
//   }
//
// SKIPPING COVERAGE FOR SPECIFIC CODE:
//   /* v8 ignore next */       — skip the next line
//   /* v8 ignore start */
//   // code to skip
//   /* v8 ignore stop */

// ───────────────────────────────────────────────────────────────
// 9. FIXTURE FACTORY PATTERN
// ───────────────────────────────────────────────────────────────
//
// A fixture factory creates test data with sensible defaults,
// overridable per test. This avoids repeating data setup in every test.
//
// The existing tests use this pattern in day31-unit/calculations.test.ts:
//   const makeItem = (id, price, quantity) => ({ id, name: `Item ${id}`, price, quantity })
//
// More robust pattern with full defaults:

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

function makeCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 'item-1',
    name: 'Test Item',
    price: 10,
    quantity: 1,
    ...overrides,
  };
}

// Usage in tests:
//   const item = makeCartItem({ price: 25, quantity: 3 })
//   → { id: 'item-1', name: 'Test Item', price: 25, quantity: 3 }
//
// For nested objects:
function makeUser(overrides: Partial<{ id: number; name: string; email: string; role: string }> = {}) {
  return {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
    role: 'user',
    ...overrides,
  };
}

// ───────────────────────────────────────────────────────────────
// 10. COMMON GOTCHAS & HOW TO AVOID THEM
// ───────────────────────────────────────────────────────────────
//
// GOTCHA 1: Testing implementation, not behavior
//   ❌ expect(component.state.count).toBe(1)
//   ✅ expect(screen.getByText('Count: 1')).toBeInTheDocument()
//   Why: Implementation can change; behavior should stay stable.
//
// GOTCHA 2: Async test without await
//   ❌ it('fetches user', () => {            // WRONG — async not awaited
//        const user = fetchUser(1);          // returns Promise, not user
//        expect(user.name).toBe('Alice');    // user is a Promise object!
//      });
//   ✅ it('fetches user', async () => {
//        const user = await fetchUser(1);
//        expect(user.name).toBe('Alice');
//      });
//
// GOTCHA 3: Forgetting to mock timers off
//   If you call vi.useFakeTimers() in one test and forget vi.useRealTimers()
//   in cleanup, the NEXT test runs with fake timers and breaks mysteriously.
//   Fix: always pair them in beforeEach/afterEach.
//
// GOTCHA 4: toBe vs toEqual for objects
//   const a = { x: 1 };
//   const b = { x: 1 };
//   expect(a).toBe(b)      // ❌ FAILS — different references
//   expect(a).toEqual(b)   // ✅ PASSES — same shape
//
// GOTCHA 5: Floating-point with toBe
//   expect(0.1 + 0.2).toBe(0.3)         // ❌ FAILS — 0.30000000000000004
//   expect(0.1 + 0.2).toBeCloseTo(0.3)  // ✅ PASSES
//
// GOTCHA 6: Not resetting mocks between tests
//   If test A sets mockFn.mockReturnValue(42) and test B doesn't reset it,
//   test B also gets 42. Use beforeEach(() => vi.clearAllMocks()).
//
// GOTCHA 7: Testing private implementation
//   Don't test internal helpers that aren't exported. Only test the public API.
//   If an internal function is complex enough to need testing, extract it.
//
// GOTCHA 8: Snapshot over-use
//   Snapshots break on ANY UI change and require manual review.
//   Use targeted assertions instead: expect(el.textContent).toContain('...')
//   Only use snapshots for things that genuinely shouldn't change (e.g. serialized tokens).

// ───────────────────────────────────────────────────────────────
// PRACTICE EXERCISES
// ───────────────────────────────────────────────────────────────
//
// These map to src/utils/calculations.ts — the functions are already written.
// Your job: understand why each test is written this way.
//
// EXERCISE 1: What matcher should you use and why?
//
//   a) Testing that calculateCartTotal([]) returns 0
//      Answer: toBe(0) — exact primitive equality
//
//   b) Testing that calculateCartTotal returns the correct sum with decimals
//      Answer: toBeCloseTo(total) — floating-point safe
//
//   c) Testing that applyDiscount(-1) throws
//      Answer: expect(() => applyDiscount(100, -1)).toThrow('...')
//             ↑ must wrap in arrow function
//
//   d) Testing that paginate returns data as an array
//      Answer: toEqual([...]) — deep array comparison
//
//   e) Testing that paginate result contains a specific item
//      Answer: expect(result.data).toContainEqual({ id: 1, name: 'Alice' })
//
// EXERCISE 2: Write a fixture factory for a paginate test
//
//   // Expected solution:
function makePaginateDataset(length: number = 10): number[] {
  return Array.from({ length }, (_, i) => i + 1);
}
//   // Usage: const items = makePaginateDataset(20)
//   //        const result = paginate(items, 2, 5)
//
// EXERCISE 3: What's wrong with this test?
//
//   it('calls the callback', () => {
//     const callback = () => true;
//     someFunction(callback);
//     expect(callback).toHaveBeenCalled();  // ❌ ERROR: callback is not a mock!
//   });
//
//   Fix: const callback = vi.fn()
//         ↑ now .toHaveBeenCalled() works
//
// EXERCISE 4: Test the validators
//
//   import { validateEmail, validatePassword } from '@/utils/validators'
//
//   describe('validateEmail', () => {
//     it('returns valid:true for a correct email', () => {
//       expect(validateEmail('user@example.com')).toEqual({ valid: true });
//     });
//
//     it('returns valid:false and an error message for missing @', () => {
//       expect(validateEmail('notanemail')).toEqual({
//         valid: false,
//         error: 'Invalid email format',
//       });
//     });
//
//     it('returns valid:false for empty string', () => {
//       const result = validateEmail('');
//       expect(result.valid).toBe(false);
//       expect(result.error).toBeDefined();
//     });
//   });
//
// EXERCISE 5: Mock a timer (describe the pattern)
//
//   describe('someDebounced function', () => {
//     beforeEach(() => vi.useFakeTimers());
//     afterEach(() => vi.useRealTimers());
//
//     it('fires after the delay', () => {
//       const cb = vi.fn();
//       const debounced = createDebounce(cb, 500);
//       debounced();
//       expect(cb).not.toHaveBeenCalled();  // not yet
//       vi.advanceTimersByTime(500);
//       expect(cb).toHaveBeenCalledTimes(1); // now
//     });
//
//     it('fires only once when called multiple times within the delay', () => {
//       const cb = vi.fn();
//       const debounced = createDebounce(cb, 500);
//       debounced(); debounced(); debounced(); // rapid calls
//       vi.advanceTimersByTime(500);
//       expect(cb).toHaveBeenCalledTimes(1); // only once!
//     });
//   });

// ───────────────────────────────────────────────────────────────
// LIVE DEMO — run with: npx ts-node basics/testing/01-unit-testing.ts
// (No Vitest runtime needed — uses plain JS to illustrate concepts)
// ───────────────────────────────────────────────────────────────

// Demonstrate the matcher rules and fixture factory in plain TS:
function runDemo(): void {
  console.log('\n═══ 01-unit-testing.ts DEMO ═══\n');

  // 1. toBe vs toEqual
  const a = { x: 1 };
  const b = { x: 1 };
  console.log('Same reference (===)?', a === b); // false — toBe would fail
  console.log('Same shape?', JSON.stringify(a) === JSON.stringify(b)); // true — toEqual passes

  // 2. Floating-point issue
  const sum = 0.1 + 0.2;
  console.log('\n0.1 + 0.2 =', sum); // 0.30000000000000004
  console.log('=== 0.3?', sum === 0.3); // false — toBe fails
  console.log('≈ 0.3 (2 decimal places)?', Math.abs(sum - 0.3) < 0.005); // true — toBeCloseTo passes

  // 3. Fixture factory usage
  const item1 = makeCartItem();
  const item2 = makeCartItem({ price: 50, quantity: 2 });
  console.log('\nDefault item:', item1);
  console.log('Custom item:', item2);

  // 4. Mock call tracking (conceptual — vi.fn() would do this automatically)
  const calls: unknown[][] = [];
  const tracked = (...args: unknown[]) => { calls.push(args); return 'result'; };
  tracked('Alice', 42);
  tracked('Bob');
  console.log('\nMock call tracking:');
  console.log('calls:', calls);           // [['Alice', 42], ['Bob']]
  console.log('call count:', calls.length); // 2
  console.log('first call args:', calls[0]); // ['Alice', 42]

  // 5. Paginate dataset factory
  const dataset = makePaginateDataset(10);
  console.log('\nPaginate dataset:', dataset); // [1, 2, 3, ..., 10]

  // 6. validateEmail (from actual source)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const testEmails = ['user@example.com', 'notanemail', '', 'a@b.c'];
  console.log('\nEmail validation results:');
  testEmails.forEach(email => {
    const valid = email && emailRegex.test(email);
    console.log(`  "${email}" → ${valid ? '✅ valid' : '❌ invalid'}`);
  });

  console.log('\n═══ End of demo — real tests are in src/__tests__/day31-unit/ ═══\n');
}

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export {
  makeCartItem,
  makeUser,
  makePaginateDataset,
  demonstrateMockFn,
  runDemo,
};

export default runDemo;
