import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'Practice — Days 18–21',
};

type Problem = {
  title: string;
  statement: string;
  concepts: string[];
  demoHref?: string;
};

const easy: Problem[] = [
  {
    title: 'Dynamic blog page',
    statement:
      'Build an app/blog/[slug]/page.tsx that reads a slug from params, looks it up in POSTS, returns a 404 via notFound() if missing, and renders the full post body with generateMetadata for the page title.',
    concepts: ['Dynamic routes', 'generateMetadata', 'notFound()', 'Server Component'],
    demoHref: '/blog',
  },
  {
    title: 'Route Handler with query params',
    statement:
      'Extend GET /api/posts to support a ?sort=views query param that returns posts sorted by view count descending. Return 400 with a clear error message if an unsupported sort value is supplied.',
    concepts: ['Route Handler', 'searchParams', 'Input validation', 'NextResponse.json'],
  },
  {
    title: 'Loading + Error boundaries',
    statement:
      'Add loading.tsx (skeleton UI) and error.tsx (error boundary with a retry button) to app/blog/. Trigger the error boundary by throwing inside the page when NODE_ENV is "test".',
    concepts: ['loading.tsx', 'error.tsx', 'Suspense boundary', 'Client Component error boundary'],
  },
];

const medium: Problem[] = [
  {
    title: 'Contact form with Server Action + validation',
    statement:
      'Build a /contact page with a name, email, and message field. Wire it to a Server Action that validates with Zod, returns field-level errors via useActionState, and on success shows an inline confirmation — no page reload.',
    concepts: ['Server Action', 'useActionState', 'useFormStatus', 'Zod validation', 'revalidatePath'],
    demoHref: '/day-20',
  },
  {
    title: 'Infinite scroll with Route Handler',
    statement:
      'Build a client-side infinite scroll list at /feed. Fetch the first 5 posts on mount, then load 5 more on each "Load more" click via GET /api/posts?limit=5&offset=N. Show a loading spinner between fetches.',
    concepts: ['Route Handler', 'Client Component', 'useState + useEffect', 'Pagination', 'Loading state'],
  },
  {
    title: 'Protected API route',
    statement:
      'Add Bearer token auth to POST /api/posts. Read the Authorization header, validate the token against a hardcoded secret (or env var), and return 401 Unauthorized with a JSON error body if the token is missing or wrong.',
    concepts: ['Route Handler', 'Request headers', '401 response', 'Environment variables'],
  },
];

const hard: Problem[] = [
  {
    title: 'Full auth system with middleware',
    statement:
      'Implement session-based auth: POST /api/auth/login sets a signed session cookie, POST /api/auth/logout clears it, middleware protects all /dashboard/* routes and redirects to /login. The login page reads a ?message= query param and displays it.',
    concepts: ['Middleware', 'Cookies', 'Route Handlers', 'Redirect', 'NextResponse.redirect'],
    demoHref: '/day-21',
  },
  {
    title: 'Optimistic todos with Server Actions',
    statement:
      'Build a /todos page with a list of todos and an add-todo form. Use useOptimistic (React 19) to add the todo to the UI immediately while the Server Action runs. If the action fails, roll back the optimistic state and show an error toast.',
    concepts: ['useOptimistic', 'Server Action', 'Optimistic UI', 'Error rollback', 'useActionState'],
  },
  {
    title: 'E-commerce checkout flow',
    statement:
      'Multi-step checkout: Step 1 (cart review) → Step 2 (shipping address form, Server Action) → Step 3 (payment, mock Stripe intent via Route Handler) → Step 4 (confirmation with order ID). Each step validates before advancing. Use Suspense on the payment step.',
    concepts: ['Multi-step Server Actions', 'Route Handler', 'Suspense', 'Zod', 'revalidatePath', 'redirect()'],
  },
];

function DifficultyBadge({ level }: { level: 'easy' | 'medium' | 'hard' }) {
  const map = {
    easy: { label: 'Easy', color: '#4ade80', bg: '#052e16' },
    medium: { label: 'Medium', color: '#fbbf24', bg: '#1c1107' },
    hard: { label: 'Hard', color: '#f87171', bg: '#1f0707' },
  };
  const { label, color, bg } = map[level];
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        color,
        background: bg,
        border: `1px solid ${color}33`,
        borderRadius: 999,
        padding: '2px 10px',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  );
}

function ProblemCard({
  problem,
  level,
}: {
  problem: Problem;
  level: 'easy' | 'medium' | 'hard';
}) {
  return (
    <div
      style={{
        border: '1px solid #334155',
        borderRadius: 10,
        padding: '20px 24px',
        background: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <DifficultyBadge level={level} />
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>
          {problem.title}
        </h3>
        {problem.demoHref && (
          <Link
            href={problem.demoHref}
            style={{
              marginLeft: 'auto',
              fontSize: 12,
              color: '#6366f1',
              textDecoration: 'none',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            See demo →
          </Link>
        )}
      </div>

      <p style={{ margin: 0, color: '#94a3b8', fontSize: 14, lineHeight: 1.7 }}>
        {problem.statement}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {problem.concepts.map((c) => (
          <span
            key={c}
            style={{
              fontSize: 11,
              color: '#a5b4fc',
              background: '#1e1b4b',
              border: '1px solid #312e81',
              borderRadius: 6,
              padding: '2px 8px',
              fontFamily: 'monospace',
            }}
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

function Section({
  title,
  emoji,
  problems,
  level,
}: {
  title: string;
  emoji: string;
  problems: Problem[];
  level: 'easy' | 'medium' | 'hard';
}) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#f1f5f9',
          margin: '0 0 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span>{emoji}</span>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {problems.map((p) => (
          <ProblemCard key={p.title} problem={p} level={level} />
        ))}
      </div>
    </section>
  );
}

export default function PracticePage() {
  return (
    <main
      style={{
        maxWidth: 860,
        margin: '0 auto',
        padding: '48px 24px 80px',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: '#e2e8f0',
      }}
    >
      <PageHeader
        badge="Days 18–21"
        title="Practice Problems"
        subtitle="Nine hands-on problems covering App Router, Server Components, Server Actions, Route Handlers, Middleware, and performance. Work through them in order — each tier builds on the last."
      />

      <div
        style={{
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: 10,
          padding: '16px 20px',
          marginBottom: 40,
          display: 'flex',
          gap: 24,
          flexWrap: 'wrap',
        }}
      >
        {[
          { label: 'Easy', count: easy.length, color: '#4ade80' },
          { label: 'Medium', count: medium.length, color: '#fbbf24' },
          { label: 'Hard', count: hard.length, color: '#f87171' },
          { label: 'Total', count: easy.length + medium.length + hard.length, color: '#a5b4fc' },
        ].map(({ label, count, color }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color }}>{count}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      <Section title="Easy" emoji="🟢" problems={easy} level="easy" />
      <Section title="Medium" emoji="🟡" problems={medium} level="medium" />
      <Section title="Hard" emoji="🔴" problems={hard} level="hard" />
    </main>
  );
}
