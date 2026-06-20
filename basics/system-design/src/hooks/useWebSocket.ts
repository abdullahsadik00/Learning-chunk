import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketClient } from '@/lib/WebSocketClient';

export function useWebSocket(url: string) {
  const clientRef = useRef<WebSocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<{ type: string; payload: unknown } | null>(null);

  useEffect(() => {
    const client = new WebSocketClient(url, {
      reconnectInterval: 1000,
      maxReconnectAttempts: 10,
    });
    clientRef.current = client;

    const unsubConnect = client.subscribe<null>('connect', () => setIsConnected(true));
    const unsubDisconnect = client.subscribe<null>('disconnect', () => setIsConnected(false));

    // To capture all typed messages for lastMessage we subscribe to a wildcard pattern
    // via the internal 'message' synthetic event emitted on every onmessage parse.
    // Since WebSocketClient emits per-type events, consumers use subscribe() directly.
    // lastMessage is surfaced for convenience via the subscribe callback below.
    const unsubMessage = client.subscribe<{ type: string; payload: unknown }>(
      'message',
      (data) => setLastMessage(data)
    );

    client.connect();

    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubMessage();
      client.disconnect();
    };
  }, [url]);

  const send = useCallback(<T>(type: string, payload: T) => {
    clientRef.current?.send(type, payload);
  }, []);

  const subscribe = useCallback(<T>(event: string, handler: (data: T) => void) => {
    return clientRef.current?.subscribe(event, handler) ?? (() => {});
  }, []);

  return { send, subscribe, isConnected, lastMessage };
}
