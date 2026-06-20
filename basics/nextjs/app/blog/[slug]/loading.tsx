export default function BlogPostLoading() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '48px 24px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: '#020817',
        minHeight: '100vh',
      }}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
        .sk { animation: pulse 1.5s ease-in-out infinite; background: #1e293b; border-radius: 4px; }
      `}</style>

      {/* Back link placeholder */}
      <div className="sk" style={{ width: 100, height: 14, marginBottom: 36 }} />

      {/* Category badge */}
      <div className="sk" style={{ width: 60, height: 20, borderRadius: 999, marginBottom: 16 }} />

      {/* Title — two lines */}
      <div className="sk" style={{ width: '85%', height: 34, marginBottom: 10 }} />
      <div className="sk" style={{ width: '60%', height: 34, marginBottom: 20 }} />

      {/* Excerpt */}
      <div className="sk" style={{ width: '100%', height: 17, marginBottom: 8 }} />
      <div className="sk" style={{ width: '90%', height: 17, marginBottom: 24 }} />

      {/* Meta bar */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          paddingBottom: 20,
          borderBottom: '1px solid #1e293b',
          marginBottom: 36,
        }}
      >
        {[80, 90, 70].map((w) => (
          <div key={w} className="sk" style={{ width: w, height: 14 }} />
        ))}
      </div>

      {/* Body paragraphs */}
      {[100, 95, 88, 100, 92, 78, 100, 85].map((w, i) => (
        <div
          key={i}
          className="sk"
          style={{
            width: `${w}%`,
            height: 14,
            marginBottom: i % 4 === 3 ? 24 : 10,
          }}
        />
      ))}
    </main>
  );
}
