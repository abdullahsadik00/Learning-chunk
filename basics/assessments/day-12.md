# Day 12 Assessment — React JSX · Components · useState · useEffect

**Theme:** You are building a user dashboard for an analytics SaaS product. New screens, interactive widgets, and live data fetching are required.

---

### Q1 — JSX rules ⭐

**Scenario:** A developer copied an HTML snippet into a JSX file and TypeScript immediately shows 6 errors.

**Task:** List five differences between JSX and HTML syntax that commonly cause errors. For each, give the HTML version and the JSX fix.

**Acceptance Criteria:**
- [ ] `class` → `className`
- [ ] `for` → `htmlFor` (on labels)
- [ ] Inline styles must be objects: `style={{ color: 'red' }}` not `style="color:red"`
- [ ] Self-closing tags must be explicit: `<img />` not `<img>`
- [ ] JSX must have a single root element (or use `<>...</>` Fragment)
- [ ] Event handlers are camelCase: `onClick` not `onclick`

---

### Q2 — Conditional rendering ⭐

**Scenario:** A dashboard widget should show a loading spinner while data loads, an error message if the fetch fails, and the data if successful.

**Task:** Write a `Widget` component that accepts `{ loading, error, data }` props and renders the correct UI for each state. Use at least two different conditional rendering patterns.

**Acceptance Criteria:**
- [ ] `loading === true` → renders a spinner (e.g. `<p>Loading…</p>`)
- [ ] `error` is truthy → renders the error message
- [ ] `data` exists → renders the data
- [ ] Uses early return for loading state (pattern 1)
- [ ] Uses ternary or `&&` for error vs data (pattern 2)
- [ ] Explains the `&&` falsy gotcha: `{0 && <Component />}` renders `0`, not nothing

---

### Q3 — Component props with TypeScript ⭐

**Scenario:** A reusable `MetricCard` component displays a label, value, and an optional trend percentage. Props must be type-safe.

**Task:** Define the TypeScript `interface` for `MetricCard` props with: `label: string`, `value: number`, `trend?: number`, `onClick?: () => void`. Add default prop values via destructuring.

**Acceptance Criteria:**
- [ ] Props interface with all four fields, correct types, and `?` for optionals
- [ ] Destructuring with defaults: `trend = 0`, `onClick = () => {}`
- [ ] Rendering `trend` conditionally (only shown if the prop was passed)
- [ ] TypeScript error if `label` is omitted at usage site
- [ ] No prop-types library (TypeScript interfaces are sufficient)

---

### Q4 — Keys in lists ⭐

**Scenario:** A transaction list re-renders with all items re-mounting on every sort operation. A performance audit reveals the `key` prop is set to array index.

**Task:** Explain why using array index as `key` causes unnecessary re-mounts. Show the correct key (using transaction ID). Demonstrate a case where index is acceptable.

**Acceptance Criteria:**
- [ ] Index-as-key: when the list reorders, React matches by position — items get stale state from wrong position
- [ ] Correct: `key={transaction.id}` — React tracks by stable identity, only moves/updates changed items
- [ ] Index is acceptable for: static lists that never reorder and have no persistent per-item state
- [ ] Shows `key` must be a string or number unique among siblings (not globally)
- [ ] Explains keys help reconciliation but are not passed as a prop to the component

---

### Q5 — useState: functional updates ⭐

**Scenario:** A counter component increments five times in a row inside a batch. Using `setCount(count + 1)` only increments once. A developer is confused.

**Task:** Explain why `setState(newValue)` is unsafe in batched contexts and show the fix using `setState(prev => ...)`.

**Acceptance Criteria:**
- [ ] `setCount(count + 1)` — all five calls close over the same stale `count` value
- [ ] React batches the calls, applies only the last one — result: incremented by 1, not 5
- [ ] `setCount(prev => prev + 1)` — each call receives the latest state; all five apply
- [ ] General rule: use functional update whenever new state depends on previous state
- [ ] Shows a real scenario: rapid button clicks or Promise-based batch updates

---

### Q6 — Object state updates ⭐⭐

**Scenario:** A profile form has `{ name, email, bio }` as a single state object. Updating the name resets email and bio to `undefined`.

**Task:** Explain why updating an object state field incorrectly loses other fields, and write a correct `updateField` pattern using spread.

**Acceptance Criteria:**
- [ ] Bug: `setProfile({ name: newName })` — replaces the whole object, losing `email` and `bio`
- [ ] Fix: `setProfile(prev => ({ ...prev, name: newName }))`
- [ ] Generic `updateField<K>(key: K, value: ProfileState[K])` using `{ ...prev, [key]: value }`
- [ ] TypeScript correctly types the key and value via a generic function
- [ ] Demonstrates that React state is replaced, not merged (unlike `this.setState` in class components)

---

### Q7 — useEffect: data fetching with cleanup ⭐⭐

**Scenario:** A dashboard page fetches user analytics when the `userId` prop changes. When the user navigates away, the fetch completes and tries to update state on an unmounted component — causing a warning.

**Task:** Write a `useEffect` that fetches analytics for `userId`, handles loading/error states, and cancels the in-flight request on cleanup using `AbortController`.

**Acceptance Criteria:**
- [ ] `useEffect(() => { ...; return () => controller.abort(); }, [userId])`
- [ ] `AbortController` created inside the effect, signal passed to `fetch`
- [ ] `AbortError` is caught and ignored (not set as error state)
- [ ] Loading state reset to `true` when `userId` changes
- [ ] Data and error state reset on each new `userId`

---

### Q8 — useEffect dependency array ⭐⭐

**Scenario:** Three developers each use `useEffect` with different dependency arrays. Each has a different bug.

**Task:** Explain the bug in each case:

```tsx
// Dev A
useEffect(() => { document.title = `${user.name}'s Dashboard`; }); // no array

// Dev B
useEffect(() => { fetchData(filter); }, []); // empty array, filter changes

// Dev C
const options = { page: 1 };
useEffect(() => { fetchData(options); }, [options]); // object in deps
```

**Acceptance Criteria:**
- [ ] Dev A: runs on every render — title updates but performance is wasted; if effect has a cleanup, it runs every render too
- [ ] Dev B: `filter` is captured from the initial render — changing `filter` doesn't re-fetch (stale closure)
- [ ] Dev C: `options` is a new object on every render — effect runs every render (infinite fetch loop)
- [ ] Dev C fix: use primitive deps `[options.page]` or `useMemo` to memoize the object
- [ ] Dev B fix: add `filter` to the deps array

---

### Q9 — useLayoutEffect vs useEffect ⭐⭐

**Scenario:** A tooltip's position is calculated after render and briefly flashes in the wrong position (top-left) before jumping to the correct position.

**Task:** Explain why `useEffect` causes the visual flash and why `useLayoutEffect` fixes it. Give a rule for when to use each.

**Acceptance Criteria:**
- [ ] `useEffect` runs **after** the browser paints — the user sees the wrong position momentarily
- [ ] `useLayoutEffect` runs **synchronously** after DOM mutations but **before** the browser paints — position is correct before the user sees anything
- [ ] Rule: use `useLayoutEffect` only for DOM measurement and visual corrections; use `useEffect` for everything else
- [ ] Notes that `useLayoutEffect` blocks painting — heavy work here causes visual lag
- [ ] Shows the render timeline: render → commit → `useLayoutEffect` → **paint** → `useEffect`

---

### Q10 — Common useEffect mistakes: 6 pitfalls ⭐⭐

**Scenario:** A code review reveals six common `useEffect` bugs across the codebase.

**Task:** Identify and explain each bug (no need to fix all — explain what's wrong):

1. Object in deps array
2. Async function as the direct effect argument
3. Missing dependency that causes stale closure
4. setInterval without clearInterval in cleanup
5. Setting state derived from another state variable inside effect
6. Infinite loop: state in deps that the effect itself updates

**Acceptance Criteria:**
- [ ] (1) New object reference every render → effect fires every render
- [ ] (2) `async` functions return a Promise — React expects cleanup function or `undefined`; fix: define async function inside and call it
- [ ] (3) Stale value captured at mount — effect never sees updates; fix: add to deps
- [ ] (4) Interval keeps running after unmount; fix: `return () => clearInterval(id)`
- [ ] (5) Derive inside render, not in effect; if unavoidable, use `useReducer`
- [ ] (6) Effect updates state → re-render → effect runs again → loop; fix: remove the state from deps or use functional update

---

### Q11 — Controlled vs uncontrolled inputs ⭐⭐

**Scenario:** A developer mixes controlled and uncontrolled inputs on a form. React logs a warning: "A component is changing an uncontrolled input to be controlled."

**Task:** Explain the difference between controlled and uncontrolled inputs. Show what causes the warning and how to fix it. Show when you might intentionally use an uncontrolled input (using `useRef`).

**Acceptance Criteria:**
- [ ] Controlled: `value` prop + `onChange` handler — React owns the value
- [ ] Uncontrolled: no `value` prop — DOM owns the value; use `ref` to read it
- [ ] Warning cause: `value={undefined}` on initial render (uncontrolled) then `value={someString}` after state loads (controlled) — React detects the switch
- [ ] Fix: initialise state as `''` (not `undefined`) so input is always controlled
- [ ] Uncontrolled use case: file inputs (React can't control them), simple forms that only need value on submit

---

### Q12 — lazy useState initialisation ⭐⭐

**Scenario:** A filter panel reads its default state from `localStorage` on every render, causing a noticeable performance hit.

**Task:** Show why `useState(readFromLocalStorage())` calls the function on every render even after the initial one. Fix it with lazy initialisation. Explain when lazy initialisation matters.

**Acceptance Criteria:**
- [ ] `useState(expensiveFn())` — the expression is evaluated before `useState` is called, on **every render**
- [ ] `useState(() => expensiveFn())` — the function is called only on the **first render**
- [ ] Lazy init matters for: `localStorage` reads, complex initial calculations, JSON parsing
- [ ] The lazy function receives no arguments
- [ ] Notes that the performance difference is only significant if `expensiveFn` is actually expensive

---

### Q13 — Render children prop pattern ⭐⭐⭐

**Scenario:** A dashboard `Panel` component needs to support both regular children and a named "header" slot, without requiring a specific child component type.

**Task:** Implement `Panel` with `children: ReactNode` and `header?: ReactNode` props. Also implement a multi-slot `Layout` component that accepts `header`, `sidebar`, and `main` as named slot props.

**Acceptance Criteria:**
- [ ] `Panel` renders `header` (if provided) above `children`
- [ ] `Layout` renders three named regions: `header`, `sidebar`, and `main`
- [ ] All slots accept any valid JSX (strings, elements, components)
- [ ] TypeScript types all slots as `ReactNode`
- [ ] Demonstrates that named slots via props are simpler and more composable than child type introspection

---

### Q14 — Component that avoids re-render ⭐⭐⭐

**Scenario:** A dashboard sidebar re-renders every time the main content changes, even though the sidebar props never change. This is expensive.

**Task:** Explain why the sidebar re-renders. Show three mechanisms to prevent it: (1) lifting the stable state out, (2) wrapping in `React.memo`, (3) using children composition to avoid passing props down.

**Acceptance Criteria:**
- [ ] Explains: by default, when a parent re-renders, all children re-render too (regardless of prop changes)
- [ ] `React.memo(Sidebar)` — skips re-render if props haven't changed (shallow comparison)
- [ ] Lifting stable state: put sidebar state at a level where main-content state changes don't affect it
- [ ] Children composition: pass sidebar as `children` to a wrapper — the wrapper re-renders but children prop (already created) doesn't change
- [ ] Notes: `React.memo` is not always the answer — profile first

---

### Q15 — Class component lifecycle mapped to hooks ⭐⭐⭐

**Scenario:** You are migrating a legacy class component to a function component. The class has four lifecycle methods.

**Task:** Show the hook equivalents for: `componentDidMount`, `componentDidUpdate` (when a specific prop changes), `componentWillUnmount`, and `getDerivedStateFromError`.

**Acceptance Criteria:**
- [ ] `componentDidMount` → `useEffect(() => { ... }, [])` (empty deps)
- [ ] `componentDidUpdate(prevProps, prevState)` when `userId` changes → `useEffect(() => { ... }, [userId])`
- [ ] `componentWillUnmount` → cleanup return in `useEffect`: `useEffect(() => { return () => { cleanup(); }; }, [])`
- [ ] `getDerivedStateFromError` → **no hook equivalent** — still requires a class component `ErrorBoundary`
- [ ] Notes that hooks cannot replace class lifecycle for error boundary use case (as of React 18)
