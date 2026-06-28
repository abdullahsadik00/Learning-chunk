import { useState, useEffect, useRef, useMemo, useCallback, memo, forwardRef, useImperativeHandle } from 'react';
import DemoPanel from '../../components/DemoPanel';
import { useLog } from '../../hooks/useLog';

const btn = 'px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors';
const btnGray = 'px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors';

// ─── useRef: DOM Access ───────────────────────────────────────────────────────
function RefDOMAccess() {
  const inputRef = useRef<HTMLInputElement>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (divRef.current) setHeight(divRef.current.offsetHeight);
  }, []);

  return (
    <DemoPanel
      title="useRef — DOM Access"
      badge="useRef"
      badgeColor="blue"
      description="useRef gives you a direct handle to a DOM node. Changing .current never causes a re-render — it's a mutable box. Common uses: focus, measure, scroll."
      code={`const inputRef = useRef<HTMLInputElement>(null);
// Attach: <input ref={inputRef} />
// Use: inputRef.current?.focus()`}
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <input ref={inputRef} className="border border-gray-200 rounded px-3 py-1.5 text-sm flex-1" placeholder="I'm controlled via ref" />
          <button onClick={() => inputRef.current?.focus()} className={btn}>Focus</button>
          <button onClick={() => { if (inputRef.current) inputRef.current.value = ''; }} className={btnGray}>Clear</button>
          <button onClick={() => inputRef.current?.select()} className={btnGray}>Select all</button>
        </div>
        <div ref={divRef} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">This div's height measured via ref: <strong>{height}px</strong></p>
          <p className="text-xs text-gray-400 mt-1">Reading offsetHeight, getBoundingClientRect(), scrollHeight, etc.</p>
        </div>
      </div>
    </DemoPanel>
  );
}

// ─── useRef: Mutable Value (no re-render) ─────────────────────────────────────
function RefMutableValue() {
  const { entries: log, add, clear } = useLog();
  const [display, setDisplay] = useState('0.0s');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const [running, setRunning] = useState(false);

  const start = () => {
    if (running) return;
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = ((Date.now() - (startTimeRef.current ?? Date.now())) / 1000).toFixed(1);
      setDisplay(`${elapsed}s`);
    }, 100);
    setRunning(true);
    add('Stopwatch started — interval ID stored in ref (no re-render for ID storage)');
  };

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
    add(`Stopped at ${display}`);
  };

  const reset = () => {
    stop();
    setDisplay('0.0s');
    clear();
  };

  return (
    <DemoPanel
      title="useRef — Mutable Value (no re-render)"
      badge="useRef"
      badgeColor="blue"
      description="Storing the interval ID in useState would cause an unnecessary re-render. useRef.current is a mutable box — you can write to it without triggering a render."
      log={log}
      onReset={reset}
      code={`// State change → re-render. Ref change → no re-render.
const intervalRef = useRef(null);
intervalRef.current = setInterval(fn, 100); // no re-render!`}
    >
      <div className="space-y-3">
        <div className="text-5xl font-bold font-mono text-blue-600">{display}</div>
        <div className="flex gap-2">
          <button onClick={start} disabled={running} className={`${btn} disabled:opacity-50`}>Start</button>
          <button onClick={stop} disabled={!running} className={`${btnGray} disabled:opacity-50`}>Stop</button>
          <button onClick={reset} className={btnGray}>Reset</button>
        </div>
      </div>
    </DemoPanel>
  );
}

// ─── useRef: usePrevious pattern ──────────────────────────────────────────────
function PreviousValue() {
  const [count, setCount] = useState(0);
  const prevRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    prevRef.current = count;
  }); // runs after every render — stores current as previous for NEXT render

  return (
    <DemoPanel
      title="usePrevious Pattern"
      badge="useRef"
      badgeColor="blue"
      description="Storing the previous value via a ref: the effect runs after every render and saves current. On the next render, the ref still holds the previous value."
      code={`function usePrevious<T>(value: T) {
  const ref = useRef<T>();
  useEffect(() => { ref.current = value; }); // after every render
  return ref.current; // previous render's value
}`}
    >
      <div className="space-y-3">
        <div className="flex gap-6 items-end">
          <div>
            <p className="text-xs text-gray-500 mb-1">Previous</p>
            <div className="text-3xl font-bold text-gray-400">{prevRef.current ?? '—'}</div>
          </div>
          <div className="text-gray-300 text-2xl">→</div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Current</p>
            <div className="text-3xl font-bold text-blue-600">{count}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCount(c => c - 1)} className={btnGray}>−</button>
          <button onClick={() => setCount(c => c + 1)} className={btn}>+</button>
          <button onClick={() => setCount(Math.floor(Math.random() * 100))} className={btnGray}>Random</button>
        </div>
      </div>
    </DemoPanel>
  );
}

// ─── forwardRef + useImperativeHandle ────────────────────────────────────────
interface VideoHandle { play: () => void; pause: () => void; seek: (s: number) => void; }

const FakeVideo = forwardRef<VideoHandle, { title: string }>(({ title }, ref) => {
  const [state, setState] = useState<'paused' | 'playing'>('paused');
  const [time, setTime] = useState(0);

  useImperativeHandle(ref, () => ({
    play: () => setState('playing'),
    pause: () => setState('paused'),
    seek: (s: number) => setTime(s),
  }));

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <p className="text-xs text-gray-500 mb-1">Child component (FakeVideo)</p>
      <p className="font-medium text-sm">{title}</p>
      <p className="text-sm mt-1">
        Status: <strong className={state === 'playing' ? 'text-green-600' : 'text-gray-500'}>{state}</strong>
        {' · '} Time: <strong>{time}s</strong>
      </p>
    </div>
  );
});
FakeVideo.displayName = 'FakeVideo';

function ForwardRefDemo() {
  const videoRef = useRef<VideoHandle>(null);

  return (
    <DemoPanel
      title="forwardRef + useImperativeHandle"
      badge="forwardRef"
      badgeColor="purple"
      description="forwardRef passes a ref from parent to child. useImperativeHandle exposes a custom API (not the raw DOM) — parent can call .play(), .pause(), .seek() as methods."
      code={`const Video = forwardRef<VideoHandle, Props>((props, ref) => {
  useImperativeHandle(ref, () => ({
    play: () => setState('playing'),
    seek: (s) => setTime(s),
  }));
  // ...
});
// Parent:
const videoRef = useRef<VideoHandle>(null);
videoRef.current?.play();`}
    >
      <div className="space-y-3">
        <FakeVideo ref={videoRef} title="Introduction to React Hooks.mp4" />
        <p className="text-xs text-gray-500">Controls are in the parent — they call methods on the child via ref:</p>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => videoRef.current?.play()} className={btn}>▶ Play</button>
          <button onClick={() => videoRef.current?.pause()} className={btnGray}>⏸ Pause</button>
          {[0, 30, 60, 90].map(s => (
            <button key={s} onClick={() => videoRef.current?.seek(s)} className={btnGray}>Seek {s}s</button>
          ))}
        </div>
      </div>
    </DemoPanel>
  );
}

// ─── useMemo ──────────────────────────────────────────────────────────────────
function UseMemoDemo() {
  const { entries: log, add, clear } = useLog();
  const [query, setQuery] = useState('');
  const [unrelated, setUnrelated] = useState(0);
  const [memoEnabled, setMemoEnabled] = useState(true);

  const items = useMemo(() => Array.from({ length: 5000 }, (_, i) => `item-${i}`), []);

  const filteredWithMemo = useMemo(() => {
    const start = performance.now();
    const result = items.filter(i => i.includes(query));
    const ms = (performance.now() - start).toFixed(2);
    add(`useMemo filtered ${result.length} items in ${ms}ms (memoized — only ran because query changed)`);
    return result;
  }, [query, items]);

  const filteredNoMemo = (() => {
    if (!memoEnabled) {
      const start = performance.now();
      const result = items.filter(i => i.includes(query));
      const ms = (performance.now() - start).toFixed(2);
      add(`No memo: filtered ${result.length} items in ${ms}ms (ran on EVERY render including unrelated)`);
      return result;
    }
    return filteredWithMemo;
  })();

  const displayed = memoEnabled ? filteredWithMemo : filteredNoMemo;

  return (
    <DemoPanel
      title="useMemo — Expensive Computation"
      badge="useMemo"
      badgeColor="orange"
      description="useMemo caches the result of a computation — only recalculates when dependencies change. Without it, filtering 5000 items runs on every render (even unrelated ones)."
      log={log}
      onReset={() => { clear(); setQuery(''); setUnrelated(0); }}
      code={`// Recalculates only when query changes
const filtered = useMemo(
  () => items.filter(i => i.includes(query)),
  [query, items]
);`}
    >
      <div className="space-y-3">
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setMemoEnabled(m => !m)} className={`px-3 py-1.5 rounded-md text-sm font-medium ${memoEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            useMemo: {memoEnabled ? 'ON' : 'OFF'}
          </button>
          <button onClick={() => { setUnrelated(u => u + 1); add(`Unrelated render #${unrelated + 1} triggered`); }} className={btnGray}>
            Unrelated re-render #{unrelated}
          </button>
        </div>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="border border-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none focus:border-blue-400"
          placeholder="Filter 5000 items…"
        />
        <p className="text-sm text-gray-600">
          Showing <strong>{displayed.length}</strong> / 5000 items
        </p>
        <p className="text-xs text-gray-500">
          With memo ON: "Unrelated re-render" doesn't rerun the filter. With memo OFF: it runs on every render.
        </p>
      </div>
    </DemoPanel>
  );
}

// ─── useCallback ──────────────────────────────────────────────────────────────
let childRenderCount = 0;
const ExpensiveChild = memo(({ onAction, label }: { onAction: () => void; label: string }) => {
  childRenderCount++;
  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
      <p className="text-xs text-gray-500">ExpensiveChild (memo'd) — rendered {childRenderCount}×</p>
      <button onClick={onAction} className={`mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200`}>
        {label}
      </button>
    </div>
  );
});
ExpensiveChild.displayName = 'ExpensiveChild';

function UseCallbackDemo() {
  const { entries: log, add, clear } = useLog();
  const [count, setCount] = useState(0);
  const [useCallbackEnabled, setUseCallbackEnabled] = useState(true);

  const stableAction = useCallback(() => {
    add('Action called (stable ref — useCallback)');
  }, []); // stable reference

  const unstableAction = () => {
    add('Action called (new function ref every render)');
  };

  childRenderCount = 0; // reset display count on each render of parent

  return (
    <DemoPanel
      title="useCallback — Stable Function Reference"
      badge="useCallback"
      badgeColor="orange"
      description="Without useCallback, every render creates a new function reference. memo'd children receive a 'new' prop and re-render unnecessarily. useCallback returns the same function instance."
      log={log}
      onReset={() => { clear(); setCount(0); }}
      code={`// New function every render → memo child re-renders
const fn = () => doSomething();

// Stable function → memo child skips re-render
const fn = useCallback(() => doSomething(), [dep]);`}
    >
      <div className="space-y-3">
        <div className="flex gap-2">
          <button onClick={() => setUseCallbackEnabled(e => !e)} className={`px-3 py-1.5 rounded-md text-sm font-medium ${useCallbackEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            useCallback: {useCallbackEnabled ? 'ON' : 'OFF'}
          </button>
          <button onClick={() => { setCount(c => c + 1); add(`Parent re-rendered (count=${count + 1})`); }} className={btn}>
            Re-render parent ({count})
          </button>
        </div>
        <ExpensiveChild
          onAction={useCallbackEnabled ? stableAction : unstableAction}
          label={useCallbackEnabled ? 'useCallback (stable)' : 'No callback (unstable)'}
        />
        <p className="text-xs text-gray-500">
          Click "Re-render parent" repeatedly. With useCallback ON: child render count stays low. With OFF: it increments every time.
        </p>
      </div>
    </DemoPanel>
  );
}

export default function PerfHooksPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">useRef · useMemo · useCallback</h2>
        <p className="text-gray-500 mt-1">Day 14a — DOM refs, mutable values, expensive computations, stable callbacks</p>
      </div>

      <h3 className="text-lg font-semibold text-gray-800 mb-4">useRef</h3>
      <RefDOMAccess />
      <RefMutableValue />
      <PreviousValue />
      <ForwardRefDemo />

      <h3 className="text-lg font-semibold text-gray-800 mb-4 mt-8">useMemo & useCallback</h3>
      <UseMemoDemo />
      <UseCallbackDemo />
    </div>
  );
}
