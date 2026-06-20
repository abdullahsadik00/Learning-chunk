// ═══════════════════════════════════════════════════════════════
// DAY 32: REACT COMPONENT TESTING — Counter
// ═══════════════════════════════════════════════════════════════
//
// TESTING LIBRARY CORE PRINCIPLE:
//  "The more your tests resemble the way your software is used,
//   the more confidence they can give you." — Kent C. Dodds
//
//  This means: interact with your components the way a USER would.
//  ✅ "Click the Increment button" — that's what users do
//  ❌ "Set component state to 5" — users never do that directly
//  ✅ "Look for text '5' on screen" — that's what users see
//  ❌ "Access component.state.count" — users don't read state
//
// WHAT NOT TO TEST:
//  • Implementation details (state variables, function names, class names)
//  • Things that don't affect output (internal helper functions)
//  Reason: implementation details can change without breaking behaviour.
//  Tests of implementation details break when you refactor, even if the
//  app still works — they create noise, not safety.
//
// ─────────────────────────────────────────────────────────────────
// QUERY TYPES (what happens when the element isn't found):
//
//  getBy*    → throws immediately if not found. Use when element MUST exist.
//  queryBy*  → returns null if not found. Use for "should NOT exist" checks.
//  findBy*   → returns a Promise, waits up to 1000ms. Use for async renders.
//
// QUERY PRIORITY (prefer earlier ones — they test more meaningful things):
//
//  1. getByRole        ← BEST. Matches by ARIA role (what assistive tech sees).
//  2. getByLabelText   ← Great for form inputs linked to <label>.
//  3. getByPlaceholderText ← OK fallback for inputs without labels.
//  4. getByText        ← For visible text content (paragraphs, headings).
//  5. getByDisplayValue← For <select> or <input> with a current value shown.
//  6. getByTestId      ← Last resort. Doesn't reflect actual user experience.
//
// WHY getByRole IS THE GOLD STANDARD:
//  Roles are part of the accessibility tree — they are what screen readers
//  and keyboard navigation depend on. Testing by role means your tests
//  break if you accidentally remove accessibility, which is a real bug.
//
// COMMON ROLES:
//  button, link, textbox, checkbox, radio, combobox (select),
//  heading, img, list, listitem, dialog, alert, status
//
// ARIA LABEL QUERIES:
//  getByRole('button', { name: 'Increment' })
//  The `name` option matches:
//    • The button's text content ("Increment")
//    • The button's aria-label attribute
//    • The button's aria-labelledby target
//  Our Counter uses aria-label="Increment" so this works perfectly.

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Counter } from '@/components/Counter';

// ─────────────────────────────────────────────────────────────────
// render() — mounting a component
// ─────────────────────────────────────────────────────────────────
//
// render(<Counter />) mounts the component into a real jsdom DOM.
// It returns various helpers (getByRole, queryByText, etc.) but
// we prefer using `screen` because:
//  • screen is always in sync — no stale destructuring
//  • screen.debug() prints the DOM for debugging
//  • Consistent style across all test files
//
describe('Counter', () => {
  describe('initial render', () => {
    it('renders with default count of 0', () => {
      render(<Counter />);

      // getByTestId — acceptable here since we added data-testid specifically for tests
      const countDisplay = screen.getByTestId('count');
      expect(countDisplay).toHaveTextContent('0');
    });

    it('renders with a custom initialCount', () => {
      render(<Counter initialCount={5} />);
      expect(screen.getByTestId('count')).toHaveTextContent('5');
    });

    it('renders the increment, decrement, and reset buttons', () => {
      render(<Counter />);

      // getByRole('button', { name: '...' }) — role-based query
      // The `name` matches aria-label on our buttons
      expect(screen.getByRole('button', { name: 'Increment' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Decrement' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // userEvent — simulating real user interactions
  // ─────────────────────────────────────────────────────────────
  //
  // userEvent.setup() creates a user-event instance.
  // user.click(element) simulates a full click sequence:
  //   pointerover → pointerenter → mouseover → mouseenter →
  //   pointermove → mousemove → pointerdown → mousedown →
  //   focus → pointerup → mouseup → click
  //
  // This is more realistic than fireEvent.click() which only
  // fires the bare click event without the surrounding events.
  //
  describe('increment', () => {
    it('increments the count by 1 when increment button is clicked', async () => {
      // userEvent.setup() must be called at the top of each test (or beforeEach)
      // It returns a `user` object with async methods
      const user = userEvent.setup();
      render(<Counter />);

      const incrementBtn = screen.getByRole('button', { name: 'Increment' });

      // user.click() is async — always await it
      await user.click(incrementBtn);

      expect(screen.getByTestId('count')).toHaveTextContent('1');
    });

    it('increments multiple times in sequence', async () => {
      const user = userEvent.setup();
      render(<Counter />);

      const btn = screen.getByRole('button', { name: 'Increment' });
      await user.click(btn);
      await user.click(btn);
      await user.click(btn);

      expect(screen.getByTestId('count')).toHaveTextContent('3');
    });

    it('uses a custom step size', async () => {
      const user = userEvent.setup();
      render(<Counter step={5} />);

      await user.click(screen.getByRole('button', { name: 'Increment' }));
      expect(screen.getByTestId('count')).toHaveTextContent('5');

      await user.click(screen.getByRole('button', { name: 'Increment' }));
      expect(screen.getByTestId('count')).toHaveTextContent('10');
    });
  });

  describe('decrement', () => {
    it('decrements the count by 1 when decrement button is clicked', async () => {
      const user = userEvent.setup();
      render(<Counter initialCount={3} />);

      await user.click(screen.getByRole('button', { name: 'Decrement' }));

      expect(screen.getByTestId('count')).toHaveTextContent('2');
    });

    it('decrements below zero', async () => {
      const user = userEvent.setup();
      render(<Counter initialCount={0} />);

      await user.click(screen.getByRole('button', { name: 'Decrement' }));

      expect(screen.getByTestId('count')).toHaveTextContent('-1');
    });
  });

  describe('reset', () => {
    it('resets the count to the initial value', async () => {
      const user = userEvent.setup();
      render(<Counter initialCount={0} />);

      // Increment a few times
      const incBtn = screen.getByRole('button', { name: 'Increment' });
      await user.click(incBtn);
      await user.click(incBtn);
      await user.click(incBtn);
      expect(screen.getByTestId('count')).toHaveTextContent('3');

      // Reset
      await user.click(screen.getByRole('button', { name: 'Reset' }));
      expect(screen.getByTestId('count')).toHaveTextContent('0');
    });

    it('resets to a non-zero initialCount', async () => {
      const user = userEvent.setup();
      render(<Counter initialCount={10} />);

      await user.click(screen.getByRole('button', { name: 'Increment' }));
      await user.click(screen.getByRole('button', { name: 'Reset' }));

      expect(screen.getByTestId('count')).toHaveTextContent('10');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // min/max boundary enforcement
  // ─────────────────────────────────────────────────────────────
  describe('min/max constraints', () => {
    it('does not go below min', async () => {
      const user = userEvent.setup();
      render(<Counter initialCount={0} min={0} />);

      // Try to decrement below min
      await user.click(screen.getByRole('button', { name: 'Decrement' }));
      expect(screen.getByTestId('count')).toHaveTextContent('0');
    });

    it('does not go above max', async () => {
      const user = userEvent.setup();
      render(<Counter initialCount={10} max={10} />);

      await user.click(screen.getByRole('button', { name: 'Increment' }));
      expect(screen.getByTestId('count')).toHaveTextContent('10');
    });

    // ── Disabled state ─────────────────────────────────────────
    //
    // toBeDisabled() — jest-dom matcher that checks the disabled attribute.
    // When a button is disabled, clicking it does nothing.
    // This tests the UX constraint that prevents invalid input.
    //
    it('disables the decrement button when count equals min', () => {
      render(<Counter initialCount={0} min={0} />);

      const decrementBtn = screen.getByRole('button', { name: 'Decrement' });

      // toBeDisabled() — provided by @testing-library/jest-dom
      expect(decrementBtn).toBeDisabled();
    });

    it('disables the increment button when count equals max', () => {
      render(<Counter initialCount={5} max={5} />);

      expect(screen.getByRole('button', { name: 'Increment' })).toBeDisabled();
    });

    it('enables both buttons when count is between min and max', () => {
      render(<Counter initialCount={5} min={0} max={10} />);

      // toBeEnabled() — the opposite of toBeDisabled()
      expect(screen.getByRole('button', { name: 'Decrement' })).toBeEnabled();
      expect(screen.getByRole('button', { name: 'Increment' })).toBeEnabled();
    });

    it('enables decrement button when count moves above min', async () => {
      const user = userEvent.setup();
      render(<Counter initialCount={0} min={0} max={10} />);

      // At min — decrement disabled
      expect(screen.getByRole('button', { name: 'Decrement' })).toBeDisabled();

      // Increment — decrement should now be enabled
      await user.click(screen.getByRole('button', { name: 'Increment' }));
      expect(screen.getByRole('button', { name: 'Decrement' })).toBeEnabled();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Accessibility attributes
  // ─────────────────────────────────────────────────────────────
  describe('accessibility', () => {
    it('has aria-live on the count display for screen readers', () => {
      render(<Counter />);
      const countEl = screen.getByTestId('count');
      // aria-live="polite" tells screen readers to announce changes
      // when the user is not busy — important for live regions
      expect(countEl).toHaveAttribute('aria-live', 'polite');
    });

    it('buttons are findable by their aria-labels', () => {
      render(<Counter />);
      // If aria-labels are missing or misspelled, this test breaks —
      // which means the component is also inaccessible to screen reader users
      expect(screen.getByLabelText('Increment')).toBeInTheDocument();
      expect(screen.getByLabelText('Decrement')).toBeInTheDocument();
    });
  });
});
