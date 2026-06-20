// ═══════════════════════════════════════════════════════════════
// DAY 32: REACT COMPONENT TESTING — LoginForm
// ═══════════════════════════════════════════════════════════════
//
// NEW PATTERNS THIS FILE TEACHES:
//
//  waitFor(() => expect(...))
//    Retries the assertion on a polling interval (default 50ms) until it
//    passes or the timeout (default 1000ms) is reached.
//    USE when:
//      • A component updates state asynchronously (after a Promise resolves)
//      • After a user action, DOM changes happen in the next tick or later
//    DO NOT use waitFor when a synchronous query would work — it hides bugs
//    and makes tests slower.
//
//  findBy* queries
//    findByText, findByRole, findByTestId are shorthand for
//    waitFor(() => getBy*(...)). They return a Promise.
//    Prefer findBy* when you simply want to wait for ONE element to appear.
//    Prefer waitFor when you have MULTIPLE assertions inside one wait block.
//
//  vi.fn() for callback props
//    Mock callback props with vi.fn() so you can assert:
//      • toHaveBeenCalled()          — was it called at all?
//      • toHaveBeenCalledWith(args)  — was it called with the right args?
//      • not.toHaveBeenCalled()      — was it NOT called (e.g. on error)?
//      • toHaveBeenCalledTimes(n)    — called exactly n times?
//
//  Testing async components WITHOUT fake timers:
//    LoginForm has a configurable `loginDelayMs` prop.
//    In tests, we pass loginDelayMs={0} so the Promise resolves in the
//    next microtask tick — no real waiting, no fake timers needed.
//    This is often the cleanest approach: make delay injectable.
//
//    When you CAN'T inject the delay (third-party code, etc.), use:
//      vi.useFakeTimers() + vi.advanceTimersByTimeAsync(ms)
//    (See mocking.test.ts for fake timer patterns with useDebounce.)

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/LoginForm';

// ─────────────────────────────────────────────────────────────────
// Helper: fillAndSubmit
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
    // Reset mock call counts between tests so one test's calls
    // don't appear in the next test's assertions
    vi.resetAllMocks();
  });

  // ─────────────────────────────────────────────────────────────
  // Initial render
  // ─────────────────────────────────────────────────────────────
  describe('initial render', () => {
    it('renders email input, password input, and submit button', () => {
      render(<LoginForm />);

      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    });

    it('does not show error or success messages initially', () => {
      render(<LoginForm />);

      // queryByTestId — returns null when element is absent.
      // getByTestId would throw here, which would give a confusing error.
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
      expect(screen.queryByTestId('success-message')).not.toBeInTheDocument();
    });

    it('renders the submit button with "Sign In" text', () => {
      render(<LoginForm />);
      // toHaveTextContent — checks the element's text (ignores child markup)
      expect(screen.getByTestId('submit-button')).toHaveTextContent('Sign In');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Validation errors (synchronous — no async / waitFor needed)
  // ─────────────────────────────────────────────────────────────
  describe('validation errors', () => {
    it('shows "Email is required" when submitted with empty email', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      await user.click(screen.getByTestId('submit-button'));

      // Validation runs synchronously before any async code —
      // the error is in the DOM immediately after the click resolves.
      // No waitFor needed.
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

    it('shows "Password is required" when email is valid but password is empty', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      await user.type(screen.getByTestId('email-input'), 'user@example.com');
      await user.click(screen.getByTestId('submit-button'));

      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Password is required'
      );
    });

    it('does not call onSuccess when validation fails', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      render(<LoginForm onSuccess={onSuccess} />);

      // Submit empty — validation fails before any async logic runs
      await user.click(screen.getByTestId('submit-button'));

      // not.toHaveBeenCalled() — the mock was never invoked
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Loading state
  // ─────────────────────────────────────────────────────────────
  //
  // We pass loginDelayMs={50} — long enough to capture the loading state
  // in a synchronous assertion, short enough not to slow the test suite.
  // This avoids the complexity of fake timers entirely.
  //
  // WHY NOT fake timers?
  //  userEvent.setup() uses real Promises internally. When fake timers
  //  are installed, those Promises can stall. The injectable-delay pattern
  //  is simpler and teaches a useful design principle: make delays testable.
  //
  describe('loading state', () => {
    it('shows "Signing in..." and disables the button during submission', async () => {
      const user = userEvent.setup();
      // loginDelayMs={50} — real 50ms delay; fast but real
      render(<LoginForm loginDelayMs={50} />);

      await user.type(screen.getByTestId('email-input'), 'user@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');

      // Fire click but DO NOT await it fully — we want to inspect mid-flight state.
      // user.click() returns a Promise; we start it but check the DOM first.
      const clickPromise = user.click(screen.getByTestId('submit-button'));

      // By the time clickPromise is in flight, React has committed the
      // loading state. The 50ms timer hasn't fired yet.
      // waitFor polls until the loading text appears (should be immediate)
      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).toHaveTextContent('Signing in...');
      });
      expect(screen.getByTestId('submit-button')).toBeDisabled();

      // Await the full click + delay so the test cleans up properly
      await clickPromise;
      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });
    });

    it('re-enables the button after loading completes', async () => {
      const user = userEvent.setup();
      render(<LoginForm loginDelayMs={50} />);

      await fillAndSubmit(user, 'user@example.com', 'password123');

      // waitFor keeps polling until the button exits its disabled/loading state.
      // This is the correct pattern for asserting on async state transitions.
      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
        expect(screen.getByTestId('submit-button')).toHaveTextContent('Sign In');
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Successful submission
  // ─────────────────────────────────────────────────────────────
  describe('successful submission', () => {
    it('calls onSuccess with the correct email after the delay', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      render(<LoginForm onSuccess={onSuccess} loginDelayMs={0} />);

      // loginDelayMs={0} → setTimeout resolves in the next microtask tick
      await fillAndSubmit(user, 'alice@example.com', 'password123');

      // waitFor waits for the async state update from the resolved Promise
      await waitFor(() => {
        // toHaveBeenCalledWith — verify the exact argument
        expect(onSuccess).toHaveBeenCalledWith('alice@example.com');
      });
      // toHaveBeenCalledTimes — make sure it wasn't called multiple times
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it('shows the success message with the logged-in email', async () => {
      const user = userEvent.setup();
      render(<LoginForm loginDelayMs={0} />);

      await fillAndSubmit(user, 'bob@example.com', 'password123');

      // findByTestId — shorthand for waitFor(() => screen.getByTestId(...))
      // Returns a Promise that resolves when the element appears.
      // This is cleaner than waitFor when there is only one assertion.
      const successMsg = await screen.findByTestId('success-message');
      expect(successMsg).toHaveTextContent('Logged in as bob@example.com');
    });

    it('hides the error message on a subsequent successful submission', async () => {
      const user = userEvent.setup();
      render(<LoginForm loginDelayMs={0} />);

      // Step 1: trigger a validation error
      await user.click(screen.getByTestId('submit-button'));
      expect(screen.getByTestId('error-message')).toBeInTheDocument();

      // Step 2: fill valid data and resubmit
      await user.type(screen.getByTestId('email-input'), 'user@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.click(screen.getByTestId('submit-button'));

      // After the async submission completes, the error should be gone
      await waitFor(() => {
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
      });
    });

    it('does not show success message from a previous login after new renders', async () => {
      // Verifies state resets correctly between uses
      const user = userEvent.setup();
      const { unmount } = render(<LoginForm loginDelayMs={0} />);

      await fillAndSubmit(user, 'first@example.com', 'password123');
      await screen.findByTestId('success-message');

      unmount();

      // Re-render fresh — should have no success message
      render(<LoginForm loginDelayMs={0} />);
      expect(screen.queryByTestId('success-message')).not.toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Error clearing on input change
  // ─────────────────────────────────────────────────────────────
  describe('error clearing', () => {
    it('clears the error message when the user starts typing in the email field', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      // Trigger an error first
      await user.click(screen.getByTestId('submit-button'));
      expect(screen.getByTestId('error-message')).toBeInTheDocument();

      // The onChange on email input calls setError('') — synchronous
      await user.type(screen.getByTestId('email-input'), 'a');

      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });

    it('clears the error when the user types in the password field', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      // Type a valid email first (so the error from submitting is about password)
      await user.type(screen.getByTestId('email-input'), 'user@example.com');
      await user.click(screen.getByTestId('submit-button'));
      expect(screen.getByTestId('error-message')).toHaveTextContent('Password is required');

      // Typing in password should clear the error
      await user.type(screen.getByTestId('password-input'), 'a');
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });
  });
});
