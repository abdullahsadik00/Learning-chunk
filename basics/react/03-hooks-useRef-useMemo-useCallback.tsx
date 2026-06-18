// ═══════════════════════════════════════════════════════════════
// REACT 03: useRef · useMemo · useCallback  (Day 14a)
// ═══════════════════════════════════════════════════════════════
//
// MENTAL MODELS:
//
//  useRef      — a box that holds a mutable value across renders
//                WITHOUT triggering re-renders. Like an instance variable.
//
//  useMemo     — memoizes the RESULT of a function.
//                Returns cached value when deps haven't changed.
//
//  useCallback — memoizes a FUNCTION REFERENCE.
//                Equivalent to useMemo(() => fn, deps).

import React, {
    useRef, useMemo, useCallback, useState, useEffect,
    useImperativeHandle, forwardRef, memo, MutableRefObject, RefObject
} from 'react';

// ───────────────────────────────────────────────────────────────
// 1. useRef — THREE USE CASES
// ───────────────────────────────────────────────────────────────

// ── 1a. DOM reference ──
function FocusInput() {
    const inputRef = useRef<HTMLInputElement>(null);

    const focusIt  = () => inputRef.current?.focus();
    const selectIt = () => inputRef.current?.select();
    const clearIt  = () => { if (inputRef.current) inputRef.current.value = ""; };

    return (
        <div>
            <input ref={inputRef} type="text" placeholder="Click buttons…" />
            <button onClick={focusIt}>Focus</button>
            <button onClick={selectIt}>Select All</button>
            <button onClick={clearIt}>Clear</button>
        </div>
    );
}

// ── 1b. Storing mutable values (does NOT trigger re-render) ──
function StopWatch() {
    const [elapsed, setElapsed]     = useState(0);
    const [running, setRunning]     = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const start = () => {
        if (running) return;
        setRunning(true);
        intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    };

    const stop = () => {
        setRunning(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const reset = () => { stop(); setElapsed(0); };

    // Cleanup on unmount
    useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

    return (
        <div>
            <p>{elapsed}s</p>
            <button onClick={start} disabled={running}>Start</button>
            <button onClick={stop}  disabled={!running}>Stop</button>
            <button onClick={reset}>Reset</button>
        </div>
    );
}

// ── 1c. Avoiding stale closures ──
function AlertAfterDelay() {
    const [count, setCount] = useState(0);
    const countRef = useRef(count);

    // Keep ref in sync with state
    useEffect(() => { countRef.current = count; }, [count]);

    const showAlert = () => {
        setTimeout(() => {
            // ❌ count is stale — captured at click time
            // alert(`Stale count: ${count}`);

            // ✅ countRef.current is always the latest value
            alert(`Current count: ${countRef.current}`);
        }, 3000);
    };

    return (
        <div>
            <p>Count: {count}</p>
            <button onClick={() => setCount(c => c + 1)}>+</button>
            <button onClick={showAlert}>Alert in 3s</button>
        </div>
    );
}

// ── 1d. Storing previous value ──
function usePrevious<T>(value: T): T | undefined {
    const ref = useRef<T>();
    useEffect(() => { ref.current = value; }); // no deps → runs after every render
    return ref.current; // previous render's value
}

function PreviousCounter() {
    const [count, setCount] = useState(0);
    const prev = usePrevious(count);

    return (
        <div>
            <p>Current: {count} | Previous: {prev ?? "—"}</p>
            <button onClick={() => setCount(c => c + 1)}>+</button>
        </div>
    );
}

// ── 1e. Callback ref — called when element mounts/unmounts ──
function MeasuredDiv() {
    const [height, setHeight] = useState(0);

    const measuredRef = useCallback((node: HTMLDivElement | null) => {
        if (node) setHeight(node.getBoundingClientRect().height);
    }, []);

    return (
        <div>
            <div ref={measuredRef} style={{ padding: 20 }}>Measure me!</div>
            <p>Height: {height}px</p>
        </div>
    );
}

// ───────────────────────────────────────────────────────────────
// 2. forwardRef — passing refs to child components
// ───────────────────────────────────────────────────────────────
//
// By default, you CANNOT pass a ref to a function component.
// forwardRef wraps the component to accept an external ref.

interface FancyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

const FancyInput = forwardRef<HTMLInputElement, FancyInputProps>(
    ({ label, ...props }, ref) => (
        <div>
            <label>{label}</label>
            <input ref={ref} className="fancy-input" {...props} />
        </div>
    )
);
FancyInput.displayName = "FancyInput";

function ParentWithRef() {
    const ref = useRef<HTMLInputElement>(null);
    return (
        <div>
            <FancyInput ref={ref} label="Email" type="email" />
            <button onClick={() => ref.current?.focus()}>Focus Input</button>
        </div>
    );
}

// ── 2a. useImperativeHandle — expose a limited API ──
//
// Instead of exposing the whole DOM node, you choose exactly what
// the parent can call. Principle of least privilege.

interface VideoHandle {
    play(): void;
    pause(): void;
    seek(seconds: number): void;
}

const VideoPlayer = forwardRef<VideoHandle, { src: string }>(({ src }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useImperativeHandle(ref, () => ({
        play:  () => videoRef.current?.play(),
        pause: () => videoRef.current?.pause(),
        seek:  (s) => { if (videoRef.current) videoRef.current.currentTime = s; },
        // NOT exposing the raw DOM node!
    }), []);

    return <video ref={videoRef} src={src} />;
});
VideoPlayer.displayName = "VideoPlayer";

function VideoPage() {
    const playerRef = useRef<VideoHandle>(null);
    return (
        <div>
            <VideoPlayer ref={playerRef} src="/sample.mp4" />
            <button onClick={() => playerRef.current?.play()}>▶ Play</button>
            <button onClick={() => playerRef.current?.pause()}>⏸ Pause</button>
            <button onClick={() => playerRef.current?.seek(0)}>↩ Restart</button>
        </div>
    );
}

// ───────────────────────────────────────────────────────────────
// 3. useMemo — memoize COMPUTED VALUES
// ───────────────────────────────────────────────────────────────
//
// const result = useMemo(() => expensiveComputation(a, b), [a, b]);
//
// • Caches the RETURN VALUE
// • Only recomputes when dependencies change
// • Same reference = no child re-renders (if child is memo'd)

interface Product { id: string; name: string; price: number; category: string; }

function ProductList({
    products,
    filter,
    sortBy,
}: {
    products: Product[];
    filter: string;
    sortBy: "name" | "price";
}) {
    // Without useMemo: runs on EVERY render (even unrelated state changes)
    // With useMemo: only runs when products, filter, or sortBy change
    const processed = useMemo(() => {
        let result = filter
            ? products.filter(p =>
                  p.name.toLowerCase().includes(filter.toLowerCase()) ||
                  p.category.toLowerCase().includes(filter.toLowerCase())
              )
            : products;

        return [...result].sort((a, b) =>
            sortBy === "price" ? a.price - b.price : a.name.localeCompare(b.name)
        );
    }, [products, filter, sortBy]);

    // Stats — also memoized (depends on processed list)
    const stats = useMemo(
        () => ({
            count:    processed.length,
            avgPrice: processed.reduce((s, p) => s + p.price, 0) / (processed.length || 1),
        }),
        [processed]
    );

    return (
        <div>
            <p>{stats.count} products · avg ${stats.avgPrice.toFixed(2)}</p>
            <ul>{processed.map(p => <li key={p.id}>{p.name} ${p.price}</li>)}</ul>
        </div>
    );
}

// useMemo for REFERENTIAL EQUALITY
// When an object/array is passed to a memo'd child, a new
// literal creates a new reference every render → child always re-renders.
function ParentRefEquality() {
    const [count, setCount] = useState(0);
    const [name, setName]   = useState("");

    // ❌ New object every render → MemoChild always re-renders
    // const config = { threshold: 10, max: 100 };

    // ✅ Same reference when deps don't change → MemoChild skips render
    const config = useMemo(() => ({ threshold: 10, max: 100 }), []);

    return (
        <div>
            <input value={name} onChange={e => setName(e.target.value)} />
            <button onClick={() => setCount(c => c + 1)}>{count}</button>
            {/* MemoChild won't re-render when count or name changes */}
            {/* <MemoChild config={config} /> */}
        </div>
    );
}

// ───────────────────────────────────────────────────────────────
// 4. useCallback — memoize FUNCTION REFERENCES
// ───────────────────────────────────────────────────────────────
//
// const fn = useCallback(() => { doSomething(a, b); }, [a, b]);
//
// • Returns the SAME function reference when deps don't change
// • useCallback(fn, deps)  ≡  useMemo(() => fn, deps)
// • Main use: passing callbacks to memo() children
//             or as deps of useEffect

const ExpensiveList = memo(function ExpensiveList({
    items,
    onItemClick,
}: {
    items: { id: string; name: string }[];
    onItemClick: (id: string) => void;
}) {
    console.log("ExpensiveList rendered");
    return (
        <ul>
            {items.map(item => (
                <li key={item.id} onClick={() => onItemClick(item.id)}>
                    {item.name}
                </li>
            ))}
        </ul>
    );
});

function ParentWithCallback() {
    const [selected, setSelected] = useState<string | null>(null);
    const [count, setCount]       = useState(0);

    const items = useMemo(
        () => [{ id: "1", name: "Apple" }, { id: "2", name: "Banana" }],
        [] // static, never changes
    );

    // ❌ Without useCallback — new function every render
    //    → ExpensiveList ALWAYS re-renders (memo is useless)
    // const handleClick = (id: string) => setSelected(id);

    // ✅ With useCallback — same function reference
    //    → ExpensiveList only re-renders when function changes (never here)
    const handleClick = useCallback((id: string) => {
        setSelected(id);
    }, []); // empty deps — setSelected is stable

    return (
        <div>
            <p>Selected: {selected}</p>
            <button onClick={() => setCount(c => c + 1)}>Re-render parent ({count})</button>
            <ExpensiveList items={items} onItemClick={handleClick} />
        </div>
    );
}

// ───────────────────────────────────────────────────────────────
// 5. WHEN TO MEMOIZE — THE DECISION GUIDE
// ───────────────────────────────────────────────────────────────
//
// USE useMemo WHEN:
//  ✅ Expensive computation (sorting, filtering large arrays)
//  ✅ Creating objects/arrays passed to memo() children
//  ✅ Value used as dependency of another useMemo/useEffect
//
// USE useCallback WHEN:
//  ✅ Passing callbacks to memo() children
//  ✅ Function is a dep of useEffect
//  ✅ Same function is passed to many children
//
// DON'T USE WHEN:
//  ❌ Simple calculations (count * 2)
//  ❌ Primitive values (already stable)
//  ❌ No memoized children depend on the reference
//  ❌ Premature optimization — PROFILE FIRST!
//
// MEMOIZATION COST: memory + comparison overhead.
// Not free — only helps if the saved work > memoization cost.

function OptimizationExamples() {
    const [count, setCount] = useState(0);

    // ❌ Unnecessary — count * 2 is trivial
    const doubled = useMemo(() => count * 2, [count]);

    // ✅ Just use directly
    const doubledSimple = count * 2;

    // ❌ Unnecessary — no memo() child uses this reference
    const handleLog = useCallback(() => console.log("clicked"), []);

    return (
        <div>
            <p>{doubledSimple}</p>
            <button onClick={() => setCount(c => c + 1)}>+</button>
        </div>
    );
}

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

// Q1: What is the difference between useRef and useState?
// A: useRef:   changing .current does NOT cause re-render. Used for
//              DOM refs, timers, mutable values across renders.
//    useState: changing state DOES cause re-render. Used for
//              data that affects what's displayed.

// Q2: When would you use useLayoutEffect vs useLayoutEffect?
// A: useLayoutEffect runs synchronously BEFORE the browser paints.
//    Use when you need to measure/mutate DOM before the user sees it
//    (avoids visual flicker). For everything else, useEffect.

// Q3: Implement a hook that tracks mouse position
function useMousePosition() {
    const [pos, setPos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", handler);
        return () => window.removeEventListener("mousemove", handler);
    }, []);

    return pos;
}

// Q4: What's wrong with this code?
// const MyComponent = ({ onClick }) => {
//     const memoizedFn = useCallback(() => {
//         onClick(newData);    // ❌ onClick used but not in deps!
//     }, []);                  //    stale closure over onClick
// };
// Fix: useCallback(() => { onClick(newData); }, [onClick])
// And in parent: const handler = useCallback(() => {...}, []) — so it's stable

// Q5: Implement a SearchBox that debounces search and memoizes results
function SearchBox({ items }: { items: string[] }) {
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebounce(query, 300);

    const results = useMemo(
        () => items.filter(i => i.toLowerCase().includes(debouncedQuery.toLowerCase())),
        [items, debouncedQuery]
    );

    return (
        <div>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search…" />
            <ul>{results.map(r => <li key={r}>{r}</li>)}</ul>
        </div>
    );
}

// Local re-implementation of useDebounce for this file
function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

export {
    FocusInput, StopWatch, AlertAfterDelay, usePrevious, PreviousCounter,
    MeasuredDiv, FancyInput, ParentWithRef, VideoPlayer, VideoPage,
    ProductList, ParentRefEquality, ExpensiveList, ParentWithCallback,
    OptimizationExamples, useMousePosition, SearchBox, useDebounce,
};
