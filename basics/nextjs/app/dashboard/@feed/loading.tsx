export default function Loading() {
  return (
    <div style={{ animation: 'pulse 1.5s infinite' }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <div
            style={{
              height: 18,
              background: '#334155',
              borderRadius: 6,
              marginBottom: 6,
              width: '85%',
            }}
          />
          <div
            style={{
              height: 12,
              background: '#1e3a5f',
              borderRadius: 4,
              width: '45%',
            }}
          />
        </div>
      ))}
    </div>
  );
}
