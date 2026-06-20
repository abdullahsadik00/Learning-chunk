import React from 'react';
import { createRoot } from 'react-dom/client';

const curriculum = [
    { file: '01-jsx-and-components.tsx',             day: 12, topic: 'JSX & Components' },
    { file: '02-hooks-useState-useEffect.tsx',        day: 13, topic: 'useState · useEffect' },
    { file: '03-hooks-useRef-useMemo-useCallback.tsx',day: 14, topic: 'useRef · useMemo · useCallback' },
    { file: '04-hooks-context-reducer-custom.tsx',    day: 14, topic: 'useContext · useReducer · Custom Hooks' },
    { file: '05-react-internals.tsx',                 day: 15, topic: 'Virtual DOM · Fiber · Reconciliation' },
    { file: '06-advanced-patterns.tsx',               day: 15, topic: 'Error Boundaries · Portals · ForwardRef' },
    { file: '07-state-management.tsx',                day: 16, topic: 'Context · Zustand · React Query' },
    { file: '08-react-patterns.tsx',                  day: 17, topic: 'Compound · HOC · Render Props · Headless' },
    { file: '09-performance.tsx',                     day: 17, topic: 'memo · Code Splitting · Virtualization' },
    { file: '10-testing.tsx',                         day: 17, topic: 'Testing Library · Vitest · MSW' },
    { file: '11-practice.tsx',                        day: 17, topic: 'Practice Q&A — Easy / Medium / Hard' },
];

function App() {
    return (
        <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 700, margin: '48px auto', padding: '0 24px' }}>
            <h1 style={{ marginBottom: 4 }}>React Mastery</h1>
            <p style={{ color: '#666', marginTop: 0 }}>Phase 3 — Days 12–17</p>
            <p style={{ background: '#f0f4ff', padding: '12px 16px', borderRadius: 6, fontSize: 14 }}>
                These files are <strong>teaching modules</strong> — open them in your editor.
                Run <code>npm run check</code> to type-check all 11 files, or
                <code> npm run lint</code> to lint them.
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}>
                <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>
                        <th style={{ padding: '8px 12px' }}>Day</th>
                        <th style={{ padding: '8px 12px' }}>File</th>
                        <th style={{ padding: '8px 12px' }}>Topic</th>
                    </tr>
                </thead>
                <tbody>
                    {curriculum.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '8px 12px', color: '#6366f1', fontWeight: 600 }}>{row.day}</td>
                            <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 13 }}>{row.file}</td>
                            <td style={{ padding: '8px 12px', color: '#374151' }}>{row.topic}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

const root = document.getElementById('root')!;
createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);
