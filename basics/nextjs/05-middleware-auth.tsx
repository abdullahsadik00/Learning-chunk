// ═══════════════════════════════════════════════════════════════
// NEXT.JS 05: MIDDLEWARE & AUTHENTICATION  (Day 21a)
// ═══════════════════════════════════════════════════════════════
//
// MIDDLEWARE runs BEFORE a request reaches a route.
// It can: redirect, rewrite, modify headers, run A/B tests,
//         enforce auth, detect bots, set locale cookies.
//
// File: middleware.ts  (project root, NOT inside app/)
//
// AUTH APPROACHES:
//   NextAuth.js v5 (Auth.js)  — full-featured, many providers
//   jose / jsonwebtoken        — manual JWT verification
//   Clerk / Auth0              — third-party auth services

import React, { useState } from 'react';

// ───────────────────────────────────────────────────────────────
// 1. MIDDLEWARE BASICS
// ───────────────────────────────────────────────────────────────
//
// // middleware.ts
// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';
//
// export function middleware(request: NextRequest) {
//     const { pathname } = request.nextUrl;
//
//     // 1. Auth check — redirect unauthenticated users
//     const token = request.cookies.get('auth-token')?.value;
//     const isProtected = pathname.startsWith('/dashboard') ||
//                         pathname.startsWith('/settings');
//
//     if (isProtected && !token) {
//         const url = new URL('/login', request.url);
//         url.searchParams.set('callbackUrl', pathname);  // preserve intent
//         return NextResponse.redirect(url);
//     }
//
//     // 2. Custom header injection (readable in Server Components)
//     const response = NextResponse.next();
//     response.headers.set('x-pathname', pathname);
//     return response;
// }
//
// // Matcher — which paths middleware runs on (be specific for performance)
// export const config = {
//     matcher: [
//         '/dashboard/:path*',
//         '/settings/:path*',
//         '/api/:path*',
//         '/((?!_next/static|_next/image|favicon.ico).*)',
//     ],
// };

// ───────────────────────────────────────────────────────────────
// 2. ROLE-BASED ACCESS CONTROL (RBAC)
// ───────────────────────────────────────────────────────────────
//
// // middleware.ts
// import { verifyJWT } from '@/lib/auth';
//
// const ROLE_ROUTES: Record<string, string[]> = {
//     '/admin':   ['admin'],
//     '/manager': ['admin', 'manager'],
//     '/reports': ['admin', 'manager', 'analyst'],
// };
//
// export async function middleware(request: NextRequest) {
//     const { pathname } = request.nextUrl;
//     const token = request.cookies.get('auth-token')?.value;
//
//     // Find matching protected prefix
//     const protectedPrefix = Object.keys(ROLE_ROUTES).find(p =>
//         pathname.startsWith(p)
//     );
//
//     if (!protectedPrefix) return NextResponse.next(); // public route
//
//     if (!token) {
//         return NextResponse.redirect(new URL('/login', request.url));
//     }
//
//     const payload = await verifyJWT(token);
//     const allowed  = ROLE_ROUTES[protectedPrefix];
//
//     if (!payload || !allowed.includes(payload.role)) {
//         return NextResponse.redirect(new URL('/403', request.url));
//     }
//
//     return NextResponse.next();
// }

// ── Teaching version: RBAC utility (pure TS, no Next.js dependency) ──
type Role = 'admin' | 'manager' | 'analyst' | 'viewer';

const ROUTE_ROLES: Record<string, Role[]> = {
    '/admin':   ['admin'],
    '/manager': ['admin', 'manager'],
    '/reports': ['admin', 'manager', 'analyst'],
    '/viewer':  ['admin', 'manager', 'analyst', 'viewer'],
};

function canAccess(pathname: string, role: Role): boolean {
    const prefix = Object.keys(ROUTE_ROLES).find(p => pathname.startsWith(p));
    if (!prefix) return true; // public
    return ROUTE_ROLES[prefix].includes(role);
}

// ───────────────────────────────────────────────────────────────
// 3. i18n / GEO ROUTING
// ───────────────────────────────────────────────────────────────
//
// // middleware.ts
// const SUPPORTED_LOCALES = ['en', 'fr', 'de', 'ja'];
// const DEFAULT_LOCALE    = 'en';
//
// export function middleware(request: NextRequest) {
//     const { pathname } = request.nextUrl;
//     const locale = request.cookies.get('locale')?.value ??
//                    request.headers.get('Accept-Language')?.split(',')[0].split('-')[0] ??
//                    DEFAULT_LOCALE;
//
//     const validLocale = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
//
//     // Skip if path already has locale prefix
//     if (SUPPORTED_LOCALES.some(l => pathname.startsWith(`/${l}`))) {
//         return NextResponse.next();
//     }
//
//     return NextResponse.redirect(new URL(`/${validLocale}${pathname}`, request.url));
// }
//
// // Geo-based redirect — NextRequest has geo data (Vercel edge only)
// export function middleware(request: NextRequest) {
//     const country = request.geo?.country ?? 'US';
//     if (country === 'EU') {
//         return NextResponse.rewrite(new URL('/eu' + request.nextUrl.pathname, request.url));
//     }
//     return NextResponse.next();
// }

// ───────────────────────────────────────────────────────────────
// 4. A/B TESTING
// ───────────────────────────────────────────────────────────────
//
// // middleware.ts
// export function middleware(request: NextRequest) {
//     // Assign bucket if not already assigned
//     let bucket = request.cookies.get('ab-bucket')?.value;
//     if (!bucket) bucket = Math.random() < 0.5 ? 'a' : 'b';
//
//     const response = NextResponse.next();
//
//     // Persist bucket across requests
//     response.cookies.set('ab-bucket', bucket, {
//         maxAge: 60 * 60 * 24 * 30,  // 30 days
//         httpOnly: true,
//         sameSite: 'lax',
//     });
//
//     // Rewrite URL — user sees /pricing, gets /pricing-v2 (or not)
//     if (bucket === 'b' && request.nextUrl.pathname === '/pricing') {
//         return NextResponse.rewrite(new URL('/pricing-v2', request.url));
//     }
//
//     return response;
// }

// ───────────────────────────────────────────────────────────────
// 5. RATE LIMITING
// ───────────────────────────────────────────────────────────────
//
// Simple token-bucket in memory (replace with Redis for multi-instance):
//
// // middleware.ts
// const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
//
// function isRateLimited(ip: string, limit = 100, windowMs = 60_000): boolean {
//     const now  = Date.now();
//     const data = rateLimitStore.get(ip);
//
//     if (!data || now > data.resetAt) {
//         rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
//         return false;
//     }
//
//     if (data.count >= limit) return true;
//     data.count++;
//     return false;
// }
//
// export function middleware(request: NextRequest) {
//     const ip = request.ip ?? '127.0.0.1';
//
//     if (request.nextUrl.pathname.startsWith('/api/') && isRateLimited(ip)) {
//         return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
//     }
//
//     return NextResponse.next();
// }

// ── Teaching version: rate limiter (pure TS for unit testing) ──
const _store = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, limit = 10, windowMs = 60_000): boolean {
    const now  = Date.now();
    const data = _store.get(key);

    if (!data || now > data.resetAt) {
        _store.set(key, { count: 1, resetAt: now + windowMs });
        return false; // not limited
    }

    if (data.count >= limit) return true; // limited
    data.count++;
    return false;
}

// ───────────────────────────────────────────────────────────────
// 6. NEXTAUTH.JS (Auth.js v5)
// ───────────────────────────────────────────────────────────────
//
// // auth.ts  (project root)
// import NextAuth from 'next-auth';
// import GitHub  from 'next-auth/providers/github';
// import Google  from 'next-auth/providers/google';
// import Credentials from 'next-auth/providers/credentials';
// import { db } from '@/lib/db';
// import bcrypt from 'bcryptjs';
//
// export const { handlers, auth, signIn, signOut } = NextAuth({
//     providers: [
//         GitHub,
//         Google,
//         Credentials({
//             async authorize(credentials) {
//                 const user = await db.user.findUnique({
//                     where: { email: credentials?.email as string },
//                 });
//                 if (!user) return null;
//
//                 const valid = await bcrypt.compare(
//                     credentials?.password as string,
//                     user.hashedPassword
//                 );
//                 return valid ? user : null;
//             },
//         }),
//     ],
//     callbacks: {
//         jwt({ token, user }) {
//             if (user) token.role = (user as { role?: string }).role;
//             return token;
//         },
//         session({ session, token }) {
//             session.user.role = token.role as string;
//             return session;
//         },
//     },
//     pages: {
//         signIn: '/login',       // custom login page
//         error:  '/auth/error',  // custom error page
//     },
// });
//
// // app/api/auth/[...nextauth]/route.ts
// import { handlers } from '@/auth';
// export const { GET, POST } = handlers;

// ── Using auth() in Server Components ──
//
// // app/dashboard/page.tsx
// import { auth } from '@/auth';
// import { redirect } from 'next/navigation';
//
// export default async function DashboardPage() {
//     const session = await auth();
//     if (!session) redirect('/login');
//
//     return (
//         <div>
//             <h1>Welcome, {session.user.name}</h1>
//             <p>Role: {session.user.role}</p>
//         </div>
//     );
// }

// ── Session helper (Server Action) ──
//
// // lib/auth-helpers.ts
// import { auth } from '@/auth';
// import { redirect } from 'next/navigation';
//
// export async function requireAuth() {
//     const session = await auth();
//     if (!session) redirect('/login');
//     return session;
// }
//
// export async function requireRole(role: string) {
//     const session = await requireAuth();
//     if (session.user.role !== role) redirect('/403');
//     return session;
// }

// ───────────────────────────────────────────────────────────────
// 7. LOGIN FORM WITH SERVER ACTIONS
// ───────────────────────────────────────────────────────────────
//
// // actions/auth.ts  ('use server')
// import { signIn } from '@/auth';
// import { AuthError } from 'next-auth';
//
// export async function loginAction(prevState: unknown, formData: FormData) {
//     try {
//         await signIn('credentials', {
//             email:    formData.get('email'),
//             password: formData.get('password'),
//             redirect: false,
//         });
//
//         return { success: true };
//     } catch (e) {
//         if (e instanceof AuthError) {
//             return { error: 'Invalid email or password' };
//         }
//         throw e;
//     }
// }
//
// // app/login/page.tsx  ('use client')
// import { useFormState, useFormStatus } from 'react-dom';
// import { loginAction } from '@/actions/auth';
//
// function LoginButton() {
//     const { pending } = useFormStatus();
//     return <button type="submit" disabled={pending}>{pending ? 'Signing in…' : 'Sign In'}</button>;
// }
//
// export default function LoginPage() {
//     const [state, action] = useFormState(loginAction, {});
//     return (
//         <form action={action}>
//             <input name="email"    type="email"    required />
//             <input name="password" type="password" required />
//             {state.error && <p className="error">{state.error}</p>}
//             <LoginButton />
//         </form>
//     );
// }

// ── Teaching version: LoginForm (no NextAuth dependency) ──
interface LoginState { error?: string; success?: boolean; }

function LoginForm({ onLogin }: { onLogin?: (email: string, pw: string) => Promise<boolean> }) {
    const [state, setState]   = useState<LoginState>({});
    const [pending, setPend]  = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setPend(true);
        setState({});

        const fd    = new FormData(e.currentTarget);
        const email = fd.get('email') as string;
        const pw    = fd.get('password') as string;

        const ok = await onLogin?.(email, pw) ?? (email && pw.length >= 8);
        setState(ok ? { success: true } : { error: 'Invalid email or password' });
        setPend(false);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>Email</label>
                <input name="email" type="email" required />
            </div>
            <div>
                <label>Password</label>
                <input name="password" type="password" required minLength={8} />
            </div>
            {state.error   && <p style={{ color: 'red'   }}>{state.error}</p>}
            {state.success && <p style={{ color: 'green' }}>Signed in!</p>}
            <button type="submit" disabled={pending}>
                {pending ? 'Signing in…' : 'Sign In'}
            </button>
        </form>
    );
}

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

// Q1: Where does middleware.ts live and at which point in the
//     request lifecycle does it run?
// → Project root (next to app/, public/, package.json).
//   Runs BEFORE the request reaches any route or layout.
//   Order: edge → middleware → layout → page

// Q2: What is the difference between NextResponse.redirect()
//     and NextResponse.rewrite()?
// → redirect() sends a 307/308 to the client — the browser's
//   URL changes. The user sees the new URL.
//   rewrite() serves a different page internally — the browser
//   URL does NOT change. Used for A/B tests or locale routing.

// Q3: What is a route matcher (config.matcher) and why use one?
// → Middleware runs on ALL requests by default — including
//   static files, images, API routes. The matcher is an array of
//   patterns (string or regex) that limit which paths trigger
//   middleware. Without it, every _next/static file request runs
//   middleware unnecessarily, slowing the edge response.

// Q4: What is the callbacks.jwt and callbacks.session used for in NextAuth?
// → jwt: called whenever a JWT is created/updated. Use to add
//   custom data (role, userId) to the token payload.
//   session: called when the session is accessed on the client.
//   Use to expose token fields on session.user.
//   Both are needed — jwt adds to the token, session exposes it.

// Q5: Implement a canAccess check with the RBAC utility
const demoCheck = [
    { path: '/admin/users',  role: 'admin'   as Role, expected: true  },
    { path: '/reports/q1',  role: 'analyst' as Role, expected: true  },
    { path: '/admin/users',  role: 'viewer'  as Role, expected: false },
    { path: '/public',       role: 'viewer'  as Role, expected: true  },
];
// demoCheck.forEach(c => console.assert(canAccess(c.path, c.role) === c.expected));

// Q6: Why is rate limiting with an in-memory Map insufficient for production?
// → Next.js runs on multiple server instances (horizontal scaling).
//   An in-memory Map lives in ONE process — each instance has its
//   own counter. A client could bypass the limit by hitting
//   different instances. Production rate limiting requires a shared
//   store: Redis (Upstash), a database, or an edge-level solution.

// Q7: What does 'use server' at the top of auth.ts achieve?
// → It marks every export in that file as a Server Action.
//   The functions can then be imported and called from Client
//   Components but always execute on the server. Environment
//   variables, DB calls, and bcrypt hashing stay server-only.

export { LoginForm, canAccess, checkRateLimit };
