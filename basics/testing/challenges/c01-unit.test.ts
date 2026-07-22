// ═══════════════════════════════════════════════════════════
// CHALLENGE C01: UNIT TESTING  (Day 31)
// Run: npm run challenge:01   |   Time target: 25–35 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Implement the pure "checkout math" utilities of a tiny store —
//          a cart total, a discount applier, a slug maker, and a FizzBuzz
//          classifier. These are the bread-and-butter targets of unit tests:
//          pure functions with clear inputs/outputs and sharp edge cases.
//
// This is the RED→GREEN TDD loop. The SPECS below are complete and pinned;
// the SUBJECT above ships as type-valid but behaviorally-empty stubs, so the
// suite is RED until you implement them.
//
// RULES:
//  • Implement each `// TODO` in the SUBJECT block — do not change signatures
//    or exported names.
//  • Do NOT edit anything below the "SPECS" banner.
//  • You MAY add private helper functions above the banner.
//  • Run `npm run challenge:01` — all green = done.

import { describe, it, expect } from 'vitest';

// ══════════════════════════════════════════════════════════
// SUBJECT — implement these (Day 31: pure functions & edge cases)
// ══════════════════════════════════════════════════════════

export interface CartItem {
    name: string;
    price: number; // unit price, must be >= 0
    qty: number; // quantity, integer >= 0
}

// Sum of price*qty across every item. An empty cart totals 0.
export function cartTotal(items: CartItem[]): number {
    // TODO: reduce items to the summed price*qty
    return 0; // placeholder — remove
}

// Apply a percentage discount to a subtotal.
//   - percent must be a number in [0, 100]; otherwise throw a RangeError.
//   - returns the discounted amount rounded to 2 decimals.
//   e.g. applyDiscount(200, 10) → 180
export function applyDiscount(subtotal: number, percent: number): number {
    // TODO: validate percent (throw RangeError if <0 or >100),
    //       then return subtotal * (1 - percent/100) rounded to 2 decimals.
    return 0; // placeholder — remove
}

// Convert a product title into a URL slug:
//   - lowercased
//   - trimmed, runs of non-alphanumeric chars collapse to a single '-'
//   - no leading/trailing '-'
//   e.g. "  Hello,  World! " → "hello-world"
export function slugify(title: string): string {
    // TODO: lowercase, replace non-alphanumerics with '-', collapse & trim '-'
    return ''; // placeholder — remove
}

// Classic FizzBuzz for a single number:
//   divisible by 15 → 'FizzBuzz'; by 3 → 'Fizz'; by 5 → 'Buzz'; else the
//   number as a string.
export function fizzbuzz(n: number): string {
    // TODO: return 'FizzBuzz' | 'Fizz' | 'Buzz' | String(n)
    return ''; // placeholder — remove
}

// ══════════════════════════════════════════════════════════
// SPECS — do not modify below this line
// ══════════════════════════════════════════════════════════

describe('C01 · cartTotal', () => {
    it('returns 0 for an empty cart (edge case)', () => {
        expect(cartTotal([])).toBe(0);
    });

    it('sums price*qty across items', () => {
        const cart: CartItem[] = [
            { name: 'Pen', price: 1.5, qty: 2 }, // 3.0
            { name: 'Book', price: 10, qty: 3 }, // 30
        ];
        expect(cartTotal(cart)).toBe(33);
    });

    it('handles a zero-quantity line without adding to the total', () => {
        expect(cartTotal([{ name: 'Free', price: 99, qty: 0 }])).toBe(0);
    });
});

describe('C01 · applyDiscount', () => {
    it('applies a straightforward percentage', () => {
        expect(applyDiscount(200, 10)).toBe(180);
    });

    it('rounds to 2 decimal places', () => {
        expect(applyDiscount(9.99, 33)).toBe(6.69);
    });

    it('0% leaves the subtotal unchanged; 100% zeroes it', () => {
        expect(applyDiscount(50, 0)).toBe(50);
        expect(applyDiscount(50, 100)).toBe(0);
    });

    it.each([-1, 101, 150, -0.5])('throws a RangeError for out-of-range percent %d', (bad) => {
        expect(() => applyDiscount(100, bad)).toThrow(RangeError);
    });
});

describe('C01 · slugify', () => {
    it.each([
        ['Hello World', 'hello-world'],
        ['  Hello,  World! ', 'hello-world'],
        ['React & TypeScript', 'react-typescript'],
        ['---Edge---', 'edge'],
        ['already-slugged', 'already-slugged'],
    ])('slugify(%j) → %j', (input, expected) => {
        expect(slugify(input)).toBe(expected);
    });
});

describe('C01 · fizzbuzz', () => {
    it.each([
        [1, '1'],
        [3, 'Fizz'],
        [5, 'Buzz'],
        [9, 'Fizz'],
        [10, 'Buzz'],
        [15, 'FizzBuzz'],
        [30, 'FizzBuzz'],
        [7, '7'],
    ])('fizzbuzz(%d) → %j', (input, expected) => {
        expect(fizzbuzz(input)).toBe(expected);
    });
});
