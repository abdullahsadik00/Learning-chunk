// ═══════════════════════════════════════════════════════════════
// PAGE OBJECT MODEL (POM) — TodoPage
// ═══════════════════════════════════════════════════════════════
//
// WHY PAGE OBJECTS?
//  Without POM: every test repeats locator logic — brittle, hard to maintain
//  With POM:    locators defined once, tests call semantic methods
//
// WHEN A SELECTOR CHANGES:
//  Without POM: update every test file that uses that element
//  With POM:    update ONE method in ONE file
//
// DESIGN RULE: Page Objects expose ACTIONS and ASSERTIONS, not raw locators.
//  ✅ todoPage.addTodo('Buy milk')
//  ❌ todoPage.inputLocator.fill('Buy milk'); todoPage.submitButton.click();
//
// The POM pattern is from Martin Fowler — it describes the *page's interface*
// in the language of the user, not the language of HTML/CSS.
//
// ── WHAT LOCATORS ARE ───────────────────────────────────────────
//
// A `Locator` is Playwright's core concept for finding elements.
// Unlike Selenium's WebElement (which is a snapshot in time and goes
// stale), Playwright Locators are *lazy* — they re-query the DOM on
// every interaction. This means:
//  - No "stale element reference" errors after re-renders
//  - Auto-retry built in (waits up to the configured timeout)
//
// LOCATOR PRIORITY (prefer higher ones — they survive refactors better):
//  1. getByRole()     — semantic role-based, most accessible
//  2. getByLabel()    — follows <label> associations
//  3. getByText()     — text content match
//  4. getByTestId()   — explicit test hook (last resort, but reliable)
//  5. locator('css')  — avoid unless no other option works
//
// ── HOW page.getByTestId() WORKS ────────────────────────────────
//
// `page.getByTestId('todo-input')` is shorthand for
// `page.locator('[data-testid="todo-input"]')`.
// The testid attribute name is configurable in playwright.config.ts
// (use: { testIdAttribute: 'data-cy' } switches it to Cypress style).

import { type Page, type Locator } from '@playwright/test';

export class TodoPage {
  // ── PUBLIC PROPERTIES ────────────────────────────────────────
  //
  // Exposing these lets tests do one-off assertions like:
  //   expect(todoPage.input).toBeDisabled()
  // without the POM having to predict every possible assertion.
  //
  // Keep them `readonly` — the POM should be the authority on
  // how to reach these elements. Tests must not reassign them.

  readonly page: Page;
  readonly input: Locator;
  readonly addButton: Locator;
  readonly todoList: Locator;

  constructor(page: Page) {
    // `page` is injected by the test — the POM doesn't create it.
    // This is dependency injection: the POM is decoupled from how
    // the page was opened, which browser context it's in, etc.
    this.page = page;

    // Locators are declared once here. Because they're lazy,
    // declaring them in the constructor costs nothing — no DOM query
    // happens until you call .click(), .fill(), .textContent(), etc.
    this.input = page.getByTestId('todo-input');
    this.addButton = page.getByTestId('add-button');

    // The <ul> that holds todo items. It only appears when there
    // is at least one todo — the component renders an "empty state"
    // paragraph otherwise. Keep that in mind in tests.
    this.todoList = page.getByTestId('todo-list');
  }

  // ── NAVIGATION ───────────────────────────────────────────────
  //
  // `goto()` belongs in the POM, not in beforeEach hooks.
  // If the URL ever changes (e.g. we add a router), fix it here.

  async goto() {
    // `page.goto()` resolves once the "load" event fires.
    // For SPAs you might need 'networkidle' or 'domcontentloaded'.
    // Playwright auto-waits for the page to be navigable before
    // each action — so actions after goto() are safe.
    await this.page.goto('/');
  }

  // ── USER ACTIONS ─────────────────────────────────────────────
  //
  // Actions are async because every Playwright interaction is async.
  // Use `await` throughout — Playwright does NOT throw on missing
  // awaits at compile time; missing awaits causes silent race conditions.

  async addTodo(text: string) {
    // fill() clears the field first, then types the text.
    // It triggers React's synthetic onChange event correctly.
    // Contrast with type() which appends character-by-character
    // (useful for testing mid-input state, but slower here).
    await this.input.fill(text);

    // click() auto-waits for the button to be visible AND enabled.
    // If the button is hidden or disabled, Playwright retries until
    // the configured timeout (default 30s). If still not clickable,
    // the test fails with a clear timeout error.
    await this.addButton.click();
  }

  async toggleTodo(id: string) {
    // Dynamic testids: the component renders data-testid="todo-checkbox-{uuid}".
    // We build the selector string from the id passed in.
    // In tests, capture the id after adding a todo by reading it
    // from the DOM (see todo.spec.ts for the helper pattern).
    await this.page.getByTestId(`todo-checkbox-${id}`).click();
  }

  async deleteTodo(id: string) {
    await this.page.getByTestId(`todo-delete-${id}`).click();
  }

  // ── QUERIES ──────────────────────────────────────────────────
  //
  // Methods that return data (not void) are "queries".
  // They should NOT assert — that's the test's job.
  // Keep queries pure: they read state, tests decide what's correct.

  async getTodoCount(): Promise<number> {
    // locator(selector) on an existing Locator scopes the query to
    // that element's subtree — like querySelector inside a node.
    //
    // `[data-testid^="todo-item-"]` uses the CSS "starts with" (^=)
    // attribute selector to match all todo items regardless of their
    // dynamic UUID suffix.
    //
    // .count() returns the number of matching elements without
    // asserting anything — useful for storing in a variable.
    return this.todoList.locator('[data-testid^="todo-item-"]').count();
  }

  // ── HELPER: GET FIRST TODO ID ────────────────────────────────
  //
  // Because the app uses crypto.randomUUID() for IDs we can't predict
  // them up front. This helper reads the actual DOM attribute so tests
  // can build the dynamic testids (todo-checkbox-{id}, todo-delete-{id}).

  async getFirstTodoId(): Promise<string> {
    // getAttribute() returns the raw attribute value or null.
    // We assert non-null with `!` because if there are no todos,
    // the test setup is broken — let it crash with a clear error.
    const testid = await this.todoList
      .locator('[data-testid^="todo-item-"]')
      .first()
      .getAttribute('data-testid');

    // Strip the "todo-item-" prefix to get the bare UUID.
    return testid!.replace('todo-item-', '');
  }

  async getNthTodoId(index: number): Promise<string> {
    const testid = await this.todoList
      .locator('[data-testid^="todo-item-"]')
      .nth(index)
      .getAttribute('data-testid');
    return testid!.replace('todo-item-', '');
  }
}
