// ═══════════════════════════════════════════════════════════════
// NEXT.JS 02: SERVER vs CLIENT COMPONENTS  (Day 19)
// ═══════════════════════════════════════════════════════════════
//
// React Server Components (RSC) are the DEFAULT in the App Router.
// Every component is a Server Component UNLESS it has 'use client'.
//
// The key mental model:
//   Server Components → run on server, zero JS sent to browser
//   Client Components → run on server (hydration) AND browser

import React, { useState, useEffect, useCallback } from 'react';

// ───────────────────────────────────────────────────────────────
// 1. SERVER COMPONENTS
// ───────────────────────────────────────────────────────────────
//
// WHAT THEY CAN DO:
//   ✅ async/await at the component level
//   ✅ Direct database / filesystem access
//   ✅ Read environment variables safely (no NEXT_PUBLIC_ needed)
//   ✅ Import large server-only packages without bloating the bundle
//   ✅ Automatic code splitting — zero runtime JS sent to client
//
// WHAT THEY CANNOT DO:
//   ❌ useState / useReducer / useEffect / useRef
//   ❌ Browser APIs (window, document, localStorage)
//   ❌ Event handlers (onClick, onChange)
//   ❌ React Context (use Client Component wrapper instead)

// ── 1a. Server Component with direct DB access ──
//
// // app/posts/page.tsx  (Server Component — no directive needed)
// import { db } from '@/lib/db';
//
// export default async function PostsPage() {
//     // Runs on server — no API round-trip
//     const posts = await db.post.findMany({ orderBy: { createdAt: 'desc' } });
//
//     return (
//         <ul>
//             {posts.map(post => (
//                 <li key={post.id}>{post.title}</li>
//             ))}
//         </ul>
//     );
// }

// ── 1b. Server Component with fetch ──
//
// // app/users/[id]/page.tsx
// export default async function UserPage({ params }: { params: { id: string } }) {
//     const user = await fetch(`https://api.example.com/users/${params.id}`, {
//         next: { revalidate: 3600 },   // ISR: refresh every hour
//     }).then(r => r.json());
//
//     return <h1>{user.name}</h1>;
// }

// ───────────────────────────────────────────────────────────────
// 2. CLIENT COMPONENTS
// ───────────────────────────────────────────────────────────────
//
// Mark a file with 'use client' at the TOP (before any imports).
// The directive propagates to all components imported by that file.
//
// WHAT THEY CAN DO:
//   ✅ All React hooks (useState, useEffect, useRef, …)
//   ✅ Event handlers (onClick, onChange, onSubmit)
//   ✅ Browser APIs (window, document, localStorage, navigator)
//   ✅ Third-party libraries that need the browser
//   ✅ React Context consumers and providers
//
// WHAT THEY CANNOT DO:
//   ❌ Direct database access
//   ❌ Read server-only environment variables
//   ❌ Be async at the component level (use useEffect for async)

// ── 2a. Basic Client Component ──

// 'use client';  ← in a real file this is the first line
function Counter({ initialCount = 0 }: { initialCount?: number }) {
    const [count, setCount] = useState(initialCount);
    return (
        <div>
            <p>Count: {count}</p>
            <button onClick={() => setCount(c => c + 1)}>+</button>
            <button onClick={() => setCount(c => c - 1)}>−</button>
        </div>
    );
}

// ── 2b. Client Component with browser API ──

function ThemeToggle() {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        // Browser API — only runs in browser, safe in Client Component
        const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (saved) setTheme(saved);
    }, []);

    const toggle = useCallback(() => {
        setTheme(prev => {
            const next = prev === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', next);
            document.documentElement.classList.toggle('dark', next === 'dark');
            return next;
        });
    }, []);

    return (
        <button onClick={toggle} aria-label="Toggle theme">
            {theme === 'light' ? '🌙' : '☀️'}
        </button>
    );
}

// ───────────────────────────────────────────────────────────────
// 3. COMPOSITION PATTERNS
// ───────────────────────────────────────────────────────────────
//
// RULE: Server Components CAN render Client Components.
//       Client Components CANNOT import Server Components.
//
// The reason: once the client boundary is crossed, everything below
// runs in the browser. Server Components have no browser runtime.

// ── 3a. Server Component renders Client Component (correct) ──
//
// // app/dashboard/page.tsx  (Server Component)
// import { db } from '@/lib/db';
// import Counter from '@/components/Counter';  // Client Component
//
// export default async function DashboardPage() {
//     const data = await db.settings.findFirst();
//
//     return (
//         <div>
//             <h1>Dashboard</h1>
//             {/* Pass server data as props to client component */}
//             <Counter initialCount={data?.defaultCount ?? 0} />
//         </div>
//     );
// }

// ── 3b. Pass Server Component as CHILDREN to Client Component ──
//
// The "children as slot" pattern lets you have a Client Component
// wrapper (for interactivity) while the content inside is a Server
// Component (for data fetching).
//
// // components/Accordion.tsx  (Client Component)
// 'use client';
// import { useState } from 'react';
//
// export function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
//     const [open, setOpen] = useState(false);
//     return (
//         <div>
//             <button onClick={() => setOpen(o => !o)}>{title}</button>
//             {open && <div>{children}</div>}   {/* children from server! */}
//         </div>
//     );
// }
//
// // app/page.tsx  (Server Component)
// import { Accordion } from '@/components/Accordion';
// import ProductDetails from '@/components/ProductDetails'; // Server Component
//
// export default function Page() {
//     return (
//         <Accordion title="Product Details">
//             <ProductDetails />   {/* Server Component passed as child */}
//         </Accordion>
//     );
// }

// ── 3c. ❌ WRONG — Client Component importing Server Component ──
//
// // components/BadClientComp.tsx
// 'use client';
// import ServerComp from './ServerComp';  // ❌ ERROR — cannot do this
//
// The fix: pass ServerComp as a prop or children from the Server parent.

// ───────────────────────────────────────────────────────────────
// 4. WHEN TO USE EACH
// ───────────────────────────────────────────────────────────────
//
// USE SERVER COMPONENTS FOR:                USE CLIENT COMPONENTS FOR:
// ─────────────────────────────────────────────────────────────────
// Data fetching (DB, API, filesystem)       onClick, onChange handlers
// Sensitive data (API keys, tokens)         useState, useReducer, useRef
// Large dependencies (pdf, markdown)        useEffect, useLayoutEffect
// SEO-critical content                      Browser APIs (localStorage)
// Static content without interactivity     Third-party UI libraries
// Auth checks → redirect                   Form validation on change
//
// RULE OF THUMB:
//   Push 'use client' as far DOWN the tree as possible.
//   Keep data fetching at the top (Server), interactivity at the leaves (Client).

// ───────────────────────────────────────────────────────────────
// 5. REAL-WORLD PATTERN: E-COMMERCE PRODUCT PAGE
// ───────────────────────────────────────────────────────────────
//
// // app/products/[id]/page.tsx  (Server Component — orchestrator)
// import { db } from '@/lib/db';
// import { Suspense } from 'react';
// import ProductDetails   from '@/components/ProductDetails';   // Server
// import AddToCartButton  from '@/components/AddToCartButton';  // Client
// import RelatedProducts  from '@/components/RelatedProducts';  // Server
//
// export default async function ProductPage({ params }: { params: { id: string } }) {
//     const product = await db.product.findUnique({ where: { id: params.id } });
//     if (!product) notFound();
//
//     return (
//         <div>
//             <ProductDetails product={product} />      {/* Server: renders images, description */}
//             <AddToCartButton                          {/* Client: handles qty, cart state */}
//                 productId={product.id}
//                 price={product.price}
//                 stock={product.stock}
//             />
//             <Suspense fallback={<div>Loading related…</div>}>
//                 <RelatedProducts categoryId={product.categoryId} />
//             </Suspense>
//         </div>
//     );
// }
//
// // components/AddToCartButton.tsx  (Client Component)
// 'use client';
// import { useState, useTransition } from 'react';
//
// export default function AddToCartButton({ productId, price, stock }: AddToCartProps) {
//     const [qty, setQty]           = useState(1);
//     const [isPending, startTrans] = useTransition();
//
//     return (
//         <div>
//             <input type="number" value={qty} min={1} max={stock}
//                    onChange={e => setQty(Number(e.target.value))} />
//             <button disabled={isPending || stock === 0}
//                     onClick={() => startTrans(() => addToCart(productId, qty))}>
//                 {isPending ? 'Adding…' : stock === 0 ? 'Out of Stock' : 'Add to Cart'}
//             </button>
//         </div>
//     );
// }

// ── Teaching version: AddToCartButton as standalone React component ──
interface AddToCartProps {
    productId: string;
    price: number;
    stock: number;
    onAdd?: (productId: string, qty: number) => void;
}

function AddToCartButton({ productId, price, stock, onAdd }: AddToCartProps) {
    const [qty, setQty] = useState(1);

    return (
        <div>
            <p>${price.toFixed(2)}</p>
            <input
                type="number"
                value={qty}
                min={1}
                max={stock}
                onChange={e => setQty(Math.max(1, Math.min(stock, Number(e.target.value))))}
            />
            <button
                disabled={stock === 0}
                onClick={() => onAdd?.(productId, qty)}
            >
                {stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <p>{stock > 0 ? `${stock} in stock` : 'Unavailable'}</p>
        </div>
    );
}

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

// Q1: What is the default component type in the App Router?
// → Server Component. Every file in app/ is a Server Component unless
//   it has 'use client' at the top. The directive must be the first
//   line of the file — before any imports.

// Q2: Why can't a Client Component import a Server Component?
// → Server Components rely on server APIs (DB, filesystem, secrets).
//   Once you add 'use client', that component and everything it
//   imports runs in the browser. There is no server runtime in the
//   browser, so Server Components are incompatible there.
//   Fix: pass Server Components as props.children from a Server parent.

// Q3: What sends less JavaScript to the browser — a Server Component
//     that imports lodash, or a Client Component that imports lodash?
// → Server Component. Its import of lodash never reaches the browser —
//   the server processes it and only sends the rendered HTML.
//   A Client Component's imports ARE bundled and sent to the browser.

// Q4: How do you share data between a Server Component and its
//     Client Component child without a context?
// → Pass the data as props from the Server Component to the Client
//   Component. The Server fetches, the Client receives as serialisable
//   props (strings, numbers, plain objects). Cannot pass functions or
//   class instances from server to client.

// Q5: Implement a SearchBox client component
function SearchBox({ onSearch }: { onSearch: (query: string) => void }) {
    const [query, setQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(query.trim());
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search…"
            />
            <button type="submit">Search</button>
        </form>
    );
}

// Q6: What is the "children as slot" pattern and why is it useful?
// → A Client Component accepts React.ReactNode as children.
//   A Server Component renders the Client Component and passes
//   a Server Component as the children prop.
//   Result: the wrapper has client interactivity (toggle, modal)
//   but the content inside is fetched and rendered on the server.
//   It circumvents the "Client Components can't import Server
//   Components" restriction by reversing the direction.

// Q7: What is the 'use client' boundary?
// → It's a declaration that a module and everything below it in the
//   import tree runs in the browser. Next.js uses it to split the
//   bundle — code above the boundary stays server-only.
//   Push the boundary as close to the leaves as possible to minimise
//   the JavaScript sent to the browser.

// Q8: Can a Server Component be async? Can a Client Component be async?
// → Server Component: YES. Async/await works natively because it runs
//   on Node.js where all I/O is async.
//   Client Component: NO. React renders client components synchronously.
//   Use useEffect + state for async data in Client Components, or
//   fetch on the server and pass data via props.

export { Counter, ThemeToggle, AddToCartButton, SearchBox };
