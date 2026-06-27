import React, { useState, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';

const MODULES = [
    { id: '01', day: 12, label: 'JSX & Components',                       load: lazy(() => import('../01-jsx-and-components'))              },
    { id: '02', day: 13, label: 'useState · useEffect',                    load: lazy(() => import('../02-hooks-useState-useEffect'))         },
    { id: '03', day: 14, label: 'useRef · useMemo · useCallback',          load: lazy(() => import('../03-hooks-useRef-useMemo-useCallback'))  },
    { id: '04', day: 14, label: 'useContext · useReducer · Custom Hooks',  load: lazy(() => import('../04-hooks-context-reducer-custom'))      },
    { id: '05', day: 15, label: 'Virtual DOM · Fiber',                     load: lazy(() => import('../05-react-internals'))                  },
    { id: '06', day: 15, label: 'Error Boundaries · Portals · ForwardRef', load: lazy(() => import('../06-advanced-patterns'))                },
    { id: '07', day: 16, label: 'State Management',                        load: lazy(() => import('../07-state-management'))                 },
    { id: '08', day: 17, label: 'React Patterns',                          load: lazy(() => import('../08-react-patterns'))                   },
    { id: '09', day: 17, label: 'Performance',                             load: lazy(() => import('../09-performance'))                      },
    { id: '10', day: 17, label: 'Testing (components as demos)',           load: lazy(() => import('../10-testing'))                          },
    { id: '11', day: 17, label: 'Practice',                                load: lazy(() => import('../11-practice'))                         },
];

const S: Record<string, React.CSSProperties> = {
    sidebar: {
        width: 230, flexShrink: 0, borderRight: '1px solid #e5e7eb',
        background: '#f9fafb', display: 'flex', flexDirection: 'column',
        height: '100vh', overflowY: 'auto',
    },
    sidebarHead: { padding: '14px 16px 12px', borderBottom: '1px solid #e5e7eb' },
    main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    header: {
        borderBottom: '1px solid #e5e7eb', padding: '10px 24px',
        background: '#fff', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
    },
    content: { flex: 1, overflowY: 'auto', padding: 24, maxWidth: 900 },
};

function App() {
    const [active, setActive] = useState('01');
    const mod = MODULES.find(m => m.id === active)!;
    const Demo = mod.load;

    return (
        <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
            {/* Sidebar */}
            <nav style={S.sidebar}>
                <div style={S.sidebarHead}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>React Mastery</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Days 12–17 · live demos</div>
                </div>
                {MODULES.map(m => (
                    <button
                        key={m.id}
                        onClick={() => setActive(m.id)}
                        style={{
                            display: 'block', width: '100%', textAlign: 'left',
                            padding: '9px 16px', border: 'none', cursor: 'pointer',
                            background: active === m.id ? '#e0e7ff' : 'transparent',
                            color: active === m.id ? '#3730a3' : '#374151',
                            fontWeight: active === m.id ? 600 : 400,
                            fontSize: 13, lineHeight: 1.4,
                            borderLeft: active === m.id ? '3px solid #6366f1' : '3px solid transparent',
                        }}
                    >
                        <span style={{ color: '#9ca3af', fontSize: 11 }}>Day {m.day} · </span>
                        {m.label}
                    </button>
                ))}
            </nav>

            {/* Main */}
            <div style={S.main}>
                <div style={S.header}>
                    <span style={{ background: '#e0e7ff', color: '#4338ca', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                        Day {mod.day}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>{mod.label}</span>
                    <code style={{ marginLeft: 'auto', fontSize: 11, color: '#9ca3af', background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>
                        {mod.id}-*.tsx
                    </code>
                </div>
                <div style={S.content}>
                    <Suspense fallback={
                        <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>Loading demo…</div>
                    }>
                        <Demo />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}

createRoot(document.getElementById('root')!).render(
    <React.StrictMode><App /></React.StrictMode>
);
