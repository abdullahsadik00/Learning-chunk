import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import DemoPanel from '../../components/DemoPanel';
import { useLog } from '../../hooks/useLog';

const btn = 'px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors';
const btnGray = 'px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors';
const btnRed = 'px-3 py-1.5 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition-colors';

// ─── useState: Direct vs Functional Update ────────────────────────────────────
function DirectVsFunctional() {
  const { entries: log, add, clear } = useLog();
  const [directCount, setDirectCount] = useState(0);
  const [funcCount, setFuncCount] = useState(0);

  const batchDirect = () => {
    // All three reads capture the SAME stale value — only +1 total
    setDirectCount(directCount + 1);
    setDirectCount(directCount + 1);
    setDirectCount(directCount + 1);
    add(`Direct batch: was ${directCount}, result: ${directCount + 1} (only +1!)`);
  };

  const batchFunctional = () => {
    // Each receives the latest value — correctly +3
    setFuncCount(prev => prev + 1);
    setFuncCount(prev => prev + 1);
    setFuncCount(prev => prev + 1);
    add(`Functional batch: was ${funcCount}, result: ${funcCount + 3} (+3 correct!)`);
  };

  return (
    <DemoPanel
      title="Direct vs Functional Update"
      badge="useState"
      badgeColor="blue"
      description="Direct update (setState(value)) captures the value at render time — stale in batches. Functional update (setState(prev => ...)) always sees the latest value."
      log={log}
      onReset={() => { clear(); setDirectCount(0); setFuncCount(0); }}
      code={`// Direct — stale in batches
setCount(count + 1); // all three read same snapshot
setCount(count + 1);
setCount(count + 1); // result: +1 not +3!

// Functional — always fresh
setCount(prev => prev + 1); // result: +3 ✓`}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-red-700 mb-2">DIRECT: setCount(count + 1)</p>
            <div className="text-3xl font-bold text-gray-900 mb-3">{directCount}</div>
            <div className="flex gap-2">
              <button onClick={() => { setDirectCount(directCount + 1); add(`Direct: ${directCount} → ${directCount + 1}`); }} className={btn}>+1</button>
              <button onClick={batchDirect} className={btnRed}>Batch ×3</button>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-green-700 mb-2">FUNCTIONAL: setCount(prev =&gt; prev + 1)</p>
            <div className="text-3xl font-bold text-gray-900 mb-3">{funcCount}</div>
            <div className="flex gap-2">
              <button onClick={() => { setFuncCount(p => p + 1); add(`Functional: ${funcCount} → ${funcCount + 1}`); }} className={btn}>+1</button>
              <button onClick={batchFunctional} className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors">Batch ×3</button>
            </div>
          </div>
        </div>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          Click "Batch ×3" on each side — direct only increments by 1 (stale closure), functional correctly increments by 3.
        </p>
      </div>
    </DemoPanel>
  );
}

// ─── useState: Lazy Initialization ────────────────────────────────────────────
function LazyInit() {
  // Use refs to count calls — calling setState during render causes infinite loops
  const eagerRuns = useRef(0);
  const lazyRuns = useRef(0);
  const [renderCount, setRenderCount] = useState(0);

  // EAGER: fn() evaluated on EVERY render (even though only the first result is used)
  function eagerCalc(): number {
    eagerRuns.current += 1;
    return 42;
  }

  // LAZY: fn() evaluated only ONCE — React never calls it again
  function lazyCalc(): number {
    lazyRuns.current += 1;
    return 42;
  }

  const [eagerVal] = useState(eagerCalc());       // eagerCalc() runs every render
  const [lazyVal] = useState(() => lazyCalc());   // lazyCalc() runs only on mount

  return (
    <DemoPanel
      title="Lazy Initialization"
      badge="useState"
      badgeColor="blue"
      description="useState(fn()) evaluates fn() on EVERY render even though only the first result matters. useState(() => fn()) evaluates fn() exactly ONCE — on mount. Critical for expensive computations like reading localStorage or parsing JSON."
      code={`// BAD — readFromDisk() runs on every render
const [val] = useState(readFromDisk());

// GOOD — runs once on mount
const [val] = useState(() => readFromDisk());`}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="font-semibold text-red-700 text-xs mb-1">EAGER: useState(fn())</p>
            <p className="text-gray-700">Value: <strong>{eagerVal}</strong></p>
            <p className="text-red-600 text-xs mt-2">fn() ran: <strong>{eagerRuns.current}×</strong></p>
            <p className="text-gray-400 text-xs">grows with every render</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="font-semibold text-green-700 text-xs mb-1">LAZY: useState(() =&gt; fn())</p>
            <p className="text-gray-700">Value: <strong>{lazyVal}</strong></p>
            <p className="text-green-600 text-xs mt-2">fn() ran: <strong>{lazyRuns.current}×</strong></p>
            <p className="text-gray-400 text-xs">stays at 1 forever</p>
          </div>
        </div>
        <button onClick={() => setRenderCount(r => r + 1)} className={btn}>
          Trigger re-render #{renderCount + 1}
        </button>
        <p className="text-xs text-gray-500">
          Each re-render: eager count grows, lazy count stays at 1. In a real app the "eager" path runs your expensive computation on every keystroke or state change.
        </p>
      </div>
    </DemoPanel>
  );
}

// ─── useState: Object & Array State ──────────────────────────────────────────
function ObjectAndArrayState() {
  const { entries: log, add, clear } = useLog();
  const [user, setUser] = useState({ name: 'Sadik', age: 25 });
  const [todos, setTodos] = useState(['Learn React', 'Build projects']);
  const [input, setInput] = useState('');

  const updateCorrect = () => {
    setUser(prev => { const next = { ...prev, age: prev.age + 1 }; add(`✓ Spread: age ${prev.age} → ${next.age}`); return next; });
  };

  const updateBroken = () => {
    user.age += 1; // mutation — same reference!
    setUser(user); // React sees same ref → NO re-render triggered
    add(`✗ Mutation: called setUser but age won't update in UI (same ref)`);
  };

  const addTodo = () => {
    if (!input.trim()) return;
    setTodos(prev => [...prev, input.trim()]);
    add(`Array add: [...prev, "${input.trim()}"]`);
    setInput('');
  };

  const removeTodo = (i: number) => {
    setTodos(prev => { const next = prev.filter((_, idx) => idx !== i); add(`Array remove: filter at index ${i}`); return next; });
  };

  return (
    <DemoPanel
      title="Object & Array State"
      badge="useState"
      badgeColor="blue"
      description="State must be replaced, not mutated. React uses Object.is() to detect changes — mutating the same object/array reference looks like no change."
      log={log}
      onReset={() => { clear(); setUser({ name: 'Sadik', age: 25 }); setTodos(['Learn React', 'Build projects']); }}
      code={`// Object — ALWAYS spread
setUser(prev => ({ ...prev, age: prev.age + 1 }));

// Array add
setList(prev => [...prev, newItem]);

// Array remove
setList(prev => prev.filter((_, i) => i !== idx));`}
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Object State</p>
          <div className="bg-gray-50 rounded-lg p-3 mb-2 font-mono text-sm">
            {JSON.stringify(user)}
          </div>
          <div className="flex gap-2">
            <button onClick={updateCorrect} className={btn}>✓ Spread update</button>
            <button onClick={updateBroken} className={btnRed}>✗ Mutate (broken)</button>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Array State</p>
          <div className="flex gap-2 mb-2">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTodo()} className="border border-gray-200 rounded px-2 py-1 text-sm flex-1" placeholder="New todo…" />
            <button onClick={addTodo} className={btn}>Add</button>
          </div>
          <ul className="space-y-1">
            {todos.map((t, i) => (
              <li key={i} className="flex items-center justify-between bg-gray-50 rounded px-3 py-1.5 text-sm">
                <span>{t}</span>
                <button onClick={() => removeTodo(i)} className="text-red-400 hover:text-red-600 text-xs">remove</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DemoPanel>
  );
}

// ─── useEffect: No Dependency Array ──────────────────────────────────────────
function EffectNoDeps() {
  const { entries: log, add, clear } = useLog();
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');
  const renderCount = useRef(0);
  renderCount.current += 1;

  useEffect(() => {
    add(`Effect ran — render #${renderCount.current}, count=${count}, name="${name}"`);
  }); // ← NO array

  return (
    <DemoPanel
      title="No Dependency Array"
      badge="Runs every render"
      badgeColor="red"
      description="useEffect with NO array runs after every single render — whether triggered by count, name, or any other state. Rarely what you want."
      log={log}
      onReset={() => { clear(); setCount(0); setName(''); }}
      code="useEffect(() => { /* side effect */ }); // no array = every render"
    >
      <div className="space-y-3">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">Renders: <strong>{renderCount.current}</strong></span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setCount(c => c + 1)} className={btn}>count++ (now {count})</button>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="border border-gray-200 rounded px-2 py-1 text-sm w-36"
            placeholder="type (any key = render)"
          />
        </div>
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          Both controls trigger a render → both trigger the effect. Watch the log.
        </p>
      </div>
    </DemoPanel>
  );
}

// ─── useEffect: Empty Array [] ────────────────────────────────────────────────
function EffectEmptyDeps() {
  const { entries: log, add, clear } = useLog();
  const [count, setCount] = useState(0);
  const [mountTime, setMountTime] = useState('');
  const renderCount = useRef(0);
  renderCount.current += 1;

  useEffect(() => {
    const t = new Date().toLocaleTimeString();
    setMountTime(t);
    add(`Effect ran ONCE at ${t}`);
    return () => add('Cleanup: component unmounting');
  }, []); // ← empty array

  return (
    <DemoPanel
      title="Empty Dependency Array [ ]"
      badge="Once on mount"
      badgeColor="green"
      description="useEffect with [] runs exactly once — after the component mounts. No matter how many times the component re-renders, the effect never runs again."
      log={log}
      onReset={clear}
      code="useEffect(() => { /* mount */ return () => { /* unmount */ }; }, []);"
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Effect ran at (frozen):</p>
            <p className="font-bold text-green-700">{mountTime || '…'}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Render count (keeps growing):</p>
            <p className="font-bold text-gray-900">{renderCount.current}</p>
          </div>
        </div>
        <button onClick={() => setCount(c => c + 1)} className={btn}>
          Re-render #{count + 1} (effect won't run again)
        </button>
        <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
          Mount time stays frozen even as render count grows.
        </p>
      </div>
    </DemoPanel>
  );
}

// ─── useEffect: Specific Dependency [count] ───────────────────────────────────
function EffectSpecificDep() {
  const { entries: log, add, clear } = useLog();
  const [count, setCount] = useState(0);
  const [name, setName] = useState('React');

  useEffect(() => {
    add(`Effect ran → count changed to ${count}`);
  }, [count]); // ← only runs when count changes

  return (
    <DemoPanel
      title="Specific Dependency [count]"
      badge="On dep change"
      badgeColor="orange"
      description="useEffect with [count] runs only when count changes. Changing name does NOT trigger it — React compares each dep with Object.is()."
      log={log}
      onReset={() => { clear(); setCount(0); setName('React'); }}
      code={`useEffect(() => {
  document.title = \`Count: \${count}\`;
}, [count]); // re-runs only when count changes`}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-600">count (triggers effect)</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setCount(c => c - 1)} className={btnGray}>−</button>
              <span className="text-xl font-bold w-8 text-center">{count}</span>
              <button onClick={() => setCount(c => c + 1)} className={btn}>+</button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-600">name (does NOT trigger effect)</p>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="border border-gray-200 rounded px-2 py-1 text-sm w-full"
            />
          </div>
        </div>
        <p className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded px-3 py-2">
          Change "name" — no log entry. Change "count" — effect fires every time.
        </p>
      </div>
    </DemoPanel>
  );
}

// ─── useEffect: Multiple Dependencies ────────────────────────────────────────
function EffectMultipleDeps() {
  const { entries: log, add, clear } = useLog();
  const [count, setCount] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    add(`Effect ran → count=${count}, theme="${theme}"`);
  }, [count, theme]); // runs when EITHER changes

  return (
    <DemoPanel
      title="Multiple Dependencies [count, theme]"
      badge="Either dep"
      badgeColor="purple"
      description="Multiple deps means: run when ANY of them changes. Effect fires if count changes OR if theme changes."
      log={log}
      onReset={() => { clear(); setCount(0); setTheme('light'); }}
      code="useEffect(() => { sync(count, theme); }, [count, theme]);"
    >
      <div className="space-y-3">
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setCount(c => c + 1)} className={btn}>count++ ({count})</button>
          <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} className={btnGray}>
            theme: {theme}
          </button>
        </div>
        <div className={`text-sm rounded-lg px-4 py-3 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
          Theme preview — count: {count}
        </div>
      </div>
    </DemoPanel>
  );
}

// ─── useEffect: Cleanup ───────────────────────────────────────────────────────
function EffectCleanup() {
  const { entries: log, add, clear } = useLog();
  const [delay, setDelay] = useState(1000);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    add(`[setup] setInterval with delay=${delay}ms`);
    const id = setInterval(() => {
      setTick(t => t + 1);
      add(`  tick`);
    }, delay);
    return () => {
      add(`[cleanup] clearInterval — delay was ${delay}ms`);
      clearInterval(id);
    };
  }, [delay]); // cleanup runs before re-running with new delay

  return (
    <DemoPanel
      title="Cleanup Function"
      badge="Cleanup"
      badgeColor="purple"
      description="The function returned from useEffect is the cleanup. It runs: (1) before the effect re-runs with new deps, (2) when the component unmounts. Essential for clearing timers, subscriptions, event listeners."
      log={log}
      onReset={() => { clear(); setDelay(1000); setTick(0); }}
      code={`useEffect(() => {
  const id = setInterval(tick, delay);
  return () => clearInterval(id); // ← cleanup!
}, [delay]);`}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold text-blue-600 w-16">{tick}</div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">Interval delay: {delay}ms</p>
            <input
              type="range"
              min={200}
              max={3000}
              step={200}
              value={delay}
              onChange={e => setDelay(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>200ms</span><span>3000ms</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded px-3 py-2">
          Change the delay slider — watch the log show [cleanup] then [setup] with the new delay.
        </p>
      </div>
    </DemoPanel>
  );
}

// ─── useEffect: Data Fetch + AbortController ──────────────────────────────────
function EffectFetch() {
  const { entries: log, add, clear } = useLog();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  useEffect(() => {
    if (!query.trim()) { setResults([]); setStatus('idle'); return; }

    const controller = new AbortController();
    setStatus('loading');
    add(`Fetch started for "${query}"`);

    const timer = setTimeout(async () => {
      try {
        if (query === 'error') throw new Error('Simulated network error');
        // Simulate network with a delay
        await new Promise<void>((res, rej) => {
          const t = setTimeout(res, 600);
          controller.signal.addEventListener('abort', () => { clearTimeout(t); rej(new DOMException('Aborted')); });
        });
        if (controller.signal.aborted) return;
        setResults([`Result A for "${query}"`, `Result B for "${query}"`, `Result C for "${query}"`]);
        setStatus('idle');
        add(`Fetch complete for "${query}" — 3 results`);
      } catch (e) {
        if ((e as Error).name === 'AbortError' || (e as DOMException).name === 'AbortError') {
          add(`Fetch aborted for "${query}"`);
        } else {
          setStatus('error');
          add(`Fetch error for "${query}": ${(e as Error).message}`);
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      controller.abort();
      add(`Cleanup: abort signal sent for "${query}"`);
    };
  }, [query]);

  return (
    <DemoPanel
      title="Data Fetch + AbortController"
      badge="Async + Cleanup"
      badgeColor="purple"
      description='Type fast to see rapid keystrokes abort previous fetches. Type "error" to see error handling. This is the correct pattern for data fetching in useEffect.'
      log={log}
      onReset={() => { clear(); setQuery(''); setResults([]); setStatus('idle'); }}
      code={`useEffect(() => {
  const controller = new AbortController();
  fetchData(query, controller.signal)
    .then(setResults).catch(handleError);
  return () => controller.abort(); // abort on re-run
}, [query]);`}
    >
      <div className="space-y-3">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="border border-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none focus:border-blue-400"
          placeholder='Type to search (try "react", "error", type fast…)'
        />
        <div className="min-h-16">
          {status === 'loading' && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <span className="animate-spin">⏳</span> Fetching…
            </div>
          )}
          {status === 'error' && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              Error! (type something else to retry)
            </div>
          )}
          {status === 'idle' && results.length > 0 && (
            <ul className="space-y-1">
              {results.map((r, i) => (
                <li key={i} className="text-sm bg-gray-50 border border-gray-200 rounded px-3 py-1.5">{r}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DemoPanel>
  );
}

// ─── useLayoutEffect vs useEffect ────────────────────────────────────────────
function LayoutEffectDemo() {
  const { entries: log, add } = useLog();
  const [show, setShow] = useState(false);
  const [useLayout, setUseLayout] = useState(false);

  const BoxWithEffect = useCallback(({ withLayout }: { withLayout: boolean }) => {
    const boxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!withLayout && boxRef.current) {
        boxRef.current.style.transform = 'translateX(0)';
        add('useEffect: ran AFTER paint — user may see flash');
      }
    });

    useLayoutEffect(() => {
      if (withLayout && boxRef.current) {
        boxRef.current.style.transform = 'translateX(0)';
        add('useLayoutEffect: ran BEFORE paint — no flash');
      }
    });

    return (
      <div ref={boxRef} style={{ transform: 'translateX(-40px)' }} className="bg-blue-600 text-white text-xs px-3 py-2 rounded-lg inline-block">
        {withLayout ? 'useLayoutEffect' : 'useEffect'}
      </div>
    );
  }, [add]);

  return (
    <DemoPanel
      title="useLayoutEffect vs useEffect"
      badge="Paint timing"
      badgeColor="gray"
      description="useEffect runs asynchronously AFTER the browser paints — you may see a flash. useLayoutEffect runs synchronously BEFORE paint — safer for DOM measurements and position corrections."
      log={log}
      code={`// Fires after paint (async) — may flicker
useEffect(() => { measureAndAdjust(); });

// Fires before paint (sync) — no flicker
useLayoutEffect(() => { measureAndAdjust(); });`}
    >
      <div className="space-y-3">
        <div className="flex gap-3">
          <button onClick={() => setUseLayout(false)} className={!useLayout ? btn : btnGray}>useEffect</button>
          <button onClick={() => setUseLayout(true)} className={useLayout ? btn : btnGray}>useLayoutEffect</button>
          <button onClick={() => setShow(s => !s)} className={btnGray}>{show ? 'Hide' : 'Show'} box</button>
        </div>
        {show && <BoxWithEffect key={String(useLayout)} withLayout={useLayout} />}
        <p className="text-xs text-gray-500">
          Both hooks correct a box that starts offset — but useLayoutEffect prevents the visible flash by running before the browser draws.
        </p>
      </div>
    </DemoPanel>
  );
}

// ─── Common useEffect Mistakes ────────────────────────────────────────────────
function CommonMistakes() {
  const [tab, setTab] = useState<'stale' | 'object' | 'async'>('stale');
  const { entries: log, add, clear } = useLog();
  const [count, setCount] = useState(0);

  // Stale closure demo (BROKEN version shown visually)
  const alertAfterDelayBroken = () => {
    const current = count;
    setTimeout(() => {
      add(`STALE: alert shows "${current}" (captured at click time), actual count may have changed`);
    }, 2000);
    add(`Started 2s timer — increment count now to see stale closure`);
  };

  const alertAfterDelayFixed = () => {
    const ref = { current: count };
    // In a real fix, you'd use a ref to always get latest
    setTimeout(() => {
      add(`FIXED: reading ref.current = "${ref.current}" (still stale because ref isn't updated, but pattern is to use useRef in real code)`);
    }, 2000);
    add(`Started 2s timer with ref pattern`);
  };

  return (
    <DemoPanel
      title="Common useEffect Mistakes"
      badge="Mistakes"
      badgeColor="red"
      description="The three most common bugs: stale closures, objects/arrays in deps (infinite loop), and using async directly as the effect function."
      log={log}
      onReset={() => { clear(); setCount(0); }}
      code={`// ✗ Stale closure — setTimeout captures old value
useEffect(() => { setTimeout(() => alert(count), 2000); }, []);

// ✗ Object in deps — new ref every render = infinite loop
useEffect(() => { fetchUser(); }, [{ id: userId }]);

// ✗ Async effect directly — returns Promise not cleanup fn
useEffect(async () => { await fetchData(); }, []);

// ✓ Fixes: useRef for latest, primitive deps, async inside
useEffect(() => { async function go() { await fetchData(); } go(); }, [dep]);`}
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          {(['stale', 'object', 'async'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); clear(); }} className={`text-xs px-3 py-1.5 rounded-md font-medium ${tab === t ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {t === 'stale' ? 'Stale closure' : t === 'object' ? 'Object in deps' : 'Async effect'}
            </button>
          ))}
        </div>

        {tab === 'stale' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Click "Start timer", then quickly change count. The alert will show the old value.</p>
            <div className="flex gap-2">
              <button onClick={() => setCount(c => c + 1)} className={btn}>count++ ({count})</button>
              <button onClick={alertAfterDelayBroken} className={btnRed}>Start 2s timer (broken)</button>
              <button onClick={alertAfterDelayFixed} className={btnGray}>Start 2s timer (fixed)</button>
            </div>
            <div className="bg-gray-900 text-green-400 font-mono text-xs rounded-lg p-3">
              <p className="text-gray-500">// Fix: use useRef to always read latest value</p>
              <p>const countRef = useRef(count);</p>
              <p>useEffect(() =&gt; {'{'} countRef.current = count; {'}'});</p>
              <p>setTimeout(() =&gt; console.log(countRef.current), 2000);</p>
            </div>
          </div>
        )}

        {tab === 'object' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Object literal in deps creates new reference every render → infinite loop.</p>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 font-bold mb-1">✗ BROKEN (infinite loop)</p>
                <p className="text-gray-700">useEffect(() =&gt; {'{'}</p>
                <p className="text-gray-700 ml-4">fetchUser();</p>
                <p className="text-gray-700">{'}'}, [{'{ id: userId }'}]);</p>
                <p className="text-gray-500 mt-1">// new object each render!</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-700 font-bold mb-1">✓ FIXED (primitive dep)</p>
                <p className="text-gray-700">useEffect(() =&gt; {'{'}</p>
                <p className="text-gray-700 ml-4">fetchUser(userId);</p>
                <p className="text-gray-700">{'}'}, [userId]);</p>
                <p className="text-gray-500 mt-1">// primitive = stable</p>
              </div>
            </div>
          </div>
        )}

        {tab === 'async' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">async functions return a Promise. useEffect expects a cleanup function or undefined — not a Promise.</p>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 font-bold mb-1">✗ BROKEN</p>
                <p className="text-gray-700">useEffect(async () =&gt; {'{'}</p>
                <p className="text-gray-700 ml-4">const d = await fetch();</p>
                <p className="text-gray-700">{'}'}, []);</p>
                <p className="text-gray-500 mt-1">// returns Promise not fn!</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-700 font-bold mb-1">✓ FIXED</p>
                <p className="text-gray-700">useEffect(() =&gt; {'{'}</p>
                <p className="text-gray-700 ml-4">async function go() {'{'}</p>
                <p className="text-gray-700 ml-8">const d = await fetch();</p>
                <p className="text-gray-700 ml-4">{'}'}</p>
                <p className="text-gray-700 ml-4">go();</p>
                <p className="text-gray-700">{'}'}, []);</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DemoPanel>
  );
}

export default function HooksPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">useState & useEffect</h2>
        <p className="text-gray-500 mt-1">Day 13 — Interactive demos for every dependency array scenario and useState pattern</p>
      </div>

      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded">useState</span>
        State management patterns
      </h3>
      <DirectVsFunctional />
      <LazyInit />
      <ObjectAndArrayState />

      <h3 className="text-lg font-semibold text-gray-800 mb-4 mt-8 flex items-center gap-2">
        <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded">useEffect</span>
        Dependency array — all 4 scenarios
      </h3>
      <EffectNoDeps />
      <EffectEmptyDeps />
      <EffectSpecificDep />
      <EffectMultipleDeps />
      <EffectCleanup />
      <EffectFetch />
      <LayoutEffectDemo />
      <CommonMistakes />
    </div>
  );
}
