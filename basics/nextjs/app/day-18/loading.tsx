export default function Day18Loading() {
  return (
    <main
      style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '48px 24px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: '#020817',
        minHeight: '100vh',
      }}
    >
      {/* Badge skeleton */}
      <div
        style={{
          width: 80,
          height: 20,
          borderRadius: 999,
          background: '#1e293b',
          marginBottom: 14,
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
      {/* Title skeleton */}
      <div
        style={{
          width: 360,
          height: 36,
          borderRadius: 6,
          background: '#1e293b',
          marginBottom: 12,
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
      {/* Subtitle skeleton */}
      <div
        style={{
          width: 560,
          height: 18,
          borderRadius: 4,
          background: '#1e293b',
          marginBottom: 48,
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />

      {/* Section blocks */}
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ marginBottom: 48 }}>
          <div
            style={{
              width: 200,
              height: 22,
              borderRadius: 4,
              background: '#1e293b',
              marginBottom: 10,
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
          <div
            style={{
              width: '100%',
              height: 180,
              borderRadius: 8,
              background: '#0f172a',
              border: '1px solid #1e293b',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        </div>
      ))}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </main>
  );
}
