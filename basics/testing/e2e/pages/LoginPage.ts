// ═══════════════════════════════════════════════════════════════
// PAGE OBJECT MODEL (POM) — LoginPage
// ═══════════════════════════════════════════════════════════════
//
// This POM covers the LoginForm component.
// The component behaviour (from LoginForm.tsx):
//  - Empty email  → "Email is required"
//  - Bad email    → "Invalid email" (from validateEmail utility)
//  - Empty pass   → "Password is required"
//  - Valid both   → 1 second async delay → success message
//  - While loading: submit button text changes to "Signing in..."
//    and the button (and inputs) are disabled
//
// PATTERN: Expose raw Locators for assertions, plus action methods.
// The test decides WHAT to assert; the POM decides HOW to reach the element.
//
// ── DATA-TESTID REFERENCE ───────────────────────────────────────
//
// These map directly to the component's JSX:
//   data-testid="email-input"    → <input id="email" ... />
//   data-testid="password-input" → <input id="password" ... />
//   data-testid="submit-button"  → <button type="submit" ... />
//   data-testid="error-message"  → <p> shown when error state is set
//   data-testid="success-message"→ <p> shown after successful login

import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
  // ── LOCATORS ─────────────────────────────────────────────────
  //
  // These are `readonly` to prevent accidental reassignment in tests.
  // Tests that need them can access them directly:
  //   expect(loginPage.submitButton).toBeDisabled()

  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    // We keep `page` as a local reference so action methods can call
    // page-level APIs (navigation, keyboard, etc.) if needed later.
    // If your POM only has locator interactions, you can skip storing
    // `page` — but it's a good habit for extensibility.

    this.emailInput = page.getByTestId('email-input');
    this.passwordInput = page.getByTestId('password-input');
    this.submitButton = page.getByTestId('submit-button');
    this.errorMessage = page.getByTestId('error-message');

    // successMessage doesn't exist in the DOM until login succeeds.
    // Playwright Locators are lazy — this line doesn't query the DOM.
    // Only when you call .isVisible() / .waitFor() / expect() does
    // Playwright actually look for the element.
    this.successMessage = page.getByTestId('success-message');
  }

  // ── ACTIONS ──────────────────────────────────────────────────
  //
  // `login()` is a composed action — it chains fill + fill + click.
  // Tests call this instead of repeating the three lines themselves.
  // If the form ever adds a "remember me" checkbox or CAPTCHA,
  // we extend this method — tests don't change.

  async login(email: string, password: string) {
    // fill() replaces the field's current value and triggers React's
    // onChange. Using fill() instead of type() is preferred when you
    // don't need to test intermediate keystroke states.
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);

    // click() on the submit button submits the form.
    // Playwright ensures the button is visible and not obscured
    // before clicking — this prevents flaky "element not interactable"
    // errors that plague older test tools.
    await this.submitButton.click();
  }

  // ── VARIANT ACTIONS ──────────────────────────────────────────
  //
  // Sometimes you need to submit just the email (or just the form
  // without filling anything). Separate methods keep tests readable.

  async submitEmpty() {
    // Clicking submit with empty fields triggers client-side validation.
    // No network request is made — the component guards against it.
    await this.submitButton.click();
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }
}
