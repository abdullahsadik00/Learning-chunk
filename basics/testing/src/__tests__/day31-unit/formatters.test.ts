// ═══════════════════════════════════════════════════════════════
// DAY 31: UNIT TESTING WITH VITEST — Formatters
// ═══════════════════════════════════════════════════════════════
//
// WHAT IS A UNIT TEST?
//  A unit test verifies that a single, isolated piece of logic
//  (a function, a class method) behaves correctly given specific inputs.
//  "Isolated" means: no database, no network, no React rendering — just
//  the function and its return value.
//
// WHY WRITE TESTS?
//  1. Confidence — you can refactor without fear of silent breakage
//  2. Documentation — tests show exactly how a function should behave
//  3. Design pressure — hard-to-test code is usually badly designed
//  4. Regression prevention — a bug fixed + a test added = never recurs
//
// THE AAA PATTERN (Arrange → Act → Assert):
//  Every test case follows this structure:
//    ARRANGE  — set up the inputs and any required state
//    ACT      — call the function under test
//    ASSERT   — verify the output matches expectations
//
// VITEST ANATOMY:
//  describe('label', () => { ... })
//    Groups related tests under one label. Nesting is allowed.
//    Vitest uses this for output formatting and --reporter filtering.
//
//  it('should ...', () => { ... })   ← also written as test('should ...', ...)
//    Declares one test case. Name should read like a sentence:
//    "it should format a Date object"
//
//  expect(received).matcher(expected)
//    The assertion. If the matcher fails, Vitest throws and marks the test red.
//    `received` is the actual value your code produced.
//    `expected` is what you wanted.

import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatCurrency,
  truncate,
  slugify,
  pluralize,
  capitalize,
} from '@/utils/formatters';

// ─────────────────────────────────────────────────────────────────
// formatDate
// ─────────────────────────────────────────────────────────────────
describe('formatDate', () => {
  it('formats a Date object into a human-readable string', () => {
    // ARRANGE: create a known Date.
    // We use a UTC string so the test is not sensitive to the machine's local
    // timezone when constructing the object — the formatter uses 'en-US' locale
    // with { year, month, day } which produces "June 15, 2026".
    const date = new Date('2026-06-15T12:00:00Z');

    // ACT + ASSERT combined — perfectly fine for one-liner assertions
    // toBe() checks strict equality (===). Great for primitives (strings, numbers).
    // Do NOT use toBe() for objects/arrays — use toEqual() instead (see validators tests).
    expect(formatDate(date)).toBe('June 15, 2026');
  });

  it('formats an ISO date string', () => {
    // formatDate accepts a string, not just a Date object.
    // This tests that the internal `new Date(date)` coercion works correctly.
    expect(formatDate('2026-01-01T12:00:00Z')).toBe('January 1, 2026');
  });

  it('formats December correctly (no off-by-one in month)', () => {
    // Edge case: JavaScript's Date months are 0-indexed (0 = January, 11 = December),
    // but Intl.DateTimeFormat handles this correctly. Test it explicitly.
    expect(formatDate('2026-12-31T12:00:00Z')).toBe('December 31, 2026');
  });

  it('respects the locale parameter', () => {
    // Different locales produce different output.
    // We use toMatch() with a regex because the exact format (e.g. "15. Juni 2026"
    // vs "15.06.2026") varies by ICU version installed on the OS.
    // toMatch(regex) — passes if the string matches the pattern anywhere inside it.
    // This is the right tool when the output is environment-dependent.
    expect(formatDate('2026-06-15T12:00:00Z', 'de-DE')).toMatch(
      /15\.06\.2026|15\. Juni 2026|15\. Jun\. 2026/
    );
  });

  it('defaults to en-US locale when none is provided', () => {
    // Verifying the default parameter — call with only one argument.
    const result = formatDate('2026-03-10T12:00:00Z');
    expect(result).toBe('March 10, 2026');
  });
});

// ─────────────────────────────────────────────────────────────────
// formatCurrency
// ─────────────────────────────────────────────────────────────────
describe('formatCurrency', () => {
  it('formats a whole number as USD by default', () => {
    // $1,234 — Intl.NumberFormat always shows 2 decimal places for currency
    expect(formatCurrency(1234)).toBe('$1,234.00');
  });

  it('formats a decimal amount', () => {
    expect(formatCurrency(9.99)).toBe('$9.99');
  });

  it('formats zero', () => {
    // Edge case: zero should still format correctly
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats negative amounts', () => {
    // Negative money (refunds, debts) must render correctly
    expect(formatCurrency(-42.5)).toBe('-$42.50');
  });

  it('formats EUR with a different currency symbol', () => {
    // The locale affects the symbol placement; en-US puts the symbol before the amount
    expect(formatCurrency(100, 'EUR', 'en-US')).toBe('€100.00');
  });

  it('formats large numbers with thousand separators', () => {
    expect(formatCurrency(1_000_000)).toBe('$1,000,000.00');
  });
});

// ─────────────────────────────────────────────────────────────────
// truncate
// ─────────────────────────────────────────────────────────────────
describe('truncate', () => {
  it('returns the original string when it fits within maxLength', () => {
    // When str.length <= maxLength, no truncation should happen
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('returns the string unchanged when length equals maxLength exactly', () => {
    // Boundary condition: length === maxLength — should NOT truncate
    const str = 'Hello';
    expect(truncate(str, 5)).toBe('Hello');
  });

  it('truncates and appends the default "..." suffix', () => {
    // "Hello, World!" is 13 chars; maxLength=8 means we want 8 total chars
    // suffix "..." is 3 chars, so we keep 5 chars: "Hello" + "..." = "Hello..."
    expect(truncate('Hello, World!', 8)).toBe('Hello...');
  });

  it('uses a custom suffix when provided', () => {
    // IMPORTANT: "…" (U+2026 HORIZONTAL ELLIPSIS) is a SINGLE Unicode code point
    // but in JavaScript, string.length counts UTF-16 code units.
    // '…'.length === 1  ← correct for this character (it fits in one code unit)
    //
    // However, truncate() uses suffix.length to measure. Let's verify:
    //   '…'.length === 1, so maxLength 8 - 1 = 7 chars of original
    //   'Hello, World!'.slice(0, 7) = 'Hello, '  → 'Hello, ' + '…' = 'Hello, …'
    //
    // The comment was wrong before — the result IS 'Hello, …' (7 original chars + suffix),
    // not 'Hello, W…'. The 8th char of 'Hello, World!' is 'W', which gets excluded
    // because we need room for the 1-char suffix.
    expect(truncate('Hello, World!', 8, '…')).toBe('Hello, …');
    // Verify the total length is exactly maxLength
    expect(truncate('Hello, World!', 8, '…')).toHaveLength(8);
  });

  it('truncates to exactly maxLength characters including suffix', () => {
    const result = truncate('abcdefghij', 6);
    // result should be "abc..." — exactly 6 chars total
    expect(result).toHaveLength(6);
    expect(result).toBe('abc...');
  });

  it('handles empty string', () => {
    // Empty string has length 0, which is <= any positive maxLength
    expect(truncate('', 5)).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────────
// slugify
// ─────────────────────────────────────────────────────────────────
describe('slugify', () => {
  it('converts spaces to hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('lowercases the string', () => {
    expect(slugify('HELLO WORLD')).toBe('hello-world');
  });

  it('removes special characters', () => {
    // Punctuation that is not a word character, space, or hyphen is stripped
    expect(slugify('Hello, World!')).toBe('hello-world');
  });

  it('collapses multiple spaces/hyphens into one hyphen', () => {
    expect(slugify('Hello   World')).toBe('hello-world');
    expect(slugify('Hello---World')).toBe('hello-world');
  });

  it('strips leading and trailing hyphens', () => {
    // trim() handles leading/trailing spaces; the final replace handles leftover hyphens
    expect(slugify('  hello world  ')).toBe('hello-world');
  });

  it('handles a blog post title', () => {
    expect(slugify('10 Tips for Writing Clean Code')).toBe(
      '10-tips-for-writing-clean-code'
    );
  });

  it('handles a string that is already a valid slug', () => {
    expect(slugify('already-a-slug')).toBe('already-a-slug');
  });
});

// ─────────────────────────────────────────────────────────────────
// pluralize
// ─────────────────────────────────────────────────────────────────
describe('pluralize', () => {
  it('returns singular form for count of 1', () => {
    expect(pluralize(1, 'item')).toBe('1 item');
  });

  it('returns plural form for count of 0', () => {
    // 0 items — grammatically plural in English
    expect(pluralize(0, 'item')).toBe('0 items');
  });

  it('returns plural form for count > 1', () => {
    expect(pluralize(5, 'item')).toBe('5 items');
  });

  it('auto-generates plural by appending "s" when no plural provided', () => {
    expect(pluralize(2, 'cat')).toBe('2 cats');
  });

  it('uses the explicit plural form when provided', () => {
    // Irregular plurals: "child" → "children", not "childs"
    expect(pluralize(2, 'child', 'children')).toBe('2 children');
  });

  it('uses explicit plural for count of 0 too', () => {
    expect(pluralize(0, 'child', 'children')).toBe('0 children');
  });

  it('uses singular (not explicit plural) for count of 1', () => {
    expect(pluralize(1, 'child', 'children')).toBe('1 child');
  });
});

// ─────────────────────────────────────────────────────────────────
// capitalize
// ─────────────────────────────────────────────────────────────────
describe('capitalize', () => {
  it('uppercases the first character and lowercases the rest', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('lowercases an all-caps string', () => {
    // "HELLO" → "Hello", not "HELLO"
    expect(capitalize('HELLO')).toBe('Hello');
  });

  it('handles a mixed-case string', () => {
    expect(capitalize('hElLo WoRlD')).toBe('Hello world');
  });

  it('returns an empty string unchanged', () => {
    // Guard clause: `if (!str) return str` — must not crash on empty input
    expect(capitalize('')).toBe('');
  });

  it('handles a single character', () => {
    expect(capitalize('a')).toBe('A');
    expect(capitalize('Z')).toBe('Z');
  });

  it('handles a string that starts with a number', () => {
    // Numbers have no uppercase, charAt(0).toUpperCase() is a no-op for digits
    expect(capitalize('123abc')).toBe('123abc');
  });
});
