import { useState, useReducer, useContext, createContext, useCallback, useRef, useEffect } from 'react';
import DemoPanel from '../../components/DemoPanel';
import { useLog } from '../../hooks/useLog';

const btn = 'px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors';
const btnGray = 'px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors';

// ─── Prop Drilling vs Context ─────────────────────────────────────────────────
const UserCtx = createContext<{ name: string; theme: 'light' | 'dark' } | null>(null);

function Level3({ name, theme }: { name: string; theme: 'light' | 'dark' }) {
  return (
    <div className={`text-xs rounded px-2 py-1 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-blue-50 text-blue-700'}`}>
      L3: name="{name}", theme="{theme}"
    </div>
  );
}
function Level2({ name, theme }: { name: string; theme: 'light' | 'dark' }) {
  return <div className="border border-dashed border-gray-200 rounded p-2 text-xs text-gray-400">L2 (doesn't use props but must pass them) → <Level3 name={name} theme={theme} /></div>;
}
function Level1({ name, theme }: { name: string; theme: 'light' | 'dark' }) {
  return <div className="border border-dashed border-gray-200 rounded p-2 text-xs text-gray-400">L1 (doesn't use props but must pass them) → <Level2 name={name} theme={theme} /></div>;
}

function Level3WithCtx() {
  const ctx = useContext(UserCtx);
  return (
    <div className={`text-xs rounded px-2 py-1 ${ctx?.theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-green-50 text-green-700'}`}>
      L3 via context: name="{ctx?.name}", theme="{ctx?.theme}"
    </div>
  );
}
function Level2WithCtx() {
  return <div className="border border-dashed border-gray-200 rounded p-2 text-xs text-gray-400">L2 (no props needed!) → <Level3WithCtx /></div>;
}
function Level1WithCtx() {
  return <div className="border border-dashed border-gray-200 rounded p-2 text-xs text-gray-400">L1 (no props needed!) → <Level2WithCtx /></div>;
}

function PropDrillingDemo() {
  const [name, setName] = useState('Sadik');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mode, setMode] = useState<'drill' | 'context'>('drill');

  return (
    <DemoPanel
      title="Prop Drilling vs Context"
      badge="Context"
      badgeColor="purple"
      description="Without context, every intermediate component must accept and pass props it doesn't use. Context lets any descendant read shared values directly."
      code={`const UserCtx = createContext(null);
// Provider wraps the tree once
<UserCtx.Provider value={{ name, theme }}>
  <App />
</UserCtx.Provider>
// Any descendant reads directly
const ctx = useContext(UserCtx);`}
    >
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setMode(m => m === 'drill' ? 'context' : 'drill')} className={`px-3 py-1.5 rounded-md text-sm font-medium ${mode === 'drill' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            Mode: {mode === 'drill' ? 'Prop Drilling ✗' : 'Context ✓'}
          </button>
          <input value={name} onChange={e => setName(e.target.value)} className="border border-gray-200 rounded px-2 py-1 text-sm w-28" placeholder="name" />
          <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} className={btnGray}>theme: {theme}</button>
        </div>
        <div className="border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-2">Root (owns state)</p>
          {mode === 'drill' ? (
            <Level1 name={name} theme={theme} />
          ) : (
            <UserCtx.Provider value={{ name, theme }}>
              <Level1WithCtx />
            </UserCtx.Provider>
          )}
        </div>
      </div>
    </DemoPanel>
  );
}

// ─── useReducer ───────────────────────────────────────────────────────────────
type Todo = { id: number; text: string; done: boolean };
type Filter = 'all' | 'active' | 'done';
type TodoState = { items: Todo[]; filter: Filter; nextId: number };
type TodoAction =
  | { type: 'ADD'; text: string }
  | { type: 'TOGGLE'; id: number }
  | { type: 'REMOVE'; id: number }
  | { type: 'SET_FILTER'; filter: Filter };

function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case 'ADD':
      return { ...state, items: [...state.items, { id: state.nextId, text: action.text, done: false }], nextId: state.nextId + 1 };
    case 'TOGGLE':
      return { ...state, items: state.items.map(t => t.id === action.id ? { ...t, done: !t.done } : t) };
    case 'REMOVE':
      return { ...state, items: state.items.filter(t => t.id !== action.id) };
    case 'SET_FILTER':
      return { ...state, filter: action.filter };
  }
}

function UseReducerDemo() {
  const { entries: log, add, clear } = useLog();
  const [state, dispatch] = useReducer(todoReducer, { items: [{ id: 1, text: 'Learn useReducer', done: false }], filter: 'all', nextId: 2 });
  const [input, setInput] = useState('');

  const dispatchAndLog = useCallback((action: TodoAction) => {
    dispatch(action);
    add(`dispatch({ type: '${action.type}'${action.type === 'ADD' ? `, text: "${(action as {type:'ADD';text:string}).text}"` : ''} })`);
  }, [add]);

  const visible = state.items.filter(t =>
    state.filter === 'all' ? true : state.filter === 'done' ? t.done : !t.done
  );

  const addTodo = () => {
    if (!input.trim()) return;
    dispatchAndLog({ type: 'ADD', text: input.trim() });
    setInput('');
  };

  return (
    <DemoPanel
      title="useReducer — Complex State"
      badge="useReducer"
      badgeColor="orange"
      description="useReducer is useState for complex state. A pure reducer function handles all transitions — predictable, testable, easy to reason about."
      log={log}
      onReset={() => { clear(); }}
      code={`const [state, dispatch] = useReducer(reducer, initialState);
dispatch({ type: 'ADD', text: 'New item' });
// reducer: (state, action) => newState`}
    >
      <div className="space-y-3">
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTodo()} className="border border-gray-200 rounded px-2 py-1 text-sm flex-1" placeholder="Add todo…" />
          <button onClick={addTodo} className={btn}>Add</button>
        </div>
        <div className="flex gap-1">
          {(['all', 'active', 'done'] as const).map(f => (
            <button key={f} onClick={() => dispatchAndLog({ type: 'SET_FILTER', filter: f })} className={`text-xs px-2 py-1 rounded ${state.filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{f}</button>
          ))}
        </div>
        <ul className="space-y-1 max-h-40 overflow-y-auto">
          {visible.map(t => (
            <li key={t.id} className="flex items-center gap-2 bg-gray-50 rounded px-3 py-1.5">
              <input type="checkbox" checked={t.done} onChange={() => dispatchAndLog({ type: 'TOGGLE', id: t.id })} className="rounded" />
              <span className={`text-sm flex-1 ${t.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{t.text}</span>
              <button onClick={() => dispatchAndLog({ type: 'REMOVE', id: t.id })} className="text-red-400 hover:text-red-600 text-xs">×</button>
            </li>
          ))}
        </ul>
        <p className="text-xs text-gray-500">{state.items.length} total · {state.items.filter(t => !t.done).length} active</p>
      </div>
    </DemoPanel>
  );
}

// ─── Custom Hook: useLocalStorage ─────────────────────────────────────────────
function useLocalStorage<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initial;
    } catch { return initial; }
  });

  const set = useCallback((v: T | ((prev: T) => T)) => {
    setVal(prev => {
      const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v;
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [key]);

  return [val, set] as const;
}

function LocalStorageDemo() {
  const { entries: log, add, clear } = useLog();
  const [name, setName] = useLocalStorage('demo-name', 'Sadik');
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('demo-theme', 'light');

  return (
    <DemoPanel
      title="Custom Hook: useLocalStorage"
      badge="Custom Hook"
      badgeColor="green"
      description="Custom hooks encapsulate reusable logic. useLocalStorage reads from localStorage on init, persists on every write, and handles JSON serialization."
      log={log}
      onReset={() => { clear(); localStorage.removeItem('demo-name'); localStorage.removeItem('demo-theme'); }}
      code={`function useLocalStorage<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initial;
  });
  const set = (v: T) => { setVal(v); localStorage.setItem(key, JSON.stringify(v)); };
  return [val, set] as const;
}`}
    >
      <div className="space-y-3">
        <div className="flex gap-3 flex-wrap">
          <div>
            <p className="text-xs text-gray-500 mb-1">name (persisted)</p>
            <input value={name} onChange={e => { setName(e.target.value); add(`Saved name="${e.target.value}" to localStorage`); }} className="border border-gray-200 rounded px-2 py-1 text-sm w-36" />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">theme (persisted)</p>
            <button onClick={() => { const n = theme === 'light' ? 'dark' : 'light'; setTheme(n); add(`Saved theme="${n}" to localStorage`); }} className={btnGray}>
              {theme}
            </button>
          </div>
        </div>
        <div className={`rounded-lg px-4 py-3 text-sm ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-50 border border-gray-200'}`}>
          Hello, <strong>{name}</strong>! Theme: {theme}
        </div>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          Refresh the page — your values are still there (stored in localStorage).
        </p>
      </div>
    </DemoPanel>
  );
}

// ─── Custom Hook: useClickOutside ─────────────────────────────────────────────
function useClickOutside(ref: React.RefObject<HTMLElement | null>, callback: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) callback();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, callback]);
}

function ClickOutsideDemo() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(dropdownRef, close);

  return (
    <DemoPanel
      title="Custom Hook: useClickOutside"
      badge="Custom Hook"
      badgeColor="green"
      description="useClickOutside attaches a mousedown listener to document, checks if the click was outside the ref element, and calls the callback. Cleans up the listener on unmount."
      code={`function useClickOutside(ref, callback) {
  useEffect(() => {
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) callback();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, callback]);
}`}
    >
      <div className="space-y-3">
        <div className="relative inline-block" ref={dropdownRef}>
          <button onClick={() => setOpen(o => !o)} className={btn}>
            {open ? 'Close ▲' : 'Open dropdown ▼'}
          </button>
          {open && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-48">
              {['Profile', 'Settings', 'Help', 'Sign out'].map(item => (
                <button key={item} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">{item}</button>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500">Dropdown closes automatically when you click anywhere outside it.</p>
      </div>
    </DemoPanel>
  );
}

export default function ContextPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Context & useReducer</h2>
        <p className="text-gray-500 mt-1">Day 14b — Context for shared state, useReducer for complex transitions, custom hooks for reusable logic</p>
      </div>
      <PropDrillingDemo />
      <UseReducerDemo />
      <LocalStorageDemo />
      <ClickOutsideDemo />
    </div>
  );
}
