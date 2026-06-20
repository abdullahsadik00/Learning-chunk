import { useState } from 'react';
import { validateEmail } from '@/utils/validators';

interface LoginFormProps {
  onSuccess?: (email: string) => void;
  /** Delay in ms for the simulated network call. Default 1000. Pass a small value in tests. */
  loginDelayMs?: number;
}

export function LoginForm({ onSuccess, loginDelayMs = 1000 }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successEmail, setSuccessEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    const emailResult = validateEmail(email);
    if (!emailResult.valid) {
      setError(emailResult.error ?? 'Invalid email');
      return;
    }
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    // Simulate async login (configurable delay — use loginDelayMs={0} in tests)
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, loginDelayMs));
    setIsLoading(false);

    setSuccessEmail(email);
    onSuccess?.(email);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ marginBottom: 12 }}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={e => {
            setEmail(e.target.value);
            setError(''); // clear error on change
          }}
          data-testid="email-input"
          placeholder="you@example.com"
          disabled={isLoading}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={e => {
            setPassword(e.target.value);
            setError('');
          }}
          data-testid="password-input"
          placeholder="••••••••"
          disabled={isLoading}
        />
      </div>

      {error && (
        <p data-testid="error-message" style={{ color: 'red' }}>
          {error}
        </p>
      )}

      {successEmail && (
        <p data-testid="success-message" style={{ color: 'green' }}>
          Logged in as {successEmail}
        </p>
      )}

      <button type="submit" data-testid="submit-button" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
