// ═══════════════════════════════════════════════════════════════
// BACKEND 12: SSE · LONG POLLING · REAL-TIME PROTOCOL SELECTION  (Day 47)
// Run: npx ts-node 12-sse-realtime.ts
// ═══════════════════════════════════════════════════════════════
//
// Real-time on the web means pushing data to a client without the
// client explicitly asking for it each time.
//
// Three main strategies exist:
//
//  1. Polling       — client keeps asking
//  2. SSE           — server pushes over one persistent HTTP connection
//  3. WebSocket     — true bidirectional persistent connection
//  4. WebRTC        — peer-to-peer, browser to browser
//
// Choosing wrong causes: wasted bandwidth (over-polling), broken
// proxies (raw WebSocket), or unnecessary complexity (WebRTC for a
// simple ticker).  This file teaches you to choose correctly.

import * as http from "http";
import * as events from "events";

// ───────────────────────────────────────────────────────────────
// 1. Real-Time Protocol Landscape — Decision Matrix
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Real-Time Protocol Landscape ===");

/*
  PROTOCOL DECISION MATRIX
  ═══════════════════════════════════════════════════════════════════════════════════════
  Property            Short Poll   Long Poll    SSE              WebSocket   WebRTC
  ─────────────────── ──────────── ──────────── ──────────────── ─────────── ──────────
  Direction           Client→Srv   Client→Srv   Server→Client    Both ways   Peer-peer
                      (pulls)      (simulated   (unidirectional) (full       (browser-
                                   push)                         duplex)     browser)
  ─────────────────── ──────────── ──────────── ──────────────── ─────────── ──────────
  Protocol            HTTP         HTTP         HTTP/1.1+        WS (TCP)    UDP/TCP
  ─────────────────── ──────────── ──────────── ──────────────── ─────────── ──────────
  Connection overhead High (new    Medium (new  Low (one         Low (one    Very high
                      req each     req per      persistent)      persistent) (ICE/STUN/
                      interval)    batch)                                    TURN setup)
  ─────────────────── ──────────── ──────────── ──────────────── ─────────── ──────────
  Browser support     All          All          All modern       All modern  All modern
                                               (IE needs        browsers    browsers
                                               polyfill)
  ─────────────────── ──────────── ──────────── ──────────────── ─────────── ──────────
  Proxy / firewall    Excellent    Good         Good (plain      Problematic No server
  friendliness                                  HTTP)            (upgrade    proxy needed
                                                                 header)     once connected
  ─────────────────── ──────────── ──────────── ──────────────── ─────────── ──────────
  Server complexity   Trivial      Medium       Low-Medium       Medium-High Very High
  ─────────────────── ──────────── ──────────── ──────────────── ─────────── ──────────
  Auto-reconnect      Manual       Manual       Built-in         Manual      Built-in
  ─────────────────── ──────────── ──────────── ──────────────── ─────────── ──────────
  Typical use cases   Admin        Chat (pre-   Notifications,   Chat,       Video calls,
                      dashboards,  WebSocket),  stock tickers,   multiplayer file sharing,
                      low-freq     fallback     live logs,       games,      P2P gaming
                      updates      layer        progress bars    collab edit
  ═══════════════════════════════════════════════════════════════════════════════════════

  QUICK DECISION FLOWCHART
  ────────────────────────
  Need browser↔browser (P2P, camera/mic)?
    └─ YES → WebRTC
  Need client to also SEND data in real-time (chat, gaming)?
    └─ YES → WebSocket
  Need server to push data only (ticker, notifications, logs)?
    └─ YES → SSE
  Must work through every corporate proxy (HTTP/1.1 only)?
    └─ YES → Long Polling (with SSE as preferred fallback)
  Low frequency and simplicity is paramount?
    └─ YES → Short Polling
*/

console.log("See comment block above for the full protocol decision matrix.");
console.log("Key rule: match the protocol to the communication PATTERN, not to hype.\n");

// ───────────────────────────────────────────────────────────────
// 2. Short Polling — Simplest Approach
// ───────────────────────────────────────────────────────────────

console.log("=== 2. Short Polling ===");

/*
  SHORT POLLING
  ─────────────
  The client sends a GET request every N seconds regardless of
  whether new data exists.  The server always responds immediately.

  Flow:
    Client           Server
      │──── GET /status ──→│   t=0
      │←──── 200 data ─────│
      │   (wait 5s)        │
      │──── GET /status ──→│   t=5
      │←──── 200 data ─────│
      ...

  Pros:
    • Trivially simple to implement — no special server support
    • Stateless server — any request can hit any server instance
    • Works through every proxy/firewall (plain HTTP GET)

  Cons:
    • Wasteful — most responses contain no new data
    • Latency = up to N seconds (half N on average)
    • Hammers server under high client count (1000 clients @ 1s = 1000 req/s)

  When it's fine:
    • Update frequency is naturally low (every 30+ seconds)
    • Client count is small (internal dashboards)
    • Stale data by a few seconds is acceptable
    • Team needs the simplest possible solution
*/

// CLIENT-SIDE SIMULATION (what runs in the browser):
function simulateShortPollingClient(durationMs: number): void {
    console.log("[ShortPoll] Client starting — polling every 3 seconds");

    let pollCount = 0;
    const INTERVAL_MS = 3000;

    const intervalId = setInterval(() => {
        pollCount++;
        // In a real browser this would be:
        //   const res = await fetch('/api/status');
        //   const data = await res.json();
        const simulatedData = { timestamp: Date.now(), value: Math.random() };
        console.log(`[ShortPoll] Poll #${pollCount} — received:`, simulatedData);
    }, INTERVAL_MS);

    // Stop after durationMs for demo purposes
    setTimeout(() => {
        clearInterval(intervalId);
        console.log(`[ShortPoll] Stopped after ${pollCount} polls.\n`);
    }, durationMs);
}

// SERVER-SIDE (Express pseudo-code shown in comment — ts-node has no Express here):
/*
  app.get('/api/status', (req, res) => {
    // Respond immediately — no waiting
    const data = { timestamp: Date.now(), price: getCurrentPrice() };
    res.json(data);
  });
*/

// ───────────────────────────────────────────────────────────────
// 3. Long Polling — Simulated Push over HTTP
// ───────────────────────────────────────────────────────────────

console.log("=== 3. Long Polling ===");

/*
  LONG POLLING
  ────────────
  The client sends a request.  The server HOLDS the connection open
  (does not respond) until new data is available OR a timeout fires.
  The client immediately sends the next request after receiving a
  response.  This creates a near-real-time push illusion.

  Flow:
    Client             Server
      │──── GET /poll ──→│   t=0  (server holds open)
      │                  │   ...waiting for data...
      │←─── 200 data ────│   t=4  (event occurred)
      │──── GET /poll ──→│   t=4  (immediately re-request)
      │                  │   ...
      │←─── 204 timeout ─│   t=34 (30s server timeout — no data)
      │──── GET /poll ──→│   t=34 (re-request)

  Pros:
    • Near-real-time with plain HTTP — works through all proxies
    • No WebSocket upgrade needed — great fallback
    • Simpler client than WebSocket

  Cons:
    • One HTTP request header block (~700 bytes) per "round trip"
    • Server must track pending response objects in memory
    • Complex server state — which res is waiting for which topic?
    • Does NOT scale horizontally without a shared event bus (Redis pub/sub)
    • Cannot multiplex — one pending request per topic
*/

// SERVER IMPLEMENTATION CONCEPT (simulated with Node EventEmitter):

class LongPollServer {
    // Map of "topic" → list of pending response handlers waiting for that topic
    private waitingClients: Map<string, Array<(data: unknown) => void>> = new Map();
    private emitter: events.EventEmitter = new events.EventEmitter();

    constructor() {
        // When an event fires, flush all waiting clients for that topic
        this.emitter.on("newData", (topic: string, data: unknown) => {
            this.flushClients(topic, data);
        });
    }

    /*
      Express handler (pseudo-code):

      app.get('/poll/:topic', (req, res) => {
        const { topic } = req.params;
        const timeoutMs = 30_000;

        // Hold a reference to res — we will call it later
        const cleanup = this.registerClient(topic, (data) => {
          clearTimeout(timer);
          res.json({ data });
        });

        // Safety timeout so the connection does not hang forever
        const timer = setTimeout(() => {
          cleanup();
          res.status(204).end(); // No Content — client should re-poll
        }, timeoutMs);

        // Clean up if client disconnects early
        req.on('close', () => {
          cleanup();
          clearTimeout(timer);
        });
      });
    */

    registerClient(topic: string, callback: (data: unknown) => void): () => void {
        if (!this.waitingClients.has(topic)) {
            this.waitingClients.set(topic, []);
        }
        const list = this.waitingClients.get(topic)!;
        list.push(callback);

        // Return a cleanup function to remove this callback
        return () => {
            const idx = list.indexOf(callback);
            if (idx !== -1) list.splice(idx, 1);
        };
    }

    publishEvent(topic: string, data: unknown): void {
        this.emitter.emit("newData", topic, data);
    }

    private flushClients(topic: string, data: unknown): void {
        const list = this.waitingClients.get(topic) ?? [];
        // Respond to all waiting clients then clear the list
        const toNotify = [...list];
        this.waitingClients.set(topic, []); // reset before calling — avoid re-entrancy
        for (const cb of toNotify) {
            cb(data);
        }
    }
}

function demonstrateLongPoll(): void {
    const server = new LongPollServer();

    // Simulate 3 clients waiting on topic "prices"
    let responsesReceived = 0;
    for (let i = 1; i <= 3; i++) {
        server.registerClient("prices", (data) => {
            console.log(`[LongPoll] Client ${i} received event:`, data);
            responsesReceived++;
            if (responsesReceived === 3) console.log("[LongPoll] All clients flushed.\n");
        });
    }

    // Simulate an event firing 500ms later
    setTimeout(() => {
        console.log("[LongPoll] Server: new price event — flushing 3 waiting clients...");
        server.publishEvent("prices", { price: 183.42, symbol: "AAPL", ts: Date.now() });
    }, 500);
}

// ───────────────────────────────────────────────────────────────
// 4. Server-Sent Events (SSE) — The Right Tool for Server Push
// ───────────────────────────────────────────────────────────────

console.log("=== 4. Server-Sent Events (SSE) ===");

/*
  SERVER-SENT EVENTS (SSE)
  ────────────────────────
  SSE is a W3C standard for streaming text events from server to
  browser over a single persistent HTTP connection.

  Content-Type MUST be: text/event-stream
  The connection stays open; the server writes chunks at any time.

  EVENT FORMAT  (each field ends with \n; event ends with \n\n)
  ─────────────────────────────────────────────────────────────
    id: <string>        ← optional; stored by browser as last event ID
    event: <type>       ← optional; custom event name (default: "message")
    data: <payload>     ← required; one or more data lines
    retry: <ms>         ← optional; tells client reconnect delay

  Examples:

    // Simple message (triggers "message" event listener):
    data: hello world\n\n

    // Multi-line data (single logical event):
    data: {"part":1}\n
    data: {"part":2}\n\n

    // Named event (triggers "price" event listener):
    event: price\n
    data: {"symbol":"AAPL","value":183.42}\n\n

    // With ID for reconnect:
    id: 42\n
    event: price\n
    data: {"symbol":"AAPL","value":183.42}\n\n

    // Heartbeat comment (keeps connection alive, no browser event):
    : ping\n\n

  AUTO-RECONNECT
  ──────────────
  The browser's EventSource reconnects automatically when the
  connection drops.  It sends the Last-Event-ID header so the
  server can resume from where the client left off.

  CLIENT USAGE (browser JavaScript):
  ───────────────────────────────────
    const source = new EventSource('/events');

    // Default "message" events:
    source.onmessage = (e) => console.log(e.data);

    // Named events:
    source.addEventListener('price', (e) => {
      const { symbol, value } = JSON.parse(e.data);
      updateUI(symbol, value);
    });

    source.onerror = (e) => console.error('SSE error', e);

    // Close when done:
    source.close();

  SERVER IMPLEMENTATION (Express):
  ─────────────────────────────────
    app.get('/events', (req, res) => {
      // 1. Set SSE headers
      res.setHeader('Content-Type',  'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection',    'keep-alive');
      // Disable nginx proxy buffering (critical — see Section 5):
      res.setHeader('X-Accel-Buffering', 'no');

      // 2. Send an immediate comment to flush headers to client
      res.write(': connected\n\n');

      // 3. Register this client
      const clientId = addClient(res);

      // 4. Heartbeat — prevent proxy timeouts every 30s
      const heartbeat = setInterval(() => {
        res.write(': ping\n\n');
      }, 30_000);

      // 5. Clean up when client disconnects
      req.on('close', () => {
        clearInterval(heartbeat);
        removeClient(clientId);
      });
    });

    // Sending an event to all connected clients:
    function broadcast(event: string, data: unknown): void {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      for (const res of clients.values()) {
        res.write(payload);
      }
    }
*/

// Demonstrate SSE event format as strings (the exact bytes sent over the wire):
function demonstrateSseFormat(): void {
    console.log("[SSE] Wire-format examples for each event field:\n");

    const examples: Array<{ label: string; event: string }> = [
        {
            label: "Simple data event",
            event: "data: Hello, SSE!\n\n",
        },
        {
            label: "JSON payload",
            event: `data: ${JSON.stringify({ symbol: "AAPL", price: 183.42 })}\n\n`,
        },
        {
            label: "Named event (triggers addEventListener('price', ...))",
            event: `event: price\ndata: ${JSON.stringify({ symbol: "AAPL", price: 183.42 })}\n\n`,
        },
        {
            label: "Named event with ID (enables Last-Event-ID resume)",
            event: `id: 42\nevent: price\ndata: ${JSON.stringify({ symbol: "AAPL", price: 183.42 })}\n\n`,
        },
        {
            label: "Custom retry interval (client will wait 5s before reconnect)",
            event: "retry: 5000\n\n",
        },
        {
            label: "Heartbeat comment (no browser event — keeps connection alive)",
            event: ": ping\n\n",
        },
    ];

    for (const { label, event } of examples) {
        console.log(`  ${label}:`);
        // Show escaped version so \n is visible
        console.log(`    ${JSON.stringify(event)}\n`);
    }
}

// ───────────────────────────────────────────────────────────────
// 5. SSE Patterns — Broadcasting, Per-User, Nginx, Limits
// ───────────────────────────────────────────────────────────────

console.log("=== 5. SSE Patterns ===");

/*
  PATTERN 1 — BROADCAST TO ALL CLIENTS
  ─────────────────────────────────────
  Use a Set (or Map) of response objects.  When an event occurs,
  iterate and write to each one.

    const clients = new Set<http.ServerResponse>();

    app.get('/events', (req, res) => {
      // ... set headers ...
      clients.add(res);
      req.on('close', () => clients.delete(res));
    });

    function broadcast(event: string, data: unknown) {
      const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      for (const res of clients) {
        res.write(msg);
      }
    }


  PATTERN 2 — PER-USER SSE (user-specific events)
  ──────────────────────────────────────────────────
  Use a Map from userId → ServerResponse.  Only send events to
  the specific user who should receive them.

    const userConnections = new Map<string, http.ServerResponse>();

    app.get('/events', authenticateMiddleware, (req, res) => {
      const userId = req.user.id;
      // ... set headers ...
      userConnections.set(userId, res);

      req.on('close', () => {
        if (userConnections.get(userId) === res) {
          userConnections.delete(userId);
        }
      });
    });

    function sendToUser(userId: string, event: string, data: unknown) {
      const res = userConnections.get(userId);
      if (!res) return; // user not connected
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    }


  PATTERN 3 — SSE THROUGH NGINX (proxy buffering)
  ─────────────────────────────────────────────────
  By default, nginx buffers upstream responses.  For SSE this means
  events are held in nginx's buffer until it is full — the client
  sees them in bursts instead of as they arrive.

  Fix: disable proxy buffering for your SSE endpoint.

  nginx config:
    location /events {
      proxy_pass         http://backend;
      proxy_http_version 1.1;
      proxy_set_header   Connection '';    # keep persistent
      proxy_read_timeout 3600s;           # 1 hour — do not drop idle SSE
      proxy_buffering    off;             # CRITICAL: flush immediately
      proxy_cache        off;
    }

  Express header (alternative — nginx respects this):
    res.setHeader('X-Accel-Buffering', 'no');


  PATTERN 4 — HTTP/1.1 CONNECTION LIMIT
  ───────────────────────────────────────
  HTTP/1.1 allows max 6 connections per domain per browser.
  Each SSE EventSource uses one connection permanently.
  Open 7+ tabs and the 7th tab's SSE will be blocked.

  Solutions:
    • HTTP/2 — multiplexes all SSE streams over a single TCP
      connection, so the 6-connection limit does not apply.
      Enable TLS + HTTP/2 in nginx and the browser uses it
      automatically.
    • SharedWorker — one worker tab holds the SSE connection,
      shares data to sibling tabs via postMessage.
    • BroadcastChannel — combine with SharedWorker for fan-out.


  PATTERN 5 — HORIZONTAL SCALING
  ───────────────────────────────
  SSE connections live in one Node process.  When you scale to
  multiple servers:
    • Client A's SSE is on Server 1
    • Event fires on Server 2
    • Server 2 must notify Server 1 so it can push to Client A

  Solution: Redis Pub/Sub (or NATS, RabbitMQ)
    Server 2 → PUBLISH to Redis channel "events"
    Server 1 → SUBSCRIBE to Redis channel "events" → writes to SSE clients

  With sticky sessions (load balancer affinity) the same client
  always hits the same server — simpler but not fault-tolerant.
*/

// Simulation: broadcast SSE model using EventEmitter as stand-in for real res objects
class SseManager {
    // In real Express: Map<string, http.ServerResponse>
    private clients: Map<string, { write: (data: string) => void; id: string }> = new Map();
    private nextId = 1;

    connect(clientName: string): string {
        const id = String(this.nextId++);
        this.clients.set(id, {
            id,
            write: (data: string) => {
                process.stdout.write(`[SSE→${clientName}] ${data.replace(/\n/g, "\\n")}\n`);
            },
        });
        console.log(`[SseManager] ${clientName} connected (id=${id}). Total: ${this.clients.size}`);
        return id;
    }

    disconnect(id: string): void {
        this.clients.delete(id);
        console.log(`[SseManager] Client id=${id} disconnected. Total: ${this.clients.size}`);
    }

    broadcast(eventName: string, data: unknown, eventId?: number): void {
        const idLine    = eventId !== undefined ? `id: ${eventId}\n` : "";
        const payload   = `${idLine}event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
        for (const client of this.clients.values()) {
            client.write(payload);
        }
    }

    sendTo(clientId: string, eventName: string, data: unknown): void {
        const client = this.clients.get(clientId);
        if (!client) return;
        client.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);
    }

    heartbeat(): void {
        for (const client of this.clients.values()) {
            client.write(": ping\n\n");
        }
    }
}

function demonstrateSsePatterns(): void {
    const manager = new SseManager();

    const id1 = manager.connect("Alice");
    const id2 = manager.connect("Bob");
    const id3 = manager.connect("Carol");

    console.log("\n[SseManager] Broadcasting price update...");
    manager.broadcast("price", { symbol: "AAPL", value: 183.42 }, 1);

    console.log("\n[SseManager] Sending private message to Alice only...");
    manager.sendTo(id1, "notification", { message: "Your order was filled." });

    console.log("\n[SseManager] Heartbeat to all clients...");
    manager.heartbeat();

    console.log("\n[SseManager] Bob disconnects...");
    manager.disconnect(id2);

    console.log("\n[SseManager] Broadcasting after Bob left...");
    manager.broadcast("price", { symbol: "MSFT", value: 412.10 }, 2);

    // Clean up
    manager.disconnect(id1);
    manager.disconnect(id3);
    console.log();
}

// ───────────────────────────────────────────────────────────────
// 6. WebRTC Basics — Peer-to-Peer Overview
// ───────────────────────────────────────────────────────────────

console.log("=== 6. WebRTC Basics ===");

/*
  WEBRTC — WEB REAL-TIME COMMUNICATION
  ──────────────────────────────────────
  WebRTC is a browser API for DIRECT peer-to-peer communication
  between two browsers without the media flowing through your server.

  Use cases: video calls, screen sharing, P2P file transfer, gaming.

  KEY COMPONENTS
  ──────────────
  RTCPeerConnection   — the main object; manages the P2P session
  RTCDataChannel      — send arbitrary binary or text data P2P
  MediaStream         — camera/microphone streams
  ICE / STUN / TURN   — how peers find each other through NAT

  HOW TWO PEERS CONNECT (simplified)
  ────────────────────────────────────
  1. Peer A creates an RTCPeerConnection and a DataChannel.
  2. Peer A calls createOffer() → gets an SDP (Session Description
     Protocol) blob describing its capabilities.
  3. Peer A sends its SDP to Peer B via a "signaling channel"
     (you build this — typically a WebSocket or HTTP endpoint).
  4. Peer B receives Peer A's SDP, calls setRemoteDescription(),
     then createAnswer(), then sends its own SDP back via signaling.
  5. Both peers exchange ICE candidates (network addresses) through
     the same signaling channel.
  6. Once ICE candidates match, the P2P connection is established
     and the signaling channel is no longer needed.

  STUN vs TURN
  ─────────────
  STUN (Session Traversal Utilities for NAT):
    Free servers (e.g. stun:stun.l.google.com:19302) that tell a
    peer its public IP address.  Works for ~80% of NAT setups.

  TURN (Traversal Using Relays around NAT):
    A relay server that forwards media when P2P fails (symmetric
    NAT, strict firewalls).  Media DOES flow through your TURN
    server — bandwidth cost applies.  Needed for ~20% of real-world
    connections.  Self-host coturn or use a cloud provider.

  PSEUDO-CODE SKETCH (browser JS):
  ──────────────────────────────────
    // Peer A
    const pc = new RTCPeerConnection({ iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'turn:your-turn-server.com', username: 'u', credential: 'p' }
    ]});

    const channel = pc.createDataChannel('chat');
    channel.onmessage = (e) => console.log('received:', e.data);
    channel.onopen    = ()  => channel.send('Hello, peer!');

    pc.onicecandidate = (e) => {
      if (e.candidate) signalingSocket.send(JSON.stringify({ ice: e.candidate }));
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    signalingSocket.send(JSON.stringify({ sdp: pc.localDescription }));

    // Peer B (receives SDP from signaling):
    // await pc.setRemoteDescription(offer);
    // const answer = await pc.createAnswer();
    // await pc.setLocalDescription(answer);
    // signalingSocket.send(JSON.stringify({ sdp: answer }));

  WHEN TO USE WebRTC vs WebSocket
  ───────────────────────────────
  Use WebRTC when:
    • Media (audio/video) must flow with low latency
    • You want to avoid bandwidth cost on your server
    • P2P file transfer (no server upload/download)

  Use WebSocket when:
    • Low-latency bidirectional messaging through your server
    • You need server-side logic on every message
    • You can not set up ICE/STUN/TURN infrastructure
*/

function explainWebRtc(): void {
    const summary = {
        purpose: "P2P communication between browsers",
        keyApis: ["RTCPeerConnection", "RTCDataChannel", "MediaStream"],
        signaling: "WebSocket (your server) — only for SDP/ICE exchange, not media",
        iceServers: {
            stun: "stun:stun.l.google.com:19302 — free, finds public IP",
            turn: "turn:<your-server>:3478 — relay fallback, costs bandwidth",
        },
        flow: [
            "1. createOffer (Peer A)",
            "2. exchange SDP via signaling server",
            "3. createAnswer (Peer B)",
            "4. exchange ICE candidates via signaling server",
            "5. P2P connection established — signaling no longer needed",
        ],
    };
    console.log("[WebRTC] Overview:", JSON.stringify(summary, null, 2), "\n");
}

// ───────────────────────────────────────────────────────────────
// 7. Choosing the Right Protocol — Detailed Flowchart
// ───────────────────────────────────────────────────────────────

console.log("=== 7. Choosing the Right Protocol ===");

/*
  DECISION FLOWCHART
  ══════════════════

  START
    │
    ▼
  Does data need to flow BROWSER ↔ BROWSER without your server?
    ├── YES → WebRTC (P2P)
    │          Use: video calls, screen share, P2P file transfer
    │
    └── NO ↓

  Does the CLIENT need to send data to the server in real-time?
  (chat messages, game input, collaborative editing cursors)
    ├── YES → WebSocket
    │          Use: chat, multiplayer, collaborative tools
    │
    └── NO ↓  (server push only)

  Does it MUST work through every corporate HTTP proxy / firewall
  (including ones that block WebSocket upgrade)?
    ├── YES → Long Polling (reliable) with SSE as preferred fallback
    │          Use: behind-firewall enterprise apps
    │
    └── NO ↓

  Does the server need to push events at low latency (<1s)?
    ├── YES → SSE
    │          Use: stock tickers, live logs, notifications, progress
    │
    └── NO ↓

  Is update frequency LOW (every 30+ seconds) and simplicity key?
    └── YES → Short Polling
               Use: admin dashboards, sync checks, simple status pages


  PRACTICAL HEURISTICS
  ─────────────────────
  • If you are building a chat app        → WebSocket
  • If you are building a notification    → SSE
    bell or live activity feed
  • If you are building a progress bar    → SSE
  • If you are streaming logs in a CI UI  → SSE
  • If you are building a stock ticker    → SSE
  • If you are building a video call      → WebRTC
  • If you are syncing settings every     → Short polling
    few minutes
  • If you must support IE11 or very      → Long polling
    old browsers with no fallback
*/

type RealtimeRequirement = {
    needsPeerToPeer: boolean;
    clientSendsData: boolean;
    mustWorkThroughAllProxies: boolean;
    lowLatencyPush: boolean;
};

function chooseProtocol(req: RealtimeRequirement): string {
    if (req.needsPeerToPeer) return "WebRTC";
    if (req.clientSendsData) return "WebSocket";
    if (req.mustWorkThroughAllProxies) return "Long Polling (with SSE fallback if possible)";
    if (req.lowLatencyPush) return "SSE (Server-Sent Events)";
    return "Short Polling";
}

function demonstrateProtocolSelection(): void {
    const scenarios: Array<{ name: string; req: RealtimeRequirement }> = [
        {
            name: "Video conferencing app",
            req: { needsPeerToPeer: true, clientSendsData: true, mustWorkThroughAllProxies: false, lowLatencyPush: false },
        },
        {
            name: "Multiplayer browser game",
            req: { needsPeerToPeer: false, clientSendsData: true, mustWorkThroughAllProxies: false, lowLatencyPush: true },
        },
        {
            name: "Live stock price ticker",
            req: { needsPeerToPeer: false, clientSendsData: false, mustWorkThroughAllProxies: false, lowLatencyPush: true },
        },
        {
            name: "Enterprise report sync (must work through firewall)",
            req: { needsPeerToPeer: false, clientSendsData: false, mustWorkThroughAllProxies: true, lowLatencyPush: false },
        },
        {
            name: "Admin dashboard — checks status every 60s",
            req: { needsPeerToPeer: false, clientSendsData: false, mustWorkThroughAllProxies: false, lowLatencyPush: false },
        },
    ];

    console.log("[ProtocolSelection] Evaluating scenarios:\n");
    for (const { name, req } of scenarios) {
        console.log(`  Scenario: ${name}`);
        console.log(`  Recommended: ${chooseProtocol(req)}\n`);
    }
}

// ───────────────────────────────────────────────────────────────
// 8. Production Considerations
// ───────────────────────────────────────────────────────────────

console.log("=== 8. Production Considerations ===");

/*
  NGINX CONFIGURATION FOR SSE / WEBSOCKET
  ─────────────────────────────────────────

  For SSE:
    location /events {
      proxy_pass             http://backend:3000;
      proxy_http_version     1.1;
      proxy_set_header       Connection '';     # do not forward "Connection: keep-alive"
      proxy_read_timeout     3600s;            # hold open for up to 1 hour
      proxy_buffering        off;              # stream immediately — do not buffer
      proxy_cache            off;
      add_header             Cache-Control no-cache;
    }

  For WebSocket:
    location /ws {
      proxy_pass             http://backend:3000;
      proxy_http_version     1.1;
      proxy_set_header       Upgrade    $http_upgrade;  # required for WS handshake
      proxy_set_header       Connection "upgrade";
      proxy_read_timeout     3600s;
    }


  LOAD BALANCING WITH STICKY SESSIONS
  ─────────────────────────────────────
  SSE and WebSocket connections are stateful — they live in one
  Node process.  When you have N backend instances:

  Option A: Sticky sessions (simpler)
    nginx ip_hash or cookie-based affinity sends the same client
    to the same server.  Downside: one server dying drops all its
    connections; no failover.

    upstream backend {
      ip_hash;
      server backend1:3000;
      server backend2:3000;
    }

  Option B: Redis Pub/Sub (recommended for production)
    All servers subscribe to Redis.  Any server can publish an
    event.  Redis fans it out to all subscribers who then push
    to their local SSE clients.  No sticky sessions needed.
    Libraries: ioredis, socket.io-adapter-redis.


  FILE DESCRIPTOR LIMITS
  ───────────────────────
  Each SSE connection = one open file descriptor in Linux.
  Default ulimit is 1024 on many systems.
  Each Node process has a default limit of ~1024 FDs.
  With 1000 SSE clients you will hit this limit.

  Fix (per process):
    ulimit -n 65536      # temporary, current shell session

  Fix (permanent, /etc/security/limits.conf):
    *  soft  nofile  65536
    *  hard  nofile  65536

  Also set in systemd unit:
    [Service]
    LimitNOFILE=65536


  GRACEFUL DISCONNECT HANDLING
  ──────────────────────────────
  Clients disconnect due to: network blip, tab close, phone sleep.
  Your server MUST clean up or it leaks memory (dead res objects in
  your clients Set/Map that can never be written to).

  Pattern:
    req.on('close', () => {
      clearInterval(heartbeatInterval);
      clients.delete(clientId);
      // If per-user: userConnections.delete(userId);
    });

  Test this by:
    1. Open SSE connection in browser
    2. Close the tab
    3. Verify your clients set/map shrinks — add a /debug endpoint
       that returns clients.size


  HEARTBEAT / KEEPALIVE
  ─────────────────────
  Problem: idle SSE connections are closed by:
    • nginx (proxy_read_timeout)
    • AWS ELB (60s idle timeout by default)
    • Mobile OS (kills background sockets)

  Solution: send a comment every 25–30 seconds.
    A comment is a line starting with ':' — the browser ignores it
    but it resets the proxy idle timer.

    const heartbeat = setInterval(() => {
      res.write(': ping\n\n');
    }, 25_000);


  RESUMING AFTER RECONNECT (Last-Event-ID)
  ──────────────────────────────────────────
  1. Server assigns sequential IDs to events:
       id: 42\nevent: price\ndata: {...}\n\n

  2. Browser stores last received ID internally.

  3. On reconnect, browser sends:
       Last-Event-ID: 42

  4. Server reads the header and replays missed events:
       app.get('/events', (req, res) => {
         const lastId = Number(req.headers['last-event-id'] ?? 0);
         const missed = eventStore.filter(e => e.id > lastId);
         for (const e of missed) {
           res.write(`id: ${e.id}\ndata: ${JSON.stringify(e.data)}\n\n`);
         }
       });

  This requires an in-memory or Redis-backed event buffer.
  Keep the buffer bounded (e.g. last 1000 events) to avoid OOM.
*/

function demonstrateProductionChecklist(): void {
    const checklist = [
        { item: "nginx proxy_buffering off",                        done: "config" },
        { item: "nginx proxy_read_timeout >= 3600s",               done: "config" },
        { item: "req.on('close') cleanup handler",                  done: "code"   },
        { item: "Heartbeat comment every 25s",                      done: "code"   },
        { item: "ulimit -n 65536 on production servers",            done: "infra"  },
        { item: "Redis Pub/Sub for multi-server deployments",       done: "arch"   },
        { item: "Last-Event-ID resume logic",                       done: "code"   },
        { item: "X-Accel-Buffering: no header",                    done: "code"   },
        { item: "Bounded event replay buffer (e.g. last 1000)",     done: "code"   },
        { item: "HTTP/2 enabled in nginx (removes 6-tab limit)",    done: "config" },
    ];

    console.log("[Production] SSE deployment checklist:\n");
    for (const { item, done } of checklist) {
        console.log(`  [${done.padEnd(6)}] ${item}`);
    }
    console.log();
}

// ───────────────────────────────────────────────────────────────
// PRACTICE Q&A
// ───────────────────────────────────────────────────────────────

console.log("=== Practice Q&A ===");

/*
  Q1: What's the main advantage of SSE over WebSockets for a stock
      price ticker?

  A:  A stock ticker is UNIDIRECTIONAL — the server pushes prices,
      the client only displays them.  SSE is designed for exactly
      this pattern.  Advantages over WebSocket:
        • SSE is plain HTTP — passes through every proxy/firewall
          without a protocol upgrade handshake
        • Built-in automatic reconnect with Last-Event-ID resume
        • Simpler server-side code — no ws library, just res.write()
        • EventSource API handles reconnect automatically in browser
        • No need for bidirectional overhead (ping/pong frames)
      WebSocket would be overkill; you would add complexity without
      gaining any feature you actually need.


  Q2: A client disconnects from your SSE endpoint. How do you clean
      up server resources?

  A:  Listen for the 'close' event on the request object.  When it
      fires the TCP connection is gone:

        req.on('close', () => {
          clearInterval(heartbeatInterval);  // stop the 25s timer
          clients.delete(clientId);          // remove from broadcast set
          // Also clear any user-specific entry:
          // userConnections.delete(userId);
        });

      If you skip this, dead res objects accumulate in your clients
      Set.  Writing to them throws silently but they waste memory
      and inflate your "connected clients" metric.


  Q3: Why does SSE fail in HTTP/1.1 when you open more than 6 tabs?
      How does HTTP/2 fix this?

  A:  HTTP/1.1 allows a browser to have at most 6 TCP connections
      per domain.  Each EventSource holds one connection permanently.
      When you open the 7th tab, its EventSource cannot establish a
      new connection — it queues indefinitely (or fails).

      HTTP/2 fixes this with MULTIPLEXING: all SSE streams run as
      independent "streams" within a single TCP connection using
      stream IDs.  The 6-connection limit does not apply because you
      only need one connection regardless of how many EventSources
      are open.

      Enable HTTP/2: add TLS to nginx and use `http2` in the listen
      directive — modern browsers automatically negotiate HTTP/2 over
      HTTPS.


  Q4: You need to send a file between two browsers without going
      through your server. What technology do you use?

  A:  WebRTC with an RTCDataChannel.
      Steps:
        1. Both peers create RTCPeerConnections with STUN/TURN.
        2. Peer A creates a DataChannel:
             const ch = pc.createDataChannel('file');
        3. Exchange SDP and ICE candidates via a signaling server
           (e.g. a WebSocket endpoint on your server — only for the
           setup handshake, NOT for the file data).
        4. Once the P2P channel is open, send the file as ArrayBuffer
           chunks:
             ch.onopen = () => ch.send(fileBuffer);
        5. Peer B receives chunks in ch.onmessage and reassembles.
      The file bytes never touch your server, so there is no egress
      cost and latency is minimal (P2P).


  Q5: Your SSE events stop arriving after 60 seconds behind nginx.
      What's the fix?

  A:  The default proxy_read_timeout in nginx is 60 seconds.  When
      no data arrives for 60s, nginx closes the connection upstream,
      dropping the SSE stream.

      Two complementary fixes:

      Fix 1 — Increase the timeout in nginx config:
        location /events {
          proxy_read_timeout 3600s;   # keep open for up to 1 hour
        }

      Fix 2 — Send a heartbeat comment before the timeout fires:
        // Server-side (every 25s):
        setInterval(() => res.write(': ping\n\n'), 25_000);

      The comment resets nginx's idle timer.  Use BOTH: the extended
      timeout as a safety net and the heartbeat as the primary
      keep-alive mechanism.  Also add proxy_buffering off so nginx
      does not accumulate heartbeats before flushing them.
*/

function printPracticeQA(): void {
    console.log("[Practice] 5 questions with answers are in the block comment above this function.");
    console.log("[Practice] Topics covered:");
    const topics = [
        "SSE vs WebSocket — when SSE wins (stock ticker, unidirectional)",
        "Client disconnect cleanup — req.on('close') pattern",
        "HTTP/1.1 6-connection limit — HTTP/2 multiplexing fix",
        "P2P file transfer — WebRTC + RTCDataChannel",
        "nginx 60s timeout — proxy_read_timeout + heartbeat fix",
    ];
    for (const t of topics) console.log(`  • ${t}`);
    console.log();
}

// ───────────────────────────────────────────────────────────────
// runDemo — reference card + all demonstrations
// ───────────────────────────────────────────────────────────────

function runDemo(): void {
    console.log("\n" + "═".repeat(65));
    console.log("BACKEND 12: SSE · LONG POLLING · REAL-TIME PROTOCOL SELECTION");
    console.log("═".repeat(65) + "\n");

    // Section 2: Short polling
    simulateShortPollingClient(6500); // runs async — fires 2 polls then stops

    // Section 3: Long polling
    demonstrateLongPoll();

    // Section 4: SSE wire format
    demonstrateSseFormat();

    // Section 5: SSE patterns
    demonstrateSsePatterns();

    // Section 6: WebRTC overview
    explainWebRtc();

    // Section 7: Protocol selection
    demonstrateProtocolSelection();

    // Section 8: Production checklist
    demonstrateProductionChecklist();

    // Practice Q&A index
    printPracticeQA();

    // Reference card
    console.log("═".repeat(65));
    console.log("PROTOCOL REFERENCE CARD");
    console.log("═".repeat(65));
    const card = [
        ["Protocol",      "Direction",      "Transport",  "Auto-reconnect", "Best for"],
        ["─────────────", "─────────────",  "──────────", "───────────────", "────────────────────────"],
        ["Short Polling", "Client→Server",  "HTTP",       "Manual",         "Low-freq, simple needs"],
        ["Long Polling",  "Server→Client*", "HTTP",       "Manual",         "Proxy-safe push fallback"],
        ["SSE",           "Server→Client",  "HTTP",       "Built-in",       "Notifications, tickers"],
        ["WebSocket",     "Bidirectional",  "TCP (WS)",   "Manual",         "Chat, gaming, collab"],
        ["WebRTC",        "Peer-to-Peer",   "UDP/TCP",    "Built-in",       "Video/audio, P2P files"],
    ];
    for (const row of card) {
        console.log(
            row[0].padEnd(15) +
            row[1].padEnd(16) +
            row[2].padEnd(12) +
            row[3].padEnd(17) +
            row[4]
        );
    }
    console.log("\n* Long polling simulates server push; client always re-requests.");
    console.log("\nNginx keys: proxy_buffering off | proxy_read_timeout 3600s | Upgrade header for WS");
    console.log("SSE keys:   text/event-stream | res.write() | req.on('close') | : ping heartbeat");
    console.log("Scale keys: Redis Pub/Sub | sticky sessions | ulimit -n 65536 | HTTP/2 for SSE\n");
}

export default runDemo;
runDemo();
