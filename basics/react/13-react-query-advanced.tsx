// REACT 13: REACT QUERY ADVANCED · OPTIMISTIC UPDATES · CACHING  (Day 23)
// Run: cd basics/react && npm run dev

// ─────────────────────────────────────────────────────────────────────────────
// WHAT WE COVER TODAY
//   1. React Query mental model — why it exists, what it owns
//   2. Query keys — the cache key system
//   3. Mutations and invalidation
//   4. Optimistic updates — snapshot → apply → rollback
//   5. Infinite queries — pagination done right
//   6. Advanced caching — staleTime, gcTime, select, placeholderData
//   7. Parallel and dependent queries
//   8. Testing React Query
// ─────────────────────────────────────────────────────────────────────────────

import React, {
    useState,
    useRef,
    useCallback,
    useEffect,
    Suspense,
} from 'react';

import {
    QueryClient,
    QueryClientProvider,
    useQuery,
    useMutation,
    useInfiniteQuery,
    useQueries,
    useQueryClient,
    // useSuspenseQuery,   // available in @tanstack/react-query v5
} from '@tanstack/react-query';

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — REACT QUERY MENTAL MODEL
// ─────────────────────────────────────────────────────────────────────────────
//
// Imagine your app is a coffee shop.
//
//   UI state   = the cashier's notepad (local, ephemeral — "drawer is open")
//   Server state = the inventory in the warehouse (remote, shared, always slightly stale)
//
// Before React Query you fetched data with useState + useEffect:
//
//   const [todos, setTodos] = useState([]);
//   const [loading, setLoading] = useState(false);
//   useEffect(() => { setLoading(true); fetchTodos().then(setTodos).finally(...) }, []);
//
// You wrote this 50 times. And you got it wrong in 30 of them:
//   - No deduplication (two components both fetch the same endpoint simultaneously)
//   - No background refresh (data goes stale while user stares at it)
//   - No cache invalidation (you mutate server state, display doesn't update)
//   - Race conditions galore
//
// React Query gives you one CACHE as the single source of truth.
// It follows the stale-while-revalidate (SWR) strategy:
//   → Serve what we have immediately (stale data = fast paint)
//   → Revalidate in the background
//   → Swap when fresh data arrives
//
// The QueryClient is the cache manager — one per app, lives at the root.
//
//   const queryClient = new QueryClient({
//     defaultOptions: {
//       queries: {
//         staleTime: 1000 * 60,      // data is "fresh" for 1 min — no refetch
//         gcTime:    1000 * 60 * 5,  // unused cache entry lives 5 min then GC'd
//         retry: 2,                  // retry failed requests twice
//       },
//     },
//   });
//
//   <QueryClientProvider client={queryClient}>
//     <App />
//   </QueryClientProvider>
//
// ⚠️ GOTCHA: You need ONE QueryClient per app — not per component. Creating it
// inside a component means a new cache on every render. Always create it outside
// React's render cycle (module scope or in main.tsx).

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 30,    // 30 s fresh window
            gcTime: 1000 * 60 * 5,  // 5 min garbage collection
            retry: 1,
        },
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — QUERY KEYS: THE CACHE KEY SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
//
// Every cached value lives under a query key. Think of it like an address in a
// filing cabinet. Same key = same cache entry. Different key = different entry.
//
//   useQuery({ queryKey: ['todos'], queryFn: fetchTodos })
//   useQuery({ queryKey: ['todos', { status: 'active' }], queryFn: ... })
//   useQuery({ queryKey: ['todos', 42], queryFn: () => fetchTodo(42) })
//
// Arrays are compared by value (deep equality), so ['todos', 42] and
// ['todos', 42] always resolve to the same slot.
//
// KEY FACTORIES: Don't scatter string literals everywhere. Centralise:

const todoKeys = {
    all: ['todos'] as const,
    lists: () => [...todoKeys.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...todoKeys.lists(), filters] as const,
    details: () => [...todoKeys.all, 'detail'] as const,
    detail: (id: number) => [...todoKeys.details(), id] as const,
};

// Now:
//   useQuery({ queryKey: todoKeys.list({ status: 'active' }), ... })
//   queryClient.invalidateQueries({ queryKey: todoKeys.all })  // nukes everything todo-related

// DEPENDENT QUERIES — only run when a condition is true
//
//   const { data: user } = useQuery({ queryKey: ['user', userId], queryFn: fetchUser })
//
//   const { data: orders } = useQuery({
//     queryKey: ['orders', user?.id],
//     queryFn:  () => fetchOrders(user!.id),
//     enabled:  !!user,           // ← won't fire until user exists
//   })
//
// PREFETCHING — load data before the user navigates to it
//
//   // On hover of a "View Todo" link:
//   queryClient.prefetchQuery({
//     queryKey: todoKeys.detail(id),
//     queryFn:  () => fetchTodo(id),
//   })
//
// ⚠️ GOTCHA: If your query key contains an object, React Query serialises it
// deterministically — but only the values matter, not key order. However, avoid
// putting functions or class instances in keys. Primitives and plain objects only.

// ─────────────────────────────────────────────────────────────────────────────
// TYPES (shared throughout the file)
// ─────────────────────────────────────────────────────────────────────────────

interface Todo {
    id: number;
    title: string;
    completed: boolean;
    userId: number;
}

interface Post {
    id: number;
    title: string;
    body: string;
    userId: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// FAKE API — simulates network latency so demos feel real
// ─────────────────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

let fakeTodos: Todo[] = [
    { id: 1, title: 'Buy groceries',      completed: false, userId: 1 },
    { id: 2, title: 'Walk the dog',       completed: true,  userId: 1 },
    { id: 3, title: 'Read React Query docs', completed: false, userId: 1 },
    { id: 4, title: 'Ship the feature',   completed: false, userId: 1 },
];

const api = {
    getTodos: async (): Promise<Todo[]> => {
        await delay(600);
        return [...fakeTodos];
    },
    toggleTodo: async (id: number): Promise<Todo> => {
        await delay(800);
        if (Math.random() < 0.2) throw new Error('Server hiccup — retry?');
        fakeTodos = fakeTodos.map(t =>
            t.id === id ? { ...t, completed: !t.completed } : t
        );
        return fakeTodos.find(t => t.id === id)!;
    },
    addTodo: async (title: string): Promise<Todo> => {
        await delay(500);
        const next: Todo = { id: Date.now(), title, completed: false, userId: 1 };
        fakeTodos = [...fakeTodos, next];
        return next;
    },
    getPosts: async (page: number): Promise<{ posts: Post[]; nextPage: number | null }> => {
        await delay(500);
        const all: Post[] = Array.from({ length: 25 }, (_, i) => ({
            id: i + 1,
            title: `Post #${i + 1}`,
            body: `Body of post ${i + 1}. Lorem ipsum dolor sit amet.`,
            userId: 1,
        }));
        const perPage = 5;
        const start = (page - 1) * perPage;
        const slice = all.slice(start, start + perPage);
        return {
            posts: slice,
            nextPage: start + perPage < all.length ? page + 1 : null,
        };
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — MUTATIONS AND INVALIDATION
// ─────────────────────────────────────────────────────────────────────────────
//
// A mutation is any write to the server (POST, PUT, DELETE, PATCH).
// After a successful mutation you almost always need to refresh related queries.
//
//   const addTodo = useMutation({
//     mutationFn: (title: string) => api.addTodo(title),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
//       //   ↑ React Query refetches every query whose key starts with ['todos', 'list']
//     },
//   });
//
//   addTodo.mutate('Buy milk');
//   addTodo.mutateAsync('Buy milk').then(...).catch(...);  // promise form
//
// LIFECYCLE HOOKS:
//   onMutate(variables)     — runs BEFORE the request (use for optimistic updates)
//   onError(error, vars, context) — called if the request fails
//   onSuccess(data, vars, context)— called if the request succeeds
//   onSettled(data, error, vars, context) — always called (like finally)
//
// GLOBAL CALLBACKS — register on the QueryClient itself for cross-cutting concerns
// (e.g. global error toast):
//
//   const queryClient = new QueryClient({
//     mutationCache: new MutationCache({
//       onError: (error) => toast.error(error.message),
//     }),
//   });
//
// ⚠️ GOTCHA: invalidateQueries just marks the cache entry as stale — the actual
// refetch only fires if there's an active subscriber (a mounted component using
// that query). If you need the data immediately even with no subscriber, call
// refetchQueries instead of invalidateQueries.

function MutationDemo() {
    const qc = useQueryClient();
    const [input, setInput] = useState('');

    const { data: todos = [], isLoading, isError } = useQuery({
        queryKey: todoKeys.lists(),
        queryFn: api.getTodos,
    });

    const addMutation = useMutation({
        mutationFn: api.addTodo,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: todoKeys.lists() });
            setInput('');
        },
    });

    if (isLoading) return <p style={styles.muted}>Loading todos…</p>;
    if (isError)   return <p style={styles.error}>Failed to load!</p>;

    return (
        <div style={styles.card}>
            <h3 style={styles.h3}>Mutation + Invalidation</h3>
            <div style={styles.row}>
                <input
                    style={styles.input}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="New todo…"
                    onKeyDown={e => e.key === 'Enter' && addMutation.mutate(input)}
                />
                <button
                    style={styles.btn}
                    onClick={() => addMutation.mutate(input)}
                    disabled={!input.trim() || addMutation.isPending}
                >
                    {addMutation.isPending ? 'Adding…' : 'Add'}
                </button>
            </div>
            {addMutation.isError && (
                <p style={styles.error}>Error: {(addMutation.error as Error).message}</p>
            )}
            <ul style={styles.list}>
                {todos.map(t => (
                    <li key={t.id} style={styles.listItem}>
                        <span style={{ textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? '#888' : 'inherit' }}>
                            {t.title}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — OPTIMISTIC UPDATES
// ─────────────────────────────────────────────────────────────────────────────
//
// "Optimistic" means: assume the server will succeed, update the UI instantly,
// rollback if it fails. Like swiping right and assuming they'll match — undo if
// they don't.
//
// THE PATTERN in three moves:
//
//   onMutate:  1. Cancel in-flight queries (prevent race condition overwrite)
//              2. Snapshot current cache value
//              3. Apply the optimistic change to the cache
//              4. Return the snapshot (context for rollback)
//
//   onError:   5. Put the snapshot back
//
//   onSettled: 6. Invalidate so we get the real value from the server
//
// RACE CONDITION WITHOUT cancelQueries:
//   - You optimistically set todo.completed = true in cache
//   - An in-flight background refetch lands milliseconds later
//   - It overwrites your optimistic update with the OLD value
//   - UI flickers back to unchecked — very confusing
//   → cancelQueries kills that in-flight request before you mutate the cache.
//
// ⚠️ GOTCHA: cancelQueries cancels the QUERY observer, not your actual HTTP
// request (unless you're using AbortSignal). The HTTP call may still complete on
// the server — cancelQueries just prevents React Query from applying its result.

function OptimisticTodoList() {
    const qc = useQueryClient();

    const { data: todos = [], isLoading } = useQuery({
        queryKey: todoKeys.lists(),
        queryFn: api.getTodos,
    });

    const toggleMutation = useMutation({
        mutationFn: api.toggleTodo,

        // Step 1: snapshot → optimistic update
        onMutate: async (todoId: number) => {
            // Cancel any outgoing refetches so they don't stomp our optimistic update
            await qc.cancelQueries({ queryKey: todoKeys.lists() });

            // Snapshot the previous value
            const previousTodos = qc.getQueryData<Todo[]>(todoKeys.lists());

            // Optimistically update the cache
            qc.setQueryData<Todo[]>(todoKeys.lists(), old =>
                (old ?? []).map(t =>
                    t.id === todoId ? { ...t, completed: !t.completed } : t
                )
            );

            // Return context with snapshot — React Query passes this to onError / onSettled
            return { previousTodos };
        },

        // Step 2: rollback on error
        onError: (_error, _todoId, context) => {
            if (context?.previousTodos) {
                qc.setQueryData(todoKeys.lists(), context.previousTodos);
            }
        },

        // Step 3: always sync with server truth
        onSettled: () => {
            qc.invalidateQueries({ queryKey: todoKeys.lists() });
        },
    });

    if (isLoading) return <p style={styles.muted}>Loading…</p>;

    return (
        <div style={styles.card}>
            <h3 style={styles.h3}>Optimistic Toggle</h3>
            <p style={styles.muted}>Toggle flips instantly. 20% chance of server failure → auto-rollback.</p>
            <ul style={styles.list}>
                {todos.map(todo => (
                    <li key={todo.id} style={{ ...styles.listItem, cursor: 'pointer' }}
                        onClick={() => toggleMutation.mutate(todo.id)}>
                        <span style={{
                            display: 'inline-block',
                            width: 18,
                            height: 18,
                            border: '2px solid #6366f1',
                            borderRadius: 4,
                            background: todo.completed ? '#6366f1' : 'transparent',
                            marginRight: 10,
                            verticalAlign: 'middle',
                            transition: 'background 0.15s',
                        }} />
                        <span style={{
                            textDecoration: todo.completed ? 'line-through' : 'none',
                            color: todo.completed ? '#888' : 'inherit',
                        }}>
                            {todo.title}
                        </span>
                        {toggleMutation.isPending && toggleMutation.variables === todo.id && (
                            <span style={{ ...styles.muted, marginLeft: 8, fontSize: 11 }}>(saving…)</span>
                        )}
                    </li>
                ))}
            </ul>
            {toggleMutation.isError && (
                <p style={styles.error}>
                    Server error — rolled back. {(toggleMutation.error as Error).message}
                </p>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — INFINITE QUERIES
// ─────────────────────────────────────────────────────────────────────────────
//
// Cursor/page-based pagination where you "load more" instead of flipping pages.
// Think Twitter timeline or Reddit feed.
//
//   const query = useInfiniteQuery({
//     queryKey: ['posts'],
//     queryFn: ({ pageParam }) => api.getPosts(pageParam),
//     initialPageParam: 1,                              // v5 API
//     getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
//     //  ↑ return undefined to signal "no more pages"
//   });
//
//   query.data.pages    // array of page results
//   query.fetchNextPage()
//   query.hasNextPage   // true when getNextPageParam returned non-undefined
//   query.isFetchingNextPage
//
// For display, flatten all pages:
//   const allPosts = query.data?.pages.flatMap(p => p.posts) ?? []
//
// AUTO-LOAD with IntersectionObserver — attach to a sentinel div at the bottom:
//   when it enters the viewport → call fetchNextPage()
//
// ⚠️ GOTCHA: On refetch, React Query refetches ALL pages you've loaded, not just
// the first one. 10 pages loaded = 10 sequential requests on window focus.
// Dial back refetchOnWindowFocus or increase staleTime for feeds.

function InfinitePostsFeed() {
    const sentinelRef = useRef<HTMLDivElement>(null);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
    } = useInfiniteQuery({
        queryKey: ['posts', 'infinite'],
        queryFn: ({ pageParam }) => api.getPosts(pageParam as number),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    });

    // Intersection observer: auto-fetch when sentinel enters viewport
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(el);
        return () => observer.unobserve(el);
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const allPosts = data?.pages.flatMap(p => p.posts) ?? [];

    if (isLoading) return <p style={styles.muted}>Loading feed…</p>;
    if (isError)   return <p style={styles.error}>Failed to load feed.</p>;

    return (
        <div style={styles.card}>
            <h3 style={styles.h3}>Infinite Feed</h3>
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {allPosts.map(post => (
                    <div key={post.id} style={{ padding: '8px 0', borderBottom: '1px solid #333' }}>
                        <strong style={{ fontSize: 13 }}>{post.title}</strong>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#aaa' }}>{post.body}</p>
                    </div>
                ))}
                {/* Sentinel — observer watches this div */}
                <div ref={sentinelRef} style={{ height: 1 }} />
                {isFetchingNextPage && <p style={styles.muted}>Loading more…</p>}
                {!hasNextPage && allPosts.length > 0 && (
                    <p style={styles.muted}>You've reached the end.</p>
                )}
            </div>
            <p style={{ fontSize: 11, color: '#666', marginTop: 6 }}>
                {allPosts.length} posts loaded · scroll to auto-load more
            </p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — ADVANCED CACHING
// ─────────────────────────────────────────────────────────────────────────────
//
// staleTime vs gcTime — the two timers everyone confuses:
//
//   staleTime (default: 0)
//     How long data is considered "fresh". During this window, React Query
//     will NOT refetch even if the component remounts or window regains focus.
//     0 = "always stale" = refetch every time (aggressive)
//     Infinity = never refetch automatically (cache forever)
//
//   gcTime / cacheTime (default: 5 minutes)
//     How long UNUSED cache entries survive before garbage collection.
//     A query with no active subscribers (no mounted components using it) starts
//     a countdown. When it hits 0, the entry is deleted.
//     This is independent of staleTime.
//
// ANALOGY: staleTime = how long food in the fridge is "good". gcTime = how long
// you keep leftovers before throwing them out. Food can go stale (needs checking)
// but still sit in the fridge until you toss it.
//
// OTHER USEFUL OPTIONS:
//
//   refetchOnWindowFocus: true   // refetch when user switches back to tab (default true)
//   refetchInterval: 5000        // polling — refetch every 5 seconds
//   refetchIntervalInBackground: false  // pause polling when tab not visible
//
//   select: (data) => data.filter(t => !t.completed)
//     // Transform/slice the data BEFORE handing to the component.
//     // Component re-renders only when the SELECTED slice changes.
//     // Great for subscribing to just the piece you need from a large query.
//
//   placeholderData: previousData   // keeps showing old data while new fetch loads
//     // Useful for pagination — no empty state flash between pages.
//     // (Was keepPreviousData: true in v4)
//
//   initialData: cachedValue         // pre-fill the cache (counts as real data — respects staleTime)
//   placeholderData: cachedValue     // pre-fill UI only (treated as stale, refetches immediately)
//
// ⚠️ GOTCHA: initialData comes from a source you trust (e.g. SSR payload). It
// respects staleTime, so if staleTime=Infinity you'll never refetch. placeholderData
// is always considered stale — refetch fires immediately. Wrong choice here causes
// either ghost data or unnecessary requests.
//
// EXAMPLE — polling a live score with select to subscribe to just the score:
//
//   const { data: score } = useQuery({
//     queryKey: ['game', gameId],
//     queryFn: () => fetchGame(gameId),
//     refetchInterval: 3000,
//     select: (game) => game.score,   // only re-render if score changes
//   });

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — PARALLEL AND DEPENDENT QUERIES
// ─────────────────────────────────────────────────────────────────────────────
//
// PARALLEL — fire multiple queries at once:
//
//   // Static parallel — just call useQuery twice
//   const usersQuery  = useQuery({ queryKey: ['users'],  queryFn: fetchUsers  })
//   const configQuery = useQuery({ queryKey: ['config'], queryFn: fetchConfig })
//
//   // Dynamic parallel — number of queries not known at render time
//   const userIds = [1, 2, 3, 4];
//   const userQueries = useQueries({
//     queries: userIds.map(id => ({
//       queryKey: ['user', id],
//       queryFn: () => fetchUser(id),
//     })),
//   });
//   // userQueries is an array of query results, same order as input
//
// DEPENDENT (serial) — wait for first query before firing second:
//
//   const { data: user } = useQuery({ queryKey: ['user'], queryFn: fetchCurrentUser })
//   const { data: orders } = useQuery({
//     queryKey: ['orders', user?.id],
//     queryFn: () => fetchOrders(user!.id),
//     enabled: !!user,    // ← the magic switch
//   })
//
// SUSPENSE MODE — let React Suspense handle loading states:
//
//   // v5: useSuspenseQuery (throws a Promise on loading — Suspense catches it)
//   function TodoList() {
//     const { data } = useSuspenseQuery({ queryKey: ['todos'], queryFn: api.getTodos })
//     // data is ALWAYS defined here — no isLoading check needed
//     return <ul>{data.map(...)}</ul>
//   }
//
//   // Wrap with Suspense + ErrorBoundary:
//   <ErrorBoundary fallback={<p>Oops</p>}>
//     <Suspense fallback={<p>Loading…</p>}>
//       <TodoList />
//     </Suspense>
//   </ErrorBoundary>
//
//   The ErrorBoundary catches query errors. Suspense catches loading states.
//   This flips the mental model: loading and errors are layout concerns, not
//   component concerns.
//
// ⚠️ GOTCHA: With Suspense, if multiple sibling components each useSuspenseQuery,
// they waterfall (one waits for the other). Use useSuspenseQueries (plural) or
// prefetch to run them in parallel.

function ParallelQueriesDemo() {
    const userIds = [1, 2, 3];

    const results = useQueries({
        queries: userIds.map(id => ({
            queryKey: ['user-placeholder', id],
            queryFn: async (): Promise<{ id: number; name: string; email: string }> => {
                await delay(400 + id * 100);
                const names = ['Alice', 'Bob', 'Carol'];
                return { id, name: names[id - 1], email: `user${id}@example.com` };
            },
            staleTime: Infinity,
        })),
    });

    return (
        <div style={styles.card}>
            <h3 style={styles.h3}>Parallel Queries (useQueries)</h3>
            <p style={styles.muted}>3 user queries fired simultaneously.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
                {results.map((result, i) => (
                    <div key={i} style={{ background: '#1a1a2e', borderRadius: 6, padding: 10, fontSize: 12 }}>
                        {result.isLoading && <span style={styles.muted}>Loading…</span>}
                        {result.data && (
                            <>
                                <div style={{ fontWeight: 600 }}>{result.data.name}</div>
                                <div style={{ color: '#888' }}>{result.data.email}</div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — TESTING REACT QUERY
// ─────────────────────────────────────────────────────────────────────────────
//
// The golden rule: FRESH QueryClient per test. Never share a client between
// tests — cached state from test A will bleed into test B in mysterious ways.
//
//   // test-utils.tsx — reusable wrapper factory
//   export function createWrapper() {
//     const queryClient = new QueryClient({
//       defaultOptions: { queries: { retry: false } },  // ← crucial: don't retry in tests
//     });
//     return ({ children }: { children: ReactNode }) => (
//       <QueryClientProvider client={queryClient}>
//         {children}
//       </QueryClientProvider>
//     );
//   }
//
// TESTING A QUERY HOOK:
//
//   import { renderHook, waitFor } from '@testing-library/react';
//
//   it('fetches todos', async () => {
//     const { result } = renderHook(() => useTodos(), { wrapper: createWrapper() });
//
//     await waitFor(() => expect(result.current.isSuccess).toBe(true));
//
//     expect(result.current.data).toHaveLength(3);
//   });
//
// MOCKING WITH MSW (Mock Service Worker — the recommended approach):
//
//   // handlers.ts
//   import { http, HttpResponse } from 'msw';
//
//   export const handlers = [
//     http.get('/api/todos', () => HttpResponse.json([
//       { id: 1, title: 'Test todo', completed: false },
//     ])),
//   ];
//
//   // setup.ts
//   const server = setupServer(...handlers);
//   beforeAll(() => server.listen());
//   afterEach(() => server.resetHandlers());
//   afterAll(() => server.close());
//
// TESTING LOADING / ERROR / SUCCESS STATES:
//
//   it('shows error state', async () => {
//     server.use(
//       http.get('/api/todos', () => HttpResponse.error())   // override for this test
//     );
//
//     const { result } = renderHook(() => useTodos(), { wrapper: createWrapper() });
//     await waitFor(() => expect(result.current.isError).toBe(true));
//   });
//
// TESTING MUTATIONS:
//
//   it('adds a todo', async () => {
//     const { result } = renderHook(() => useAddTodo(), { wrapper: createWrapper() });
//
//     act(() => { result.current.mutate('New task') });
//     await waitFor(() => expect(result.current.isSuccess).toBe(true));
//   });
//
// ⚠️ GOTCHA: Always set retry: false in test QueryClient options. By default
// React Query retries failed requests 3 times — in tests this means a failing
// query takes 3x longer and your test timeouts thrash. Turn it off.

// ─────────────────────────────────────────────────────────────────────────────
// DEMO COMPONENT — optimistic todo toggle (shown in the app)
// ─────────────────────────────────────────────────────────────────────────────

function MainDemo() {
    const [activeSection, setActiveSection] = useState<'optimistic' | 'mutation' | 'infinite' | 'parallel'>('optimistic');

    const sections = [
        { key: 'optimistic', label: 'Optimistic Update' },
        { key: 'mutation',   label: 'Mutation + Invalidate' },
        { key: 'infinite',   label: 'Infinite Feed' },
        { key: 'parallel',   label: 'Parallel Queries' },
    ] as const;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.h1}>React 13: React Query Advanced</h1>
                <p style={styles.subtitle}>Day 23 · Optimistic Updates · Caching · Infinite Queries</p>
            </div>

            {/* Section tabs */}
            <div style={styles.tabs}>
                {sections.map(s => (
                    <button
                        key={s.key}
                        style={{
                            ...styles.tab,
                            ...(activeSection === s.key ? styles.tabActive : {}),
                        }}
                        onClick={() => setActiveSection(s.key)}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Active demo */}
            <div style={{ marginTop: 16 }}>
                {activeSection === 'optimistic' && <OptimisticTodoList />}
                {activeSection === 'mutation'   && <MutationDemo />}
                {activeSection === 'infinite'   && <InfinitePostsFeed />}
                {activeSection === 'parallel'   && <ParallelQueriesDemo />}
            </div>

            {/* Concept reminder */}
            <div style={{ ...styles.card, marginTop: 16, background: '#0d1117' }}>
                <h3 style={styles.h3}>Quick Reference</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                            <th style={{ textAlign: 'left', padding: '4px 8px', color: '#6366f1' }}>Concept</th>
                            <th style={{ textAlign: 'left', padding: '4px 8px', color: '#6366f1' }}>One-liner</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            ['staleTime', 'How long data is "fresh" — no refetch within this window'],
                            ['gcTime', 'How long unused cache entries live before deletion'],
                            ['enabled', 'Boolean gate — set false to pause/skip a query'],
                            ['select', 'Transform data + subscribe to just a slice'],
                            ['onMutate', 'Runs before request — perfect for optimistic updates'],
                            ['cancelQueries', 'Prevents race conditions during optimistic update'],
                            ['invalidateQueries', 'Mark stale + trigger background refetch'],
                            ['prefetchQuery', 'Load data before user navigates there'],
                            ['useInfiniteQuery', 'Cursor/page pagination with auto flatMap support'],
                            ['useQueries', 'Dynamic parallel queries in a single hook call'],
                        ].map(([concept, desc]) => (
                            <tr key={concept} style={{ borderBottom: '1px solid #1a1a2e' }}>
                                <td style={{ padding: '5px 8px', fontFamily: 'monospace', color: '#f59e0b' }}>{concept}</td>
                                <td style={{ padding: '5px 8px', color: '#ccc' }}>{desc}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRACTICE CHALLENGES
// ─────────────────────────────────────────────────────────────────────────────
//
// CHALLENGE 1 (Warm-up)
// You have a useQuery fetching user profile. It re-fetches every time the window
// regains focus, but the profile almost never changes.
// Fix it so it only refetches once every 10 minutes max.
//
// ANSWER:
//   useQuery({
//     queryKey: ['profile'],
//     queryFn: fetchProfile,
//     staleTime: 1000 * 60 * 10,     // fresh for 10 min
//     refetchOnWindowFocus: false,    // belt AND suspenders
//   });
//
// ─────────────────────────────────────────────────────────────────────────────
//
// CHALLENGE 2 (Medium)
// Build a paginated table that shows the previous page while loading the next,
// with no empty-state flash between pages.
//
// ANSWER:
//   import { keepPreviousData } from '@tanstack/react-query'; // v5 helper
//
//   const [page, setPage] = useState(1);
//   const { data, isFetching } = useQuery({
//     queryKey: ['items', page],
//     queryFn: () => fetchPage(page),
//     placeholderData: keepPreviousData,  // v5 — was keepPreviousData: true in v4
//   });
//   // data shows previous page while isFetching === true for the new page.
//
// ─────────────────────────────────────────────────────────────────────────────
//
// CHALLENGE 3 (Medium)
// You're implementing a search feature. The query should only fire after the user
// stops typing for 300ms AND the input has at least 2 characters.
//
// ANSWER:
//   const [input, setInput]       = useState('');
//   const [debouncedQ, setDQ]     = useState('');
//
//   useEffect(() => {
//     const t = setTimeout(() => setDQ(input), 300);
//     return () => clearTimeout(t);
//   }, [input]);
//
//   const { data } = useQuery({
//     queryKey: ['search', debouncedQ],
//     queryFn: () => search(debouncedQ),
//     enabled: debouncedQ.length >= 2,
//   });
//
// ─────────────────────────────────────────────────────────────────────────────
//
// CHALLENGE 4 (Hard)
// Implement an optimistic DELETE. When the user clicks delete on a post:
//   • Remove it from the list immediately
//   • Rollback if the server request fails
//
// ANSWER:
//   const deleteMutation = useMutation({
//     mutationFn: (id: number) => api.deletePost(id),
//     onMutate: async (id) => {
//       await qc.cancelQueries({ queryKey: ['posts'] });
//       const previous = qc.getQueryData<Post[]>(['posts']);
//       qc.setQueryData<Post[]>(['posts'], old => old?.filter(p => p.id !== id) ?? []);
//       return { previous };
//     },
//     onError: (_err, _id, ctx) => {
//       if (ctx?.previous) qc.setQueryData(['posts'], ctx.previous);
//     },
//     onSettled: () => qc.invalidateQueries({ queryKey: ['posts'] }),
//   });
//
// ─────────────────────────────────────────────────────────────────────────────
//
// CHALLENGE 5 (Hard)
// You have a component that loads a user, then their orders, then each order's
// items. Three levels of dependent queries. Sketch the hooks.
//
// ANSWER:
//   const { data: user } = useQuery({
//     queryKey: ['user', userId],
//     queryFn: () => fetchUser(userId),
//   });
//
//   const { data: orders = [] } = useQuery({
//     queryKey: ['orders', user?.id],
//     queryFn: () => fetchOrders(user!.id),
//     enabled: !!user,
//   });
//
//   const orderItemQueries = useQueries({
//     queries: orders.map(order => ({
//       queryKey: ['order-items', order.id],
//       queryFn: () => fetchOrderItems(order.id),
//       enabled: orders.length > 0,
//     })),
//   });
//
//   // Waterfall: user → orders → items (unavoidable — each needs the previous)
//   // Mitigate with prefetching if you can predict the chain upfront.

// ─────────────────────────────────────────────────────────────────────────────
// SELF-ASSESSMENT  (10 questions · answers below)
// ─────────────────────────────────────────────────────────────────────────────
//
// Q1.  What is the difference between staleTime and gcTime?
// Q2.  Why do you call cancelQueries inside onMutate before applying an
//      optimistic update?
// Q3.  What does `enabled: !!userId` do and when do you use it?
// Q4.  What does `select` do? Give an example use case.
// Q5.  How does useInfiniteQuery know when there are no more pages?
// Q6.  What's the difference between invalidateQueries and refetchQueries?
// Q7.  Why must each test use a FRESH QueryClient and set retry: false?
// Q8.  When would you use placeholderData vs initialData?
// Q9.  What is a query key factory and why is it valuable?
// Q10. In Suspense mode with useSuspenseQuery, do you still need to check
//      isLoading inside the component?
//
// ANSWERS:
//
// A1.  staleTime: how long data is considered fresh (no automatic refetch).
//      gcTime: how long an UNUSED cache entry survives before deletion.
//      Data can be stale but still cached; stale just means "check for updates".
//
// A2.  Without cancelQueries, an in-flight background refetch could land after
//      your optimistic update and overwrite it with the old server value,
//      causing a visible flicker/rollback.
//
// A3.  It skips the query entirely when userId is falsy. Use it for dependent
//      queries where you need data from a previous query before firing this one.
//
// A4.  select transforms the raw server data before returning it to the component.
//      The component re-renders only when the transformed result changes, not when
//      any part of the raw data changes. E.g.: select: todos => todos.filter(t => !t.completed)
//
// A5.  When getNextPageParam returns undefined (or nothing). The library sets
//      hasNextPage = false and stops exposing fetchNextPage.
//
// A6.  invalidateQueries marks entries stale; actual refetch only fires if a
//      component is currently subscribed. refetchQueries forces an immediate
//      refetch regardless of subscribers.
//
// A7.  Shared QueryClient = cache bleeds between tests, making them order-
//      dependent. retry: false stops React Query retrying failed requests,
//      which would slow tests and cause timeouts.
//
// A8.  initialData: you trust the value (e.g. SSR payload) — respects staleTime.
//      placeholderData: UI placeholder only — always treated as stale, refetch fires
//      immediately. Use placeholderData for "show something while loading" UX.
//
// A9.  A key factory is an object of functions that generate consistent query keys.
//      It prevents typos (todoKeys.detail(1) vs ['todo', 'detail', 1]) and makes
//      prefix-based invalidation (invalidate all todo queries) reliable.
//
// A10. No. useSuspenseQuery guarantees data is defined by the time the component
//     renders — the Suspense boundary above handles the loading state. No
//     isLoading / data?.x optional chaining needed inside the component.

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = {
    container: {
        maxWidth: 760,
        margin: '0 auto',
        padding: '24px 16px',
        fontFamily: "'Inter', system-ui, sans-serif",
        color: '#e2e8f0',
        background: '#0f0f1a',
        minHeight: '100vh',
    } as React.CSSProperties,
    header: {
        marginBottom: 20,
        borderBottom: '1px solid #1e1e3f',
        paddingBottom: 16,
    } as React.CSSProperties,
    h1: {
        margin: 0,
        fontSize: 22,
        fontWeight: 700,
        color: '#a5b4fc',
    } as React.CSSProperties,
    h3: {
        margin: '0 0 10px',
        fontSize: 15,
        fontWeight: 600,
        color: '#c7d2fe',
    } as React.CSSProperties,
    subtitle: {
        margin: '4px 0 0',
        fontSize: 13,
        color: '#666',
    } as React.CSSProperties,
    card: {
        background: '#13131f',
        border: '1px solid #1e1e3f',
        borderRadius: 10,
        padding: 16,
    } as React.CSSProperties,
    tabs: {
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap' as const,
    } as React.CSSProperties,
    tab: {
        padding: '6px 14px',
        borderRadius: 6,
        border: '1px solid #2d2d5e',
        background: 'transparent',
        color: '#888',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 500,
        transition: 'all 0.15s',
    } as React.CSSProperties,
    tabActive: {
        background: '#4f46e5',
        borderColor: '#4f46e5',
        color: '#fff',
    } as React.CSSProperties,
    list: {
        listStyle: 'none',
        margin: '10px 0 0',
        padding: 0,
    } as React.CSSProperties,
    listItem: {
        padding: '7px 4px',
        borderBottom: '1px solid #1a1a2e',
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
    } as React.CSSProperties,
    row: {
        display: 'flex',
        gap: 8,
        marginBottom: 8,
    } as React.CSSProperties,
    input: {
        flex: 1,
        padding: '6px 10px',
        background: '#0f0f1a',
        border: '1px solid #2d2d5e',
        borderRadius: 6,
        color: '#e2e8f0',
        fontSize: 13,
    } as React.CSSProperties,
    btn: {
        padding: '6px 14px',
        background: '#4f46e5',
        border: 'none',
        borderRadius: 6,
        color: '#fff',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 500,
    } as React.CSSProperties,
    muted: {
        color: '#555',
        fontSize: 13,
        margin: '4px 0',
    } as React.CSSProperties,
    error: {
        color: '#f87171',
        fontSize: 13,
        margin: '4px 0',
    } as React.CSSProperties,
};

// ─────────────────────────────────────────────────────────────────────────────
// ROOT EXPORT — wrap with QueryClientProvider
// ─────────────────────────────────────────────────────────────────────────────

export default function ReactQueryAdvancedDemo() {
    return (
        <QueryClientProvider client={queryClient}>
            <MainDemo />
        </QueryClientProvider>
    );
}
