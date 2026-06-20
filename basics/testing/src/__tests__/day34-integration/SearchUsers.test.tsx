// ═══════════════════════════════════════════════════════════════
// DAY 34: INTEGRATION TESTING — Debounced Search with MSW
// ═══════════════════════════════════════════════════════════════
//
// WHAT IS SearchBox?
//   A search input that:
//     1. Debounces the query by 300ms (avoids firing on every keystroke).
//     2. Fires a fetch only when the debounced query is ≥ 2 characters.
//     3. Filters the returned users by name or email client-side.
//     4. Shows loading / error / results / no-results states.
//
// THE CHALLENGE — fake timers with userEvent:
//
//   userEvent v14 is built entirely on async/await and uses native
//   Promises + queueMicrotask internally. When you call
//   vi.useFakeTimers(), it replaces setTimeout/setInterval but
//   NOT Promises/microtasks. This means:
//
//     userEvent.type(input, 'abc')  →  awaiting this call can DEADLOCK
//     because userEvent queues microtasks between each keystroke, and
//     in some fake-timer modes those don't flush automatically.
//
//   SOLUTION: use fireEvent (synchronous DOM events) for typing, and
//   reserve userEvent for click/focus interactions where the async
//   behaviour doesn't conflict. fireEvent.change() fires the React
//   synthetic onChange synchronously — perfect when you control time.
//
//   Pattern used in this file:
//     1. fireEvent.change(input, { target: { value: 'al' } })
//        — updates the input value synchronously, triggers onChange
//     2. act(() => { vi.advanceTimersByTime(300); })
//        — advances fake time so the debounce setTimeout fires
//        — React processes the resulting setState in the same act()
//     3. await waitFor(() => expect(el).toBeInTheDocument())
//        — polls until the async fetch (MSW) resolves and DOM updates
//
// WHY NOT ALWAYS USE fireEvent?
//   fireEvent skips browser-realistic behaviour (focus events, pointer
//   events, accessibility announcements). For most typing tests it's
//   fine. Use userEvent when you need realistic event sequences
//   (e.g., testing that a button is only clickable when focused).
//
// ═══════════════════════════════════════════════════════════════

import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { SearchBox } from '@/components/SearchBox';

// MSW handlers.ts already defines:
//   GET /users → [{ id:1, name:'Alice Chen', email:'alice@example.com' },
//                  { id:2, name:'Bob Smith',  email:'bob@example.com'  }]

describe('SearchBox — debounced search integration tests', () => {
  // Set up fake timers before each test; restore after.
  // We use fake timers because SearchBox uses useDebounce which relies on
  // setTimeout — we want to control exactly when the debounce fires.
  //
  // shouldAdvanceTime: true — this is the critical option that makes
  // waitFor() work correctly alongside fake timers.
  //
  // Without it: waitFor() uses setInterval internally to poll. With
  // pure fake timers those intervals NEVER fire (you'd have to advance
  // them manually), so waitFor deadlocks and times out.
  //
  // With shouldAdvanceTime: true: Vitest auto-advances fake time in
  // real-time as wall-clock ticks. So waitFor's internal polling still
  // works (real time passes), while vi.advanceTimersByTime() lets us
  // jump the debounce timer forward instantly.
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Helper: simulate typing into an input using fireEvent.
  // fireEvent.change is synchronous — it fires React's onChange handler
  // immediately without any async indirection.
  function typeIntoInput(input: HTMLElement, value: string) {
    fireEvent.change(input, { target: { value } });
  }

  // ── Test 1: Nothing rendered initially ────────────────────────────────
  // Before the user types anything, no results list, loading, or error
  // should be visible. The input is empty and query length is 0 < 2.
  it('shows only the input on initial render', () => {
    render(<SearchBox />);

    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('results')).not.toBeInTheDocument();
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
  });

  // ── Test 2: No fetch for queries shorter than 2 chars ─────────────────
  // SearchBox only sets url when debouncedQuery.length >= 2.
  // A single character should not trigger a fetch even after 300ms.
  it('does not fetch when query is shorter than 2 characters', () => {
    render(<SearchBox />);

    typeIntoInput(screen.getByTestId('search-input'), 'a');

    act(() => { vi.advanceTimersByTime(300); });

    // No results, no loading, no error — the hook received url: null.
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('results')).not.toBeInTheDocument();
  });

  // ── Test 3: Shows loading after debounce fires ─────────────────────────
  // When query length >= 2 and 300ms have passed, the url prop becomes
  // non-null and useFetch starts the request — loading appears.
  it('shows loading indicator after debounce fires for a valid query', () => {
    render(<SearchBox />);

    typeIntoInput(screen.getByTestId('search-input'), 'al');

    // Advance past the 300ms debounce — this triggers useFetch to fire.
    act(() => { vi.advanceTimersByTime(300); });

    // Loading should be visible while the fetch is in flight.
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  // ── Test 4: Shows matching results ────────────────────────────────────
  // After MSW responds, the filtered list should appear. 'al' matches
  // "Alice Chen" (name) and "alice@example.com" (email) but not "Bob Smith".
  it('shows filtered results that match the search query', async () => {
    render(<SearchBox />);

    typeIntoInput(screen.getByTestId('search-input'), 'al');

    // 1. Advance fake time — triggers the debounce timeout → useFetch starts.
    act(() => { vi.advanceTimersByTime(300); });

    // 2. Wait for MSW to respond and React to update the DOM.
    //    waitFor polls using real microtasks (safe even with fake timers).
    await waitFor(() => {
      expect(screen.getByTestId('results')).toBeInTheDocument();
    });

    // Alice matches — should be visible.
    expect(screen.getByTestId('user-1')).toBeInTheDocument();
    expect(screen.getByText(/Alice Chen/)).toBeInTheDocument();

    // Bob does not match 'al' — should NOT be in results.
    expect(screen.queryByTestId('user-2')).not.toBeInTheDocument();
  });

  // ── Test 5: Shows all results when query matches all users ─────────────
  // 'bo' matches Bob Smith by name. '@e' matches both users by email domain.
  it('shows multiple results when the query matches multiple users', async () => {
    render(<SearchBox />);

    // '@e' appears in both alice@example.com and bob@example.com.
    typeIntoInput(screen.getByTestId('search-input'), '@e');
    act(() => { vi.advanceTimersByTime(300); });

    await waitFor(() => {
      expect(screen.getByTestId('results')).toBeInTheDocument();
    });

    expect(screen.getByTestId('user-1')).toBeInTheDocument();
    expect(screen.getByTestId('user-2')).toBeInTheDocument();
  });

  // ── Test 6: Shows no-results message when nothing matches ─────────────
  // 'xyz' doesn't match any name or email — SearchBox renders the
  // "No users found" placeholder inside the results list.
  it('shows a no-results message when no users match the query', async () => {
    render(<SearchBox />);

    typeIntoInput(screen.getByTestId('search-input'), 'xyz');
    act(() => { vi.advanceTimersByTime(300); });

    await waitFor(() => {
      expect(screen.getByTestId('results')).toBeInTheDocument();
    });

    expect(screen.getByTestId('no-results')).toBeInTheDocument();
    expect(screen.getByText('No users found')).toBeInTheDocument();
  });

  // ── Test 7: Shows error when the API fails ────────────────────────────
  // Override the /users handler to return a 503. After the debounce fires,
  // useFetch should catch the error and SearchBox should show [data-testid=error].
  it('shows an error message when the users API fails', async () => {
    server.use(
      http.get('https://jsonplaceholder.typicode.com/users', () => {
        return new HttpResponse(null, { status: 503, statusText: 'Service Unavailable' });
      })
    );

    render(<SearchBox />);

    typeIntoInput(screen.getByTestId('search-input'), 'bo');
    act(() => { vi.advanceTimersByTime(300); });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('results')).not.toBeInTheDocument();
  });

  // ── Test 8: Rapid typing cancels earlier debounces ────────────────────
  // Typing changes the query multiple times; only the LAST value after
  // 300ms of inactivity should trigger a fetch.
  // This demonstrates the core debounce behaviour in an integration context.
  it('only fetches for the final value after rapid typing', async () => {
    render(<SearchBox />);
    const input = screen.getByTestId('search-input');

    // Type 'bo' (each change fires synchronously via fireEvent).
    typeIntoInput(input, 'b');
    act(() => { vi.advanceTimersByTime(100); }); // 100ms — timer reset

    typeIntoInput(input, 'bo');
    act(() => { vi.advanceTimersByTime(100); }); // another 100ms — timer reset

    // Total 200ms — debounce hasn't fired yet.
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();

    // Now let 300ms pass from the LAST change — debounce fires for 'bo'.
    act(() => { vi.advanceTimersByTime(300); });

    expect(screen.getByTestId('loading')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('results')).toBeInTheDocument();
    });

    // 'bo' matches Bob Smith by name.
    expect(screen.getByTestId('user-2')).toBeInTheDocument();
  });

  // ── Test 9: Results disappear when input is cleared ───────────────────
  // After getting results, if the user clears the input back to < 2 chars,
  // the results list should be hidden (url goes back to null).
  it('hides results when the query is cleared below 2 characters', async () => {
    render(<SearchBox />);
    const input = screen.getByTestId('search-input');

    // First, get some results.
    typeIntoInput(input, 'bo');
    act(() => { vi.advanceTimersByTime(300); });
    await waitFor(() => {
      expect(screen.getByTestId('results')).toBeInTheDocument();
    });

    // Now clear the input.
    typeIntoInput(input, '');
    act(() => { vi.advanceTimersByTime(300); });

    // Results should be gone — query is now empty (< 2 chars),
    // so url becomes null, and SearchBox hides the results block.
    expect(screen.queryByTestId('results')).not.toBeInTheDocument();
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });

  // ── Test 10: Click interaction still works with fake timers ───────────
  // This demonstrates using userEvent for click events (safe with fake timers)
  // while using fireEvent for typing (avoids the async deadlock issue).
  it('allows click interactions alongside fake timers', async () => {
    render(<SearchBox />);
    const input = screen.getByTestId('search-input');

    // Focus the input via userEvent click (safe — click is one synchronous event).
    await userEvent.click(input);

    // Type via fireEvent to avoid async deadlock.
    typeIntoInput(input, 'al');
    act(() => { vi.advanceTimersByTime(300); });

    await waitFor(() => {
      expect(screen.getByTestId('results')).toBeInTheDocument();
    });

    expect(screen.getByTestId('user-1')).toBeInTheDocument();
  });
});
