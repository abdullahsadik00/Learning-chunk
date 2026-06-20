# Day 32 Assessment — React Component Testing · Testing Library · userEvent

**Theme:** You are auditing test quality on a React dashboard. Most tests use `wrapper.find('.button').simulate('click')` (Enzyme style — testing implementation). Rewrite them the Testing Library way — testing behavior.

---

### Q1 — Testing Library Philosophy ⭐

**Scenario:** A senior engineer looks at the existing test `wrapper.find('.payment-btn').simulate('click')` and says: "This tests implementation, not behavior." The junior engineer does not understand the difference.

**Task:** Explain what "don't test implementation details" means in the context of React Testing Library. Explain specifically why selecting by CSS class (`'.button'`) is considered an implementation detail.

**Acceptance Criteria:**
- [ ] Implementation detail: something the user does not observe — internal component state, CSS class names, component hierarchy, prop names
- [ ] CSS classes are implementation details: the class name `"payment-btn"` can be renamed during a design refactor without changing any user-visible behavior — the test would break but the feature works fine
- [ ] Testing Library's core question: "What would the user see or do?" — users see text, labels, and roles; they do not inspect class names or component state
- [ ] Enzyme's `wrapper.find('.button').simulate('click')` calls the React event handler directly, bypassing real browser event behavior — it does not simulate what a real user interaction does
- [ ] Testing Library forces you to find elements the way a user would (by role, label, or text) and interact with them the way a user would (via `userEvent`)
- [ ] Benefit: tests written against user-observable behavior survive refactoring — you can rename classes, restructure components, and change state shape without breaking tests

---

### Q2 — Query Priorities ⭐

**Scenario:** A new developer writes `screen.getByTestId('submit-button')` for every element. Code review asks them to use the priority order instead.

**Task:** List the Testing Library query priority order from most to least preferred. Explain why role-based queries are at the top.

**Acceptance Criteria:**
- [ ] Priority 1: `getByRole` — matches elements by their ARIA role (button, textbox, checkbox, heading) — the closest to how a screen reader or keyboard user navigates
- [ ] Priority 2: `getByLabelText` — matches form inputs by their associated `<label>` — tests that the label is correctly wired, which is also an accessibility requirement
- [ ] Priority 3: `getByPlaceholderText` — acceptable but fragile; placeholder text is not a reliable accessibility signal
- [ ] Priority 4: `getByText` — finds elements by visible text content — good for buttons, headings, and links without roles
- [ ] Priority 5: `getByDisplayValue` — finds form elements by their current value — useful for pre-filled forms
- [ ] Priority 6: `getByAltText` — for images with `alt` attributes
- [ ] Priority 7: `getByTitle` — low priority; title attributes are inconsistently surfaced to users
- [ ] Priority 8: `getByTestId` — last resort only; use when no semantic query is possible (e.g., a canvas element with no text) — requires adding `data-testid` to production markup which is noise
- [ ] Role-based queries are preferred because they simultaneously test accessibility: a button with no accessible name will fail `getByRole('button', { name: /submit/i })` — the test fails and the accessibility bug is caught at the same time

---

### Q3 — `getBy` vs `queryBy` vs `findBy` ⭐

**Scenario:** A test asserts that an error message does not appear. Using `getByText('Error')` makes the test throw instead of fail. The developer does not know which query to use.

**Task:** Explain the difference between `getBy`, `queryBy`, and `findBy`. State what each does when the element is absent.

**Acceptance Criteria:**
- [ ] `getBy*`: returns the element if found, throws an error if not found — use when the element must be present; a missing element is a test failure, not a soft miss
- [ ] `queryBy*`: returns the element if found, returns `null` if not found — use to assert an element is absent: `expect(screen.queryByText('Error')).not.toBeInTheDocument()`
- [ ] `findBy*`: returns a Promise that resolves to the element when it appears; rejects if it does not appear within the timeout (default 1000ms) — use for elements that appear asynchronously after a state update or API call
- [ ] Common mistake: using `getBy` to assert absence — it throws immediately rather than returning a falsy value, so `expect(screen.getByText('Error')).not.toBeInTheDocument()` always throws before the assertion runs
- [ ] All three have plural variants (`getAllBy`, `queryAllBy`, `findAllBy`) that return arrays — `getBy` and `queryBy` throw if more than one match is found (single-element expectation)
- [ ] `findBy` is equivalent to `waitFor(() => screen.getByText(...))` but is more concise — prefer `findBy` for simple async element appearance

---

### Q4 — `userEvent` vs `fireEvent` ⭐

**Scenario:** A test uses `fireEvent.change(input, { target: { value: 'hello' } })` to simulate typing. The feature works in the browser but the test passes even when the input's `onChange` handler is broken. A review suggests switching to `userEvent.type`.

**Task:** Explain why `userEvent` is preferred over `fireEvent`. Describe what `userEvent.setup()` does and when it is required.

**Acceptance Criteria:**
- [ ] `fireEvent.change` dispatches a single synthetic React event — it bypasses browser event sequences (keydown, keypress, keyup, input, change) and sets value directly
- [ ] `userEvent.type` fires the full sequence of keyboard events for every character — `keydown`, `keypress`, `input`, `keyup` — exactly as a real browser would
- [ ] This matters for inputs that listen to `onKeyDown` or `onInput` instead of `onChange`, for masked inputs that transform characters on `input` events, and for components that validate on `blur`
- [ ] `fireEvent` can make tests pass for components that are broken in real usage — if a handler only fires on `keydown` and `fireEvent.change` skips it, the test is a false positive
- [ ] `userEvent.setup()` creates a configured `userEvent` instance — required in Vitest / Testing Library v14+ because it allows setting pointer type, delay, and document; use `const user = userEvent.setup()` in `beforeEach` then `await user.type(input, 'hello')`
- [ ] All `userEvent` interactions are async — must be `await`ed; forgetting `await` is the most common source of silent test failures with `userEvent`

---

### Q5 — Testing a Form ⭐⭐

**Scenario:** The `LoginForm` component has an email field, a password field, and a submit button. It validates that both fields are filled, that the email format is valid, shows a loading spinner while the API call is in flight, and shows a success message on completion.

**Task:** Write a full test suite for `LoginForm` covering: renders correctly, validates empty submission, validates bad email format, shows loading state, and shows success message.

**Acceptance Criteria:**
- [ ] Render test: `render(<LoginForm onLogin={vi.fn()} />)` — asserts email input, password input, and submit button are present using role queries
- [ ] Empty validation test: clicks submit without filling fields — asserts validation messages appear (`getByText('Email is required')`, `getByText('Password is required')`) without calling `onLogin`
- [ ] Bad email test: types `'notanemail'` into the email field and submits — asserts `'Enter a valid email address'` error appears
- [ ] Loading state test: fills valid credentials, submits — `onLogin` returns a promise that is pending — asserts `getByRole('progressbar')` or `getByText('Signing in…')` is present while the promise is unresolved
- [ ] Success test: `onLogin` resolves — asserts `await screen.findByText('Welcome back!')` appears; uses `findBy` because the success message appears after an async state update
- [ ] Each test uses `userEvent.setup()` and `await user.type(...)` for interactions
- [ ] `onLogin` mock is created with `vi.fn()` and reset in `afterEach`

---

### Q6 — `waitFor` and Async Tests ⭐⭐

**Scenario:** A test clicks a button that triggers an async API call and updates state. Without `await waitFor(...)`, the assertion runs before the state update completes and fails, even though the feature works correctly.

**Task:** Explain why `waitFor` is needed for state updates. Show the common mistake of not awaiting it. Show `findBy` as a simpler alternative.

**Acceptance Criteria:**
- [ ] React state updates triggered by async operations are not synchronous — `setState` after an `await fetch(...)` fires after the current test execution frame
- [ ] Without `waitFor`: `expect(screen.getByText('Success')).toBeInTheDocument()` runs before the state update, throws "Unable to find an element", even though it would appear 10ms later
- [ ] With `waitFor`: `await waitFor(() => expect(screen.getByText('Success')).toBeInTheDocument())` — retries the assertion every 50ms until it passes or the 1000ms timeout expires
- [ ] Common mistake: `waitFor(expect(...))` — passes the result of calling `expect` (undefined) instead of a callback — the retry loop never re-runs the assertion; always pass a function: `waitFor(() => expect(...))`
- [ ] Second mistake: not `await`ing `waitFor` — the test completes before the assertion finishes; false passes are the result
- [ ] `findBy` shorthand: `await screen.findByText('Success')` is equivalent to `await waitFor(() => screen.getByText('Success'))` — prefer `findBy` when you just need to wait for an element to appear

---

### Q7 — `screen.debug()` ⭐⭐

**Scenario:** A test fails with "Unable to find an element with the role 'button' and name /submit/i". You cannot tell from the error what DOM is actually rendered.

**Task:** Explain what `screen.debug()` outputs and when to use it during test development.

**Acceptance Criteria:**
- [ ] `screen.debug()` prints the current rendered DOM to the terminal in a readable, pretty-printed HTML format — shows exactly what Testing Library sees at that moment in the test
- [ ] Call `screen.debug()` immediately before a failing query to see the full DOM — confirms whether the element exists at all, what role it actually has, what text it contains
- [ ] `screen.debug(element)` prints only the subtree of a specific element — useful when the full DOM is large and noisy
- [ ] Common use: element is present but query fails — `debug()` reveals the accessible name is `"Submit form"` not `"Submit"` — query needs `{ name: /submit form/i }` not `{ name: /submit/i }`
- [ ] Remove all `screen.debug()` calls before committing — they are debugging artifacts, not assertions, and add noise to CI output
- [ ] Alternative: `screen.logTestingPlaygroundURL()` prints a URL that opens the Testing Library Playground pre-loaded with the current DOM — lets you interactively find the correct query

---

### Q8 — Testing Error Boundaries ⭐⭐

**Scenario:** The `PaymentWidget` component throws an error when the payment data is malformed. The `ErrorBoundary` wrapper should catch the throw and render a friendly fallback UI instead of a blank screen.

**Task:** Write a test that renders a component that throws, wraps it in `ErrorBoundary`, and asserts the fallback UI is shown instead of the error.

**Acceptance Criteria:**
- [ ] Creates a `ThrowingComponent`: a simple component that always throws — `const ThrowingComponent = () => { throw new Error('Payment data invalid') }` — not wrapped in try/catch (the boundary handles it)
- [ ] Suppresses expected console errors: `vi.spyOn(console, 'error').mockImplementation(() => {})` in `beforeEach` — React always calls `console.error` when an error boundary catches; suppress it to keep test output clean
- [ ] Renders inside the boundary: `render(<ErrorBoundary fallback={<p>Something went wrong</p>}><ThrowingComponent /></ErrorBoundary>)`
- [ ] Asserts the fallback is shown: `expect(screen.getByText('Something went wrong')).toBeInTheDocument()`
- [ ] Asserts the throwing component's output is not shown — confirms the boundary caught the error before it rendered
- [ ] Notes that error boundary tests require class-based `ErrorBoundary` because React's `componentDidCatch` only works in class components — function components cannot be error boundaries
- [ ] Restores `console.error` in `afterEach` with `consoleSpy.mockRestore()`

---

### Q9 — `renderHook` ⭐⭐

**Scenario:** The `useCounter` custom hook manages count state with `increment`, `decrement`, and `reset` functions. It cannot be tested by rendering a component — it has no UI. You need to test the hook in isolation.

**Task:** Use `renderHook` to test `useCounter`. Test initial value, increment, decrement, and reset. Explain `result.current`.

**Acceptance Criteria:**
- [ ] Renders the hook: `const { result } = renderHook(() => useCounter(0))`
- [ ] `result.current` contains the hook's return value — whatever the hook returns (object, array, primitive) is accessible here; it updates reactively when state changes
- [ ] Initial value test: `expect(result.current.count).toBe(0)`
- [ ] Increment test: `act(() => result.current.increment())` then `expect(result.current.count).toBe(1)` — `act` wraps state-updating calls to flush React's update queue
- [ ] Decrement test: `act(() => result.current.decrement())` then `expect(result.current.count).toBe(-1)` (from initial 0, or from 1 after increment depending on test isolation)
- [ ] Reset test: `act(() => result.current.increment())`, `act(() => result.current.reset())`, `expect(result.current.count).toBe(0)`
- [ ] Notes that `result` is a ref-like object — always read `result.current` after the `act` call, not before, because `result.current` is replaced on every re-render

---

### Q10 — Accessible Queries ⭐⭐

**Scenario:** A code review flags five `getByTestId` calls as anti-patterns. You need to rewrite each one using a proper accessible query.

**Task:** Show 5 different `getByRole` queries for different element types. Include name filtering where appropriate.

**Acceptance Criteria:**
- [ ] Button: `screen.getByRole('button', { name: /submit/i })` — matches `<button>Submit</button>` or `<button aria-label="Submit">`
- [ ] Checkbox: `screen.getByRole('checkbox', { name: /remember me/i })` — matches `<input type="checkbox" id="remember">` with associated label
- [ ] Checked checkbox: `screen.getByRole('checkbox', { checked: true })` — finds the checked checkbox; useful when asserting state after interaction
- [ ] Textbox: `screen.getByRole('textbox', { name: /email address/i })` — matches `<input type="text">` or `<input type="email">` associated with the label "Email address"
- [ ] Heading: `screen.getByRole('heading', { level: 1, name: /payment details/i })` — matches `<h1>Payment Details</h1>` specifically at level 1
- [ ] Link: `screen.getByRole('link', { name: /terms and conditions/i })` — matches `<a href="...">Terms and Conditions</a>`
- [ ] Notes that ARIA role names are case-insensitive and Testing Library accepts regex — using regex avoids brittle exact-string matching for text that varies in capitalization

---

### Q11 — Custom `renderWithProviders` ⭐⭐

**Scenario:** Every test file for dashboard components repeats the same 15-line `render` wrapper: `QueryClientProvider` with a fresh client, `MemoryRouter` with an initial route, and an `AuthContext` with a test user. A single change to one provider breaks 30 test files.

**Task:** Create a `renderWithProviders` utility that wraps `render` in `QueryClientProvider` and `MemoryRouter`. Show how tests use it.

**Acceptance Criteria:**
- [ ] Creates a fresh `QueryClient` inside `renderWithProviders` with aggressive test settings: `defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } }` — prevents retries and caching that cause flaky tests
- [ ] Wraps the component: returns `render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter></QueryClientProvider>, options)`
- [ ] Accepts `route` as an option with default `'/'` — allows individual tests to set the initial URL without changing the utility
- [ ] Re-exports everything from `@testing-library/react` in the utility file — consumers import `render`, `screen`, `waitFor` from `./test-utils` instead of from Testing Library directly
- [ ] Usage: `renderWithProviders(<DashboardPage />, { route: '/dashboard/analytics' })`
- [ ] Each test call to `renderWithProviders` gets a fresh `QueryClient` — no cache pollution between tests
- [ ] Notes that the utility can also accept an `AuthContext` override so individual tests can simulate authenticated vs unauthenticated states

---

### Q12 — Testing Suspense and Async Components with MSW ⭐⭐⭐

**Scenario:** `UserProfile` uses a `useFetch` hook that suspends while loading. It needs a `Suspense` boundary. You must test the loading state, the resolved data state, and the error state — all using MSW for API interception.

**Task:** Write tests for all three states of `UserProfile`. Show the MSW handler setup and how to assert the loading skeleton, the populated profile, and the error message.

**Acceptance Criteria:**
- [ ] MSW server setup: `beforeAll(() => server.listen())`, `afterEach(() => server.resetHandlers())`, `afterAll(() => server.close())`
- [ ] Default handler in `handlers.ts`: `http.get('/api/user/:id', () => HttpResponse.json({ name: 'Sadik', email: 'sadik@example.com' }))`
- [ ] Loading state test: renders `<Suspense fallback={<div>Loading…</div>}><UserProfile id="1" /></Suspense>` — immediately asserts `expect(screen.getByText('Loading…')).toBeInTheDocument()` before MSW responds
- [ ] Data state test: `await screen.findByText('Sadik')` — waits for MSW to respond and Suspense to resolve; then asserts email is also shown
- [ ] Error state test: uses `server.use(http.get('/api/user/:id', () => HttpResponse.json({ message: 'Not found' }, { status: 404 })))` to override the handler for this test only — asserts the error boundary or error UI is shown
- [ ] Suppresses Suspense act warnings: wraps the render in `act(async () => { ... })` or uses the `@testing-library/react` version that handles Suspense correctly
- [ ] Notes that error boundaries must wrap components that can throw — without one, the MSW 404 response causes an uncaught error in the test

---

### Q13 — Avoiding False Positives ⭐⭐⭐

**Scenario:** A test asserts `expect(screen.getByText('$0.00')).toBeInTheDocument()`. The balance section is hidden behind a CSS `display: none`. The test passes but the feature is broken — the element is in the DOM but invisible.

**Task:** Distinguish `toBeInTheDocument()`, `toBeVisible()`, and `toHaveValue('')`. Explain when each assertion is correct and when it gives false positives.

**Acceptance Criteria:**
- [ ] `toBeInTheDocument()`: asserts the element exists in the DOM — passes even if the element is `display: none`, `visibility: hidden`, or `opacity: 0` — use only when you care about DOM presence, not visibility
- [ ] `toBeVisible()`: asserts the element is visible to the user — checks that no ancestor has `display: none`, `visibility: hidden`, or `hidden` attribute — the correct assertion for visual elements a user must see
- [ ] `toHaveValue('')`: asserts the value of a form input — use for `<input>`, `<select>`, and `<textarea>`; do not use `toHaveTextContent('')` on inputs because inputs do not have text content
- [ ] False positive scenario: element hidden with CSS — `toBeInTheDocument()` passes but the user cannot see it; `toBeVisible()` fails and correctly catches the bug
- [ ] False negative scenario: asserting `toBeVisible()` on an element inside a `Suspense` fallback that is off-screen due to React concurrent rendering — use `findBy` to wait for the element to fully render before asserting visibility
- [ ] Guideline: for anything the user must see and interact with, prefer `toBeVisible()` over `toBeInTheDocument()`; for asserting elements are removed from DOM, use `not.toBeInTheDocument()` with `queryBy`

---

### Q14 — Test Coverage Gaps ⭐⭐⭐

**Scenario:** The `TodoList` component has 90% test coverage. The existing tests only cover "add a todo" and "mark todo complete". The QA lead asks you to identify what is missing before the feature ships.

**Task:** Identify 5 commonly untested behaviors in a `TodoList` component and explain why each matters for production quality.

**Acceptance Criteria:**
- [ ] Empty state: when the list has zero todos, it should show a friendly message ("No tasks yet. Add one above.") — untested empty state often shows a broken layout or `undefined` render error
- [ ] Keyboard interactions: adding a todo by pressing Enter (not just clicking the Add button) — missing keyboard support breaks accessibility for keyboard-only users; not testing it means the bug is not caught
- [ ] Concurrent additions: rapidly clicking Add multiple times before state updates settle — race condition can create duplicate todos or skip one — only caught by tests that fire multiple events in quick succession
- [ ] Undo / delete: clicking the delete button removes the correct todo by ID, not always the last one — a common off-by-one or wrong index bug that only shows when there are 3+ todos with one deleted from the middle
- [ ] Error state: the API call to persist a new todo fails — the UI should show an error toast and revert the optimistic addition — almost never tested because the happy path always passes in development
- [ ] Notes that these gaps represent real production incidents: empty state crashes ship frequently, keyboard gaps surface in accessibility audits, concurrent addition bugs appear during load testing

---

### Q15 — Snapshot Testing ⭐⭐⭐

**Scenario:** A developer adds snapshot tests for every component "to catch regressions." Three weeks later, a design system update changes button padding. All 200 snapshot tests fail. The developer runs `vitest --update-snapshot` without reading the diffs. The regression snapshots are now "approved".

**Task:** Explain when snapshot testing helps and when it hurts. Explain why `toMatchInlineSnapshot` is a better middle ground than external snapshot files.

**Acceptance Criteria:**
- [ ] Snapshot testing helps when: the rendered output is complex and stable — serialized data structures, SVG output, email templates — where visually reviewing the full output on every PR is impractical
- [ ] Snapshot testing hurts when: snapshots grow large (hundreds of lines of JSX) — reviewers approve snapshot updates without reading them, defeating the purpose
- [ ] Snapshot sprawl: external `.snap` files accumulate; developers run `--updateSnapshot` reflexively to silence failures rather than investigate regressions — the snapshots become noise
- [ ] False security: a snapshot test passing does not mean the component behaves correctly — it means the rendered output matches the last approved snapshot, which may itself have been wrong
- [ ] `toMatchInlineSnapshot`: stores the snapshot as a string literal in the test file itself — the diff appears inline in the PR, forcing the reviewer to read and approve the exact change
- [ ] Inline snapshot example: `expect(renderToStaticMarkup(<Badge status="active" />)).toMatchInlineSnapshot('<span class="badge badge--active">Active</span>')` — the expected value is readable, versioned, and visible in the same file as the test logic
- [ ] Guideline: prefer behavioral assertions (`toBeVisible`, `toHaveValue`, `toHaveBeenCalledWith`) over snapshots for most components; reserve snapshots for serialized non-interactive output
