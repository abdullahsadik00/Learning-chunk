// ═══════════════════════════════════════════════════════════════
// TESTING 05: END-TO-END TESTING WITH PLAYWRIGHT  (Day 35)
// Run E2E:      npm run test:e2e
// Run E2E UI:   npm run test:e2e:ui
// Type-check:   npm run check
// ═══════════════════════════════════════════════════════════════
//
// WHAT IS AN E2E TEST?
//  End-to-end tests drive a REAL browser against a running app.
//  They test the complete system: frontend + backend + database + browser.
//  Nothing is mocked. If the user can do it, the E2E test can do it.
//
// PLAYWRIGHT vs CYPRESS:
//
//  Feature                Playwright              Cypress
//  ─────────────────────  ─────────────────────   ─────────────────────
//  Browsers               Chrome, Firefox, Safari  Chrome only (FF beta)
//  Architecture           Out-of-process (CDP)     In-browser JavaScript
//  Parallelism            Built-in, per-file       Paid tier (Cypress Cloud)
//  Auto-wait              Yes — every action       Yes
//  Network interception   Yes (route.fulfill)      Yes (cy.intercept)
//  Multiple tabs/windows  Yes                      Limited
//  iFrame support         Yes                      Limited
//  Flakiness              Lower                    Higher (in-browser quirks)
//  Speed                  Faster on large suites   Faster on very small suites
//  Learning curve         Moderate                 Easier for beginners
//  Best for               Complex apps, CI, multi-browser  Simple apps, demos
//
// WHEN TO USE E2E:
//  ✅ Critical user flows (login, checkout, payment)
//  ✅ Cross-browser compatibility testing
//  ✅ Tests where the integration between frontend and backend matters
//  ✅ Smoke tests before a production deploy
//
// WHEN NOT TO USE E2E:
//  ❌ Every feature — too slow and brittle for 100% coverage
//  ❌ Edge cases — unit tests cover these faster
//  ❌ Error states that are hard to reproduce in a real browser
//
// HOW THIS PROJECT IS CONFIGURED (playwright.config.ts):
//
//   import { defineConfig } from '@playwright/test'
//   export default defineConfig({
//     testDir: './e2e',
//     use: {
//       baseURL: 'http://localhost:5173',  ← your Vite dev server
//       trace: 'on-first-retry',          ← trace on failure
//     },
//     webServer: {
//       command: 'npm run dev',
//       url: 'http://localhost:5173',
//       reuseExistingServer: !process.env.CI,
//     },
//   })
//
// ───────────────────────────────────────────────────────────────

// ───────────────────────────────────────────────────────────────
// 1. PLAYWRIGHT BASICS — test / expect / page
// ───────────────────────────────────────────────────────────────
//
// IMPORT:
//   import { test, expect } from '@playwright/test'
//
// test(name, async ({ page }) => { ... })
//   - `page` is a full browser page (tab) with all browser APIs
//   - Every action is async — always await
//   - Playwright auto-waits for elements to be actionable
//
// BASIC TEST STRUCTURE:
//
//   import { test, expect } from '@playwright/test'
//
//   test('page title is "Paytm"', async ({ page }) => {
//     await page.goto('/')                         // navigate
//     await expect(page).toHaveTitle('Paytm')      // assert title
//   })
//
//   test('landing page has a "Get Started" button', async ({ page }) => {
//     await page.goto('/')
//     await expect(
//       page.getByRole('link', { name: 'Get Started' })
//     ).toBeVisible()
//   })
//
// page.goto(url)
//   Navigate to URL. Resolves when 'load' event fires (default).
//   Options: { waitUntil: 'domcontentloaded' | 'networkidle' | 'commit' }
//
// TEST GROUPING:
//
//   test.describe('Login flow', () => {
//     test('shows error for wrong credentials', async ({ page }) => { ... })
//     test('redirects to dashboard on success',  async ({ page }) => { ... })
//   })

// ───────────────────────────────────────────────────────────────
// 2. LOCATORS — finding elements
// ───────────────────────────────────────────────────────────────
//
// Playwright Locators are LAZY — they don't query the DOM until you
// interact with them. Every interaction auto-retries until the element
// is visible and actionable (no "stale element" errors like Selenium).
//
// LOCATOR PRIORITY (same as Testing Library — prefer semantic):
//
//  1. page.getByRole(role, { name })
//     Semantic, accessibility-first. Survives HTML/CSS refactors.
//     page.getByRole('button', { name: 'Submit' })
//     page.getByRole('textbox', { name: 'Email' })
//     page.getByRole('heading', { name: 'Dashboard', level: 1 })
//     page.getByRole('link', { name: 'Sign In' })
//     page.getByRole('checkbox', { name: 'Remember me' })
//
//  2. page.getByLabel('Email')
//     Finds input by its associated label text.
//     Best for form inputs.
//
//  3. page.getByText('Welcome!')
//     Match by text content. Use exact: false for partial.
//     page.getByText('Buy groceries')
//     page.getByText(/buy/i)            ← regex, case-insensitive
//
//  4. page.getByPlaceholder('you@example.com')
//     Match by placeholder text.
//
//  5. page.getByAltText('Company logo')
//     For images.
//
//  6. page.getByTestId('submit-button')
//     Uses data-testid attribute. Last resort.
//     Configured via: use: { testIdAttribute: 'data-testid' }
//
//  7. page.locator('css selector')
//     Raw CSS. Only when semantic locators won't work.
//     page.locator('.todo-list li')
//     page.locator('[data-testid^="todo-item-"]')   ← attribute starts-with
//
// SCOPED LOCATORS:
//   const listItem = page.locator('li').first()
//   const deleteBtn = listItem.getByRole('button', { name: 'Delete' })
//   await deleteBtn.click()
//
// CHAINING (nth, first, last, filter):
//   page.getByRole('listitem').nth(2)           // third item (0-indexed)
//   page.getByRole('listitem').first()
//   page.getByRole('listitem').last()
//   page.getByRole('listitem').filter({ hasText: 'groceries' })

// ───────────────────────────────────────────────────────────────
// 3. ACTIONS — interacting with the page
// ───────────────────────────────────────────────────────────────
//
// All actions are async and auto-wait for the element to be:
//  - Attached to the DOM
//  - Visible (not display:none, visibility:hidden)
//  - Stable (not animating)
//  - Enabled (not disabled)
//  - Not obscured by another element
//
// KEY ACTIONS:
//
//  await locator.click()                     — left click
//  await locator.dblclick()                  — double click
//  await locator.fill('text')                — clear + type (React onChange compatible)
//  await locator.type('text')                — type char-by-char (slower, for key events)
//  await locator.press('Enter')              — press a key
//  await locator.press('Control+a')          — keyboard shortcut
//  await locator.check()                     — check a checkbox
//  await locator.uncheck()                   — uncheck
//  await locator.selectOption('value')       — select <option>
//  await locator.hover()                     — hover
//  await locator.focus()                     — focus
//  await locator.clear()                     — clear an input
//  await locator.setInputFiles('path/file')  — file upload
//
// PAGE ACTIONS:
//
//  await page.keyboard.press('Escape')
//  await page.keyboard.type('Hello World')
//  await page.mouse.move(x, y)
//  await page.mouse.click(x, y)
//  await page.waitForLoadState('networkidle')
//  await page.waitForURL('**/dashboard')     — wait for navigation
//  await page.screenshot({ path: 'snap.png' })
//
// READING VALUES:
//
//  await locator.textContent()      — element's text content
//  await locator.inputValue()       — current input value
//  await locator.getAttribute('href')
//  await locator.isVisible()        — boolean
//  await locator.isEnabled()        — boolean
//  await locator.count()            — number of matched elements

// ───────────────────────────────────────────────────────────────
// 4. ASSERTIONS — expect()
// ───────────────────────────────────────────────────────────────
//
// Playwright assertions auto-wait and auto-retry until they pass
// (or timeout). This eliminates most flakiness.
//
// ELEMENT ASSERTIONS:
//
//  await expect(locator).toBeVisible()           — visible on screen
//  await expect(locator).toBeHidden()            — hidden / not in DOM
//  await expect(locator).toBeEnabled()           — not disabled
//  await expect(locator).toBeDisabled()          — is disabled
//  await expect(locator).toBeChecked()           — checkbox is checked
//  await expect(locator).toBeEmpty()             — input has no value
//  await expect(locator).toBeFocused()           — has focus
//
//  await expect(locator).toHaveText('exact text')
//  await expect(locator).toHaveText(/regex/)
//  await expect(locator).toContainText('partial')
//  await expect(locator).toHaveValue('input value')
//  await expect(locator).toHaveAttribute('href', 'http://...')
//  await expect(locator).toHaveClass('active')
//  await expect(locator).toHaveCount(3)          — number of matching elements
//
// PAGE ASSERTIONS:
//
//  await expect(page).toHaveTitle('Page Title')
//  await expect(page).toHaveURL('https://example.com/dashboard')
//  await expect(page).toHaveURL(/\/dashboard/)
//
// SOFT ASSERTIONS — continue test after failure:
//
//  await expect.soft(locator).toBeVisible()    // logs failure but continues
//  // ... more assertions ...
//  // Test summary shows ALL soft failures at the end
//
// NEGATION:
//  await expect(locator).not.toBeVisible()
//  await expect(locator).not.toHaveText('Error')

// ───────────────────────────────────────────────────────────────
// 5. PAGE OBJECT MODEL (POM) — the pattern
// ───────────────────────────────────────────────────────────────
//
// The existing TodoPage.ts (e2e/pages/TodoPage.ts) is a perfect example.
// Here's the key pattern explained:
//
// WITHOUT POM — brittle, repetitive:
//
//   test('add a todo', async ({ page }) => {
//     await page.goto('/')
//     await page.getByTestId('todo-input').fill('Buy milk')  // duplicated in every test
//     await page.getByTestId('add-button').click()           // duplicated in every test
//     await expect(page.getByText('Buy milk')).toBeVisible()
//   })
//
// WITH POM — one source of truth:
//
//   import { TodoPage } from '../pages/TodoPage'
//
//   test('add a todo', async ({ page }) => {
//     const todoPage = new TodoPage(page)
//     await todoPage.goto()
//     await todoPage.addTodo('Buy milk')           // semantic action
//     await expect(page.getByText('Buy milk')).toBeVisible()
//   })
//
//   // If the testid changes from 'todo-input' to 'task-input':
//   // → Without POM: update 20 test files
//   // → With POM: update 1 line in TodoPage.ts
//
// POM DESIGN RULES:
//
//  1. Expose ACTIONS (verbs), not raw locators
//     ✅ todoPage.addTodo('text')       ← clear intent
//     ❌ todoPage.inputLocator          ← exposes implementation
//
//  2. Expose READ-ONLY locators for one-off assertions
//     readonly input: Locator           ← tests can check input.isDisabled() etc.
//
//  3. Queries return values, they don't assert
//     ✅ async getTodoCount(): Promise<number>   ← returns, test asserts
//     ❌ async assertTodoCount(n: number)        ← POM shouldn't assert
//
//  4. goto() belongs in the POM
//     ✅ await todoPage.goto()          ← URL change = update one place
//
//  5. Inject page, don't create it
//     constructor(page: Page)           ← page is injected by the test fixture

// ───────────────────────────────────────────────────────────────
// 6. THE EXISTING PAGE OBJECTS — LoginPage.ts and TodoPage.ts
// ───────────────────────────────────────────────────────────────
//
// LoginPage.ts lives in e2e/pages/LoginPage.ts
// It follows the same pattern as TodoPage.ts.
// Here's the interface you'd expect it to expose:
//
//   class LoginPage {
//     readonly page: Page
//     readonly emailInput: Locator      // page.getByLabel('Email')
//     readonly passwordInput: Locator   // page.getByLabel('Password')
//     readonly submitButton: Locator    // page.getByRole('button', { name: 'Sign In' })
//     readonly errorMessage: Locator    // page.getByRole('alert') or getByTestId
//
//     constructor(page: Page)
//
//     async goto(): Promise<void>       // page.goto('/login')
//     async login(email: string, password: string): Promise<void>
//       // fills email, fills password, clicks submit
//
//     async getErrorMessage(): Promise<string>
//       // returns errorMessage.textContent()
//   }
//
// USAGE IN TESTS:
//
//   import { LoginPage } from '../pages/LoginPage'
//
//   test('valid login redirects to dashboard', async ({ page }) => {
//     const loginPage = new LoginPage(page)
//     await loginPage.goto()
//     await loginPage.login('alice@example.com', 'password123')
//     await expect(page).toHaveURL(/\/dashboard/)
//     await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
//   })
//
//   test('wrong password shows error', async ({ page }) => {
//     const loginPage = new LoginPage(page)
//     await loginPage.goto()
//     await loginPage.login('alice@example.com', 'wrongpassword')
//     await expect(loginPage.errorMessage).toContainText(/invalid/i)
//     await expect(page).toHaveURL(/\/login/)   // still on login
//   })

// ───────────────────────────────────────────────────────────────
// 7. TEST HOOKS AND FIXTURES
// ───────────────────────────────────────────────────────────────
//
// test.beforeEach / test.afterEach / test.beforeAll / test.afterAll
//
//   test.describe('Todo flow', () => {
//     let todoPage: TodoPage
//
//     test.beforeEach(async ({ page }) => {
//       todoPage = new TodoPage(page)
//       await todoPage.goto()       // navigate before every test
//     })
//
//     test('shows empty state initially', async () => {
//       await expect(todoPage.todoList).not.toBeVisible()
//     })
//
//     test('adds a todo', async () => {
//       await todoPage.addTodo('Buy milk')
//       await expect(todoPage.todoList.getByText('Buy milk')).toBeVisible()
//     })
//   })
//
// CUSTOM FIXTURES — extend the base test object:
//
//   // test-fixtures.ts
//   import { test as base } from '@playwright/test'
//   import { TodoPage } from './pages/TodoPage'
//   import { LoginPage } from './pages/LoginPage'
//
//   type MyFixtures = {
//     todoPage: TodoPage
//     loginPage: LoginPage
//     authenticatedPage: Page  // page already logged in
//   }
//
//   export const test = base.extend<MyFixtures>({
//     todoPage: async ({ page }, use) => {
//       const todoPage = new TodoPage(page)
//       await todoPage.goto()
//       await use(todoPage)     // ← test runs here
//     },
//
//     loginPage: async ({ page }, use) => {
//       await use(new LoginPage(page))
//     },
//
//     authenticatedPage: async ({ page }, use) => {
//       // Log in before providing the page
//       await page.goto('/login')
//       await page.getByLabel('Email').fill('alice@example.com')
//       await page.getByLabel('Password').fill('password123')
//       await page.getByRole('button', { name: 'Sign In' }).click()
//       await page.waitForURL('**/dashboard')
//       await use(page)   // ← page is now authenticated
//     },
//   })
//
//   export { expect } from '@playwright/test'
//
//   // USAGE:
//   import { test, expect } from './test-fixtures'
//
//   test('dashboard loads for authenticated user', async ({ authenticatedPage }) => {
//     await expect(authenticatedPage).toHaveURL(/\/dashboard/)
//     await expect(authenticatedPage.getByRole('heading')).toBeVisible()
//   })
//
//   test('can add a todo', async ({ todoPage }) => {
//     await todoPage.addTodo('Fixture-provided page — already on the todo page')
//     await expect(todoPage.todoList.getByText('Fixture-provided')).toBeVisible()
//   })
//
// WHY FIXTURES OVER beforeEach?
//   - Fixtures compose: test({ todoPage, authenticatedPage }) — both set up automatically
//   - Fixtures are lazy: only set up what the specific test uses
//   - Fixtures have clear teardown (code after `await use()` runs after the test)

// ───────────────────────────────────────────────────────────────
// 8. NETWORK INTERCEPTION (Playwright's equivalent of MSW)
// ───────────────────────────────────────────────────────────────
//
// Use route.fulfill() to mock network requests in Playwright.
// Useful when you can't run a backend during E2E tests, or to
// test specific error states that are hard to trigger in a real API.
//
//   test('shows error when API is down', async ({ page }) => {
//     // Intercept ALL requests matching the pattern
//     await page.route('**/api/v1/todos', async route => {
//       await route.fulfill({
//         status: 503,
//         body: JSON.stringify({ message: 'Service unavailable' }),
//         contentType: 'application/json',
//       })
//     })
//     await page.goto('/')
//     await expect(page.getByRole('alert')).toContainText('Service unavailable')
//   })
//
//   // Abort a request (simulates network failure):
//   await page.route('**/api/**', route => route.abort('connectionrefused'))
//
//   // Pass through some requests, intercept others:
//   await page.route('**/api/todos', async route => {
//     if (route.request().method() === 'DELETE') {
//       await route.fulfill({ status: 403 })
//     } else {
//       await route.continue()   // ← let real request through
//     }
//   })
//
// WHEN TO USE route vs MSW:
//   MSW (unit/integration tests): fast, no browser needed, precise control
//   Playwright route (E2E tests): when you need real browser behavior
//   In practice: use MSW for most tests, Playwright route only for
//   specific E2E scenarios that require network mocking.

// ───────────────────────────────────────────────────────────────
// 9. playwright.config.ts — FULL CONFIGURATION REFERENCE
// ───────────────────────────────────────────────────────────────
//
//   import { defineConfig, devices } from '@playwright/test'
//
//   export default defineConfig({
//     testDir: './e2e',
//     fullyParallel: true,         // run test FILES in parallel
//     retries: process.env.CI ? 2 : 0,  // retry on CI only
//     workers: process.env.CI ? 1 : undefined,  // parallel workers
//     reporter: 'html',            // generates HTML report in playwright-report/
//     timeout: 30_000,             // test timeout (ms)
//     expect: { timeout: 5_000 },  // assertion timeout (ms)
//
//     use: {
//       baseURL: 'http://localhost:5173',
//       trace: 'on-first-retry',   // record trace on first retry
//       screenshot: 'only-on-failure',
//       video: 'retain-on-failure',
//       headless: true,            // no visible browser window
//       viewport: { width: 1280, height: 720 },
//       locale: 'en-US',
//       timezoneId: 'America/New_York',
//     },
//
//     projects: [
//       { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
//       { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
//       { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
//       { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
//     ],
//
//     webServer: {
//       command: 'npm run dev',       // start dev server before tests
//       url: 'http://localhost:5173', // wait for this URL to be available
//       reuseExistingServer: !process.env.CI,  // don't restart if already running
//       timeout: 120_000,
//     },
//   })
//
// IMPORTANT OPTIONS:
//   retries: 2 on CI    — handles flakiness from slow CI servers
//   trace: 'on-first-retry'  — traces are expensive; only capture when a test fails
//   fullyParallel: true  — each spec file runs in its own worker for speed
//   reuseExistingServer  — don't restart the Vite server if you're already running it
//   workers: 1 on CI    — CI machines often have fewer cores; parallel can cause OOM

// ───────────────────────────────────────────────────────────────
// 10. CI PIPELINE — GitHub Actions config
// ───────────────────────────────────────────────────────────────
//
//   # .github/workflows/e2e.yml
//   name: E2E Tests
//   on: [push, pull_request]
//
//   jobs:
//     e2e:
//       runs-on: ubuntu-latest
//       steps:
//         - uses: actions/checkout@v4
//
//         - uses: actions/setup-node@v4
//           with:
//             node-version: '20'
//             cache: 'npm'
//
//         - name: Install dependencies
//           run: npm ci
//
//         - name: Install Playwright browsers
//           run: npx playwright install --with-deps
//           # '--with-deps' installs OS-level dependencies (libs, fonts)
//           # Required on Ubuntu — browsers need system libraries
//
//         - name: Run unit + integration tests
//           run: npm test -- --run
//           # '--run' runs once (no watch mode) for CI
//
//         - name: Run E2E tests
//           run: npm run test:e2e
//           env:
//             CI: true  # enables: retries=2, workers=1, no server reuse
//
//         - name: Upload Playwright HTML report
//           uses: actions/upload-artifact@v4
//           if: failure()    # only upload when tests fail (saves storage)
//           with:
//             name: playwright-report
//             path: playwright-report/
//             retention-days: 30
//
// BROWSER CACHING (speed up CI):
//
//   - uses: actions/cache@v4
//     with:
//       path: ~/.cache/ms-playwright
//       key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
//
//   # Put BEFORE 'Install Playwright browsers'
//   # If the lock file hasn't changed, browsers are restored from cache (~90% faster)

// ───────────────────────────────────────────────────────────────
// 11. DEBUGGING E2E TESTS
// ───────────────────────────────────────────────────────────────
//
// HEADED MODE — see the browser:
//   npx playwright test --headed
//   PWDEBUG=1 npx playwright test   ← opens Inspector
//
// DEBUG MODE — step through actions:
//   npx playwright test --debug     ← pauses before every action
//   Add page.pause() anywhere in your test to pause at that point
//
// PLAYWRIGHT INSPECTOR:
//   PWDEBUG=1 npm run test:e2e
//   Shows the browser, allows step-by-step, and has a locator picker
//
// TRACE VIEWER — after a failure:
//   npx playwright show-trace playwright-report/trace.zip
//   Shows: network requests, DOM snapshots, console logs, action timeline
//   Like DevTools time travel — go back to any point in the test
//
// CODEGEN — auto-generate tests by clicking:
//   npx playwright codegen http://localhost:5173
//   Opens browser, records your actions, outputs Playwright code
//   Great for quickly generating locators and test outlines
//
// SCREENSHOT ON DEMAND:
//   await page.screenshot({ path: 'debug.png', fullPage: true })
//
// SLOW MO — slow down all actions:
//   // In playwright.config.ts:
//   use: { launchOptions: { slowMo: 500 } }  // 500ms delay between actions
//
// VIDEO:
//   use: { video: 'on' }  // record video of every test
//   use: { video: 'retain-on-failure' }  // only keep video when test fails

// ───────────────────────────────────────────────────────────────
// 12. E2E TESTS IN THIS PROJECT (e2e/day35-e2e/)
// ───────────────────────────────────────────────────────────────
//
// counter.spec.ts — tests the Counter component in isolation
//   - Navigates to '/' (the Vite app)
//   - Verifies initial count
//   - Increments / decrements
//   - Tests min/max disabled states
//
// todo.spec.ts — tests the full TodoList flow
//   - Uses TodoPage POM (e2e/pages/TodoPage.ts)
//   - Add todos, verify they appear
//   - Toggle completion
//   - Delete todos
//   - Verify count
//
// login.spec.ts — tests the login form
//   - Uses LoginPage POM (e2e/pages/LoginPage.ts)
//   - Empty form submission → shows errors
//   - Invalid email → error
//   - Valid credentials → success message
//
// PATTERN USED IN counter.spec.ts (read the actual file):
//
//   test.describe('Counter', () => {
//     test.beforeEach(async ({ page }) => {
//       await page.goto('/')
//       // The app renders Counter at the root route
//     })
//
//     test('displays the initial count of 0', async ({ page }) => {
//       await expect(page.getByTestId('count')).toHaveText('0')
//     })
//
//     test('increments the count', async ({ page }) => {
//       await page.getByRole('button', { name: 'Increment' }).click()
//       await expect(page.getByTestId('count')).toHaveText('1')
//     })
//
//     test('Decrement is disabled at min', async ({ page }) => {
//       await expect(page.getByRole('button', { name: 'Decrement' })).toBeDisabled()
//     })
//   })

// ───────────────────────────────────────────────────────────────
// PRACTICE EXERCISES
// ───────────────────────────────────────────────────────────────
//
// EXERCISE 1: Locator quiz — which query for each element?
//
//   a) A form's submit button labelled "Create Account"
//      → page.getByRole('button', { name: 'Create Account' })
//
//   b) An email input with <label>Email</label>
//      → page.getByLabel('Email')
//
//   c) A paragraph that contains "Welcome back"
//      → page.getByText('Welcome back')      // exact match
//         page.getByText(/welcome/i)          // regex, case-insensitive
//
//   d) The third item in a list
//      → page.getByRole('listitem').nth(2)   // 0-indexed
//
//   e) A checkbox inside a specific list item
//      → page.getByRole('listitem').filter({ hasText: 'Buy milk' })
//           .getByRole('checkbox')
//
// EXERCISE 2: Write a test for the login flow
//
//   import { test, expect } from '@playwright/test'
//   import { LoginPage } from '../pages/LoginPage'
//
//   test('successful login shows "Logged in as" message', async ({ page }) => {
//     const loginPage = new LoginPage(page)
//     await loginPage.goto()
//     await loginPage.login('alice@example.com', 'password')
//     await expect(page.getByText(/Logged in as alice@example.com/)).toBeVisible()
//   })
//
//   test('missing email shows "Email is required"', async ({ page }) => {
//     const loginPage = new LoginPage(page)
//     await loginPage.goto()
//     // Click submit without filling anything
//     await page.getByRole('button', { name: 'Sign In' }).click()
//     await expect(page.getByText('Email is required')).toBeVisible()
//   })
//
// EXERCISE 3: Write a POM method
//
//   // Add to LoginPage class:
//   async fillAndVerify(email: string, password: string): Promise<void> {
//     await this.emailInput.fill(email)
//     await this.passwordInput.fill(password)
//     // Wait for the button to be enabled before clicking
//     await expect(this.submitButton).toBeEnabled()
//     await this.submitButton.click()
//   }
//
//   // Usage in test:
//   await loginPage.fillAndVerify('alice@example.com', 'secret')
//   await expect(page).toHaveURL(/\/dashboard/)
//
// EXERCISE 4: How do you debug a failing E2E test?
//
//   Step 1: Run with --headed to see the browser
//             npm run test:e2e -- --headed
//
//   Step 2: Add page.pause() at the failing line
//             await page.goto('/')
//             await page.pause()    ← Inspector opens here
//
//   Step 3: Use the locator picker in Inspector to find the correct selector
//
//   Step 4: Check the trace viewer for failures that only happen in CI
//             npx playwright show-trace playwright-report/trace.zip
//
// EXERCISE 5: Common E2E antipatterns — spot the bug
//
//   // Antipattern 1: Arbitrary sleep
//   test('loads data', async ({ page }) => {
//     await page.goto('/')
//     await page.waitForTimeout(2000)  // ❌ fragile — too long or too short
//     expect(await page.getByText('Alice').isVisible()).toBe(true)
//   })
//   Fix: await expect(page.getByText('Alice')).toBeVisible()
//        // ↑ auto-retries until visible, default 5s timeout
//
//   // Antipattern 2: Not awaiting assertions
//   test('button is visible', async ({ page }) => {
//     await page.goto('/')
//     expect(page.getByRole('button')).toBeVisible()  // ❌ missing await — no error but no retry!
//   })
//   Fix: await expect(page.getByRole('button')).toBeVisible()
//
//   // Antipattern 3: Sharing state between tests
//   let count = 0
//   test('first test', async ({ page }) => { count++ })
//   test('second test', async ({ page }) => {
//     // ❌ count could be 0 or 1 depending on test order
//     // Each test should be fully independent
//   })
//   Fix: each test creates its own state; use beforeEach for shared setup

// ───────────────────────────────────────────────────────────────
// QUICK REFERENCE CARD
// ───────────────────────────────────────────────────────────────

const PLAYWRIGHT_REFERENCE = {
  navigation: {
    'page.goto(url)': 'Navigate to URL (waits for load event)',
    'page.reload()': 'Reload the page',
    'page.goBack()': 'Browser back button',
    'page.waitForURL(pattern)': 'Wait for URL to match',
    'page.waitForLoadState()': 'Wait for networkidle / domcontentloaded',
  },
  locators: {
    'getByRole(role, {name})': 'Semantic — preferred ⭐⭐⭐',
    'getByLabel(text)': 'Form inputs with labels ⭐⭐⭐',
    'getByText(text)': 'Text content ⭐⭐',
    'getByPlaceholder(text)': 'Placeholder ⭐⭐',
    'getByTestId(id)': 'data-testid — last resort ⭐',
    'locator(css)': 'Raw CSS — avoid if possible',
  },
  assertions: {
    'toBeVisible()': 'Element is visible',
    'toBeHidden()': 'Element is hidden / not in DOM',
    'toBeEnabled()': 'Not disabled',
    'toBeDisabled()': 'Is disabled',
    'toBeChecked()': 'Checkbox is checked',
    'toHaveText(text)': 'Element text content',
    'toContainText(text)': 'Partial text match',
    'toHaveValue(val)': 'Input current value',
    'toHaveURL(pattern)': 'Page URL',
    'toHaveTitle(text)': 'Page title',
    'toHaveCount(n)': 'Number of matched elements',
  },
  actions: {
    'click()': 'Click element',
    'fill(text)': 'Clear + type (React-compatible)',
    'type(text)': 'Type char-by-char (slower)',
    'press(key)': 'Press a key (Enter, Tab, Escape)',
    'check() / uncheck()': 'Checkbox state',
    'selectOption(val)': 'Select dropdown option',
    'hover()': 'Hover over element',
  },
  debugging: {
    '--headed': 'Show browser window',
    '--debug': 'Step through actions',
    'PWDEBUG=1': 'Open Playwright Inspector',
    'page.pause()': 'Pause test at this point',
    'npx playwright codegen': 'Record test by clicking',
    'npx playwright show-trace': 'View trace file',
  },
};

// ───────────────────────────────────────────────────────────────
// LIVE DEMO (non-interactive — reference card in code)
// ───────────────────────────────────────────────────────────────

function runDemo(): void {
  console.log('\n═══ 05-e2e-testing.ts REFERENCE CARD ═══\n');

  console.log('LOCATOR PRIORITY (highest = most preferred):');
  Object.entries(PLAYWRIGHT_REFERENCE.locators).forEach(([k, v]) => {
    console.log(`  ${k.padEnd(30)} ${v}`);
  });

  console.log('\nKEY ASSERTIONS:');
  Object.entries(PLAYWRIGHT_REFERENCE.assertions).forEach(([k, v]) => {
    console.log(`  await expect(el).${k.padEnd(25)} ← ${v}`);
  });

  console.log('\nDEBUGGING COMMANDS:');
  Object.entries(PLAYWRIGHT_REFERENCE.debugging).forEach(([k, v]) => {
    console.log(`  ${k.padEnd(30)} ${v}`);
  });

  console.log('\nPOM RULE: Expose ACTIONS (verbs), not raw locators.');
  console.log('  ✅ todoPage.addTodo("text")   → test calls semantic method');
  console.log('  ❌ todoPage.inputLocator       → test knows about HTML structure');

  console.log('\n═══ E2E files are in e2e/day35-e2e/ — run: npm run test:e2e ═══\n');
}

export { PLAYWRIGHT_REFERENCE, runDemo };

export default runDemo;
