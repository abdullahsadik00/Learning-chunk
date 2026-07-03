// ═══════════════════════════════════════════════════════════════
// REACT 16: TYPESCRIPT IN REACT — every TS topic, applied  (Day 17d)
// Setup: npm install → npm run dev
// Type-check: npm run check
// ═══════════════════════════════════════════════════════════════
//
// This file is the bridge between basics/typescript/ (files 01–08) and
// React. Every concept taught in the standalone TypeScript curriculum is
// re-demonstrated here inside a real React pattern, so you see WHERE each
// language feature actually earns its keep in a component tree.
//
// Mapping to the TypeScript curriculum:
//   TS 01 fundamentals   → §1  primitives, arrays, tuples, enums, assertions
//   TS 02 type-system    → §2  unions, intersections, literals, aliases, interfaces
//   TS 03 functions      → §3  annotations, optional/rest, overloads, generic fns
//   TS 04 generics       → §4  generic components/hooks, conditional, infer, mapped
//   TS 05 utility-types  → §5  Partial/Pick/Omit/Record/ReturnType/… on props
//   TS 06 classes-oop    → §6  class components, services, ErrorBoundary, abstract
//   TS 07 decorators     → §7  standard (Stage 3) decorators on a store class
//   TS 08 type-guards    → §8  typeof/instanceof/in, discriminated unions, predicates
//
// NOTE: Teaching file. Paste snippets into a Vite react-ts app to run them.

import React, {
    useState, useEffect, useRef, useCallback,
    Component, createContext,
} from 'react';
import type { ReactNode, ChangeEvent, FormEvent } from 'react';

// ═══════════════════════════════════════════════════════════════
// §1. FUNDAMENTALS  (TS 01)  — primitives, arrays, tuples, enums, assertions
// ═══════════════════════════════════════════════════════════════

// ── 1.1 Primitives as props & state ──
// Props are just a typed object. useState infers its type from the initial value.
interface CounterProps {
    label: string;          // string
    initial: number;        // number
    disabled: boolean;      // boolean
}

function Counter({ label, initial, disabled }: CounterProps) {
    // useState<number> is inferred from `initial`. Be explicit only when the
    // initial value is null/undefined and the real type is wider.
    const [count, setCount] = useState(initial);
    const [note, setNote] = useState<string | null>(null); // explicit: wider than init

    return (
        <button disabled={disabled} onClick={() => setCount((c) => c + 1)}>
            {label}: {count} {note && `(${note})`}
        </button>
    );
}

// ── 1.2 Array types ──
// string[]  vs  Array<T>  — identical; use [] for simple, Array<> for generics.
function TagList({ tags }: { tags: string[] }) {
    return (
        <ul>
            {tags.map((t, i) => (
                <li key={i}>{t}</li>
            ))}
        </ul>
    );
}

// ── 1.3 Tuple types — the classic custom-hook return shape ──
// useState itself returns a tuple: [value, setter]. Model your own hooks the same.
function useToggle(initial = false): [boolean, () => void] {
    const [on, setOn] = useState(initial);
    const toggle = useCallback(() => setOn((v) => !v), []);
    return [on, toggle]; // tuple → callers can rename via destructuring
}

// ── 1.4 Enums vs `as const` unions ──
// Prefer `as const` union objects in React: they're erasable, tree-shakeable,
// and produce plain string literal types (great for props). Enums also work.
enum LoadStatus { Idle = 'idle', Loading = 'loading', Done = 'done' }

const Theme = { Light: 'light', Dark: 'dark' } as const;
type ThemeName = (typeof Theme)[keyof typeof Theme]; // 'light' | 'dark'

// ── 1.5 Type assertions — the few legitimate places in React ──
function AssertionExamples() {
    const inputRef = useRef<HTMLInputElement>(null);

    const readValue = () => {
        // e.target is EventTarget; assert to the concrete element you rendered.
        const el = inputRef.current;
        if (el) console.log((el as HTMLInputElement).value);
    };

    // `as const` freezes a literal so it's a discriminant, not just `string`.
    const config = { mode: 'grid', cols: 3 } as const;

    return <input ref={inputRef} onBlur={readValue} data-mode={config.mode} />;
}

// ═══════════════════════════════════════════════════════════════
// §2. TYPE SYSTEM  (TS 02) — unions, intersections, literals, aliases, interfaces
// ═══════════════════════════════════════════════════════════════

// ── 2.1 Literal union for variant props (the React idiom) ──
type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

// ── 2.2 Intersection to compose prop contracts ──
// Merge your own props with the intrinsic <button> props so consumers can pass
// onClick, type, aria-*, etc. without you re-declaring them.
type OwnButtonProps = {
    variant?: ButtonVariant;
    size?: ButtonSize;
};
type Button2Props = OwnButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>;

function Button({ variant = 'primary', size = 'md', children, ...rest }: Button2Props) {
    return (
        <button className={`btn btn-${variant} btn-${size}`} {...rest}>
            {children}
        </button>
    );
}

// ── 2.3 Discriminated union for mutually-exclusive prop sets ──
// Either an icon-only button (needs `label` for a11y) or a text button.
type IconButton = { kind: 'icon'; icon: ReactNode; label: string };
type TextButton = { kind: 'text'; children: ReactNode };
type SmartButtonProps = IconButton | TextButton;

function SmartButton(props: SmartButtonProps) {
    // Narrowing on the `kind` discriminant tells TS which fields are present.
    if (props.kind === 'icon') {
        return <button aria-label={props.label}>{props.icon}</button>;
    }
    return <button>{props.children}</button>;
}

// ── 2.4 Interface vs type alias ──
// Rule of thumb used across this repo: `interface` for object/props shapes that
// may be extended; `type` for unions, tuples, and computed/mapped types.
interface User {
    id: string;
    name: string;
    email: string;
}
type UserId = User['id']; // indexed access — derive, don't duplicate

// ═══════════════════════════════════════════════════════════════
// §3. FUNCTIONS  (TS 03) — annotations, optional/default/rest, overloads, generic fns
// ═══════════════════════════════════════════════════════════════

// ── 3.1 Typing event handlers (the #1 daily TS-in-React skill) ──
function Field() {
    const [value, setValue] = useState('');

    // ChangeEvent<HTMLInputElement> — the element determines .target's type.
    const onChange = (e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value);
    // FormEvent for <form onSubmit>. Always preventDefault for controlled forms.
    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log('submit', value);
    };

    return (
        <form onSubmit={onSubmit}>
            <input value={value} onChange={onChange} />
        </form>
    );
}

// ── 3.2 Function-type expressions as callback props + optional/default/rest ──
type OnSelect = (id: string, index: number) => void;

interface MenuProps {
    items: string[];
    onSelect?: OnSelect;          // optional callback (function-type expression)
    separator?: string;           // optional with a default in the impl
}

function Menu({ items, onSelect, separator = ' · ' }: MenuProps) {
    // ...rest params: collect extra classes without declaring each one.
    const classes = (...names: string[]) => names.filter(Boolean).join(' ');
    return (
        <nav className={classes('menu', items.length ? 'has-items' : '')}>
            {items.map((label, i) => (
                <React.Fragment key={label}>
                    {i > 0 && separator}
                    <button onClick={() => onSelect?.(label, i)}>{label}</button>
                </React.Fragment>
            ))}
        </nav>
    );
}

// ── 3.3 Generic function component — a reusable typed <List /> ──
// <T,> (trailing comma) disambiguates a generic from JSX in .tsx files.
function List<T>({
    items,
    renderItem,
    keyOf,
}: {
    items: T[];
    renderItem: (item: T, index: number) => ReactNode; // function-type expression
    keyOf: (item: T) => string | number;               // extract a stable key
}) {
    return (
        <ul>
            {items.map((item, i) => (
                <li key={keyOf(item)}>{renderItem(item, i)}</li>
            ))}
        </ul>
    );
}

// ── 3.4 Overloads — one hook, two call signatures ──
// A localStorage hook: with a default it never returns undefined; without one it may.
function usePersisted<T>(key: string, initial: T): [T, (v: T) => void];
function usePersisted<T>(key: string): [T | undefined, (v: T) => void];
function usePersisted<T>(key: string, initial?: T) {
    const [val, setVal] = useState<T | undefined>(() => {
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
        return raw ? (JSON.parse(raw) as T) : initial;
    });
    const set = useCallback(
        (v: T) => {
            setVal(v);
            window.localStorage.setItem(key, JSON.stringify(v));
        },
        [key],
    );
    return [val, set] as const;
}

// ═══════════════════════════════════════════════════════════════
// §4. GENERICS  (TS 04) — generic hooks, conditional types, infer, mapped, template literals
// ═══════════════════════════════════════════════════════════════

// ── 4.1 Generic custom hook — useFetch<T> ──
interface FetchState<T> {
    data: T | null;
    error: Error | null;
    loading: boolean;
}

function useFetch<T>(url: string): FetchState<T> {
    const [state, setState] = useState<FetchState<T>>({
        data: null,
        error: null,
        loading: true,
    });

    useEffect(() => {
        let alive = true;
        setState({ data: null, error: null, loading: true });
        fetch(url)
            .then((r) => r.json() as Promise<T>)
            .then((data) => alive && setState({ data, error: null, loading: false }))
            .catch((error: Error) => alive && setState({ data: null, error, loading: false }));
        return () => {
            alive = false;
        };
    }, [url]);

    return state;
}

// ── 4.2 Mapped type — build a form's state/errors shape from its value shape ──
// FormErrors<T> mirrors every field of T as an optional string message.
type FormErrors<T> = { [K in keyof T]?: string };
type Touched<T> = { [K in keyof T]?: boolean };

interface LoginValues {
    email: string;
    password: string;
}

// Constrain to `object` (not Record<string, unknown>) so plain interfaces —
// which don't carry an implicit index signature — still satisfy it.
function useForm<T extends object>(initial: T) {
    const [values, setValues] = useState<T>(initial);
    const [errors, setErrors] = useState<FormErrors<T>>({});
    const [touched, setTouched] = useState<Touched<T>>({});

    // keyof T keeps setField honest — you can't set a field that doesn't exist.
    const setField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
        setValues((v) => ({ ...v, [key]: value }));
        setTouched((t) => ({ ...t, [key]: true }));
    }, []);

    return { values, errors, touched, setField, setErrors };
}

// ── 4.3 Conditional type + infer — unwrap a hook's return element ──
// Given useFetch<User[]>, extract `User` for downstream typing.
type ElementOf<T> = T extends Array<infer E> ? E : T;
type Unwrapped = ElementOf<FetchState<User[]>['data']>; // User | null → User

// ── 4.4 Template literal types — typed event names / CSS custom props ──
type DomainEvent = 'user' | 'order';
type Action = 'created' | 'updated' | 'deleted';
type EventName = `${DomainEvent}:${Action}`; // "user:created" | "order:deleted" | …

function useEventBus() {
    const listeners = useRef<Partial<Record<EventName, Array<() => void>>>>({});
    const on = useCallback((name: EventName, fn: () => void) => {
        (listeners.current[name] ??= []).push(fn);
    }, []);
    return { on };
}

// ═══════════════════════════════════════════════════════════════
// §5. UTILITY TYPES  (TS 05) — Partial/Required/Readonly/Pick/Omit/Record/ReturnType…
// ═══════════════════════════════════════════════════════════════

interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    inStock: boolean;
}

// ── 5.1 Pick / Omit — derive prop types from the domain model ──
// A card only needs a subset — Pick keeps it in sync if Product changes.
type ProductCardProps = Pick<Product, 'name' | 'price' | 'inStock'>;
function ProductCard({ name, price, inStock }: ProductCardProps) {
    return <div>{name} — ${price} {inStock ? '✓' : '✗'}</div>;
}

// Omit to strip the server-generated id when creating.
type NewProduct = Omit<Product, 'id'>;

// ── 5.2 Partial — the update/patch pattern ──
// An editor emits only changed fields; reducer merges them.
type ProductPatch = Partial<Product>;
function applyPatch(p: Product, patch: ProductPatch): Product {
    return { ...p, ...patch };
}

// ── 5.3 Readonly — immutable props (React props are conceptually readonly) ──
type FrozenProduct = Readonly<Product>;

// ── 5.4 Record — lookup maps / normalized state / style dictionaries ──
type ProductsById = Record<string, Product>;               // normalized store slice
type VariantStyles = Record<ButtonVariant, string>;         // exhaustive style map
const variantClass: VariantStyles = {
    primary: 'bg-blue-600',
    secondary: 'bg-gray-200',
    ghost: 'bg-transparent',
};

// ── 5.5 ReturnType / Parameters — infer types FROM code, not by hand ──
// Type a context value as exactly what a hook returns — no drift.
type FormApi = ReturnType<typeof useForm<LoginValues>>;
const FormContext = createContext<FormApi | null>(null);

// ── 5.6 Exclude / Extract / NonNullable ──
type NonGhost = Exclude<ButtonVariant, 'ghost'>;   // 'primary' | 'secondary'
type SafeData = NonNullable<FetchState<User>['data']>; // User (drops null)

// ═══════════════════════════════════════════════════════════════
// §6. CLASSES & OOP  (TS 06) — class components, services, ErrorBoundary, abstract
// ═══════════════════════════════════════════════════════════════

// ── 6.1 Typed class component: Component<Props, State> ──
interface ClockProps { format: '12h' | '24h'; }
interface ClockState { now: Date; }

class Clock extends Component<ClockProps, ClockState> {
    private timer?: ReturnType<typeof setInterval>; // private field + inferred type
    state: ClockState = { now: new Date() };

    componentDidMount() {
        this.timer = setInterval(() => this.setState({ now: new Date() }), 1000);
    }
    componentWillUnmount() {
        if (this.timer) clearInterval(this.timer);
    }
    render() {
        const opts: Intl.DateTimeFormatOptions =
            this.props.format === '12h' ? { hour12: true } : { hour12: false };
        return <time>{this.state.now.toLocaleTimeString(undefined, opts)}</time>;
    }
}

// ── 6.2 Error Boundary — the one thing that STILL requires a class in React ──
interface EBProps { fallback: ReactNode; children: ReactNode; }
interface EBState { hasError: boolean; }

class ErrorBoundary extends Component<EBProps, EBState> {
    state: EBState = { hasError: false };
    // static method — lifecycle for deriving state from a thrown error.
    static getDerivedStateFromError(): EBState {
        return { hasError: true };
    }
    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('Boundary caught:', error, info.componentStack);
    }
    render() {
        return this.state.hasError ? <>{this.props.fallback}</> : <>{this.props.children}</>;
    }
}

// ── 6.3 Abstract base + inheritance — a service layer used by hooks ──
// Access modifiers, abstract method, getter, protected member.
abstract class ApiClient {
    protected constructor(private readonly baseUrl: string) {}
    // abstract: subclass MUST define how a path maps to a full URL.
    protected abstract resolve(path: string): string;
    get root(): string { return this.baseUrl; } // getter
    async get<T>(path: string): Promise<T> {
        const res = await fetch(this.resolve(path));
        return res.json() as Promise<T>;
    }
}

class JsonApi extends ApiClient {
    constructor(baseUrl: string) { super(baseUrl); }
    protected resolve(path: string): string {
        return `${this.root}/${path.replace(/^\//, '')}`;
    }
}

// Consume the class instance from a hook — OOP and hooks coexist fine.
function useProducts(api: JsonApi) {
    const [items, setItems] = useState<Product[]>([]);
    useEffect(() => {
        api.get<Product[]>('/products').then(setItems);
    }, [api]);
    return items;
}

// ═══════════════════════════════════════════════════════════════
// §7. DECORATORS  (TS 07) — standard (Stage 3) decorators, no experimentalDecorators
// ═══════════════════════════════════════════════════════════════
//
// React components themselves aren't decorated anymore (that was the old
// @connect era). But decorators shine on the plain classes that back your
// stores/services. These use the TS 5 STANDARD decorator signatures, which the
// React tsconfig supports WITHOUT `experimentalDecorators`.

// ── 7.1 Method decorator — log every call (value, context) ──
function logged<This, Args extends unknown[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
) {
    const name = String(context.name);
    return function (this: This, ...args: Args): Return {
        console.log(`→ ${name}(`, ...args, ')');
        return target.call(this, ...args);
    };
}

// ── 7.2 Class decorator — tag/seal a store ──
function store<T extends new (...args: any[]) => object>(value: T, _ctx: ClassDecoratorContext) {
    return class extends value {
        readonly __isStore = true;
    };
}

@store
class CartStore {
    private items: Product[] = [];

    @logged
    add(p: Product): void {
        this.items = [...this.items, p];
    }

    get count(): number { return this.items.length; }
}

// ═══════════════════════════════════════════════════════════════
// §8. TYPE GUARDS  (TS 08) — typeof/instanceof/in, discriminated unions, predicates
// ═══════════════════════════════════════════════════════════════

// ── 8.1 Discriminated union as the canonical async-state model ──
// This replaces the loose { data, error, loading } bag with impossible-states-
// impossible modeling — the compiler forces you to handle every case.
type RemoteData<T> =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: T }
    | { status: 'error'; error: Error };

function useRemote<T>(url: string): RemoteData<T> {
    const [state, setState] = useState<RemoteData<T>>({ status: 'idle' });
    useEffect(() => {
        let alive = true;
        setState({ status: 'loading' });
        fetch(url)
            .then((r) => r.json() as Promise<T>)
            .then((data) => alive && setState({ status: 'success', data }))
            .catch((error: Error) => alive && setState({ status: 'error', error }));
        return () => { alive = false; };
    }, [url]);
    return state;
}

// Rendering narrows exhaustively — add a status and the switch stops compiling.
function UserPanel({ url }: { url: string }) {
    const remote = useRemote<User>(url);
    switch (remote.status) {
        case 'idle': return <p>Idle</p>;
        case 'loading': return <p>Loading…</p>;
        case 'error': return <p>Error: {remote.error.message}</p>;
        case 'success': return <p>Hello {remote.data.name}</p>; // .data only exists here
        default: {
            const _exhaustive: never = remote; // compile-time exhaustiveness check
            return _exhaustive;
        }
    }
}

// ── 8.2 User-defined type guard (type predicate) — filter with narrowing ──
function isUser(value: unknown): value is User {
    return (
        typeof value === 'object' &&
        value !== null &&
        'id' in value &&                 // `in` operator guard
        'email' in value
    );
}

// ── 8.3 typeof / instanceof guards in an error path ──
function describeError(err: unknown): string {
    if (typeof err === 'string') return err;                 // typeof guard
    if (err instanceof Error) return err.message;            // instanceof guard
    return 'Unknown error';
}

// ── 8.4 Assertion function — guard props/loader data at the boundary ──
function assertIsUser(value: unknown): asserts value is User {
    if (!isUser(value)) throw new Error('Expected a User');
}

function ProfileFromUnknown({ raw }: { raw: unknown }) {
    assertIsUser(raw); // after this line, `raw` is User for the rest of the scope
    return <div>{raw.name} · {raw.email}</div>;
}

// ═══════════════════════════════════════════════════════════════
// DEMO — one screen that touches every section above
// ═══════════════════════════════════════════════════════════════

export default function TypeScriptInReactDemo() {
    const [on, toggle] = useToggle();                       // §1 tuple hook
    const remote = useRemote<User[]>('/api/users');         // §8 discriminated union
    const users = remote.status === 'success' ? remote.data : [];
    const theme: ThemeName = on ? Theme.Dark : Theme.Light; // §1 as-const union

    return (
        <ErrorBoundary fallback={<p>Something broke.</p>}>{/* §6 class boundary */}
            <section data-theme={theme}>
                <SmartButton kind="text" >{/* §2 discriminated props */}
                    <Button variant="primary" onClick={toggle}>Toggle theme</Button>
                </SmartButton>

                {/* §3/§4 generic List with typed render prop */}
                <List
                    items={users}
                    keyOf={(u) => u.id}
                    renderItem={(u) => <ProductCardLike name={u.name} />}
                />

                <Counter label="Clicks" initial={0} disabled={false} />
                <Clock format="24h" />
            </section>
        </ErrorBoundary>
    );
}

// tiny helper to reuse §5's ProductCard shape without a real Product list
function ProductCardLike({ name }: { name: string }) {
    return <ProductCard name={name} price={0} inStock />;
}
