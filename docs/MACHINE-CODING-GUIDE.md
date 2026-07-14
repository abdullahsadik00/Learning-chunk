# Machine Coding Preparation Guide (SDE-1 / Junior)

A complete, practical guide to machine-coding interview rounds for Frontend, Backend, and Full-Stack tracks — with the repeatable method for each and beginner→advanced project walkthroughs.

## Table of Contents
- [What Machine Coding Rounds Are](#what-machine-coding-rounds-are)
- [How Interviewers Evaluate You](#how-interviewers-evaluate-you)
- [Universal Time-Management Plan](#universal-time-management-plan)
- [Universal Best Practices](#universal-best-practices)
- **Frontend Machine Coding** — playbook + Todo / Autocomplete / Data Table
- **Backend Machine Coding** — playbook + CRUD API / URL Shortener / Checkout API
- **Full-Stack Machine Coding** — playbook + Notes App / Analytics Shortener / Real-Time Feature

---

## What Machine Coding Rounds Are

A machine-coding round is a **timed build** (usually 60–120 minutes) where you implement a small but *complete and working* application or feature from a written prompt, often while the interviewer watches or checks in. It is not LeetCode — there is no single "correct answer" and no hidden test suite grading you. It tests whether you can **turn an ambiguous requirement into clean, working, well-organized software under time pressure** — which is what the job actually is.

Typical prompts: "Build a todo app with filters," "Design and build a URL shortener API," "Build a typeahead search," "Build a mini e-commerce checkout." You're judged on the *whole engineering process*, not just the final pixels.

Two common formats:
- **Live / shared-screen:** you code while they observe and ask questions. Narrate your thinking.
- **Take-home style, timed:** you build alone, then walk through it in a follow-up. The README and structure matter more here.

## How Interviewers Evaluate You

Almost every rubric reduces to these axes. Optimize for them explicitly:

1. **Does it work?** A working happy path beats a half-built "complete" solution every time. Get something runnable end-to-end fast, then expand.
2. **Requirement coverage.** Did you hit the must-haves before polishing nice-to-haves? Did you clarify ambiguity first?
3. **Code organization & readability.** Sensible folder structure, separation of concerns, clear naming, small functions. Can a stranger read it?
4. **Design & trade-offs.** Did you choose reasonable data structures/architecture and can you explain *why*? Did you note what you'd do with more time?
5. **Correctness on edge/unhappy paths.** Empty states, invalid input, network/DB errors, concurrent access. Juniors do the happy path and stop; standing out means handling the rest.
6. **Extensibility.** Is it easy to add a feature without rewriting? (e.g., adding a new filter shouldn't touch ten files.)
7. **Communication.** Narrate decisions, ask good clarifying questions, manage your time out loud. Silence reads as being stuck.

**What fails candidates:** jumping into code with no plan; one giant file/function; no validation or error handling; over-engineering (building abstractions for requirements that don't exist); running out of time with nothing runnable; and not testing their own code as they go.

## Universal Time-Management Plan

For a 90-minute round (scale proportionally):

| Time | Phase | What you do |
|------|-------|-------------|
| 0–10 min | **Clarify & plan** | Restate the problem. Ask clarifying questions. List features as must-have / nice-to-have (MoSCoW). Sketch the data model / component tree / API contract. Decide folder structure. |
| 10–20 min | **Skeleton** | Scaffold the project, wire the simplest end-to-end path (even hardcoded), confirm it runs. |
| 20–70 min | **Vertical slices** | Build ONE complete feature at a time (UI → state → API → data), test it, move on. Never leave the app in a broken state. |
| 70–85 min | **Edge cases & polish** | Validation, error/empty/loading states, small cleanups. |
| 85–90 min | **Review & narrate** | Re-read your code, remove dead code, and prepare to explain trade-offs + "what I'd do with more time." |

Rule of thumb: **working > complete > pretty.** A running app with 3 of 5 features and clean structure beats 5 half-wired features that don't run.

## Universal Best Practices

- **Clarify before coding.** Two minutes of questions saves twenty minutes of rework. Confirm scope, inputs, scale, and what's out of scope.
- **Plan visibly.** Write your feature list and file structure as a comment or on the shared doc first.
- **Vertical slices, not horizontal layers.** Ship one feature fully rather than building all the models, then all the routes, then all the UI.
- **Keep it runnable.** Commit/save in small working increments. Never spend 30 minutes in a non-compiling state.
- **Separation of concerns.** UI ≠ state ≠ data access. Business logic out of components/route handlers.
- **Validate at the boundary.** Never trust input (user, network, DB). Fail with clear errors.
- **Handle unhappy paths.** Empty, loading, error, invalid, unauthorized, concurrent. This is the single biggest junior→mid differentiator.
- **Don't over-engineer.** No Redux/microservices/generic frameworks for a 90-minute app. Match the solution to the requirement, and say so.
- **Name things well; keep functions small.** Readability is graded.
- **Narrate trade-offs.** "I'm using a Map here for O(1) lookups; if this needed persistence I'd move it to Postgres." That sentence wins points.
- **Leave a `README` / TODO list** of what's done and what you'd add next.

---


# Frontend Machine Coding

## The FE Machine-Coding Playbook

Frontend machine coding is not "make it look nice." It's a live demonstration that you can turn a fuzzy prompt into a **working, well-decomposed React app** in 60–120 minutes, while narrating your trade-offs. The interviewer is watching your component boundaries, your state decisions, how you handle the messy parts (loading, empty, error, race conditions), and whether you keep the app *runnable at every step*. A half-finished feature that runs beats a fully-typed architecture that throws a white screen.

### The first 10 minutes

Do not touch the keyboard for the first 3–4 minutes. Talk first.

1. **Clarify requirements (2–3 min).** Ask before you assume. Good questions for almost any FE prompt:
   - "Is the data real (an API I hit) or should I mock it?" — decides whether you write a fake `fetchX()` or wire a real endpoint.
   - "Do I need persistence across reload?" — localStorage vs in-memory.
   - "How many items realistically? Tens, or tens of thousands?" — decides whether virtualization is on the table.
   - "Is styling being judged, or is behavior enough?" — tells you how much CSS time to spend (usually: behavior).
   - "Any accessibility / keyboard requirements?" — for search/table prompts this is often the differentiator.
   - "Single file or is a real project structure expected?" — sets your folder plan.

2. **List features MoSCoW (2 min).** Say them out loud and write them as a comment block at the top of your entry file so the interviewer sees your plan:
   ```text
   MUST:   render list, add item, toggle, delete
   SHOULD: filter tabs, persist to localStorage
   COULD:  edit inline, clear-completed, counts
   WON'T:  drag reorder, auth, sync to server (out of scope, stated)
   ```
   This one artifact signals seniority: you scoped the problem and explicitly deferred things instead of drowning.

3. **Sketch the component tree + state (3–4 min).** Draw it (talk it if no whiteboard):
   ```text
   <App>                 owns: items[], filter        <- source of truth
     <AddForm/>          controlled input, calls onAdd
     <Filters/>          presentational, current + onChange
     <List>
       <Item/>           presentational, item + onToggle/onDelete
   ```
   Decide *now* where each piece of state lives (see State management below). Announce it: "The list lives in App because two children need it; the add-form's text input is local to AddForm because nobody else cares about the in-progress text."

### Evaluation criteria specific to frontend

What interviewers **reward**:
- **Clean component decomposition** — small, single-responsibility components; a clear split between container (owns state/logic) and presentational (props in, callbacks out).
- **Correct state placement** — state colocated as low as possible, lifted only when genuinely shared. No "everything in App."
- **Controlled inputs done right** — `value` + `onChange`, no reading from the DOM.
- **All four screen states handled** — loading / empty / error / success. This is the single most common thing juniors forget and seniors always show.
- **Accessibility basics** — semantic elements (`<button>`, `<ul>`, `<label>`), keyboard support, `aria-*` where a native element isn't available, visible focus.
- **Re-render awareness** — stable keys, not recreating handlers/objects needlessly, `useMemo`/`useCallback`/`memo` *only where justified* (and being able to say why).
- **Working at every checkpoint** — you can demo after each vertical slice.

What interviewers **penalize**:
- White screen / uncaught crash during the demo (fatal).
- `index` as a React key on a mutable list.
- Uncontrolled inputs, or manipulating the DOM directly (`document.getElementById`) in React.
- Stuffing all state in a single god-component and prop-drilling six levels.
- Ignoring the empty and error states (only coding the happy path).
- Premature abstraction: a Redux store / generic `<Table>` engine for a 90-minute toy.
- Mutating state directly (`items.push(...)` then `setItems(items)`).

### Folder structure and why

For a machine-coding round, **feature-first and shallow** beats a deep enterprise layout. You want minimal ceremony but clear seams. A typical intermediate/advanced answer:

```text
src/
  main.tsx                # entry, mounts <App/>
  App.tsx                 # top-level composition / routing if any
  components/             # reusable, presentational, dumb
    Spinner.tsx
    ErrorState.tsx
    EmptyState.tsx
  features/
    search/               # one folder per feature = cohesion
      SearchBar.tsx        # UI
      useAutocomplete.ts   # the brains: state machine + effects
      api.ts               # data access, isolated & mockable
      types.ts
  hooks/
    useDebouncedValue.ts   # cross-cutting, reusable hooks
  lib/
    storage.ts             # localStorage wrapper, one place
  styles.css
```

Why this shape:
- **Feature folders** keep everything a feature needs in one place — easy to reason about and to explain ("all search logic is under `features/search`").
- **`api.ts` isolated** so the network layer is swappable and mockable; components never call `fetch` directly.
- **Logic in hooks, UI in components.** The tricky stateful behavior lives in a custom hook (`useAutocomplete`, `useDataTable`), so components stay readable and the logic is unit-testable without a DOM.
- **Shared `components/` for the four states** — you build `Spinner`, `EmptyState`, `ErrorState` once and reuse them everywhere; reinforces that you treat states as first-class.

For a **beginner/single-file** prompt, don't over-engineer — one `App.tsx` with 3–4 components below it is the right amount. Match structure to scope, and say so.

### Architecture and code organization

The mental model: **three layers, even in a small app.**

1. **Data layer** (`api.ts`, `lib/storage.ts`) — how bytes get in and out. Pure-ish functions: `fetchUsers(query, signal)`, `loadTodos()`, `saveTodos()`. No React here.
2. **Logic layer** (custom hooks) — state, effects, orchestration, the state machine of the feature. Returns plain values + handlers.
3. **View layer** (components) — render props, wire callbacks. Ideally each component is either a *container* (uses the hook) or *presentational* (pure props).

The seam between logic and view is what lets you move fast and stay testable. Keep components under ~100 lines; when one grows a second responsibility, split it.

### State management

Default to **local React state + custom hooks**. You almost never need Redux/Zustand/Context in a machine-coding round; reaching for them is usually a red flag unless the prompt is explicitly large. Rules of thumb to state out loud:

- **Colocate first.** A component's own transient state (input text, "is this row expanded", dropdown open) lives *in that component*. Don't lift it.
- **Lift only when shared.** When two siblings need the same data, lift it to their nearest common parent and pass down data + callbacks. That's the todo list living in `App`.
- **Derive, don't store.** Filtered/sorted/searched views are computed from source state during render (memoized if the list is large), never duplicated into their own `useState`. Storing derived state = bugs where the two get out of sync.
- **Reach for Context** only for genuinely global, rarely-changing values (theme, current user) — and mention that Context re-renders all consumers, so it's wrong for high-frequency state.
- **`useReducer` for coordinated state.** When several fields change together (autocomplete: `status`, `results`, `activeIndex`, `error`), a reducer is cleaner and more testable than five `useState`s. Great senior signal.

### Error handling, validation, testing

- **Validation** at the input boundary: trim and reject empty todo text; disable the submit button when invalid; show inline messages, don't `alert()`.
- **The four states, explicitly.** Model status as a union, not scattered booleans:
  ```ts
  type Status = "idle" | "loading" | "success" | "error";
  ```
  Booleans like `isLoading` + `hasError` let you represent impossible states (loading *and* error). A single status field can't.
- **Async errors:** wrap `fetch` in try/catch, distinguish "aborted" (ignore) from real failures (show `ErrorState` with a retry button).
- **Error boundary** at the app root so a render bug shows a fallback instead of a white screen — mention it even if you only stub it.
- **Testing (talk, maybe write one):** React Testing Library, test *behavior not implementation* — "type into search, results appear"; "click delete, item gone." For hooks, `@testing-library/react`'s `renderHook`. Pure logic (a `sortRows` reducer) gets a plain unit test. Say: "I'd test the reducer and the debounce hook first — highest bug-density, no DOM needed."

### Performance and scalability

- **Stable keys** — a domain id, never array index for mutable lists.
- **Avoid needless re-renders:** don't create new object/array literals or inline functions passed to memoized children on every render; hoist constants; `useCallback` handlers you pass into `React.memo` children.
- **`useMemo`** for expensive derived data (filtering/sorting 10k rows), not for a `.map` over 5 items — and be honest that memo has its own cost.
- **Debounce** user-driven network calls (search-as-you-type) and **abort stale requests** so responses can't arrive out of order.
- **Virtualization** for very long lists (thousands of rows): render only the visible window (react-window, or hand-rolled). Mention it as the scale answer even when you don't implement it — see the data table walkthrough.
- **Pagination** as the simpler scale lever when the API supports it.

### Best practices and common mistakes that fail candidates

Do: keep it runnable after every slice; commit vertical slices (render → add → persist), not layers; handle the unhappy path before polishing; name things clearly; narrate trade-offs continuously.

Avoid: index keys; uncontrolled inputs / DOM reads; mutating state; storing derived state; over-abstracting early; ignoring empty/error states; silent `catch {}`; a giant `useEffect` doing five things; forgetting cleanup (timers, abort, listeners) → leaks and stale updates.

---

## Project Walkthroughs

### Beginner — Todo App

**Problem statement.** Build a todo app: add a todo, toggle done, delete, filter by all/active/completed, and persist across reloads.

**Clarifying questions to ask:**
- Persist where — localStorage, or is in-memory fine? (Assume localStorage.)
- Inline edit required, or just add/toggle/delete? (Assume not — put in COULD.)
- Any due dates / priorities? (Assume no — keep scope tight.)
- Should completed items be visually distinct and still counted? (Assume yes.)

**Feature list.**
- Must: add, toggle, delete, render list.
- Must: filter tabs (all / active / completed).
- Should: persist to localStorage; active-item count.
- Could: inline edit; "clear completed"; toggle-all.
- Won't: reorder/drag, categories, sync.

**Folder structure.**
```text
src/
  App.tsx              # owns todos[] + filter (source of truth)
  components/
    AddTodo.tsx        # controlled input + submit
    Filters.tsx        # 3 filter buttons (presentational)
    TodoList.tsx       # maps todos -> TodoItem
    TodoItem.tsx       # checkbox + label + delete (presentational)
    EmptyState.tsx     # "No todos yet"
  hooks/
    useLocalStorage.ts # generic persisted state
  types.ts
  styles.css
```

**Data model.**
```ts
// types.ts
export type Filter = "all" | "active" | "completed";
export interface Todo {
  id: string;         // crypto.randomUUID() — stable key, never index
  text: string;
  completed: boolean;
}
```

**Component tree.**
```text
<App>  todos, filter
  <AddTodo onAdd/>
  <Filters value onChange/>
  <TodoList todos onToggle onDelete/>   or  <EmptyState/>
    <TodoItem/>
```

**Step-by-step build order (and why):**
1. **Static render.** Hardcode 2 todos, render `TodoList`/`TodoItem`. Get pixels on screen first — proves the tree.
2. **Add.** Build `AddTodo` (controlled input) + `handleAdd` in App. Now it's interactive — first demo checkpoint.
3. **Toggle + delete.** Immutable updates in App, passed down. Second checkpoint.
4. **Filter.** Add `filter` state + derived `visibleTodos` (computed, not stored). Third checkpoint.
5. **Persist.** Swap `useState` for `useLocalStorage`. Reload → data survives. Done.
6. **Empty state + count** if time remains.

This order keeps a working app at every step and front-loads the must-haves.

**Key code skeletons (the parts that show skill):**

Immutable updates + derived filtering in the container:
```tsx
// App.tsx
export default function App() {
  const [todos, setTodos] = useLocalStorage<Todo[]>("todos", []);
  const [filter, setFilter] = useState<Filter>("all");

  const addTodo = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;                         // validation at boundary
    setTodos(prev => [
      ...prev,
      { id: crypto.randomUUID(), text: trimmed, completed: false },
    ]);
  };

  const toggleTodo = (id: string) =>
    setTodos(prev => prev.map(t =>                // new array, new object — no mutation
      t.id === id ? { ...t, completed: !t.completed } : t));

  const deleteTodo = (id: string) =>
    setTodos(prev => prev.filter(t => t.id !== id));

  // derived, NOT stored — single source of truth stays `todos`
  const visible = todos.filter(t =>
    filter === "all" ? true :
    filter === "active" ? !t.completed : t.completed);

  const activeCount = todos.filter(t => !t.completed).length;

  return (
    <main>
      <AddTodo onAdd={addTodo} />
      <Filters value={filter} onChange={setFilter} />
      {visible.length === 0
        ? <EmptyState filter={filter} />
        : <TodoList todos={visible} onToggle={toggleTodo} onDelete={deleteTodo} />}
      <p>{activeCount} item{activeCount !== 1 ? "s" : ""} left</p>
    </main>
  );
}
```

Generic persisted-state hook (reusable, testable, lazy-initialized):
```ts
// hooks/useLocalStorage.ts
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;                 // corrupt JSON shouldn't crash the app
    }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue] as const;
}
```

Controlled, accessible add form:
```tsx
// components/AddTodo.tsx
export function AddTodo({ onAdd }: { onAdd: (t: string) => void }) {
  const [text, setText] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(text);
    setText("");                      // reset only after handing off
  };
  return (
    <form onSubmit={submit}>
      <label htmlFor="new-todo">New todo</label>
      <input id="new-todo" value={text}
             onChange={e => setText(e.target.value)}
             placeholder="What needs doing?" />
      <button type="submit" disabled={!text.trim()}>Add</button>
    </form>
  );
}
```

**Edge cases and handling:**
- Empty/whitespace-only text → trim + reject, submit disabled.
- Duplicate text → allowed (ids differ); mention you *could* dedupe if asked.
- Corrupt localStorage JSON → try/catch falls back to initial.
- Filter that hides everything → `EmptyState` with a context message ("No completed todos").
- Rapid double-submit → button disabled while empty; form clears immediately.

**Testing / scaling talk:** RTL behavioral tests — "type + submit → item appears", "click checkbox → toggled", "switch to Active tab → completed hidden". If it grew to thousands of todos I'd add virtualization and move filtering into `useMemo`; if it needed multi-device sync I'd replace `useLocalStorage` with a server + optimistic updates.

**Senior signals to show:** derived state instead of a second `useState`; a reusable generic hook; immutable updates; the empty state; `crypto.randomUUID()` keys; validation + disabled submit; explicitly deferring COULD/WON'T features.

---

### Intermediate — Autocomplete / Typeahead Search

**Problem statement.** A search input that suggests results as the user types: debounced input, async fetch, keyboard navigation (↑/↓/Enter/Esc), and correct loading/empty/error states. Bonus: cache and cancel stale requests.

**Clarifying questions to ask:**
- Real API or mock? What's the response shape? (Assume `fetch` against a mockable `api.ts`.)
- Minimum characters before searching? (Assume 2.)
- Debounce delay expectation? (Assume ~300ms.)
- Should selecting a result fill the input, navigate, or emit an event? (Assume fill + `onSelect` callback.)
- Cache results per query for the session? (Yes — nice-to-have worth doing.)

**Feature list.**
- Must: debounced input; async fetch; render suggestions; loading/empty/error/success states.
- Must: keyboard nav — arrows move highlight, Enter selects, Esc closes.
- Should: abort stale requests; per-query cache; click-outside to close.
- Could: highlight matched substring; recent searches.
- Won't: server-side analytics, fuzzy ranking.

**Folder structure.**
```text
src/
  features/search/
    SearchBar.tsx        # UI + wiring, uses the hook
    useAutocomplete.ts   # state machine (reducer) + effects
    api.ts               # searchUsers(query, signal)
    types.ts
  hooks/
    useDebouncedValue.ts
  components/
    Spinner.tsx  ErrorState.tsx  EmptyState.tsx
```

**State model (a reducer — coordinated fields):**
```ts
// types.ts
export interface Result { id: string; label: string; }
export type Status = "idle" | "loading" | "success" | "error";
export interface State {
  status: Status;
  results: Result[];
  activeIndex: number;   // -1 = nothing highlighted
  error?: string;
}
```

**Build order (and why):**
1. **Controlled input + open/close dropdown shell.** Just UI; no data. Establishes structure.
2. **`useDebouncedValue`** so the query only "commits" after the user pauses. Log it to prove debounce works.
3. **`api.ts` + fetch on debounced query** → render results (success path only). First real demo.
4. **The four states** — wire `loading` (Spinner), `error` (ErrorState + retry), empty (EmptyState), success. Second checkpoint.
5. **Keyboard navigation** — arrows/Enter/Esc over `activeIndex`. This is the hard part; do it once results render.
6. **Abort stale requests + cache.** Prevents out-of-order results and refetches. Polish that reads as senior.
7. **Click-outside / a11y attributes** if time remains.

**Key code skeletons (the tricky parts):**

Debounce hook:
```ts
// hooks/useDebouncedValue.ts
export function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);   // cleanup cancels the pending update
  }, [value, delay]);
  return debounced;
}
```

The core hook — fetch with abort + cache + reducer. This is where the round is won:
```ts
// features/search/useAutocomplete.ts
const initial: State = { status: "idle", results: [], activeIndex: -1 };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "loading": return { ...s, status: "loading", error: undefined };
    case "success": return { status: "success", results: a.results, activeIndex: -1 };
    case "error":   return { ...s, status: "error", error: a.error, results: [] };
    case "move": {
      const n = s.results.length;
      if (n === 0) return s;
      const next = (s.activeIndex + a.dir + n) % n;  // wrap around
      return { ...s, activeIndex: next };
    }
    case "reset":   return initial;
    default: return s;
  }
}

export function useAutocomplete(query: string) {
  const debounced = useDebouncedValue(query, 300);
  const [state, dispatch] = useReducer(reducer, initial);
  const cache = useRef(new Map<string, Result[]>());

  useEffect(() => {
    const q = debounced.trim();
    if (q.length < 2) { dispatch({ type: "reset" }); return; }

    if (cache.current.has(q)) {                     // cache hit — no network
      dispatch({ type: "success", results: cache.current.get(q)! });
      return;
    }

    const controller = new AbortController();
    dispatch({ type: "loading" });
    searchUsers(q, controller.signal)
      .then(results => {
        cache.current.set(q, results);
        dispatch({ type: "success", results });
      })
      .catch(err => {
        if (err.name === "AbortError") return;      // stale request — ignore
        dispatch({ type: "error", error: "Something went wrong. Retry?" });
      });

    return () => controller.abort();  // typing again aborts the in-flight request
  }, [debounced]);

  return { state, dispatch };
}
```

Keyboard handling + the four states in the view:
```tsx
// features/search/SearchBar.tsx (excerpt)
const onKeyDown = (e: React.KeyboardEvent) => {
  switch (e.key) {
    case "ArrowDown": e.preventDefault(); dispatch({ type: "move", dir: 1 }); break;
    case "ArrowUp":   e.preventDefault(); dispatch({ type: "move", dir: -1 }); break;
    case "Enter":
      if (state.activeIndex >= 0) select(state.results[state.activeIndex]);
      break;
    case "Escape": dispatch({ type: "reset" }); break;
  }
};

// render:
{state.status === "loading" && <Spinner />}
{state.status === "error"   && <ErrorState msg={state.error} onRetry={retry} />}
{state.status === "success" && state.results.length === 0 && <EmptyState />}
{state.status === "success" && state.results.map((r, i) => (
  <li key={r.id}
      role="option"
      aria-selected={i === state.activeIndex}
      className={i === state.activeIndex ? "active" : ""}
      onMouseEnter={() => dispatch({ type: "hover", index: i })}
      onClick={() => select(r)}>
    {r.label}
  </li>
))}
```

Accessibility wiring (combobox pattern) — call this out explicitly:
```tsx
<input
  role="combobox"
  aria-expanded={state.status === "success" && state.results.length > 0}
  aria-controls="listbox"
  aria-activedescendant={state.activeIndex >= 0 ? `opt-${state.activeIndex}` : undefined}
  value={query} onChange={e => setQuery(e.target.value)} onKeyDown={onKeyDown}
/>
<ul id="listbox" role="listbox"> … </ul>
```

**Edge cases and handling:**
- **Out-of-order responses** (type "a", then "ab"; "a" resolves last) → `AbortController` cancels the stale one; the `AbortError` catch ignores it.
- Query shorter than min length → reset to idle, no request.
- Empty results → `EmptyState`, not a blank box.
- Fast typing → debounce + cleanup cancels superseded timers/requests.
- Enter with nothing highlighted → no-op (or submit raw query, if that's the spec).
- Repeated query → cache hit, zero network.
- Click outside → close dropdown (mousedown listener on document, cleaned up).

**Testing / scaling talk:** unit-test the reducer (pure — move wraps, success resets index) and the debounce hook with fake timers. RTL: "type → spinner → results", "ArrowDown then Enter selects second item", "error path shows retry". Scaling: server-side search with pagination/infinite scroll for large corpora; cache with TTL or SWR/React Query if this were production; request throttling.

**Senior signals to show:** `AbortController` for stale requests (the thing juniors miss); a reducer as an explicit state machine; the four states modeled as a union not booleans; cache; full keyboard support + ARIA combobox; cleanup in every effect.

---

### Advanced — Paginated, Sortable, Filterable Data Table

**Problem statement.** A data table over a list of records: pagination (page through data), column sorting, a search filter, row selection (with select-all), and inline edit that updates optimistically. Handle large datasets.

**Clarifying questions to ask:**
- **Server-side or client-side** pagination/sort/filter? Huge difference — client-side means I hold all rows; server-side means I send `page/sort/q` params and render what comes back. (I'll design for **server-side** as the realistic case, and note the client-side simplification.)
- Single or multi-column sort? (Assume single.)
- Which columns are editable, and does edit hit an API? (Assume one editable field, optimistic + rollback.)
- Selection scope — current page only or across pages? (Assume current page, mention the cross-page nuance.)
- Expected row count? (Assume large → server pagination; mention virtualization for a long single page.)

**Feature list.**
- Must: fetch + render page; next/prev pagination; column sort; search filter.
- Must: row selection + select-all-on-page; loading/empty/error states.
- Should: optimistic inline edit with rollback on failure; debounced search; reset to page 1 when filter/sort changes.
- Could: page-size selector; multi-sort; column show/hide; URL-synced state.
- Won't (stated): CSV export, drag-reorder columns, full virtualization impl (describe it).

**Folder structure.**
```text
src/
  features/table/
    DataTable.tsx        # composition
    TableHeader.tsx      # sortable column headers
    TableRow.tsx         # one row, memoized, inline-edit cell
    TableToolbar.tsx     # search + selection summary
    Pagination.tsx
    useDataTable.ts      # the engine: query state + fetching
    api.ts               # fetchRows({page,sort,dir,q,signal}); updateRow(...)
    types.ts
  components/  Spinner.tsx  EmptyState.tsx  ErrorState.tsx
  hooks/  useDebouncedValue.ts
```

**Types / query state:**
```ts
// types.ts
export interface Row { id: string; name: string; email: string; role: string; }
export interface Query {
  page: number; pageSize: number;
  sortBy: keyof Row | null; sortDir: "asc" | "desc";
  search: string;
}
export interface Page { rows: Row[]; total: number; }
```

**API contract (server-side):**
```text
GET /api/users?page=1&pageSize=20&sortBy=name&sortDir=asc&q=jane
  -> 200 { rows: Row[], total: number }
PATCH /api/users/:id   body { role: string }   -> 200 Row   (for optimistic edit)
```

**Component tree.**
```text
<DataTable>  useDataTable() -> {data, status, query, setQuery, ...}
  <TableToolbar search selectedCount onSearch onClearSelection/>
  <table>
    <TableHeader query onSort selectAll onToggleAll/>
    <tbody> {rows.map(r => <TableRow key selected onSelect onEdit/>)} </tbody>
  </table>
  <Pagination page total pageSize onPage/>
  (+ Spinner / EmptyState / ErrorState overlays by status)
```

**Build order (and why):**
1. **`useDataTable` + fetch first page, render a static table.** Prove the data pipeline end to end before adding controls.
2. **Pagination** (next/prev, disable at bounds, show "page X of N"). Changing page refetches.
3. **Sorting** — click header cycles asc/desc; sort goes into `query`, triggers refetch; **reset to page 1**.
4. **Search filter** — debounced input into `query.search`; reset to page 1. Now the four states matter — wire loading/empty/error.
5. **Row selection** — a `Set<id>`; per-row checkbox + header select-all-on-page.
6. **Optimistic inline edit** — edit a cell, update UI immediately, PATCH, roll back on failure. The senior-signal feature; do it last so the rest already demos.
7. **Virtualization note** — explain, implement only if time.

One `query` object drives one `useEffect` that fetches — every control just calls `setQuery`. That single data-flow is the architectural point to articulate.

**Key code skeletons (the tricky parts):**

The engine — all query state funnels through one fetch effect, with abort:
```ts
// features/table/useDataTable.ts
const initialQuery: Query = { page: 1, pageSize: 20, sortBy: null, sortDir: "asc", search: "" };

export function useDataTable() {
  const [query, setQueryRaw] = useState<Query>(initialQuery);
  const [data, setData] = useState<Page>({ rows: [], total: 0 });
  const [status, setStatus] = useState<Status>("idle");
  const debouncedSearch = useDebouncedValue(query.search, 300);

  // any change that alters the result set must reset to page 1
  const setQuery = (patch: Partial<Query>) =>
    setQueryRaw(q => ({
      ...q, ...patch,
      page: "search" in patch || "sortBy" in patch || "sortDir" in patch ? 1 : (patch.page ?? q.page),
    }));

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    fetchRows({ ...query, search: debouncedSearch, signal: controller.signal })
      .then(page => { setData(page); setStatus("success"); })
      .catch(err => { if (err.name !== "AbortError") setStatus("error"); });
    return () => controller.abort();          // stale page/sort/search never wins
  }, [query.page, query.pageSize, query.sortBy, query.sortDir, debouncedSearch]);

  const toggleSort = (col: keyof Row) =>
    setQuery(query.sortBy === col
      ? { sortDir: query.sortDir === "asc" ? "desc" : "asc" }
      : { sortBy: col, sortDir: "asc" });

  return { query, data, status, setQuery, toggleSort };
}
```

Row selection with a `Set` (O(1) membership, immutable update):
```ts
const [selected, setSelected] = useState<Set<string>>(new Set());

const toggleRow = (id: string) =>
  setSelected(prev => {
    const next = new Set(prev);              // clone — never mutate state in place
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

const pageIds = data.rows.map(r => r.id);
const allOnPageSelected = pageIds.length > 0 && pageIds.every(id => selected.has(id));
const toggleAllOnPage = () =>
  setSelected(prev => {
    const next = new Set(prev);
    allOnPageSelected ? pageIds.forEach(id => next.delete(id))
                      : pageIds.forEach(id => next.add(id));
    return next;
  });
```

Optimistic inline edit with rollback — the standout feature:
```ts
const editRole = async (id: string, role: string) => {
  const prevRows = data.rows;                                  // snapshot for rollback
  setData(d => ({ ...d, rows: d.rows.map(r =>                  // 1. update UI now
    r.id === id ? { ...r, role } : r) }));
  try {
    await updateRow(id, { role });                             // 2. persist
  } catch {
    setData(d => ({ ...d, rows: prevRows }));                  // 3. revert on failure
    // surface a toast/inline error so the user knows it didn't save
  }
};
```

Sortable, accessible header:
```tsx
// TableHeader.tsx
<th aria-sort={query.sortBy === col ? (query.sortDir === "asc" ? "ascending" : "descending") : "none"}>
  <button onClick={() => toggleSort(col)}>
    {label}{query.sortBy === col ? (query.sortDir === "asc" ? " ▲" : " ▼") : ""}
  </button>
</th>
```

Memoized row to avoid re-rendering the whole table on selection/edit of one row:
```tsx
// TableRow.tsx
export const TableRow = React.memo(function TableRow({ row, selected, onSelect, onEdit }: Props) {
  // memo pays off here: selecting row 3 shouldn't re-render rows 1,2,4…
  // requires onSelect/onEdit to be stable (useCallback in the parent).
  ...
});
```

**Edge cases and handling:**
- **Race conditions** across page/sort/search changes → `AbortController` in the fetch effect.
- Sort or search while on page 5 → auto-reset to page 1 (else you see an empty page).
- Pagination bounds → disable prev on page 1, next on last page (`page * pageSize >= total`).
- Empty search result → `EmptyState`; error → `ErrorState` + retry; keep the toolbar interactive.
- Select-all semantics → clarify "this page" vs "all matching"; header checkbox shows *indeterminate* when some-but-not-all on page are selected.
- Optimistic edit failure → rollback to snapshot + notify; don't leave a fake-saved value.
- Selection persistence across pages → a `Set` of ids survives page changes (rows unmount, ids remain).

**Testing / scaling talk:**
- Unit: `toggleSort` cycling, the page-reset logic, selection set operations, optimistic rollback (mock a rejected PATCH → row reverts).
- RTL: "click Name header → asc arrow + refetch called with sortBy=name"; "type in search → debounced fetch with q"; "edit role, API fails → old value restored".
- **Scaling / virtualization:** server-side pagination already caps DOM to one page. For a *long single page or infinite scroll*, virtualize — render only rows in the viewport (react-window) so 10k rows stay ~20 DOM nodes; row height + scroll offset compute the visible window. Also: cache pages (React Query), `useMemo` any client-side derived rows, and keep handlers stable so memoized rows don't churn.

**Senior signals to show:** one `query` object → one fetch effect (clean unidirectional flow); abort on every refetch; reset-to-page-1 correctness; optimistic update *with rollback*; `Set`-based selection + indeterminate select-all; `React.memo` + stable callbacks with a stated reason; `aria-sort`; and naming the client-vs-server trade-off up front.

---

## Frontend Machine-Coding Checklist

- [ ] Stated MoSCoW scope and deferred features out loud / in a comment.
- [ ] Component tree sketched; state placement decided and justified (colocate low, lift when shared).
- [ ] All inputs controlled; no `document.getElementById` / DOM reads in React.
- [ ] State updated immutably; derived data computed, never stored twice.
- [ ] Stable domain-id keys — never array index on mutable lists.
- [ ] Four screen states handled everywhere data loads: loading / empty / error / success.
- [ ] Status modeled as a union type, not overlapping booleans.
- [ ] Async: try/catch, `AbortController` for stale requests, cleanup in every effect (timers/listeners/abort).
- [ ] Debounce on user-driven network calls; reset pagination on filter/sort change.
- [ ] Validation at input boundary; submit disabled when invalid; no `alert()`.
- [ ] Accessibility: semantic elements, `<label>`s, keyboard support, `aria-*` where needed, visible focus.
- [ ] Re-render hygiene: no needless inline objects/functions into memoized children; `useMemo`/`memo` only where justified — and you can say why.
- [ ] Logic in hooks, UI in components; files small and single-responsibility.
- [ ] App runs at every checkpoint; committed as vertical slices, unhappy paths first.
- [ ] Can name the scaling story (pagination / virtualization / caching) even if not implemented.


---


# Backend Machine Coding

## The BE Machine-Coding Playbook

Backend machine coding is not about writing the most clever algorithm. It's about shipping a small, **correct, well-layered HTTP service** in 60–120 minutes: real routes, real validation at the edge, real error responses, and — as difficulty rises — real concurrency and auth correctness. Interviewers watch how you separate concerns, where you validate, and whether you reason out loud about the unhappy paths (duplicate requests, race conditions, expired tokens).

The stack used throughout this part: **Node + Express + TypeScript**, **PostgreSQL via Prisma**, **Redis**, **Zod** for validation, **JWT** for auth, and **Supertest + Jest/Vitest** for tests. The exact libraries matter less than the shape: a clean **routes → controllers → services → repository/prisma** flow.

### The first 10 minutes

Do NOT open your editor first. Spend the first 8–10 minutes doing this, out loud:

1. **Clarify requirements (2–3 min).** Ask targeted questions (per-project lists below). The goal is to shrink scope to something buildable and surface the *evaluation hooks* the interviewer cares about (concurrency? auth? caching?).
2. **List features MoSCoW (2 min).** Must / Should / Could / Won't. State explicitly what you're deferring — "I'll stub email sending and note where a real queue goes." Deferring loudly is a senior signal; silently skipping is a red flag.
3. **Sketch the data model (2 min).** Tables, columns, relations, and the *unique constraints/indexes* that enforce your invariants. Say "the DB is my last line of defense — I'll put a unique index on `slug` so even a race can't create a duplicate."
4. **Sketch the API contract (2 min).** Resources, methods, status codes, request/response shapes. Nail REST semantics here (see below).
5. **Name the tricky part and your plan for it (1 min).** "The interesting bit is preventing overselling; I'll use `SELECT ... FOR UPDATE` inside a transaction." This tells the interviewer you already see the crux.

Then build **vertical slices**: one endpoint fully working (route → validation → service → DB → response → a quick curl/test) before starting the next. A working `POST` + `GET` beats six half-wired endpoints.

### Evaluation criteria (what BE interviewers reward / penalize)

| Rewarded | Penalized |
| --- | --- |
| Correct REST semantics + status codes (201 on create, 204 on delete, 409 on conflict, 422/400 on bad input, 401 vs 403) | Everything returns 200 with `{ success: false }` |
| Validation at the boundary (Zod) before anything touches business logic | Trusting `req.body`; manual `if (!x)` checks scattered in services |
| Clean layering — controllers thin, services hold logic, repository/prisma isolates data access | Business logic + SQL + `res.json` all in the route handler |
| Structured, consistent error responses via one error-handling middleware | Ad-hoc `try/catch` with `res.status(500).send(err)` leaking stack traces |
| Concurrency correctness (transactions, row locks, idempotency) | Read-modify-write with no lock; "it works on my machine" overselling |
| Auth done right (hashed passwords, short-lived JWT, role checks in middleware) | Passwords in plaintext, secrets hard-coded, no expiry |
| Tests that hit the HTTP layer (Supertest) covering happy + unhappy paths | No tests, or only unit tests of trivial pure functions |
| Talking about trade-offs, indexes, N+1, pagination | Silence; or over-engineering (microservices for a CRUD app) |

### Folder structure

A single, boring, layered structure you can reproduce from memory under time pressure:

```text
src/
  app.ts                 # builds & configures the Express app (no listen)
  server.ts              # imports app, starts listening (keeps app testable)
  config/
    env.ts               # Zod-validated process.env
  routes/
    index.ts             # mounts feature routers
    task.routes.ts
  controllers/
    task.controller.ts   # thin: parse -> call service -> shape response
  services/
    task.service.ts      # business logic, orchestrates repositories
  repositories/
    task.repository.ts    # all Prisma calls live here
  middleware/
    error.middleware.ts   # central error handler (last)
    validate.ts           # Zod request validation wrapper
    auth.middleware.ts     # JWT verify + requireRole
    notFound.ts
  schemas/
    task.schema.ts        # Zod schemas + inferred types
  lib/
    prisma.ts            # single PrismaClient instance
    redis.ts             # single ioredis client
    errors.ts            # AppError classes (HttpError, NotFound, Conflict...)
    asyncHandler.ts       # wraps async controllers so errors hit middleware
  types/
    express.d.ts         # augments Request with req.user
prisma/
  schema.prisma
tests/
  task.e2e.test.ts       # Supertest against the app
.env.example
package.json
tsconfig.json
```

**Why this shape:** each layer has exactly one reason to change. Controllers know HTTP but not SQL. Services know rules but not `req`/`res`. Repositories know Prisma but not HTTP. This is what lets you say "I'd swap Prisma for raw SQL by touching only `repositories/`" — a separation-of-concerns story interviewers love. Keeping `app.ts` (build) separate from `server.ts` (listen) is the small trick that makes Supertest trivial: tests import `app` and never bind a port.

### Architecture & code organization

The request lifecycle, and where each concern lives:

```text
HTTP request
  → route            (path + method → controller, attaches validate/auth middleware)
  → middleware       (auth: verify JWT & role; validate: Zod parse body/params/query)
  → controller       (thin: pull typed data, call service, map result → status + JSON)
  → service          (business rules, transactions, calls repositories + Redis)
  → repository       (Prisma queries only)
  → DB
  ← error thrown anywhere bubbles to error.middleware (via asyncHandler)
```

Two glue pieces make this pleasant in Express (which pre-v5 doesn't catch async errors):

```ts
// lib/asyncHandler.ts — forward async errors to the error middleware
import { RequestHandler } from 'express';
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
```

```ts
// lib/errors.ts — typed errors carry their HTTP status + a stable code
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}
export const NotFound = (msg = 'Not found') => new AppError(404, 'NOT_FOUND', msg);
export const Conflict = (msg: string) => new AppError(409, 'CONFLICT', msg);
export const Unauthorized = (msg = 'Unauthorized') => new AppError(401, 'UNAUTHORIZED', msg);
export const Forbidden = (msg = 'Forbidden') => new AppError(403, 'FORBIDDEN', msg);
```

### API design + DB design + auth

**API design principles to apply every time:**
- Nouns as resources, plural: `/tasks`, `/tasks/:id`. Verbs live in the HTTP method, not the path.
- Status codes carry meaning: `200` ok, `201` created (+ `Location` header), `204` no content (delete), `400` malformed, `401` unauthenticated, `403` authenticated-but-forbidden, `404` missing, `409` conflict (duplicate / oversell), `422` semantic validation failure, `429` rate-limited.
- Consistent envelope for lists: `{ data: [...], meta: { page, limit, total } }`. Consistent error envelope: `{ error: { code, message, details? } }`.
- Idempotency: `PUT`/`DELETE` are idempotent; make risky `POST`s idempotent with an `Idempotency-Key` header when money/inventory is involved.

**DB design principles:** model relations with FKs; push invariants into the schema (unique constraints, `CHECK (stock >= 0)`, `NOT NULL`); index the columns you filter/join on and any lookup key (`slug`, `email`). Let the DB enforce correctness so application races can't corrupt data.

**Auth:** hash passwords with bcrypt/argon2 (never store plaintext), issue a short-lived JWT access token signed with a secret from validated env, verify it in middleware, attach `req.user`, and gate protected routes with `requireRole`. Never trust a role or userId from the request body — always from the verified token.

### Error handling, validation, and testing

**Validate at the boundary** with a reusable Zod middleware so controllers receive already-clean data:

```ts
// middleware/validate.ts
import { AnyZodObject, ZodError } from 'zod';
import { RequestHandler } from 'express';
import { AppError } from '../lib/errors';

export const validate =
  (schema: AnyZodObject): RequestHandler =>
  (req, _res, next) => {
    try {
      const parsed = schema.parse({ body: req.body, query: req.query, params: req.params });
      // overwrite with coerced/stripped values so downstream layers get clean types
      Object.assign(req, parsed);
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        return next(new AppError(422, 'VALIDATION_ERROR', 'Invalid request', e.flatten()));
      }
      next(e);
    }
  };
```

**One central error handler** (registered last, after routes) turns any thrown error into a consistent response and hides internals on 5xx:

```ts
// middleware/error.middleware.ts
import { ErrorRequestHandler } from 'express';
import { AppError } from '../lib/errors';

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  // Prisma known errors (e.g., P2002 unique violation) → 409
  if (err?.code === 'P2002') {
    return res.status(409).json({ error: { code: 'CONFLICT', message: 'Resource already exists' } });
  }
  console.error(err); // structured logger in real life
  return res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong' } });
};
```

**Testing approach:** prefer **Supertest** integration tests against the `app` (not the network) — they exercise routing, middleware, validation, and status codes together, which is exactly what's graded. Cover the happy path plus the key unhappy paths per endpoint (404, 422, 401/403, 409). Use a test DB (Docker Postgres) or transaction-rollback-per-test. Keep at least one test that proves the tricky invariant (e.g., concurrent checkout doesn't oversell).

### Performance & scalability

- **Pagination always** on collections (offset for simple cases, keyset/cursor when you want to sound senior about large tables).
- **Avoid N+1**: use Prisma `include`/`select` or a single query; mention it even if the dataset is tiny.
- **Cache hot reads in Redis** (URL lookups, product reads) with sensible TTL and explicit invalidation on write.
- **Indexes** on filter/sort/lookup columns; unique indexes double as correctness guards.
- **Connection pooling** (single `PrismaClient`; PgBouncer in prod).
- **Statelessness**: keep session state in JWT/Redis so the API scales horizontally.
- **Background work off the request path**: emails, webhooks → a queue (BullMQ), so the HTTP response stays fast.

### Best practices & common mistakes that fail candidates

Do: single `PrismaClient`; env validated with Zod at boot; `app` decoupled from `listen`; consistent envelopes; return the created resource with `201`; write one test before moving on.

Avoid these classic failures:
- Business logic in route handlers; no service layer.
- Returning `200` for everything (interviewers probe status codes early).
- Read-modify-write on stock/counters without a transaction or atomic op → overselling.
- Validating inside services instead of at the boundary (or not at all).
- Leaking stack traces / DB errors to clients.
- Storing plaintext passwords or unsigned/never-expiring tokens.
- Blocking the request on email/third-party calls.
- Gold-plating (auth on the beginner CRUD task nobody asked for) while the must-haves are unfinished.

---

## Project Walkthroughs

### Beginner — REST CRUD API for a Task Manager

**Problem statement.** Build a REST API to manage tasks. A task has a title, optional description, a status, and timestamps. Support create, read (one + paginated list), update, and delete, with proper validation and error handling.

**Clarifying questions to ask:**
- Auth needed, or single-user/no-auth for scope? (Assume no-auth to focus on REST + validation.)
- Allowed statuses? (`TODO | IN_PROGRESS | DONE`.)
- Filtering/sorting on the list, or just pagination? (Add status filter — cheap and shows query handling.)
- Partial updates (`PATCH`) or full (`PUT`)? (Support `PATCH` for status transitions.)
- Soft or hard delete? (Hard delete, `204`.)

**Feature list.**
- Must: `POST /tasks`, `GET /tasks` (paginated + status filter), `GET /tasks/:id`, `PATCH /tasks/:id`, `DELETE /tasks/:id`; Zod validation; central error handling; correct status codes.
- Nice-to-have: sorting, full-text search on title, `createdAt`/`dueDate` filters, soft delete.

**Folder structure.** Exactly the base tree above (`routes/controllers/services/repositories/schemas/middleware`), with `task.*` files.

**Data model.**

```prisma
// prisma/schema.prisma
enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}

model Task {
  id          String     @id @default(uuid())
  title       String
  description String?
  status      TaskStatus @default(TODO)
  dueDate     DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([status])
}
```

**API contract.**

```text
POST   /tasks           201 {data:Task}          | 422 validation
GET    /tasks?page&limit&status  200 {data:Task[], meta:{page,limit,total}}
GET    /tasks/:id       200 {data:Task}          | 404
PATCH  /tasks/:id       200 {data:Task}          | 404 | 422
DELETE /tasks/:id       204                       | 404
```

**Build order (and why):**
1. Scaffold `app.ts` + `server.ts` + `lib/prisma.ts` + error/notFound middleware. Get `GET /health` → `200`. (Prove the skeleton works end-to-end first.)
2. `schemas/task.schema.ts` — create/update/list-query schemas. (Contract before logic.)
3. `POST /tasks` full slice: route → validate → controller → service → repository → `201`. Curl it.
4. `GET /tasks/:id` + `NotFound`. (Now you have create+read; the demo is real.)
5. `GET /tasks` with pagination + filter.
6. `PATCH` then `DELETE`.
7. Supertest for the happy path + one 404 + one 422.

**Key skeletons (the parts that show skill):**

```ts
// schemas/task.schema.ts
import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).default('TODO'),
    dueDate: z.coerce.date().optional(),
  }),
});

export const listTasksSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  }),
});

export type CreateTaskBody = z.infer<typeof createTaskSchema>['body'];
```

```ts
// services/task.service.ts — logic + pagination math, no HTTP, no res
import { taskRepo } from '../repositories/task.repository';
import { NotFound } from '../lib/errors';

export const taskService = {
  async list({ page, limit, status }: { page: number; limit: number; status?: string }) {
    const [data, total] = await taskRepo.findManyAndCount({ page, limit, status });
    return { data, meta: { page, limit, total } };
  },
  async get(id: string) {
    const task = await taskRepo.findById(id);
    if (!task) throw NotFound('Task not found');
    return task;
  },
  // create/update/remove delegate to repo; update/remove first assert existence
};
```

```ts
// repositories/task.repository.ts — the only file that talks to Prisma
import { prisma } from '../lib/prisma';
export const taskRepo = {
  findManyAndCount: ({ page, limit, status }: any) =>
    prisma.$transaction([
      prisma.task.findMany({
        where: status ? { status } : {},
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.task.count({ where: status ? { status } : {} }),
    ]),
  findById: (id: string) => prisma.task.findUnique({ where: { id } }),
  // create/update/delete ...
};
```

```ts
// controllers/task.controller.ts — thin; note 201 + Location
export const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.create(req.body);
  res.status(201).location(`/tasks/${task.id}`).json({ data: task });
});
```

**Edge cases & handling:** empty/whitespace title → Zod `.min(1)` → 422; unknown `id` on GET/PATCH/DELETE → 404 (assert existence before update); invalid status enum → 422; `limit` too large → capped at 100; extra unknown fields → Zod strips them (or `.strict()` to reject). `DELETE` on already-deleted id → 404 (or 204 if you argue idempotency — say which and why).

**Testing / scaling talk:** Supertest covers each verb + status code; a test DB reset between runs. To scale: index on `status` (done), switch to keyset pagination for very large tables, add `GET` caching if reads dominate.

**Senior signals:** boundary validation with inferred types, `201 + Location`, consistent list envelope with `meta`, DB-level index tied to the filter, and `app`/`server` split for testability — all on a "simple" CRUD. Doing the basics *precisely* is itself the signal here.

---

### Intermediate — URL Shortener

**Problem statement.** Build a service that turns a long URL into a short code, redirects `/:code` to the original, counts clicks, caches hot lookups in Redis, and rate-limits creation.

**Clarifying questions to ask:**
- Custom aliases allowed, or only generated codes? (Support optional custom alias.)
- Should the same long URL always map to one code, or allow duplicates? (One code per URL — dedupe.)
- Redirect type — `301` (permanent, cacheable) or `302` (so click counts stay accurate)? (`302`, because `301` gets cached by browsers and we lose analytics.)
- Expiry on links? (Optional TTL — nice-to-have.)
- Expected read:write ratio? (Reads dominate → Redis cache is justified.)

**Feature list.**
- Must: `POST /links` (base62 code, collision-safe, dedupe), `GET /:code` (redirect + async click increment), Redis cache on lookups, token-bucket rate limiter on creation, `GET /links/:code/stats`.
- Nice-to-have: custom alias, expiry/TTL, per-user links + auth, top-referrers analytics.

**Folder structure** adds `services/shortener.service.ts`, `lib/base62.ts`, `middleware/rateLimit.ts`, `lib/redis.ts`.

**Data model.**

```prisma
model Link {
  id         BigInt   @id @default(autoincrement())  // numeric id feeds base62
  code       String   @unique                        // short code (indexed, unique)
  longUrl    String
  clicks     BigInt   @default(0)
  expiresAt  DateTime?
  createdAt  DateTime @default(now())

  @@index([longUrl])   // for dedupe lookups
}
```

**API contract.**

```text
POST   /links                {url, alias?}  201 {data:{code, shortUrl}} | 409 alias taken | 422 | 429
GET    /:code                302 -> longUrl               | 404 | 410 expired
GET    /links/:code/stats    200 {data:{code,longUrl,clicks,createdAt}}  | 404
```

**Build order (and why):**
1. `base62` encode/decode + a unit test (pure, fast, the core primitive).
2. `POST /links` using the DB autoincrement id → base62 as the code (collision-free by construction), with dedupe on `longUrl`.
3. `GET /:code` redirect from DB; then add async click increment.
4. Add Redis read-through cache to `GET /:code`.
5. Add the token-bucket rate limiter middleware on `POST /links`.
6. `stats` endpoint + tests (redirect, 404, dedupe, rate-limit 429).

**Key skeletons:**

Base62 from the primary key sidesteps collision handling entirely — the DB guarantees unique ids, so codes are unique by construction. Mention the alternative (random code + retry on unique-violation) as a trade-off:

```ts
// lib/base62.ts
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export function encodeBase62(n: bigint): string {
  if (n === 0n) return '0';
  let s = '';
  const base = 62n;
  while (n > 0n) {
    s = ALPHABET[Number(n % base)] + s;
    n /= base;
  }
  return s;
}
```

```ts
// services/shortener.service.ts
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { encodeBase62 } from '../lib/base62';
import { Conflict, NotFound } from '../lib/errors';

const CACHE_TTL = 3600; // seconds

export const shortenerService = {
  async create(url: string, alias?: string) {
    // dedupe: same URL (no custom alias) returns existing code
    if (!alias) {
      const existing = await prisma.link.findFirst({ where: { longUrl: url } });
      if (existing) return { code: existing.code };
    }
    try {
      // create first to get the autoincrement id, then derive code from it
      const created = await prisma.link.create({ data: { longUrl: url, code: alias ?? 'pending' } });
      const code = alias ?? encodeBase62(created.id);
      if (!alias) await prisma.link.update({ where: { id: created.id }, data: { code } });
      return { code };
    } catch (e: any) {
      if (e.code === 'P2002') throw Conflict('Alias already taken'); // unique index caught the race
      throw e;
    }
  },

  async resolve(code: string) {
    // read-through cache
    const cached = await redis.get(`url:${code}`);
    if (cached) {
      this.bumpClicks(code); // fire-and-forget, off the redirect path
      return cached;
    }
    const link = await prisma.link.findUnique({ where: { code } });
    if (!link) throw NotFound('Link not found');
    if (link.expiresAt && link.expiresAt < new Date())
      throw new (require('../lib/errors').AppError)(410, 'GONE', 'Link expired');
    await redis.set(`url:${code}`, link.longUrl, 'EX', CACHE_TTL);
    this.bumpClicks(code);
    return link.longUrl;
  },

  bumpClicks(code: string) {
    // atomic increment; don't await in the redirect handler
    prisma.link.update({ where: { code }, data: { clicks: { increment: 1 } } }).catch(() => {});
  },
};
```

Token-bucket rate limiter in Redis (atomic via a Lua script so check-and-decrement can't race):

```ts
// middleware/rateLimit.ts — token bucket: `capacity` tokens, refills `refill`/sec
import { redis } from '../lib/redis';
import { AppError } from '../lib/errors';
import { asyncHandler } from '../lib/asyncHandler';

const LUA = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local tokens = tonumber(redis.call('hget', key, 'tokens') or capacity)
local ts = tonumber(redis.call('hget', key, 'ts') or now)
tokens = math.min(capacity, tokens + (now - ts) * refill)
local allowed = 0
if tokens >= 1 then tokens = tokens - 1; allowed = 1 end
redis.call('hset', key, 'tokens', tokens, 'ts', now)
redis.call('expire', key, math.ceil(capacity / refill) + 1)
return allowed`;

export const rateLimit = (capacity = 10, refillPerSec = 1) =>
  asyncHandler(async (req, _res, next) => {
    const key = `rl:${req.ip}`;
    const allowed = await redis.eval(LUA, 1, key, capacity, refillPerSec, Math.floor(Date.now() / 1000));
    if (allowed === 0) throw new AppError(429, 'RATE_LIMITED', 'Too many requests');
    next();
  });
```

**Edge cases & handling:** malformed URL → Zod `.url()` → 422; alias collision → unique index + `P2002` → 409 (never a silent overwrite); expired link → 410; cache/DB drift on click counts → treat Redis as best-effort, DB as source of truth; unknown code → 404; rate-limit refill math clamped to `capacity`.

**Testing / scaling talk:** unit-test base62 round-trip; Supertest the redirect (assert `302` + `Location`), dedupe, and a burst that trips `429`. To scale reads: the Redis cache already absorbs hot codes; add read replicas; batch click increments (buffer in Redis, flush to DB periodically) instead of one write per hit.

**Senior signals:** deriving codes from the PK to make collisions impossible (and knowing the random-retry alternative), `302` vs `301` reasoning tied to analytics, atomic rate limiting via Lua (not a racy GET/SET), cache-aside with explicit TTL, and keeping click-counting off the redirect's critical path.

---

### Advanced — E-commerce Order / Checkout API

**Problem statement.** Build a checkout API: authenticated users place orders against products with limited stock. The system must never oversell under concurrent requests, must be safe to retry (idempotency), gate admin actions by role, and send confirmation emails via a background worker.

**Clarifying questions to ask:**
- Auth model — JWT with roles (`CUSTOMER`, `ADMIN`)? (Yes.)
- Payment real or stubbed? (Stub a payment step; focus is inventory + orders.)
- What's the oversell guarantee — hard invariant `stock >= 0`? (Yes, DB-enforced.)
- Should a retried checkout (same idempotency key) create one order or many? (Exactly one.)
- Sync or async email? (Async via BullMQ; response returns before email sends.)
- Multi-item orders? (Yes — lock all lines in one transaction.)

**Feature list.**
- Must: JWT auth + `requireRole`; `POST /orders` (multi-item, transactional stock decrement with row locks, idempotency key); `GET /orders/:id` (owner or admin); admin `POST /products` + `PATCH /products/:id/stock`; BullMQ worker for confirmation emails.
- Nice-to-have: order status state machine, refunds/cancel with stock restock, pagination on order history, webhook on payment, saga/outbox for the email.

**Folder structure** extends the base with:

```text
src/
  ...
  middleware/auth.middleware.ts       # verifyJwt + requireRole
  services/{auth,order,product}.service.ts
  repositories/{order,product}.repository.ts
  queue/
    email.queue.ts                    # BullMQ queue (producer)
    email.worker.ts                   # BullMQ worker (separate process)
  lib/idempotency.ts
```

**Data model.**

```prisma
enum Role { CUSTOMER ADMIN }
enum OrderStatus { PENDING PAID CANCELLED }

model User {
  id       String @id @default(uuid())
  email    String @unique
  password String            // bcrypt hash
  role     Role   @default(CUSTOMER)
  orders   Order[]
}

model Product {
  id    String @id @default(uuid())
  name  String
  price Int                  // cents
  stock Int                  // CHECK (stock >= 0) added via migration
  items OrderItem[]
}

model Order {
  id             String      @id @default(uuid())
  userId         String
  user           User        @relation(fields: [userId], references: [id])
  status         OrderStatus @default(PENDING)
  total          Int
  idempotencyKey String?     @unique   // one order per key
  createdAt      DateTime    @default(now())
  items          OrderItem[]
  @@index([userId])
}

model OrderItem {
  id        String  @id @default(uuid())
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id])
  productId String
  product   Product @relation(fields: [productId], references: [id])
  qty       Int
  unitPrice Int
}
```

Add the hard invariant in a migration: `ALTER TABLE "Product" ADD CONSTRAINT stock_non_negative CHECK (stock >= 0);` — even a bug can't drive stock negative.

**API contract.**

```text
POST /auth/register           201 {data:{token}}                  | 409 email exists
POST /auth/login              200 {data:{token}}                  | 401
POST /products    [ADMIN]     201 {data:Product}                  | 401 | 403 | 422
PATCH /products/:id/stock [ADMIN] 200 {data:Product}              | 404
POST /orders      [CUSTOMER]  201 {data:Order}   header: Idempotency-Key
                              | 409 out of stock | 409 duplicate replay(returns same order) | 401 | 422
GET  /orders/:id  [owner|ADMIN] 200 {data:Order} | 403 | 404
```

**Build order (and why):**
1. Auth first (register/login, bcrypt, JWT, `verifyJwt`, `requireRole`) — everything else is gated by it.
2. Product create/stock endpoints (admin) — you need stock to sell.
3. `POST /orders` **transactional core** — the centerpiece; get it correct before decorating.
4. Add idempotency to `POST /orders`.
5. Wire BullMQ: enqueue email job after commit; worker in a separate file.
6. `GET /orders/:id` with ownership check; tests, including the concurrency test.

**Key skeletons:**

Auth middleware — role checks live here, never in the body:

```ts
// middleware/auth.middleware.ts
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Unauthorized, Forbidden } from '../lib/errors';
import { RequestHandler } from 'express';

export const verifyJwt: RequestHandler = (req, _res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return next(Unauthorized());
  try {
    req.user = jwt.verify(token, env.JWT_SECRET) as { id: string; role: string };
    next();
  } catch {
    next(Unauthorized('Invalid token'));
  }
};

export const requireRole =
  (...roles: string[]): RequestHandler =>
  (req, _res, next) =>
    roles.includes(req.user!.role) ? next() : next(Forbidden());
```

The transactional, oversell-proof checkout — this is what the whole problem is about:

```ts
// services/order.service.ts
import { prisma } from '../lib/prisma';
import { Conflict, NotFound } from '../lib/errors';
import { emailQueue } from '../queue/email.queue';
import { Prisma } from '@prisma/client';

type Line = { productId: string; qty: number };

export const orderService = {
  async checkout(userId: string, lines: Line[], idempotencyKey?: string) {
    // 1) Idempotent replay: same key → return the already-created order, don't decrement again
    if (idempotencyKey) {
      const prior = await prisma.order.findUnique({ where: { idempotencyKey } });
      if (prior) return prior;
    }

    // 2) One serializable-ish transaction: lock rows, check stock, decrement, insert order
    const order = await prisma.$transaction(async (tx) => {
      let total = 0;
      const items: any[] = [];

      for (const line of lines) {
        // SELECT ... FOR UPDATE: lock this product row so concurrent checkouts serialize
        const [product] = await tx.$queryRaw<any[]>(
          Prisma.sql`SELECT id, price, stock FROM "Product" WHERE id = ${line.productId} FOR UPDATE`,
        );
        if (!product) throw NotFound(`Product ${line.productId}`);
        if (product.stock < line.qty) throw Conflict(`Out of stock: ${line.productId}`);

        await tx.product.update({
          where: { id: line.productId },
          data: { stock: { decrement: line.qty } }, // CHECK (stock>=0) is the final guard
        });
        total += product.price * line.qty;
        items.push({ productId: line.productId, qty: line.qty, unitPrice: product.price });
      }

      return tx.order.create({
        data: { userId, total, status: 'PAID', idempotencyKey, items: { create: items } },
        include: { items: true },
      });
    });

    // 3) Enqueue confirmation email AFTER commit — never block the response on SMTP
    await emailQueue.add('order-confirmation', { orderId: order.id, userId });
    return order;
  },
};
```

Why this is correct: `FOR UPDATE` makes concurrent transactions touching the same product **serialize** on that row — the second reader blocks until the first commits, then sees the decremented stock, so two buyers can't both pass the `stock >= qty` check. The unique `idempotencyKey` (plus the pre-check) makes retries return the same order instead of double-charging. The `CHECK` constraint is the belt-and-suspenders backstop. (Alternative to state out loud: `UPDATE Product SET stock = stock - :qty WHERE id = :id AND stock >= :qty` and check `rowCount` — a single atomic statement that avoids an explicit lock; good for single-item, trickier for multi-item ordering/deadlocks. Also mention consistent lock ordering — e.g., sort `productId`s — to avoid deadlocks on multi-item orders.)

BullMQ producer + worker (worker runs as its own process):

```ts
// queue/email.queue.ts
import { Queue } from 'bullmq';
import { redisConnection } from '../lib/redis';
export const emailQueue = new Queue('emails', { connection: redisConnection });
```

```ts
// queue/email.worker.ts  — started via `node dist/queue/email.worker.js`
import { Worker } from 'bullmq';
import { redisConnection } from '../lib/redis';

new Worker(
  'emails',
  async (job) => {
    const { orderId } = job.data;
    await sendConfirmationEmail(orderId); // real SMTP/provider call
  },
  { connection: redisConnection, concurrency: 5 },
); // BullMQ retries with backoff on throw; dead-letter after max attempts
```

**Edge cases & handling:** insufficient stock → 409 and the whole transaction rolls back (no partial decrement); duplicate submit (same idempotency key) → return the original order, `201`/`200`, no second decrement; missing/expired token → 401; customer fetching another user's order → 403; product not found mid-order → transaction aborts; email provider down → job retries via BullMQ, order still succeeds; deadlock on multi-item → deterministic lock ordering + let Postgres abort/retry.

**Testing / scaling talk:** Supertest for auth flows, role gating (403), and out-of-stock (409). The signature test: fire **N concurrent** `POST /orders` at a product with stock 1 (`Promise.all`) and assert exactly one `201` and the rest `409`, with final `stock = 0` — this proves no overselling. To scale: move stock to an atomic decrement or a reservation model; use an **outbox table** so the email enqueue commits in the same transaction as the order (no lost/duplicate jobs); partition orders by user; read replicas for order history.

**Senior signals:** naming the concurrency hazard up front and choosing row locks with a stated alternative; idempotency keys for safe retries; role checks in middleware from the verified token (not the body); background queue so the request path stays fast; a DB `CHECK` as a correctness backstop; and a concurrency test that actually demonstrates the invariant. This is the walkthrough where talking through trade-offs matters as much as the code.

---

## BE Machine-Coding Checklist

- [ ] `app` (build) separated from `server` (listen); Supertest imports `app`.
- [ ] `process.env` validated with Zod at boot; no hard-coded secrets.
- [ ] Layering intact: controllers thin, services hold logic, repositories own all Prisma calls.
- [ ] Zod validation at the boundary on body/params/query; downstream gets clean typed data.
- [ ] Correct status codes: 201+Location on create, 204 on delete, 400/422 bad input, 401 vs 403, 404, 409 conflict, 429 rate-limited.
- [ ] Consistent envelopes: `{ data, meta }` for lists, `{ error: { code, message, details? } }` for errors.
- [ ] One central error-handling middleware registered last; no stack traces leaked; Prisma `P2002` → 409.
- [ ] `asyncHandler` (or Express 5) so async errors reach the middleware.
- [ ] Pagination on every collection; indexes on filtered/looked-up columns.
- [ ] Concurrency: transactions + row locks (or atomic `UPDATE ... WHERE stock >= qty`); DB `CHECK`/unique constraints enforce invariants.
- [ ] Idempotency key on money/inventory-mutating POSTs.
- [ ] Auth: bcrypt-hashed passwords, short-lived signed JWT, `requireRole` from the verified token.
- [ ] Redis used for hot-read cache and/or atomic rate limiting (Lua, not racy GET/SET); TTLs set.
- [ ] Background work (email/webhooks) off the request path via BullMQ; worker retries.
- [ ] At least happy + key unhappy-path Supertest per endpoint; one test proving the tricky invariant (e.g., no overselling).
- [ ] Deferred scope stated out loud; must-haves finished before nice-to-haves.


---


# Full-Stack Machine Coding

Full-stack machine coding is the hardest of the three tracks to *pace*, not the hardest to *think about*. You know React, you know Express + Prisma + Redis — the trap is that you have twice the surface area and the same 90 minutes. The candidates who fail are the ones who build a beautiful backend with zero UI, or a gorgeous UI wired to a mocked API that never becomes real. The candidates who pass ship **one thin feature end-to-end, then the next, then the next**. This part teaches that discipline.

Reference stack for all samples:

- **Frontend**: Next.js (App Router) + TypeScript, TanStack Query for server state, Zustand (or React context) for client-only UI state.
- **Backend**: Express + TypeScript, Prisma ORM over PostgreSQL, Redis for cache / pub-sub, `zod` for validation, JWT auth.
- **Shared**: a `packages/shared` module holding the **type contract** (request/response DTOs, enums) imported by both sides so they physically cannot drift.

## The FS Machine-Coding Playbook

### The first 10 minutes

Do not open your editor. Talk and sketch first. The single most valuable thing you can produce in minute 1–10 is a **shared type contract**, because it forces you to decide the API surface before you build either half of it.

1. **Clarify (2 min).** Ask the questions that change the architecture, not the cosmetics:
   - Auth: do you want real JWT auth or is a hardcoded user fine? (Huge time delta.)
   - Persistence: real Postgres/Prisma, or is an in-memory store acceptable if I run short on time?
   - Scope of "done": is a working happy path across the whole stack better than a polished single layer? (The answer is almost always yes — get them to say it.)
   - Real-time / caching expected, or nice-to-have?
2. **MoSCoW the features (2 min).** Write it where the interviewer can see it.
   - *Must*: the one vertical slice that proves the product works (e.g. "log in → create a note → see it in my list, reload, still there").
   - *Should*: full CRUD, validation, error states.
   - *Could*: pagination, search, optimistic UI, charts.
   - *Won't (today)*: email verification, password reset, roles/permissions, deployment.
3. **Sketch the model + architecture (3 min).** One box diagram: `Next.js client → Express API → Prisma → Postgres`, with Redis hanging off the API. Then the data model as 2–4 tables with relations.
4. **Write the shared types (1–2 min).** Literally type out the DTOs in `packages/shared`. This is your contract and your to-do list.

Say out loud: *"I'm going to build this as vertical slices — auth end to end first, then notes CRUD end to end — so we always have something running. I'll keep polish for the end."* That sentence alone reads as senior.

### Evaluation criteria specific to full-stack

What interviewers **reward**:

- **Vertical-slice delivery.** A working login + one real CRUD path beats a half-built everything. They want to see a running app in the browser talking to a real server.
- **A shared type contract.** Client and server importing the same `CreateNoteRequest` / `NoteResponse` types. This is *the* full-stack signal — it shows you think about the seam, not just the two halves.
- **Correct state ownership.** Server state (data fetched from the API) lives in TanStack Query; client state (modal open, form draft, current tab) lives in a store or component state. Mixing them (e.g. copying query data into `useState`) is a classic junior tell.
- **Auth done end-to-end.** Token issued on the server, stored on the client, attached to requests, verified by middleware, and used to *scope data* (you only see your own notes). Protected routes on **both** client (redirect) and server (401).
- **A demoable happy path early.** Ideally something works in the browser by the 35–40 minute mark.

What interviewers **penalize**:

- Building backend-only or frontend-only for 70 minutes then panicking.
- Hardcoding data on the client "to be replaced later" and never replacing it.
- Client-side-only auth (routes hidden in the UI but the API returns everyone's data to anyone).
- Types duplicated and manually kept in sync on both sides (they *will* drift, and interviewers know it).
- Storing JWTs and secrets carelessly, or no validation on request bodies.

### Folder structure (monorepo)

A lightweight monorepo (npm/pnpm workspaces) is the idiomatic full-stack layout and directly enables the shared-types win. Keep it flat — you are not setting up Turborepo in 90 minutes.

```text
fullstack-app/
├── package.json                # workspaces: ["apps/*", "packages/*"]
├── pnpm-workspace.yaml          # or "workspaces" field in package.json
├── docker-compose.yml           # postgres + redis for local dev
├── packages/
│   └── shared/                  # THE CONTRACT — imported by both apps
│       ├── package.json         # "name": "@app/shared"
│       └── src/
│           ├── index.ts
│           ├── notes.ts         # DTOs + zod schemas for notes
│           └── auth.ts          # DTOs + zod schemas for auth
├── apps/
│   ├── api/                     # Express + Prisma backend
│   │   ├── package.json
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       ├── index.ts         # app bootstrap, middleware chain
│   │       ├── lib/
│   │       │   ├── prisma.ts     # PrismaClient singleton
│   │       │   ├── redis.ts      # ioredis client
│   │       │   └── jwt.ts        # sign/verify helpers
│   │       ├── middleware/
│   │       │   ├── auth.ts       # requireAuth -> req.userId
│   │       │   ├── validate.ts   # zod body/query validator
│   │       │   └── error.ts      # central error handler
│   │       ├── modules/          # feature-first, not layer-first
│   │       │   ├── auth/
│   │       │   │   ├── auth.routes.ts
│   │       │   │   ├── auth.controller.ts
│   │       │   │   └── auth.service.ts
│   │       │   └── notes/
│   │       │       ├── notes.routes.ts
│   │       │       ├── notes.controller.ts
│   │       │       └── notes.service.ts
│   │       └── routes.ts         # mounts module routers under /api
│   └── web/                     # Next.js App Router frontend
│       ├── package.json
│       └── src/
│           ├── app/
│           │   ├── layout.tsx    # QueryClientProvider, auth bootstrap
│           │   ├── (auth)/login/page.tsx
│           │   ├── (auth)/register/page.tsx
│           │   └── (app)/notes/page.tsx   # protected
│           ├── lib/
│           │   ├── api-client.ts # fetch wrapper, attaches JWT
│           │   └── query-keys.ts
│           ├── features/
│           │   ├── auth/
│           │   │   ├── use-auth.ts        # login/register/logout hooks
│           │   │   └── auth-store.ts      # Zustand: token + user
│           │   └── notes/
│           │       ├── use-notes.ts       # TanStack Query hooks
│           │       └── components/
│           └── components/ui/    # shared dumb components
```

Why this shape:

- **`packages/shared` first-class.** It's the whole point of the monorepo here. Both apps `import { CreateNoteRequest } from "@app/shared"`.
- **Feature-first modules** (`modules/notes/`, `features/notes/`) on both sides so a vertical slice is a self-contained folder you can build in one sitting.
- **Thin layering inside a module**: `routes → controller → service`. Controller does HTTP (parse, status codes); service does business logic + Prisma. Don't over-engineer with repositories/DI in a timed round.

### Architecture & code organization

The backend uses a **route → controller → service** flow. Controllers own the HTTP envelope (status codes, reading `req.userId`); services own logic and data access. This keeps controllers trivially readable and services testable.

The frontend splits **server state** from **client state**:

- **TanStack Query** owns anything that came from the API. It handles caching, refetch, loading/error flags, and invalidation. You never manually `useState` server data.
- **Zustand** (or context) owns the JWT/user and pure-UI state. It is small and synchronous.

The seam between them is the `api-client.ts` fetch wrapper, which reads the token from the auth store and attaches `Authorization: Bearer …` to every request.

### The shared type contract (the FS superpower)

This is the thing that separates a full-stack candidate from a frontend dev who can also write Express. Define request/response shapes **once**, with a `zod` schema, and derive the TypeScript type from it. The server validates against the schema; the client imports the type. If you change the contract, both sides fail to compile — that's the feature.

```ts
// packages/shared/src/notes.ts
import { z } from "zod";

export const createNoteSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().max(10_000).default(""),
});
export type CreateNoteRequest = z.infer<typeof createNoteSchema>;

export const updateNoteSchema = createNoteSchema.partial();
export type UpdateNoteRequest = z.infer<typeof updateNoteSchema>;

// Response DTO — note: NO userId leaked, dates as ISO strings over the wire
export interface NoteResponse {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}
```

```ts
// apps/api/src/middleware/validate.ts — one generic validator reused everywhere
import { ZodSchema } from "zod";
import { RequestHandler } from "express";

export const validateBody =
  (schema: ZodSchema): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "ValidationError", details: result.error.flatten() });
    }
    req.body = result.data; // now typed + defaulted
    next();
  };
```

### API design + DB design + auth

**API design.** Consistent, resource-oriented, and predictable:

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/notes`, `POST /api/notes`, `GET /api/notes/:id`, `PATCH /api/notes/:id`, `DELETE /api/notes/:id`
- Consistent error envelope: `{ error: string, details?: unknown }`, correct status codes (400 validation, 401 unauth, 403 forbidden, 404 not found).

**DB design.** Model relations explicitly in Prisma; scope every child to its owner.

**Auth end-to-end** — the full loop:

1. Register: hash password with `bcrypt`, store user.
2. Login: verify hash, sign a JWT (`{ sub: userId }`), return it.
3. Client stores it (in memory + `localStorage` for reload survival — mention the httpOnly-cookie upgrade for XSS safety).
4. `api-client` attaches `Authorization: Bearer <token>`.
5. `requireAuth` middleware verifies the token, sets `req.userId`, else 401.
6. Every service query filters by `req.userId` — this is the part juniors forget, and it's a security bug, not a cosmetic one.

```ts
// apps/api/src/middleware/auth.ts
import { RequestHandler } from "express";
import { verifyToken } from "../lib/jwt";

export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try {
    const { sub } = verifyToken(header.slice(7));
    req.userId = sub; // augment Express.Request type in a d.ts
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
};
```

### Error handling, validation, and testing

- **Validation at the edge**: `validateBody(schema)` on every mutating route, using the *shared* zod schema. Invalid input never reaches the service.
- **Central error handler**: services throw typed errors (`throw new HttpError(404, "Note not found")`); one Express error middleware maps them to the JSON envelope. No `try/catch` littered in every controller.
- **Client error states**: TanStack Query's `isError` / `error` drive inline messages; the `api-client` throws on non-2xx so Query catches it.
- **Testing story** (say this even if you don't write them): a couple of **supertest** integration tests on the API (`register → login → create note → list returns it`) give the most coverage per minute because they exercise routing, validation, auth, and DB together. A Vitest unit test on a service function for tricky logic. On the client, a React Testing Library test that the notes list renders from mocked query data.

### Performance & scalability

- **Redis caching** for hot reads (analytics counts, link lookups) with cache-aside + TTL; invalidate on write.
- **Pagination** on list endpoints (`take`/`cursor` in Prisma) so lists don't unbounded-grow.
- **Indexes** on foreign keys and lookup columns (`@@index([userId])`, `@unique` on `slug`).
- **Connection reuse**: single PrismaClient and single Redis client as module singletons — creating them per-request exhausts connections.
- **TanStack Query caching** removes redundant client fetches; set sensible `staleTime`.
- **Real-time at scale**: Redis pub/sub lets multiple API instances broadcast WebSocket messages (a single in-process `EventEmitter` breaks the moment you have >1 server).

### Best practices & common mistakes

**Do:**

- Build one vertical slice fully before starting the next. Get something in the browser early.
- Commit small: `feat: auth end-to-end`, then `feat: notes CRUD`. Visible slice-by-slice progress.
- Keep the happy path demoable at all times; degrade gracefully (an in-memory store fallback if Prisma setup eats time).
- Scope every query by the authenticated user.

**Avoid:**

- Client-only auth (UI hides the page but the API is wide open).
- Duplicating types by hand across client/server.
- Copying server data into `useState`.
- Leaving mutations without loading/disabled states (double-submits).
- Spending 20 minutes on CSS while a core mutation is still broken.

## Project Walkthroughs

### Beginner — Notes App (auth + user-scoped CRUD)

**Problem statement.** Build a notes app: users can register and log in (JWT), and perform CRUD on notes that belong only to them. Routes must be protected on client and server.

**Clarifying questions.**
- Real JWT auth or a stub user? (Assume real JWT.)
- Is a note just title + body, or folders/tags too? (Assume title + body.)
- Should notes persist across reloads / server restarts? (Yes → real Postgres.)
- Any sharing between users? (No — strictly private, single owner.)

**Feature list.**
- *Must*: register, login, create note, list *my* notes, persistence, server-side auth scoping.
- *Should*: edit + delete, validation + error states, client route protection with redirect.
- *Could*: search/filter, markdown preview, optimistic delete.
- *Won't*: password reset, sharing, roles.

**Folder structure.** As the monorepo tree above (`apps/api` + `apps/web` + `packages/shared`), with `modules/auth`, `modules/notes` on the server and `features/auth`, `features/notes` on the client.

**Data model.**

```prisma
// apps/api/prisma/schema.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hash
  notes     Note[]
  createdAt DateTime @default(now())
}

model Note {
  id        String   @id @default(cuid())
  title     String
  body      String   @default("")
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}
```

**API contract.**

```text
POST   /api/auth/register  { email, password }        -> { token, user }
POST   /api/auth/login     { email, password }        -> { token, user }
GET    /api/auth/me        (auth)                      -> { user }
GET    /api/notes          (auth)                      -> NoteResponse[]
POST   /api/notes          (auth) CreateNoteRequest    -> NoteResponse
GET    /api/notes/:id      (auth)                      -> NoteResponse
PATCH  /api/notes/:id      (auth) UpdateNoteRequest    -> NoteResponse
DELETE /api/notes/:id      (auth)                      -> 204
```

**Build order (and why).**

1. **Scaffold monorepo + shared types (5 min).** Workspaces, `@app/shared` with `auth.ts` + `notes.ts` schemas. Contract-first.
2. **Prisma schema + migrate + client singleton (8 min).** Get the DB real early; it's the thing most likely to bite you.
3. **Auth vertical slice end-to-end (20 min).** Server: register/login/`requireAuth`. Client: login form → store token → `/notes` redirect. *Demo it: I can register and land on an (empty) notes page.* This is the risky slice; do it first.
4. **Notes CRUD vertical slice (25 min).** `GET`/`POST` first (list + create), scoped by `req.userId`, wired to TanStack Query on the client. Then `PATCH`/`DELETE`. *Demo: create a note, reload, it's still there.*
5. **Polish (remaining).** Validation error display, loading states, delete confirm, empty state, a little CSS.

**Key skeletons for the tricky parts.**

Service scopes by user (the security-critical bit):

```ts
// apps/api/src/modules/notes/notes.service.ts
import { prisma } from "../../lib/prisma";
import { CreateNoteRequest, UpdateNoteRequest } from "@app/shared";

export const notesService = {
  list: (userId: string) =>
    prisma.note.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }),

  create: (userId: string, data: CreateNoteRequest) =>
    prisma.note.create({ data: { ...data, userId } }),

  async update(userId: string, id: string, data: UpdateNoteRequest) {
    // updateMany with userId in the WHERE prevents editing someone else's note
    const { count } = await prisma.note.updateMany({ where: { id, userId }, data });
    if (count === 0) throw new HttpError(404, "Note not found");
    return prisma.note.findUniqueOrThrow({ where: { id } });
  },
};
```

TanStack Query hooks with cache invalidation:

```ts
// apps/web/src/features/notes/use-notes.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api-client";
import { CreateNoteRequest, NoteResponse } from "@app/shared";

const KEY = ["notes"] as const;

export function useNotes() {
  return useQuery({ queryKey: KEY, queryFn: () => api.get<NoteResponse[]>("/notes") });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateNoteRequest) => api.post<NoteResponse>("/notes", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }), // refetch, no manual state
  });
}
```

Client route protection (client + server together):

```tsx
// apps/web/src/app/(app)/layout.tsx — guards the whole protected group
"use client";
import { useAuthStore } from "@/features/auth/auth-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  useEffect(() => {
    if (!token) router.replace("/login"); // client guard is UX; server 401 is the real gate
  }, [token, router]);
  if (!token) return null;
  return <>{children}</>;
}
```

**Edge cases.**
- Duplicate email on register → catch Prisma `P2002` unique violation → 409.
- Expired/invalid token → 401 → `api-client` clears the store and redirects to login.
- Editing/deleting a note that isn't yours → `updateMany`/`deleteMany` with `userId` returns count 0 → 404 (never 403 leaking existence).
- Empty title → blocked by zod at the edge.
- Reload survival → token in `localStorage`, rehydrated into the store on mount.

**Testing / scaling talk.** Supertest flow: `register → login → create → list returns exactly my note; a second user's list is empty`. That one test proves auth + scoping. Scaling: paginate the list, index `userId` (already done), move token to httpOnly cookie for XSS safety.

**Senior signals.** Shared zod schema reused for server validation *and* client types; user-scoped `updateMany`/`deleteMany` (security-aware); TanStack Query invalidation instead of manual refetch; auth guarded on both sides with the explicit acknowledgement that the *server* is the real gate.

### Intermediate — URL Shortener with Analytics

**Problem statement.** Users create short links from long URLs. Hitting a short link redirects to the original and records a click. A dashboard shows each link's click count and a time-series chart. Use Redis to cache lookups (the redirect is the hot path). Client uses TanStack Query.

**Clarifying questions.**
- Auth required to create links, or anonymous? (Assume logged-in users own their links.)
- Custom slugs allowed or always generated? (Generated; custom is a "could".)
- What analytics granularity — total count, or per-day / per-referrer / per-country? (Total + per-day time series; referrer if time.)
- Expected read/write ratio? (Reads >> writes → justifies caching the redirect.)

**Feature list.**
- *Must*: create short link, redirect `/:slug` → original + record click, dashboard listing links with total clicks.
- *Should*: per-day time-series chart, Redis cache on the redirect lookup, TanStack Query on dashboard.
- *Could*: custom slugs, referrer breakdown, copy-to-clipboard, QR code.
- *Won't*: teams, rate limiting per plan, custom domains.

**Folder structure.** Same monorepo. New backend module `modules/links` (create, redirect, analytics) and `modules/analytics` if you split it out; frontend `features/links` with `use-links.ts`, `use-link-analytics.ts`, and a `LinkChart` component.

**Data model.**

```prisma
model Link {
  id        String   @id @default(cuid())
  slug      String   @unique          // the short code
  url       String                    // destination
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  clicks    Click[]
  clickCount Int     @default(0)       // denormalized counter for fast dashboard
  createdAt DateTime @default(now())

  @@index([userId])
}

model Click {
  id        String   @id @default(cuid())
  linkId    String
  link      Link     @relation(fields: [linkId], references: [id], onDelete: Cascade)
  referrer  String?
  createdAt DateTime @default(now())

  @@index([linkId, createdAt])          // supports time-series grouping
}
```

**API contract.**

```text
POST /api/links               (auth) { url, slug? }   -> { id, slug, url, clickCount }
GET  /api/links               (auth)                  -> LinkResponse[]
GET  /api/links/:id/analytics (auth)                  -> { total, series: {date, count}[] }
GET  /:slug                   (public) 302 redirect -> original url  (+ records click)
```

**Build order (and why).**

1. **Shared types + Prisma model (8 min).** `Link`, `Click`, `LinkResponse`, `AnalyticsResponse`.
2. **Create + redirect vertical slice (25 min).** `POST /api/links` (generate slug via `nanoid`), then the public `GET /:slug` redirect that reads the link and records a click. *Demo: create a link in the DB, hit it, get redirected.* This is the core product — do it before analytics.
3. **Add Redis cache to the redirect (10 min).** Cache-aside on `slug → url`. Show the pattern (below). This is the intermediate-level flourish they're looking for.
4. **Dashboard list (12 min).** `GET /api/links` + TanStack Query table showing `clickCount`.
5. **Analytics chart (15 min).** `GET /api/links/:id/analytics` grouping clicks by day; render with Recharts. *Demo: click the link a few times, watch the count and chart update.*
6. **Polish.** Copy button, empty states, validation (reject non-URLs).

**Key skeletons.**

Redirect with cache-aside + async click recording:

```ts
// apps/api/src/modules/links/links.service.ts
import { prisma } from "../../lib/prisma";
import { redis } from "../../lib/redis";

const cacheKey = (slug: string) => `link:${slug}`;

export async function resolveSlug(slug: string): Promise<string | null> {
  // 1. hot path: Redis
  const cached = await redis.get(cacheKey(slug));
  if (cached) return cached;

  // 2. miss: Postgres, then populate cache with TTL
  const link = await prisma.link.findUnique({ where: { slug } });
  if (!link) return null;
  await redis.set(cacheKey(slug), link.url, "EX", 60 * 60); // 1h TTL
  return link.url;
}

export async function recordClick(slug: string, referrer?: string) {
  // fire-and-forget-ish; don't block the redirect on analytics writes
  const link = await prisma.link.findUnique({ where: { slug }, select: { id: true } });
  if (!link) return;
  await prisma.$transaction([
    prisma.click.create({ data: { linkId: link.id, referrer } }),
    prisma.link.update({ where: { id: link.id }, data: { clickCount: { increment: 1 } } }),
  ]);
}
```

```ts
// apps/api/src/modules/links/links.controller.ts — the public redirect
export const redirect: RequestHandler = async (req, res) => {
  const url = await resolveSlug(req.params.slug);
  if (!url) return res.status(404).send("Not found");
  res.redirect(302, url);
  // record after responding so the user isn't waiting on the write
  recordClick(req.params.slug, req.get("referer") ?? undefined).catch(console.error);
};
```

Time-series analytics (group by day in SQL, not JS):

```ts
// raw query is fine and honest for date_trunc grouping
export async function getSeries(linkId: string) {
  return prisma.$queryRaw<{ date: string; count: bigint }[]>`
    SELECT date_trunc('day', "createdAt")::date AS date, count(*) AS count
    FROM "Click" WHERE "linkId" = ${linkId}
    GROUP BY 1 ORDER BY 1`;
}
```

Chart on the client (server state via Query, chart is pure presentation):

```tsx
// apps/web/src/features/links/LinkChart.tsx
import { LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function LinkChart({ linkId }: { linkId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", linkId],
    queryFn: () => api.get(`/links/${linkId}/analytics`),
    staleTime: 30_000,
  });
  if (isLoading || !data) return <p>Loading…</p>;
  return (
    <LineChart width={480} height={220} data={data.series}>
      <XAxis dataKey="date" /><YAxis allowDecimals={false} />
      <Tooltip /><Line dataKey="count" />
    </LineChart>
  );
}
```

**Edge cases.**
- Slug collision on custom slug → `@unique` violation → 409, ask for another.
- Invalid / non-http URL → reject with zod `.url()`.
- Cache/DB drift if a link is deleted → delete the cache key on delete, or accept eventual consistency via TTL (say which and why).
- `bigint` from `count(*)` isn't JSON-serializable → map to `Number` before responding.
- Redirect must not 500 if the analytics write fails — it's fire-and-forget with a `.catch`.

**Testing / scaling talk.** Test: create link → GET `/:slug` returns 302 to the right URL → analytics total increments. Scaling: the denormalized `clickCount` avoids a `count(*)` on every dashboard load; Redis absorbs the redirect read load; at high volume, buffer clicks in Redis and flush to Postgres in batches instead of a write-per-click; add an index on `[linkId, createdAt]` (done) for the time series.

**Senior signals.** Cache-aside with explicit TTL and invalidation reasoning; responding to the redirect *before* the analytics write (latency awareness); denormalized counter vs live aggregate trade-off; grouping in SQL not JS; `staleTime` tuning on the chart query. Naming the batch-flush-at-scale approach even without building it.

### Advanced — Real-Time Live Chat / Live Dashboard (WebSockets + Redis pub/sub)

**Problem statement.** Build a real-time feature: a live chat room (messages broadcast to everyone in the room in real time) **or** a live-updating dashboard. Requirements: WebSocket (or SSE) transport, Redis pub/sub so it works across multiple server instances, presence (who's online), optimistic UI on send, and graceful reconnection. *This maps directly to the candidate's Logly (live log streaming) and Snippets (real-time collab) work — lean on those patterns and say so in the interview.*

I'll walk through **live chat**, since it exercises every requirement; the live-dashboard variant is the same infrastructure with server-pushed metric events instead of user messages.

**Clarifying questions.**
- WebSockets or SSE? (Chat is bidirectional → WebSockets, `ws` or Socket.IO. Live dashboard could be SSE since it's one-directional.)
- Single room or multiple rooms? (Start single, design for multi via channel names.)
- Do messages persist (history on join) or ephemeral? (Persist last N to Postgres, load on join.)
- Multiple server instances expected? (Yes → *must* use Redis pub/sub, not an in-process emitter — this is the whole point of the exercise.)
- Auth on the socket? (Yes — pass the JWT on connection.)

**Feature list.**
- *Must*: connect (authenticated), send message, all clients receive it live, message history on join.
- *Should*: Redis pub/sub fan-out across instances, presence list, optimistic send, reconnection with backoff.
- *Could*: typing indicators, read receipts, per-room, unread badges.
- *Won't*: E2E encryption, media uploads, moderation.

**Folder structure.** Monorepo again. Backend gains `modules/chat` with `chat.gateway.ts` (socket wiring), `chat.service.ts` (persist + pub/sub), and `lib/pubsub.ts`. Frontend gains `features/chat` with `use-socket.ts` (connection + reconnection), `use-chat.ts` (messages + optimistic send), `presence-store.ts` (Zustand).

**Data model.**

```prisma
model Room {
  id       String    @id @default(cuid())
  name     String    @unique
  messages Message[]
}

model Message {
  id        String   @id @default(cuid())
  roomId    String
  room      Room     @relation(fields: [roomId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  body      String
  createdAt DateTime @default(now())

  @@index([roomId, createdAt])
}
```

**Contract (events, not just REST).** Real-time contracts are *event* contracts — put them in shared types too.

```ts
// packages/shared/src/chat.ts
export interface ChatMessage {
  id: string; roomId: string; userId: string; userEmail: string;
  body: string; createdAt: string;
}
// client -> server
export type ClientEvent =
  | { type: "message:send"; roomId: string; body: string; clientId: string } // clientId = optimistic dedupe
  | { type: "presence:ping" };
// server -> client
export type ServerEvent =
  | { type: "message:new"; message: ChatMessage; clientId?: string }
  | { type: "presence:update"; roomId: string; users: { id: string; email: string }[] }
  | { type: "history"; messages: ChatMessage[] };
```

```text
GET  /api/rooms/:id/messages?limit=50   (auth, REST fallback for history)
WS   /ws?token=<jwt>                     (auth on connect, then event stream above)
```

**Build order (and why).**

1. **Shared event types + Message model (8 min).** The event contract *is* the design here.
2. **Authenticated socket connection (12 min).** `ws` server, verify JWT from the query param on `connection`, reject if invalid. *Demo: client connects, server logs the userId.*
3. **Send + broadcast, single instance first (18 min).** In-memory: on `message:send`, persist to Postgres, broadcast `message:new` to all sockets. *Demo: two browser tabs, message appears in both.* Get the happy path visible before adding Redis.
4. **Swap in-process broadcast for Redis pub/sub (12 min).** Publish to a Redis channel; each instance subscribes and pushes to *its* sockets. This makes it multi-instance-correct. *This is the advanced signal.*
5. **Presence (10 min).** Track connected users per room in Redis (a set with TTL heartbeat); broadcast `presence:update` on join/leave.
6. **Optimistic UI + reconnection (15 min).** Client renders the message immediately with a temp id, reconciles when the server echoes it back (match on `clientId`); reconnect with exponential backoff and re-fetch history on resume.
7. **Polish.** Typing indicator, auto-scroll, timestamps.

**Key skeletons.**

Redis pub/sub fan-out (the crux — separate subscriber connection is mandatory):

```ts
// apps/api/src/modules/chat/chat.gateway.ts
import { WebSocketServer, WebSocket } from "ws";
import { pub, sub } from "../../lib/pubsub"; // two ioredis clients: a subscriber can't run normal commands
import { verifyToken } from "../../lib/jwt";
import { persistMessage } from "./chat.service";

const CHANNEL = (roomId: string) => `room:${roomId}`;
// local registry: which sockets on THIS instance are in which room
const rooms = new Map<string, Set<WebSocket>>();

export function initChat(wss: WebSocketServer) {
  // one subscription; route incoming Redis messages to local sockets
  sub.psubscribe("room:*");
  sub.on("pmessage", (_pattern, channel, payload) => {
    const roomId = channel.split(":")[1];
    rooms.get(roomId)?.forEach((ws) => ws.readyState === ws.OPEN && ws.send(payload));
  });

  wss.on("connection", (ws, req) => {
    let userId: string;
    try {
      const token = new URL(req.url!, "http://x").searchParams.get("token")!;
      userId = verifyToken(token).sub;
    } catch {
      return ws.close(4401, "Unauthorized"); // auth on the socket, not just REST
    }

    ws.on("message", async (raw) => {
      const ev = JSON.parse(raw.toString());
      if (ev.type === "message:send") {
        addToRoom(ev.roomId, ws);
        const message = await persistMessage(ev.roomId, userId, ev.body);
        // publish to Redis — EVERY instance (including this one) fans it out to its sockets
        pub.publish(CHANNEL(ev.roomId), JSON.stringify({ type: "message:new", message, clientId: ev.clientId }));
      }
    });
    ws.on("close", () => removeEverywhere(ws) /* + presence update */);
  });
}
```

Client: reconnection with backoff + optimistic send reconciliation:

```ts
// apps/web/src/features/chat/use-socket.ts
export function useSocket(onEvent: (e: ServerEvent) => void) {
  const token = useAuthStore((s) => s.token);
  const wsRef = useRef<WebSocket>();
  const retry = useRef(0);

  useEffect(() => {
    let closed = false;
    const connect = () => {
      const ws = new WebSocket(`${WS_URL}?token=${token}`);
      wsRef.current = ws;
      ws.onopen = () => { retry.current = 0; }; // reset backoff on success
      ws.onmessage = (m) => onEvent(JSON.parse(m.data));
      ws.onclose = () => {
        if (closed) return;
        const delay = Math.min(1000 * 2 ** retry.current++, 15_000); // exp backoff, capped
        setTimeout(connect, delay); // re-fetch history in the reconnect handler
      };
    };
    connect();
    return () => { closed = true; wsRef.current?.close(); };
  }, [token]);

  return wsRef;
}
```

```ts
// optimistic send: show immediately, reconcile on echo (dedupe by clientId)
function sendMessage(body: string) {
  const clientId = crypto.randomUUID();
  addLocal({ id: `tmp-${clientId}`, body, pending: true, clientId }); // instant UI
  ws.send(JSON.stringify({ type: "message:send", roomId, body, clientId }));
}
// on "message:new": if message.clientId matches a pending temp, replace it (not duplicate)
```

Presence via Redis set + heartbeat TTL:

```ts
// join: add to a per-room set; the value expires so a dead connection drops off
await redis.sadd(`presence:${roomId}`, userId);
await redis.set(`presence:${roomId}:${userId}`, "1", "EX", 30); // refreshed by client ping
// leave / expiry -> recompute members -> publish presence:update
```

**Edge cases.**
- **Duplicate messages** from optimistic UI + server echo → dedupe on `clientId`.
- **Message ordering** across instances → order by server `createdAt`, not client arrival.
- **Reconnection gaps** → on reconnect, refetch history since last-seen id so nothing is missed.
- **Ghost presence** (browser killed, no close event) → TTL heartbeat expiry, not just the `close` handler.
- **Subscriber vs publisher clients** → a Redis connection in subscribe mode can't issue normal commands; you *must* use two clients (common gotcha the interviewer probes).
- **Auth on reconnect** → expired token → socket closes 4401 → redirect to login.
- **Thundering herd** on server restart (all clients reconnect at once) → the backoff + jitter mitigates it.

**Testing / scaling talk.** Testing real-time: a socket test client that connects two clients, sends from one, asserts the other receives within a timeout. Scaling: Redis pub/sub already makes it horizontally scalable behind a sticky-session or stateless load balancer; presence in Redis (not process memory) survives instance churn; for very large rooms, batch/throttle presence updates and consider fanning out via a dedicated messaging layer. Persistence is capped (load last N, paginate older on scroll).

**Senior signals.** This is where the candidate references **Logly** (live log streaming — same WebSocket + backpressure + reconnection story) and **Snippets** (real-time collaboration — optimistic updates + conflict reconciliation). Concretely: using Redis pub/sub for multi-instance correctness (not an in-process `EventEmitter`); the two-Redis-client requirement; optimistic UI reconciled by `clientId`; exponential backoff with a cap; presence via TTL heartbeats rather than relying solely on close events; and keeping the event contract in shared types so client and server can't drift. Getting the single-instance happy path demoable *before* layering in Redis is itself a senior move under time pressure.

## FS Machine-Coding Checklist

**Before you start coding:**
- [ ] Clarified auth, persistence, and "what does done mean" (happy path > polish confirmed).
- [ ] Features MoSCoW'd on a visible surface.
- [ ] Model sketched; shared type/event contract written in `packages/shared`.

**Architecture:**
- [ ] Monorepo with a real shared types package imported by both apps.
- [ ] Feature-first modules on both sides; server `route → controller → service`.
- [ ] Zod schema shared and used for server validation + client types.

**Delivering:**
- [ ] Building one vertical slice fully before the next (auth end-to-end first).
- [ ] Something running in the browser talking to a real server by ~minute 40.
- [ ] Committing per slice with clear messages.

**Auth & security:**
- [ ] JWT issued, stored, attached to requests, verified by middleware.
- [ ] Every query scoped to `req.userId`; other users' data unreachable.
- [ ] Route protection on BOTH client (redirect) and server (401) — server is the real gate.
- [ ] Passwords hashed; secrets in env, not code.

**State & data:**
- [ ] Server state in TanStack Query (no copying into `useState`); client/UI state in a store.
- [ ] Mutations invalidate the right query keys; loading/disabled states prevent double-submit.
- [ ] Validation at the edge; central error handler; consistent error envelope + status codes.

**Perf (if reached):**
- [ ] Redis cache-aside with TTL on hot reads; invalidation on write.
- [ ] Indexes on FKs / lookup columns; single Prisma + Redis client instances.
- [ ] Pagination on list endpoints.
- [ ] (Real-time) Redis pub/sub for multi-instance; presence with TTL; optimistic UI + backoff reconnect.

**Before submitting:**
- [ ] Full happy path works end-to-end in the browser.
- [ ] At least one unhappy path handled (401, validation error, not-found).
- [ ] README/one-liner on how to run it; `docker-compose up` for Postgres + Redis.


---
