import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPost, getTopPosts, getRelatedPosts } from '@/lib/mock-data';
import type { Post } from '@/lib/mock-data';

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  return getTopPosts(3).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: 'Not Found' };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
    },
  };
}

const categoryColor: Record<string, string> = {
  tech: '#6366f1',
  business: '#10b981',
  design: '#f59e0b',
};

function CategoryBadge({ category }: { category: Post['category'] }) {
  const color = categoryColor[category] ?? '#64748b';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 12px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: color + '22',
        color: color,
        textTransform: 'capitalize',
      }}
    >
      {category}
    </span>
  );
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = getRelatedPosts(post, 3);

  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '48px 24px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: '#e2e8f0',
        background: '#020817',
        minHeight: '100vh',
      }}
    >
      {/* Back link */}
      <Link
        href="/blog"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          color: '#64748b',
          textDecoration: 'none',
          marginBottom: 32,
        }}
      >
        ← Back to Blog
      </Link>

      {/* Post header */}
      <header style={{ marginBottom: 36 }}>
        <div style={{ marginBottom: 12 }}>
          <CategoryBadge category={post.category} />
        </div>

        <h1
          style={{
            fontSize: 34,
            fontWeight: 800,
            color: '#f8fafc',
            margin: '0 0 16px',
            lineHeight: 1.25,
          }}
        >
          {post.title}
        </h1>

        <p
          style={{
            fontSize: 17,
            color: '#94a3b8',
            margin: '0 0 20px',
            lineHeight: 1.65,
          }}
        >
          {post.excerpt}
        </p>

        <div
          style={{
            display: 'flex',
            gap: 20,
            fontSize: 13,
            color: '#475569',
            alignItems: 'center',
            flexWrap: 'wrap',
            paddingBottom: 20,
            borderBottom: '1px solid #1e293b',
          }}
        >
          <span>
            <span style={{ color: '#64748b' }}>By </span>
            <strong style={{ color: '#cbd5e1' }}>{post.author}</strong>
          </span>
          <span>{post.publishedAt}</span>
          <span>{post.views.toLocaleString()} views</span>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 11,
              color: '#6366f1',
              background: '#6366f111',
              padding: '3px 10px',
              borderRadius: 999,
              border: '1px solid #6366f133',
            }}
          >
            ⚡ ISR · revalidates 1h
          </span>
        </div>
      </header>

      {/* Post body */}
      <article
        style={{
          fontSize: 15,
          lineHeight: 1.8,
          color: '#cbd5e1',
          marginBottom: 56,
        }}
      >
        {post.content.split('\n\n').map((paragraph, i) => (
          <p key={i} style={{ margin: '0 0 20px' }}>
            {paragraph}
          </p>
        ))}
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <section>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#f1f5f9',
              margin: '0 0 16px',
              paddingTop: 20,
              borderTop: '1px solid #1e293b',
            }}
          >
            Related Posts
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {related.map((rel) => (
              <Link
                key={rel.slug}
                href={`/blog/${rel.slug}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    padding: '14px 16px',
                    background: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#e2e8f0',
                        marginBottom: 4,
                        lineHeight: 1.4,
                      }}
                    >
                      {rel.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#475569' }}>
                      {rel.publishedAt} · {rel.views.toLocaleString()} views
                    </div>
                  </div>
                  <span style={{ color: '#334155', flexShrink: 0 }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
