import Link from 'next/link';
import { POSTS } from '@/lib/mock-data';
import type { Post } from '@/lib/mock-data';

export const revalidate = 3600;

const CATEGORIES = ['All', 'tech', 'business', 'design'] as const;

const categoryLabel: Record<string, string> = {
  All: 'All',
  tech: 'Tech',
  business: 'Business',
  design: 'Design',
};

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
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 11,
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

interface BlogPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { category } = await searchParams;
  const activeCategory = category && category !== 'All' ? category : null;

  const posts = activeCategory
    ? POSTS.filter((p) => p.category === activeCategory)
    : POSTS;

  return (
    <main
      style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: '48px 24px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: '#e2e8f0',
        background: '#020817',
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#f8fafc', margin: '0 0 8px' }}>
          Blog{' '}
          <span style={{ fontSize: 18, fontWeight: 400, color: '#475569' }}>
            ({posts.length} {posts.length === 1 ? 'post' : 'posts'})
          </span>
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
          Articles on React, TypeScript, Next.js, and software engineering.
        </p>
      </div>

      {/* ISR notice */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          background: '#6366f111',
          border: '1px solid #6366f133',
          borderRadius: 8,
          fontSize: 12,
          color: '#818cf8',
          marginBottom: 28,
        }}
      >
        <span>⚡</span>
        <span>
          This page is statically generated (ISR, revalidates every hour)
        </span>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
        {CATEGORIES.map((cat) => {
          const isActive =
            cat === 'All' ? !activeCategory : cat === activeCategory;
          return (
            <Link
              key={cat}
              href={cat === 'All' ? '/blog' : `/blog?category=${cat}`}
              style={{
                padding: '6px 16px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                background: isActive ? '#6366f1' : '#1e293b',
                color: isActive ? '#fff' : '#94a3b8',
                border: `1px solid ${isActive ? '#6366f1' : '#334155'}`,
                transition: 'all 0.15s',
              }}
            >
              {categoryLabel[cat]}
            </Link>
          );
        })}
      </div>

      {/* Post grid */}
      {posts.length === 0 ? (
        <p style={{ color: '#475569', fontSize: 14 }}>No posts found in this category.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <article
                style={{
                  background: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: 10,
                  padding: 20,
                  height: '100%',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ marginBottom: 10 }}>
                  <CategoryBadge category={post.category} />
                </div>

                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#f1f5f9',
                    margin: '0 0 8px',
                    lineHeight: 1.4,
                  }}
                >
                  {post.title}
                </h2>

                <p
                  style={{
                    fontSize: 13,
                    color: '#64748b',
                    margin: '0 0 16px',
                    lineHeight: 1.6,
                  }}
                >
                  {post.excerpt}
                </p>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 12,
                    color: '#475569',
                    borderTop: '1px solid #1e293b',
                    paddingTop: 12,
                    marginTop: 'auto',
                  }}
                >
                  <span>{post.author}</span>
                  <span style={{ display: 'flex', gap: 12 }}>
                    <span>{post.publishedAt}</span>
                    <span>{post.views.toLocaleString()} views</span>
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
