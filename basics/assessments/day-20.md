# Day 20 Assessment — Data Fetching · Server Actions · Route Handlers

**Theme:** You are the lead engineer on a SaaS product with a Next.js frontend and PostgreSQL database. You need to design and implement correct data fetching patterns, mutation flows, and API endpoints throughout the app.

---

### Q1 — fetch() cache options ⭐

**Scenario:** Map each caching option to the correct rendering strategy and real-world use case.

**Task:** For each option, name the rendering strategy it produces, when to use it, and the Next.js segment config equivalent.

| Option | Rendering strategy | Use case | Segment config equivalent |
|--------|---------------------|----------|--------------------------|
| `cache: 'force-cache'` | ? | ? | ? |
| `cache: 'no-store'` | ? | ? | ? |
| `next: { revalidate: 60 }` | ? | ? | ? |
| `next: { tags: ['posts'] }` | ? | ? | ? |

**Acceptance Criteria:**
- [ ] `force-cache`: SSG — content same for everyone, rarely changes (marketing pages, docs) — `export const revalidate = false`
- [ ] `no-store`: SSR — always fresh, per-request data (user dashboard, live prices) — `export const dynamic = 'force-dynamic'`
- [ ] `revalidate: 60`: ISR — mostly static, tolerate ~60s staleness (news, product listings) — `export const revalidate = 60`
- [ ] `tags: ['posts']`: ISR with on-demand revalidation — same as revalidate but can be purged instantly via `revalidateTag('posts')` — no direct segment config equivalent (tag-based)
- [ ] Default (no option): same as `force-cache` in Next.js extended fetch

---

### Q2 — Parallel vs sequential data fetching ⭐

**Scenario:** A product page needs: product details, product reviews, related products, and user's wishlist status. All are independent except wishlist (needs `userId` which comes from `session`). The session call takes 50ms, the rest take 200ms each.

**Task:** Write the optimal fetching strategy. Calculate the total time for both approaches. Explain when you MUST use sequential.

**Acceptance Criteria:**
- [ ] Sequential (wrong): `session` → `product` → `reviews` → `related` → `wishlist` = 50 + 200 + 200 + 200 + 200 = 850ms
- [ ] Optimal: `session` first (50ms), then `Promise.all([product, reviews, related, wishlist])` in parallel = 50 + 200 = 250ms
- [ ] Wishlist needs `session.user.id` → that's the only sequential dependency; everything else is independent
- [ ] MUST use sequential when: request B uses data returned by request A (cursor pagination, dependent IDs)
- [ ] `await Promise.all([...])` starts all fetches simultaneously and waits for the slowest one

---

### Q3 — Request memoization with React.cache() ⭐

**Scenario:** `getUser(id)` is called in the root layout (to show the nav bar) and again in the page component (to show the user profile). Without memoization, this hits the DB twice per request.

**Task:** Show how to use `React.cache()` to deduplicate the calls. Explain the difference between `React.cache()` and `fetch()` memoization. When does the cache reset?

**Acceptance Criteria:**
- [ ] `import { cache } from 'react'; export const getUser = cache(async (id: string) => db.user.findUnique({ where: { id } }))`
- [ ] Both layout and page call `getUser(session.user.id)` — only one DB query runs per request
- [ ] Difference: `fetch()` memoization is automatic for HTTP calls; `React.cache()` is manual, for any async function (ORM, file reads, etc.)
- [ ] Cache resets: per-request — a new render cycle starts fresh; no cross-request contamination
- [ ] `React.cache()` is NOT a replacement for `unstable_cache` — it's per-render memoization, not persistent storage
- [ ] Works across the entire server render tree — layout + page + any nested component sharing the same request

---

### Q4 — Suspense + streaming ⭐⭐

**Scenario:** A dashboard page with three panels: notifications (fast), analytics chart (slow), and recent orders (medium). Design the streaming architecture so the user sees something immediately.

**Task:** Write the dashboard page with correct Suspense boundaries. Explain what HTML the browser receives in each phase (immediate shell, then streams).

**Acceptance Criteria:**
- [ ] Three async Server Components: `<NotifPanel />` (fast), `<AnalyticsChart />` (slow), `<RecentOrders />` (medium)
- [ ] Each wrapped in independent `<Suspense fallback={<SkeletonN />}>`
- [ ] Phase 1 (immediate, ~0ms): browser receives page shell + three skeleton placeholders
- [ ] Phase 2: NotifPanel resolves first → streamed HTML replaces skeleton 1
- [ ] Phase 3: RecentOrders resolves → streamed to skeleton 2
- [ ] Phase 4: AnalyticsChart resolves → streamed to skeleton 3
- [ ] Using `loading.tsx` wraps the WHOLE page in ONE boundary — not suitable here; manual Suspense needed
- [ ] No JavaScript waterfall — all three fetches start simultaneously on the server

---

### Q5 — unstable_cache for DB queries ⭐⭐

**Scenario:** A product listing page makes an expensive DB query that aggregates sales data. It's the same for all users. Cache it for 1 hour, and invalidate it when a new sale is recorded.

**Task:** Implement `unstable_cache` with the correct parameters. Show how `revalidateTag` is called from a Server Action after a sale.

**Acceptance Criteria:**
- [ ] `import { unstable_cache } from 'next/cache'`
- [ ] `export const getSalesData = unstable_cache(async () => { return db.sale.aggregate(...) }, ['sales-data'], { revalidate: 3600, tags: ['sales'] })`
- [ ] First argument: the async function; second: cache key array; third: options object
- [ ] In the "record sale" Server Action: `import { revalidateTag } from 'next/cache'; revalidateTag('sales')`
- [ ] After `revalidateTag`, the NEXT call to `getSalesData` runs the DB query again and caches fresh data
- [ ] Difference from `fetch()` caching: `unstable_cache` works for any async source (ORM, file system, external SDK)

---

### Q6 — Server Action basics ⭐

**Scenario:** Write a Server Action to create a new blog post. It should:
- Validate: title (min 3 chars), content (min 50 chars), category (must be 'tech' | 'business' | 'design')
- Save to DB
- Revalidate `/blog` and the category page
- Return `{ success: true }` or `{ errors: {...} }`

**Task:** Implement the full Server Action. Show how it's called from a form with `action={createPost}`.

**Acceptance Criteria:**
- [ ] File starts with `'use server'` directive (or function is marked inline with `'use server'`)
- [ ] Accepts `formData: FormData` — `.get('title')`, `.get('content')`, `.get('category')` cast to string
- [ ] Validates each field; returns `{ errors: { title: ['...'], content: ['...'] } }` on failure
- [ ] `await db.post.create({ data: { title, content, category } })` — real DB insert
- [ ] `revalidatePath('/blog')` and `revalidatePath('/blog/category/' + category)`
- [ ] Returns `{ success: true }` on completion
- [ ] Used in form: `<form action={createPost}>` — works with progressive enhancement (no JS required)

---

### Q7 — useFormState + useFormStatus ⭐⭐

**Scenario:** The "Create Post" form needs: inline validation errors below each field, a spinner on the submit button during submission, and a success message after completion.

**Task:** Implement the Client Component form with `useFormState` and a separate `SubmitButton` component with `useFormStatus`. Explain why `SubmitButton` must be a separate component.

**Acceptance Criteria:**
- [ ] `const [state, formAction] = useFormState(createPost, {})` — `state` holds the Server Action's return value
- [ ] `<form action={formAction}>` — not `onSubmit`; works with the form's native submission
- [ ] `{state.errors?.title && <p className="error">{state.errors.title[0]}</p>}`
- [ ] `SubmitButton` is a separate component that calls `const { pending } = useFormStatus()` — shows spinner when `pending`
- [ ] WHY separate: `useFormStatus` reads from the nearest parent `<form>`'s submission state; calling it in the same component as `<form>` reads the WRONG form (a parent's); the child-component relationship is what enables the correct binding
- [ ] `{state.success && <p>Post created!</p>}` — shown after `createPost` returns `{ success: true }`

---

### Q8 — useOptimistic ⭐⭐

**Scenario:** A "like" button on a post should update the count instantly without waiting for the server. If the server call fails, the count should roll back.

**Task:** Implement the full optimistic like button using `useOptimistic` and `useTransition`. Explain the rollback mechanism.

**Acceptance Criteria:**
- [ ] `const [opt, addOptimistic] = useOptimistic({ liked, likes }, (state, newLiked) => ({ liked: newLiked, likes: newLiked ? state.likes + 1 : state.likes - 1 }))`
- [ ] `const [isPending, startTransition] = useTransition()`
- [ ] `handleClick`: `startTransition(async () => { addOptimistic(!opt.liked); await toggleLike(postId); })`
- [ ] Rollback: if `toggleLike` throws, `useTransition` catches the error; `useOptimistic` reverts to the last committed state automatically
- [ ] Button shows `opt.liked` (optimistic) while actual `liked` prop is still `false` during the pending period
- [ ] `disabled={isPending}` prevents double-click during in-flight request

---

### Q9 — Route Handler: GET with query params ⭐

**Scenario:** Build `GET /api/products` that:
- Accepts `?page=1&limit=20&category=tech` query params
- Validates: limit between 1–100 (default 20), page ≥ 1 (default 1), category from an allowed list
- Returns paginated JSON with `{ products, total, page, limit, hasMore }`
- Sets 60s cache header

**Task:** Implement the route handler with all validations.

**Acceptance Criteria:**
- [ ] `export async function GET(request: NextRequest)` — correct signature
- [ ] `const { searchParams } = new URL(request.url)` — or `request.nextUrl.searchParams`
- [ ] Parse and validate each param; return `NextResponse.json({ error: '...' }, { status: 400 })` for invalid inputs
- [ ] `limit` clamped: `Math.min(Math.max(parseInt(raw) || 20, 1), 100)`
- [ ] DB query with pagination: `{ skip: (page - 1) * limit, take: limit }`
- [ ] Response: `NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=60' } })`
- [ ] `hasMore`: `(page * limit) < total`

---

### Q10 — Route Handler vs Server Action ⭐⭐

**Scenario:** Decide which to use for each case:
1. Submitting a newsletter signup form from the marketing page
2. Receiving payment webhooks from Stripe
3. Providing a REST API for a mobile app
4. Deleting a user's account from their settings page
5. An SSE endpoint that streams AI-generated content

**Task:** Choose Route Handler or Server Action for each and justify.

**Acceptance Criteria:**
- [ ] Newsletter signup: Server Action — UI-bound form mutation, no external consumers, revalidates the page
- [ ] Stripe webhooks: Route Handler — external POST from Stripe; needs raw body access for HMAC verification; HTTP semantics matter
- [ ] Mobile REST API: Route Handler — external consumer; mobile app uses `fetch('/api/...')` with standard HTTP verbs
- [ ] Delete account: Server Action — internal mutation, tied to a settings UI button; `revalidatePath` or `redirect` after
- [ ] SSE stream: Route Handler — returns a `ReadableStream` with `text/event-stream` Content-Type; Server Actions can't stream progressive responses
- [ ] General rule: Server Actions for UI mutations; Route Handlers for external consumers, webhooks, streaming

---

### Q11 — File upload with Server Action ⭐⭐

**Scenario:** An avatar upload form lets users pick an image (max 2MB, JPEG/PNG/WebP only). The file is saved to disk (or cloud storage) and the user's record is updated.

**Task:** Write the Server Action that handles the upload. Show client-side validation before submission. List all security checks the server must perform.

**Acceptance Criteria:**
- [ ] Server Action accepts `formData: FormData`; `const file = formData.get('avatar') as File`
- [ ] Server-side checks (never trust client): `file.size <= 2 * 1024 * 1024`, `['image/jpeg', 'image/png', 'image/webp'].includes(file.type)`
- [ ] Generate safe filename: `crypto.randomUUID() + extension` — never use `file.name` directly (path traversal risk)
- [ ] Save: `Buffer.from(await file.arrayBuffer())` → write to filesystem or upload to S3
- [ ] Update DB: `db.user.update({ where: { id: session.user.id }, data: { avatarUrl: publicUrl } })`
- [ ] Client-side: HTML `<input type="file" accept="image/*" />` + `onChange` size check as UX (not security)
- [ ] Return `{ success: true, url }` on completion; `{ error: '...' }` on failure

---

### Q12 — Webhook signature verification ⭐⭐

**Scenario:** Stripe sends `POST /api/webhooks/stripe` after each payment. Without signature verification, anyone could POST fake "payment succeeded" events and get free orders.

**Task:** Implement the full webhook handler with HMAC signature verification. Explain why `request.text()` must be used instead of `request.json()`.

**Acceptance Criteria:**
- [ ] `const rawBody = await request.text()` — MUST be raw string, not parsed JSON
- [ ] `const sig = request.headers.get('stripe-signature')!`
- [ ] `stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)` — throws on invalid sig
- [ ] Wrap in try/catch; return 400 on `WebhookSignatureVerificationError`
- [ ] WHY `request.text()`: HMAC is computed over the exact bytes Stripe sent; parsing to JSON may alter whitespace/key order, making the computed HMAC differ from Stripe's
- [ ] After verification: `switch (event.type)` to handle `checkout.session.completed`, `payment_intent.payment_failed`, etc.
- [ ] Return `{ received: true }` with 200 — Stripe retries on non-2xx

---

### Q13 — SWR vs React Query vs useEffect ⭐⭐

**Scenario:** A user's notifications panel:
- Must poll every 30 seconds for new notifications
- Should show cached data while refetching (no flash of empty state)
- Must deduplicate requests if the panel is opened multiple times
- Should mark notifications as read on click (a mutation)

**Task:** Show why `useEffect + fetch` is insufficient here. Implement with React Query, highlighting the features that solve each requirement.

**Acceptance Criteria:**
- [ ] `useEffect` problem: no deduplication (two panels = two fetches), no stale-while-revalidate, manual cleanup, no mutation integration
- [ ] React Query: `useQuery({ queryKey: ['notifications'], queryFn: fetchNotifications, refetchInterval: 30_000, staleTime: 29_000 })`
- [ ] Deduplication: two components with same `queryKey` share one cache entry and one network request
- [ ] Stale-while-revalidate: `staleTime: 29_000` shows cached data; `refetchInterval: 30_000` fetches in background
- [ ] Mutation: `useMutation({ mutationFn: markRead, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }) })`
- [ ] `invalidateQueries` triggers a fresh fetch after marking read — notifications count updates

---

### Q14 — Hybrid data fetching ⭐⭐⭐

**Scenario:** A product listing page:
- Must be SEO-friendly (server-rendered product list)
- Must support instant client-side filtering (by category, price range) without full page reloads
- The filtered results should still be indexable by crawlers (URL reflects filters: `?category=tech&maxPrice=100`)

**Task:** Design the full hybrid architecture. Show server fetch (initial data), Client Component (filter UI), and how URL params keep state.

**Acceptance Criteria:**
- [ ] `page.tsx` (SC): reads `searchParams`, fetches `products` server-side with filters applied, passes to `ProductList` (CC) as `initialData`
- [ ] `ProductList` (`'use client'`): uses React Query with `initialData={initialData}`, `queryKey: ['products', filters]`, refetches when filters change
- [ ] Filter UI updates URL: `router.push('/products?' + new URLSearchParams(filters).toString())` — triggers server re-render
- [ ] Crawler sees full HTML product list in initial response — SEO preserved
- [ ] Client-side filter change → URL update → page.tsx server-renders with new `searchParams` → React Query receives fresh `initialData`
- [ ] No double-fetch on first load: React Query's `initialData` satisfies the first query without a client-side fetch

---

### Q15 — Streaming with Server Actions ⭐⭐⭐

**Scenario:** An AI writing assistant sends a long-form article (2000 words) from an LLM API. The full response takes 8 seconds. Users should see text appear word-by-word rather than waiting for the full response.

**Task:** Design the streaming architecture. Show the Route Handler that streams from an LLM, the Client Component that reads the stream, and why Server Actions can't be used here.

**Acceptance Criteria:**
- [ ] Route Handler (`GET /api/generate`): returns `new Response(stream, { headers: { 'Content-Type': 'text/plain' } })`
- [ ] LLM stream piped: `const completion = await openai.chat.completions.create({ ..., stream: true })`; uses `OpenAIStream` or manual `ReadableStream` wrapper
- [ ] Client Component: `const reader = response.body?.getReader()`; reads chunks with `reader.read()` in a loop; appends to state
- [ ] Why NOT Server Action: Server Actions send their return value as one atomic response — they can't stream progressive chunks. They don't return `ReadableStream`
- [ ] Abort signal: `const controller = new AbortController()`; pass to fetch; cleanup in `useEffect` return → stops server streaming if user navigates away
- [ ] Show partial text: `const [text, setText] = useState('')`; `setText(prev => prev + decoded)` as each chunk arrives
