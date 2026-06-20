import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: { default: 'Next.js Mastery', template: '%s | Next.js Mastery' },
  description: 'Learning Next.js 15 — Days 18–21',
};

const NAV_ITEMS = [
  { href: '/', label: '🏠 Overview' },
  { href: '/day-18', label: 'Day 18 — App Router' },
  { href: '/day-19', label: 'Day 19 — RSC vs CC' },
  { href: '/day-20', label: 'Day 20 — Data & Actions' },
  { href: '/day-21', label: 'Day 21 — Performance' },
  { href: '/blog', label: '📝 Blog Demo' },
  { href: '/dashboard', label: '📊 Dashboard Demo' },
  { href: '/practice', label: '🧠 Practice' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, display: 'flex', minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
        <aside style={{ width: 240, background: '#1e293b', padding: '24px 0', flexShrink: 0, borderRight: '1px solid #334155' }}>
          <div style={{ padding: '0 20px 20px', fontSize: 18, fontWeight: 700, color: '#6366f1' }}>
            Next.js Mastery
          </div>
          <nav>
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                style={{ display: 'block', padding: '10px 20px', color: '#94a3b8', textDecoration: 'none', fontSize: 14, borderLeft: '3px solid transparent' }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
