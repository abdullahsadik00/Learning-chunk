// REACT 15: REAL-TIME FRONTEND · WEBSOCKET · SSE · SYSTEM DESIGN  (Day 25)
// Run: cd basics/react && npm run dev

import React, {
    useState, useEffect, useRef, useCallback, useReducer, ReactNode,
} from 'react';

// ───────────────────────────────────────────────────────────────
// 1. REAL-TIME PROTOCOL SELECTION — frontend POV
// ───────────────────────────────────────────────────────────────
//
// Three options. Pick the right tool for the job — not the coolest one.
//
// ┌─────────────────┬──────────────┬──────────────┬─────────────────┐
// │                 │  WebSocket   │     SSE      │    Polling      │
// ├─────────────────┼──────────────┼──────────────┼─────────────────┤
// │ Direction       │ Bi-dir.      │ Server→Client│ Client pull     │
// │ Protocol        │ ws:// wss:// │ HTTP/1.1     │ HTTP/1.1        │
// │ Browser support │ All          │ All (no IE)  │ All             │
// │ Auto-reconnect  │ Manual       │ Built-in!    │ setInterval     │
// │ Binary support  │ Yes          │ No (text)    │ No              │
// │ Complexity      │ Medium       │ Low          │ Very low        │
// └─────────────────┴──────────────┴──────────────┴─────────────────┘
//
// DECISION FLOWCHART
//
// Does the CLIENT need to SEND data in real-time?
//   YES → WebSocket (chat, multiplayer game, collaborative editing)
//   NO  → Does the server need to push updates?
//         YES → SSE (notifications, stock prices, live feeds, CI logs)
//         NO  → Polling (admin dashboards, low-freq status checks)
//
// USE WEBSOCKET FOR:
//   Chat apps, online games, shared whiteboards, pair coding, auctions
//
// USE SSE FOR:
//   Tweet feeds, build logs, score updates, server-sent notifications
//   Anything Kafka/Redis Pub-Sub driven on the backend
//
// USE POLLING FOR:
//   "Refresh every 30s" dashboards, lazy integrations, webhook fallback
//
// HYBRID PATTERN (real world):
//   Read path = SSE  (server pushes new data to client)
//   Write path = REST POST / WebSocket  (client sends data)
//   Example: Twitter reads via SSE, posts via REST

// ⚠️ GOTCHA: SSE is HTTP/1.1 and counts against the browser's 6-connection-per-origin limit.
// If the user has 6 tabs open, the 7th tab's SSE request will stall. HTTP/2 fixes this
// (multiplexed streams), but your server must support it. Confirm with DevTools → Network → Protocol.

// ───────────────────────────────────────────────────────────────
// 2. useWebSocket CUSTOM HOOK
// ───────────────────────────────────────────────────────────────
//
// A production-grade WebSocket hook needs:
//   1. Connection lifecycle tracking (connecting → open → closing → closed)
//   2. Auto-reconnect with exponential backoff (don't hammer the server)
//   3. Message queue: buffer outgoing messages while disconnected
//   4. Typed messages with discriminated unions (no `any`)
//   5. Heartbeat / ping-pong: detect zombie connections the OS missed

// ── Typed message protocol ──
type WsMessage =
    | { type: 'chat';        payload: { userId: string; text: string; ts: number } }
    | { type: 'presence';    payload: { userId: string; status: 'online' | 'away' | 'offline' } }
    | { type: 'ping';        payload: null }
    | { type: 'pong';        payload: null }
    | { type: 'error';       payload: { code: number; reason: string } };

type WsStatus = 'connecting' | 'open' | 'closing' | 'closed' | 'error';

interface UseWebSocketOptions {
    onMessage?: (msg: WsMessage) => void;
    onStatusChange?: (status: WsStatus) => void;
    reconnect?: boolean;
    maxReconnectDelay?: number;   // ms, default 30_000
    heartbeatInterval?: number;   // ms, default 25_000 (0 = disabled)
}

interface UseWebSocketReturn {
    status: WsStatus;
    send: (msg: WsMessage) => void;
    disconnect: () => void;
}

function useWebSocket(url: string, options: UseWebSocketOptions = {}): UseWebSocketReturn {
    const {
        onMessage,
        onStatusChange,
        reconnect = true,
        maxReconnectDelay = 30_000,
        heartbeatInterval = 25_000,
    } = options;

    const [status, setStatus] = useState<WsStatus>('closed');
    const wsRef            = useRef<WebSocket | null>(null);
    const reconnectDelay   = useRef(1_000);           // start at 1s, double each attempt
    const reconnectTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
    const heartbeatTimer   = useRef<ReturnType<typeof setInterval> | null>(null);
    const messageQueue     = useRef<WsMessage[]>([]);  // buffer while disconnected
    const intentionalClose = useRef(false);            // don't reconnect on manual disconnect

    // Stable ref to callbacks so the WebSocket event handlers don't go stale
    const onMessageRef      = useRef(onMessage);
    const onStatusChangeRef = useRef(onStatusChange);
    useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
    useEffect(() => { onStatusChangeRef.current = onStatusChange; }, [onStatusChange]);

    const updateStatus = useCallback((s: WsStatus) => {
        setStatus(s);
        onStatusChangeRef.current?.(s);
    }, []);

    const stopHeartbeat = useCallback(() => {
        if (heartbeatTimer.current) {
            clearInterval(heartbeatTimer.current);
            heartbeatTimer.current = null;
        }
    }, []);

    const startHeartbeat = useCallback((ws: WebSocket) => {
        if (!heartbeatInterval) return;
        heartbeatTimer.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ping', payload: null }));
            }
        }, heartbeatInterval);
    }, [heartbeatInterval]);

    const flushQueue = useCallback((ws: WebSocket) => {
        while (messageQueue.current.length > 0) {
            const msg = messageQueue.current.shift()!;
            ws.send(JSON.stringify(msg));
        }
    }, []);

    const connect = useCallback(() => {
        if (wsRef.current && wsRef.current.readyState < WebSocket.CLOSING) return;

        updateStatus('connecting');
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            updateStatus('open');
            reconnectDelay.current = 1_000; // reset backoff on successful connect
            startHeartbeat(ws);
            flushQueue(ws);
        };

        ws.onmessage = (event: MessageEvent) => {
            try {
                const msg: WsMessage = JSON.parse(event.data as string);
                // Pong keeps the connection alive; no need to surface it
                if (msg.type === 'pong') return;
                onMessageRef.current?.(msg);
            } catch {
                console.error('[useWebSocket] Failed to parse message', event.data);
            }
        };

        ws.onerror = () => {
            updateStatus('error');
        };

        ws.onclose = () => {
            stopHeartbeat();
            updateStatus('closed');

            if (reconnect && !intentionalClose.current) {
                // Exponential backoff: 1s → 2s → 4s → 8s … capped at maxReconnectDelay
                const delay = Math.min(reconnectDelay.current, maxReconnectDelay);
                reconnectDelay.current = Math.min(reconnectDelay.current * 2, maxReconnectDelay);
                reconnectTimer.current = setTimeout(connect, delay);
            }
        };
    }, [url, reconnect, maxReconnectDelay, updateStatus, startHeartbeat, flushQueue, stopHeartbeat]);

    // Connect on mount, cleanup on unmount
    useEffect(() => {
        intentionalClose.current = false;
        connect();

        return () => {
            intentionalClose.current = true;
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            stopHeartbeat();
            wsRef.current?.close();
        };
    }, [connect, stopHeartbeat]);

    const send = useCallback((msg: WsMessage) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(msg));
        } else {
            // Queue the message — will be flushed when connection reopens
            messageQueue.current.push(msg);
        }
    }, []);

    const disconnect = useCallback(() => {
        intentionalClose.current = true;
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
        stopHeartbeat();
        wsRef.current?.close();
        updateStatus('closing');
    }, [stopHeartbeat, updateStatus]);

    return { status, send, disconnect };
}

// ── Demo component for the hook ──
function WebSocketDemo() {
    const [messages, setMessages] = useState<string[]>([]);
    const [inputText, setInputText] = useState('');

    const handleMessage = useCallback((msg: WsMessage) => {
        if (msg.type === 'chat') {
            setMessages(prev => [...prev, `[${msg.payload.userId}] ${msg.payload.text}`]);
        }
    }, []);

    // In a real app this would be wss://your-server.com/ws
    // Here we show the hook usage — the connection will fail but that's fine for the demo
    const { status, send } = useWebSocket('wss://echo.websocket.org', {
        onMessage: handleMessage,
    });

    const sendMessage = () => {
        if (!inputText.trim()) return;
        send({ type: 'chat', payload: { userId: 'me', text: inputText, ts: Date.now() } });
        setMessages(prev => [...prev, `[me] ${inputText}`]);
        setInputText('');
    };

    const statusColor: Record<WsStatus, string> = {
        connecting: '#f59e0b',
        open:       '#10b981',
        closing:    '#f59e0b',
        closed:     '#6b7280',
        error:      '#ef4444',
    };

    return (
        <div style={{ border: '1px solid #374151', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: statusColor[status],
                }} />
                <span style={{ fontSize: 13, color: '#9ca3af' }}>WebSocket: {status}</span>
            </div>

            <div style={{
                height: 120, overflowY: 'auto', background: '#111827',
                borderRadius: 6, padding: 8, marginBottom: 8, fontFamily: 'monospace', fontSize: 12,
            }}>
                {messages.length === 0
                    ? <span style={{ color: '#6b7280' }}>No messages yet…</span>
                    : messages.map((m, i) => (
                        <div key={i} style={{ color: '#d1d5db' }}>{m}</div>
                    ))
                }
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
                <input
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message…"
                    style={{
                        flex: 1, padding: '6px 10px', borderRadius: 6,
                        border: '1px solid #374151', background: '#1f2937', color: '#f9fafb',
                    }}
                />
                <button
                    onClick={sendMessage}
                    style={{
                        padding: '6px 14px', borderRadius: 6, border: 'none',
                        background: '#3b82f6', color: '#fff', cursor: 'pointer',
                    }}
                >
                    Send
                </button>
            </div>
        </div>
    );
}

// ⚠️ GOTCHA: WebSocket.readyState has 4 states: 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED.
// Calling ws.send() when readyState != OPEN throws synchronously and crashes your app.
// Always guard: `if (ws.readyState === WebSocket.OPEN)` before sending. The queue pattern
// above is the correct production solution for the "not open yet" window.

// ───────────────────────────────────────────────────────────────
// 3. SSE WITH useEventSource
// ───────────────────────────────────────────────────────────────
//
// SSE (Server-Sent Events) uses plain HTTP. The server sends a stream of:
//
//   data: {"price": 42500, "ticker": "BTC"}   ← anonymous event (onmessage)
//
//   event: price-update                        ← named event
//   data: {"price": 42600, "ticker": "BTC"}
//   id: 001                                    ← Last-Event-ID for resuming
//
// Browser builds in auto-reconnect. On reconnect it sends:
//   Last-Event-ID: 001     ← server picks up from where it left off
//
// EventSource constructor: new EventSource(url, { withCredentials: true })
// Named events: source.addEventListener('price-update', handler)

interface SseOptions<T> {
    withCredentials?: boolean;
    onError?: (err: Event) => void;
    parseData?: (raw: string) => T;
}

function useEventSource<T = unknown>(url: string | null, options: SseOptions<T> = {}) {
    const { withCredentials = false, onError, parseData } = options;
    const [data, setData]       = useState<T | null>(null);
    const [status, setStatus]   = useState<'connecting' | 'open' | 'closed'>('closed');
    const [lastId, setLastId]   = useState<string | null>(null);
    const sourceRef             = useRef<EventSource | null>(null);
    const onErrorRef            = useRef(onError);
    const parseDataRef          = useRef(parseData);
    useEffect(() => { onErrorRef.current = onError; }, [onError]);
    useEffect(() => { parseDataRef.current = parseData; }, [parseData]);

    useEffect(() => {
        if (!url) return;

        setStatus('connecting');
        const source = new EventSource(url, { withCredentials });
        sourceRef.current = source;

        source.onopen = () => setStatus('open');

        source.onmessage = (e: MessageEvent) => {
            // e.lastEventId is set if the server sends an `id:` field
            if (e.lastEventId) setLastId(e.lastEventId);
            try {
                const parsed = parseDataRef.current
                    ? parseDataRef.current(e.data as string)
                    : JSON.parse(e.data as string) as T;
                setData(parsed);
            } catch {
                console.error('[useEventSource] Parse error', e.data);
            }
        };

        source.onerror = (e: Event) => {
            // EventSource auto-reconnects. readyState 2 = CLOSED (permanent error)
            if (source.readyState === EventSource.CLOSED) {
                setStatus('closed');
            }
            onErrorRef.current?.(e);
        };

        return () => {
            source.close();
            setStatus('closed');
        };
    }, [url, withCredentials]);

    // Named event subscription helper
    const subscribe = useCallback(<U = T>(
        eventName: string,
        handler: (data: U) => void,
    ) => {
        if (!sourceRef.current) return () => {};
        const listener = (e: MessageEvent) => {
            try { handler(JSON.parse(e.data as string) as U); }
            catch { handler(e.data as unknown as U); }
        };
        sourceRef.current.addEventListener(eventName, listener);
        return () => sourceRef.current?.removeEventListener(eventName, listener);
    }, []);

    return { data, status, lastId, subscribe };
}

// ── SSE demo with simulated price feed ──
interface TickerPrice { ticker: string; price: number; change: number }

function SseDemo() {
    const [prices, setPrices] = useState<TickerPrice[]>([
        { ticker: 'BTC', price: 67_420, change: 1.2 },
        { ticker: 'ETH', price: 3_841,  change: -0.4 },
    ]);

    // Simulating SSE with setInterval since we have no real server
    useEffect(() => {
        const interval = setInterval(() => {
            setPrices(prev => prev.map(p => ({
                ...p,
                price:  Math.round(p.price * (1 + (Math.random() - 0.5) * 0.002)),
                change: parseFloat(((Math.random() - 0.5) * 4).toFixed(2)),
            })));
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ border: '1px solid #374151', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
                Simulated SSE price feed (real: use useEventSource with your /prices endpoint)
            </div>
            {prices.map(p => (
                <div key={p.ticker} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '8px 0', borderBottom: '1px solid #1f2937',
                }}>
                    <span style={{ fontWeight: 600 }}>{p.ticker}</span>
                    <span>${p.price.toLocaleString()}</span>
                    <span style={{ color: p.change >= 0 ? '#10b981' : '#ef4444' }}>
                        {p.change >= 0 ? '+' : ''}{p.change}%
                    </span>
                </div>
            ))}
        </div>
    );
}

// ⚠️ GOTCHA: EventSource does NOT support custom request headers (no Authorization header).
// If your SSE endpoint requires auth, pass the token as a query param (?token=xyz) or use
// a cookie. Sending it in a header requires a custom fetch-based polyfill like `event-source-polyfill`.

// ───────────────────────────────────────────────────────────────
// 4. OPTIMISTIC UI PATTERNS
// ───────────────────────────────────────────────────────────────
//
// Optimistic UI = update the UI instantly, then confirm with the server.
// If the server rejects it, roll back.
//
// Three situations:
//   1. Toggle (like/unlike, todo check) — flip immediately, undo on failure
//   2. Create (new comment, new post) — add a temp item with a fake id, replace on success
//   3. Delete — hide immediately, restore on failure
//
// STATE SHAPE for optimistic items:
//   { id, ...data, optimistic: true }  ← real items don't have this flag
//   { id: `temp-${Date.now()}`, ... }  ← fake id replaced after server responds
//
// VISUAL TREATMENT:
//   - Optimistic item: slightly faded (opacity: 0.7), maybe a spinner in corner
//   - On failure: shake animation + error toast, then restore
//   - On success: remove optimistic flag, fade to full opacity

interface Todo { id: string; text: string; done: boolean; optimistic?: boolean }

function OptimisticTodoList() {
    const [todos, setTodos] = useState<Todo[]>([
        { id: '1', text: 'Read the WebSocket spec', done: false },
        { id: '2', text: 'Build a chat app',        done: false },
        { id: '3', text: 'Ship to prod',            done: true  },
    ]);
    const [input, setInput] = useState('');

    // Toggle done with optimistic update + rollback
    const toggleTodo = async (id: string) => {
        const original = todos.find(t => t.id === id)!;

        // 1. Optimistic update
        setTodos(prev => prev.map(t =>
            t.id === id ? { ...t, done: !t.done, optimistic: true } : t
        ));

        try {
            // 2. Simulate API call (50ms, 20% chance of failure)
            await new Promise<void>((resolve, reject) =>
                setTimeout(() => Math.random() > 0.2 ? resolve() : reject(new Error('Server error')), 500)
            );
            // 3. Confirm: remove optimistic flag
            setTodos(prev => prev.map(t =>
                t.id === id ? { ...t, optimistic: false } : t
            ));
        } catch {
            // 4. Rollback: restore original state
            setTodos(prev => prev.map(t =>
                t.id === id ? { ...original, optimistic: false } : t
            ));
            alert(`Failed to update "${original.text}" — rolled back`);
        }
    };

    // Add with optimistic item (temp id)
    const addTodo = async () => {
        if (!input.trim()) return;
        const tempId  = `temp-${Date.now()}`;
        const newTodo: Todo = { id: tempId, text: input, done: false, optimistic: true };

        setTodos(prev => [...prev, newTodo]);
        setInput('');

        try {
            await new Promise<void>(r => setTimeout(r, 600)); // simulate POST
            const serverId = `server-${Date.now()}`;         // server returns real id
            setTodos(prev => prev.map(t =>
                t.id === tempId ? { ...t, id: serverId, optimistic: false } : t
            ));
        } catch {
            setTodos(prev => prev.filter(t => t.id !== tempId)); // remove ghost item
            alert('Failed to create todo — removed');
        }
    };

    return (
        <div style={{ border: '1px solid #374151', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTodo()}
                    placeholder="New todo…"
                    style={{
                        flex: 1, padding: '6px 10px', borderRadius: 6,
                        border: '1px solid #374151', background: '#1f2937', color: '#f9fafb',
                    }}
                />
                <button onClick={addTodo} style={{
                    padding: '6px 14px', borderRadius: 6, border: 'none',
                    background: '#3b82f6', color: '#fff', cursor: 'pointer',
                }}>Add</button>
            </div>
            {todos.map(todo => (
                <div
                    key={todo.id}
                    onClick={() => !todo.optimistic && toggleTodo(todo.id)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 0', cursor: 'pointer',
                        opacity: todo.optimistic ? 0.55 : 1,
                        transition: 'opacity 0.2s',
                    }}
                >
                    <div style={{
                        width: 18, height: 18, borderRadius: 4,
                        border: '2px solid #3b82f6',
                        background: todo.done ? '#3b82f6' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {todo.done && <span style={{ color: '#fff', fontSize: 11 }}>✓</span>}
                    </div>
                    <span style={{
                        textDecoration: todo.done ? 'line-through' : 'none',
                        color: todo.done ? '#6b7280' : '#f9fafb',
                    }}>
                        {todo.text}
                    </span>
                    {todo.optimistic && (
                        <span style={{ fontSize: 11, color: '#f59e0b', marginLeft: 'auto' }}>saving…</span>
                    )}
                </div>
            ))}
            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
                Click a todo to toggle. 20% chance of server failure → watch the rollback.
            </p>
        </div>
    );
}

// ⚠️ GOTCHA: Never mutate the real data store optimistically — always keep the original
// snapshot for rollback BEFORE you apply the optimistic change. If you update in-place and
// lose the original, a rollback restores nothing and your UI is stuck in a broken state.

// ───────────────────────────────────────────────────────────────
// 5. COLLABORATIVE FEATURES (CRDT BASICS)
// ───────────────────────────────────────────────────────────────
//
// CRDT = Conflict-free Replicated Data Type
//
// The problem: two users edit a shared doc at the same time.
// User A types "Hello", User B types "World". Who wins?
//
// OPERATIONAL TRANSFORM (OT) — the old way (Google Docs):
//   Track every operation (insert/delete). When two ops conflict, transform one
//   relative to the other so they converge. Correct but insanely complex.
//   Google Docs has hundreds of engineers maintaining this.
//
// CRDT — the modern way (Figma, Linear, Notion):
//   Design data structures that are mathematically guaranteed to converge
//   regardless of operation order. No coordination required.
//   Last-write-wins register, grow-only counter, observed-remove set…
//
// YJS — the go-to CRDT library for the web:
//   import * as Y from 'yjs'
//   import { WebsocketProvider } from 'y-websocket'
//
//   const doc = new Y.Doc()
//   const wsProvider = new WebsocketProvider('wss://y-server', 'my-room', doc)
//   const yText = doc.getText('editor')
//   yText.insert(0, 'Hello')   // synced to all peers automatically
//
// For most apps you don't need full CRDT. You DO need:
//   - Presence indicators (who's online / where their cursor is)
//   - Typing indicators ("Alice is typing…")
//   - Conflict warnings ("Alice is editing this field too")

// ── Presence / Typing indicator demo ──
interface Presence { userId: string; name: string; color: string; isTyping: boolean }

function PresenceDemo() {
    const [localText, setLocalText] = useState('');
    const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Simulating remote users — in real life these come via WebSocket
    const [remoteUsers, setRemoteUsers] = useState<Presence[]>([
        { userId: 'u2', name: 'Alice',   color: '#818cf8', isTyping: false },
        { userId: 'u3', name: 'Bob',     color: '#34d399', isTyping: false },
    ]);

    // Simulate remote typing activity
    useEffect(() => {
        const schedule = (userId: string, delay: number) =>
            setTimeout(() => {
                setRemoteUsers(prev => prev.map(u =>
                    u.userId === userId ? { ...u, isTyping: true } : u
                ));
                setTimeout(() => {
                    setRemoteUsers(prev => prev.map(u =>
                        u.userId === userId ? { ...u, isTyping: false } : u
                    ));
                }, 2000);
            }, delay);

        const t1 = schedule('u2', 1000);
        const t2 = schedule('u3', 3500);
        const t3 = schedule('u2', 6000);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, []);

    const [localTyping, setLocalTyping] = useState(false);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalText(e.target.value);
        // Broadcast "is typing" → debounce "stopped typing"
        setLocalTyping(true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setLocalTyping(false), 1500);
        // In real app: ws.send({ type: 'typing', payload: { isTyping: true } })
    };

    const typingPeople = [
        ...(localTyping ? [{ name: 'You (local)', color: '#f59e0b' }] : []),
        ...remoteUsers.filter(u => u.isTyping),
    ];

    return (
        <div style={{ border: '1px solid #374151', borderRadius: 8, padding: 16 }}>
            {/* Presence avatars */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {['You', ...remoteUsers.map(u => u.name)].map((name, i) => (
                    <div key={i} style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: i === 0 ? '#f59e0b' : remoteUsers[i - 1].color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: '#111',
                        title: name,
                    }}>
                        {name[0]}
                    </div>
                ))}
                <span style={{ fontSize: 12, color: '#6b7280', alignSelf: 'center', marginLeft: 4 }}>
                    {1 + remoteUsers.length} online
                </span>
            </div>

            <input
                value={localText}
                onChange={handleInput}
                placeholder="Start typing to trigger typing indicator…"
                style={{
                    width: '100%', padding: '8px 12px', borderRadius: 6, boxSizing: 'border-box',
                    border: '1px solid #374151', background: '#1f2937', color: '#f9fafb',
                    marginBottom: 10,
                }}
            />

            {/* Typing indicator */}
            <div style={{ height: 20, fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>
                {typingPeople.length === 0 ? null :
                 typingPeople.length === 1 ? `${typingPeople[0].name} is typing…` :
                 `${typingPeople.map(p => p.name).join(' and ')} are typing…`}
            </div>
        </div>
    );
}

// ⚠️ GOTCHA: Broadcasting "typing" on every keystroke will spam your WebSocket server.
// Debounce the "is typing" message: send it once when typing starts, then send "stopped"
// 1.5s after the last keystroke. Never send "typing" more than once per second per user.

// ───────────────────────────────────────────────────────────────
// 6. SYSTEM DESIGN: TWITTER/X FEED
// ───────────────────────────────────────────────────────────────
//
// REQUIREMENTS
//   Functional:
//     • Browse a home feed (posts from followed accounts)
//     • Create, delete, like posts
//     • See new posts appear in real-time
//     • Infinite scroll (load older posts on scroll down)
//   Non-functional:
//     • Optimistic likes/retweets (< 50ms perceived latency)
//     • Handle 10k posts/day on the feed without re-rendering all of them
//
// COMPONENT TREE
//   <App>
//     <TopNav>                  ← user avatar, compose button
//     <FeedPage>
//       <NewPostsBanner />      ← "12 new posts" tap to load
//       <VirtualizedFeedList>   ← only renders visible rows (react-virtual)
//         <TweetCard />         ← likes, retweets, replies (all optimistic)
//       </VirtualizedFeedList>
//       <ComposeModal />        ← text + media, optimistic add to top
//
// REAL-TIME NEW POSTS STRATEGY: SSE wins here.
//   Client reads via SSE endpoint: GET /api/feed/stream
//   Server pushes: { event: 'new-post', data: { post } }
//   Client accumulates new posts in a buffer (NOT the visible list)
//   → Show "N new posts" banner
//   → On click, prepend buffer to visible list
//   WHY? Prepending during scroll is jarring. Users hate the jump.
//
// INFINITE SCROLL (older posts):
//   React Query: useInfiniteQuery('feed', fetchFeedPage, { getNextPageParam })
//   IntersectionObserver on a sentinel div at the bottom triggers fetchNextPage()
//
// OPTIMISTIC POST CREATION:
//   1. Add temp post to top of list (optimistic: true, tempId)
//   2. POST /api/posts → { id, createdAt }
//   3. Replace temp post with server post (remove optimistic flag)
//   4. SSE may fire the same post back — deduplicate by id
//
// STATE MANAGEMENT:
//   Feed list      → React Query (server state, paginated, normalized)
//   Compose modal  → local useState
//   Auth/user      → Zustand global store
//   New posts buf  → useRef (no render needed, just count for banner)
//
// MEDIA UPLOAD FLOW:
//   1. User selects image
//   2. Client POSTs to /api/media/upload → presigned S3 URL
//   3. Client PUTs directly to S3 (no server bandwidth used)
//   4. Client POSTs tweet with { mediaUrl } from S3
//   5. Show upload progress bar from XHR upload events

function TwitterFeedDesign() {
    return (
        <div style={{ border: '1px solid #374151', borderRadius: 8, padding: 16, fontSize: 13 }}>
            <h4 style={{ margin: '0 0 12px', color: '#f9fafb' }}>Twitter/X Feed — Design Summary</h4>
            {[
                { label: 'Real-time new posts', value: 'SSE + "N new posts" banner (never auto-inject into scroll)' },
                { label: 'Infinite scroll (old)', value: 'React Query useInfiniteQuery + IntersectionObserver sentinel' },
                { label: 'Virtualization',        value: 'react-virtual or @tanstack/virtual — only render visible rows' },
                { label: 'Optimistic likes',      value: 'Increment count instantly, rollback on HTTP error' },
                { label: 'Optimistic compose',    value: 'Temp post at top (opacity 0.6), replace with server id' },
                { label: 'Media upload',          value: 'Presigned S3 URL — never pipe binary through your API server' },
                { label: 'Auth state',            value: 'Zustand — tiny, no boilerplate, easy to persist to localStorage' },
                { label: 'Dedup SSE + posts',     value: 'Use post.id as key in a Set — ignore if already in list' },
            ].map(row => (
                <div key={row.label} style={{
                    display: 'grid', gridTemplateColumns: '190px 1fr',
                    gap: 8, padding: '6px 0', borderBottom: '1px solid #1f2937',
                }}>
                    <span style={{ color: '#6b7280', fontWeight: 600 }}>{row.label}</span>
                    <span style={{ color: '#d1d5db' }}>{row.value}</span>
                </div>
            ))}
        </div>
    );
}

// ⚠️ GOTCHA: Injecting new posts at the top during infinite scroll causes layout shift —
// the user's current position jumps down by the height of the injected posts. Always
// accumulate in a buffer and let the user explicitly click "N new posts" to pull them in.
// (Yes, even Twitter does this wrong sometimes. Don't be Twitter.)

// ───────────────────────────────────────────────────────────────
// 7. SYSTEM DESIGN: LIVE CHAT
// ───────────────────────────────────────────────────────────────
//
// REQUIREMENTS
//   Functional:
//     • 1:1 and group channels
//     • Real-time message delivery
//     • Typing indicators
//     • Read receipts
//     • Message history (paginated)
//     • Offline queue (send when back online)
//   Non-functional:
//     • < 200ms perceived send latency (optimistic)
//     • Missed messages recovered on reconnect
//
// WEBSOCKET CONNECTION MANAGEMENT
//   One WS connection per client (not per channel!)
//   Messages are multiplexed: { type: 'chat', channelId: '123', ... }
//   Server routes to correct room via channelId.
//
// MESSAGE HISTORY
//   On channel open: React Query fetches last 50 messages via REST
//   Scroll up = load older (infinite scroll, backwards)
//   Real-time new messages arrive via WS, appended to the query cache
//
//   // Append WS message to React Query cache:
//   queryClient.setQueryData(['messages', channelId], (old) => ({
//     ...old,
//     pages: old.pages.map((page, i) =>
//       i === old.pages.length - 1
//         ? { ...page, messages: [...page.messages, newMsg] }
//         : page
//     )
//   }))
//
// TYPING INDICATORS
//   WS message: { type: 'typing', channelId, userId, isTyping }
//   Server broadcasts to everyone in the channel except sender
//   Client debounces: send "isTyping: true" once, "false" after 1.5s idle
//
// READ RECEIPTS
//   Client sends: { type: 'read', channelId, lastReadMsgId }
//   On tab focus, on scroll to bottom, after a settled 2s read
//   Server updates last_read_at for (user, channel) pair
//   SSE pushes receipt events to sender: "Alice read your message"
//
// OFFLINE QUEUE
//   useWebSocket hook queues messages in useRef while disconnected
//   On reconnect: flush queue in order, show "sent" state update
//   Persist queue to localStorage for page-refresh resilience:
//     useEffect(() => {
//       localStorage.setItem('msgQueue', JSON.stringify(messageQueue.current))
//     }, [/* queue changes */])
//
// RECONNECTION WITH MISSED MESSAGES
//   Client tracks lastSeenMsgId in state
//   On WS reconnect: REST GET /api/messages?after={lastSeenMsgId}
//   Server returns gap messages → merge into React Query cache
//   Only then flush the offline send queue (maintain ordering)

function LiveChatDesign() {
    return (
        <div style={{ border: '1px solid #374151', borderRadius: 8, padding: 16, fontSize: 13 }}>
            <h4 style={{ margin: '0 0 12px', color: '#f9fafb' }}>Live Chat — Design Summary</h4>
            {[
                { label: 'Transport',           value: 'Single WebSocket per client, multiplexed by channelId' },
                { label: 'History',             value: 'React Query useInfiniteQuery (backwards scroll = older msgs)' },
                { label: 'Cache update',        value: 'queryClient.setQueryData() — append WS msgs to last page' },
                { label: 'Typing indicator',    value: 'WS broadcast, debounced 1.5s, shown < 3 avatars, then "+N"' },
                { label: 'Read receipts',       value: 'WS send on focus/scroll-to-bottom, REST fallback on reconnect' },
                { label: 'Offline queue',       value: 'useRef buffer → persist to localStorage → flush on reconnect' },
                { label: 'Gap recovery',        value: 'REST /messages?after=lastSeenId on every reconnect' },
                { label: 'Optimistic send',     value: 'Add msg with tempId + status="sending", replace on ack' },
            ].map(row => (
                <div key={row.label} style={{
                    display: 'grid', gridTemplateColumns: '190px 1fr',
                    gap: 8, padding: '6px 0', borderBottom: '1px solid #1f2937',
                }}>
                    <span style={{ color: '#6b7280', fontWeight: 600 }}>{row.label}</span>
                    <span style={{ color: '#d1d5db' }}>{row.value}</span>
                </div>
            ))}
        </div>
    );
}

// ⚠️ GOTCHA: React Query's staleTime and gcTime work against you in real-time chat.
// If you don't update the cache when WS messages arrive, the user will see stale data
// whenever React Query refetches in the background (it replaces WS-appended messages
// with the server snapshot). Fix: update cache immediately on WS message AND set
// staleTime: Infinity so background refetches don't blow away your WS additions.

// ───────────────────────────────────────────────────────────────
// 8. SYSTEM DESIGN INTERVIEW TIPS
// ───────────────────────────────────────────────────────────────
//
// THE 45-MINUTE STRUCTURE (frontend system design)
//
//   0–5m   REQUIREMENTS GATHERING
//     Ask before designing. "Should I focus on desktop or mobile?"
//     "What scale? 100 users or 100M?" "What's the SLA for latency?"
//     Interviewers reward this — it shows senior instinct.
//
//   5–10m  HIGH-LEVEL DESIGN
//     Draw the component tree verbally: "I'd have a FeedPage with a
//     VirtualizedList inside it, a ComposeModal, and a NewPostsBanner…"
//     Agree on the shape before going deep.
//
//   10–20m  DATA & STATE
//     What lives where? Local state, React Query, Zustand, URL params.
//     What are the data shapes? Show the TypeScript types.
//     How does data flow (props down, events up, context for cross-tree)?
//
//   20–30m  REAL-TIME & NETWORK
//     Polling vs SSE vs WebSocket — justify your choice.
//     Optimistic updates and rollback strategy.
//     Offline/reconnect handling.
//
//   30–40m  PERFORMANCE & SCALE
//     Virtualization for long lists.
//     Code splitting with React.lazy().
//     Image lazy loading, skeleton screens.
//     Memoization strategy (React.memo, useMemo, useCallback).
//
//   40–45m  TRADE-OFFS & OPEN QUESTIONS
//     "I'd swap polling for SSE if traffic grows because…"
//     "I haven't addressed auth token refresh — that'd need…"
//     Leave one good open question — it shows depth, not ignorance.
//
// WHAT THE INTERVIEWER ACTUALLY CARES ABOUT
//   1. Can you break down a fuzzy problem into concrete pieces?
//   2. Do you consider the user experience (loading states, errors, latency)?
//   3. Do you make technology decisions, not just describe options?
//   4. Do you know the limits of your own design?
//
// HOW TO HANDLE "I DON'T KNOW"
//   Never freeze. Say: "I haven't used that API directly, but from first
//   principles I'd expect it works like X because Y. Let me sketch how
//   I'd approach it and you can correct me if I'm off."
//   Thinking out loud is the point. Silence is the only failure mode.
//
// DRAWING COMPONENT TREES IN WORDS
//   Don't wait for a whiteboard. Say it:
//   "<App> has a <Router>. The /feed route renders <FeedPage> which
//    contains <NewPostsBanner>, a <VirtualizedList> of <TweetCard>s,
//    and a <ComposeModal> toggled by local state."
//   Interviewers can follow this. It shows you think in structure.
//
// COMMON MISTAKES
//   ❌ Jumping to implementation before requirements
//   ❌ Picking WebSocket for everything ("it's faster")
//   ❌ Ignoring non-functional requirements (latency, scale, accessibility)
//   ❌ Over-engineering a simple feature (CRDT for a single-user todo list)
//   ❌ Never mentioning error states ("what if the API call fails?")
//   ❌ Treating state management as the first problem to solve
//      (it's usually the last decision, not the first)

function InterviewTipsDisplay() {
    const [expanded, setExpanded] = useState<string | null>(null);

    const tips = [
        {
            id: 'structure',
            title: '45-Minute Structure',
            content: '0-5m: Requirements → 5-10m: High-level → 10-20m: Data & State → 20-30m: Real-time & Network → 30-40m: Performance → 40-45m: Trade-offs',
        },
        {
            id: 'cares',
            title: 'What Interviewers Care About',
            content: 'Breaking fuzzy problems into pieces. Considering UX (loading, errors, latency). Making decisions — not just listing options. Knowing your design\'s limits.',
        },
        {
            id: 'dunno',
            title: 'Handling "I Don\'t Know"',
            content: 'Never freeze. Reason from first principles out loud: "I haven\'t used X directly, but from what I know about Y, I\'d expect it works like…"',
        },
        {
            id: 'mistakes',
            title: 'Common Mistakes',
            content: '1) Jumping to code before requirements 2) WebSocket for everything 3) Ignoring non-functionals 4) Over-engineering 5) Skipping error states',
        },
    ];

    return (
        <div style={{ border: '1px solid #374151', borderRadius: 8, padding: 16, fontSize: 13 }}>
            {tips.map(tip => (
                <div key={tip.id} style={{ marginBottom: 8 }}>
                    <button
                        onClick={() => setExpanded(expanded === tip.id ? null : tip.id)}
                        style={{
                            width: '100%', textAlign: 'left', padding: '8px 12px',
                            background: '#1f2937', border: '1px solid #374151', borderRadius: 6,
                            color: '#f9fafb', cursor: 'pointer', display: 'flex',
                            justifyContent: 'space-between', alignItems: 'center',
                        }}
                    >
                        <span style={{ fontWeight: 600 }}>{tip.title}</span>
                        <span>{expanded === tip.id ? '▲' : '▼'}</span>
                    </button>
                    {expanded === tip.id && (
                        <div style={{
                            padding: '10px 12px', background: '#111827',
                            borderRadius: '0 0 6px 6px', color: '#d1d5db', lineHeight: 1.6,
                        }}>
                            {tip.content}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// ⚠️ GOTCHA: The most common interview failure isn't technical — it's not making decisions.
// Saying "you could use WebSocket or SSE, both have trade-offs" and moving on is a red flag.
// Commit: "For this use case I'd pick SSE because X, and here's where I'd switch to WS."
// Interviewers want to see your judgment, not a Wikipedia article on transport protocols.

// ───────────────────────────────────────────────────────────────
// PRACTICE CHALLENGES
// ───────────────────────────────────────────────────────────────
//
// 1. RECONNECT WITH BACKOFF
//    Extend useWebSocket so the backoff resets to 1s if the connection
//    stays open for at least 30 seconds. (Hint: use a timeout that clears
//    the delay counter after the connection is stable.)
//
// 2. SSE NAMED EVENTS
//    Build a useNamedEventSource hook that accepts an object of
//    { [eventName]: handler } and subscribes to each named event.
//    Unsubscribe on cleanup. Type it so the handler receives typed data.
//
// 3. OPTIMISTIC DELETE
//    Add a delete button to OptimisticTodoList. Remove the item immediately,
//    then restore it on failure with an error message. Use the same
//    original-snapshot pattern shown for toggle.
//
// 4. SHARED CURSOR
//    Build a component that broadcasts your mouse position over a mock WS
//    (use useState + setInterval to simulate remote cursors). Render each
//    remote user's cursor as a colored dot with their name.
//
// 5. MESSAGE DEDUPLICATION
//    In a live chat, the same message can arrive via two paths: the
//    optimistic temp item AND the WS broadcast. Build a dedup function
//    that given a list of messages and a new incoming message, either
//    replaces the temp item (same correlationId), adds the message as new,
//    or ignores it (already present by server id).

// ───────────────────────────────────────────────────────────────
// SELF-ASSESSMENT — 10 QUESTIONS
// ───────────────────────────────────────────────────────────────
//
// 1. Q: What's the main reason to prefer SSE over WebSocket for a stock ticker?
//    A: The data flow is one-directional (server → client only). SSE is
//       simpler, works over plain HTTP, and has built-in reconnect. No need
//       for the extra complexity of a full-duplex WebSocket connection.
//
// 2. Q: Why does SSE have a 6-connection-per-origin limit problem?
//    A: SSE uses HTTP/1.1 connections, and browsers limit simultaneous
//       connections per origin to 6. Six open SSE tabs = the 7th stalls.
//       HTTP/2 fixes this via multiplexing (one connection, many streams).
//
// 3. Q: What's the difference between WebSocket.readyState 0 and 1?
//    A: 0 = CONNECTING (handshake in progress, cannot send yet).
//       1 = OPEN (ready to send and receive messages).
//
// 4. Q: What does exponential backoff mean and why is it important?
//    A: Wait 1s, then 2s, then 4s, then 8s between reconnect attempts.
//       Without it, thousands of clients hammering a crashed server
//       simultaneously prevent it from ever recovering (thundering herd).
//
// 5. Q: What is optimistic UI and when should you roll back?
//    A: Update the UI as if the server already accepted the action. Roll
//       back by restoring the original state snapshot if the server
//       returns an error. Rollback requires saving the snapshot BEFORE
//       applying the optimistic update.
//
// 6. Q: How does SSE's Last-Event-ID help with reliability?
//    A: The server sends `id: <value>` with each event. On reconnect,
//       the browser includes `Last-Event-ID: <value>` in the request.
//       The server can then replay events the client missed since that id.
//
// 7. Q: What is the key conceptual difference between OT and CRDT?
//    A: OT (Operational Transform) requires a central server to mediate
//       concurrent edits. CRDT uses data structures that guarantee
//       convergence mathematically — no central coordinator needed.
//
// 8. Q: For a live chat app, why do you use a single WebSocket connection
//       rather than one per channel?
//    A: Connections are expensive (handshake, memory, file descriptor).
//       Multiplexing channels over one connection is far more efficient.
//       Route by channelId in the message payload, not by connection.
//
// 9. Q: Why should new posts in a Twitter-like feed go into a buffer
//       instead of being injected at the top immediately?
//    A: Injecting at the top shifts the user's scroll position, causing
//       layout jump. The UX pattern is to accumulate in a buffer and
//       show a "N new posts" banner the user can tap to pull them in.
//
// 10. Q: In a system design interview, what's the biggest mistake
//        candidates make when asked about real-time features?
//     A: Picking a technology (WebSocket) without justifying it against
//        the requirement. Always reason from the data flow direction,
//        frequency, and client write needs — then name the technology.

// ───────────────────────────────────────────────────────────────
// LIVE DEMO — MOCK REAL-TIME FEED
// ───────────────────────────────────────────────────────────────

interface FeedItem {
    id: string;
    user: string;
    avatar: string;
    text: string;
    ts: number;
    likes: number;
    optimisticLike?: boolean;
}

const MOCK_USERS = [
    { user: 'alice_dev',     avatar: '#818cf8' },
    { user: 'bob_builds',    avatar: '#34d399' },
    { user: 'carol_designs', avatar: '#f472b6' },
    { user: 'dave_ships',    avatar: '#fb923c' },
];

const MOCK_TEXTS = [
    'Just deployed to prod. Zero downtime. Feels good.',
    'SSE > polling for read-heavy feeds. Change my mind.',
    'Finally understood CRDT. My brain hurts, but in a good way.',
    'Hot take: optimistic UI makes slow APIs feel instant.',
    'useWebSocket with exponential backoff is not optional. It\'s table stakes.',
    'The real-time protocol decision tree fits on a napkin. Start there.',
    'WebSocket: "Let\'s talk." REST: "I\'ll text you." SSE: "I\'ll tweet at you."',
    'Virtualize all the lists. Your users on 3-year-old phones will thank you.',
];

function generateFeedItem(): FeedItem {
    const u = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
    return {
        id:    `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        user:  u.user,
        avatar: u.avatar,
        text:  MOCK_TEXTS[Math.floor(Math.random() * MOCK_TEXTS.length)],
        ts:    Date.now(),
        likes: Math.floor(Math.random() * 80),
    };
}

function timeAgo(ts: number): string {
    const secs = Math.floor((Date.now() - ts) / 1000);
    if (secs < 5)  return 'just now';
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m`;
}

function LiveFeedDemo() {
    const [feed, setFeed]               = useState<FeedItem[]>(() =>
        Array.from({ length: 4 }, generateFeedItem)
    );
    const [buffer, setBuffer]           = useState<FeedItem[]>([]);
    const [paused, setPaused]           = useState(false);
    const [tick, setTick]               = useState(0);  // force timestamp re-render

    // Simulate real-time incoming posts (like SSE)
    useEffect(() => {
        if (paused) return;
        const interval = setInterval(() => {
            const newItem = generateFeedItem();
            setBuffer(prev => [...prev, newItem]);
        }, 2500);
        return () => clearInterval(interval);
    }, [paused]);

    // Force timestamp refresh every 5s so "just now" → "5s" etc.
    useEffect(() => {
        const t = setInterval(() => setTick(n => n + 1), 5000);
        return () => clearInterval(t);
    }, []);

    const loadNewPosts = () => {
        setFeed(prev => [...buffer, ...prev].slice(0, 20));
        setBuffer([]);
    };

    const toggleLike = async (id: string) => {
        setFeed(prev => prev.map(item =>
            item.id === id
                ? { ...item, likes: item.likes + 1, optimisticLike: true }
                : item
        ));
        // Simulate server (always succeeds in this demo)
        await new Promise(r => setTimeout(r, 400));
        setFeed(prev => prev.map(item =>
            item.id === id ? { ...item, optimisticLike: false } : item
        ));
    };

    return (
        <div style={{ maxWidth: 520 }}>
            {/* New posts banner */}
            {buffer.length > 0 && (
                <div
                    onClick={loadNewPosts}
                    style={{
                        background: '#1d4ed8', color: '#fff', textAlign: 'center',
                        padding: '8px 16px', borderRadius: 8, marginBottom: 10,
                        cursor: 'pointer', fontWeight: 600, fontSize: 13,
                        animation: 'none',
                    }}
                >
                    {buffer.length} new post{buffer.length > 1 ? 's' : ''} — click to load
                </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <button
                    onClick={() => setPaused(p => !p)}
                    style={{
                        padding: '5px 12px', borderRadius: 6, border: 'none',
                        background: paused ? '#10b981' : '#6b7280',
                        color: '#fff', cursor: 'pointer', fontSize: 12,
                    }}
                >
                    {paused ? '▶ Resume feed' : '⏸ Pause feed'}
                </button>
                <span style={{ fontSize: 12, color: '#6b7280', alignSelf: 'center' }}>
                    Simulated SSE: new post every 2.5s
                </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {feed.map(item => (
                    <div key={item.id} style={{
                        background: '#1f2937', borderRadius: 8, padding: '12px 14px',
                        border: '1px solid #374151',
                    }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: '50%',
                                background: item.avatar, flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: 14, color: '#111',
                            }}>
                                {item.user[0].toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                                    <span style={{ fontWeight: 600, fontSize: 13, color: '#f9fafb' }}>
                                        @{item.user}
                                    </span>
                                    <span style={{ fontSize: 11, color: '#6b7280' }}>
                                        {timeAgo(item.ts)}
                                    </span>
                                </div>
                                <p style={{ margin: '4px 0 8px', fontSize: 13, color: '#d1d5db', lineHeight: 1.5 }}>
                                    {item.text}
                                </p>
                                <button
                                    onClick={() => toggleLike(item.id)}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: item.optimisticLike ? '#ec4899' : '#6b7280',
                                        fontSize: 12, padding: 0, display: 'flex', gap: 4, alignItems: 'center',
                                    }}
                                >
                                    ♥ {item.likes}
                                    {item.optimisticLike && (
                                        <span style={{ fontSize: 10, color: '#f59e0b' }}>saving…</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ───────────────────────────────────────────────────────────────
// SECTION WRAPPER
// ───────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: ReactNode }) {
    const [open, setOpen] = useState(true);
    return (
        <div style={{ marginBottom: 24 }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    width: '100%', textAlign: 'left', padding: '10px 14px',
                    background: '#111827', border: '1px solid #374151',
                    borderRadius: open ? '8px 8px 0 0' : 8,
                    color: '#f9fafb', cursor: 'pointer', fontSize: 14, fontWeight: 700,
                    display: 'flex', justifyContent: 'space-between',
                }}
            >
                <span>{title}</span>
                <span style={{ color: '#6b7280' }}>{open ? '▲' : '▼'}</span>
            </button>
            {open && (
                <div style={{ padding: 16, border: '1px solid #374151', borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
                    {children}
                </div>
            )}
        </div>
    );
}

// ───────────────────────────────────────────────────────────────
// DEFAULT EXPORT — MAIN DEMO
// ───────────────────────────────────────────────────────────────

export default function RealtimeFrontendDemo() {
    return (
        <div style={{
            maxWidth: 680, margin: '0 auto', padding: '32px 16px',
            fontFamily: 'system-ui, sans-serif',
            color: '#f9fafb', background: '#030712', minHeight: '100vh',
        }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>
                    React 15 — Real-Time Frontend
                </h1>
                <p style={{ color: '#6b7280', margin: 0, fontSize: 14 }}>
                    Day 25 · WebSocket · SSE · Optimistic UI · CRDT · System Design
                </p>
            </div>

            <Section title="§1 — Protocol Selection">
                <p style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.6, margin: '0 0 12px' }}>
                    Three real-time options: <strong style={{ color: '#f9fafb' }}>WebSocket</strong> (bi-directional — chat, gaming, collaboration),{' '}
                    <strong style={{ color: '#f9fafb' }}>SSE</strong> (server-push — notifications, feeds, live prices),{' '}
                    <strong style={{ color: '#f9fafb' }}>Polling</strong> (simple pull — dashboards, low-frequency status).
                    Decision flowchart: does the client need to send real-time data? Yes → WebSocket.
                    No, but server needs to push? SSE. Neither? Polling.
                </p>
                <div style={{
                    background: '#111827', borderRadius: 8, padding: 14,
                    fontFamily: 'monospace', fontSize: 12, color: '#d1d5db',
                    overflowX: 'auto',
                }}>
                    {`// Decision flowchart (code form)
function pickProtocol(needs: { clientSends: boolean; serverPushes: boolean }) {
  if (needs.clientSends)   return 'WebSocket';  // chat, collab, gaming
  if (needs.serverPushes)  return 'SSE';         // feeds, prices, logs
  return 'Polling';                              // dashboards, admin
}`}
                </div>
            </Section>

            <Section title="§2 — useWebSocket (with reconnect + queue)">
                <p style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.6, margin: '0 0 12px' }}>
                    Production WebSocket hook: auto-reconnect with exponential backoff,
                    outgoing message queue while disconnected, heartbeat ping-pong, typed discriminated union messages.
                    Hook defined above — demo below.
                </p>
                <WebSocketDemo />
            </Section>

            <Section title="§3 — SSE / useEventSource (live price ticker)">
                <p style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.6, margin: '0 0 12px' }}>
                    EventSource API handles auto-reconnect natively. Named events, Last-Event-ID resumption.
                    Real implementation: <code style={{ color: '#818cf8' }}>useEventSource('/api/prices')</code>.
                    Below: simulated with setInterval.
                </p>
                <SseDemo />
            </Section>

            <Section title="§4 — Optimistic UI (todo toggle + add)">
                <p style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.6, margin: '0 0 12px' }}>
                    Update instantly, confirm later, roll back on failure. Save the original snapshot{' '}
                    <em>before</em> applying the optimistic change — that's your undo data.
                    Toggle has 20% failure rate to demonstrate rollback.
                </p>
                <OptimisticTodoList />
            </Section>

            <Section title="§5 — Collaborative Features (presence + typing)">
                <p style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.6, margin: '0 0 12px' }}>
                    CRDT guarantees convergence without coordination. Yjs is the go-to library.
                    For most apps: presence indicators + typing indicators are enough.
                    Typing below — Alice and Bob will start typing automatically.
                </p>
                <PresenceDemo />
            </Section>

            <Section title="§6 — System Design: Twitter/X Feed">
                <TwitterFeedDesign />
            </Section>

            <Section title="§7 — System Design: Live Chat">
                <LiveChatDesign />
            </Section>

            <Section title="§8 — Interview Tips">
                <InterviewTipsDisplay />
            </Section>

            <Section title="Live Demo — Mock Real-Time Feed (SSE simulation)">
                <p style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.6, margin: '0 0 16px' }}>
                    New posts buffer in the background (like SSE). Click the banner to inject them.
                    Like buttons use optimistic updates. Pause/resume the feed stream.
                </p>
                <LiveFeedDemo />
            </Section>

            <div style={{
                marginTop: 32, padding: 16, background: '#111827',
                borderRadius: 8, border: '1px solid #374151',
            }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 14 }}>Scoring</h3>
                <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
                    0–4 correct → Re-read sections 1-3 · 5–7 → Progressing, build practice challenge 2
                    · 8–9 → Solid foundation · 10 → Ship the chat app
                </p>
            </div>
        </div>
    );
}
