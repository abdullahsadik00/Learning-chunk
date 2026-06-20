# Day 31 Assessment — Unit Testing · Vitest · Mocking · Fake Timers

**Theme:** You are joining a fintech startup as the first dedicated QA engineer. The codebase has zero test coverage. Your first job: write unit tests for all utility functions and prove they work before the audit next week.

---

### Q1 — Vitest Structure ⭐

**Scenario:** A colleague who has never written tests asks you to explain the basic building blocks before they write their first test file.

**Task:** Explain what `describe`, `it`, and `expect` do. Clarify when to use `it` vs `test`. Describe what each lifecycle hook (`beforeEach`, `afterEach`, `beforeAll`, `afterAll`) does and when you would use each one.

**Acceptance Criteria:**
- [ ] `describe` groups related tests into a named block — does not run any code itself, just organizes output
- [ ] `it` (alias `test`) defines a single test case — both are identical; `it` reads more naturally as a sentence ("it should…"), `test` reads more like a declaration
- [ ] `expect` creates an assertion — takes an actual value and chains a matcher to compare it against an expected value
- [ ] `beforeEach` runs before every test in the block — used to reset state, create fresh instances, or set up fixtures
- [ ] `afterEach` runs after every test — used to clean up mocks, clear timers, or reset module state
- [ ] `beforeAll` runs once before the entire describe block starts — used for expensive setup like starting a database connection
- [ ] `afterAll` runs once after all tests in the block finish — used to close connections or release resources opened in `beforeAll`

---

### Q2 — Core Matchers ⭐

**Scenario:** You are reviewing a PR and see tests using `toBe` to compare objects. The tests pass when they should fail.

**Task:** Explain the difference between `toBe` and `toEqual`. Then explain when you would use `toContain`, `toBeNull`, `toBeTruthy`, and `toThrow`.

**Acceptance Criteria:**
- [ ] `toBe` uses `Object.is` (strict reference equality) — `expect({a:1}).toBe({a:1})` fails because they are two different objects in memory
- [ ] `toEqual` performs deep equality — recursively checks that every property and nested value matches — `expect({a:1}).toEqual({a:1})` passes
- [ ] `toContain` asserts that an array contains an item or a string contains a substring — `expect([1,2,3]).toContain(2)` passes
- [ ] `toBeNull` asserts the value is exactly `null` — stricter than `toBeFalsy` which also accepts `0`, `''`, `false`, `undefined`
- [ ] `toBeTruthy` asserts the value is truthy in a boolean context — useful when you only care that something exists, not its exact shape
- [ ] `toThrow` must receive a function reference, not a function call — `expect(() => fn()).toThrow()` is correct; `expect(fn()).toThrow()` evaluates `fn()` before the assertion runs and the error escapes

---

### Q3 — AAA Pattern ⭐

**Scenario:** A junior engineer writes a 40-line test that interleaves setup, assertions, and more setup. It fails intermittently and nobody can tell why.

**Task:** Explain the Arrange/Act/Assert pattern. Describe what each phase does and why strict separation between phases matters for test reliability and readability.

**Acceptance Criteria:**
- [ ] Arrange: set up everything the test needs — input values, mocks, initial state — before touching the system under test
- [ ] Act: call the single function or trigger the single behavior being tested — this should be one line or a tight sequence with no assertions mixed in
- [ ] Assert: verify the outcome — all `expect` calls live here, after the act is complete
- [ ] Separation prevents flaky tests: if setup bleeds into act, a failing assertion might be caused by bad setup rather than bad logic — hard to diagnose
- [ ] Separation improves readability: a reader can scan the test and immediately understand what is given, what happens, and what is expected — no need to trace execution order
- [ ] One act per test: testing multiple behaviors in one test makes it impossible to know which behavior caused a failure — each `it` block should have one clear act

---

### Q4 — Testing Edge Cases ⭐

**Scenario:** The team ships a `formatCurrency` function and only tests `formatCurrency(100)` → `"$100.00"`. Three weeks later, a bug report arrives: the UI shows `"$NaN"` for certain user inputs.

**Task:** For each of `formatCurrency(-1)`, `formatCurrency(0)`, `formatCurrency(Infinity)`, and `formatCurrency(NaN)`, state what the function should return and why testing each edge case matters.

**Acceptance Criteria:**
- [ ] `formatCurrency(-1)` → should return `"-$1.00"` or throw a validation error depending on business rules — negative amounts appear in refund flows; untested, they silently show garbled output
- [ ] `formatCurrency(0)` → should return `"$0.00"` — zero is a valid balance; an untested zero might return an empty string or `"$"` which breaks the UI
- [ ] `formatCurrency(Infinity)` → should return a fallback like `"N/A"` or throw — `Infinity` can arrive from divide-by-zero; `Intl.NumberFormat` renders it as `"∞"` which confuses users
- [ ] `formatCurrency(NaN)` → should return a fallback like `"—"` or throw — `NaN` propagates silently through arithmetic; without a guard, the UI shows `"$NaN"` as seen in the bug report
- [ ] Edge cases reveal the gap between "works in the demo" and "works in production" — real data is messy and input validation alone is not sufficient
- [ ] A test for each edge case documents the intended contract — future refactors that accidentally break a case will fail immediately in CI

---

### Q5 — `vi.fn()` and Mock Assertions ⭐⭐

**Scenario:** The `processPayment` function accepts an `onSuccess` callback. You need to verify it calls the callback with the correct arguments after a successful payment, and that it does not call it more than once.

**Task:** Create a mock callback using `vi.fn()`. Call `processPayment` with that mock. Assert that the mock was called with the expected arguments and exactly once.

**Acceptance Criteria:**
- [ ] Creates the mock with `const onSuccess = vi.fn()` — no implementation needed for call-tracking purposes
- [ ] Passes the mock into the function under test: `processPayment({ amount: 100, onSuccess })`
- [ ] Asserts call count: `expect(onSuccess).toHaveBeenCalledTimes(1)`
- [ ] Asserts arguments: `expect(onSuccess).toHaveBeenCalledWith({ status: 'ok', transactionId: expect.any(String) })`
- [ ] Explains that `expect.any(String)` is used when the exact value (like a UUID) is unknown but the type must match
- [ ] Clears or resets the mock in `afterEach` with `vi.clearAllMocks()` or `onSuccess.mockClear()` to prevent call counts from bleeding into the next test
- [ ] Distinguishes `mockClear` (resets calls/results) from `mockReset` (also removes implementation) from `mockRestore` (removes spy and restores original)

---

### Q6 — `vi.mock()` Module Mocking ⭐⭐

**Scenario:** The `createTransaction` utility imports a `crypto` module to generate UUIDs. In tests, you want deterministic IDs (`"test-uuid-1"`) so assertions are predictable.

**Task:** Mock the `crypto` module using `vi.mock()`. Show the mock factory pattern. Restore the original in `afterEach`.

**Acceptance Criteria:**
- [ ] Uses `vi.mock('../crypto')` at the top level of the test file — Vitest hoists `vi.mock` calls before imports automatically
- [ ] Provides a factory function: `vi.mock('../crypto', () => ({ generateId: vi.fn(() => 'test-uuid-1') }))`
- [ ] Imports the mocked module after `vi.mock` to get a reference for assertions: `import { generateId } from '../crypto'`
- [ ] Can change the mock return value per test with `(generateId as Mock).mockReturnValueOnce('test-uuid-2')`
- [ ] Restores original behavior in `afterEach` using `vi.restoreAllMocks()` — though `vi.mock` module mocks persist for the whole file; use `vi.doMock`/`vi.unmock` for per-test module swapping
- [ ] Notes that `vi.mock` is hoisted — writing it inside a `beforeEach` does not work; it must be at the module scope

---

### Q7 — `vi.spyOn()` ⭐⭐

**Scenario:** The `validateAmount` function calls `console.warn` when it receives a negative number. You need to verify the warning is triggered without suppressing it globally.

**Task:** Use `vi.spyOn()` to spy on `console.warn`. Assert it is called with the expected message. Restore the original after the test.

**Acceptance Criteria:**
- [ ] Creates the spy: `const warnSpy = vi.spyOn(console, 'warn')`
- [ ] Optionally silences output during tests: `warnSpy.mockImplementation(() => {})` — keeps test output clean without breaking the assertion
- [ ] Calls the function: `validateAmount(-50)`
- [ ] Asserts the spy was called: `expect(warnSpy).toHaveBeenCalledWith('Amount must be positive')`
- [ ] Restores the original `console.warn` after the test: `warnSpy.mockRestore()`
- [ ] Explains the difference between `vi.spyOn` and `vi.fn()`: a spy wraps an existing function and records calls; `vi.fn()` creates a brand-new mock with no underlying implementation
- [ ] Notes that `mockRestore()` only works on spies created with `vi.spyOn` — it has no effect on plain `vi.fn()` mocks

---

### Q8 — Fake Timers and Debounce Testing ⭐⭐

**Scenario:** The `debounce` utility delays executing a function until 300ms after the last call. A test that uses `setTimeout` in production runs in real time — it makes the test suite take 300ms per test case. With 50 tests, that is 15 seconds of waiting.

**Task:** Use `vi.useFakeTimers()` and `vi.advanceTimersByTime(300)` to test the debounce function without waiting. Show the teardown.

**Acceptance Criteria:**
- [ ] Calls `vi.useFakeTimers()` in `beforeEach` — replaces `setTimeout`, `setInterval`, `Date`, and `performance.now` with controllable fakes
- [ ] Creates the debounced function: `const debounced = debounce(mockFn, 300)`
- [ ] Calls `debounced()` multiple times rapidly without the callback firing yet
- [ ] Asserts the callback has not fired: `expect(mockFn).not.toHaveBeenCalled()`
- [ ] Advances fake time: `vi.advanceTimersByTime(300)`
- [ ] Asserts the callback fired exactly once: `expect(mockFn).toHaveBeenCalledTimes(1)` — proving debounce collapsed all calls into one
- [ ] Calls `vi.useRealTimers()` in `afterEach` to restore real timers for other tests

---

### Q9 — Coverage Metrics ⭐⭐

**Scenario:** The CI pipeline reports 100% line coverage. A reviewer says: "That doesn't mean the code is fully tested — you're missing branch coverage." You need to explain the difference to the team.

**Task:** Define line coverage, branch coverage, and function coverage. Show a concrete example where 100% line coverage does not equal 100% branch coverage.

**Acceptance Criteria:**
- [ ] Line coverage: percentage of executable lines that were reached during tests — a line is "covered" if any test executed it, regardless of how
- [ ] Branch coverage: percentage of decision branches taken — an `if/else` has two branches; both must be exercised for 100% branch coverage
- [ ] Function coverage: percentage of functions that were called at least once during tests
- [ ] Concrete example: `function clamp(n, min, max) { if (n < min) return min; if (n > max) return max; return n; }` — testing only `clamp(5, 0, 10)` reaches every line (returns `n`) but never enters either `if` branch — line coverage: 100%, branch coverage: 33%
- [ ] Explains why this gap matters: the bug is almost always in an untested branch — the happy path works, the edge case fails
- [ ] Notes that branch coverage is a stronger signal than line coverage; Vitest reports both with `--coverage` using v8 or Istanbul

---

### Q10 — Test Isolation and Shared State ⭐⭐

**Scenario:** Two tests in the same file both pass individually (`vitest --run testA`, `vitest --run testB`) but when run together, the second test fails. The bug is a module-level variable that the first test mutates.

**Task:** Show the broken code with shared module-level state. Demonstrate the failure. Fix it with a `beforeEach` reset.

**Acceptance Criteria:**
- [ ] Shows the bug: a module-level `let count = 0` that `increment()` mutates — test A calls `increment()` and asserts `count === 1`, test B expects `count` to start at 0 but it is still 1 from test A
- [ ] Explains why running tests separately passes: each `vitest --run` starts a fresh module scope — the variable resets to 0
- [ ] Explains why running together fails: Vitest shares the module scope within a test file — state from test A leaks into test B
- [ ] Fix: adds `beforeEach(() => { count = 0 })` to reset the variable before every test
- [ ] Alternative fix: wraps the counter in a factory function or class so each test creates a fresh instance — preferred because it eliminates the shared reference entirely
- [ ] Notes that `vi.resetModules()` + dynamic `import()` in `beforeEach` can also reset module-level state for more complex cases

---

### Q11 — `toThrow` Patterns ⭐⭐

**Scenario:** The `withdraw` function throws different errors for different invalid inputs: a generic `Error` for negative amounts, a `TypeError` for non-numeric input, and an error with the message `"Insufficient funds"` for overdrafts. You need a test for each case.

**Task:** Show all three forms of `toThrow` and explain when each is appropriate.

**Acceptance Criteria:**
- [ ] `expect(() => withdraw(-10)).toThrow()` — asserts that any error is thrown; used when you only care that the function rejects the input, not how
- [ ] `expect(() => withdraw(9999)).toThrow('Insufficient funds')` — asserts the error message contains the specified string; used when the message is part of the user-facing contract
- [ ] `expect(() => withdraw('abc')).toThrow(TypeError)` — asserts the error is an instance of `TypeError`; used when the error type communicates the category of failure to callers
- [ ] The function under test must always be wrapped in an arrow function — `expect(withdraw(-10)).toThrow()` evaluates `withdraw(-10)` immediately, the error propagates before `expect` can catch it
- [ ] Most specific wins: if the error message and type both matter, use `expect(() => fn()).toThrow(new TypeError('Insufficient funds'))` — matches both type and message
- [ ] Notes that `toThrowError` is an alias for `toThrow` — both behave identically

---

### Q12 — TDD Cycle ⭐⭐⭐

**Scenario:** The `applyDiscount` function exists but has no validation. When passed a negative discount (`applyDiscount(100, -5)`), it silently increases the price to `$105`. The team adopts TDD to prevent this class of bug.

**Task:** Walk through the full Red → Green → Refactor cycle. Write the failing test first, implement the validation to make it pass, then refactor the implementation cleanly.

**Acceptance Criteria:**
- [ ] Red phase: writes a failing test before any implementation — `expect(() => applyDiscount(100, -5)).toThrow('Discount must be between 0 and 100')` — this test fails because the function does not yet throw
- [ ] Confirms the test is failing for the right reason — the error message is "not a function" or the function returns a value instead of throwing
- [ ] Green phase: adds the minimum code to make the test pass — `if (discount < 0 || discount > 100) throw new RangeError('Discount must be between 0 and 100')`
- [ ] Confirms all tests pass — both the new validation test and any pre-existing tests for valid inputs
- [ ] Refactor phase: cleans up without changing behavior — extracts the validation into a separate `validateDiscount` function, improves variable names, removes duplication — tests still pass after refactor
- [ ] Explains the value of writing the test first: the test defines the contract before the implementation exists — you cannot accidentally write a test that passes trivially
- [ ] Notes that the refactor step is safe because the test suite acts as a regression net

---

### Q13 — Test Doubles Taxonomy ⭐⭐⭐

**Scenario:** A new team member has heard the words "mock", "stub", and "spy" used interchangeably. Before they start writing tests for the payments module, you sit down to clarify the taxonomy.

**Task:** Define dummy, stub, spy, mock, and fake. Give a concrete example of each in a payments context.

**Acceptance Criteria:**
- [ ] Dummy: a placeholder passed to satisfy a function signature but never used — `const unusedLogger = null` passed to `new PaymentProcessor(db, unusedLogger)` when the test only exercises the DB path
- [ ] Stub: returns a pre-configured response — `const db = { findUser: () => ({ id: 1, balance: 500 }) }` — controls indirect inputs to the system under test; does not assert calls
- [ ] Spy: wraps a real object and records calls without changing behavior — `vi.spyOn(auditService, 'log')` — lets you assert that `auditService.log` was called after a payment, while still running the real implementation
- [ ] Mock: a pre-programmed object with expectations — created with `vi.fn()` and asserted with `toHaveBeenCalledWith` — both controls return values and verifies interactions
- [ ] Fake: a working implementation that is simpler than production — `class InMemoryPaymentGateway` that stores transactions in an array — used in integration tests when the real gateway is too slow or requires network access
- [ ] Key distinction: stubs control inputs, mocks verify outputs, spies observe without controlling
- [ ] Notes that Vitest's `vi.fn()` is simultaneously a stub (you can configure return values) and a mock (you can assert calls) — the taxonomy is conceptual, not always 1:1 with API methods

---

### Q14 — Parametrized Tests ⭐⭐⭐

**Scenario:** The `formatCurrency` function needs to be tested with 8 different inputs. The first draft has 8 separate `it` blocks that are 95% identical. The reviewer asks you to collapse them into a parametrized test.

**Task:** Use `it.each` with a table of `[input, expected]` pairs to test `formatCurrency` with 8 inputs without repeating the `it` block.

**Acceptance Criteria:**
- [ ] Uses `it.each` with an array of tuples: `it.each([[100, '$100.00'], [0, '$0.00'], [-1, '-$1.00'], [1000, '$1,000.00'], [0.1 + 0.2, '$0.30'], [Infinity, 'N/A'], [NaN, '—'], [1e9, '$1,000,000,000.00']])`
- [ ] Test name uses printf-style substitution: `'formatCurrency(%s) returns %s'` — each run shows the actual input and expected value in the test output
- [ ] Test body receives the tuple values as arguments: `(input, expected) => { expect(formatCurrency(input)).toBe(expected) }`
- [ ] Explains that a failing parametrized case names the input in the output — you see `formatCurrency(Infinity) returns N/A — FAIL` rather than a generic `test 7 failed`
- [ ] Notes that `it.each` also accepts a tagged template literal table for multi-column readability in large test suites
- [ ] Reduces duplication: 8 identical test structures collapse to 1 — adding a 9th case is one line in the data table, not a copy-pasted `it` block

---

### Q15 — What Not to Test ⭐⭐⭐

**Scenario:** A test file for the `ShoppingCart` class asserts the exact order of internal method calls, accesses `cart._items` directly, and breaks every time the implementation is refactored — even when behavior is unchanged. The tests are making the codebase harder to change, not easier.

**Task:** Explain why testing implementation details makes tests brittle. List three things you should never test. Rewrite one bad test as a good one.

**Acceptance Criteria:**
- [ ] Defines implementation detail: anything the consumer of the function does not observe — internal variable names, private methods, exact sequence of internal calls, intermediate state
- [ ] Three things to never test: (1) private/internal state accessed via `._property`, (2) exact call sequence of internal helper methods, (3) exact number of times an internal function calls another internal function
- [ ] Explains the brittleness: a test that asserts `cart._items.push` was called breaks the moment you refactor to use a `Set` instead of an array — the behavior is identical but the test fails
- [ ] Bad test: `expect(cart._items).toHaveLength(1)` — couples the test to the internal data structure
- [ ] Good test: `expect(cart.getItemCount()).toBe(1)` — tests the public interface; the internals can change freely as long as `getItemCount` returns the right answer
- [ ] Second example: bad test asserts `processPayment` calls `validateCard` then `chargeGateway` in that order — good test asserts the payment result is `{ status: 'success' }` and the user's balance decreased
- [ ] Heuristic: if a test breaks during refactoring that does not change behavior, the test was testing implementation details
