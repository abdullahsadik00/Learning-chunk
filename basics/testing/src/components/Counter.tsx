import { useState } from 'react';

interface CounterProps {
  initialCount?: number;
  step?: number;
  min?: number;
  max?: number;
}

export function Counter({
  initialCount = 0,
  step = 1,
  min = -Infinity,
  max = Infinity,
}: CounterProps) {
  const [count, setCount] = useState(initialCount);

  const decrement = () => setCount(c => Math.max(min, c - step));
  const increment = () => setCount(c => Math.min(max, c + step));
  const reset = () => setCount(initialCount);

  return (
    <div data-testid="counter" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button onClick={decrement} disabled={count <= min} aria-label="Decrement">
        −
      </button>
      <span data-testid="count" aria-live="polite">
        {count}
      </span>
      <button onClick={increment} disabled={count >= max} aria-label="Increment">
        +
      </button>
      <button onClick={reset} aria-label="Reset">
        Reset
      </button>
    </div>
  );
}
