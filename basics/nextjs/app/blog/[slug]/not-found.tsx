import Link from 'next/link';

export default function BlogPostNotFound() {
  return (
    <main
      style={{
        maxWidth: 560,
        margin: '0 auto',
        padding: '80px 24px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: '#e2e8f0',
        background: '#020817',
        minHeight: '100vh',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 64,
          marginBottom: 16,
          lineHeight: 1,
        }}
      >
        404
      </div>

      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: '#f1f5f9',
          margin: '0 0 12px',
        }}
      >
        Post not found
      </h1>

      <p
        style={{
          fontSize: 14,
          color: '#64748b',
          margin: '0 0 32px',
          lineHeight: 1.6,
        }}
      >
        This post may have been moved or deleted. Check the URL or browse all
        posts below.
      </p>

      <Link
        href="/blog"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 20px',
          background: '#6366f1',
          color: '#fff',
          borderRadius: 8,
          textDecoration: 'none',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        ← Back to Blog
      </Link>
    </main>
  );
}
