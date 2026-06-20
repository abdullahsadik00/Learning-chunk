# Day 23 Assessment — API Client · React Query Advanced Patterns · Optimistic Updates · Caching

**Theme:** You are the data layer owner for a high-traffic e-commerce platform. The app uses React Query for server state. You need to design robust data fetching, handle failures gracefully, and implement a smooth UX with optimistic updates.

---

### Q1 — Why a Dedicated ApiClient Class ⭐

**Scenario:** The codebase has 47 components each calling `fetch('/api/...')` directly. Auth tokens are added inconsistently — some calls include them, some forget. Error handling differs in every file: some throw, some return null, some log to console. A new intern merged a PR that broke the base URL in production.

**Task:** Explain why a centralized `ApiClient` class solves these problems and show its essential structure.

**Acceptance Criteria:**
- [ ] Identifies the three problems with scattered `fetch`: inconsistent auth headers, inconsistent error handling, hardcoded base URLs
- [ ] Shows an `ApiClient` class or module with a base URL configured from an environment variable
- [ ] Implements a single `request<T>()` method that all other methods delegate to
- [ ] Adds auth token injection in one place (interceptor pattern or request wrapper)
- [ ] Throws typed errors (e.g., `ApiError` with `status`, `message`, `data` fields) so callers can catch predictably
- [ ] Explains that this is the single place to add logging, retry logic, and request cancellation later

---

### Q2 — React Query Key Factories ⭐

**Scenario:** The product listing page uses `useQuery(['products'])`, the product detail page uses `useQuery(['product', id])`, and the admin panel uses `useQuery(['products', 'admin'])`. When an admin updates a product, you call `queryClient.invalidateQueries()` but you're not sure what to pass — the key structure is inconsistent across files.

**Task:** Explain what query key factories solve, define a naming convention, and implement a `productKeys` factory.

**Acceptance Criteria:**
- [ ] Explains that query key factories centralize key definitions so invalidation is consistent and typo-proof
- [ ] Shows a `productKeys` object with: `all`, `lists()`, `list(filters)`, `details()`, `detail(id)` methods
- [ ] Demonstrates how `queryClient.invalidateQueries({ queryKey: productKeys.lists() })` invalidates all list queries
- [ ] Shows that `productKeys.detail(id)` returns `['products', 'detail', id]` — an array that React Query matches hierarchically
- [ ] Explains the hierarchy: invalidating `['products']` invalidates all product queries; invalidating `['products', 'detail']` only invalidates detail queries
- [ ] Notes that key factories are plain objects with functions — no library needed

---

### Q3 — staleTime vs gcTime ⭐

**Scenario:** A teammate set `staleTime: 0` everywhere "to always get fresh data" and `gcTime: Infinity` "to keep data in memory forever." Users report that every navigation triggers a loading spinner and memory usage grows over long sessions.

**Task:** Explain what `staleTime` and `gcTime` (formerly `cacheTime`) each control, what the teammate got wrong, and recommend appropriate values for a product listing endpoint.

**Acceptance Criteria:**
- [ ] Defines `staleTime`: how long a successful response is considered fresh — no background refetch during this window
- [ ] Defines `gcTime`: how long unused (no active observer) cache entries are kept in memory before garbage collection
- [ ] Explains the teammate's mistake: `staleTime: 0` causes a background refetch on every mount even if data was just fetched; `gcTime: Infinity` leaks memory
- [ ] Recommends `staleTime: 60_000` (1 minute) for product listings — data does not change every second
- [ ] Recommends `gcTime: 5 * 60_000` (5 minutes) as a reasonable default — keeps data warm for back-navigation
- [ ] Notes that `staleTime` should always be ≤ `gcTime`

---

### Q4 — useQuery vs useInfiniteQuery ⭐

**Scenario:** The product catalog has two views: a "Top 10 Products" sidebar that always shows exactly 10 items, and a "Browse All Products" feed that loads more items as the user scrolls to the bottom.

**Task:** Explain when to use `useQuery` vs `useInfiniteQuery`, and describe how `getNextPageParam` works for the feed.

**Acceptance Criteria:**
- [ ] `useQuery` is correct for the sidebar — a single page of a fixed number of items
- [ ] `useInfiniteQuery` is correct for the feed — multiple sequential pages accumulated into one list
- [ ] Explains that `useInfiniteQuery` stores `data.pages` as an array of page responses
- [ ] Shows a `getNextPageParam` implementation: `(lastPage) => lastPage.nextCursor ?? undefined` — returning `undefined` signals no more pages
- [ ] Shows how to flatten pages for rendering: `data.pages.flatMap(page => page.items)`
- [ ] Mentions `fetchNextPage()` and `hasNextPage` from the hook return value and how they connect to the IntersectionObserver trigger

---

### Q5 — Implement useProducts with Query Key Factory ⭐⭐

**Scenario:** The product listing page accepts filters (category, priceRange, inStock). When filters change, the data must refetch. Currently a senior engineer hard-coded the key as `['products', category]` and price/stock filters are ignored.

**Task:** Implement a `useProducts(filters)` hook using the `productKeys` factory so every filter combination maps to a unique cache entry and triggers a refetch when filters change.

**Acceptance Criteria:**
- [ ] Defines a `Filters` type with at least `category`, `priceRange`, and `inStock` fields
- [ ] Uses `productKeys.list(filters)` as the query key — filters object is part of the key
- [ ] Passes `filters` to the API call via the `ApiClient`
- [ ] Enables the query (does not set `enabled: false`) since filters always have a value (even default/empty)
- [ ] Demonstrates that changing `filters` causes `queryKey` to change, which React Query detects and refetches
- [ ] Adds a reasonable `staleTime` (e.g., 2 minutes) for the listing query
- [ ] Exports the hook from the feature's `index.ts`

---

### Q6 — Infinite Scroll with Cursor Pagination ⭐⭐

**Scenario:** The "Browse All Products" feed uses cursor-based pagination. Each API response returns `{ items: Product[], nextCursor: string | null }`. When `nextCursor` is `null` the feed has reached the end. An IntersectionObserver triggers `fetchNextPage` when the sentinel div enters the viewport.

**Task:** Implement `useInfiniteProducts` with the full cursor-based pagination setup. Show the hook, the page flattening, and the sentinel/IntersectionObserver pattern.

**Acceptance Criteria:**
- [ ] Uses `useInfiniteQuery` with `getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined`
- [ ] API call receives `pageParam` (the cursor) as a parameter: `apiClient.getProducts({ cursor: pageParam })`
- [ ] Flattens pages in the component: `const products = data?.pages.flatMap(p => p.items) ?? []`
- [ ] Implements an IntersectionObserver in a `useEffect` on a sentinel ref; calls `fetchNextPage()` when intersecting and `hasNextPage` is true
- [ ] Renders a loading indicator when `isFetchingNextPage` is true
- [ ] Does not call `fetchNextPage` when `isFetchingNextPage` is already true (guard against double-fetch)
- [ ] Handles the end-of-feed state: hides the sentinel or shows "No more products" when `!hasNextPage`

---

### Q7 — Optimistic Like Button ⭐⭐

**Scenario:** The product detail page has a Like button. When tapped, the heart fills immediately without waiting for the server. If the API call fails (network error, 500), the heart should revert to the previous state and show an error toast.

**Task:** Implement the full `useLikeProduct` mutation with `onMutate` (optimistic update), `onError` (rollback), and `onSettled` (cleanup).

**Acceptance Criteria:**
- [ ] `onMutate` cancels in-flight queries for the product detail key to prevent overwriting the optimistic update
- [ ] `onMutate` reads the current cache snapshot with `queryClient.getQueryData`
- [ ] `onMutate` writes the optimistic value with `queryClient.setQueryData` (toggles `liked` and updates `likeCount`)
- [ ] `onMutate` returns the snapshot as context for rollback: `return { previousProduct }`
- [ ] `onError` restores the snapshot: `queryClient.setQueryData(key, context.previousProduct)`
- [ ] `onError` shows an error toast to the user
- [ ] `onSettled` calls `queryClient.invalidateQueries` to sync with the server's true state regardless of success or failure

---

### Q8 — Optimistic Delete from List ⭐⭐

**Scenario:** The admin product panel has a "Delete" button on each row. The admin expects the row to disappear immediately. If deletion fails, the row must reappear and a toast must explain the failure.

**Task:** Implement `useDeleteProduct` with full optimistic list removal and rollback.

**Acceptance Criteria:**
- [ ] `onMutate` receives the product `id` being deleted
- [ ] `onMutate` cancels queries for `productKeys.lists()` to prevent race conditions
- [ ] `onMutate` reads and saves the current list snapshot
- [ ] `onMutate` filters the product out of the cache: `queryClient.setQueryData(key, old => old.filter(p => p.id !== id))`
- [ ] `onMutate` returns the snapshot for rollback
- [ ] `onError` restores the full list from the snapshot
- [ ] `onSettled` invalidates `productKeys.lists()` to re-sync with the server

---

### Q9 — Caching Strategies ⭐⭐

**Scenario:** The e-commerce platform has three endpoints with very different freshness requirements: (A) user cart contents — must always be current, (B) product details — can tolerate 5 minutes of staleness, (C) homepage banner — changes once a day and is expensive to fetch.

**Task:** Define the three caching strategies (stale-while-revalidate, cache-first, network-first) and map each endpoint to the correct strategy with React Query configuration.

**Acceptance Criteria:**
- [ ] Defines stale-while-revalidate: serve cached data immediately, refetch in background, update when response arrives
- [ ] Defines cache-first: serve cache if present and not expired; only fetch if cache is empty or expired
- [ ] Defines network-first: always fetch from network; fall back to cache only on network failure
- [ ] Maps user cart to network-first (or very short `staleTime: 0` with high `gcTime`) — cannot risk stale cart data
- [ ] Maps product details to stale-while-revalidate (`staleTime: 5 * 60_000`) — acceptable to show briefly stale data
- [ ] Maps homepage banner to cache-first (long `staleTime: 24 * 60 * 60_000`) — changes infrequently, expensive to refetch
- [ ] Notes that React Query implements stale-while-revalidate by default; cache-first requires high `staleTime`

---

### Q10 — Request Deduplication ⭐⭐

**Scenario:** The product listing page renders three separate components — a `ProductGrid`, a `FilterSidebar`, and a `ResultCount` — that all call `useProducts(filters)` with the same filters. Without deduplication, this would fire three simultaneous network requests.

**Task:** Explain exactly how React Query deduplicates concurrent queries with the same key and what the lifecycle looks like when three components mount simultaneously.

**Acceptance Criteria:**
- [ ] Explains that React Query uses the query key as a cache key and tracks a single "fetching" promise per key
- [ ] Describes the subscription model: each `useQuery` call adds a subscriber to the cache entry, not a new network request
- [ ] Explains that the first subscriber triggers the fetch; subsequent subscribers with the same key attach to the same in-flight promise
- [ ] Describes what happens when a subscriber unmounts: the cache entry is retained, only the subscriber count decreases
- [ ] Notes that `gcTime` governs when the cache entry is removed after the last subscriber unmounts
- [ ] Explains the benefit: N components = 1 network request, all get the same data when it resolves

---

### Q11 — AbortController in API Client ⭐⭐

**Scenario:** When users type rapidly in the search box, a new request fires on every keystroke. Old in-flight requests sometimes arrive after newer ones, causing the result list to flicker back to stale results. The page also has a route transition that sometimes shows data from the previous route.

**Task:** Explain why cancelling in-flight requests matters and show how to integrate `AbortController` into both the `ApiClient` and a `useEffect` cleanup.

**Acceptance Criteria:**
- [ ] Explains the race condition: older responses arriving after newer responses can overwrite correct state
- [ ] Shows `ApiClient.get(url, { signal })` passing the `AbortSignal` to `fetch`
- [ ] Shows the `useEffect` pattern: create `AbortController` in effect body, pass `signal` to the API call, abort in cleanup
- [ ] Notes that React Query passes a `signal` to the `queryFn` automatically — shows how to forward it to `ApiClient`
- [ ] Explains that an aborted request throws an `AbortError` and should be caught and silently ignored (not shown to user)
- [ ] Notes that `axios` uses `CancelToken` or `AbortController` depending on version

---

### Q12 — Prefetching and SSR Hydration ⭐⭐⭐

**Scenario:** The product listing page is served by Next.js. The first paint must show products immediately (no loading skeleton). On desktop, when the user hovers over a product card, the product detail page should be prefetched so the navigation feels instant.

**Task:** Implement two prefetching strategies: (1) SSR hydration with `dehydrate`/`HydrationBoundary`, and (2) hover prefetch with `queryClient.prefetchQuery`.

**Acceptance Criteria:**
- [ ] Shows the Next.js Server Component pattern: `await queryClient.prefetchQuery(productKeys.lists(), fetchProducts)` on the server, then `dehydrate(queryClient)` passed to `<HydrationBoundary>`
- [ ] Explains that `HydrationBoundary` serializes the dehydrated state and sends it to the client as part of the HTML
- [ ] Client-side React Query picks up the dehydrated data and skips the initial fetch if data is fresh
- [ ] Shows the hover prefetch: `onMouseEnter={() => queryClient.prefetchQuery(productKeys.detail(id), () => fetchProduct(id))}`
- [ ] Notes that `prefetchQuery` is a no-op if the cache entry is already fresh
- [ ] Discusses the staleTime consideration: dehydrated data must have a `staleTime > 0` to avoid an immediate refetch on mount
- [ ] Mentions `useQueryClient()` hook to access `queryClient` in components

---

### Q13 — Dependent Queries ⭐⭐⭐

**Scenario:** The user profile page must fetch the user first, then fetch the user's orders using the `userId` from the profile response. The orders query must not fire until the user query succeeds. Both queries show individual loading states.

**Task:** Implement the sequential dependent query chain. Handle all loading/error states. Explain the trade-off vs a single combined API endpoint.

**Acceptance Criteria:**
- [ ] First query fetches user: `useQuery({ queryKey: userKeys.detail(userId), queryFn: fetchUser })`
- [ ] Second query uses `enabled: !!user?.id` to prevent firing until user is loaded
- [ ] Second query uses the resolved `user.id` in its query key and query function
- [ ] Handles three loading states: user loading, user error (show error UI), orders loading (show orders skeleton)
- [ ] Explains the N+1 problem: dependent queries do two round-trips where a combined endpoint would do one
- [ ] Proposes the trade-off: if this page is the only consumer of the combination, a dedicated endpoint is worth it; if not, dependent queries keep the backend RESTful
- [ ] Notes that `suspense: true` mode can simplify the loading state cascade

---

### Q14 — Full Data Layer Design ⭐⭐⭐

**Scenario:** The product listing page requirements: (1) server-rendered initial data for SEO, (2) client-side filter changes must NOT trigger a loading spinner — use cached data while refetching in background, (3) sort order changes must always refetch (no stale sort), (4) "Load More" button appends the next page of results (cursor pagination).

**Task:** Design the complete data layer architecture satisfying all four requirements. Show query key strategy, staleTime values, and the separation between filter state and sort state.

**Acceptance Criteria:**
- [ ] SSR: `dehydrate` + `HydrationBoundary` provides initial data; no loading spinner on first paint
- [ ] Filter state lives in URL params; filter-keyed query has `staleTime: 2 * 60_000` so rapid filter changes use cached data
- [ ] Sort state also lives in URL params but sort-keyed queries have `staleTime: 0` — sort must always reflect server order
- [ ] Load More uses `useInfiniteQuery` with cursor pagination; cursor is derived from the last page's `nextCursor`
- [ ] Query key includes both filters and sort: `productKeys.list({ ...filters, sort })` — sort changes produce a new cache entry
- [ ] Explains how `keepPreviousData: true` (or `placeholderData: keepPreviousData`) prevents the UI flash between filter changes
- [ ] Describes the transition: filter change → show stale data with loading indicator in background → swap when fresh data arrives

---

### Q15 — Error Handling Strategy ⭐⭐⭐

**Scenario:** The platform currently has no error handling strategy. When an API call fails, some components show a blank screen, some crash the whole page, and retry behavior is inconsistent. The CEO reported that during a 30-second API blip, users saw broken pages and could not retry.

**Task:** Design a comprehensive error handling strategy covering: retry configuration, error boundary integration, and a global error handler in `QueryClient`.

**Acceptance Criteria:**
- [ ] Configures `QueryClient` `defaultOptions.queries.retry`: retry 3 times for 5xx errors, do NOT retry for 4xx errors (client errors are not transient)
- [ ] Implements exponential backoff in `retryDelay`: `Math.min(1000 * 2 ** attempt, 30_000)`
- [ ] Adds a global `onError` handler in `QueryClient` that logs errors and shows a toast for unexpected failures
- [ ] Explains that React Query errors do not throw to the React tree by default — `throwOnError: true` is needed for error boundaries to catch them
- [ ] Shows an `<ErrorBoundary>` wrapping each major async section with a `fallbackRender` that includes a "Retry" button calling `queryClient.resetQueries`
- [ ] Distinguishes expected errors (404 product not found — show inline message) from unexpected errors (500 — global toast + boundary)
- [ ] Recommends a type-safe `ApiError` class so error handlers can branch on `error.status` without string-parsing
