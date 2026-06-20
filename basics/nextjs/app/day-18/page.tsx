import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { DemoBox } from '@/components/DemoBox';

export const metadata = { title: 'Day 18 — App Router' };

const section: React.CSSProperties = {
  marginBottom: 56,
};

const h2: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: '#f1f5f9',
  margin: '0 0 4px',
};

const lead: React.CSSProperties = {
  fontSize: 14,
  color: '#64748b',
  margin: '0 0 20px',
  lineHeight: 1.6,
};

const table: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13,
  color: '#cbd5e1',
};

const th: React.CSSProperties = {
  background: '#1e293b',
  color: '#94a3b8',
  fontWeight: 600,
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  padding: '10px 14px',
  textAlign: 'left',
  borderBottom: '1px solid #334155',
};

const td: React.CSSProperties = {
  padding: '10px 14px',
  borderBottom: '1px solid #1e293b',
  verticalAlign: 'top',
};

const badge = (color: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '2px 10px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  background: color + '22',
  color: color,
});

export default function Day18Page() {
  return (
    <main
      style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '48px 24px',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: '#e2e8f0',
        background: '#020817',
        minHeight: '100vh',
      }}
    >
      <PageHeader
        badge="Day 18"
        title="App Router & Routing"
        subtitle="File-system routing, special files, rendering strategies, and route handlers — the complete mental model for Next.js 15."
      />

      {/* ── SECTION 1: Rendering Strategies ─────────────────────── */}
      <section style={section}>
        <h2 style={h2}>Rendering Strategies</h2>
        <p style={lead}>
          Next.js 15 supports four rendering strategies. The right choice depends on how often the
          data changes and who the audience is.
        </p>

        <DemoBox title="SSG / ISR / SSR / CSR comparison">
          <div style={{ overflowX: 'auto' }}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Strategy</th>
                  <th style={th}>Next.js config</th>
                  <th style={th}>Use case</th>
                  <th style={th}>Pros</th>
                  <th style={th}>Cons</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={td}>
                    <span style={badge('#10b981')}>SSG</span>
                    <br />
                    <span style={{ fontSize: 11, color: '#475569' }}>Static Site Gen</span>
                  </td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 12, color: '#a5b4fc' }}>
                    {'export const dynamic =\n  "force-static"'}
                  </td>
                  <td style={td}>Marketing pages, docs, blogs with infrequent updates</td>
                  <td style={td}>Fastest TTFB, CDN-cacheable, zero server cost per request</td>
                  <td style={td}>Stale until next build; not suitable for user-specific data</td>
                </tr>
                <tr>
                  <td style={td}>
                    <span style={badge('#6366f1')}>ISR</span>
                    <br />
                    <span style={{ fontSize: 11, color: '#475569' }}>Incremental Static Regen</span>
                  </td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 12, color: '#a5b4fc' }}>
                    {'export const revalidate = 3600'}
                  </td>
                  <td style={td}>Blog posts, product pages, news — updated periodically</td>
                  <td style={td}>CDN speed + fresh data; no rebuild required</td>
                  <td style={td}>
                    One stale response per revalidation window (stale-while-revalidate)
                  </td>
                </tr>
                <tr>
                  <td style={td}>
                    <span style={badge('#f59e0b')}>SSR</span>
                    <br />
                    <span style={{ fontSize: 11, color: '#475569' }}>Server-Side Render</span>
                  </td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 12, color: '#a5b4fc' }}>
                    {'export const dynamic =\n  "force-dynamic"'}
                  </td>
                  <td style={td}>Dashboards, search results, pages reading cookies / auth</td>
                  <td style={td}>Always fresh; can read request context (headers, cookies)</td>
                  <td style={td}>Higher TTFB; server must be running per request</td>
                </tr>
                <tr>
                  <td style={td}>
                    <span style={badge('#ef4444')}>CSR</span>
                    <br />
                    <span style={{ fontSize: 11, color: '#475569' }}>Client-Side Render</span>
                  </td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 12, color: '#a5b4fc' }}>
                    {'"use client"\nuseEffect + fetch'}
                  </td>
                  <td style={td}>Interactive widgets, real-time data, user-only content</td>
                  <td style={td}>Full browser API access; no server round-trip after load</td>
                  <td style={td}>Slower initial paint; SEO requires SSR shell</td>
                </tr>
              </tbody>
            </table>
          </div>
        </DemoBox>
      </section>

      {/* ── SECTION 2: File Conventions ──────────────────────────── */}
      <section style={section}>
        <h2 style={h2}>File Conventions</h2>
        <p style={lead}>
          The App Router uses special filenames to attach behaviour to route segments. Every file
          scopes to its own segment and does not affect siblings or parents.
        </p>

        <DemoBox title="Sample app/ directory tree">
          <pre
            style={{
              fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
              fontSize: 13,
              lineHeight: 1.75,
              color: '#c9d1d9',
              background: '#0d1117',
              padding: '20px 24px',
              borderRadius: 6,
              margin: 0,
              overflowX: 'auto',
            }}
          >
{`app/
├── layout.tsx          ← Root layout — wraps every page (persistent UI)
├── page.tsx            ← Home route  /
├── loading.tsx         ← Suspense fallback for this segment
├── error.tsx           ← Error boundary for this segment  ('use client')
├── not-found.tsx       ← Rendered when notFound() is called
├── template.tsx        ← Like layout but remounts on navigation
│
├── (marketing)/        ← Route group — groups without affecting URL
│   └── about/
│       └── page.tsx    ← Route  /about
│
├── blog/
│   ├── page.tsx        ← Route  /blog
│   └── [slug]/
│       ├── page.tsx    ← Route  /blog/:slug
│       ├── loading.tsx ← Segment-scoped loading UI
│       └── not-found.tsx
│
├── dashboard/
│   ├── layout.tsx      ← Nested layout for all /dashboard/* routes
│   ├── @analytics/     ← Named slot for parallel routes
│   │   └── page.tsx
│   └── page.tsx        ← Route  /dashboard
│
└── api/
    └── posts/
        └── route.ts    ← Route Handler  GET /api/posts`}
          </pre>

          <div style={{ marginTop: 20, display: 'grid', gap: 10 }}>
            {[
              { file: 'page.tsx', desc: 'Defines a publicly accessible route. Without this file a directory is not a route.' },
              { file: 'layout.tsx', desc: 'Wraps child segments. State is preserved across navigations — the layout does not remount.' },
              { file: 'loading.tsx', desc: 'Wrapped in a <Suspense> boundary automatically. Shown while the page awaits async data.' },
              { file: 'error.tsx', desc: 'Must be a Client Component. Catches errors thrown by the segment and its children, renders a fallback UI.' },
              { file: 'not-found.tsx', desc: 'Rendered when notFound() is called anywhere in the segment. Overrides the global 404.' },
              { file: 'route.ts', desc: 'Route Handler — replaces the old pages/api directory. Exports named HTTP method functions (GET, POST, …).' },
              { file: 'template.tsx', desc: 'Like layout.tsx but creates a new instance on every navigation. Useful for per-page animations or analytics.' },
            ].map(({ file, desc }) => (
              <div
                key={file}
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  padding: '10px 14px',
                  background: '#0f172a',
                  borderRadius: 6,
                  border: '1px solid #1e293b',
                }}
              >
                <code
                  style={{
                    fontSize: 12,
                    color: '#a5b4fc',
                    fontFamily: 'monospace',
                    minWidth: 120,
                    flexShrink: 0,
                  }}
                >
                  {file}
                </code>
                <span style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>{desc}</span>
              </div>
            ))}
          </div>
        </DemoBox>
      </section>

      {/* ── SECTION 3: Live Routes Demo ───────────────────────────── */}
      <section style={section}>
        <h2 style={h2}>Live Routes Demo</h2>
        <p style={lead}>
          All routes below are implemented in this app. Click to navigate.
        </p>

        <DemoBox title="Working routes in this app">
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              {
                href: '/blog',
                label: '/blog',
                tag: 'ISR',
                tagColor: '#6366f1',
                desc: 'Blog listing with category filter — statically generated, revalidates every hour',
              },
              {
                href: '/blog/next-js-15-app-router-guide',
                label: '/blog/next-js-15-app-router-guide',
                tag: 'Dynamic',
                tagColor: '#f59e0b',
                desc: 'Dynamic blog post — [slug] route with generateStaticParams for top posts',
              },
              {
                href: '/dashboard',
                label: '/dashboard',
                tag: 'Parallel',
                tagColor: '#10b981',
                desc: 'Parallel routes demo using @slot convention',
              },
              {
                href: '/api/posts',
                label: '/api/posts',
                tag: 'Route Handler',
                tagColor: '#ef4444',
                desc: 'GET /api/posts — returns JSON, no React involved',
              },
            ].map(({ href, label, tag, tagColor, desc }) => (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  background: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: 8,
                  textDecoration: 'none',
                  transition: 'border-color 0.15s',
                }}
              >
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 13,
                    color: '#93c5fd',
                    minWidth: 260,
                    flexShrink: 0,
                  }}
                >
                  {label}
                </span>
                <span style={badge(tagColor)}>{tag}</span>
                <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{desc}</span>
              </Link>
            ))}
          </div>
        </DemoBox>
      </section>

      {/* ── SECTION 4: Dynamic Routes ─────────────────────────────── */}
      <section style={section}>
        <h2 style={h2}>Dynamic Route Segments</h2>
        <p style={lead}>
          Next.js uses bracket notation in directory names to create dynamic segments. Three
          variants handle different URL shapes.
        </p>

        <DemoBox title="[slug] vs [...slug] vs [[...slug]]">
          <div style={{ overflowX: 'auto' }}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Segment syntax</th>
                  <th style={th}>Matches URL</th>
                  <th style={th}>params shape</th>
                  <th style={th}>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ ...td, fontFamily: 'monospace', color: '#a5b4fc' }}>[slug]</td>
                  <td style={{ ...td, fontFamily: 'monospace' }}>/blog/my-post</td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }}>
                    {'{ slug: "my-post" }'}
                  </td>
                  <td style={td}>Exactly one segment. Does not match /blog/a/b.</td>
                </tr>
                <tr>
                  <td style={{ ...td, fontFamily: 'monospace', color: '#34d399' }}>[...slug]</td>
                  <td style={{ ...td, fontFamily: 'monospace' }}>/docs/a/b/c</td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }}>
                    {'{ slug: ["a","b","c"] }'}
                  </td>
                  <td style={td}>
                    One or more segments. Does NOT match the parent route /docs alone.
                  </td>
                </tr>
                <tr>
                  <td style={{ ...td, fontFamily: 'monospace', color: '#fb923c' }}>
                    [[...slug]]
                  </td>
                  <td style={{ ...td, fontFamily: 'monospace' }}>/docs or /docs/a/b</td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }}>
                    {'{ slug: undefined } or { slug: ["a","b"] }'}
                  </td>
                  <td style={td}>
                    Zero or more segments. Also matches the root — useful for optional catch-alls.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p style={{ fontSize: 13, color: '#475569', margin: '16px 0 0', lineHeight: 1.6 }}>
            In Next.js 15 <code style={{ color: '#a5b4fc' }}>params</code> is a{' '}
            <strong style={{ color: '#f8fafc' }}>Promise</strong> — always{' '}
            <code style={{ color: '#a5b4fc' }}>await params</code> before destructuring in Server
            Components and in <code style={{ color: '#a5b4fc' }}>generateMetadata</code>.
          </p>
        </DemoBox>
      </section>
    </main>
  );
}
