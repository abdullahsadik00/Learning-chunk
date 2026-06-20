import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './compound/Accordion';
import { DataFetcher } from './render-props/DataFetcher';
import { Box } from './polymorphic/Box';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import type { User } from '@/types';

// --- Styles helpers ---

const card: React.CSSProperties = {
  background: '#1e293b',
  borderRadius: '10px',
  padding: '1.5rem',
  marginBottom: '2rem',
  border: '1px solid #334155',
};

const sectionTitle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 700,
  color: '#38bdf8',
  marginBottom: '1rem',
  borderBottom: '1px solid #334155',
  paddingBottom: '0.5rem',
};

const badge: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '0.7rem',
  fontWeight: 600,
  padding: '0.15rem 0.5rem',
  borderRadius: '4px',
  marginRight: '0.4rem',
  background: '#0ea5e9',
  color: '#fff',
};

// --- JSONPlaceholder post shape ---

interface PlaceholderPost {
  userId: number;
  id: number;
  title: string;
  body: string;
}

// --- Demo user constant ---

const DEMO_USER: User = {
  id: 'u1',
  name: 'Sadik Shaikh',
  email: 'sadik@demo.com',
  avatar: 'https://i.pravatar.cc/40?u=u1',
  role: 'admin',
};

// --- Auth mini-demo ---

function AuthDemo() {
  const { user, isAuthenticated, login, logout } = useAuthStore();
  const { addNotification } = useUIStore();

  const handleLogin = () => {
    login(DEMO_USER, 'mock-jwt-token-xyz');
    addNotification({ type: 'success', message: 'Logged in as Sadik Shaikh' });
  };

  const handleLogout = () => {
    logout();
    addNotification({ type: 'info', message: 'Logged out successfully' });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
      <div style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>
        {isAuthenticated && user ? (
          <>
            <span style={{ color: '#4ade80', marginRight: '0.5rem' }}>Logged in as</span>
            <strong>{user.name}</strong>
            <span style={{ color: '#64748b', margin: '0 0.5rem' }}>({user.role})</span>
          </>
        ) : (
          <span style={{ color: '#f87171' }}>Not authenticated</span>
        )}
      </div>
      {isAuthenticated ? (
        <button
          onClick={handleLogout}
          style={{
            padding: '0.4rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: '#ef4444',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '0.85rem',
          }}
        >
          Logout
        </button>
      ) : (
        <button
          onClick={handleLogin}
          style={{
            padding: '0.4rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: '#22c55e',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '0.85rem',
          }}
        >
          Login as Demo User
        </button>
      )}
    </div>
  );
}

// --- Notification mini-demo ---

function NotificationDemo() {
  const { notifications, addNotification, removeNotification, markAllRead } = useUIStore();

  const types = ['info', 'success', 'warning', 'error'] as const;
  const colors: Record<string, string> = {
    info: '#38bdf8',
    success: '#4ade80',
    warning: '#facc15',
    error: '#f87171',
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {types.map((t) => (
          <button
            key={t}
            onClick={() =>
              addNotification({ type: t, message: `${t.toUpperCase()} notification at ${new Date().toLocaleTimeString()}` })
            }
            style={{
              padding: '0.3rem 0.75rem',
              borderRadius: '5px',
              border: `1px solid ${colors[t]}`,
              background: 'transparent',
              color: colors[t],
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 500,
            }}
          >
            + {t}
          </button>
        ))}
        <button
          onClick={markAllRead}
          style={{
            padding: '0.3rem 0.75rem',
            borderRadius: '5px',
            border: '1px solid #475569',
            background: 'transparent',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '0.8rem',
          }}
        >
          Mark all read
        </button>
      </div>

      {notifications.length === 0 ? (
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No notifications yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {notifications.slice(0, 5).map((n) => (
            <li
              key={n.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                background: n.read ? '#0f172a' : '#1e3a4f',
                border: `1px solid ${colors[n.type]}33`,
                fontSize: '0.85rem',
                color: '#cbd5e1',
              }}
            >
              <span>
                <span style={{ color: colors[n.type], marginRight: '0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
                  [{n.type.toUpperCase()}]
                </span>
                {n.message}
                {!n.read && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#38bdf8',
                      marginLeft: '0.5rem',
                      verticalAlign: 'middle',
                    }}
                  />
                )}
              </span>
              <button
                onClick={() => removeNotification(n.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  lineHeight: 1,
                  padding: '0 0.25rem',
                }}
              >
                x
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// --- Main demo ---

export default function PatternsDemo() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', color: '#e2e8f0' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem', color: '#f1f5f9' }}>
        React Patterns Demo
      </h1>

      {/* 1. Compound Component — Accordion */}
      <div style={card}>
        <h2 style={sectionTitle}>
          <span style={badge}>Pattern</span>Compound Components — Accordion
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
          Shared state via context. Parent coordinates; children opt-in via hooks.
        </p>
        <Accordion multiple={false}>
          <AccordionItem id="q1">
            <AccordionTrigger>What is a compound component?</AccordionTrigger>
            <AccordionContent>
              A compound component is a pattern where multiple components share implicit state through React context.
              The parent component owns and manages state; children consume it via a custom hook — without prop drilling.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem id="q2">
            <AccordionTrigger>Why use context instead of prop drilling?</AccordionTrigger>
            <AccordionContent>
              Context lets deeply nested children read shared state without every intermediate component passing props
              down. For UI components like accordions, tabs, and selects, this keeps the API clean and flexible.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem id="q3">
            <AccordionTrigger>When should you avoid compound components?</AccordionTrigger>
            <AccordionContent>
              Avoid them when the component tree is shallow (plain props suffice), when the shared state is global
              (reach for Zustand/Context at app level), or when the component only has one consumer and no flexibility is needed.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* 2. Render Props — DataFetcher */}
      <div style={card}>
        <h2 style={sectionTitle}>
          <span style={badge}>Pattern</span>Render Props — DataFetcher
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
          The component owns fetch logic; you control rendering via a render prop.
        </p>
        <DataFetcher<PlaceholderPost>
          url="https://jsonplaceholder.typicode.com/posts/1"
          render={({ data, loading, error, refetch }) => {
            if (loading) return <p style={{ color: '#94a3b8' }}>Fetching post…</p>;
            if (error) return <p style={{ color: '#f87171' }}>Error: {error.message}</p>;
            if (!data) return null;
            return (
              <div>
                <p style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '0.25rem' }}>
                  #{data.id} — {data.title}
                </p>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{data.body}</p>
                <button
                  onClick={refetch}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '5px',
                    border: '1px solid #38bdf8',
                    background: 'transparent',
                    color: '#38bdf8',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  Refetch
                </button>
              </div>
            );
          }}
        />
      </div>

      {/* 3. Polymorphic Box */}
      <div style={card}>
        <h2 style={sectionTitle}>
          <span style={badge}>Pattern</span>Polymorphic Component — Box
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
          One component, any HTML element. The{' '}
          <code style={{ color: '#f472b6', fontSize: '0.85rem' }}>as</code> prop changes the rendered tag and merges
          its props with full TypeScript inference.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Box as="h1" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8', margin: 0 }}>
            Box as h1 — Page Title
          </Box>
          <Box as="p" style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
            Box as p — a paragraph of descriptive text rendered with the correct semantic element.
          </Box>
          <Box
            as="button"
            onClick={() => alert('Box as button clicked!')}
            style={{
              alignSelf: 'flex-start',
              padding: '0.4rem 1rem',
              borderRadius: '6px',
              border: '1px solid #6366f1',
              background: '#6366f1',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.875rem',
            }}
          >
            Box as button — Click me
          </Box>
          <Box
            as="a"
            href="https://react.dev"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#f472b6', fontSize: '0.875rem' }}
          >
            Box as a — link to React docs
          </Box>
        </div>
      </div>

      {/* 4. Zustand — Auth store */}
      <div style={card}>
        <h2 style={sectionTitle}>
          <span style={badge}>Store</span>Zustand — Auth Store (persisted)
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
          State persists to localStorage via the persist middleware. Devtools visible in Redux DevTools extension.
        </p>
        <AuthDemo />
      </div>

      {/* 5. Zustand — UI / Notifications store */}
      <div style={card}>
        <h2 style={sectionTitle}>
          <span style={badge}>Store</span>Zustand — UI Store (notifications)
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
          Ephemeral UI state — no persistence. Add, dismiss, and mark-read notifications.
        </p>
        <NotificationDemo />
      </div>
    </div>
  );
}
