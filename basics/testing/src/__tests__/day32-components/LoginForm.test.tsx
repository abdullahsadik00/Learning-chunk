// ═══════════════════════════════════════════════════════════════
// DAY 32: REACT COMPONENT TESTING — LoginForm
// ═══════════════════════════════════════════════════════════════
//
// NEW PATTERNS THIS FILE TEACHES:
//
//  waitFor(() => expect(...))
//    Retries the assertion on a polling interval until it passes or times out.
//    USE when:
//      • A component makes a setTimeout / async state update
//      • After a user action, an element appears asynchronously
//    DO NOT use waitFor when a synchronous query would work — it hides bugs.
//
//  findBy* queries
//    findByText, findByRole, etc. are shorthand for waitFor + getBy.
//    Prefer findBy when you simply want to wait for an element to appear.
//    Prefer waitFor when you have multiple assertions inside one wait.
//
//  vi.fn() for callback props (onSuccess, onChange, etc.)
//    Always mock callbacks with vi.fn() so you can:
//      • Assert they were called (toHaveBeenCalled)
//      • Assert the arguments they received (toHaveBeenCalledWith)
//      • Assert they were NOT called (not.toHaveBeenCalled)
//
//  Fake timers with async components:
//    LoginForm uses `await new Promise(r => setTimeout(r, 1000))`.
//    Strategy: vi.useFakeTimers() + userEvent.setup({ delay: null })
//    + vi.advanceTimersByTimeAsync(ms).
//
//    WHY delay: null?
//      userEvent.setup() adds small real delays between keystrokes by default.
//      When fake timers are installed, those internal delays stall forever.
//      delay: null disables userEvent's own delays so it types instantly.
//
//    WHY advanceTimersByTimeAsync instead of runAllTimers?
//      The component's delay is a Promise wrapping setTimeout.
//      advanceTimersByTimeAsync() advances the clock AND flushes Promises
//      that resolved during that window — crucial for async/await code.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/LoginForm';

// ─────────────────────────────────────────────────────────────────
// Helper: fillAndSubmit — fills in the form and clicks Sign In.
// ─────────────────────────────────────────────────────────────────
async function fillAndSubmit(
  user: ReturnType<typeof userEvent.setup>,
  email: string,
  password: string
) {
  await user.type(screen.getByTestId('email-input'), email);
  await user.type(screen.getByTestId('password-input'), password);
  await user.click(screen.getByTestId('submit-button'));
}

describe('LoginForm', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  // ─────────────────────────────────────────────────────────────
  // Rendering
  // ─────────────────────────────────────────────────────────────
  describe('initial render', () => {
    it('renders email input, password input, and submit button', () => {
      render(<LoginForm />);

      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    });

    it('does not show error or success messages on initial render', () => {
      render(<LoginForm />);

      // queryByTestId returns null — correct for asserting absence
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
      expect(screen.queryByTestId('success-message')).not.toBeInTheDocument();
    });

    it('renders the submit button with "Sign In" text', () => {
      render(<LoginForm />);
      expect(screen.getByTestId('submit-button')).toHaveTextContent('Sign In');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Validation errors (synchronous — no async needed)
  // ─────────────────────────────────────────────────────────────
  describe('validation errors', () => {
    it('shows "Email is required" when form is submitted with empty email', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      // Submit without typing anything
      await user.click(screen.getByTestId('submit-button'));

      // Validation is synchronous — no waitFor needed here.
      // The error message appears immediately in the same render cycle.
      const error = screen.getByTestId('error-message');
      expect(error).toBeInTheDocument();
      expect(error).toHaveTextContent('Email is required');
    });

    it('shows "Invalid email format" for a malformed email', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      await user.type(screen.getByTestId('email-input'), 'not-an-email');
      await user.click(screen.getByTestId('submit-button'));

      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Invalid email format'
      );
    });

    it('shows "Password is required" when password is empty', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      // Provide a valid email but no password
      await user.type(screen.getByTestId('email-input'), 'user@example.com');
      await user.click(screen.getByTestId('submit-button'));

      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Password is required'
      );
    });

    it('does not call onSuccess when validation fails', async () => {
      const user = userEvent.setup();
      // vi.fn() creates a mock function — we can assert it was never called
      const onSuccess = vi.fn();
      render(<LoginForm onSuccess={onSuccess} />);

      // Submit with empty fields — validation fails before async logic runs
      await user.click(screen.getByTestId('submit-button'));

      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Loading state (uses fake timers)
  // ─────────────────────────────────────────────────────────────
  //
  // LoginForm uses `await new Promise(r => setTimeout(r, 1000))`.
  // Pattern:
  //   1. vi.useFakeTimers()         — take over the fake clock
  //   2. userEvent.setup({delay:null}) — no keystroke delays (safe with fake timers)
  //   3. Fill + submit               — kicks off the 1s timer
  //   4. Assert the mid-flight state  — timer hasn't fired yet
  //   5. vi.advanceTimersByTimeAsync(1100) — advance clock, flush Promises
  //   6. Assert post-flight state
  //
  describe('loading state', () => {
    afterEach(() => {
      // CRITICAL: restore real timers after each test in this group.
      // Failing to do this causes every subsequent test in the file to
      // operate on a frozen clock.
      vi.useRealTimers();
    });

    it('shows "Signing in..." and disables the button during submission', async () => {
      vi.useFakeTimers();
      // delay: null — disables userEvent's internal keystroke delays.
      // Without this, user.type() will stall forever on a fake clock.
      const user = userEvent.setup({ delay: null });
      render(<LoginForm />);

      await user.type(screen.getByTestId('email-input'), 'user@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.click(screen.getByTestId('submit-button'));

      // The fake clock has not advanced yet — the 1s Promise is still pending.
      // React has committed the loading state to the DOM synchronously.
      const submitBtn = screen.getByTestId('submit-button');
      expect(submitBtn).toHaveTextContent('Signing in...');
      expect(submitBtn).toBeDisabled();

      // Advance past the delay to prevent "act() warning" about pending state
      // updates leaking into the next test.
      await vi.advanceTimersByTimeAsync(1100);
    });

    it('re-enables the button and resolves after loading completes', async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      const onSuccess = vi.fn();
      render(<LoginForm onSuccess={onSuccess} />);

      await user.type(screen.getByTestId('email-input'), 'user@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.click(screen.getByTestId('submit-button'));

      // Advance 1100ms — the setTimeout fires and the Promise resolves.
      // advanceTimersByTimeAsync also pumps the microtask/Promise queue.
      await vi.advanceTimersByTimeAsync(1100);

      // waitFor: polls until React's state update from the resolved
      // Promise has been flushed to the DOM.
      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });
      expect(onSuccess).toHaveBeenCalledWith('user@example.com');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Successful login
  // ─────────────────────────────────────────────────────────────
  describe('successful submission', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('calls onSuccess with the correct email after the delay', async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      const onSuccess = vi.fn();
      render(<LoginForm onSuccess={onSuccess} />);

      await fillAndSubmit(user, 'alice@example.com', 'password123');
      await vi.advanceTimersByTimeAsync(1100);

      // waitFor — ensures the React state update from the resolved Promise
      // has been processed before we inspect the mock
      await waitFor(() => {
        // toHaveBeenCalledWith — verify the exact argument passed to onSuccess
        expect(onSuccess).toHaveBeenCalledWith('alice@example.com');
      });
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it('shows the success message with the logged-in email', async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      render(<LoginForm />);

      await fillAndSubmit(user, 'bob@example.com', 'password123');
      await vi.advanceTimersByTimeAsync(1100);

      // findByTestId — waits for the element to appear asynchronously.
      // Equivalent to: waitFor(() => screen.getByTestId('success-message'))
      const successMsg = await screen.findByTestId('success-message');
      expect(successMsg).toHaveTextContent('Logged in as bob@example.com');
    });

    it('hides the error message on a subsequent successful submission', async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      render(<LoginForm />);

      // Step 1: trigger a validation error
      await user.click(screen.getByTestId('submit-button'));
      expect(screen.getByTestId('error-message')).toBeInTheDocument();

      // Step 2: fill valid data and resubmit
      await user.type(screen.getByTestId('email-input'), 'user@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.click(screen.getByTestId('submit-button'));
      await vi.advanceTimersByTimeAsync(1100);

      await waitFor(() => {
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Error clearing on input change
  // ─────────────────────────────────────────────────────────────
  describe('error clearing', () => {
    it('clears the error message when the user starts typing after an error', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      // Trigger an error
      await user.click(screen.getByTestId('submit-button'));
      expect(screen.getByTestId('error-message')).toBeInTheDocument();

      // Start typing — the onChange handler calls setError('')
      await user.type(screen.getByTestId('email-input'), 'a');

      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });
  });
});
