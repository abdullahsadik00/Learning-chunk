// ═══════════════════════════════════════════════════════════════
// NEXT.JS 06: PERFORMANCE & OPTIMIZATION  (Day 21b)
// ═══════════════════════════════════════════════════════════════
//
// NEXT.JS BUILT-IN OPTIMIZATIONS:
//   next/image  — automatic WebP/AVIF, lazy load, prevent CLS
//   next/font   — self-hosted fonts, zero layout shift
//   next/script — controlled third-party script loading
//   Metadata    — typed SEO + Open Graph + structured data
//   ISR segment config — per-route caching without extra code
//   Streaming   — Suspense + loading.tsx = instant shell
//
// MONITORING:
//   Web Vitals  — LCP, CLS, FID/INP, FCP, TTFB
//   Sentry      — error tracking + performance tracing

import React, { useState, useEffect } from 'react';

// ───────────────────────────────────────────────────────────────
// 1. next/image
// ───────────────────────────────────────────────────────────────
//
// PROBLEMS WITHOUT next/image:
//   ❌ No automatic lazy loading
//   ❌ No WebP/AVIF conversion
//   ❌ No size optimization — sends full-res to mobile
//   ❌ No CLS prevention (no reserved space)
//
// next/image GIVES YOU:
//   ✅ Automatic format selection (WebP, AVIF)
//   ✅ Responsive srcset (serves smallest usable size)
//   ✅ Lazy loading by default
//   ✅ Prevents CLS with reserved dimensions
//   ✅ Blur placeholder support
//
// // components/HeroImage.tsx
// import Image from 'next/image';
//
// // 1a. Fixed size (local import — dimensions known at build time)
// import heroImg from '@/public/hero.jpg';
//
// export function HeroSection() {
//     return (
//         <Image
//             src={heroImg}         // local — auto width/height + blurDataURL
//             alt="Hero banner"
//             priority              // above-the-fold → don't lazy-load (preloads)
//             className="object-cover"
//         />
//     );
// }
//
// // 1b. Remote image (must whitelist domain in next.config.ts)
// export function Avatar({ src, name }: { src: string; name: string }) {
//     return (
//         <Image
//             src={src}
//             alt={name}
//             width={64}
//             height={64}
//             className="rounded-full"
//         />
//     );
// }
//
// // next.config.ts — whitelist remote domains
// import type { NextConfig } from 'next';
// const config: NextConfig = {
//     images: {
//         remotePatterns: [
//             { protocol: 'https', hostname: 'cdn.example.com', pathname: '/images/**' },
//         ],
//     },
// };
// export default config;
//
// // 1c. fill + object-fit (responsive container)
// export function CoverImage({ src, alt }: { src: string; alt: string }) {
//     return (
//         <div style={{ position: 'relative', aspectRatio: '16/9' }}>
//             <Image src={src} alt={alt} fill style={{ objectFit: 'cover' }} />
//         </div>
//     );
// }

// ── Teaching version: LazyImage fallback (no next/image dependency) ──
function LazyImage({
    src, alt, width, height, priority = false,
}: {
    src: string; alt: string; width: number; height: number; priority?: boolean;
}) {
    const [loaded, setLoaded] = useState(false);

    return (
        <div style={{ position: 'relative', width, height, background: '#e5e7eb' }}>
            {!loaded && (
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
                    animation: 'pulse 2s infinite',
                }} />
            )}
            <img
                src={src}
                alt={alt}
                width={width}
                height={height}
                loading={priority ? 'eager' : 'lazy'}
                onLoad={() => setLoaded(true)}
                style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s' }}
            />
        </div>
    );
}

// ───────────────────────────────────────────────────────────────
// 2. next/font
// ───────────────────────────────────────────────────────────────
//
// Fonts fetched at BUILD TIME and self-hosted by Next.js.
// Zero external requests at runtime → no privacy issues, no CLS.
//
// // app/layout.tsx
// import { Inter, Geist_Mono } from 'next/font/google';
//
// const inter = Inter({
//     subsets: ['latin'],
//     display: 'swap',          // show fallback while loading
//     variable: '--font-inter', // CSS variable for Tailwind
// });
//
// const mono = Geist_Mono({
//     subsets: ['latin'],
//     variable: '--font-mono',
// });
//
// export default function RootLayout({ children }: { children: React.ReactNode }) {
//     return (
//         <html lang="en" className={`${inter.variable} ${mono.variable}`}>
//             <body className={inter.className}>{children}</body>
//         </html>
//     );
// }
//
// // Local font (self-hosted .woff2)
// import localFont from 'next/font/local';
//
// const myFont = localFont({
//     src: './fonts/MyFont.woff2',
//     variable: '--font-custom',
// });

// ───────────────────────────────────────────────────────────────
// 3. next/script
// ───────────────────────────────────────────────────────────────
//
// Controls WHEN third-party scripts load, preventing them from
// blocking rendering or competing with critical resources.
//
// Strategy options:
//   beforeInteractive  — loads before hydration (rare, blocks)
//   afterInteractive   — loads after hydration (default, analytics)
//   lazyOnload         — lowest priority, loads in idle time
//   worker             — moves to a web worker (experimental)
//
// // app/layout.tsx
// import Script from 'next/script';
//
// export default function RootLayout({ children }) {
//     return (
//         <html>
//             <body>
//                 {children}
//
//                 {/* Google Analytics — loads after page is interactive */}
//                 <Script
//                     src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX"
//                     strategy="afterInteractive"
//                 />
//                 <Script id="ga-init" strategy="afterInteractive">
//                     {`
//                         window.dataLayer = window.dataLayer || [];
//                         function gtag(){dataLayer.push(arguments);}
//                         gtag('js', new Date());
//                         gtag('config', 'G-XXXXXXXX');
//                     `}
//                 </Script>
//
//                 {/* Chat widget — lowest priority */}
//                 <Script
//                     src="https://chat.example.com/widget.js"
//                     strategy="lazyOnload"
//                     onLoad={() => console.log('Chat loaded')}
//                 />
//             </body>
//         </html>
//     );
// }

// ───────────────────────────────────────────────────────────────
// 4. METADATA & SEO
// ───────────────────────────────────────────────────────────────
//
// // app/layout.tsx — static root metadata
// export const metadata: Metadata = {
//     title:       { default: 'My App', template: '%s | My App' },
//     description: 'Default description',
//     openGraph:   { title: 'My App', description: '…', images: ['/og.png'] },
//     robots:      { index: true, follow: true },
// };
//
// // app/blog/[slug]/page.tsx — dynamic metadata per page
// export async function generateMetadata(
//     { params }: { params: { slug: string } }
// ): Promise<Metadata> {
//     const post = await getPost(params.slug);
//
//     return {
//         title:       post.title,
//         description: post.excerpt,
//         openGraph: {
//             title:  post.title,
//             images: [post.coverImage],
//             type:   'article',
//             publishedTime: post.publishedAt,
//         },
//         alternates: {
//             canonical: `https://mysite.com/blog/${params.slug}`,
//         },
//     };
// }
//
// // JSON-LD structured data (for Google rich results)
// export default async function BlogPost({ params }) {
//     const post = await getPost(params.slug);
//     return (
//         <>
//             <script
//                 type="application/ld+json"
//                 dangerouslySetInnerHTML={{
//                     __html: JSON.stringify({
//                         '@context': 'https://schema.org',
//                         '@type': 'Article',
//                         headline: post.title,
//                         author: { '@type': 'Person', name: post.author },
//                         datePublished: post.publishedAt,
//                     }),
//                 }}
//             />
//             <article>{/* page content */}</article>
//         </>
//     );
// }

// ───────────────────────────────────────────────────────────────
// 5. ISR SEGMENT CONFIG
// ───────────────────────────────────────────────────────────────
//
// Export route-level constants to control rendering strategy.
// No need to change fetch() calls — the segment config overrides.
//
// // Force SSG (static, never revalidate)
// export const revalidate = false;
// export const dynamic    = 'force-static';
//
// // ISR: revalidate every hour
// export const revalidate = 3600;
//
// // Force SSR: always server-render, no cache
// export const dynamic = 'force-dynamic';
//
// // Runtime edge (for low-latency, runs in V8 edge runtime)
// export const runtime = 'edge';
//
// // Example product page:
// // app/products/[id]/page.tsx
// export const revalidate = 3600;          // re-generate every hour
// export const dynamicParams = true;       // allow unknown params (not just from generateStaticParams)
//
// export async function generateStaticParams() {
//     const featured = await db.product.findMany({ where: { featured: true } });
//     return featured.map(p => ({ id: p.id }));
// }

// ───────────────────────────────────────────────────────────────
// 6. BUNDLE ANALYSIS & CODE SPLITTING
// ───────────────────────────────────────────────────────────────
//
// Install: npm install -D @next/bundle-analyzer
//
// // next.config.ts
// import withBundleAnalyzer from '@next/bundle-analyzer';
//
// const config = withBundleAnalyzer({
//     enabled: process.env.ANALYZE === 'true',
// })({ /* nextConfig options */ });
//
// export default config;
//
// // Run: ANALYZE=true npm run build
// // Opens an interactive treemap of your bundles
//
// // Dynamic import — code splitting
// import dynamic from 'next/dynamic';
//
// const HeavyChart = dynamic(
//     () => import('@/components/HeavyChart'),
//     {
//         loading: () => <ChartSkeleton />,
//         ssr: false,    // don't SSR — it uses window
//     }
// );
//
// // Only import HeavyChart's bundle when it renders in the browser

// ───────────────────────────────────────────────────────────────
// 7. WEB VITALS
// ───────────────────────────────────────────────────────────────
//
// Core Web Vitals (Google ranking signals):
//
//  LCP — Largest Contentful Paint  < 2.5s   (how fast main content loads)
//  CLS — Cumulative Layout Shift   < 0.1    (visual stability)
//  INP — Interaction to Next Paint < 200ms  (responsiveness)
//  FCP — First Contentful Paint    < 1.8s   (first pixel)
//  TTFB — Time to First Byte       < 800ms  (server response)
//
// Next.js reports web vitals automatically.
// Capture and send to analytics:
//
// // app/_components/WebVitals.tsx  ('use client')
// 'use client';
// import { useReportWebVitals } from 'next/web-vitals';
//
// export function WebVitalsReporter() {
//     useReportWebVitals(metric => {
//         console.log(metric);   // { name, value, rating: 'good'|'needs-improvement'|'poor' }
//
//         // Send to analytics service
//         fetch('/api/vitals', {
//             method: 'POST',
//             body: JSON.stringify(metric),
//         });
//     });
//     return null;
// }
//
// // app/layout.tsx
// <WebVitalsReporter />

// ── Teaching version: mock Web Vitals hook ──
interface VitalMetric {
    name: 'LCP' | 'CLS' | 'FCP' | 'INP' | 'TTFB';
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
}

function getVitalRating(name: VitalMetric['name'], value: number): VitalMetric['rating'] {
    const thresholds: Record<VitalMetric['name'], [number, number]> = {
        LCP:  [2500, 4000],
        CLS:  [0.1,  0.25],
        FCP:  [1800, 3000],
        INP:  [200,  500],
        TTFB: [800,  1800],
    };
    const [good, poor] = thresholds[name];
    if (value <= good) return 'good';
    if (value <= poor) return 'needs-improvement';
    return 'poor';
}

// ───────────────────────────────────────────────────────────────
// 8. SENTRY ERROR TRACKING
// ───────────────────────────────────────────────────────────────
//
// // npx @sentry/wizard@latest -i nextjs
// // (Wizard handles: sentry.client.config.ts, sentry.server.config.ts,
// //  instrumentation.ts, next.config.ts wrapping)
//
// // lib/sentry.ts — helper for capturing custom errors
// import * as Sentry from '@sentry/nextjs';
//
// export function captureError(error: unknown, context?: Record<string, unknown>) {
//     Sentry.withScope(scope => {
//         if (context) scope.setExtras(context);
//         Sentry.captureException(error);
//     });
// }
//
// // Server Action with Sentry
// export async function dangerousAction(formData: FormData) {
//     try {
//         await performRiskyOperation(formData);
//     } catch (error) {
//         captureError(error, { action: 'dangerousAction', formData: Object.fromEntries(formData) });
//         return { error: 'Something went wrong' };
//     }
// }
//
// // Sentry user context (set after auth)
// export async function setUser(session: Session) {
//     Sentry.setUser({ id: session.user.id, email: session.user.email });
// }
//
// // app/global-error.tsx — catch unhandled errors + report
// 'use client';
// import * as Sentry from '@sentry/nextjs';
// import NextError from 'next/error';
// import { useEffect } from 'react';
//
// export default function GlobalError({ error, reset }) {
//     useEffect(() => { Sentry.captureException(error); }, [error]);
//     return (
//         <html><body>
//             <NextError statusCode={0} />
//             <button onClick={reset}>Try again</button>
//         </body></html>
//     );
// }

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

// Q1: What is the difference between loading={priority} and loading="lazy"
//     in the context of next/image?
// → priority=true tells next/image to add a <link rel="preload"> for
//   the image and use loading="eager". Use for above-the-fold images
//   (hero, LCP element) so they don't delay LCP.
//   loading="lazy" (default) defers loading until the image is near
//   the viewport, saving bandwidth on images below the fold.

// Q2: Why does next/font eliminate layout shift (CLS) from fonts?
// → Without optimisation, the browser renders text in the fallback
//   font, then swaps to the web font after it loads — causing elements
//   to shift. next/font calculates the metrics difference and applies
//   size-adjust/ascent-override CSS to the fallback, making it
//   visually identical to the final font so no shift occurs.

// Q3: What does Script strategy="lazyOnload" mean?
// → The script is loaded during browser idle time — after the page is
//   interactive and all other resources are loaded. Ideal for chat
//   widgets, ads, or analytics that don't need to be available
//   immediately. Prevents competing with critical resources.

// Q4: When would you use export const dynamic = 'force-dynamic'?
// → When the page MUST be server-rendered on every request:
//   • Reads cookies/headers that differ per user
//   • Accesses real-time data (stock prices, live sports scores)
//   • Personalised content (shopping cart, user dashboard)
//   Any of these would cause static generation to fail or return
//   stale data — force-dynamic ensures a fresh server render.

// Q5: Implement getVitalRating — already done above.
// Test:
const _testVitals = [
    { name: 'LCP'  as const, value: 1200, expected: 'good'              },
    { name: 'CLS'  as const, value: 0.15, expected: 'needs-improvement' },
    { name: 'INP'  as const, value: 600,  expected: 'poor'              },
];
// _testVitals.forEach(t =>
//     console.assert(getVitalRating(t.name, t.value) === t.expected, t.name)
// );

// Q6: What is dynamic import (next/dynamic) and when should you use it?
// → It's React.lazy + Suspense wrapped in a Next.js API.
//   The imported module is excluded from the main JS bundle and
//   loaded on-demand when the component first renders.
//   Use for:
//   • Heavy libraries (Monaco editor, chart.js, PDF viewers)
//   • Browser-only code (ssr: false skips server rendering)
//   • Components below the fold that aren't needed on first paint

// Q7: What is CLS and how does next/image prevent it?
// → CLS (Cumulative Layout Shift) measures how much content jumps
//   during loading. It is a Core Web Vital and ranking signal.
//   next/image requires width + height (or fill) — it reserves space
//   via aspect-ratio or explicit dimensions BEFORE the image loads.
//   The browser knows how much space to allocate, so nothing shifts
//   when the image appears.

export { LazyImage, getVitalRating };
export type { VitalMetric };
