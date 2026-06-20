# Day 33 Assessment — Hook Testing · MSW API Mocking · Async Patterns

**Theme:** You are testing a data-heavy React app that talks to 5 API endpoints. The backend team keeps breaking things. Your tests need to work regardless of backend availability and catch regressions before they reach production.

---

### Q1 — MSW Basics ⭐

**Scenario:** A teammate suggests mocking `fetch` directly with `vi.mock('node-fetch', ...)`. You want to explain why Mock Service Worker is a better approach.

**Task:** Explain what MSW intercepts and why it is superior to mocking `fetch` directly. Describe how `handlers.ts` and `server.ts` work together.

**Acceptance Criteria:**
- [ ] MSW intercepts requests at the network level using a Service Worker (browser) or Node.js `http` module interceptor — the fetch call in your code runs normally; MSW intercepts the outgoing HTTP request before it leaves the process
- [ ] Mocking `fetch` directly (`vi.mock('node-fetch')`) replaces the function itself — all code that calls `fetch` must know about and accommodate the mock; changes to the fetch call signature break the mock
- [ ] MSW advantage: the request goes through the full fetch call chain — headers are set, body is serialized, URL is constructed — catching bugs that a fetch mock would silently skip
- [ ] `handlers.ts`: defines the intercept rules — `http.get('/api/users', () => HttpResponse.json([...]))` — each handler matches a URL pattern and HTTP method and returns a mocked response
- [ ] `server.ts`: creates the MSW server for Node — `const server = setupServer(...handlers)` — imports all handlers and exports the server instance
- [ ] Test setup: `beforeAll(() => server.listen())` starts interception, `afterEach(() => server.resetHandlers())` removes per-test overrides, `afterAll(() => server.close())` stops MSW after all tests
- [ ] The same `handlers.ts` can be used in both the Node test environment and the browser dev environment — write once, mock everywhere

---

### Q2 — `renderHook` + `act` ⭐

**Scenario:** A `renderHook` test calls `result.current.fetchData()` and immediately asserts the resolved data. The assertion fails because the assertion runs before the async state update completes.

**Task:** Explain what `act` does and when you need to wrap code in `act` vs `waitFor`.

**Acceptance Criteria:**
- [ ] `act` flushes all pending React state updates, effects, and the microtask queue — after `act` completes, the component tree reflects all state changes triggered inside the `act` callback
- [ ] Synchronous state updates (like calling a setState directly): wrap in `act(() => { result.current.increment() })` — synchronous, no await needed
- [ ] Async state updates (after a fetch, timer, or Promise): wrap in `await act(async () => { await result.current.fetchData() })` — flushes the async work and all resulting state updates
- [ ] `waitFor` is the alternative for assertions: instead of wrapping the action, wrap the assertion — `await waitFor(() => expect(result.current.data).toBeDefined())` — keeps retrying until the assertion passes
- [ ] `waitFor` is preferred for async components because it retries; `act(async)` runs once — if the state update is delayed by more than one microtask cycle, `act(async)` may complete before all updates settle
- [ ] Testing Library's `renderHook` wraps all user actions in `act` automatically — but manual state-triggering calls (like calling `result.current.someFunction()`) still need explicit `act` wrapping

---

### Q3 — MSW Lifecycle Hooks Pattern ⭐

**Scenario:** A test suite for the `useTransactions` hook has 8 tests. After test 3 overrides the handler to return a 404, test 4 still gets the 404 response even though its handler should return 200. The fix is `resetHandlers()` — but where to put it.

**Task:** Explain the correct placement of `server.listen()`, `server.resetHandlers()`, and `server.close()`. Explain why `resetHandlers()` belongs in `afterEach` not `afterAll`.

**Acceptance Criteria:**
- [ ] `server.listen()` in `beforeAll`: starts the MSW interceptor once before the test suite runs — starting it in `beforeEach` is wasteful and can cause port conflicts
- [ ] `server.resetHandlers()` in `afterEach`: removes all handlers added with `server.use()` inside individual tests — restores the server to the global handlers defined in `handlers.ts`
- [ ] `server.close()` in `afterAll`: stops the MSW interceptor after all tests in the file complete — prevents the interceptor from running in subsequent test files
- [ ] Why `afterEach` not `afterAll` for reset: if `resetHandlers()` is in `afterAll`, every test after a `server.use()` override shares the modified handler state — test 4 uses test 3's 404 handler because the reset has not run yet
- [ ] Why `afterEach` instead of a manual call inside each test: it is easy to forget the manual call; `afterEach` runs even when the test throws, ensuring cleanup happens regardless
- [ ] Notes that `server.listen({ onUnhandledRequest: 'error' })` is a useful option — it throws an error for any request that has no matching handler, catching cases where the code makes unexpected API calls

---

### Q4 — Testing Loading States ⭐

**Scenario:** The `useTransactions` hook returns `{ loading: true, data: null }` initially. A test only asserts the final data and never checks the loading state — the loading spinner is broken in production and no test catches it.

**Task:** Show how to assert the loading state of `useFetch` before the MSW response resolves. Explain what to assert and how to time the assertion.

**Acceptance Criteria:**
- [ ] Renders the component with a loading indicator: `render(<TransactionList />)` — the component should render `<div data-testid="loading">Loading…</div>` while the hook is in loading state
- [ ] The loading assertion runs synchronously after render, before any async resolution: `expect(screen.getByTestId('loading')).toBeInTheDocument()` — no `await` needed because loading is the initial state
- [ ] MSW does not respond instantly in the default setup — it resolves in the next event loop tick, giving the test a window to assert the loading state
- [ ] After asserting loading, waits for the data: `await screen.findByText('Transaction #1234')` — confirms the loading state transitions to the data state
- [ ] Asserts loading indicator is gone: `expect(screen.queryByTestId('loading')).not.toBeInTheDocument()` — confirms the hook correctly sets `loading: false` after the response arrives
- [ ] Notes that if the MSW handler adds an artificial delay, the loading window is longer and easier to reliably assert — `async () => { await delay(100); return HttpResponse.json([...]) }`

---

### Q5 — Per-Test Handler Overrides ⭐⭐

**Scenario:** The global handler for `/api/payments` returns 200. One test needs to verify that the UI shows an error banner when the server returns 500. The 500 must only affect this one test.

**Task:** Show how to use `server.use()` inside a single test for a per-test handler override. Confirm the global handler is restored for the next test.

**Acceptance Criteria:**
- [ ] Inside the specific test: `server.use(http.get('/api/payments', () => HttpResponse.json({ error: 'Server Error' }, { status: 500 })))` — this handler takes priority over the global handler for the duration of this test
- [ ] The `afterEach(() => server.resetHandlers())` in the test file's setup removes this override after the test completes
- [ ] Asserts the error banner: `await screen.findByText('Something went wrong. Try again.')` — the error UI responds to the 500 response
- [ ] Next test uses the global handler: the following test calls the same endpoint and gets the 200 response — confirms `resetHandlers()` removed the override cleanly
- [ ] Notes that `server.use()` prepends the handler — it runs before the global handlers, giving it priority without removing the fallback
- [ ] For a completely different response body (not just status), override the entire handler — changing `status` alone is done with `HttpResponse.json(body, { status: 500 })`

---

### Q6 — Network Failure vs Server Error ⭐⭐

**Scenario:** The payment hook has separate handling for network failures (no response at all) and server errors (a response with `status: 500`). A test uses `HttpResponse.json({}, { status: 500 })` for both cases. The network failure path is never exercised.

**Task:** Explain the difference between `HttpResponse.error()` and `HttpResponse.json({...}, { status: 500 })`. Show when to use each.

**Acceptance Criteria:**
- [ ] `HttpResponse.error()`: simulates a network-level failure — no HTTP response is returned; the `fetch` Promise rejects with a `TypeError: Failed to fetch` — equivalent to the server being unreachable or DNS failing
- [ ] `HttpResponse.json({}, { status: 500 })`: simulates a server error response — `fetch` resolves (the Promise does not reject); the response has `ok: false` and `status: 500`; the body is a valid JSON object
- [ ] The payment hook must handle both: a `.catch()` or try/catch for network failures (rejected Promise), and a status check (`if (!response.ok)`) for server errors (resolved Promise with bad status)
- [ ] Test for network failure: `server.use(http.post('/api/payments', () => HttpResponse.error()))` — asserts the hook sets `networkError: true` and shows "Check your connection" UI
- [ ] Test for server error: `server.use(http.post('/api/payments', () => HttpResponse.json({ code: 'PAYMENT_FAILED' }, { status: 500 })))` — asserts the hook sets `serverError: true` and shows "Payment could not be processed" UI
- [ ] Common mistake: only testing one of the two paths — a hook that swallows network errors while handling server errors appears to work in tests but fails when the server is down in production

---

### Q7 — Testing `useDebounce` with Fake Timers ⭐⭐

**Scenario:** The `useDebounce` hook delays propagating a value until 400ms after the last change. A test that uses real timers takes 400ms per assertion. With 20 test cases, that is 8 seconds of waiting.

**Task:** Use fake timers with `renderHook` to test `useDebounce`. Show why `act(vi.advanceTimersByTime)` is needed to flush the setState that fires when the timer expires.

**Acceptance Criteria:**
- [ ] Sets up fake timers: `vi.useFakeTimers()` in `beforeEach`, `vi.useRealTimers()` in `afterEach`
- [ ] Renders the hook: `const { result, rerender } = renderHook(({ value }) => useDebounce(value, 400), { initialProps: { value: 'a' } })`
- [ ] Initial value is propagated immediately: `expect(result.current).toBe('a')`
- [ ] Changes the input: `rerender({ value: 'ab' })` — the debounced value should still be `'a'` because 400ms has not passed
- [ ] Asserts debounce delay: `expect(result.current).toBe('a')` — immediately after `rerender`, the value has not updated
- [ ] Advances time and flushes state: `act(() => { vi.advanceTimersByTime(400) })` — `act` is necessary here because `advanceTimersByTime` triggers the `setTimeout` callback which calls `setState`; without `act`, React batches the update and `result.current` does not reflect the new value yet
- [ ] Asserts the debounced value updated: `expect(result.current).toBe('ab')`

---

### Q8 — Testing `useLocalStorage` ⭐⭐

**Scenario:** The `useLocalStorage` hook persists and retrieves values from `localStorage`. Tests must be isolated — state from one test must not bleed into the next. You also need to test what happens when `localStorage` throws a quota exceeded error.

**Task:** Test persistence, item removal, and the `localStorage.setItem` throwing scenario. Show how to reset localStorage between tests.

**Acceptance Criteria:**
- [ ] Resets localStorage in `afterEach`: `localStorage.clear()` — ensures each test starts with an empty store; alternatively `vi.stubGlobal('localStorage', createLocalStorageMock())` for a fresh mock each time
- [ ] Persistence test: `const { result } = renderHook(() => useLocalStorage('key', 'default'))` — calls `act(() => result.current[1]('new-value'))` — asserts `localStorage.getItem('key')` equals `'"new-value"'` (JSON-stringified)
- [ ] Retrieval test: `localStorage.setItem('key', JSON.stringify('stored'))` before rendering — renders the hook and asserts `result.current[0]` is `'stored'`
- [ ] Remove test: calls `act(() => result.current[2]())` (the remove function) — asserts `localStorage.getItem('key')` is `null`
- [ ] Quota exceeded test: `vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => { throw new DOMException('QuotaExceededError') })` — asserts the hook catches the error and calls `onError` callback or falls back gracefully without crashing
- [ ] Notes that `localStorage` is synchronous so no `await` or `waitFor` is needed — all assertions can run synchronously after `act`

---

### Q9 — `waitFor` Options ⭐⭐

**Scenario:** A test for the `useTransactions` hook sometimes fails in CI with "Timed out in waitFor after 1000ms". Locally it always passes because the developer's machine is fast. The issue is the default 1000ms timeout is too short for the CI server.

**Task:** Describe the `timeout`, `interval`, and `onTimeout` options for `waitFor`. Explain when to increase the timeout vs fix the underlying performance issue.

**Acceptance Criteria:**
- [ ] `timeout` (default 1000ms): the maximum time `waitFor` will retry before failing — `await waitFor(() => expect(...), { timeout: 3000 })` waits up to 3 seconds
- [ ] `interval` (default 50ms): how often `waitFor` re-runs the assertion callback — reducing it catches fast-resolving async operations sooner; increasing it reduces CPU in long-waiting assertions
- [ ] `onTimeout` callback: called with the last error when the timeout expires — use to log debugging information: `onTimeout: (error) => { screen.debug(); return error }`
- [ ] When to increase timeout: the operation legitimately takes longer in CI (larger dataset, slower CPU, cold module cache) — increase `timeout` to accommodate the environment
- [ ] When not to increase timeout: the assertion is failing because of a real bug (the state never updates) — increasing timeout just makes the test wait longer before failing; it does not fix the root cause
- [ ] Guideline: if a test consistently passes locally and consistently fails in CI, the timeout is the right knob; if it fails in both, the underlying code or assertion is wrong

---

### Q10 — Handler Isolation ⭐⭐

**Scenario:** Test A calls `server.use(http.get('/api/users', () => HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })))` and forgets to reset. Test B runs next and also calls `/api/users` — it gets the 401 response from Test A's override and fails for the wrong reason.

**Task:** Explain whether a `server.use()` call inside one test affects the next test. Explain exactly why `resetHandlers()` is essential for test isolation.

**Acceptance Criteria:**
- [ ] Yes, a `server.use()` call inside one test persists to subsequent tests unless explicitly removed — MSW's handler list is stateful and shared across all tests in the file
- [ ] `server.resetHandlers()` removes all handlers added via `server.use()` during tests — it does not remove the global handlers defined at server creation in `setupServer(...handlers)`
- [ ] Without `afterEach(() => server.resetHandlers())`: the handler list grows with every `server.use()` call — each subsequent test may match an override from a previous test
- [ ] Handler matching order: `server.use()` prepends handlers — the most recently added handler matches first; after `resetHandlers()`, only the baseline handlers remain
- [ ] The reset happens in `afterEach` not inside the test: if the test throws before manually calling `resetHandlers()`, the cleanup is skipped; `afterEach` always runs, even after test failures
- [ ] Alternative: `server.use()` with a one-time handler: `http.get('/api/users', () => ..., { once: true })` — the handler removes itself after one match; useful when only one request needs to be overridden

---

### Q11 — MSW Browser vs Node ⭐⭐

**Scenario:** A new hire copies the test setup's `setupServer` into the Vite dev environment config. The browser console shows an error and MSW does not intercept any requests.

**Task:** Explain the difference between `setupWorker` (browser) and `setupServer` (Node). Explain why they exist separately and how they are wired up.

**Acceptance Criteria:**
- [ ] `setupServer` (from `msw/node`): uses Node.js `http` module interceptors — intercepts requests made by Node's native `http`/`https` modules and `fetch` (Node 18+) — used in Vitest, Jest, and any Node test runner
- [ ] `setupWorker` (from `msw/browser`): registers a Service Worker in the browser — the Service Worker intercepts outgoing fetch and XHR requests via the browser's Fetch API — used in the Vite dev environment for frontend development without a real backend
- [ ] They cannot be swapped: a Service Worker cannot run in Node; `http` module interception does not work in a browser — they use completely different interception mechanisms
- [ ] Browser setup: `src/mocks/browser.ts` calls `setupWorker(...handlers)` and `worker.start()` — `start()` registers the Service Worker; must be called before any API calls are made
- [ ] Node setup: `src/mocks/server.ts` calls `setupServer(...handlers)` — imported in `vitest.setup.ts` and called in `beforeAll`
- [ ] Shared handlers: both `setupWorker` and `setupServer` import the same `handlers.ts` — write the handler once, use it in both environments

---

### Q12 — Testing Race Conditions ⭐⭐⭐

**Scenario:** A search input triggers a fetch on every keystroke. The user types "pay" quickly, sending three requests: `/api/search?q=p`, `/api/search?q=pa`, `/api/search?q=pay`. The server responds to the first request last. Without cancellation, the UI shows results for "p" instead of "pay".

**Task:** Describe how to test that the `useSearch` hook correctly cancels stale requests using `AbortController`. Show the MSW handler that checks for the abort signal.

**Acceptance Criteria:**
- [ ] The hook implementation: each new call to the search function creates a new `AbortController`, passes `signal` to `fetch`, and calls `abort()` on the previous controller before starting the new request
- [ ] MSW handler that respects abort: `http.get('/api/search', async ({ request }) => { await delay(100); if (request.signal.aborted) return HttpResponse.error(); return HttpResponse.json([...]) })`
- [ ] Test setup: `vi.useFakeTimers()` — control the timing of the abort
- [ ] Test flow: renders `useSearch`, triggers three rapid searches, advances timers — only the last search's results should be committed to state
- [ ] Assert: `expect(result.current.results).toMatchObject({ query: 'pay', items: [...] })` — the intermediate results for "p" and "pa" are not shown
- [ ] Alternative assertion: spy on `AbortController.prototype.abort` — assert it was called twice (once per stale request): `expect(abortSpy).toHaveBeenCalledTimes(2)`
- [ ] Notes that this test validates both the hook logic (calls abort) and the fetch behavior (stops sending the stale request) — a unit test for the hook alone cannot catch a missing `signal` prop being passed to `fetch`

---

### Q13 — Testing Retry Logic ⭐⭐⭐

**Scenario:** The `usePayment` hook retries failed requests up to 3 times with exponential backoff: 1s, 2s, 4s. A test that uses real timers takes 7 seconds. You need to test all retry paths without waiting.

**Task:** Design a test using fake timers and `server.use()` overrides to test: first request fails, second fails, third succeeds. Assert the correct number of attempts and the final successful state.

**Acceptance Criteria:**
- [ ] Sets up fake timers: `vi.useFakeTimers()` in `beforeEach`
- [ ] Uses a request counter to control responses: `let attempts = 0` — MSW handler increments the counter and returns 500 for the first two, 200 for the third
- [ ] MSW handler: `http.post('/api/payment', () => { attempts++; if (attempts < 3) return HttpResponse.json({ error: 'fail' }, { status: 500 }); return HttpResponse.json({ status: 'ok' }) })`
- [ ] Advances timers for each retry delay: `await act(async () => { vi.advanceTimersByTime(1000) })` for the first retry, then `vi.advanceTimersByTime(2000)` for the second — matches the exponential backoff schedule
- [ ] Asserts attempt count: `expect(attempts).toBe(3)` after the final advance
- [ ] Asserts success state: `await waitFor(() => expect(result.current.status).toBe('success'))`
- [ ] Tests the abort path: adds a fourth test where all three attempts fail — asserts `result.current.status` is `'error'` and `result.current.attempts` is 3

---

### Q14 — Realistic API Latency ⭐⭐⭐

**Scenario:** The `useTransactions` hook shows a loading skeleton while the API is in flight. In tests, MSW responds instantly — the loading state appears for less than one event loop tick and is impossible to assert reliably. You need a way to add a controlled delay.

**Task:** Show how to add a 200ms delay to an MSW handler. Explain when to use this technique and how to use fake timers to make the test fast despite the delay.

**Acceptance Criteria:**
- [ ] MSW delay in the handler: `http.get('/api/transactions', async () => { await delay(200); return HttpResponse.json(transactions) })` — `delay` is imported from `msw` and returns a Promise that resolves after the specified milliseconds
- [ ] With real timers, this test now takes 200ms — acceptable for a single test, but 50 such tests = 10 seconds
- [ ] With fake timers: render the component, assert loading state is present, then advance timers: `act(() => { vi.advanceTimersByTime(200) })` — the MSW `delay(200)` resolves, the response is returned, and state updates
- [ ] Assert data state: `await screen.findByText('Transaction #1234')` — the loading skeleton is gone and the data is shown
- [ ] Use case: loading skeleton tests, skeleton-to-content transition animations, progress indicators, timeout UI (show "this is taking longer than expected" after 5s)
- [ ] Alternative without fake timers: `delay(0)` defers the response by one event loop tick — sufficient to reliably assert the initial loading state without a multi-hundred-millisecond wait

---

### Q15 — Testing Optimistic Updates ⭐⭐⭐

**Scenario:** The `useDeleteTransaction` hook deletes a transaction optimistically — removes it from the UI immediately and rolls back if the API returns an error. You must test both the success path and the rollback path.

**Task:** Write tests for the success path (item removed, API confirms) and the rollback path (item removed, API fails, item reappears). Use MSW for API control.

**Acceptance Criteria:**
- [ ] Setup: renders `<TransactionList />` with 3 transactions pre-loaded in the MSW handler or `queryClient.setQueryData`
- [ ] Success path: user clicks delete on transaction #2 — immediately assert `queryByText('Transaction #2')` is `null` (optimistic removal) — `await waitFor(...)` confirms MSW received the DELETE request — asserts the list still shows only #1 and #3 after the API confirms
- [ ] Rollback path: overrides the DELETE handler with `HttpResponse.json({ error: 'Not found' }, { status: 404 })` — clicks delete on transaction #2 — asserts #2 is initially removed (optimistic) — `await waitFor(...)` after MSW responds — asserts #2 reappears in the list (rollback)
- [ ] Rollback error message: asserts a toast or error banner appears after the rollback — `await screen.findByText('Could not delete transaction. Please try again.')`
- [ ] React Query integration: if using React Query `useMutation`, uses `onMutate` to snapshot and remove, `onError` to restore from snapshot — the test indirectly verifies this by observing UI behavior, not internal React Query state
- [ ] Notes the testing order matters: assert optimistic state synchronously after the user action (no `await`), then assert the final state asynchronously (with `await waitFor` or `findBy`) — the two assertions capture both phases of the optimistic update lifecycle
