import { PageHeader } from '@/components/PageHeader';
import { DemoBox } from '@/components/DemoBox';
import { CodeBlock } from '@/components/CodeBlock';
import { ClientCounter } from '@/components/ClientCounter';

export const metadata = { title: 'Day 19 — Server vs Client Components' };

const section: React.CSSProperties = { marginBottom: 56 };

const h2: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: '#f1f5f9',
  margin: '0 0 4px',
};

const lead: React.CSSProperties = {
  fontSize: 14,
  color: '#64748b',
  margin: '0 0 20px',
  lineHeight: 1.6,
};

const table: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13,
  color: '#cbd5e1',
};

const th: React.CSSProperties = {
  background: '#1e293b',
  color: '#94a3b8',
  fontWeight: 600,
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  padding: '10px 14px',
  textAlign: 'left',
  borderBottom: '1px solid #334155',
};

const td: React.CSSProperties = {
  padding: '10px 14px',
  borderBottom: '1px solid #1e293b',
  textAlign: 'center',
};

const tdLeft: React.CSSProperties = { ...td, textAlign: 'left' };

// ── Server Component: renders once on the server ──────────────────────────────
function ServerSideCounter() {
  const randomNumber = Math.floor(Math.random() * 10000);
  const timestamp = new Date().toISOString();

  return (
    <div
      style={{
        padding: 16,
        background: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: 8,
        fontFamily: 'monospace',
        fontSize: 13,
      }}
    >
      <div style={{ marginBottom: 8, color: '#64748b', fontSize: 12 }}>
        Server Component — rendered once, never re-renders in the browser
      </div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <span style={{ color: '#64748b' }}>Random number: </span>
          <span style={{ color: '#34d399', fontWeight: 700, fontSize: 20 }}>{randomNumber}</span>
        </div>
        <div>
          <span style={{ color: '#64748b' }}>Server timestamp: </span>
          <span style={{ color: '#a5b4fc' }}>{timestamp}</span>
        </div>
      </div>
      <div style={{ marginTop: 10, color: '#475569', fontSize: 12, lineHeight: 1.5 }}>
        Refresh the page and the values above will change — they are computed fresh on the server
        each time. Client-side navigation will NOT re-run this component.
      </div>
    </div>
  );
}

// ── Code snippets ─────────────────────────────────────────────────────────────
const childrenSlotCode = `// ParentServer.tsx  (Server Component — no 'use client')
import { ClientCounter } from '@/components/ClientCounter';

export default function ParentServer() {
  // This Server Component renders ClientCounter as a child.
  // The <ClientCounter> boundary is marked 'use client', so it
  // hydrates in the browser while ParentServer stays server-only.
  return (
    <section>
      <h2>Parent is a Server Component</h2>
      <ClientCounter />
    </section>
  );
}

// Alternatively, pass server-rendered content INTO a Client wrapper:
// ClientShell.tsx
'use client';
export function ClientShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return open ? <div>{children}</div> : null;
}

// page.tsx (Server Component)
import { ClientShell } from './ClientShell';
export default function Page() {
  return (
    <ClientShell>
      {/* These children are Server Components — they render on the server
          and their output is passed as a serialised React tree to ClientShell */}
      <ServerDataTable />
    </ClientShell>
  );
}`;

const boundaryRulesCode = `// Rule 1 — Server Component (default)
// No 'use client' needed. Can await, access DB, read env secrets.
export default async function Page() {
  const data = await db.query('SELECT * FROM posts');
  return <ul>{data.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}

// Rule 2 — Mark a file as a Client Component
'use client';
import { useState } from 'react';
export function Counter() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>{n}</button>;
}

// Rule 3 — 'use client' is a boundary, not a per-component flag.
// Every module imported from a 'use client' file also runs on the client.

// Rule 4 — Server Components CAN import Client Components. ✅
import { Counter } from './Counter'; // fine
export default function Shell() { return <Counter />; }

// Rule 5 — Client Components CANNOT import Server Components. ❌
// 'use client';
// import { ServerOnly } from './ServerOnly'; // ERROR — would ship server code to browser
// Use the children-as-slot pattern instead (see above).`;

export default function Day19Page() {
  return (
    <main
      style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '48px 24px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: '#e2e8f0',
        background: '#020817',
        minHeight: '100vh',
      }}
    >
      <PageHeader
        badge="Day 19"
        title="Server vs Client Components"
        subtitle="When to stay on the server, when to cross the 'use client' boundary, and how to compose both patterns safely."
      />

      {/* ── SECTION 1: Comparison Table ─────────────────────────── */}
      <section style={section}>
        <h2 style={h2}>Capability Comparison</h2>
        <p style={lead}>
          The deciding question is always: does this component need interactivity or browser APIs?
          If no, keep it a Server Component.
        </p>

        <DemoBox title="What each component type can and cannot do">
          <div style={{ overflowX: 'auto' }}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={{ ...th, textAlign: 'left' }}>Capability</th>
                  <th style={th}>Server Component</th>
                  <th style={th}>Client Component</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['async / await at component level', '✅', '❌'],
                  ['useState / useEffect', '❌', '✅'],
                  ['onClick and other event handlers', '❌', '✅'],
                  ['Direct DB / filesystem access', '✅', '❌'],
                  ['Read server-side env vars (secrets)', '✅', '❌ (only NEXT_PUBLIC_*)'],
                  ['window / document / browser APIs', '❌', '✅'],
                  ['Import heavy server-only libs (no bundle cost)', '✅', '❌'],
                  ['React context (Provider/Consumer)', '❌', '✅'],
                  ['useRef / useMemo / useCallback', '❌', '✅'],
                  ['Render Client Components as children', '✅', '✅'],
                  ['Import Server Components directly', '✅', '❌ (use children slot)'],
                ].map(([cap, server, client]) => (
                  <tr key={cap as string}>
                    <td style={tdLeft}>{cap}</td>
                    <td
                      style={{
                        ...td,
                        color: (server as string).startsWith('✅') ? '#34d399' : '#f87171',
                      }}
                    >
                      {server}
                    </td>
                    <td
                      style={{
                        ...td,
                        color: (client as string).startsWith('✅') ? '#34d399' : '#f87171',
                      }}
                    >
                      {client}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DemoBox>
      </section>

      {/* ── SECTION 2: ServerSideCounter ────────────────────────── */}
      <section style={section}>
        <h2 style={h2}>Server Component in Action</h2>
        <p style={lead}>
          This block is a Server Component — it runs on the server and the random number is
          computed at render time. No JavaScript is shipped to the browser for it.
        </p>
        <DemoBox title="ServerSideCounter — runs on the server">
          <ServerSideCounter />
        </DemoBox>
      </section>

      {/* ── SECTION 3: ClientCounter ────────────────────────────── */}
      <section style={section}>
        <h2 style={h2}>Client Component in Action</h2>
        <p style={lead}>
          <code style={{ color: '#a5b4fc', fontFamily: 'monospace' }}>ClientCounter</code> is
          marked <code style={{ color: '#a5b4fc', fontFamily: 'monospace' }}>'use client'</code>{' '}
          and imported from <code style={{ fontFamily: 'monospace', color: '#a5b4fc' }}>
            @/components/ClientCounter
          </code>. It holds state in the browser — click the buttons and count persists across
          re-renders.
        </p>
        <DemoBox title="ClientCounter — 'use client', useState, event handlers">
          <ClientCounter />
        </DemoBox>
      </section>

      {/* ── SECTION 4: children-as-slot pattern ─────────────────── */}
      <section style={section}>
        <h2 style={h2}>The Children-as-Slot Pattern</h2>
        <p style={lead}>
          A Client Component cannot import a Server Component — but a Server Component can pass
          server-rendered subtrees into a Client Component as the{' '}
          <code style={{ color: '#a5b4fc', fontFamily: 'monospace' }}>children</code> prop. The
          server output travels as a serialised RSC payload; the Client Component treats it as an
          opaque subtree.
        </p>
        <DemoBox title="ParentServer → ClientCounter (children-as-slot)">
          <CodeBlock code={childrenSlotCode} language="tsx" />
          <div
            style={{
              marginTop: 12,
              padding: '10px 14px',
              background: '#0f172a',
              borderRadius: 6,
              border: '1px solid #1e293b',
              fontSize: 13,
              color: '#94a3b8',
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: '#f1f5f9' }}>Why this works:</strong> The server renders
            <code style={{ color: '#a5b4fc', margin: '0 4px', fontFamily: 'monospace' }}>
              ServerDataTable
            </code>
            to an RSC payload. That payload is passed as{' '}
            <code style={{ color: '#a5b4fc', fontFamily: 'monospace' }}>children</code> to{' '}
            <code style={{ color: '#a5b4fc', fontFamily: 'monospace' }}>ClientShell</code>, which
            holds it as an opaque value — it never re-renders the server tree, only controls
            whether to show it.
          </div>
        </DemoBox>
      </section>

      {/* ── SECTION 5: Boundary Rules ────────────────────────────── */}
      <section style={section}>
        <h2 style={h2}>The 5 Boundary Rules</h2>
        <p style={lead}>
          Memorise these five rules and the composition model becomes predictable.
        </p>

        <DemoBox title="Boundary rules with code examples">
          <ol
            style={{
              margin: '0 0 20px',
              paddingLeft: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {[
              "Every component is a Server Component by default — no annotation needed.",
              "'use client' at the top of a file turns that file AND all its transitive imports into Client Components.",
              "Server Components can freely import and render Client Components. ✅",
              "Client Components CANNOT import Server Components — doing so would ship server-only code to the browser. ❌",
              "Use the children-as-slot pattern to pass server-rendered subtrees into Client Component wrappers without breaking the boundary.",
            ].map((rule, i) => (
              <li key={i} style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6 }}>
                {rule}
              </li>
            ))}
          </ol>
          <CodeBlock code={boundaryRulesCode} language="tsx" />
        </DemoBox>
      </section>
    </main>
  );
}
