// ═══════════════════════════════════════════════════════════════
// TESTING 04: INTEGRATION TESTING  (Day 34)
// Run tests:   npm test
// Run UI:      npm run test:ui
// ═══════════════════════════════════════════════════════════════
//
// WHAT IS AN INTEGRATION TEST?
//  An integration test verifies that MULTIPLE units work together correctly.
//  It renders real components with real hooks and real business logic —
//  only the network layer (MSW) and external dependencies are faked.
//
// THE TESTING TROPHY — where integration tests sit:
//
//        /    E2E     \        ← 5%  — full browser, real server
//       /──────────────\
//      / Integration    \      ← 50% — real components + MSW
//     /─────────────────\
//    /    Unit Tests      \    ← 35% — isolated functions/hooks
//   /──────────────────────\
//  /  Static (TypeScript)   \  ← 10% — type checking
//
// WHY INTEGRATION > UNIT (by count):
//  Unit tests: fast and precise, but can't catch wiring bugs.
//    Example: a component could have a correct hook AND a correct API call,
//    but pass the wrong data between them. Unit tests miss this.
//  Integration tests: catch real user-facing bugs by testing the WHOLE flow.
//
// WHAT INTEGRATION TESTS COVER IN THIS FILE:
//  1. Components that fetch data (MSW + waitFor)
//  2. Components with React Router (navigation, link clicks)
//  3. Components with forms (fill → submit → see result)
//  4. Filtering and search flows
//  5. Error and empty states
//
// ───────────────────────────────────────────────────────────────

import React, { useState } from 'react';

// ───────────────────────────────────────────────────────────────
// 1. CUSTOM RENDER — the integration test foundation
// ───────────────────────────────────────────────────────────────
//
// Most components need providers: React Router, React Query, Auth context.
// Rather than wrapping every render() call, create a shared helper.
//
// CUSTOM RENDER PATTERN:
//
//   // In a shared test-utils.tsx file (or inline in the test):
//   import { render, type RenderOptions } from '@testing-library/react'
//   import { MemoryRouter } from 'react-router-dom'
//   import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
//
//   interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
//     initialRoute?: string
//   }
//
//   export function renderWithProviders(
//     ui: React.ReactElement,
//     { initialRoute = '/', ...options }: RenderWithProvidersOptions = {}
//   ) {
//     const queryClient = new QueryClient({
//       defaultOptions: {
//         queries: { retry: false },      // fail immediately on error (no 3 retries)
//         mutations: { retry: false },
//       },
//     })
//
//     function Wrapper({ children }: { children: React.ReactNode }) {
//       return (
//         <MemoryRouter initialEntries={[initialRoute]}>
//           <QueryClientProvider client={queryClient}>
//             {children}
//           </QueryClientProvider>
//         </MemoryRouter>
//       )
//     }
//
//     return render(ui, { wrapper: Wrapper, ...options })
//   }
//
// WHY MemoryRouter instead of BrowserRouter?
//   BrowserRouter reads from window.location (real browser URL bar).
//   MemoryRouter keeps history in memory — perfect for tests where
//   there's no real browser URL bar and you control the initial route.
//
// WHY QueryClient per test?
//   React Query caches results. If test A loads users and caches them,
//   test B (with a different MSW handler) would get the cached data.
//   A fresh QueryClient = empty cache every test.
//
// WHY retry: false?
//   React Query retries failed queries 3× by default with exponential backoff.
//   In tests that expect failure, this means 3 retries × 1-4s = 3-12s wait.
//   retry: false makes failures instant.

// ───────────────────────────────────────────────────────────────
// 2. TESTING COMPONENTS THAT FETCH DATA
// ───────────────────────────────────────────────────────────────
//
// Pattern: render → assert loading state → wait for data → assert data
//
// EXAMPLE — testing TodoListApi (src/components/TodoListApi.tsx):
//
//   import { render, screen, waitFor } from '@testing-library/react'
//   import { TodoListApi } from '@/components/TodoListApi'
//
//   describe('TodoListApi', () => {
//     it('shows a loading state initially', () => {
//       render(<TodoListApi />)
//       // The component shows "Loading..." before the fetch resolves
//       expect(screen.getByText(/Loading/i)).toBeInTheDocument()
//     })
//
//     it('displays todos after fetching', async () => {
//       render(<TodoListApi />)
//       // MSW returns: [{ id:1, title:'Buy groceries' }, ...]
//       // Wait for the loading state to disappear
//       await waitFor(() =>
//         expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
//       )
//       expect(screen.getByText('Buy groceries')).toBeInTheDocument()
//       expect(screen.getByText('Read a book')).toBeInTheDocument()
//     })
//
//     it('shows an error message when the fetch fails', async () => {
//       server.use(
//         http.get('https://jsonplaceholder.typicode.com/todos', () =>
//           HttpResponse.json({ message: 'Error' }, { status: 500 })
//         )
//       )
//       render(<TodoListApi />)
//       // Wait for the error state
//       const error = await screen.findByRole('alert')
//       expect(error).toHaveTextContent(/failed/i)
//     })
//
//     it('shows "no todos" message when the list is empty', async () => {
//       server.use(
//         http.get('https://jsonplaceholder.typicode.com/todos', () =>
//           HttpResponse.json([])
//         )
//       )
//       render(<TodoListApi />)
//       await screen.findByText(/no todos/i)
//     })
//   })

// ───────────────────────────────────────────────────────────────
// 3. TESTING WITH REACT ROUTER — navigation flows
// ───────────────────────────────────────────────────────────────
//
// Components using useNavigate(), useParams(), Link, NavLink all
// require a router context. Use MemoryRouter or createMemoryRouter.
//
// APPROACH A — MemoryRouter (simple, most common)
//
//   import { MemoryRouter } from 'react-router-dom'
//   import { Routes, Route } from 'react-router-dom'
//
//   it('navigates to the detail page on click', async () => {
//     const user = userEvent.setup()
//     render(
//       <MemoryRouter initialEntries={['/users']}>
//         <Routes>
//           <Route path="/users" element={<UserList />} />
//           <Route path="/users/:id" element={<UserDetail />} />
//         </Routes>
//       </MemoryRouter>
//     )
//     await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2))
//     await user.click(screen.getByRole('link', { name: 'Alice Chen' }))
//     // After click, router navigates to /users/1 and renders UserDetail
//     expect(await screen.findByRole('heading', { name: 'Alice Chen' })).toBeInTheDocument()
//   })
//
// APPROACH B — createMemoryRouter (full router config, v6.4+)
//
//   import { createMemoryRouter, RouterProvider } from 'react-router-dom'
//
//   it('renders user profile page', async () => {
//     const router = createMemoryRouter(
//       [
//         { path: '/profile/:id', element: <UserProfile /> },
//       ],
//       { initialEntries: ['/profile/42'] }
//     )
//     render(<RouterProvider router={router} />)
//     expect(await screen.findByText('User #42')).toBeInTheDocument()
//   })
//
// TESTING LINK NAVIGATION:
//
//   it('Back button navigates to the list', async () => {
//     const user = userEvent.setup()
//     render(
//       <MemoryRouter initialEntries={['/users/1']}>
//         <Routes>
//           <Route path="/users" element={<UserList />} />
//           <Route path="/users/:id" element={<UserDetail />} />
//         </Routes>
//       </MemoryRouter>
//     )
//     await user.click(screen.getByRole('link', { name: 'Back to users' }))
//     expect(await screen.findByRole('heading', { name: 'Users' })).toBeInTheDocument()
//   })
//
// VERIFYING THE URL AFTER NAVIGATION:
//   There's no easy way to check window.location in MemoryRouter tests.
//   Instead, verify the CONTENT of the page that should appear at that route.
//   If the correct component rendered, navigation happened correctly.

// ───────────────────────────────────────────────────────────────
// 4. TESTING FULL FORM FLOWS
// ───────────────────────────────────────────────────────────────
//
// Full flow: render → fill form → submit → API call (MSW) → see result
//
// EXAMPLE — Todo creation flow:
//
//   import userEvent from '@testing-library/user-event'
//   import { render, screen } from '@testing-library/react'
//   import { TodoApp } from '@/components/TodoApp'
//
//   describe('TodoApp — add todo flow', () => {
//     it('adds a new todo and shows it in the list', async () => {
//       const user = userEvent.setup()
//       render(<TodoApp />)
//
//       // 1. Wait for initial todos to load
//       await screen.findByText('Buy groceries')
//
//       // 2. Fill the new todo input
//       const input = screen.getByRole('textbox', { name: /new todo/i })
//       await user.type(input, 'Walk the dog')
//
//       // 3. Submit
//       await user.click(screen.getByRole('button', { name: /add/i }))
//
//       // 4. Verify the new todo appears (MSW POST returns it)
//       expect(await screen.findByText('Walk the dog')).toBeInTheDocument()
//
//       // 5. Verify the input was cleared
//       expect(input).toHaveValue('')
//     })
//
//     it('disables the add button when the input is empty', async () => {
//       render(<TodoApp />)
//       await screen.findByText('Buy groceries')
//       expect(screen.getByRole('button', { name: /add/i })).toBeDisabled()
//     })
//
//     it('shows an error when adding fails', async () => {
//       server.use(
//         http.post('https://jsonplaceholder.typicode.com/todos', () =>
//           HttpResponse.json({ message: 'Server error' }, { status: 500 })
//         )
//       )
//       const user = userEvent.setup()
//       render(<TodoApp />)
//       await screen.findByText('Buy groceries')
//       await user.type(screen.getByRole('textbox', { name: /new todo/i }), 'New task')
//       await user.click(screen.getByRole('button', { name: /add/i }))
//       expect(await screen.findByRole('alert')).toHaveTextContent(/failed/i)
//     })
//   })

// ───────────────────────────────────────────────────────────────
// 5. TESTING SEARCH / FILTER FLOWS
// ───────────────────────────────────────────────────────────────
//
// Pattern: render with data → type in search → assert filtered results
//
// EXAMPLE — SearchUsers component (src/components/SearchBox.tsx):
//
//   describe('SearchUsers', () => {
//     it('shows all users on initial load', async () => {
//       render(<SearchUsers />)
//       // MSW returns Alice Chen and Bob Smith
//       await screen.findByText('Alice Chen')
//       expect(screen.getByText('Bob Smith')).toBeInTheDocument()
//     })
//
//     it('filters users as the search term is typed', async () => {
//       const user = userEvent.setup()
//       render(<SearchUsers />)
//       await screen.findByText('Alice Chen')
//
//       const searchInput = screen.getByRole('textbox', { name: /search/i })
//       await user.type(searchInput, 'alice')
//
//       // MSW filters: the handler reads the query param and returns only Alice
//       await waitFor(() => {
//         expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument()
//       })
//       expect(screen.getByText('Alice Chen')).toBeInTheDocument()
//     })
//
//     it('shows "no results" when no users match', async () => {
//       const user = userEvent.setup()
//       render(<SearchUsers />)
//       await screen.findByText('Alice Chen')
//       await user.type(screen.getByRole('textbox', { name: /search/i }), 'xyz')
//
//       server.use(
//         http.get('https://jsonplaceholder.typicode.com/users', () =>
//           HttpResponse.json([])
//         )
//       )
//       await screen.findByText(/no users found/i)
//     })
//   })

// ───────────────────────────────────────────────────────────────
// 6. KEY PRINCIPLES FOR INTEGRATION TESTS
// ───────────────────────────────────────────────────────────────
//
// PRINCIPLE 1: Don't test implementation details
//   ❌ expect(component.state.todos).toHaveLength(3)
//   ✅ expect(screen.getAllByRole('listitem')).toHaveLength(3)
//
//   When state changes, tests break. When DOM changes, users notice.
//   Test the DOM because that's what users interact with.
//
// PRINCIPLE 2: Use realistic queries
//   ❌ screen.getByTestId('todo-0')      — brittle index
//   ✅ screen.getByRole('listitem', { name: 'Buy groceries' })
//   ✅ screen.getByText('Buy groceries')
//
// PRINCIPLE 3: Test the full flow, not just one step
//   If a bug only appears when steps happen in sequence, a test that
//   only tests one step won't catch it. Integration tests earn their
//   cost by testing the SEQUENCE: load → interact → verify.
//
// PRINCIPLE 4: One meaningful assertion per test, but cover all states
//   Not "one expect per test" — that's too strict.
//   One CONCEPT per test. A "success state" test can have 3 expects
//   about what appears, as long as they all validate the same concept.
//
// PRINCIPLE 5: Avoid arbitrary sleeps
//   ❌ await new Promise(r => setTimeout(r, 500)) — fragile, slow
//   ✅ await screen.findByText('Loaded')           — waits exactly as long as needed
//   ✅ await waitFor(() => expect(el).toBeVisible()) — same
//
// PRINCIPLE 6: Clean shared state between tests
//   - MSW: resetHandlers() in afterEach (already set up in setup.ts)
//   - React Query: fresh QueryClient per test
//   - localStorage: localStorage.clear() in beforeEach if your component uses it
//   - Any module-level state: reset in afterEach

// ───────────────────────────────────────────────────────────────
// 7. COMMON INTEGRATION TEST PATTERNS
// ───────────────────────────────────────────────────────────────
//
// LOADING → SUCCESS:
//   render(<Component />)
//   expect(screen.getByText(/loading/i)).toBeInTheDocument()
//   await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument())
//   expect(screen.getByText('Expected data')).toBeInTheDocument()
//
// LOADING → ERROR:
//   server.use(http.get(url, () => HttpResponse.json({}, { status: 500 })))
//   render(<Component />)
//   const error = await screen.findByRole('alert')
//   expect(error).toHaveTextContent(/error/i)
//
// OPTIMISTIC UPDATE:
//   render(<TodoList />)
//   await screen.findByText('Original Todo')
//   user.click(deleteButton)
//   // Optimistic: item removed immediately
//   expect(screen.queryByText('Original Todo')).not.toBeInTheDocument()
//   // On server error: item reappears
//   server.use(http.delete(url, () => HttpResponse.json({}, { status: 500 })))
//   await screen.findByText('Original Todo')
//
// PAGINATION:
//   render(<UserTable />)
//   await screen.findByText('Page 1 of 5')
//   await user.click(screen.getByRole('button', { name: 'Next page' }))
//   await screen.findByText('Page 2 of 5')
//   // assert new data appears, old data is gone

// ───────────────────────────────────────────────────────────────
// PRACTICE EXERCISES
// ───────────────────────────────────────────────────────────────
//
// EXERCISE 1: What's the difference between these two tests?
//
//   // Test A (Unit):
//   it('formats the user name correctly', () => {
//     expect(formatUserName({ first: 'Alice', last: 'Chen' })).toBe('Alice Chen')
//   })
//
//   // Test B (Integration):
//   it('displays the formatted user name in the header', async () => {
//     render(<UserHeader userId="1" />)
//     await screen.findByText('Alice Chen')
//   })
//
//   Answer:
//   Test A: pure function, no DOM, instant. Tests the formatter in isolation.
//   Test B: tests that the component fetches the user, calls the formatter,
//            and puts the result in the right place. Catches wiring bugs.
//
// EXERCISE 2: Write the custom render helper for this project
//
//   function renderWithProviders(ui, options = {}) {
//     const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
//     return render(ui, {
//       wrapper: ({ children }) => (
//         <MemoryRouter>
//           <QueryClientProvider client={qc}>{children}</QueryClientProvider>
//         </MemoryRouter>
//       ),
//       ...options,
//     })
//   }
//
// EXERCISE 3: Identify what's wrong with this integration test
//
//   it('loads and displays users', async () => {
//     render(<UserList />)
//     await new Promise(r => setTimeout(r, 1000))  // ❌ arbitrary sleep
//     expect(screen.getByText('Alice Chen')).toBeInTheDocument()
//   })
//
//   Problems:
//   1. Arbitrary 1s sleep — if fetch takes 1.1s, test fails intermittently
//   2. If fetch is faster, the 1s wait wastes time
//   Fix:
//   const alice = await screen.findByText('Alice Chen')  // waits exactly as long as needed
//   expect(alice).toBeInTheDocument()
//
// EXERCISE 4: Test a delete flow end-to-end
//
//   it('removes a todo when the delete button is clicked', async () => {
//     const user = userEvent.setup()
//     // Setup MSW to handle DELETE
//     server.use(
//       http.delete('https://jsonplaceholder.typicode.com/todos/:id', () =>
//         HttpResponse.json({ success: true })
//       )
//     )
//     render(<TodoList />)
//     await screen.findByText('Buy groceries')
//
//     // Find the delete button next to 'Buy groceries'
//     const item = screen.getByText('Buy groceries').closest('li')!
//     await user.click(within(item).getByRole('button', { name: /delete/i }))
//
//     // Verify it's removed
//     await waitFor(() =>
//       expect(screen.queryByText('Buy groceries')).not.toBeInTheDocument()
//     )
//   })

// ───────────────────────────────────────────────────────────────
// LIVE DEMO — visualize integration test concepts
// ───────────────────────────────────────────────────────────────

function TestingTrophyDemo() {
  const [selected, setSelected] = useState<string | null>(null);

  const layers = [
    {
      key: 'e2e',
      label: 'E2E Tests',
      width: 120,
      color: '#ef4444',
      bg: '#fef2f2',
      pct: '5%',
      desc: 'Full browser, real server. Tests complete user journeys. Slowest, most expensive. Playwright.',
    },
    {
      key: 'integration',
      label: 'Integration Tests ⭐',
      width: 220,
      color: '#f59e0b',
      bg: '#fffbeb',
      pct: '50%',
      desc: 'Real components + MSW. Tests multiple units together. Best confidence:effort ratio. THIS FILE.',
    },
    {
      key: 'unit',
      label: 'Unit Tests',
      width: 300,
      color: '#3b82f6',
      bg: '#eff6ff',
      pct: '35%',
      desc: 'Isolated functions, hooks. Fast, precise. Best for pure logic and edge cases.',
    },
    {
      key: 'static',
      label: 'Static Analysis (TypeScript)',
      width: 360,
      color: '#8b5cf6',
      bg: '#f5f3ff',
      pct: '10%',
      desc: 'Type checking catches errors before runtime. Free — just run tsc.',
    },
  ];

  return (
    <div style={{ fontFamily: 'sans-serif', fontSize: 13 }}>
      <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
        Click a layer to learn more about it:
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginBottom: 12 }}>
        {layers.map(l => (
          <div
            key={l.key}
            onClick={() => setSelected(selected === l.key ? null : l.key)}
            style={{
              width: l.width,
              padding: '6px 12px',
              background: selected === l.key ? l.color : l.bg,
              color: selected === l.key ? 'white' : l.color,
              border: `2px solid ${l.color}`,
              borderRadius: 4,
              cursor: 'pointer',
              textAlign: 'center',
              fontWeight: 600,
              fontSize: 12,
              transition: 'all 0.15s',
            }}
          >
            {l.label} ({l.pct})
          </div>
        ))}
      </div>
      {selected && (() => {
        const l = layers.find(x => x.key === selected)!;
        return (
          <div style={{ background: l.bg, border: `1px solid ${l.color}`, borderRadius: 6, padding: 10, fontSize: 12, color: '#374151' }}>
            {l.desc}
          </div>
        );
      })()}
    </div>
  );
}

function ProviderWrapperDemo() {
  return (
    <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
      <h3 style={{ fontFamily: 'sans-serif', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
        Custom renderWithProviders pattern
      </h3>
      <div style={{ background: '#1e1e2e', color: '#cdd6f4', padding: 14, borderRadius: 6, lineHeight: 1.6 }}>
        <div><span style={{ color: '#89b4fa' }}>function</span> <span style={{ color: '#a6e3a1' }}>renderWithProviders</span>(ui, options = {'{'}{'}'})</div>
        <div>{'  '}<span style={{ color: '#89b4fa' }}>const</span> qc = <span style={{ color: '#a6e3a1' }}>new QueryClient</span>({'{'}</div>
        <div>{'    '}defaultOptions: {'{'} queries: {'{'} retry: <span style={{ color: '#fab387' }}>false</span> {'}'} {'}'}</div>
        <div>{'  '}{'}'})</div>
        <div>{'  '}<span style={{ color: '#89b4fa' }}>return</span> <span style={{ color: '#a6e3a1' }}>render</span>(ui, {'{'}</div>
        <div>{'    '}wrapper: ({'{'} children {'}'}) =&gt; (</div>
        <div>{'      '}&lt;<span style={{ color: '#89dceb' }}>MemoryRouter</span>&gt;</div>
        <div>{'        '}&lt;<span style={{ color: '#89dceb' }}>QueryClientProvider</span> client={'{'}qc{'}'}&gt;</div>
        <div>{'          '}{'{'}children{'}'}</div>
        <div>{'        '}&lt;/<span style={{ color: '#89dceb' }}>QueryClientProvider</span>&gt;</div>
        <div>{'      '}&lt;/<span style={{ color: '#89dceb' }}>MemoryRouter</span>&gt;</div>
        <div>{'    '}),</div>
        <div>{'    '}...options</div>
        <div>{'  '}{'}'}</div>
        <div>{'}'}</div>
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: '#6b7280', fontFamily: 'sans-serif' }}>
        ✅ Fresh QueryClient per test (no cache bleed)<br />
        ✅ MemoryRouter (no real browser URL needed)<br />
        ✅ One wrapper for all providers<br />
        ✅ Works alongside MSW (network intercepted globally)
      </div>
    </div>
  );
}

export { TestingTrophyDemo, ProviderWrapperDemo };

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 12, padding: 20, marginBottom: 14, background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>
      <p style={{ margin: '0 0 12px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#9ca3af' }}>{title}</p>
      {children}
    </div>
  );
}

export default function Demo() {
  return (
    <div>
      <Box title="1. Testing Trophy — where integration tests sit">
        <TestingTrophyDemo />
      </Box>
      <Box title="2. Custom renderWithProviders — the pattern every integration test uses">
        <ProviderWrapperDemo />
      </Box>
    </div>
  );
}
