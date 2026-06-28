import { useState, useRef, useSyncExternalStore, useCallback } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DemoPanel from '../../components/DemoPanel';
import { useLog } from '../../hooks/useLog';

const btn = 'px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors';
const btnGray = 'px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors';

// ─── useSyncExternalStore ─────────────────────────────────────────────────────
// Vanilla JS store — no React
function createVanillaStore(initial: number) {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set: (next: number | ((s: number) => number)) => {
      state = typeof next === 'function' ? next(state) : next;
      listeners.forEach(fn => fn());
    },
    subscribe: (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); },
  };
}
const sharedStore = createVanillaStore(0);

function SyncExternalStoreCounter({ label }: { label: string }) {
  const count = useSyncExternalStore(sharedStore.subscribe, sharedStore.get);
  const renderCount = useRef(0);
  renderCount.current++;
  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 text-sm">
      <p className="text-xs text-gray-500 mb-1">{label} (renders: {renderCount.current})</p>
      <p className="text-2xl font-bold text-blue-600">{count}</p>
      <div className="flex gap-1 mt-2">
        <button onClick={() => sharedStore.set(n => n - 1)} className={btnGray}>−</button>
        <button onClick={() => sharedStore.set(n => n + 1)} className={btn}>+</button>
      </div>
    </div>
  );
}

function SyncExternalStoreDemo() {
  return (
    <DemoPanel
      title="useSyncExternalStore — Subscribe to External Store"
      badge="Advanced"
      badgeColor="blue"
      description="useSyncExternalStore subscribes a component to any external store (no Context, no Redux). Both components below share the SAME vanilla JS store. Change one — both update."
      code={`const store = createVanillaStore(0);

function Counter() {
  const count = useSyncExternalStore(
    store.subscribe, // called to subscribe/unsubscribe
    store.get,       // returns current snapshot
  );
  return <button onClick={() => store.set(n => n + 1)}>{count}</button>;
}`}
    >
      <div className="grid grid-cols-2 gap-4">
        <SyncExternalStoreCounter label="Component A" />
        <SyncExternalStoreCounter label="Component B" />
      </div>
      <p className="text-xs text-gray-500 mt-3">Both components share one JS store with no React Context — they re-render only when the store changes.</p>
    </DemoPanel>
  );
}

// ─── Zustand ──────────────────────────────────────────────────────────────────
type CartItem = { id: number; name: string; price: number; qty: number };
interface CartStore {
  items: CartItem[];
  add: (item: Omit<CartItem, 'qty'>) => void;
  remove: (id: number) => void;
  inc: (id: number) => void;
  dec: (id: number) => void;
  total: () => number;
}

const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => set(s => {
        if (s.items.find(i => i.id === item.id)) return s;
        return { items: [...s.items, { ...item, qty: 1 }] };
      }),
      remove: (id) => set(s => ({ items: s.items.filter(i => i.id !== id) })),
      inc: (id) => set(s => ({ items: s.items.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i) })),
      dec: (id) => set(s => ({ items: s.items.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty - 1) } : i) })),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
    }),
    { name: 'demo-cart' }
  )
);

const PRODUCTS = [
  { id: 1, name: 'React T-Shirt', price: 29 },
  { id: 2, name: 'TypeScript Mug', price: 15 },
  { id: 3, name: 'Vite Sticker Pack', price: 8 },
  { id: 4, name: 'Tailwind Hoodie', price: 65 },
];

function CartBadge() {
  const count = useCartStore(s => s.items.reduce((n, i) => n + i.qty, 0));
  const renderCount = useRef(0);
  renderCount.current++;
  return (
    <div className="bg-blue-600 text-white rounded-full px-3 py-1 text-sm font-bold flex items-center gap-2">
      🛒 {count} items
      <span className="text-xs text-blue-200">(renders: {renderCount.current})</span>
    </div>
  );
}

function ZustandDemo() {
  const { add, remove, inc, dec, items, total } = useCartStore();

  return (
    <DemoPanel
      title="Zustand — Global State with Selectors"
      badge="Zustand"
      badgeColor="orange"
      description="Zustand: no Provider needed, selector-based subscriptions. CartBadge only subscribes to total item count — it re-renders only when that slice changes."
      code={`const useStore = create<Store>((set, get) => ({
  items: [],
  add: (item) => set(s => ({ items: [...s.items, item] })),
  total: () => get().items.reduce(...),
}));

// Selector — only re-renders when count changes
const count = useStore(s => s.items.length);`}
    >
      <div className="space-y-3">
        <CartBadge />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Products</p>
            <div className="space-y-1">
              {PRODUCTS.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-1.5 text-sm">
                  <span>{p.name} <span className="text-gray-400">${p.price}</span></span>
                  <button onClick={() => add(p)} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Add</button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Cart</p>
            {items.length === 0 ? <p className="text-sm text-gray-400">Empty</p> : (
              <div className="space-y-1">
                {items.map(i => (
                  <div key={i.id} className="bg-gray-50 rounded px-3 py-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-xs">{i.name}</span>
                      <button onClick={() => remove(i.id)} className="text-red-400 text-xs hover:text-red-600">×</button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => dec(i.id)} className="text-xs w-5 h-5 bg-gray-200 rounded hover:bg-gray-300">−</button>
                      <span className="text-xs font-bold">{i.qty}</span>
                      <button onClick={() => inc(i.id)} className="text-xs w-5 h-5 bg-gray-200 rounded hover:bg-gray-300">+</button>
                      <span className="text-xs text-gray-500">${(i.price * i.qty).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-1 text-sm font-bold">Total: ${total().toFixed(2)}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DemoPanel>
  );
}

// ─── React Query ──────────────────────────────────────────────────────────────
type Post = { id: number; title: string; body: string };
let postIdCounter = 100;

const fakePosts: Post[] = [
  { id: 1, title: 'Introduction to React Query', body: 'Managing server state was never this easy.' },
  { id: 2, title: 'Why useState is not enough', body: 'Server state is different — it is owned by the server.' },
  { id: 3, title: 'Caching, background refresh, deduplication', body: 'React Query handles all of this automatically.' },
];

async function fetchPosts(): Promise<Post[]> {
  await new Promise(r => setTimeout(r, 800));
  return [...fakePosts];
}

async function createPost(title: string): Promise<Post> {
  await new Promise(r => setTimeout(r, 500));
  const post = { id: ++postIdCounter, title, body: 'Created at ' + new Date().toLocaleTimeString() };
  fakePosts.push(post);
  return post;
}

async function deletePost(id: number): Promise<void> {
  await new Promise(r => setTimeout(r, 400));
  const idx = fakePosts.findIndex(p => p.id === id);
  if (idx >= 0) fakePosts.splice(idx, 1);
}

function ReactQueryDemo() {
  const { entries: log, add, clear } = useLog();
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState('');

  const { data: posts, isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    staleTime: 10_000,
  });

  const createMutation = useMutation({
    mutationFn: createPost,
    onMutate: async (title) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const prev = queryClient.getQueryData<Post[]>(['posts']);
      // Optimistic update
      queryClient.setQueryData<Post[]>(['posts'], old => [
        ...(old ?? []),
        { id: 99999, title, body: 'Saving…' },
      ]);
      add(`Optimistic add: "${title}"`);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['posts'], ctx?.prev);
      add('Error — rolled back optimistic update');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      add('Settled — refetching from server');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const prev = queryClient.getQueryData<Post[]>(['posts']);
      queryClient.setQueryData<Post[]>(['posts'], old => old?.filter(p => p.id !== id) ?? []);
      add(`Optimistic delete id=${id}`);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['posts'], ctx?.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });

  return (
    <DemoPanel
      title="React Query — Server State"
      badge="React Query"
      badgeColor="green"
      description="React Query manages server state: caching, background refresh, deduplication, optimistic updates. Compare to useState+useEffect: no manual loading/error, automatic cache, no duplicate fetches."
      log={log}
      onReset={clear}
      code={`const { data, isLoading, isFetching } = useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  staleTime: 10_000, // cache fresh for 10s
});
const mutation = useMutation({
  mutationFn: createPost,
  onMutate: (vars) => { /* optimistic update */ },
  onError: (err, vars, ctx) => { /* rollback */ },
  onSettled: () => queryClient.invalidateQueries(['posts']),
});`}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => { queryClient.invalidateQueries({ queryKey: ['posts'] }); add('Manual refetch triggered'); }} className={btnGray}>
            ↻ Refetch
          </button>
          {isFetching && <span className="text-xs text-blue-600 animate-pulse">Fetching…</span>}
          {dataUpdatedAt > 0 && <span className="text-xs text-gray-400">Updated: {new Date(dataUpdatedAt).toLocaleTimeString()}</span>}
        </div>

        <div className="flex gap-2">
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="border border-gray-200 rounded px-2 py-1 text-sm flex-1" placeholder="New post title…" />
          <button
            onClick={() => { if (!newTitle.trim()) return; createMutation.mutate(newTitle.trim()); add(`Creating: "${newTitle}"`); setNewTitle(''); }}
            disabled={createMutation.isPending}
            className={`${btn} disabled:opacity-50`}
          >
            {createMutation.isPending ? 'Saving…' : 'Add post'}
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {posts?.map(post => (
              <div key={post.id} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-800">{post.title}</p>
                  <p className="text-xs text-gray-500">{post.body}</p>
                </div>
                <button onClick={() => { deleteMutation.mutate(post.id); add(`Delete id=${post.id}`); }} className="text-red-400 hover:text-red-600 text-xs flex-shrink-0 mt-0.5">
                  {deleteMutation.isPending ? '…' : '×'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DemoPanel>
  );
}

export default function StateMgmtPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">State Management</h2>
        <p className="text-gray-500 mt-1">Day 16 — useSyncExternalStore, Zustand, React Query with optimistic updates</p>
      </div>
      <SyncExternalStoreDemo />
      <ZustandDemo />
      <ReactQueryDemo />
    </div>
  );
}
