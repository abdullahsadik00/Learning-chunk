import { useState, useEffect, useCallback } from 'react';
import type { Message } from '@/types';

const QUEUE_KEY = 'chat-offline-queue';

function loadQueue(): Message[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as Message[];
  } catch {
    return [];
  }
}

function saveQueue(q: Message[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

export function useOfflineSupport(onSync: (messages: Message[]) => void) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedCount, setQueuedCount] = useState(() => loadQueue().length);

  // Capture onSync in a ref so the effect doesn't re-run on every render
  const onSyncRef = { current: onSync };
  onSyncRef.current = onSync;

  useEffect(() => {
    function syncQueue() {
      const queue = loadQueue();
      if (!queue.length) return;
      onSyncRef.current(queue);
      saveQueue([]);
      setQueuedCount(0);
    }

    const handleOnline = () => {
      setIsOnline(true);
      syncQueue();
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const enqueue = useCallback((message: Message) => {
    const queue = loadQueue();
    queue.push(message);
    saveQueue(queue);
    setQueuedCount(queue.length);
  }, []);

  return { isOnline, queuedCount, enqueue };
}
