import { useEffect, useRef, useState } from 'react';
import type { Metric } from '@/types';

interface SSEState {
  metrics: Metric[];
  isConnected: boolean;
  error: string | null;
}

export function useSSEMetrics(endpoint: string) {
  const [state, setState] = useState<SSEState>({
    metrics: [],
    isConnected: false,
    error: null,
  });
  const retryCount = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      const es = new EventSource(endpoint);
      esRef.current = es;

      es.onopen = () => {
        if (!cancelled) {
          retryCount.current = 0;
          setState(s => ({ ...s, isConnected: true, error: null }));
        }
      };

      es.onmessage = (e) => {
        if (cancelled) return;
        try {
          const metrics = JSON.parse(e.data as string) as Metric[];
          setState(s => ({ ...s, metrics }));
        } catch {
          // ignore malformed SSE data
        }
      };

      es.onerror = () => {
        es.close();
        if (cancelled) return;
        setState(s => ({ ...s, isConnected: false }));
        const delay =
          Math.min(1000 * Math.pow(2, retryCount.current++), 30_000) +
          Math.random() * 1000;
        retryTimer.current = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      cancelled = true;
      esRef.current?.close();
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [endpoint]);

  return state;
}
