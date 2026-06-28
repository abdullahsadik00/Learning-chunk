import { useState, useRef, useCallback, useMemo, memo, lazy, Suspense } from 'react';
import DemoPanel from '../../components/DemoPanel';
import { useLog } from '../../hooks/useLog';

const btn = 'px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors';
const btnGray = 'px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors';

// ─── React.memo — render count badges ────────────────────────────────────────
type TodoItem = { id: number; text: string; done: boolean };

let headerRenders = 0;
const TodoHeader = memo(function TodoHeader({ count }: { count: number }) {
  headerRenders++;
  return (
    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded px-3 py-2 mb-2 text-sm">
      <span className="font-medium text-blue-800">{count} todos</span>
      <span className="text-xs text-blue-500">Header renders: <strong>{headerRenders}</strong></span>
    </div>
  );
});

let itemRenderCounts: Record<number, number> = {};
const TodoRow = memo(function TodoRow({ item, onToggle }: { item: TodoItem; onToggle: (id: number) => void }) {
  itemRenderCounts[item.id] = (itemRenderCounts[item.id] ?? 0) + 1;
  return (
    <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm">
      <input type="checkbox" checked={item.done} onChange={() => onToggle(item.id)} className="rounded" />
      <span className={`flex-1 ${item.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item.text}</span>
      <span className="text-xs text-gray-400 font-mono">renders: {itemRenderCounts[item.id]}</span>
    </div>
  );
});

function ReactMemoDemo() {
  const { entries: log, add, clear } = useLog();
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: 1, text: 'Learn React.memo', done: false },
    { id: 2, text: 'Understand re-renders', done: false },
    { id: 3, text: 'Optimize wisely', done: false },
  ]);
  const [other, setOther] = useState(0);
  const [memoEnabled, setMemoEnabled] = useState(true);

  const toggle = useCallback((id: number) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    add(`Toggled id=${id} — only that row re-renders`);
  }, [add]);

  const fakeToggle = (id: number) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    add(`Toggled id=${id} — but without useCallback, ALL rows re-render (new fn ref)`);
  };

  headerRenders = 0;
  Object.keys(itemRenderCounts).forEach(k => { itemRenderCounts[Number(k)] = 0; });

  return (
    <DemoPanel
      title="React.memo — Skip Re-renders"
      badge="memo"
      badgeColor="green"
      description="React.memo wraps a component — it skips re-rendering if props haven't changed (shallow comparison). Combined with useCallback for function props, only the changed item re-renders."
      log={log}
      onReset={() => { clear(); setOther(0); }}
      code={`// Wrap with memo — skip re-render if props equal
const TodoRow = memo(({ item, onToggle }) => { … });

// useCallback — stable function reference
const toggle = useCallback((id) => {
  setTodos(prev => prev.map(t => t.id === id ? …));
}, []); // stable dep array`}
    >
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setMemoEnabled(e => !e)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${memoEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
          >
            memo + useCallback: {memoEnabled ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => { setOther(o => o + 1); add(`Unrelated state changed (other=${other + 1}) — check which rows re-render`); }}
            className={btnGray}
          >
            Unrelated state change ({other})
          </button>
        </div>
        <TodoHeader count={todos.length} />
        <div className="space-y-1.5">
          {todos.map(item => (
            <TodoRow
              key={item.id}
              item={item}
              onToggle={memoEnabled ? toggle : fakeToggle}
            />
          ))}
        </div>
        <p className="text-xs text-gray-500">With memo ON: toggling one item only re-renders that row. Unrelated state change renders nothing. With OFF: all rows re-render every time.</p>
      </div>
    </DemoPanel>
  );
}

// ─── Memo Pitfalls ────────────────────────────────────────────────────────────
let pitfallChildRenders = 0;
const PitfallChild = memo(function PitfallChild({ style, onClick, tag }: { style: React.CSSProperties; onClick: () => void; tag: string }) {
  pitfallChildRenders++;
  return (
    <div style={style} onClick={onClick} className="border border-gray-200 rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
      {tag} — renders: <strong>{pitfallChildRenders}</strong>
    </div>
  );
});

function MemoPitfallsDemo() {
  const { entries: log, add, clear } = useLog();
  const [count, setCount] = useState(0);
  const [fixEnabled, setFixEnabled] = useState(false);

  const brokenStyle = { color: 'blue' };          // new object every render
  const stableStyle = useMemo(() => ({ color: 'blue' }), []); // memoized

  const brokenFn = () => add('Clicked (broken fn — re-renders child)');
  const stableFn = useCallback(() => add('Clicked (stable fn — no unnecessary re-render)'), [add]);

  pitfallChildRenders = 0;

  return (
    <DemoPanel
      title="memo Pitfalls — Objects & Functions Break It"
      badge="memo"
      badgeColor="red"
      description="memo uses shallow comparison. Inline objects ({}) and inline functions create NEW references on every render — making memo useless. Fix: useMemo for objects, useCallback for functions."
      log={log}
      onReset={() => { clear(); setCount(0); }}
      code={`// ✗ Broken — new object/function every render
<Child style={{ color: 'blue' }} onClick={() => doThing()} />

// ✓ Fixed — stable references
const style = useMemo(() => ({ color: 'blue' }), []);
const onClick = useCallback(() => doThing(), [doThing]);
<Child style={style} onClick={onClick} />`}
    >
      <div className="space-y-3">
        <div className="flex gap-2">
          <button onClick={() => setFixEnabled(e => !e)} className={`px-3 py-1.5 rounded-md text-sm font-medium ${fixEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            Fix: {fixEnabled ? 'ON (useMemo + useCallback)' : 'OFF (inline)'}
          </button>
          <button onClick={() => { setCount(c => c + 1); add(`Parent re-rendered (count=${count + 1})`); }} className={btnGray}>
            Re-render parent
          </button>
        </div>
        <PitfallChild
          style={fixEnabled ? stableStyle : brokenStyle}
          onClick={fixEnabled ? stableFn : brokenFn}
          tag={fixEnabled ? 'Fixed' : 'Broken'}
        />
        <p className="text-xs text-gray-500">Click "Re-render parent" — with Fix OFF, child always re-renders. With Fix ON, it skips.</p>
      </div>
    </DemoPanel>
  );
}

// ─── Code Splitting with lazy + Suspense ──────────────────────────────────────
const FakeHeavyChart = lazy(() =>
  new Promise<{ default: React.ComponentType }>(resolve => {
    setTimeout(() => {
      resolve({
        default: function HeavyChart() {
          return (
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white">
              <p className="text-lg font-bold mb-2">📊 Heavy Chart Component</p>
              <p className="text-sm opacity-80">Loaded on demand — not in the initial bundle</p>
              <div className="mt-4 flex gap-1 items-end h-16">
                {[40, 65, 50, 80, 35, 70, 55, 90, 45, 75].map((h, i) => (
                  <div key={i} className="flex-1 bg-white/30 rounded-t" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          );
        },
      });
    }, 1500);
  })
);

function CodeSplittingDemo() {
  const { entries: log, add, clear } = useLog();
  const [showChart, setShowChart] = useState(false);
  const [key, setKey] = useState(0);

  return (
    <DemoPanel
      title="Code Splitting — React.lazy + Suspense"
      badge="Performance"
      badgeColor="orange"
      description="React.lazy + Suspense splits the bundle — heavy components load only when needed, showing a fallback UI during download. Critical for reducing initial load time."
      log={log}
      onReset={() => { clear(); setShowChart(false); setKey(k => k + 1); }}
      code={`// Lazy import — component loaded only when rendered
const HeavyChart = lazy(() => import('./HeavyChart'));

// Suspense shows fallback while loading
<Suspense fallback={<Spinner />}>
  {showChart && <HeavyChart />}
</Suspense>

// Route-based splitting (most impactful):
const DashboardPage = lazy(() => import('./pages/Dashboard'));`}
    >
      <div className="space-y-3">
        <button
          onClick={() => { setShowChart(s => !s); if (!showChart) add('Lazy import triggered — downloading chunk…'); }}
          className={btn}
        >
          {showChart ? 'Hide chart' : 'Load heavy chart'}
        </button>
        <Suspense
          fallback={
            <div className="bg-gray-100 rounded-xl p-6 animate-pulse flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500">Loading chart chunk (simulated 1.5s)…</span>
            </div>
          }
        >
          {showChart && <FakeHeavyChart key={key} />}
        </Suspense>
      </div>
    </DemoPanel>
  );
}

// ─── Virtualization — render only visible rows ────────────────────────────────
const ALL_ROWS = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `User ${i}`,
  email: `user${i}@example.com`,
  score: Math.floor(Math.random() * 100),
}));

const ROW_HEIGHT = 40;
const VISIBLE_ROWS = 10;
const BUFFER = 3;

function VirtualList() {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const startIdx = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);
  const endIdx = Math.min(ALL_ROWS.length, startIdx + VISIBLE_ROWS + BUFFER * 2);
  const visibleRows = ALL_ROWS.slice(startIdx, endIdx);

  return (
    <div
      ref={containerRef}
      onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
      className="relative overflow-auto border border-gray-200 rounded-lg"
      style={{ height: ROW_HEIGHT * VISIBLE_ROWS }}
    >
      <div style={{ height: ALL_ROWS.length * ROW_HEIGHT, position: 'relative' }}>
        {visibleRows.map(row => (
          <div
            key={row.id}
            className="absolute left-0 right-0 flex items-center gap-3 px-3 border-b border-gray-100 text-sm hover:bg-gray-50"
            style={{ top: row.id * ROW_HEIGHT, height: ROW_HEIGHT }}
          >
            <span className="text-gray-400 w-12 text-xs font-mono">#{row.id}</span>
            <span className="font-medium text-gray-700 w-24">{row.name}</span>
            <span className="text-gray-500 flex-1 text-xs">{row.email}</span>
            <span className="text-xs text-blue-600 font-bold">{row.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VirtualizationDemo() {
  const [virtual, setVirtual] = useState(true);
  const [renderAll, setRenderAll] = useState(false);

  return (
    <DemoPanel
      title="Virtualization — Render Only What's Visible"
      badge="Performance"
      badgeColor="orange"
      description="Rendering 10,000 DOM nodes is slow. Virtualization renders only the visible rows (~13 at a time) plus a buffer. Total DOM nodes: ~13 vs 10,000."
      code={`// Manual windowing: calculate visible range from scrollTop
const startIdx = Math.floor(scrollTop / ROW_HEIGHT) - BUFFER;
const visible = allItems.slice(startIdx, startIdx + visibleCount);

// Positioned absolutely within a full-height container
<div style={{ height: allItems.length * ROW_HEIGHT }}>
  {visible.map(item =>
    <div style={{ top: item.index * ROW_HEIGHT, position: 'absolute' }}>
      {item.content}
    </div>
  )}
</div>`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">10,000 rows — {virtual ? `rendering ~${VISIBLE_ROWS + BUFFER * 2} DOM nodes` : 'rendering ALL 10,000 DOM nodes (laggy!)'}</p>
          <button onClick={() => setVirtual(v => !v)} className={`px-3 py-1.5 rounded-md text-sm font-medium ${virtual ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            Virtual: {virtual ? 'ON' : 'OFF'}
          </button>
        </div>
        {virtual ? (
          <VirtualList />
        ) : (
          <div>
            {!renderAll ? (
              <button onClick={() => setRenderAll(true)} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200">
                Click to render all 10,000 rows (may freeze)
              </button>
            ) : (
              <div className="overflow-auto border border-gray-200 rounded-lg" style={{ height: ROW_HEIGHT * VISIBLE_ROWS }}>
                {ALL_ROWS.map(row => (
                  <div key={row.id} className="flex items-center gap-3 px-3 border-b border-gray-100 text-sm" style={{ height: ROW_HEIGHT }}>
                    <span className="text-gray-400 w-12 text-xs font-mono">#{row.id}</span>
                    <span className="font-medium text-gray-700 w-24">{row.name}</span>
                    <span className="text-gray-500 flex-1 text-xs">{row.email}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DemoPanel>
  );
}

export default function PerfPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Performance</h2>
        <p className="text-gray-500 mt-1">Day 17b — React.memo, code splitting, virtualization, and common pitfalls</p>
      </div>
      <ReactMemoDemo />
      <MemoPitfallsDemo />
      <CodeSplittingDemo />
      <VirtualizationDemo />
    </div>
  );
}
