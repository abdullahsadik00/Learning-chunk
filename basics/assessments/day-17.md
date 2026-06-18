# Day 17 Assessment — Performance · Testing

**Theme:** You are the lead engineer on a financial reporting dashboard. It renders large datasets, must never crash in production, and needs a complete test suite before shipping.

---

### Q1 — React.memo basics ⭐

**Scenario:** A `ReportRow` component re-renders every time the parent `ReportTable` re-renders, even when the row's data hasn't changed. There are 500 rows.

**Task:** Wrap `ReportRow` in `React.memo`. Explain what it does, when it helps, and when it still re-renders despite the wrapper.

**Acceptance Criteria:**
- [ ] `React.memo(ReportRow)` — wraps the component; React skips re-render if props haven't changed
- [ ] Uses shallow comparison (like `===` for each prop)
- [ ] Still re-renders if: a prop is a new object/array/function reference (even with same content)
- [ ] Still re-renders if: `children` prop changes (children are always new JSX elements)
- [ ] `React.memo` is only for function components; class components use `PureComponent` or `shouldComponentUpdate`

---

### Q2 — React.memo with custom comparison ⭐

**Scenario:** `ReportRow` has a `report` object prop with 20 fields. Shallow comparison re-renders when irrelevant fields change (e.g. `updatedAt` timestamp changes but the display values are the same).

**Task:** Add a custom comparison function to `React.memo` that only compares `id`, `amount`, and `status`. Explain the function's signature and return value semantics.

**Acceptance Criteria:**
- [ ] `React.memo(ReportRow, (prevProps, nextProps) => ...)`
- [ ] Comparison function returns `true` to SKIP re-render (props are "equal"), `false` to trigger re-render
- [ ] Only compares `prevProps.report.id === nextProps.report.id && prevProps.report.amount === nextProps.report.amount && prevProps.report.status === nextProps.report.status`
- [ ] Explains: `true` = skip, `false` = render (opposite of `shouldComponentUpdate`)
- [ ] Notes: incorrect comparisons are a correctness bug (stale UI) — more dangerous than missing `memo`

---

### Q3 — Code splitting with React.lazy ⭐

**Scenario:** The dashboard ships with 6 heavy report modules (charts, PDF exports, pivot tables). All are loaded upfront, making the initial bundle 3MB. Users who never open certain reports pay the full cost.

**Task:** Use `React.lazy` + `Suspense` to split each report module into a separate chunk. Show a route-based split for three report routes.

**Acceptance Criteria:**
- [ ] `const PivotReport = React.lazy(() => import('./PivotReport'))`
- [ ] `<Suspense fallback={<ReportSkeleton />}>` wraps lazy components
- [ ] Route-based split: each route's component is a lazy import
- [ ] The fallback renders while the chunk is downloading
- [ ] The chunk is loaded only when the route is first visited
- [ ] Named exports require a re-export: `export default PivotReport` (lazy only works with default exports)

---

### Q4 — RTL: basic render and query ⭐

**Scenario:** You're writing the first test for a `SummaryCard` that displays a title and total amount. The test must verify the content is rendered correctly.

**Task:** Write the RTL test for `SummaryCard`. Use the preferred query method. Explain RTL's query priority and why `getByTestId` should be a last resort.

**Acceptance Criteria:**
- [ ] `render(<SummaryCard title="Revenue" amount={12500} />)`
- [ ] `expect(screen.getByRole('heading', { name: /revenue/i })).toBeInTheDocument()`
- [ ] `expect(screen.getByText(/12,500/)).toBeInTheDocument()`
- [ ] Query priority: `getByRole` > `getByLabelText` > `getByPlaceholderText` > `getByText` > `getByTestId`
- [ ] `getByTestId` is last resort because test IDs don't reflect user experience — they can pass even when the UI is broken
- [ ] `/revenue/i` uses a regex with `i` flag for case-insensitive match (matches 'Revenue', 'revenue', etc.)

---

### Q5 — RTL: user interactions ⭐

**Scenario:** A `FilterPanel` component lets users type in a search input and click a "Apply" button. Tests must verify the filter applies when the button is clicked.

**Task:** Write a test that types in the search input and clicks Apply using `@testing-library/user-event`. Show why `userEvent` is preferred over `fireEvent`.

**Acceptance Criteria:**
- [ ] `const user = userEvent.setup()`
- [ ] `await user.type(screen.getByRole('textbox', { name: /search/i }), 'quarterly')`
- [ ] `await user.click(screen.getByRole('button', { name: /apply/i }))`
- [ ] `userEvent` preferred because it fires real browser events (mousedown, mouseup, focus, input, change) — more realistic
- [ ] `fireEvent.click` fires only the click event — misses cases where focus or blur handlers matter
- [ ] `await` is needed because `userEvent` methods are async

---

### Q6 — Virtualization for long lists ⭐⭐

**Scenario:** A transaction list renders 10,000 rows. The page freezes on load — all rows are in the DOM simultaneously.

**Task:** Explain the virtualization technique. Name the two most common React virtualization libraries. Describe what `react-window` renders at any given time and what properties the container must have.

**Acceptance Criteria:**
- [ ] Virtualization: only renders the visible rows (and a small overscan buffer), not all 10,000
- [ ] Libraries: `react-window` (lightweight) and `react-virtual` / `@tanstack/react-virtual` (flexible)
- [ ] `FixedSizeList` or `VariableSizeList` from `react-window` renders ~10–20 rows at any time (whatever fits the viewport)
- [ ] The outer container must have a fixed height so the scroll area is calculated correctly
- [ ] Each row is absolutely positioned — the container's total height is faked to match `itemCount * itemSize`
- [ ] As the user scrolls, rows are recycled — old rows are unmounted, new rows are mounted at the new position

---

### Q7 — MSW for async testing ⭐⭐

**Scenario:** The `ReportList` component fetches reports from `/api/reports`. Tests must work without hitting the real API — and must be able to simulate loading, success, and error states.

**Task:** Show MSW handler setup for `GET /api/reports`. Write tests for the success case and the error case. Explain where MSW intercepts requests.

**Acceptance Criteria:**
- [ ] `http.get('/api/reports', () => HttpResponse.json([{ id: 1, name: 'Q1' }]))` — success handler
- [ ] `http.get('/api/reports', () => new HttpResponse(null, { status: 500 }))` — error handler
- [ ] MSW intercepts at the network level (Service Worker in browser, Node interceptors in tests) — not fetch/axios directly
- [ ] Success test: `render(<ReportList />)` → `await screen.findByText('Q1')` (findBy waits for async)
- [ ] Error test: override handler with `server.use(...)` → `await screen.findByText(/error/i)`
- [ ] `server.resetHandlers()` in `afterEach` to avoid test interference

---

### Q8 — React Profiler API ⭐⭐

**Scenario:** The `PivotReport` component is slow to render but you're not sure which sub-component is the bottleneck. You need programmatic profiling data.

**Task:** Wrap `PivotReport` in the `Profiler` API. Show the `onRender` callback parameters. Explain what `actualDuration` vs `baseDuration` reveal.

**Acceptance Criteria:**
- [ ] `<Profiler id="PivotReport" onRender={onRenderCallback}>`
- [ ] `onRender(id, phase, actualDuration, baseDuration, startTime, commitTime)`
- [ ] `actualDuration`: time to render this component and its children (including memoization savings)
- [ ] `baseDuration`: estimated time to render WITHOUT any memoization (worst case)
- [ ] `actualDuration << baseDuration` → memoization is working well
- [ ] `actualDuration ≈ baseDuration` → memoization is not effective; investigate why
- [ ] `phase`: `'mount'` (first render) or `'update'` (subsequent renders)

---

### Q9 — renderHook for custom hook testing ⭐⭐

**Scenario:** The `useReportFilter` custom hook manages filter state and derived filtered data. It must be tested independently from any component.

**Task:** Use `renderHook` to test `useReportFilter`. Show how to: (a) read initial state, (b) call an action, and (c) verify state after the action.

**Acceptance Criteria:**
- [ ] `const { result } = renderHook(() => useReportFilter(mockReports))`
- [ ] `result.current.filters` — read state
- [ ] `act(() => { result.current.setFilter('status', 'pending'); })`
- [ ] After `act`, `result.current.filteredReports` only contains pending reports
- [ ] `act` is required for any state-updating calls — otherwise React batching causes test assertions to run before state settles
- [ ] `renderHook` can accept a `wrapper` option for hooks that require Context providers

---

### Q10 — Fake timers for debounce testing ⭐⭐

**Scenario:** The `SearchInput` component debounces API calls by 300ms. A real 300ms wait in tests makes the suite slow. Fake timers let you advance time instantly.

**Task:** Write a test for `SearchInput` that: types in the input, advances time by 300ms with `jest.advanceTimersByTime`, and verifies the API mock was called.

**Acceptance Criteria:**
- [ ] `jest.useFakeTimers()` before the test (or `beforeEach`)
- [ ] `jest.useRealTimers()` in `afterEach`
- [ ] `await user.type(searchInput, 'revenue')` — types without triggering debounce yet
- [ ] `jest.advanceTimersByTime(300)`
- [ ] `expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('revenue'))`
- [ ] `jest.advanceTimersByTime(299)` should NOT trigger the call (verifies debounce is actually 300ms)

---

### Q11 — Suspense for data fetching ⭐⭐

**Scenario:** Your team is moving to a Suspense-based data fetching strategy using React Query's `suspense: true` option. Loading and error states are now handled by Suspense and Error Boundaries — not inside the component.

**Task:** Show the component tree with `Suspense` and `ErrorBoundary` wrapping a data-fetching component that uses `useSuspenseQuery`. Explain how each layer handles its concern.

**Acceptance Criteria:**
- [ ] `<ErrorBoundary fallback={<ErrorPage />}><Suspense fallback={<Skeleton />}><ReportContent /></Suspense></ErrorBoundary>`
- [ ] `ReportContent` uses `useSuspenseQuery` — it never sees `isLoading` or `isError`; it always has data
- [ ] While loading: React catches the Promise thrown by Suspense and renders the `fallback`
- [ ] On error: React Query throws the error during render; the Error Boundary catches it
- [ ] `ReportContent` code becomes simpler — no loading/error branches
- [ ] Explains: Suspense-based fetching is "render as you fetch" — the component starts fetching before React renders it

---

### Q12 — Preloading and preconnecting ⭐⭐⭐

**Scenario:** Clicking "Open Report" navigates to a heavy report route. The lazy chunk takes 1.5 seconds to download. You want to start loading it on hover (before the click).

**Task:** Show `queryClient.prefetchQuery` for data and `import()` for code splitting — both triggered by `onMouseEnter`. Explain the timing difference between the two.

**Acceptance Criteria:**
- [ ] `onMouseEnter={() => { import('./HeavyReport'); queryClient.prefetchQuery({ ... }); }}`
- [ ] `import('./HeavyReport')` starts downloading the JS bundle — the lazy promise begins
- [ ] `queryClient.prefetchQuery` starts fetching the API data — cached before the component mounts
- [ ] When the user clicks 200ms later, both the chunk and data may already be ready
- [ ] Explains: `React.lazy` already has the promise in flight — first render shows component immediately instead of Suspense fallback
- [ ] Notes: even 200ms of lead time (hover before click) eliminates most perceived latency

---

### Q13 — Test: complex form with validation ⭐⭐⭐

**Scenario:** A `CreateReportForm` has three required fields: `name`, `startDate`, and `endDate`. Submitting without filling them shows inline errors. Submitting with valid data calls `onSubmit`.

**Task:** Write tests for: (a) validation errors appear on empty submit, (b) a specific field error is shown when its value is invalid, (c) success path with valid data calls `onSubmit` with the correct payload.

**Acceptance Criteria:**
- [ ] (a) `await user.click(submitBtn)` → `expect(screen.getAllByRole('alert')).toHaveLength(3)`
- [ ] (b) `await user.type(nameInput, 'ab')` + click submit → `expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument()`
- [ ] (c) Fill all valid fields → click submit → `expect(onSubmit).toHaveBeenCalledWith({ name: 'Q1', startDate: '2026-01-01', endDate: '2026-03-31' })`
- [ ] `onSubmit` is a `jest.fn()` passed as a prop
- [ ] Uses `getByLabelText` (not `getByPlaceholderText`) for accessible field selection
- [ ] Tests do not assert on internal implementation — only observable user-facing behaviour

---

### Q14 — Performance: identify and fix a memo miss ⭐⭐⭐

**Scenario:** `ReportRow` is wrapped in `React.memo` but still re-renders on every parent update. A Profiler shows `actualDuration ≈ baseDuration`. Debugging reveals: the parent passes `onDelete={(id) => deleteReport(id)}` inline.

**Task:** Explain why the inline function breaks `React.memo`. Show the fix. Show two additional memo misses with the same root cause.

**Acceptance Criteria:**
- [ ] Root cause: inline arrow function creates a new reference every render → `React.memo` sees a different `onDelete` prop → re-renders
- [ ] Fix: `const onDelete = useCallback((id) => deleteReport(id), [deleteReport])`
- [ ] Memo miss 2: `config={{ columns: ['a', 'b', 'c'] }}` inline object — fix: `useMemo` or move outside the component
- [ ] Memo miss 3: `filters={activeFilters.filter(f => f.active)}` — creates a new array every render — fix: `useMemo`
- [ ] General rule: any non-primitive passed to a memo'd child must be stable (from `useCallback`, `useMemo`, or module-level constant)

---

### Q15 — End-to-end test architecture ⭐⭐⭐

**Scenario:** The financial dashboard must have a test strategy that covers unit, integration, and E2E layers. A junior developer asks what to test at each layer and which tools to use.

**Task:** Design the three-layer test strategy for the financial dashboard. For each layer: what is tested, which tools are used, and what is NOT tested at that layer.

**Acceptance Criteria:**
- [ ] Unit layer: pure functions (calculations, formatters, transformations) — Jest + Vitest; no React, no DOM
- [ ] Integration layer: components + hooks + MSW-mocked API; RTL + MSW + renderHook; no real DB, no real navigation
- [ ] E2E layer: full user flows (login → navigate → filter → export); Cypress or Playwright; real or staging API
- [ ] Unit does NOT test: component rendering, API calls, user interactions
- [ ] Integration does NOT test: multi-page flows, real network, authentication edge cases
- [ ] E2E does NOT test: every edge case (too slow); unit tests own edge cases
- [ ] The testing trophy: most coverage at integration layer (fast + realistic), fewer E2E (slow + brittle), few unit (only for complex pure logic)
