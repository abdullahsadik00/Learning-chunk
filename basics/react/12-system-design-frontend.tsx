// ════════════════════════════════════════════════════════════════
// REACT 12: SYSTEM DESIGN · COMPONENT ARCHITECTURE · PATTERNS  (Day 22)
// Vite demo: cd basics/system-design && npm run dev
// Type-check: npm run check
// ════════════════════════════════════════════════════════════════
//
// This file is the theory + code companion for Day 22.
// The basics/system-design/ folder has live Vite demos you can run.
// Read this file, then poke around those demos to see it in action.

import React, {
    createContext, useContext, useState, useEffect, useRef, useCallback,
    forwardRef, lazy, Suspense, memo, useMemo,
    ReactNode, ElementType, ComponentPropsWithoutRef, ForwardedRef,
} from 'react';

// ───────────────────────────────────────────────────────────────
// 1. FRONTEND SYSTEM DESIGN FRAMEWORK
// ───────────────────────────────────────────────────────────────
//
// Interviews aren't about getting the "right" answer. There isn't one.
// They're about watching how you think through trade-offs under pressure.
//
// The 4-phase framework keeps you from panicking and jumping straight
// to implementation (the #1 mistake candidates make):
//
// ┌─────────────────────────────────────────────────────────────┐
// │  PHASE 1: REQUIREMENTS (5 min)                             │
// │  Functional   — what must the system actually DO?          │
// │  Non-functional — performance, a11y, offline, i18n, scale  │
// ├─────────────────────────────────────────────────────────────┤
// │  PHASE 2: HIGH-LEVEL DESIGN (10 min)                       │
// │  Draw the component tree. Decide where state lives.        │
// │  Don't code yet. Sketch. Talk out loud.                    │
// ├─────────────────────────────────────────────────────────────┤
// │  PHASE 3: DEEP DIVE (15 min)                               │
// │  Pick the 2 HARDEST problems and solve them.               │
// │  Don't try to cover everything — depth beats breadth.      │
// ├─────────────────────────────────────────────────────────────┤
// │  PHASE 4: TRADE-OFFS (5 min)                               │
// │  Compare at least 2 approaches. Explain your choice.       │
// │  "I chose X because Y. The downside is Z, I'd accept that  │
// │   because of W."                                           │
// └─────────────────────────────────────────────────────────────┘
//
// ── Applied example: Design a Twitter/X feed ──
//
// PHASE 1 — Requirements
//   Functional:
//     - Show tweets in chronological / algorithmic order
//     - Infinite scroll (load more on reaching bottom)
//     - Like, retweet, reply interactions
//     - Real-time new tweet notifications
//   Non-functional:
//     - Performance: feed must feel instant on a mid-range phone
//     - a11y: keyboard navigable, screen reader friendly
//     - Offline: cached tweets readable without network
//     - i18n: RTL languages (Arabic, Hebrew) must work
//
// PHASE 2 — High-Level Design (component tree)
//
//   <App>
//     <AuthProvider>              ← global auth state
//       <QueryClientProvider>    ← server state
//         <Layout>
//           <Sidebar />          ← nav, user info
//           <Feed>               ← URL state: ?tab=following
//             <FeedTabs />       ← "For You" / "Following"
//             <NewTweetBanner /> ← appears when new tweets arrive
//             <TweetList>        ← virtualized
//               <TweetCard />    ← each tweet, memoized
//             </TweetList>
//             <IntersectionObserver /> ← triggers next page
//           </Feed>
//           <RightPanel />       ← trending topics
//         </Layout>
//       </QueryClientProvider>
//     </AuthProvider>
//   </App>
//
//   State layers:
//     URL state      → ?tab=following&tweetId=123 (shareable)
//     Server state   → React Query (feed, user, tweet detail)
//     Global UI      → Zustand (auth, theme, notification count)
//     Local          → useState (like animation, input focus)
//
// PHASE 3 — Deep Dive: pick the 2 hardest problems
//   Problem 1: Infinite scroll with real-time new tweet injection
//   Problem 2: Optimistic updates (like without waiting for server)
//
// PHASE 4 — Trade-offs
//   Infinite scroll vs pagination:
//     Infinite scroll: immersive, bad for "go back to tweet X"
//     Pagination: predictable, shareable, slower UX
//     → Choose infinite scroll, but keep tweetId in URL so deep links work
//
// ⚠️ GOTCHA: Interviewers want your thinking, not a perfect answer.
//    The candidate who says "I chose X because Y, trade-off is Z"
//    always beats the one who silently builds the "best" solution.
//    Narrate everything. Silence kills you in system design rounds.

// ───────────────────────────────────────────────────────────────
// 2. STATE ARCHITECTURE — WHERE DOES STATE LIVE?
// ───────────────────────────────────────────────────────────────
//
// The most common architecture mistake: putting everything in a global store.
// State has 4 natural homes. Use the right home and life gets easy.
//
// ── URL State ──
//   What: search params, filters, pagination, selected tab
//   Tool: useSearchParams (React Router) or URLSearchParams
//   Why: users can share a link and see EXACTLY the same thing
//
//   const [searchParams, setSearchParams] = useSearchParams();
//   const tab = searchParams.get('tab') ?? 'for-you';
//
// ── Server State ──
//   What: anything that lives on the server — user profile, feed, tweets
//   Tool: React Query or SWR — NOT useState + useEffect
//   Why: caching, deduplication, background refetch, stale-while-revalidate
//        React Query does all of this for free. Manual fetch + setState gives you none of it.
//
//   const { data: feed } = useQuery({ queryKey: ['feed', tab], queryFn: fetchFeed });
//
// ── Global UI State ──
//   What: theme, auth session, modals, notification count
//   Tool: Zustand for cross-cutting concerns, React Context for subtree state
//   Why: these need to be accessible anywhere but don't belong on the server
//
//   const theme = useThemeStore(s => s.theme);
//
// ── Local Component State ──
//   What: input value, is-open toggle, hover state, animation frame
//   Tool: useState, useReducer
//   Why: nothing outside the component cares about this
//        keeping it local means fewer re-renders and simpler logic
//
// ── The Decision Rule ──
//
//   "Could a user paste the URL in a new tab and see the same thing?"
//    YES  → URL state
//    NO, but it came from the server?
//    YES  → Server state (React Query)
//    NO, but multiple components need it?
//    YES  → Global UI state (Zustand / Context)
//    NO   → Local state (useState)
//
// ── Lifting state: lift ONLY as high as needed ──
//
//   Bad:
//     <App selectedTweetId={...} onSelectTweet={...}>  ← lifted too high
//
//   Good:
//     <TweetList>
//       <TweetCard />   ← selectedTweetId lives in TweetList, not App
//     </TweetList>
//
// ⚠️ GOTCHA: Redux/Zustand is not the answer to "where does state go?"
//    It's the answer to "I need shared client state that isn't server state."
//    90% of state is either local or server state. If your Zustand store
//    is full of API data you fetched manually, you're holding it wrong.

// ───────────────────────────────────────────────────────────────
// 3. COMPONENT ARCHITECTURE PATTERNS
// ───────────────────────────────────────────────────────────────
//
// ── Smart vs Dumb components (Container / Presenter) ──
//
//   Smart component: knows about the world — fetches data, reads from store
//   Dumb component: knows about nothing — receives props, renders UI
//
//   Still useful when: you want to reuse the same visual component
//   with different data sources. Or when writing tests (dumb components
//   are trivially testable — just pass props).
//
//   // Smart
//   function TweetCardContainer({ tweetId }: { tweetId: string }) {
//     const { data } = useQuery(['tweet', tweetId], fetchTweet);
//     return data ? <TweetCard tweet={data} /> : <Skeleton />;
//   }
//
//   // Dumb
//   function TweetCard({ tweet }: { tweet: Tweet }) {
//     return <div>{tweet.text}</div>;  // pure, testable, reusable
//   }
//
// ── Compound Components ──
//
//   Instead of a massive props object, share implicit state via Context.
//   The parent manages state; children consume it through a hook.
//
//   The "Prop Bag" anti-pattern:
//     ❌ <Tabs activeTab={0} onChange={setTab} items={[...]} renderTab={...} />
//
//   Compound component (how real libraries like Radix, Headless UI work):
//     ✅ <Tabs>
//          <Tabs.List>
//            <Tabs.Tab id="posts">Posts</Tabs.Tab>
//            <Tabs.Tab id="likes">Likes</Tabs.Tab>
//          </Tabs.List>
//          <Tabs.Panel id="posts"><PostList /></Tabs.Panel>
//          <Tabs.Panel id="likes"><LikeList /></Tabs.Panel>
//        </Tabs>
//
// ── Render Props ──
//
//   Pass a function as a child. The parent calls it with state.
//   Used by react-table, downshift, react-hook-form Controller.
//
//   <DataFetcher url="/api/tweets">
//     {({ data, isLoading }) => isLoading ? <Spinner /> : <TweetList data={data} />}
//   </DataFetcher>
//
//   Modern equivalent: just make a custom hook and use it directly.
//   Render props solved the problem before hooks existed.
//
// ── Higher-Order Components (HOC) ──
//
//   A function that takes a component and returns a new component
//   with extra powers. Common pattern: withAuth, withLogging, withTheme.
//
//   const ProtectedPage = withAuth(DashboardPage);
//   // ProtectedPage redirects to login if not authed, otherwise renders DashboardPage
//
//   Downside: HOCs are opaque (hard to debug in DevTools), can have prop conflicts.
//
// ── Custom Hooks as the modern replacement ──
//
//   90% of HOC and render prop use cases are better served by a custom hook.
//   The logic is extracted; the component stays clean and readable.
//
//   function Dashboard() {
//     const { user, isLoading } = useAuth();          // ← was withAuth HOC
//     const { theme } = useTheme();                   // ← was withTheme HOC
//     if (isLoading) return <Spinner />;
//     return <DashboardContent user={user} theme={theme} />;
//   }
//
// ⚠️ GOTCHA: Don't abstract until you have 3+ instances of the same pattern.
//    Premature abstraction is worse than duplication. Duplication is easy to
//    delete. A badly designed abstraction traps everyone who depends on it.
//    Rule of three: see it once → copy it. Twice → note it. Three times → abstract it.

// ───────────────────────────────────────────────────────────────
// 4. ADVANCED COMPONENT PATTERNS IN CODE
// ───────────────────────────────────────────────────────────────

// ── 4a. Compound Tabs ──
// The parent manages which tab is active.
// Children read it from context via a hook.
// No prop drilling — the API is clean and composable.

interface TabsContextValue {
    activeTab: string;
    setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs(): TabsContextValue {
    const ctx = useContext(TabsContext);
    // Always guard — child without parent = silent undefined hell
    if (!ctx) throw new Error('<Tabs.*> must be rendered inside <Tabs>');
    return ctx;
}

interface TabsProps {
    defaultTab: string;
    children: ReactNode;
}

function Tabs({ defaultTab, children }: TabsProps) {
    const [activeTab, setActiveTab] = useState(defaultTab);
    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
            <div style={{ fontFamily: 'system-ui, sans-serif' }}>
                {children}
            </div>
        </TabsContext.Provider>
    );
}

function TabsList({ children }: { children: ReactNode }) {
    return (
        <div
            role="tablist"
            style={{ display: 'flex', gap: 4, borderBottom: '2px solid #e5e7eb', marginBottom: 16 }}
        >
            {children}
        </div>
    );
}

function Tab({ id, children }: { id: string; children: ReactNode }) {
    const { activeTab, setActiveTab } = useTabs();
    const isActive = activeTab === id;

    return (
        <button
            role="tab"
            aria-selected={isActive}
            onClick={() => setActiveTab(id)}
            style={{
                padding: '8px 16px',
                border: 'none',
                background: 'none',
                borderBottom: isActive ? '2px solid #6366f1' : '2px solid transparent',
                color: isActive ? '#6366f1' : '#6b7280',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                marginBottom: -2,   // overlap the container border
                transition: 'color 0.15s',
            }}
        >
            {children}
        </button>
    );
}

function TabPanel({ id, children }: { id: string; children: ReactNode }) {
    const { activeTab } = useTabs();
    // Don't unmount — just hide. Unmounting loses form state, scroll position.
    // Use display:none to keep DOM alive but invisible.
    return (
        <div
            role="tabpanel"
            hidden={activeTab !== id}
            style={{ padding: '8px 0' }}
        >
            {children}
        </div>
    );
}

// Attach sub-components to the parent namespace
// Callers write: <Tabs>, <Tabs.List>, <Tabs.Tab>, <Tabs.Panel>
Tabs.List = TabsList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

// ── 4b. Polymorphic Button ──
// A Button that can render as <button>, <a>, or any element
// while keeping TypeScript happy about which props are valid.
//
// The trick: `as` prop + conditional generic = correct prop types
//
// Usage:
//   <PolyButton>Click me</PolyButton>           → <button>
//   <PolyButton as="a" href="/home">Home</PolyButton>  → <a href>
//   <PolyButton as={Link} to="/dash">Go</PolyButton>   → React Router Link

type PolyButtonProps<C extends ElementType = 'button'> = {
    as?: C;
    variant?: 'primary' | 'ghost' | 'danger';
    children: ReactNode;
} & Omit<ComponentPropsWithoutRef<C>, 'as' | 'variant' | 'children'>;

const variantStyles: Record<string, React.CSSProperties> = {
    primary: { background: '#6366f1', color: '#fff', border: 'none' },
    ghost:   { background: 'transparent', color: '#6366f1', border: '1px solid #6366f1' },
    danger:  { background: '#ef4444', color: '#fff', border: 'none' },
};

function PolyButton<C extends ElementType = 'button'>({
    as,
    variant = 'primary',
    children,
    ...rest
}: PolyButtonProps<C>) {
    const Component = as ?? 'button';
    return (
        <Component
            {...rest}
            style={{
                padding: '8px 18px',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: 14,
                transition: 'opacity 0.15s',
                ...variantStyles[variant],
                // Spread caller's style override on top
                ...(rest as { style?: React.CSSProperties }).style,
            }}
        >
            {children}
        </Component>
    );
}

// ── 4c. Controlled vs Uncontrolled Input with forwardRef ──
// Controlled: React owns the value (useState). Good for validation.
// Uncontrolled: DOM owns the value (useRef). Good for perf with huge forms.

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

// forwardRef: lets the parent grab the underlying DOM node.
// Required when integrating with focus management, animation libraries, react-hook-form.
const Input = forwardRef(function Input(
    { label, error, ...rest }: InputProps,
    ref: ForwardedRef<HTMLInputElement>,
) {
    const id = `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
            <label htmlFor={id} style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
                {label}
            </label>
            <input
                id={id}
                ref={ref}   // passes the ref straight to the DOM node
                {...rest}
                style={{
                    padding: '8px 12px',
                    border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: 6,
                    fontSize: 14,
                    outline: 'none',
                }}
            />
            {error && <span style={{ fontSize: 12, color: '#ef4444' }}>{error}</span>}
        </div>
    );
});

// ⚠️ GOTCHA: Compound components are only as good as their guard.
//    If you use <Tabs.Tab> outside <Tabs>, the context is null and you
//    get a cryptic "cannot read properties of null" error in production.
//    The `if (!ctx) throw new Error(...)` in useTabs() turns that into
//    a clear dev-time message. Always add this check.

// ───────────────────────────────────────────────────────────────
// 5. PERFORMANCE PATTERNS AT ARCHITECTURE LEVEL
// ───────────────────────────────────────────────────────────────
//
// Premature optimization is evil. But architectural-level performance
// decisions can't be retrofitted — they have to be designed in from the start.
//
// ── Code splitting at route level ──
//
//   Every route is a separate chunk. Users only download the JS
//   for the page they're actually on. Easy win — do this always.
//
//   const Dashboard = lazy(() => import('./pages/Dashboard'));
//   const Settings  = lazy(() => import('./pages/Settings'));
//
//   function App() {
//     return (
//       <Suspense fallback={<PageSkeleton />}>
//         <Routes>
//           <Route path="/dashboard" element={<Dashboard />} />
//           <Route path="/settings"  element={<Settings />} />
//         </Routes>
//       </Suspense>
//     );
//   }
//
// ── Component-level splitting ──
//
//   Heavy components (chart libraries, rich text editors, map embeds)
//   should be lazy-loaded on demand. A chart library is 200kb+.
//   Don't make the user download it until they actually view a chart.
//
//   const HeavyChart = lazy(() => import('./components/HeavyChart'));
//
//   function DashboardWidget() {
//     const [showChart, setShowChart] = useState(false);
//     return showChart
//       ? <Suspense fallback={<Skeleton />}><HeavyChart /></Suspense>
//       : <button onClick={() => setShowChart(true)}>Show Chart</button>;
//   }
//
// ── Islands architecture ──
//
//   The idea: server-render the whole page (fast initial load),
//   but only hydrate the interactive "islands" on the client.
//   The static parts are never touched by JS.
//
//   Next.js Partial Prerendering does this automatically.
//   The tweet feed is an island. The header nav is an island.
//   The static "About" section is just HTML — no JS needed.
//
// ── Virtualization ──
//
//   Rendering 1000 <TweetCard /> components at once is catastrophic.
//   The DOM can't handle it. Virtualization renders only what's visible
//   in the viewport (typically 10–20 items), recycling DOM nodes as you scroll.
//
//   react-window usage:
//
//   import { FixedSizeList } from 'react-window';
//
//   <FixedSizeList height={600} itemCount={tweets.length} itemSize={120} width="100%">
//     {({ index, style }) => (
//       <div style={style}>
//         <TweetCard tweet={tweets[index]} />
//       </div>
//     )}
//   </FixedSizeList>
//
// ── Memoization strategy ──
//
//   React.memo:    wrap expensive pure components that re-render with same props
//   useMemo:       cache expensive derived values (sorting, filtering large arrays)
//   useCallback:   stable function reference passed to memoized children
//
//   Applied correctly:
//
//   // TweetCard re-renders every time the feed updates. Memo-ize it.
//   const TweetCard = memo(function TweetCard({ tweet }: { tweet: Tweet }) {
//     return <div>{tweet.text}</div>;
//   });
//
//   // The filtered list recalculates on every parent render without useMemo.
//   const filtered = useMemo(
//     () => tweets.filter(t => t.author === selectedUser),
//     [tweets, selectedUser],   // recalculate only when these change
//   );
//
//   // If you pass an inline function to a memoized child, memo does nothing.
//   // useCallback makes the function reference stable.
//   const handleLike = useCallback((tweetId: string) => {
//     likeMutation.mutate(tweetId);
//   }, [likeMutation]);
//
// ⚠️ GOTCHA: Don't memoize everything. Profile first.
//    React.memo has overhead (shallow prop comparison on every render).
//    If a component's props change every render anyway, memo makes things
//    SLOWER. Wrap in memo → measure → keep if it helps, revert if it doesn't.
//    The React DevTools Profiler shows which components are hot.

// ── Demo: Lazy-loaded heavy component ──
// (Simplified version — in the real system-design demo this is a chart)

function HeavyChart() {
    return (
        <div style={{
            padding: 24,
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: 8,
            textAlign: 'center',
        }}>
            📊 Heavy Chart Component (200kb+ in real life — loaded on demand)
        </div>
    );
}

const LazyChart = lazy(() => Promise.resolve({ default: HeavyChart }));

// ───────────────────────────────────────────────────────────────
// 6. REAL-WORLD ARCHITECTURE: ANALYTICS DASHBOARD
// ───────────────────────────────────────────────────────────────
//
// Let's design an analytics dashboard properly, using all 4 phases.
//
// ── Requirements ──
//   Functional:
//     - Show key metrics (revenue, users, conversions, churn)
//     - Line charts for time-series, bar charts for comparisons
//     - Date range filter, segment filter (product, region)
//     - Data table with export to CSV
//     - Role-based: viewer sees data, admin can edit thresholds
//   Non-functional:
//     - Charts must not block initial page render (lazy load)
//     - Stale data must be obvious — show "updated 5 min ago"
//     - Works with keyboard nav (a11y)
//     - Fast: target Time to Interactive < 2s on 3G
//
// ── Component Tree ──
//
//   <App>
//     <AuthProvider>
//       <QueryClientProvider>
//         <ThemeProvider>
//           <DashboardLayout>
//             <Sidebar />              ← nav, user info, role badge
//             <DashboardMain>
//               <FilterBar />         ← URL state: ?range=30d&segment=all
//               <MetricsGrid>         ← 4 MetricCard widgets
//                 <MetricCard />      ← single stat (revenue etc.)
//               </MetricsGrid>
//               <ChartsSection>
//                 <Suspense>
//                   <RevenueChart />  ← lazy loaded
//                   <UserChart />     ← lazy loaded
//                 </Suspense>
//               </ChartsSection>
//               <DataTable />         ← virtualized (react-window)
//             </DashboardMain>
//           </DashboardLayout>
//         </ThemeProvider>
//       </QueryClientProvider>
//     </AuthProvider>
//   </App>
//
// ── State decisions ──
//   URL state:    ?range=30d&segment=all  (shareable, bookmarkable)
//   Server state: React Query — metrics, chart data, table rows
//                 staleTime: 5 * 60 * 1000  (5 min — data changes slowly)
//                 refetchInterval: 5 * 60 * 1000  (poll every 5 min)
//   Global UI:    Zustand — theme, user preferences, export modal open
//   Local:        useState — row hover, column sort direction
//
// ── Performance concerns ──
//   Chart libraries (Recharts, Victory, Chart.js) → lazy load all of them
//   Large data table (10k+ rows) → virtualize with react-window
//   Real-time metrics → polling (SSE overkill for 5-min stale data)
//   Bundle size → audit with `vite build --sourcemap` + `source-map-explorer`
//
// ── Data fetching strategy ──
//
//   // Each widget can fetch in parallel — no waterfall
//   const { data: metrics }   = useQuery(['metrics', range, segment], fetchMetrics);
//   const { data: chartData }  = useQuery(['chart', range, segment],   fetchChartData);
//   const { data: tableData }  = useQuery(['table', range, segment],   fetchTableData);
//
//   // React Query deduplicates: if two components use the same key,
//   // only ONE request goes out. Free win.
//
// ⚠️ GOTCHA: Analytics dashboards are bundle size bombs.
//    Recharts pulls in d3. D3 is 300kb. Chart.js is another story.
//    Always run `npm run build && npx source-map-explorer dist/assets/*.js`
//    before shipping. You'll find surprises. Audit early, not after launch.

// ── Simplified MetricCard (what a real one looks like) ──

interface MetricCardProps {
    title: string;
    value: string | number;
    delta?: number;      // % change from previous period
    isLoading?: boolean;
}

const MetricCard = memo(function MetricCard({ title, value, delta, isLoading }: MetricCardProps) {
    if (isLoading) {
        return (
            <div style={{
                padding: 20, borderRadius: 10, background: '#f3f4f6',
                animation: 'pulse 1.5s infinite',
                minHeight: 90,
            }} />
        );
    }

    const positive = delta !== undefined && delta >= 0;

    return (
        <div style={{
            padding: 20, borderRadius: 10,
            background: '#fff', border: '1px solid #e5e7eb',
            display: 'flex', flexDirection: 'column', gap: 6,
        }}>
            <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {title}
            </span>
            <span style={{ fontSize: 28, fontWeight: 700, color: '#111827' }}>
                {value}
            </span>
            {delta !== undefined && (
                <span style={{ fontSize: 13, color: positive ? '#16a34a' : '#dc2626', fontWeight: 500 }}>
                    {positive ? '↑' : '↓'} {Math.abs(delta)}% vs last period
                </span>
            )}
        </div>
    );
});

// ───────────────────────────────────────────────────────────────
// 7. ERROR BOUNDARIES AND RESILIENCE
// ───────────────────────────────────────────────────────────────
//
// Error boundaries are class components. Yes, still. There's no hooks
// equivalent — componentDidCatch and getDerivedStateFromError don't
// have hook counterparts as of React 18. Use `react-error-boundary`
// to avoid writing the class yourself.
//
// ── Why granular error boundaries matter ──
//
//   One boundary at the root = one widget crashes → entire page is dead.
//   One boundary per widget = one widget crashes → other 7 work fine.
//
//   // Bad: one global boundary
//   <ErrorBoundary>
//     <Dashboard />   // any crash anywhere kills the page
//   </ErrorBoundary>
//
//   // Good: per-widget boundaries
//   <DashboardGrid>
//     <ErrorBoundary fallback={<ErrorCard title="Revenue" />}>
//       <RevenueWidget />
//     </ErrorBoundary>
//     <ErrorBoundary fallback={<ErrorCard title="Users" />}>
//       <UsersWidget />
//     </ErrorBoundary>
//   </DashboardGrid>
//
// ── react-error-boundary usage ──
//
//   import { ErrorBoundary } from 'react-error-boundary';
//
//   function ErrorFallback({ error, resetErrorBoundary }) {
//     return (
//       <div role="alert">
//         <p>Something went wrong: {error.message}</p>
//         <button onClick={resetErrorBoundary}>Try again</button>
//       </div>
//     );
//   }
//
//   <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => refetch()}>
//     <ChartWidget />
//   </ErrorBoundary>
//
// ── Pair ErrorBoundary with Suspense ──
//
//   <ErrorBoundary fallback={<ErrorCard />}>    ← catches render errors
//     <Suspense fallback={<Skeleton />}>         ← shows while loading
//       <LazyWidget />
//     </Suspense>
//   </ErrorBoundary>
//
// ── Global error handler — what falls outside React's tree ──
//
//   // Async errors, event handler errors, setTimeout callbacks
//   window.onerror = (message, source, lineno, colno, error) => {
//     Sentry.captureException(error);
//   };
//
//   window.onunhandledrejection = (event) => {
//     Sentry.captureException(event.reason);
//   };
//
// ── Working ErrorBoundary class (minimal) ──

interface ErrorBoundaryState { hasError: boolean; message: string }

class ErrorBoundary extends React.Component<
    { children: ReactNode; fallback?: ReactNode },
    ErrorBoundaryState
> {
    state: ErrorBoundaryState = { hasError: false, message: '' };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, message: error.message };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // Send to your error tracking service here
        console.error('[ErrorBoundary]', error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback ?? (
                <div style={{
                    padding: 16, background: '#fef2f2', border: '1px solid #fca5a5',
                    borderRadius: 8, color: '#991b1b',
                }}>
                    <strong>Something went wrong.</strong>
                    <p style={{ margin: '4px 0 0', fontSize: 13 }}>{this.state.message}</p>
                    <button
                        onClick={() => this.setState({ hasError: false, message: '' })}
                        style={{ marginTop: 8, padding: '4px 12px', fontSize: 13, cursor: 'pointer' }}
                    >
                        Try again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

// ⚠️ GOTCHA: Error boundaries do NOT catch these — handle them separately:
//   1. Errors inside async functions / event handlers
//      (throw from a setTimeout or a click handler → boundary misses it)
//   2. Errors during server-side rendering
//   3. Errors in the boundary component itself
//   4. Errors outside the React tree (third-party scripts)
//   For all of these: window.onerror, try/catch, or useErrorBoundary hook
//   from react-error-boundary (which can re-throw into the boundary from async).

// ───────────────────────────────────────────────────────────────
// 8. SYSTEM DESIGN INTERVIEW PATTERNS
// ───────────────────────────────────────────────────────────────
//
// ── 5 questions to ask before designing ANYTHING ──
//
//   1. Scale: how many concurrent users? 100? 100k? 10M?
//      (changes virtualization, CDN, caching strategy entirely)
//   2. Users: consumers (mobile-first) or enterprise (desktop, power users)?
//      (changes a11y requirements, density, keyboard shortcuts)
//   3. Real-time? (chat, live scores, collaborative editing?)
//      (changes WebSocket vs SSE vs polling decision)
//   4. Offline? (PWA, service worker, IndexedDB sync?)
//      (adds significant complexity — clarify if really needed)
//   5. i18n? (RTL languages, date/number formats, translations?)
//      (affects layout assumptions and date library choices)
//
// ── Common interview systems — quick cheat sheet ──
//
//   News feed (Twitter/Facebook):
//     Hardest problem: infinite scroll + new item injection without losing scroll position
//     Pattern: React Query infinite queries + IntersectionObserver
//
//   Autocomplete (Google search bar):
//     Hardest problem: debounce + cancel stale requests + keyboard nav + a11y
//     Pattern: useDebounce + AbortController + aria-combobox (see worked example below)
//
//   YouTube player:
//     Hardest problem: adaptive bitrate, buffering state machine, keyboard shortcuts
//     Pattern: custom usePlayer hook wrapping HTMLVideoElement, Event-based state machine
//
//   Google Docs collaboration:
//     Hardest problem: conflict resolution (CRDT or OT), cursor positions
//     Pattern: Yjs CRDT + WebSocket, Tiptap/Prosemirror editor
//
//   Uber-style map:
//     Hardest problem: real-time marker updates at 60fps without re-rendering React tree
//     Pattern: render markers imperatively via map SDK (Mapbox GL), useRef + useEffect
//
// ── What interviewers are actually evaluating ──
//
//   Not: "did you pick the perfect library?"
//   Yes: "can you reason about trade-offs clearly?"
//
//   Not: "do you know React Query's API by heart?"
//   Yes: "do you understand WHY server state needs different handling?"
//
//   Not: "did you get to coding in 2 minutes?"
//   Yes: "did you ask clarifying questions before designing?"
//
// ── Worked example: Autocomplete search ──
//
//   Requirements:
//     - Input debounced 300ms (don't hit API on every keystroke)
//     - Cancel stale requests (type fast → only last request matters)
//     - Keyboard nav: Arrow keys move through suggestions, Enter selects, Esc closes
//     - a11y: aria-combobox, aria-listbox, aria-option — screen readers must work
//     - Cache: same query in same session shouldn't re-fetch
//
//   Component tree:
//     <Combobox>              ← manages open/closed, active index, query state
//       <ComboboxInput />     ← debounced onChange, aria-combobox
//       <ComboboxList>        ← aria-listbox, hidden when closed
//         <ComboboxOption />  ← aria-option, aria-selected
//       </ComboboxList>
//     </Combobox>
//
//   Key implementation decisions:
//     - Debounce: custom useDebounce hook (300ms)
//     - Stale requests: AbortController — cancel previous before sending next
//     - Cache: React Query with queryKey=['autocomplete', debouncedQuery]
//     - Keyboard: onKeyDown on the input — track activeIndex in useState
//
//   Trade-off: client-side filter vs server-side search
//     Client: instant UX after first load, limited to cached data
//     Server: always fresh, handles typos with fuzzy match, needed for large datasets
//     → Choose server for real data, client for small controlled lists (<500 items)

// ── Minimal Autocomplete implementation showing the key patterns ──

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}

// Fake suggestions (in real life: React Query fetch)
const FAKE_SUGGESTIONS = [
    'React performance optimization',
    'React compound components',
    'React error boundaries',
    'React Query vs SWR',
    'React Server Components',
    'Redux vs Zustand',
];

function Autocomplete() {
    const [query, setQuery]           = useState('');
    const [isOpen, setIsOpen]         = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [selected, setSelected]     = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const debouncedQuery = useDebounce(query, 300);

    // Simulates a filtered fetch result
    const suggestions = useMemo(
        () => FAKE_SUGGESTIONS.filter(s =>
            s.toLowerCase().includes(debouncedQuery.toLowerCase()) && debouncedQuery.length > 0
        ),
        [debouncedQuery],
    );

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!isOpen || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex(i => Math.max(i - 1, 0));
                break;
            case 'Enter':
                if (activeIndex >= 0) {
                    setSelected(suggestions[activeIndex]);
                    setQuery(suggestions[activeIndex]);
                    setIsOpen(false);
                    setActiveIndex(-1);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setActiveIndex(-1);
                break;
        }
    }, [isOpen, suggestions, activeIndex]);

    return (
        <div style={{ position: 'relative', maxWidth: 480 }}>
            <input
                ref={inputRef}
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-autocomplete="list"
                aria-activedescendant={activeIndex >= 0 ? `option-${activeIndex}` : undefined}
                value={query}
                placeholder="Search React topics..."
                onChange={e => { setQuery(e.target.value); setIsOpen(true); setActiveIndex(-1); }}
                onKeyDown={handleKeyDown}
                onBlur={() => setTimeout(() => setIsOpen(false), 150)}  // delay to allow click
                style={{
                    width: '100%', padding: '10px 14px', fontSize: 14,
                    border: '1px solid #d1d5db', borderRadius: 8, boxSizing: 'border-box',
                }}
            />
            {isOpen && suggestions.length > 0 && (
                <ul
                    role="listbox"
                    style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        margin: '4px 0 0', padding: 4, listStyle: 'none',
                        background: '#fff', border: '1px solid #e5e7eb',
                        borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 100,
                    }}
                >
                    {suggestions.map((s, i) => (
                        <li
                            key={s}
                            id={`option-${i}`}
                            role="option"
                            aria-selected={i === activeIndex}
                            onMouseDown={() => {    // mousedown fires before blur
                                setSelected(s);
                                setQuery(s);
                                setIsOpen(false);
                            }}
                            onMouseEnter={() => setActiveIndex(i)}
                            style={{
                                padding: '8px 12px', borderRadius: 6, cursor: 'pointer',
                                fontSize: 14, background: i === activeIndex ? '#eff6ff' : 'transparent',
                                color: i === activeIndex ? '#1d4ed8' : '#111827',
                            }}
                        >
                            {s}
                        </li>
                    ))}
                </ul>
            )}
            {selected && (
                <p style={{ marginTop: 8, fontSize: 13, color: '#16a34a' }}>
                    Selected: <strong>{selected}</strong>
                </p>
            )}
        </div>
    );
}

// ⚠️ GOTCHA: Time-box each phase in the actual interview.
//    5 min requirements → 10 min HLD → 15 min deep dive → 5 min trade-offs.
//    Candidates who spend 30 minutes on requirements and run out of time
//    never get to show their strongest work. Set a mental timer.
//    If you're still in requirements at 8 minutes, say "let me summarize
//    requirements and move to design" and do it.

// ───────────────────────────────────────────────────────────────
// PRACTICE CHALLENGES
// ───────────────────────────────────────────────────────────────
//
// Try each before reading the answer.
//
// ────────────────────────────────────────────────────────────────
// Q1: Design a shopping cart — where does each piece of state live?
//     Consider: item list, quantities, promo code, payment state
// ────────────────────────────────────────────────────────────────
//
// ANSWER:
//
//   Item list + quantities → Global client state (Zustand)
//     Why: The cart is accessible from any page (header icon, checkout).
//     It's not server state because you own all mutations locally.
//     If you persist to server: ALSO keep in React Query for sync.
//
//   Promo code input → Local state (useState in CartForm)
//     Why: It's a form field. Nothing outside CartForm needs it
//     until the user clicks "Apply". Keep it local until it matters.
//
//   Promo code validation result → Server state (React Query mutation)
//     Why: Validation must happen on the server. The result
//     (valid/invalid, discount amount) is server data.
//
//   Payment state → React Query mutation + Local state
//     Why: The payment flow is complex. Use a state machine locally
//     (idle → validating → processing → success/error) and fire
//     a React Query mutation for the actual API call.
//
//   URL state: ?step=cart → ?step=checkout → ?step=confirmation
//     Why: users should be able to navigate back. Sharing a
//     half-completed checkout URL isn't ideal, but the step
//     navigation needs history.pushState.

// ────────────────────────────────────────────────────────────────
// Q2: Implement a Compound Tabs component with full TypeScript types
// ────────────────────────────────────────────────────────────────
//
// ANSWER: See the Tabs implementation in Section 4 above.
// The key pieces:
//   - TabsContext with { activeTab, setActiveTab }
//   - useTabs() hook that throws if used outside provider
//   - Tabs.List = TabsList; Tabs.Tab = Tab; Tabs.Panel = TabPanel;
//     (namespace attachment so callers write <Tabs.Tab>)
//   - aria roles: tablist, tab (aria-selected), tabpanel, hidden attribute
//
// Full typed version copied here for reference:
//
//   type TabsComposite = typeof Tabs & {
//     List: typeof TabsList;
//     Tab: typeof Tab;
//     Panel: typeof TabPanel;
//   };
//
//   (Tabs as TabsComposite).List  = TabsList;
//   (Tabs as TabsComposite).Tab   = Tab;
//   (Tabs as TabsComposite).Panel = TabPanel;

// ────────────────────────────────────────────────────────────────
// Q3: A dashboard has 8 widgets, each fetching their own data.
//     How do you prevent 8 separate loading spinners?
// ────────────────────────────────────────────────────────────────
//
// ANSWER:
//
//   Option A: Parallel prefetch at the layout level
//     Fetch all 8 datasets in the parent before rendering children.
//     Pass data down as props. All widgets start with data → no spinners.
//
//     function Dashboard() {
//       const [metrics, chart, table, ...] = useQueries([
//         { queryKey: ['metrics'], queryFn: fetchMetrics },
//         { queryKey: ['chart'],   queryFn: fetchChartData },
//         // ... 6 more
//       ]);
//       const isLoading = [metrics, chart, table].some(q => q.isLoading);
//       if (isLoading) return <DashboardSkeleton />;  // one skeleton, not 8 spinners
//       return <DashboardGrid data={{ metrics, chart, table }} />;
//     }
//
//   Option B: Skeleton-first with staggered reveal
//     Each widget fetches independently BUT renders a skeleton placeholder.
//     Feels intentional — not broken. Use CSS animation for skeleton pulse.
//
//   Option C: React Suspense boundaries with a single outer Suspense
//     Wrap all widgets in one Suspense boundary.
//     Any widget that suspends → the whole group shows the fallback.
//     Good when data loads at similar speed.
//
//   Best choice: depends on data size.
//     Similar load times → Option C (Suspense)
//     Wildly different load times → Option B (individual skeletons)
//     Need SSR or SEO → Option A (prefetch in loader/getServerSideProps)

// ────────────────────────────────────────────────────────────────
// Q4: Design an autocomplete component
//     Requirements: debounce, cancel stale requests, keyboard nav, a11y
// ────────────────────────────────────────────────────────────────
//
// ANSWER: See the Autocomplete implementation in Section 8 above.
//
// Key decisions and their reasons:
//
//   Debounce (300ms):
//     Don't fetch on every keystroke — wait for the user to pause.
//     Custom useDebounce hook wrapping setTimeout/clearTimeout.
//
//   Cancel stale requests (AbortController):
//     User types "reac" → fetch → types "react" → fetch → "reac" response arrives.
//     Without cancellation: stale "reac" results flash briefly after "react" results.
//     AbortController: cancel the previous fetch before starting the next.
//
//     const controllerRef = useRef<AbortController | null>(null);
//     // In fetch:
//     controllerRef.current?.abort();
//     controllerRef.current = new AbortController();
//     fetch(url, { signal: controllerRef.current.signal });
//
//   Keyboard navigation:
//     ArrowDown/Up → move activeIndex
//     Enter → select, close list
//     Escape → close list, keep query
//     Tab → close list (user moving away)
//
//   a11y (aria-combobox pattern):
//     input: role="combobox" aria-expanded aria-haspopup="listbox" aria-activedescendant
//     ul:    role="listbox"
//     li:    role="option" aria-selected
//     Use onMouseDown (not onClick) on options — fires before the input's onBlur.

// ────────────────────────────────────────────────────────────────
// Q5: Your analytics page loads in 8 seconds. Walk through your
//     debugging and optimization process.
// ────────────────────────────────────────────────────────────────
//
// ANSWER:
//
//   Step 1: Diagnose before optimizing (never guess)
//     Open Chrome DevTools → Network tab → filter by JS → see chunk sizes.
//     Run Lighthouse → look at "Render-blocking resources" and "JS execution time".
//     Run `npm run build` → check `dist/assets/*.js` sizes.
//     Use source-map-explorer to see what's in the main bundle.
//
//   Step 2: Bundle size problems (most likely culprit)
//     Common offenders:
//       - Chart library (Recharts/Victory/D3) bundled with the page → lazy-load it
//       - All lodash imported (lodash is 70kb) → use lodash-es with tree shaking
//       - Moment.js (500kb with locales) → switch to date-fns or dayjs
//     Fix: React.lazy() + dynamic import() for heavy deps.
//
//   Step 3: Waterfall requests
//     Each widget fetches sequentially → each waits for the previous.
//     Fix: useQueries() to fetch all widgets in parallel.
//     Fix: prefetch in the route loader before the component mounts.
//
//   Step 4: No caching
//     Every visit refetches everything from scratch.
//     Fix: React Query staleTime — data younger than 5 min uses cache.
//     Fix: HTTP Cache-Control headers on API responses.
//
//   Step 5: Expensive renders
//     10,000 row table all in the DOM → browser paints forever.
//     Fix: react-window FixedSizeList → only visible rows in DOM.
//     Fix: React.memo on expensive pure components.
//     Use React DevTools Profiler to find the hot paths.
//
//   Step 6: Measure again
//     Re-run Lighthouse. Compare before/after.
//     8s → 2s is a realistic result from steps 2-4 alone.

// ───────────────────────────────────────────────────────────────
// SELF-ASSESSMENT — 10 Questions
// ───────────────────────────────────────────────────────────────
//
// Score: 0–4 re-read the file | 5–7 solid | 8–10 ready to interview
//
// Q1: What are the 4 phases of the frontend system design framework?
//     Name them in order and give one sentence on each.
//
//     A: Requirements (functional + non-functional), High-Level Design
//        (component tree + state layers), Deep Dive (solve the 2 hardest
//        problems), Trade-offs (compare approaches with pros/cons).
//
// Q2: A user wants to filter a product list by category. The filtered
//     view should be shareable via URL. What kind of state is this?
//
//     A: URL state. Use useSearchParams → ?category=shoes.
//        This lets users paste the link and see the same filtered view.
//
// Q3: You're building a comments section. The comment data comes from
//     an API. Should it live in useState + useEffect, Redux, or React Query?
//
//     A: React Query. Comments are server state — React Query gives you
//        caching, deduplication, background refetch, and loading/error states
//        for free. useState + useEffect requires you to rebuild all of that.
//        Redux is for client-side state — using it for API data adds boilerplate
//        with none of the caching benefits.
//
// Q4: What's the difference between a Compound Component and a Prop Bag?
//     Give an example of each for a modal.
//
//     A: Prop bag: <Modal isOpen title="Confirm" onClose={...} footer={<Buttons />} />
//        Compound: <Modal> <Modal.Header>Confirm</Modal.Header>
//                    <Modal.Body>Are you sure?</Modal.Body>
//                    <Modal.Footer><Button>Yes</Button></Modal.Footer>
//                  </Modal>
//        Compound components share state via Context internally.
//        They're more composable and don't need a massive props interface.
//
// Q5: Your TweetCard re-renders every time the feed refreshes, even when
//     that tweet's data hasn't changed. How do you fix this?
//
//     A: Wrap TweetCard in React.memo. Memo does a shallow props comparison —
//        if the tweet object reference hasn't changed, the component skips render.
//        Make sure the parent isn't creating a new object on every render
//        (that would defeat memo). If needed, useMemo the tweet objects.
//
// Q6: What 3 things does Error Boundary NOT catch? How do you handle them?
//
//     A: (1) Async errors (setTimeout, Promises) — catch manually or use
//        window.onunhandledrejection.
//        (2) Event handler errors (onClick, onSubmit) — wrap in try/catch.
//        (3) Errors outside the React tree (third-party scripts) — window.onerror.
//
// Q7: When would you use an HOC vs a custom hook? Give a real example.
//
//     A: Custom hook almost always. HOCs made sense pre-hooks.
//        Use an HOC today only when: (a) you need to intercept at the component
//        level (e.g., withRouter in old React Router for class components),
//        or (b) a third-party library requires it.
//        Custom hook example: useAuth() replaces withAuth(Component).
//        Cleaner, composable, visible in DevTools, no prop conflicts.
//
// Q8: Your dashboard fetches 8 datasets. How do you prevent a waterfall
//     (request 2 waiting for request 1 to finish)?
//
//     A: useQueries() from React Query — fires all queries in parallel.
//        Or prefetch all data in the route loader before the component mounts.
//        The key is NOT chaining useEffect calls or using sequential awaits.
//
// Q9: What is Islands Architecture? When would you use it?
//
//     A: Server-render the entire page. Only hydrate the interactive parts
//        (the "islands"). Static content never loads JS.
//        Use when: you have a content-heavy site (docs, blog, marketing page)
//        with a few interactive elements (search bar, live prices, a widget).
//        Not needed for fully dynamic apps where everything is interactive.
//
// Q10: You're designing an autocomplete for a search with 1 million products.
//      Should you filter client-side or server-side? What are the trade-offs?
//
//      A: Server-side. 1M products can't live in the browser.
//         Server-side: always fresh, fuzzy matching, handles scale.
//         Client-side: instant after first load, no network latency.
//         Client-side only works for small controlled lists (<1000 items).
//         For 1M products: debounce input → fetch from search API (Elasticsearch/Algolia)
//         → cancel stale requests via AbortController → cache results in React Query.

// ───────────────────────────────────────────────────────────────
// DEMO — compound tabs + polymorphic button working together
// ───────────────────────────────────────────────────────────────

function BrokenWidget(): ReactNode {
    // Simulates a widget that crashes on render
    throw new Error('Widget failed to load data');
}

function Demo() {
    const [showChart, setShowChart] = useState(false);
    const [showBroken, setShowBroken] = useState(false);
    const emailRef = useRef<HTMLInputElement>(null);

    const focusEmail = () => emailRef.current?.focus();

    return (
        <div style={{
            maxWidth: 720,
            margin: '0 auto',
            padding: 32,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#111827',
        }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                React 12 · System Design Patterns
            </h1>
            <p style={{ color: '#6b7280', marginBottom: 32, fontSize: 14 }}>
                Compound Tabs + Polymorphic Button + ForwardRef + Error Boundaries + Lazy Loading
            </p>

            {/* ── Section: Compound Tabs ── */}
            <section style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
                    Compound Tabs
                </h2>

                <Tabs defaultTab="overview">
                    <Tabs.List>
                        <Tabs.Tab id="overview">Overview</Tabs.Tab>
                        <Tabs.Tab id="metrics">Metrics</Tabs.Tab>
                        <Tabs.Tab id="code">Code</Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel id="overview">
                        <p style={{ color: '#374151', fontSize: 14, lineHeight: 1.6 }}>
                            Compound components share state via Context. The parent{' '}
                            <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>
                                {'<Tabs>'}
                            </code>{' '}
                            manages which tab is active; children read it through{' '}
                            <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>
                                useTabs()
                            </code>
                            . No prop drilling. No massive props interface.
                        </p>
                    </Tabs.Panel>

                    <Tabs.Panel id="metrics">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                            <MetricCard title="Revenue" value="$42,800" delta={12.4} />
                            <MetricCard title="Users" value="8,204" delta={-2.1} />
                            <MetricCard title="Conversions" value="3.8%" delta={0.6} />
                        </div>
                    </Tabs.Panel>

                    <Tabs.Panel id="code">
                        <pre style={{
                            background: '#1e293b', color: '#e2e8f0',
                            padding: 16, borderRadius: 8, fontSize: 12,
                            overflowX: 'auto', lineHeight: 1.6,
                        }}>
{`<Tabs defaultTab="overview">
  <Tabs.List>
    <Tabs.Tab id="overview">Overview</Tabs.Tab>
    <Tabs.Tab id="metrics">Metrics</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel id="overview">
    <p>Overview content</p>
  </Tabs.Panel>
  <Tabs.Panel id="metrics">
    <MetricCard ... />
  </Tabs.Panel>
</Tabs>`}
                        </pre>
                    </Tabs.Panel>
                </Tabs>
            </section>

            {/* ── Section: Polymorphic Button ── */}
            <section style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
                    Polymorphic Button
                </h2>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <PolyButton variant="primary" onClick={() => alert('Primary clicked!')}>
                        Primary Button
                    </PolyButton>
                    <PolyButton variant="ghost" onClick={() => alert('Ghost clicked!')}>
                        Ghost Button
                    </PolyButton>
                    <PolyButton variant="danger" onClick={() => alert('Danger clicked!')}>
                        Danger Button
                    </PolyButton>
                    {/* Renders as <a> — TypeScript enforces href is valid */}
                    <PolyButton as="a" href="#" variant="ghost">
                        Link (renders as &lt;a&gt;)
                    </PolyButton>
                </div>
            </section>

            {/* ── Section: forwardRef Input ── */}
            <section style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
                    forwardRef Input
                </h2>
                <Input
                    ref={emailRef}
                    label="Email address"
                    type="email"
                    placeholder="you@example.com"
                />
                <Input
                    label="Username (with error)"
                    defaultValue="ab"
                    error="Username must be at least 3 characters"
                />
                <PolyButton variant="ghost" onClick={focusEmail}>
                    Focus email via ref
                </PolyButton>
            </section>

            {/* ── Section: Lazy Loading ── */}
            <section style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
                    Lazy Loading (Code Splitting)
                </h2>
                {!showChart && (
                    <PolyButton variant="primary" onClick={() => setShowChart(true)}>
                        Load Heavy Chart (lazy)
                    </PolyButton>
                )}
                {showChart && (
                    <ErrorBoundary>
                        <Suspense fallback={
                            <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8, color: '#9ca3af', fontSize: 14 }}>
                                Loading chart component...
                            </div>
                        }>
                            <LazyChart />
                        </Suspense>
                    </ErrorBoundary>
                )}
            </section>

            {/* ── Section: Error Boundary ── */}
            <section style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
                    Granular Error Boundaries
                </h2>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
                    One widget crashes — the rest of the dashboard keeps working.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <ErrorBoundary>
                        <MetricCard title="Working Widget" value="$12,400" delta={5.2} />
                    </ErrorBoundary>
                    <ErrorBoundary>
                        {showBroken
                            ? <BrokenWidget />
                            : (
                                <div style={{
                                    padding: 20, borderRadius: 10,
                                    background: '#fff', border: '1px solid #e5e7eb',
                                    display: 'flex', flexDirection: 'column', gap: 8,
                                }}>
                                    <span style={{ fontSize: 13, color: '#6b7280' }}>CRASH ME</span>
                                    <PolyButton variant="danger" onClick={() => setShowBroken(true)}>
                                        Break this widget
                                    </PolyButton>
                                </div>
                            )
                        }
                    </ErrorBoundary>
                </div>
            </section>

            {/* ── Section: Autocomplete ── */}
            <section style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
                    Autocomplete — Debounced + Keyboard Nav + a11y
                </h2>
                <Autocomplete />
            </section>
        </div>
    );
}

// Re-export the pieces interviewers might ask about
export {
    Tabs,
    Tab,
    TabsList,
    TabPanel,
    PolyButton,
    Input,
    ErrorBoundary,
    MetricCard,
    Autocomplete,
    useDebounce,
};

export default Demo;
