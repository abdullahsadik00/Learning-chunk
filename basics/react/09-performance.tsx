// ═══════════════════════════════════════════════════════════════
// REACT 09: PERFORMANCE — memo · Code Splitting · Virtualization  (Day 17a)
// ═══════════════════════════════════════════════════════════════

import React, {
    memo, useMemo, useCallback, useState, useEffect,
    useRef, lazy, Suspense, Profiler, ReactNode,
} from 'react';

// ───────────────────────────────────────────────────────────────
// 1. React.memo — SKIP RE-RENDERS
// ───────────────────────────────────────────────────────────────
//
// React.memo wraps a function component. If props haven't changed
// (shallow comparison), the component skips re-rendering entirely.
//
// SHALLOW COMPARISON:
//   Primitives (string, number, bool): compared by value ✅
//   Objects / Arrays: compared by REFERENCE ❌ (new obj = new ref)
//   Functions: compared by REFERENCE ❌ (inline fn = new ref)

// ── 1a. Basic memo ──
interface ItemProps { id: string; name: string; onClick: (id: string) => void; }

const Item = memo(function Item({ id, name, onClick }: ItemProps) {
    console.log(`Item ${name} rendered`);
    return <li onClick={() => onClick(id)}>{name}</li>;
});

// ── 1b. Custom comparison fn ──
interface ComplexItemProps {
    product: { id: string; name: string; price: number; category: string };
    isSelected: boolean;
    onSelect: (id: string) => void;
}

const ComplexItem = memo(
    function ComplexItem({ product, isSelected, onSelect }: ComplexItemProps) {
        return (
            <div style={{ background: isSelected ? "#e8f0fe" : "transparent" }}>
                <span>{product.name} — ${product.price}</span>
                <button onClick={() => onSelect(product.id)}>
                    {isSelected ? "Deselect" : "Select"}
                </button>
            </div>
        );
    },
    // Custom comparison: only re-render if these specific things change
    (prev, next) =>
        prev.product.id    === next.product.id &&
        prev.product.price === next.product.price &&
        prev.isSelected    === next.isSelected
        // NOTE: onSelect intentionally excluded — it's a stable useCallback
);

// ── 1c. memo PITFALLS — when memo stops working ──
function ParentWithPitfalls() {
    const [count, setCount] = useState(0);
    const [name, setName]   = useState("Alice");

    // ❌ PITFALL 1: Inline object prop — new reference every render
    // <Item config={{ theme: "dark" }} />  → always re-renders

    // ✅ Fix: useMemo for objects
    const config = useMemo(() => ({ theme: "dark" as const }), []);

    // ❌ PITFALL 2: Inline function prop — new reference every render
    // <Item onClick={(id) => console.log(id)} />  → memo useless

    // ✅ Fix: useCallback for functions
    const handleClick = useCallback((id: string) => {
        console.log("clicked", id);
    }, []);

    // ❌ PITFALL 3: Children as JSX — <Child><div /></Child>
    // JSX creates new element objects, so children prop is a new ref every render.
    // Solution: lift children out of the re-rendering component, or use slots.

    return (
        <div>
            <button onClick={() => setCount(c => c + 1)}>{count}</button>
            <Item id="1" name={name} onClick={handleClick} />
        </div>
    );
}

// ───────────────────────────────────────────────────────────────
// 2. CODE SPLITTING — load code on demand
// ───────────────────────────────────────────────────────────────
//
// By default, Vite/webpack bundles everything into one file.
// Large routes/components delay the initial load.
//
// React.lazy + Suspense = dynamic import with automatic loading UI.

// ── 2a. Route-based splitting (most impactful) ──
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – hypothetical modules for illustration
const Dashboard  = lazy(() => import('./dashboard'));
// @ts-ignore
const Analytics  = lazy(() => import('./analytics'));

function AppRouter() {
    const [page, setPage] = useState<"dashboard" | "analytics">("dashboard");

    return (
        <Suspense fallback={<div>Loading page…</div>}>
            {page === "dashboard" ? <Dashboard /> : <Analytics />}
        </Suspense>
    );
}

// ── 2b. Component-level splitting ──
const HeavyChart = lazy(() =>
    // @ts-ignore – hypothetical module for illustration
    import('./heavy-chart').then((m: any) => ({ default: m.HeavyChart }))
);

function PageWithChart({ showChart }: { showChart: boolean }) {
    return (
        <div>
            <p>Main content always loads immediately</p>
            {showChart && (
                <Suspense fallback={<div>Loading chart…</div>}>
                    <HeavyChart />
                </Suspense>
            )}
        </div>
    );
}

// ── 2c. Preloading — start download before user needs it ──
// Trigger the import early (e.g. on hover) so by the time user clicks,
// the chunk is already cached.
function preloadDashboard() {
    // @ts-ignore – hypothetical module
    const mod = import('./dashboard'); // fires network request immediately
    return mod;
}

function NavLink() {
    return (
        <a
            href="/dashboard"
            onMouseEnter={preloadDashboard} // preload on hover
        >
            Dashboard
        </a>
    );
}

// ── 2d. Suspense boundaries — granular fallbacks ──
//
// Multiple Suspense boundaries = independent loading states.
// One boundary shows one spinner while the other section loads separately.
//
// <Suspense fallback={<PageSkeleton />}>   ← page level
//   <Header />
//   <Suspense fallback={<ChartSkeleton />}> ← section level
//     <Chart />
//   </Suspense>
//   <Suspense fallback={<TableSkeleton />}> ← section level
//     <Table />
//   </Suspense>
// </Suspense>

// ───────────────────────────────────────────────────────────────
// 3. VIRTUALIZATION — render only visible items
// ───────────────────────────────────────────────────────────────
//
// Rendering 10,000 list items creates 10,000 DOM nodes.
// Virtualization renders only the items visible in the viewport.
//
// Libraries: react-window (lightweight) or react-virtual (headless)
//
// INSTALL: npm i react-window @types/react-window

// ── 3a. Fixed-size list (react-window) ──
//
// import { FixedSizeList } from 'react-window';
//
// function VirtualList({ items }: { items: string[] }) {
//     const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
//         <div style={style}>     ← MUST apply style for positioning
//             {items[index]}
//         </div>
//     );
//
//     return (
//         <FixedSizeList
//             height={400}         ← container height (px)
//             width="100%"
//             itemCount={items.length}
//             itemSize={40}        ← fixed row height (px)
//         >
//             {Row}
//         </FixedSizeList>
//     );
// }

// ── 3b. Variable-size list ──
//
// import { VariableSizeList } from 'react-window';
//
// const itemHeights = [40, 80, 40, 120, ...];
// const getItemSize = (index: number) => itemHeights[index];
//
// <VariableSizeList
//     height={400}
//     width="100%"
//     itemCount={items.length}
//     itemSize={getItemSize}
// >
//     {Row}
// </VariableSizeList>

// ── 3c. Infinite scroll with Intersection Observer ──
function useInfiniteScroll(
    onLoadMore: () => void,
    { threshold = 0.1 } = {}
) {
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) onLoadMore(); },
            { threshold }
        );
        if (sentinelRef.current) observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [onLoadMore, threshold]);

    return sentinelRef;
}

function InfiniteList() {
    const [items, setItems] = useState<string[]>(
        Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`)
    );
    const [loading, setLoading] = useState(false);

    const loadMore = useCallback(async () => {
        if (loading) return;
        setLoading(true);
        await new Promise(r => setTimeout(r, 500)); // simulate fetch
        setItems(prev => [
            ...prev,
            ...Array.from({ length: 20 }, (_, i) => `Item ${prev.length + i + 1}`),
        ]);
        setLoading(false);
    }, [loading]);

    const sentinelRef = useInfiniteScroll(loadMore);

    return (
        <div style={{ height: 400, overflowY: "auto" }}>
            {items.map(item => (
                <div key={item} style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                    {item}
                </div>
            ))}
            {loading && <p>Loading more…</p>}
            <div ref={sentinelRef} style={{ height: 1 }} />
        </div>
    );
}

// ───────────────────────────────────────────────────────────────
// 4. PROFILER API — measure render performance
// ───────────────────────────────────────────────────────────────
//
// <Profiler id="name" onRender={callback}>
// Called after every render with timing data.
// Use in development to find expensive components.

function onRenderCallback(
    id: string,
    phase: "mount" | "update" | "nested-update",
    actualDuration: number,  // time spent rendering (ms)
    baseDuration: number,    // estimated time without memoization
    startTime: number,
    commitTime: number
): void {
    if (actualDuration > 16) {  // 16ms = 60fps budget
        console.warn(`Slow render: ${id} (${phase}) took ${actualDuration.toFixed(1)}ms`);
    }
}

function ProfiledApp() {
    return (
        <Profiler id="App" onRender={onRenderCallback}>
            {/* <App /> */}
            <div>Profiler wraps your component tree</div>
        </Profiler>
    );
}

// ── 4a. useWhyDidYouUpdate — debug which props caused a re-render ──
function useWhyDidYouUpdate<T extends Record<string, unknown>>(
    name: string,
    props: T
): void {
    const prevProps = useRef<T>(props);

    useEffect(() => {
        const prev = prevProps.current;
        const changed: Record<string, { from: unknown; to: unknown }> = {};

        const allKeys = new Set([...Object.keys(prev), ...Object.keys(props)]);
        allKeys.forEach(key => {
            if (prev[key] !== props[key]) {
                changed[key] = { from: prev[key], to: props[key] };
            }
        });

        if (Object.keys(changed).length) {
            console.log(`[why-did-you-update] ${name}`, changed);
        }

        prevProps.current = props;
    });
}

// Usage: add to any component you suspect is over-rendering
const ExpensiveComponent = memo(function ExpensiveComponent({
    data,
    onUpdate,
}: {
    data: { value: number };
    onUpdate: () => void;
}) {
    useWhyDidYouUpdate("ExpensiveComponent", { data, onUpdate });
    return <div>{data.value}</div>;
});

// ───────────────────────────────────────────────────────────────
// 5. PERFORMANCE CHECKLIST
// ───────────────────────────────────────────────────────────────
//
//  BEFORE OPTIMIZING: Profile first! Measure, don't guess.
//  Use React DevTools Profiler or browser Performance tab.
//
//  EASY WINS (low effort, high impact):
//   ✅ Add keys to list items (correct keys, not index for dynamic lists)
//   ✅ Code-split large routes with React.lazy + Suspense
//   ✅ Virtualize long lists (> 100 items) with react-window
//   ✅ Defer heavy computations with useMemo
//   ✅ Stable function refs with useCallback for memo'd children
//
//  MEDIUM (requires profiling):
//   ✅ Wrap expensive components in React.memo
//   ✅ Split Context to avoid unnecessary subscriber re-renders
//   ✅ Use useTransition for non-urgent updates
//   ✅ Preload chunks on hover/route change
//
//  AVOID:
//   ❌ Memoizing everything blindly — has overhead
//   ❌ Using index as key for lists that can reorder
//   ❌ State too high up the tree (shared for no reason)
//   ❌ Computing derived state in render without useMemo

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

// Q1: Why does React.memo sometimes fail to prevent re-renders?
// A: Because memo uses SHALLOW comparison. If you pass:
//    - An inline object: { a: 1 } — new reference every render
//    - An inline function: () => {} — new reference every render
//    - JSX as children — new React element every render
//    Fixes: useMemo for objects/arrays, useCallback for functions.

// Q2: What is the difference between React.lazy and dynamic import()?
// A: import() is the native JS dynamic import — returns a Promise<module>.
//    React.lazy wraps import() to integrate with Suspense:
//    it expects a Promise resolving to { default: Component }.
//    React.lazy + Suspense = loading UI is declarative (fallback prop).

// Q3: When should you virtualize a list?
// A: When the list has more items than can fit in the viewport (typically
//    > 50-100 items) and rendering all of them causes noticeable lag.
//    Virtualization only renders visible items (+small overscan buffer),
//    keeping the DOM lean regardless of total item count.

// Q4: What does the Profiler's actualDuration vs baseDuration mean?
// A: actualDuration: real time React spent rendering this subtree (ms).
//    baseDuration: estimated time if memoization were disabled (worst case).
//    If actualDuration << baseDuration → memo is working well.
//    If actualDuration ≈ baseDuration → memo is not helping (props are changing).

// Q5: Implement a component that memoizes correctly with a callback prop
function TodoList({
    todos,
    onToggle,
}: {
    todos: { id: string; text: string; done: boolean }[];
    onToggle: (id: string) => void;
}) {
    return (
        <ul>
            {todos.map(t => (
                <TodoItem key={t.id} todo={t} onToggle={onToggle} />
            ))}
        </ul>
    );
}

const TodoItem = memo(function TodoItem({
    todo,
    onToggle,
}: {
    todo: { id: string; text: string; done: boolean };
    onToggle: (id: string) => void;
}) {
    return (
        <li
            onClick={() => onToggle(todo.id)}
            style={{ textDecoration: todo.done ? "line-through" : "none" }}
        >
            {todo.text}
        </li>
    );
});

// Parent passes stable callback:
function TodoApp() {
    const [todos, setTodos] = useState([
        { id: "1", text: "Learn React", done: false },
        { id: "2", text: "Build something", done: false },
    ]);

    // ✅ Stable reference — TodoItem only re-renders when todo.done changes
    const handleToggle = useCallback((id: string) => {
        setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    }, []);

    return <TodoList todos={todos} onToggle={handleToggle} />;
}

export {
    Item, ComplexItem, ParentWithPitfalls,
    AppRouter, PageWithChart,
    useInfiniteScroll, InfiniteList,
    ProfiledApp, onRenderCallback, useWhyDidYouUpdate, ExpensiveComponent,
    TodoList, TodoItem, TodoApp,
};

// ─── LIVE DEMO ───────────────────────────────────────────────────

function Box({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
    return (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>{title}</p>
            {sub && <p style={{ margin: '0 0 12px', fontSize: 12, color: '#9ca3af' }}>{sub}</p>}
            {children}
        </div>
    );
}

export default function Demo() {
    return (
        <div>
            <Box
                title="React.memo + useCallback — memo'd todo list"
                sub="Open DevTools console — TodoItem only logs 'rendered' when its own item changes, not when others do."
            >
                <TodoApp />
            </Box>

            <Box
                title="Infinite scroll — IntersectionObserver loads more as you scroll"
                sub="Scroll to the bottom of the list to trigger another batch load."
            >
                <InfiniteList />
            </Box>

            <Box
                title="React.memo pitfalls — inline props break memoization"
                sub="Click the count button and watch the console — Item re-renders even though its props didn't change (inline onClick)."
            >
                <ParentWithPitfalls />
            </Box>
        </div>
    );
}
