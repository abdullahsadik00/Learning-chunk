export default function Loading() {
  return (
    <div style={{ padding: '32px 0' }}>
      {[200, 320, 260].map((width, i) => (
        <div
          key={i}
          style={{
            height: 20,
            width,
            maxWidth: '100%',
            background: '#1e293b',
            borderRadius: 6,
            marginBottom: 16,
            animation: 'pulse 1.4s ease-in-out infinite',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
