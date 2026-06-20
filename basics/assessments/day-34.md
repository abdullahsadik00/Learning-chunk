# Day 34 Assessment — Integration Testing · Full User Flows · React Router · React Query

**Theme:** You are the tech lead for a team shipping a new feature: user authentication with protected routes, a profile page with API data, and a logout flow. No feature ships without passing integration tests.

---

### Q1 — Integration vs Unit ⭐

**Scenario:** The team has 500 unit tests but the login flow still breaks in production because the `LoginForm` component, the `useAuth` hook, and the `AuthContext` work individually but not together. The tech lead says "we need integration tests."

**Task:** Explain the testing pyramid recommendation. Describe why integration tests catch bugs that unit tests miss.

**Acceptance Criteria:**
- [ ] Testing pyramid: many unit tests (fast, isolated, cheap) at the base → fewer integration tests (slower, cover component interactions) in the middle → fewest E2E tests (slowest, full browser) at the top
- [ ] Unit test limitation: each piece is tested in isolation with mocked dependencies — the contract between pieces (what one returns, what another expects) is never verified
- [ ] Integration test value: renders multiple real components together with real hooks and context — the interaction boundaries are tested; a mismatched prop type or wrong context value is caught
- [ ] Real-world bug example: `LoginForm` calls `onLogin(email, password)` but `useAuth.login` expects `(credentials: { email, password })` — each unit test passes because the mocks match the wrong signature; the integration test fails because the real function receives two args instead of one object
- [ ] Integration tests are slower because they: render more components, use real browser APIs (jsdom), exercise multiple layers — but they catch a class of bug that is invisible to unit tests
- [ ] Integration tests are still faster than E2E because they use jsdom (no real browser), MSW (no real network), and fake timers when needed

---

### Q2 — `MemoryRouter` ⭐

**Scenario:** An integration test uses `BrowserRouter` and fails in JSDOM with "Cannot read property 'pathname' of undefined". Switching to `MemoryRouter` fixes it. The developer wants to understand why.

**Task:** Explain why integration tests use `MemoryRouter` instead of `BrowserRouter`. Show how to set the initial route.

**Acceptance Criteria:**
- [ ] `BrowserRouter` uses the browser's `window.location` and the HTML5 History API — JSDOM does not implement the full History API; navigating via `BrowserRouter` in tests causes errors or silently does nothing
- [ ] `MemoryRouter` stores the navigation history in memory as a JavaScript array — no dependency on `window.location`; works correctly in any JavaScript environment including JSDOM and Node
- [ ] Setting initial route: `<MemoryRouter initialEntries={['/dashboard']} initialIndex={0}>` — places the router at `/dashboard` when the component mounts; useful for testing components that read `useLocation` or `useParams`
- [ ] Testing navigation: after a user action that triggers `navigate('/profile')`, assert `screen.getByRole('heading', { name: /profile/i })` is shown — MemoryRouter renders the new route without a page reload
- [ ] Testing URL parameters: `<MemoryRouter initialEntries={['/user/42']}>` — a component using `useParams()` receives `{ id: '42' }`
- [ ] Notes that `createMemoryRouter` (React Router v6.4+) is the data-router equivalent for testing routes with loaders and actions

---

### Q3 — `renderWithProviders` ⭐

**Scenario:** Every integration test imports `render` from Testing Library, then manually wraps the component in `QueryClientProvider`, `MemoryRouter`, and `AuthProvider`. The boilerplate is 15 lines per test file.

**Task:** Describe what providers a typical React app needs in integration tests. Explain why creating a custom `renderWithProviders` function is worth the upfront effort.

**Acceptance Criteria:**
- [ ] Common required providers: `QueryClientProvider` (React Query), `MemoryRouter` / `RouterProvider` (routing), `AuthContext.Provider` (auth state), theme provider if using styled-components or Chakra
- [ ] Without a utility: changing the QueryClient configuration (adding `retry: false`) requires touching every test file — one-line change, 30-file diff
- [ ] With `renderWithProviders`: configuration is centralized — change the provider setup once and all tests pick it up automatically
- [ ] Recommended signature: `renderWithProviders(ui, { route: '/', user: mockUser, ...renderOptions } = {})`
- [ ] Returns the same result as `render` plus any utilities specific to the providers: `const { result } = renderWithProviders(<ProfilePage />, { route: '/profile/1', user: mockUser })`
- [ ] Re-exports `screen`, `waitFor`, `userEvent`, and all Testing Library utilities from the same file — consumers have one import: `import { renderWithProviders, screen, waitFor } from '../test-utils'`
- [ ] Notes that Vitest's `setupFiles` can add a global `afterEach(cleanup)` so components are unmounted between tests — important when `renderWithProviders` is used in many files

---

### Q4 — `queryClient` Isolation ⭐

**Scenario:** Integration test A fetches a user profile and the data is cached in the QueryClient. Integration test B renders the same profile page — it shows the cached data from test A instead of fetching fresh data. Test B passes even with the MSW handler returning different data.

**Task:** Explain why each integration test needs a fresh `QueryClient`. Show how to configure it to prevent caching and retries in tests.

**Acceptance Criteria:**
- [ ] By default React Query caches data with a 5-minute `staleTime` — the cache persists across tests if the same `QueryClient` instance is reused
- [ ] A cached response in test A satisfies test B's query without making an MSW request — test B never exercises the API call or the loading state
- [ ] Fix: create a new `QueryClient` inside `renderWithProviders` on every call — each test gets a fresh, empty cache
- [ ] Recommended test configuration: `new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 0 } } })`
- [ ] `retry: false`: prevents React Query from retrying failed requests — a 404 response fails the test immediately without waiting for 3 retry attempts (which would add 3 seconds per failing test)
- [ ] `staleTime: 0`: treats all cached data as immediately stale — any render triggers a fresh fetch rather than serving cached data
- [ ] `gcTime: 0`: (formerly `cacheTime`) garbage-collects unused queries immediately — prevents stale data from persisting even briefly between test renders

---

### Q5 — Full Login Flow ⭐⭐

**Scenario:** The login feature is complete. The product manager wants proof that a user can log in and land on the dashboard. Write the integration test that covers the full flow end to end.

**Task:** Write a test covering: user submits login form → successful API call → redirect to `/dashboard` → dashboard shows user data.

**Acceptance Criteria:**
- [ ] MSW handler: `http.post('/api/auth/login', () => HttpResponse.json({ token: 'abc123', user: { name: 'Sadik' } }))`
- [ ] MSW handler for dashboard data: `http.get('/api/dashboard', () => HttpResponse.json({ balance: '$4,200.00' }))`
- [ ] Renders the app at the login route: `renderWithProviders(<App />, { route: '/login' })`
- [ ] Fills and submits the form: `await user.type(screen.getByRole('textbox', { name: /email/i }), 'sadik@example.com')`, `await user.type(screen.getByLabelText(/password/i), 'secret')`, `await user.click(screen.getByRole('button', { name: /sign in/i }))`
- [ ] Asserts redirect happened: `await screen.findByRole('heading', { name: /dashboard/i })` — appears after the API call and navigation complete
- [ ] Asserts user data from the dashboard API is shown: `await screen.findByText('$4,200.00')`
- [ ] Asserts the login form is no longer visible: `expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument()`

---

### Q6 — Protected Route Testing ⭐⭐

**Scenario:** `/dashboard` is a protected route — unauthenticated users are redirected to `/login`. The protection logic lives in a `ProtectedRoute` wrapper component. Both paths must be tested.

**Task:** Write two tests: (1) unauthenticated user visiting `/dashboard` is redirected to `/login`; (2) authenticated user visiting `/dashboard` sees the dashboard.

**Acceptance Criteria:**
- [ ] Unauthenticated test: `renderWithProviders(<App />, { route: '/dashboard', user: null })` — asserts `await screen.findByRole('button', { name: /sign in/i })` is present — confirms the redirect to login happened
- [ ] Unauthenticated test also asserts: `expect(screen.queryByRole('heading', { name: /dashboard/i })).not.toBeInTheDocument()` — the protected content is not shown
- [ ] Authenticated test: `renderWithProviders(<App />, { route: '/dashboard', user: { name: 'Sadik', token: 'abc123' } })` — asserts `await screen.findByRole('heading', { name: /dashboard/i })` is present
- [ ] Authenticated test also asserts: `expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument()` — the login form is not shown to authenticated users
- [ ] The `user` option on `renderWithProviders` sets the initial `AuthContext` value — the protected route reads this context to decide whether to render or redirect
- [ ] Notes that this pattern tests the integration between `ProtectedRoute`, `AuthContext`, and `MemoryRouter` — a unit test of `ProtectedRoute` alone cannot verify the redirect works with the router

---

### Q7 — React Query Cache Prefilling ⭐⭐

**Scenario:** A test for the `ProfilePage` component makes a real MSW call on every render. The call adds 100ms per test. The test only cares about the rendered output, not the fetch mechanics. You want the component to render immediately with pre-seeded data.

**Task:** Show how to prefill the React Query cache using `queryClient.setQueryData` so the component renders instantly without an API call.

**Acceptance Criteria:**
- [ ] Creates the query client in the test: `const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })`
- [ ] Prefills the cache before rendering: `queryClient.setQueryData(['user', '42'], { name: 'Sadik', email: 'sadik@example.com', role: 'admin' })`
- [ ] The key must exactly match what the component's `useQuery` uses — `['user', '42']` must match `useQuery({ queryKey: ['user', userId] })` where `userId === '42'`
- [ ] Passes the client to the provider: `renderWithProviders(<ProfilePage userId="42" />, { queryClient })` — the `renderWithProviders` utility accepts an optional pre-configured `queryClient`
- [ ] The component renders immediately without any loading state — `screen.getByText('Sadik')` is available synchronously (no `findBy` needed)
- [ ] Use case: tests for the rendered output (layout, conditional elements) where the API mechanics have already been tested separately
- [ ] Distinguishes from MSW: MSW tests the full fetch-to-render flow; cache prefilling tests only the render phase — both are needed; cache prefilling is faster but less complete

---

### Q8 — Testing Pagination ⭐⭐

**Scenario:** The `TransactionList` component shows 10 transactions per page. Users click Next and Previous to navigate. The full flow must be tested — not just rendering, but the navigation interaction and data change.

**Task:** Write a test covering: see page 1, click Next, see page 2, click Previous, see page 1 again.

**Acceptance Criteria:**
- [ ] MSW handler uses query params: `http.get('/api/transactions', ({ request }) => { const page = new URL(request.url).searchParams.get('page'); return page === '2' ? HttpResponse.json(page2Data) : HttpResponse.json(page1Data) })`
- [ ] Initial render: `renderWithProviders(<TransactionList />)` — asserts first item from page 1 is visible: `await screen.findByText('Transaction #1')`
- [ ] Click Next: `await user.click(screen.getByRole('button', { name: /next/i }))`
- [ ] Assert page 2: `await screen.findByText('Transaction #11')` — page 2 first item; asserts page 1 item is gone: `expect(screen.queryByText('Transaction #1')).not.toBeInTheDocument()`
- [ ] Click Previous: `await user.click(screen.getByRole('button', { name: /previous/i }))`
- [ ] Assert page 1 again: `await screen.findByText('Transaction #1')`
- [ ] Asserts Previous button is disabled on page 1: `expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled()` — after navigating back to page 1

---

### Q9 — Form and API Integration ⭐⭐

**Scenario:** A contact form has three fields (name, email, message). On success, it shows a confirmation and clears the form. On a 400 error with field-level validation details, it shows per-field error messages under each input.

**Task:** Write the success test and the 400 error test as separate integration tests.

**Acceptance Criteria:**
- [ ] Success MSW handler: `http.post('/api/contact', () => HttpResponse.json({ id: 'msg-1' }, { status: 201 }))`
- [ ] Success test: fills all three fields, clicks submit, awaits `findByText('Message sent! We'll be in touch.')`, asserts form inputs are cleared using `toHaveValue('')`
- [ ] Failure MSW handler: `http.post('/api/contact', () => HttpResponse.json({ errors: { email: 'Invalid email format', message: 'Message is too short' } }, { status: 400 }))`
- [ ] Failure test: fills fields with bad data (reuses `server.use()` override), clicks submit, awaits `findByText('Invalid email format')`, asserts `findByText('Message is too short')` also appears
- [ ] Failure test asserts the success message is not shown: `expect(screen.queryByText(/message sent/i)).not.toBeInTheDocument()`
- [ ] Failure test asserts the submit button is re-enabled after the error: `expect(screen.getByRole('button', { name: /send/i })).not.toBeDisabled()` — the user can retry
- [ ] Notes that per-field errors require the form to map API error keys to the correct field — the integration test verifies the mapping is correct, which no unit test can catch

---

### Q10 — `findBy*` vs `waitFor` ⭐⭐

**Scenario:** Two developers disagree: one uses `await screen.findByText('Success')` everywhere. The other uses `await waitFor(() => screen.getByText('Success'))` everywhere. Both work. When is each form clearer?

**Task:** Explain that `findByText` is shorthand for `waitFor(() => screen.getByText(...))`. Describe when to prefer each.

**Acceptance Criteria:**
- [ ] `findBy*` is exactly equivalent to `waitFor(() => getBy*(...))` — same timeout, same polling interval, same error message on failure
- [ ] `findBy*` is clearer when you simply need to wait for an element to appear — the intent is "wait until this text is visible" — one line, readable
- [ ] `waitFor` is necessary when multiple assertions must be retried together — `await waitFor(() => { expect(screen.getByText('Success')).toBeInTheDocument(); expect(screen.queryByText('Loading')).not.toBeInTheDocument() })` — both assertions retry as a unit
- [ ] `waitFor` is also necessary when asserting an element is gone: `await waitFor(() => expect(screen.queryByText('Loading')).not.toBeInTheDocument())` — `findBy` cannot assert absence
- [ ] Common mistake: `const el = await screen.findByText('Success'); expect(el).toHaveStyle('color: green')` — the style assertion runs after the element appears but does not retry; if the style is applied asynchronously, a second `waitFor` or `findBy` is needed
- [ ] Guideline: use `findBy` for the first async element; use `waitFor` when you need multiple assertions to succeed together or when asserting absence

---

### Q11 — Testing File Upload ⭐⭐

**Scenario:** The payment evidence uploader accepts a single JPEG image. The test must simulate a user selecting a file, verify the preview appears, and confirm the form is submitted with the file included.

**Task:** Show how to simulate file selection with `userEvent.upload`. Show what to assert after the upload.

**Acceptance Criteria:**
- [ ] Creates a test file: `const file = new File(['(binary)'], 'receipt.jpg', { type: 'image/jpeg' })` — Testing Library accepts File objects directly
- [ ] Finds the file input: `const input = screen.getByLabelText(/upload receipt/i)` — inputs are found by their label, not by type
- [ ] Simulates upload: `await user.upload(input, file)` — `userEvent.upload` fires the full sequence of input events the browser would fire when a file is selected
- [ ] Asserts the file name is shown: `expect(screen.getByText('receipt.jpg')).toBeInTheDocument()` — the component typically renders the selected file name as a preview
- [ ] Asserts the file is in the input: `expect(input.files[0]).toBe(file)` and `expect(input.files).toHaveLength(1)`
- [ ] Submit and assert: clicks submit — MSW handler receives the request — use `http.post('/api/upload', async ({ request }) => { const formData = await request.formData(); ... })` to inspect the uploaded file in the handler
- [ ] Notes that `fireEvent.change` can simulate file selection by directly setting `input.files` — but it bypasses the file-picker event chain; `userEvent.upload` is more realistic

---

### Q12 — Infinite Scroll Integration ⭐⭐⭐

**Scenario:** The `TransactionList` component uses `useInfiniteQuery` and loads more items when the user scrolls to the bottom. The trigger is an `IntersectionObserver` on the last item. JSDOM does not implement `IntersectionObserver`.

**Task:** Describe how to mock `IntersectionObserver` in JSDOM integration tests to simulate the scroll trigger.

**Acceptance Criteria:**
- [ ] JSDOM limitation: `IntersectionObserver` is not implemented — accessing it throws `ReferenceError: IntersectionObserver is not defined`
- [ ] Mock strategy: replace the global with a mock class that stores callbacks and lets tests trigger them manually
- [ ] Mock implementation: in `vitest.setup.ts`, define `class MockIntersectionObserver { observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn(); constructor(callback) { this.callback = callback } }` and assign `global.IntersectionObserver = MockIntersectionObserver`
- [ ] Triggering the observer in a test: get the observer instance from the mock, call its stored callback with a mock entry: `mockObserver.callback([{ isIntersecting: true }])`
- [ ] After triggering: MSW returns the next page of data — `await screen.findByText('Transaction #11')` — confirms page 2 loaded and was appended
- [ ] Alternative: expose a `loadMore` function from the hook and call it directly — sidesteps the IntersectionObserver entirely for unit-style testing; the integration test then focuses on the data appending, not the scroll detection
- [ ] Notes that `jest-intersection-observer` and `@testing-library/jest-dom` plugins provide drop-in IntersectionObserver mocks — reduces boilerplate compared to a custom class

---

### Q13 — Testing WebSocket in Integration ⭐⭐⭐

**Scenario:** The `NotificationPanel` component connects to a WebSocket on mount and updates the notification count when a message arrives. Testing with a real WebSocket server is fragile. You need a controlled mock.

**Task:** Show how to mock the WebSocket constructor using `vi.mock` or a custom mock class. Write a test that simulates a message arriving and asserts the UI updates.

**Acceptance Criteria:**
- [ ] Creates a mock WebSocket class: stores the `onmessage` handler when the component assigns it — `class MockWebSocket { constructor() { MockWebSocket.instance = this } send = vi.fn(); close = vi.fn() }`
- [ ] Replaces the global: `vi.stubGlobal('WebSocket', MockWebSocket)` in `beforeEach`, `vi.unstubAllGlobals()` in `afterEach`
- [ ] Renders the component: `render(<NotificationPanel />)` — the component creates a `new WebSocket('ws://...')` which creates `MockWebSocket.instance`
- [ ] Simulates a message: `act(() => { MockWebSocket.instance.onmessage({ data: JSON.stringify({ type: 'notification', count: 3 }) }) })`
- [ ] Asserts the UI updated: `expect(screen.getByText('3')).toBeInTheDocument()` — the notification count badge shows the new value
- [ ] Asserts the connection is established: `expect(MockWebSocket.instance).toBeDefined()` — the component did create a WebSocket connection
- [ ] Cleanup test: unmounts the component, asserts `MockWebSocket.instance.close` was called — confirms the component does not leak the connection

---

### Q14 — Test Data Factories ⭐⭐⭐

**Scenario:** The integration test suite has 50 hardcoded user objects scattered across 30 files: `{ id: '1', name: 'Test User', email: 'test@test.com', ... }`. A new required field `kycStatus` breaks all 50 objects in one backend deploy. A factory pattern would have required one line change.

**Task:** Show a test data factory pattern for a `User` object. Show how `faker.js` can generate realistic values. Explain the benefits for large test suites.

**Acceptance Criteria:**
- [ ] Factory function: `function createUser(overrides = {}) { return { id: faker.string.uuid(), name: faker.person.fullName(), email: faker.internet.email(), role: 'user', kycStatus: 'approved', createdAt: faker.date.recent().toISOString(), ...overrides } }`
- [ ] Usage with defaults: `const user = createUser()` — every field is populated with realistic values; no hardcoded `"test@test.com"`
- [ ] Usage with override: `const adminUser = createUser({ role: 'admin' })` — only the relevant field differs; all others are valid and realistic
- [ ] New required field: adding `kycStatus: 'approved'` to the factory once updates every test that calls `createUser()` — no manual update to 50 objects
- [ ] Faker advantage: realistic data (`"Fatima Malik"`, `"paycheck-jan@saralux.com"`) instead of `"Test User"` — tests that rely on display formatting are not accidentally passing because the test data is too simple
- [ ] Factory composition: `createPayment({ userId: createUser().id })` — relationships between objects are expressed through factories, not hardcoded IDs
- [ ] Notes that factories should be in a shared `test/factories/` directory — not duplicated per test file

---

### Q15 — Flaky Test Diagnosis ⭐⭐⭐

**Scenario:** An integration test for the login flow passes locally every time but fails in CI 20% of the time with "Unable to find element with role 'heading' named 'Dashboard'". The test passed code review. Nobody can reproduce the failure locally.

**Task:** Identify 5 common causes of flaky integration tests. For each, describe the symptom and the fix.

**Acceptance Criteria:**
- [ ] Timing: the `waitFor` timeout (1000ms) is sufficient locally (fast machine) but insufficient in CI (shared CPU) — fix: increase `timeout` in `waitFor` or MSW handler delay; or use `findBy` which uses a generous timeout by default
- [ ] Animation / CSS transition: a component animates in with a 300ms CSS transition; the element is in the DOM but not yet visible — fix: add `toBeVisible()` assertion inside `waitFor` to wait for the animation to complete; or disable animations in the test environment with CSS `*, *::after, *::before { transition: none !important }`
- [ ] Test isolation failure: a previous test leaves state in a shared module, localStorage, or the QueryClient — fix: `afterEach(cleanup)` from Testing Library (clears the DOM), `localStorage.clear()`, fresh QueryClient per test
- [ ] Async leak: a test triggers an async operation (fetch, setTimeout) that completes after the test ends — React logs "Warning: Can't perform a React state update on an unmounted component" — fix: `await waitFor(...)` for all async effects; wrap async operations in `act`; add `afterEach(cleanup)`
- [ ] Environment difference: the test relies on `Date.now()` or `Math.random()` which produces different values in each run — a sort order changes, a timestamp comparison fails — fix: `vi.setSystemTime(new Date('2026-06-20'))` for deterministic dates; `vi.spyOn(Math, 'random').mockReturnValue(0.5)` for deterministic randoms
- [ ] Notes that `--reporter=verbose` in CI exposes the full assertion error including what was in the DOM at the time — always add `screen.debug()` (temporarily) to failing CI tests to see the DOM snapshot
