// ═══════════════════════════════════════════════════════════════
// NEXT.JS 07: PRACTICE PROBLEMS  (Days 18–21)
// ═══════════════════════════════════════════════════════════════
//
// Three tiers:
//   🟢 EASY    — one concept at a time, ~10–20 min each
//   🟡 MEDIUM  — two concepts combined, ~30–45 min each
//   🔴 HARD    — full system design + implementation, 1–2 hrs each

import React, { useState, useEffect, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════
// 🟢 EASY PROBLEMS
// ═══════════════════════════════════════════════════════════════

// ── E1. Dynamic blog post page ──────────────────────────────────
//
// PROBLEM: Build a blog post page at /blog/[slug].
//   • Fetch the post by slug (you can mock getPost below)
//   • Show 404 if post doesn't exist
//   • Generate metadata (title, description) for SEO
//   • Pre-generate the top 5 most-viewed posts at build time
//
// CONCEPTS: dynamic routes, generateStaticParams, generateMetadata, notFound()
//
// SOLUTION OUTLINE:
//
// interface Post { slug: string; title: string; body: string; excerpt: string; }
//
// async function getPost(slug: string): Promise<Post | null> {
//     // In real app: DB or CMS call
//     const posts: Post[] = [
//         { slug: 'hello-world', title: 'Hello World', body: '…', excerpt: '…' },
//     ];
//     return posts.find(p => p.slug === slug) ?? null;
// }
//
// export async function generateStaticParams() {
//     const topPosts = await getTopPosts(5);
//     return topPosts.map(p => ({ slug: p.slug }));
// }
//
// export async function generateMetadata({ params }: { params: { slug: string } }) {
//     const post = await getPost(params.slug);
//     if (!post) return { title: 'Not Found' };
//     return { title: post.title, description: post.excerpt };
// }
//
// export default async function BlogPostPage({ params }: { params: { slug: string } }) {
//     const post = await getPost(params.slug);
//     if (!post) notFound();
//
//     return (
//         <article>
//             <h1>{post.title}</h1>
//             <p>{post.body}</p>
//         </article>
//     );
// }

// ── E2. Route Handler: GET /api/posts ───────────────────────────
//
// PROBLEM: Create a GET route handler that:
//   • Returns a list of posts as JSON
//   • Accepts a ?limit=N query param (default 10, max 50)
//   • Returns 400 if limit is not a valid number
//   • Adds cache headers (stale-while-revalidate=60)
//
// CONCEPTS: Route Handler, NextRequest, searchParams, NextResponse
//
// SOLUTION OUTLINE:
//
// // app/api/posts/route.ts
// import { NextRequest, NextResponse } from 'next/server';
//
// export async function GET(request: NextRequest) {
//     const raw   = request.nextUrl.searchParams.get('limit') ?? '10';
//     const limit = parseInt(raw, 10);
//
//     if (isNaN(limit) || limit < 1) {
//         return NextResponse.json({ error: 'Invalid limit' }, { status: 400 });
//     }
//
//     const safeLimit = Math.min(limit, 50);
//     const posts     = await db.post.findMany({ take: safeLimit });
//
//     return NextResponse.json(posts, {
//         headers: {
//             'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
//         },
//     });
// }

// ── E3. loading.tsx skeleton ────────────────────────────────────
//
// PROBLEM: The /dashboard page fetches data and takes ~1 second.
//   Create a loading.tsx skeleton that matches the page layout:
//   three stat cards at the top, one large chart below.
//
// CONCEPTS: loading.tsx, Suspense, skeleton UI
//
// SOLUTION (React version — in Next.js this would be in app/dashboard/loading.tsx):

function DashboardSkeleton() {
    const card = (
        <div style={{
            flex: 1, height: 80, borderRadius: 8,
            background: 'linear-gradient(90deg, #e5e7eb 25%, #f9fafb 50%, #e5e7eb 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
        }} />
    );

    return (
        <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                {card}{card}{card}
            </div>
            <div style={{
                height: 300, borderRadius: 8,
                background: 'linear-gradient(90deg, #e5e7eb 25%, #f9fafb 50%, #e5e7eb 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
            }} />
        </div>
    );
}

// ── E4. Error boundary page ─────────────────────────────────────
//
// PROBLEM: Create error.tsx for the /dashboard segment that:
//   • Shows a user-friendly error message
//   • Has a "Try again" button that calls reset()
//   • Shows the error digest (production error ID) for support
//
// CONCEPTS: error.tsx, 'use client', reset callback
//
// // app/dashboard/error.tsx
// 'use client';
// export default function DashboardError({
//     error,
//     reset,
// }: {
//     error: Error & { digest?: string };
//     reset: () => void;
// }) {
//     return (
//         <div role="alert">
//             <h2>Dashboard failed to load</h2>
//             <p>Our team has been notified. Reference: {error.digest}</p>
//             <button onClick={reset}>Try again</button>
//         </div>
//     );
// }

// ═══════════════════════════════════════════════════════════════
// 🟡 MEDIUM PROBLEMS
// ═══════════════════════════════════════════════════════════════

// ── M1. Contact form with Server Actions ────────────────────────
//
// PROBLEM: Build a contact form with:
//   • Server Action for submission (validate + send email + store in DB)
//   • useFormState for error/success feedback
//   • useFormStatus for pending state
//   • Rate limit: max 3 submissions per email per hour
//   • zod validation: name (min 2), email (valid), message (min 20)
//
// CONCEPTS: Server Actions, useFormState, useFormStatus, zod, rate limiting
//
// // actions/contact.ts  ('use server')
// import { z } from 'zod';
// import { RateLimiter } from '@/lib/rate-limiter';
//
// const schema = z.object({
//     name:    z.string().min(2),
//     email:   z.string().email(),
//     message: z.string().min(20),
// });
//
// const limiter = new RateLimiter({ max: 3, window: 3600 * 1000 });
//
// export async function contactAction(prev: unknown, formData: FormData) {
//     const email = formData.get('email') as string;
//
//     if (await limiter.isLimited(email)) {
//         return { error: 'Too many submissions. Try again in an hour.' };
//     }
//
//     const result = schema.safeParse(Object.fromEntries(formData));
//     if (!result.success) {
//         return { errors: result.error.flatten().fieldErrors };
//     }
//
//     await db.contact.create({ data: result.data });
//     await sendEmail(result.data);
//
//     return { success: true };
// }

// ── Teaching version: contact form state machine ──
type ContactState =
    | { status: 'idle' }
    | { status: 'pending' }
    | { status: 'success' }
    | { status: 'error'; message: string }
    | { status: 'validation'; errors: Record<string, string> };

function validateContact(data: { name: string; email: string; message: string }) {
    const errors: Record<string, string> = {};
    if (data.name.length < 2)    errors.name    = 'At least 2 characters';
    if (!data.email.includes('@')) errors.email  = 'Invalid email';
    if (data.message.length < 20) errors.message = 'At least 20 characters';
    return errors;
}

function ContactForm() {
    const [state, setState] = useState<ContactState>({ status: 'idle' });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd   = new FormData(e.currentTarget);
        const data = {
            name:    fd.get('name')    as string,
            email:   fd.get('email')   as string,
            message: fd.get('message') as string,
        };

        const errors = validateContact(data);
        if (Object.keys(errors).length > 0) {
            setState({ status: 'validation', errors });
            return;
        }

        setState({ status: 'pending' });
        await new Promise(r => setTimeout(r, 800)); // simulate server
        setState({ status: 'success' });
    };

    const errors = state.status === 'validation' ? state.errors : {};

    return (
        <form onSubmit={handleSubmit}>
            {state.status === 'success' && <p style={{ color: 'green' }}>Message sent!</p>}

            <div>
                <label>Name</label>
                <input name="name" />
                {errors.name && <p style={{ color: 'red' }}>{errors.name}</p>}
            </div>
            <div>
                <label>Email</label>
                <input name="email" type="email" />
                {errors.email && <p style={{ color: 'red' }}>{errors.email}</p>}
            </div>
            <div>
                <label>Message</label>
                <textarea name="message" rows={4} />
                {errors.message && <p style={{ color: 'red' }}>{errors.message}</p>}
            </div>

            <button type="submit" disabled={state.status === 'pending'}>
                {state.status === 'pending' ? 'Sending…' : 'Send'}
            </button>
        </form>
    );
}

// ── M2. Infinite scroll with React Query ────────────────────────
//
// PROBLEM: Build a post feed with infinite scroll that:
//   • Loads first 10 posts on mount
//   • Loads next 10 when user scrolls to bottom
//   • Shows a spinner while fetching more
//   • Handles the "no more posts" state gracefully
//
// CONCEPTS: useInfiniteQuery, IntersectionObserver, React Query cursor pagination
//
// 'use client';
// import { useInfiniteQuery } from '@tanstack/react-query';
//
// export function InfinitePostFeed() {
//     const loaderRef = useRef<HTMLDivElement>(null);
//
//     const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
//         queryKey: ['posts'],
//         queryFn: ({ pageParam = null }) =>
//             fetch(`/api/posts?cursor=${pageParam ?? ''}`).then(r => r.json()),
//         getNextPageParam: (last) => last.nextCursor ?? null,
//         initialPageParam: null,
//     });
//
//     useEffect(() => {
//         const el  = loaderRef.current;
//         const obs = new IntersectionObserver(entries => {
//             if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
//                 fetchNextPage();
//             }
//         }, { threshold: 0.1 });
//
//         if (el) obs.observe(el);
//         return () => obs.disconnect();
//     }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
//
//     const posts = data?.pages.flatMap(p => p.posts) ?? [];
//
//     return (
//         <div>
//             {posts.map(post => <PostCard key={post.id} post={post} />)}
//             <div ref={loaderRef}>
//                 {isFetchingNextPage && <Spinner />}
//                 {!hasNextPage && <p>No more posts</p>}
//             </div>
//         </div>
//     );
// }

// ── Teaching version: cursor-based infinite scroll (no React Query) ──
interface PostItem { id: number; title: string; }

function InfiniteScrollDemo() {
    const [posts, setPosts]     = useState<PostItem[]>([]);
    const [page, setPage]       = useState(1);
    const [loading, setLoading] = useState(false);
    const [done, setDone]       = useState(false);
    const loaderRef = useRef<HTMLDivElement>(null);

    const fetchPage = async (p: number) => {
        setLoading(true);
        // Simulate: 3 pages of 5 posts each
        await new Promise(r => setTimeout(r, 400));
        if (p > 3) { setDone(true); setLoading(false); return; }
        const newPosts = Array.from({ length: 5 }, (_, i) => ({
            id: (p - 1) * 5 + i + 1,
            title: `Post ${(p - 1) * 5 + i + 1}`,
        }));
        setPosts(prev => [...prev, ...newPosts]);
        setLoading(false);
    };

    useEffect(() => { fetchPage(1); }, []);

    useEffect(() => {
        const el  = loaderRef.current;
        if (!el || done) return;
        const obs = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && !loading) {
                setPage(p => { const next = p + 1; fetchPage(next); return next; });
            }
        }, { threshold: 0.5 });
        obs.observe(el);
        return () => obs.disconnect();
    }, [loading, done, page]);

    return (
        <div style={{ height: 300, overflowY: 'auto', border: '1px solid #e5e7eb' }}>
            {posts.map(p => <div key={p.id} style={{ padding: 12 }}>{p.title}</div>)}
            <div ref={loaderRef} style={{ padding: 12, textAlign: 'center', color: '#9ca3af' }}>
                {loading && 'Loading…'}
                {done    && 'No more posts'}
            </div>
        </div>
    );
}

// ── M3. Protected API route with auth + RBAC ────────────────────
//
// PROBLEM: Create GET /api/admin/stats that:
//   • Returns 401 if not authenticated
//   • Returns 403 if authenticated but role !== 'admin'
//   • Returns aggregated stats (user count, post count, revenue)
//   • Results are cached for 60 seconds (but only after auth passes)
//
// // app/api/admin/stats/route.ts
// import { auth } from '@/auth';
// import { unstable_cache } from 'next/cache';
//
// const getStats = unstable_cache(
//     async () => {
//         const [users, posts, revenue] = await Promise.all([
//             db.user.count(),
//             db.post.count(),
//             db.order.aggregate({ _sum: { amount: true } }),
//         ]);
//         return { users, posts, revenue: revenue._sum.amount ?? 0 };
//     },
//     ['admin-stats'],
//     { revalidate: 60, tags: ['admin-stats'] }
// );
//
// export async function GET() {
//     const session = await auth();
//
//     if (!session)               return Response.json({ error: 'Unauthorized'  }, { status: 401 });
//     if (session.user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
//
//     const stats = await getStats();
//     return Response.json(stats);
// }

// ── M4. Optimistic todo list ────────────────────────────────────
//
// Already implemented in 04-server-actions-api.tsx (OptimisticTodoList).
// Extension: add Server Action that saves to DB + rolls back on failure.
//
// 'use server'
// export async function toggleTodoAction(id: string): Promise<void> {
//     const todo = await db.todo.findUnique({ where: { id } });
//     if (!todo) throw new Error('Todo not found');
//     await db.todo.update({ where: { id }, data: { done: !todo.done } });
//     revalidatePath('/todos');
// }
//
// In the Client Component:
// const handleToggle = (id: string) => {
//     startTransition(async () => {
//         addOptimistic(id);            // immediate UI
//         try {
//             await toggleTodoAction(id);  // real server call
//         } catch {
//             addOptimistic(id);           // roll back (toggle again)
//         }
//     });
// };

// ═══════════════════════════════════════════════════════════════
// 🔴 HARD PROBLEMS
// ═══════════════════════════════════════════════════════════════

// ── H1. Custom JWT authentication system ────────────────────────
//
// PROBLEM: Build a complete auth system WITHOUT NextAuth.js:
//   • POST /api/auth/register — hash password (bcrypt), store user
//   • POST /api/auth/login    — verify password, issue JWT (30 min exp), set httpOnly cookie
//   • POST /api/auth/refresh  — verify refresh token, issue new access token
//   • GET  /api/auth/me       — verify JWT from cookie, return user
//   • POST /api/auth/logout   — clear cookie
//   • Middleware enforces auth on /dashboard/** routes
//
// KEY DECISIONS:
//   Access token: 30 min, httpOnly cookie, SameSite=Strict
//   Refresh token: 7 days, stored in DB (allows revocation), httpOnly cookie
//   Password: bcrypt with 12 rounds
//   JWT: jose library (edge-compatible, unlike jsonwebtoken)
//
// // lib/jwt.ts
// import { SignJWT, jwtVerify } from 'jose';
//
// const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
//
// export async function signToken(payload: Record<string, unknown>, expiry = '30m') {
//     return new SignJWT(payload)
//         .setProtectedHeader({ alg: 'HS256' })
//         .setExpirationTime(expiry)
//         .setIssuedAt()
//         .sign(secret);
// }
//
// export async function verifyToken<T>(token: string): Promise<T | null> {
//     try {
//         const { payload } = await jwtVerify(token, secret);
//         return payload as T;
//     } catch {
//         return null;
//     }
// }
//
// // app/api/auth/login/route.ts
// import bcrypt from 'bcryptjs';
// import { cookies } from 'next/headers';
//
// export async function POST(req: Request) {
//     const { email, password } = await req.json();
//     const user = await db.user.findUnique({ where: { email } });
//
//     if (!user || !await bcrypt.compare(password, user.hashedPassword)) {
//         return Response.json({ error: 'Invalid credentials' }, { status: 401 });
//     }
//
//     const accessToken  = await signToken({ sub: user.id, role: user.role });
//     const refreshToken = await signToken({ sub: user.id, type: 'refresh' }, '7d');
//
//     await db.refreshToken.create({ data: { token: refreshToken, userId: user.id } });
//
//     const cookieStore = cookies();
//     cookieStore.set('access_token',  accessToken,  { httpOnly: true, maxAge: 1800, sameSite: 'strict' });
//     cookieStore.set('refresh_token', refreshToken, { httpOnly: true, maxAge: 604800, sameSite: 'strict' });
//
//     return Response.json({ success: true });
// }

// ── H2. Real-time collaborative feature (polling) ───────────────
//
// PROBLEM: Build a shared document editor where:
//   • Multiple users see each other's cursor positions
//   • Changes sync every 500ms via polling (SSE or long-poll)
//   • Server tracks presence: active users in last 10 seconds
//   • Optimistic local updates, server reconciliation on sync
//
// KEY CHOICES:
//   Use SSE for server → client push (simpler than WebSocket in Next.js)
//   Use Server Actions for client → server writes
//   Track presence in Redis with TTL keys
//
// // app/api/document/[id]/events/route.ts
// export async function GET(_req: Request, { params }: { params: { id: string } }) {
//     const encoder = new TextEncoder();
//     const { id } = params;
//
//     const stream = new ReadableStream({
//         async start(controller) {
//             const send = (data: unknown) => {
//                 controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
//             };
//
//             while (true) {
//                 const [content, presence] = await Promise.all([
//                     db.document.findUnique({ where: { id } }),
//                     redis.smembers(`presence:${id}`),
//                 ]);
//                 send({ content: content?.body, presence });
//                 await new Promise(r => setTimeout(r, 500));
//             }
//         },
//     });
//
//     return new Response(stream, {
//         headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
//     });
// }

// ── H3. E-commerce checkout flow ────────────────────────────────
//
// PROBLEM: Build a multi-step checkout:
//   Step 1: Cart review — show items, quantities, total
//   Step 2: Shipping   — address form with autocomplete, validation
//   Step 3: Payment    — Stripe Elements, charge on Server Action
//   Step 4: Confirm    — order number, email receipt via background job
//
// Additional requirements:
//   • URL reflects current step: /checkout/cart, /checkout/shipping, etc.
//   • State persists across page refreshes (server session or URL params)
//   • Stripe webhook validates payment before showing confirmation
//   • Inventory decremented atomically (DB transaction)
//
// KEY ARCHITECTURE:
//   Route groups: (checkout)/cart, (checkout)/shipping, (checkout)/payment, (checkout)/confirm
//   Shared layout: (checkout)/layout.tsx — progress stepper
//   Server Actions: updateCart, saveAddress, processPayment
//   Stripe webhook: app/api/webhooks/stripe/route.ts
//
// ATOMIC INVENTORY DECREMENT (Prisma transaction):
//
// export async function processPayment(orderId: string, paymentIntentId: string) {
//     return db.$transaction(async (tx) => {
//         const order = await tx.order.findUnique({
//             where: { id: orderId }, include: { items: true }
//         });
//
//         for (const item of order!.items) {
//             const product = await tx.product.findUnique({ where: { id: item.productId } });
//             if (!product || product.stock < item.qty) {
//                 throw new Error(`${product?.name ?? 'Product'} out of stock`);
//             }
//             await tx.product.update({
//                 where: { id: item.productId },
//                 data: { stock: { decrement: item.qty } },
//             });
//         }
//
//         await tx.order.update({
//             where: { id: orderId },
//             data: { status: 'CONFIRMED', paymentIntentId },
//         });
//     });
// }

// ── Teaching version: multi-step form with URL state ──
type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'confirm';

const STEPS: CheckoutStep[] = ['cart', 'shipping', 'payment', 'confirm'];

function StepIndicator({ current }: { current: CheckoutStep }) {
    return (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {STEPS.map((s, i) => (
                <div key={s} style={{
                    flex: 1, padding: '8px 4px', textAlign: 'center', borderRadius: 4,
                    background: s === current ? '#3b82f6' :
                                STEPS.indexOf(current) > i ? '#10b981' : '#e5e7eb',
                    color: s === current || STEPS.indexOf(current) > i ? '#fff' : '#374151',
                    fontSize: 12, fontWeight: 600,
                }}>
                    {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
                </div>
            ))}
        </div>
    );
}

function CheckoutFlow() {
    const [step, setStep] = useState<CheckoutStep>('cart');
    const next = () => setStep(STEPS[STEPS.indexOf(step) + 1] ?? 'confirm');

    return (
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 24 }}>
            <StepIndicator current={step} />
            {step === 'cart'     && <div><h2>Your Cart</h2><button onClick={next}>Proceed to Shipping</button></div>}
            {step === 'shipping' && <div><h2>Shipping Address</h2><button onClick={next}>Proceed to Payment</button></div>}
            {step === 'payment'  && <div><h2>Payment</h2><button onClick={next}>Place Order</button></div>}
            {step === 'confirm'  && <div><h2>Order Confirmed!</h2><p>Check your email for details.</p></div>}
        </div>
    );
}

export {
    DashboardSkeleton,
    ContactForm,
    InfiniteScrollDemo,
    StepIndicator,
    CheckoutFlow,
};
