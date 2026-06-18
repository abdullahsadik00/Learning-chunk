# Day 15 Assessment — React Internals · Error Boundaries · Portals

**Theme:** You are building a CMS with a crash-resistant widget system, accessible modals, and a toast notification system. When any widget crashes, the rest of the page must remain usable.

---

### Q1 — Virtual DOM concept ⭐

**Scenario:** A non-technical product manager asks why React doesn't just update the DOM directly on every state change.

**Task:** Explain the Virtual DOM in plain terms: what it is, what problem it solves, and the three-step process React uses (describe → diff → patch).

**Acceptance Criteria:**
- [ ] Virtual DOM is a lightweight JavaScript object tree representing the UI
- [ ] Describes the problem: direct DOM reads/writes are expensive (trigger reflows/repaints)
- [ ] Step 1: when state changes, React creates a NEW virtual DOM tree
- [ ] Step 2: React diffs the new tree against the previous tree (reconciliation)
- [ ] Step 3: React calculates the minimum DOM operations needed and applies only those
- [ ] Key benefit: batching — multiple state changes cause only one DOM update pass

---

### Q2 — Reconciliation rules ⭐

**Scenario:** A developer is confused about why list items lose their state when reordered without keys, but other components keep their state when their props change.

**Task:** State the four reconciliation rules React uses. For each, give a concrete before/after example.

**Acceptance Criteria:**
- [ ] Rule 1: Different element type → unmount old subtree, mount new. E.g. `<div>` → `<span>`: entire subtree rebuilt
- [ ] Rule 2: Same element type → update props, keep DOM node. E.g. `<div class="a">` → `<div class="b">`: only `class` changed
- [ ] Rule 3: Same component type → same instance, re-render with new props
- [ ] Rule 4: Lists without keys → compare by position; with keys → compare by identity
- [ ] Demonstrates key benefit: `key` allows React to know `<li key="b">` is the same item regardless of position

---

### Q3 — Error Boundary basics ⭐

**Scenario:** A chart widget crashes and brings down the entire CMS page. You need to isolate the crash.

**Task:** Explain what an Error Boundary does, what it does NOT catch, and why it must be a class component (not a function component).

**Acceptance Criteria:**
- [ ] Error Boundary catches render errors, lifecycle errors, and constructor errors in its child tree
- [ ] Shows a fallback UI instead of the crashed subtree
- [ ] Does NOT catch: event handler errors, async errors (setTimeout, Promise), SSR errors, errors within the boundary itself
- [ ] Must be a class component because `getDerivedStateFromError` and `componentDidCatch` have no hook equivalents
- [ ] Notes: React may add a hook-based error boundary API in future versions

---

### Q4 — Fiber architecture: the why ⭐

**Scenario:** Pre-React 16, heavy re-renders caused animations to stutter. The Fiber rewrite fixed this. Explain to a junior developer why the old Stack reconciler couldn't solve this.

**Task:** Explain the core problem with the old Stack reconciler and what Fiber does differently. Focus on: synchronous vs interruptible work.

**Acceptance Criteria:**
- [ ] Stack reconciler: recursive, synchronous — once started, it ran to completion without yielding
- [ ] Long renders blocked the main thread — user input, animations, and scrolling were unresponsive
- [ ] Fiber: breaks rendering into small "units of work" (one per component)
- [ ] After each unit, Fiber checks if higher-priority work exists (user input, animation)
- [ ] If so, Fiber yields and processes the high-priority work first, then resumes
- [ ] This enables concurrent features like `useTransition` and `Suspense`

---

### Q5 — createPortal basics ⭐

**Scenario:** A tooltip inside a table cell is clipped by `overflow: hidden` on the table container. You need it to render outside the DOM hierarchy while still being a child in the React tree.

**Task:** Explain what `createPortal` does, how React's event bubbling works through it, and the primary use cases.

**Acceptance Criteria:**
- [ ] `createPortal(children, domNode)` renders `children` into `domNode` (outside the parent's DOM subtree)
- [ ] The React component tree hierarchy is preserved — Context and event bubbling still flow through the React tree, NOT the DOM tree
- [ ] A click inside a portal still bubbles up through the React parent (even though the DOM parent is `document.body`)
- [ ] Use cases: modals, tooltips, dropdowns, toast notifications (anything that needs to escape CSS stacking context)
- [ ] The component that calls `createPortal` still unmounts with its parent

---

### Q6 — Error Boundary implementation ⭐⭐

**Scenario:** Implement a reusable `ErrorBoundary` class component that accepts a `fallback` prop (either a ReactNode or a render function) and an optional `onError` callback.

**Task:** Write the full `ErrorBoundary` class with: state management, `getDerivedStateFromError`, `componentDidCatch`, a `reset()` method, and conditional fallback rendering.

**Acceptance Criteria:**
- [ ] State: `{ hasError: boolean, error: Error | null }`
- [ ] `static getDerivedStateFromError(error)` sets `{ hasError: true, error }`
- [ ] `componentDidCatch(error, info)` calls `this.props.onError?.(error, info)` and logs
- [ ] `reset = () => this.setState({ hasError: false, error: null })`
- [ ] If `fallback` is a function: calls it with `(error, reset)`; otherwise renders the node or default fallback
- [ ] `render()` returns `this.props.children` when `hasError` is false

---

### Q7 — Multi-level Error Boundaries ⭐⭐

**Scenario:** Your CMS has a full-page boundary (catastrophic), a dashboard section boundary (isolates the section), and per-widget boundaries (isolates individual widgets).

**Task:** Show the component tree structure with three levels of Error Boundaries. Explain how the boundaries interact when a widget crashes.

**Acceptance Criteria:**
- [ ] Top-level boundary: catches truly catastrophic errors, shows a reload page message
- [ ] Section-level boundary: isolates a dashboard section, shows "Section unavailable" with a retry button
- [ ] Widget-level boundary: isolates individual widgets, shows a small "Widget failed" placeholder
- [ ] When a widget crashes: only the widget-level boundary catches it; sections and page remain functional
- [ ] `onError` at section level logs to Sentry; `onError` at page level triggers a PagerDuty alert
- [ ] Demonstrates why granular boundaries are better than one global boundary

---

### Q8 — Handling async errors with boundaries ⭐⭐

**Scenario:** A widget fetches data asynchronously. When the fetch fails, the error is not caught by the Error Boundary (because it's async).

**Task:** Implement `useThrowAsyncError()` — a hook that lets you throw async errors into the Error Boundary by routing them through a state update.

**Acceptance Criteria:**
- [ ] `const [, setState] = useState<null>(null)`
- [ ] Returns `useCallback((error: Error) => setState(() => { throw error; }), [])`
- [ ] The state callback throws synchronously during React's render phase — caught by the nearest Error Boundary
- [ ] Usage: in a `catch` block, call `throwError(err)` instead of setting an error state
- [ ] Explains the mechanism: `setState` callbacks run inside React's render cycle — any throw is caught by boundaries

---

### Q9 — Accessible Modal with Portal ⭐⭐

**Scenario:** Your CMS needs a modal that: renders on `document.body`, traps focus inside, closes on Escape, closes on backdrop click, and prevents background scroll.

**Task:** List the implementation requirements for an accessible, portal-based modal. You don't need to write all code — name the React/DOM APIs and accessibility attributes needed for each requirement.

**Acceptance Criteria:**
- [ ] `createPortal(..., document.body)` to render outside the parent DOM tree
- [ ] `role="dialog"`, `aria-modal="true"`, `aria-labelledby` for accessibility
- [ ] `tabIndex={-1}` on the dialog div so it can receive programmatic focus
- [ ] `useEffect` saves previous focus, focuses the modal on open, restores focus on close
- [ ] `document.addEventListener('keydown', ...)` checks `e.key === 'Escape'` to close
- [ ] `document.body.style.overflow = 'hidden'` on open; reset in cleanup
- [ ] Backdrop `onClick` check: `e.target === e.currentTarget` to avoid closing when clicking the dialog content

---

### Q10 — Fiber two phases ⭐⭐

**Scenario:** An interviewer asks: "Why is it safe to call `document.title = ...` in `useEffect` but NOT in the render function?"

**Task:** Explain Fiber's two-phase model (render + commit), which phase `useEffect` runs in, and why side effects in the render phase are dangerous.

**Acceptance Criteria:**
- [ ] Render phase: React calls component functions, builds the new fiber tree, calculates what changed — NO DOM mutations
- [ ] Render phase can be interrupted and restarted — a side effect in render runs multiple times unexpectedly
- [ ] Commit phase: React applies DOM mutations — synchronous, cannot be interrupted
- [ ] `useEffect` runs after the commit phase — safe for side effects (DOM mutations, subscriptions, timers)
- [ ] `useLayoutEffect` runs synchronously at the end of the commit phase, before browser paint
- [ ] Explains why React StrictMode runs render twice in dev — to expose impure (side-effectful) renders

---

### Q11 — useTransition for non-urgent updates ⭐⭐

**Scenario:** A CMS search bar filters 20,000 articles. Typing feels sluggish — every keystroke blocks the UI for 100ms to recompute the filtered list.

**Task:** Use `useTransition` to make the filter update non-urgent, keeping the input responsive.

**Acceptance Criteria:**
- [ ] `const [isPending, startTransition] = useTransition()`
- [ ] Input value update is NOT wrapped — it's urgent (user must see their typing immediately)
- [ ] `startTransition(() => { setFilterQuery(e.target.value); })` marks the filter as non-urgent
- [ ] `isPending === true` while the filtered list is computing — show a spinner or dim the list
- [ ] If the user types again before the filter finishes, React discards the in-progress work and starts fresh
- [ ] Explains: `startTransition` doesn't make things faster — it makes the UI responsive by deferring non-urgent work

---

### Q12 — useDeferredValue ⭐⭐

**Scenario:** A parent component receives a `searchQuery` prop it doesn't control (comes from a URL param). It can't wrap the setter in `startTransition`. Use `useDeferredValue` instead.

**Task:** Show `useDeferredValue` in use. Demonstrate how to show stale content (dimmed) while fresh content is computing. Explain when to use `useDeferredValue` vs `useTransition`.

**Acceptance Criteria:**
- [ ] `const deferredQuery = useDeferredValue(searchQuery)`
- [ ] `const isStale = deferredQuery !== searchQuery` — true while the deferred value lags
- [ ] Render filtered list using `deferredQuery` (not `searchQuery`) — so computation is deferred
- [ ] `style={{ opacity: isStale ? 0.6 : 1 }}` to dim stale content
- [ ] `useTransition`: you control the state setter → wrap it in `startTransition`
- [ ] `useDeferredValue`: you receive a value from props/external source → defer your consumption of it

---

### Q13 — Toast notification system with Portal ⭐⭐⭐

**Scenario:** The CMS needs a toast system where any component can trigger a notification. Toasts render on `document.body` (above all other content) and auto-dismiss after 4 seconds.

**Task:** Design (without full code) the architecture for a toast system using Context + Portal. Name the pieces, their responsibilities, and how they connect.

**Acceptance Criteria:**
- [ ] `ToastContext` provides an `addToast(message, type)` function
- [ ] `ToastProvider` manages a `toasts` state array (each toast has `id`, `message`, `type`)
- [ ] `addToast` uses `crypto.randomUUID()` for `id`, sets a `setTimeout` to remove after 4s
- [ ] `createPortal(<ToastList toasts={toasts} />, document.body)` renders toasts outside the provider's DOM position
- [ ] `useToast()` hook throws if called outside `ToastProvider`
- [ ] Any component anywhere in the tree calls `const { addToast } = useToast()` and triggers toasts

---

### Q14 — StrictMode implications ⭐⭐⭐

**Scenario:** A developer notices their `useEffect` cleanup runs twice on mount in development. They think there is a bug. There is not — but understanding why requires understanding StrictMode.

**Task:** Explain exactly what React StrictMode does in development (React 18+). Show a component whose behaviour reveals an impure `useEffect` and explain how double-running exposes it.

**Acceptance Criteria:**
- [ ] StrictMode renders components TWICE in development (not in production) to detect impure renders
- [ ] StrictMode runs effects TWICE: mount → cleanup → mount again — to ensure effects are idempotent
- [ ] Example of exposed bug: `useEffect` that appends to a DOM element without cleaning up — it appends twice on mount in StrictMode
- [ ] Correct behaviour: cleanup fully reverses the effect — so the second mount is identical to the first
- [ ] No performance cost in production — StrictMode is a development-only tool
- [ ] Shows `<React.StrictMode>` wrapping `<App />` in `main.tsx`

---

### Q15 — Immutable state and Object.is ⭐⭐⭐

**Scenario:** A developer mutates an array in state and calls `setState` with the same reference. The UI never updates. They add a `console.log` and see the data changed — but React didn't re-render.

**Task:** Explain how React determines whether to re-render (using `Object.is`). Show the bug and three correct immutable update patterns for arrays.

**Acceptance Criteria:**
- [ ] React uses `Object.is(prevState, nextState)` — essentially `===` for objects/arrays
- [ ] `arr.push(item); setState(arr)` — same reference → `Object.is` returns `true` → no re-render
- [ ] Pattern 1 (add): `setState([...arr, item])`
- [ ] Pattern 2 (remove): `setState(arr.filter(x => x.id !== id))`
- [ ] Pattern 3 (update): `setState(arr.map(x => x.id === id ? { ...x, done: !x.done } : x))`
- [ ] Explains why React uses reference equality: checking deep equality on every state update would be too expensive
