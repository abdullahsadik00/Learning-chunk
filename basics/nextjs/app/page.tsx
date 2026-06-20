import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Overview',
};

const DAYS = [
  {
    day: 18,
    href: '/day-18',
    title: 'App Router',
    description: 'File conventions, dynamic routes, parallel & intercepting routes',
    accent: '#6366f1',
    icon: '🗂️',
  },
  {
    day: 19,
    href: '/day-19',
    title: 'Server vs Client Components',
    description: 'RSC composition, children-as-slot pattern, boundary rules',
    accent: '#10b981',
    icon: '⚛️',
  },
  {
    day: 20,
    href: '/day-20',
    title: 'Data Fetching & Server Actions',
    description: 'Server fetch, Suspense streaming, optimistic updates',
    accent: '#f59e0b',
    icon: '🔄',
  },
  {
    day: 21,
    href: '/day-21',
    title: 'Middleware & Performance',
    description: 'Auth middleware, next/image, ISR, Web Vitals',
    accent: '#ec4899',
    icon: '⚡',
  },
];

export default function HomePage() {
  return (
    <div>
      <div style={{ marginBottom: 48 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#f8fafc', margin: '0 0 12px' }}>
          Next.js 15 — Days 18–21
        </h1>
        <p style={{ fontSize: 18, color: '#94a3b8', margin: 0, maxWidth: 600 }}>
          From App Router to performance optimization. Each day is a live interactive demo.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 24,
          maxWidth: 860,
        }}
      >
        {DAYS.map(({ day, href, title, description, accent, icon }) => (
          <div
            key={day}
            style={{
              background: '#1e293b',
              borderRadius: 12,
              padding: 28,
              borderLeft: `4px solid ${accent}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 28 }}>{icon}</span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: accent,
                  background: `${accent}22`,
                  padding: '2px 10px',
                  borderRadius: 999,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Day {day}
              </span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
              {title}
            </h2>
            <p style={{ fontSize: 14, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
              {description}
            </p>
            <Link
              href={href}
              style={{
                display: 'inline-block',
                marginTop: 8,
                color: accent,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Go →
            </Link>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 48, padding: '24px 28px', background: '#1e293b', borderRadius: 12, maxWidth: 860, borderTop: '3px solid #334155' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: '0 0 16px' }}>
          Live Demos
        </h2>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { href: '/blog', label: '📝 Blog — Dynamic Routes + ISR', color: '#6366f1' },
            { href: '/dashboard', label: '📊 Dashboard — Parallel Routes', color: '#10b981' },
            { href: '/practice', label: '🧠 Practice — Server Actions', color: '#f59e0b' },
          ].map(({ href, label, color }) => (
            <Link
              key={href}
              href={href}
              style={{
                padding: '10px 18px',
                background: `${color}18`,
                border: `1px solid ${color}44`,
                borderRadius: 8,
                color,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
