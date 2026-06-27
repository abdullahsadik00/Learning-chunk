// ═══════════════════════════════════════════════════════════════
// REACT 02: HOOKS — useState & useEffect  (Day 13)
// ═══════════════════════════════════════════════════════════════
//
// THE RULES OF HOOKS:
//  1. Call hooks only at the TOP LEVEL — never inside loops, conditions,
//     or nested functions (React relies on call order to track state)
//  2. Call hooks only from REACT FUNCTION COMPONENTS or other hooks
//  3. Hook names must start with "use"

import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';

// ───────────────────────────────────────────────────────────────
// 1. useState — DEEP DIVE
// ───────────────────────────────────────────────────────────────
//
// const [state, setState] = useState(initialValue)
//
// • setState(newValue)         — direct update
// • setState(prev => newValue) — functional update (use when new state
//                                depends on previous — avoids stale closures)
// • useState(() => compute())  — lazy init (runs once, not every render)

// ── 1a. Primitive state ──
function PrimitiveState() {
    const [count, setCount] = useState(0);
    const [name, setName]   = useState("");
    const [flag, setFlag]   = useState(false);

    // ✅ Functional update — safe when new value depends on old
    const increment = () => setCount(prev => prev + 1);

    // ❌ Direct update — can be stale in async/batched contexts
    // const increment = () => setCount(count + 1);

    return (
        <div>
            <p>{count}</p>
            <button onClick={increment}>+</button>
            <button onClick={() => setFlag(f => !f)}>{flag ? "ON" : "OFF"}</button>
        </div>
    );
}

// ── 1b. Lazy initialization (expensive computation) ──
function LazyInit() {
    // ❌ BAD: runs every render
    // const [data, setData] = useState(expensiveComputation());

    // ✅ GOOD: runs only once on mount
    const [data, setData] = useState(() => {
        // e.g., parse JSON from localStorage
        const saved = localStorage.getItem("data");
        return saved ? JSON.parse(saved) : [];
    });

    return <pre>{JSON.stringify(data)}</pre>;
}

// ── 1c. Object state — MUST spread to avoid mutation ──
interface UserForm { name: string; email: string; age: number; }

function ObjectState() {
    const [form, setForm] = useState<UserForm>({ name: "", email: "", age: 0 });

    // ❌ WRONG: mutates state directly (won't trigger re-render)
    // const updateName = (n: string) => { form.name = n; setForm(form); };

    // ✅ CORRECT: new object
    const updateField = <K extends keyof UserForm>(key: K, value: UserForm[K]) =>
        setForm(prev => ({ ...prev, [key]: value }));

    // Generic handler for form inputs
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === "number" ? Number(value) : value,
        }));
    };

    return (
        <form>
            <input name="name"  value={form.name}  onChange={handleChange} />
            <input name="email" value={form.email} onChange={handleChange} />
            <input name="age"   value={form.age}   onChange={handleChange} type="number" />
        </form>
    );
}

// ── 1d. Array state — common operations ──
interface Todo { id: string; text: string; done: boolean; }

function ArrayState() {
    const [todos, setTodos] = useState<Todo[]>([]);

    // Add
    const add = (text: string) =>
        setTodos(prev => [...prev, { id: crypto.randomUUID(), text, done: false }]);

    // Remove
    const remove = (id: string) =>
        setTodos(prev => prev.filter(t => t.id !== id));

    // Toggle
    const toggle = (id: string) =>
        setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

    // Update text
    const updateText = (id: string, text: string) =>
        setTodos(prev => prev.map(t => t.id === id ? { ...t, text } : t));

    // Reorder (swap adjacent items)
    const moveUp = (index: number) => {
        if (index === 0) return;
        setTodos(prev => {
            const next = [...prev];
            [next[index - 1], next[index]] = [next[index], next[index - 1]];
            return next;
        });
    };

    return (
        <ul>
            {todos.map((todo, i) => (
                <li key={todo.id}>
                    <input type="checkbox" checked={todo.done} onChange={() => toggle(todo.id)} />
                    <span style={{ textDecoration: todo.done ? "line-through" : "none" }}>
                        {todo.text}
                    </span>
                    <button onClick={() => remove(todo.id)}>✕</button>
                    <button onClick={() => moveUp(i)}>↑</button>
                </li>
            ))}
        </ul>
    );
}

// ── 1e. Batching (React 18+) ──
// React 18 batches ALL state updates automatically — even in async callbacks.
// Previously only batched inside React event handlers.
//
// function BatchingDemo() {
//     const handleClick = async () => {
//         await someAsyncOp();
//         setA(1); // batched ← React 18
//         setB(2); // batched ← React 18  → ONE re-render total
//     };
// }
//
// To force an immediate update (rare): import { flushSync } from 'react-dom'
// flushSync(() => setState(x)); // DOM updated before next line

// ───────────────────────────────────────────────────────────────
// 2. useEffect — DEEP DIVE
// ───────────────────────────────────────────────────────────────
//
// useEffect(() => {
//     // EFFECT: runs AFTER render, syncs component with external world
//     return () => {
//         // CLEANUP: runs before next effect OR on unmount
//     };
// }, [dependencies]);
//
// Dependencies control WHEN effect runs:
//   No array  → after EVERY render
//   []        → once on mount (like componentDidMount)
//   [a, b]    → when a or b change (like componentDidUpdate for those values)

// ── 2a. Data fetching pattern ──
interface User { id: string; name: string; email: string; }

function UserProfile({ userId }: { userId: string }) {
    const [user, setUser]       = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);

    useEffect(() => {
        // Reset on userId change
        setLoading(true);
        setError(null);
        setUser(null);

        const controller = new AbortController();

        async function fetchUser() {
            try {
                const res = await fetch(`/api/users/${userId}`, {
                    signal: controller.signal,
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                setUser(data);
            } catch (err) {
                if ((err as Error).name !== "AbortError") {
                    setError((err as Error).message);
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }

        fetchUser();

        // Cleanup: cancel in-flight request when userId changes or component unmounts
        return () => controller.abort();
    }, [userId]);

    if (loading) return <p>Loading…</p>;
    if (error)   return <p style={{ color: "red" }}>Error: {error}</p>;
    if (!user)   return null;
    return <div><h2>{user.name}</h2><p>{user.email}</p></div>;
}

// ── 2b. Subscription pattern ──
function ChatRoom({ roomId }: { roomId: string }) {
    const [messages, setMessages] = useState<string[]>([]);

    useEffect(() => {
        // Connect
        const socket = new WebSocket(`wss://chat.example.com/rooms/${roomId}`);
        socket.onmessage = (e) => setMessages(prev => [...prev, e.data]);

        // Cleanup: disconnect when roomId changes or unmounts
        return () => socket.close();
    }, [roomId]);

    return <ul>{messages.map((m, i) => <li key={i}>{m}</li>)}</ul>;
}

// ── 2c. Event listener pattern ──
function useWindowSize() {
    const [size, setSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    useEffect(() => {
        const handleResize = () =>
            setSize({ width: window.innerWidth, height: window.innerHeight });

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []); // Empty deps: handler doesn't use any reactive value

    return size;
}

// ── 2d. Timer pattern ──
function Countdown({ from }: { from: number }) {
    const [timeLeft, setTimeLeft] = useState(from);

    useEffect(() => {
        setTimeLeft(from); // reset when 'from' changes
    }, [from]);

    useEffect(() => {
        if (timeLeft <= 0) return;
        const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
        return () => clearInterval(id);
    }, [timeLeft]);

    return <p>{timeLeft > 0 ? `${timeLeft}s` : "Done!"}</p>;
}

// ── 2e. Document title sync ──
function useDocumentTitle(title: string) {
    useEffect(() => {
        const prev = document.title;
        document.title = title;
        return () => { document.title = prev; };
    }, [title]);
}

// ───────────────────────────────────────────────────────────────
// 3. COMMON useEffect MISTAKES
// ───────────────────────────────────────────────────────────────

function EffectMistakes() {
    const [count, setCount] = useState(0);
    const [filter, setFilter] = useState("all");

    // ❌ MISTAKE 1: Missing dependency — ESLint react-hooks/exhaustive-deps will warn
    // useEffect(() => { fetch(`/api?filter=${filter}`); }, []);
    //                                                       ^ filter missing!

    // ❌ MISTAKE 2: Object/array in deps — new reference every render!
    // const options = { page: 1 }; // new object each render
    // useEffect(() => { doSomething(options); }, [options]); // runs every render!
    // Fix: extract primitive: [options.page]

    // ❌ MISTAKE 3: Function in deps without useCallback
    // useEffect(() => { onSave(data); }, [data, onSave]);
    // If onSave is inline in parent → infinite loop!
    // Fix: wrap parent's function in useCallback

    // ❌ MISTAKE 4: Stale closure with setInterval
    // useEffect(() => {
    //     const id = setInterval(() => {
    //         console.log(count); // always logs initial value — stale!
    //         setCount(count + 1); // always sets to 1!
    //     }, 1000);
    //     return () => clearInterval(id);
    // }, []); // count missing

    // ✅ FIX: use functional update — no closure over count
    useEffect(() => {
        const id = setInterval(() => setCount(c => c + 1), 1000);
        return () => clearInterval(id);
    }, []);

    // ❌ MISTAKE 5: async function as effect directly
    // useEffect(async () => { ... }, []); // returns Promise, not cleanup!

    // ✅ FIX: define async function inside
    useEffect(() => {
        async function load() {
            const res = await fetch("/api/data");
            // setData(await res.json());
        }
        load();
    }, []);

    // ❌ MISTAKE 6: Infinite loop
    // const [data, setData] = useState(null);
    // useEffect(() => { setData(fetch()); }, [data]); // data changes → effect → data changes…

    return <p>Count: {count}</p>;
}

// ───────────────────────────────────────────────────────────────
// 4. useEffect vs useLayoutEffect
// ───────────────────────────────────────────────────────────────
//
// RENDER CYCLE TIMELINE:
//
//  1. React renders component (builds virtual DOM)
//  2. React commits changes to REAL DOM
//  3. useLayoutEffect runs ← SYNCHRONOUS, blocking paint
//  4. Browser PAINTS the screen  ← user sees update
//  5. useEffect runs    ← ASYNC, non-blocking
//
// Use useLayoutEffect when:
//  • You need to READ layout (e.g. getBoundingClientRect)
//  • You need to WRITE layout before the user sees anything
//  • Preventing visual flicker/jump
//
// Use useEffect (99% of cases):
//  • Data fetching, subscriptions, logging

function TooltipPositioner({ text }: { text: string }) {
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const ref = React.useRef<HTMLButtonElement>(null);

    // Runs before browser paint → no visible flicker
    useLayoutEffect(() => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setPos({ x: rect.left + rect.width / 2, y: rect.top - 10 });
        }
    }, [text]);

    return (
        <>
            <button ref={ref}>Hover me</button>
            <div style={{ position: "fixed", left: pos.x, top: pos.y, transform: "translateX(-50%)" }}>
                {text}
            </div>
        </>
    );
}

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

// Q1: What is lazy initialization and when do you use it?
// A: Pass a FUNCTION to useState instead of a value.
//    The function runs only once on mount, not on every render.
//    Use for: reading from localStorage, complex initial calculations.
//    useState(() => JSON.parse(localStorage.getItem("key") ?? "null"))

// Q2: What's the difference between direct and functional state updates?
// A: Direct:     setState(count + 1) — closes over current count,
//                can be stale in async/batched scenarios.
//    Functional: setState(prev => prev + 1) — always gets fresh state,
//                safe in all scenarios. Use whenever new value depends on old.

// Q3: Implement a useDebounce hook using useEffect
function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer); // cancel if value changes before delay
    }, [value, delay]);

    return debounced;
}

// Q4: What does the cleanup function in useEffect do?
// A: It runs:
//    1. Before the effect runs again (when deps change)
//    2. When the component unmounts
//    Use for: cancelling fetch (AbortController), clearing timers,
//             removing event listeners, closing connections.

// Q5: Implement a component that fetches and displays a user, with
//     loading/error states and request cancellation on unmount.
function UserCard({ userId }: { userId: string }) {
    const [user, setUser]       = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);

    useEffect(() => {
        const ac = new AbortController();
        setLoading(true);

        fetch(`/api/users/${userId}`, { signal: ac.signal })
            .then(r => { if (!r.ok) throw new Error("Not found"); return r.json(); })
            .then(setUser)
            .catch(e => { if (e.name !== "AbortError") setError(e.message); })
            .finally(() => { if (!ac.signal.aborted) setLoading(false); });

        return () => ac.abort();
    }, [userId]);

    if (loading) return <p>⏳ Loading…</p>;
    if (error)   return <p>❌ {error}</p>;
    return <p>👤 {user?.name}</p>;
}

export {
    PrimitiveState, LazyInit, ObjectState, ArrayState,
    UserProfile, ChatRoom, useWindowSize, Countdown,
    useDocumentTitle, EffectMistakes, TooltipPositioner,
    useDebounce, UserCard,
};

// ─── LIVE DEMO ───────────────────────────────────────────────────

function Box({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>{title}</p>
            {children}
        </div>
    );
}

interface TodoItem { id: string; text: string; done: boolean; }

function TodoDemo() {
    const [todos, setTodos] = useState<TodoItem[]>([
        { id: '1', text: 'Learn useState', done: true },
        { id: '2', text: 'Learn useEffect', done: false },
    ]);
    const [input, setInput] = useState('');

    const add = () => {
        if (!input.trim()) return;
        setTodos(p => [...p, { id: crypto.randomUUID(), text: input.trim(), done: false }]);
        setInput('');
    };

    return (
        <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && add()}
                    placeholder="New todo…" style={{ flex: 1, padding: '4px 8px' }} />
                <button onClick={add}>Add</button>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {todos.map(t => (
                    <li key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                        <input type="checkbox" checked={t.done}
                            onChange={() => setTodos(p => p.map(x => x.id === t.id ? { ...x, done: !x.done } : x))} />
                        <span style={{ flex: 1, textDecoration: t.done ? 'line-through' : 'none', color: t.done ? '#9ca3af' : 'inherit' }}>
                            {t.text}
                        </span>
                        <button onClick={() => setTodos(p => p.filter(x => x.id !== t.id))}
                            style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function Demo() {
    return (
        <div>
            <Box title="Primitive state — counter + toggle">
                <PrimitiveState />
            </Box>

            <Box title="Object state — controlled form fields">
                <ObjectState />
            </Box>

            <Box title="Array state — todo list (add / toggle / remove)">
                <TodoDemo />
            </Box>

            <Box title="useEffect + timer — Countdown">
                <Countdown from={10} />
            </Box>

            <Box title="Effect common mistakes — self-incrementing counter">
                <EffectMistakes />
            </Box>
        </div>
    );
}
