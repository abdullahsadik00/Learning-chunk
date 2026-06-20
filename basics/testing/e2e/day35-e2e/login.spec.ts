// ═══════════════════════════════════════════════════════════════
// DAY 35: E2E TESTING WITH PLAYWRIGHT — Login Form
// ═══════════════════════════════════════════════════════════════
//
// ── FORM TESTING PATTERNS ────────────────────────────────────────
//
// Forms are one of the most important things to E2E test because:
//  • They involve user input, validation, async state, and error UI
//  • Bugs in forms directly block users from completing tasks
//  • Unit tests mock fetch/submit — E2E tests see the real flow
//
// KEY PATTERNS:
//
// 1. FILL AND SUBMIT:
//    await page.getByLabel('Email').fill('user@example.com');
//    await page.getByRole('button', { name: 'Sign In' }).click();
//
// 2. WAIT FOR ASYNC RESULT (after network/timeout):
//    await expect(page.getByTestId('success-message')).toBeVisible();
//    // Playwright auto-retries this until it's true or times out.
//    // Default timeout is 30 seconds — set in playwright.config.ts.
//
// 3. CHECK DISABLED STATE:
//    await expect(submitButton).toBeDisabled();
//
// 4. CHECK THAT ERROR IS VISIBLE:
//    await expect(page.getByTestId('error-message')).toBeVisible();
//    await expect(page.getByTestId('error-message')).toHaveText('Email is required');
//
// ── HOW THE LOGINFORM COMPONENT WORKS ───────────────────────────
//
// (Reading the actual component code before writing tests is critical.
//  Tests should reflect real behaviour, not assumed behaviour.)
//
// ValidationLoginForm.tsx validates in this order:
//  1. Is email empty? → "Email is required"
//  2. Is email format valid? → "Invalid email" (or validateEmail message)
//  3. Is password empty? → "Password is required"
//  4. All good → setIsLoading(true), wait 1s, setSuccessEmail(email)
//
// During loading:
//  • submit button text → "Signing in..."
//  • submit button is disabled
//  • both inputs are disabled
//
// After success:
//  • data-testid="success-message" appears
//  • text: "Logged in as {email}"
//
// IMPORTANT: The component does NOT validate the password format or
// call a real server — any non-empty password succeeds after 1 second.
// So "Password1!" works, but so does "abc". The E2E tests treat
// "user@example.com" + "Password1!" as the canonical "valid" credentials.
//
// ── SCREENSHOT ON FAILURE ────────────────────────────────────────
//
// playwright.config.ts sets: trace: 'on-first-retry'
// On first retry after a test failure, Playwright captures a full
// trace (screenshots, DOM snapshots, network log) viewable with:
//   npx playwright show-report
//
// You can also capture manual screenshots in tests:
//   await page.screenshot({ path: 'debug.png' });

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Login Form', () => {
  // ── SETUP ───────────────────────────────────────────────────
  //
  // Each test navigates to the root page. The LoginForm is rendered
  // there alongside Counter and TodoList.

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // ── TEST 1: EMPTY EMAIL VALIDATION ──────────────────────────
  //
  // Submitting with no email should immediately show an error.
  // No async work happens — validation is synchronous.
  // There is NO network request, so we don't need to wait.

  test('shows validation error for empty email', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // ACT: click submit without filling anything
    await loginPage.submitEmpty();

    // ASSERT: error message is visible with the correct text.
    // toHaveText() does an *exact* match by default.
    // Pass a regex for partial: toHaveText(/required/)
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toHaveText('Email is required');

    // ASSERT: success message should NOT appear
    await expect(loginPage.successMessage).toBeHidden();
  });

  // ── TEST 2: INVALID EMAIL FORMAT VALIDATION ──────────────────
  //
  // The component uses validateEmail() from utils/validators.ts.
  // A string without "@" is invalid — the error message varies
  // by the validator's output. We use a regex to be resilient.

  test('shows validation error for invalid email format', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // ACT: type a clearly invalid email and submit
    await loginPage.fillEmail('notanemail');
    await loginPage.submitButton.click();

    // ASSERT: some error message appears.
    // We use /invalid/i (case-insensitive regex) because the exact
    // error text ("Invalid email format", "Invalid email", etc.) might
    // vary as the validator evolves. Regex is more resilient here.
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toHaveText(/invalid/i);
  });

  // ── TEST 3: MISSING PASSWORD VALIDATION ──────────────────────
  //
  // Fill a valid email but leave password empty.
  // The component validates email first, then password.

  test('shows validation error for empty password', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.fillEmail('user@example.com');
    // Do NOT fill password — leave it empty
    await loginPage.submitButton.click();

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toHaveText('Password is required');
  });

  // ── TEST 4: LOADING STATE DURING SUBMISSION ──────────────────
  //
  // This is one of the trickier E2E patterns: testing TRANSIENT state.
  //
  // The component does:
  //   setIsLoading(true) → wait 1000ms → setIsLoading(false)
  //
  // We need to assert that the disabled state EXISTS during those 1000ms.
  //
  // APPROACH: click submit, then immediately assert isDisabled.
  // Playwright is fast enough to catch the disabled state before the
  // 1-second timeout resolves.
  //
  // If you click and then await some slow operation before asserting,
  // you might miss the window. Keep assertions as immediate as possible.

  test('shows loading state during submission', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Fill valid credentials
    await loginPage.fillEmail('user@example.com');
    await loginPage.fillPassword('Password1!');

    // ACT: click submit — this starts the 1-second fake async operation
    await loginPage.submitButton.click();

    // ASSERT: button is immediately disabled while loading.
    // Playwright's auto-retry will catch this even if there's a brief
    // React render tick before the disabled attribute appears.
    await expect(loginPage.submitButton).toBeDisabled();

    // ASSERT: button text changes to "Signing in..." during loading.
    // toHaveText() auto-retries, so it handles the React re-render timing.
    await expect(loginPage.submitButton).toHaveText('Signing in...');

    // ASSERT: inputs are also disabled during loading
    await expect(loginPage.emailInput).toBeDisabled();
    await expect(loginPage.passwordInput).toBeDisabled();

    // After the 1-second delay, everything re-enables and success shows.
    // We wait for success as a signal that loading completed.
    // timeout: 5000 gives plenty of headroom for the 1s delay + render.
    await expect(loginPage.successMessage).toBeVisible({ timeout: 5000 });
  });

  // ── TEST 5: SUCCESSFUL LOGIN ──────────────────────────────────
  //
  // The happy path: valid email + non-empty password → success.
  //
  // The component simulates async work with setTimeout(1000).
  // Our assertion must wait for the success message to appear.
  // We DON'T need explicit sleeps — expect().toBeVisible() retries
  // until the element appears (or times out at 30s by default).
  //
  // WHY not mock the delay?
  //  In real E2E tests we DON'T mock network requests (that's for
  //  integration tests). We test the ACTUAL behaviour, including wait times.
  //  The 1-second delay is fine — Playwright's default 30s timeout covers it.

  test('shows success message on valid login', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // ACT: log in with valid credentials
    await loginPage.login('user@example.com', 'Password1!');

    // ASSERT: success message appears after the async operation.
    // toBeVisible() retries until visible or timeout — no explicit wait needed.
    await expect(loginPage.successMessage).toBeVisible();

    // ASSERT: success message contains the email that was used.
    // The component renders: "Logged in as {email}"
    await expect(loginPage.successMessage).toHaveText('Logged in as user@example.com');

    // ASSERT: no error message shown on a successful login
    await expect(loginPage.errorMessage).toBeHidden();

    // ASSERT: submit button returns to its normal (non-loading) state
    await expect(loginPage.submitButton).toBeEnabled();
    await expect(loginPage.submitButton).toHaveText('Sign In');
  });

  // ── TEST 6: ERROR CLEARS ON INPUT CHANGE ─────────────────────
  //
  // The component calls setError('') inside the onChange handler.
  // This is a UX detail — after seeing an error, the user starts
  // typing and the error disappears, giving immediate feedback.

  test('clears error message when user starts typing', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // First trigger an error
    await loginPage.submitEmpty();
    await expect(loginPage.errorMessage).toBeVisible();

    // ACT: start typing in the email field
    await loginPage.fillEmail('u');

    // ASSERT: error is gone (onChange handler calls setError(''))
    await expect(loginPage.errorMessage).toBeHidden();
  });
});
