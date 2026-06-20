'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <h2 style={{ color: '#ef4444', fontSize: 24, marginBottom: 12 }}>Something went wrong</h2>
      <p style={{ color: '#94a3b8', marginBottom: 8 }}>{error.message}</p>
      {error.digest && (
        <p style={{ color: '#64748b', fontSize: 12, marginBottom: 16 }}>
          Error ID: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        style={{
          marginTop: 16,
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
    </div>
  );
}
