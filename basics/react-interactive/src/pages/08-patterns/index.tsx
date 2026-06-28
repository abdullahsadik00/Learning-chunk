import { useState, useContext, createContext, useCallback, useRef, useEffect, memo } from 'react';
import DemoPanel from '../../components/DemoPanel';

const btn = 'px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors';
const btnGray = 'px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors';

// ─── Compound Components ──────────────────────────────────────────────────────
const AccordionCtx = createContext<{ open: string | null; toggle: (id: string) => void } | null>(null);

function Accordion({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState<string | null>(null);
  const toggle = useCallback((id: string) => setOpen(o => o === id ? null : id), []);
  return <AccordionCtx.Provider value={{ open, toggle }}><div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-200">{children}</div></AccordionCtx.Provider>;
}

function AccordionItem({ id, children }: { id: string; children: React.ReactNode }) {
  return <div>{children}</div>;
}

function AccordionTrigger({ id, children }: { id: string; children: React.ReactNode }) {
  const ctx = useContext(AccordionCtx)!;
  const isOpen = ctx.open === id;
  return (
    <button onClick={() => ctx.toggle(id)} className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors">
      {children}
      <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
    </button>
  );
}

function AccordionContent({ id, children }: { id: string; children: React.ReactNode }) {
  const ctx = useContext(AccordionCtx)!;
  if (ctx.open !== id) return null;
  return <div className="px-4 py-3 text-sm text-gray-600 bg-gray-50 border-t border-gray-100">{children}</div>;
}

Accordion.Item = AccordionItem;
Accordion.Trigger = AccordionTrigger;
Accordion.Content = AccordionContent;

function CompoundComponentsDemo() {
  return (
    <DemoPanel
      title="Compound Components — Shared Context"
      badge="Pattern"
      badgeColor="blue"
      description="Compound components share implicit state through Context. The consumer composes sub-components like HTML — the parent manages state, children opt in to it."
      code={`// Usage — reads like markup, not a prop bag
<Accordion>
  <Accordion.Item id="q1">
    <Accordion.Trigger id="q1">What is React?</Accordion.Trigger>
    <Accordion.Content id="q1">A JS library…</Accordion.Content>
  </Accordion.Item>
</Accordion>

// vs prop-bag anti-pattern:
<Accordion items={[{ q: '…', a: '…', open: false }]} />`}
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Compound Components (clean API)</p>
          <Accordion>
            <AccordionItem id="q1">
              <AccordionTrigger id="q1">What is useEffect used for?</AccordionTrigger>
              <AccordionContent id="q1">Synchronizing a component with an external system — network, DOM, timers, subscriptions. It runs after every render by default, or only when specified deps change.</AccordionContent>
            </AccordionItem>
            <AccordionItem id="q2">
              <AccordionTrigger id="q2">When should I use useReducer over useState?</AccordionTrigger>
              <AccordionContent id="q2">When next state depends on previous state in multiple ways, when you have multiple related state transitions, or when you want testable pure state transitions.</AccordionContent>
            </AccordionItem>
            <AccordionItem id="q3">
              <AccordionTrigger id="q3">What problem do portals solve?</AccordionTrigger>
              <AccordionContent id="q3">They let you render a child component into a DOM node outside the parent hierarchy — escaping overflow:hidden, z-index, or clip constraints while keeping React tree semantics.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </DemoPanel>
  );
}

// ─── Render Props ─────────────────────────────────────────────────────────────
function MouseTracker({ render }: { render: (pos: { x: number; y: number }) => React.ReactNode }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <div
      onMouseMove={e => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        setPos({ x: Math.round(e.clientX - rect.left), y: Math.round(e.clientY - rect.top) });
      }}
      className="h-36 bg-gray-900 rounded-lg relative overflow-hidden cursor-crosshair"
    >
      {render(pos)}
    </div>
  );
}

function useMousePosition(ref: React.RefObject<HTMLElement | null>) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      setPos({ x: Math.round(e.clientX - rect.left), y: Math.round(e.clientY - rect.top) });
    };
    el.addEventListener('mousemove', handler);
    return () => el.removeEventListener('mousemove', handler);
  }, [ref]);
  return pos;
}

function RenderPropsDemo() {
  const [mode, setMode] = useState<'renderProp' | 'hook'>('renderProp');
  const hookAreaRef = useRef<HTMLDivElement>(null);
  const hookPos = useMousePosition(hookAreaRef);

  return (
    <DemoPanel
      title="Render Props vs Custom Hook"
      badge="Pattern"
      badgeColor="purple"
      description='Render props share logic by passing a function as a prop. Custom hooks do the same with less indirection. Both solve the same problem — hooks are preferred for function components.'
      code={`// Render Prop
<MouseTracker render={({ x, y }) => <Crosshair x={x} y={y} />} />

// Custom Hook (equivalent, simpler)
function useMousePosition(ref) { /* useEffect, useState */ }
const pos = useMousePosition(divRef);`}
    >
      <div className="space-y-3">
        <div className="flex gap-2">
          <button onClick={() => setMode('renderProp')} className={mode === 'renderProp' ? btn : btnGray}>Render Prop</button>
          <button onClick={() => setMode('hook')} className={mode === 'hook' ? btn : btnGray}>Custom Hook</button>
        </div>
        {mode === 'renderProp' ? (
          <MouseTracker render={({ x, y }) => (
            <>
              <div className="absolute pointer-events-none" style={{ left: x - 8, top: y - 8 }}>
                <div className="w-4 h-0.5 bg-blue-400 absolute top-1.5 -left-2" />
                <div className="h-4 w-0.5 bg-blue-400 absolute left-1.5 -top-2" />
              </div>
              <div className="absolute bottom-2 left-2 text-green-400 text-xs font-mono">x:{x} y:{y}</div>
            </>
          )} />
        ) : (
          <div ref={hookAreaRef} className="h-36 bg-gray-900 rounded-lg relative overflow-hidden cursor-crosshair">
            <div className="absolute pointer-events-none" style={{ left: hookPos.x - 8, top: hookPos.y - 8 }}>
              <div className="w-4 h-0.5 bg-orange-400 absolute top-1.5 -left-2" />
              <div className="h-4 w-0.5 bg-orange-400 absolute left-1.5 -top-2" />
            </div>
            <div className="absolute bottom-2 left-2 text-green-400 text-xs font-mono">x:{hookPos.x} y:{hookPos.y}</div>
          </div>
        )}
        <p className="text-xs text-gray-500">Same behavior, different API. Move your mouse in the box.</p>
      </div>
    </DemoPanel>
  );
}

// ─── Headless Component (getXProps pattern) ───────────────────────────────────
type ComboboxItem = string;

function useCombobox(items: ComboboxItem[]) {
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(-1);
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = query ? items.filter(i => i.toLowerCase().includes(query.toLowerCase())) : items;

  const select = (item: string) => { setSelected(item); setQuery(item); setOpen(false); setHighlighted(-1); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open && e.key !== 'Escape') { setOpen(true); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter' && highlighted >= 0) { select(filtered[highlighted]); }
    else if (e.key === 'Escape') { setOpen(false); setHighlighted(-1); }
  };

  return {
    open, filtered, highlighted, selected, query,
    getInputProps: () => ({
      value: query,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => { setQuery(e.target.value); setOpen(true); setHighlighted(-1); },
      onFocus: () => setOpen(true),
      onKeyDown,
    }),
    getItemProps: (i: number) => ({
      onMouseEnter: () => setHighlighted(i),
      onMouseDown: (e: React.MouseEvent) => { e.preventDefault(); select(filtered[i]); },
    }),
  };
}

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'];

function HeadlessComboboxDemo() {
  const { open, filtered, highlighted, selected, query, getInputProps, getItemProps } = useCombobox(CITIES);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {}
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <DemoPanel
      title="Headless Component — getXProps Pattern"
      badge="Headless"
      badgeColor="orange"
      description="Headless components export logic only — no UI assumptions. The getXProps() pattern returns props to spread onto whatever element you choose. You own 100% of the styling."
      code={`// Hook returns behavior, you render anything
const { getInputProps, getItemProps, filtered } = useCombobox(items);

<input {...getInputProps()} className="your-styles" />
{filtered.map((item, i) => (
  <li {...getItemProps(i)} key={item}>{item}</li>
))}`}
    >
      <div className="space-y-2">
        <div className="relative" ref={containerRef}>
          <input
            {...getInputProps()}
            placeholder="Search cities… (try keyboard nav)"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-blue-400"
          />
          {open && filtered.length > 0 && (
            <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
              {filtered.map((item, i) => (
                <li
                  key={item}
                  {...getItemProps(i)}
                  className={`px-3 py-2 text-sm cursor-pointer ${i === highlighted ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
        {selected && <p className="text-sm text-green-600 font-medium">Selected: {selected}</p>}
        <p className="text-xs text-gray-500">↑↓ to navigate, Enter to select, Escape to close.</p>
      </div>
    </DemoPanel>
  );
}

// ─── HOC ──────────────────────────────────────────────────────────────────────
function withAuth<P extends object>(WrappedComponent: React.ComponentType<P>) {
  function AuthWrapper(props: P) {
    const [loggedIn, setLoggedIn] = useState(false);
    if (!loggedIn) {
      return (
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 text-center">
          <p className="text-sm text-amber-800 mb-3">🔒 Authentication required</p>
          <button onClick={() => setLoggedIn(true)} className={btn}>Log in to continue</button>
        </div>
      );
    }
    return (
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-green-600 font-medium">✓ Authenticated</span>
          <button onClick={() => setLoggedIn(false)} className="text-xs text-gray-400 hover:text-gray-600">Log out</button>
        </div>
        <WrappedComponent {...props} />
      </div>
    );
  }
  AuthWrapper.displayName = `withAuth(${WrappedComponent.displayName ?? WrappedComponent.name})`;
  return AuthWrapper;
}

const SecretDashboard = memo(function SecretDashboard() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <p className="text-sm font-semibold text-blue-800">Secret Dashboard</p>
      <p className="text-xs text-blue-600 mt-1">You can only see this because you're authenticated.</p>
    </div>
  );
});

const ProtectedDashboard = withAuth(SecretDashboard);

function HOCDemo() {
  return (
    <DemoPanel
      title="Higher-Order Component (HOC) — withAuth"
      badge="HOC"
      badgeColor="gray"
      description='HOC: a function that takes a component and returns an enhanced version. withAuth wraps any component with authentication gating. Prefer custom hooks for modern code, but HOCs still shine for cross-cutting concerns.'
      code={`function withAuth<P>(Wrapped: ComponentType<P>) {
  return function AuthWrapper(props: P) {
    const { user } = useAuth();
    if (!user) return <LoginPrompt />;
    return <Wrapped {...props} />;
  };
}

// Usage — wraps at definition time
const ProtectedPage = withAuth(DashboardPage);`}
    >
      <ProtectedDashboard />
    </DemoPanel>
  );
}

export default function PatternsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">React Patterns</h2>
        <p className="text-gray-500 mt-1">Day 17a — Compound Components, Render Props, Headless, HOCs</p>
      </div>
      <CompoundComponentsDemo />
      <RenderPropsDemo />
      <HeadlessComboboxDemo />
      <HOCDemo />
    </div>
  );
}
