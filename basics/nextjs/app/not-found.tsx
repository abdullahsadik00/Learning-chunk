import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        gap: 20,
      }}
    >
      <div style={{ fontSize: 80, lineHeight: 1 }}>🔍</div>
      <h1
        style={{
          fontSize: 48,
          fontWeight: 800,
          color: '#f8fafc',
          margin: 0,
          letterSpacing: '-0.02em',
        }}
      >
        404
      </h1>
      <p
        style={{
          fontSize: 20,
          color: '#94a3b8',
          margin: 0,
        }}
      >
        Page Not Found
      </p>
      <p
        style={{
          fontSize: 15,
          color: '#64748b',
          margin: 0,
          maxWidth: 360,
          lineHeight: 1.6,
        }}
      >
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        href="/"
        style={{
          marginTop: 8,
          display: 'inline-block',
          padding: '12px 28px',
          background: '#6366f1',
          color: '#fff',
          borderRadius: 8,
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: 15,
        }}
      >
        ← Back to Overview
      </Link>
    </div>
  );
}
