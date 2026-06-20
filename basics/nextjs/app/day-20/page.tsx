import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { DemoBox } from '@/components/DemoBox';
import { CodeBlock } from '@/components/CodeBlock';
import { PostsStream } from '@/components/PostsStream';
import { CreatePostForm } from '@/components/CreatePostForm';

export const metadata: Metadata = {
  title: 'Day 20 — Data & Server Actions',
};

// ---------------------------------------------------------------------------
// Helpers — run on the server at request time
// ---------------------------------------------------------------------------

async function slowFetch(
  label: string,
  ms: number,
): Promise<{ label: string; durationMs: number }> {
  const start = Date.now();
  await new Promise((r) => setTimeout(r, ms));
  return { label, durationMs: Date.now() - start };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function Day20Page() {
  // Section 2: Parallel fetch — both kick off simultaneously
  const parallelStart = Date.now();
  const [userResult, postsResult] = await Promise.all([
    slowFetch('User profile', 600),
    slowFetch('Post list', 900),
  ]);
  const parallelTotal = Date.now() - parallelStart;

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
        badge="Day 20"
        title="Data Fetching & Server Actions"
        subtitle="How Next.js 15 fetches data — SSG, SSR, ISR, and streaming — plus Server Actions for form handling without a custom API route."
      />

      {/* ------------------------------------------------------------------ */}
      {/* Section 1: Data Fetching Strategies                                 */}
      {/* ------------------------------------------------------------------ */}
      <section style={{ marginBottom: 56 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
          1. Data Fetching Strategies
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20, lineHeight: 1.7 }}>
          Next.js 15 changed the defaults: <code style={{ color: '#a5b4fc' }}>fetch()</code> now
          opts out of caching by default (<code style={{ color: '#a5b4fc' }}>no-store</code>). You
          opt <em>in</em> to caching explicitly.
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
                {['Strategy', 'Config', 'Behaviour', 'Use when'].map((h) => (
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
                  strategy: 'SSG (Static)',
                  config: "cache: 'force-cache'",
                  behaviour: 'Cached indefinitely at build time',
                  when: 'Marketing pages, docs',
                },
                {
                  strategy: 'SSR (Dynamic)',
                  config: "cache: 'no-store'",
                  behaviour: 'Fresh fetch on every request',
                  when: 'Dashboards, live data',
                },
                {
                  strategy: 'ISR (Incremental)',
                  config: 'next: { revalidate: 60 }',
                  behaviour: 'Revalidates every 60 s',
                  when: 'Blog posts, product pages',
                },
                {
                  strategy: 'On-demand ISR',
                  config: 'revalidateTag / revalidatePath',
                  behaviour: 'Purge cache on mutation',
                  when: 'CMS-driven content',
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
                    <code style={{ color: '#a5b4fc', fontSize: 12 }}>{row.config}</code>
                  </td>
                  <td style={{ padding: '10px 16px', color: '#94a3b8' }}>{row.behaviour}</td>
                  <td style={{ padding: '10px 16px', color: '#94a3b8' }}>{row.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <CodeBlock
          language="typescript"
          code={`// SSG — cached forever (opt-in in Next.js 15)
const data = await fetch('/api/posts', { cache: 'force-cache' });

// SSR — fresh every request (new default in Next.js 15)
const data = await fetch('/api/posts', { cache: 'no-store' });

// ISR — revalidate every 60 seconds
const data = await fetch('/api/posts', { next: { revalidate: 60 } });

// On-demand ISR — tag the fetch, purge later
const data = await fetch('/api/posts', { next: { tags: ['posts'] } });
// In a Server Action: revalidateTag('posts')`}
        />
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 2: Parallel vs Sequential                                   */}
      {/* ------------------------------------------------------------------ */}
      <section style={{ marginBottom: 56 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
          2. Parallel vs Sequential Fetching
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20, lineHeight: 1.7 }}>
          Always use <code style={{ color: '#a5b4fc' }}>Promise.all</code> for independent fetches.
          Sequential awaits add latency equal to the sum of all durations; parallel awaits add
          latency equal to the slowest.
        </p>

        <DemoBox title="LIVE — Parallel fetch timing (ran on this request)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[userResult, postsResult].map((r) => (
              <div
                key={r.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#1e293b',
                  borderRadius: 8,
                  padding: '10px 16px',
                }}
              >
                <span style={{ color: '#e2e8f0', fontSize: 14 }}>{r.label}</span>
                <span
                  style={{
                    color: '#10b981',
                    fontFamily: 'monospace',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {r.durationMs}ms
                </span>
              </div>
            ))}
            <div
              style={{
                borderTop: '1px solid #334155',
                paddingTop: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ color: '#94a3b8', fontSize: 13 }}>
                Total wall time (parallel with Promise.all)
              </span>
              <span
                style={{
                  color: '#6366f1',
                  fontFamily: 'monospace',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {parallelTotal}ms
              </span>
            </div>
            <p style={{ color: '#475569', fontSize: 12, margin: 0 }}>
              Sequential would have taken ≈{userResult.durationMs + postsResult.durationMs}ms.
              Saved ≈{userResult.durationMs + postsResult.durationMs - parallelTotal}ms.
            </p>
          </div>
        </DemoBox>

        <CodeBlock
          language="typescript"
          code={`// Sequential — slow: waits 600ms, then waits 900ms = 1500ms total
const user = await fetchUser();
const posts = await fetchPosts();

// Parallel — fast: both start immediately, done in ~900ms
const [user, posts] = await Promise.all([fetchUser(), fetchPosts()]);`}
        />
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 3: Suspense Streaming                                        */}
      {/* ------------------------------------------------------------------ */}
      <section style={{ marginBottom: 56 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
          3. Suspense Streaming Demo
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 8, lineHeight: 1.7 }}>
          Wrap slow async Server Components in{' '}
          <code style={{ color: '#a5b4fc' }}>&lt;Suspense&gt;</code>. The shell of the page
          arrives instantly; the streamed content fills in as it resolves — no full-page
          loading state required.
        </p>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20, lineHeight: 1.7 }}>
          On first load, the section below shows a skeleton for ~1.5s, then the{' '}
          <code style={{ color: '#a5b4fc' }}>PostsStream</code> component resolves and streams in.
        </p>

        <DemoBox title="Streamed content — PostsStream (1.5s simulated delay)">
          <Suspense
            fallback={
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ color: '#475569', fontSize: 13, margin: '0 0 12px', fontFamily: 'monospace' }}>
                  ⏳ Loading posts stream...
                </p>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: 52,
                      borderRadius: 6,
                      background: '#1e293b',
                      borderBottom: '1px solid #334155',
                      opacity: 0.6 - i * 0.1,
                    }}
                  />
                ))}
              </div>
            }
          >
            <PostsStream />
          </Suspense>
        </DemoBox>

        <CodeBlock
          language="tsx"
          code={`// PostsStream is an async Server Component
export async function PostsStream() {
  await new Promise(r => setTimeout(r, 1500)); // simulates slow DB
  const posts = await db.posts.findMany({ take: 3 });
  return <PostList posts={posts} />;
}

// In page.tsx — the rest of the page renders immediately
<Suspense fallback={<PostsSkeleton />}>
  <PostsStream />  {/* streams in 1.5s later */}
</Suspense>`}
        />
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 4: Server Actions — Create Post                             */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
          4. Server Actions — Create Post Form
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20, lineHeight: 1.7 }}>
          The form below calls a Server Action directly — no{' '}
          <code style={{ color: '#a5b4fc' }}>fetch()</code>, no API route. The action runs on the
          server, validates input with Zod, and returns typed state. The client uses{' '}
          <code style={{ color: '#a5b4fc' }}>useActionState</code> (React 19) to bind the action
          and display errors inline.
        </p>

        <DemoBox title="LIVE — Server Action form (try submitting with invalid data)">
          <CreatePostForm />
        </DemoBox>

        <CodeBlock
          language="typescript"
          code={`// actions/posts.ts
'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const Schema = z.object({
  title: z.string().min(3),
  content: z.string().min(50),
  category: z.enum(['tech', 'business', 'design']),
});

export async function createPost(_prev: ActionState, formData: FormData) {
  const result = Schema.safeParse(Object.fromEntries(formData));
  if (!result.success) return { errors: result.error.flatten().fieldErrors };
  await db.posts.create({ data: result.data });
  revalidatePath('/blog');
  return { success: true, message: 'Post created!' };
}

// components/CreatePostForm.tsx
'use client';
import { useActionState } from 'react';
const [state, formAction] = useActionState(createPost, {});
// <form action={formAction}> — no onSubmit, no fetch`}
        />
      </section>
    </main>
  );
}
