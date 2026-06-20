# Day 35 Assessment — E2E Testing · Playwright · Page Objects · CI

**Theme:** You are setting up the E2E test suite for a production SaaS app before a major release. The CEO wants confidence that critical flows — signup, checkout, dashboard — can't break without the team knowing.

---

### Q1 — E2E vs Integration ⭐

**Scenario:** The integration test suite is green. The checkout button is still broken in production — the click handler calls a deprecated API that throws in a real browser but not in JSDOM. The QA lead says "we need E2E tests."

**Task:** Explain why E2E tests run in a real browser. Describe 4 categories of bugs that JSDOM tests miss but Playwright catches.

**Acceptance Criteria:**
- [ ] E2E tests use a real browser engine (Chromium, Firefox, WebKit) via Playwright — the full browser stack runs: real CSS layout engine, real JavaScript engine, real network stack, real browser APIs
- [ ] JSDOM limitation 1 — CSS and layout: JSDOM does not compute CSS layout — `getBoundingClientRect()` returns zeros; a button hidden behind another element passes JSDOM tests but fails in a real browser
- [ ] JSDOM limitation 2 — browser APIs: `IntersectionObserver`, `ResizeObserver`, `WebGL`, `MediaRecorder`, `Web Crypto`, `window.matchMedia` are stubbed or absent in JSDOM — real implementations behave differently
- [ ] JSDOM limitation 3 — real animations and transitions: CSS transitions and JavaScript animations run to completion in a real browser; JSDOM ignores them — timing-dependent UI (skeleton → content) may pass in JSDOM but break in production
- [ ] JSDOM limitation 4 — multi-tab / multi-window: E2E tests can open new tabs, test `window.open`, verify file downloads, and interact with browser dialogs (`page.on('dialog', ...)`) — JSDOM cannot
- [ ] Trade-off: E2E tests are 10-100x slower than integration tests (seconds per test vs milliseconds) — use them for critical user flows (checkout, signup, login) not every component

---

### Q2 — Playwright Locator Priority ⭐

**Scenario:** An E2E test uses `page.locator('.checkout-btn')`. A CSS refactor renames the class to `checkout-button`. The test fails. No user was affected. The test is testing implementation, not behavior.

**Task:** List the Playwright locator priority order from most to least preferred. Explain what is wrong with XPath and CSS selectors in E2E tests.

**Acceptance Criteria:**
- [ ] Priority 1: `page.getByRole('button', { name: /checkout/i })` — matches by ARIA role and accessible name — survives CSS class renames, component restructuring, and HTML tag changes (button → a with role)
- [ ] Priority 2: `page.getByLabel('Email address')` — matches form inputs by their associated label text — tests that the label is wired correctly, which is both a UX and accessibility requirement
- [ ] Priority 3: `page.getByText('Place order')` — matches by visible text content — survives CSS changes; breaks if copy changes (which is intentional — a copy change should be a conscious test update)
- [ ] Priority 4: `page.getByTestId('checkout-btn')` — matches `data-testid` attribute — last resort; requires adding test-specific attributes to production markup
- [ ] XPath problem: XPaths like `//div[2]/button[1]` break when the DOM structure changes — a new `<div>` wrapper or reordered siblings silently break the XPath without any visible change to users
- [ ] CSS selector problem: class names are implementation details — they change during refactoring; `:nth-child` selectors break when sibling order changes
- [ ] Playwright-specific note: `page.locator('role=button[name="Checkout"]')` is a compact role selector syntax — equivalent to `getByRole` but works in chaining: `page.locator('.cart').getByRole('button', { name: /checkout/i })`

---

### Q3 — Auto-Waiting ⭐

**Scenario:** A test clicks a button that triggers a navigation. Without Playwright's auto-waiting, the test would need `await page.waitForSelector('...')` before every assertion. A developer coming from Selenium is surprised that Playwright tests rarely need explicit waits.

**Task:** Explain Playwright's auto-waiting. List the 4 actionability checks Playwright performs before executing a click. Explain what `page.click()` actually does internally.

**Acceptance Criteria:**
- [ ] Auto-waiting: Playwright retries locator resolution and actionability checks automatically before every action — `page.click(locator)` does not fail immediately if the element is not yet present; it waits up to the configured timeout (default 30s)
- [ ] Actionability check 1 — Visible: the element must be visible (not `display: none`, not `visibility: hidden`, not zero opacity)
- [ ] Actionability check 2 — Enabled: the element must not be `disabled` — clicking a disabled button is rejected
- [ ] Actionability check 3 — Stable: the element must not be moving (CSS animation, layout shift) — Playwright waits for the element to stop moving before clicking to ensure the click lands in the right place
- [ ] Actionability check 4 — In viewport (for some actions): the element must be in the viewport — Playwright scrolls it into view automatically if needed
- [ ] What `page.click()` does: resolves the locator → waits for actionability → scrolls element into view → moves the mouse pointer to the element's center → dispatches `mousedown`, `mouseup`, `click` events — all exactly as a real user would
- [ ] Notes that assertions (`expect(locator).toBeVisible()`) also auto-retry — they poll until the assertion passes or the timeout expires; no explicit `waitFor` wrapper needed

---

### Q4 — Assertion Variants ⭐

**Scenario:** A test asserts `expect(page.getByText('$99.00')).toBeVisible()`. The element exists and is visible but is scrolled below the viewport. In another test, an input's current value must be asserted after typing. A third test checks that a heading has the right text.

**Task:** Distinguish `toBeVisible()`, `toBeInViewport()`, and `toHaveText()` / `toHaveValue()`. State when each assertion is correct.

**Acceptance Criteria:**
- [ ] `toBeVisible()`: asserts the element is visible in the DOM — not `display: none`, not `visibility: hidden` — does NOT require the element to be in the visible scroll area; an element below the fold passes `toBeVisible()`
- [ ] `toBeInViewport()`: asserts the element is within the visible scroll area of the page — use this when testing that a scroll action brought an element into view, or that a sticky header is visible at the top of the viewport
- [ ] `toHaveText('Total: $99.00')`: asserts the element's text content matches — use for headings, paragraphs, buttons — supports strings (exact match) and regex (`/\$\d+\.\d{2}/`)
- [ ] `toHaveValue('sadik@example.com')`: asserts the current value of an input, textarea, or select — use after typing into a form field; `toHaveText` does not work on inputs because they have no text content
- [ ] `toHaveText` vs `toHaveValue` for select: `toHaveValue` checks the selected option's `value` attribute; `toHaveText` on the select itself is unreliable — use `toHaveText` on the selected option element
- [ ] Notes that all Playwright web-first assertions auto-retry — `expect(locator).toBeVisible()` polls until the element becomes visible or times out — no `waitFor` wrapper needed

---

### Q5 — Page Object Model ⭐⭐

**Scenario:** The checkout flow test is 80 lines of `page.getByRole(...)` and `page.click(...)` calls. When the checkout UI is redesigned, 12 tests break and must all be updated individually. A Page Object Model would isolate the locator changes to one class.

**Task:** Implement a `CheckoutPage` class with `goto()`, `addItem(name)`, `proceedToCheckout()`, `fillPayment(card)`, and `getOrderTotal()`. Show usage in a test.

**Acceptance Criteria:**
- [ ] Class structure: `class CheckoutPage { constructor(page) { this.page = page } }` — the Playwright `page` object is injected, not imported
- [ ] `goto()`: `await this.page.goto('/checkout')` — navigates to the checkout URL
- [ ] `addItem(name)`: `await this.page.getByRole('button', { name: `Add ${name}` }).click()` — uses a semantic locator with the item name; no hardcoded CSS selectors
- [ ] `proceedToCheckout()`: `await this.page.getByRole('button', { name: /proceed to checkout/i }).click(); await this.page.waitForURL('**/checkout/payment')` — clicks and waits for navigation to confirm
- [ ] `fillPayment(card)`: fills card number, expiry, CVV fields using `getByLabel`; `card` is an object `{ number, expiry, cvv }` — the method hides the field names from the test
- [ ] `getOrderTotal()`: `return this.page.getByTestId('order-total').textContent()` — returns the text of the total element for assertion
- [ ] Usage in test: `const checkout = new CheckoutPage(page); await checkout.goto(); await checkout.addItem('Premium Plan'); await checkout.proceedToCheckout(); await checkout.fillPayment({ number: '4242...', expiry: '12/28', cvv: '123' }); expect(await checkout.getOrderTotal()).toBe('$99.00')`
- [ ] Notes that POM changes are isolated: when the "Proceed" button label changes to "Continue to Payment", only `CheckoutPage.proceedToCheckout` needs updating — all 12 tests that use it are fixed automatically

---

### Q6 — Playwright Config ⭐⭐

**Scenario:** The E2E test suite runs against a locally started Vite dev server. Each test run starts the server, runs tests, and shuts it down. The team wants traces saved only when a test fails on retry, to avoid gigabytes of trace files.

**Task:** Explain the `baseURL`, `trace: 'on-first-retry'`, and `webServer` config options. Explain `reuseExistingServer`.

**Acceptance Criteria:**
- [ ] `baseURL: 'http://localhost:5173'`: allows using relative URLs in tests — `page.goto('/checkout')` instead of `page.goto('http://localhost:5173/checkout')` — easier to change ports in one place
- [ ] `trace: 'on-first-retry'`: saves a trace file (DOM snapshots, network requests, console logs, screenshots) only when a test is retried — on a clean pass, no trace is saved; the trace appears after a flaky test's first failure, giving full debugging context
- [ ] `webServer` block: `{ command: 'npm run dev', url: 'http://localhost:5173', timeout: 120_000 }` — Playwright starts the command before running any tests and waits until the URL is reachable; shuts it down when tests finish
- [ ] `reuseExistingServer: !process.env.CI`: in local development, if the dev server is already running, Playwright reuses it rather than starting a second one — saves startup time; in CI (`process.env.CI` is true), always start a fresh server to avoid port conflicts with other jobs
- [ ] `fullyParallel: true`: runs tests in parallel across workers — each worker gets its own browser context; the `webServer` is shared across all workers (only started once)
- [ ] Notes that `timeout: 30_000` (30s per test default) can be overridden per test with `test.setTimeout(60_000)` for flows that are legitimately slow (file upload, PDF generation)

---

### Q7 — `page.route()` API Mocking ⭐⭐

**Scenario:** The checkout page calls `/api/products` to load items. In E2E tests, the real backend may have inconsistent seed data — the test sometimes gets 3 products, sometimes 5. You need deterministic product data without MSW.

**Task:** Show how to use `page.route()` to intercept and mock the `/api/products` call within an E2E test. Return a custom JSON response.

**Acceptance Criteria:**
- [ ] Sets up the route intercept before navigation: `await page.route('**/api/products', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: '1', name: 'Premium Plan', price: 99 }]) }))`
- [ ] The glob pattern `**/api/products` matches the full URL regardless of origin — works whether the app calls `/api/products` or `https://api.saralux.com/api/products`
- [ ] Navigation after route setup: `await page.goto('/checkout')` — the intercept is active before the page makes any requests
- [ ] Asserts the mocked data is shown: `await expect(page.getByText('Premium Plan')).toBeVisible()`
- [ ] Removing a route: `await page.unroute('**/api/products')` — subsequent requests to this URL pass through to the real server
- [ ] Conditional fulfillment: `route.fulfill({ ... })` for a success response; `route.abort()` for a network failure; `route.fulfill({ status: 500 })` for a server error — the same three scenarios as MSW
- [ ] Notes that `page.route` is per-page — it does not affect other pages or browser contexts; no `resetHandlers` equivalent needed

---

### Q8 — Screenshots and Video ⭐⭐

**Scenario:** A test fails in CI. The error message says "expected to find text 'Order confirmed' but it was not found." Without a screenshot, nobody can tell what the page looked like when the assertion failed.

**Task:** Show how to take a named screenshot, configure video recording, and when to use visual comparison with `toHaveScreenshot`.

**Acceptance Criteria:**
- [ ] Manual screenshot: `await page.screenshot({ path: `screenshots/checkout-${test.info().title}.png` })` — call this at the point of failure or inside `test.afterEach` conditionally
- [ ] Automatic screenshot on failure: Playwright config `screenshot: 'only-on-failure'` — saves a screenshot automatically when any test fails; no code change needed per test
- [ ] Video config: `video: 'on'` records every test; `video: 'retain-on-failure'` records all but only keeps files for failing tests — `retain-on-failure` is preferred for CI to avoid gigabytes of video for a green suite
- [ ] Video naming: Playwright names videos by test title automatically; they appear in the HTML report under the failing test
- [ ] Visual comparison: `await expect(page).toHaveScreenshot('checkout-form.png')` — compares the current screenshot to a stored baseline; fails if pixels differ beyond a threshold — useful for catching unexpected visual regressions (broken layout, wrong color, missing icon)
- [ ] Visual comparison pitfall: baselines are browser/OS-specific — a screenshot taken on macOS differs from one taken on Linux CI even for the same pixel-perfect UI; use `{ maxDiffPixelRatio: 0.05 }` to allow minor rendering differences
- [ ] Update baselines: `npx playwright test --update-snapshots` — regenerates all baseline screenshots; must be reviewed carefully before committing

---

### Q9 — Keyboard Navigation E2E ⭐⭐

**Scenario:** The checkout form is reported as inaccessible — keyboard-only users cannot reach the submit button. An E2E test that uses only `page.keyboard` (no mouse) would catch this regression before it ships.

**Task:** Write a keyboard-only navigation test that tabs to the submit button and activates it with Enter. Show the full flow from the form start.

**Acceptance Criteria:**
- [ ] Navigates to the form: `await page.goto('/checkout/payment')`
- [ ] Focuses the first field: `await page.getByLabel('Card number').focus()` — sets focus explicitly as a starting point; avoids relying on the page's default focus behavior
- [ ] Fills the card number: `await page.keyboard.type('4242424242424242')` — types into the currently focused element
- [ ] Tabs to next field: `await page.keyboard.press('Tab')` — moves focus to the expiry field
- [ ] Continues tabbing: fills expiry, tabs to CVV, fills CVV, tabs to submit button — each Tab and type call is explicit
- [ ] Asserts focus is on submit: `await expect(page.getByRole('button', { name: /submit order/i })).toBeFocused()`
- [ ] Activates with Enter: `await page.keyboard.press('Enter')`
- [ ] Asserts success: `await expect(page.getByText('Order confirmed')).toBeVisible()`
- [ ] Notes that this test is a meaningful accessibility verification — if a developer wraps the button in a `<div onClick>` instead of a `<button>`, keyboard activation stops working and this test catches it

---

### Q10 — Login Before Each Test ⭐⭐

**Scenario:** Every test in the `dashboard.spec.ts` file requires the user to be logged in. If each test logs in via the UI (filling the form, clicking submit, waiting for redirect), the total login overhead is 3 seconds × 20 tests = 60 seconds wasted.

**Task:** Show a `test.beforeEach` helper that logs in via the API (not the UI). Explain why API login is faster and when you still need UI login tests.

**Acceptance Criteria:**
- [ ] API login in `beforeEach`: `const response = await page.request.post('/api/auth/login', { data: { email: 'sadik@example.com', password: 'secret' } })`
- [ ] Stores the token: `const { token } = await response.json()` — saves the auth token returned by the API
- [ ] Sets the cookie or localStorage: `await page.context().addCookies([{ name: 'auth-token', value: token, domain: 'localhost', path: '/' }])` — or `await page.evaluate(token => localStorage.setItem('auth-token', token), token)`
- [ ] Navigates directly to the protected page: `await page.goto('/dashboard')` — the app reads the cookie/localStorage and treats the user as authenticated
- [ ] Why API login is faster: skips the UI render, network round-trip for the login page assets, React hydration, form interaction events, and post-login redirect — typically 200ms vs 2-3s
- [ ] When to still use UI login: the `auth.spec.ts` file tests the login form itself — form validation, error messages, loading state — those must use the UI; all other tests can use API login
- [ ] Notes that Playwright's `storageState` feature (covered in Q14) is an even more efficient approach for suites with hundreds of tests

---

### Q11 — Retry and Flakiness ⭐⭐

**Scenario:** A new E2E test fails 1 in 5 runs in CI. The team is unsure whether it is a product bug or a flaky test. They want a systematic approach to diagnosing and handling flakiness.

**Task:** Explain `retries: 2` in config, what `--repeat-each=5` does for flaky test detection, and how `expect.poll()` handles eventual consistency assertions.

**Acceptance Criteria:**
- [ ] `retries: 2` in `playwright.config.ts`: if a test fails, Playwright retries it up to 2 more times before marking it as failed — with `trace: 'on-first-retry'`, the trace of the first failure is saved for debugging; if retry 2 passes, the test is marked as "flaky" in the report
- [ ] `--repeat-each=5` flag: runs every test 5 times in a single run — `npx playwright test --repeat-each=5 checkout.spec.ts` — reveals flaky tests by exposing intermittent failures; a truly flaky test will fail at least once in 5 runs; a stable test passes all 5
- [ ] `expect.poll(async () => ..., { timeout: 5000, intervals: [100, 500, 1000] })`: polls a value repeatedly until it satisfies the assertion — used for eventual consistency scenarios (Stripe webhook processed, email delivered, cache invalidated) that are inherently asynchronous and not directly observable in the DOM
- [ ] When to use retry vs fix: retries mask flakiness — they should be a temporary measure while diagnosing; `--repeat-each=5` and trace analysis reveal the root cause (timing, state leak, animation); fix the root cause, remove the retry
- [ ] Common flaky test pattern: element is stable but the assertion races with a CSS transition — fix by adding `await page.waitForLoadState('networkidle')` or waiting for a specific element to appear before asserting
- [ ] Notes that `retries: 0` in local development is preferable — flaky tests should fail loudly locally so they are fixed before being pushed

---

### Q12 — Parallel Execution ⭐⭐⭐

**Scenario:** The E2E test suite runs in 8 parallel workers. Two tests both create a user with email `testuser@example.com`. The second test fails because the first already created that account and the API returns a duplicate error.

**Task:** Describe 3 strategies for isolating E2E tests that write to shared state. Show how per-test data fixtures prevent the collision.

**Acceptance Criteria:**
- [ ] Problem: parallel workers share the same database — a test that creates a record with a hardcoded email collides with another test creating the same email concurrently
- [ ] Strategy 1 — Per-test unique data: generate unique emails using the test ID: `const email = \`user-${test.info().testId}@example.com\`` — every parallel worker uses a different email; no collision possible
- [ ] Strategy 2 — Worker-scoped fixtures: Playwright fixtures can be `scope: 'worker'` — each worker creates one test account and all tests in that worker reuse it; tests must not delete the account or each other's data
- [ ] Strategy 3 — Database reset between tests: an API endpoint `POST /api/test/reset` deletes all test-created data — call it in `afterEach`; only safe if the endpoint is protected and only exists in non-production environments
- [ ] Per-test fixture example: `const user = await page.request.post('/api/users', { data: { email: \`user-${test.info().testId}@test.com\`, password: 'secret' } })` — each test creates its own isolated user
- [ ] Cleanup in `afterEach`: `await page.request.delete(\`/api/users/${user.id}\`)` — removes the test user after the test completes regardless of pass/fail
- [ ] Notes that `test.info().testId` is unique per test run but consistent for the same test name — using it instead of `Math.random()` makes debugging easier (you know which test created which record)

---

### Q13 — CI Pipeline ⭐⭐⭐

**Scenario:** You are setting up Playwright in GitHub Actions for a project that uses React + Vite. Tests must run on every pull request. The team wants the full Playwright HTML report uploaded as an artifact on failure. Tests must run on Chrome, Firefox, and Safari.

**Task:** Write the GitHub Actions workflow for Playwright. Include: install browsers, run tests, upload the report artifact, and a matrix for three browsers.

**Acceptance Criteria:**
- [ ] Triggers: `on: [push, pull_request]` — runs on every push and PR
- [ ] Node setup: `uses: actions/setup-node@v4` with `node-version: '20'`
- [ ] Install Playwright browsers: `run: npx playwright install --with-deps` — `--with-deps` installs browser system dependencies (libglib, ffmpeg) in addition to the browser binaries; required on a fresh Ubuntu runner
- [ ] Run tests: `run: npx playwright test --reporter=html` — generates the HTML report; `--project=chromium` if matrix is used
- [ ] Browser matrix: `strategy: { matrix: { browser: [chromium, firefox, webkit] } }` with `run: npx playwright test --project=${{ matrix.browser }}`
- [ ] Upload report artifact: `uses: actions/upload-artifact@v4` with `name: playwright-report-${{ matrix.browser }}`, `path: playwright-report/`, `if: always()` — the `if: always()` ensures the report uploads even when tests fail
- [ ] Cache browsers: `uses: actions/cache@v4` caching `~/.cache/ms-playwright` keyed on the Playwright version — avoids redownloading browsers on every run
- [ ] Notes that `--reporter=blob` + `merge-reports` is Playwright's recommended approach for combining reports from matrix jobs into a single HTML report

---

### Q14 — Storage State ⭐⭐⭐

**Scenario:** A suite has 150 tests, all requiring authentication. With `beforeEach` API login (200ms each), that is 30 seconds of login overhead. Using saved storage state (cookies + localStorage), login happens once for the entire suite and is shared across all 150 tests.

**Task:** Show how to use `page.context().storageState()` to save a login session. Show the `storageState` option in `playwright.config.ts`. Show how to generate the state file in a global setup script.

**Acceptance Criteria:**
- [ ] Global setup file `global-setup.ts`: `import { chromium } from '@playwright/test'` → launches a browser → logs in via API or UI → saves state: `await context.storageState({ path: 'playwright/.auth/user.json' })`
- [ ] `playwright.config.ts` references the setup file: `globalSetup: './global-setup.ts'` and the storage state: `use: { storageState: 'playwright/.auth/user.json' }`
- [ ] With `storageState` configured, every test starts with the saved cookies and localStorage already loaded — no login step needed in `beforeEach`
- [ ] Multiple user roles: `global-setup.ts` saves separate state files — `user.json` for a regular user, `admin.json` for an admin — tests use fixtures to pick the correct state file
- [ ] `storageState` file contents: a JSON object with `cookies` (array of cookie objects) and `origins` (array of `{ origin, localStorage }` objects) — human-readable and can be inspected in the PR diff
- [ ] Security note: `playwright/.auth/` should be in `.gitignore` — the state file contains real session tokens; never commit it to version control
- [ ] Notes that storage state expires when the real session expires — the global setup script must re-login and regenerate the file if the session TTL is shorter than the CI run time

---

### Q15 — Testing Strategy ⭐⭐⭐

**Scenario:** The engineering manager asks you to justify the test distribution for the checkout flow. The checkout flow is the most critical path in the app — a bug here means lost revenue. You need to choose between the test pyramid, test trophy, and test diamond.

**Task:** Describe the test pyramid, test trophy, and test diamond. Choose the right strategy for a checkout flow and justify it with a risk analysis.

**Acceptance Criteria:**
- [ ] Test pyramid (Mike Cohn): many unit tests → fewer integration tests → fewest E2E tests — optimizes for speed and developer feedback; best for apps where unit logic is complex and UI is simple
- [ ] Test trophy (Kent C. Dodds): few unit tests → many integration tests → some E2E tests → static analysis at the base — integration tests give the best ROI: they test realistic behavior without the cost of a real browser; recommended for modern React apps
- [ ] Test diamond (or inverted pyramid): few unit tests → some integration tests → many E2E tests — used when the user flow is the product (e.g., e-commerce checkout) and unit-level confidence is low value compared to flow-level confidence
- [ ] Checkout flow risk analysis: the checkout flow involves: form validation, payment API integration, redirect logic, receipt generation — a unit test for each piece misses the integration bugs between them (Q1 described one such bug); an E2E test of the full flow catches all of them at once
- [ ] Recommended strategy for checkout: test diamond — 2-3 unit tests for pure utility functions (price formatting, tax calculation) → 5-8 integration tests for form validation, API error handling, React Query state → 3-5 E2E tests for the full purchase flow on Chrome, mobile Chrome, and Safari
- [ ] Justification: checkout bugs have asymmetric cost — a flaky E2E test costs 30 minutes of investigation; a missed checkout bug costs revenue, customer trust, and a P1 incident; the cost of additional E2E tests is justified
- [ ] Notes that the three models are heuristics not rules — the right distribution depends on the system: a library with complex algorithms benefits from the pyramid; a form-heavy CRUD app benefits from the trophy; a checkout flow in a fintech SaaS benefits from the diamond
