// ═══════════════════════════════════════════════════════════════
// REACT 04: useContext · useReducer · Custom Hooks  (Day 14b)
// ═══════════════════════════════════════════════════════════════
//
// useContext  — consume values provided by an ancestor without prop-drilling
// useReducer  — manage complex state with a pure reducer function (like Redux)
// Custom Hooks— extract reusable stateful logic into named "use…" functions

import React, {
    createContext, useContext, useReducer, useState,
    useEffect, useCallback, useMemo, useRef, ReactNode
} from 'react';

// ───────────────────────────────────────────────────────────────
// 1. useContext — PROP DRILLING PROBLEM & SOLUTION
// ───────────────────────────────────────────────────────────────
//
// Prop drilling:
//   App → Page → Section → Widget → DeepComponent (needs user)
//   Every intermediate component receives and passes 'user' even if unused.
//
// Context solution:
//   Provider at App level, Consumer (useContext) at DeepComponent.
//   No intermediate passing needed.

// Step 1: Create context (always with a null default + runtime check)
interface ThemeContextValue {
    theme: "light" | "dark";
    toggleTheme: () => void;
}
const ThemeContext = createContext<ThemeContextValue | null>(null);

// Step 2: Custom hook that validates usage
function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
    return ctx;
}

// Step 3: Provider component
function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<"light" | "dark">("light");

    // Memoize the value! Without this, every state change creates a new
    // object reference → ALL consumers re-render even if theme didn't change.
    const value = useMemo(
        () => ({ theme, toggleTheme: () => setTheme(t => t === "light" ? "dark" : "light") }),
        [theme]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Step 4: Consume anywhere in the tree
function ThemedButton({ children }: { children: ReactNode }) {
    const { theme, toggleTheme } = useTheme();
    return (
        <button
            style={{
                background: theme === "light" ? "#fff" : "#333",
                color:      theme === "light" ? "#333" : "#fff",
                border: "1px solid currentColor",
            }}
            onClick={toggleTheme}
        >
            {children} (current: {theme})
        </button>
    );
}

// ── Full Auth Context example ──
interface AuthUser { id: string; name: string; email: string; role: string; }

interface AuthContextValue {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login:    (email: string, password: string) => Promise<void>;
    logout:   () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}

function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser]       = useState<AuthUser | null>(null);
    const [isLoading, setLoading] = useState(false);

    // Check stored session on mount
    useEffect(() => {
        const saved = sessionStorage.getItem("user");
        if (saved) setUser(JSON.parse(saved));
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        setLoading(true);
        try {
            // Simulate API call
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            if (!res.ok) throw new Error("Invalid credentials");
            const data: AuthUser = await res.json();
            setUser(data);
            sessionStorage.setItem("user", JSON.stringify(data));
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        sessionStorage.removeItem("user");
    }, []);

    const value = useMemo(
        () => ({ user, isAuthenticated: !!user, isLoading, login, logout }),
        [user, isLoading, login, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── CONTEXT PERFORMANCE: split by update frequency ──
//
// If your context has both fast-changing data (e.g. mouse pos) and
// static data (e.g. actions), split into two contexts.
// Consumers that only need static data won't re-render on data changes.

const ActionsContext = createContext<{ doSomething: () => void } | null>(null);
const DataContext    = createContext<{ count: number } | null>(null);

function SplitProvider({ children }: { children: ReactNode }) {
    const [count, setCount] = useState(0);

    // Static actions — never changes → consumers never re-render
    const actions = useMemo(() => ({ doSomething: () => setCount(c => c + 1) }), []);

    // Changing data → only data consumers re-render
    const data = useMemo(() => ({ count }), [count]);

    return (
        <ActionsContext.Provider value={actions}>
            <DataContext.Provider value={data}>
                {children}
            </DataContext.Provider>
        </ActionsContext.Provider>
    );
}

// ───────────────────────────────────────────────────────────────
// 2. useReducer — COMPLEX STATE MANAGEMENT
// ───────────────────────────────────────────────────────────────
//
// const [state, dispatch] = useReducer(reducer, initialState)
//
// FLOW: dispatch(action) → reducer(state, action) → newState → re-render
//
// PREFER useReducer over useState when:
//  • Multiple related state values (e.g. loading + data + error)
//  • Next state depends on current state in complex ways
//  • State logic is shared by many events
//  • You want Redux-style predictability / testability

// ── Basic example ──
type CountAction =
    | { type: "INCREMENT" }
    | { type: "DECREMENT" }
    | { type: "RESET" }
    | { type: "SET"; payload: number };

function countReducer(state: number, action: CountAction): number {
    switch (action.type) {
        case "INCREMENT": return state + 1;
        case "DECREMENT": return state - 1;
        case "RESET":     return 0;
        case "SET":       return action.payload;
        default: {
            const _exhaustive: never = action;
            throw new Error(`Unknown action: ${JSON.stringify(_exhaustive)}`);
        }
    }
}

function CounterWithReducer() {
    const [count, dispatch] = useReducer(countReducer, 0);
    return (
        <div>
            <p>{count}</p>
            <button onClick={() => dispatch({ type: "INCREMENT" })}>+</button>
            <button onClick={() => dispatch({ type: "DECREMENT" })}>−</button>
            <button onClick={() => dispatch({ type: "RESET" })}>Reset</button>
            <button onClick={() => dispatch({ type: "SET", payload: 100 })}>→100</button>
        </div>
    );
}

// ── Complex state: Todo list ──
interface Todo { id: string; text: string; done: boolean; }

interface TodoState {
    items: Todo[];
    filter: "all" | "active" | "done";
    nextId: number;
}

type TodoAction =
    | { type: "ADD";    text: string }
    | { type: "REMOVE"; id: string }
    | { type: "TOGGLE"; id: string }
    | { type: "EDIT";   id: string; text: string }
    | { type: "CLEAR_DONE" }
    | { type: "SET_FILTER"; filter: TodoState["filter"] };

const initialTodoState: TodoState = { items: [], filter: "all", nextId: 1 };

function todoReducer(state: TodoState, action: TodoAction): TodoState {
    switch (action.type) {
        case "ADD":
            return {
                ...state,
                items: [...state.items, { id: String(state.nextId), text: action.text, done: false }],
                nextId: state.nextId + 1,
            };
        case "REMOVE":
            return { ...state, items: state.items.filter(t => t.id !== action.id) };
        case "TOGGLE":
            return { ...state, items: state.items.map(t => t.id === action.id ? { ...t, done: !t.done } : t) };
        case "EDIT":
            return { ...state, items: state.items.map(t => t.id === action.id ? { ...t, text: action.text } : t) };
        case "CLEAR_DONE":
            return { ...state, items: state.items.filter(t => !t.done) };
        case "SET_FILTER":
            return { ...state, filter: action.filter };
        default:
            return state;
    }
}

function TodoApp() {
    const [state, dispatch] = useReducer(todoReducer, initialTodoState);
    const [input, setInput] = useState("");

    const visible = useMemo(() => {
        switch (state.filter) {
            case "active": return state.items.filter(t => !t.done);
            case "done":   return state.items.filter(t => t.done);
            default:       return state.items;
        }
    }, [state.items, state.filter]);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) { dispatch({ type: "ADD", text: input.trim() }); setInput(""); }
    };

    return (
        <div>
            <form onSubmit={handleAdd}>
                <input value={input} onChange={e => setInput(e.target.value)} />
                <button type="submit">Add</button>
            </form>
            <div>
                {(["all", "active", "done"] as const).map(f => (
                    <button key={f} onClick={() => dispatch({ type: "SET_FILTER", filter: f })}
                        style={{ fontWeight: state.filter === f ? "bold" : "normal" }}>
                        {f}
                    </button>
                ))}
            </div>
            <ul>
                {visible.map(t => (
                    <li key={t.id}>
                        <input type="checkbox" checked={t.done}
                               onChange={() => dispatch({ type: "TOGGLE", id: t.id })} />
                        <span style={{ textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>
                        <button onClick={() => dispatch({ type: "REMOVE", id: t.id })}>✕</button>
                    </li>
                ))}
            </ul>
            <button onClick={() => dispatch({ type: "CLEAR_DONE" })}>Clear done</button>
        </div>
    );
}

// ── useReducer + Context = lightweight global state ──
const TodoStateCtx    = createContext<TodoState | null>(null);
const TodoDispatchCtx = createContext<React.Dispatch<TodoAction> | null>(null);

function TodoProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(todoReducer, initialTodoState);
    return (
        <TodoStateCtx.Provider value={state}>
            <TodoDispatchCtx.Provider value={dispatch}>
                {children}
            </TodoDispatchCtx.Provider>
        </TodoStateCtx.Provider>
    );
}

function useTodoState()    { const c = useContext(TodoStateCtx);    if (!c) throw new Error("missing provider"); return c; }
function useTodoDispatch() { const c = useContext(TodoDispatchCtx); if (!c) throw new Error("missing provider"); return c; }

// ───────────────────────────────────────────────────────────────
// 3. CUSTOM HOOKS — share logic, not state
// ───────────────────────────────────────────────────────────────
//
// Rules:
//  • Name MUST start with "use"
//  • Can call other hooks
//  • Each CALL gets its own isolated state (logic shared, state separate)

// ── useLocalStorage ──
function useLocalStorage<T>(key: string, initial: T) {
    const [value, setValue] = useState<T>(() => {
        try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : initial; }
        catch { return initial; }
    });

    const set = useCallback((v: T | ((prev: T) => T)) => {
        setValue(prev => {
            const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
            try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
            return next;
        });
    }, [key]);

    // Sync across browser tabs
    useEffect(() => {
        const handler = (e: StorageEvent) => {
            if (e.key === key && e.newValue) {
                try { setValue(JSON.parse(e.newValue)); } catch {}
            }
        };
        window.addEventListener("storage", handler);
        return () => window.removeEventListener("storage", handler);
    }, [key]);

    return [value, set] as const;
}

// ── useFetch ──
function useFetch<T>(url: string) {
    const [data, setData]   = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const ac = new AbortController();
        setLoading(true); setError(null);

        fetch(url, { signal: ac.signal })
            .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
            .then(setData)
            .catch(e => { if (e.name !== "AbortError") setError(e.message); })
            .finally(() => { if (!ac.signal.aborted) setLoading(false); });

        return () => ac.abort();
    }, [url]);

    return { data, error, loading };
}

// ── useToggle ──
function useToggle(initial = false) {
    const [on, setOn] = useState(initial);
    const toggle  = useCallback(() => setOn(v => !v), []);
    const turnOn  = useCallback(() => setOn(true),  []);
    const turnOff = useCallback(() => setOn(false), []);
    return { on, toggle, turnOn, turnOff };
}

// ── useClickOutside ──
function useClickOutside<T extends HTMLElement>(handler: () => void): React.RefObject<T> {
    const ref = useRef<T>(null);
    useEffect(() => {
        const listener = (e: MouseEvent) => {
            if (!ref.current?.contains(e.target as Node)) handler();
        };
        document.addEventListener("mousedown", listener);
        return () => document.removeEventListener("mousedown", listener);
    }, [handler]);
    return ref;
}

// ── useAsync ──
function useAsync<T>(fn: (...args: any[]) => Promise<T>, immediate = false) {
    const [status, setStatus]   = useState<"idle"|"pending"|"success"|"error">("idle");
    const [data, setData]       = useState<T | null>(null);
    const [error, setError]     = useState<Error | null>(null);

    const execute = useCallback(async (...args: any[]) => {
        setStatus("pending"); setError(null);
        try {
            const result = await fn(...args);
            setData(result); setStatus("success");
            return result;
        } catch (e) {
            setError(e as Error); setStatus("error");
            throw e;
        }
    }, [fn]);

    useEffect(() => { if (immediate) execute(); }, []);  // eslint-disable-line

    return {
        execute, data, error, status,
        isIdle:    status === "idle",
        isPending: status === "pending",
        isSuccess: status === "success",
        isError:   status === "error",
    };
}

// ── useMediaQuery ──
function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
    useEffect(() => {
        const mq = window.matchMedia(query);
        const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, [query]);
    return matches;
}

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

// Q1: When should you use useReducer over useState?
// A: useReducer is better when:
//    • State has multiple sub-values that update together
//    • Next state depends on current in complex ways
//    • You have many different update types (>3-4)
//    • You want reducer to be separately testable
//    • You're building global state (reducer + Context)

// Q2: Why should you always memoize context values?
// A: Without useMemo, the context value object is recreated on every render.
//    Since React uses reference equality, ALL consumers re-render every time
//    the provider re-renders — even if the actual data hasn't changed.

// Q3: Implement useWindowSize custom hook
function useWindowSize() {
    const [size, setSize] = useState({
        width:  window.innerWidth,
        height: window.innerHeight,
    });
    useEffect(() => {
        const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);
    return size;
}

// Q4: What's the difference between Render Props and Custom Hooks?
// A: Both share logic. Custom hooks are now preferred because:
//    • No extra component in the tree (no wrapper hell)
//    • Simpler mental model — just a function call
//    • Better TypeScript inference
//    • Compose multiple hooks easily
//    Render props are still useful when you need to share rendering logic
//    (not just state logic).

// Q5: Implement a useForm custom hook
function useForm<T extends Record<string, string>>(initial: T) {
    const [values, setValues]   = useState(initial);
    const [errors, setErrors]   = useState<Partial<T>>({});
    const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

    const setValue = useCallback(<K extends keyof T>(key: K, value: T[K]) =>
        setValues(p => ({ ...p, [key]: value })), []);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) =>
        setValues(p => ({ ...p, [e.target.name]: e.target.value })), []);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) =>
        setTouched(p => ({ ...p, [e.target.name]: true })), []);

    const reset = useCallback(() => {
        setValues(initial); setErrors({}); setTouched({});
    }, [initial]);

    const getFieldProps = useCallback((name: keyof T) => ({
        name: name as string,
        value: values[name],
        onChange: handleChange,
        onBlur: handleBlur,
    }), [values, handleChange, handleBlur]);

    return { values, errors, touched, setValue, setErrors, handleChange, handleBlur, reset, getFieldProps };
}

export {
    ThemeProvider, useTheme, ThemedButton,
    AuthProvider, useAuth,
    SplitProvider,
    countReducer, CounterWithReducer,
    todoReducer, TodoApp, TodoProvider, useTodoState, useTodoDispatch,
    useLocalStorage, useFetch, useToggle, useClickOutside, useAsync, useMediaQuery,
    useWindowSize, useForm,
};

// ─── LIVE DEMO ───────────────────────────────────────────────────

function Box({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-5 mb-4 bg-white dark:bg-zinc-900 shadow-sm transition-colors">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{title}</p>
            {children}
        </div>
    );
}

export default function Demo() {
    return (
        <div>
            <Box title="useContext — theme toggle (ThemeProvider + ThemedButton)">
                <ThemeProvider>
                    <ThemedButton>Click to toggle theme</ThemedButton>
                </ThemeProvider>
            </Box>

            <Box title="useReducer — counter with typed actions">
                <CounterWithReducer />
            </Box>

            <Box title="useReducer — full todo app (add / toggle / filter / clear done)">
                <TodoApp />
            </Box>
        </div>
    );
}
