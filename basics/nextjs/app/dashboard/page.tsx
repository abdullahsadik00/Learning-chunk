export default function DashboardPage() {
  return (
    <div>
      <p style={{ color: '#94a3b8', lineHeight: 1.7, marginBottom: 20 }}>
        This is the <code style={{ background: '#0f172a', padding: '2px 6px', borderRadius: 4 }}>children</code> slot — it renders alongside the two parallel slots above. In a real app, this might be a navigation or breadcrumb area. Notice how each slot can have its own loading state via{' '}
        <code style={{ background: '#0f172a', padding: '2px 6px', borderRadius: 4 }}>loading.tsx</code>.
      </p>
      <div
        style={{
          background: '#0f172a',
          borderRadius: 8,
          padding: 16,
          fontFamily: 'monospace',
          fontSize: 13,
          lineHeight: 1.8,
          color: '#94a3b8',
          overflowX: 'auto',
        }}
      >
        <div style={{ color: '#6366f1' }}>app/dashboard/</div>
        <div>
          <span style={{ color: '#334155' }}>├── </span>
          <span style={{ color: '#f59e0b' }}>layout.tsx</span>
          <span style={{ color: '#475569' }}>     ← receives children + @stats + @feed props</span>
        </div>
        <div>
          <span style={{ color: '#334155' }}>├── </span>
          <span style={{ color: '#f59e0b' }}>page.tsx</span>
          <span style={{ color: '#475569' }}>       ← fills the children slot (this file)</span>
        </div>
        <div>
          <span style={{ color: '#334155' }}>├── </span>
          <span style={{ color: '#10b981' }}>@stats/</span>
        </div>
        <div>
          <span style={{ color: '#334155' }}>│   ├── </span>
          <span style={{ color: '#f59e0b' }}>page.tsx</span>
          <span style={{ color: '#475569' }}>   ← async, 800 ms delay</span>
        </div>
        <div>
          <span style={{ color: '#334155' }}>│   ├── </span>
          <span style={{ color: '#f59e0b' }}>loading.tsx</span>
          <span style={{ color: '#475569' }}>← skeleton shown while stats fetch</span>
        </div>
        <div>
          <span style={{ color: '#334155' }}>│   └── </span>
          <span style={{ color: '#f59e0b' }}>default.tsx</span>
          <span style={{ color: '#475569' }}>← prevents 404 on direct URL access</span>
        </div>
        <div>
          <span style={{ color: '#334155' }}>└── </span>
          <span style={{ color: '#6366f1' }}>@feed/</span>
        </div>
        <div>
          <span style={{ color: '#334155' }}>    ├── </span>
          <span style={{ color: '#f59e0b' }}>page.tsx</span>
          <span style={{ color: '#475569' }}>   ← async, 1500 ms delay</span>
        </div>
        <div>
          <span style={{ color: '#334155' }}>    ├── </span>
          <span style={{ color: '#f59e0b' }}>loading.tsx</span>
          <span style={{ color: '#475569' }}>← skeleton shown while feed fetch</span>
        </div>
        <div>
          <span style={{ color: '#334155' }}>    └── </span>
          <span style={{ color: '#f59e0b' }}>default.tsx</span>
          <span style={{ color: '#475569' }}>← prevents 404 on direct URL access</span>
        </div>
      </div>
    </div>
  );
}
