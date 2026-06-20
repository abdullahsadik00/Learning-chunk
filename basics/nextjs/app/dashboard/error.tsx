'use client';

import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <h2 style={{ color: '#ef4444', fontSize: 24, marginBottom: 12 }}>
        Dashboard failed to load
      </h2>
      <p style={{ color: '#94a3b8', marginBottom: 8 }}>{error.message}</p>
      {error.digest && (
        <p style={{ color: '#64748b', fontSize: 12, marginBottom: 16 }}>
          Error ID: {error.digest}
        </p>
      )}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
        <button
          onClick={reset}
          style={{
            padding: '10px 24px',
            background: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{
            padding: '10px 24px',
            background: 'transparent',
            color: '#94a3b8',
            border: '1px solid #334155',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
