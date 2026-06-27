// ═══════════════════════════════════════════════════════════════
// REACT 08: PATTERNS — Compound · Render Props · HOC · Headless  (Day 16b)
// ═══════════════════════════════════════════════════════════════

import React, {
    createContext, useContext, useState, useCallback, useRef,
    useEffect, ReactNode, KeyboardEvent, useId,
} from 'react';

// ───────────────────────────────────────────────────────────────
// 1. COMPOUND COMPONENTS
// ───────────────────────────────────────────────────────────────
//
// Compound components share implicit state through Context.
// The API looks like HTML — consumers compose sub-components
// rather than passing a massive props object.
//
// vs. "Prop Bag" anti-pattern:
//   ❌ <Accordion items={[...]} expandedIndex={0} onToggle={...} renderItem={...} />
//   ✅ <Accordion> <Accordion.Item> <Accordion.Trigger /> <Accordion.Content /> </Accordion.Item> </Accordion>

// ── 1a. Accordion ──
interface AccordionContextValue {
    expandedId: string | null;
    toggle: (id: string) => void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordion() {
    const ctx = useContext(AccordionContext);
    if (!ctx) throw new Error("Accordion sub-components must be used inside <Accordion>");
    return ctx;
}

function Accordion({ children, defaultOpen }: { children: ReactNode; defaultOpen?: string }) {
    const [expandedId, setExpandedId] = useState<string | null>(defaultOpen ?? null);
    const toggle = useCallback((id: string) =>
        setExpandedId(prev => prev === id ? null : id), []);

    return (
        <AccordionContext.Provider value={{ expandedId, toggle }}>
            <div>{children}</div>
        </AccordionContext.Provider>
    );
}

function AccordionItem({ id, children }: { id: string; children: ReactNode }) {
    return <div data-id={id}>{children}</div>;
}

function AccordionTrigger({ id, children }: { id: string; children: ReactNode }) {
    const { expandedId, toggle } = useAccordion();
    const isOpen = expandedId === id;

    return (
        <button
            onClick={() => toggle(id)}
            aria-expanded={isOpen}
            style={{ width: "100%", textAlign: "left", padding: "8px 12px", fontWeight: 600 }}
        >
            <span>{isOpen ? "▾" : "▸"} </span>
            {children}
        </button>
    );
}

function AccordionContent({ id, children }: { id: string; children: ReactNode }) {
    const { expandedId } = useAccordion();
    if (expandedId !== id) return null;
    return <div style={{ padding: "8px 12px 12px" }}>{children}</div>;
}

// Attach sub-components
Accordion.Item    = AccordionItem;
Accordion.Trigger = AccordionTrigger;
Accordion.Content = AccordionContent;

// Usage
function FAQSection() {
    return (
        <Accordion defaultOpen="q1">
            <Accordion.Item id="q1">
                <Accordion.Trigger id="q1">What is React?</Accordion.Trigger>
                <Accordion.Content id="q1">A JavaScript library for building UIs.</Accordion.Content>
            </Accordion.Item>
            <Accordion.Item id="q2">
                <Accordion.Trigger id="q2">What are hooks?</Accordion.Trigger>
                <Accordion.Content id="q2">Functions that let you use state in function components.</Accordion.Content>
            </Accordion.Item>
        </Accordion>
    );
}

// ── 1b. Select / Dropdown (more complex compound component) ──
interface SelectContextValue {
    value: string;
    onChange: (v: string) => void;
    open: boolean;
    setOpen: (o: boolean) => void;
    highlighted: string | null;
    setHighlighted: (v: string | null) => void;
}

const SelectContext = createContext<SelectContextValue | null>(null);

function Select({
    value,
    onChange,
    children,
}: {
    value: string;
    onChange: (v: string) => void;
    children: ReactNode;
}) {
    const [open, setOpen]               = useState(false);
    const [highlighted, setHighlighted] = useState<string | null>(null);
    const containerRef                  = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <SelectContext.Provider value={{ value, onChange, open, setOpen, highlighted, setHighlighted }}>
            <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
                {children}
            </div>
        </SelectContext.Provider>
    );
}

function SelectTrigger({ placeholder = "Select…" }: { placeholder?: string }) {
    const { value, open, setOpen } = useContext(SelectContext)!;
    return (
        <button
            onClick={() => setOpen(!open)}
            aria-haspopup="listbox"
            aria-expanded={open}
            style={{ padding: "6px 12px", minWidth: 140 }}
        >
            {value || placeholder} {open ? "▲" : "▼"}
        </button>
    );
}

function SelectList({ children }: { children: ReactNode }) {
    const { open } = useContext(SelectContext)!;
    if (!open) return null;
    return (
        <ul
            role="listbox"
            style={{
                position: "absolute", top: "100%", left: 0, right: 0,
                background: "#fff", border: "1px solid #ccc",
                borderRadius: 4, margin: 0, padding: 4, listStyle: "none", zIndex: 100,
            }}
        >
            {children}
        </ul>
    );
}

function SelectOption({ value, label }: { value: string; label: string }) {
    const ctx = useContext(SelectContext)!;
    const isSelected    = ctx.value === value;
    const isHighlighted = ctx.highlighted === value;

    return (
        <li
            role="option"
            aria-selected={isSelected}
            onClick={() => { ctx.onChange(value); ctx.setOpen(false); }}
            onMouseEnter={() => ctx.setHighlighted(value)}
            style={{
                padding: "4px 8px", cursor: "pointer", borderRadius: 3,
                background: isHighlighted ? "#e8f0fe" : isSelected ? "#d0e0fd" : "transparent",
                fontWeight: isSelected ? 600 : 400,
            }}
        >
            {label}
        </li>
    );
}

// Usage
function SelectDemo() {
    const [lang, setLang] = useState("");
    return (
        <Select value={lang} onChange={setLang}>
            <SelectTrigger placeholder="Choose language" />
            <SelectList>
                <SelectOption value="ts" label="TypeScript" />
                <SelectOption value="py" label="Python" />
                <SelectOption value="go" label="Go" />
            </SelectList>
        </Select>
    );
}

// ───────────────────────────────────────────────────────────────
// 2. RENDER PROPS
// ───────────────────────────────────────────────────────────────
//
// A component receives a function as a prop and calls it to render.
// The function receives internal state — allowing logic reuse without
// imposing a specific UI.
//
// Mostly replaced by custom hooks, but still appears in some libraries.

interface MousePosition { x: number; y: number; }

function MouseTracker({
    render,
    children,
}: {
    render?: (pos: MousePosition) => ReactNode;
    children?: (pos: MousePosition) => ReactNode;
}) {
    const [pos, setPos] = useState<MousePosition>({ x: 0, y: 0 });

    useEffect(() => {
        const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", handler);
        return () => window.removeEventListener("mousemove", handler);
    }, []);

    const renderFn = render ?? children;
    return <div>{renderFn?.(pos)}</div>;
}

// Usage
function CrosshairDemo() {
    return (
        <MouseTracker>
            {({ x, y }) => (
                <div style={{ height: 200, border: "1px solid #ccc", position: "relative", overflow: "hidden" }}>
                    <div style={{
                        position: "absolute", left: x, top: y,
                        width: 12, height: 12, borderRadius: "50%",
                        background: "red", transform: "translate(-50%, -50%)",
                    }} />
                    <p>({x}, {y})</p>
                </div>
            )}
        </MouseTracker>
    );
}

// ───────────────────────────────────────────────────────────────
// 3. HIGHER-ORDER COMPONENTS (HOCs)
// ───────────────────────────────────────────────────────────────
//
// A function that takes a component and returns a new enhanced component.
// Were the primary reuse mechanism before hooks.
// Use custom hooks instead when possible — HOCs have type complexity.

// ── 3a. withAuth ──
interface WithAuthProps { currentUser: AuthUser; }
interface AuthUser { id: string; name: string; role: "admin" | "user"; }

function withAuth<P extends WithAuthProps>(
    WrappedComponent: React.ComponentType<P>
) {
    function WithAuthComponent(props: Omit<P, keyof WithAuthProps>) {
        const [user] = useState<AuthUser | null>({ id: "1", name: "Alice", role: "user" });

        if (!user) return <p>Please log in.</p>;
        return <WrappedComponent {...(props as P)} currentUser={user} />;
    }

    WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName ?? WrappedComponent.name})`;
    return WithAuthComponent;
}

function AdminPanel({ currentUser }: WithAuthProps) {
    if (currentUser.role !== "admin") return <p>Access denied.</p>;
    return <div>Admin panel for {currentUser.name}</div>;
}

const ProtectedAdminPanel = withAuth(AdminPanel);

// ── 3b. withLoading ──
interface WithLoadingProps { isLoading: boolean; }

function withLoading<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    LoadingComponent: React.ComponentType = () => <p>Loading…</p>
) {
    function WithLoadingComponent({ isLoading, ...rest }: P & WithLoadingProps) {
        if (isLoading) return <LoadingComponent />;
        return <WrappedComponent {...(rest as P)} />;
    }

    WithLoadingComponent.displayName = `withLoading(${WrappedComponent.displayName ?? WrappedComponent.name})`;
    return WithLoadingComponent;
}

function UserList({ users }: { users: string[] }) {
    return <ul>{users.map(u => <li key={u}>{u}</li>)}</ul>;
}

const LoadingUserList = withLoading(UserList);
// <LoadingUserList isLoading={loading} users={users} />

// ───────────────────────────────────────────────────────────────
// 4. HEADLESS COMPONENTS (logic only, no UI)
// ───────────────────────────────────────────────────────────────
//
// Export the logic as a custom hook; the consumer renders however they want.
// Libraries like Radix UI, Headless UI, react-aria use this pattern.

// ── 4a. useToggle ──
function useToggle(initial = false) {
    const [on, setOn] = useState(initial);
    const toggle = useCallback(() => setOn(v => !v), []);
    const set    = useCallback((v: boolean) => setOn(v), []);
    return { on, toggle, set };
}

// ── 4b. useDisclosure (modal/dialog state) ──
function useDisclosure(initial = false) {
    const [isOpen, setIsOpen] = useState(initial);
    const open    = useCallback(() => setIsOpen(true), []);
    const close   = useCallback(() => setIsOpen(false), []);
    const toggle  = useCallback(() => setIsOpen(v => !v), []);
    return { isOpen, open, close, toggle };
}

// Consumer decides how to render — complete styling freedom
function ToggleDemo() {
    const { on, toggle } = useToggle();
    const drawer = useDisclosure();

    return (
        <div>
            {/* Any UI they want */}
            <button
                onClick={toggle}
                style={{ background: on ? "#2ecc71" : "#e74c3c", color: "#fff", padding: "4px 12px" }}
            >
                {on ? "ON" : "OFF"}
            </button>

            <button onClick={drawer.toggle}>{drawer.isOpen ? "Close Drawer" : "Open Drawer"}</button>
            {drawer.isOpen && (
                <aside style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 300, background: "#fff", boxShadow: "-2px 0 8px rgba(0,0,0,0.2)", padding: 16 }}>
                    <button onClick={drawer.close}>✕</button>
                    <p>Drawer content</p>
                </aside>
            )}
        </div>
    );
}

// ── 4c. useCombobox (accessible autocomplete) ──
interface ComboboxOptions<T> {
    items: T[];
    getLabel: (item: T) => string;
    getValue: (item: T) => string;
    onSelect?: (item: T) => void;
}

function useCombobox<T>({ items, getLabel, getValue, onSelect }: ComboboxOptions<T>) {
    const [query, setQuery]         = useState("");
    const [isOpen, setIsOpen]       = useState(false);
    const [highlighted, setHighlit] = useState(0);
    const inputRef                  = useRef<HTMLInputElement>(null);
    const listId                    = useId();

    const filtered = items.filter(item =>
        getLabel(item).toLowerCase().includes(query.toLowerCase())
    );

    const select = useCallback((item: T) => {
        setQuery(getLabel(item));
        setIsOpen(false);
        onSelect?.(item);
    }, [getLabel, onSelect]);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setHighlit(i => Math.min(i + 1, filtered.length - 1));
                break;
            case "ArrowUp":
                e.preventDefault();
                setHighlit(i => Math.max(i - 1, 0));
                break;
            case "Enter":
                if (isOpen && filtered[highlighted]) select(filtered[highlighted]);
                break;
            case "Escape":
                setIsOpen(false);
                inputRef.current?.blur();
                break;
        }
    };

    // Props to spread onto elements
    const getInputProps = () => ({
        ref: inputRef,
        value: query,
        "aria-autocomplete": "list" as const,
        "aria-controls": listId,
        "aria-expanded": isOpen,
        role: "combobox" as const,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlit(0);
        },
        onFocus: () => setIsOpen(true),
        onBlur: () => setTimeout(() => setIsOpen(false), 150),
        onKeyDown: handleKeyDown,
    });

    const getListProps = () => ({ id: listId, role: "listbox" as const });

    const getItemProps = (index: number) => ({
        role: "option" as const,
        "aria-selected": index === highlighted,
        onMouseDown: (e: React.MouseEvent) => { e.preventDefault(); select(filtered[index]); },
        onMouseEnter: () => setHighlit(index),
    });

    return { filtered, isOpen, highlighted, getInputProps, getListProps, getItemProps };
}

// Consumer: style however they want
function CityAutocomplete() {
    const cities = [
        { id: "1", name: "Mumbai" }, { id: "2", name: "Delhi" },
        { id: "3", name: "Bangalore" }, { id: "4", name: "Chennai" },
    ];

    const { filtered, isOpen, highlighted, getInputProps, getListProps, getItemProps } =
        useCombobox({
            items: cities,
            getLabel: c => c.name,
            getValue: c => c.id,
            onSelect: c => console.log("Selected:", c),
        });

    return (
        <div style={{ position: "relative", display: "inline-block" }}>
            <input {...getInputProps()} placeholder="Search city…" style={{ padding: "6px 10px" }} />
            {isOpen && filtered.length > 0 && (
                <ul {...getListProps()} style={{
                    position: "absolute", top: "100%", left: 0, right: 0,
                    background: "#fff", border: "1px solid #ccc",
                    borderRadius: 4, margin: 0, padding: 4, listStyle: "none",
                }}>
                    {filtered.map((city, i) => (
                        <li
                            key={city.id}
                            {...getItemProps(i)}
                            style={{
                                padding: "4px 8px", cursor: "pointer",
                                background: i === highlighted ? "#e8f0fe" : "transparent",
                            }}
                        >
                            {city.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// ───────────────────────────────────────────────────────────────
// 5. PATTERN COMPARISON
// ───────────────────────────────────────────────────────────────
//
//  PATTERN         │ REUSE MECHANISM │ BEST FOR
//  ────────────────┼─────────────────┼────────────────────────────────────
//  Compound        │ Context         │ Related components sharing state
//  Render Props    │ Function prop   │ Sharing stateful UI logic
//  HOC             │ Wrapping        │ Cross-cutting concerns (auth, logging)
//  Custom Hook     │ Hook            │ Logic reuse without UI coupling
//  Headless        │ Custom Hook     │ Accessible, fully styleable components
//
//  RULE OF THUMB:
//  - Logic only → Custom Hook
//  - Flexible UI + shared state → Compound Components
//  - Cross-cutting (auth, analytics) → HOC
//  - Accessible widget behavior → Headless (getXProps pattern)

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

// Q1: What problem do compound components solve?
// A: "Prop bag" explosion. Instead of one component accepting 20 props
//    for every possible configuration, compound components let consumers
//    compose sub-components themselves — much more flexible and readable.

// Q2: What is the difference between a render prop and a custom hook?
// A: Render prop: logic is in a component that calls a function prop to render.
//    Custom hook: logic is extracted to a function that returns values and callbacks.
//    Custom hooks are simpler (no JSX wrapper) and can't cause "wrapper hell".
//    Render props still appear in libraries for scoped UI patterns.

// Q3: When would you still use an HOC over a custom hook?
// A: HOCs are useful when you need to:
//    1. Intercept rendering before a class component (class components can't use hooks)
//    2. Modify the component's displayName / ref forwarding in a consistent way
//    3. Apply multiple concerns as a pipeline: compose(withAuth, withLogging)(Component)
//    For function components, prefer custom hooks + composition.

// Q4: Implement a Tab compound component
const TabContext = createContext<{ active: string; setActive: (id: string) => void } | null>(null);

function Tabs({ children, defaultTab }: { children: ReactNode; defaultTab: string }) {
    const [active, setActive] = useState(defaultTab);
    return (
        <TabContext.Provider value={{ active, setActive }}>
            <div>{children}</div>
        </TabContext.Provider>
    );
}

function TabList({ children }: { children: ReactNode }) {
    return <div role="tablist" style={{ display: "flex", gap: 4 }}>{children}</div>;
}

function Tab({ id, children }: { id: string; children: ReactNode }) {
    const ctx = useContext(TabContext)!;
    return (
        <button
            role="tab"
            aria-selected={ctx.active === id}
            onClick={() => ctx.setActive(id)}
            style={{ fontWeight: ctx.active === id ? 700 : 400, borderBottom: ctx.active === id ? "2px solid blue" : "none" }}
        >
            {children}
        </button>
    );
}

function TabPanel({ id, children }: { id: string; children: ReactNode }) {
    const { active } = useContext(TabContext)!;
    if (active !== id) return null;
    return <div role="tabpanel">{children}</div>;
}

Tabs.List  = TabList;
Tabs.Tab   = Tab;
Tabs.Panel = TabPanel;

export {
    Accordion, FAQSection,
    Select, SelectTrigger, SelectList, SelectOption, SelectDemo,
    MouseTracker, CrosshairDemo,
    withAuth, withLoading, ProtectedAdminPanel, LoadingUserList,
    useToggle, useDisclosure, ToggleDemo,
    useCombobox, CityAutocomplete,
    Tabs,
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
            <Box title="Compound components — Accordion" sub="Sub-components share implicit state through Context. No giant props object.">
                <FAQSection />
            </Box>

            <Box title="Compound components — Select / Dropdown" sub="Fully composed from SelectTrigger + SelectList + SelectOption.">
                <SelectDemo />
            </Box>

            <Box title="Render props — MouseTracker" sub="Move your mouse over the box below.">
                <CrosshairDemo />
            </Box>

            <Box title="Headless components — useToggle + useDisclosure" sub="Pure logic hook — the consumer owns all the UI.">
                <ToggleDemo />
            </Box>

            <Box title="Headless combobox — CityAutocomplete" sub="Keyboard navigation (↑ ↓ Enter Escape) built into the hook.">
                <CityAutocomplete />
            </Box>
        </div>
    );
}
