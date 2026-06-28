import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const MODULES: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
    '01': lazy(() => import('../01-jsx-and-components')),
    '02': lazy(() => import('../02-hooks-useState-useEffect')),
    '03': lazy(() => import('../03-hooks-useRef-useMemo-useCallback')),
    '04': lazy(() => import('../04-hooks-context-reducer-custom')),
    '05': lazy(() => import('../05-react-internals')),
    '06': lazy(() => import('../06-advanced-patterns')),
    '07': lazy(() => import('../07-state-management')),
    '08': lazy(() => import('../08-react-patterns')),
    '09': lazy(() => import('../09-performance')),
    '10': lazy(() => import('../10-testing')),
    '11': lazy(() => import('../11-practice')),
};

const LABELS: Record<string, string> = {
    '01': 'JSX & Components',
    '02': 'useState & useEffect',
    '03': 'useRef · useMemo · useCallback',
    '04': 'useContext · useReducer · Custom Hooks',
    '05': 'React Internals',
    '06': 'Advanced Patterns',
    '07': 'State Management',
    '08': 'React Patterns',
    '09': 'Performance',
    '10': 'Testing',
    '11': 'Practice',
};

const m = new URLSearchParams(location.search).get('m') ?? '';
const Module = MODULES[m];

if (m && LABELS[m]) {
    document.title = `${m} — ${LABELS[m]}`;
}

function App() {
    if (!Module) {
        return (
            <div style={{ padding: '48px 40px', fontFamily: 'system-ui, sans-serif', maxWidth: 480 }}>
                <h2 style={{ marginBottom: 20, fontSize: 20, fontWeight: 600 }}>Pick a module</h2>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Object.keys(MODULES).map(k => (
                        <li key={k}>
                            <a
                                href={`?m=${k}`}
                                style={{
                                    display: 'flex', gap: 10, alignItems: 'center', padding: '8px 12px',
                                    borderRadius: 8, border: '1px solid #e4e3e0', textDecoration: 'none',
                                    color: '#1c1917', fontSize: 14,
                                }}
                            >
                                <span style={{ fontFamily: 'monospace', color: '#a8a29e', fontSize: 12 }}>{k}</span>
                                {LABELS[k]}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    return (
        <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#a8a29e', fontSize: 14 }}>
                Loading…
            </div>
        }>
            <div style={{ padding: '32px 40px', maxWidth: 860, margin: '0 auto' }}>
                <Module />
            </div>
        </Suspense>
    );
}

createRoot(document.getElementById('root')!).render(<App />);
