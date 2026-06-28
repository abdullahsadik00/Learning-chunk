// ═══════════════════════════════════════════════════════════════
// REACT 10: TESTING — React Testing Library · Vitest · MSW  (Day 17b)
// ═══════════════════════════════════════════════════════════════
//
// Run with: npx vitest (inside a Vite project)
//
// INSTALL:
//   npm i -D vitest @testing-library/react @testing-library/user-event
//           @testing-library/jest-dom jsdom msw
//
// vite.config.ts:
//   test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'] }
//
// src/test/setup.ts:
//   import '@testing-library/jest-dom';

// ─── NOTE ───────────────────────────────────────────────────────
// This file contains test code. It imports test utilities at the
// top level for demonstration purposes. In a real project these
// imports live in .test.tsx files, not in component files.
// ────────────────────────────────────────────────────────────────

// Simulated imports (available in test files):
// import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
// import { renderHook, act as hookAct } from '@testing-library/react';
// import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// import { http, HttpResponse } from 'msw';
// import { setupServer } from 'msw/node';

import React, { useState, useEffect, useReducer, useContext, createContext, ReactNode } from 'react';

// ───────────────────────────────────────────────────────────────
// COMPONENTS UNDER TEST (in a real project, these are in src/)
// ───────────────────────────────────────────────────────────────

function Counter({ initialCount = 0 }: { initialCount?: number }) {
    const [count, setCount] = useState(initialCount);
    return (
        <div>
            <p data-testid="count">Count: {count}</p>
            <button onClick={() => setCount(c => c + 1)}>Increment</button>
            <button onClick={() => setCount(c => c - 1)}>Decrement</button>
            <button onClick={() => setCount(0)}>Reset</button>
        </div>
    );
}

interface LoginFormProps { onSubmit: (data: { email: string; password: string }) => void; }

function LoginForm({ onSubmit }: LoginFormProps) {
    const [email, setEmail]       = useState("");
    const [password, setPassword] = useState("");
    const [error, setError]       = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) { setError("All fields required"); return; }
        if (!email.includes("@")) { setError("Invalid email"); return; }
        setError("");
        onSubmit({ email, password });
    };

    return (
        <form onSubmit={handleSubmit} aria-label="Login">
            {error && <p role="alert">{error}</p>}
            <label>
                Email
                <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    aria-required="true"
                />
            </label>
            <label>
                Password
                <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    aria-required="true"
                />
            </label>
            <button type="submit">Login</button>
        </form>
    );
}

interface UserCardProps { userId: string; }

function UserCard({ userId }: UserCardProps) {
    const [user, setUser]     = useState<{ name: string; email: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState("");

    useEffect(() => {
        fetch(`/api/users/${userId}`)
            .then(r => { if (!r.ok) throw new Error("User not found"); return r.json(); })
            .then(data => { setUser(data); setLoading(false); })
            .catch(e => { setError(e.message); setLoading(false); });
    }, [userId]);

    if (loading) return <p>Loading…</p>;
    if (error)   return <p role="alert">{error}</p>;
    return (
        <article>
            <h2>{user!.name}</h2>
            <p>{user!.email}</p>
        </article>
    );
}

// ── Custom hooks for testing ──
function useCounter(initial = 0) {
    const [count, setCount] = useState(initial);
    const increment = () => setCount(c => c + 1);
    const decrement = () => setCount(c => c - 1);
    const reset     = () => setCount(initial);
    return { count, increment, decrement, reset };
}

function useLocalStorage<T>(key: string, initial: T) {
    const [value, setValue] = useState<T>(() => {
        try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? initial; }
        catch { return initial; }
    });

    const set = (v: T) => {
        setValue(v);
        localStorage.setItem(key, JSON.stringify(v));
    };

    return [value, set] as const;
}

const ThemeContext = createContext<"light" | "dark">("light");

function ThemedButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
    const theme = useContext(ThemeContext);
    return (
        <button
            onClick={onClick}
            data-theme={theme}
            style={{ background: theme === "dark" ? "#333" : "#fff" }}
        >
            {children}
        </button>
    );
}

// ───────────────────────────────────────────────────────────────
// TEST EXAMPLES (would live in *.test.tsx files)
// ───────────────────────────────────────────────────────────────

// ── 1. Basic component test ──
//
// describe('Counter', () => {
//     it('renders initial count', () => {
//         render(<Counter initialCount={5} />);
//         expect(screen.getByTestId('count')).toHaveTextContent('Count: 5');
//     });
//
//     it('increments on button click', async () => {
//         const user = userEvent.setup();
//         render(<Counter />);
//
//         await user.click(screen.getByRole('button', { name: 'Increment' }));
//         expect(screen.getByTestId('count')).toHaveTextContent('Count: 1');
//     });
//
//     it('decrements below zero', async () => {
//         const user = userEvent.setup();
//         render(<Counter />);
//
//         await user.click(screen.getByRole('button', { name: 'Decrement' }));
//         expect(screen.getByTestId('count')).toHaveTextContent('Count: -1');
//     });
//
//     it('resets to zero', async () => {
//         const user = userEvent.setup();
//         render(<Counter initialCount={10} />);
//
//         await user.click(screen.getByRole('button', { name: 'Reset' }));
//         expect(screen.getByTestId('count')).toHaveTextContent('Count: 0');
//     });
// });

// ── 2. Form testing ──
//
// describe('LoginForm', () => {
//     it('shows error when submitted empty', async () => {
//         const user = userEvent.setup();
//         render(<LoginForm onSubmit={vi.fn()} />);
//
//         await user.click(screen.getByRole('button', { name: 'Login' }));
//         expect(screen.getByRole('alert')).toHaveTextContent('All fields required');
//     });
//
//     it('calls onSubmit with form data', async () => {
//         const user = userEvent.setup();
//         const onSubmit = vi.fn();
//         render(<LoginForm onSubmit={onSubmit} />);
//
//         await user.type(screen.getByLabelText('Email'), 'test@example.com');
//         await user.type(screen.getByLabelText('Password'), 'secret123');
//         await user.click(screen.getByRole('button', { name: 'Login' }));
//
//         expect(onSubmit).toHaveBeenCalledWith({
//             email: 'test@example.com',
//             password: 'secret123',
//         });
//         expect(onSubmit).toHaveBeenCalledTimes(1);
//     });
//
//     it('shows error for invalid email', async () => {
//         const user = userEvent.setup();
//         render(<LoginForm onSubmit={vi.fn()} />);
//
//         await user.type(screen.getByLabelText('Email'), 'notanemail');
//         await user.type(screen.getByLabelText('Password'), 'password');
//         await user.click(screen.getByRole('button', { name: 'Login' }));
//
//         expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');
//     });
// });

// ── 3. Async component with MSW ──
//
// const server = setupServer(
//     http.get('/api/users/:id', ({ params }) => {
//         if (params.id === '1') {
//             return HttpResponse.json({ name: 'Alice', email: 'alice@example.com' });
//         }
//         return new HttpResponse(null, { status: 404 });
//     })
// );
//
// beforeAll(() => server.listen());
// afterEach(() => server.resetHandlers());
// afterAll(() => server.close());
//
// describe('UserCard', () => {
//     it('shows loading state', () => {
//         render(<UserCard userId="1" />);
//         expect(screen.getByText('Loading…')).toBeInTheDocument();
//     });
//
//     it('renders user data', async () => {
//         render(<UserCard userId="1" />);
//         expect(await screen.findByText('Alice')).toBeInTheDocument();
//         expect(screen.getByText('alice@example.com')).toBeInTheDocument();
//     });
//
//     it('shows error for missing user', async () => {
//         render(<UserCard userId="999" />);
//         expect(await screen.findByRole('alert')).toHaveTextContent('User not found');
//     });
//
//     it('handles network error', async () => {
//         server.use(
//             http.get('/api/users/:id', () => HttpResponse.error())
//         );
//         render(<UserCard userId="1" />);
//         expect(await screen.findByRole('alert')).toBeInTheDocument();
//     });
// });

// ── 4. Testing custom hooks with renderHook ──
//
// describe('useCounter', () => {
//     it('starts at initial value', () => {
//         const { result } = renderHook(() => useCounter(5));
//         expect(result.current.count).toBe(5);
//     });
//
//     it('increments', () => {
//         const { result } = renderHook(() => useCounter(0));
//
//         act(() => result.current.increment());
//         expect(result.current.count).toBe(1);
//
//         act(() => result.current.increment());
//         expect(result.current.count).toBe(2);
//     });
//
//     it('resets to initial', () => {
//         const { result } = renderHook(() => useCounter(10));
//
//         act(() => { result.current.increment(); result.current.increment(); });
//         expect(result.current.count).toBe(12);
//
//         act(() => result.current.reset());
//         expect(result.current.count).toBe(10);  // back to initial, not 0
//     });
// });

// ── 5. Hook with timers (fake timers) ──
//
// describe('useDebounce', () => {
//     beforeEach(() => vi.useFakeTimers());
//     afterEach(() => vi.useRealTimers());
//
//     it('returns initial value immediately', () => {
//         const { result } = renderHook(() => useDebounce('hello', 500));
//         expect(result.current).toBe('hello');
//     });
//
//     it('debounces updates', () => {
//         const { result, rerender } = renderHook(
//             ({ value }) => useDebounce(value, 500),
//             { initialProps: { value: 'hello' } }
//         );
//
//         rerender({ value: 'world' });
//         expect(result.current).toBe('hello');  // not yet updated
//
//         act(() => vi.advanceTimersByTime(500));
//         expect(result.current).toBe('world');  // now updated
//     });
// });

// ── 6. Hook with Context (custom wrapper) ──
//
// const createWrapper = (theme: "light" | "dark") => {
//     return function Wrapper({ children }: { children: ReactNode }) {
//         return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
//     };
// };
//
// describe('ThemedButton', () => {
//     it('applies dark theme', () => {
//         render(<ThemedButton onClick={vi.fn()}>Click</ThemedButton>, {
//             wrapper: createWrapper('dark'),
//         });
//         expect(screen.getByRole('button')).toHaveAttribute('data-theme', 'dark');
//     });
// });

// ── 7. Custom render with all providers ──
//
// function renderWithProviders(
//     ui: ReactElement,
//     { theme = "light", queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } }), ...options } = {}
// ) {
//     function AllProviders({ children }: { children: ReactNode }) {
//         return (
//             <QueryClientProvider client={queryClient}>
//                 <ThemeContext.Provider value={theme}>
//                     <AuthProvider>
//                         {children}
//                     </AuthProvider>
//                 </ThemeContext.Provider>
//             </QueryClientProvider>
//         );
//     }
//     return render(ui, { wrapper: AllProviders, ...options });
// }
//
// // Use in tests:
// it('renders with all providers', () => {
//     renderWithProviders(<MyProtectedPage />);
//     expect(screen.getByText('Please log in.')).toBeInTheDocument();
// });

// ── 8. Testing queries ──
//
// Prefer accessible queries in this order:
//
//  getByRole      — most reliable (matches what screen reader sees)
//  getByLabelText — form inputs associated with labels
//  getByPlaceholderText — inputs with placeholder
//  getByText      — visible text content
//  getByTestId    — last resort (data-testid attribute)
//
// getBy*   — throws if not found (good for asserting presence)
// queryBy* — returns null if not found (good for asserting absence)
// findBy*  — async, returns promise (good for async content)
//
// Examples:
//  screen.getByRole('button', { name: /submit/i })
//  screen.getByLabelText('Email')
//  screen.getByRole('heading', { name: 'Dashboard', level: 1 })
//  screen.queryByRole('alert')  // null if no alert
//  await screen.findByText('Data loaded')  // waits up to 1000ms

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

// Q1: Why prefer screen.getByRole over screen.getByTestId?
// A: getByRole queries match what assistive technology sees — they test
//    the accessible tree, not implementation details. If a button's role
//    changes, the test breaks appropriately. getByTestId can pass even
//    when the UI is inaccessible (e.g. a div with onClick but no role).

// Q2: What is the difference between fireEvent and userEvent?
// A: fireEvent: dispatches a single synthetic DOM event (low-level).
//    userEvent: simulates full user interaction sequences — typing
//    triggers keydown/keypress/input/keyup events in the right order,
//    more closely mimicking real browser behavior. Prefer userEvent.

// Q3: Why do we need fake timers for testing debounced hooks?
// A: Real timers would make tests wait for actual time to pass (slow).
//    vi.useFakeTimers() replaces setTimeout/setInterval with mocks.
//    vi.advanceTimersByTime(n) fast-forwards time without waiting,
//    making timer-based tests instant and deterministic.

// Q4: What is MSW and why is it preferred over mocking fetch directly?
// A: Mock Service Worker intercepts requests at the network level
//    (via Service Worker in browsers, http interceptor in Node).
//    Unlike vi.mock(fetch), MSW:
//    • Tests real fetch/axios code paths (not mocked implementation)
//    • Errors fail at the network level (realistic error handling)
//    • Can be reused across unit, integration, and E2E tests
//    • Server handlers are declarative and easy to override per-test

// Q5: What does act() do in React tests?
// A: Ensures all pending state updates, effects, and re-renders complete
//    before assertions run. Testing Library's async utilities (findBy*,
//    waitFor) handle act() automatically. You need explicit act() when
//    imperatively calling functions that trigger state updates outside
//    React's event system (e.g. calling hook methods directly via renderHook).

export { Counter, LoginForm, UserCard, useCounter, useLocalStorage, ThemedButton, ThemeContext };

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

export default function Demo() {
    const [lastSubmit, setLastSubmit] = useState<{ email: string; password: string } | null>(null);

    return (
        <div>
            <Box
                title="Counter — the canonical testing example"
                sub="Run tests with: cd basics/react && npx vitest. These components are tested via React Testing Library."
            >
                <Counter initialCount={0} />
            </Box>

            <Box
                title="LoginForm — controlled form with validation"
                sub="Try submitting empty, or a bad email. Tests use userEvent to simulate typing."
            >
                <LoginForm onSubmit={data => setLastSubmit(data)} />
                {lastSubmit && (
                    <pre style={{ marginTop: 8, background: '#f0fdf4', padding: 10, borderRadius: 4, fontSize: 12 }}>
                        {JSON.stringify(lastSubmit, null, 2)}
                    </pre>
                )}
            </Box>

            <Box
                title="ThemeContext — testing context consumers"
                sub="Tests use a wrapper option in render() to provide the context."
            >
                <ThemeContext.Provider value="dark">
                    <ThemedButton onClick={() => {}}>Themed button</ThemedButton>
                </ThemeContext.Provider>
            </Box>
        </div>
    );
}
