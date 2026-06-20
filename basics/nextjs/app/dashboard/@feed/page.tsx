import { POSTS } from '@/lib/mock-data';

export default async function FeedPage() {
  await new Promise<void>((r) => setTimeout(r, 1500));

  const latestPosts = [...POSTS]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 3);

  return (
    <div>
      {latestPosts.map((post) => (
        <div
          key={post.slug}
          style={{
            padding: '10px 0',
            borderBottom: '1px solid #334155',
          }}
        >
          <p
            style={{
              fontWeight: 600,
              fontSize: 14,
              marginBottom: 4,
              color: '#e2e8f0',
            }}
          >
            {post.title}
          </p>
          <div
            style={{
              display: 'flex',
              gap: 12,
              fontSize: 12,
              color: '#64748b',
            }}
          >
            <span>{post.author}</span>
            <span>
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <span style={{ color: '#475569' }}>{post.category}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
