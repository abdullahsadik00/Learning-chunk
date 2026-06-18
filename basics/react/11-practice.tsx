// ═══════════════════════════════════════════════════════════════
// REACT 11: PRACTICE PROBLEMS — Easy · Medium · Hard  (Day 17c)
// ═══════════════════════════════════════════════════════════════
//
// Each problem: description → broken/starter code → solution.
// Try to solve before reading the solution!

import React, {
    useState, useEffect, useCallback, useRef, useReducer,
    createContext, useContext, memo, useMemo, ReactNode, KeyboardEvent,
} from 'react';

// ═══════════════════════════════════════════════════════════════
// EASY
// ═══════════════════════════════════════════════════════════════

// ── EASY 1: Fix the infinite loop ──
//
// PROBLEM: This component re-renders forever. Why? Fix it.
//
// function BrokenFetch({ url }: { url: string }) {
//     const [data, setData] = useState(null);
//
//     useEffect(() => {
//         fetch(url).then(r => r.json()).then(setData);
//     }, [data]);   // ← BUG: data changes → effect → data changes → loop
//
//     return <pre>{JSON.stringify(data)}</pre>;
// }

function FixedFetch({ url }: { url: string }) {
    const [data, setData] = useState<unknown>(null);

    useEffect(() => {
        const ac = new AbortController();
        fetch(url, { signal: ac.signal })
            .then(r => r.json())
            .then(setData)
            .catch(e => { if (e.name !== "AbortError") console.error(e); });
        return () => ac.abort();
    }, [url]); // ✅ only url as dependency, not data

    return <pre>{JSON.stringify(data, null, 2)}</pre>;
}

// ── EASY 2: Implement a Toggle component ──
function Toggle({
    label,
    defaultOn = false,
    onChange,
}: {
    label: string;
    defaultOn?: boolean;
    onChange?: (isOn: boolean) => void;
}) {
    const [on, setOn] = useState(defaultOn);

    const toggle = () => {
        const next = !on;
        setOn(next);
        onChange?.(next);
    };

    return (
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <div
                role="switch"
                aria-checked={on}
                onClick={toggle}
                onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") toggle(); }}
                tabIndex={0}
                style={{
                    width: 44, height: 24, borderRadius: 12, padding: 2,
                    background: on ? "#4CAF50" : "#ccc",
                    transition: "background 0.2s",
                    display: "flex", alignItems: "center",
                }}
            >
                <div style={{
                    width: 20, height: 20, borderRadius: "50%", background: "#fff",
                    transform: on ? "translateX(20px)" : "translateX(0)",
                    transition: "transform 0.2s",
                }} />
            </div>
            {label}
        </label>
    );
}

// ── EASY 3: Controlled input ──
//
// PROBLEM: Make this search input controlled with debounced search.

function SearchInput({ onSearch }: { onSearch: (q: string) => void }) {
    const [value, setValue] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => onSearch(value), 300);
        return () => clearTimeout(timer);
    }, [value, onSearch]);

    return (
        <div style={{ position: "relative" }}>
            <input
                type="search"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="Search…"
                style={{ padding: "6px 28px 6px 8px", width: "100%" }}
            />
            {value && (
                <button
                    onClick={() => setValue("")}
                    style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer" }}
                    aria-label="Clear"
                >
                    ✕
                </button>
            )}
        </div>
    );
}

// ── EASY 4: Fix the stale closure ──
//
// PROBLEM: The alert always shows 0 no matter how many times you click.
// Fix it without changing the button click handler's behavior.
//
// function BrokenAlert() {
//     const [count, setCount] = useState(0);
//
//     useEffect(() => {
//         const id = setInterval(() => {
//             console.log(count); // always 0 — stale closure!
//         }, 1000);
//         return () => clearInterval(id);
//     }, []);  // ← missing count dependency
//
//     return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
// }

function FixedInterval() {
    const [count, setCount] = useState(0);
    const countRef = useRef(count);
    useEffect(() => { countRef.current = count; }, [count]);

    useEffect(() => {
        const id = setInterval(() => {
            console.log("Current count:", countRef.current); // ✅ always fresh
        }, 1000);
        return () => clearInterval(id);
    }, []); // stable — countRef.current is always up to date

    return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// ═══════════════════════════════════════════════════════════════
// MEDIUM
// ═══════════════════════════════════════════════════════════════

// ── MEDIUM 1: useLocalStorage hook ──
function useLocalStorage<T>(key: string, initial: T) {
    const [value, setValue] = useState<T>(() => {
        try {
            const item = localStorage.getItem(key);
            return item ? (JSON.parse(item) as T) : initial;
        } catch {
            return initial;
        }
    });

    const set = useCallback((v: T | ((prev: T) => T)) => {
        setValue(prev => {
            const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
            try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* quota */ }
            return next;
        });
    }, [key]);

    const remove = useCallback(() => {
        localStorage.removeItem(key);
        setValue(initial);
    }, [key, initial]);

    // Sync across tabs
    useEffect(() => {
        const handler = (e: StorageEvent) => {
            if (e.key === key && e.newValue !== null) {
                try { setValue(JSON.parse(e.newValue)); } catch { /* ignore */ }
            }
        };
        window.addEventListener("storage", handler);
        return () => window.removeEventListener("storage", handler);
    }, [key]);

    return [value, set, remove] as const;
}

// ── MEDIUM 2: Autocomplete component ──
interface Option { id: string; label: string; }

function Autocomplete({
    options,
    onSelect,
    placeholder = "Type to search…",
}: {
    options: Option[];
    onSelect: (option: Option) => void;
    placeholder?: string;
}) {
    const [query, setQuery]       = useState("");
    const [open, setOpen]         = useState(false);
    const [highlighted, setHlit]  = useState(0);
    const inputRef                = useRef<HTMLInputElement>(null);

    const filtered = useMemo(
        () => options.filter(o => o.label.toLowerCase().includes(query.toLowerCase())),
        [options, query]
    );

    const select = (opt: Option) => {
        setQuery(opt.label);
        setOpen(false);
        onSelect(opt);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown") { e.preventDefault(); setHlit(i => Math.min(i + 1, filtered.length - 1)); }
        if (e.key === "ArrowUp")   { e.preventDefault(); setHlit(i => Math.max(i - 1, 0)); }
        if (e.key === "Enter"  && open && filtered[highlighted]) select(filtered[highlighted]);
        if (e.key === "Escape") setOpen(false);
    };

    return (
        <div style={{ position: "relative" }}>
            <input
                ref={inputRef}
                value={query}
                placeholder={placeholder}
                onChange={e => { setQuery(e.target.value); setOpen(true); setHlit(0); }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                onKeyDown={handleKeyDown}
                style={{ padding: "6px 10px", width: "100%" }}
            />
            {open && filtered.length > 0 && (
                <ul style={{
                    position: "absolute", top: "100%", left: 0, right: 0,
                    background: "#fff", border: "1px solid #ccc",
                    borderRadius: 4, margin: 0, padding: 4,
                    listStyle: "none", zIndex: 10, maxHeight: 200, overflowY: "auto",
                }}>
                    {filtered.map((opt, i) => (
                        <li
                            key={opt.id}
                            onMouseDown={() => select(opt)}
                            onMouseEnter={() => setHlit(i)}
                            style={{
                                padding: "4px 8px", cursor: "pointer", borderRadius: 3,
                                background: i === highlighted ? "#e8f0fe" : "transparent",
                            }}
                        >
                            {opt.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// ── MEDIUM 3: Dynamic form (add/remove fields) ──
interface Field { id: string; label: string; value: string; }

function DynamicForm({ onSubmit }: { onSubmit: (data: Record<string, string>) => void }) {
    const [fields, setFields] = useState<Field[]>([
        { id: crypto.randomUUID(), label: "Name", value: "" },
    ]);

    const addField = () =>
        setFields(prev => [...prev, { id: crypto.randomUUID(), label: "", value: "" }]);

    const removeField = (id: string) =>
        setFields(prev => prev.filter(f => f.id !== id));

    const updateField = (id: string, key: "label" | "value", val: string) =>
        setFields(prev => prev.map(f => f.id === id ? { ...f, [key]: val } : f));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = Object.fromEntries(fields.map(f => [f.label, f.value]));
        onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit}>
            {fields.map(field => (
                <div key={field.id} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input
                        value={field.label}
                        onChange={e => updateField(field.id, "label", e.target.value)}
                        placeholder="Field name"
                        style={{ flex: 1 }}
                    />
                    <input
                        value={field.value}
                        onChange={e => updateField(field.id, "value", e.target.value)}
                        placeholder="Value"
                        style={{ flex: 2 }}
                    />
                    <button type="button" onClick={() => removeField(field.id)} disabled={fields.length === 1}>
                        ✕
                    </button>
                </div>
            ))}
            <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={addField}>+ Add field</button>
                <button type="submit">Submit</button>
            </div>
        </form>
    );
}

// ═══════════════════════════════════════════════════════════════
// HARD
// ═══════════════════════════════════════════════════════════════

// ── HARD 1: Drag-and-drop list (mouse events, no library) ──
function DragList<T extends { id: string; label: string }>({ items: initial }: { items: T[] }) {
    const [items, setItems]    = useState(initial);
    const [dragId, setDragId]  = useState<string | null>(null);
    const [overId, setOverId]  = useState<string | null>(null);

    const onDragStart = (id: string) => setDragId(id);
    const onDragOver  = (e: React.DragEvent, id: string) => {
        e.preventDefault();
        if (id !== dragId) setOverId(id);
    };
    const onDrop = () => {
        if (!dragId || !overId || dragId === overId) return;
        setItems(prev => {
            const next = [...prev];
            const from = next.findIndex(i => i.id === dragId);
            const to   = next.findIndex(i => i.id === overId);
            const [item] = next.splice(from, 1);
            next.splice(to, 0, item);
            return next;
        });
        setDragId(null);
        setOverId(null);
    };

    return (
        <ul style={{ listStyle: "none", padding: 0 }}>
            {items.map(item => (
                <li
                    key={item.id}
                    draggable
                    onDragStart={() => onDragStart(item.id)}
                    onDragOver={e => onDragOver(e, item.id)}
                    onDrop={onDrop}
                    onDragEnd={() => { setDragId(null); setOverId(null); }}
                    style={{
                        padding: "10px 12px",
                        marginBottom: 4,
                        background: item.id === dragId ? "#e8f0fe" : item.id === overId ? "#fff3e0" : "#f5f5f5",
                        borderRadius: 4,
                        cursor: "grab",
                        border: item.id === overId ? "2px dashed #ff9800" : "2px solid transparent",
                        opacity: item.id === dragId ? 0.5 : 1,
                    }}
                >
                    ⠿ {item.label}
                </li>
            ))}
        </ul>
    );
}

// ── HARD 2: Modal stacking system ──
interface ModalConfig {
    id: string;
    title: string;
    content: ReactNode;
    onClose?: () => void;
}

type ModalAction =
    | { type: "PUSH";  modal: ModalConfig }
    | { type: "POP" }
    | { type: "CLOSE_ALL" };

function modalReducer(state: ModalConfig[], action: ModalAction): ModalConfig[] {
    switch (action.type) {
        case "PUSH":      return [...state, action.modal];
        case "POP":       return state.slice(0, -1);
        case "CLOSE_ALL": return [];
        default: return state;
    }
}

const ModalContext = createContext<{
    push: (modal: Omit<ModalConfig, "id">) => string;
    pop:  () => void;
    closeAll: () => void;
} | null>(null);

function ModalProvider({ children }: { children: ReactNode }) {
    const [stack, dispatch] = useReducer(modalReducer, []);

    const push = useCallback((modal: Omit<ModalConfig, "id">) => {
        const id = crypto.randomUUID();
        dispatch({ type: "PUSH", modal: { ...modal, id } });
        return id;
    }, []);

    const pop      = useCallback(() => dispatch({ type: "POP" }), []);
    const closeAll = useCallback(() => dispatch({ type: "CLOSE_ALL" }), []);

    // Escape key closes top modal
    useEffect(() => {
        if (!stack.length) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                const top = stack[stack.length - 1];
                top.onClose?.();
                dispatch({ type: "POP" });
            }
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [stack]);

    return (
        <ModalContext.Provider value={{ push, pop, closeAll }}>
            {children}
            {stack.map((modal, i) => (
                <div
                    key={modal.id}
                    style={{
                        position: "fixed", inset: 0,
                        background: `rgba(0,0,0,${0.3 + i * 0.1})`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        zIndex: 1000 + i,
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            modal.onClose?.();
                            dispatch({ type: "POP" });
                        }
                    }}
                >
                    <div style={{
                        background: "#fff", borderRadius: 8, padding: 24,
                        maxWidth: 480, width: "90%",
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                            <h2 style={{ margin: 0 }}>{modal.title}</h2>
                            <button onClick={() => { modal.onClose?.(); dispatch({ type: "POP" }); }}>✕</button>
                        </div>
                        {modal.content}
                    </div>
                </div>
            ))}
        </ModalContext.Provider>
    );
}

function useModal() {
    const ctx = useContext(ModalContext);
    if (!ctx) throw new Error("useModal must be used within ModalProvider");
    return ctx;
}

// Usage demo — modals can open other modals
function ModalDemo() {
    const { push, pop } = useModal();

    const openFirst = () => push({
        title: "First Modal",
        content: (
            <div>
                <p>I am the first modal.</p>
                <button onClick={() => push({
                    title: "Second Modal",
                    content: <p>Stacked on top!</p>,
                })}>
                    Open another
                </button>
                <button onClick={pop}>Close</button>
            </div>
        ),
    });

    return <button onClick={openFirst}>Open Modal</button>;
}

// ── HARD 3: Undo/Redo with useReducer ──
interface UndoState<T> {
    past:    T[];
    present: T;
    future:  T[];
}

type UndoAction<T> =
    | { type: "SET"; payload: T }
    | { type: "UNDO" }
    | { type: "REDO" }
    | { type: "RESET"; payload: T };

function undoReducer<T>(state: UndoState<T>, action: UndoAction<T>): UndoState<T> {
    switch (action.type) {
        case "SET":
            return {
                past: [...state.past, state.present],
                present: action.payload,
                future: [], // new action clears redo stack
            };
        case "UNDO":
            if (!state.past.length) return state;
            return {
                past: state.past.slice(0, -1),
                present: state.past[state.past.length - 1],
                future: [state.present, ...state.future],
            };
        case "REDO":
            if (!state.future.length) return state;
            return {
                past: [...state.past, state.present],
                present: state.future[0],
                future: state.future.slice(1),
            };
        case "RESET":
            return { past: [], present: action.payload, future: [] };
        default: return state;
    }
}

function useUndoReducer<T>(initial: T) {
    const [state, dispatch] = useReducer(undoReducer<T>, {
        past: [], present: initial, future: [],
    });

    return {
        state: state.present,
        set:   (v: T)  => dispatch({ type: "SET", payload: v }),
        undo:  ()      => dispatch({ type: "UNDO" }),
        redo:  ()      => dispatch({ type: "REDO" }),
        reset: (v?: T) => dispatch({ type: "RESET", payload: v ?? initial }),
        canUndo: state.past.length > 0,
        canRedo: state.future.length > 0,
    };
}

// Usage: drawing canvas with undo/redo
function TextEditorWithHistory() {
    const { state: text, set, undo, redo, canUndo, canRedo } = useUndoReducer("");

    return (
        <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <button onClick={undo} disabled={!canUndo}>↩ Undo</button>
                <button onClick={redo} disabled={!canRedo}>↪ Redo</button>
            </div>
            <textarea
                value={text}
                onChange={e => set(e.target.value)}
                rows={6}
                style={{ width: "100%", fontFamily: "monospace" }}
            />
        </div>
    );
}

export {
    FixedFetch, Toggle, SearchInput, FixedInterval,
    useLocalStorage, Autocomplete, DynamicForm,
    DragList, ModalProvider, useModal, ModalDemo,
    useUndoReducer, TextEditorWithHistory,
};
