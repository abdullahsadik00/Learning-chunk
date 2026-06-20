// ═══════════════════════════════════════════════════════════════
// DAY 31: UNIT TESTING WITH VITEST — Calculations
// ═══════════════════════════════════════════════════════════════
//
// NEW PATTERNS THIS FILE TEACHES:
//
//  expect(() => fn()).toThrow('message')
//    Testing functions that throw errors. You must wrap the call in an
//    arrow function so Vitest can catch the throw — otherwise the throw
//    propagates out and crashes the test runner before the assertion runs.
//
//  toBeCloseTo(number, numDigits?)
//    For floating-point arithmetic. 0.1 + 0.2 === 0.30000000000000004 in JS.
//    toBeCloseTo(0.3) checks within 2 decimal places by default.
//    Use it whenever your math could have floating-point drift.
//
//  Generic functions
//    paginate<T>() works with any array type. Tests confirm it works with
//    numbers, strings, and objects — showing how generics stay type-safe.

import { describe, it, expect } from 'vitest';
import {
  calculateCartTotal,
  applyDiscount,
  calculateTax,
  paginate,
  type CartItem,
} from '@/utils/calculations';

// ─────────────────────────────────────────────────────────────────
// calculateCartTotal
// ─────────────────────────────────────────────────────────────────
describe('calculateCartTotal', () => {
  // Helper factory — DRY principle: define test data once, reuse below.
  // This is a pattern called a "fixture factory" or "object mother".
  const makeItem = (
    id: string,
    price: number,
    quantity: number
  ): CartItem => ({ id, name: `Item ${id}`, price, quantity });

  it('returns 0 for an empty cart', () => {
    // Edge case: reduce on an empty array returns the initial value (0)
    expect(calculateCartTotal([])).toBe(0);
  });

  it('calculates total for a single item', () => {
    const items = [makeItem('a', 10, 3)]; // 10 * 3 = 30
    expect(calculateCartTotal(items)).toBe(30);
  });

  it('sums multiple items correctly', () => {
    const items = [
      makeItem('a', 10, 2), // 20
      makeItem('b', 5, 4),  // 20
      makeItem('c', 2.5, 1), // 2.5
    ];
    // Total: 42.5
    // toBeCloseTo is safe here but toBe(42.5) also works for this exact sum
    expect(calculateCartTotal(items)).toBeCloseTo(42.5);
  });

  it('handles items with quantity of 1', () => {
    const items = [makeItem('a', 99.99, 1)];
    expect(calculateCartTotal(items)).toBeCloseTo(99.99);
  });

  it('handles large quantities', () => {
    const items = [makeItem('a', 1, 1000)];
    expect(calculateCartTotal(items)).toBe(1000);
  });
});

// ─────────────────────────────────────────────────────────────────
// applyDiscount
// ─────────────────────────────────────────────────────────────────
describe('applyDiscount', () => {
  it('applies a 10% discount correctly', () => {
    // 100 * (1 - 10/100) = 90
    expect(applyDiscount(100, 10)).toBeCloseTo(90);
  });

  it('applies a 0% discount (no change)', () => {
    expect(applyDiscount(100, 0)).toBeCloseTo(100);
  });

  it('applies a 100% discount (free)', () => {
    expect(applyDiscount(100, 100)).toBeCloseTo(0);
  });

  it('applies a 50% discount to a decimal price', () => {
    // 99.99 * 0.5 = 49.995 — floating-point territory
    expect(applyDiscount(99.99, 50)).toBeCloseTo(49.995, 2);
  });

  // ── Error cases — testing that functions THROW ────────────────
  //
  // SYNTAX: expect(() => functionCall()).toThrow('substring of error message')
  //
  // WHY wrap in arrow function?
  //  If you write:  expect(applyDiscount(100, -1)).toThrow(...)
  //  The throw happens BEFORE expect() runs, so Vitest never sees it.
  //  The arrow function delays execution until Vitest is ready to catch it.
  //
  it('throws when discount is negative', () => {
    expect(() => applyDiscount(100, -1)).toThrow('Discount must be between 0 and 100');
  });

  it('throws when discount exceeds 100', () => {
    expect(() => applyDiscount(100, 101)).toThrow('Discount must be between 0 and 100');
  });

  it('throws for extreme negative values', () => {
    // The same validation covers all negative values
    expect(() => applyDiscount(100, -999)).toThrow();
    // .toThrow() with no argument just checks that SOMETHING was thrown
  });
});

// ─────────────────────────────────────────────────────────────────
// calculateTax
// ─────────────────────────────────────────────────────────────────
describe('calculateTax', () => {
  it('calculates 8% sales tax on a whole number', () => {
    // 100 * 0.08 = 8.00
    expect(calculateTax(100, 0.08)).toBe(8);
  });

  it('calculates tax and rounds to 2 decimal places', () => {
    // 99.99 * 0.08 = 7.9992 → rounds to 8.00
    expect(calculateTax(99.99, 0.08)).toBe(8);
  });

  it('calculates 0% tax', () => {
    expect(calculateTax(100, 0)).toBe(0);
  });

  it('rounds correctly for values mid-way between cents', () => {
    // 10 * 0.085 = 0.85 — no rounding needed
    expect(calculateTax(10, 0.085)).toBe(0.85);
  });
});

// ─────────────────────────────────────────────────────────────────
// paginate
// ─────────────────────────────────────────────────────────────────
//
// paginate<T> is generic — it works on any array. We test it with
// numbers for simplicity, but it is equally valid with objects.
//
describe('paginate', () => {
  // Create a test dataset: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const items = Array.from({ length: 10 }, (_, i) => i + 1);

  it('returns the first page correctly', () => {
    const result = paginate(items, 1, 3);
    // Page 1, 3 per page → items [1, 2, 3]
    expect(result.data).toEqual([1, 2, 3]);
    expect(result.total).toBe(10);
    expect(result.totalPages).toBe(4); // Math.ceil(10/3) = 4
    expect(result.hasNext).toBe(true);
    expect(result.hasPrev).toBe(false); // page 1 has no previous
  });

  it('returns a middle page correctly', () => {
    const result = paginate(items, 2, 3);
    expect(result.data).toEqual([4, 5, 6]);
    expect(result.hasNext).toBe(true);
    expect(result.hasPrev).toBe(true);
  });

  it('returns the last page correctly (possibly partial)', () => {
    // 10 items, 3 per page: page 4 has only item 10
    const result = paginate(items, 4, 3);
    expect(result.data).toEqual([10]);
    expect(result.hasNext).toBe(false); // no page 5
    expect(result.hasPrev).toBe(true);
  });

  it('returns all items when pageSize >= total', () => {
    const result = paginate(items, 1, 100);
    expect(result.data).toHaveLength(10);
    expect(result.totalPages).toBe(1);
    expect(result.hasNext).toBe(false);
    expect(result.hasPrev).toBe(false);
  });

  it('returns empty data for an empty array', () => {
    const result = paginate([], 1, 10);
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
    expect(result.hasNext).toBe(false);
    expect(result.hasPrev).toBe(false);
  });

  it('works with objects (generic type safety)', () => {
    const users = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Carol' },
    ];
    const result = paginate(users, 1, 2);

    // toEqual does deep comparison — correct for objects
    expect(result.data).toEqual([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]);
    expect(result.totalPages).toBe(2);
  });

  it('returns hasPrev:false for page 1 regardless of total', () => {
    // Boundary: the first page never has a previous page
    const result = paginate(items, 1, 5);
    expect(result.hasPrev).toBe(false);
  });

  it('returns hasNext:false for the last page', () => {
    // 10 items, 5 per page → 2 pages total. Page 2 is the last.
    const result = paginate(items, 2, 5);
    expect(result.hasNext).toBe(false);
  });
});
