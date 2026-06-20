// ═══════════════════════════════════════════════════════════════
// DAY 33: HOOK TESTING — useDebounce
// ═══════════════════════════════════════════════════════════════
//
// WHAT IS useDebounce?
//   A hook that delays updating a value until N milliseconds have
//   passed since the LAST change. Classic use case: search inputs —
//   you don't want to fire an API request on every keystroke, only
//   after the user pauses typing.
//
// TESTING CUSTOM HOOKS:
//   Use renderHook() from @testing-library/react.
//   It renders the hook in a minimal React tree so you can call it
//   directly without needing a component wrapper.
//
//   renderHook returns:
//     result        — a ref whose .current holds the hook's return value
//     rerender      — call to re-render with different props
//     unmount       — call to unmount the hook's tree
//
//   result.current — the current return value of the hook.
//     Access this INSIDE assertions (not captured early), because
//     Vitest re-reads .current after state updates settle.
//
// FAKE TIMERS — why and how:
//   useDebounce uses setTimeout internally. Without fake timers,
//   your test would have to actually sleep for 300 ms+ — slow and
//   fragile. Fake timers replace the global timer functions with
//   controllable versions so you can skip time instantly.
//
//   vi.useFakeTimers()           — swap out real timers
//   vi.advanceTimersByTime(300)  — jump 300ms forward
//   vi.runAllTimers()            — run every pending timer
//   vi.useRealTimers()           — restore real timers (in afterEach)
//
// ACT():
//   Any state update inside a React component/hook must be wrapped
//   in act() so React can flush all pending state changes before
//   you assert. Testing Library's renderHook wraps the initial
//   render, but when YOU advance timers (causing setState inside
//   the hook), you must wrap that in act() too.
//
// ═══════════════════════════════════════════════════════════════

import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/hooks/useDebounce';

// Switch to fake timers for the whole suite, restore real ones after each test.
// Putting useFakeTimers in beforeEach (not describe) is safer because Vitest
// runs each test file in isolation but reuses the module registry.
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  // IMPORTANT: Always restore real timers so other test suites aren't affected.
  vi.useRealTimers();
});

describe('useDebounce', () => {
  // ── Test 1: Initial value ──────────────────────────────────────────────
  // The very first render should return whatever value was passed in.
  // No delay — the initial state IS the initial value.
  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));

    // result.current is 'hello' because useState initialises synchronously.
    expect(result.current).toBe('hello');
  });

  // ── Test 2: Value does NOT update before the delay ─────────────────────
  // If we advance time by LESS than the delay, the debounced value should
  // still be the old one. The timeout hasn't fired yet.
  it('does not update value before the delay elapses', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebounce(value, delay),
      { initialProps: { value: 'hello', delay: 300 } }
    );

    // Change the value — this sets a 300ms timer inside the hook.
    rerender({ value: 'world', delay: 300 });

    // Advance only 299ms — timer hasn't fired yet.
    act(() => {
      vi.advanceTimersByTime(299);
    });

    // Still 'hello' — the debounced value hasn't changed.
    expect(result.current).toBe('hello');
  });

  // ── Test 3: Value updates AFTER the delay ──────────────────────────────
  // When we advance time by AT LEAST the delay, the setTimeout callback
  // fires, React calls setState, and result.current reflects the new value.
  it('updates the value after the delay elapses', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebounce(value, delay),
      { initialProps: { value: 'hello', delay: 300 } }
    );

    rerender({ value: 'world', delay: 300 });

    // Advance 300ms — timer fires, React processes the setState call.
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('world');
  });

  // ── Test 4: Rapid changes cancel the previous timer ────────────────────
  // Each new value should restart the debounce timer. If you type three
  // characters quickly, only the LAST value should eventually be committed.
  // This is the core "debounce" behaviour.
  it('cancels the previous timer when value changes rapidly', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } }
    );

    // Rapidly fire three value changes without letting 300ms pass.
    rerender({ value: 'ab' });
    act(() => { vi.advanceTimersByTime(100); }); // 100ms passed, timer reset
    rerender({ value: 'abc' });
    act(() => { vi.advanceTimersByTime(100); }); // another 100ms, timer reset again

    // Only 200ms total — neither earlier timer has fired.
    expect(result.current).toBe('a');

    // Now let 300ms pass from the LAST change.
    act(() => { vi.advanceTimersByTime(300); });

    // Only the final value 'abc' committed — earlier values were cancelled.
    expect(result.current).toBe('abc');
  });

  // ── Test 5: Different delay values work correctly ──────────────────────
  // The delay parameter is respected. A 500ms delay requires 500ms of
  // inactivity, not 300ms.
  it('respects a custom delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebounce(value, delay),
      { initialProps: { value: 'start', delay: 500 } }
    );

    rerender({ value: 'end', delay: 500 });

    // 300ms not enough for a 500ms delay.
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe('start');

    // 200 more ms (total 500ms) — now it fires.
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe('end');
  });

  // ── Test 6: Unmounting cleans up the timer ─────────────────────────────
  // If the component unmounts before the timer fires, the cleanup function
  // returned from useEffect should clearTimeout. Without this, React would
  // try to call setState on an unmounted component — a memory leak warning.
  //
  // We verify this by: setting a new value (starts a timer), then
  // unmounting before the timer fires. The value should NOT update because
  // the timer was cancelled, and no error should be thrown.
  it('cleans up the timer on unmount', () => {
    const { result, rerender, unmount } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 300),
      { initialProps: { value: 'before' } }
    );

    rerender({ value: 'after' });

    // Unmount BEFORE the 300ms timer fires.
    unmount();

    // Advance time past the delay — but because the component unmounted,
    // the timer was cleared so no state update occurs (and no error thrown).
    act(() => { vi.advanceTimersByTime(400); });

    // result.current is still 'before' — state was never updated post-unmount.
    // (In real code, the timer simply doesn't call setState because
    // clearTimeout was called in the cleanup function.)
    expect(result.current).toBe('before');
  });
});
