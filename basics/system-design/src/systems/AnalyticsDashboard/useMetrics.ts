import { useState, useEffect, useCallback } from 'react';
import { INITIAL_METRICS, simulateMetricUpdate } from './mockMetrics';
import type { Metric } from '@/types';

export function useMetrics(intervalMs = 3000) {
  const [metrics, setMetrics] = useState<Metric[]>(INITIAL_METRICS);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(() => {
      setMetrics(prev => simulateMetricUpdate(prev));
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isLive, intervalMs]);

  const toggle = useCallback(() => setIsLive(v => !v), []);

  return { metrics, isLive, toggle };
}
