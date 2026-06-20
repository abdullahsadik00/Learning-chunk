// ═══════════════════════════════════════════════════════════════
// DAY 33: API TESTING WITH MSW — useFetch
// ═══════════════════════════════════════════════════════════════
//
// WHAT IS useFetch?
//   A generic hook that wraps the Fetch API into React state:
//   { data, loading, error, refetch }.
//   It fires automatically when the url prop changes, and exposes
//   a refetch() function to trigger a manual reload.
//
// MOCK SERVICE WORKER (MSW) — the right way to mock HTTP:
//
//   Option A (naive): vi.mock('node-fetch') or vi.spyOn(global, 'fetch')
//     — Brittle. You're mocking the implementation of HOW fetching
//       is done, not WHAT the server responds with.
//     — Easy to accidentally mock the wrong thing.
//     — Tests break if you swap fetch() for axios.
//
//   Option B (MSW): intercept at the network level.
//     — MSW sets up a fake HTTP server that intercepts fetch/XHR
//       BEFORE it leaves the process (using Node's http module
//       internals in test environments, or a Service Worker in browsers).
//     — Your code calls fetch() for real — it just gets intercepted.
//     — Tests survive if you change the HTTP library.
//     — Handlers are reusable for dev (browser) and test (Node).
//
// MSW setup (already in src/mocks/setup.ts):
//   beforeAll  → server.listen()          start intercepting
//   afterEach  → server.resetHandlers()   clear per-test overrides
//   afterAll   → server.close()           stop intercepting
//
// PER-TEST OVERRIDES with server.use():
//   server.use(http.get('/api/foo', () => HttpResponse.error()))
//   — adds a handler that ONLY applies for this test.
//   — afterEach server.resetHandlers() removes it automatically.
//   Use this to simulate failures without affecting other tests.
//
// ASYNC TESTING PATTERNS:
//
//   waitFor(() => expect(...))
//     — Polls the assertion until it passes or times out.
//     — Use for anything that updates asynchronously (fetch, timers).
//
//   act(() => { ... })
//     — Wraps code that triggers React state updates.
//     — renderHook's initial render is already wrapped by act.
//     — You need it when YOU cause a state change (e.g., calling refetch()).
//
// ═══════════════════════════════════════════════════════════════

import { renderHook, act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { useFetch } from '@/hooks/useFetch';

// The MSW server is already started/reset/stopped by src/mocks/setup.ts.
// No need to call server.listen() here.

describe('useFetch', () => {
  // ── Test 1: Initial state ──────────────────────────────────────────────
  // When the hook first renders with a URL, it should immediately enter
  // loading state before the fetch completes.
  //
  // Note: We check loading BEFORE awaiting, because the first render
  // sets loading: true synchronously inside the useEffect. By the time
  // waitFor resolves, loading would be false (fetch done). So we capture
  // the initial state right after renderHook returns.
  it('starts with loading: true and data: null', () => {
    // We render but don't await anything — we want the INITIAL state.
    const { result } = renderHook(() =>
      useFetch<{ id: number }[]>('https://jsonplaceholder.typicode.com/todos')
    );

    // IMMEDIATELY after rendering, loading should be true (fetch in flight).
    // (The useEffect fires, sets loading: true, then the async fetch begins.)
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  // ── Test 2: Successful fetch populates data ────────────────────────────
  // After the MSW handler responds, the hook should move from
  // { loading: true } to { loading: false, data: [...] }.
  it('populates data and clears loading on a successful fetch', async () => {
    const { result } = renderHook(() =>
      useFetch<{ id: number; title: string; completed: boolean; userId: number }[]>(
        'https://jsonplaceholder.typicode.com/todos'
      )
    );

    // waitFor polls until the assertion passes — handles async state updates.
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // The MSW handler in handlers.ts returns 3 todos.
    expect(result.current.data).toHaveLength(3);
    expect(result.current.error).toBeNull();

    // Spot-check the first item structure matches our handler's mock data.
    expect(result.current.data![0]).toMatchObject({
      id: 1,
      title: 'Buy groceries',
      completed: false,
    });
  });

  // ── Test 3: Error state when request fails ─────────────────────────────
  // MSW lets us override handlers PER TEST. Here we force a network error
  // to verify the hook correctly populates error state.
  //
  // HttpResponse.error() simulates a network failure (like being offline),
  // not an HTTP error status. The fetch() promise REJECTS (doesn't resolve).
  it('sets error state when the request fails', async () => {
    // Override the todos handler for THIS test only to return a network error.
    // afterEach server.resetHandlers() in setup.ts removes this override.
    server.use(
      http.get('https://jsonplaceholder.typicode.com/todos', () => {
        return HttpResponse.error();
      })
    );

    const { result } = renderHook(() =>
      useFetch<unknown[]>('https://jsonplaceholder.typicode.com/todos')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // error should be set; data should be null.
    expect(result.current.error).not.toBeNull();
    expect(result.current.data).toBeNull();
  });

  // ── Test 4: HTTP 4xx/5xx status sets error ────────────────────────────
  // A 500 response is not a network error — fetch() resolves with a
  // Response whose .ok property is false. Our hook checks res.ok and
  // throws manually, which should end up in the catch block.
  it('sets an error for non-ok HTTP status codes', async () => {
    server.use(
      http.get('https://jsonplaceholder.typicode.com/todos', () => {
        return new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' });
      })
    );

    const { result } = renderHook(() =>
      useFetch<unknown[]>('https://jsonplaceholder.typicode.com/todos')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toMatch(/HTTP 500/);
    expect(result.current.data).toBeNull();
  });

  // ── Test 5: null URL prevents any fetch ───────────────────────────────
  // When url is null, the hook should NOT fire. State stays at the
  // initial idle state: { data: null, loading: false, error: null }.
  // This is used by SearchBox to avoid fetching when the query is too short.
  it('does not fetch when url is null', async () => {
    const { result } = renderHook(() => useFetch<unknown[]>(null));

    // Give React a tick to run effects.
    await act(async () => {
      await Promise.resolve();
    });

    // Nothing should have changed — no fetch was attempted.
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  // ── Test 6: refetch() triggers a new request ──────────────────────────
  // The hook exposes a refetch() function. Calling it should re-fire
  // the fetch, going through loading → success again.
  it('re-fetches data when refetch() is called', async () => {
    const { result } = renderHook(() =>
      useFetch<{ id: number; title: string; completed: boolean; userId: number }[]>(
        'https://jsonplaceholder.typicode.com/todos'
      )
    );

    // Wait for the initial fetch to complete.
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toHaveLength(3);

    // Call refetch() — this should trigger another request.
    // We wrap in act() because it triggers state updates (loading: true → false).
    act(() => {
      result.current.refetch();
    });

    // Immediately after calling refetch, loading should be true again.
    expect(result.current.loading).toBe(true);

    // Wait for the second fetch to complete.
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Data should still be there (same MSW handler responds).
    expect(result.current.data).toHaveLength(3);
  });

  // ── Test 7: URL change triggers a new fetch ────────────────────────────
  // When the url prop changes (e.g., user navigates), the hook should
  // automatically cancel the old fetch and start a new one.
  it('fetches new data when the url changes', async () => {
    const { result, rerender } = renderHook(
      ({ url }: { url: string }) => useFetch<unknown[]>(url),
      { initialProps: { url: 'https://jsonplaceholder.typicode.com/todos' } }
    );

    // Wait for the initial fetch (todos).
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toHaveLength(3); // 3 todos from handler

    // Change to the users endpoint — the MSW users handler returns 2 users.
    rerender({ url: 'https://jsonplaceholder.typicode.com/users' });

    // Should enter loading state again.
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toHaveLength(2); // 2 users from handler
  });
});
