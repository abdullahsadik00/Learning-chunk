# Day 19 Assessment — Server Components · Client Components · Composition

**Theme:** You are building a large e-commerce platform with Next.js. Product pages, checkout, search, and auth are all in scope. Your task is to make correct Server/Client Component decisions throughout.

---

### Q1 — Default component type ⭐

**Scenario:** A new developer joins and asks: "Do I need to add `'use client'` to every file?"

**Task:** Explain what the default component type is in the App Router. When is `'use client'` required? When is it NOT needed?

**Acceptance Criteria:**
- [ ] Default is Server Component — every file in `app/` is server-only unless marked with `'use client'`
- [ ] `'use client'` is required when the component uses: `useState`, `useReducer`, `useEffect`, `useRef`, `useCallback`, `useMemo` (if it reads from state/context), or any browser API (`window`, `document`, `localStorage`, `navigator`)
- [ ] `'use client'` is required for event handlers: `onClick`, `onChange`, `onSubmit` etc.
- [ ] NOT needed for: components that only render static JSX, fetch data at the server, read env vars, import server-only packages
- [ ] `'use client'` is a BOUNDARY marker — it affects the entire module graph below the file that declares it

---

### Q2 — What Server Components can and cannot do ⭐

**Scenario:** List what each component type can/cannot do. A team is reviewing code PRs and needs a reference.

**Task:** Create a comparison table (prose or bullet form) covering: async/await, hooks, event handlers, DB access, env variables, browser APIs, large package imports.

**Acceptance Criteria:**
- [ ] Server Component CAN: `async/await` at component level, DB/ORM calls, read `process.env.*` directly, import heavy server-only packages (pdf, markdown), return `null`/JSX/string
- [ ] Server Component CANNOT: `useState`/`useReducer`/`useEffect`/`useRef`, `onClick`/event handlers, `window`/`document`/`localStorage`, `useContext` (can only be a provider, not a consumer)
- [ ] Client Component CAN: all React hooks, event handlers, browser APIs, third-party UI libs, Context consumers
- [ ] Client Component CANNOT: `async` at component level, direct DB access, safely read secret env vars (`NEXT_PUBLIC_` only)
- [ ] Key insight: Client Components DO run on the server during initial SSR — "Client" means "runs in the browser too", not "only runs in browser"

---

### Q3 — The 'use client' boundary ⭐

**Scenario:** A `CartProvider` component marked `'use client'` imports a `CartItem` component. Another team member says "CartItem is now a client component even though it has no `'use client'`." Is that correct?

**Task:** Explain the boundary propagation rule. Show when a component IS vs. IS NOT pulled into the client bundle.

**Acceptance Criteria:**
- [ ] YES — `'use client'` in a file makes all components imported by that file also run as Client Components
- [ ] The boundary propagates DOWN the import tree: `CartProvider` → `CartItem` → anything `CartItem` imports — all become client
- [ ] The boundary does NOT propagate UP — `CartProvider`'s parent page can still be a Server Component
- [ ] If `CartItem` should remain a server component, it must be passed as `children` or a prop FROM the server parent — not imported by `CartProvider`
- [ ] Rule: push `'use client'` as far toward the leaves as possible to minimize the client bundle

---

### Q4 — Children as slot pattern ⭐⭐

**Scenario:** A `Modal` component needs to be interactive (open/close state) but its content — a `ProductDetails` Server Component that fetches from DB — should stay on the server.

**Task:** Show the correct implementation using the "children as slot" pattern. Show the WRONG approach (importing Server Component into Client Component).

**Acceptance Criteria:**
- [ ] WRONG: `Modal.tsx` (`'use client'`) importing `ProductDetails` — makes ProductDetails a client component
- [ ] CORRECT: `Modal.tsx` (`'use client'`) accepts `children: React.ReactNode`
- [ ] CORRECT: `page.tsx` (Server Component) renders `<Modal><ProductDetails /></Modal>`
- [ ] `ProductDetails` is rendered on the server by the page, then passed as an already-rendered "slot" to `Modal`
- [ ] `Modal` sees `children` as opaque `ReactNode` — it doesn't re-render it; it just positions/shows/hides it
- [ ] This works because React renders Server Components first, THEN passes their output to Client Components

---

### Q5 — Implement AddToCart with Server Component parent ⭐⭐

**Scenario:** A product page:
- `ProductPage` (Server Component) — fetches product from DB, renders `ProductImages`, `ProductInfo`, `AddToCartButton`
- `ProductImages`, `ProductInfo` — Server Components (no interactivity)
- `AddToCartButton` — Client Component (quantity selector, cart state, click handler)

**Task:** Write `AddToCartButton` as a standalone Client Component. Show how `ProductPage` (Server Component) renders it with server-fetched `price` and `stock` as props.

**Acceptance Criteria:**
- [ ] `AddToCartButton.tsx` begins with `'use client'`
- [ ] Uses `useState` for quantity, `useTransition` for pending state
- [ ] Accepts `productId: string`, `price: number`, `stock: number` as props (serializable — no functions from server)
- [ ] `ProductPage` is async, fetches product, passes `product.price` and `product.stock` to `AddToCartButton`
- [ ] Props passed from server to client must be serializable (strings, numbers, plain objects — not class instances, Dates as objects, or functions)
- [ ] `AddToCartButton` is isolated: changing quantity state doesn't re-render `ProductImages` or `ProductInfo`

---

### Q6 — Async Server Component ⭐

**Scenario:** A `RecentOrders` component needs to fetch the last 5 orders for the current user from the database. It renders inside a Suspense boundary on the dashboard.

**Task:** Write `RecentOrders` as an async Server Component. Show how it's wrapped in Suspense in the parent. Explain what happens while the DB call is in-flight.

**Acceptance Criteria:**
- [ ] `export default async function RecentOrders({ userId }: { userId: string })` — no hooks, just `await`
- [ ] `const orders = await db.order.findMany({ where: { userId }, take: 5 })`
- [ ] Parent: `<Suspense fallback={<OrdersSkeleton />}><RecentOrders userId={session.user.id} /></Suspense>`
- [ ] While in-flight: React suspends `RecentOrders` and renders `<OrdersSkeleton />` immediately
- [ ] When DB resolves: React streams the rendered `RecentOrders` HTML to the browser, replacing the skeleton
- [ ] No `useState`, `useEffect`, or `isLoading` check inside the component — async/await is the entire loading strategy

---

### Q7 — Third-party library that requires the browser ⭐

**Scenario:** You need to add a rich text editor (`react-quill`) that uses `document`. Importing it in a Server Component causes: `ReferenceError: document is not defined`.

**Task:** Show two ways to solve this. Explain when to use `'use client'` vs `next/dynamic` with `ssr: false`.

**Acceptance Criteria:**
- [ ] Solution 1: Create a `RichEditor.tsx` wrapper with `'use client'` — imports `react-quill`; parent passes data as props
- [ ] Solution 2: `const RichEditor = dynamic(() => import('./RichEditor'), { ssr: false })` — skips SSR entirely for this component
- [ ] `'use client'` still runs the component on the server (hydration) — `document` check still fails WITHOUT `ssr: false`
- [ ] `ssr: false` + `dynamic`: the component is SKIPPED on server; only loaded in browser — correct for `document`/`window` APIs
- [ ] `loading: () => <Skeleton />` in dynamic options shows a placeholder until the client bundle loads
- [ ] Prefer `'use client'` + checking for window yourself when you want SSR content; use `ssr: false` only when the library truly can't run server-side

---

### Q8 — useContext in Server vs Client ⭐⭐

**Scenario:** A `ThemeContext` stores the current theme. A team member tries to call `useContext(ThemeContext)` inside a Server Component and gets an error.

**Task:** Explain why `useContext` doesn't work in Server Components. Show the correct pattern: Context provider as Client Component, wrapping children that can be Server Components.

**Acceptance Criteria:**
- [ ] `useContext` is a hook — hooks don't work in Server Components (no fiber runtime on server)
- [ ] Server Components can only PROVIDE context if the provider is a Client Component wrapper
- [ ] CORRECT: `ThemeProvider.tsx` (`'use client'`) wraps `{children}` in `<ThemeContext.Provider value={...}>`
- [ ] Root layout (Server Component) renders `<ThemeProvider>{children}</ThemeProvider>`
- [ ] Children of `ThemeProvider` that are Server Components still run on the server — they just can't consume the context
- [ ] If a Server Component needs theme data, pass it as a prop explicitly — or fetch from a cookie/DB on the server
- [ ] Alternative for sharing data server-side: pass data from page → layout → component via props (no context needed)

---

### Q9 — Prop serialization rules ⭐⭐

**Scenario:** A Server Component tries to pass the following to a Client Component child. Which ones will fail and why?
1. `{ id: 'abc', price: 9.99, name: 'Widget' }`
2. `new Date('2026-01-01')`
3. `(id: string) => deleteProduct(id)` — an arrow function
4. `BigInt(9007199254740993)`
5. `undefined`

**Task:** Classify each as safe or unsafe. Explain why, and show the fix for each unsafe one.

**Acceptance Criteria:**
- [ ] Plain object `{ id, price, name }`: SAFE — JSON-serializable primitives
- [ ] `new Date(...)`: UNSAFE — Date objects are not serializable as-is; fix: pass as ISO string `date.toISOString()`, parse in client with `new Date(str)`
- [ ] Arrow function: UNSAFE — functions cannot be serialized across the server/client boundary; fix: define the function inside the Client Component using `useCallback`, or use Server Actions
- [ ] `BigInt`: UNSAFE — BigInt is not JSON-serializable; fix: convert to string `String(bigInt)` and parse in client
- [ ] `undefined`: SAFE — React handles undefined props; they're simply omitted

---

### Q10 — Composition: search page ⭐⭐

**Scenario:** A product search page at `/search?q=...`:
- Server Component fetches matching products based on the query param
- Client Component manages the search input state + debounced URL updates
- Results list is a Server Component (for SEO)

**Task:** Design the component split. Show how `searchParams` flows from URL → Server Component → Client input initial value.

**Acceptance Criteria:**
- [ ] `app/search/page.tsx` (Server Component) — receives `searchParams: { q?: string }`
- [ ] Fetches products server-side: `const products = await searchProducts(searchParams.q ?? '')`
- [ ] Renders `<SearchInput initialQuery={searchParams.q ?? ''} />` (Client) + `<ProductGrid products={products} />` (Server)
- [ ] `SearchInput` (`'use client'`) manages `useState(initialQuery)` + `useRouter()` to push new URL on debounce
- [ ] When URL changes, Next.js re-renders the Server Component with new `searchParams` — fresh server fetch
- [ ] No `useEffect` needed in `ProductGrid` — data is always fresh from the server

---

### Q11 — When NOT to add 'use client' ⭐

**Scenario:** A team converted an entire Next.js codebase to Client Components "just to be safe." What's wrong with this and what are the consequences?

**Task:** List at least 4 concrete consequences of over-using `'use client'`.

**Acceptance Criteria:**
- [ ] Larger JS bundles — all imports are bundled and sent to the browser; heavy libs (lodash, markdown parsers) inflate the bundle
- [ ] No direct DB access — everything needs API routes, adding latency and boilerplate
- [ ] SEO risk — Client Components that fetch data with `useEffect` leave the initial HTML empty for crawlers
- [ ] Security risk — `process.env.MY_SECRET` leaks to the browser (Next.js warns, but it's a real risk)
- [ ] More waterfalls — useEffect fetching creates client-side request waterfalls (fetch after mount) vs. server-side parallel fetches
- [ ] Hydration cost — all Client Components must be hydrated in the browser, adding CPU time on load

---

### Q12 — Streaming with multiple Suspense boundaries ⭐⭐

**Scenario:** A dashboard page has three independent data sources: user stats (fast, 200ms), revenue chart (slow, 1.5s), and recent activity (medium, 800ms). Without Suspense, the whole page blocks for 1.5s.

**Task:** Show the correct structure with three independent Suspense boundaries. Explain what the user experience is with vs. without streaming.

**Acceptance Criteria:**
- [ ] Three async Server Components: `<StatsSection />`, `<RevenueChart />`, `<ActivityFeed />`
- [ ] Each wrapped in its own `<Suspense fallback={<SkeletonN />}>`
- [ ] WITH streaming: browser receives shell + three skeletons in ~50ms; StatsSection fills in at 200ms; ActivityFeed at 800ms; Chart at 1500ms — progressive
- [ ] WITHOUT streaming: entire page waits 1500ms (slowest component) before the browser receives ANY HTML
- [ ] loading.tsx wraps the WHOLE page in one Suspense — use manual Suspense for component-level control
- [ ] Each Suspense boundary is independent — one slow component doesn't block others

---

### Q13 — Server Action called from Client Component ⭐⭐

**Scenario:** A `DeleteButton` Client Component calls a Server Action when clicked. The action deletes the item from the DB and revalidates the product list page.

**Task:** Write the Server Action and the Client Component that calls it. Show the import. Explain why this is secure even though the function is called from the browser.

**Acceptance Criteria:**
- [ ] `actions/products.ts` with `'use server'` directive: `export async function deleteProduct(id: string) { await db.product.delete(...); revalidatePath('/products'); }`
- [ ] `DeleteButton.tsx` (`'use client'`): imports `deleteProduct`, calls it in `onClick`
- [ ] Secure because: the function always runs on the server — the browser sends a POST request to a Next.js-generated endpoint; the actual DB code never reaches the browser
- [ ] Next.js creates a unique hashed URL for each Server Action — not guessable; still should verify auth inside the action
- [ ] Auth check inside action: `const session = await auth(); if (!session) throw new Error('Unauthorized')`
- [ ] `revalidatePath` or `revalidateTag` inside the Server Action clears the cache after mutation

---

### Q14 — Shared data between Server and Client ⭐⭐

**Scenario:** A `ProductPage` Server Component fetches a product. It needs to pass this data to both:
1. `ProductInfo` (Server Component — renders title, description, price statically)
2. `AddToCartButton` (Client Component — needs `productId` and `price`)

**Task:** Show how the server component distributes data to both. Explain the constraint on what `AddToCartButton` can receive.

**Acceptance Criteria:**
- [ ] `ProductPage` fetches once: `const product = await getProduct(id)` — no double-fetch
- [ ] Passes full `product` to `ProductInfo` — Server Component can receive any object (even non-serializable)
- [ ] Passes only serializable subset to `AddToCartButton`: `productId={product.id} price={product.price}`
- [ ] DO NOT pass the whole product object unless all fields are serializable — avoids unintended data exposure and serialization errors
- [ ] The split between SC and CC is also a security boundary — only expose to the client what the client needs
- [ ] `product.secretCostPrice` should NOT be passed to the Client Component even if technically serializable

---

### Q15 — Full architecture review ⭐⭐⭐

**Scenario:** A team is building an e-commerce checkout. Review this proposed component tree and identify ALL mistakes:

```
app/checkout/page.tsx  ('use client')
  └── CheckoutLayout  ('use client')
       ├── CartSummary  (Server Component) ← imported by CheckoutLayout
       ├── ShippingForm ('use client')
       └── PaymentForm  ('use client')
            └── StripeProvider ('use client')
                 └── CardElement  (Server Component) ← imported by StripeProvider
```

**Task:** List every mistake, explain why it's wrong, and provide the correct structure.

**Acceptance Criteria:**
- [ ] Mistake 1: `page.tsx` is `'use client'` unnecessarily — pages can be Server Components; they don't need interactivity themselves
- [ ] Mistake 2: `CartSummary` (SC) imported BY `CheckoutLayout` (CC) — cannot import Server Components from Client Components; CartSummary becomes a client component accidentally
- [ ] Mistake 3: `CardElement` (SC) imported BY `StripeProvider` (CC) — same issue; CardElement can't be server-side if imported from a client boundary
- [ ] Fix for Mistake 1: remove `'use client'` from page.tsx; let it be a Server Component that fetches cart data and passes it down
- [ ] Fix for Mistake 2: page.tsx (SC) renders `<CartSummary />` and `<CheckoutLayout />` separately, or passes `<CartSummary />` as `children` to `CheckoutLayout`
- [ ] Fix for Mistake 3: `StripeProvider` accepts `{children}` — parent (SC) passes `<CardElement />` as children
- [ ] Correct tree: page (SC) → fetches data, renders CartSummary (SC) + `<CheckoutLayout>{/* ShippingForm (CC) + StripeProvider (CC) with CardElement as children */}</CheckoutLayout>`
