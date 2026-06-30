// ═══════════════════════════════════════════════════════════════
// TESTING 02: COMPONENT TESTING WITH TESTING LIBRARY  (Day 32)
// Run tests:   npm test
// Run UI:      npm run test:ui
// ═══════════════════════════════════════════════════════════════
//
// TESTING LIBRARY PHILOSOPHY — "test behavior, not implementation"
//
//  The guiding principle: write tests the way a USER uses your app,
//  not the way a developer reads your code.
//
//  ❌ IMPLEMENTATION TEST (brittle):
//     expect(component.state.isOpen).toBe(true)      // internal state
//     expect(wrapper.find('Button').props().onClick) // internal prop
//
//  ✅ BEHAVIOR TEST (resilient):
//     expect(screen.getByText('Menu')).toBeVisible() // what user sees
//     await userEvent.click(screen.getByRole('button', { name: 'Open' }))
//
//  Why does this matter?
//  Refactoring changes implementation details constantly.
//  Behavior rarely changes. Tests that test behavior survive refactors.
//
// WHAT TESTING LIBRARY PROVIDES:
//  @testing-library/react  → render(), screen, within()
//  @testing-library/user-event → userEvent (realistic browser events)
//  @testing-library/jest-dom → extra matchers: toBeInTheDocument, toBeVisible, etc.
//
// DEPENDENCIES ALREADY INSTALLED:
//  "@testing-library/react": "^16.0.1"
//  "@testing-library/user-event": "^14.5.2"
//  "@testing-library/jest-dom": "^6.5.0"
//  "jsdom" environment set in vite.config.ts
//  jest-dom matchers auto-imported via src/mocks/setup.ts
//
// ───────────────────────────────────────────────────────────────

import React, { useState } from 'react';

// ───────────────────────────────────────────────────────────────
// 1. render() AND screen
// ───────────────────────────────────────────────────────────────
//
// render(<Component />) mounts the component into a real (jsdom) DOM.
// It returns query utilities bound to the rendered output.
//
// screen is a global object with the SAME queries bound to document.body.
// ALWAYS use screen — it's easier to read and less error-prone than
// destructuring from render():
//
//  ✅ screen.getByRole('button', { name: 'Submit' })
//  ❌ const { getByRole } = render(<Form />)  ← works but outdated pattern
//
// AFTER EVERY TEST, Testing Library auto-cleans the DOM (via afterEach).
// You don't need to call cleanup() manually.
//
// BASIC RENDER EXAMPLE:
//
//  import { render, screen } from '@testing-library/react'
//  import { Counter } from '@/components/Counter'
//
//  it('renders with the initial count', () => {
//    render(<Counter initialCount={5} />)
//    expect(screen.getByText('5')).toBeInTheDocument()
//  })

// ───────────────────────────────────────────────────────────────
// 2. QUERY PRIORITY — which to use and when
// ───────────────────────────────────────────────────────────────
//
// RULE: Use the query that best reflects how a USER finds the element.
// Prefer semantic, accessibility-based queries over CSS/testid.
//
// PRIORITY ORDER (highest = most preferred):
//
//  1. getByRole(role, { name: 'label' })
//     Most powerful. Queries by ARIA role.
//     ✅ Best for: buttons, inputs, headings, lists, links, dialogs
//     Examples:
//       screen.getByRole('button', { name: 'Submit' })
//       screen.getByRole('textbox', { name: 'Email' })
//       screen.getByRole('heading', { level: 1 })
//       screen.getByRole('checkbox', { name: 'Remember me' })
//       screen.getByRole('combobox', { name: 'Country' })  // <select>
//       screen.getByRole('alert')                           // role="alert"
//       screen.getByRole('dialog')                          // modal
//
//  2. getByLabelText('Email')
//     Finds input associated with a <label>.
//     ✅ Best for: form fields with labels
//     Works with: htmlFor/id, aria-label, aria-labelledby, title
//
//  3. getByPlaceholderText('Search...')
//     Fallback when input has placeholder but no label.
//     ⚠️ Placeholders are not accessible — prefer getByRole or getByLabelText
//
//  4. getByText('Welcome!')
//     Finds element by its text content.
//     ✅ Best for: headings, paragraphs, static labels
//     Options: { exact: false } for partial match
//
//  5. getByDisplayValue('Alice')
//     Current value of a form input, textarea, or select.
//
//  6. getByAltText('Company logo')
//     For <img alt="..."> elements.
//
//  7. getByTitle('Close')
//     For title attribute. Less reliable in practice.
//
//  8. getByTestId('submit-button')
//     LAST RESORT. Requires adding data-testid to production code.
//     Use only when semantic queries won't work (e.g. dynamic, non-semantic elements).
//     Convention: data-testid attributes only for tests, strip in prod.
//
// COMMON ARIA ROLES TO MEMORISE:
//
//  HTML element          ARIA role
//  ─────────────────    ──────────────
//  <button>              button
//  <input type="text">   textbox
//  <input type="email">  textbox (email doesn't get a unique role)
//  <input type="checkbox"> checkbox
//  <input type="radio">  radio
//  <input type="number"> spinbutton
//  <select>              combobox
//  <textarea>            textbox
//  <a href="...">        link
//  <h1>–<h6>            heading (with level prop)
//  <ul> or <ol>         list
//  <li>                  listitem
//  <nav>                 navigation
//  <form>                — (no default role unless aria-label given)
//  <table>               table
//  <img alt="...">       img
//  <img alt="">          presentation (decorative, hidden from AT)
//  role="alert"          alert (for error messages)
//  role="status"         status (for success messages)
//  role="dialog"         dialog (modals)

// ───────────────────────────────────────────────────────────────
// 3. QUERY VARIANTS — getBy / queryBy / findBy
// ───────────────────────────────────────────────────────────────
//
//  VARIANT     MULTIPLE MATCHES   NOT FOUND       ASYNC
//  ──────────  ─────────────────  ──────────────  ──────
//  getBy*      throws             throws          no
//  queryBy*    throws             returns null    no
//  findBy*     throws             rejects         yes (returns Promise)
//  getAllBy*   returns array      throws          no
//  queryAllBy* returns array      returns []      no
//  findAllBy*  returns array      rejects         yes
//
// WHEN TO USE EACH:
//
//  getBy* — your default. Use when the element MUST be in the DOM.
//    screen.getByRole('button', { name: 'Submit' })
//    → throws a helpful error if not found: "Unable to find role=button with name=Submit"
//
//  queryBy* — use to assert an element is NOT in the DOM.
//    expect(screen.queryByText('Error')).not.toBeInTheDocument()
//    → if you used getBy here it would throw before expect() runs!
//
//  findBy* — use for elements that appear AFTER an async operation.
//    const result = await screen.findByText('Loaded!')
//    → polls every 50ms until it finds the element (default timeout 1000ms)
//
// EXAMPLES:
//
//  // ASSERT ELEMENT EXISTS (synchronous)
//  expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
//
//  // ASSERT ELEMENT DOES NOT EXIST
//  expect(screen.queryByText('Error')).not.toBeInTheDocument()
//
//  // WAIT FOR ELEMENT TO APPEAR (after state update / API response)
//  const item = await screen.findByText('New Todo')
//  expect(item).toBeInTheDocument()
//
//  // ALL MATCHES
//  const buttons = screen.getAllByRole('button')
//  expect(buttons).toHaveLength(3)

// ───────────────────────────────────────────────────────────────
// 4. userEvent — REALISTIC BROWSER EVENTS
// ───────────────────────────────────────────────────────────────
//
// userEvent simulates what a REAL user does:
//  - Moves focus to the element first
//  - Fires all the events in the right order (pointerdown, mousedown, focus,
//    click, pointerup, mouseup)
//  - Handles keyboard navigation, tab order, disabled states
//
// fireEvent fires a SINGLE synthetic event — no focus movement, no
// intermediate events. It's lower-level and less realistic.
//
// ALWAYS USE userEvent over fireEvent for anything a user would do.
// fireEvent is only useful for browser events that userEvent doesn't support
// (e.g. drag-and-drop, resize).
//
// SETUP — IMPORTANT: call userEvent.setup() ONCE before the test:
//
//   const user = userEvent.setup()
//
//   Why? setup() creates an isolated user-session with its own
//   pointer/keyboard state. Creating it inside each action creates
//   separate sessions that don't share state (focus, clipboard, etc.)
//
// KEY ACTIONS:
//
//  await user.click(element)                 — click an element
//  await user.dblClick(element)              — double click
//  await user.type(element, 'hello')         — type character by character (triggers onChange per char)
//  await user.clear(element)                 — clear an input
//  await user.selectOptions(select, 'option') — select a <select> option
//  await user.keyboard('{Enter}')            — press a key
//  await user.keyboard('{Tab}')              — tab navigation
//  await user.hover(element)                 — hover
//  await user.unhover(element)               — stop hovering
//  await user.upload(input, file)            — file upload
//  await user.paste('pasted text')           — paste
//  await user.tab()                          — tab to next focusable element
//
// TYPING EXAMPLES:
//
//  // Type into an already-focused or targeted input:
//  const input = screen.getByRole('textbox', { name: 'Email' })
//  await user.type(input, 'test@example.com')
//
//  // Clear and retype:
//  await user.clear(input)
//  await user.type(input, 'new@example.com')
//
//  // Keyboard shortcuts:
//  await user.keyboard('{Control>}a{/Control}')  // Ctrl+A (select all)
//  await user.keyboard('{Shift}{Tab}')            // Shift+Tab
//
// SPECIAL KEY NAMES (inside {}):
//  Enter, Tab, Escape, Backspace, Delete, ArrowUp, ArrowDown,
//  Control, Shift, Alt, Meta, Space, Home, End

// ───────────────────────────────────────────────────────────────
// 5. JEST-DOM MATCHERS — the full list
// ───────────────────────────────────────────────────────────────
//
// These extend Vitest/Jest's expect() for DOM-specific assertions.
// They're imported via src/mocks/setup.ts → import '@testing-library/jest-dom'
//
//  toBeInTheDocument()        — element is in the DOM (vs null/undefined)
//  toBeVisible()              — element is visible (not hidden by CSS)
//  toBeEnabled() / toBeDisabled() — form control state
//  toBeChecked()              — checkbox/radio is checked
//  toHaveFocus()              — element currently has focus
//  toHaveValue('text')        — input/textarea/select current value
//  toHaveDisplayValue('text') — visible text in a select option
//  toHaveTextContent('text')  — element's text content (exact or partial)
//     options: { normalizeWhitespace: true } (default — collapses whitespace)
//     options: { exact: false }             — partial match
//  toHaveAttribute('attr', 'value')  — element has attribute
//  toHaveClass('className')           — element has CSS class
//  toHaveStyle({ color: 'red' })      — element has inline style
//  toBeRequired()             — input has required attribute
//  toBeValid() / toBeInvalid() — HTML5 constraint validation state
//  toBeEmptyDOMElement()       — element has no children
//  toContainElement(element)   — element contains another element
//  toHaveAccessibleName('...')  — computed accessible name (for a11y)
//  toHaveErrorMessage('...')    — aria-errormessage content
//
// EXAMPLES:
//   expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled()
//   expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('user@example.com')
//   expect(screen.getByRole('checkbox')).toBeChecked()
//   expect(screen.getByText('Error!')).toBeVisible()
//   expect(screen.queryByText('Loading...')).not.toBeInTheDocument()

// ───────────────────────────────────────────────────────────────
// 6. ASYNC TESTING — waitFor, findBy, act
// ───────────────────────────────────────────────────────────────
//
// WHEN DO YOU NEED ASYNC QUERIES?
//  - After a userEvent that triggers state update (React batches updates)
//  - After an API call completes
//  - After a loading spinner disappears
//  - After an animation/transition
//
// waitFor(fn, options?)
//  Polls fn every 50ms until it stops throwing, or times out (default 1000ms).
//  Use when you know what you're waiting for but don't want to use findBy.
//
//   await waitFor(() => {
//     expect(screen.getByText('Saved!')).toBeInTheDocument()
//   })
//
//   // With custom timeout:
//   await waitFor(() => expect(screen.getByText('Done')).toBeInTheDocument(), {
//     timeout: 3000,
//     interval: 100,
//   })
//
// findBy* (async query variants)
//  Under the hood: screen.findByText('x') === waitFor(() => screen.getByText('x'))
//  Cleaner syntax when you just need to wait for one element.
//
//   const errorMsg = await screen.findByRole('alert')
//   expect(errorMsg).toHaveTextContent('Email is required')
//
// act() — when is it needed?
//  React Testing Library automatically wraps userEvent and render in act().
//  You need manual act() for:
//  - Calling a hook's returned function directly (without userEvent)
//  - Timers with vi.useFakeTimers() + vi.advanceTimersByTime()
//  - Manual Promise resolution
//
//   act(() => { vi.advanceTimersByTime(1000) })
//   await act(async () => { await someAsyncOperation() })
//
// THE GOLDEN RULE: if you see "Warning: An update to X inside a test was not
// wrapped in act(...)", either:
//   a) await the userEvent (most likely the fix)
//   b) await a findBy query that waits for the update
//   c) wrap the state-triggering code in act()

// ───────────────────────────────────────────────────────────────
// 7. CUSTOM RENDER — wrapping with Providers
// ───────────────────────────────────────────────────────────────
//
// Real apps have context providers: AuthContext, ThemeContext, React Router,
// React Query. Components that use useNavigate() or useContext() need these
// providers to be present during testing.
//
// SOLUTION: Create a custom render function that wraps with providers.
//
//   // In test-utils.tsx (shared file for your test suite)
//   import { render, RenderOptions } from '@testing-library/react'
//   import { BrowserRouter } from 'react-router-dom'
//   import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
//
//   function AllProviders({ children }: { children: React.ReactNode }) {
//     const queryClient = new QueryClient({
//       defaultOptions: { queries: { retry: false } }
//     })
//     return (
//       <BrowserRouter>
//         <QueryClientProvider client={queryClient}>
//           {children}
//         </QueryClientProvider>
//       </BrowserRouter>
//     )
//   }
//
//   export function renderWithProviders(
//     ui: React.ReactElement,
//     options?: Omit<RenderOptions, 'wrapper'>
//   ) {
//     return render(ui, { wrapper: AllProviders, ...options })
//   }
//
//   // Usage in tests:
//   renderWithProviders(<Dashboard />)
//   // Dashboard can now call useNavigate(), useQuery(), etc.
//
// WHY retry: false in QueryClient?
//   React Query retries failed queries 3 times by default. In tests,
//   this means a failed mock causes 3 retries and a 3-second delay.
//   retry: false makes it fail immediately.
//
// ROUTER TESTING PATTERNS:
//
//   // Test a specific route:
//   import { MemoryRouter } from 'react-router-dom'
//   render(<App />, { wrapper: ({ children }) =>
//     <MemoryRouter initialEntries={['/dashboard']}>{children}</MemoryRouter>
//   })
//
//   // Or use createMemoryRouter for complex routing:
//   import { RouterProvider, createMemoryRouter } from 'react-router-dom'
//   const router = createMemoryRouter(routes, { initialEntries: ['/user/123'] })
//   render(<RouterProvider router={router} />)

// ───────────────────────────────────────────────────────────────
// 8. within() — scoped queries
// ───────────────────────────────────────────────────────────────
//
// when the DOM has multiple similar elements, scope your queries
// to a specific container using within().
//
//   // Multiple todo items — find actions inside the FIRST one:
//   const firstItem = screen.getAllByRole('listitem')[0]
//   const deleteBtn = within(firstItem).getByRole('button', { name: 'Delete' })
//   await user.click(deleteBtn)
//
//   // Table rows — assert content in a specific row:
//   const rows = screen.getAllByRole('row')
//   expect(within(rows[1]).getByText('Alice')).toBeInTheDocument()
//   expect(within(rows[1]).getByText('admin')).toBeInTheDocument()
//
// Import: import { within } from '@testing-library/react'

// ───────────────────────────────────────────────────────────────
// 9. TESTING COMPONENTS FROM THIS PROJECT
// ───────────────────────────────────────────────────────────────
//
// TESTING Counter.tsx (src/components/Counter.tsx)
// Counter has: initialCount, step, min, max props
//              buttons: Decrement (−), Increment (+), Reset
//              span with data-testid="count" and aria-live="polite"
//
// ANNOTATED TEST WALKTHROUGH:
//
//   import { render, screen } from '@testing-library/react'
//   import userEvent from '@testing-library/user-event'
//   import { Counter } from '@/components/Counter'
//
//   describe('Counter', () => {
//     it('shows the initial count', () => {
//       render(<Counter initialCount={5} />)
//       // The <span aria-live="polite"> contains the count
//       expect(screen.getByText('5')).toBeInTheDocument()
//     })
//
//     it('increments by 1 on click', async () => {
//       const user = userEvent.setup()
//       render(<Counter />)  // default initialCount=0
//       await user.click(screen.getByRole('button', { name: 'Increment' }))
//       expect(screen.getByText('1')).toBeInTheDocument()
//     })
//
//     it('decrements by the step value', async () => {
//       const user = userEvent.setup()
//       render(<Counter initialCount={10} step={3} />)
//       await user.click(screen.getByRole('button', { name: 'Decrement' }))
//       expect(screen.getByText('7')).toBeInTheDocument()
//     })
//
//     it('disables Decrement when count reaches min', async () => {
//       const user = userEvent.setup()
//       render(<Counter initialCount={0} min={0} />)
//       expect(screen.getByRole('button', { name: 'Decrement' })).toBeDisabled()
//       await user.click(screen.getByRole('button', { name: 'Increment' }))
//       expect(screen.getByRole('button', { name: 'Decrement' })).toBeEnabled()
//     })
//
//     it('disables Increment when count reaches max', async () => {
//       render(<Counter initialCount={5} max={5} />)
//       expect(screen.getByRole('button', { name: 'Increment' })).toBeDisabled()
//     })
//
//     it('resets to initialCount on Reset click', async () => {
//       const user = userEvent.setup()
//       render(<Counter initialCount={3} />)
//       await user.click(screen.getByRole('button', { name: 'Increment' }))
//       await user.click(screen.getByRole('button', { name: 'Reset' }))
//       expect(screen.getByText('3')).toBeInTheDocument()
//     })
//   })
//
// TESTING LoginForm.tsx (src/components/LoginForm.tsx)
// LoginForm has: onSuccess callback, loginDelayMs prop (default 1000, pass 0 in tests!)
//               shows error messages for missing/invalid inputs
//               shows "Signing in..." during loading
//               shows "Logged in as {email}" on success
//
//   describe('LoginForm', () => {
//     it('shows an error when email is missing', async () => {
//       const user = userEvent.setup()
//       render(<LoginForm loginDelayMs={0} />)
//       await user.click(screen.getByRole('button', { name: 'Sign In' }))
//       expect(await screen.findByText('Email is required')).toBeInTheDocument()
//     })
//
//     it('shows an error for invalid email format', async () => {
//       const user = userEvent.setup()
//       render(<LoginForm loginDelayMs={0} />)
//       await user.type(screen.getByLabelText('Email'), 'notanemail')
//       await user.click(screen.getByRole('button', { name: 'Sign In' }))
//       expect(await screen.findByText(/Invalid email/i)).toBeInTheDocument()
//     })
//
//     it('calls onSuccess with the email after valid submission', async () => {
//       const user = userEvent.setup()
//       const handleSuccess = vi.fn()
//       render(<LoginForm onSuccess={handleSuccess} loginDelayMs={0} />)
//       await user.type(screen.getByLabelText('Email'), 'alice@example.com')
//       await user.type(screen.getByLabelText('Password'), 'secret')
//       await user.click(screen.getByRole('button', { name: 'Sign In' }))
//       await waitFor(() => expect(handleSuccess).toHaveBeenCalledWith('alice@example.com'))
//     })
//
//     it('shows success message after login', async () => {
//       const user = userEvent.setup()
//       render(<LoginForm loginDelayMs={0} />)
//       await user.type(screen.getByLabelText('Email'), 'alice@example.com')
//       await user.type(screen.getByLabelText('Password'), 'secret')
//       await user.click(screen.getByRole('button', { name: 'Sign In' }))
//       expect(await screen.findByText(/Logged in as alice@example.com/)).toBeInTheDocument()
//     })
//   })

// ───────────────────────────────────────────────────────────────
// 10. ACCESSIBILITY TESTING
// ───────────────────────────────────────────────────────────────
//
// Testing with getByRole() inherently tests accessibility —
// if a button has the wrong role or no accessible name, your test fails.
//
// KEY A11Y PATTERNS IN TESTS:
//
//  1. Verify accessible name (what screen readers announce):
//     expect(screen.getByRole('button', { name: 'Submit form' })).toBeInTheDocument()
//
//  2. Verify live regions (dynamic content announcements):
//     // <span aria-live="polite">{count}</span>
//     expect(screen.getByRole('status')).toHaveTextContent('3')
//     // or for aria-live="assertive":
//     expect(screen.getByRole('alert')).toBeInTheDocument()
//
//  3. Verify focus management:
//     await user.tab()
//     expect(screen.getByRole('button', { name: 'First' })).toHaveFocus()
//
//  4. getByRole checks hidden: true for invisible elements:
//     screen.getByRole('dialog', { hidden: true })   // includes hidden elements
//     screen.getByRole('dialog')                     // only visible elements
//
//  5. Keyboard navigation:
//     await user.keyboard('{Tab}')
//     await user.keyboard('{Enter}')     // activate focused button
//     await user.keyboard('{Escape}')    // close modal

// ───────────────────────────────────────────────────────────────
// PRACTICE EXERCISES
// ───────────────────────────────────────────────────────────────
//
// EXERCISE 1: Which query and why?
//
//   a) Find a submit button in a form
//      → screen.getByRole('button', { name: 'Submit' })
//
//   b) Find an email input with a label
//      → screen.getByRole('textbox', { name: 'Email' })  OR  screen.getByLabelText('Email')
//
//   c) Check that an error message is NOT shown yet
//      → expect(screen.queryByText('Error')).not.toBeInTheDocument()
//
//   d) Wait for a success message that appears after an API call
//      → const msg = await screen.findByRole('status')
//        OR: await waitFor(() => expect(screen.getByText('Saved!')).toBeInTheDocument())
//
//   e) Find all list items in a todo list
//      → screen.getAllByRole('listitem')
//
// EXERCISE 2: Identify the bug
//
//   it('shows error for empty email', async () => {
//     const user = userEvent.setup()
//     render(<LoginForm />)
//     user.click(screen.getByRole('button', { name: 'Sign In' })) // ❌
//     expect(screen.getByText('Email is required')).toBeInTheDocument() // ❌
//   })
//
//   Bugs:
//   1. Missing `await` before user.click — the click fires but the test
//      checks before React re-renders with the error
//   2. Should use findByText instead of getByText (async state update)
//
//   Fixed:
//   await user.click(screen.getByRole('button', { name: 'Sign In' }))
//   expect(await screen.findByText('Email is required')).toBeInTheDocument()
//
// EXERCISE 3: Write the test
//
//   Test that the Counter component with step=5 and min=0:
//   - Starts at 10
//   - After one decrement shows 5
//   - After two decrements shows 0
//   - After two decrements the Decrement button is disabled
//
//   Solution pattern:
//   const user = userEvent.setup()
//   render(<Counter initialCount={10} step={5} min={0} />)
//   await user.click(screen.getByRole('button', { name: 'Decrement' }))
//   expect(screen.getByText('5')).toBeInTheDocument()
//   await user.click(screen.getByRole('button', { name: 'Decrement' }))
//   expect(screen.getByText('0')).toBeInTheDocument()
//   expect(screen.getByRole('button', { name: 'Decrement' })).toBeDisabled()

// ───────────────────────────────────────────────────────────────
// LIVE DEMO — Interactive teaching component
// ───────────────────────────────────────────────────────────────

// A miniature component that demonstrates what the tests verify
// Run: npm run dev, then this is shown in the interactive viewer

function QueryPriorityDemo() {
  return (
    <div style={{ fontFamily: 'monospace', fontSize: 13 }}>
      <h3 style={{ marginBottom: 8 }}>Query priority — what Testing Library prefers</h3>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={{ padding: '6px 12px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Priority</th>
            <th style={{ padding: '6px 12px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Query</th>
            <th style={{ padding: '6px 12px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Best for</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['1 ⭐⭐⭐', 'getByRole()', 'Buttons, inputs, headings, lists'],
            ['2 ⭐⭐⭐', 'getByLabelText()', 'Form fields with labels'],
            ['3 ⭐⭐', 'getByPlaceholderText()', 'Inputs with placeholder only'],
            ['4 ⭐⭐', 'getByText()', 'Static text, paragraphs'],
            ['5 ⭐', 'getByDisplayValue()', 'Current input/select value'],
            ['6 ⭐', 'getByAltText()', 'Images'],
            ['7 ⭐', 'getByTitle()', 'Title attribute'],
            ['8 ⚠️', 'getByTestId()', 'Last resort — semantic failed'],
          ].map(([p, q, desc]) => (
            <tr key={q}>
              <td style={{ padding: '5px 12px', border: '1px solid #e5e7eb' }}>{p}</td>
              <td style={{ padding: '5px 12px', border: '1px solid #e5e7eb', color: '#7c3aed', fontWeight: 600 }}>{q}</td>
              <td style={{ padding: '5px 12px', border: '1px solid #e5e7eb', color: '#6b7280' }}>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MatcherVariantsDemo() {
  return (
    <div style={{ fontFamily: 'monospace', fontSize: 13 }}>
      <h3 style={{ marginBottom: 8 }}>Query variants: getBy / queryBy / findBy</h3>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={{ padding: '6px 12px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Variant</th>
            <th style={{ padding: '6px 12px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Not found</th>
            <th style={{ padding: '6px 12px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Async</th>
            <th style={{ padding: '6px 12px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Use when</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['getBy*', 'throws ❌', 'no', 'Element MUST exist now'],
            ['queryBy*', 'null', 'no', 'Asserting element NOT present'],
            ['findBy*', 'rejects ❌', 'yes ✅', 'Element appears after async op'],
            ['getAllBy*', 'throws ❌', 'no', 'Multiple elements, all required'],
            ['queryAllBy*', '[]', 'no', 'Multiple — 0 is OK'],
            ['findAllBy*', 'rejects ❌', 'yes ✅', 'Multiple, appear after async'],
          ].map(([v, nf, async, use]) => (
            <tr key={v}>
              <td style={{ padding: '5px 12px', border: '1px solid #e5e7eb', color: '#7c3aed', fontWeight: 600 }}>{v}</td>
              <td style={{ padding: '5px 12px', border: '1px solid #e5e7eb' }}>{nf}</td>
              <td style={{ padding: '5px 12px', border: '1px solid #e5e7eb' }}>{async}</td>
              <td style={{ padding: '5px 12px', border: '1px solid #e5e7eb', color: '#6b7280' }}>{use}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Interactive live demo component for the react-interactive viewer
function InteractiveCounterTest() {
  const [log, setLog] = useState<string[]>([]);
  const [count, setCount] = useState(0);
  const MIN = 0;
  const MAX = 5;

  const addLog = (msg: string) => setLog(prev => [`${new Date().toLocaleTimeString()}: ${msg}`, ...prev.slice(0, 9)]);

  const decrement = () => {
    if (count <= MIN) return;
    setCount(c => c - 1);
    addLog('Decrement clicked → count decremented');
  };
  const increment = () => {
    if (count >= MAX) return;
    setCount(c => c + 1);
    addLog('Increment clicked → count incremented');
  };
  const reset = () => {
    setCount(0);
    addLog('Reset clicked → count reset to 0');
  };

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
        Live Counter — mirrors what tests verify (min=0, max=5)
      </h3>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <button onClick={decrement} disabled={count <= MIN}
          aria-label="Decrement"
          style={{ padding: '4px 12px', cursor: count <= MIN ? 'not-allowed' : 'pointer' }}>
          −
        </button>
        <span aria-live="polite" style={{ minWidth: 24, textAlign: 'center', fontWeight: 700, fontSize: 18 }}>
          {count}
        </span>
        <button onClick={increment} disabled={count >= MAX}
          aria-label="Increment"
          style={{ padding: '4px 12px', cursor: count >= MAX ? 'not-allowed' : 'pointer' }}>
          +
        </button>
        <button onClick={reset} aria-label="Reset"
          style={{ padding: '4px 12px', marginLeft: 8 }}>
          Reset
        </button>
      </div>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>
        Decrement {count <= MIN ? '🔴 disabled (at min)' : '🟢 enabled'} |
        Increment {count >= MAX ? '🔴 disabled (at max)' : '🟢 enabled'}
      </div>
      {log.length > 0 && (
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 4, padding: 8, fontSize: 11, fontFamily: 'monospace' }}>
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </div>
  );
}

export { QueryPriorityDemo, MatcherVariantsDemo, InteractiveCounterTest };

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 12, padding: 20, marginBottom: 14, background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>
      <p style={{ margin: '0 0 12px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#9ca3af' }}>{title}</p>
      {children}
    </div>
  );
}

export default function Demo() {
  return (
    <div>
      <Box title="1. Query Priority Reference">
        <QueryPriorityDemo />
      </Box>
      <Box title="2. Query Variants: getBy / queryBy / findBy">
        <MatcherVariantsDemo />
      </Box>
      <Box title="3. Interactive Counter — same component tested in day32-components/Counter.test.tsx">
        <InteractiveCounterTest />
      </Box>
    </div>
  );
}
