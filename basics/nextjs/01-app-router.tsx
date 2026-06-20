// ═══════════════════════════════════════════════════════════════
// NEXT.JS 01: APP ROUTER & ROUTING  (Day 18)
// Note: These are teaching reference files. Next.js needs a full
//       project to run. Try patterns in:
//       npx create-next-app@latest my-app --typescript --app
// Type-check: npm run check  (after npm install)
// ═══════════════════════════════════════════════════════════════
//
// WHAT IS NEXT.JS?
//  A React framework that adds to plain React:
//  • File-based routing          — folders become URL segments
//  • Multiple rendering modes    — SSR, SSG, ISR, CSR per page
//  • Server Components           — run only on the server
//  • API Routes / Route Handlers — backend inside the same project
//  • Built-in optimizations      — images, fonts, scripts, bundles
//
// THE TWO ROUTERS:
//  Pages Router (legacy, Next.js ≤12) — pages/ directory
//  App Router   (current, Next.js 13+) — app/ directory  ← we use this

import React from 'react';

// ───────────────────────────────────────────────────────────────
// 1. RENDERING STRATEGIES
// ───────────────────────────────────────────────────────────────
//
// CSR — CLIENT-SIDE RENDERING
//   Browser gets empty HTML + JS bundle → JS fetches data → renders
//   ❌ Poor SEO (crawler sees empty page)
//   ❌ Slow First Contentful Paint
//   ✅ Rich interactivity after load
//   Used for: dashboards behind auth, SPAs
//
// SSR — SERVER-SIDE RENDERING  (export const dynamic = 'force-dynamic')
//   Browser requests → server fetches data + renders HTML → sends complete page
//   ✅ Great SEO, ✅ Fast FCP
//   ⚠️  Server CPU on every request
//   Used for: personalised pages, real-time data
//
// SSG — STATIC SITE GENERATION  (default, export const revalidate = false)
//   Build time: fetch data → generate HTML → store files on CDN
//   ✅ Fastest delivery (CDN edge), ✅ Great SEO
//   ⚠️  Data can go stale between builds
//   Used for: blogs, docs, marketing pages
//
// ISR — INCREMENTAL STATIC REGENERATION  (export const revalidate = N)
//   Serve cached static page → after N seconds regenerate in background
//   ✅ Fast (cached), ✅ Fresh data, ✅ Great SEO
//   Used for: product pages, news, anything updated periodically
//
// DECISION GUIDE:
//  Is the data the same for every user?
//    → SSG or ISR
//  Does the data change frequently AND per-user?
//    → SSR
//  Is interactivity the main feature (auth-gated)?
//    → CSR (Client Component)

// ───────────────────────────────────────────────────────────────
// 2. FILE CONVENTIONS (App Router)
// ───────────────────────────────────────────────────────────────
//
// app/
// ├── layout.tsx        ← shared UI wrapping all children (REQUIRED at root)
// ├── page.tsx          ← UI for the route segment  →  /
// ├── loading.tsx       ← Suspense fallback shown while page loads
// ├── error.tsx         ← error boundary for this segment
// ├── not-found.tsx     ← rendered when notFound() is called
// ├── route.ts          ← API handler (no UI, just HTTP handlers)
// │
// ├── about/
// │   └── page.tsx      →  /about
// │
// ├── blog/
// │   ├── page.tsx      →  /blog
// │   └── [slug]/
// │       └── page.tsx  →  /blog/my-post  (dynamic segment)
// │
// ├── docs/
// │   └── [...slug]/
// │       └── page.tsx  →  /docs/a/b/c    (catch-all)
// │
// ├── (marketing)/      ← route GROUP — parentheses excluded from URL
// │   ├── layout.tsx    ← shared layout only for group members
// │   ├── pricing/page.tsx   →  /pricing
// │   └── features/page.tsx  →  /features
// │
// ├── @modal/           ← PARALLEL ROUTE slot
// │   ├── default.tsx   ← rendered when slot has no active match
// │   └── login/page.tsx
// │
// └── _components/      ← PRIVATE folder — never becomes a route

// ───────────────────────────────────────────────────────────────
// 3. PAGE + LAYOUT
// ───────────────────────────────────────────────────────────────

// ── 3a. Root layout (app/layout.tsx) ──
//
// import type { Metadata } from 'next';
// import { Inter } from 'next/font/google';
// import './globals.css';
//
// const inter = Inter({ subsets: ['latin'] });
//
// export const metadata: Metadata = {
//     title: { default: 'My App', template: '%s | My App' },
//     description: 'Built with Next.js 15',
// };
//
// export default function RootLayout({ children }: { children: React.ReactNode }) {
//     return (
//         <html lang="en">
//             <body className={inter.className}>
//                 <nav>…</nav>
//                 <main>{children}</main>
//                 <footer>…</footer>
//             </body>
//         </html>
//     );
// }

// ── 3b. Page component (app/page.tsx) ──
//
// export default function HomePage() {
//     return <h1>Home</h1>;
// }

// ── 3c. Nested layout (app/blog/layout.tsx) ──
//   Wraps all pages inside /blog/** without re-rendering on navigation.
//   Root layout → Blog layout → page → nested page
//
// export default function BlogLayout({ children }: { children: React.ReactNode }) {
//     return (
//         <div className="blog-layout">
//             <aside>Categories…</aside>
//             <article>{children}</article>
//         </div>
//     );
// }

// ───────────────────────────────────────────────────────────────
// 4. DYNAMIC ROUTES
// ───────────────────────────────────────────────────────────────
//
// [slug]       → /blog/hello-world   — params.slug = "hello-world"
// [...slug]    → /docs/a/b/c        — params.slug = ["a","b","c"]
// [[...slug]]  → /docs OR /docs/a   — params.slug = undefined | string[]

// ── 4a. Dynamic segment (app/blog/[slug]/page.tsx) ──
//
// interface BlogPostProps { params: { slug: string }; searchParams: Record<string, string>; }
//
// export default async function BlogPost({ params, searchParams }: BlogPostProps) {
//     const post = await getPost(params.slug);
//     if (!post) notFound();          // renders not-found.tsx
//     return <article><h1>{post.title}</h1></article>;
// }
//
// // Pre-generate pages at build time (SSG)
// export async function generateStaticParams() {
//     const posts = await getPosts();
//     return posts.map(p => ({ slug: p.slug }));
// }
//
// // Dynamic metadata per page
// export async function generateMetadata({ params }: BlogPostProps) {
//     const post = await getPost(params.slug);
//     return { title: post?.title ?? 'Not Found' };
// }

// ── 4b. Catch-all (app/docs/[...slug]/page.tsx) ──
//
// export default function DocsPage({ params }: { params: { slug: string[] } }) {
//     // /docs/api/users → params.slug = ["api","users"]
//     return <pre>{params.slug.join('/')}</pre>;
// }

// ───────────────────────────────────────────────────────────────
// 5. ROUTE GROUPS
// ───────────────────────────────────────────────────────────────
//
// (groupName) in the folder name is stripped from the URL.
// Use to: share a layout among a set of routes without affecting the URL.
//
// app/
//   (marketing)/       ← group — URL stays /pricing, /features
//     layout.tsx       ← marketing header only for these pages
//     pricing/page.tsx
//     features/page.tsx
//   (dashboard)/       ← separate layout for auth'd pages
//     layout.tsx       ← sidebar nav + auth check
//     overview/page.tsx   →  /overview
//     settings/page.tsx   →  /settings

// ───────────────────────────────────────────────────────────────
// 6. PARALLEL ROUTES
// ───────────────────────────────────────────────────────────────
//
// Render multiple pages in the same layout simultaneously.
// Named with @slotName convention — each slot is a prop.
//
// app/
//   layout.tsx         ← receives children + modal + analytics as props
//   page.tsx
//   @modal/
//     default.tsx      ← null — no modal by default
//     login/page.tsx   ← rendered in the modal slot
//   @analytics/
//     default.tsx
//     page.tsx
//
// // app/layout.tsx
// export default function Layout({
//     children,
//     modal,
//     analytics,
// }: {
//     children:  React.ReactNode;
//     modal:     React.ReactNode;  // @modal slot
//     analytics: React.ReactNode;  // @analytics slot
// }) {
//     return (
//         <html><body>
//             {children}
//             {modal}       {/* rendered at same time as main content */}
//             {analytics}
//         </body></html>
//     );
// }

// ───────────────────────────────────────────────────────────────
// 7. INTERCEPTING ROUTES
// ───────────────────────────────────────────────────────────────
//
// Intercept a route to show it in a different context (e.g. modal)
// while the actual URL changes. Direct navigation shows the full page.
//
// Convention:
//  (.)  = intercept same level
//  (..) = intercept one level up   ← most common
//  (...) = intercept from root
//
// Pattern: photo gallery with modal on click, full page on direct URL
//
// app/
//   photos/
//     [id]/page.tsx           ← /photos/1  full page (direct access)
//   @modal/
//     (..photos)/
//       [id]/page.tsx         ← intercepts /photos/1 → shows modal
//     default.tsx             ← null
//
// WHY USEFUL:
//   User clicks photo card → modal opens, URL becomes /photos/1
//   User shares URL or refreshes → full photo page renders instead

// ───────────────────────────────────────────────────────────────
// 8. SPECIAL FILES: loading · error · not-found
// ───────────────────────────────────────────────────────────────

// ── 8a. loading.tsx — automatic Suspense boundary ──
//   Next.js wraps page.tsx in <Suspense fallback={<Loading />}>.
//   Shown instantly; page streams in when ready.
//
// export default function Loading() {
//     return (
//         <div className="skeleton">
//             <div className="skeleton-title" />
//             <div className="skeleton-line" />
//             <div className="skeleton-line" />
//         </div>
//     );
// }

// ── 8b. error.tsx — client-side error boundary ──
//   Must be 'use client'. Receives error + reset callback.
//
// 'use client';
// export default function Error({
//     error,
//     reset,
// }: {
//     error: Error & { digest?: string };
//     reset: () => void;
// }) {
//     return (
//         <div>
//             <h2>Something went wrong</h2>
//             <p>{error.message}</p>
//             <button onClick={reset}>Try again</button>
//         </div>
//     );
// }

// ── 8c. not-found.tsx — 404 within a segment ──
//
// import Link from 'next/link';
// export default function NotFound() {
//     return (
//         <div>
//             <h2>Page Not Found</h2>
//             <Link href="/">Go Home</Link>
//         </div>
//     );
// }

// ───────────────────────────────────────────────────────────────
// 9. NAVIGATION
// ───────────────────────────────────────────────────────────────
//
// next/link → <Link href="/about">About</Link>
//   • Prefetches linked pages in the viewport automatically
//   • Client-side navigation (no full reload)
//   • replace prop: replace history entry instead of push
//
// next/navigation hooks (Client Components only):
//   useRouter()        — programmatic navigation: router.push('/about')
//   usePathname()      — current pathname string
//   useSearchParams()  — read query string
//   useParams()        — read dynamic segment values
//
// Server-side redirect (Server Components / Server Actions):
//   import { redirect } from 'next/navigation';
//   redirect('/login');   // throws — put AFTER try/catch

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

// Q1: What is the difference between SSG and ISR?
// → SSG: pages built once at deploy time, served from CDN forever.
//   ISR: same CDN delivery, but Next.js regenerates the page in the
//   background after `revalidate` seconds — stale-while-revalidate.
//   ISR = SSG freshness + SSG speed.

// Q2: What does (marketing) in a folder name do?
// → The parentheses create a route GROUP. The word "marketing" is
//   stripped from the URL — it only affects which layout.tsx wraps
//   those routes. /pricing stays /pricing, not /marketing/pricing.

// Q3: When does loading.tsx render?
// → Next.js automatically wraps the page segment in a Suspense
//   boundary. loading.tsx is the fallback. It renders instantly on
//   navigation while the server streams the page data.

// Q4: What is the difference between [...slug] and [[...slug]]?
// → [...slug]   is required — the route only matches if at least one
//                segment is present: /docs/a works, /docs does not.
//   [[...slug]] is optional — also matches the bare path /docs
//               (params.slug is undefined in that case).

// Q5: Implement a blog post page component
interface BlogPostPageProps {
    params: { slug: string };
}

// Standalone teaching version — in a real Next.js app this would be async
// and fetch data from a database or API.
function BlogPostPage({ params }: BlogPostPageProps) {
    return (
        <article>
            <h1>Post: {params.slug}</h1>
            <p>Content goes here…</p>
        </article>
    );
}

// Q6: What is a parallel route and when would you use one?
// → A @slotName folder creates a named "slot" that is injected as a
//   prop into the parent layout. Both slots render simultaneously.
//   Use cases: modals that change the URL (Instagram photo modal),
//   side-by-side dashboards with independent loading states,
//   analytics widgets that load separately from the main content.

// Q7: What happens when a user directly navigates to a URL that
//     was previously shown in a modal via intercepting routes?
// → The intercepting route only activates during client-side
//   navigation. A direct URL (refresh, shared link) bypasses the
//   intercept and renders the full page at that route instead.

// Q8: What is the difference between <Link> and useRouter().push()?
// → <Link> is declarative — renders an <a> tag, handles prefetch
//   automatically, works with accessibility. Use for navigation in JSX.
//   useRouter().push() is imperative — call it inside event handlers
//   or effects for programmatic navigation (form submit, auth check).

export { BlogPostPage };
