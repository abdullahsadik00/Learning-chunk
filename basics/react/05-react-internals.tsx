// ═══════════════════════════════════════════════════════════════
// REACT 05: VIRTUAL DOM · FIBER · RECONCILIATION  (Day 15a)
// ═══════════════════════════════════════════════════════════════
//
// These concepts explain HOW React works under the hood.
// Understanding them makes you better at:
//  • Debugging performance issues
//  • Writing keys correctly
//  • Understanding why concurrent features exist

import React, { useState, useTransition, useDeferredValue, useMemo, memo } from 'react';

// ───────────────────────────────────────────────────────────────
// 1. VIRTUAL DOM
// ───────────────────────────────────────────────────────────────
//
// WHY NOT DIRECT DOM MANIPULATION?
//  • DOM is a heavy object with hundreds of properties
//  • Every DOM read/write can trigger reflow/repaint (expensive)
//  • Batch updates are far more efficient
//
// HOW VIRTUAL DOM WORKS:
//
//  ┌─────────────────────────────────────────────────────────┐
//  │  1. State/props change                                  │
//  │  2. React creates NEW virtual DOM tree (plain objects)  │
//  │  3. React DIFFS new tree vs previous tree               │
//  │  4. React calculates MINIMUM changes needed             │
//  │  5. React BATCHES and applies only those changes        │
//  └─────────────────────────────────────────────────────────┘
//
// A virtual element is just a plain object:
//  {
//    type: 'div',
//    props: {
//      className: 'container',
//      children: [
//        { type: 'h1', props: { children: 'Hello' } }
//      ]
//    }
//  }
//
// This is what React.createElement / JSX produces.
//
// JSX:
//   <div className="box"><h1>Hi</h1></div>
//
// Compiled:
//   React.createElement("div", { className: "box" },
//     React.createElement("h1", null, "Hi"))

// ───────────────────────────────────────────────────────────────
// 2. RECONCILIATION ALGORITHM
// ───────────────────────────────────────────────────────────────
//
// React's rules for diffing two trees:
//
// RULE 1 — Different element type → destroy and rebuild subtree
//   Before: <div>  →  After: <span>
//   React unmounts the entire <div> subtree and builds fresh <span>
//
// RULE 2 — Same element type → update props, recurse on children
//   Before: <div className="a">  →  After: <div className="b">
//   React only updates className attribute — DOM node is KEPT
//
// RULE 3 — Component element, same type → same instance, re-render
//   Before: <Counter />  →  After: <Counter />
//   Same instance, props updated, render() called again
//
// RULE 4 — List reconciliation by KEY
//   Without keys: compare by position → expensive
//   With keys:    compare by identity → efficient (just move nodes)
//
// KEY EXAMPLE:
//  Before: [<li key="a">A</li>, <li key="b">B</li>, <li key="c">C</li>]
//  After:  [<li key="b">B</li>, <li key="c">C</li>]
//
//  Without key: React updates position 0 (A→B), position 1 (B→C), removes pos 2
//               3 DOM operations
//  With key:    React knows "a" was removed, moves b and c
//               1 DOM remove + 2 moves (or even 0 moves if reusing)

// ───────────────────────────────────────────────────────────────
// 3. FIBER ARCHITECTURE (React 16+)
// ───────────────────────────────────────────────────────────────
//
// PROBLEM WITH OLD "STACK" RECONCILER:
//  • Synchronous, recursive — couldn't be paused
//  • Long renders blocked the main thread (janky animations, slow input)
//  • No ability to prioritize updates
//
// FIBER SOLUTIONS:
//  1. INCREMENTAL RENDERING — split work into chunks, yield to browser
//  2. PRIORITY LEVELS — user clicks > data updates > analytics
//  3. CONCURRENT MODE — prepare multiple UI versions simultaneously
//  4. SUSPENSE — pause render until data is ready
//
// FIBER NODE STRUCTURE:
//  Each component in the tree gets a "fiber" (a plain JS object):
//
//  FiberNode {
//    type:        Component | string ('div', 'span', …)
//    key:         string | null
//    props:       object
//    stateNode:   DOM node | class component instance
//
//    // Linked list pointers
//    return:      Fiber | null  ← parent
//    child:       Fiber | null  ← first child
//    sibling:     Fiber | null  ← next sibling
//
//    // Work tracking
//    alternate:   Fiber | null  ← previous version (double-buffering)
//    flags:       number        ← what DOM changes to make
//    lanes:       number        ← priority of this work
//  }
//
// WORK LOOP (simplified):
//  while (workInProgress !== null && !shouldYield()) {
//    workInProgress = performUnitOfWork(workInProgress);
//  }
//  if (workInProgress !== null) {
//    scheduleCallback(workLoop); // yield to browser, resume later
//  }
//
// TWO PHASES:
//
//  PHASE 1 — RENDER (can be interrupted):
//    • Build work-in-progress fiber tree
//    • Call render() / function body
//    • Calculate what changed
//    • No DOM mutations yet
//
//  PHASE 2 — COMMIT (cannot be interrupted):
//    • Apply all DOM mutations
//    • Run effects (useEffect, useLayoutEffect)
//    • Must complete in one synchronous pass

// ───────────────────────────────────────────────────────────────
// 4. CONCURRENT FEATURES (React 18)
// ───────────────────────────────────────────────────────────────

// ── useTransition — mark updates as "non-urgent" ──
//
// Without transitions: typing in search and filtering 10,000 items
// freezes the input because both updates happen synchronously.
//
// With transitions: input update is urgent (happens immediately),
// filtering is non-urgent (can be interrupted if user types again).

function SearchWithTransition() {
    const [query, setQuery]       = useState("");
    const [results, setResults]   = useState<string[]>([]);
    const [isPending, startTransition] = useTransition();

    const allItems = Array.from({ length: 10000 }, (_, i) => `Item ${i}`);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // URGENT: update input immediately (user sees their typing)
        setQuery(e.target.value);

        // NON-URGENT: filtering can lag, can be interrupted
        startTransition(() => {
            setResults(allItems.filter(item =>
                item.toLowerCase().includes(e.target.value.toLowerCase())
            ));
        });
    };

    return (
        <div>
            <input value={query} onChange={handleChange} placeholder="Search…" />
            {isPending && <span> Updating…</span>}
            <ul>
                {results.slice(0, 20).map(r => <li key={r}>{r}</li>)}
            </ul>
        </div>
    );
}

// ── useDeferredValue — "lag" a value intentionally ──
//
// Like useTransition but for values you don't control (e.g. from props).
// deferredQuery lags behind query during heavy renders.
// Show stale content (dimmed) while new content computes.

function DeferredSearch({ items }: { items: string[] }) {
    const [query, setQuery] = useState("");
    const deferredQuery = useDeferredValue(query);

    const isStale = query !== deferredQuery;

    const filtered = useMemo(
        () => items.filter(i => i.toLowerCase().includes(deferredQuery.toLowerCase())),
        [items, deferredQuery]
    );

    return (
        <div>
            <input value={query} onChange={e => setQuery(e.target.value)} />
            <ul style={{ opacity: isStale ? 0.6 : 1, transition: "opacity 0.2s" }}>
                {filtered.map(i => <li key={i}>{i}</li>)}
            </ul>
        </div>
    );
}

// ── useTransition vs useDeferredValue ──
//
//  useTransition  — you control the state setter, wrap it in startTransition
//  useDeferredValue — you receive a value from outside (props, parent state)
//                     just defer your consumption of it

// ───────────────────────────────────────────────────────────────
// 5. WHY REACT STATE IS IMMUTABLE
// ───────────────────────────────────────────────────────────────
//
// React uses Object.is() (===) to compare old vs new state.
// If you mutate the same object/array reference:
//
//   const arr = state.items;
//   arr.push("new");   // mutated!
//   setState(arr);     // same reference → Object.is(old, new) = true
//                      // React SKIPS the re-render! Bug!
//
// ALWAYS return new references:
//   setState(prev => [...prev, "new"]);
//   setState(prev => ({ ...prev, name: "Alice" }));
//
// For deep updates, consider Immer:
//   setState(produce(draft => { draft.a.b.c = 1; }));

// ───────────────────────────────────────────────────────────────
// 6. STRICT MODE — development double-render
// ───────────────────────────────────────────────────────────────
//
// <React.StrictMode> in development:
//  • Renders components TWICE (catches impure renders)
//  • Runs effects TWICE (catches non-idempotent effects)
//  • Warns about deprecated APIs
//
// This is why console.logs sometimes appear twice in development!
// In production, no double renders — StrictMode has no runtime cost.

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

// Q1: What is the Virtual DOM and why does React use it?
// A: The Virtual DOM is a lightweight JS object representation of the real DOM.
//    React uses it to:
//    1. Batch multiple state changes into one DOM update
//    2. Calculate the minimum set of real DOM operations needed (diffing)
//    3. Avoid expensive direct DOM reads/writes on every state change

// Q2: What are the reconciliation rules React uses when diffing trees?
// A: 1. Different element type → unmount old subtree, mount new one
//    2. Same element type → keep DOM node, update changed props only
//    3. Same component type → same instance, re-render with new props
//    4. List children → match by KEY for efficient reordering

// Q3: What problem does Fiber solve that the old Stack reconciler couldn't?
// A: The Stack reconciler was synchronous and recursive — it couldn't pause.
//    Long renders blocked the main thread causing UI freezes.
//    Fiber makes work INTERRUPTIBLE: React can pause after each "unit of work",
//    let the browser handle user input/animations, then resume later.

// Q4: What is useTransition used for?
// A: Marks a state update as "non-urgent" so React can interrupt it if
//    higher-priority updates (user input) come in.
//    isPending = true while the deferred update is computing.
//    Use for: filtering large lists, page transitions, heavy computations.

// Q5: Why does React's StrictMode render components twice?
// A: To detect impure render functions and non-idempotent effects.
//    Pure render: given same props/state, always returns same output.
//    If your component has side effects in render, double-render exposes it.
//    This only happens in development mode.

// Demo: component that shows render behavior
function RenderCounter({ label }: { label: string }) {
    const renderCount = React.useRef(0);
    renderCount.current += 1;

    // In StrictMode dev: this will show 2, 4, 6… (double renders)
    // In production: 1, 2, 3…
    return <p>{label} rendered {renderCount.current} times</p>;
}

export { SearchWithTransition, DeferredSearch, RenderCounter };

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
    const SAMPLE_ITEMS = Array.from({ length: 50 }, (_, i) =>
        ['React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt', 'Remix', 'Astro', 'SvelteKit', 'Gatsby'][i % 10] + ` v${i + 1}`
    );
    return (
        <div>
            <Box
                title="useTransition — non-urgent update"
                sub="Type fast — the input stays responsive while the 10 000-item filter runs in background. Watch isPending."
            >
                <SearchWithTransition />
            </Box>

            <Box
                title="useDeferredValue — deferred filter"
                sub="Same idea but declarative — React defers re-rendering the stale list until the browser is idle."
            >
                <DeferredSearch items={SAMPLE_ITEMS} />
            </Box>

            <Box title="RenderCounter — how many times has this component rendered?">
                <RenderCounter label="RenderCounter" />
            </Box>
        </div>
    );
}
