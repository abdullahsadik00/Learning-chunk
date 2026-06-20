# Day 46 Assessment — WebSockets · Rooms · Presence · Horizontal Scaling

**Theme:** You are a backend engineer at a real-time collaboration startup (think Notion/Figma). Users expect to see collaborators' cursors, presence, and edits instantly. You need to build the WebSocket infrastructure.

---

### Q1 — HTTP vs WebSocket ⭐

**Scenario:** Your manager asks why you're not just using HTTP polling for the live cursor feature. You need to explain the technical trade-offs clearly.

**Task:** Describe 4 technical differences between HTTP and WebSocket: connection lifecycle, who can initiate messages, protocol overhead per message, and use of TCP. State when to choose WebSocket over long polling.

**Acceptance Criteria:**
- [ ] Connection lifecycle: HTTP closes after each request/response; WebSocket upgrades once and stays open for the session's lifetime
- [ ] Initiation: HTTP is always client-initiated (request → response); WebSocket is bidirectional — server can push data to the client at any time without a prior request
- [ ] Protocol overhead: HTTP sends full headers (hundreds of bytes) on every request; WebSocket frames have 2–14 bytes of overhead per message
- [ ] TCP: both run over TCP; WebSocket reuses the same TCP connection instead of opening a new one per message
- [ ] Choose WebSocket over long polling when: updates are frequent (sub-second), bidirectional communication is needed, or connection churn from repeated HTTP handshakes is unacceptable
- [ ] Long polling is acceptable when: updates are infrequent (several seconds apart), infrastructure blocks WebSocket upgrades, or simplicity outweighs performance

---

### Q2 — ws library basics ⭐

**Scenario:** You are starting a new Node.js WebSocket server using the `ws` library. A teammate asks what `wss.on('connection', ws => ...)` actually provides and how to broadcast a message to every connected client.

**Task:** Explain what the `ws` object in the connection callback represents. List 4 events on the `ws` object (message, close, error, ping/pong). Show how to send a message to all connected clients.

**Acceptance Criteria:**
- [ ] `ws` is the individual WebSocket connection object for that specific client — each connecting client gets its own `ws` instance
- [ ] `ws.on('message', (data) => ...)` — fires when a message is received from this client; `data` is a Buffer or string
- [ ] `ws.on('close', (code, reason) => ...)` — fires when the connection is terminated; `code` is a numeric close code (e.g. 1000 = normal)
- [ ] `ws.on('error', (err) => ...)` — fires on socket errors; must be handled or the process crashes on unhandled error events
- [ ] `ws.on('pong', () => ...)` — fires when the client responds to a ping; used for heartbeat health checks
- [ ] Broadcast to all clients: `wss.clients.forEach(client => { if (client.readyState === WebSocket.OPEN) client.send(data); })`
- [ ] `readyState === WebSocket.OPEN` check is required because `wss.clients` may include clients in CLOSING state

---

### Q3 — Message framing ⭐

**Scenario:** Your first implementation sends raw strings over WebSocket: `ws.send('user joined')`. As the feature grows, you add cursors, chat, and document edits — all over the same connection. The client handler becomes an unreadable chain of `if (message.includes(...))` checks.

**Task:** Explain why WebSocket messages need a `type` field. What happens without one. Implement a message router using switch/case on the type field.

**Acceptance Criteria:**
- [ ] A single WebSocket connection carries all message kinds — without a `type` field there is no reliable way to distinguish them on the receiver side
- [ ] Without a type field: the client must guess intent from message content using fragile string matching — breaks silently when message text changes
- [ ] All messages are JSON objects: `ws.send(JSON.stringify({ type: 'cursor', x: 100, y: 200 }))`
- [ ] On the receiver: `const msg = JSON.parse(event.data)` then route on `msg.type`
- [ ] Switch/case router: `switch(msg.type) { case 'cursor': handleCursor(msg); break; case 'chat': handleChat(msg); break; default: console.warn('unknown type', msg.type); }`
- [ ] Default case is important — silently ignoring unknown types hides protocol mismatches during development

---

### Q4 — Upgrade handshake ⭐

**Scenario:** A junior developer asks why the browser can't use `fetch()` to open a WebSocket connection and what actually happens when `new WebSocket('ws://...')` is called.

**Task:** Describe the HTTP headers the client sends to initiate a WebSocket upgrade, what the server responds with (101 Switching Protocols), and why `fetch` cannot be used for this.

**Acceptance Criteria:**
- [ ] Client sends a standard HTTP GET request with `Upgrade: websocket` and `Connection: Upgrade` headers
- [ ] Client also sends `Sec-WebSocket-Key: <base64-random>` — a random nonce used to verify the server's identity
- [ ] Client sends `Sec-WebSocket-Version: 13` — the protocol version
- [ ] Server responds with `HTTP/1.1 101 Switching Protocols` and `Upgrade: websocket` + `Connection: Upgrade` headers
- [ ] Server responds with `Sec-WebSocket-Accept: <hash>` — SHA-1 of the client's key + a fixed GUID, base64-encoded; client verifies this
- [ ] After the 101 response, the TCP connection is no longer HTTP — it speaks the WebSocket framing protocol
- [ ] `fetch` cannot be used because it models the HTTP request/response cycle and does not support the protocol switch; the browser provides a separate `WebSocket` API for this

---

### Q5 — Rooms implementation ⭐⭐

**Scenario:** Your collaboration app has thousands of documents open simultaneously. A message sent in document A must reach only users in document A, not users in document B.

**Task:** Implement `joinRoom(roomId, ws)`, `leaveRoom(roomId, ws)`, and `broadcast(roomId, message, exclude?)` using `Map<string, Set<WebSocket>>`. Explain what happens if you forget to remove a closed connection from the room.

**Acceptance Criteria:**
- [ ] Data structure: `const rooms = new Map<string, Set<WebSocket>>()`
- [ ] `joinRoom`: `if (!rooms.has(roomId)) rooms.set(roomId, new Set()); rooms.get(roomId).add(ws)`
- [ ] `leaveRoom`: `rooms.get(roomId)?.delete(ws)` — optional chaining guards against room already deleted; delete empty room to prevent Map memory leak
- [ ] `broadcast(roomId, message, exclude?)`: iterate `rooms.get(roomId)` → for each `ws` where `ws !== exclude && ws.readyState === WebSocket.OPEN` → `ws.send(JSON.stringify(message))`
- [ ] `exclude` parameter allows sender to receive their own message exclusion (common pattern: don't echo back to sender)
- [ ] Forgotten cleanup: closed connections remain in the `Set` indefinitely — `wss.clients` grows, `broadcast` attempts sends to dead sockets (silently fails or throws), and memory is never freed — a slow memory leak proportional to connection churn
- [ ] Fix: call `leaveRoom` inside `ws.on('close', ...)` handler on every connection

---

### Q6 — Presence tracking ⭐⭐

**Scenario:** Users in a shared document need to see a live list of who else is viewing. When user Alice opens the doc, Bob should immediately see Alice appear. When Alice closes her tab, Bob should see Alice disappear.

**Task:** Design a presence system: broadcast a `join` event on connection and a `leave` event on disconnect. Identify the race condition that can occur between join and leave events.

**Acceptance Criteria:**
- [ ] On connection: after auth succeeds, call `joinRoom(roomId, ws)` then `broadcast(roomId, { type: 'presence-join', userId, username }, ws)` (exclude self)
- [ ] Maintain a presence map: `const presenceMap = new Map<WebSocket, { userId, username, roomId }>()`
- [ ] On `ws.on('close')`: look up user from `presenceMap`, call `leaveRoom(roomId, ws)`, broadcast `{ type: 'presence-leave', userId }` to room, delete from `presenceMap`
- [ ] On initial join: send the new user a `presence-snapshot` event with all currently-connected users in the room (so they see existing collaborators immediately)
- [ ] Race condition: if two close events fire for the same user in rapid succession (network glitch + reconnect), a `leave` can be broadcast for a user who has already reconnected — their presence disappears from others' screens even though they are still active
- [ ] Fix for race condition: use a generation/session ID per connection; only broadcast `leave` if the closing connection's session ID matches the current active session for that userId

---

### Q7 — Heartbeat and stale connection detection ⭐⭐

**Scenario:** Mobile users who lock their phones maintain an open TCP connection until an OS-level timeout. Your server accumulates hundreds of "zombie" connections that appear open but are actually dead. Server memory grows; `broadcast` wastes cycles sending to unreachable clients.

**Task:** Explain why TCP connections can go silent without explicitly closing. Implement a heartbeat: server pings every 30s, terminates if no pong within 10s. Explain the `ws.isAlive` flag.

**Acceptance Criteria:**
- [ ] TCP connections go silent without close when: the phone sleeps (OS suspends the process), NAT tables expire the mapping (no FIN/RST sent), network interface switches (Wi-Fi to cellular), or the process is killed with SIGKILL
- [ ] `ws.isAlive = true` is set on each new connection; set to `true` again when a pong is received: `ws.on('pong', () => { ws.isAlive = true; })`
- [ ] Heartbeat interval: `setInterval(() => { wss.clients.forEach(ws => { if (!ws.isAlive) return ws.terminate(); ws.isAlive = false; ws.ping(); }); }, 30_000)`
- [ ] `ws.isAlive = false` is set just before `ws.ping()` is sent — the pong response must arrive before the next interval to keep the connection alive
- [ ] `ws.terminate()` (not `ws.close()`) forces the socket closed immediately without waiting for the client to acknowledge — correct for zombies
- [ ] The 10s window is implicitly provided by the 30s interval: `isAlive` is set to `false` at ping time; if no pong arrives before the next 30s cycle, it is still `false` → terminate

---

### Q8 — Authentication on WebSocket ⭐⭐

**Scenario:** You need to authenticate WebSocket connections. A junior engineer suggests passing the JWT in the query string: `ws://api.example.com/ws?token=eyJhb...`. The security team flags this immediately.

**Task:** Explain why tokens in query strings are dangerous. Implement the timed challenge pattern: client has 10 seconds after connecting to send `{ type: 'auth', token }`, otherwise the connection is closed.

**Acceptance Criteria:**
- [ ] Query string danger: URLs (including query strings) are written to server access logs, proxy logs, browser history, and CDN logs — the token is exposed in plaintext in multiple places the developer does not control
- [ ] Timed challenge setup: on connection, set `ws.authenticated = false` and start a 10s timer: `const authTimeout = setTimeout(() => { if (!ws.authenticated) ws.close(4001, 'auth timeout'); }, 10_000)`
- [ ] On `ws.on('message')`: parse the message; if `msg.type === 'auth'`, verify the JWT: `jwt.verify(msg.token, SECRET)` → on success set `ws.authenticated = true; ws.userId = decoded.sub; clearTimeout(authTimeout)` → send `{ type: 'auth-ok' }`
- [ ] On JWT verification failure: `ws.close(4003, 'invalid token')`
- [ ] All other message handlers must check `if (!ws.authenticated) return ws.close(4001, 'not authenticated')` at the top
- [ ] 4001/4003 are application-level close codes in the 4000–4999 range reserved for application use

---

### Q9 — Horizontal scaling problem ⭐⭐

**Scenario:** Your service is deployed across 2 server instances behind a load balancer. User A is connected to instance 1. Users B and C are connected to instance 2. When A sends a message to room "doc:123", B and C never receive it.

**Task:** Explain why B and C don't receive the message. Draw the data flow with and without a Redis pub/sub bridge.

**Acceptance Criteria:**
- [ ] Root cause: the `rooms` Map is in-process memory on each instance — instance 1's room "doc:123" has only user A; instance 2's room "doc:123" has users B and C; there is no shared state
- [ ] Without Redis: A → instance 1 → `broadcast('doc:123', msg)` → only A is in that Map → no one else receives it
- [ ] With Redis pub/sub: A → instance 1 → `publisher.publish('room:doc:123', JSON.stringify(msg))` → Redis broadcasts to all subscribers → instance 2 (subscribed to `room:*`) receives the message → instance 2 calls `broadcast('doc:123', msg)` locally → B and C receive it
- [ ] Both instances subscribe to Redis at startup; both instances publish to Redis when broadcasting
- [ ] Instance 1 also receives its own publish from Redis and broadcasts locally — this is correct; instance 1's local members (user A) receive the message via this path too (or exclude the sender by embedding senderId in the Redis message)
- [ ] This pattern ensures that no matter which instance a client connects to, they receive messages from all other instances

---

### Q10 — Redis pub/sub bridge ⭐⭐

**Scenario:** You are implementing the Redis pub/sub bridge to fix the horizontal scaling problem described in Q9. A colleague asks why you need two separate Redis connections for publish and subscribe.

**Task:** Implement the bridge: publish on broadcast, subscribe on all instances, and forward to local room members. Explain why separate Redis connections for publish and subscribe are required.

**Acceptance Criteria:**
- [ ] Two Redis clients created at startup: `const publisher = new Redis(REDIS_URL)` and `const subscriber = new Redis(REDIS_URL)`
- [ ] Subscribe at startup: `subscriber.psubscribe('room:*')` — pattern subscription catches all room channels
- [ ] On broadcast: `publisher.publish(`room:${roomId}`, JSON.stringify({ ...msg, _origin: instanceId }))` — `_origin` allows filtering self-published messages if needed
- [ ] On Redis message: `subscriber.on('pmessage', (pattern, channel, rawMsg) => { const roomId = channel.replace('room:', ''); const msg = JSON.parse(rawMsg); broadcastToLocalRoom(roomId, msg); })`
- [ ] Separate connections required: a Redis client in SUBSCRIBE mode enters a dedicated state — it can only issue SUBSCRIBE/UNSUBSCRIBE/PING commands; calling PUBLISH on the same client throws an error
- [ ] Using a single connection for both publish and subscribe is a common bug — the publish call is silently rejected or throws, breaking the bridge

---

### Q11 — Connection cleanup ⭐⭐

**Scenario:** Load testing reveals your server's memory grows 50MB every hour under sustained traffic. Heap snapshots show accumulating WebSocket objects, `userId` entries in Maps, and `setInterval` handles. The root cause is a missing cleanup handler.

**Task:** List everything that must be cleaned up inside `ws.on('close', ...)`. Describe what goes wrong for each item if you skip it.

**Acceptance Criteria:**
- [ ] Remove from room: `leaveRoom(roomId, ws)` — if skipped: `broadcast` continues sending to a dead socket (wasted cycles, potential error throws), and the room's `Set` grows unboundedly
- [ ] Remove from presence map: `presenceMap.delete(ws)` — if skipped: `presenceMap` is never freed, and stale presence data may be included in presence-snapshot events sent to new joiners, showing ghost users
- [ ] Broadcast `presence-leave` event: notify remaining room members — if skipped: other clients' UI shows the disconnected user as still active indefinitely
- [ ] Clear per-client heartbeat flags: if per-client intervals were set (e.g., per-connection ping), clear them — if skipped: intervals fire forever, may throw on `ws.ping()` to a terminated socket
- [ ] Clear auth timeout if still pending: `clearTimeout(authTimeout)` — if skipped: timeout fires after close, calls `ws.close()` on an already-closed socket (harmless but noisy error)
- [ ] Memory leak summary: each skipped cleanup means one object per disconnected client accumulates in memory — with thousands of connections per hour, this becomes gigabytes over days

---

### Q12 — Binary WebSocket messages ⭐⭐⭐

**Scenario:** Your collaboration platform adds real-time audio comments (voice notes streamed live) and a whiteboard with high-frequency position updates (60fps, Float32Array of x/y coordinates). Encoding these as JSON strings causes 3–5x size overhead.

**Task:** Explain when to use binary frames vs JSON strings. Show how to send a Buffer and detect binary vs text in the receiver. Show Float32Array usage for position updates.

**Acceptance Criteria:**
- [ ] Use binary for: raw file chunks (PDF upload in parts), audio/video streaming (PCM buffers), high-frequency numeric data (game state, cursor positions at 60fps), image pixels — any data where JSON encoding adds significant overhead or requires base64
- [ ] Use JSON text for: low-frequency control messages, presence events, chat — human-readable protocol is easier to debug and the overhead is negligible
- [ ] Send buffer: `ws.send(audioBuffer)` where `audioBuffer` is a `Buffer` or `ArrayBuffer` — `ws` library sends it as a binary frame automatically
- [ ] Float32Array for position: `const buf = Buffer.allocUnsafe(8); buf.writeFloatLE(x, 0); buf.writeFloatLE(y, 4); ws.send(buf)` — 8 bytes vs ~30 bytes for `{"x":100.5,"y":200.3}`
- [ ] Receiver detection: `ws.on('message', (data, isBinary) => { if (isBinary) { handleBinary(data); } else { handleJSON(JSON.parse(data)); } })` — the `ws` library provides `isBinary` as the second argument
- [ ] Alternative detection: `typeof data !== 'string'` or `data instanceof Buffer` — also valid

---

### Q13 — Backpressure on WebSocket ⭐⭐⭐

**Scenario:** Your whiteboard feature sends cursor updates at 60fps to all room members. Under poor network conditions some clients fall behind. The server buffers unsent messages in memory per client — heap usage spikes to 2GB on a 10-person call with slow participants.

**Task:** Explain what `ws.bufferedAmount` is. Explain why sending faster than the network can handle causes memory growth. Implement a backpressure check.

**Acceptance Criteria:**
- [ ] `ws.bufferedAmount` (in the browser WebSocket API) or `ws._socket.bufferSize` (in Node.js `ws` library): the number of bytes queued for transmission but not yet sent to the OS network buffer
- [ ] Memory growth cause: if you call `ws.send()` faster than the OS drains the socket buffer, the `ws` library queues messages in JavaScript heap memory — each `ws.send()` allocates a new buffer that waits in a linked list; with 60fps × 100 bytes × 600 seconds this is megabytes per slow client
- [ ] Backpressure check before send: `if (ws.bufferedAmount > MAX_BUFFER) { /* skip or drop this frame */ return; }`
- [ ] `MAX_BUFFER` set to a reasonable threshold: e.g., 64KB — enough for a burst, not enough to exhaust memory
- [ ] For cursor updates specifically: dropping frames is acceptable (latest position is always sufficient — no need to send every intermediate position)
- [ ] For reliable data (chat messages, document operations): don't drop — instead pause the producer or use a queue with bounded size, resuming when the drain event fires: `ws._socket.on('drain', () => resumeSending())`

---

### Q14 — Reconnection strategy ⭐⭐⭐

**Scenario:** Your deployment has a 2-minute maintenance window. When the server restarts, all 5,000 connected clients try to reconnect simultaneously. Your new server is overwhelmed with 5,000 simultaneous connection attempts and falls over within 10 seconds.

**Task:** Implement an exponential backoff reconnect on the client side (1s → 2s → 4s → max 30s). Include resending the "join room" message on reconnect. Explain why naive reconnect without backoff can DDoS your own server.

**Acceptance Criteria:**
- [ ] Exponential backoff: `let delay = 1000; const MAX_DELAY = 30_000;` — on each failed reconnect: `delay = Math.min(delay * 2, MAX_DELAY)`
- [ ] Reconnect with jitter: `setTimeout(connect, delay + Math.random() * 1000)` — jitter prevents all clients from retrying at exactly the same millisecond even with the same base delay
- [ ] On `ws.onclose`: start reconnect sequence; on `ws.onerror`: also start reconnect (errors often precede close events)
- [ ] On successful reconnect (`ws.onopen`): reset `delay = 1000`, then re-send `{ type: 'auth', token }` and `{ type: 'join', roomId }` — the new server connection has no room state from the previous session
- [ ] DDoS explanation: without backoff, all 5,000 clients retry every 1s — the server receives 5,000 TLS handshakes + auth + room joins per second from the first moment it starts; it cannot serve normal traffic and may crash again immediately; the problem is self-reinforcing
- [ ] Jitter is the key: even if all clients use exponential backoff, without jitter they synchronize their retries — jitter spreads the load over a window equal to the jitter range

---

### Q15 — WebSocket load balancing ⭐⭐⭐

**Scenario:** You configure your load balancer in round-robin mode. User Alice connects and reaches instance 1 (WebSocket established). She sends a cursor update — her HTTP request for the cursor data goes to instance 2 (round-robin) which has no WebSocket for Alice. The feature breaks.

**Task:** Explain why round-robin breaks WebSocket sessions. Provide two fixes: sticky sessions and session-token routing. Compare their trade-offs.

**Acceptance Criteria:**
- [ ] Root cause: WebSocket is a long-lived TCP connection to a specific server — all frames in that connection go to the same instance; but auxiliary REST calls from the same client may land on different instances via round-robin; those instances don't know the client's WebSocket state
- [ ] More critically: on reconnect, round-robin may route the new WebSocket to instance 2 while in-flight messages for the room on instance 1 are lost
- [ ] Fix 1 — sticky sessions (ip_hash in Nginx): `upstream ws_backend { ip_hash; server instance1:3000; server instance2:3000; }` — all requests from the same client IP go to the same backend; simple, zero app code changes
- [ ] Sticky sessions drawback: if instance 1 goes down, all its clients reconnect and are re-routed — but existing in-memory room state is lost regardless; IP hash is unstable behind a corporate NAT (all users have the same IP); adds uneven load distribution
- [ ] Fix 2 — session-token routing: client sends a `session-id` header/cookie; load balancer routes based on a hash of the session ID; more stable than IP hash, works behind NAT
- [ ] Best long-term fix: move all room state to Redis (as in Q10) so any instance can serve any client — sticky sessions become unnecessary and you get true stateless horizontal scaling

---

## Scoring Rubric

| Score | Interpretation |
|-------|----------------|
| 0–4   | Re-study — revisit WebSocket fundamentals, the `ws` library docs, and Redis pub/sub before proceeding |
| 5–9   | Progressing — core concepts understood; practice building a room server end-to-end with cleanup and heartbeat |
| 10–12 | Solid — ready to build production WebSocket features; review binary framing and backpressure for edge cases |
| 13–15 | Ready to advance — strong grasp of real-time infrastructure including scaling patterns; move to Day 47 |
