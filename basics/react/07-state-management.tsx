// ═══════════════════════════════════════════════════════════════
// REACT 07: STATE MANAGEMENT — Context · Zustand · React Query  (Day 16)
// ═══════════════════════════════════════════════════════════════

// Run with Vite — these imports require bundler resolution.
// npm create vite@latest my-app -- --template react-ts

import React, {
    createContext, useContext, useReducer, useState, useEffect,
    useMemo, useCallback, useRef, ReactNode, useSyncExternalStore,
} from 'react';

// External deps (install via npm i zustand @tanstack/react-query):
// import { create } from 'zustand';
// import { devtools, persist } from 'zustand/middleware';
// import { immer } from 'zustand/middleware/immer';
// import { useQuery, useMutation, useInfiniteQuery, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ───────────────────────────────────────────────────────────────
// 1. LOCAL STATE PATTERNS — when to escalate
// ───────────────────────────────────────────────────────────────
//
// DECISION TREE:
//
//  Does only ONE component need the state?
//   → useState / useReducer (stay local)
//
//  Do siblings or distant relatives need it?
//   → Lift to nearest common ancestor
//
//  Is prop drilling through 3+ levels painful?
//   → Context (UI state: theme, locale, auth)
//
//  Is it server data (fetched async, cached, synced)?
//   → React Query / SWR
//
//  Is it complex client state shared globally?
//   → Zustand / Redux Toolkit

// ───────────────────────────────────────────────────────────────
// 2. CONTEXT API — OPTIMIZED PATTERNS
// ───────────────────────────────────────────────────────────────

// ── 2a. Optimized Context: separate state from dispatch ──
//
// WHY SPLIT: if state + dispatch are in the same object, EVERY consumer
// re-renders on any state change — even those only using dispatch.
// Splitting means dispatch consumers are stable (dispatch never changes).

interface AuthUser { id: string; name: string; role: "admin" | "user"; }
type AuthAction =
    | { type: "LOGIN"; user: AuthUser }
    | { type: "LOGOUT" };

interface AuthState { user: AuthUser | null; isLoading: boolean; }

const AuthStateContext    = createContext<AuthState | null>(null);
const AuthDispatchContext = createContext<React.Dispatch<AuthAction> | null>(null);

function authReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
        case "LOGIN":  return { ...state, user: action.user, isLoading: false };
        case "LOGOUT": return { ...state, user: null, isLoading: false };
        default: return state;
    }
}

function AuthProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(authReducer, { user: null, isLoading: true });

    useEffect(() => {
        // Check session on mount
        const saved = localStorage.getItem("user");
        if (saved) dispatch({ type: "LOGIN", user: JSON.parse(saved) });
        else dispatch({ type: "LOGOUT" });
    }, []);

    return (
        <AuthDispatchContext.Provider value={dispatch}>
            <AuthStateContext.Provider value={state}>
                {children}
            </AuthStateContext.Provider>
        </AuthDispatchContext.Provider>
    );
}

function useAuthState()    { return useContext(AuthStateContext)!; }
function useAuthDispatch() { return useContext(AuthDispatchContext)!; }

// Consumer that only needs dispatch — never re-renders on state change
function LogoutButton() {
    const dispatch = useAuthDispatch();
    return (
        <button onClick={() => {
            localStorage.removeItem("user");
            dispatch({ type: "LOGOUT" });
        }}>
            Logout
        </button>
    );
}

// ── 2b. useSyncExternalStore — subscribe to external store ──
//
// For integrating non-React state (legacy stores, browser APIs)
// useSyncExternalStore guarantees tearing-free reads in concurrent mode.

function createStore<T>(initialState: T) {
    let state = initialState;
    const listeners = new Set<() => void>();

    return {
        getState:   () => state,
        setState:   (updater: (s: T) => T) => {
            state = updater(state);
            listeners.forEach(l => l());
        },
        subscribe:  (listener: () => void) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
    };
}

const counterStore = createStore({ count: 0 });

function CounterWithExternalStore() {
    const count = useSyncExternalStore(
        counterStore.subscribe,
        () => counterStore.getState().count,
        () => 0 // server snapshot (SSR)
    );

    return (
        <div>
            <p>{count}</p>
            <button onClick={() => counterStore.setState(s => ({ count: s.count + 1 }))}>+</button>
        </div>
    );
}

// ── 2c. Context selector pattern ──
//
// React doesn't have built-in selectors for Context.
// Work-around: wrap expensive consumers in React.memo with comparison.

interface AppState {
    theme:    "light" | "dark";
    language: string;
    sidebar:  boolean;
}

const AppContext = createContext<AppState>({ theme: "light", language: "en", sidebar: true });

// This component only cares about theme — won't re-render when language/sidebar change
// because it's memo'd with custom comparison
const ThemedButton = React.memo(
    function ThemedButton({ label }: { label: string }) {
        const { theme } = useContext(AppContext);
        return (
            <button style={{ background: theme === "dark" ? "#333" : "#fff" }}>
                {label}
            </button>
        );
    },
    // Custom comparison: only re-render if theme changed
    (prev, next) => prev.label === next.label
    // Note: this doesn't help with context — memo only prevents re-render from
    // parent prop changes, not from context changes. For true selectors, use Zustand.
);

// ───────────────────────────────────────────────────────────────
// 3. ZUSTAND — lightweight global state (conceptual, needs package)
// ───────────────────────────────────────────────────────────────
//
// Zustand: small (~1KB), no Provider needed, selector-based subscriptions.
// Only components that USE a slice re-render when that slice changes.
//
// INSTALL: npm i zustand

// ── 3a. Basic store ──
//
// import { create } from 'zustand';
//
// interface BearState {
//     bears: number;
//     fish: string[];
//     increment: () => void;
//     addFish: (fish: string) => void;
//     reset: () => void;
// }
//
// const useBearStore = create<BearState>((set) => ({
//     bears: 0,
//     fish: [],
//     increment: () => set(state => ({ bears: state.bears + 1 })),
//     addFish: (fish) => set(state => ({ fish: [...state.fish, fish] })),
//     reset: () => set({ bears: 0, fish: [] }),
// }));
//
// // Usage — only re-renders when `bears` changes (not `fish`)
// function BearCounter() {
//     const bears = useBearStore(state => state.bears); // selector!
//     return <p>{bears} bears</p>;
// }

// ── 3b. Zustand with middleware (devtools + persist + immer) ──
//
// import { create } from 'zustand';
// import { devtools, persist } from 'zustand/middleware';
// import { immer } from 'zustand/middleware/immer';
//
// interface CartItem { id: string; qty: number; price: number; }
// interface CartStore {
//     items: CartItem[];
//     addItem: (item: CartItem) => void;
//     removeItem: (id: string) => void;
//     updateQty: (id: string, qty: number) => void;
//     total: () => number;
// }
//
// const useCartStore = create<CartStore>()(
//     devtools(           // Redux DevTools integration
//     persist(            // localStorage persistence
//     immer((set, get) => ({   // Immer — write mutations as if mutable
//         items: [],
//         addItem: (item) => set(state => { state.items.push(item); }),
//         removeItem: (id) => set(state => {
//             state.items = state.items.filter(i => i.id !== id);
//         }),
//         updateQty: (id, qty) => set(state => {
//             const item = state.items.find(i => i.id === id);
//             if (item) item.qty = qty;
//         }),
//         total: () => get().items.reduce((s, i) => s + i.price * i.qty, 0),
//     })),
//     { name: "cart-storage" }  // persist key
//     ))
// );

// ── 3c. Slices pattern — split large stores ──
//
// type ThemeSlice = { theme: "light"|"dark"; toggleTheme: () => void; }
// type CounterSlice = { count: number; increment: () => void; }
//
// const createThemeSlice = (set) => ({
//     theme: "light",
//     toggleTheme: () => set(s => ({ theme: s.theme === "light" ? "dark" : "light" })),
// });
//
// const createCounterSlice = (set) => ({
//     count: 0,
//     increment: () => set(s => ({ count: s.count + 1 })),
// });
//
// const useStore = create<ThemeSlice & CounterSlice>()((...a) => ({
//     ...createThemeSlice(...a),
//     ...createCounterSlice(...a),
// }));

// ───────────────────────────────────────────────────────────────
// 4. REACT QUERY — server state management
// ───────────────────────────────────────────────────────────────
//
// Server state is fundamentally different from client state:
//  • Lives remotely, owned by server
//  • Needs caching, deduplication, background refresh
//  • Can become "stale" (out of date)
//
// React Query handles: loading/error states, caching, deduplication,
//   background refetch, pagination, optimistic updates, prefetching.
//
// INSTALL: npm i @tanstack/react-query

// ── 4a. Setup ──
//
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
//
// const queryClient = new QueryClient({
//     defaultOptions: {
//         queries: {
//             staleTime: 5 * 60 * 1000, // 5 min before data is considered stale
//             gcTime: 10 * 60 * 1000,   // 10 min before garbage collected
//             retry: 3,
//             refetchOnWindowFocus: true,
//         },
//     },
// });
//
// function App() {
//     return (
//         <QueryClientProvider client={queryClient}>
//             <MyApp />
//         </QueryClientProvider>
//     );
// }

// ── 4b. useQuery — basic data fetching ──
//
// function UserProfile({ userId }: { userId: string }) {
//     const { data: user, isLoading, isError, error, refetch } = useQuery({
//         queryKey: ["user", userId],   // cache key — unique per user
//         queryFn: () => fetch(`/api/users/${userId}`).then(r => r.json()),
//         enabled: !!userId,            // don't fetch if userId is empty
//         staleTime: 60_000,            // 60s until stale
//         select: (data) => ({          // transform before returning
//             ...data,
//             displayName: `${data.firstName} ${data.lastName}`,
//         }),
//     });
//
//     if (isLoading) return <Spinner />;
//     if (isError)   return <Error message={error.message} />;
//     return <div>{user.displayName}</div>;
// }

// ── 4c. useMutation — create/update/delete ──
//
// function CreatePost() {
//     const queryClient = useQueryClient();
//
//     const mutation = useMutation({
//         mutationFn: (newPost: { title: string; body: string }) =>
//             fetch("/api/posts", {
//                 method: "POST",
//                 body: JSON.stringify(newPost),
//                 headers: { "Content-Type": "application/json" },
//             }).then(r => r.json()),
//
//         // Optimistic update
//         onMutate: async (newPost) => {
//             await queryClient.cancelQueries({ queryKey: ["posts"] });
//             const previous = queryClient.getQueryData(["posts"]);
//             queryClient.setQueryData(["posts"], (old: any[]) => [
//                 ...old,
//                 { ...newPost, id: "temp-" + Date.now() },
//             ]);
//             return { previous }; // context for onError rollback
//         },
//
//         onError: (_err, _vars, context) => {
//             // Roll back optimistic update on error
//             queryClient.setQueryData(["posts"], context?.previous);
//         },
//
//         onSettled: () => {
//             // Refetch to sync with server (whether success or error)
//             queryClient.invalidateQueries({ queryKey: ["posts"] });
//         },
//     });
//
//     return (
//         <button
//             disabled={mutation.isPending}
//             onClick={() => mutation.mutate({ title: "New Post", body: "Content" })}
//         >
//             {mutation.isPending ? "Creating…" : "Create Post"}
//         </button>
//     );
// }

// ── 4d. useInfiniteQuery — pagination / infinite scroll ──
//
// function InfinitePostList() {
//     const {
//         data,
//         fetchNextPage,
//         hasNextPage,
//         isFetchingNextPage,
//         isLoading,
//     } = useInfiniteQuery({
//         queryKey: ["posts"],
//         queryFn: ({ pageParam = 1 }) =>
//             fetch(`/api/posts?page=${pageParam}&limit=10`).then(r => r.json()),
//         getNextPageParam: (lastPage, pages) =>
//             lastPage.hasMore ? pages.length + 1 : undefined,
//         initialPageParam: 1,
//     });
//
//     // Intersection observer for auto-load
//     const observerRef = useRef<IntersectionObserver | null>(null);
//     const loaderRef = useCallback((node: HTMLDivElement | null) => {
//         if (isFetchingNextPage) return;
//         if (observerRef.current) observerRef.current.disconnect();
//         observerRef.current = new IntersectionObserver(([entry]) => {
//             if (entry.isIntersecting && hasNextPage) fetchNextPage();
//         });
//         if (node) observerRef.current.observe(node);
//     }, [isFetchingNextPage, fetchNextPage, hasNextPage]);
//
//     const allPosts = data?.pages.flatMap(p => p.posts) ?? [];
//
//     return (
//         <div>
//             {allPosts.map(post => <PostCard key={post.id} post={post} />)}
//             <div ref={loaderRef}>
//                 {isFetchingNextPage && <Spinner />}
//             </div>
//         </div>
//     );
// }

// ── 4e. Prefetching + dependent queries ──
//
// // Prefetch on hover (before user clicks)
// function PostLink({ postId }: { postId: string }) {
//     const queryClient = useQueryClient();
//     return (
//         <a
//             onMouseEnter={() =>
//                 queryClient.prefetchQuery({
//                     queryKey: ["post", postId],
//                     queryFn: () => fetch(`/api/posts/${postId}`).then(r => r.json()),
//                     staleTime: 60_000,
//                 })
//             }
//             href={`/posts/${postId}`}
//         >
//             View Post
//         </a>
//     );
// }
//
// // Dependent query — fetch user's orders only after user is loaded
// function UserOrders({ userId }: { userId: string }) {
//     const { data: user } = useQuery({
//         queryKey: ["user", userId],
//         queryFn: () => fetchUser(userId),
//     });
//
//     const { data: orders } = useQuery({
//         queryKey: ["orders", user?.id],
//         queryFn: () => fetchOrders(user!.id),
//         enabled: !!user, // wait until user is loaded
//     });
//
//     return orders ? <OrderList orders={orders} /> : null;
// }

// ── 4f. React Query vs useState + useEffect ──
//
//  useState + useEffect:              React Query:
//  ─────────────────────              ────────────────
//  Manual loading state               Automatic loading/error/success
//  No caching                         Caching by queryKey
//  Refetches on every mount           Deduplication (only one in-flight)
//  No background refresh              Background stale refetch
//  No optimistic updates              Built-in optimistic update helpers
//  Request cancellation manual        Automatic abort on unmount/key change
//  Pagination manual                  useInfiniteQuery out of the box

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

// Q1: What is the difference between server state and client state?
// A: Client state: purely local (modals open, form inputs, tab selection).
//    Server state: remote data that your app displays but doesn't own —
//    it can change on the server, needs caching, and can go stale.
//    Use useState/Zustand for client state; React Query/SWR for server state.

// Q2: Why split Context state and dispatch into separate contexts?
// A: If they're together, every consumer re-renders on any state change.
//    Components that only call dispatch functions don't need to re-render
//    when state changes — they only care about the stable dispatch reference.
//    Splitting means dispatch consumers are stable and won't re-render.

// Q3: What is the staleTime option in React Query?
// A: Time (ms) before cached data is considered stale and eligible for
//    background refetch. While fresh: query returns cached data immediately
//    with no network request. After stale: returns cached data immediately,
//    then fetches in background and updates. Default is 0 (always stale).

// Q4: Implement an optimistic delete with React Query
//
//    const deleteMutation = useMutation({
//        mutationFn: (id: string) => fetch(`/api/posts/${id}`, { method: "DELETE" }),
//        onMutate: async (id) => {
//            await queryClient.cancelQueries({ queryKey: ["posts"] });
//            const previous = queryClient.getQueryData(["posts"]);
//            queryClient.setQueryData(["posts"], (old: Post[]) =>
//                old.filter(p => p.id !== id));
//            return { previous };
//        },
//        onError: (_e, _id, ctx) => queryClient.setQueryData(["posts"], ctx?.previous),
//        onSettled: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
//    });

// Q5: When should you choose Zustand over Context?
// A: Zustand when:
//    • Many components subscribe to different slices of global state
//    • You need selector-based subscriptions (only re-render on relevant changes)
//    • State changes are frequent (Context causes all consumers to re-render)
//    • You need devtools, persistence, or middleware (immer)
//    Context when:
//    • Simple, infrequently-changing UI state (theme, auth, locale)
//    • Few consumers

// ── Concrete implementation: auth state with Context ──
function ProtectedPage({ children }: { children: ReactNode }) {
    const { user, isLoading } = useAuthState();

    if (isLoading) return <p>Loading session…</p>;
    if (!user) return <p>Please log in.</p>;

    return (
        <div>
            <p>Welcome, {user.name} ({user.role})</p>
            <LogoutButton />
            {children}
        </div>
    );
}

export {
    AuthProvider, useAuthState, useAuthDispatch, LogoutButton,
    CounterWithExternalStore, counterStore, createStore,
    ProtectedPage,
};
