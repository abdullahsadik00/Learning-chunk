// ═══════════════════════════════════════════════════════════
// CHALLENGE C16: TYPESCRIPT IN REACT
// Run: npm run challenge:16   |   Time target: 35–45 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Build the typed core of `@acme/ui` — a tuple hook, a generic
//          list, a discriminated-union data reducer, utility-type DTO
//          helpers, runtime type guards, and a variant-prop component.
//
// This is the React analog of the ts-node challenges: instead of a custom
// assert(), it uses the project's Vitest + Testing Library setup. It ships
// UNSOLVED — every stub is type-valid but behaviorally empty, so the suite
// is RED until you implement it.
//
// RULES:
//  • Replace each `/* TODO */` — do not change any signature or exported name.
//  • Do NOT edit the `describe/it` blocks or the "given, do not modify" types.
//  • You MAY add helper functions/components.
//  • Run `npm run challenge:16` to check your work (all green = done).
//  • `npm run check` must still pass — keep every stub type-valid as you go.

import React, { useCallback, useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';

// ══════════════════════════════════════════════════════════
// PART 1 — Tuple-returning hook (fundamentals · tuples)
// ══════════════════════════════════════════════════════════
// useToggle must return a TUPLE [value, toggle] so callers can rename via
// positional destructuring (like useState). `toggle` must be reference-stable.

export function useToggle(initial = false): [boolean, () => void] {
    const [on, setOn] = useState(initial);
    // TODO: create a stable `toggle` (useCallback) that flips `on`, and
    //       return the tuple [on, toggle]. Remove the placeholder below.
    return [on, () => { /* TODO */ }];
}

// ══════════════════════════════════════════════════════════
// PART 2 — Generic utility + generic component (generics · function types)
// ══════════════════════════════════════════════════════════
// pluck extracts one field from every item, preserving its type via T[K].
export function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
    // TODO: return items mapped to item[key]
    return []; // placeholder — remove
}

// A generic List renders each item via a render prop, keyed by keyOf.
export function List<T>({
    items,
    keyOf,
    renderItem,
}: {
    items: T[];
    keyOf: (item: T) => string | number;
    renderItem: (item: T, index: number) => React.ReactNode;
}): React.ReactElement {
    // TODO: render a <ul> with one <li key={keyOf(item)}> per item.
    return <ul />; // placeholder — remove
}

// ══════════════════════════════════════════════════════════
// PART 3 — Discriminated-union data reducer (type guards · unions)
// ══════════════════════════════════════════════════════════
// GIVEN — do not modify.
export type RemoteData<T> =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: T }
    | { status: 'error'; error: Error };

export type RemoteAction<T> =
    | { type: 'load' }
    | { type: 'resolve'; data: T }
    | { type: 'reject'; error: Error }
    | { type: 'reset' };

// Required transitions:
//   'load'    → { status: 'loading' }
//   'resolve' → { status: 'success', data }
//   'reject'  → { status: 'error', error }
//   'reset'   → { status: 'idle' }
// The default branch MUST do an exhaustiveness check with `never`.
export function remoteReducer<T>(state: RemoteData<T>, action: RemoteAction<T>): RemoteData<T> {
    switch (action.type) {
        // TODO: one case per action type (see the mapping above)
        default: {
            // TODO: const _exhaustive: never = action; return _exhaustive;
            return state; // placeholder — remove
        }
    }
}

// ══════════════════════════════════════════════════════════
// PART 4 — Utility-type DTO helpers (utility types)
// ══════════════════════════════════════════════════════════
// GIVEN — do not modify.
export interface Product {
    id: string;
    name: string;
    price: number;
    inStock: boolean;
}

// applyPatch merges a partial update over an existing product (immutably).
export function applyPatch(product: Product, patch: Partial<Product>): Product {
    // TODO: return a new object = product with patch applied on top
    return product; // placeholder — remove
}

// toCardProps narrows a full Product down to only what the card needs.
export function toCardProps(p: Product): Pick<Product, 'name' | 'price' | 'inStock'> {
    // TODO: return only name, price, inStock
    return { name: '', price: 0, inStock: false }; // placeholder — remove
}

// ══════════════════════════════════════════════════════════
// PART 5 — Runtime type guards (type guards · predicates · assertions)
// ══════════════════════════════════════════════════════════
// GIVEN — do not modify.
export interface User {
    id: string;
    name: string;
    email: string;
}

// User-defined type guard: true only for objects with id + name + email.
export function isUser(value: unknown): value is User {
    // TODO: use typeof/`in`/!== null checks; return true only for valid users
    return false; // placeholder — remove
}

// Assertion function: throw if not a User; otherwise narrow for the caller.
export function assertIsUser(value: unknown): asserts value is User {
    // TODO: if (!isUser(value)) throw new Error('Expected a User')
    /* TODO */
}

// ══════════════════════════════════════════════════════════
// PART 6 — Variant-prop component (literal unions · discriminated props)
// ══════════════════════════════════════════════════════════
// GIVEN — do not modify.
export type BadgeStatus = 'idle' | 'loading' | 'success' | 'error';

// StatusBadge renders exact text per status (must match exactly):
//   idle → "Idle" · loading → "Loading…" · success → "Done" · error → "Failed"
// The element must carry data-status={status}.
export function StatusBadge({ status }: { status: BadgeStatus }): React.ReactElement {
    // TODO: map status → label and render <span data-status={status}>{label}</span>
    return <span />; // placeholder — remove
}

// ══════════════════════════════════════════════════════════
// SPECS — do not modify below this line
// ══════════════════════════════════════════════════════════

describe('C16 · Part 1 — useToggle (tuple hook)', () => {
    it('starts at the initial value and flips on toggle', () => {
        const { result } = renderHook(() => useToggle(false));
        expect(result.current[0]).toBe(false);
        act(() => result.current[1]());
        expect(result.current[0]).toBe(true);
        act(() => result.current[1]());
        expect(result.current[0]).toBe(false);
    });

    it('respects a true initial value', () => {
        const { result } = renderHook(() => useToggle(true));
        expect(result.current[0]).toBe(true);
    });

    it('keeps the toggle function reference stable across renders', () => {
        const { result, rerender } = renderHook(() => useToggle());
        const first = result.current[1];
        rerender();
        expect(result.current[1]).toBe(first);
    });
});

describe('C16 · Part 2 — pluck + generic List', () => {
    it('pluck extracts a typed field from every item', () => {
        const users = [{ id: '1', age: 30 }, { id: '2', age: 40 }];
        expect(pluck(users, 'id')).toEqual(['1', '2']);
        expect(pluck(users, 'age')).toEqual([30, 40]);
    });

    it('List renders one row per item using keyOf/renderItem', () => {
        render(
            <List
                items={[{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }]}
                keyOf={(u) => u.id}
                renderItem={(u) => <span>{u.label}</span>}
            />,
        );
        expect(screen.getByText('Alpha')).toBeInTheDocument();
        expect(screen.getByText('Beta')).toBeInTheDocument();
    });
});

describe('C16 · Part 3 — remoteReducer (discriminated union)', () => {
    it('load → loading', () => {
        expect(remoteReducer({ status: 'idle' }, { type: 'load' })).toEqual({ status: 'loading' });
    });
    it('resolve → success with data', () => {
        expect(remoteReducer<number>({ status: 'loading' }, { type: 'resolve', data: 42 }))
            .toEqual({ status: 'success', data: 42 });
    });
    it('reject → error with the error', () => {
        const error = new Error('boom');
        expect(remoteReducer({ status: 'loading' }, { type: 'reject', error }))
            .toEqual({ status: 'error', error });
    });
    it('reset → idle', () => {
        expect(remoteReducer({ status: 'error', error: new Error() }, { type: 'reset' }))
            .toEqual({ status: 'idle' });
    });
});

describe('C16 · Part 4 — utility-type DTO helpers', () => {
    const base: Product = { id: 'p1', name: 'Widget', price: 10, inStock: true };

    it('applyPatch merges immutably', () => {
        const next = applyPatch(base, { price: 20, inStock: false });
        expect(next).toEqual({ id: 'p1', name: 'Widget', price: 20, inStock: false });
        expect(next).not.toBe(base); // new object, original untouched
        expect(base.price).toBe(10);
    });

    it('toCardProps keeps only the card fields', () => {
        expect(toCardProps(base)).toEqual({ name: 'Widget', price: 10, inStock: true });
    });
});

describe('C16 · Part 5 — type guards', () => {
    const good = { id: 'u1', name: 'Ada', email: 'ada@x.com' };

    it('isUser accepts a valid user and rejects everything else', () => {
        expect(isUser(good)).toBe(true);
        expect(isUser(null)).toBe(false);
        expect(isUser('nope')).toBe(false);
        expect(isUser({ id: 'u1' })).toBe(false);
    });

    it('assertIsUser throws on bad input and passes on good input', () => {
        expect(() => assertIsUser({})).toThrow();
        expect(() => assertIsUser(good)).not.toThrow();
    });
});

describe('C16 · Part 6 — StatusBadge (variant props)', () => {
    it('renders the right label and data-status per status', () => {
        const cases: Array<[BadgeStatus, string]> = [
            ['idle', 'Idle'],
            ['loading', 'Loading…'],
            ['success', 'Done'],
            ['error', 'Failed'],
        ];
        for (const [status, label] of cases) {
            const { container, unmount } = render(<StatusBadge status={status} />);
            expect(screen.getByText(label)).toBeInTheDocument();
            expect(container.querySelector(`[data-status="${status}"]`)).not.toBeNull();
            unmount();
        }
    });
});
