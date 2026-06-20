import { POSTS } from '@/lib/mock-data';

// This is an async Server Component — it intentionally waits 1.5s
// so you can see the Suspense skeleton before it resolves.
export async function PostsStream() {
  await new Promise((r) => setTimeout(r, 1500));
  const posts = POSTS.slice(0, 3);

  return (
    <div>
      <p
        style={{
          color: '#10b981',
          fontSize: 13,
          margin: '0 0 16px',
          fontFamily: 'monospace',
        }}
      >
        ✓ Streamed after 1.5s — this arrived while the rest of the page was
        already visible
      </p>
      {posts.map((post) => (
        <div
          key={post.slug}
          style={{ padding: '12px 0', borderBottom: '1px solid #334155' }}
        >
          <strong style={{ color: '#e2e8f0', fontSize: 14 }}>
            {post.title}
          </strong>
          <span
            style={{
              color: '#64748b',
              fontSize: 12,
              marginLeft: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {post.category}
          </span>
          <p
            style={{
              color: '#94a3b8',
              fontSize: 12,
              margin: '4px 0 0',
              lineHeight: 1.5,
            }}
          >
            {post.excerpt}
          </p>
        </div>
      ))}
    </div>
  );
}
