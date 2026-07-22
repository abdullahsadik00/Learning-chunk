// ═══════════════════════════════════════════════════════════
// CHALLENGE C03: HOOK TESTING  (Day 33)
// Run: npm run challenge:03   |   Time target: 30–40 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Build two custom hooks and test them in isolation with
//          renderHook + act — a bounded counter, and a debounced value that
//          needs fake timers to test without real waiting.
//
// RED→GREEN TDD loop: the SPECS use renderHook/act and vi.useFakeTimers().
// The hooks ship as stubs, so the suite is RED until you implement them.
//
// RULES:
//  • Implement the SUBJECT hooks — do not change signatures or exported names.
//  • Do NOT edit anything below the "SPECS" banner.
//  • Keep returned callbacks reference-stable (useCallback) where the spec
//    checks for it.
//  • Run `npm run challenge:03` — all green = done.

import { useCallback, useEffect, useState } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ══════════════════════════════════════════════════════════
// SUBJECT — implement these hooks (Day 33: renderHook/act, fake timers)
// ══════════════════════════════════════════════════════════

export interface CounterApi {
    count: number;
    increment: () => void;
    decrement: () => void;
    reset: () => void;
}

// A counter bounded to [min, max]. increment/decrement clamp at the bounds;
// reset returns to `initial`. All three callbacks must be reference-stable.
export function useBoundedCounter(initial = 0, min = 0, max = 10): CounterApi {
    const [count, setCount] = useState(initial);
    // TODO: implement increment (clamp at max), decrement (clamp at min),
    //       and reset (back to initial) using useCallback so references are
    //       stable across renders. Return { count, increment, decrement, reset }.
    const increment = useCallback(() => { /* TODO */ }, []);
    const decrement = useCallback(() => { /* TODO */ }, []);
    const reset = useCallback(() => { /* TODO */ }, []);
    return { count, increment, decrement, reset };
}

// Returns `value`, but only after it has stayed unchanged for `delay` ms.
// Rapid changes must cancel the pending update (classic debounce). Must clean
// up its timer on unmount.
export function useDebouncedValue<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    // TODO: in a useEffect keyed on [value, delay], setTimeout to update the
    //       debounced value, and return a cleanup that clears the timeout.
    useEffect(() => {
        /* TODO */
    }, [value, delay]);
    return debounced;
}

// ══════════════════════════════════════════════════════════
// SPECS — do not modify below this line
// ══════════════════════════════════════════════════════════

describe('C03 · useBoundedCounter', () => {
    it('starts at the initial value', () => {
        const { result } = renderHook(() => useBoundedCounter(3));
        expect(result.current.count).toBe(3);
    });

    it('increments and decrements', () => {
        const { result } = renderHook(() => useBoundedCounter(0, 0, 5));
        act(() => result.current.increment());
        expect(result.current.count).toBe(1);
        act(() => result.current.decrement());
        expect(result.current.count).toBe(0);
    });

    it('clamps at max and min', () => {
        const { result } = renderHook(() => useBoundedCounter(0, 0, 2));
        act(() => {
            result.current.increment();
            result.current.increment();
            result.current.increment(); // would be 3, clamps to 2
        });
        expect(result.current.count).toBe(2);
        act(() => {
            result.current.decrement();
            result.current.decrement();
            result.current.decrement(); // clamps to 0
        });
        expect(result.current.count).toBe(0);
    });

    it('reset returns to the initial value', () => {
        const { result } = renderHook(() => useBoundedCounter(4, 0, 10));
        act(() => result.current.increment());
        act(() => result.current.reset());
        expect(result.current.count).toBe(4);
    });

    it('keeps callback references stable across renders', () => {
        const { result, rerender } = renderHook(() => useBoundedCounter());
        const first = result.current.increment;
        rerender();
        expect(result.current.increment).toBe(first);
    });
});

describe('C03 · useDebouncedValue', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('returns the initial value immediately', () => {
        const { result } = renderHook(() => useDebouncedValue('hello', 300));
        expect(result.current).toBe('hello');
    });

    it('does not update before the delay elapses', () => {
        const { result, rerender } = renderHook(
            ({ v }: { v: string }) => useDebouncedValue(v, 300),
            { initialProps: { v: 'hello' } },
        );
        rerender({ v: 'world' });
        act(() => vi.advanceTimersByTime(299));
        expect(result.current).toBe('hello');
    });

    it('updates after the delay elapses', () => {
        const { result, rerender } = renderHook(
            ({ v }: { v: string }) => useDebouncedValue(v, 300),
            { initialProps: { v: 'hello' } },
        );
        rerender({ v: 'world' });
        act(() => vi.advanceTimersByTime(300));
        expect(result.current).toBe('world');
    });

    it('rapid changes cancel earlier pending updates', () => {
        const { result, rerender } = renderHook(
            ({ v }: { v: string }) => useDebouncedValue(v, 300),
            { initialProps: { v: 'a' } },
        );
        rerender({ v: 'ab' });
        act(() => vi.advanceTimersByTime(100));
        rerender({ v: 'abc' });
        act(() => vi.advanceTimersByTime(100));
        expect(result.current).toBe('a'); // neither timer fired
        act(() => vi.advanceTimersByTime(300));
        expect(result.current).toBe('abc'); // only the last value commits
    });

    it('cleans up its timer on unmount (no post-unmount update)', () => {
        const { result, rerender, unmount } = renderHook(
            ({ v }: { v: string }) => useDebouncedValue(v, 300),
            { initialProps: { v: 'before' } },
        );
        rerender({ v: 'after' });
        unmount();
        act(() => vi.advanceTimersByTime(400));
        expect(result.current).toBe('before');
    });
});
