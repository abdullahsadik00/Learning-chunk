# Day 17d Assessment — TypeScript in React (Capstone)

> **Bonus capstone for the React phase.** Pairs with `basics/react/16-typescript-in-react.tsx`.
> This sits after Day 17 and before the Next.js phase (Day 18) — it does **not** replace any numbered day. It re-tests every topic from the TypeScript curriculum (Days 8–11 / TS files 01–08) *as applied inside React*.

**Theme:** You are building `@acme/ui` — a strongly-typed component library plus a data-fetching toolkit that the whole company depends on. Every type you get wrong ships a bug to 40 downstream teams. Types are contracts here, not decoration.

---

### Q1 — When to annotate `useState` ⭐

**Scenario:** Three pieces of state in a component:
1. `const [count, setCount] = useState(0)`
2. `const [user, setUser] = useState(null)` — will later hold a `User`
3. `const [status, setStatus] = useState('idle')` — should only ever be `'idle' | 'loading' | 'done'`

**Task:** State which of these need an explicit type argument and why. Write the corrected declarations.

**Acceptance Criteria:**
- [ ] `count` needs nothing — inferred as `number` from `0`
- [ ] `user` needs `useState<User | null>(null)` — inference gives `null`, which can never hold a `User`
- [ ] `status` needs `useState<'idle' | 'loading' | 'done'>('idle')` — inference gives the wider `string`, losing the literal union
- [ ] General rule: annotate when the initial value is `null`/`undefined` or narrower than the real domain; otherwise let inference work

---

### Q2 — Tuple-returning custom hook ⭐

**Scenario:** You want a `useToggle` hook that callers destructure like `useState`: `const [isOpen, toggle] = useToggle()`.

**Task:** Type the hook so the return is a **tuple** (not an array of a union). Explain why the return type matters for the caller.

**Acceptance Criteria:**
- [ ] Return annotated as `[boolean, () => void]` (or `as const` on the returned array)
- [ ] Explains: without the tuple type, TS infers `(boolean | (() => void))[]`, so `isOpen` and `toggle` would each be `boolean | (() => void)` — unusable
- [ ] The tuple lets callers rename via positional destructuring, exactly like `useState`
- [ ] `toggle` is memoized with `useCallback` so its reference is stable

---

### Q3 — Literal union from `as const` vs `enum` ⭐⭐

**Scenario:** You need a `theme` value that is `'light' | 'dark'` and also want a runtime object to iterate/lookup.

**Task:** Produce the union type from an `as const` object without hand-writing the union twice. State one reason to prefer this over a TS `enum` in a React app.

**Acceptance Criteria:**
- [ ] `const Theme = { Light: 'light', Dark: 'dark' } as const`
- [ ] `type ThemeName = (typeof Theme)[keyof typeof Theme]` → `'light' | 'dark'`
- [ ] Single source of truth — the union is derived, not duplicated
- [ ] `enum` reason: `as const` objects are fully erased at compile time (no runtime enum object / smaller bundle) and produce plain string literals that flow cleanly into props; `enum` emits runtime code and `const enum` has isolatedModules caveats

---

### Q4 — Discriminated union props (impossible states impossible) ⭐⭐

**Scenario:** A `<Button>` is either **icon-only** (must supply an accessible `label`) or **text** (supplies `children`). It must be impossible to build an icon button with no label, or to pass both.

**Task:** Model the props as a discriminated union and show how the component narrows on the discriminant.

**Acceptance Criteria:**
- [ ] `type IconButton = { kind: 'icon'; icon: ReactNode; label: string }`
- [ ] `type TextButton = { kind: 'text'; children: ReactNode }`
- [ ] `type Props = IconButton | TextButton`
- [ ] Inside the component, `if (props.kind === 'icon')` narrows so `props.label`/`props.icon` are available and `props.children` is not
- [ ] Explains why a single flat `{ icon?; label?; children? }` interface is worse — it permits invalid combinations the compiler can't reject

---

### Q5 — Intersection with intrinsic element props ⭐⭐

**Scenario:** Consumers of your `<Button>` want to pass `onClick`, `type="submit"`, `disabled`, `aria-*`, etc. without you re-declaring every native button attribute.

**Task:** Compose your own props with the built-in button props using an intersection, and forward the rest.

**Acceptance Criteria:**
- [ ] `type ButtonProps = { variant?: Variant; size?: Size } & React.ButtonHTMLAttributes<HTMLButtonElement>`
- [ ] Destructures own props and spreads `...rest` onto `<button {...rest}>`
- [ ] Explains why intersection (`&`) is the right operator here — merging two object contracts, not choosing between them
- [ ] Notes `children` comes from the intrinsic props (or `React.PropsWithChildren`) — no need to declare it manually

---

### Q6 — Typing event handlers ⭐

**Scenario:** A controlled form with a text `<input>` and an `<form onSubmit>`.

**Task:** Give the correct TypeScript types for the `onChange` and `onSubmit` handlers. Explain how you'd know which type to use.

**Acceptance Criteria:**
- [ ] `onChange: (e: React.ChangeEvent<HTMLInputElement>) => void` — element type parameter drives `e.target`'s type
- [ ] `onSubmit: (e: React.FormEvent<HTMLFormElement>) => void` and calls `e.preventDefault()`
- [ ] Explains the generic parameter is the DOM element the handler is attached to
- [ ] Knows to let inference type inline handlers (`onChange={(e) => ...}` needs no annotation) but standalone handler functions do

---

### Q7 — Overloaded custom hook ⭐⭐⭐

**Scenario:** A `usePersisted<T>(key, initial?)` hook. Called **with** a default it must never return `undefined`; called **without** one it may.

**Task:** Write the two call signatures and the single implementation signature. Explain why overloads beat a single `T | undefined` return.

**Acceptance Criteria:**
- [ ] `function usePersisted<T>(key: string, initial: T): [T, (v: T) => void]`
- [ ] `function usePersisted<T>(key: string): [T | undefined, (v: T) => void]`
- [ ] One implementation signature with `initial?: T` (the overloads are what callers see)
- [ ] Explains: overloads let the return type depend on whether the argument was passed — a single union return would force every caller to null-check even when they supplied a default
- [ ] The implementation body is not itself callable from outside — only the overload signatures are visible

---

### Q8 — Generic component with a render prop ⭐⭐

**Scenario:** A reusable `<List>` that works for `User[]`, `Product[]`, or any `T[]`, rendering each item however the caller wants.

**Task:** Type a generic `List<T>` component with `items`, a `renderItem` function-type prop, and a `keyOf` extractor. Note the `.tsx` syntax gotcha.

**Acceptance Criteria:**
- [ ] `function List<T>({ items, renderItem, keyOf }: { items: T[]; renderItem: (item: T, i: number) => ReactNode; keyOf: (item: T) => string | number })`
- [ ] Explains the `<T,>` trailing-comma (or `extends unknown`) trick needed so `.tsx` doesn't parse `<T>` as a JSX tag
- [ ] `renderItem` and `keyOf` are typed with function-type expressions, and `T` flows from `items` at the call site (no explicit type argument needed)
- [ ] Uses `keyOf(item)` for the React `key`, not the array index, when a stable id exists

---

### Q9 — Generic data-fetching hook ⭐⭐

**Scenario:** `useFetch<T>(url)` returns `{ data: T | null; error: Error | null; loading: boolean }`.

**Task:** Type the hook and its state. Explain how `T` reaches the return type and what the caller writes.

**Acceptance Criteria:**
- [ ] `interface FetchState<T> { data: T | null; error: Error | null; loading: boolean }`
- [ ] `function useFetch<T>(url: string): FetchState<T>` with `useState<FetchState<T>>(...)`
- [ ] Caller writes `useFetch<User[]>('/api/users')` and `data` is typed `User[] | null`
- [ ] The `fetch().then(r => r.json() as Promise<T>)` cast is called out as an unchecked boundary (runtime doesn't validate `T` — see Q15)
- [ ] Effect cleanup guards against setting state after unmount (`let alive = true` / cleanup sets it false)

---

### Q10 — Mapped types + `keyof` for form state ⭐⭐⭐

**Scenario:** A `useForm<T>` hook where `T` is the values shape (e.g. `{ email: string; password: string }`). You need matching `errors` and `touched` shapes and a type-safe `setField`.

**Task:** Build the derived shapes with a mapped type and type `setField` so you cannot set a non-existent field or the wrong value type.

**Acceptance Criteria:**
- [ ] `type FormErrors<T> = { [K in keyof T]?: string }` (mapped type, all keys optional)
- [ ] `type Touched<T> = { [K in keyof T]?: boolean }`
- [ ] `setField<K extends keyof T>(key: K, value: T[K])` — the value type is tied to the specific key via indexed access `T[K]`
- [ ] Explains why `setField('emial', ...)` (typo) and `setField('email', 123)` are both compile errors
- [ ] Constrains the hook generic as `<T extends object>` (not `Record<string, unknown>`, which plain interfaces don't satisfy)

---

### Q11 — Conditional/`infer` + template-literal types ⭐⭐⭐

**Scenario:** Two utilities: (a) given `FetchState<User[]>['data']`, extract the element type `User`; (b) a typed event bus whose event names are `` `${Domain}:${Action}` ``.

**Task:** Write the conditional type with `infer` for (a) and the template-literal type for (b).

**Acceptance Criteria:**
- [ ] `type ElementOf<T> = T extends Array<infer E> ? E : T` — `infer E` captures the array element type
- [ ] Applying it to `User[] | null` distributes to `User | null`; wrapping in `NonNullable<...>` yields `User`
- [ ] `type EventName = ` `` `${Domain}:${Action}` `` ` produces the cross-product union (e.g. `'user:created' | 'order:deleted' | ...`)
- [ ] Explains a practical payoff: `on(name: EventName, ...)` rejects typo'd event strings at compile time
- [ ] Knows template-literal unions expand combinatorially — good for finite domains, dangerous for large ones

---

### Q12 — Utility types to derive prop types ⭐⭐

**Scenario:** A domain model `interface Product { id; name; price; description; inStock }`. A `<ProductCard>` shows only `name`, `price`, `inStock`. A "create product" form omits `id`. An edit action sends only changed fields.

**Task:** Derive each prop/DTO type from `Product` using utility types instead of re-declaring fields.

**Acceptance Criteria:**
- [ ] Card props: `Pick<Product, 'name' | 'price' | 'inStock'>`
- [ ] Create DTO: `Omit<Product, 'id'>`
- [ ] Patch/update DTO: `Partial<Product>`
- [ ] Explains the payoff: if `Product` gains/renames a field, these derived types update automatically (no drift)
- [ ] Bonus: `Record<Variant, string>` for an exhaustive style-class map, and `ReturnType<typeof useForm<T>>` to type a context value as exactly what the hook returns

---

### Q13 — Class components: what still needs a class ⭐⭐

**Scenario:** A junior asks why the codebase has a class `ErrorBoundary` when "hooks replaced classes."

**Task:** Explain the one thing hooks still can't do, and type a minimal error boundary.

**Acceptance Criteria:**
- [ ] There is still no hook equivalent for `componentDidCatch` / `getDerivedStateFromError` — error boundaries must be class components
- [ ] `class ErrorBoundary extends React.Component<Props, State>` with typed `Props` (includes `fallback` and `children: ReactNode`) and `State` (`{ hasError: boolean }`)
- [ ] `static getDerivedStateFromError(): State { return { hasError: true } }`
- [ ] `componentDidCatch(error: Error, info: React.ErrorInfo)` for logging
- [ ] `render()` returns `fallback` when `hasError`, else `children`

---

### Q14 — Decorators on a store/service class ⭐⭐⭐

**Scenario:** A plain (non-component) `CartStore` class backs your state. You want to log every mutating method call without editing each method body.

**Task:** Write a standard (Stage 3 / TS 5) **method decorator** `@logged` and apply it. State why this is the modern signature and where React itself fits.

**Acceptance Criteria:**
- [ ] Signature `(target, context: ClassMethodDecoratorContext)` returning a replacement function — NOT the legacy `(target, key, descriptor)` form
- [ ] The replacement wraps `target.call(this, ...args)` and logs `String(context.name)`
- [ ] Works **without** `experimentalDecorators` (standard decorators are supported by the React tsconfig); legacy decorators would require that flag + `emitDecoratorMetadata`
- [ ] Explains that React *components* are no longer decorated (the old `@connect` HOC era) — decorators today belong on the classes behind stores/services
- [ ] Knows decorators can't (currently) decorate function components or parameters in the standard proposal

---

### Q15 — Discriminated-union async state + guards at the boundary ⭐⭐⭐

**Scenario:** Replace the loose `{ data, error, loading }` bag with a state that makes illegal combinations (e.g. `loading: true` **and** `error` set) unrepresentable, and safely validate untrusted JSON coming back from `fetch`.

**Task:** Model `RemoteData<T>` as a discriminated union, render it exhaustively, and write a user-defined type guard + assertion function to validate the payload.

**Acceptance Criteria:**
- [ ] `type RemoteData<T> = { status: 'idle' } | { status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: Error }`
- [ ] A `switch (state.status)` where `.data` is only accessible in the `'success'` branch and `.error` only in `'error'`
- [ ] A `default` branch with `const _exhaustive: never = state` so adding a new status becomes a compile error
- [ ] User-defined guard `function isUser(v: unknown): v is User` using `typeof v === 'object' && v !== null && 'id' in v` (`in` + `typeof` narrowing)
- [ ] Assertion function `function assertIsUser(v: unknown): asserts v is User` that throws — after calling it, `v` is `User` for the rest of the scope
- [ ] Explains why guarding at the `fetch` boundary matters: the `as Promise<T>` cast in Q9 is a lie the compiler believes but runtime doesn't enforce
