import { useState, useRef } from 'react';
import DemoPanel from '../../components/DemoPanel';

const btn = 'px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors';
const btnGray = 'px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors';

// ── Section 1: JSX Syntax Rules ──────────────────────────────────────────────
function SyntaxRules() {
  const [show, setShow] = useState(true);
  const [bgColor, setBgColor] = useState('#3b82f6');
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <DemoPanel
      title="JSX Syntax Rules"
      badge="Syntax"
      badgeColor="blue"
      description="JSX looks like HTML but has rules: className (not class), camelCase events (onClick/onChange), style takes an object, all tags must close."
      code={`// HTML vs JSX
// class="btn"        → className="btn"
// onclick="fn()"     → onClick={fn}
// for="field"        → htmlFor="field"
// style="color:red"  → style={{ color: 'red' }}`}
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">className + onClick event</p>
          <button onClick={() => setShow(s => !s)} className={btn}>
            Toggle (onClick)
          </button>
          {show && (
            <p className="mt-2 text-sm text-green-600 font-medium">
              ✓ Visible — rendered with <code className="bg-gray-100 px-1 rounded">className="text-green-600"</code>
            </p>
          )}
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Inline style object (not string)</p>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={bgColor}
              onChange={e => setBgColor(e.target.value)}
              className="h-8 w-16 rounded cursor-pointer"
            />
            <div style={{ backgroundColor: bgColor, color: '#fff', padding: '6px 14px', borderRadius: 6 }}>
              style={`{{ backgroundColor: '${bgColor}' }}`}
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">ref (useRef, not string ref)</p>
          <div className="flex gap-2">
            <input ref={inputRef} className="border border-gray-200 rounded px-2 py-1 text-sm flex-1" placeholder="Focus me via ref" />
            <button onClick={() => inputRef.current?.focus()} className={btnGray}>
              Focus via ref
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Expressions in JSX — any JS expression inside {"{ }"}</p>
          <div className="bg-gray-50 rounded-lg p-3 space-y-1 font-mono text-sm">
            <p>{'2 + 2 = '}<strong>{2 + 2}</strong></p>
            <p>{'Math.PI.toFixed(3) = '}<strong>{Math.PI.toFixed(3)}</strong></p>
            <p>{'[1,2,3].join("-") = '}<strong>{[1, 2, 3].join('-')}</strong></p>
          </div>
        </div>
      </div>
    </DemoPanel>
  );
}

// ── Section 2: Conditional Rendering ─────────────────────────────────────────
function ConditionalRendering() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [count, setCount] = useState(0);
  const [role, setRole] = useState<'admin' | 'user' | 'guest'>('user');

  const roleContent: Record<string, { label: string; color: string }> = {
    admin: { label: 'Admin Panel', color: 'bg-red-100 text-red-700' },
    user: { label: 'User Dashboard', color: 'bg-blue-100 text-blue-700' },
    guest: { label: 'Guest View', color: 'bg-gray-100 text-gray-600' },
  };

  return (
    <DemoPanel
      title="Conditional Rendering Patterns"
      badge="Conditional"
      badgeColor="purple"
      description="Three patterns: ternary (a ? b : c), logical AND (condition && element), and object map for switch-like rendering."
      code={`// Ternary
{loggedIn ? <Dashboard /> : <Login />}

// Logical AND (careful: 0 && element renders "0"!)
{count > 0 && <Badge count={count} />}

// Object map (like a switch)
const views = { admin: <Admin />, user: <User /> }
{views[role]}`}
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Ternary — Auth state</p>
          <div className="flex items-center gap-3">
            <button onClick={() => setLoggedIn(s => !s)} className={loggedIn ? btnGray : btn}>
              {loggedIn ? 'Log out' : 'Log in'}
            </button>
            {loggedIn ? (
              <span className="text-green-600 font-medium text-sm">✓ Welcome back!</span>
            ) : (
              <span className="text-gray-400 text-sm">Please log in</span>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
            Logical AND — gotcha with falsy values
          </p>
          <div className="flex items-center gap-3">
            <button onClick={() => setCount(c => c + 1)} className={btn}>Add item</button>
            <button onClick={() => setCount(0)} className={btnGray}>Reset to 0</button>
          </div>
          <div className="mt-2 flex gap-6 text-sm">
            <div>
              <p className="text-red-600 font-mono text-xs mb-1">Broken: {'{'}count && {'<Badge/>}'}  ← renders "0"!</p>
              <div className="bg-red-50 border border-red-200 rounded px-3 py-2">
                {count && <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">{count}</span>}
                {count === 0 && <span className="text-red-500 font-mono">0</span>}
              </div>
            </div>
            <div>
              <p className="text-green-600 font-mono text-xs mb-1">Fixed: {'{'}count {'>'} 0 && {'<Badge/>}'}</p>
              <div className="bg-green-50 border border-green-200 rounded px-3 py-2 min-w-16">
                {count > 0 && <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">{count}</span>}
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Object map — switch-like rendering</p>
          <div className="flex gap-2 mb-2">
            {(['admin', 'user', 'guest'] as const).map(r => (
              <button key={r} onClick={() => setRole(r)} className={`text-xs px-2 py-1 rounded ${role === r ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {r}
              </button>
            ))}
          </div>
          <div className={`px-4 py-2 rounded-lg text-sm font-medium ${roleContent[role].color}`}>
            {roleContent[role].label}
          </div>
        </div>
      </div>
    </DemoPanel>
  );
}

// ── Section 3: Keys in Lists ──────────────────────────────────────────────────
function ListKeys() {
  const [items, setItems] = useState(['Apple', 'Banana', 'Cherry']);
  const [useStableKeys, setUseStableKeys] = useState(false);
  const idRef = useRef(3);

  const prepend = () => {
    idRef.current++;
    setItems(prev => [`Item ${idRef.current}`, ...prev]);
  };

  return (
    <DemoPanel
      title="List Rendering & Key Importance"
      badge="Keys"
      badgeColor="orange"
      description="Without stable keys, React reuses wrong DOM nodes on insert/reorder — causing inputs to lose their typed values. Type in an input, then prepend an item."
      code={`// BAD — index key breaks on insert
items.map((item, i) => <Row key={i} />)

// GOOD — stable key per item
items.map(item => <Row key={item.id} />)`}
    >
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          <button onClick={prepend} className={btn}>Prepend item</button>
          <button
            onClick={() => setUseStableKeys(s => !s)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${useStableKeys ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
          >
            Keys: {useStableKeys ? '✓ Stable (value)' : '✗ Index (i)'}
          </button>
        </div>

        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          1. Type something in an input below<br />
          2. Click "Prepend item"<br />
          3. Watch what happens to your typed value
        </p>

        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={useStableKeys ? item : i} className="flex items-center gap-3">
              <span className="font-mono text-xs text-gray-400 w-24 flex-shrink-0">
                key={useStableKeys ? `"${item}"` : String(i)}
              </span>
              <span className="text-sm text-gray-600 w-20 flex-shrink-0">{item}</span>
              <input
                defaultValue=""
                placeholder="type here…"
                className="border border-gray-200 rounded px-2 py-1 text-sm w-32 focus:outline-none focus:border-blue-400"
              />
            </div>
          ))}
        </div>
      </div>
    </DemoPanel>
  );
}

// ── Section 4: Component Types ────────────────────────────────────────────────
function ComponentTypes() {
  const [count, setCount] = useState(0);

  return (
    <DemoPanel
      title="Component Patterns"
      badge="Components"
      badgeColor="green"
      description="Function components (hooks) vs class components (lifecycle methods). Props: spread, children, rest props forwarding."
      code={`// Function component (modern, use this)
function Counter({ label = 'Count' }: { label?: string }) {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n+1)}>{label}: {n}</button>;
}

// Rest props — forward all extra attributes to DOM
function Input({ label, ...rest }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return <label>{label}<input {...rest} /></label>;
}`}
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Default props via destructuring</p>
          <CounterComponent label="Clicks" initial={0} />
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Rest props — forwarded to DOM input</p>
          <div className="flex gap-2">
            <input
              type="number"
              value={count}
              onChange={e => setCount(Number(e.target.value))}
              min={0}
              max={100}
              className="border border-gray-200 rounded px-2 py-1 text-sm w-24"
              placeholder="number input"
            />
            <span className="text-sm text-gray-500 self-center">type, min, max forwarded via ...rest</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Children — composition over props</p>
          <Card>
            <p className="text-sm">This content is passed as <code className="bg-gray-100 px-1 rounded">children</code></p>
            <p className="text-sm text-gray-500">Any React node works: text, elements, components.</p>
          </Card>
        </div>
      </div>
    </DemoPanel>
  );
}

function CounterComponent({ label = 'Count', initial = 0 }: { label?: string; initial?: number }) {
  const [n, setN] = useState(initial);
  return (
    <button onClick={() => setN(c => c + 1)} className={btn}>
      {label}: {n}
    </button>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      {children}
    </div>
  );
}

export default function JSXPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">JSX & Components</h2>
        <p className="text-gray-500 mt-1">Day 12 — JSX syntax, conditional rendering, list keys, component patterns</p>
      </div>
      <SyntaxRules />
      <ConditionalRendering />
      <ListKeys />
      <ComponentTypes />
    </div>
  );
}
