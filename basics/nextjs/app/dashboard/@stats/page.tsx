export default async function StatsPage() {
  await new Promise<void>((r) => setTimeout(r, 800));

  const stats = [
    { label: 'Total Users', value: '12,430', delta: '+8.2%' },
    { label: 'Revenue', value: '$48,290', delta: '+12.5%' },
    { label: 'Active Sessions', value: '1,842', delta: '-2.1%' },
  ];

  return (
    <div>
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 0',
            borderBottom: '1px solid #334155',
          }}
        >
          <span style={{ color: '#94a3b8', fontSize: 14 }}>{s.label}</span>
          <div>
            <span style={{ fontWeight: 600 }}>{s.value}</span>
            <span
              style={{
                fontSize: 12,
                marginLeft: 8,
                color: s.delta.startsWith('+') ? '#10b981' : '#ef4444',
              }}
            >
              {s.delta}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
