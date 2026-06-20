type Handler<T = unknown> = (data: T) => void;

interface WSOptions {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export class WebSocketClient {
  private socket: WebSocket | null = null;
  private reconnectCount = 0;
  private messageQueue: string[] = [];
  private subscriptions = new Map<string, Set<Handler>>();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;

  constructor(
    private url: string,
    private options: WSOptions = {}
  ) {}

  connect(): void {
    this.shouldReconnect = true;
    this.createSocket();
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.clearHeartbeat();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.socket?.close();
    this.socket = null;
  }

  send<T>(type: string, payload: T): void {
    const msg = JSON.stringify({ type, payload });
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(msg);
    } else {
      this.messageQueue.push(msg);
    }
  }

  subscribe<T>(event: string, handler: Handler<T>): () => void {
    if (!this.subscriptions.has(event)) this.subscriptions.set(event, new Set());
    this.subscriptions.get(event)!.add(handler as Handler);
    return () => this.subscriptions.get(event)?.delete(handler as Handler);
  }

  get isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  private createSocket(): void {
    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        this.reconnectCount = 0;
        this.drainQueue();
        this.startHeartbeat();
        this.emit('connect', null);
      };

      this.socket.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data as string) as { type: string; payload: unknown };
          this.emit(msg.type, msg.payload);
        } catch {
          // ignore malformed messages
        }
      };

      this.socket.onclose = () => {
        this.clearHeartbeat();
        this.emit('disconnect', null);
        if (this.shouldReconnect) this.scheduleReconnect();
      };

      this.socket.onerror = (e) => this.emit('error', e);
    } catch {
      if (this.shouldReconnect) this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    const max = this.options.maxReconnectAttempts ?? 10;
    if (this.reconnectCount >= max) return;
    const delay =
      Math.min(
        (this.options.reconnectInterval ?? 1000) * Math.pow(2, this.reconnectCount),
        30_000
      ) + Math.random() * 1000; // jitter
    this.reconnectCount++;
    this.reconnectTimer = setTimeout(() => this.createSocket(), delay);
  }

  private startHeartbeat(): void {
    const interval = this.options.heartbeatInterval ?? 30_000;
    this.heartbeatTimer = setInterval(() => this.send('ping', null), interval);
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private drainQueue(): void {
    while (this.messageQueue.length && this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(this.messageQueue.shift()!);
    }
  }

  private emit(event: string, data: unknown): void {
    this.subscriptions.get(event)?.forEach(h => h(data));
  }
}
