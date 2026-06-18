# Day 16 Assessment — State Management · React Patterns

**Theme:** You are building an admin panel with real-time data, complex global state, and a reusable design system. Components need to share state efficiently and be composable without prop drilling.

---

### Q1 — When NOT to use Context ⭐

**Scenario:** A developer wraps the entire app in a single `AppContext` that holds user, cart, theme, notifications, and UI flags. Performance suffers — every update re-renders the whole tree.

**Task:** Explain three signs that Context is being overused. Give the correct alternative for each.

**Acceptance Criteria:**
- [ ] Sign 1: Context value changes frequently (every keystroke) → use local state + controlled input, not context
- [ ] Sign 2: Context holds large, complex state with many separate concerns → split into multiple focused contexts
- [ ] Sign 3: Value is used by only 1–2 components → just prop-drill; context adds indirection for no gain
- [ ] Correct alternative for frequent updates: `useReducer` at the relevant component level + local event handlers
- [ ] Correct alternative for cross-cutting data: external store (Zustand) subscribed per-component instead of one global re-render
- [ ] The rule: Context is for data that is truly global and changes rarely (auth, theme, locale)

---

### Q2 — Zustand: basic store ⭐

**Scenario:** The admin panel needs a notification counter shared by the sidebar, header badge, and notification panel. Using Context caused performance issues.

**Task:** Describe the shape of a Zustand notification store. Show `create()` with state + actions. Show how two components subscribe — one reads count, the other calls `clearAll`.

**Acceptance Criteria:**
- [ ] `useNotificationStore = create((set) => ({ count: 0, notifications: [], addNotification, clearAll }))`
- [ ] `addNotification` uses `set(state => ({ ... }))` to return new state
- [ ] `clearAll` sets `count: 0, notifications: []`
- [ ] Component A: `const count = useNotificationStore(state => state.count)` — re-renders ONLY when count changes
- [ ] Component B: `const clearAll = useNotificationStore(state => state.clearAll)` — never re-renders (functions are stable)
- [ ] Explains the selector advantage: each component subscribes to a slice, not the whole store

---

### Q3 — React Query: useQuery basics ⭐

**Scenario:** Multiple admin screens fetch the same `/api/users` list. Without React Query, each screen makes a fresh fetch on mount — wasteful and inconsistent.

**Task:** Describe what React Query does differently. Show `useQuery({ queryKey, queryFn })` usage and explain the five states it manages automatically.

**Acceptance Criteria:**
- [ ] React Query caches by `queryKey` — second component mounting with the same key reads from cache (no re-fetch)
- [ ] `const { data, isLoading, isError, isFetching, error } = useQuery({ queryKey: ['users'], queryFn: fetchUsers })`
- [ ] `isLoading`: first load, no cached data yet
- [ ] `isError`: query failed, `error` is populated
- [ ] `isFetching`: any request in progress (including background refetch)
- [ ] `data`: cached data (may be present during background refetch — stale-while-revalidate)
- [ ] Background refetch happens automatically on window focus (configurable via `staleTime`)

---

### Q4 — Compound Component: basics ⭐

**Scenario:** A design system `Tabs` component must support flexible tab content without dictating structure. Consumers should compose it like HTML, not pass everything as props.

**Task:** Explain what a Compound Component is and why it's better than a monolithic props API for flexible composition. Show the usage difference between the two approaches.

**Acceptance Criteria:**
- [ ] Monolithic: `<Tabs tabs={[{ label: 'A', content: <div/> }]} />` — inflexible, can't insert extra elements, hard to extend
- [ ] Compound: `<Tabs><Tabs.List>...</Tabs.List><Tabs.Panel>...</Tabs.Panel></Tabs>` — consumer controls structure
- [ ] Components share state via Context (not prop drilling)
- [ ] `Tabs.List` and `Tabs.Panel` are either static properties (`Tabs.List = TabsList`) or standalone named exports
- [ ] Benefit: each sub-component can be wrapped, reordered, or replaced without changing the parent API

---

### Q5 — HOC basics ⭐

**Scenario:** Several admin screens require authentication. Instead of duplicating the auth redirect check in every component, you want a `withAuth` Higher Order Component.

**Task:** Describe what a HOC does (in terms of component transformation) and show `withAuth<P>(Component)`. It should redirect to `/login` if the user is not authenticated and render `Component` otherwise.

**Acceptance Criteria:**
- [ ] HOC = a function that takes a component and returns a new enhanced component
- [ ] `function withAuth<P extends object>(Component: ComponentType<P>): ComponentType<P>`
- [ ] Inside, reads auth state (`useAuth()` hook or context)
- [ ] If not authenticated: `<Navigate to="/login" />` (React Router) or redirects
- [ ] If authenticated: renders `<Component {...props} />`
- [ ] Sets `displayName`: `WrappedComponent.displayName = \`withAuth(\${Component.displayName})\``

---

### Q6 — React Query: useMutation with optimistic update ⭐⭐

**Scenario:** An admin table lets users toggle a user's `isActive` status. The toggle should feel instant — update the UI immediately, then sync to the server. If the server fails, revert.

**Task:** Show `useMutation` with `onMutate` (optimistic), `onError` (rollback), and `onSettled` (invalidate). Explain the three-phase pattern.

**Acceptance Criteria:**
- [ ] `onMutate`: cancel in-flight queries, snapshot previous data, apply optimistic update via `queryClient.setQueryData`
- [ ] `onError`: call `queryClient.setQueryData` with the snapshot (rollback)
- [ ] `onSettled`: call `queryClient.invalidateQueries` to force a fresh server fetch
- [ ] Explains: the snapshot from `onMutate` is passed as `context` to `onError`
- [ ] Shows that the user sees the update immediately but sees a rollback if the API call fails

---

### Q7 — Zustand: middleware (persist + devtools) ⭐⭐

**Scenario:** The admin panel's sidebar collapse state needs to survive page refresh. Zustand's `persist` middleware saves it to `localStorage`. Adding devtools allows time-travel debugging.

**Task:** Show how to compose `devtools` and `persist` middleware with Zustand. Explain the middleware order and how `partialState` prevents persisting sensitive data.

**Acceptance Criteria:**
- [ ] `create(devtools(persist(stateCreator, { name: 'sidebar' })))`
- [ ] Middleware wraps from outside in: devtools wraps persist, persist wraps the state creator
- [ ] `persist` automatically reads from `localStorage` on init, writes on state changes
- [ ] `partialize: (state) => ({ isCollapsed: state.isCollapsed })` — only persists `isCollapsed`, not auth tokens or sensitive fields
- [ ] Redux DevTools shows state history and allows time-travel to previous states
- [ ] Notes: `immer` middleware can also be composed for mutable-style updates

---

### Q8 — Render Props pattern ⭐⭐

**Scenario:** A data table needs to support custom row rendering for different pages. The table handles sorting and pagination logic; each page provides its own row template.

**Task:** Implement a `DataTable` component using the render prop pattern. It should expose `{ sortedData, onSort }` to the consumer's render function. Show two callsites with different row layouts.

**Acceptance Criteria:**
- [ ] `DataTable` accepts `renderRow: (item: T, index: number) => ReactNode`
- [ ] `DataTable` manages sort state internally
- [ ] Passes sorted data to `children` function: `children({ items: sortedItems, onSort })`
- [ ] Or uses an explicit `render` prop: `render(({ items, onSort }) => <tr>...</tr>)`
- [ ] Two callsites show different row layouts using the same `DataTable` for sorting logic
- [ ] Explains: render props share logic without affecting the component hierarchy (vs HOCs which add wrappers)

---

### Q9 — Headless component pattern ⭐⭐

**Scenario:** Your design system needs a `Combobox` (searchable dropdown) where each team can style it differently. The logic (keyboard navigation, filtering, accessibility) must be shared; the visual rendering is up to the consumer.

**Task:** Describe the headless component pattern. Show a `useCombobox` hook that exposes `getInputProps`, `getListProps`, and `getItemProps`. The consumer renders whatever HTML structure they want.

**Acceptance Criteria:**
- [ ] Headless: the hook owns ALL logic (state, keyboard events, ARIA attributes) but renders NOTHING
- [ ] `getInputProps()` returns `{ value, onChange, onKeyDown, role: 'combobox', 'aria-expanded', 'aria-autocomplete' }`
- [ ] `getListProps()` returns `{ role: 'listbox', 'aria-label' }`
- [ ] `getItemProps(item, index)` returns `{ role: 'option', 'aria-selected', onClick, onMouseOver }`
- [ ] Consumer spreads these onto any HTML they choose (different teams use different class names / styling libraries)
- [ ] Explains: this pattern is used by libraries like Headless UI, Radix, and Downshift

---

### Q10 — React Query: useInfiniteQuery ⭐⭐

**Scenario:** An admin user list needs infinite scrolling. The API uses cursor-based pagination (`?cursor=xxx`). When the user scrolls to the bottom, the next page loads automatically.

**Task:** Show `useInfiniteQuery` with `getNextPageParam`. Show how to flatten pages into a single item list and how `fetchNextPage` is triggered from an `IntersectionObserver`.

**Acceptance Criteria:**
- [ ] `useInfiniteQuery({ queryKey: ['users'], queryFn: ({ pageParam }) => fetchUsers(pageParam), getNextPageParam: (last) => last.nextCursor })`
- [ ] `data.pages` is an array of pages; flatten with `data.pages.flatMap(page => page.users)`
- [ ] `hasNextPage` — false when `getNextPageParam` returns `undefined` or `null`
- [ ] `IntersectionObserver` on the last list item calls `fetchNextPage()` when visible
- [ ] `isFetchingNextPage` shows a loading indicator at the bottom while the next page loads
- [ ] `fetchNextPage` is a no-op if `hasNextPage` is false or a fetch is in progress

---

### Q11 — Compound Component with Context ⭐⭐

**Scenario:** Implement a `Select` compound component for the design system: `<Select>`, `<Select.Trigger>`, `<Select.List>`, `<Select.Option>`. The trigger opens/closes the list. The selected option updates the trigger label.

**Task:** Show the internal architecture: what state is shared via Context, which sub-component reads which slice, and how `onChange` bubbles up.

**Acceptance Criteria:**
- [ ] `SelectContext` provides: `{ value, open, setOpen, onChange }`
- [ ] `Select` is the Provider; it holds `value` state and `open` state
- [ ] `Select.Trigger` reads `open` and calls `setOpen(!open)` on click; displays `value` or placeholder
- [ ] `Select.List` reads `open` — renders `null` when closed
- [ ] `Select.Option` calls `onChange(optionValue)` on click, closes the list via `setOpen(false)`
- [ ] `Select` fires its `onValueChange` prop when internal `onChange` is called

---

### Q12 — Zustand: slices pattern ⭐⭐⭐

**Scenario:** Your admin panel store has grown to 15+ actions across auth, notifications, and UI state. All in one `create()` call is unmanageable.

**Task:** Explain the Zustand slices pattern. Show how to split into `authSlice`, `notificationSlice`, and `uiSlice`, then combine them in one store. Show a component using state from two different slices.

**Acceptance Criteria:**
- [ ] Each slice is a function: `(set, get) => ({ ...stateAndActions })`
- [ ] Combined: `create<AuthSlice & NotificationSlice & UiSlice>()((...a) => ({ ...authSlice(...a), ...notificationSlice(...a), ...uiSlice(...a) }))`
- [ ] `set` in each slice can see and modify the full state (not just its own slice)
- [ ] Component uses selectors from different slices: `const user = useStore(s => s.user)` and `const count = useStore(s => s.notifCount)`
- [ ] Explains: slices are a pattern, not a built-in Zustand feature — they are plain functions composed with spread

---

### Q13 — HOC composition ⭐⭐⭐

**Scenario:** A dashboard component needs three cross-cutting concerns: `withAuth` (redirect if not logged in), `withLoading` (show spinner while data loads), and `withErrorBoundary` (isolate crashes).

**Task:** Show how to compose all three HOCs without deep nesting. Explain the execution order of wrapped HOCs. Identify one risk of HOC composition and how to avoid it.

**Acceptance Criteria:**
- [ ] Nested: `withAuth(withLoading(withErrorBoundary(Dashboard)))` — works but hard to read
- [ ] `compose(withAuth, withLoading, withErrorBoundary)(Dashboard)` using a utility
- [ ] Execution order: `withAuth` runs first (outermost), then `withLoading`, then `withErrorBoundary`, then `Dashboard`
- [ ] Risk: prop collision — if two HOCs inject a prop with the same name, the inner one is silently overwritten
- [ ] Fix: namespace injected props (`auth_user`, `loading_status`) or document props carefully
- [ ] Each HOC should set `displayName` to preserve the name in React DevTools

---

### Q14 — React Query: dependent queries and prefetching ⭐⭐⭐

**Scenario:** The admin panel shows an order detail page. It needs the order data first, then the customer details using `order.customerId`. A hover on an order row should prefetch the order detail before navigation.

**Task:** Show a dependent query (second query waits for first). Show `queryClient.prefetchQuery` called from an `onMouseEnter` handler.

**Acceptance Criteria:**
- [ ] Order query: `useQuery({ queryKey: ['order', orderId], queryFn: fetchOrder })`
- [ ] Customer query: `useQuery({ queryKey: ['customer', order?.customerId], queryFn: () => fetchCustomer(order.customerId), enabled: !!order?.customerId })`
- [ ] `enabled: false` prevents the customer query from running until `order.customerId` is available
- [ ] Hover prefetch: `queryClient.prefetchQuery({ queryKey: ['order', id], queryFn: () => fetchOrder(id) })`
- [ ] When the user navigates, the data is already cached — navigation feels instant
- [ ] `staleTime` should be set on prefetch so the data isn't immediately considered stale

---

### Q15 — Combined pattern: Headless + Compound + Context ⭐⭐⭐

**Scenario:** You are designing a `Modal` system that must be: (1) accessible (focus trap, Escape key), (2) composable (`<Modal.Header>`, `<Modal.Body>`, `<Modal.Footer>`), (3) usable as a headless hook (`useModal`) so design teams can build their own trigger buttons.

**Task:** Design (without full code) the architecture that satisfies all three requirements. Name the pieces, their responsibilities, and how they interact.

**Acceptance Criteria:**
- [ ] `useModal()` hook: owns `isOpen`, `open()`, `close()`, `toggle()` — returns state + stable callbacks
- [ ] `Modal` compound component: reads `isOpen` from a `ModalContext`, renders children only when open
- [ ] `ModalContext` provided by `Modal` component — sub-components read from it without props
- [ ] `Modal.Header`, `Modal.Body`, `Modal.Footer` are pure layout sub-components — no logic
- [ ] `Modal` wraps children in `createPortal(children, document.body)` to escape stacking contexts
- [ ] `useModal` can be used WITHOUT `Modal` compound component — gives full layout control to the consumer
- [ ] Headless hook + compound component is the industry pattern used by Radix UI, Headless UI, and shadcn/ui
