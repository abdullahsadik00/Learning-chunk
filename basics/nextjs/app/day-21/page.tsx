import type { Metadata } from 'next';
import Image from 'next/image';
import { PageHeader } from '@/components/PageHeader';
import { DemoBox } from '@/components/DemoBox';
import { CodeBlock } from '@/components/CodeBlock';

export const metadata: Metadata = {
  title: 'Day 21 — Middleware & Performance',
};

export default function Day21Page() {
  return (
    <main
      style={{
        maxWidth: 860,
        margin: '0 auto',
        padding: '48px 24px 80px',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: '#e2e8f0',
      }}
    >
      <PageHeader
        badge="Day 21"
        title="Middleware & Performance"
        subtitle="Edge middleware, next/image optimisation, the Metadata API, and a complete map of Next.js caching and revalidation strategies."
      />

      {/* ------------------------------------------------------------------ */}
      {/* Section 1: Middleware                                               */}
      {/* ------------------------------------------------------------------ */}
      <section style={{ marginBottom: 56 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
          1. Middleware
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 8, lineHeight: 1.7 }}>
          <code style={{ color: '#a5b4fc' }}>middleware.ts</code> lives at the project root and
          runs on the Edge runtime <em>before</em> every matching request — even before cached
          responses are served. It can redirect, rewrite, mutate headers, or short-circuit the
          request entirely.
        </p>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20, lineHeight: 1.7 }}>
          Because it runs on the Edge it has no Node.js APIs. Keep it fast: no database calls,
          no heavy computation. It is designed for decisions you can make from the request object
          alone (URL, cookies, headers).
        </p>

        <DemoBox title="middleware.ts — live in this app">
          <CodeBlock
            language="typescript"
            code={`import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /dashboard — check for a "session" cookie
  if (pathname.startsWith('/dashboard')) {
    const session = request.cookies.get('session');
    if (!session) {
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('message', 'Login required to access dashboard');
      return NextResponse.redirect(loginUrl);
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
}

export const config = {
  // Run on every route except Next.js internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};`}
          />
        </DemoBox>

        <div
          style={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: 10,
            padding: '20px 24px',
            marginTop: 20,
          }}
        >
          <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 700, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Common middleware use cases
          </p>
          <ul style={{ margin: 0, padding: '0 0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Auth redirect', desc: 'Check session cookie/JWT, redirect unauthenticated users to /login' },
              { label: 'Internationalisation (i18n)', desc: 'Detect Accept-Language header, rewrite /products → /en/products' },
              { label: 'A/B testing', desc: 'Assign a cohort cookie, rewrite to /page-a or /page-b' },
              { label: 'Rate limiting', desc: 'Check a KV store (Upstash/Redis) for request counts, return 429 if exceeded' },
              { label: 'Geo-based routing', desc: 'Use request.geo to redirect users to region-specific sub-domains' },
              { label: 'Security headers', desc: 'Inject CSP, HSTS, X-Frame-Options on every response' },
            ].map((item) => (
              <li key={item.label} style={{ color: '#e2e8f0', fontSize: 14 }}>
                <strong style={{ color: '#a5b4fc' }}>{item.label}</strong>
                <span style={{ color: '#64748b' }}> — {item.desc}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 2: next/image                                               */}
      {/* ------------------------------------------------------------------ */}
      <section style={{ marginBottom: 56 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
          2. next/image — Automatic Image Optimisation
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20, lineHeight: 1.7 }}>
          <code style={{ color: '#a5b4fc' }}>next/image</code> wraps the native{' '}
          <code style={{ color: '#a5b4fc' }}>&lt;img&gt;</code> and adds: automatic WebP/AVIF
          conversion, lazy loading by default, size warnings if{' '}
          <code style={{ color: '#a5b4fc' }}>width</code>/<code style={{ color: '#a5b4fc' }}>height</code>{' '}
          are missing, and a built-in CDN pipeline via{' '}
          <code style={{ color: '#a5b4fc' }}>/api/_next/image</code>.
        </p>

        <DemoBox title="next/image demo — Picsum photo with priority">
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
              <Image
                src="https://picsum.photos/seed/nextjs/400/250"
                alt="A sample landscape photo served through next/image"
                width={400}
                height={250}
                priority
                style={{ borderRadius: 10, display: 'block', maxWidth: '100%' }}
              />
              <p style={{ color: '#475569', fontSize: 11, marginTop: 8, fontFamily: 'monospace' }}>
                source: picsum.photos • optimised via Next.js image pipeline
              </p>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              {[
                { prop: 'priority', effect: 'Preloads image, disables lazy loading. Use on above-the-fold images.' },
                { prop: 'width + height', effect: 'Required for external images. Prevents layout shift (CLS).' },
                { prop: 'fill', effect: 'Fills parent container. Use with position: relative on the parent.' },
                { prop: 'sizes', effect: 'Hints the browser which srcset entry to pick at each viewport width.' },
                { prop: 'placeholder="blur"', effect: 'Shows blurred base64 preview while the image loads.' },
              ].map((p) => (
                <div
                  key={p.prop}
                  style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #1e293b' }}
                >
                  <code style={{ color: '#a5b4fc', fontSize: 13 }}>{p.prop}</code>
                  <p style={{ color: '#94a3b8', fontSize: 12, margin: '4px 0 0', lineHeight: 1.5 }}>
                    {p.effect}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </DemoBox>

        <CodeBlock
          language="tsx"
          code={`import Image from 'next/image';

// Basic — external image, explicit dimensions
<Image
  src="https://example.com/photo.jpg"
  alt="Descriptive alt text"
  width={800}
  height={500}
  priority          // above-the-fold: preload, skip lazy loading
/>

// Fill mode — image fills a positioned parent
<div style={{ position: 'relative', height: 400 }}>
  <Image
    src="/hero.jpg"
    alt="Hero"
    fill
    sizes="(max-width: 768px) 100vw, 50vw"
    style={{ objectFit: 'cover' }}
  />
</div>

// next.config.ts — allow external image domains
const config: NextConfig = {
  images: {
    remotePatterns: [{ hostname: 'picsum.photos' }],
  },
};`}
        />
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 3: Metadata API                                             */}
      {/* ------------------------------------------------------------------ */}
      <section style={{ marginBottom: 56 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
          3. Metadata API
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 8, lineHeight: 1.7 }}>
          Next.js 13+ replaces the old <code style={{ color: '#a5b4fc' }}>next/head</code> with a
          file-based Metadata API. Export a{' '}
          <code style={{ color: '#a5b4fc' }}>metadata</code> object (static) or a{' '}
          <code style={{ color: '#a5b4fc' }}>generateMetadata</code> function (dynamic) from any{' '}
          <code style={{ color: '#a5b4fc' }}>page.tsx</code> or{' '}
          <code style={{ color: '#a5b4fc' }}>layout.tsx</code>.
        </p>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20, lineHeight: 1.7 }}>
          Title templates let child pages inherit a suffix automatically. The root layout defines{' '}
          <code style={{ color: '#a5b4fc' }}>template: '%s | Site Name'</code>; child pages supply
          only their own title and the template is applied automatically.
        </p>

        <CodeBlock
          language="typescript"
          code={`// app/layout.tsx — root layout sets the template
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Next.js Mastery',
    template: '%s | Next.js Mastery',   // child pages fill %s
  },
  description: 'A complete Next.js 15 learning curriculum.',
  openGraph: {
    siteName: 'Next.js Mastery',
    type: 'website',
  },
};

// app/blog/page.tsx — static metadata
export const metadata: Metadata = {
  title: 'Blog',                         // rendered: "Blog | Next.js Mastery"
  description: 'All published posts.',
};

// app/blog/[slug]/page.tsx — dynamic metadata
export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: 'Not Found' };
  return {
    title: post.title,                   // rendered: "<title> | Next.js Mastery"
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
    },
  };
}`}
        />
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 4: ISR & Caching                                            */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
          4. ISR & Caching — Full Reference
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20, lineHeight: 1.7 }}>
          Next.js 15 ships with four independent cache layers. Understanding which layer you are
          configuring prevents the most common &quot;why is my data stale?&quot; bug.
        </p>

        <div
          style={{
            overflowX: 'auto',
            borderRadius: 10,
            border: '1px solid #334155',
            marginBottom: 24,
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#1e293b' }}>
                {['Strategy', 'Syntax', 'Scope', 'Purge with'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 16px',
                      textAlign: 'left',
                      color: '#94a3b8',
                      fontWeight: 600,
                      borderBottom: '1px solid #334155',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                {
                  strategy: 'Time-based ISR',
                  syntax: "export const revalidate = 60;",
                  scope: 'Entire route segment',
                  purge: 'Automatic after N seconds',
                },
                {
                  strategy: 'Tag-based ISR',
                  syntax: "next: { tags: ['posts'] }",
                  scope: 'fetch() call(s) with that tag',
                  purge: "revalidateTag('posts')",
                },
                {
                  strategy: 'Path-based ISR',
                  syntax: 'revalidatePath("/blog")',
                  scope: 'All data on the given path',
                  purge: 'Immediate, on-demand',
                },
                {
                  strategy: 'Force dynamic',
                  syntax: "export const dynamic = 'force-dynamic';",
                  scope: 'Entire route segment',
                  purge: 'Never cached',
                },
              ].map((row, i) => (
                <tr
                  key={row.strategy}
                  style={{ background: i % 2 === 0 ? '#0f172a' : '#111827' }}
                >
                  <td style={{ padding: '10px 16px', color: '#e2e8f0', fontWeight: 600 }}>
                    {row.strategy}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <code style={{ color: '#a5b4fc', fontSize: 12 }}>{row.syntax}</code>
                  </td>
                  <td style={{ padding: '10px 16px', color: '#94a3b8' }}>{row.scope}</td>
                  <td style={{ padding: '10px 16px', color: '#94a3b8' }}>{row.purge}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <CodeBlock
          language="typescript"
          code={`// Route segment config (top of page.tsx / layout.tsx)
export const revalidate = 60;                   // ISR: revalidate every 60s
export const dynamic = 'force-dynamic';         // SSR: never cache
export const dynamic = 'force-static';          // SSG: cache forever

// Tagged fetch — granular cache control
const posts = await fetch('/api/posts', {
  next: { tags: ['posts'], revalidate: 3600 },
});

// Server Action — purge on mutation
'use server';
import { revalidateTag, revalidatePath } from 'next/cache';

export async function deletePost(id: string) {
  await db.posts.delete({ where: { id } });
  revalidateTag('posts');          // purges all fetches tagged 'posts'
  revalidatePath('/blog');         // also purges the /blog page cache
}

// unstable_cache — cache arbitrary async functions (not just fetch)
import { unstable_cache } from 'next/cache';

const getCachedPosts = unstable_cache(
  async () => db.posts.findMany(),
  ['all-posts'],
  { tags: ['posts'], revalidate: 3600 },
);`}
        />
      </section>
    </main>
  );
}
