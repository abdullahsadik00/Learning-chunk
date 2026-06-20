interface DemoBoxProps {
  title: string;
  children: React.ReactNode;
}

export function DemoBox({ title, children }: DemoBoxProps) {
  return (
    <div
      style={{
        border: '1px solid #334155',
        borderRadius: 10,
        overflow: 'hidden',
        margin: '20px 0',
      }}
    >
      {/* Label bar */}
      <div
        style={{
          background: '#1e293b',
          borderBottom: '1px solid #334155',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#6366f1',
            display: 'inline-block',
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.04em' }}>
          {title}
        </span>
      </div>

      {/* Content area */}
      <div
        style={{
          background: '#0f172a',
          padding: '24px',
        }}
      >
        {children}
      </div>
    </div>
  );
}
