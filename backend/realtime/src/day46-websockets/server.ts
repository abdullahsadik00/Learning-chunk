// ════════════════════════════════════════════════════════════════
// DAY 46 — WEBSOCKETS WITH ws LIBRARY
// ════════════════════════════════════════════════════════════════
//
// HTTP vs WebSocket:
//   HTTP:      client requests → server responds → connection closes
//   WebSocket: client connects → both can send any time → stays open
//
//   HTTP request lifecycle:
//     1. TCP handshake  (SYN → SYN-ACK → ACK)
//     2. TLS handshake  (if HTTPS)
//     3. HTTP request   (GET /data HTTP/1.1)
//     4. HTTP response  (200 OK + body)
//     5. Connection closes (or kept alive for next request via Connection: keep-alive)
//
//   WebSocket lifecycle:
//     1. TCP handshake
//     2. TLS handshake (if wss://)
//     3. HTTP upgrade request:
//          GET /chat HTTP/1.1
//          Upgrade: websocket
//          Connection: Upgrade
//          Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
//     4. Server replies HTTP 101 Switching Protocols
//     5. Raw TCP frames flow in BOTH directions until either side closes
//
// USE WEBSOCKETS WHEN:
//   ✅ Real-time collaboration (Google Docs, Figma live cursors)
//   ✅ Live chat / messaging (Slack, Discord)
//   ✅ Multiplayer games (position sync every 16ms)
//   ✅ Live dashboards with frequent updates (stock prices, sports scores)
//   ✅ Presence (show who's online, typing indicators)
//   ✅ Binary streaming (audio/video signaling for WebRTC)
//
// USE SSE (Server-Sent Events) INSTEAD WHEN:
//   ✅ One-directional updates FROM server only (live feeds, notifications)
//   ✅ Simpler protocol, automatic reconnect built into browser
//   ✅ You need to deliver messages over plain HTTP (no upgrade needed)
//   ❌ Client needs to send data → use HTTP POST alongside SSE
//
// USE LONG POLLING INSTEAD WHEN:
//   ✅ Infrequent updates (every 30s+) and WebSocket infra isn't available
//   ✅ Must work behind aggressive firewalls/proxies
//   ❌ Real-time critical → too much latency + overhead per reconnect
//
// USE REGULAR POLLING INSTEAD WHEN:
//   ✅ Simple implementation, updates every minute or more
//   ✅ Team unfamiliar with WebSockets, low-stakes feature
//   ❌ Anything under 10s interval → wasteful HTTP overhead
//
// ROOMS PATTERN:
//   A "room" is just a Map key → Set of WebSocket connections.
//   When a message arrives for room "chat:lobby", iterate the Set
//   and call ws.send() on each connection.
//   This is NOT built into the ws library — you implement it yourself.
//   Socket.io has rooms built in; raw ws does not.
//
// HORIZONTAL SCALING PROBLEM:
//   If you have 2 backend instances (load balanced):
//   - User A connects to instance 1
//   - User B connects to instance 2
//   - A sends a message → instance 1 handles it
//   - Instance 1 broadcasts to ITS clients → B never receives it
//
//   SOLUTION: Redis pub/sub (the adapter pattern)
//   - All instances subscribe to Redis channel "room:lobby"
//   - When instance 1 wants to broadcast to room "lobby":
//       redis.publish("room:lobby", JSON.stringify(msg))
//   - Redis delivers to ALL subscribers (all instances)
//   - Each instance sends to its local clients in that room
//   This is exactly what socket.io-redis-adapter does under the hood.
//
// WS FRAME FORMAT (simplified):
//   Each WebSocket message is wrapped in a frame:
//   [FIN bit][opcode: text/binary/ping/pong/close][mask bit][payload length][payload]
//   Clients MUST mask frames to server (security requirement).
//   Servers MUST NOT mask frames to client.
//
// ════════════════════════════════════════════════════════════════

import { WebSocket, WebSocketServer } from 'ws';
import http from 'http';
import { randomUUID } from 'crypto';

// ─── Types ───────────────────────────────────────────────────────

// All messages flowing over the wire are JSON with a discriminant "type" field.
// This is the standard discriminated union pattern for WebSocket protocols.
type ClientMessage =
  | { type: 'join';    roomId: string; username: string }
  | { type: 'message'; roomId: string; text: string }
  | { type: 'leave';   roomId: string }
  | { type: 'pong' };

type ServerMessage =
  | { type: 'joined';    roomId: string; username: string }
  | { type: 'message';   roomId: string; username: string; text: string; id: string; ts: number }
  | { type: 'left';      roomId: string; username: string }
  | { type: 'presence';  roomId: string; users: string[] }
  | { type: 'ping' }
  | { type: 'pong' }
  | { type: 'error';     message: string };

// ─── Per-connection state ─────────────────────────────────────────
// We extend the raw WebSocket with our own metadata.
// Pattern: attach a companion object to each ws instance.

interface ClientInfo {
  id: string;              // UUID assigned on connect
  username: string;        // set when they join a room
  rooms: Set<string>;      // rooms this client is in
  isAlive: boolean;        // heartbeat liveness flag
}

// WeakMap: GC-friendly — when ws is garbage-collected, the entry disappears too.
const clientMeta = new WeakMap<WebSocket, ClientInfo>();

// ─── Room management ─────────────────────────────────────────────
// Rooms: Map<roomId, Set<WebSocket>>
// Simple but powerful — no library needed.

const rooms = new Map<string, Set<WebSocket>>();

function joinRoom(roomId: string, ws: WebSocket): void {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
    console.log(`[rooms] Created room: ${roomId}`);
  }
  rooms.get(roomId)!.add(ws);

  const meta = clientMeta.get(ws);
  if (meta) meta.rooms.add(roomId);

  console.log(`[rooms] ${meta?.username ?? '?'} joined ${roomId} (${rooms.get(roomId)!.size} members)`);
}

function leaveRoom(roomId: string, ws: WebSocket): void {
  const room = rooms.get(roomId);
  if (!room) return;

  room.delete(ws);

  const meta = clientMeta.get(ws);
  if (meta) meta.rooms.delete(roomId);

  // Clean up empty rooms to avoid memory leaks in long-running servers
  if (room.size === 0) {
    rooms.delete(roomId);
    console.log(`[rooms] Deleted empty room: ${roomId}`);
  }
}

function broadcast(roomId: string, message: ServerMessage, exclude?: WebSocket): void {
  const room = rooms.get(roomId);
  if (!room) return;

  const payload = JSON.stringify(message);

  for (const client of room) {
    // READYSTATE: 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED
    // Only send to OPEN connections, and optionally exclude the sender
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

function getRoomUsers(roomId: string): string[] {
  const room = rooms.get(roomId);
  if (!room) return [];
  return [...room]
    .map(ws => clientMeta.get(ws)?.username ?? 'unknown')
    .filter(Boolean);
}

// ─── Redis pub/sub bridge (optional) ─────────────────────────────
// Shows the horizontal scaling pattern without making Redis mandatory.
// In production with multiple Node instances, import ioredis and uncomment.

/*
import Redis from 'ioredis';

const pub = new Redis({ host: 'localhost', port: 6379 });
const sub = new Redis({ host: 'localhost', port: 6379 });

// Subscribe to all chat channels
sub.psubscribe('chat:*');

// When another instance publishes a message, deliver it to our local room members
sub.on('pmessage', (_pattern: string, channel: string, rawMsg: string) => {
  const roomId = channel.replace('chat:', '');
  const message = JSON.parse(rawMsg) as ServerMessage;

  // Broadcast locally — don't re-publish (would cause infinite loop)
  const room = rooms.get(roomId);
  if (!room) return;
  const payload = JSON.stringify(message);
  for (const ws of room) {
    if (ws.readyState === WebSocket.OPEN) ws.send(payload);
  }
});

function publishToRedis(roomId: string, message: ServerMessage): void {
  pub.publish(`chat:${roomId}`, JSON.stringify(message));
}
*/

// ─── Message handler ─────────────────────────────────────────────

function handleMessage(ws: WebSocket, raw: string): void {
  let parsed: ClientMessage;

  // Always wrap JSON.parse — malformed JSON from clients is common
  try {
    parsed = JSON.parse(raw) as ClientMessage;
  } catch {
    send(ws, { type: 'error', message: 'Invalid JSON' });
    return;
  }

  const meta = clientMeta.get(ws);
  if (!meta) return;

  switch (parsed.type) {
    case 'join': {
      const { roomId, username } = parsed;
      meta.username = username;
      joinRoom(roomId, ws);

      // Confirm join to the joiner
      send(ws, { type: 'joined', roomId, username });

      // Announce presence to everyone in the room (including joiner)
      const users = getRoomUsers(roomId);
      broadcast(roomId, { type: 'presence', roomId, users });

      console.log(`[msg] JOIN  room=${roomId} user=${username} id=${meta.id}`);
      break;
    }

    case 'message': {
      const { roomId, text } = parsed;

      if (!meta.rooms.has(roomId)) {
        send(ws, { type: 'error', message: `Not in room ${roomId}` });
        return;
      }

      const msg: ServerMessage = {
        type: 'message',
        roomId,
        username: meta.username,
        text,
        id: randomUUID(),
        ts: Date.now(),
      };

      // Broadcast to room (including sender so they see their own message confirmed)
      broadcast(roomId, msg);

      // In a multi-instance setup, also publish to Redis here:
      // publishToRedis(roomId, msg);

      console.log(`[msg] CHAT  room=${roomId} from=${meta.username}: ${text.slice(0, 60)}`);
      break;
    }

    case 'leave': {
      const { roomId } = parsed;
      const username = meta.username;

      leaveRoom(roomId, ws);
      send(ws, { type: 'left', roomId, username });

      const users = getRoomUsers(roomId);
      broadcast(roomId, { type: 'presence', roomId, users });

      console.log(`[msg] LEAVE room=${roomId} user=${username}`);
      break;
    }

    case 'pong': {
      // Client replied to our heartbeat ping — mark it alive
      meta.isAlive = true;
      break;
    }

    default: {
      send(ws, { type: 'error', message: 'Unknown message type' });
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────

function send(ws: WebSocket, message: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function cleanupClient(ws: WebSocket): void {
  const meta = clientMeta.get(ws);
  if (!meta) return;

  // Leave all rooms this client was in and notify remaining members
  for (const roomId of meta.rooms) {
    leaveRoom(roomId, ws);
    const users = getRoomUsers(roomId);
    broadcast(roomId, { type: 'presence', roomId, users });
  }

  console.log(`[ws] Disconnected: id=${meta.id} user=${meta.username} (${wss.clients.size - 1} remaining)`);
}

// ─── WebSocket server ─────────────────────────────────────────────

const wss = new WebSocketServer({ port: 8080 });

console.log('[ws] WebSocket server listening on ws://localhost:8080');

wss.on('connection', (ws: WebSocket) => {
  const id = randomUUID();

  // Attach metadata to this connection
  clientMeta.set(ws, {
    id,
    username: `anon-${id.slice(0, 8)}`,
    rooms: new Set(),
    isAlive: true,
  });

  console.log(`[ws] Connected: id=${id} (${wss.clients.size} total)`);

  // ── Event: message ──────────────────────────────────────────
  ws.on('message', (data) => {
    handleMessage(ws, data.toString());
  });

  // ── Event: close ────────────────────────────────────────────
  // Fired when client disconnects (browser tab closes, network drops, etc.)
  ws.on('close', (code, reason) => {
    console.log(`[ws] Close event: code=${code} reason=${reason.toString() || 'none'}`);
    cleanupClient(ws);
  });

  // ── Event: error ────────────────────────────────────────────
  // IMPORTANT: always attach an error handler or unhandled errors crash the process
  ws.on('error', (err) => {
    console.error(`[ws] Error on ${id}:`, err.message);
    // ws will emit 'close' after 'error', so cleanup happens there
  });

  // Send a welcome message immediately on connect
  send(ws, { type: 'pong' }); // reuse pong as ack — or define a 'connected' type
});

// ─── Heartbeat: detect stale connections ─────────────────────────
// PROBLEM: If a client drops without sending a close frame (network cable
// unplugged, phone dies), the server still thinks the connection is open.
// TCP keepalives help but take 2 hours by default.
//
// SOLUTION: Application-level heartbeat
// Every 30s: send ping to all clients, set isAlive = false
// If client replies pong (message type 'pong'): set isAlive = true
// After 10s grace period (next interval): if still false, terminate

const HEARTBEAT_INTERVAL_MS = 30_000;

const heartbeatTimer = setInterval(() => {
  for (const ws of wss.clients) {
    const meta = clientMeta.get(ws);
    if (!meta) continue;

    if (!meta.isAlive) {
      // No pong since last ping — connection is stale
      console.log(`[heartbeat] Terminating stale connection: ${meta.id}`);
      ws.terminate(); // forcibly close — emits 'close' event
      continue;
    }

    // Mark as dead; will be set back to true when pong arrives
    meta.isAlive = false;
    send(ws, { type: 'ping' });
  }
}, HEARTBEAT_INTERVAL_MS);

// Clean up the interval when the server closes
wss.on('close', () => {
  clearInterval(heartbeatTimer);
});

// ─── HTTP stats server ────────────────────────────────────────────
// A lightweight HTTP server alongside the WebSocket server.
// Useful for: health checks, metrics scraping, admin dashboards.

const statsServer = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/stats') {
    const stats = {
      connections: wss.clients.size,
      rooms: [...rooms.entries()].map(([id, members]) => ({
        id,
        members: members.size,
        users: getRoomUsers(id),
      })),
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(stats, null, 2));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

statsServer.listen(3001, () => {
  console.log('[http] Stats server at http://localhost:3001/stats');
});

// ─── Graceful shutdown ────────────────────────────────────────────
// IMPORTANT: Always handle SIGTERM in production (Docker stop, Kubernetes pod eviction)
// Without this, connections are abruptly killed and clients get ugly disconnect errors.

process.on('SIGTERM', () => {
  console.log('[shutdown] SIGTERM received, closing gracefully...');

  clearInterval(heartbeatTimer);

  // Notify all clients that the server is shutting down
  for (const ws of wss.clients) {
    send(ws, { type: 'error', message: 'Server shutting down' });
    ws.close(1001, 'Server shutting down'); // 1001 = Going Away
  }

  wss.close(() => {
    statsServer.close(() => {
      console.log('[shutdown] All connections closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => process.emit('SIGTERM' as NodeJS.Signals));
