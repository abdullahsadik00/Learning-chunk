interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
}

export function PageHeader({ title, subtitle, badge }: PageHeaderProps) {
  return (
    <div style={{ marginBottom: 40 }}>
      {badge && (
        <span
          style={{
            display: 'inline-block',
            marginBottom: 12,
            fontSize: 12,
            fontWeight: 700,
            color: '#6366f1',
            background: '#6366f122',
            padding: '4px 12px',
            borderRadius: 999,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {badge}
        </span>
      )}
      <h1
        style={{
          fontSize: 32,
          fontWeight: 800,
          color: '#f8fafc',
          margin: '0 0 10px',
          lineHeight: 1.2,
        }}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          style={{
            fontSize: 16,
            color: '#94a3b8',
            margin: 0,
            maxWidth: 640,
            lineHeight: 1.65,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
