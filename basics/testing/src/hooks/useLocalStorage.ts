import { useState } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void, () => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStored(value);
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // silently ignore storage errors (e.g. private browsing quota)
    }
  };

  const removeValue = () => {
    try {
      setStored(initialValue);
      localStorage.removeItem(key);
    } catch {
      // silently ignore
    }
  };

  return [stored, setValue, removeValue];
}
