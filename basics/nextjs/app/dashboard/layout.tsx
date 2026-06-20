export default function DashboardLayout({
  children,
  stats,
  feed,
}: {
  children: React.ReactNode;
  stats: React.ReactNode;
  feed: React.ReactNode;
}) {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Dashboard Demo</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>
        Demonstrates parallel routes — @stats and @feed load independently with their own Suspense
        boundaries.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            background: '#1e293b',
            borderRadius: 12,
            padding: 20,
            border: '1px solid #334155',
          }}
        >
          <h2
            style={{
              fontSize: 14,
              color: '#6366f1',
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            @stats slot
          </h2>
          {stats}
        </div>
        <div
          style={{
            background: '#1e293b',
            borderRadius: 12,
            padding: 20,
            border: '1px solid #334155',
          }}
        >
          <h2
            style={{
              fontSize: 14,
              color: '#10b981',
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            @feed slot
          </h2>
          {feed}
        </div>
      </div>
      <div
        style={{
          background: '#1e293b',
          borderRadius: 12,
          padding: 20,
          border: '1px solid #334155',
        }}
      >
        <h2
          style={{
            fontSize: 14,
            color: '#f59e0b',
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          children slot
        </h2>
        {children}
      </div>
    </div>
  );
}
