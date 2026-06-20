// ═══════════════════════════════════════════════════════════════
// DAY 31: UNIT TESTING WITH VITEST — Mocking
// ═══════════════════════════════════════════════════════════════
//
// WHY MOCK?
//  Real code depends on things you don't control:
//   • Browser APIs (localStorage, crypto, fetch)
//   • Third-party modules (analytics, payment SDKs)
//   • Time (setTimeout, Date.now)
//   • Side effects (console.warn, console.error)
//
//  Mocking lets you:
//   1. Remove real dependencies so tests run in isolation
//   2. Control what those dependencies return
//   3. Assert HOW your code interacts with them (was it called? with what args?)
//
// THREE TOOLS IN VITEST:
//
//  ┌─────────────────┬─────────────────────────────────────────────────────┐
//  │ vi.fn()         │ Create a brand-new mock function from scratch.       │
//  │                 │ Use for callbacks passed as props/args.              │
//  ├─────────────────┼─────────────────────────────────────────────────────┤
//  │ vi.spyOn()      │ Wrap an EXISTING method on an object.               │
//  │                 │ The original still works (unless you override it).   │
//  │                 │ Must call .mockRestore() after each test.            │
//  ├─────────────────┼─────────────────────────────────────────────────────┤
//  │ vi.mock()       │ Replace an entire MODULE for every test in the file. │
//  │                 │ Hoisted to the top by Vitest — runs before imports.  │
//  └─────────────────┴─────────────────────────────────────────────────────┘
//
// FAKE TIMERS:
//  vi.useFakeTimers()        — take over setTimeout/setInterval/Date
//  vi.advanceTimersByTime(n) — fast-forward n milliseconds
//  vi.runAllTimers()         — drain every pending timer at once
//  vi.useRealTimers()        — restore real timers (call in afterEach)

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { useDebounce } from '@/hooks/useDebounce';
import { renderHook, act } from '@testing-library/react';

// ─────────────────────────────────────────────────────────────────
// SECTION 1: vi.fn() — Creating mock functions
// ─────────────────────────────────────────────────────────────────
//
// vi.fn() creates a "spy" function that:
//  • Records every call (arguments, return value, call count)
//  • Lets you configure what it returns (mockReturnValue, mockImplementation)
//  • Lets you assert on how it was called
//
describe('vi.fn() — mock functions', () => {
  it('records that a callback was called', () => {
    // ARRANGE: create a mock function (stands in for any callback)
    const mockCallback = vi.fn();

    // ACT: call it like a normal function
    mockCallback('hello', 42);

    // ASSERT: check it was called
    // toHaveBeenCalled() — was it called at all?
    expect(mockCallback).toHaveBeenCalled();

    // toHaveBeenCalledTimes(n) — was it called exactly n times?
    expect(mockCallback).toHaveBeenCalledTimes(1);

    // toHaveBeenCalledWith(...args) — was it called with these arguments?
    expect(mockCallback).toHaveBeenCalledWith('hello', 42);
  });

  it('tracks multiple calls and their arguments', () => {
    const mockFn = vi.fn();
    mockFn('first');
    mockFn('second');
    mockFn('third');

    expect(mockFn).toHaveBeenCalledTimes(3);

    // toHaveBeenNthCalledWith(n, ...args) — check the nth call specifically
    expect(mockFn).toHaveBeenNthCalledWith(1, 'first');
    expect(mockFn).toHaveBeenNthCalledWith(2, 'second');
    expect(mockFn).toHaveBeenNthCalledWith(3, 'third');
  });

  it('can be configured to return a value', () => {
    // mockReturnValue() sets what the mock returns when called
    const mockAdd = vi.fn().mockReturnValue(42);

    const result = mockAdd(1, 2); // arguments are ignored — always returns 42
    expect(result).toBe(42);
  });

  it('can use mockImplementation to provide real logic', () => {
    // mockImplementation() lets you define behavior (useful for conditional returns)
    const mockDouble = vi.fn().mockImplementation((n: number) => n * 2);

    expect(mockDouble(5)).toBe(10);
    expect(mockDouble(3)).toBe(6);
    expect(mockDouble).toHaveBeenCalledTimes(2);
  });

  it('can return different values on successive calls', () => {
    // mockReturnValueOnce() — return this value for one call, then fall through
    const mockFetch = vi
      .fn()
      .mockReturnValueOnce('loading')
      .mockReturnValueOnce('data')
      .mockReturnValue('done'); // default after the two one-off values

    expect(mockFetch()).toBe('loading');
    expect(mockFetch()).toBe('data');
    expect(mockFetch()).toBe('done');
    expect(mockFetch()).toBe('done'); // keeps returning 'done'
  });

  it('starts fresh — mock.calls is empty before any calls', () => {
    const mockFn = vi.fn();

    // toHaveBeenCalled() is false initially
    expect(mockFn).not.toHaveBeenCalled();

    // After calling once:
    mockFn();
    expect(mockFn).toHaveBeenCalledTimes(1);

    // vi.clearAllMocks() or mockFn.mockClear() resets the call count
    mockFn.mockClear();
    expect(mockFn).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────
// SECTION 2: vi.spyOn() — Spying on existing methods
// ─────────────────────────────────────────────────────────────────
//
// vi.spyOn(object, 'methodName') wraps the existing method.
// By default, the original still runs (it "passes through").
// You can override behavior with .mockImplementation() etc.
// ALWAYS call .mockRestore() after each test — otherwise the spy
// leaks into subsequent tests in the file.
//
describe('vi.spyOn() — spying on existing methods', () => {
  afterEach(() => {
    // vi.restoreAllMocks() is the nuclear option — restores every spy at once.
    // Equivalent to calling .mockRestore() on each spy individually.
    vi.restoreAllMocks();
  });

  it('spies on console.warn without changing its behavior', () => {
    // We don't want real console.warn output polluting test logs,
    // so we replace it with a no-op mock while still tracking calls.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Call code that should trigger a warning
    console.warn('something is wrong');

    expect(warnSpy).toHaveBeenCalledWith('something is wrong');
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('spies on console.error and suppresses the output', () => {
    // Very useful when testing error boundaries or error-logging code —
    // without the spy, the error would print to your terminal and look scary.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    console.error('test error', { detail: 42 });

    expect(errorSpy).toHaveBeenCalledWith('test error', { detail: 42 });
  });

  it('spies on Math.random to produce deterministic results', () => {
    // Tests that depend on Math.random() are non-deterministic by default.
    // Spying lets us pin the return value.
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const result = Math.random();
    expect(result).toBe(0.5);
    expect(randomSpy).toHaveBeenCalledTimes(1);
  });

  it('counts how many times a method was called on an object', () => {
    const calculator = {
      add: (a: number, b: number) => a + b,
    };

    // Spy without overriding — the original add() still runs
    const addSpy = vi.spyOn(calculator, 'add');

    const result = calculator.add(2, 3);

    // Original behavior preserved
    expect(result).toBe(5);
    // But we also tracked the call
    expect(addSpy).toHaveBeenCalledWith(2, 3);
    expect(addSpy).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────
// SECTION 3: vi.useFakeTimers() — Controlling time
// ─────────────────────────────────────────────────────────────────
//
// useDebounce delays state updates. Without fake timers, your test
// would need to actually wait (e.g., `await new Promise(r => setTimeout(r, 500))`).
// That's slow and fragile. Fake timers let you fast-forward time instantly.
//
// FLOW:
//  vi.useFakeTimers()        → Vitest takes over setTimeout/setInterval
//  act(() => { ... })        → required when advancing timers that cause React state updates
//  vi.advanceTimersByTime(n) → move the clock forward n ms (triggers timers that have elapsed)
//  vi.useRealTimers()        → restore real timers
//
describe('vi.useFakeTimers() — debounce timing', () => {
  beforeEach(() => {
    // Install fake timers before each test in this group
    vi.useFakeTimers();
  });

  afterEach(() => {
    // ALWAYS restore real timers after — otherwise other test files break
    vi.useRealTimers();
  });

  it('does not update the debounced value before the delay elapses', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));

    // Value starts at 'initial'
    expect(result.current).toBe('initial');

    // Re-render the hook with a new value — the debounce timer starts
    // (renderHook returns a rerender function to simulate prop changes)
  });

  it('updates the debounced value after the full delay', () => {
    // Start with 'initial', debounce delay = 500ms
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Change the value — starts the debounce timer
    rerender({ value: 'updated', delay: 500 });

    // Still 'initial' because 500ms haven't passed yet
    expect(result.current).toBe('initial');

    // Fast-forward 500ms — the timer fires, React state updates
    // act() wraps state-updating operations so React can flush them
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Now the debounced value reflects the update
    expect(result.current).toBe('updated');
  });

  it('resets the timer on rapid value changes (debounce behavior)', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    );

    // Rapid changes — each one cancels the previous timer
    rerender({ value: 'change1', delay: 300 });
    act(() => { vi.advanceTimersByTime(100); }); // 100ms in, no update yet

    rerender({ value: 'change2', delay: 300 });
    act(() => { vi.advanceTimersByTime(100); }); // 200ms total, still no update

    rerender({ value: 'change3', delay: 300 });
    act(() => { vi.advanceTimersByTime(100); }); // 300ms total but clock reset on each change

    // 'initial' still because no individual 300ms window completed
    expect(result.current).toBe('initial');

    // Now let 300ms pass without any new changes
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Finally updates to the LAST value, not any intermediate ones
    expect(result.current).toBe('change3');
  });

  it('uses vi.runAllTimers() to drain timers without knowing the delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'hello', delay: 1000 } }
    );

    rerender({ value: 'world', delay: 1000 });

    // vi.runAllTimers() fires every pending timer regardless of delay
    // Useful when you don't know or don't care about the exact delay
    act(() => {
      vi.runAllTimers();
    });

    expect(result.current).toBe('world');
  });
});

// ─────────────────────────────────────────────────────────────────
// SECTION 4: vi.mock() — Mocking entire modules
// ─────────────────────────────────────────────────────────────────
//
// vi.mock('module-path') REPLACES the entire module for every test
// in this file. It is hoisted to the top of the file by Vitest's
// transform — so it runs before any imports, even though it appears
// later in the source code.
//
// Use vi.mock() when:
//  • A module makes real network requests (replace with fake data)
//  • A module uses non-deterministic values (crypto.randomUUID, Date.now)
//  • A module has side effects you want to suppress
//
// IMPORTANT: vi.mock() factory runs once. Each test that calls the mocked
// function will use the same mock unless you use vi.mocked() + mockReturnValue.
//
// NOTE: vi.mock() with module factory is demonstrated conceptually here.
// Direct module mocking works best in dedicated test files per module.
// For crypto.randomUUID, we spy on the global directly.
//
describe('vi.spyOn(crypto) — mocking crypto.randomUUID', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('can make randomUUID return a predictable value', () => {
    // crypto.randomUUID() normally returns a different UUID every call.
    // That makes snapshot tests and ID-based assertions fragile.
    // By spying, we pin it to a known value.
    const spy = vi
      .spyOn(crypto, 'randomUUID')
      .mockReturnValue('00000000-0000-0000-0000-000000000001');

    const id = crypto.randomUUID();
    expect(id).toBe('00000000-0000-0000-0000-000000000001');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('can return different UUIDs for each call', () => {
    vi.spyOn(crypto, 'randomUUID')
      .mockReturnValueOnce('aaaa-0000-0000-0000-000000000001')
      .mockReturnValueOnce('bbbb-0000-0000-0000-000000000002');

    expect(crypto.randomUUID()).toBe('aaaa-0000-0000-0000-000000000001');
    expect(crypto.randomUUID()).toBe('bbbb-0000-0000-0000-000000000002');
  });
});
