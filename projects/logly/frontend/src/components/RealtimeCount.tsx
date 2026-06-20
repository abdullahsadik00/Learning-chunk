import { useEffect, useRef, useState } from 'react';

interface RealtimeCountProps {
  projectId: string;
}

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export default function RealtimeCount({ projectId }: RealtimeCountProps) {
  const [count, setCount] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let destroyed = false;

    function connect() {
      if (destroyed) return;

      const url = `${BASE_URL}/api/projects/${projectId}/metrics/realtime`;
      const es = new EventSource(url, { withCredentials: true });
      esRef.current = es;

      es.onopen = () => {
        if (!destroyed) setConnected(true);
      };

      es.onmessage = (event: MessageEvent<string>) => {
        if (destroyed) return;
        try {
          const data = JSON.parse(event.data) as { count: number };
          setCount(data.count);
        } catch {
          // Malformed SSE data — ignore silently
        }
      };

      es.onerror = () => {
        if (destroyed) return;
        setConnected(false);
        es.close();
        esRef.current = null;

        // Reconnect after 5 seconds — EventSource reconnects automatically but
        // we handle it manually so we can control the reconnect delay
        reconnectTimerRef.current = setTimeout(() => {
          if (!destroyed) connect();
        }, 5_000);
      };
    }

    connect();

    return () => {
      destroyed = true;
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [projectId]);

  return (
    <div className="inline-flex items-center gap-2 bg-slate-800 rounded-lg border border-slate-700 px-3 py-1.5">
      {/* Pulsing green dot */}
      <span className="relative flex h-2 w-2">
        {connected && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            connected ? 'bg-emerald-500' : 'bg-slate-600'
          }`}
        />
      </span>

      <span className="text-sm text-slate-300">
        {count === null ? (
          <span className="text-slate-500">Connecting…</span>
        ) : (
          <>
            <span className="font-semibold text-white">{count}</span>{' '}
            {count === 1 ? 'visitor' : 'visitors'} right now
          </>
        )}
      </span>
    </div>
  );
}
