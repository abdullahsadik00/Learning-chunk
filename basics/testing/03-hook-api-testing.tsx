// ═══════════════════════════════════════════════════════════════
// TESTING 03: HOOK & API TESTING  (Day 33)
// Run tests:   npm test
// Run UI:      npm run test:ui
// ═══════════════════════════════════════════════════════════════
//
// THIS FILE COVERS:
//  1. renderHook — how to test custom hooks in isolation
//  2. act() — when and why you need it
//  3. Testing hooks that use timers (vi.useFakeTimers)
//  4. MSW v2 — Mock Service Worker for network interception
//  5. Testing hooks that fetch data (useFetch)
//  6. waitFor, findBy — async assertion strategies
//  7. Testing error states, loading states, refetch
//
// WHY TEST HOOKS SEPARATELY?
//  Custom hooks encapsulate shared logic (data fetching, local storage,
//  debouncing). If you only test them through components, a component
//  bug can mask a hook bug and vice versa. Testing hooks in isolation
//  gives you precise, fast feedback on the logic itself.
//
// ───────────────────────────────────────────────────────────────

import React, { useState } from 'react';

// ───────────────────────────────────────────────────────────────
// 1. renderHook — the fundamentals
// ───────────────────────────────────────────────────────────────
//
// renderHook(callback, options?) mounts a minimal component that
// calls your hook and exposes the return value.
//
// IMPORT: import { renderHook, act } from '@testing-library/react'
//
// BASIC PATTERN:
//
//   import { renderHook } from '@testing-library/react'
//   import { useCounter } from '@/hooks/useCounter'
//
//   it('initializes with the default value', () => {
//     const { result } = renderHook(() => useCounter(10))
//     //                             ↑ callback is called each render
//     //                               it must return the hook's return value
//     expect(result.current.count).toBe(10)
//     //            ↑ result.current holds the LATEST return value of the hook
//   })
//
// ANATOMY OF result:
//   result.current   — the current return value of your hook
//                      (always access via result.current, not a destructured copy)
//   result.error     — if the hook throws, it's caught here
//
// WHY always result.current, not a local copy?
//   const { count } = result.current   ← WRONG — frozen snapshot
//   result.current.count               ← CORRECT — always reflects latest state
//
//   After an action triggers a state update, result.current.count changes.
//   A locally destructured `count` never updates because it's a primitive copy.
//
// FULL COUNTER HOOK TEST:
//
//   import { renderHook, act } from '@testing-library/react'
//   import { useCounter } from '@/hooks/useCounter'
//
//   describe('useCounter', () => {
//     it('starts at the initial value', () => {
//       const { result } = renderHook(() => useCounter(0))
//       expect(result.current.count).toBe(0)
//     })
//
//     it('increments the count', () => {
//       const { result } = renderHook(() => useCounter(0))
//       act(() => { result.current.increment() })
//       //  ↑ wrap state-triggering calls in act()
//       expect(result.current.count).toBe(1)
//     })
//
//     it('decrements the count', () => {
//       const { result } = renderHook(() => useCounter(5))
//       act(() => { result.current.decrement() })
//       expect(result.current.count).toBe(4)
//     })
//
//     it('resets to initial value', () => {
//       const { result } = renderHook(() => useCounter(10))
//       act(() => { result.current.increment() })
//       act(() => { result.current.reset() })
//       expect(result.current.count).toBe(10)
//     })
//   })
//
// PASSING PROPS (re-renders with new props):
//
//   const { result, rerender } = renderHook(
//     ({ initial }) => useCounter(initial),
//     { initialProps: { initial: 0 } }
//   )
//   expect(result.current.count).toBe(0)
//
//   rerender({ initial: 100 })
//   // Note: rerender doesn't RESET state — the hook re-runs with new args
//   // but existing useState values persist. Only useful for testing
//   // hooks that derive from props, not useState initial values.

// ───────────────────────────────────────────────────────────────
// 2. act() — WHEN and WHY
// ───────────────────────────────────────────────────────────────
//
// React batches state updates and applies them asynchronously.
// act() tells React: "all state updates from this code should be
// flushed before I make assertions."
//
// WITHOUT act():
//   result.current.increment()     // state update queued
//   expect(result.current.count).toBe(1)  // still 0! update not flushed
//
// WITH act():
//   act(() => { result.current.increment() })  // flush + re-render
//   expect(result.current.count).toBe(1)       // ✅ 1
//
// RULES FOR act():
//
//  1. Synchronous state updates → wrap in act()
//     act(() => { result.current.doSomething() })
//
//  2. Async state updates (awaiting a Promise) → await act(async () => {...})
//     await act(async () => { await result.current.fetchData() })
//
//  3. userEvent.click() etc → already wrapped in act() by userEvent
//     no manual act() needed for userEvent
//
//  4. vi.advanceTimersByTime() with fake timers → wrap in act()
//     act(() => { vi.advanceTimersByTime(500) })
//
// HOW TO KNOW YOU NEED act():
//  Vitest/Jest will warn: "Warning: An update to X inside a test was
//  not wrapped in act(...)". That warning = you need act().
//
// SHORTCUT: Testing Library's screen queries and userEvent handle act()
// for you in component tests. You only need manual act() in renderHook tests.

// ───────────────────────────────────────────────────────────────
// 3. TESTING useDebounce WITH FAKE TIMERS
// ───────────────────────────────────────────────────────────────
//
// useDebounce from src/hooks/useDebounce.ts:
//   export function useDebounce<T>(value: T, delay: number): T {
//     const [debounced, setDebounced] = useState(value)
//     useEffect(() => {
//       const timer = setTimeout(() => setDebounced(value), delay)
//       return () => clearTimeout(timer)
//     }, [value, delay])
//     return debounced
//   }
//
// THE CHALLENGE: we can't actually wait 300ms in every test.
// SOLUTION: vi.useFakeTimers() replaces setTimeout with a fake
//           version we control.
//
//   import { renderHook, act } from '@testing-library/react'
//   import { vi } from 'vitest'
//   import { useDebounce } from '@/hooks/useDebounce'
//
//   describe('useDebounce', () => {
//     beforeEach(() => { vi.useFakeTimers() })
//     afterEach(() => { vi.useRealTimers() })
//
//     it('returns the initial value immediately', () => {
//       const { result } = renderHook(() => useDebounce('hello', 300))
//       expect(result.current).toBe('hello')
//     })
//
//     it('does not update before the delay elapses', () => {
//       const { result, rerender } = renderHook(
//         ({ value }) => useDebounce(value, 300),
//         { initialProps: { value: 'initial' } }
//       )
//       rerender({ value: 'updated' })
//       act(() => { vi.advanceTimersByTime(299) })
//       expect(result.current).toBe('initial')  // still old value
//     })
//
//     it('updates after the delay elapses', () => {
//       const { result, rerender } = renderHook(
//         ({ value }) => useDebounce(value, 300),
//         { initialProps: { value: 'initial' } }
//       )
//       rerender({ value: 'updated' })
//       act(() => { vi.advanceTimersByTime(300) })
//       expect(result.current).toBe('updated')  // now updated
//     })
//
//     it('resets timer when value changes before delay', () => {
//       const { result, rerender } = renderHook(
//         ({ value }) => useDebounce(value, 300),
//         { initialProps: { value: 'a' } }
//       )
//       rerender({ value: 'b' })
//       act(() => { vi.advanceTimersByTime(200) }) // 200ms in
//       rerender({ value: 'c' })                   // new value, timer resets
//       act(() => { vi.advanceTimersByTime(200) }) // 400ms total but only 200ms since last change
//       expect(result.current).toBe('a')           // still old — 300ms not elapsed since 'c'
//       act(() => { vi.advanceTimersByTime(100) }) // 300ms since 'c'
//       expect(result.current).toBe('c')           // now updated to 'c' (never saw 'b')
//     })
//   })

// ───────────────────────────────────────────────────────────────
// 4. MSW v2 — MOCK SERVICE WORKER
// ───────────────────────────────────────────────────────────────
//
// MSW intercepts network requests at the fetch/XHR level — NOT by
// mocking the fetch function. This means your code runs unchanged;
// only the network layer is intercepted.
//
// WHY MSW OVER vi.mock('fetch')?
//
//  vi.mock approach:
//    vi.spyOn(global, 'fetch').mockResolvedValue(...)
//    → Mocks the fetch function itself
//    → Doesn't test headers, request body, query params
//    → Breaks if code switches from fetch to axios
//    → Verbose setup per test
//
//  MSW approach:
//    handler intercepts the actual HTTP request
//    → Tests the real fetch/axios call (URL, method, headers, body)
//    → Works for fetch AND axios AND any HTTP library
//    → Central handler file — easy to maintain
//    → Realistic: your code doesn't know it's mocked
//
// MSW v2 SYNTAX (this project uses v2):
//
//   import { http, HttpResponse } from 'msw'
//
//   http.get(url, resolver)    — GET handler
//   http.post(url, resolver)   — POST handler
//   http.put(url, resolver)    — PUT handler
//   http.delete(url, resolver) — DELETE handler
//   http.patch(url, resolver)  — PATCH handler
//   http.all(url, resolver)    — any method
//
// RESOLVER FUNCTION:
//   The resolver receives: { request, params, cookies }
//   - request: the Request object (URL, headers, body)
//   - params: URL path params (e.g. /users/:id → params.id)
//   - cookies: cookie values
//
//   Returns: HttpResponse.json(data, { status: 200 })
//            HttpResponse.text('plain text')
//            HttpResponse.error()          ← network failure (no response)
//
// THIS PROJECT'S MSW SETUP (already configured):
//
//   src/mocks/handlers.ts     — default handler definitions
//   src/mocks/server.ts       — setupServer(...handlers) creates the server
//   src/mocks/setup.ts        — runs before each test file:
//
//     import { server } from './server'
//     beforeAll(() => server.listen())
//     afterEach(() => server.resetHandlers())  ← undo per-test overrides
//     afterAll(() => server.close())
//
// EXISTING HANDLERS (src/mocks/handlers.ts):
//
//   GET  https://jsonplaceholder.typicode.com/todos   → array of todos
//   POST https://jsonplaceholder.typicode.com/todos   → created todo (201)
//   GET  https://jsonplaceholder.typicode.com/users   → array of users
//
// PER-TEST OVERRIDES — use server.use() to override for one test:
//
//   import { http, HttpResponse } from 'msw'
//   import { server } from '@/mocks/server'
//
//   it('handles a 500 error', async () => {
//     server.use(
//       http.get('https://jsonplaceholder.typicode.com/todos', () => {
//         return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })
//       })
//     )
//     // Now when the component calls GET /todos, it gets a 500
//     // After the test, server.resetHandlers() restores the default handler
//   })
//
//   it('handles a network failure (no response)', async () => {
//     server.use(
//       http.get('https://jsonplaceholder.typicode.com/todos', () => {
//         return HttpResponse.error()  // simulates network dropout
//       })
//     )
//     // useFetch will set error: "Failed to fetch" (browser fetch error)
//   })
//
// READING REQUEST BODY IN A POST HANDLER:
//
//   http.post('https://api.example.com/users', async ({ request }) => {
//     const body = await request.json() as { name: string; email: string }
//     return HttpResponse.json({ id: 1, ...body }, { status: 201 })
//   })
//
// READING URL PARAMS:
//
//   http.get('https://api.example.com/users/:id', ({ params }) => {
//     const { id } = params as { id: string }
//     return HttpResponse.json({ id: Number(id), name: 'Alice' })
//   })
//
// READING QUERY STRINGS:
//
//   http.get('https://api.example.com/search', ({ request }) => {
//     const url = new URL(request.url)
//     const q = url.searchParams.get('q')
//     const results = q === 'alice' ? [{ name: 'Alice' }] : []
//     return HttpResponse.json(results)
//   })

// ───────────────────────────────────────────────────────────────
// 5. TESTING useFetch WITH MSW
// ───────────────────────────────────────────────────────────────
//
// useFetch from src/hooks/useFetch.ts:
//   export function useFetch<T>(url: string | null) {
//     const [state, setState] = useState({ data: null, loading: false, error: null })
//     const fetchData = useCallback(async () => {
//       if (!url) return
//       setState({ data: null, loading: true, error: null })
//       try {
//         const res = await fetch(url)
//         if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
//         const data = await res.json()
//         setState({ data, loading: false, error: null })
//       } catch (err) {
//         setState({ data: null, loading: false, error: err.message })
//       }
//     }, [url])
//     useEffect(() => { fetchData() }, [fetchData])
//     return { ...state, refetch: fetchData }
//   }
//
// MSW provides the response, renderHook calls the hook:
//
//   import { renderHook, waitFor } from '@testing-library/react'
//   import { useFetch } from '@/hooks/useFetch'
//
//   type Todo = { id: number; title: string; completed: boolean }
//
//   describe('useFetch', () => {
//     it('starts in a loading state', () => {
//       const { result } = renderHook(() =>
//         useFetch<Todo[]>('https://jsonplaceholder.typicode.com/todos')
//       )
//       // Immediately after render, before the fetch resolves
//       expect(result.current.loading).toBe(true)
//       expect(result.current.data).toBeNull()
//       expect(result.current.error).toBeNull()
//     })
//
//     it('fetches and returns data successfully', async () => {
//       const { result } = renderHook(() =>
//         useFetch<Todo[]>('https://jsonplaceholder.typicode.com/todos')
//       )
//       // MSW returns the mock todos — wait for the state update
//       await waitFor(() => expect(result.current.loading).toBe(false))
//
//       expect(result.current.data).toHaveLength(3)
//       expect(result.current.data?.[0]).toEqual({
//         id: 1, userId: 1, title: 'Buy groceries', completed: false
//       })
//       expect(result.current.error).toBeNull()
//     })
//
//     it('sets error when the server returns 500', async () => {
//       server.use(
//         http.get('https://jsonplaceholder.typicode.com/todos', () =>
//           HttpResponse.json({ message: 'Error' }, { status: 500 })
//         )
//       )
//       const { result } = renderHook(() =>
//         useFetch<Todo[]>('https://jsonplaceholder.typicode.com/todos')
//       )
//       await waitFor(() => expect(result.current.loading).toBe(false))
//
//       expect(result.current.data).toBeNull()
//       expect(result.current.error).toBe('HTTP 500: Internal Server Error')
//     })
//
//     it('sets error on network failure', async () => {
//       server.use(
//         http.get('https://jsonplaceholder.typicode.com/todos', () =>
//           HttpResponse.error()
//         )
//       )
//       const { result } = renderHook(() =>
//         useFetch<Todo[]>('https://jsonplaceholder.typicode.com/todos')
//       )
//       await waitFor(() => expect(result.current.loading).toBe(false))
//       expect(result.current.error).not.toBeNull()
//     })
//
//     it('does not fetch when url is null', () => {
//       const { result } = renderHook(() => useFetch<Todo[]>(null))
//       // loading stays false because the early return fires
//       expect(result.current.loading).toBe(false)
//       expect(result.current.data).toBeNull()
//     })
//
//     it('refetches when refetch() is called', async () => {
//       const { result } = renderHook(() =>
//         useFetch<Todo[]>('https://jsonplaceholder.typicode.com/todos')
//       )
//       await waitFor(() => expect(result.current.loading).toBe(false))
//       const firstData = result.current.data
//
//       await act(async () => { await result.current.refetch() })
//       await waitFor(() => expect(result.current.loading).toBe(false))
//       // Same data (same MSW handler) — but refetch was called
//       expect(result.current.data).toEqual(firstData)
//     })
//   })

// ───────────────────────────────────────────────────────────────
// 6. TESTING useLocalStorage
// ───────────────────────────────────────────────────────────────
//
// useLocalStorage from src/hooks/useLocalStorage.ts:
//   Returns [value, setValue, removeValue]
//   Reads from localStorage on init (lazy initializer)
//   Writes JSON to localStorage on setValue
//   Removes key on removeValue
//
// IMPORTANT: localStorage persists between tests in jsdom!
// You MUST clear it in beforeEach or afterEach.
//
//   import { renderHook, act } from '@testing-library/react'
//   import { useLocalStorage } from '@/hooks/useLocalStorage'
//
//   describe('useLocalStorage', () => {
//     beforeEach(() => { localStorage.clear() })
//
//     it('initializes with the provided default value when key is missing', () => {
//       const { result } = renderHook(() => useLocalStorage('theme', 'light'))
//       expect(result.current[0]).toBe('light')
//     })
//
//     it('reads an existing value from localStorage', () => {
//       localStorage.setItem('theme', JSON.stringify('dark'))
//       const { result } = renderHook(() => useLocalStorage('theme', 'light'))
//       expect(result.current[0]).toBe('dark')  // reads persisted value
//     })
//
//     it('writes the new value to localStorage when setValue is called', () => {
//       const { result } = renderHook(() => useLocalStorage('theme', 'light'))
//       act(() => { result.current[1]('dark') })
//       expect(result.current[0]).toBe('dark')
//       expect(JSON.parse(localStorage.getItem('theme')!)).toBe('dark')
//     })
//
//     it('removes the key from localStorage on removeValue', () => {
//       const { result } = renderHook(() => useLocalStorage('theme', 'light'))
//       act(() => { result.current[1]('dark') })   // set it
//       act(() => { result.current[2]() })           // remove it
//       expect(result.current[0]).toBe('light')      // back to default
//       expect(localStorage.getItem('theme')).toBeNull()
//     })
//
//     it('works with objects (serializes/deserializes JSON)', () => {
//       const defaultUser = { name: '', role: 'guest' }
//       const { result } = renderHook(() => useLocalStorage('user', defaultUser))
//       act(() => { result.current[1]({ name: 'Alice', role: 'admin' }) })
//       expect(result.current[0]).toEqual({ name: 'Alice', role: 'admin' })
//       expect(JSON.parse(localStorage.getItem('user')!)).toEqual({ name: 'Alice', role: 'admin' })
//     })
//
//     it('handles corrupted localStorage gracefully', () => {
//       localStorage.setItem('pref', 'not-json-{{{')  // invalid JSON
//       const { result } = renderHook(() => useLocalStorage('pref', 42))
//       expect(result.current[0]).toBe(42)  // falls back to default
//     })
//   })

// ───────────────────────────────────────────────────────────────
// 7. waitFor DEEP DIVE
// ───────────────────────────────────────────────────────────────
//
// waitFor(fn, options?) — polls fn every interval ms until it
// stops throwing AssertionError, or times out.
//
// SIGNATURE:
//   await waitFor(
//     () => { expect(something).toBeTrue() },
//     {
//       timeout: 1000,    // max wait time (default: 1000ms)
//       interval: 50,     // polling interval (default: 50ms)
//     }
//   )
//
// WHAT HAPPENS UNDER THE HOOD:
//   1. Run fn immediately
//   2. If fn throws → wait `interval` ms → try again
//   3. If fn passes (no throw) → waitFor resolves
//   4. If timeout reached before fn passes → waitFor rejects with
//      the last thrown error (shows you the final assertion failure)
//
// COMMON PATTERNS:
//
//   // Wait for loading to finish:
//   await waitFor(() => expect(result.current.loading).toBe(false))
//
//   // Wait for data to arrive:
//   await waitFor(() => {
//     expect(result.current.data).not.toBeNull()
//     expect(result.current.data).toHaveLength(3)
//   })
//
//   // Wait for an error to be set:
//   await waitFor(() => expect(result.current.error).toMatch(/500/))
//
// DO NOT DO THIS (antipattern):
//   ❌ await waitFor(() => {})   // always passes immediately — pointless
//   ❌ await new Promise(r => setTimeout(r, 100))  // arbitrary sleep — fragile
//
// findBy* IS SHORTHAND FOR waitFor + getBy:
//   await screen.findByText('Loaded!')
//   // ← same as: await waitFor(() => screen.getByText('Loaded!'))
//
// PREFER findBy* for element presence, waitFor for assertions on state/data.

// ───────────────────────────────────────────────────────────────
// 8. WRAPPING HOOKS WITH PROVIDERS
// ───────────────────────────────────────────────────────────────
//
// If your hook uses useContext(), useNavigate(), or any hook from a provider,
// renderHook needs the provider in its render tree.
//
// Option A: wrapper option
//
//   const wrapper = ({ children }: { children: React.ReactNode }) => (
//     <AuthContext.Provider value={{ user: mockUser, logout: vi.fn() }}>
//       {children}
//     </AuthContext.Provider>
//   )
//   const { result } = renderHook(() => useAuth(), { wrapper })
//
// Option B: React Query wrapper (needed for hooks using useQuery/useMutation)
//
//   import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
//
//   function createQueryWrapper() {
//     const queryClient = new QueryClient({
//       defaultOptions: { queries: { retry: false } }
//     })
//     return ({ children }: { children: React.ReactNode }) => (
//       <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
//     )
//   }
//
//   const { result } = renderHook(() => useUsers(), { wrapper: createQueryWrapper() })
//   //                                                        ↑ fresh QueryClient per test
//   //                                                          avoids cached state bleeding
//   //                                                          between tests
//
// WHY a fresh QueryClient per test?
//   React Query caches query results. If test A fetches /users and caches the
//   result, test B that overrides the MSW handler still gets the cached
//   data from test A. A fresh QueryClient means an empty cache each time.

// ───────────────────────────────────────────────────────────────
// PRACTICE EXERCISES
// ───────────────────────────────────────────────────────────────
//
// EXERCISE 1: What's wrong with this hook test?
//
//   it('increments the counter', () => {
//     const { result } = renderHook(() => useCounter(0))
//     result.current.increment()           // ❌ missing act()
//     expect(result.current.count).toBe(1) // might be 0 or cause a warning
//   })
//
//   Fix: act(() => { result.current.increment() })
//
// EXERCISE 2: When do you use waitFor vs findBy?
//
//   waitFor(() => expect(result.current.data).toBeTruthy())
//   → Use for hook state (no DOM element to query)
//
//   await screen.findByText('Loaded!')
//   → Use for DOM elements (cleaner syntax, same effect)
//
//   Both poll until the assertion passes. findBy* is syntactic sugar
//   over waitFor when you're looking for an element.
//
// EXERCISE 3: Write a test for a hook that uses POST
//
//   // Assume a useCreateTodo hook that calls POST /todos
//   it('creates a todo and updates state', async () => {
//     const { result } = renderHook(() => useCreateTodo())
//     await act(async () => {
//       await result.current.createTodo({ title: 'New task' })
//     })
//     expect(result.current.lastCreated).toEqual(
//       expect.objectContaining({ title: 'New task', id: 201 })
//     )
//   })
//   // MSW handler already handles POST /todos → returns { id: 201, ... }
//
// EXERCISE 4: Test useDebounce — the timer reset case (most common interview question)
//
//   it('resets the timer when value changes rapidly', () => {
//     vi.useFakeTimers()
//     const { result, rerender } = renderHook(
//       ({ v }) => useDebounce(v, 500),
//       { initialProps: { v: 'a' } }
//     )
//     rerender({ v: 'ab' })
//     act(() => { vi.advanceTimersByTime(400) }) // 400ms, not debounced yet
//     rerender({ v: 'abc' })                     // restart timer
//     act(() => { vi.advanceTimersByTime(400) }) // 400ms from 'abc', not yet
//     expect(result.current).toBe('a')           // still original
//     act(() => { vi.advanceTimersByTime(100) }) // 500ms from 'abc'
//     expect(result.current).toBe('abc')         // final value
//     vi.useRealTimers()
//   })
//
// EXERCISE 5: MSW — how to test a 401 Unauthorized response
//
//   it('sets an auth error on 401', async () => {
//     server.use(
//       http.get('https://jsonplaceholder.typicode.com/todos', () =>
//         HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
//       )
//     )
//     const { result } = renderHook(() =>
//       useFetch('https://jsonplaceholder.typicode.com/todos')
//     )
//     await waitFor(() => expect(result.current.loading).toBe(false))
//     expect(result.current.error).toBe('HTTP 401: Unauthorized')
//   })
//   // server.resetHandlers() in afterEach (already set up in setup.ts) undoes this

// ───────────────────────────────────────────────────────────────
// LIVE DEMO
// ───────────────────────────────────────────────────────────────

// Visualize how renderHook works conceptually
function RenderHookConceptDemo() {
  const [step, setStep] = useState(0);
  const [hookValue, setHookValue] = useState(0);

  const steps = [
    { label: 'renderHook(() => useCounter(0))', desc: 'A minimal component is mounted. The hook runs with initial value 0.', value: 0 },
    { label: 'result.current.count → 0', desc: 'We read result.current — it reflects the hook\'s current return value.', value: 0 },
    { label: 'act(() => result.current.increment())', desc: 'We call increment() wrapped in act(). React flushes all state updates.', value: 1 },
    { label: 'result.current.count → 1', desc: 'result.current now reflects the NEW return value after the re-render.', value: 1 },
    { label: 'act(() => result.current.reset())', desc: 'reset() is called inside act(). Hook returns to initial value.', value: 0 },
    { label: 'result.current.count → 0', desc: 'Back to 0. The test would now expect(result.current.count).toBe(0) ✅', value: 0 },
  ];

  const current = steps[step];

  return (
    <div style={{ fontFamily: 'monospace', fontSize: 13 }}>
      <h3 style={{ fontFamily: 'sans-serif', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
        How renderHook works — step through the lifecycle
      </h3>
      <div style={{ background: '#1e1e2e', color: '#cdd6f4', padding: 12, borderRadius: 6, marginBottom: 10 }}>
        <span style={{ color: '#89b4fa' }}>{current.label}</span>
      </div>
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: 10, marginBottom: 10, fontSize: 12 }}>
        <span style={{ fontFamily: 'sans-serif' }}>{current.desc}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{ fontFamily: 'sans-serif', fontSize: 12, color: '#6b7280' }}>result.current.count:</span>
        <span style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>{hookValue}</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => { if (step > 0) { setStep(s => s - 1); setHookValue(steps[step - 1].value); } }}
          disabled={step === 0}
          style={{ padding: '4px 12px', cursor: step === 0 ? 'not-allowed' : 'pointer' }}
        >
          ← Previous
        </button>
        <button
          onClick={() => { if (step < steps.length - 1) { setStep(s => s + 1); setHookValue(steps[step + 1].value); } }}
          disabled={step === steps.length - 1}
          style={{ padding: '4px 12px', cursor: step === steps.length - 1 ? 'not-allowed' : 'pointer' }}
        >
          Next →
        </button>
        <span style={{ fontFamily: 'sans-serif', fontSize: 11, color: '#9ca3af', alignSelf: 'center' }}>
          Step {step + 1} / {steps.length}
        </span>
      </div>
    </div>
  );
}

function MSWFlowDemo() {
  const rows = [
    ['1', 'Test renders component/hook', '–'],
    ['2', 'Code calls fetch(url)', '–'],
    ['3', 'MSW intercepts the request', '👁️ intercepted'],
    ['4', 'MSW handler returns HttpResponse.json(data)', '→ mock response'],
    ['5', 'fetch() receives the mock response', '✅ resolved'],
    ['6', 'State updates with the data', '–'],
    ['7', 'waitFor / findBy confirms the update', '✅ asserted'],
  ];
  return (
    <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
      <h3 style={{ fontFamily: 'sans-serif', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
        MSW v2 request flow
      </h3>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={{ padding: '5px 10px', textAlign: 'left', border: '1px solid #e5e7eb' }}>#</th>
            <th style={{ padding: '5px 10px', textAlign: 'left', border: '1px solid #e5e7eb' }}>What happens</th>
            <th style={{ padding: '5px 10px', textAlign: 'left', border: '1px solid #e5e7eb' }}>MSW role</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([n, what, msw]) => (
            <tr key={n}>
              <td style={{ padding: '5px 10px', border: '1px solid #e5e7eb', color: '#6b7280' }}>{n}</td>
              <td style={{ padding: '5px 10px', border: '1px solid #e5e7eb' }}>{what}</td>
              <td style={{ padding: '5px 10px', border: '1px solid #e5e7eb', color: msw.startsWith('✅') ? '#16a34a' : msw.startsWith('👁') ? '#7c3aed' : msw === '–' ? '#d1d5db' : '#2563eb' }}>{msw}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { RenderHookConceptDemo, MSWFlowDemo };

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
      <Box title="1. renderHook lifecycle — step through it">
        <RenderHookConceptDemo />
      </Box>
      <Box title="2. MSW v2 request interception flow">
        <MSWFlowDemo />
      </Box>
    </div>
  );
}
