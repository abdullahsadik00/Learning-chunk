import { useState, useCallback } from 'react';

export function useLog(max = 40) {
  const [entries, setEntries] = useState<string[]>([]);

  const add = useCallback((msg: string) => {
    const t = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setEntries(prev => [`${t}  ${msg}`, ...prev].slice(0, max));
  }, [max]);

  const clear = useCallback(() => setEntries([]), []);

  return { entries, add, clear };
}
