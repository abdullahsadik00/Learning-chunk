// ═══════════════════════════════════════════════════════════════
// DAY 35: E2E TESTING WITH PLAYWRIGHT — Todo App
// ═══════════════════════════════════════════════════════════════
//
// E2E TEST vs INTEGRATION TEST:
//  Integration: jsdom environment, mocked APIs, fast (~50ms/test)
//  E2E:         real browser (Chromium), real DOM, real CSS,
//               real event bubbling — slower (~500ms/test) but
//               the closest thing to what a real user experiences.
//
// WHEN TO USE E2E:
//  ✅ Critical user journeys (todo CRUD, login flow, checkout)
//  ✅ Cross-browser behaviour (add Firefox/Safari in playwright.config)
//  ✅ Visual regression (use toHaveScreenshot())
//  ❌ Every edge case — too slow; use unit/integration for that
//
// THE TEST PYRAMID:
//
//       ▲  E2E  (few, slow, high confidence)
//      ▲▲▲ Integration (moderate number)
//     ▲▲▲▲▲ Unit (many, fast, narrow scope)
//
// Run only E2E when the feature is stable. Run units during TDD.
//
// ── PLAYWRIGHT LOCATOR PRIORITY ─────────────────────────────────
//
//  Prefer in this order (top = most resilient to refactors):
//  1. getByRole('button', { name: 'Add' })   — semantic HTML role
//  2. getByLabel('New todo')                  — follows <label>
//  3. getByText('Buy milk')                   — visible text
//  4. getByTestId('add-button')               — explicit test hook
//  5. locator('ul > li:first-child')          — CSS (avoid)
//
// ── AUTO-WAITING ─────────────────────────────────────────────────
//
//  Playwright auto-waits for elements to be:
//  • Attached to the DOM
//  • Visible (not display:none or visibility:hidden)
//  • Stable (not animating)
//  • Enabled (not disabled)
//  • Receiving events (not covered by another element)
//  before performing actions. You rarely need explicit waits.
//
// ── ASSERTIONS (expect API) ──────────────────────────────────────
//
//  All Playwright expect assertions are also auto-retrying.
//  They poll until the condition is true or the timeout expires.
//
//  expect(locator).toBeVisible()          — element is in DOM + visible
//  expect(locator).toBeHidden()           — element absent or hidden
//  expect(locator).toHaveText('Hello')    — exact or regex text match
//  expect(locator).toHaveCount(3)         — number of matching elements
//  expect(locator).toBeEnabled/Disabled() — interactive state
//  expect(locator).toHaveAttribute('x','y')— DOM attribute check
//  expect(page).toHaveURL('/path')        — URL assertion

import { test, expect } from '@playwright/test';
import { TodoPage } from '../pages/TodoPage';

// ── DESCRIBE BLOCK ───────────────────────────────────────────────
//
// `test.describe()` groups related tests. This affects:
//  - HTML report grouping (tests appear under a shared heading)
//  - `test.describe.configure({ mode: 'serial' })` to disable parallel
//    run inside the group (needed when tests share state)
//
// By default Playwright runs describe blocks in parallel across files,
// but tests WITHIN a file run serially in order. Each test gets a
// fresh browser page via the `page` fixture.

test.describe('Todo CRUD', () => {
  // ── BEFOREEACH ─────────────────────────────────────────────────
  //
  // `test.beforeEach` runs before every test in this describe block.
  // Use it to navigate to a known starting state.
  //
  // WHY navigate here instead of in each test?
  //  DRY principle. If the URL changes, fix it in one place.
  //
  // WHY not use `beforeAll`?
  //  `beforeAll` runs once and tests share state — a todo added in
  //  test 1 would still be there in test 2. Each test should start
  //  with a clean slate. Playwright's `page` fixture gives each test
  //  a fresh browser context (no cookies/localStorage bleed-through).

  test.beforeEach(async ({ page }) => {
    const todoPage = new TodoPage(page);
    await todoPage.goto();
  });

  // ── TEST 1: ADD A TODO ─────────────────────────────────────────
  //
  // ARRANGE → ACT → ASSERT (AAA pattern):
  //  Arrange: POM is constructed, page is at '/'
  //  Act:     call addTodo()
  //  Assert:  verify the item appears in the list

  test('adds a new todo', async ({ page }) => {
    // `page` is Playwright's built-in fixture — a fresh browser page
    // for each test. We inject it into our POM.
    const todoPage = new TodoPage(page);

    // ACT: type the text and click Add
    await todoPage.addTodo('Buy groceries');

    // ASSERT: the item should appear in the todo list.
    // getByText() searches the entire page for visible text.
    // It's resilient — we don't care about the exact HTML structure.
    await expect(page.getByText('Buy groceries')).toBeVisible();

    // EXTRA ASSERT: the input should be cleared after adding.
    // This verifies the component resets inputValue state correctly.
    await expect(todoPage.input).toHaveValue('');
  });

  // ── TEST 2: EMPTY TODO PREVENTION ──────────────────────────────
  //
  // The component trims whitespace and returns early if empty.
  // We verify the guard by checking the list count stays at 0
  // and the empty-state message stays visible.

  test('cannot add an empty todo', async ({ page }) => {
    const todoPage = new TodoPage(page);

    // ACT: click Add without typing anything
    await todoPage.addButton.click();

    // ASSERT: the empty-state paragraph is still visible.
    // data-testid="empty-state" is the <p> the component renders
    // when todos.length === 0. If a todo were added, it would disappear.
    await expect(page.getByTestId('empty-state')).toBeVisible();

    // EXTRA: also try a whitespace-only string — should still be blocked.
    await todoPage.input.fill('   ');
    await todoPage.addButton.click();
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  // ── TEST 3: MARK TODO AS COMPLETE ──────────────────────────────
  //
  // After adding a todo and clicking the checkbox, the component
  // sets todo.completed = true, which applies:
  //   style={{ textDecoration: 'line-through', opacity: 0.6 }}
  //
  // We verify the visual state change by checking CSS properties.
  // toHaveCSS() reads the *computed* style — accounting for
  // inheritance and browser defaults.

  test('marks a todo as complete', async ({ page }) => {
    const todoPage = new TodoPage(page);

    // ARRANGE: add a todo so we have something to toggle
    await todoPage.addTodo('Write tests');

    // Get the UUID that the component assigned to this todo.
    // We need it to build the dynamic data-testid selectors.
    const id = await todoPage.getFirstTodoId();

    // The <li> element — we'll check its CSS on this.
    const todoItem = page.getByTestId(`todo-item-${id}`);

    // ASSERT initial state: not struck through
    await expect(todoItem).toHaveCSS('text-decoration-line', 'none');

    // ACT: click the checkbox to mark as complete
    await todoPage.toggleTodo(id);

    // ASSERT completed visual state:
    //  line-through comes from style.textDecoration on the <li>
    await expect(todoItem).toHaveCSS('text-decoration-line', 'line-through');

    // EXTRA: verify opacity is reduced
    // toHaveCSS checks computed values — '0.6' as a string.
    await expect(todoItem).toHaveCSS('opacity', '0.6');
  });

  // ── TEST 4: DELETE A TODO ───────────────────────────────────────
  //
  // Clicking the Delete button calls onDelete(id) which filters
  // the todo out of the state array. The component re-renders
  // and the <li> disappears from the DOM.
  //
  // IMPORTANT: After deletion, the element is REMOVED from the DOM.
  // Use toBeHidden() or toHaveCount(0) — NOT toBeVisible(false).
  // Playwright distinguishes "not visible" from "not in DOM".

  test('deletes a todo', async ({ page }) => {
    const todoPage = new TodoPage(page);

    await todoPage.addTodo('Walk the dog');
    const id = await todoPage.getFirstTodoId();

    // ACT: click the Delete button for this todo
    await todoPage.deleteTodo(id);

    // ASSERT: the item's <li> is gone from the DOM.
    // toBeHidden() passes if element is absent OR hidden.
    await expect(page.getByTestId(`todo-item-${id}`)).toBeHidden();

    // ASSERT: back to the empty state
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  // ── TEST 5: FULL CRUD FLOW ──────────────────────────────────────
  //
  // This is a "happy path" integration scenario that exercises the
  // complete lifecycle: add → delete middle → complete first → verify.
  //
  // Keep this kind of multi-step test to a minimum — if it fails,
  // it's hard to pinpoint exactly what broke. Use focused tests
  // (like tests 1-4 above) for targeted debugging.
  //
  // The value of this test: it catches regressions in state management
  // across multiple operations (e.g. array index bugs when deleting).

  test('full CRUD flow — add three, delete middle, complete first', async ({ page }) => {
    const todoPage = new TodoPage(page);

    // ── STEP 1: Add three todos in sequence ───────────────────
    await todoPage.addTodo('First task');
    await todoPage.addTodo('Second task');
    await todoPage.addTodo('Third task');

    // Verify all three appear
    await expect(page.getByText('First task')).toBeVisible();
    await expect(page.getByText('Second task')).toBeVisible();
    await expect(page.getByText('Third task')).toBeVisible();

    // Count sanity check — the list should have exactly 3 items
    const countAfterAdd = await todoPage.getTodoCount();
    expect(countAfterAdd).toBe(3);

    // ── STEP 2: Delete the middle todo ("Second task") ────────
    //
    // Todos are rendered in insertion order (array order).
    // nth(0) = First, nth(1) = Second, nth(2) = Third.
    const secondId = await todoPage.getNthTodoId(1);
    await todoPage.deleteTodo(secondId);

    // "Second task" should no longer appear
    await expect(page.getByText('Second task')).toBeHidden();

    // List should now have 2 items
    const countAfterDelete = await todoPage.getTodoCount();
    expect(countAfterDelete).toBe(2);

    // ── STEP 3: Mark the first todo as complete ────────────────
    //
    // After deleting the middle, nth(0) is still "First task".
    const firstId = await todoPage.getNthTodoId(0);
    await todoPage.toggleTodo(firstId);

    // Verify the completed styling is applied
    const firstItem = page.getByTestId(`todo-item-${firstId}`);
    await expect(firstItem).toHaveCSS('text-decoration-line', 'line-through');

    // ── STEP 4: Verify final state ─────────────────────────────
    //
    // Only "First task" (completed) and "Third task" (active) remain.
    expect(await todoPage.getTodoCount()).toBe(2);
    await expect(page.getByText('First task')).toBeVisible();
    await expect(page.getByText('Third task')).toBeVisible();
    await expect(page.getByText('Second task')).toBeHidden();
  });
});
