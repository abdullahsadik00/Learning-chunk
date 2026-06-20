// ═══════════════════════════════════════════════════════════════
// DAY 33: HOOK TESTING — useLocalStorage
// ═══════════════════════════════════════════════════════════════
//
// WHAT IS useLocalStorage?
//   A hook that wraps useState and keeps it in sync with
//   localStorage. On first render it reads any saved value; on
//   update it both sets state AND writes to localStorage.
//   Returns [value, setValue, removeValue].
//
// WHY DOES localStorage WORK IN VITEST?
//   Vitest (with environment: 'jsdom') provides a full browser-like
//   environment including window, document, and localStorage.
//   jsdom's localStorage is an in-memory store — no files on disk —
//   so it's fast and safe for tests.
//
// ISOLATION BETWEEN TESTS:
//   Because localStorage persists across tests in the same file,
//   you MUST clear it between tests. Two strategies:
//
//   Strategy 1 (simple): localStorage.clear() in afterEach.
//     Use this for most tests — simple and direct.
//
//   Strategy 2 (spy): vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(...)
//     Use when you want to simulate localStorage FAILURES (e.g.,
//     JSON.parse errors, quota exceeded, security errors in private browsing).
//     The spy replaces the real method with your mock temporarily.
//
// RENDEROOK PATTERN:
//   renderHook takes a callback that calls the hook.
//   To change the key between tests, just use a different key string
//   rather than rerendering with new props — each test is isolated.
//
// ═══════════════════════════════════════════════════════════════

import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

// Clear localStorage after every test to prevent state leakage.
// Without this, a test that writes 'theme' = 'dark' would cause
// the next test reading 'theme' to see 'dark' instead of its
// own initialValue — silent, hard-to-debug failures.
afterEach(() => {
  localStorage.clear();
});

describe('useLocalStorage', () => {
  // ── Test 1: Uses initialValue when localStorage is empty ──────────────
  // On a fresh key that has never been written, the hook should behave
  // exactly like useState with the initial value.
  it('returns initialValue when localStorage has no entry for that key', () => {
    const { result } = renderHook(() => useLocalStorage('theme', 'light'));

    // result.current is a tuple: [value, setValue, removeValue]
    const [value] = result.current;
    expect(value).toBe('light');
  });

  // ── Test 2: Reads existing value from localStorage ─────────────────────
  // If another part of the app previously wrote a value, the hook should
  // hydrate from localStorage instead of using initialValue.
  it('reads an existing value from localStorage on mount', () => {
    // Pre-populate localStorage BEFORE the hook renders.
    localStorage.setItem('theme', JSON.stringify('dark'));

    const { result } = renderHook(() => useLocalStorage('theme', 'light'));

    const [value] = result.current;
    // 'dark' was in storage, so we get 'dark' — not 'light' (the initial).
    expect(value).toBe('dark');
  });

  // ── Test 3: setValue updates both state and localStorage ───────────────
  // When you call setValue, the React state should update (re-render)
  // AND localStorage should persist the new value.
  it('updates state and persists to localStorage when setValue is called', () => {
    const { result } = renderHook(() => useLocalStorage('theme', 'light'));

    act(() => {
      const [, setValue] = result.current;
      setValue('dark');
    });

    // Check that state updated.
    const [value] = result.current;
    expect(value).toBe('dark');

    // Check that localStorage was written.
    // localStorage stores JSON, so the string 'dark' is stored as '"dark"'.
    expect(localStorage.getItem('theme')).toBe(JSON.stringify('dark'));
  });

  // ── Test 4: removeValue resets to initialValue and clears storage ──────
  // Calling removeValue should set the state back to initialValue AND
  // delete the key from localStorage entirely.
  it('resets to initialValue and removes the key from localStorage when removeValue is called', () => {
    const { result } = renderHook(() => useLocalStorage('theme', 'light'));

    // First, set a value.
    act(() => {
      const [, setValue] = result.current;
      setValue('dark');
    });

    // Now remove it.
    act(() => {
      const [,, removeValue] = result.current;
      removeValue();
    });

    const [value] = result.current;
    // State reset to initialValue.
    expect(value).toBe('light');
    // localStorage key is gone.
    expect(localStorage.getItem('theme')).toBeNull();
  });

  // ── Test 5: Handles JSON parse errors gracefully ───────────────────────
  // If localStorage contains invalid JSON (e.g., corrupted data from
  // another script, or manually edited by a dev tool), the hook should
  // silently fall back to initialValue rather than crashing the app.
  //
  // We use vi.spyOn to make getItem return malformed JSON.
  it('falls back to initialValue when localStorage contains invalid JSON', () => {
    // Spy on the real Storage.prototype.getItem and make it return garbage.
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('not-valid-json{{{');

    const { result } = renderHook(() => useLocalStorage('corrupted', 42));

    const [value] = result.current;
    // JSON.parse threw, so the hook caught the error and used initialValue.
    expect(value).toBe(42);

    // Always restore spies so they don't affect other tests.
    spy.mockRestore();
  });

  // ── Test 6: Different keys are completely independent ─────────────────
  // Each key in localStorage is its own slot. Writing to 'username' must
  // not affect what 'theme' contains.
  it('keeps different keys independent of each other', () => {
    const { result: themeResult } = renderHook(() => useLocalStorage('theme', 'light'));
    const { result: userResult } = renderHook(() => useLocalStorage('username', ''));

    act(() => {
      const [, setTheme] = themeResult.current;
      setTheme('dark');
    });

    act(() => {
      const [, setUser] = userResult.current;
      setUser('alice');
    });

    // Each key holds its own value.
    expect(themeResult.current[0]).toBe('dark');
    expect(userResult.current[0]).toBe('alice');

    // localStorage reflects both separately.
    expect(localStorage.getItem('theme')).toBe(JSON.stringify('dark'));
    expect(localStorage.getItem('username')).toBe(JSON.stringify('alice'));
  });

  // ── Test 7: Works with complex objects (not just strings) ──────────────
  // useLocalStorage is generic — it should round-trip objects through
  // JSON.stringify / JSON.parse without data loss.
  it('serialises and deserialises objects correctly', () => {
    const initial = { count: 0, label: 'default' };
    const { result } = renderHook(() => useLocalStorage('settings', initial));

    act(() => {
      const [, setValue] = result.current;
      setValue({ count: 5, label: 'custom' });
    });

    // State has the updated object.
    expect(result.current[0]).toEqual({ count: 5, label: 'custom' });

    // A new hook instance reading the same key should hydrate the object.
    const { result: result2 } = renderHook(() =>
      useLocalStorage('settings', { count: 0, label: 'default' })
    );
    expect(result2.current[0]).toEqual({ count: 5, label: 'custom' });
  });
});
