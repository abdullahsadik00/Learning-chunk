# Day 14 Assessment — useContext · useReducer · Custom Hooks

**Theme:** You are building a multi-step checkout flow. Cart state, authentication, and theme settings need to be shared across many components. You will also extract reusable hooks.

---

### Q1 — Prop drilling problem ⭐

**Scenario:** The cart count needs to be shown in the `Header`, `CartButton`, and `CheckoutSummary` components which are 4–6 levels deep. You are passing `cartCount` as a prop through every level.

**Task:** Describe the prop drilling problem with a concrete example. Show the first 3 levels of prop passing that could be eliminated with Context.

**Acceptance Criteria:**
- [ ] Shows `App → Layout → Header → Nav → CartButton` all receiving and passing `cartCount`
- [ ] Middle components (`Layout`, `Header`, `Nav`) don't use `cartCount` — they just forward it
- [ ] This is "prop drilling" — coupling unrelated components to data they don't need
- [ ] Context alternative: `CartButton` reads directly from context with no prop chain
- [ ] Explains when prop drilling is acceptable: 1–2 levels is fine; 3+ levels is the threshold for Context

---

### Q2 — Creating and consuming Context ⭐

**Scenario:** Implement a `ThemeContext` that provides `'light' | 'dark'` to any component in the tree.

**Task:** Write `ThemeContext`, `ThemeProvider`, and a `useTheme()` hook. Show a component consuming the theme without receiving it as a prop.

**Acceptance Criteria:**
- [ ] `const ThemeContext = createContext<'light' | 'dark'>('light')` — default value for unproviderd trees
- [ ] `ThemeProvider` wraps children with `<ThemeContext.Provider value={theme}>`
- [ ] `useTheme()` calls `useContext(ThemeContext)` and returns the value
- [ ] Consuming component: `const theme = useTheme()` — no prop needed
- [ ] Explains: if a component is outside the Provider, it gets the `createContext` default value

---

### Q3 — useReducer for complex state ⭐

**Scenario:** A shopping cart has many operations: add item, remove item, update quantity, apply coupon, clear cart. Managing this with multiple `useState` calls creates tangled update logic.

**Task:** Define a `CartState` type and a `CartAction` discriminated union. Implement a `cartReducer(state, action)` that handles all five actions.

**Acceptance Criteria:**
- [ ] `CartState = { items: CartItem[], coupon: string | null, total: number }`
- [ ] `CartAction` union: `ADD_ITEM | REMOVE_ITEM | UPDATE_QTY | APPLY_COUPON | CLEAR_CART`
- [ ] Each action type has the correct payload type
- [ ] Reducer is a pure function — returns new state objects
- [ ] `CLEAR_CART` returns the initial state — resets everything

---

### Q4 — Custom hook: useLocalStorage ⭐

**Scenario:** Multiple parts of checkout need to persist state to `localStorage` (shipping address, payment method preference). Write a reusable hook.

**Task:** Implement `useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void]`.

**Acceptance Criteria:**
- [ ] Lazy initialisation reads from `localStorage` only on mount (not every render)
- [ ] On set, writes to `localStorage` and updates state
- [ ] Handles JSON parse errors gracefully (falls back to `initialValue`)
- [ ] Cross-tab sync via `window.addEventListener('storage', ...)` with cleanup
- [ ] TypeScript generic so `useLocalStorage<ShippingAddress>('address', defaultAddress)` is type-safe

---

### Q5 — Provider value memoisation ⭐

**Scenario:** Wrapping a tree with a Context Provider causes all consumers to re-render whenever the Provider's parent re-renders, even if the context value didn't change.

**Task:** Show how to fix this by memoising the context value with `useMemo`. Explain why an unmemoised value object causes all consumers to re-render.

**Acceptance Criteria:**
- [ ] Without memo: `<Ctx.Provider value={{ user, logout }}>` — new object every render → all consumers re-render
- [ ] With memo: `const value = useMemo(() => ({ user, logout }), [user, logout])` → stable reference
- [ ] `logout` function must also be wrapped in `useCallback` for the memo to be effective
- [ ] Explains: context consumers use `Object.is` (reference equality) to determine if they need to re-render
- [ ] Notes: for primitives (string, number), memoisation is not needed

---

### Q6 — Split contexts for performance ⭐⭐

**Scenario:** `UserContext` provides both `user` (read rarely) and `setUser` (called frequently). A component that only calls `setUser` re-renders every time `user` changes.

**Task:** Split `UserContext` into `UserStateContext` and `UserDispatchContext`. Show how a dispatch-only consumer no longer re-renders when user state changes.

**Acceptance Criteria:**
- [ ] `UserStateContext = createContext<User | null>(null)` — updated when user changes
- [ ] `UserDispatchContext = createContext<Dispatch<UserAction> | null>(null)` — never changes (stable dispatch)
- [ ] Components that only call dispatch consume `UserDispatchContext` — never re-render on state changes
- [ ] State consumers subscribe to `UserStateContext` — re-render on user changes
- [ ] Explains: splitting contexts by update frequency is a key performance pattern

---

### Q7 — useReducer + Context: global cart ⭐⭐

**Scenario:** Cart state needs to be globally available and updatable from any component (Header, ProductCard, Cart page). Combine `useReducer` with Context.

**Task:** Implement `CartProvider` that exposes cart state and dispatch via two separate contexts. Write `useCartState()` and `useCartDispatch()` hooks.

**Acceptance Criteria:**
- [ ] `CartProvider` uses `useReducer(cartReducer, initialCartState)`
- [ ] `CartStateContext.Provider` wraps with `state` as value
- [ ] `CartDispatchContext.Provider` wraps with `dispatch` as value
- [ ] `useCartState()` returns state; `useCartDispatch()` returns dispatch
- [ ] Both hooks throw a helpful error if used outside the Provider

---

### Q8 — Custom hook: useFetch ⭐⭐

**Scenario:** Dozens of components fetch data from the API. Each manually manages `loading`, `error`, and `data` state with `useEffect`. Extract this into a reusable hook.

**Task:** Implement `useFetch<T>(url: string): { data: T | null, loading: boolean, error: string | null }`.

**Acceptance Criteria:**
- [ ] Accepts a URL string; re-fetches when URL changes
- [ ] Uses `AbortController` for request cancellation on URL change / unmount
- [ ] Returns `{ data, loading, error }` — all three states managed
- [ ] `loading` starts `true` and goes `false` when done (success or error)
- [ ] `AbortError` is not set as an `error` (it is expected behaviour)
- [ ] Generic `T` so callers get typed data: `useFetch<User[]>('/api/users')`

---

### Q9 — Custom hook: useToggle ⭐⭐

**Scenario:** Many components need a boolean flag with toggle, set-true, and set-false actions. Extract this to `useToggle`.

**Task:** Implement `useToggle(initialValue?: boolean)` returning `{ on, toggle, set }`.

**Acceptance Criteria:**
- [ ] `on: boolean` — current value
- [ ] `toggle()` — flips the value using functional update `(prev => !prev)`
- [ ] `set(value: boolean)` — sets to a specific value
- [ ] Optional `initialValue` defaults to `false`
- [ ] Stable references: `toggle` and `set` wrapped in `useCallback` so they don't cause unnecessary re-renders in consumers

---

### Q10 — Custom hook: useClickOutside ⭐⭐

**Scenario:** Dropdown menus, modals, and tooltips all need to close when the user clicks outside their container. Extract this logic.

**Task:** Implement `useClickOutside<T extends HTMLElement>(callback: () => void): RefObject<T>`. It returns a ref to attach to the container. When a click occurs outside that element, `callback` is called.

**Acceptance Criteria:**
- [ ] Creates a `ref` internally and returns it
- [ ] `useEffect` adds a `mousedown` event listener on `document`
- [ ] Checks `ref.current && !ref.current.contains(event.target as Node)`
- [ ] Calls `callback()` if the click is outside
- [ ] Cleanup removes the event listener on unmount or callback change
- [ ] Generic `T` ensures type-safe usage with any HTML element type

---

### Q11 — Custom hook: useForm ⭐⭐

**Scenario:** Your checkout form has 8 fields, each needing a controlled input, touched tracking, and error display. Extract this into a generic `useForm` hook.

**Task:** Implement `useForm<T extends Record<string, string>>(initialValues: T)` returning `{ values, errors, touched, handleChange, handleBlur, reset, getFieldProps }`.

**Acceptance Criteria:**
- [ ] `values` mirrors `initialValues` shape, typed with `T`
- [ ] `handleChange(e: ChangeEvent<HTMLInputElement>)` updates `values[e.target.name]`
- [ ] `handleBlur(e: FocusEvent<HTMLInputElement>)` sets `touched[e.target.name] = true`
- [ ] `reset()` restores all values to `initialValues` and clears touched/errors
- [ ] `getFieldProps(name: keyof T)` returns `{ name, value, onChange: handleChange, onBlur: handleBlur }`
- [ ] Spreading `getFieldProps('email')` onto `<input>` wires everything up in one line

---

### Q12 — Custom hook: useAsync ⭐⭐⭐

**Scenario:** An `OrderSummary` page triggers multiple async operations (fetch order, fetch tracking, send confirmation email). Each needs its own loading/success/error state machine.

**Task:** Implement `useAsync<T>()` returning `{ status, data, error, execute }`. The `status` field follows this state machine: `'idle' | 'pending' | 'success' | 'error'`.

**Acceptance Criteria:**
- [ ] Initial state: `{ status: 'idle', data: null, error: null }`
- [ ] `execute(asyncFn: () => Promise<T>)` — sets `status: 'pending'`, runs the function
- [ ] On resolve: `status: 'success'`, `data: result`
- [ ] On reject: `status: 'error'`, `error: err`
- [ ] Each `execute` call resets status to `'pending'` first
- [ ] TypeScript generic: `useAsync<Order>()` — `data` is typed as `Order | null`

---

### Q13 — Context without Provider: default value ⭐⭐

**Scenario:** A `useTheme` hook is used in a Storybook story without a `ThemeProvider`. It should still work with a sensible default rather than throwing.

**Task:** Design a context where the default value from `createContext()` is actually useful (not `null`). Explain the trade-offs between `createContext(null)` with a null-check hook vs `createContext(defaultValue)`.

**Acceptance Criteria:**
- [ ] `createContext(defaultValue)` — works outside Provider with the default
- [ ] `createContext<T | null>(null)` with `useContext` hook that throws if `null` — forces Provider use
- [ ] Trade-off: `null` default makes it impossible to accidentally use without Provider (stricter); actual default is more flexible but can silently use stale/wrong data
- [ ] Recommendation: use `null` + throwing hook for contexts that require Provider (auth, cart); use actual default for purely presentational contexts (theme)
- [ ] Shows both patterns with code

---

### Q14 — Render Props vs Custom Hooks ⭐⭐⭐

**Scenario:** You have an existing `<MouseTracker render={({ x, y }) => <div>{x}, {y}</div>} />` render-prop component. A developer wants to refactor it to a custom hook.

**Task:** (a) Show the render prop component. (b) Rewrite the logic as `useMousePosition()`. (c) Explain two reasons custom hooks are generally preferred over render props.

**Acceptance Criteria:**
- [ ] Render prop: `MouseTracker` holds position state, calls `render({ x, y })`
- [ ] Hook: `useMousePosition()` holds position state, returns `{ x, y }` — no wrapper component
- [ ] Reason 1: hooks don't add a wrapper to the component tree (no "wrapper hell" in React DevTools)
- [ ] Reason 2: hooks compose more naturally — multiple `useMousePosition` + `useWindowSize` in one component; render props nesting would be 2 levels deep
- [ ] Notes: render props are still useful for scoping a value to a specific part of JSX

---

### Q15 — useSyncExternalStore ⭐⭐⭐

**Scenario:** Your checkout page subscribes to a legacy Flux-style store that lives outside React. Direct `useEffect` + `useState` subscription works but has tearing issues in React 18 concurrent mode.

**Task:** Use `useSyncExternalStore` to subscribe to an external store's `subscribe`/`getState` API. Show how it provides a tearing-free snapshot.

**Acceptance Criteria:**
- [ ] `useSyncExternalStore(store.subscribe, store.getState, store.getServerState?)`
- [ ] `store.subscribe` receives a listener callback and returns an unsubscribe function
- [ ] `store.getState` returns the current snapshot (must be stable for same state — no new objects)
- [ ] Third arg (server snapshot) used for SSR — optional for client-only apps
- [ ] Explains tearing: without `useSyncExternalStore`, concurrent renders may read different snapshots and show inconsistent UI
- [ ] Explains why `useEffect` + `setState` is not safe in concurrent mode for external stores
