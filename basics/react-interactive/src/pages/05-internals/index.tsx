import { useState, useTransition, useDeferredValue, useRef, memo } from 'react';
import DemoPanel from '../../components/DemoPanel';
import { useLog } from '../../hooks/useLog';

const btn = 'px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors';
const btnGray = 'px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors';

// ─── Keys: Index vs Stable ────────────────────────────────────────────────────
function KeysReconciliation() {
  const [items, setItems] = useState(() => ['Apple', 'Banana', 'Cherry', 'Date']);
  const [useStable, setUseStable] = useState(false);

  const prepend = () => setItems(prev => [`Item${Math.floor(Math.random() * 999)}`, ...prev]);
  const shuffle = () => setItems(prev => [...prev].sort(() => Math.random() - 0.5));

  return (
    <DemoPanel
      title="Reconciliation — Index Keys vs Stable Keys"
      badge="VDOM / Keys"
      badgeColor="blue"
      description='React tracks DOM nodes by "key". Index keys (0,1,2…) break on insert/shuffle because the same key now refers to a different item. Type in inputs, then prepend/shuffle.'
      code={`// BAD — key is position, not identity
{items.map((item, i) => <input key={i} defaultValue={item} />)}

// GOOD — key travels with the data
{items.map(item => <input key={item.id} defaultValue={item.name} />)}`}
    >
      <div className="space-y-3">
        <div className="flex gap-2">
          <button onClick={prepend} className={btn}>Prepend item</button>
          <button onClick={shuffle} className={btnGray}>Shuffle</button>
          <button onClick={() => setUseStable(s => !s)} className={`px-3 py-1.5 rounded-md text-sm font-medium ${useStable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            Keys: {useStable ? '✓ Stable (value)' : '✗ Index (i)'}
          </button>
        </div>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          1. Type something in an input below &nbsp;2. Click Prepend or Shuffle &nbsp;3. See what happens to your typed value
        </p>
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={useStable ? item : i} className="flex items-center gap-3">
              <span className="font-mono text-xs text-gray-400 w-24 flex-shrink-0">key={useStable ? `"${item}"` : String(i)}</span>
              <span className="text-sm text-gray-500 w-24 flex-shrink-0">{item}</span>
              <input defaultValue="" placeholder="type here…" className="border border-gray-200 rounded px-2 py-1 text-sm w-32 focus:outline-none focus:border-blue-400" />
            </div>
          ))}
        </div>
      </div>
    </DemoPanel>
  );
}

// ─── Immutability Demo ────────────────────────────────────────────────────────
function ImmutabilityDemo() {
  const { entries: log, add, clear } = useLog();
  const [obj, setObj] = useState({ count: 0, name: 'initial' });
  const renderCount = useRef(0);
  renderCount.current++;

  const mutate = () => {
    obj.count += 1; // mutate same reference
    setObj(obj);    // React sees same ref → Object.is(prev, next) === true → skips re-render
    add(`✗ Mutated obj.count to ${obj.count} — but UI won't update! Same ref.`);
  };

  const spread = () => {
    setObj(prev => {
      const next = { ...prev, count: prev.count + 1 };
      add(`✓ Spread: new object { count: ${next.count} } — React sees new ref → re-render`);
      return next;
    });
  };

  return (
    <DemoPanel
      title="Why State Must Be Immutable"
      badge="Immutability"
      badgeColor="orange"
      description="React uses Object.is() to check if state changed. Mutating the same object means Object.is(prev, next) returns true → React skips the re-render. Always create a new object."
      log={log}
      onReset={() => { clear(); setObj({ count: 0, name: 'initial' }); }}
      code={`// BAD — mutates same reference
state.count += 1;
setState(state); // Object.is(prev, state) = true → no re-render!

// GOOD — new reference
setState(prev => ({ ...prev, count: prev.count + 1 }));`}
    >
      <div className="space-y-3">
        <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm">
          {JSON.stringify(obj)} (renders: {renderCount.current})
        </div>
        <div className="flex gap-2">
          <button onClick={mutate} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200">
            ✗ Mutate (broken)
          </button>
          <button onClick={spread} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-md text-sm font-medium hover:bg-green-200">
            ✓ Spread (correct)
          </button>
        </div>
        <p className="text-xs text-gray-500">Mutate may show count in log but UI won't update. Spread creates a new ref → render count increments.</p>
      </div>
    </DemoPanel>
  );
}

// ─── useTransition ────────────────────────────────────────────────────────────
const ITEMS = Array.from({ length: 8000 }, (_, i) => `Item ${i}: ${Math.random().toString(36).slice(2)}`);

const HeavyList = memo(({ query }: { query: string }) => {
  const filtered = query ? ITEMS.filter(item => item.toLowerCase().includes(query.toLowerCase())) : ITEMS.slice(0, 100);
  return (
    <ul className="space-y-0.5 max-h-48 overflow-y-auto">
      {filtered.slice(0, 200).map((item, i) => (
        <li key={i} className="text-xs text-gray-600 px-2 py-0.5 rounded hover:bg-gray-50">{item}</li>
      ))}
      {filtered.length > 200 && <li className="text-xs text-gray-400 px-2 py-1">…{filtered.length - 200} more</li>}
    </ul>
  );
});
HeavyList.displayName = 'HeavyList';

function TransitionDemo() {
  const [query, setQuery] = useState('');
  const [deferredQuery, setDeferredQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [useTransitionEnabled, setUseTransitionEnabled] = useState(true);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val); // urgent — input stays responsive
    if (useTransitionEnabled) {
      startTransition(() => setDeferredQuery(val)); // non-urgent — can be interrupted
    } else {
      setDeferredQuery(val); // blocks input until list re-renders
    }
  };

  return (
    <DemoPanel
      title="useTransition — Non-Urgent State Updates"
      badge="Concurrent"
      badgeColor="purple"
      description="startTransition marks a state update as non-urgent — React can interrupt it to handle urgent updates (like typing). Without it, filtering 8000 items blocks the input."
      code={`const [isPending, startTransition] = useTransition();

const onInput = (val) => {
  setQuery(val);               // urgent — never deferred
  startTransition(() => {
    setFilteredList(val);      // non-urgent — can be interrupted
  });
};`}
    >
      <div className="space-y-3">
        <div className="flex gap-2">
          <button onClick={() => setUseTransitionEnabled(e => !e)} className={`px-3 py-1.5 rounded-md text-sm font-medium ${useTransitionEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            useTransition: {useTransitionEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className="relative">
          <input
            value={query}
            onChange={handleChange}
            className="border border-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none focus:border-blue-400"
            placeholder="Filter 8000 items — notice input stays responsive…"
          />
          {isPending && <span className="absolute right-3 top-2.5 text-xs text-gray-400 animate-pulse">computing…</span>}
        </div>
        <div className={isPending ? 'opacity-50 transition-opacity' : 'transition-opacity'}>
          <p className="text-xs text-gray-500 mb-1">Results (showing ≤200):</p>
          <HeavyList query={deferredQuery} />
        </div>
        <p className="text-xs text-gray-500">Toggle OFF to feel the difference — without transition, every keystroke blocks until the list finishes rendering.</p>
      </div>
    </DemoPanel>
  );
}

// ─── useDeferredValue ─────────────────────────────────────────────────────────
function DeferredValueDemo() {
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query); // lags behind query intentionally
  const isStale = query !== deferred;

  return (
    <DemoPanel
      title="useDeferredValue — Lag a Value"
      badge="Concurrent"
      badgeColor="purple"
      description="useDeferredValue defers a prop or state value — shows stale content while React prepares the new render. Use when you receive a value you don't control (vs useTransition where you call setState)."
      code={`// You receive 'query' from props/state you don't control
const deferred = useDeferredValue(query);
const isStale = query !== deferred;

// Render stale content dimmed while new content prepares
<List query={deferred} style={{ opacity: isStale ? 0.5 : 1 }} />`}
    >
      <div className="space-y-3">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="border border-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none focus:border-blue-400"
          placeholder="Type — deferred value lags behind…"
        />
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">query (immediate)</p>
            <p className="font-mono font-bold text-blue-700">"{query}"</p>
          </div>
          <div className={`border rounded-lg p-3 transition-opacity ${isStale ? 'opacity-40 bg-gray-50 border-gray-200' : 'bg-green-50 border-green-200'}`}>
            <p className="text-xs text-gray-500 mb-1">deferred {isStale ? '(stale…)' : '(current)'}</p>
            <p className="font-mono font-bold text-gray-700">"{deferred}"</p>
          </div>
        </div>
        <div className={`transition-opacity ${isStale ? 'opacity-50' : ''}`}>
          <HeavyList query={deferred} />
        </div>
      </div>
    </DemoPanel>
  );
}

export default function InternalsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">React Internals</h2>
        <p className="text-gray-500 mt-1">Day 15a — Virtual DOM, reconciliation, keys, immutability, Fiber & concurrent features</p>
      </div>
      <KeysReconciliation />
      <ImmutabilityDemo />
      <TransitionDemo />
      <DeferredValueDemo />
    </div>
  );
}
