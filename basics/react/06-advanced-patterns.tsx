// ═══════════════════════════════════════════════════════════════
// REACT 06: ERROR BOUNDARIES · PORTALS · FORWARDREF  (Day 15b)
// ═══════════════════════════════════════════════════════════════

import React, {
    Component, ErrorInfo, ReactNode, useState, useEffect,
    useCallback, useRef, createContext, useContext,
    forwardRef, useImperativeHandle,
} from 'react';
import { createPortal } from 'react-dom';

// ───────────────────────────────────────────────────────────────
// 1. ERROR BOUNDARIES
// ───────────────────────────────────────────────────────────────
//
// Error Boundaries catch JavaScript errors in the component tree and
// display a fallback UI instead of crashing the whole app.
//
// WHAT THEY CATCH:
//  ✅ Errors during rendering
//  ✅ Errors in lifecycle methods
//  ✅ Errors in constructors of child components
//
// WHAT THEY DON'T CATCH:
//  ❌ Errors in event handlers (use try/catch there)
//  ❌ Async errors (setTimeout, Promise.reject)
//  ❌ Server-side rendering
//  ❌ Errors inside the boundary itself
//
// Must be a CLASS component — no hook equivalent for getDerivedStateFromError

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
    onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false, error: null };

    // Called during render when a child throws — update state to show fallback
    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    // Called after render — log, report to analytics service
    componentDidCatch(error: Error, info: ErrorInfo): void {
        console.error("ErrorBoundary caught:", error, info.componentStack);
        this.props.onError?.(error, info);
        // logToErrorService(error, info);
    }

    reset = () => this.setState({ hasError: false, error: null });

    render(): ReactNode {
        if (this.state.hasError && this.state.error) {
            if (typeof this.props.fallback === "function") {
                return this.props.fallback(this.state.error, this.reset);
            }
            return this.props.fallback ?? (
                <div style={{ padding: 16, border: "1px solid red", borderRadius: 4 }}>
                    <h2>Something went wrong</h2>
                    <details>
                        <summary>Error details</summary>
                        <pre style={{ fontSize: 12 }}>{this.state.error.message}</pre>
                    </details>
                    <button onClick={this.reset}>Try again</button>
                </div>
            );
        }
        return this.props.children;
    }
}

// ── Usage patterns ──
function AppWithBoundaries() {
    return (
        // Top-level: catch catastrophic errors
        <ErrorBoundary fallback={<FullPageError />}>

            {/* Feature-level: isolate failures */}
            <ErrorBoundary
                fallback={(error, reset) => (
                    <div>
                        <p>Dashboard failed: {error.message}</p>
                        <button onClick={reset}>Retry</button>
                    </div>
                )}
                onError={(e) => console.error("Dashboard error:", e)}
            >
                <Dashboard />
            </ErrorBoundary>

            {/* Widget-level: show placeholder instead of crashing */}
            <ErrorBoundary fallback={<p>Widget unavailable</p>}>
                <WeatherWidget />
            </ErrorBoundary>

        </ErrorBoundary>
    );
}

// Placeholder declarations for the example above
function FullPageError() { return <div>Fatal error — please refresh.</div>; }
function Dashboard()     { return <div>Dashboard</div>; }
function WeatherWidget() { return <div>Weather</div>; }

// ── Handling async errors with error boundaries ──
// Error boundaries don't catch async errors by default.
// Trick: use setState to re-throw in render phase.

function useThrowAsyncError() {
    const [, setState] = useState<null>(null);
    return useCallback((error: Error) => {
        setState(() => { throw error; }); // setState callback runs in render → caught by boundary
    }, []);
}

function AsyncDataLoader({ url }: { url: string }) {
    const throwError = useThrowAsyncError();

    useEffect(() => {
        fetch(url)
            .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
            .then(data => console.log(data))
            .catch(throwError); // now caught by ErrorBoundary!
    }, [url, throwError]);

    return <p>Loading…</p>;
}

// ── Async errors + ErrorBoundary + resetKeys ──
//
// When error occurs, boundary shows fallback.
// When user navigates to a different page (key changes), auto-reset.
// This pattern is implemented by the react-error-boundary library.

// ───────────────────────────────────────────────────────────────
// 2. PORTALS
// ───────────────────────────────────────────────────────────────
//
// Portals render children into a DOM node OUTSIDE the parent's DOM
// hierarchy, while maintaining the React component hierarchy.
//
// Events still bubble up through the React tree (not the DOM tree!).
// Context still works across portals.
//
// Use for: modals, tooltips, dropdowns, toasts
//   (anything that needs to escape overflow:hidden or z-index stacking)

// ── Basic portal ──
function Portal({ children }: { children: ReactNode }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
    if (!mounted) return null;
    return createPortal(children, document.body);
}

// ── Accessible Modal with portal ──
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const prevFocusRef = useRef<Element | null>(null);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    // Focus trap + body scroll lock
    useEffect(() => {
        if (!isOpen) return;
        prevFocusRef.current = document.activeElement;
        modalRef.current?.focus();
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
            (prevFocusRef.current as HTMLElement)?.focus();
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div
            style={{
                position: "fixed", inset: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 1000,
            }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? "modal-title" : undefined}
                tabIndex={-1}
                style={{
                    background: "#fff", borderRadius: 8,
                    padding: 24, maxWidth: 500, width: "90%",
                    maxHeight: "90vh", overflowY: "auto",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                    {title && <h2 id="modal-title" style={{ margin: 0 }}>{title}</h2>}
                    <button onClick={onClose} aria-label="Close">✕</button>
                </div>
                {children}
            </div>
        </div>,
        document.body
    );
}

// ── Toast notification system ──
interface Toast { id: string; message: string; type: "info" | "success" | "error"; }

const ToastContext = createContext<{ addToast: (t: Omit<Toast, "id">) => void } | null>(null);

function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((t: Omit<Toast, "id">) => {
        const id = crypto.randomUUID();
        setToasts(prev => [...prev, { ...t, id }]);
        setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 4000);
    }, []);

    const colors = { info: "#3498db", success: "#2ecc71", error: "#e74c3c" };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            {createPortal(
                <div style={{ position: "fixed", bottom: 16, right: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                    {toasts.map(t => (
                        <div key={t.id} style={{
                            background: colors[t.type], color: "#fff",
                            padding: "10px 16px", borderRadius: 6,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                        }}>
                            {t.message}
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
}

function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
}

// ── Tooltip with portal (escapes overflow:hidden) ──
function Tooltip({ label, children }: { label: string; children: ReactNode }) {
    const [visible, setVisible] = useState(false);
    const [pos, setPos]         = useState({ x: 0, y: 0 });
    const triggerRef            = useRef<HTMLSpanElement>(null);

    const show = () => {
        if (triggerRef.current) {
            const r = triggerRef.current.getBoundingClientRect();
            setPos({ x: r.left + r.width / 2, y: r.top - 8 });
        }
        setVisible(true);
    };

    return (
        <>
            <span ref={triggerRef} onMouseEnter={show} onMouseLeave={() => setVisible(false)}>
                {children}
            </span>
            {visible && createPortal(
                <div style={{
                    position: "fixed", left: pos.x, top: pos.y,
                    transform: "translate(-50%, -100%)",
                    background: "#333", color: "#fff",
                    padding: "4px 8px", borderRadius: 4, fontSize: 12,
                    pointerEvents: "none", zIndex: 9999,
                }}>
                    {label}
                </div>,
                document.body
            )}
        </>
    );
}

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

// Q1: What is an Error Boundary and why must it be a class component?
// A: An Error Boundary catches render-time errors in its child tree.
//    It must be a class because the two required lifecycle methods
//    (getDerivedStateFromError, componentDidCatch) have no hook equivalents.
//    React may provide a hook-based API in future versions.

// Q2: Which errors do Error Boundaries NOT catch?
// A: Event handler errors (use try/catch), async errors (setTimeout,
//    promises), SSR errors, and errors inside the boundary itself.

// Q3: What is a Portal and why would you use one?
// A: createPortal(children, container) renders children into a DOM node
//    OUTSIDE the component's DOM parent. Events still bubble through the
//    React tree. Use when a component needs to escape a parent's
//    overflow:hidden or z-index context (modals, tooltips, dropdowns).

// Q4: Implement a Confirm dialog using Portal + ErrorBoundary
function useConfirm() {
    const [resolve, setResolve] = useState<((v: boolean) => void) | null>(null);
    const [message, setMessage] = useState("");

    const confirm = useCallback((msg: string): Promise<boolean> => {
        setMessage(msg);
        return new Promise(res => setResolve(() => res));
    }, []);

    const handleResponse = (value: boolean) => {
        resolve?.(value);
        setResolve(null);
    };

    const dialog = resolve ? createPortal(
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#fff", padding: 24, borderRadius: 8 }}>
                <p>{message}</p>
                <button onClick={() => handleResponse(false)}>Cancel</button>
                <button onClick={() => handleResponse(true)}>Confirm</button>
            </div>
        </div>,
        document.body
    ) : null;

    return { confirm, dialog };
}

// Q5: How do you handle errors in event handlers (which Error Boundaries miss)?
// A: Use try/catch inside the event handler, then update local error state:
//
//    const [error, setError] = useState<Error | null>(null);
//    const handleClick = async () => {
//        try {
//            await riskyOperation();
//        } catch (e) {
//            setError(e as Error);
//        }
//    };
//    if (error) return <p>Error: {error.message}</p>;

export {
    ErrorBoundary, AppWithBoundaries, useThrowAsyncError, AsyncDataLoader,
    Portal, Modal, ToastProvider, useToast, Tooltip,
    useConfirm,
};

// ─── LIVE DEMO ───────────────────────────────────────────────────

function Box({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl p-5 mb-3.5 bg-white dark:bg-[#1E1E22] border border-[#E4E3E0] dark:border-white/[0.07] shadow-[0_1px_2px_rgba(28,25,23,0.05)] dark:shadow-none">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.09em] text-[#A8A29E] dark:text-[#55555F]">{title}</p>
            {sub && <p className="mb-3 text-[12px] text-[#A8A29E] dark:text-[#3A3A42] leading-relaxed">{sub}</p>}
            {children}
        </div>
    );
}

function CrashButton() {
    const [crash, setCrash] = useState(false);
    if (crash) throw new Error("Intentional crash from CrashButton");
    return <button onClick={() => setCrash(true)} style={{ color: '#ef4444' }}>💥 Throw an error</button>;
}

function ModalDemo() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button onClick={() => setOpen(true)}>Open Modal</button>
            <Modal isOpen={open} onClose={() => setOpen(false)} title="Portal Modal">
                <p>This modal is rendered into <code>document.body</code> via a portal — outside the React tree visually but inside it logically.</p>
                <p>Press <kbd>Escape</kbd> or click the backdrop to close.</p>
                <button onClick={() => setOpen(false)}>Close</button>
            </Modal>
        </>
    );
}

export default function Demo() {
    return (
        <div>
            <Box
                title="ErrorBoundary — catch render errors"
                sub="Click the button to throw. The boundary catches it and shows a fallback with a Reset button."
            >
                <ErrorBoundary>
                    <CrashButton />
                </ErrorBoundary>
            </Box>

            <Box
                title="Portal — render outside the DOM hierarchy"
                sub="The Modal is painted at document.body level, but React events still bubble through the component tree."
            >
                <ModalDemo />
            </Box>

            <Box title="Tooltip — portal-based hover overlay">
                <Tooltip label="I'm rendered at body level!">
                    <button>Hover me</button>
                </Tooltip>
            </Box>
        </div>
    );
}
