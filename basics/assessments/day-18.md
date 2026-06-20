# Day 18 Assessment — App Router · Routing · Rendering Strategies

**Theme:** You are building a multi-tenant SaaS content platform. It serves marketing pages (static), user dashboards (dynamic/auth), blog posts (ISR), and a docs site (SSG). You need to make correct architecture decisions for every route.

---

### Q1 — Rendering strategy decision ⭐

**Scenario:** Choose the correct rendering strategy for each page:
1. `/blog/[slug]` — article that changes at most once per day
2. `/dashboard` — shows user-specific KPIs, changes on every request
3. `/pricing` — same for every visitor, almost never changes
4. `/feed` — real-time social feed that's the same for all users but updates every 30 seconds

**Task:** Name the strategy (SSG, ISR, SSR, CSR) and the Next.js implementation for each.

**Acceptance Criteria:**
- [ ] Blog: ISR with `export const revalidate = 86400` (24 hours) or `next: { revalidate: 86400 }` on fetch
- [ ] Dashboard: SSR with `export const dynamic = 'force-dynamic'` or `cache: 'no-store'`
- [ ] Pricing: SSG with `export const revalidate = false` (or default, no fetch cache config)
- [ ] Feed: ISR with `export const revalidate = 30` — same for all users, periodic freshness is fine
- [ ] Explains: CSR is NOT used here — all four have content that benefits from server rendering (SEO or speed)

---

### Q2 — File conventions ⭐

**Scenario:** A junior developer asks: "What files can I put in an `app/` folder segment and what does each do?"

**Task:** List at least 6 special App Router file conventions with their purpose. Explain the difference between `page.tsx` and `layout.tsx`.

**Acceptance Criteria:**
- [ ] `page.tsx` — unique UI for the route (the "content"); required to make a route publicly accessible
- [ ] `layout.tsx` — shared UI wrapper; does NOT re-render on child navigation; persists across page changes
- [ ] `loading.tsx` — automatic Suspense fallback; shown immediately on navigate
- [ ] `error.tsx` — error boundary; `'use client'`; receives `error` and `reset` props
- [ ] `not-found.tsx` — rendered when `notFound()` is called
- [ ] `route.ts` — API handler; exports named HTTP method functions (GET, POST…); no JSX
- [ ] `template.tsx` — like layout but re-mounts on every navigation (rare; use layout by default)
- [ ] Difference: layout persists state and DOM across child routes; page is the leaf content for that URL

---

### Q3 — Dynamic routes ⭐

**Scenario:** Build a documentation site with these URLs:
- `/docs` — docs home
- `/docs/api` — single segment
- `/docs/api/users/list` — multiple segments
- `/docs` should also match when no slug is provided

**Task:** Design the folder structure. Name the route type for each. Show the `params` shape for each.

**Acceptance Criteria:**
- [ ] `/docs/page.tsx` — static route, no params
- [ ] `/docs/[slug]/page.tsx` — dynamic segment, `params.slug = 'api'`
- [ ] `/docs/[...slug]/page.tsx` — catch-all, `params.slug = ['api', 'users', 'list']` — does NOT match `/docs`
- [ ] `/docs/[[...slug]]/page.tsx` — optional catch-all — matches `/docs` (slug undefined) AND `/docs/a/b`
- [ ] Explains: can't have both `/docs/[slug]` and `/docs/[[...slug]]` — optional catch-all replaces both

---

### Q4 — Route groups ⭐

**Scenario:** The platform has two user types:
- Marketing visitors: see `/`, `/pricing`, `/features` — all sharing a marketing header/footer
- Authenticated users: see `/dashboard`, `/settings`, `/reports` — sharing a sidebar layout
- Both must coexist without URL pollution (`/marketing/pricing` is wrong, it should be `/pricing`)

**Task:** Design the `app/` folder structure using route groups. Show the layout file for each group.

**Acceptance Criteria:**
- [ ] `app/(marketing)/layout.tsx` — marketing header, footer; applies to pages inside (marketing)
- [ ] `app/(marketing)/pricing/page.tsx` → URL is `/pricing` (group name stripped)
- [ ] `app/(marketing)/features/page.tsx` → URL is `/features`
- [ ] `app/(dashboard)/layout.tsx` — auth check, sidebar nav
- [ ] `app/(dashboard)/dashboard/page.tsx` → URL is `/dashboard`
- [ ] Two separate layouts coexist under the same root layout — neither collides
- [ ] Explains: route groups are folder-only organisation; they have zero effect on the URL

---

### Q5 — Parallel routes ⭐⭐

**Scenario:** The dashboard page must show a stats panel AND a live-feed panel side by side. Each panel fetches its own data independently and should show its own loading state without blocking the other.

**Task:** Design the folder structure with parallel routes. Show the layout file that receives both slots. Explain what `default.tsx` is for.

**Acceptance Criteria:**
- [ ] `app/dashboard/@stats/page.tsx` — stats panel slot
- [ ] `app/dashboard/@feed/page.tsx` — live-feed slot
- [ ] `app/dashboard/layout.tsx` receives `{ children, stats, feed }` as props
- [ ] Each slot wrapped in its own `<Suspense>` in the layout — independent loading states
- [ ] `app/dashboard/@stats/default.tsx` — rendered when Next.js can't determine active page for the slot (e.g. hard navigation to a sub-route that doesn't match a slot)
- [ ] Without `default.tsx` — a 404 is shown for the unmatched slot during direct URL access

---

### Q6 — Intercepting routes ⭐⭐

**Scenario:** A photo gallery at `/photos` shows a grid. Clicking a photo should open it in a modal (URL changes to `/photos/42`) without leaving the grid. Refreshing or sharing `/photos/42` should load the full-page photo view.

**Task:** Design the intercepting route structure. Explain the `(..)` convention. When does the intercept activate vs. not?

**Acceptance Criteria:**
- [ ] `app/photos/[id]/page.tsx` — full-page photo (renders on direct URL access / refresh)
- [ ] `app/@modal/default.tsx` — `null` or empty (no modal by default)
- [ ] `app/@modal/(..photos)/[id]/page.tsx` — modal photo view (intercepts `/photos/[id]`)
- [ ] `(..)` = intercept one level up; `(.)` = same level; `(...)` = from root
- [ ] Intercept activates: client-side navigation from within the app (e.g. clicking a `<Link>`)
- [ ] Intercept does NOT activate: direct URL visit, page refresh, shared link — shows full page

---

### Q7 — generateStaticParams ⭐⭐

**Scenario:** `/blog/[slug]` has 500 blog posts in a database. You want to SSG the 20 most-visited posts at build time and serve the rest on-demand (then cache them).

**Task:** Implement `generateStaticParams` for the 20 featured posts. Configure the segment so unknown slugs are still served (not 404'd). Show the ISR revalidation.

**Acceptance Criteria:**
- [ ] `generateStaticParams` fetches top 20 by view count, returns `[{ slug: 'hello-world' }, ...]`
- [ ] `export const dynamicParams = true` — allows slugs NOT in `generateStaticParams` to render on-demand (default is `true`)
- [ ] `export const revalidate = 3600` — cached pages refresh hourly
- [ ] `dynamicParams = false` would 404 any slug not in `generateStaticParams` — use for locked-down content
- [ ] Build output shows 20 pre-rendered pages; others generated on first request and cached

---

### Q8 — Navigation ⭐

**Scenario:** A multi-page form wizard. After step 3 is completed via a Server Action, the user should be redirected to `/thank-you`. A "Go Back" button should return to step 2 without adding a new history entry.

**Task:** Show `redirect()` in a Server Action and `router.replace()` in a Client Component. Explain when to use each.

**Acceptance Criteria:**
- [ ] Server Action: `import { redirect } from 'next/navigation'; redirect('/thank-you')` — called after mutation; throws internally
- [ ] `redirect()` in a Server Action must NOT be inside a try/catch that catches all errors (it throws a special internal signal)
- [ ] Client Component: `const router = useRouter(); router.replace('/step-2')` — replaces history entry, back button skips it
- [ ] `router.push()` adds to history; `router.replace()` overwrites — correct for wizard "back" where you don't want duplicates
- [ ] `<Link replace href="/step-2">` is the declarative equivalent of `router.replace`

---

### Q9 — Metadata and SEO ⭐⭐

**Scenario:** `/blog/[slug]` needs: a dynamic `<title>` (post title + " | Blog"), Open Graph image from the post's cover image, canonical URL, and `robots: noindex` for draft posts.

**Task:** Implement `generateMetadata` that returns all the above conditionally. Show how the `template` in root layout works with per-page titles.

**Acceptance Criteria:**
- [ ] Root layout: `metadata = { title: { default: 'My Blog', template: '%s | My Blog' } }`
- [ ] Blog page: `generateMetadata` returns `{ title: post.title }` → renders as "Post Title | My Blog"
- [ ] `openGraph: { images: [post.coverImage] }` — `images` is an array; first item is used
- [ ] `alternates: { canonical: \`https://example.com/blog/${slug}\` }` — prevents duplicate content
- [ ] Draft: `robots: { index: false, follow: false }` — tells crawlers to skip the page
- [ ] `generateMetadata` can be async — fetches the post from DB, shares Request memoization with the page component

---

### Q10 — Special files: loading + error ⭐⭐

**Scenario:** `/dashboard` fetches heavy data (2 seconds). Occasionally the DB call fails. Write `loading.tsx` and `error.tsx` for the dashboard segment. The error page must show a "Retry" button and the error's `digest` for support tickets.

**Task:** Write both files in full. Explain how React uses each and how `reset()` works.

**Acceptance Criteria:**
- [ ] `loading.tsx` — no `'use client'`; a Server Component returning skeleton JSX; Next.js wraps page in `<Suspense fallback={<Loading />}>`
- [ ] `error.tsx` — must be `'use client'`; receives `{ error: Error & { digest?: string }, reset: () => void }`
- [ ] `reset()` re-attempts to render the segment (calls the page component again) — if error was transient, it succeeds
- [ ] `error.digest` — a hash of the error ID; safe to show to users (no stack trace); matches server logs
- [ ] `error.tsx` does NOT catch errors in `layout.tsx` — only in `page.tsx` and its children
- [ ] To catch layout errors, use `global-error.tsx` in the root of `app/`

---

### Q11 — Server Component vs Client Component decision ⭐

**Scenario:** Classify each of these as Server Component (SC) or Client Component (CC) and explain why:
1. A sidebar that reads the user's role from the database to show/hide menu items
2. A dropdown menu that opens/closes on click
3. A chart component that uses the `recharts` library (browser-only)
4. A page header that just renders the site logo and nav links (static)

**Task:** Classify and justify each.

**Acceptance Criteria:**
- [ ] Sidebar: SC — DB access, no interactivity; role data fetched directly, not via API
- [ ] Dropdown: CC — `useState` for open/close; `onClick` handler
- [ ] Chart: CC — `recharts` uses `window`/DOM APIs; `'use client'` required; optionally `ssr: false` with `next/dynamic`
- [ ] Header with nav links: SC — pure markup, no state or events; zero JS sent to browser
- [ ] General rule: default to SC; add `'use client'` only when the component needs hooks or browser APIs

---

### Q12 — 'use client' boundary ⭐⭐

**Scenario:** A `ThemeProvider` Client Component needs to wrap the entire app (for CSS variable injection). But most child pages should remain Server Components.

**Task:** Show how to structure the layout so `ThemeProvider` wraps children without making all children Client Components. Explain why children passed as props to a Client Component can be Server Components.

**Acceptance Criteria:**
- [ ] `ThemeProvider` is `'use client'`; accepts `{ children: React.ReactNode }`
- [ ] Root layout (Server Component) imports `ThemeProvider` and passes `{children}` to it
- [ ] Children prop is a Server Component — Next.js renders it on the server BEFORE passing to the Client Component
- [ ] The children is a "hole" in the client bundle — it was already rendered by the time the Client Component sees it
- [ ] This is the "children as slot" pattern — the secret to keeping the tree as server-only as possible
- [ ] Wrong: `ThemeProvider` directly importing a Server Component — that turns it Client (not possible anyway)

---

### Q13 — not-found.tsx ⭐

**Scenario:** `/products/[id]` should show a custom 404 page when the product ID doesn't exist in the database, not the generic Next.js 404.

**Task:** Show how to trigger `not-found.tsx` from the page component. Write a minimal `not-found.tsx`. Explain the HTTP status code behavior.

**Acceptance Criteria:**
- [ ] `import { notFound } from 'next/navigation'; if (!product) notFound();`
- [ ] `notFound()` throws internally — put it AFTER your DB call, not inside a try/catch that swallows errors
- [ ] `app/products/[id]/not-found.tsx` renders for this segment specifically
- [ ] `app/not-found.tsx` (root) renders for any route that doesn't match
- [ ] HTTP response: 404 status code — important for SEO (crawlers know the page doesn't exist)
- [ ] `not-found.tsx` is a Server Component by default — no `'use client'` needed

---

### Q14 — Catch-all vs optional catch-all ⭐⭐

**Scenario:** A documentation site needs `/docs` (landing), `/docs/getting-started`, and `/docs/api/reference/users`. Using a single page file, explain the two options and choose the correct one.

**Task:** Compare `[...slug]` and `[[...slug]]`. Show the params shape for each URL. Implement `generateStaticParams` for a known set of docs.

**Acceptance Criteria:**
- [ ] `[...slug]` — required; `/docs` alone is 404; `/docs/a` → `{ slug: ['a'] }`
- [ ] `[[...slug]]` — optional; `/docs` → `{ slug: undefined }`; `/docs/a/b` → `{ slug: ['a', 'b'] }`
- [ ] Correct choice: `[[...slug]]` because `/docs` must render the landing page
- [ ] `generateStaticParams` returns: `[{}, { slug: ['getting-started'] }, { slug: ['api', 'reference', 'users'] }]`
- [ ] Empty object `{}` generates the `/docs` path (slug = undefined)
- [ ] The page uses `params.slug?.join('/') ?? ''` to derive the content path

---

### Q15 — ISR on-demand revalidation ⭐⭐⭐

**Scenario:** Blog posts are ISR with `revalidate = 3600`. An editor publishes a change in the CMS and wants it live immediately — not in an hour. The CMS sends a webhook to `POST /api/revalidate`.

**Task:** Implement the webhook handler. Include webhook secret verification. Show `revalidatePath` and `revalidateTag`. Explain the difference between the two.

**Acceptance Criteria:**
- [ ] Verifies secret: `request.headers.get('x-webhook-secret') !== process.env.REVALIDATE_SECRET` → 401
- [ ] `import { revalidatePath, revalidateTag } from 'next/cache'`
- [ ] `revalidatePath('/blog/my-slug')` — purges the specific blog post's cached page
- [ ] `revalidateTag('posts')` — purges ALL cached fetches/unstable_cache entries tagged 'posts'
- [ ] Difference: `revalidatePath` is URL-based (one page); `revalidateTag` is data-based (all pages using that data)
- [ ] Response: `return Response.json({ revalidated: true })` — CMS needs 200 to not retry
- [ ] Security: without secret verification, anyone can flood your server with revalidation requests
