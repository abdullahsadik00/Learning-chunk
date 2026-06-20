// ═══════════════════════════════════════════════════════════════
// DAY 31: UNIT TESTING WITH VITEST — Validators
// ═══════════════════════════════════════════════════════════════
//
// KEY CONCEPT — toEqual vs toBe:
//
//  toBe(value)
//    Uses Object.is() — the same as ===.
//    Correct for primitives: strings, numbers, booleans.
//    WRONG for objects and arrays: two different objects with identical
//    content will NOT be === each other.
//
//  toEqual(value)
//    Deep equality check — recursively compares every property.
//    Always use toEqual when asserting on objects or arrays.
//
//  Example:
//    expect({ valid: true }).toBe({ valid: true })    // ❌ FAILS — different refs
//    expect({ valid: true }).toEqual({ valid: true }) // ✅ PASSES — same shape
//
// KEY CONCEPT — testing errors without throwing:
//
//  Our validators never throw — they return error objects/arrays.
//  That makes them easy to test: just call the function and assert on
//  the return value. Contrast this with functions that DO throw, where
//  you need:  expect(() => fn()).toThrow('message')
//  (See calculations.test.ts for that pattern.)
//
// KEY CONCEPT — toContain for arrays:
//
//  expect(array).toContain(item)
//    Checks that `item` is in `array` using ===.
//    Great for checking one error message without caring about order or
//    whether other errors are also present.
//
//  expect(array).toEqual(expect.arrayContaining([...]))
//    Checks that the array contains ALL listed items (in any order).
//    Use when you want to assert multiple items at once.

import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword, validateForm } from '@/utils/validators';

// ─────────────────────────────────────────────────────────────────
// validateEmail
// ─────────────────────────────────────────────────────────────────
describe('validateEmail', () => {
  // ── Happy path ──────────────────────────────────────────────
  it('returns valid:true for a well-formed email', () => {
    // toEqual does deep comparison — the returned object has the same shape
    // and values as the expected object, even though they are not the same reference.
    expect(validateEmail('user@example.com')).toEqual({ valid: true });
  });

  it('returns valid:true for emails with subdomains', () => {
    expect(validateEmail('user@mail.example.com')).toEqual({ valid: true });
  });

  it('returns valid:true for emails with plus addressing', () => {
    // "user+tag@example.com" is a standard email trick for filtering
    expect(validateEmail('user+tag@example.com')).toEqual({ valid: true });
  });

  // ── Empty / missing input ────────────────────────────────────
  it('returns valid:false with "Email is required" for an empty string', () => {
    // The first guard in validateEmail handles the empty case before the regex
    expect(validateEmail('')).toEqual({ valid: false, error: 'Email is required' });
  });

  // ── Invalid formats ──────────────────────────────────────────
  it('returns valid:false for an email without @', () => {
    expect(validateEmail('notanemail')).toEqual({
      valid: false,
      error: 'Invalid email format',
    });
  });

  it('returns valid:false for an email without a domain', () => {
    expect(validateEmail('user@')).toEqual({
      valid: false,
      error: 'Invalid email format',
    });
  });

  it('returns valid:false for an email without a TLD', () => {
    // "user@example" has no dot after the @, so /^[^\s@]+@[^\s@]+\.[^\s@]+$/ fails
    expect(validateEmail('user@example')).toEqual({
      valid: false,
      error: 'Invalid email format',
    });
  });

  it('returns valid:false for an email with spaces', () => {
    expect(validateEmail('user @example.com')).toEqual({
      valid: false,
      error: 'Invalid email format',
    });
  });

  it('returns valid:false for an email with double @', () => {
    expect(validateEmail('user@@example.com')).toEqual({
      valid: false,
      error: 'Invalid email format',
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// validatePassword
// ─────────────────────────────────────────────────────────────────
describe('validatePassword', () => {
  // ── Happy path ───────────────────────────────────────────────
  it('returns valid:true and empty errors for a strong password', () => {
    // Meets all four rules: length >= 8, uppercase, number, special char
    const result = validatePassword('Secure1!');
    expect(result.valid).toBe(true);

    // toHaveLength(0) — checks array.length === 0
    // Clearer than expect(result.errors).toEqual([])
    expect(result.errors).toHaveLength(0);
  });

  // ── Individual rule violations ───────────────────────────────
  it('reports an error when password is too short', () => {
    const result = validatePassword('Ab1!');

    // The password is invalid overall
    expect(result.valid).toBe(false);

    // toContain checks that this SPECIFIC error is in the array.
    // Other errors may also be present — we don't care, just that this one is.
    expect(result.errors).toContain('Must be at least 8 characters');
  });

  it('reports an error when there is no uppercase letter', () => {
    const result = validatePassword('secure1!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Must contain at least one uppercase letter');
  });

  it('reports an error when there is no number', () => {
    const result = validatePassword('SecurePass!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Must contain at least one number');
  });

  it('reports an error when there is no special character', () => {
    const result = validatePassword('Secure123');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Must contain at least one special character');
  });

  // ── Multiple violations ───────────────────────────────────────
  it('reports multiple errors when several rules are violated', () => {
    // "abc" — too short, no uppercase, no number, no special char → 4 errors
    const result = validatePassword('abc');
    expect(result.valid).toBe(false);

    // expect.arrayContaining([...]) — asserts that ALL listed items are present
    // in the array, in any order, even if there are additional items.
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'Must be at least 8 characters',
        'Must contain at least one uppercase letter',
        'Must contain at least one number',
        'Must contain at least one special character',
      ])
    );
    expect(result.errors).toHaveLength(4);
  });

  it('returns valid:false and four errors for an empty password', () => {
    const result = validatePassword('');
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(4);
  });

  // ── Boundary: exactly 8 characters ───────────────────────────
  it('accepts exactly 8 characters (boundary condition)', () => {
    // "Aa1!aaaa" — exactly 8 chars, meets all rules
    const result = validatePassword('Aa1!aaaa');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects exactly 7 characters (one below boundary)', () => {
    // "Aa1!aaa" — 7 chars, otherwise meets all rules
    const result = validatePassword('Aa1!aaa');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Must be at least 8 characters');
  });
});

// ─────────────────────────────────────────────────────────────────
// validateForm
// ─────────────────────────────────────────────────────────────────
//
// validateForm is a generic multi-field validator. It takes:
//  fields: { fieldName: currentValue }
//  rules:  { fieldName: { required?, minLength?, maxLength?, pattern? } }
// Returns: { fieldName: errorMessage } — empty object means no errors.
//
describe('validateForm', () => {
  // ── No errors ────────────────────────────────────────────────
  it('returns an empty errors object when all fields are valid', () => {
    const fields = { username: 'alice', email: 'alice@example.com' };
    const rules = {
      username: { required: true, minLength: 3 },
      email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    };
    const errors = validateForm(fields, rules);

    // toEqual({}) — asserts the object has no properties at all
    expect(errors).toEqual({});
  });

  // ── required rule ────────────────────────────────────────────
  it('reports a required error when a field is empty', () => {
    const fields = { username: '' };
    const rules = { username: { required: true } };
    const errors = validateForm(fields, rules);

    // Access specific property from the errors object
    expect(errors.username).toBe('username is required');
  });

  it('reports a required error when a field is only whitespace', () => {
    // The rule uses value.trim() before checking — spaces-only counts as empty
    const fields = { username: '   ' };
    const rules = { username: { required: true } };
    const errors = validateForm(fields, rules);
    expect(errors.username).toBe('username is required');
  });

  it('treats a missing field as an empty string (does not crash)', () => {
    // fields doesn't have the key — the validator uses `?? ''` as fallback
    const fields = {};
    const rules = { username: { required: true } };
    const errors = validateForm(fields as Record<string, string>, rules);
    expect(errors.username).toBe('username is required');
  });

  // ── minLength rule ───────────────────────────────────────────
  it('reports a minLength error when value is too short', () => {
    const fields = { username: 'ab' };
    const rules = { username: { minLength: 3 } };
    const errors = validateForm(fields, rules);
    expect(errors.username).toBe('username must be at least 3 characters');
  });

  it('passes when value is exactly minLength', () => {
    const fields = { username: 'abc' };
    const rules = { username: { minLength: 3 } };
    const errors = validateForm(fields, rules);
    expect(errors.username).toBeUndefined(); // no error for this field
  });

  // ── maxLength rule ───────────────────────────────────────────
  it('reports a maxLength error when value is too long', () => {
    const fields = { bio: 'a'.repeat(201) };
    const rules = { bio: { maxLength: 200 } };
    const errors = validateForm(fields, rules);
    expect(errors.bio).toBe('bio must be at most 200 characters');
  });

  it('passes when value is exactly maxLength', () => {
    const fields = { bio: 'a'.repeat(200) };
    const rules = { bio: { maxLength: 200 } };
    const errors = validateForm(fields, rules);
    expect(errors.bio).toBeUndefined();
  });

  // ── pattern rule ─────────────────────────────────────────────
  it('reports a pattern error when the value does not match', () => {
    const fields = { zipCode: 'ABCDE' };
    const rules = { zipCode: { pattern: /^\d{5}$/ } };
    const errors = validateForm(fields, rules);
    expect(errors.zipCode).toBe('zipCode format is invalid');
  });

  it('passes when the value matches the pattern', () => {
    const fields = { zipCode: '90210' };
    const rules = { zipCode: { pattern: /^\d{5}$/ } };
    const errors = validateForm(fields, rules);
    expect(errors.zipCode).toBeUndefined();
  });

  // ── Multiple fields ──────────────────────────────────────────
  it('validates multiple fields simultaneously and collects all errors', () => {
    const fields = { username: '', email: 'not-an-email', bio: 'hi' };
    const rules = {
      username: { required: true },
      email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      bio: { minLength: 10 },
    };
    const errors = validateForm(fields, rules);

    // Each invalid field should have an entry in errors
    expect(errors.username).toBe('username is required');
    expect(errors.email).toBe('email format is invalid');
    expect(errors.bio).toBe('bio must be at least 10 characters');
  });

  it('only flags invalid fields — valid fields have no entry in errors', () => {
    const fields = { username: 'alice', email: 'bad-email' };
    const rules = {
      username: { required: true, minLength: 3 },
      email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    };
    const errors = validateForm(fields, rules);

    // username is valid — it should NOT appear in errors at all
    expect(errors.username).toBeUndefined();
    // email is invalid
    expect(errors.email).toBe('email format is invalid');
  });

  // ── Rule priority: required is checked before minLength/pattern ──
  it('stops at required error and does not run minLength check on empty field', () => {
    // If a field is required and empty, we emit the "required" error and
    // `continue` — so minLength is never checked for that field.
    const fields = { username: '' };
    const rules = { username: { required: true, minLength: 5 } };
    const errors = validateForm(fields, rules);

    // Should get the "required" error, not the "minLength" error
    expect(errors.username).toBe('username is required');
  });
});
