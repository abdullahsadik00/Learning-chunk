import { useState, useEffect, useCallback } from 'react';

type FetchState<T> = { data: T | null; loading: boolean; error: string | null };

export function useFetch<T>(url: string | null) {
  const [state, setState] = useState<FetchState<T>>({ data: null, loading: false, error: null });

  const fetchData = useCallback(async () => {
    if (!url) return;
    setState({ data: null, loading: true, error: null });
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json() as T;
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  }, [url]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { ...state, refetch: fetchData };
}
