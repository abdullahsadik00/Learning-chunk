export default function Loading() {
  return (
    <div style={{ animation: 'pulse 1.5s infinite' }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: 36,
            background: '#334155',
            borderRadius: 6,
            marginBottom: 8,
          }}
        />
      ))}
    </div>
  );
}
