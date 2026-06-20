// ═══════════════════════════════════════════════════════════════
// DAY 35: E2E TESTING WITH PLAYWRIGHT — Counter Component
// ═══════════════════════════════════════════════════════════════
//
// ── KEYBOARD INTERACTION TESTING ─────────────────────────────────
//
// Playwright can simulate keyboard interactions exactly like mouse:
//
//   await page.keyboard.press('Tab');          // global key press
//   await page.keyboard.press('Enter');        // press Enter globally
//   await locator.press('ArrowUp');            // press key on focused element
//   await page.keyboard.type('Hello World');   // type multiple characters
//   await page.keyboard.down('Shift');         // hold modifier
//   await page.keyboard.up('Shift');           // release modifier
//
// KEYBOARD vs MOUSE:
//  Some interactive elements can be triggered by keyboard but not
//  by locator.click(). Example: pressing Enter on a focused button
//  fires a 'click' event in most browsers. Testing both covers
//  users who rely on keyboard navigation (accessibility requirement).
//
// ── ACCESSIBILITY (A11Y) TESTING ─────────────────────────────────
//
// Full a11y audits use @axe-core/playwright (run automated checks).
// But even without axe, you can manually test a11y by:
//
//  1. ARIA LABELS — does every interactive element have a name?
//     expect(locator).toHaveAttribute('aria-label', 'Increment')
//     OR: getByRole('button', { name: /increment/i }) — this check
//     is built into the locator itself.
//
//  2. ARIA-LIVE REGIONS — does dynamic content announce to screen readers?
//     Screen readers watch elements with aria-live="polite" or "assertive".
//     For a counter, the current count should be in an aria-live region.
//     The Counter component uses: <span data-testid="count" aria-live="polite">
//
//  3. TABBING ORDER — can users reach all interactive elements via Tab?
//     Test by pressing Tab repeatedly and checking focus.
//
//  4. DISABLED STATES — does the UI reflect when actions are impossible?
//     A counter with min=-10 should disable Decrement at -10.
//
// ── HOW THE COUNTER COMPONENT WORKS ─────────────────────────────
//
// Counter.tsx renders:
//   <button aria-label="Decrement" disabled={count <= min}> − </button>
//   <span data-testid="count" aria-live="polite">{count}</span>
//   <button aria-label="Increment" disabled={count >= max}> + </button>
//   <button aria-label="Reset"> Reset </button>
//
// Default props: initialCount=0, step=1, min=-Infinity, max=Infinity
// So no min/max constraints apply in these tests — buttons never disable.
//
// The inner text of Decrement is the Unicode minus sign "−" (U+2212),
// not the hyphen-minus "-" (U+002D). This matters for text matching!
//
// ── GETBYROLE() DEEP DIVE ────────────────────────────────────────
//
// `page.getByRole('button', { name: /increment/i })` does two things:
//  1. Filters by ARIA role = button (includes <button>, role="button", etc.)
//  2. Filters by ARIA accessible name = matches /increment/i
//
// The "accessible name" is computed from (in priority order):
//  aria-labelledby → aria-label → text content → title attribute
//
// Our Counter uses `aria-label="Increment"` on the + button.
// So getByRole('button', { name: /increment/i }) matches it.
//
// WHY prefer getByRole over getByTestId for these tests?
//  getByRole tests that the button is ACCESSIBLE — that screen readers
//  can find and describe it. getByTestId only tests that it exists in DOM.
//  getByRole also tests that aria-label is set correctly.

import { test, expect } from '@playwright/test';

// ── LOCATOR HELPERS ───────────────────────────────────────────────
//
// For a simple component like Counter, a full POM is overkill.
// Instead, we define small inline helpers that build locators.
// This keeps tests readable without the overhead of a class.
//
// Alternative: use a lightweight object (not a class) as a mini-POM:
//   const counter = {
//     count: page.getByTestId('count'),
//     increment: page.getByRole('button', { name: /increment/i }),
//     ...
//   }
//
// Both approaches are valid. Use a class POM when the component is
// large, navigates, or is reused across many spec files.

test.describe('Counter Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // ── TEST 1: INITIAL COUNT ───────────────────────────────────
  //
  // Verify the counter starts at 0 (the default initialCount prop).
  // This is a "smoke test" — if this fails, nothing else will work.

  test('displays initial count of 0', async ({ page }) => {
    // getByTestId locates the <span data-testid="count"> element
    const countDisplay = page.getByTestId('count');

    // toHaveText() checks the element's textContent.
    // It trims whitespace by default, so '  0  ' matches '0'.
    await expect(countDisplay).toHaveText('0');
  });

  // ── TEST 2: INCREMENT ───────────────────────────────────────
  //
  // Using getByRole() here instead of getByTestId() — the button
  // doesn't have a data-testid, but it does have aria-label="Increment".
  // This makes the test double as an accessibility check.

  test('increments count on + click', async ({ page }) => {
    const countDisplay = page.getByTestId('count');

    // getByRole + name matches the aria-label attribute on the button.
    // { name: /increment/i } uses a regex — case-insensitive partial match.
    const incrementBtn = page.getByRole('button', { name: /increment/i });

    // ACT: click the + button once
    await incrementBtn.click();

    // ASSERT: count should now be 1
    await expect(countDisplay).toHaveText('1');
  });

  // ── TEST 3: DECREMENT ───────────────────────────────────────
  //
  // The Decrement button has aria-label="Decrement".
  // Starting from 0, clicking it once should show -1.

  test('decrements count on − click', async ({ page }) => {
    const countDisplay = page.getByTestId('count');
    const decrementBtn = page.getByRole('button', { name: /decrement/i });

    await decrementBtn.click();

    await expect(countDisplay).toHaveText('-1');
  });

  // ── TEST 4: RESET ───────────────────────────────────────────
  //
  // Reset should return the counter to its initialCount (0 by default).
  // We first increment twice to have a non-zero value, then reset.

  test('resets count to 0 after incrementing', async ({ page }) => {
    const countDisplay = page.getByTestId('count');
    const incrementBtn = page.getByRole('button', { name: /increment/i });
    const resetBtn = page.getByRole('button', { name: /reset/i });

    // ARRANGE: get to a non-zero state
    await incrementBtn.click();
    await incrementBtn.click();
    await expect(countDisplay).toHaveText('2'); // sanity check

    // ACT: reset
    await resetBtn.click();

    // ASSERT: back to 0
    await expect(countDisplay).toHaveText('0');
  });

  // ── TEST 5: ACCESSIBLE BUTTON LABELS ────────────────────────
  //
  // This test is BOTH a functional test AND an accessibility test.
  // Using getByRole() to locate elements is itself the a11y assertion:
  // if getByRole() can find the button, it means:
  //  1. The element has the correct ARIA role (button)
  //  2. The element has an accessible name (via aria-label)
  //
  // If a developer removes aria-label="Increment" from the button,
  // getByRole('button', { name: /increment/i }) will fail — catching
  // the a11y regression automatically.

  test('buttons have accessible labels', async ({ page }) => {
    // Each getByRole() here asserts that the element exists AND
    // has the correct accessible name. No extra expect() needed
    // for presence — Playwright throws if the element isn't found.

    const incrementBtn = page.getByRole('button', { name: /increment/i });
    const decrementBtn = page.getByRole('button', { name: /decrement/i });
    const resetBtn = page.getByRole('button', { name: /reset/i });

    // Verify each button is visible — confirming they're rendered
    // and not just present in the DOM but hidden.
    await expect(incrementBtn).toBeVisible();
    await expect(decrementBtn).toBeVisible();
    await expect(resetBtn).toBeVisible();

    // EXTRA: verify the accessible name is exactly right (not just regex).
    // toHaveAttribute() checks the raw DOM attribute value.
    await expect(incrementBtn).toHaveAttribute('aria-label', 'Increment');
    await expect(decrementBtn).toHaveAttribute('aria-label', 'Decrement');
    await expect(resetBtn).toHaveAttribute('aria-label', 'Reset');
  });

  // ── TEST 6: ARIA-LIVE ON COUNT DISPLAY ──────────────────────
  //
  // `aria-live="polite"` tells screen readers to announce changes
  // to this element after the user finishes their current task.
  //
  // "polite"   → announce at next opportunity (non-interrupting)
  // "assertive" → interrupt immediately (for urgent alerts like errors)
  //
  // For a counter, "polite" is correct — we don't want to interrupt
  // the user's reading flow every time they click.
  //
  // Playwright can't simulate actual screen reader behaviour, but it
  // CAN verify that the attribute is present on the right element.
  // If aria-live is missing, screen reader users won't hear count updates.

  test('count display is announced to screen readers via aria-live', async ({ page }) => {
    const countDisplay = page.getByTestId('count');

    // ASSERT: aria-live="polite" is on the count element
    await expect(countDisplay).toHaveAttribute('aria-live', 'polite');

    // ALSO ASSERT: the attribute stays present after count changes.
    // React re-renders could theoretically drop attributes if the JSX
    // lost the attribute (unlikely but worth guarding against).
    const incrementBtn = page.getByRole('button', { name: /increment/i });
    await incrementBtn.click();
    await expect(countDisplay).toHaveAttribute('aria-live', 'polite');

    // EXTRA: verify count changed AND aria-live is still intact
    await expect(countDisplay).toHaveText('1');
    await expect(countDisplay).toHaveAttribute('aria-live', 'polite');
  });

  // ── TEST 7: MULTIPLE OPERATIONS IN SEQUENCE ──────────────────
  //
  // A mini-workflow test: increment, decrement, increment, reset.
  // Tests that state is maintained correctly across multiple operations.
  //
  // This is different from unit tests which test one operation at a time.
  // E2E tests shine for verifying the interplay between operations.

  test('handles multiple operations correctly in sequence', async ({ page }) => {
    const countDisplay = page.getByTestId('count');
    const incrementBtn = page.getByRole('button', { name: /increment/i });
    const decrementBtn = page.getByRole('button', { name: /decrement/i });
    const resetBtn = page.getByRole('button', { name: /reset/i });

    await incrementBtn.click(); // 1
    await incrementBtn.click(); // 2
    await incrementBtn.click(); // 3
    await expect(countDisplay).toHaveText('3');

    await decrementBtn.click(); // 2
    await expect(countDisplay).toHaveText('2');

    await resetBtn.click(); // 0
    await expect(countDisplay).toHaveText('0');

    await decrementBtn.click(); // -1
    await expect(countDisplay).toHaveText('-1');
  });
});
