// ═══════════════════════════════════════════════════════════════
// NEXT.JS 03: DATA FETCHING  (Day 20a)
// ═══════════════════════════════════════════════════════════════
//
// DATA FETCHING OVERVIEW:
//
//  WHERE?       Server Component (default)  ← preferred
//               Route Handler               ← for API endpoints
//               Client Component            ← when server fetch isn't possible
//
//  HOW?         fetch() with cache options  ← automatic deduplication
//               ORM / DB driver (Prisma)    ← in Server Components only
//               SWR / React Query           ← client-side, real-time needs

import React, { Suspense, useState, useEffect } from 'react';

// ───────────────────────────────────────────────────────────────
// 1. FETCH WITH CACHE OPTIONS
// ───────────────────────────────────────────────────────────────
//
// Next.js EXTENDS the native fetch with a 4th cache option:
//
// fetch(url, { cache: 'force-cache' })    — SSG: cache indefinitely (default)
// fetch(url, { cache: 'no-store' })       — SSR: never cache, always fresh
// fetch(url, { next: { revalidate: N } }) — ISR: cache, refresh after N seconds
// fetch(url, { next: { tags: ['tag'] } }) — tag for on-demand revalidation
//
// // app/posts/page.tsx
// export default async function PostsPage() {
//     // ISR — fresh every 60 seconds
//     const posts = await fetch('https://api.example.com/posts', {
//         next: { revalidate: 60 },
//     }).then(r => r.json());
//
//     return (
//         <ul>
//             {posts.map((p: { id: string; title: string }) => (
//                 <li key={p.id}>{p.title}</li>
//             ))}
//         </ul>
//     );
// }

// ───────────────────────────────────────────────────────────────
// 2. PARALLEL vs SEQUENTIAL DATA FETCHING
// ───────────────────────────────────────────────────────────────
//
// SEQUENTIAL (slow) — each await blocks the next
//
// export default async function SlowPage() {
//     const user    = await getUser();    // 200ms wait
//     const posts   = await getPosts();   // then 300ms wait
//     const friends = await getFriends(); // then 150ms wait
//     // Total: 650ms
// }
//
// PARALLEL (fast) — all start immediately, await the group
//
// export default async function FastPage() {
//     const [user, posts, friends] = await Promise.all([
//         getUser(),    // ┐
//         getPosts(),   // ├─ all three in-flight simultaneously
//         getFriends(), // ┘
//     ]);
//     // Total: max(200, 300, 150) = 300ms
// }
//
// RULE: use Promise.all when the requests are INDEPENDENT.
//       Use sequential when request B needs data from request A.

// ───────────────────────────────────────────────────────────────
// 3. SUSPENSE + STREAMING
// ───────────────────────────────────────────────────────────────
//
// Suspense lets independent sections of a page load on their own
// schedule. The browser receives the shell HTML immediately, then
// each Suspense boundary is filled in ("streamed") as it resolves.
//
// app/dashboard/page.tsx  (Server Component)
//
// export default function DashboardPage() {
//     return (
//         <div className="dashboard">
//             <h1>Dashboard</h1>
//
//             {/* Each boundary loads and renders independently */}
//             <Suspense fallback={<StatsSkeleton />}>
//                 <StatsSection />       {/* 1 second */}
//             </Suspense>
//
//             <Suspense fallback={<ChartSkeleton />}>
//                 <RevenueChart />       {/* 2 seconds */}
//             </Suspense>
//
//             <Suspense fallback={<TableSkeleton />}>
//                 <RecentOrders />       {/* 3 seconds */}
//             </Suspense>
//         </div>
//     );
//     // Browser gets <h1>Dashboard</h1> + three skeletons IMMEDIATELY.
//     // StatsSection streams in at 1s, Chart at 2s, Orders at 3s.
//     // Without Suspense: entire page would block for 3 seconds.
// }

// ── Teaching version: skeleton components ──
function StatsSkeleton() {
    return (
        <div style={{ display: 'flex', gap: 16 }}>
            {[1, 2, 3].map(i => (
                <div key={i} style={{
                    width: 120, height: 80,
                    background: '#e5e7eb', borderRadius: 8,
                    animation: 'pulse 2s infinite',
                }} />
            ))}
        </div>
    );
}

function ChartSkeleton() {
    return (
        <div style={{
            width: '100%', height: 200,
            background: '#e5e7eb', borderRadius: 8,
        }} />
    );
}

// ───────────────────────────────────────────────────────────────
// 4. REQUEST MEMOIZATION
// ───────────────────────────────────────────────────────────────
//
// Next.js AUTOMATICALLY deduplicates fetch() calls with the same
// URL+options during a single render pass (one request per render).
//
// This means multiple components can call the same fetch without
// triggering multiple network requests.
//
// // lib/data.ts
// export async function getUser(id: string) {
//     return fetch(`/api/users/${id}`).then(r => r.json());
//     // ↑ Automatically memoized for the duration of this render
// }
//
// // app/layout.tsx
// export default async function Layout({ children }) {
//     const user = await getUser('123');  // fetch #1 — fires network request
//     return <Header user={user}>{children}</Header>;
// }
//
// // app/page.tsx  (same render pass)
// export default async function Page() {
//     const user = await getUser('123');  // returns MEMOIZED result — no new request
//     return <Profile user={user} />;
// }
//
// For non-fetch functions, use React's cache():
//
// import { cache } from 'react';
//
// export const getUser = cache(async (id: string) => {
//     return prisma.user.findUnique({ where: { id } });
// });

// ───────────────────────────────────────────────────────────────
// 5. unstable_cache — PERSISTENT CACHING
// ───────────────────────────────────────────────────────────────
//
// fetch() memoizes per-render. unstable_cache persists across requests.
// Use it to cache expensive DB queries between requests.
//
// // lib/data.ts
// import { unstable_cache } from 'next/cache';
//
// export const getProducts = unstable_cache(
//     async (categoryId: string) => {
//         return prisma.product.findMany({ where: { categoryId } });
//     },
//     ['products'],                // cache key prefix
//     { revalidate: 3600, tags: ['products'] }  // 1-hour TTL + tag
// );
//
// // Revalidate by tag from a Server Action or Route Handler:
// import { revalidateTag } from 'next/cache';
// revalidateTag('products');   // invalidates ALL caches tagged 'products'
//
// // Revalidate by path:
// import { revalidatePath } from 'next/cache';
// revalidatePath('/products');

// ───────────────────────────────────────────────────────────────
// 6. CLIENT-SIDE DATA FETCHING
// ───────────────────────────────────────────────────────────────
//
// Use when: data changes in real-time, user-specific after auth,
//           polling, websocket updates.

// ── 6a. useEffect + fetch (minimal, no library) ──

interface Post { id: number; title: string; body: string; }

function PostList() {
    const [posts, setPosts]     = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        fetch('https://jsonplaceholder.typicode.com/posts?_limit=5')
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json() as Promise<Post[]>;
            })
            .then(data => { if (!cancelled) setPosts(data); })
            .catch(err  => { if (!cancelled) setError(err.message); })
            .finally(()  => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };  // cleanup on unmount
    }, []);

    if (loading) return <p>Loading…</p>;
    if (error)   return <p>Error: {error}</p>;

    return (
        <ul>
            {posts.map(p => <li key={p.id}>{p.title}</li>)}
        </ul>
    );
}

// ── 6b. React Query (client, with caching/dedup/refetch) ──
//
// // app/providers.tsx  ('use client')
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
//
// export function Providers({ children }: { children: React.ReactNode }) {
//     const [queryClient] = useState(() => new QueryClient({
//         defaultOptions: { queries: { staleTime: 60_000 } },
//     }));
//     return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
// }
//
// // app/layout.tsx — wrap root with Providers
// import { Providers } from './providers';
// export default function RootLayout({ children }) {
//     return <html><body><Providers>{children}</Providers></body></html>;
// }
//
// // components/UserProfile.tsx  ('use client')
// import { useQuery } from '@tanstack/react-query';
//
// export function UserProfile({ userId }: { userId: string }) {
//     const { data, isLoading, error } = useQuery({
//         queryKey: ['user', userId],
//         queryFn: () => fetch(`/api/users/${userId}`).then(r => r.json()),
//         staleTime: 60_000,
//     });
//
//     if (isLoading) return <Spinner />;
//     if (error)     return <Error />;
//     return <div>{data.name}</div>;
// }

// ───────────────────────────────────────────────────────────────
// 7. HYBRID APPROACH — Server initial + Client refresh
// ───────────────────────────────────────────────────────────────
//
// Pattern: server fetches initial data (fast, SEO), client keeps
// it fresh with React Query's initialData.
//
// // app/posts/page.tsx  (Server Component)
// export default async function PostsPage() {
//     const initialPosts = await db.post.findMany({ take: 10 });  // server
//     return <PostsList initialPosts={initialPosts} />;
// }
//
// // components/PostsList.tsx  ('use client')
// import { useQuery } from '@tanstack/react-query';
//
// export function PostsList({ initialPosts }: { initialPosts: Post[] }) {
//     const { data: posts } = useQuery({
//         queryKey: ['posts'],
//         queryFn: () => fetch('/api/posts').then(r => r.json()),
//         initialData: initialPosts,  // use server data immediately
//         staleTime: 60_000,          // treat as fresh for 1 minute
//     });
//
//     return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
// }

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

// Q1: What is the difference between fetch cache: 'no-store' and
//     next: { revalidate: 0 }?
// → Both make the fetch dynamic (always re-fetches on request).
//   cache: 'no-store' is the Web Fetch API standard way to opt out
//   of all caching. next: { revalidate: 0 } is Next.js's equivalent.
//   Either opts the page into SSR behaviour. Prefer cache: 'no-store'.

// Q2: When would you use sequential fetching over parallel?
// → When request B needs data returned by request A:
//   const user   = await getUser(id);
//   const orders = await getOrders(user.accountId);  // needs user first
//   Anything else should be parallel with Promise.all.

// Q3: What does React.cache() do and when is it different from fetch memoization?
// → fetch() memoization is automatic for HTTP calls.
//   React.cache() manually memoizes any async function — including
//   Prisma queries, file reads, or any non-fetch operation.
//   Both reset between requests; neither persists to disk.
//   Use React.cache() when you're calling DB/ORM directly.

// Q4: Implement a custom hook for data fetching with loading + error state.
function useFetch<T>(url: string) {
    const [data, setData]       = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        fetch(url)
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json() as Promise<T>;
            })
            .then(d  => { if (!cancelled) { setData(d); setLoading(false); } })
            .catch(e => { if (!cancelled) { setError(e.message); setLoading(false); } });

        return () => { cancelled = true; };
    }, [url]);

    return { data, loading, error };
}

// Q5: What is the advantage of the hybrid server + React Query initialData pattern?
// → Best of both worlds:
//   • Server fetch → page renders with data immediately (SEO, fast FCP)
//   • React Query initialData → treats server data as the starting cache
//   • Background refetch after staleTime → stays fresh
//   • No loading spinner on first render — data is already there

// Q6: What is revalidateTag used for?
// → On-demand cache invalidation. When you mutate data (Server Action,
//   Route Handler), call revalidateTag('products') to immediately
//   invalidate all cached fetch() and unstable_cache() entries
//   tagged with 'products'. Next request gets fresh data.
//   More precise than revalidatePath — invalidates by data type, not URL.

export { StatsSkeleton, ChartSkeleton, PostList, useFetch };
