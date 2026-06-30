// REACT 14: CODE SPLITTING · VIRTUALIZATION · RENDER OPTIMIZATION  (Day 24)
// Run: cd basics/react && npm run dev

// ═══════════════════════════════════════════════════════════════
// WHY THIS FILE EXISTS
// ═══════════════════════════════════════════════════════════════
//
// A React app that feels fast IS fast. A React app that looks fast
// but hides its problems will embarrass you in production at 3x CPU
// throttle on a mid-range Android in Mumbai.
//
// This file covers the full performance toolkit:
//   1. Measuring first (Core Web Vitals + DevTools)
//   2. Code splitting — ship only what the user needs NOW
//   3. Bundle analysis — find the 200 KB moment.js hiding in your build
//   4. React.memo — skip renders when nothing changed
//   5. useMemo / useCallback — stable references and expensive calcs
//   6. Virtualization — render 20 rows, not 10,000
//   7. Image optimization — lazy loading, srcset, CLS prevention
//   8. Concurrent features — keep the UI responsive during slow updates

import React, {
    useState, useEffect, useCallback, useMemo, useRef,
    lazy, Suspense, useTransition, useDeferredValue,
    memo, Profiler, ReactNode, ChangeEvent, ComponentType,
} from 'react';

// Helper: Promise.resolve with a default export — fixes TS inference for lazy()
function lazyModule<P extends object>(component: ComponentType<P>): Promise<{ default: ComponentType<P> }> {
    return Promise.resolve({ default: component });
}

// ───────────────────────────────────────────────────────────────
// SECTION 1 · WHY PERFORMANCE MATTERS
// ───────────────────────────────────────────────────────────────
//
// CORE WEB VITALS — Google's three performance signals:
//
//   LCP (Largest Contentful Paint)
//     → Time until the biggest visible element renders.
//       Target: < 2.5 s. Culprits: unoptimized images, render-blocking JS.
//
//   INP (Interaction to Next Paint) — replaced FID in 2024
//     → Time from user interaction to next frame paint.
//       Target: < 200 ms. Culprits: long JS tasks, synchronous state updates.
//
//   CLS (Cumulative Layout Shift)
//     → How much content jumps around during load.
//       Target: < 0.1. Culprits: images without dimensions, late-loading fonts.
//
// HOW REACT RENDERS
//   1. Trigger — setState / forceUpdate / context change
//   2. Render — React calls your component function (produces a VDOM tree)
//   3. Reconcile — React diffs the new VDOM vs the old VDOM
//   4. Commit — React applies the minimal DOM mutations
//
//   Expensive step: step 2. If your component renders 60× per second
//   because a parent re-renders, you pay step 2 sixty times per second
//   even if the output never changes.
//
// RULE #1: MEASURE BEFORE OPTIMIZING
//   Tools:
//     • React DevTools Profiler → record a session, see which component
//       took the most time per render and WHY it re-rendered
//     • Chrome Performance tab → flame chart, long tasks (>50 ms), layout thrash
//     • web-vitals npm package → real-field data from your users
//
// Example: measuring with web-vitals
//
//   import { onLCP, onINP, onCLS } from 'web-vitals';
//
//   onLCP(metric  => console.log('LCP:', metric.value));
//   onINP(metric  => console.log('INP:', metric.value));
//   onCLS(metric  => console.log('CLS:', metric.value));
//
// Example: React Profiler API (programmatic)

function ProfilerDemo() {
    const [count, setCount] = useState(0);

    function onRender(
        id: string,
        phase: "mount" | "update" | "nested-update",
        actualDuration: number,
        baseDuration: number,
    ) {
        // actualDuration: time spent rendering this subtree
        // baseDuration:   estimated time if no memoization at all
        if (actualDuration > 16) {
            console.warn(`[Profiler] ${id} took ${actualDuration.toFixed(1)} ms in ${phase}`);
        }
    }

    return (
        <Profiler id="CounterDemo" onRender={onRender}>
            <div>
                <p>Count: {count}</p>
                <button onClick={() => setCount(c => c + 1)}>+1</button>
            </div>
        </Profiler>
    );
}

// ⚠️ GOTCHA: React DevTools Profiler only works in development mode.
// Production builds strip out the profiling hooks for perf reasons.
// Use the special react-dom/profiling build if you need prod profiling.

// ───────────────────────────────────────────────────────────────
// SECTION 2 · CODE SPLITTING
// ───────────────────────────────────────────────────────────────
//
// By default Vite (and webpack) bundle EVERYTHING into one JS file.
// On a slow 4G connection, 1 MB of JS can delay first interaction by 5+ seconds.
//
// Code splitting = break your bundle into chunks. Load only the chunk
// the user needs for the current page. Other chunks load on demand.
//
// ROUTE-LEVEL SPLITTING (most impactful)
//   Each page becomes its own chunk. The user loads PageA's JS only
//   when they navigate to PageA.

// Simulated heavy page components (in a real app: import from separate files)
const HeavyDashboard = lazy(() =>
    // Dynamic import — Vite/webpack sees this and creates a separate chunk.
    // The string MUST be a literal (or near-literal) for static analysis to work.
    lazyModule(function Dashboard() {
        return <div style={{ padding: 20 }}>📊 Dashboard (lazy loaded)</div>;
    })
);

const HeavySettings = lazy(() =>
    lazyModule(function Settings() {
        return <div style={{ padding: 20 }}>⚙️ Settings (lazy loaded)</div>;
    })
);

// Usage with Suspense — Suspense catches the "loading" state of lazy components
function LazyRouter() {
    const [page, setPage] = useState<"dashboard" | "settings">("dashboard");

    return (
        <div>
            <nav style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button onClick={() => setPage("dashboard")}>Dashboard</button>
                <button onClick={() => setPage("settings")}>Settings</button>
            </nav>

            {/* Suspense fallback renders while the lazy chunk downloads */}
            <Suspense fallback={<div>Loading page…</div>}>
                {page === "dashboard" ? <HeavyDashboard /> : <HeavySettings />}
            </Suspense>
        </div>
    );
}

// COMPONENT-LEVEL SPLITTING
//   Some components are huge but rarely used (rich text editor, PDF viewer,
//   complex chart library). Lazy-load them on demand.

// A "heavy" chart that would normally import recharts/chart.js
const HeavyChart = lazy(() =>
    lazyModule(function Chart({ data }: { data: number[] }) {
        return (
            <div style={{ border: "1px solid #ccc", padding: 16, borderRadius: 8 }}>
                <strong>Chart</strong>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
                    {data.map((v, i) => (
                        <div
                            key={i}
                            style={{
                                width: 20,
                                height: `${v}%`,
                                background: "#6366f1",
                                borderRadius: "2px 2px 0 0",
                            }}
                        />
                    ))}
                </div>
            </div>
        );
    })
);

function ChartOnDemand() {
    const [showChart, setShowChart] = useState(false);
    const data = useMemo(() => Array.from({ length: 10 }, () => Math.random() * 100), []);

    return (
        <div>
            <button onClick={() => setShowChart(s => !s)}>
                {showChart ? "Hide Chart" : "Load Chart"}
            </button>
            {showChart && (
                <Suspense fallback={<div>Loading chart…</div>}>
                    <HeavyChart data={data} />
                </Suspense>
            )}
        </div>
    );
}

// NAMED EXPORTS with lazy
//   React.lazy only accepts default exports. If your module uses named exports,
//   create a re-export shim OR wrap inline:
//
//   // ❌ Won't work
//   const Foo = lazy(() => import('./foo').then(m => m.Foo));
//
//   // ✅ Wrap in an object with 'default' key
//   const Foo = lazy(() =>
//     import('./foo').then(m => ({ default: m.Foo }))
//   );

// VITE CHUNK NAMING
//   In vite.config.ts, control chunk names with rollupOptions:
//
//   build: {
//     rollupOptions: {
//       output: {
//         manualChunks: {
//           vendor: ['react', 'react-dom'],
//           charts: ['recharts'],
//         },
//       },
//     },
//   },

// ⚠️ GOTCHA: lazy() components MUST be defined at the module top level.
// Defining them inside a component function means a new promise on every render
// → Suspense re-triggers on every render → infinite loading spinner.

// ───────────────────────────────────────────────────────────────
// SECTION 3 · BUNDLE ANALYSIS
// ───────────────────────────────────────────────────────────────
//
// You can't optimize what you can't see.
//
// VITE BUNDLE ANALYZER
//   npm install -D rollup-plugin-visualizer
//
//   // vite.config.ts
//   import { visualizer } from 'rollup-plugin-visualizer';
//   plugins: [react(), visualizer({ open: true, filename: 'stats.html' })]
//
//   After `npm run build`, a browser opens with an interactive treemap.
//   Each box = one module. Bigger box = more bytes. Hover for exact sizes.
//
// READING THE TREEMAP
//   • Huge node_modules boxes are the usual culprits
//   • Look for libraries you use ONE function from but import the whole thing
//   • Check if you have multiple versions of the same package (two box.js squares)
//
// TREE-SHAKING
//   Bundlers eliminate dead code IF you use named imports:
//
//   // ✅ Tree-shakable — bundler includes only `format`
//   import { format } from 'date-fns';
//
//   // ❌ Imports everything — no tree-shaking possible
//   import dateFns from 'date-fns';
//
// HEAVY LIBRARY SWAPS (real savings):
//   moment.js  →  date-fns        (220 KB → ~20 KB for what you actually use)
//   lodash     →  native JS       (70 KB → 0 KB for most operations)
//   axios      →  fetch API       (14 KB → 0 KB)
//   react-icons (full) → specific icon pack or inline SVG

// Example: lodash alternatives with native JS
const lodashAlternatives = {
    // lodash.cloneDeep(obj) — 15 KB
    cloneDeep: <T,>(obj: T): T => JSON.parse(JSON.stringify(obj)),

    // lodash.debounce(fn, 300) — inlined below in Section 5

    // lodash.groupBy(arr, key)
    groupBy: <T,>(arr: T[], key: keyof T): Record<string, T[]> =>
        arr.reduce((acc, item) => {
            const k = String(item[key]);
            (acc[k] ??= []).push(item);
            return acc;
        }, {} as Record<string, T[]>),

    // lodash.uniqBy(arr, key)
    uniqBy: <T,>(arr: T[], key: keyof T): T[] => {
        const seen = new Set();
        return arr.filter(item => {
            const k = item[key];
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
        });
    },
};

// Silence unused variable warning in this teaching file
void lodashAlternatives;

// ⚠️ GOTCHA: Tree-shaking only works with ES modules (import/export).
// If a library ships only CommonJS (require/module.exports), the bundler
// can't tree-shake it. Check the package's "module" or "exports" field in
// package.json — if absent, you get the whole thing no matter what you import.

// ───────────────────────────────────────────────────────────────
// SECTION 4 · React.memo AND WHEN IT HELPS
// ───────────────────────────────────────────────────────────────
//
// React.memo wraps a component. Before re-rendering, React does a
// SHALLOW COMPARISON of all props. If nothing changed → skip render.
//
// SHALLOW COMPARISON means:
//   "Alice" === "Alice"  → same  ✅
//   42 === 42            → same  ✅
//   {} === {}            → DIFFERENT (new object reference) ❌
//   [] === []            → DIFFERENT ❌
//   fn === fn            → DIFFERENT (inline arrow fn = new ref) ❌
//
// WHEN memo HELPS:
//   ✅ Pure component (output depends only on props)
//   ✅ Render is expensive (complex JSX tree, lots of DOM nodes)
//   ✅ Props are stable (primitives, or objects stabilized with useMemo/useCallback)
//   ✅ Parent re-renders frequently (context change, rapid state updates)
//
// WHEN memo HURTS:
//   ❌ Props always change (memo adds overhead and never skips)
//   ❌ Cheap renders (the comparison cost > the render cost)
//   ❌ Object/function props not stabilized (memo never skips anyway)

interface ExpensiveRowProps {
    id: number;
    name: string;
    score: number;
    onSelect: (id: number) => void;
}

// Simulates a component with a non-trivial render
const ExpensiveRow = memo(function ExpensiveRow({ id, name, score, onSelect }: ExpensiveRowProps) {
    // Imagine this renders a complex subtree
    const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : "D";
    return (
        <tr>
            <td>{id}</td>
            <td>{name}</td>
            <td>{score}</td>
            <td style={{ color: grade === "A" ? "green" : grade === "D" ? "red" : "inherit" }}>
                {grade}
            </td>
            <td>
                <button onClick={() => onSelect(id)}>Select</button>
            </td>
        </tr>
    );
});

// memo WITH CUSTOM COMPARISON
//   Sometimes you want to skip renders based on a subset of props.
//   The second argument is (prevProps, nextProps) => boolean.
//   Return true = props are "equal" = skip render.

interface UserCardProps {
    user: { id: number; name: string; email: string; avatar: string };
    isOnline: boolean;
    unreadCount: number;
    // onMessage changes every render — we intentionally ignore it in comparison
    onMessage: (id: number) => void;
}

const UserCard = memo(
    function UserCard({ user, isOnline, unreadCount, onMessage }: UserCardProps) {
        return (
            <div style={{ padding: 12, border: "1px solid #e5e7eb", borderRadius: 8 }}>
                <strong>{user.name}</strong>
                <span style={{ marginLeft: 8, color: isOnline ? "green" : "gray" }}>
                    {isOnline ? "online" : "offline"}
                </span>
                {unreadCount > 0 && (
                    <span style={{ marginLeft: 8, background: "#ef4444", color: "#fff", borderRadius: 99, padding: "2px 6px", fontSize: 12 }}>
                        {unreadCount}
                    </span>
                )}
                <button onClick={() => onMessage(user.id)} style={{ display: "block", marginTop: 8 }}>
                    Message
                </button>
            </div>
        );
    },
    // Only re-render if these specific values change
    (prev, next) =>
        prev.user.id      === next.user.id   &&
        prev.isOnline     === next.isOnline   &&
        prev.unreadCount  === next.unreadCount
    // onMessage is intentionally excluded — caller stabilizes it with useCallback
);

void UserCard;

// ⚠️ GOTCHA: memo does NOT prevent re-renders caused by useContext.
// If a memoized component consumes a context, and the context value changes,
// the component re-renders regardless of its props being identical.
// Solution: split your context into smaller contexts, or use a selector pattern.

// ───────────────────────────────────────────────────────────────
// SECTION 5 · useMemo AND useCallback
// ───────────────────────────────────────────────────────────────
//
// Both exist for ONE reason: stable references between renders.
//
// useMemo  — memoizes a COMPUTED VALUE
//   const result = useMemo(() => expensiveCalc(a, b), [a, b]);
//   → result is recalculated only when a or b changes.
//
// useCallback — memoizes a FUNCTION REFERENCE
//   const handler = useCallback((x) => doSomething(x, dep), [dep]);
//   → handler is the same object reference between renders (unless dep changes).
//   → Equivalent to: useMemo(() => (x) => doSomething(x, dep), [dep])
//
// WHEN TO USE useMemo:
//   ✅ Expensive pure calculation (sorting/filtering large arrays, heavy math)
//   ✅ Creating objects/arrays that are passed as props to memoized children
//   ❌ Simple transformations — the overhead outweighs the benefit

function useFilteredAndSorted(
    items: Array<{ id: number; name: string; price: number; category: string }>,
    query: string,
    sortBy: "name" | "price",
) {
    return useMemo(() => {
        // Only re-runs when items, query, or sortBy changes
        const filtered = query
            ? items.filter(item =>
                item.name.toLowerCase().includes(query.toLowerCase()) ||
                item.category.toLowerCase().includes(query.toLowerCase())
              )
            : items;

        return [...filtered].sort((a, b) => {
            if (sortBy === "name") return a.name.localeCompare(b.name);
            return a.price - b.price;
        });
    }, [items, query, sortBy]);
}

// WHEN TO USE useCallback:
//   ✅ Function passed as prop to a memoized child component
//   ✅ Function used in a useEffect dependency array
//   ❌ Inline handlers that are NOT passed to memoized children

// Debounce with useCallback — a real-world combo
function useDebounced<T extends unknown[]>(
    fn: (...args: T) => void,
    delay: number,
): (...args: T) => void {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    return useCallback((...args: T) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => fn(...args), delay);
    }, [fn, delay]); // eslint-disable-line react-hooks/exhaustive-deps
}

function SearchBox({ onSearch }: { onSearch: (q: string) => void }) {
    // onSearch is a stable ref from parent (useCallback)
    // useDebounced creates a stable debounced version
    const debouncedSearch = useDebounced(onSearch, 300);

    return (
        <input
            placeholder="Search…"
            onChange={(e: ChangeEvent<HTMLInputElement>) => debouncedSearch(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #d1d5db" }}
        />
    );
}

// THE HONEST TRUTH ABOUT useMemo / useCallback
//
//   Most useMemo and useCallback calls in real codebases are premature.
//   The React team has said this explicitly. The hooks themselves have cost:
//   they allocate closures, run comparisons, and increase code complexity.
//
//   Profile first. Only memoize when:
//     1. You can see the render is slow in the Profiler, AND
//     2. The memoization actually prevents the slow render

// ⚠️ GOTCHA: Every value referenced inside useMemo/useCallback MUST be in
// the dependency array, or you'll capture stale closures and get bugs that
// are very hard to track down. Use eslint-plugin-react-hooks to enforce this.

// ───────────────────────────────────────────────────────────────
// SECTION 6 · VIRTUALIZATION
// ───────────────────────────────────────────────────────────────
//
// The problem: render 10,000 list items → 10,000 DOM nodes →
// browser layout/paint of the entire list → 500+ ms frame drop → janky scroll.
//
// The fix: only render the rows that are VISIBLE in the viewport,
// plus a small overscan buffer above/below. As the user scrolls,
// render new rows, recycle old ones.
//
// Libraries:
//   react-window      — lightweight, battle-tested, FixedSizeList / VariableSizeList / Grid
//   @tanstack/virtual — TanStack Virtual, more flexible, works with any scroll container
//
// react-window example (conceptual — requires npm install react-window)
//
//   import { FixedSizeList } from 'react-window';
//
//   const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
//     <div style={style}>Row #{index}</div>
//   );
//
//   <FixedSizeList
//     height={400}          // visible container height in px
//     itemCount={10000}     // total number of rows
//     itemSize={40}         // each row's height in px
//     width="100%"
//   >
//     {Row}
//   </FixedSizeList>
//
// VariableSizeList — rows have different heights:
//
//   const getItemSize = (index: number) => index % 3 === 0 ? 80 : 40;
//
//   <VariableSizeList
//     height={400}
//     itemCount={10000}
//     itemSize={getItemSize}
//     width="100%"
//   >
//     {Row}
//   </VariableSizeList>
//
// FixedSizeGrid — 2D virtualization (like a spreadsheet):
//
//   <FixedSizeGrid
//     columnCount={100}
//     columnWidth={100}
//     height={400}
//     rowCount={10000}
//     rowHeight={40}
//     width={800}
//   >
//     {({ rowIndex, columnIndex, style }) => (
//       <div style={style}>R{rowIndex} C{columnIndex}</div>
//     )}
//   </FixedSizeGrid>
//
// TanStack Virtual (more flexible, no fixed container width required):
//
//   import { useVirtualizer } from '@tanstack/react-virtual';
//
//   const parentRef = useRef<HTMLDivElement>(null);
//   const virtualizer = useVirtualizer({
//     count: items.length,
//     getScrollElement: () => parentRef.current,
//     estimateSize: () => 40,
//   });
//
//   <div ref={parentRef} style={{ height: 400, overflow: 'auto' }}>
//     <div style={{ height: virtualizer.getTotalSize() }}>
//       {virtualizer.getVirtualItems().map(vItem => (
//         <div
//           key={vItem.key}
//           style={{ position: 'absolute', top: vItem.start, width: '100%', height: vItem.size }}
//         >
//           {items[vItem.index].name}
//         </div>
//       ))}
//     </div>
//   </div>

// A zero-dependency virtualized list (for learning — use react-window in prod)
function SimpleVirtualList({
    items,
    rowHeight = 40,
    visibleRows = 10,
}: {
    items: string[];
    rowHeight?: number;
    visibleRows?: number;
}) {
    const containerHeight = rowHeight * visibleRows;
    const [scrollTop, setScrollTop] = useState(0);

    const startIndex = Math.floor(scrollTop / rowHeight);
    const overscan = 3;
    const visibleStart = Math.max(0, startIndex - overscan);
    const visibleEnd   = Math.min(items.length - 1, startIndex + visibleRows + overscan);

    const visibleItems = [];
    for (let i = visibleStart; i <= visibleEnd; i++) {
        visibleItems.push({ index: i, item: items[i] });
    }

    return (
        <div
            style={{ height: containerHeight, overflow: "auto", position: "relative", border: "1px solid #e5e7eb", borderRadius: 8 }}
            onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
        >
            {/* Total height spacer — makes the scrollbar correct */}
            <div style={{ height: items.length * rowHeight, position: "relative" }}>
                {visibleItems.map(({ index, item }) => (
                    <div
                        key={index}
                        style={{
                            position: "absolute",
                            top: index * rowHeight,
                            left: 0,
                            right: 0,
                            height: rowHeight,
                            display: "flex",
                            alignItems: "center",
                            padding: "0 12px",
                            borderBottom: "1px solid #f3f4f6",
                            background: index % 2 === 0 ? "#fff" : "#f9fafb",
                            fontSize: 14,
                        }}
                    >
                        <span style={{ color: "#9ca3af", marginRight: 12, fontFamily: "mono", fontSize: 12 }}>
                            {String(index + 1).padStart(4, "0")}
                        </span>
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ⚠️ GOTCHA: react-window requires fixed dimensions for the list container.
// If your container's size depends on CSS (flexbox, %, viewport units), you need
// react-virtualized-auto-sizer to measure the container and pass explicit px values.
// Skipping this is the #1 cause of "my virtual list renders 0 items" bugs.

// ───────────────────────────────────────────────────────────────
// SECTION 7 · IMAGE AND ASSET OPTIMIZATION
// ───────────────────────────────────────────────────────────────
//
// Images are usually the biggest contributor to LCP and CLS.
//
// LAZY LOADING
//   <img loading="lazy" /> — browser defers download until image is near viewport.
//   Default is "eager" — every image on the page downloads immediately.
//
// ASYNC DECODING
//   <img decoding="async" /> — browser decodes image off the main thread.
//   Without this, large images can block rendering.
//
// RESPONSIVE IMAGES
//   srcset + sizes — browser picks the best image for the device's resolution.
//
//   <img
//     src="hero-800.webp"
//     srcset="hero-400.webp 400w, hero-800.webp 800w, hero-1600.webp 1600w"
//     sizes="(max-width: 600px) 100vw, 800px"
//     alt="Hero image"
//     loading="lazy"
//     decoding="async"
//   />
//
// PREVENT CLS — always set width + height (or aspect-ratio)
//   Without dimensions, the browser doesn't know the image's size until
//   it downloads → content shifts down when image arrives → bad CLS score.
//
//   /* CSS */
//   img { aspect-ratio: 16 / 9; width: 100%; height: auto; }
//
// WEBP FORMAT
//   WebP is 25-35% smaller than JPEG at equivalent quality.
//   Use <picture> for fallback:
//
//   <picture>
//     <source srcSet="photo.webp" type="image/webp" />
//     <img src="photo.jpg" alt="Photo" width={800} height={450} loading="lazy" />
//   </picture>
//
// BLOB URLS FOR FILE PREVIEWS
//   Don't use FileReader.readAsDataURL for large files — it's slow and
//   converts to base64 (33% larger). Use URL.createObjectURL instead:

function ImagePreview({ file }: { file: File | null }) {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!file) return;
        const objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);
        // CRITICAL: revoke when done or you leak memory
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    if (!url) return <div style={{ color: "#9ca3af" }}>No file selected</div>;

    return (
        <img
            src={url}
            alt="Preview"
            style={{ maxWidth: "100%", borderRadius: 8, aspectRatio: "16/9", objectFit: "cover" }}
            loading="lazy"
            decoding="async"
        />
    );
}

void ImagePreview;

// NEXT.JS <Image> component (if you're on Next.js):
//   • Automatic WebP conversion
//   • Automatic srcset generation
//   • Prevents CLS by requiring width + height
//   • Lazy loads by default
//   • Serves from a CDN edge cache
//
//   import Image from 'next/image';
//   <Image src="/hero.jpg" alt="Hero" width={800} height={450} priority />
//   (priority = preload, for LCP images above the fold)

// ⚠️ GOTCHA: <img loading="lazy" /> does NOT work for images above the fold.
// The browser loads above-the-fold images eagerly regardless of the attribute.
// For your LCP image (the hero/banner), use loading="eager" and add a <link
// rel="preload" as="image" href="…" /> in <head> to start loading immediately.

// ───────────────────────────────────────────────────────────────
// SECTION 8 · CONCURRENT FEATURES
// ───────────────────────────────────────────────────────────────
//
// React 18 introduced the concurrent renderer. The big idea:
// React can now PAUSE, INTERRUPT, and RESUME renders.
// This lets urgent updates (typing, clicking) stay responsive
// even when non-urgent work (filtering a 10k list) is expensive.
//
// THREE TOOLS:
//
// useTransition — marks a state update as non-urgent
//   const [isPending, startTransition] = useTransition();
//   startTransition(() => setSlowState(newValue));
//   • React renders the old UI immediately (responsive)
//   • Processes the slow update in the background
//   • isPending is true while the transition is in progress
//
// useDeferredValue — defer the RENDER of a slow value
//   const deferredQuery = useDeferredValue(query);
//   • query updates immediately (for the input)
//   • deferredQuery lags behind (used by the slow list)
//   • Similar to useTransition but for values you don't control
//
// startTransition (standalone) — same as useTransition but without isPending

// Example: search filtering with useTransition
function TransitionSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<string[]>([]);
    const [isPending, startTransition] = useTransition();

    // Simulate a large dataset
    const allItems = useMemo(
        () => Array.from({ length: 5000 }, (_, i) => `Item ${i + 1} — result entry for list`),
        []
    );

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        setQuery(value);  // urgent — updates input immediately

        startTransition(() => {
            // non-urgent — React may yield to more important updates
            const filtered = value
                ? allItems.filter(item => item.toLowerCase().includes(value.toLowerCase()))
                : allItems;
            setResults(filtered.slice(0, 50)); // cap for demo
        });
    }

    return (
        <div>
            <input
                value={query}
                onChange={handleChange}
                placeholder="Search 5,000 items…"
                style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #d1d5db", width: "100%" }}
            />
            {isPending && (
                <div style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>Filtering…</div>
            )}
            <div style={{ marginTop: 8, fontSize: 14, color: "#374151" }}>
                {results.length === 0 && query ? "No results" : `${results.length} results`}
            </div>
        </div>
    );
}

// Example: useDeferredValue for a slow list render
function DeferredList() {
    const [query, setQuery] = useState("");
    const deferredQuery = useDeferredValue(query);

    const allItems = useMemo(
        () => Array.from({ length: 2000 }, (_, i) => `Product ${i + 1}`),
        []
    );

    // This expensive filter uses the DEFERRED value
    // The input (query) always stays up to date
    const filtered = useMemo(
        () => deferredQuery
            ? allItems.filter(item => item.toLowerCase().includes(deferredQuery.toLowerCase()))
            : allItems,
        [allItems, deferredQuery]
    );

    // Visual indicator: deferred value hasn't caught up yet
    const isStale = query !== deferredQuery;

    return (
        <div>
            <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products…"
                style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #d1d5db", width: "100%" }}
            />
            <div style={{ opacity: isStale ? 0.5 : 1, transition: "opacity 0.2s", marginTop: 8, fontSize: 14 }}>
                {filtered.slice(0, 20).map((item, i) => (
                    <div key={i} style={{ padding: "4px 0", borderBottom: "1px solid #f3f4f6" }}>
                        {item}
                    </div>
                ))}
                {filtered.length > 20 && (
                    <div style={{ color: "#9ca3af", fontSize: 13, paddingTop: 4 }}>
                        +{filtered.length - 20} more
                    </div>
                )}
            </div>
        </div>
    );
}

// SUSPENSE FOR STREAMING SSR (Next.js / React Server Components)
//
//   In SSR, wrapping slow data fetches in <Suspense> lets React stream
//   the shell HTML immediately and stream in the suspended content later.
//
//   // Server component
//   <Suspense fallback={<Skeleton />}>
//     <SlowDataComponent />  {/* streams in when data is ready */}
//   </Suspense>
//
//   Without Suspense: the whole page waits for the slowest component.
//   With Suspense: users see content progressively — much better UX.

// ⚠️ GOTCHA: useTransition and useDeferredValue only help if the "slow" part
// is React render work. If slowness comes from a synchronous JS computation
// (e.g., sorting 1M items in one shot), concurrent features can't help —
// React still can't interrupt pure JS. Move heavy computation to a Web Worker
// or break it into smaller chunks with scheduler.postTask / setTimeout.

// ═══════════════════════════════════════════════════════════════
// PRACTICE CHALLENGES
// ═══════════════════════════════════════════════════════════════
//
// ── Challenge 1 (EASY) ──
// A parent component has this:
//   const config = { theme: "dark", lang: "en" };
//   <Child config={config} />
// Child is wrapped in React.memo. Does memo ever skip a render? Why / why not?
// Fix it.
//
// ANSWER:
//   No — a new `config` object literal is created on every parent render,
//   so the reference always changes. memo's shallow compare sees a new ref → renders.
//   Fix: const config = useMemo(() => ({ theme: "dark", lang: "en" }), []);
//   OR move config outside the component (if it truly never changes).

// ── Challenge 2 (EASY) ──
// Convert this to use lazy loading. The component is only needed when the
// user clicks "Show Report":
//
//   import ReportViewer from './ReportViewer';
//   function App() {
//     const [show, setShow] = useState(false);
//     return show ? <ReportViewer /> : <button onClick={() => setShow(true)}>Show Report</button>;
//   }
//
// ANSWER:
//   const ReportViewer = lazy(() => import('./ReportViewer'));
//   // Wrap usage in <Suspense fallback={<div>Loading…</div>}>
//   function App() {
//     const [show, setShow] = useState(false);
//     return show
//       ? <Suspense fallback={<div>Loading…</div>}><ReportViewer /></Suspense>
//       : <button onClick={() => setShow(true)}>Show Report</button>;
//   }

// ── Challenge 3 (MEDIUM) ──
// You have a list of 50,000 users. The page loads but scrolling is choppy.
// Describe the fix and write the key code structure.
//
// ANSWER:
//   Use react-window's FixedSizeList (if rows are same height) or
//   VariableSizeList (different heights). The list only renders ~15-20 DOM
//   nodes regardless of total count:
//
//   import { FixedSizeList } from 'react-window';
//
//   const UserRow = ({ index, style }: { index: number; style: CSSProperties }) => (
//     <div style={style}>{users[index].name}</div>
//   );
//
//   <FixedSizeList height={600} itemCount={users.length} itemSize={50} width="100%">
//     {UserRow}
//   </FixedSizeList>

// ── Challenge 4 (MEDIUM) ──
// A search input filters a large list. While filtering, the input feels
// laggy — keystrokes don't appear immediately. The filter takes ~80ms.
// Fix the lag without moving work to a Web Worker.
//
// ANSWER:
//   Use useTransition to mark the filter update as non-urgent:
//
//   const [isPending, startTransition] = useTransition();
//
//   function handleChange(e) {
//     setQuery(e.target.value);         // urgent — input stays snappy
//     startTransition(() => {
//       setFilteredList(filter(e.target.value));  // non-urgent — can lag
//     });
//   }
//
//   OR use useDeferredValue:
//   const deferredQuery = useDeferredValue(query);
//   // Use deferredQuery for the expensive filter, query for the input value.

// ── Challenge 5 (HARD) ──
// A component uses useCallback for a click handler:
//   const handleClick = useCallback(() => { doSomething(user.id); }, []);
// It has an empty dependency array. What bug does this create? How to fix it?
//
// ANSWER:
//   The closure captures `user.id` at mount time. If user.id changes later
//   (e.g., parent passes a different user), handleClick still uses the OLD value.
//   This is a stale closure bug — notoriously hard to debug.
//
//   Fix: include user.id in the dependency array:
//     useCallback(() => doSomething(user.id), [user.id])
//
//   Or use a ref for the latest value (when you need a stable ref AND fresh value):
//     const userIdRef = useRef(user.id);
//     useEffect(() => { userIdRef.current = user.id; });
//     const handleClick = useCallback(() => doSomething(userIdRef.current), []);

// ═══════════════════════════════════════════════════════════════
// SELF-ASSESSMENT — 10 QUESTIONS
// ═══════════════════════════════════════════════════════════════
//
// Answer before reading the answer. Score yourself.
//
//  Q1: What does LCP measure, and what's the target threshold?
//  A1: Largest Contentful Paint — time until the biggest visible element renders.
//      Target: < 2.5 s.
//
//  Q2: What are the four steps of React's render cycle?
//  A2: Trigger → Render (call component fn) → Reconcile (diff VDOM) → Commit (update DOM).
//
//  Q3: Why does `React.lazy(() => import('./Foo'))` fail for named exports?
//  A3: lazy() expects the promise to resolve to `{ default: Component }`.
//      Named exports don't have a default. Fix: `.then(m => ({ default: m.Foo }))`.
//
//  Q4: You use `memo` on a component but it still re-renders every time.
//      What's the most likely cause?
//  A4: A prop is an object or function created inline in the parent — new reference
//      every render, so shallow compare always sees "changed". Stabilize with
//      useMemo (objects) or useCallback (functions).
//
//  Q5: What's the difference between useMemo and useCallback?
//  A5: useMemo returns a memoized VALUE (the result of calling the factory fn).
//      useCallback returns a memoized FUNCTION REFERENCE.
//      useCallback(fn, deps) === useMemo(() => fn, deps).
//
//  Q6: A virtual list renders only visible rows. If the container is 400px tall
//      and each row is 40px, how many rows are rendered (approximately)?
//  A6: ~10 visible + a small overscan buffer (typically 3–5 rows above and below).
//      So ~16–20 DOM nodes, regardless of total item count.
//
//  Q7: What's the difference between `loading="lazy"` on an img and
//      URL.createObjectURL for a file preview?
//  A7: loading="lazy" is a browser hint to defer fetching a remote image.
//      URL.createObjectURL creates a local blob URL from an in-memory File/Blob
//      object — no network request, instant, but must be revoked to avoid leaks.
//
//  Q8: When would you use useTransition vs useDeferredValue?
//  A8: useTransition — when YOU control the state update causing the slow render.
//      useDeferredValue — when you receive a value as a prop or from context and
//      can't change when/how it updates. Both defer slow renders to keep UI snappy.
//
//  Q9: Why can't useTransition help when the slowness is a 500ms sort on a million items?
//  A9: Concurrent features work by yielding between REACT renders. Pure synchronous
//      JavaScript (a single sort call) can't be interrupted — React has no chance
//      to yield. Move the work to a Web Worker or break it into smaller tasks.
//
//  Q10: What CLS score does Google consider "good", and what's the most common cause?
//  A10: < 0.1 is "good". Most common cause: images without explicit width/height (or
//       aspect-ratio), so the browser doesn't reserve space and content shifts when
//       the image loads.
//
// SCORING:
//   0-3  — Re-read Sections 1, 4, 5, 8
//   4-6  — Progressing — focus on the sections you missed
//   7-9  — Solid grasp — try the practice challenges
//   10   — Ready for production performance audits

// ═══════════════════════════════════════════════════════════════
// DEMO — Virtualized list + lazy-loaded chart
// ═══════════════════════════════════════════════════════════════

const LazyChartDemo = lazy(() =>
    lazyModule(function ChartDemo({ data }: { data: number[] }) {
        return (
            <div style={{ padding: 16, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div style={{ fontWeight: 600, marginBottom: 12, color: "#1e293b" }}>
                    Performance Score Distribution
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 100 }}>
                    {data.map((v, i) => (
                        <div
                            key={i}
                            title={`${v}%`}
                            style={{
                                flex: 1,
                                height: `${v}%`,
                                background: v > 80 ? "#22c55e" : v > 50 ? "#f59e0b" : "#ef4444",
                                borderRadius: "2px 2px 0 0",
                                transition: "height 0.3s ease",
                            }}
                        />
                    ))}
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 12, color: "#64748b" }}>
                    <span style={{ color: "#22c55e" }}>■ Good (&gt;80)</span>
                    <span style={{ color: "#f59e0b" }}>■ Needs work (50-80)</span>
                    <span style={{ color: "#ef4444" }}>■ Poor (&lt;50)</span>
                </div>
            </div>
        );
    })
);

function Demo() {
    const [showChart, setShowChart]       = useState(false);
    const [activeTab, setActiveTab]       = useState<"list" | "search" | "transition">("list");
    const [searchQuery, setSearchQuery]   = useState("");
    const [isPending, startTransition]    = useTransition();
    const [filteredCount, setFilteredCount] = useState(10000);

    // Generate 10,000 fake user names for the virtualized list
    const users = useMemo(() =>
        Array.from({ length: 10000 }, (_, i) => {
            const firstNames = ["Alice", "Bob", "Carlos", "Diana", "Ethan", "Fatima", "George", "Hannah"];
            const lastNames  = ["Smith", "Johnson", "Patel", "Chen", "Williams", "Garcia", "Lee", "Kumar"];
            const first = firstNames[i % firstNames.length];
            const last  = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
            return `${first} ${last} (#${String(i + 1).padStart(5, "0")})`;
        }),
    []);

    const chartData = useMemo(
        () => Array.from({ length: 20 }, () => Math.round(20 + Math.random() * 80)),
        []
    );

    function handleSearch(e: ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        setSearchQuery(value);
        startTransition(() => {
            const count = value
                ? users.filter(u => u.toLowerCase().includes(value.toLowerCase())).length
                : users.length;
            setFilteredCount(count);
        });
    }

    const tabStyle = (tab: typeof activeTab): React.CSSProperties => ({
        padding: "6px 16px",
        borderRadius: 6,
        border: "none",
        cursor: "pointer",
        fontWeight: activeTab === tab ? 600 : 400,
        background: activeTab === tab ? "#6366f1" : "#f1f5f9",
        color: activeTab === tab ? "#fff" : "#374151",
        fontSize: 14,
    });

    return (
        <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 700, margin: "0 auto", padding: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                Day 24 — Code Splitting, Virtualization, Render Optimization
            </h2>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
                10,000 rows rendered with virtualization · Lazy-loaded chart · useTransition search
            </p>

            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <button style={tabStyle("list")}      onClick={() => setActiveTab("list")}>
                    Virtual List
                </button>
                <button style={tabStyle("search")}    onClick={() => setActiveTab("search")}>
                    useTransition Search
                </button>
                <button style={tabStyle("transition")} onClick={() => setActiveTab("transition")}>
                    useDeferredValue
                </button>
            </div>

            {activeTab === "list" && (
                <div>
                    <div style={{ marginBottom: 12, fontSize: 14, color: "#64748b" }}>
                        10,000 users — only ~20 DOM nodes exist at any time
                    </div>
                    <SimpleVirtualList items={users} rowHeight={44} visibleRows={12} />

                    <div style={{ marginTop: 20 }}>
                        <button
                            onClick={() => setShowChart(s => !s)}
                            style={{
                                padding: "8px 18px", borderRadius: 8, border: "none",
                                background: showChart ? "#ef4444" : "#6366f1",
                                color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14,
                            }}
                        >
                            {showChart ? "Hide Chart (lazy)" : "Load Chart (lazy)"}
                        </button>
                        <span style={{ marginLeft: 10, fontSize: 13, color: "#9ca3af" }}>
                            {showChart ? "" : "Chart chunk downloads on first click"}
                        </span>
                    </div>

                    {showChart && (
                        <div style={{ marginTop: 16 }}>
                            <Suspense fallback={
                                <div style={{ padding: 24, background: "#f8fafc", borderRadius: 8, color: "#94a3b8", textAlign: "center" }}>
                                    Loading chart chunk…
                                </div>
                            }>
                                <LazyChartDemo data={chartData} />
                            </Suspense>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "search" && (
                <div>
                    <div style={{ marginBottom: 12, fontSize: 14, color: "#64748b" }}>
                        useTransition keeps the input responsive while filtering 10,000 items
                    </div>
                    <input
                        value={searchQuery}
                        onChange={handleSearch}
                        placeholder="Type to filter 10,000 users…"
                        style={{
                            width: "100%", padding: "8px 12px", borderRadius: 8,
                            border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box",
                        }}
                    />
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                        {isPending
                            ? <span style={{ color: "#f59e0b" }}>⏳ Filtering…</span>
                            : <span style={{ color: "#22c55e" }}>✓ {filteredCount.toLocaleString()} results</span>
                        }
                    </div>
                    <div style={{
                        marginTop: 8, padding: 12, background: "#f1f5f9",
                        borderRadius: 8, fontSize: 13, color: "#475569",
                    }}>
                        The input value updates synchronously (urgent).
                        The result count updates in a transition (non-urgent).
                        Even during heavy filtering, typing stays instant.
                    </div>
                </div>
            )}

            {activeTab === "transition" && (
                <div>
                    <div style={{ marginBottom: 12, fontSize: 14, color: "#64748b" }}>
                        useDeferredValue fades stale results while fresh results compute
                    </div>
                    <DeferredList />
                </div>
            )}

            <div style={{ marginTop: 28, padding: 16, background: "#fffbeb", borderRadius: 8, border: "1px solid #fde68a" }}>
                <strong style={{ fontSize: 14, color: "#92400e" }}>Key Reminders</strong>
                <ul style={{ margin: "8px 0 0 0", paddingLeft: 20, fontSize: 13, color: "#78350f", lineHeight: 1.8 }}>
                    <li>Measure first with React DevTools Profiler before optimizing anything</li>
                    <li>Code splitting at route level gives the biggest wins with the least effort</li>
                    <li>Virtualize any list with more than ~100 items</li>
                    <li>Most useMemo/useCallback calls are premature — only add after profiling</li>
                    <li>Set width/height on every img to prevent layout shift (CLS)</li>
                </ul>
            </div>
        </div>
    );
}

export default Demo;
