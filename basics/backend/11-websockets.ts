// ═══════════════════════════════════════════════════════════════
// BACKEND 11: WEBSOCKETS · ROOMS · PRESENCE · HORIZONTAL SCALING  (Day 46)
// Run: npx ts-node 11-websockets.ts
// ═══════════════════════════════════════════════════════════════
//
// WebSockets give you a persistent, full-duplex TCP channel between
// a browser (or any client) and a server — opened once, kept alive.
//
// WHY CARE?
//  • HTTP is request-response — the server can't push unless asked
//  • WebSockets flip the model: server and client both send freely
//  • Essential for chat, live dashboards, collaborative editing,
//    multiplayer games, trading terminals, presence indicators
//
// STACK THIS FILE TEACHES:
//  • ws        — raw WebSocket server (Node.js standard library style)
//  • socket.io — batteries-included layer: rooms, auth, Redis scaling

// ───────────────────────────────────────────────────────────────
// 1. WebSocket Protocol
// ───────────────────────────────────────────────────────────────

console.log("=== 1. WebSocket Protocol ===");

/*
  THE HTTP UPGRADE HANDSHAKE
  ───────────────────────────
  WebSocket connections START as HTTP/1.1, then upgrade.

  Client sends:
    GET /chat HTTP/1.1
    Host: example.com
    Upgrade: websocket
    Connection: Upgrade
    Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
    Sec-WebSocket-Version: 13

  Server responds (101 Switching Protocols):
    HTTP/1.1 101 Switching Protocols
    Upgrade: websocket
    Connection: Upgrade
    Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=

  After this 101, the TCP socket is handed off to the WebSocket
  protocol. HTTP is done. The connection stays open indefinitely.

  FRAMES AND OPCODES
  ──────────────────
  Data travels in frames. Each frame has an opcode:

    0x0  Continuation  — fragment of a previous message
    0x1  Text          — UTF-8 string payload
    0x2  Binary        — raw bytes (images, audio, protobuf)
    0x8  Close         — initiate graceful shutdown
    0x9  Ping          — keepalive probe from either side
    0xA  Pong          — response to a Ping

  Frames can be fragmented (large messages split across multiple frames).
  Browser WebSocket API hides fragmentation — you receive whole messages.

  ws://  vs  wss://
  ──────────────────
  ws://   Plain TCP — no TLS. Fast, insecure. Dev only.
  wss://  TLS-wrapped — same as HTTPS for WebSockets.
          Required in production and on HTTPS pages
          (mixed-content rules block ws:// from https:// pages).

  DECISION TABLE: WebSocket vs HTTP Polling vs SSE
  ─────────────────────────────────────────────────
  Technique       Direction   Latency  Overhead  Use case
  ────────────────────────────────────────────────────────────────
  HTTP Polling    C→S push    High     High       Simple, legacy browsers
  Long Polling    S→C push    Medium   Medium     Fallback where WS blocked
  SSE             S→C only    Low      Low        Unidirectional streams
                                                  (notifications, log tails)
  WebSocket       Bidirect    Lowest   Lowest     Chat, gaming, collab editing

  Choose SSE when:
    - Server-to-client only (no client uploads needed)
    - You want automatic reconnect for free
    - You need to stay within HTTP/2 (SSE multiplexes fine)
    - Simpler infrastructure (SSE is just chunked HTTP)

  Choose WebSocket when:
    - Client also sends messages frequently
    - Sub-100 ms latency matters (gaming, trading)
    - You need binary frames (audio, video signaling)
*/

// Demonstrate the protocol decision logic in typed code:
type TransportChoice = "websocket" | "sse" | "polling";

interface TransportRequirements {
  clientSendsFrequently: boolean;
  needsBidirectional: boolean;
  needsBinaryFrames: boolean;
  latencySensitive: boolean;
}

function chooseTransport(req: TransportRequirements): TransportChoice {
  if (req.needsBidirectional || req.clientSendsFrequently || req.needsBinaryFrames) {
    return "websocket";
  }
  if (req.latencySensitive) {
    return "sse"; // unidirectional but low-latency server push
  }
  return "polling"; // simplest fallback
}

console.log("Chat app transport:", chooseTransport({
  clientSendsFrequently: true,
  needsBidirectional: true,
  needsBinaryFrames: false,
  latencySensitive: true,
})); // websocket

console.log("Live log stream transport:", chooseTransport({
  clientSendsFrequently: false,
  needsBidirectional: false,
  needsBinaryFrames: false,
  latencySensitive: true,
})); // sse

// ───────────────────────────────────────────────────────────────
// 2. Raw WebSocket with the `ws` Package
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. Raw WebSocket with `ws` ===");

/*
  INSTALL:  npm install ws
            npm install --save-dev @types/ws

  The `ws` package is the de-facto raw WebSocket server for Node.js.
  It maps 1-to-1 with the WebSocket protocol — no magic on top.
  Good for: proxies, game servers, anything needing full control.
*/

// Full annotated server — shown as code, not executed (no live port):
const rawWsServerExample = `
import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

// Map to track all connected clients with metadata
const clients = new Map<WebSocket, { id: string; lastPong: number }>();

wss.on("listening", () => {
  console.log("WebSocket server listening on ws://localhost:8080");
});

wss.on("connection", (socket: WebSocket, req) => {
  const id = crypto.randomUUID();
  clients.set(socket, { id, lastPong: Date.now() });
  console.log(\`[+] Client \${id} connected. Total: \${clients.size}\`);

  // Send a welcome message to the new client only
  socket.send(JSON.stringify({ type: "welcome", id }));

  // Broadcast new join to everyone else
  broadcast({ type: "joined", id }, socket);

  // ── Receiving messages ──────────────────────────────────────
  socket.on("message", (data, isBinary) => {
    if (isBinary) {
      // Binary frame — data is a Buffer
      console.log("Binary message received, length:", (data as Buffer).length);
      return;
    }
    // Text frame — parse as JSON
    try {
      const msg = JSON.parse(data.toString());
      console.log(\`[msg] from \${id}:\`, msg);
      // Echo back with server timestamp
      socket.send(JSON.stringify({ ...msg, serverTs: Date.now() }));
    } catch {
      socket.send(JSON.stringify({ error: "Invalid JSON" }));
    }
  });

  // ── Heartbeat — detect dead connections ────────────────────
  // Browsers don't always send close frames on tab crash / network drop.
  // Ping/pong lets the server detect zombie sockets.
  socket.on("pong", () => {
    const meta = clients.get(socket);
    if (meta) meta.lastPong = Date.now();
  });

  // ── Close / error ───────────────────────────────────────────
  socket.on("close", (code, reason) => {
    clients.delete(socket);
    console.log(\`[-] Client \${id} disconnected. Code: \${code}. Reason: \${reason}\`);
    broadcast({ type: "left", id });
  });

  socket.on("error", (err) => {
    console.error(\`[err] Client \${id}:\`, err.message);
    clients.delete(socket);
  });
});

// ── Heartbeat interval — ping all clients every 30s ──────────
const HEARTBEAT_INTERVAL = 30_000;
const heartbeat = setInterval(() => {
  clients.forEach((meta, socket) => {
    // If no pong in 2 intervals, the connection is dead
    if (Date.now() - meta.lastPong > HEARTBEAT_INTERVAL * 2) {
      console.log(\`[heartbeat] Terminating zombie socket \${meta.id}\`);
      socket.terminate(); // force-close without a close frame
      clients.delete(socket);
      return;
    }
    if (socket.readyState === WebSocket.OPEN) {
      socket.ping(); // send a ping frame
    }
  });
}, HEARTBEAT_INTERVAL);

// Clean up interval when server closes
wss.on("close", () => clearInterval(heartbeat));

// ── Broadcasting helpers ──────────────────────────────────────
function broadcast(payload: object, exclude?: WebSocket): void {
  const msg = JSON.stringify(payload);
  clients.forEach((_, socket) => {
    if (socket !== exclude && socket.readyState === WebSocket.OPEN) {
      socket.send(msg);
    }
  });
}
`;

console.log("Raw ws server pattern loaded (not started — no live ports in demo).");
console.log("Key ws events: connection | message | pong | close | error");
console.log("Key ws methods: send() | ping() | terminate() | close()");

// ───────────────────────────────────────────────────────────────
// 3. Socket.io — What It Adds Over Raw ws
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. Socket.io ===");

/*
  INSTALL:  npm install socket.io         (server)
            npm install socket.io-client  (Node.js client)
  Browser client: loaded from CDN or bundled.

  WHAT SOCKET.IO ADDS OVER RAW ws
  ────────────────────────────────
  Feature               Raw ws        Socket.io
  ────────────────────────────────────────────────────────────────
  Transport fallback    No            Yes — falls back to HTTP long-polling
  Auto-reconnect        Manual        Built-in with exponential backoff
  Rooms                 Manual Map    First-class: socket.join() / io.to()
  Namespaces            No            Yes — logical partitions on same server
  Acknowledgements      No            Yes — callback-based RPC style
  Middleware (auth)     Manual        io.use() pipeline
  Event namespacing     Manual        Named events: socket.emit("chat", data)
  Broadcast helpers     Manual        socket.broadcast.emit() etc.
  Binary support        Yes           Yes (auto-detects Buffer / ArrayBuffer)
  ────────────────────────────────────────────────────────────────

  THE EMIT MATRIX (most important to memorize):
  ─────────────────────────────────────────────
  Code                              Reaches
  ──────────────────────────────────────────────────────────────
  socket.emit("ev", data)           This socket only
  socket.broadcast.emit("ev", data) Everyone EXCEPT this socket
  io.emit("ev", data)               ALL connected sockets
  io.to(room).emit("ev", data)      Everyone in room (incl. sender if joined)
  socket.to(room).emit("ev", data)  Everyone in room EXCEPT this socket
  socket.to(userId).emit("ev", data) Private message (if user joined personal room)
*/

const socketIoServerExample = `
import { Server, Socket } from "socket.io";
import { createServer } from "http";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*" },          // configure properly in production
  pingInterval: 25_000,            // how often server pings clients
  pingTimeout: 5_000,              // how long to wait for pong before disconnect
});

// ── Auth middleware ──────────────────────────────────────────────
io.use((socket, next) => {
  const token = socket.handshake.auth.token as string | undefined;
  if (!token) return next(new Error("Authentication required"));
  try {
    const user = verifyJwt(token);   // your JWT verify function
    socket.data.user = user;          // attach to socket — available everywhere
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

// ── Connection handler ───────────────────────────────────────────
io.on("connection", (socket: Socket) => {
  const user = socket.data.user as { id: string; name: string };
  console.log(\`[+] \${user.name} connected (socket: \${socket.id})\`);

  // ── Chat message ────────────────────────────────────────────
  socket.on("chat:message", (data: { room: string; text: string }) => {
    // Broadcast to everyone in room EXCEPT sender
    socket.to(data.room).emit("chat:message", {
      from: user.name,
      text: data.text,
      ts: Date.now(),
    });
  });

  // ── Acknowledgement example (RPC style) ─────────────────────
  socket.on("ping:server", (payload, ack) => {
    // ack is a callback — client receives the return value
    ack({ pong: true, serverTime: Date.now(), payload });
  });

  socket.on("disconnect", (reason) => {
    console.log(\`[-] \${user.name} disconnected: \${reason}\`);
  });
});

httpServer.listen(3000);
`;

// Emit matrix demonstration (no live server — pure logic illustration):
type EmitTarget = "self" | "broadcast" | "all" | "room-all" | "room-others" | "private";

function describeEmit(target: EmitTarget): string {
  const descriptions: Record<EmitTarget, string> = {
    "self":         "socket.emit()               → this socket only",
    "broadcast":    "socket.broadcast.emit()      → everyone except this socket",
    "all":          "io.emit()                    → ALL connected sockets",
    "room-all":     "io.to(room).emit()           → everyone in room (incl. sender if joined)",
    "room-others":  "socket.to(room).emit()       → everyone in room except this socket",
    "private":      "socket.to(userId).emit()     → one user's personal room",
  };
  return descriptions[target];
}

const targets: EmitTarget[] = ["self", "broadcast", "all", "room-all", "room-others", "private"];
console.log("\nSocket.io emit matrix:");
targets.forEach(t => console.log(" ", describeEmit(t)));

// ───────────────────────────────────────────────────────────────
// 4. Rooms
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. Rooms ===");

/*
  WHAT IS A ROOM?
  ───────────────
  A room is a named channel that sockets can join and leave.
  Socket.io maintains a Set of socket IDs per room server-side.
  Rooms are scoped to a single server instance (see §7 for multi-server).

  EVERY SOCKET AUTO-JOINS ITS OWN ROOM named socket.id.
  That is how private messaging works — emit to their socket ID room.

  ROOM API
  ────────
  socket.join("room-name")          // join
  socket.leave("room-name")         // leave
  socket.rooms                      // Set<string> of rooms this socket is in
  io.to("room-name").emit(...)      // emit to room (includes sender)
  socket.to("room-name").emit(...)  // emit to room (excludes sender)
  io.in("room-name").fetchSockets() // get all socket instances in room
  io.socketsLeave("room-name")      // force all sockets to leave a room
  io.socketsJoin("room-name")       // force all sockets to join a room
*/

const roomsExample = `
// ── Chat room pattern ────────────────────────────────────────────
socket.on("room:join", async (roomId: string) => {
  await socket.join(roomId);

  // Tell everyone already in the room that a new user arrived
  socket.to(roomId).emit("room:user-joined", {
    userId: user.id,
    name: user.name,
    ts: Date.now(),
  });

  // Send the new user the current member list
  const socketsInRoom = await io.in(roomId).fetchSockets();
  const members = socketsInRoom.map(s => s.data.user);
  socket.emit("room:member-list", members);

  console.log(\`\${user.name} joined \${roomId}. Room size: \${socketsInRoom.length}\`);
});

socket.on("room:leave", async (roomId: string) => {
  await socket.leave(roomId);
  socket.to(roomId).emit("room:user-left", { userId: user.id });
});

// ── Game lobby pattern ───────────────────────────────────────────
socket.on("game:create", async (gameId: string) => {
  await socket.join(\`game:\${gameId}\`);
  socket.emit("game:created", { gameId });
});

socket.on("game:join", async (gameId: string) => {
  const room = \`game:\${gameId}\`;
  await socket.join(room);
  const members = await io.in(room).fetchSockets();

  if (members.length >= 2) {
    // Both players present — start the game
    io.to(room).emit("game:start", { gameId, players: members.map(s => s.data.user) });
  }
});

// ── Live document editing ─────────────────────────────────────────
socket.on("doc:edit", (data: { docId: string; delta: object }) => {
  // Broadcast delta to everyone else editing the same document
  socket.to(\`doc:\${data.docId}\`).emit("doc:patch", {
    delta: data.delta,
    author: user.id,
    ts: Date.now(),
  });
});
`;

// Demonstrate room membership logic with a simple simulation:
class MockRoomManager {
  private rooms = new Map<string, Set<string>>();  // roomId → Set of socketIds
  private socketRooms = new Map<string, Set<string>>(); // socketId → Set of rooms

  join(socketId: string, roomId: string): void {
    if (!this.rooms.has(roomId)) this.rooms.set(roomId, new Set());
    if (!this.socketRooms.has(socketId)) this.socketRooms.set(socketId, new Set());
    this.rooms.get(roomId)!.add(socketId);
    this.socketRooms.get(socketId)!.add(roomId);
  }

  leave(socketId: string, roomId: string): void {
    this.rooms.get(roomId)?.delete(socketId);
    this.socketRooms.get(socketId)?.delete(roomId);
  }

  getMembersOf(roomId: string): string[] {
    return Array.from(this.rooms.get(roomId) ?? []);
  }

  getRoomsOf(socketId: string): string[] {
    return Array.from(this.socketRooms.get(socketId) ?? []);
  }
}

const roomMgr = new MockRoomManager();
roomMgr.join("socket-A", "general");
roomMgr.join("socket-B", "general");
roomMgr.join("socket-A", "dev-team");

console.log("Members of 'general':", roomMgr.getMembersOf("general")); // [socket-A, socket-B]
console.log("Rooms of socket-A:", roomMgr.getRoomsOf("socket-A"));     // [general, dev-team]
roomMgr.leave("socket-A", "general");
console.log("After leave, members of 'general':", roomMgr.getMembersOf("general")); // [socket-B]

// ───────────────────────────────────────────────────────────────
// 5. Presence System
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Presence System ===");

/*
  PRESENCE = knowing who is currently online.

  CHALLENGE: One user can have multiple connections (3 tabs, mobile + desktop).
  A single socket disconnect does NOT mean the user is offline.

  APPROACH: Track user → Set<socketId>
    - User is online if their Set is non-empty
    - User goes offline only when their last socket disconnects

  IMPLEMENTATION STRATEGIES
  ──────────────────────────

  1. In-Memory Map (single server):
       userSockets: Map<userId, Set<socketId>>
       On connect:  add socketId to user's Set; if Set size was 0, broadcast "online"
       On disconnect: remove socketId; if Set is now empty, broadcast "offline"

  2. Redis (multi-server — covered in §7):
       SADD online:{userId} {socketId}    on connect
       SREM online:{userId} {socketId}    on disconnect
       SCARD online:{userId} === 0        → user offline
       Pub/Sub presence change to all servers

  3. Heartbeat approach (for detecting stale presence):
       Client emits "heartbeat" every N seconds
       Server tracks lastSeen timestamp per user
       Background job scans for users with stale lastSeen → mark offline
*/

// Typed in-memory presence manager:
interface PresenceEntry {
  userId: string;
  name: string;
  sockets: Set<string>;
  lastSeen: number;
}

class PresenceManager {
  // userId → presence data
  private online = new Map<string, PresenceEntry>();
  private onlineChangeCallback: (userId: string, isOnline: boolean, name: string) => void;

  constructor(onChange: (userId: string, isOnline: boolean, name: string) => void) {
    this.onlineChangeCallback = onChange;
  }

  connect(socketId: string, userId: string, name: string): void {
    const wasOnline = this.online.has(userId);
    if (!wasOnline) {
      this.online.set(userId, { userId, name, sockets: new Set(), lastSeen: Date.now() });
    }
    this.online.get(userId)!.sockets.add(socketId);
    this.online.get(userId)!.lastSeen = Date.now();

    if (!wasOnline) {
      this.onlineChangeCallback(userId, true, name); // first tab — now online
    }
  }

  disconnect(socketId: string, userId: string): void {
    const entry = this.online.get(userId);
    if (!entry) return;
    entry.sockets.delete(socketId);

    if (entry.sockets.size === 0) {
      this.online.delete(userId);
      this.onlineChangeCallback(userId, false, entry.name); // last tab — now offline
    }
    // else: user still has other tabs open — stay online
  }

  heartbeat(userId: string): void {
    const entry = this.online.get(userId);
    if (entry) entry.lastSeen = Date.now();
  }

  getOnlineUsers(): Array<{ userId: string; name: string; tabCount: number }> {
    return Array.from(this.online.values()).map(e => ({
      userId: e.userId,
      name: e.name,
      tabCount: e.sockets.size,
    }));
  }

  isOnline(userId: string): boolean {
    return this.online.has(userId);
  }
}

// Simulate presence tracking:
const presence = new PresenceManager((userId, isOnline, name) => {
  console.log(`  [presence] ${name} is now ${isOnline ? "ONLINE" : "OFFLINE"}`);
});

presence.connect("sock-1", "user-A", "Alice");  // Alice opens tab 1 → ONLINE
presence.connect("sock-2", "user-A", "Alice");  // Alice opens tab 2 → still online (no event)
presence.connect("sock-3", "user-B", "Bob");    // Bob opens tab   → ONLINE
presence.disconnect("sock-1", "user-A");        // Alice closes tab 1 → still online
presence.disconnect("sock-2", "user-A");        // Alice closes tab 2 → OFFLINE
console.log("Online users:", presence.getOnlineUsers()); // Only Bob

// ───────────────────────────────────────────────────────────────
// 6. Authentication with WebSockets
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. Authentication ===");

/*
  HTTP COOKIES vs TOKEN-IN-HANDSHAKE
  ────────────────────────────────────
  Option A — Cookie-based session:
    Browser sends cookies automatically during the HTTP upgrade.
    Works if your auth is cookie-based. No extra client code.
    Problem: CSRF risk (mitigate with SameSite=Strict).

  Option B — JWT in handshake query string:
    Client: const socket = io("wss://api.example.com", {
               auth: { token: localStorage.getItem("jwt") }
            });
    Server reads: socket.handshake.auth.token
    Con: token visible in server logs if logged as URL. Use auth: {} not query: {}

  Option C — JWT as first message (after connect):
    Connect unauthenticated, client immediately emits "auth" event.
    Server stores socket in "pending" set; rejects other events until auth succeeds.
    Most flexible but requires client-side discipline.

  SOCKET.IO MIDDLEWARE (recommended pattern)
  ──────────────────────────────────────────
  io.use() runs before "connection" fires. Calling next(new Error()) rejects the
  socket entirely — the client sees a "connect_error" event.
*/

// Simulated JWT verification for demo:
interface JwtPayload { id: string; name: string; role: string }

function mockVerifyJwt(token: string): JwtPayload {
  // In reality: jwt.verify(token, process.env.JWT_SECRET)
  if (token === "valid-token") return { id: "user-1", name: "Alice", role: "user" };
  throw new Error("Invalid token");
}

// Middleware signature (Socket.io types shown as plain interfaces for ts-node):
type NextFn = (err?: Error) => void;
interface MockSocket {
  handshake: { auth: Record<string, string> };
  data: Record<string, unknown>;
  id: string;
}

function authMiddleware(socket: MockSocket, next: NextFn): void {
  const token = socket.handshake.auth["token"];
  if (!token) {
    next(new Error("Authentication required"));
    return;
  }
  try {
    const user = mockVerifyJwt(token);
    socket.data["user"] = user;  // now available in all handlers as socket.data.user
    next();
  } catch (err) {
    next(new Error("Invalid or expired token"));
  }
}

// Test the middleware:
const fakeSocket: MockSocket = {
  handshake: { auth: { token: "valid-token" } },
  data: {},
  id: "socket-xyz",
};

const errors: string[] = [];
authMiddleware(fakeSocket, (err) => {
  if (err) errors.push(err.message);
});

console.log("Auth middleware result:");
console.log("  User attached to socket:", fakeSocket.data["user"]);
console.log("  Errors:", errors.length === 0 ? "none" : errors);

const badSocket: MockSocket = {
  handshake: { auth: { token: "bad-token" } },
  data: {},
  id: "socket-bad",
};
authMiddleware(badSocket, (err) => {
  if (err) console.log("  Bad token rejected:", err.message);
});

/*
  ROLE-BASED GUARDS IN EVENT HANDLERS
  ─────────────────────────────────────
  socket.on("admin:ban-user", (targetId) => {
    const user = socket.data.user as JwtPayload;
    if (user.role !== "admin") {
      socket.emit("error", { message: "Forbidden" });
      return;
    }
    // proceed with ban
  });
*/

// ───────────────────────────────────────────────────────────────
// 7. Horizontal Scaling Problem
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. Horizontal Scaling ===");

/*
  THE PROBLEM
  ───────────
  You run 4 server instances (Node.js is single-threaded → you need multiple
  processes to use all CPU cores and handle traffic).

  Instance A has socket-1 (Alice).
  Instance B receives a message: "send a private message to Alice".
  Instance B has NO reference to Alice's socket — it lives in Instance A's memory.

  Socket.io's io.to("socket-1").emit() on Instance B → silently does nothing.

  SOLUTION 1: STICKY SESSIONS (Session Affinity)
  ───────────────────────────────────────────────
  Load balancer routes ALL connections from one IP (or session cookie) to
  the SAME backend instance. Alice always lands on Instance A.

  Pros: Simple, no extra infrastructure.
  Cons: Uneven load. Instance A crashes → all its clients lose state.
        Room membership is still siloed — Instance A's rooms ≠ Instance B's rooms.
        Doesn't solve cross-server room broadcasts.

  SOLUTION 2: REDIS ADAPTER (recommended)
  ────────────────────────────────────────
  Install: npm install @socket.io/redis-adapter   ioredis

  How it works:
    Every instance subscribes to a Redis Pub/Sub channel.
    When io.to(room).emit() is called on Instance A:
      → Instance A publishes the event to Redis
      → ALL instances receive the message from Redis
      → Each instance emits to its locally connected sockets in that room

  Result: io.emit(), io.to(room).emit(), socket.broadcast.emit() all work
  correctly across instances. Rooms are global.

  SETUP:
    import { createClient } from "ioredis";
    import { createAdapter } from "@socket.io/redis-adapter";

    const pubClient = createClient({ url: "redis://localhost:6379" });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    io.adapter(createAdapter(pubClient, subClient));
    // That's it. All io.to() calls now work across instances.

  REDIS PRESENCE (complement to adapter)
  ────────────────────────────────────────
    On connect:   SADD online:{userId} {socketId}   (TTL 60s)
    On heartbeat: EXPIRE online:{userId} 60
    On disconnect: SREM online:{userId} {socketId}
    Is online?     SCARD online:{userId} > 0

  KAFKA / NATS AS ALTERNATIVE TO REDIS
  ──────────────────────────────────────
  For very high throughput or event sourcing, you can use Kafka or NATS
  instead of Redis Pub/Sub. Same principle — shared message bus.
  socket.io adapters for both exist as community packages.
*/

// Simulate the scaling problem and solution conceptually:
interface ServerInstance {
  id: string;
  localSockets: Map<string, string>;  // socketId → userId
}

function simulateScaling(): void {
  const instanceA: ServerInstance = { id: "A", localSockets: new Map([["sock-alice", "user-alice"]]) };
  const instanceB: ServerInstance = { id: "B", localSockets: new Map([["sock-bob", "user-bob"]]) };

  // Without adapter: Instance B tries to reach Alice — fails silently
  function emitLocal(instance: ServerInstance, socketId: string, event: string): boolean {
    if (instance.localSockets.has(socketId)) {
      console.log(`  [Instance ${instance.id}] Emitting '${event}' to ${socketId} ✓`);
      return true;
    }
    console.log(`  [Instance ${instance.id}] Socket ${socketId} not found — cannot emit '${event}' ✗`);
    return false;
  }

  console.log("Without Redis adapter:");
  emitLocal(instanceB, "sock-alice", "private:message"); // fails

  // With Redis adapter: Instance B publishes, Instance A picks up and delivers
  const redisChannel: Array<{ targetSocketId: string; event: string; data: unknown }> = [];

  function emitViaRedis(
    source: ServerInstance,
    target: ServerInstance,
    socketId: string,
    event: string,
    data: unknown,
  ): void {
    // Instance B publishes to Redis
    redisChannel.push({ targetSocketId: socketId, event, data });
    console.log(`  [Instance ${source.id}] Published '${event}' to Redis channel`);

    // Instance A (and all instances) receive from Redis and deliver locally
    for (const msg of redisChannel) {
      if (target.localSockets.has(msg.targetSocketId)) {
        console.log(`  [Instance ${target.id}] Delivered '${msg.event}' to ${msg.targetSocketId} ✓`);
      }
    }
  }

  console.log("\nWith Redis adapter:");
  emitViaRedis(instanceB, instanceA, "sock-alice", "private:message", { text: "hey" });
}

simulateScaling();

// ───────────────────────────────────────────────────────────────
// 8. Practical Patterns
// ───────────────────────────────────────────────────────────────

console.log("\n=== 8. Practical Patterns ===");

/*
  PATTERN 1: PRIVATE MESSAGING
  ──────────────────────────────
  Every user joins a room named `user:{userId}` on connect.
  To send a private message: socket.to(`user:${targetUserId}`).emit(...)
  Works across multiple server instances with Redis adapter.

    socket.on("connection", () => {
      socket.join(`user:${user.id}`);  // personal room
    });

    socket.on("dm:send", ({ toUserId, text }) => {
      io.to(`user:${toUserId}`).emit("dm:receive", {
        from: user.id,
        text,
        ts: Date.now(),
      });
    });

  PATTERN 2: TYPING INDICATORS
  ──────────────────────────────
  Client emits "typing:start" when user begins typing.
  Server broadcasts to room. Client sends "typing:stop" when done.
  Problem: users forget to send stop. Solution: debounce on both sides.

    // Client-side (pseudocode):
    let typingTimer: ReturnType<typeof setTimeout>;
    input.addEventListener("input", () => {
      socket.emit("typing:start", { room: currentRoom });
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        socket.emit("typing:stop", { room: currentRoom });
      }, 2000); // auto-stop after 2s of no input
    });

    // Server-side:
    socket.on("typing:start", ({ room }) => {
      socket.to(room).emit("typing:indicator", { user: user.name, typing: true });
    });
    socket.on("typing:stop", ({ room }) => {
      socket.to(room).emit("typing:indicator", { user: user.name, typing: false });
    });

  PATTERN 3: READ RECEIPTS
  ─────────────────────────
    Client emits "message:read" with a messageId.
    Server notifies the original sender via their personal room.

    socket.on("message:read", ({ messageId, readBy }) => {
      // Find the sender of messageId from DB, then:
      io.to(`user:${senderId}`).emit("message:delivered", { messageId, readBy });
    });

  PATTERN 4: RECONNECTION HANDLING
  ──────────────────────────────────
  Socket.io auto-reconnects, but socket.id changes on reconnect.
  Client should rejoin rooms and re-emit missed state on "reconnect".

    // Client:
    socket.on("reconnect", () => {
      // Rejoin rooms
      currentRooms.forEach(room => socket.emit("room:join", room));
      // Re-authenticate if using auth: {}
      socket.auth = { token: getLatestToken() };
    });

    // Server — on connection, send missed messages:
    socket.on("room:join", async (roomId) => {
      await socket.join(roomId);
      const missed = await db.getMessagesSince(roomId, socket.handshake.auth.lastSeen);
      socket.emit("room:history", missed);
    });

  PATTERN 5: EVENT RATE LIMITING (prevent spam)
  ───────────────────────────────────────────────
  Track event timestamps per socket. Reject if too frequent.
*/

// Rate limiter implementation (pure TypeScript — no framework deps):
class WsRateLimiter {
  // socketId → Map<eventName, timestamps[]>
  private counts = new Map<string, Map<string, number[]>>();

  constructor(
    private maxEventsPerWindow: number,
    private windowMs: number,
  ) {}

  isAllowed(socketId: string, event: string): boolean {
    if (!this.counts.has(socketId)) {
      this.counts.set(socketId, new Map());
    }
    const socketMap = this.counts.get(socketId)!;
    if (!socketMap.has(event)) {
      socketMap.set(event, []);
    }

    const now = Date.now();
    const timestamps = socketMap.get(event)!;

    // Remove timestamps outside the window
    const windowStart = now - this.windowMs;
    const recent = timestamps.filter(t => t > windowStart);
    socketMap.set(event, recent);

    if (recent.length >= this.maxEventsPerWindow) {
      return false; // rate limit exceeded
    }

    recent.push(now);
    return true;
  }

  cleanup(socketId: string): void {
    this.counts.delete(socketId);
  }
}

// Test rate limiter:
const rateLimiter = new WsRateLimiter(3, 1000); // 3 events per second

console.log("Rate limiter test (3 events/sec):");
for (let i = 1; i <= 5; i++) {
  const allowed = rateLimiter.isAllowed("sock-1", "chat:message");
  console.log(`  Event ${i}: ${allowed ? "ALLOWED" : "RATE LIMITED"}`);
}

/*
  PATTERN 6: MESSAGE ORDERING GUARANTEES
  ────────────────────────────────────────
  WebSockets guarantee delivery order per connection.
  But with horizontal scaling, messages from different sockets can arrive out of order.

  Solutions:
    a) Sequence numbers: client attaches seq:N to every message.
       Recipients buffer out-of-order messages and re-emit in order.

    b) Server timestamps + client sort: store ts with every message.
       Client sorts by ts before rendering. Tolerance window: ~100ms.

    c) Vector clocks / CRDTs: for collaborative editing (complex, use a library
       like Yjs or Automerge — they handle this for you).

  PATTERN 7: NAMESPACES (Socket.io)
  ───────────────────────────────────
  Namespaces partition your Socket.io server into logical sub-applications
  over the same TCP connection:

    const chatNs  = io.of("/chat");    // chat namespace
    const gameNs  = io.of("/game");    // game namespace

    // Each namespace has its own connection handler, middleware, rooms
    chatNs.on("connection", (socket) => { ... });
    gameNs.on("connection", (socket) => { ... });

    // Client connects to a specific namespace:
    const chatSocket = io("/chat");
    const gameSocket = io("/game");

  Use namespaces to separate concerns on the same server.
  Use rooms for dynamic groups within a namespace.
*/

console.log("\nPatterns summary:");
const patterns = [
  "Private messaging  → user joins room 'user:{id}', others emit to that room",
  "Typing indicators  → debounced emit + auto-stop timer on client",
  "Read receipts      → emit to sender's personal room on message:read",
  "Reconnection       → rejoin rooms + fetch missed messages on reconnect",
  "Rate limiting      → sliding window counter per socket per event name",
  "Ordering           → sequence numbers or server timestamps + client sort",
  "Namespaces         → io.of('/chat') for logical partitions on same server",
];
patterns.forEach(p => console.log(`  • ${p}`));

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice Q&A ===");

/*
  Q: What's the difference between socket.emit(), socket.broadcast.emit(),
     and io.emit()?

  A: socket.emit("ev", data)
       → Sends ONLY to the socket that triggered the current event.
         Used to reply to the sender — e.g., "here's your ack" or "here's your data".

     socket.broadcast.emit("ev", data)
       → Sends to EVERY connected socket EXCEPT the sender.
         Used to announce something to others — e.g., "user X joined".

     io.emit("ev", data)
       → Sends to ALL connected sockets, INCLUDING the sender.
         Used for system-wide announcements — e.g., "server maintenance in 5 min".

     The room-scoped equivalents:
       io.to(room).emit()      → all in room (including sender if they're in it)
       socket.to(room).emit()  → all in room except sender
*/
console.log("Q1: socket.emit = sender only | broadcast.emit = others | io.emit = everyone");

/*
  Q: A user has 3 browser tabs open. When they disconnect one tab,
     how do you know they're fully "offline"?

  A: Track a Set<socketId> per userId (the PresenceManager above).
     On each disconnect event, remove that socketId from the user's Set.
     The user is "offline" only when the Set becomes empty (size === 0).
     Only then broadcast the "offline" presence change to other users.

     Common mistake: treating any single disconnect as "user left" —
     this gives false offline signals when a user just closes one tab.
*/
console.log("Q2: Track Set<socketId> per user. User is offline only when Set.size === 0");

/*
  Q: You have 4 server instances behind a load balancer. Server A has a
     socket. Server B gets a message to deliver to it. How does Socket.io
     handle this?

  A: With the @socket.io/redis-adapter, every instance connects to the same
     Redis Pub/Sub channel. When Server B calls io.to(socketId).emit():
       1. Server B publishes the event + socketId to the Redis channel.
       2. ALL 4 instances receive the Redis message.
       3. Server A sees the socketId in its local socket map and delivers.
       4. Servers B/C/D find no local match and ignore silently.

     Without the adapter, cross-server delivery is impossible — the event
     would be silently dropped. Sticky sessions alone don't solve room
     broadcasting (only private socket-to-socket messaging if you know
     which server a socket lives on, which you don't without extra bookkeeping).
*/
console.log("Q3: Redis adapter — every server publishes to Redis Pub/Sub, all subscribe");

/*
  Q: How do you authenticate a WebSocket connection?

  A: Preferred approach with Socket.io:
       1. Client: const socket = io(url, { auth: { token: jwt } })
          (use auth: {}, not query: {}, to avoid tokens in server logs)
       2. Server: io.use((socket, next) => {
            const token = socket.handshake.auth.token;
            try { socket.data.user = verifyJwt(token); next(); }
            catch { next(new Error("Unauthorized")); }
          });
       Calling next(err) rejects the socket before "connection" fires.

     With raw ws:
       - Read token from the upgrade request URL query string (ws://host?token=...)
         or from a custom header (some clients support custom headers).
       - Verify in the "upgrade" or "connection" event; call socket.close() to reject.

     Cookie-based sessions: cookies are sent automatically in the upgrade request
     — no extra code needed on the client. Read via socket.handshake.headers.cookie.
*/
console.log("Q4: io.use() middleware — verify JWT in handshake.auth.token, call next(err) to reject");

/*
  Q: When would you choose SSE over WebSockets?

  A: Choose SSE when:
     • Communication is server-to-client ONLY (you never need the client to push).
       Examples: live dashboard metrics, deployment log tails, news feed updates,
       stock tickers that only display data.
     • You want auto-reconnect built in (SSE reconnects automatically; WebSocket
       requires manual reconnect logic or a library like Socket.io).
     • You're working over HTTP/2 and want multiplexed streams per tab.
       WebSockets use a separate connection; SSE reuses the HTTP/2 connection.
     • Your infrastructure blocks WebSocket upgrades (some corporate proxies do).
       SSE is plain HTTP — always passes through.
     • Simpler server-side implementation: SSE is just chunked HTTP with
       Content-Type: text/event-stream — no special server module needed.

     Choose WebSocket when the client also sends data frequently,
     or when you need binary frames, sub-100 ms round-trips, or rooms/presence.
*/
console.log("Q5: SSE when server-push only, simpler infra, HTTP/2 streams. WS when bidirectional");

// ───────────────────────────────────────────────────────────────
// runDemo — Reference Card
// ───────────────────────────────────────────────────────────────

export default function runDemo(): void {
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║          BACKEND 11 — WEBSOCKETS REFERENCE CARD                     ║
╠══════════════════════════════════════════════════════════════════════╣
║  PROTOCOL                                                            ║
║  HTTP upgrade (101) → full-duplex TCP → frames with opcodes          ║
║  ws:// (dev)  |  wss:// (production, required on HTTPS)              ║
║                                                                      ║
║  TRANSPORT CHOICE                                                    ║
║  Bidirectional / binary / low-latency    → WebSocket                 ║
║  Server-push only / simpler infra        → SSE                       ║
║  Legacy / behind restrictive proxy       → Long Polling              ║
║                                                                      ║
║  EMIT MATRIX (Socket.io)                                             ║
║  socket.emit()              → sender only                            ║
║  socket.broadcast.emit()    → everyone except sender                 ║
║  io.emit()                  → everyone (including sender)            ║
║  io.to(room).emit()         → room (including sender if joined)      ║
║  socket.to(room).emit()     → room (excluding sender)                ║
║  socket.to("user:{id}").emit() → private message                    ║
║                                                                      ║
║  ROOMS                                                               ║
║  socket.join(room)  |  socket.leave(room)                            ║
║  socket.rooms → Set<string> of joined rooms                          ║
║  Every socket auto-joins room named socket.id                        ║
║                                                                      ║
║  PRESENCE                                                            ║
║  Map<userId, Set<socketId>>                                          ║
║  Online = Set non-empty  |  Offline = Set empty                      ║
║                                                                      ║
║  AUTH                                                                ║
║  io.use((socket, next) => {                                          ║
║    const token = socket.handshake.auth.token;                        ║
║    try { socket.data.user = verify(token); next(); }                 ║
║    catch { next(new Error("Unauthorized")); }                        ║
║  });                                                                 ║
║                                                                      ║
║  HORIZONTAL SCALING                                                  ║
║  Problem: Socket on Server A unreachable from Server B               ║
║  Solution: @socket.io/redis-adapter — Redis Pub/Sub across instances ║
║  io.adapter(createAdapter(pubClient, subClient));                    ║
║                                                                      ║
║  PRACTICAL PATTERNS                                                  ║
║  Private msg  → socket.join("user:{id}") on connect                 ║
║  Typing       → debounced emit + 2s auto-stop timer                 ║
║  Reconnect    → rejoin rooms + fetch missed messages                 ║
║  Rate limit   → sliding window counter per socket per event          ║
║  Namespaces   → io.of("/chat") for logical partitions                ║
║                                                                      ║
║  KEY PACKAGES                                                        ║
║  ws              — raw WebSocket server                              ║
║  socket.io       — rooms / auth / reconnect / namespaces             ║
║  @socket.io/redis-adapter — horizontal scaling via Redis Pub/Sub     ║
║  ioredis         — Redis client for Node.js                          ║
╚══════════════════════════════════════════════════════════════════════╝
`);
}

runDemo();
