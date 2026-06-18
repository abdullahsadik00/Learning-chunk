# Day 13 Assessment — useRef · useMemo · useCallback · forwardRef

**Theme:** Your dashboard has expensive charts, large data tables, and reusable input components that need external control. Performance and API design are the focus.

---

### Q1 — useRef vs useState ⭐

**Scenario:** A developer uses `useState` to store an interval ID. The component re-renders every time the timer starts or stops, causing visible flicker.

**Task:** Explain the key difference between `useRef` and `useState`. Rewrite the interval storage to use `useRef` instead.

**Acceptance Criteria:**
- [ ] `useState`: changing state triggers a re-render; used for data that affects the UI
- [ ] `useRef`: changing `.current` does NOT trigger a re-render; used for values you need to persist across renders without causing re-renders
- [ ] `intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)`
- [ ] `intervalRef.current = setInterval(...)` — no re-render on assignment
- [ ] Cleanup: `clearInterval(intervalRef.current)` in the return of `useEffect`

---

### Q2 — DOM reference with useRef ⭐

**Scenario:** A search dashboard needs to focus the search input automatically when a keyboard shortcut is pressed (`Ctrl+K`).

**Task:** Write a component that: (a) attaches a `ref` to an `<input>`, (b) adds a `keydown` listener for `Ctrl+K`, and (c) calls `inputRef.current?.focus()` on the shortcut.

**Acceptance Criteria:**
- [ ] `inputRef = useRef<HTMLInputElement>(null)`
- [ ] `<input ref={inputRef} />` attaches the ref
- [ ] `useEffect` adds and removes the `keydown` listener with cleanup
- [ ] `if (e.ctrlKey && e.key === 'k') inputRef.current?.focus()`
- [ ] Optional chaining (`?.`) used because `current` could be `null` before mount

---

### Q3 — Storing previous value ⭐

**Scenario:** A metric card needs to display the change from the last value (e.g. "↑ from 1,200"). There is no prop for the previous value.

**Task:** Implement a `usePrevious<T>(value: T): T | undefined` hook that always returns the value from the previous render.

**Acceptance Criteria:**
- [ ] `const ref = useRef<T>()`
- [ ] `useEffect(() => { ref.current = value; })` — no deps array (runs after every render)
- [ ] Returns `ref.current` (previous render's value, before the effect updates it)
- [ ] On first render, returns `undefined`
- [ ] On second render, returns the initial value

---

### Q4 — useMemo for expensive computation ⭐

**Scenario:** A data table filters and sorts 50,000 rows. The filter runs on every render — even when unrelated state changes (e.g. a sidebar toggle) cause a re-render.

**Task:** Wrap the filter+sort in `useMemo`. Demonstrate that it only recomputes when `data`, `filter`, or `sortKey` change.

**Acceptance Criteria:**
- [ ] `const processed = useMemo(() => { ... }, [data, filter, sortKey])`
- [ ] `console.log('computing...')` inside the memo should not fire when an unrelated state changes
- [ ] Return value is a new array (does not mutate `data`)
- [ ] Explains: `useMemo` caches the result; if deps haven't changed, the cached value is returned
- [ ] Notes: do NOT useMemo for trivial computations (the memo overhead exceeds the savings)

---

### Q5 — useCallback for stable function references ⭐

**Scenario:** A table cell component is wrapped in `React.memo`. Its parent passes an `onCellClick` handler. The cell still re-renders on every parent render because the handler is a new function each time.

**Task:** Wrap `onCellClick` in `useCallback`. Explain why a new function reference causes `React.memo` to fail.

**Acceptance Criteria:**
- [ ] `const onCellClick = useCallback((id: string) => { setSelected(id); }, [])`
- [ ] Explains: `React.memo` uses shallow comparison — a new function reference fails `===` comparison even with the same logic
- [ ] Without `useCallback`: new function every render → memo is useless
- [ ] With `useCallback` and empty deps: same function reference → memo skips re-render
- [ ] Explains that `setSelected` from `useState` is stable (doesn't need to be in deps)

---

### Q6 — Stale closure fix with useRef ⭐⭐

**Scenario:** A dashboard alert fires 3 seconds after clicking a button. Between click and alert, the user updates a counter. The alert always shows the count from when the button was clicked (stale).

**Task:** Fix the stale closure using `useRef` to always read the latest counter value in the timeout callback.

**Acceptance Criteria:**
- [ ] `countRef = useRef(count)` — initialise with current count
- [ ] `useEffect(() => { countRef.current = count; }, [count])` — keep ref in sync
- [ ] `setTimeout(() => { alert(countRef.current); }, 3000)` — reads from ref, always fresh
- [ ] Explains: the timeout callback closes over `countRef` (object reference, stable), not `count` (value, stale)
- [ ] Demonstrates that `count` inside the callback would always be the value at click time

---

### Q7 — useMemo for referential equality ⭐⭐

**Scenario:** A memoised `Chart` component receives a `config = { theme: 'dark', gridLines: true }` object from its parent. The chart re-renders on every parent render because the object is created inline.

**Task:** Fix the parent to produce a stable `config` reference using `useMemo`. Explain why the object literal causes the problem.

**Acceptance Criteria:**
- [ ] `const config = useMemo(() => ({ theme: 'dark', gridLines: true }), [])` — stable reference
- [ ] Without `useMemo`: `{}` creates a new object every render; `===` comparison fails; memo skips nothing
- [ ] `React.memo` uses shallow comparison — two different objects with same content are NOT equal by `===`
- [ ] `useMemo` with empty deps returns the **same object reference** across renders
- [ ] Explains: `useMemo` is not just for computation cost — it's also for stabilising references

---

### Q8 — forwardRef to expose DOM node ⭐⭐

**Scenario:** A reusable `SearchInput` component wraps a native `<input>`. The parent dashboard needs to call `.focus()` on it programmatically, but `ref` can't be passed to a function component without `forwardRef`.

**Task:** Wrap `SearchInput` with `forwardRef` so the parent can attach a ref directly to the underlying `<input>`.

**Acceptance Criteria:**
- [ ] `const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>((props, ref) => <input ref={ref} {...props} />)`
- [ ] Parent: `const ref = useRef<HTMLInputElement>(null); <SearchInput ref={ref} />`
- [ ] `ref.current.focus()` works from the parent
- [ ] `forwardRef` preserves all other props via spread
- [ ] Sets `SearchInput.displayName = 'SearchInput'` for React DevTools

---

### Q9 — useImperativeHandle ⭐⭐

**Scenario:** A `VideoPlayer` component is used in a media dashboard. The parent needs to call `play()`, `pause()`, and `seek(seconds)` — but should not get direct access to the `<video>` DOM element (which would allow arbitrary mutations).

**Task:** Use `useImperativeHandle` to expose only `play`, `pause`, and `seek` on the ref. Define a `VideoHandle` interface for TypeScript.

**Acceptance Criteria:**
- [ ] `interface VideoHandle { play(): void; pause(): void; seek(s: number): void; }`
- [ ] `const VideoPlayer = forwardRef<VideoHandle, VideoProps>((props, ref) => { ... })`
- [ ] `useImperativeHandle(ref, () => ({ play: () => videoRef.current?.play(), pause: ..., seek: ... }), [])`
- [ ] Parent ref typed as `useRef<VideoHandle>(null)` — cannot access `videoRef.current.volume` (not exposed)
- [ ] Explains: `useImperativeHandle` is for the principle of least privilege — expose only what callers need

---

### Q10 — Callback ref for measurement ⭐⭐

**Scenario:** A tooltip component needs to measure the element it wraps as soon as it mounts, but `useRef` doesn't trigger a re-render when the element mounts.

**Task:** Implement a callback ref that measures the element's height immediately on mount. Explain why `useRef` alone doesn't work here.

**Acceptance Criteria:**
- [ ] `const measuredRef = useCallback((node: HTMLDivElement | null) => { if (node) setHeight(node.getBoundingClientRect().height); }, [])`
- [ ] `<div ref={measuredRef}>...</div>` — callback is called with the DOM node on mount
- [ ] `useRef` problem: assigning `ref.current` doesn't trigger a re-render, so the component shows `0` height initially
- [ ] Callback ref is a function — React calls it with `null` on unmount and with the node on mount
- [ ] `useCallback` with empty deps ensures the same callback reference (important — if a new function is passed every render, the element unmounts/remounts)

---

### Q11 — useMemo for derived state ⭐⭐

**Scenario:** A dashboard displays total revenue calculated from a list of orders. A developer puts the calculation in a `useEffect` and stores the result in another state variable.

**Task:** Explain why putting derived state in `useEffect` + `useState` is an anti-pattern. Rewrite it using `useMemo`.

**Acceptance Criteria:**
- [ ] Problem with effect: derived state causes an extra render cycle (state update → re-render → effect → setState → re-render)
- [ ] Problem: introduces a transient inconsistency — during the first render, the derived state shows a stale/default value
- [ ] Fix: `const totalRevenue = useMemo(() => orders.reduce((sum, o) => sum + o.total, 0), [orders])`
- [ ] `useMemo` runs synchronously during render — no extra render cycle
- [ ] General rule: if a value can be computed from props or state, compute it during render (with or without memo)

---

### Q12 — When NOT to use useMemo/useCallback ⭐⭐⭐

**Scenario:** A developer has added `useMemo` and `useCallback` to every function and computed value in the codebase "for performance". A code review flags this.

**Task:** Explain three scenarios where `useMemo`/`useCallback` add overhead without benefit. State the decision criteria for when they ARE justified.

**Acceptance Criteria:**
- [ ] Scenario 1: memoizing trivial computation (`count * 2`) — memo overhead > computation cost
- [ ] Scenario 2: `useCallback` on a function passed to a non-memo'd child — the child re-renders anyway
- [ ] Scenario 3: `useMemo` on a value that changes on every render anyway — memo cache is invalidated every time, adding overhead for nothing
- [ ] When justified: (1) expensive computation (sort/filter 10k+ items), (2) value passed to `React.memo`'d child, (3) value used as a dep in another `useMemo`/`useCallback`/`useEffect`
- [ ] Golden rule: profile first; premature memoization is its own performance problem

---

### Q13 — Multiple refs in a list ⭐⭐⭐

**Scenario:** A virtual keyboard component renders 26 keys and needs a ref for each to animate them individually. You cannot call `useRef` in a loop (violates Rules of Hooks).

**Task:** Show how to create a stable map of refs for a dynamic number of elements using a single `useRef` that holds a `Map` or object.

**Acceptance Criteria:**
- [ ] `const keyRefs = useRef<Map<string, HTMLButtonElement>>(new Map())`
- [ ] Each button: `ref={(el) => { if (el) keyRefs.current.set(key, el); else keyRefs.current.delete(key); }}`
- [ ] `keyRefs.current.get('A')?.animate(...)` works after mount
- [ ] No `useRef` calls in a loop — one `useRef` holds the whole map
- [ ] On unmount of individual keys, the cleanup callback (`el === null`) removes the entry

---

### Q14 — forwardRef + useImperativeHandle for a form field ⭐⭐⭐

**Scenario:** A custom `PhoneInput` compound component (wraps country code + number) needs to expose `focus()` and `getValue(): string` to a parent form. The parent should not access the internal `<input>` elements.

**Task:** Implement `PhoneInput` with `forwardRef` and `useImperativeHandle`. The handle exposes `focus()` (focuses the number input) and `getValue()` (returns `countryCode + number`).

**Acceptance Criteria:**
- [ ] `interface PhoneHandle { focus(): void; getValue(): string; }`
- [ ] `forwardRef<PhoneHandle, PhoneInputProps>`
- [ ] `useImperativeHandle(ref, () => ({ focus: () => numberInputRef.current?.focus(), getValue: () => countryCode + number }), [countryCode, number])`
- [ ] Dependencies `[countryCode, number]` ensure `getValue` always returns fresh data
- [ ] Parent accesses via `phoneRef.current.getValue()` — no direct DOM access

---

### Q15 — useWhyDidYouUpdate debugging hook ⭐⭐⭐

**Scenario:** A dashboard table component re-renders unexpectedly. You need a development-only hook that logs which props or state values changed to cause the re-render.

**Task:** Implement `useWhyDidYouUpdate<T extends Record<string, unknown>>(name: string, props: T): void`. It should log the component name and which props changed (showing old and new values) after every render.

**Acceptance Criteria:**
- [ ] `const prevRef = useRef<T>(props)` — stores previous render's props
- [ ] `useEffect(() => { ... })` — no deps (runs after every render)
- [ ] Compares each key: `if (prev[key] !== props[key])` records `{ from: prev[key], to: props[key] }`
- [ ] Logs: `[why-did-you-update] ComponentName` with the changed keys object
- [ ] Updates `prevRef.current = props` after comparison
- [ ] Works with any component by adding `useWhyDidYouUpdate('MyComponent', { prop1, prop2, ... })`
