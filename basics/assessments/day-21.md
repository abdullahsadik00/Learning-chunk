# Day 21 Assessment — Middleware · Auth · Performance · Optimization

**Theme:** You are the platform engineer for a multi-region SaaS app. You must harden auth, optimize performance for Core Web Vitals, and make the app handle edge-cases like rate limiting, geo-routing, and real-time error tracking.

---

### Q1 — Middleware basics ⭐

**Scenario:** Every request to `/dashboard/**` and `/settings/**` must be checked for authentication. Unauthenticated users should be redirected to `/login?callbackUrl=/dashboard` (preserving the original URL so they can be redirected back after login).

**Task:** Write the complete `middleware.ts` including the `config.matcher`. Show how to attach the original path as a query parameter.

**Acceptance Criteria:**
- [ ] File is at project root (same level as `app/`), named `middleware.ts`
- [ ] `export function middleware(request: NextRequest)` — signature correct
- [ ] Reads auth cookie: `request.cookies.get('auth-token')?.value`
- [ ] Builds redirect URL: `const url = new URL('/login', request.url); url.searchParams.set('callbackUrl', request.nextUrl.pathname)`
- [ ] `return NextResponse.redirect(url)` when no token
- [ ] `export const config = { matcher: ['/dashboard/:path*', '/settings/:path*'] }` — limits middleware to protected paths
- [ ] Without matcher: middleware runs on ALL requests including `_next/static`, images, favicons — wasted edge compute

---

### Q2 — redirect() vs rewrite() ⭐

**Scenario:** Explain the difference between `NextResponse.redirect()` and `NextResponse.rewrite()`. Give a real use case for each.

**Task:** Compare behavior from both the browser and the server perspective. Show code for each.

**Acceptance Criteria:**
- [ ] `redirect()`: sends a 307/308 HTTP response to the browser; browser URL changes to the new URL; browser makes a SECOND request
- [ ] `rewrite()`: serves a different page internally; browser URL does NOT change; only one request
- [ ] `redirect()` use case: auth redirect (`/dashboard` → `/login`), moved content (`/old-slug` → `/new-slug`)
- [ ] `rewrite()` use case: A/B testing (URL stays `/pricing`, server secretly serves `/pricing-v2`), locale routing (URL stays `/`, server serves `/en/`), feature flags
- [ ] `NextResponse.redirect(new URL('/login', request.url))` — creates absolute URL from relative path
- [ ] `NextResponse.rewrite(new URL('/pricing-v2', request.url))` — internal serve, URL unchanged

---

### Q3 — RBAC in middleware ⭐⭐

**Scenario:** Your app has three roles: `admin`, `manager`, `viewer`. Route access rules:
- `/admin/**` — admin only
- `/reports/**` — admin and manager
- `/app/**` — all authenticated users

**Task:** Implement RBAC middleware that verifies a JWT, extracts the role, and enforces the rules. Show `verifyJWT` returning a typed payload.

**Acceptance Criteria:**
- [ ] `const token = request.cookies.get('auth-token')?.value` — read from cookie
- [ ] `const payload = await verifyJWT(token)` — returns `{ sub: string, role: Role } | null`
- [ ] If `!payload` → redirect to `/login`
- [ ] RBAC map: `const ROUTE_ROLES = { '/admin': ['admin'], '/reports': ['admin', 'manager'], '/app': ['admin', 'manager', 'viewer'] }`
- [ ] Find matching prefix: `Object.keys(ROUTE_ROLES).find(p => pathname.startsWith(p))`
- [ ] If role not in allowed list → redirect to `/403`
- [ ] `verifyJWT` uses `jose` (`jwtVerify`) — NOT `jsonwebtoken` (not edge-compatible)

---

### Q4 — Middleware: A/B testing ⭐⭐

**Scenario:** You want to test a new `/pricing-v2` page with 50% of visitors. The variant must persist across page loads (so the user doesn't switch variants on refresh). The URL shown to the user must remain `/pricing`.

**Task:** Implement the A/B middleware. Show cookie persistence. Show how to ensure analytics know which variant was served.

**Acceptance Criteria:**
- [ ] Read existing bucket: `let bucket = request.cookies.get('ab-pricing')?.value`
- [ ] Assign if missing: `bucket = Math.random() < 0.5 ? 'control' : 'variant'`
- [ ] Apply rewrite for variant: `if (bucket === 'variant' && pathname === '/pricing') return NextResponse.rewrite(new URL('/pricing-v2', request.url))`
- [ ] Persist cookie: `response.cookies.set('ab-pricing', bucket, { maxAge: 86400 * 30, httpOnly: false })` — `httpOnly: false` so analytics JS can read it
- [ ] Call `NextResponse.next()` first, then set cookie on the response before returning
- [ ] Analytics header: `response.headers.set('x-ab-variant', bucket)` — readable in Server Components via `headers()`

---

### Q5 — Rate limiting ⭐⭐

**Scenario:** The `/api/contact` endpoint receives spam. Limit each IP to 5 requests per 10 minutes. Return 429 with a Retry-After header.

**Task:** Implement the rate limiter in middleware. Show the 429 response. Explain why in-memory stores are insufficient for production.

**Acceptance Criteria:**
- [ ] In-memory map: `const store = new Map<string, { count: number; resetAt: number }>()`
- [ ] Logic: if `!data || now > data.resetAt` → reset; if `data.count >= limit` → 429; else `data.count++`
- [ ] 429 response: `NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil((data.resetAt - now) / 1000)) } })`
- [ ] IP extraction: `request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1'`
- [ ] Production problem: Next.js runs on multiple instances; each has its own Map; user can bypass by hitting different instances
- [ ] Production solution: Redis (Upstash for edge), a shared database, or edge-level rate limiting (Vercel, Cloudflare)

---

### Q6 — NextAuth.js setup ⭐⭐

**Scenario:** Set up NextAuth.js v5 (Auth.js) with GitHub OAuth, Google OAuth, and email/password (Credentials). Include role in the session. Show the route handler.

**Task:** Write `auth.ts` with all three providers, the `jwt` and `session` callbacks to include role, and the `app/api/auth/[...nextauth]/route.ts`.

**Acceptance Criteria:**
- [ ] `import NextAuth from 'next-auth'; import GitHub from 'next-auth/providers/github'; import Google from 'next-auth/providers/google'; import Credentials from 'next-auth/providers/credentials'`
- [ ] `Credentials` provider: `authorize` function fetches user from DB, compares password with `bcrypt.compare`, returns user or `null`
- [ ] `callbacks.jwt`: `if (user) token.role = (user as AppUser).role` — adds role on first sign-in
- [ ] `callbacks.session`: `session.user.role = token.role` — exposes role on session object
- [ ] `pages: { signIn: '/login' }` — custom login page
- [ ] Route handler: `export const { GET, POST } = handlers` — handlers comes from `NextAuth()` destructure
- [ ] TypeScript: extend `next-auth` module declarations to add `role` to `Session` and `JWT` types

---

### Q7 — auth() in Server Components ⭐

**Scenario:** The dashboard page should:
- Redirect unauthenticated users to `/login`
- Show a personalized greeting with the user's name
- Show an admin-only section if `session.user.role === 'admin'`

**Task:** Implement the Server Component page. Show a reusable `requireAuth()` helper.

**Acceptance Criteria:**
- [ ] `import { auth } from '@/auth'; const session = await auth()` — works in Server Components, Route Handlers, and Server Actions
- [ ] `if (!session) redirect('/login')` — `redirect` from `next/navigation`
- [ ] Helper: `export async function requireAuth() { const s = await auth(); if (!s) redirect('/login'); return s; }`
- [ ] `const session = await requireAuth()` — TypeScript knows session is non-null after this
- [ ] `{session.user.role === 'admin' && <AdminPanel />}` — conditional render based on role
- [ ] `auth()` uses the same session as middleware — no double JWT verification; it reads from the cookie

---

### Q8 — Login form with Server Actions ⭐⭐

**Scenario:** Build a login page that:
- Uses a Server Action to call `signIn('credentials', ...)`
- Shows "Invalid email or password" on `AuthError`
- Shows a loading spinner during submission
- Redirects to `callbackUrl` (from query string) after success

**Task:** Write the Server Action and the Client Component login form. Handle both error cases.

**Acceptance Criteria:**
- [ ] Server Action (`'use server'`): `await signIn('credentials', { email, password, redirect: false })` — `redirect: false` to handle errors manually
- [ ] `catch (e) { if (e instanceof AuthError) return { error: 'Invalid email or password' }; throw e; }` — rethrow non-auth errors
- [ ] Client Component: `useFormState(loginAction, {})` — `state.error` displayed as error message
- [ ] `SubmitButton` uses `useFormStatus().pending` — shows "Signing in…" during submission
- [ ] After success: read `callbackUrl` from `useSearchParams()`, call `router.push(callbackUrl ?? '/dashboard')`
- [ ] Security: never trust `callbackUrl` blindly — validate it's a relative path: `callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')`

---

### Q9 — next/image optimization ⭐

**Scenario:** A product page has a hero image (above the fold, 1200×600) and a grid of 12 product thumbnails (below the fold). The team is seeing poor LCP scores.

**Task:** Show the correct `<Image>` usage for both cases. Explain `priority`, `loading`, `sizes`, and how next/image prevents CLS.

**Acceptance Criteria:**
- [ ] Hero (LCP element): `<Image src={hero} alt="..." priority />` — `priority` adds `<link rel="preload">`, uses `loading="eager"`, boosts LCP
- [ ] Thumbnails: `<Image src={thumb} alt="..." width={300} height={300} loading="lazy" />` — deferred, saves bandwidth
- [ ] `sizes` attribute: `sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 300px"` — tells browser which size to fetch at different breakpoints
- [ ] CLS prevention: Next.js reserves space via `aspect-ratio` or `width`/`height` before the image loads — no content jump
- [ ] Remote images: must add `remotePatterns` in `next.config.ts` — security whitelist
- [ ] WebP/AVIF: served automatically if the browser supports it — no code change needed; reduces file size 30–50%

---

### Q10 — next/font and layout shift ⭐

**Scenario:** The site uses Google Fonts via a `<link>` tag in `<head>`. CLS score is 0.2 (poor). The font loads after content, causing text to reflow.

**Task:** Migrate to `next/font/google`. Show the setup in the root layout. Explain why it eliminates CLS.

**Acceptance Criteria:**
- [ ] `import { Inter } from 'next/font/google'; const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })`
- [ ] Root layout: `<html className={inter.variable}><body className={inter.className}>...</body></html>`
- [ ] Why no CLS: next/font downloads the font at build time and self-hosts it — zero external request at runtime
- [ ] next/font also calculates `size-adjust`, `ascent-override`, `descent-override` CSS properties for the fallback font, making it visually identical to the web font — no reflow when font swaps
- [ ] `display: 'swap'` means fallback font shows immediately; but because fallback is sized the same as web font, the swap is invisible
- [ ] No `<link rel="stylesheet">` to Google Fonts needed — remove from layout

---

### Q11 — next/script loading strategies ⭐

**Scenario:** The marketing site has: (1) Google Tag Manager, (2) a cookie consent banner (must run before any tracking), (3) a chat widget (low priority). Each has different timing requirements.

**Task:** Assign the correct `strategy` to each Script. Justify your choices. Show GTM initialization.

**Acceptance Criteria:**
- [ ] Cookie consent: `strategy="beforeInteractive"` — must run before hydration and before any tracking scripts
- [ ] GTM: `strategy="afterInteractive"` — loads after hydration; runs analytics without blocking page render
- [ ] Chat widget: `strategy="lazyOnload"` — lowest priority; loads in idle time; users don't need it on first paint
- [ ] GTM setup: two `<Script>` tags — one for the GTM.js URL, one inline `id="gtm-init"` for `dataLayer` initialization
- [ ] `<Script id="...">` is required for inline scripts — the `id` is Next.js's deduplication key
- [ ] Without `strategy`: scripts default to `afterInteractive`; missing `beforeInteractive` for consent banner means tracking fires before consent — GDPR risk

---

### Q12 — Metadata, SEO, and Open Graph ⭐⭐

**Scenario:** A product page needs:
- Page title: "Product Name | Shop"
- Open Graph image: the product's first image
- Canonical URL
- `noindex` for products marked as `draft`
- JSON-LD structured data (Product schema)

**Task:** Implement `generateMetadata` for `app/products/[id]/page.tsx`. Show how the title template is set in the root layout.

**Acceptance Criteria:**
- [ ] Root layout: `metadata = { title: { default: 'Shop', template: '%s | Shop' } }`
- [ ] `generateMetadata`: `async ({ params }) => { const product = await getProduct(params.id); if (!product) return { title: 'Not Found' }; ... }`
- [ ] `title: product.name` — combines with template to produce "Product Name | Shop"
- [ ] `openGraph: { images: [product.images[0]], type: 'website' }`
- [ ] `alternates: { canonical: \`https://shop.com/products/${params.id}\` }`
- [ ] Draft: `robots: { index: false, follow: false }` (when `product.status === 'draft'`)
- [ ] JSON-LD: `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name: product.name, ... }) }} />`

---

### Q13 — Core Web Vitals and ISR segment config ⭐⭐

**Scenario:** A product page has LCP = 4.2s (poor). Investigation shows: the hero image is not prioritized, the font causes CLS, and the product data is re-fetched on every request (SSR) even though it only changes hourly.

**Task:** Identify the fix for each problem. Show the segment config change from SSR to ISR. List the impact on each Web Vital.

**Acceptance Criteria:**
- [ ] Hero image fix: add `priority` to `<Image>` — LCP element preloaded, browser starts downloading immediately
- [ ] Font fix: migrate to `next/font` — eliminates external font request and CLS-causing reflow
- [ ] SSR → ISR fix: change `export const dynamic = 'force-dynamic'` to `export const revalidate = 3600` — serves cached HTML from CDN edge, reducing TTFB from ~300ms to ~20ms
- [ ] Impact: LCP improves (hero preload + CDN edge serving), CLS → 0 (font fix), TTFB drops dramatically (CDN vs. server)
- [ ] `generateStaticParams` for known product IDs ensures they're pre-built; others served on-demand and cached
- [ ] Segment config goes in the page.tsx file body — not inside a function

---

### Q14 — Web Vitals monitoring ⭐⭐

**Scenario:** The team wants to track Core Web Vitals in production and alert when p75 LCP exceeds 2.5s. Show the setup from Next.js to your analytics/alerting system.

**Task:** Implement `useReportWebVitals`. Show the API route that receives metrics. Describe how you'd set up p75 monitoring.

**Acceptance Criteria:**
- [ ] Client Component: `import { useReportWebVitals } from 'next/web-vitals'; useReportWebVitals(metric => { sendToAnalytics(metric) })`
- [ ] `metric` shape: `{ name: 'LCP', value: 2100, rating: 'good', id: '...', navigationType: 'navigate' }`
- [ ] `sendToAnalytics`: `navigator.sendBeacon('/api/vitals', JSON.stringify(metric))` — non-blocking, survives page unload
- [ ] Route handler `POST /api/vitals`: stores metrics in TimeSeries DB (ClickHouse, InfluxDB) or forwards to Datadog/Grafana
- [ ] p75 monitoring: compute 75th percentile of `LCP` values over a rolling window; alert when p75 > 2500ms
- [ ] `rating` field: `'good'` (≤2.5s), `'needs-improvement'` (≤4s), `'poor'` (>4s) — pre-computed by the library; use for dashboards

---

### Q15 — Sentry integration + global error boundary ⭐⭐⭐

**Scenario:** The app crashes for some users in production but errors aren't logged anywhere. Set up Sentry for both client and server errors. Implement `global-error.tsx` that reports uncaught errors and lets users retry.

**Task:** Describe the Sentry setup process. Write `global-error.tsx`. Show a Server Action that wraps errors with context before reporting.

**Acceptance Criteria:**
- [ ] Setup: `npx @sentry/wizard@latest -i nextjs` — auto-generates `sentry.client.config.ts`, `sentry.server.config.ts`, `instrumentation.ts`, wraps `next.config.ts`
- [ ] `global-error.tsx` (in root of `app/`): `'use client'`; receives `{ error: Error, reset: () => void }`
- [ ] `useEffect(() => { Sentry.captureException(error) }, [error])` — reports error immediately on mount
- [ ] Shows user-friendly message + Retry button that calls `reset()`
- [ ] `global-error.tsx` catches errors from root `layout.tsx` — unlike `error.tsx` which only catches page-level errors
- [ ] Server Action with context: `Sentry.withScope(scope => { scope.setTag('action', 'updateUser'); scope.setUser({ id: session.user.id }); Sentry.captureException(error); })`
- [ ] `error.digest` in `error.tsx`: a server-generated hash — safe to show to users; matches Sentry event `fingerprint`; helps correlate user reports to Sentry events
