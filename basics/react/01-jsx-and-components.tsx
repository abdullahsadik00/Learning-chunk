// ═══════════════════════════════════════════════════════════════
// REACT 01: JSX & COMPONENTS  (Day 12)
// Setup: npm install → npm run dev
// Type-check: npm run check
// ═══════════════════════════════════════════════════════════════
//
// REACT CORE PHILOSOPHY
//  1. DECLARATIVE — describe WHAT you want, React figures out HOW
//  2. COMPONENT-BASED — encapsulated pieces that manage their own state
//  3. UNIDIRECTIONAL DATA FLOW — data goes down (props), events go up (callbacks)
//  4. VIRTUAL DOM — efficient updates through reconciliation
//
// NOTE: These are teaching files. To see them run, paste snippets into
//       a Vite project created with: npm create vite@latest my-app -- --template react-ts

import React, {
    useState, useEffect, useCallback, useMemo,
    Component, Fragment, forwardRef, useRef
} from 'react';

// ───────────────────────────────────────────────────────────────
// 1. JSX IS SYNTACTIC SUGAR
// ───────────────────────────────────────────────────────────────
//
// JSX:
//   <div className="box"><h1>Hello</h1></div>
//
// Compiles to (new JSX transform, React 17+):
//   import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
//   _jsxs("div", { className: "box", children: [ _jsx("h1", { children: "Hello" }) ] })
//
// Old transform (still valid):
//   React.createElement("div", { className: "box" }, React.createElement("h1", null, "Hello"))
//
// KEY RULES:
//  • Single root element (or Fragment <>)
//  • className instead of class
//  • htmlFor instead of for
//  • camelCase attributes: onClick, tabIndex, onChange, onSubmit
//  • style must be an object: style={{ color: 'red' }}
//  • Self-closing required for void elements: <br />, <input />
//  • Comments inside JSX: {/* comment */}

function JSXExamples() {
    const user = { name: "Alice", isAdmin: true };
    const items = ["Apple", "Banana", "Cherry"];
    const status: "loading" | "success" | "error" = "success";

    return (
        <div>
            {/* ── 1. Variable interpolation ── */}
            <p>Hello, {user.name}!</p>

            {/* ── 2. Expressions (any JS expression works) ── */}
            <p>2 + 2 = {2 + 2}</p>
            <p>Uppercase: {user.name.toUpperCase()}</p>

            {/* ── 3. Ternary for conditional rendering ── */}
            <p>{user.isAdmin ? "Admin 👑" : "Guest"}</p>

            {/* ── 4. Logical AND — render or nothing ── */}
            {user.isAdmin && <span className="badge">Admin</span>}

            {/* ── 5. Nullish coalescing ── */}
            <p>{(user as any).nickname ?? user.name}</p>

            {/* ── 6. Map for lists — KEY is required and must be stable ── */}
            <ul>
                {items.map((item) => (
                    <li key={item}>{item}</li>
                ))}
            </ul>

            {/* ── 7. Object map for switch-like rendering ── */}
            {{
                loading: <span>⏳ Loading…</span>,
                success: <span>✅ Done</span>,
                error:   <span>❌ Error</span>,
            }[status]}

            {/* ── 8. Spread props ── */}
            {/* <input {...{ type: "email", required: true }} /> */}

            {/* ── 9. Template literal className ── */}
            <div className={`card ${user.isAdmin ? "card--admin" : ""}`}>
                Content
            </div>

            {/* ── 10. Style object ── */}
            <p style={{ color: "coral", fontWeight: "bold" }}>Styled</p>
        </div>
    );
}

// ─── WHY KEYS MATTER ────────────────────────────────────────────
//
// WITHOUT keys: React compares by position
//   Before [A,B,C] → After [Z,A,B,C]
//   React does 3 updates (A→Z, B→A, C→B) + 1 insert
//
// WITH keys: React matches by identity
//   React sees: "Z" is new (insert), A/B/C just moved
//   React does 1 insert + 3 DOM moves — MUCH faster
//
// ✅ Use stable unique IDs (item.id)
// ❌ Never use Math.random() — creates new keys every render
// ❌ Avoid array index unless list is static, never reordered

function KeysExample() {
    const items = [
        { id: "a", name: "Apple" },
        { id: "b", name: "Banana" },
    ];
    return (
        <ul>
            {items.map((item) => (
                // ✅ Stable unique key
                <li key={item.id}>{item.name}</li>
            ))}
        </ul>
    );
}

// ───────────────────────────────────────────────────────────────
// 2. FUNCTION COMPONENTS
// ───────────────────────────────────────────────────────────────

// ── 2a. Basic function component ──
interface WelcomeProps {
    name: string;
    greeting?: string;
}

// Explicit return type (preferred over React.FC for clarity)
function Welcome({ name, greeting = "Hello" }: WelcomeProps): React.JSX.Element {
    return <h1>{greeting}, {name}!</h1>;
}

// Arrow function variant — same result
const WelcomeArrow = ({ name, greeting = "Hello" }: WelcomeProps) => (
    <h1>{greeting}, {name}!</h1>
);

// ── 2b. Default props via destructuring defaults ──
interface ButtonProps {
    variant?: "primary" | "secondary" | "danger";
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
    onClick?: () => void;
    children: React.ReactNode;
}

function Button({
    variant = "primary",
    size = "md",
    disabled = false,
    onClick,
    children,
}: ButtonProps) {
    return (
        <button
            className={`btn btn--${variant} btn--${size}`}
            disabled={disabled}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

// ── 2c. Rest props (spread remaining props to underlying element) ──
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

// Destructure known props; spread the rest to <input>
function Input({ label, error, ...inputProps }: InputProps) {
    return (
        <div className="form-group">
            <label>{label}</label>
            <input {...inputProps} />
            {error && <span className="error">{error}</span>}
        </div>
    );
}

// Usage: all standard <input> attributes work automatically
// <Input label="Email" type="email" value={email} onChange={handleChange} error={err} />

// ── 2d. Children patterns ──
interface CardProps {
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

function Card({ title, children, footer }: CardProps) {
    return (
        <div className="card">
            {title && <div className="card__header">{title}</div>}
            <div className="card__body">{children}</div>
            {footer && <div className="card__footer">{footer}</div>}
        </div>
    );
}

// Multiple named slots (like named children)
interface LayoutProps {
    header: React.ReactNode;
    sidebar?: React.ReactNode;
    children: React.ReactNode;   // main content
    footer?: React.ReactNode;
}

function Layout({ header, sidebar, children, footer }: LayoutProps) {
    return (
        <div className="layout">
            <header>{header}</header>
            {sidebar && <aside>{sidebar}</aside>}
            <main>{children}</main>
            {footer && <footer>{footer}</footer>}
        </div>
    );
}

// ───────────────────────────────────────────────────────────────
// 3. CONDITIONAL RENDERING PATTERNS
// ───────────────────────────────────────────────────────────────

interface ConditionalProps {
    isLoggedIn: boolean;
    isAdmin: boolean;
    count: number;
    status: "idle" | "loading" | "success" | "error";
    error?: string;
}

function ConditionalExamples({ isLoggedIn, isAdmin, count, status, error }: ConditionalProps) {
    // Pattern 1: Early return (cleanest for major branches)
    if (!isLoggedIn) {
        return <p>Please log in.</p>;
    }

    // Pattern 2: Ternary inside JSX
    // Pattern 3: && for "render or nothing"
    // ⚠️ Gotcha: {count && <p>{count}</p>} renders "0" when count is 0!
    // Fix: {count > 0 && <p>{count}</p>}  or  {!!count && <p>{count}</p>}

    return (
        <div>
            {/* Ternary */}
            {isAdmin ? <span>Admin 👑</span> : <span>User</span>}

            {/* AND — safe version */}
            {count > 0 && <span>({count} items)</span>}

            {/* Object map — like a switch */}
            {{
                idle:    <p>Ready</p>,
                loading: <p>Loading…</p>,
                success: <p>✅ Done</p>,
                error:   <p>❌ {error}</p>,
            }[status]}
        </div>
    );
}

// ───────────────────────────────────────────────────────────────
// 4. CLASS COMPONENTS (legacy — still seen in interviews)
// ───────────────────────────────────────────────────────────────
//
// CLASS COMPONENT LIFECYCLE:
//
// MOUNTING:
//   constructor(props)
//   ↓ static getDerivedStateFromProps(props, state)
//   ↓ render()
//   ↓ componentDidMount()        ← API calls, subscriptions
//
// UPDATING:
//   static getDerivedStateFromProps(props, state)
//   ↓ shouldComponentUpdate(nextProps, nextState) → bool
//   ↓ render()
//   ↓ getSnapshotBeforeUpdate(prevProps, prevState)
//   ↓ componentDidUpdate(prevProps, prevState, snapshot)
//
// UNMOUNTING:
//   componentWillUnmount()       ← cleanup timers, subscriptions
//
// ERROR HANDLING:
//   static getDerivedStateFromError(error)
//   componentDidCatch(error, errorInfo)

interface CounterState { count: number; }
interface CounterClassProps { initialCount?: number; }

class CounterClass extends Component<CounterClassProps, CounterState> {
    state: CounterState = { count: this.props.initialCount ?? 0 };

    componentDidMount() {
        document.title = `Count: ${this.state.count}`;
    }

    componentDidUpdate(_: CounterClassProps, prevState: CounterState) {
        if (prevState.count !== this.state.count) {
            document.title = `Count: ${this.state.count}`;
        }
    }

    componentWillUnmount() {
        document.title = "React App";
    }

    // Class field syntax (no .bind(this) needed)
    handleIncrement = () => {
        // Always use functional update when new state depends on old state
        this.setState((prev) => ({ count: prev.count + 1 }));
    };

    handleDecrement = () => {
        this.setState((prev) => ({ count: prev.count - 1 }));
    };

    render() {
        return (
            <div>
                <p>Count: {this.state.count}</p>
                <button onClick={this.handleIncrement}>+</button>
                <button onClick={this.handleDecrement}>−</button>
            </div>
        );
    }
}

// ─── CLASS vs FUNCTION COMPARISON ───────────────────────────────
//
// CLASS COMPONENT                   │  FUNCTION COMPONENT
// ─────────────────────────────────────────────────────────────
// class Foo extends Component {}    │  function Foo() {}
// this.state / this.setState()      │  useState()
// componentDidMount                 │  useEffect(() => {}, [])
// componentDidUpdate                │  useEffect(() => {}, [dep])
// componentWillUnmount              │  useEffect(() => { return cleanup }, [])
// shouldComponentUpdate             │  React.memo() + comparison
// static getDerivedStateFromError   │  (still needs class — ErrorBoundary)
// this.props.children               │  props.children (or children param)
// Binding: this.fn = this.fn.bind() │  No binding needed
//
// Modern React: ALWAYS write function components with hooks.
// Class components only when you need an ErrorBoundary.

// ───────────────────────────────────────────────────────────────
// 5. FRAGMENTS — avoid wrapping <div> noise
// ───────────────────────────────────────────────────────────────

function FragmentExamples() {
    const items = [{ id: 1, term: "JSX", def: "JavaScript XML" }];

    return (
        <>
            <p>Short syntax — no extra DOM node</p>
            <p>Great for sibling elements</p>

            {/* Need key? Use long form: */}
            <dl>
                {items.map((item) => (
                    <Fragment key={item.id}>
                        <dt>{item.term}</dt>
                        <dd>{item.def}</dd>
                    </Fragment>
                ))}
            </dl>
        </>
    );
}

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

// Q1: What does JSX compile to?
// → React.createElement(type, props, ...children) calls, or
//   _jsx/_jsxs from 'react/jsx-runtime' with the new transform.

// Q2: Why is className used instead of class?
// → JSX is JavaScript; 'class' is a reserved keyword. htmlFor is used
//   instead of 'for' for the same reason.

// Q3: What is the key prop for?
// → Helps React identify which items changed/moved in a list during
//   reconciliation, enabling efficient DOM updates.

// Q4: Implement a UserCard component
interface UserCardProps {
    name: string;
    email: string;
    role: "admin" | "user" | "guest";
    avatar?: string;
}

function UserCard({ name, email, role, avatar }: UserCardProps) {
    const roleColors: Record<UserCardProps["role"], string> = {
        admin: "#e74c3c",
        user:  "#3498db",
        guest: "#95a5a6",
    };

    return (
        <div className="user-card">
            {avatar ? (
                <img src={avatar} alt={`${name}'s avatar`} />
            ) : (
                <div className="avatar-placeholder">{name[0].toUpperCase()}</div>
            )}
            <div className="user-info">
                <h3>{name}</h3>
                <p>{email}</p>
                <span
                    className="role-badge"
                    style={{ backgroundColor: roleColors[role] }}
                >
                    {role}
                </span>
            </div>
        </div>
    );
}

// Q5: What's wrong with this component?
// function Bad() {
//   const [items, setItems] = useState([]);
//   items.push("new item");  // ❌ direct mutation — won't trigger re-render
//   setItems(items);          // ❌ same reference, React skips update
// }
//
// Fix: setItems(prev => [...prev, "new item"]);

export {
    JSXExamples,
    KeysExample,
    Welcome,
    WelcomeArrow,
    Button,
    Input,
    Card,
    Layout,
    ConditionalExamples,
    CounterClass,
    FragmentExamples,
    UserCard,
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

export default function Demo() {
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const [isAdmin, setIsAdmin]       = useState(false);
    const [count, setCount]           = useState(3);
    const [status, setStatus]         = useState<"idle"|"loading"|"success"|"error">("success");

    return (
        <div>
            <Box title="JSX expressions">
                <JSXExamples />
            </Box>

            <Box title="Conditional rendering — toggle the controls">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12, padding: '10px 12px', background: '#f9fafb', borderRadius: 6 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                        <input type="checkbox" checked={isLoggedIn} onChange={e => setIsLoggedIn(e.target.checked)} /> Logged in
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                        <input type="checkbox" checked={isAdmin} onChange={e => setIsAdmin(e.target.checked)} /> Admin
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                        Count: <input type="number" value={count} onChange={e => setCount(Number(e.target.value))}
                            style={{ width: 56, marginLeft: 4, padding: '2px 6px' }} />
                    </label>
                    <select value={status} onChange={e => setStatus(e.target.value as typeof status)} style={{ fontSize: 13, padding: '2px 6px' }}>
                        {(['idle','loading','success','error'] as const).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <ConditionalExamples isLoggedIn={isLoggedIn} isAdmin={isAdmin} count={count} status={status} error="Something went wrong" />
            </Box>

            <Box title="Class component — CounterClass">
                <CounterClass initialCount={0} />
            </Box>

            <Box title="UserCard component">
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <UserCard name="Sadik" email="sadik@example.com" role="admin" />
                    <UserCard name="Priya" email="priya@example.com" role="user" />
                    <UserCard name="Guest" email="guest@example.com" role="guest" />
                </div>
            </Box>
        </div>
    );
}
