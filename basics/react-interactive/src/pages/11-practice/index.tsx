import { useState, useEffect, useCallback, useRef, useReducer } from 'react';
import DemoPanel from '../../components/DemoPanel';
import { useLog } from '../../hooks/useLog';

const btn = 'px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors';
const btnGray = 'px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors';

// ─── P1: Fix Infinite Loop ────────────────────────────────────────────────────
function BrokenInfiniteLoop() {
  const renderCount = useRef(0);
  renderCount.current++;
  const [data, setData] = useState<string[]>([]);

  // BUG: `data` array in deps — new reference every render → infinite loop
  // We simulate it safely with a counter and stop at 10
  const [loopCount, setLoopCount] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running || loopCount >= 10) return;
    const id = setTimeout(() => setLoopCount(c => c + 1), 50);
    return () => clearTimeout(id);
  }, [running, loopCount]);

  return (
    <div className="space-y-2">
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs font-mono">
        <p className="text-red-700 font-bold mb-1">✗ BROKEN — object in deps causes infinite loop</p>
        <p className="text-gray-600">useEffect(() =&gt; {'{'}</p>
        <p className="text-gray-600 ml-4">fetchData().then(setData);</p>
        <p className="text-red-600 ml-4">{'}'}, [data]); // ← data is new array every render!</p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => { setRunning(true); setLoopCount(0); }} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200">
          Simulate loop (stops at 10)
        </button>
        <button onClick={() => { setRunning(false); setLoopCount(0); }} className={btnGray}>Stop</button>
      </div>
      {loopCount > 0 && <p className="text-sm text-red-600">Effect ran {loopCount} times… (would be infinite)</p>}
    </div>
  );
}

function FixedInfiniteLoop() {
  const { entries: log, add, clear } = useLog();
  const [url, setUrl] = useState('/api/posts');
  const [data, setData] = useState<string[]>([]);

  useEffect(() => {
    add(`Fetch triggered for url="${url}"`);
    const timer = setTimeout(() => {
      setData([`Result from ${url}`, 'Item 2', 'Item 3']);
      add(`Fetch complete`);
    }, 300);
    return () => clearTimeout(timer);
  }, [url]); // ← only primitive url string, not the data array

  return (
    <div className="space-y-2">
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs font-mono">
        <p className="text-green-700 font-bold mb-1">✓ FIXED — only primitive deps</p>
        <p className="text-gray-600">useEffect(() =&gt; {'{'}</p>
        <p className="text-gray-600 ml-4">fetchData(url).then(setData);</p>
        <p className="text-green-700 ml-4">{'}'}, [url]); // ← primitive string, stable</p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => { setUrl('/api/posts'); }} className={btnGray}>/api/posts</button>
        <button onClick={() => setUrl('/api/users')} className={btnGray}>/api/users</button>
      </div>
      <ul className="space-y-1">{data.map((d, i) => <li key={i} className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">{d}</li>)}</ul>
    </div>
  );
}

function InfiniteLoopProblem() {
  const [tab, setTab] = useState<'broken' | 'fixed'>('broken');
  return (
    <DemoPanel
      title="Fix: Infinite Loop in useEffect"
      badge="Easy"
      badgeColor="green"
      description='Problem: useEffect([data]) — "data" is an array that gets a new reference on every render. Effect runs → sets data → new reference → effect runs again → forever.'
    >
      <div className="space-y-3">
        <div className="flex gap-2">
          <button onClick={() => setTab('broken')} className={tab === 'broken' ? 'px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium' : btnGray}>✗ Broken</button>
          <button onClick={() => setTab('fixed')} className={tab === 'fixed' ? 'px-3 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium' : btnGray}>✓ Fixed</button>
        </div>
        {tab === 'broken' ? <BrokenInfiniteLoop /> : <FixedInfiniteLoop />}
      </div>
    </DemoPanel>
  );
}

// ─── P2: Stale Closure ────────────────────────────────────────────────────────
function StaleClosureDemo() {
  const { entries: log, add, clear } = useLog();
  const [count, setCount] = useState(0);
  const [tab, setTab] = useState<'broken' | 'fixed'>('broken');
  const countRef = useRef(count);
  countRef.current = count; // always up to date

  const startBrokenTimer = () => {
    const captured = count; // captured at click time
    add(`Timer started (captured count=${captured}) — increment count now`);
    setTimeout(() => {
      add(`STALE CLOSURE: timer reads count=${captured} (not current ${countRef.current})`);
    }, 2000);
  };

  const startFixedTimer = () => {
    add(`Timer started (using ref) — increment count now`);
    setTimeout(() => {
      add(`FIXED: timer reads countRef.current=${countRef.current} (always latest)`);
    }, 2000);
  };

  return (
    <DemoPanel
      title="Fix: Stale Closure"
      badge="Easy"
      badgeColor="green"
      description="A closure captures the value at the time it's created. setInterval or setTimeout created during a render sees a frozen snapshot. Fix: use a ref that's updated every render."
      log={log}
      onReset={() => { clear(); setCount(0); }}
      code={`// Fix: ref always has latest value
const countRef = useRef(count);
useEffect(() => { countRef.current = count; }); // every render

// Timer reads ref, not stale closure
setTimeout(() => alert(countRef.current), 2000);`}
    >
      <div className="space-y-3">
        <div className="flex gap-2">
          <button onClick={() => setTab('broken')} className={tab === 'broken' ? 'px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium' : btnGray}>✗ Stale</button>
          <button onClick={() => setTab('fixed')} className={tab === 'fixed' ? 'px-3 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium' : btnGray}>✓ Ref fix</button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCount(c => c + 1)} className={btn}>count++ (now {count})</button>
          <button onClick={tab === 'broken' ? startBrokenTimer : startFixedTimer} className={tab === 'broken' ? 'px-3 py-1.5 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200' : 'px-3 py-1.5 bg-green-100 text-green-700 rounded-md text-sm font-medium hover:bg-green-200'}>
            Start 2s timer
          </button>
        </div>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          1. Click "Start 2s timer" &nbsp; 2. Quickly click "count++" several times &nbsp; 3. See which value the timer reads
        </p>
      </div>
    </DemoPanel>
  );
}

// ─── P3: useLocalStorage Hook ─────────────────────────────────────────────────
function useLocalStorage<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) as T : initial; }
    catch { return initial; }
  });
  const set = useCallback((v: T | ((p: T) => T)) => {
    setVal(prev => {
      const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v;
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [key]);
  const remove = useCallback(() => { localStorage.removeItem(key); setVal(initial); }, [key, initial]);
  return [val, set, remove] as const;
}

function LocalStorageProblem() {
  const [name, setName, removeName] = useLocalStorage('practice-name', '');
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('practice-theme', 'light');

  return (
    <DemoPanel
      title="Practice: useLocalStorage Hook"
      badge="Medium"
      badgeColor="orange"
      description="Build a useLocalStorage hook that reads from localStorage on mount, writes on every update, and falls back to an initial value if nothing is stored."
      code={`function useLocalStorage<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(() => {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : initial;     // lazy init
  });
  const set = useCallback((v: T) => {
    setVal(v);
    localStorage.setItem(key, JSON.stringify(v));
  }, [key]);
  return [val, set] as const;
}`}
    >
      <div className="space-y-3">
        <div className="flex gap-3 flex-wrap">
          <div>
            <p className="text-xs text-gray-500 mb-1">name (persisted)</p>
            <input value={name} onChange={e => setName(e.target.value)} className="border border-gray-200 rounded px-2 py-1 text-sm w-36" placeholder="Your name…" />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">theme (persisted)</p>
            <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} className={btnGray}>{theme}</button>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">clear</p>
            <button onClick={removeName} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200">Remove</button>
          </div>
        </div>
        <div className={`rounded-lg px-4 py-3 text-sm ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-50 border border-gray-200'}`}>
          {name ? `Hello, ${name}!` : '(enter your name above)'} — theme: {theme}
        </div>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">Refresh the page — values are still there.</p>
      </div>
    </DemoPanel>
  );
}

// ─── P4: Undo/Redo ────────────────────────────────────────────────────────────
type UndoState<T> = { past: T[]; present: T; future: T[] };
type UndoAction<T> =
  | { type: 'UPDATE'; payload: T }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET'; payload: T };

function undoReducer<T>(state: UndoState<T>, action: UndoAction<T>): UndoState<T> {
  switch (action.type) {
    case 'UPDATE':
      return { past: [...state.past, state.present], present: action.payload, future: [] };
    case 'UNDO':
      if (state.past.length === 0) return state;
      return { past: state.past.slice(0, -1), present: state.past[state.past.length - 1], future: [state.present, ...state.future] };
    case 'REDO':
      if (state.future.length === 0) return state;
      return { past: [...state.past, state.present], present: state.future[0], future: state.future.slice(1) };
    case 'RESET':
      return { past: [], present: action.payload, future: [] };
  }
}

function UndoRedoProblem() {
  const [state, dispatch] = useReducer(undoReducer<string>, { past: [], present: 'Hello, React!', future: [] });
  const { past, present, future } = state;

  return (
    <DemoPanel
      title="Practice: Undo / Redo with useReducer"
      badge="Hard"
      badgeColor="red"
      description="Implement undo/redo using useReducer with past/present/future stacks. Every UPDATE pushes present to past and clears future. UNDO pops from past. REDO pops from future."
      code={`// State shape: { past: T[], present: T, future: T[] }
// UPDATE: past=[...past, present], present=payload, future=[]
// UNDO:   past=[...past.slice(0,-1)], present=last(past), future=[present,...future]
// REDO:   past=[...past, present], present=first(future), future=future.slice(1)`}
    >
      <div className="space-y-3">
        <div className="flex gap-2">
          <button onClick={() => dispatch({ type: 'UNDO' })} disabled={past.length === 0} className={`${btnGray} disabled:opacity-40`}>
            ↩ Undo ({past.length})
          </button>
          <button onClick={() => dispatch({ type: 'REDO' })} disabled={future.length === 0} className={`${btn} disabled:opacity-40`}>
            Redo ({future.length}) ↪
          </button>
          <button onClick={() => dispatch({ type: 'RESET', payload: 'Hello, React!' })} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200">Reset</button>
        </div>
        <textarea
          value={present}
          onChange={e => dispatch({ type: 'UPDATE', payload: e.target.value })}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full h-24 resize-none focus:outline-none focus:border-blue-400"
        />
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <p className="font-medium text-gray-600 mb-1">Past ({past.length})</p>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {past.slice(-3).reverse().map((p, i) => (
                <div key={i} className="bg-gray-100 rounded px-2 py-1 text-gray-500 truncate">{p}</div>
              ))}
            </div>
          </div>
          <div>
            <p className="font-medium text-blue-600 mb-1">Present</p>
            <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1 text-blue-700 truncate">{present}</div>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Future ({future.length})</p>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {future.slice(0, 3).map((f, i) => (
                <div key={i} className="bg-gray-100 rounded px-2 py-1 text-gray-500 truncate">{f}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DemoPanel>
  );
}

// ─── P5: Drag and Drop ────────────────────────────────────────────────────────
function DragAndDropProblem() {
  const [items, setItems] = useState(['🍎 Apple', '🍌 Banana', '🍒 Cherry', '🍇 Grape', '🥝 Kiwi']);
  const dragIdx = useRef<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);

  const onDragStart = (i: number) => { dragIdx.current = i; setDragging(i); };
  const onDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === i) return;
    setItems(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx.current!, 1);
      next.splice(i, 0, moved);
      dragIdx.current = i;
      return next;
    });
  };
  const onDragEnd = () => { dragIdx.current = null; setDragging(null); };

  return (
    <DemoPanel
      title="Practice: Drag & Drop List"
      badge="Hard"
      badgeColor="red"
      description="Implement drag-and-drop reordering using HTML5 Drag and Drop API. Key: track dragging index in a ref (no re-render needed), update array on dragOver."
      code={`// dragIdx ref tracks which item is being dragged
const onDragStart = (i) => { dragIdx.current = i; };
const onDragOver = (e, i) => {
  e.preventDefault();
  if (dragIdx.current === i) return;
  const next = [...items];
  const [moved] = next.splice(dragIdx.current, 1);
  next.splice(i, 0, moved);
  dragIdx.current = i;
  setItems(next);
};`}
    >
      <div className="space-y-1.5">
        <p className="text-xs text-gray-500 mb-2">Drag items to reorder:</p>
        {items.map((item, i) => (
          <div
            key={item}
            draggable
            onDragStart={() => onDragStart(i)}
            onDragOver={e => onDragOver(e, i)}
            onDragEnd={onDragEnd}
            className={`flex items-center gap-3 rounded-lg px-4 py-2.5 border cursor-grab active:cursor-grabbing transition-colors text-sm select-none ${dragging === i ? 'border-blue-400 bg-blue-50 opacity-70' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'}`}
          >
            <span className="text-gray-400 text-xs">⠿</span>
            {item}
          </div>
        ))}
      </div>
    </DemoPanel>
  );
}

export default function PracticePage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Practice Problems</h2>
        <p className="text-gray-500 mt-1">Days 12–17 — Easy / Medium / Hard — Broken version → Fixed version side by side</p>
      </div>

      <div className="mb-4 flex gap-2">
        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">Easy</span>
        <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">Medium</span>
        <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium">Hard</span>
      </div>

      <InfiniteLoopProblem />
      <StaleClosureDemo />
      <LocalStorageProblem />
      <UndoRedoProblem />
      <DragAndDropProblem />
    </div>
  );
}
