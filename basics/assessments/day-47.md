# Day 47 Assessment — SSE · Long Polling · Real-time Protocol Selection

**Theme:** You are a backend architect deciding how to add real-time features to 3 different products: a live sports score app, a collaborative document editor, and an IoT sensor dashboard. Each has different constraints — you must choose the right transport for each.

---

### Q1 — SSE protocol ⭐

**Scenario:** You're adding live price updates to a stock trading dashboard. A teammate suggests using Server-Sent Events. Before you implement it, you need to understand the raw protocol so you can debug it in curl and understand what the browser receives.

**Task:** Describe the `Content-Type` header that enables SSE, the exact format of an event (data line + double newline), what the `event:` and `id:` lines add, and how the client reconnects using `Last-Event-ID`.

**Acceptance Criteria:**
- [ ] Content-Type header: `Content-Type: text/event-stream` — this tells the browser to treat the response as an SSE stream rather than a regular HTTP body
- [ ] Minimal event format: `data: {"price": 142.5}\n\n` — the `data:` prefix, the payload, and a blank line (double `\n`) which signals the event boundary
- [ ] Multi-line data: each line prefixed with `data:` — `data: line1\ndata: line2\n\n` — the browser joins them with `\n`
- [ ] `event: price-update\n` — names the event type; the browser fires `source.addEventListener('price-update', ...)` instead of `source.onmessage`
- [ ] `id: 42\n` — assigns an event ID; the browser stores this as the "last event ID" for the connection
- [ ] On reconnect: browser sends `Last-Event-ID: 42` request header — server uses this to replay missed events from event 42 onward

---

### Q2 — EventSource API ⭐

**Scenario:** The frontend team asks how to consume your SSE endpoint. They know `fetch` but have never used `EventSource`. They also notice the browser DevTools shows only 6 connections to your domain and wonder if SSE will break other requests.

**Task:** Show the `EventSource` API: construction, `onmessage`, named event listener, and `close()`. Explain the HTTP/1.1 concurrent connection limit and how HTTP/2 fixes it.

**Acceptance Criteria:**
- [ ] `const source = new EventSource('/api/stream')` — opens the SSE connection; browser automatically reconnects on disconnect
- [ ] `source.onmessage = (event) => { console.log(event.data); }` — handles unnamed events (no `event:` line in the stream)
- [ ] `source.addEventListener('price-update', (event) => { ... })` — handles named events from `event: price-update\n`
- [ ] `source.close()` — permanently closes the connection; browser will NOT reconnect after `close()` (unlike a network drop)
- [ ] HTTP/1.1 limit: browsers allow a maximum of 6 concurrent connections per domain — each open SSE stream consumes one connection permanently, which can starve other requests (e.g., image loads, API calls)
- [ ] HTTP/2 fix: HTTP/2 multiplexes all requests over a single TCP connection — SSE streams are multiplexed and do not consume separate connections, eliminating the 6-connection bottleneck

---

### Q3 — SSE vs WebSocket choice ⭐

**Scenario:** For each of three products — live sports scores, a collaborative editor, and an IoT sensor dashboard — you need to justify your protocol choice in a design document.

**Task:** Compare SSE and WebSocket across 5 criteria: directionality, browser API complexity, firewall friendliness, reconnect behavior, and caching. For each, state which wins and why.

**Acceptance Criteria:**
- [ ] Directionality: SSE is server-to-client only (unidirectional); WebSocket is bidirectional — WebSocket wins when the client needs to send data; SSE wins for pure push scenarios (sports scores, notifications)
- [ ] Browser API complexity: SSE uses the built-in `EventSource` API (no library needed, auto-reconnect built in); WebSocket requires more boilerplate (manual reconnect, message framing) — SSE wins for simplicity
- [ ] Firewall friendliness: SSE runs over standard HTTP/HTTPS (port 80/443); WebSocket requires the `ws://`/`wss://` upgrade which some corporate firewalls and proxies block — SSE wins in restricted environments
- [ ] Reconnect behavior: SSE reconnects automatically with `Last-Event-ID` (browser handles it); WebSocket requires manual reconnect logic — SSE wins for resilience out of the box
- [ ] Caching: SSE responses can be cached by HTTP intermediaries (CDNs) on a per-event basis; WebSocket cannot be cached at all — SSE has an advantage for read-heavy fan-out scenarios
- [ ] Summary: sports scores → SSE (unidirectional, firewall-safe); collaborative editor → WebSocket (bidirectional, low latency); IoT dashboard → either (SSE if client never sends, WebSocket if actuator commands are needed)

---

### Q4 — Long polling vs SSE ⭐

**Scenario:** Your company's legacy notification system uses long polling. A new hire asks how it works and whether it should be replaced with SSE. You need to explain both and make a recommendation.

**Task:** Define long polling. Explain why it is simpler to implement but less efficient than SSE. Quantify the TCP overhead difference.

**Acceptance Criteria:**
- [ ] Long polling definition: client sends an HTTP request; server holds the request open until an event is available (or a timeout occurs); server responds; client immediately sends another request — a perpetual request cycle
- [ ] Simplicity advantage: long polling uses standard HTTP request/response — any HTTP server, reverse proxy, and CDN handles it without special configuration; SSE requires `text/event-stream` handling and often proxy configuration
- [ ] Efficiency problem: each update requires 2 TCP round trips — one for the response delivering the event, one for the new request from the client; SSE delivers updates over the existing persistent connection with no new handshake
- [ ] At 1 event/second for 1,000 users: long polling generates 2,000 HTTP requests/second + 1,000 TCP handshakes/second; SSE generates 0 new connections (all 1,000 already connected)
- [ ] Latency: long polling has additional latency equal to the time for the client's new request to reach the server — under load this can be 50–200ms extra; SSE delivers immediately on the open stream
- [ ] When long polling is still valid: environments where SSE is blocked, very infrequent events (minutes apart), or when you need broad infrastructure compatibility with zero server-side changes

---

### Q5 — SSE connection tracking ⭐⭐

**Scenario:** Your notification service needs to send targeted push notifications to specific users. When a background job completes, it POSTs to `/api/notify` with `{ userId, message }` — the server must deliver this to the user's open SSE connection if they are online.

**Task:** Implement SSE connection tracking using `Map<string, Response>`. Handle the `POST /notify` route. Handle the case where the user is offline and the case where their connection dropped mid-stream.

**Acceptance Criteria:**
- [ ] Connection store: `const subscribers = new Map<string, Response>()` — key is `userId`, value is the Express `res` object
- [ ] SSE endpoint: set headers `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`; call `res.flushHeaders()` to start streaming; store `subscribers.set(userId, res)`
- [ ] `POST /notify`: `const res = subscribers.get(userId)` — if `undefined`, return `204 No Content` (user offline, message dropped or queued elsewhere)
- [ ] Write event: `res.write(`data: ${JSON.stringify({ message })}\n\n`)` — send the SSE event to the connected user
- [ ] Handle dropped connection on write: wrap in try/catch or check `res.writableEnded`; if write fails, delete from subscribers: `subscribers.delete(userId)`
- [ ] Cleanup on client disconnect: `req.on('close', () => { subscribers.delete(userId); })` — ensures the Map entry is removed when the browser closes the tab or navigates away

---

### Q6 — SSE progress stream ⭐⭐

**Scenario:** Your PDF generation endpoint takes 30 seconds. Instead of making the client poll for status, you want to stream progress events (0%...100%) over SSE and close the stream when complete.

**Task:** Implement the progress stream endpoint that sends 10 progress events and then closes the stream. Explain why the double newline `\n\n` is critical and what happens if you forget it.

**Acceptance Criteria:**
- [ ] Set headers: `res.setHeader('Content-Type', 'text/event-stream')`, `res.setHeader('Cache-Control', 'no-cache')`, then `res.flushHeaders()`
- [ ] Send 10 progress events: loop `for (let i = 1; i <= 10; i++)` with `await delay(3000)` between events; send `res.write(`data: ${JSON.stringify({ progress: i * 10 })}\n\n`)`
- [ ] Named event for type clarity: `res.write('event: progress\n')` followed by `res.write(`data: ${i * 10}\n\n`)`
- [ ] Close after completion: `res.write('event: complete\ndata: done\n\n')` then `res.end()`
- [ ] Double newline is the event boundary: SSE spec defines an event as terminated by a blank line (`\n\n`); without it, the browser buffers all received bytes indefinitely — the `onmessage` callback never fires, and the UI shows no progress
- [ ] Single `\n` vs `\n\n`: a single newline just continues the current event's data lines — only the second newline (blank line) flushes the event to the browser

---

### Q7 — Resumable SSE with event ID ⭐⭐

**Scenario:** Your live sports score app streams goal events. A user's mobile connection drops for 30 seconds. When they reconnect, they should receive the goals they missed — not just future updates.

**Task:** Show how to send `id:` with every event. On reconnect, read the `Last-Event-ID` header and replay missed events from the database. Handle the case where the last event ID is too old (events pruned).

**Acceptance Criteria:**
- [ ] Send event with ID: `res.write(`id: ${event.id}\nevent: goal\ndata: ${JSON.stringify(event)}\n\n`)`
- [ ] On reconnect: `const lastId = req.headers['last-event-id']` — this is automatically sent by the browser
- [ ] If `lastId` is present: query DB for events after that ID: `SELECT * FROM events WHERE id > $lastId ORDER BY id ASC LIMIT 100`
- [ ] Replay missed events: iterate results and write each as an SSE event before starting the live stream
- [ ] If `lastId` is too old (event pruned from DB): send a resync event: `res.write('event: resync\ndata: ' + JSON.stringify(currentState) + '\n\n')` — client should reset its local state from this snapshot
- [ ] If no `lastId`: new connection — send current state snapshot then begin live stream

---

### Q8 — SSE behind Nginx/proxy ⭐⭐

**Scenario:** Your SSE endpoint works perfectly in local development. In staging behind Nginx, events are delayed by 60 seconds — they all arrive in a burst. Then the connection closes unexpectedly after 60 seconds.

**Task:** Explain why Nginx buffers SSE by default. Show the response header fix. Show the `proxy_read_timeout` fix. Write the relevant Nginx config block.

**Acceptance Criteria:**
- [ ] Buffering problem: Nginx's `proxy_buffering on` (default) collects the upstream response body before forwarding to the client — SSE events accumulate in Nginx's buffer and are not forwarded in real time
- [ ] Header fix on the server: `res.setHeader('X-Accel-Buffering', 'no')` — Nginx respects this header and disables proxy buffering for this response specifically; no Nginx config change required
- [ ] Nginx config buffering fix: `proxy_buffering off;` in the location block — disables buffering globally for all responses on that route
- [ ] Timeout fix: `proxy_read_timeout 3600;` — default is 60s, which closes the connection if no data is received from upstream in that window; set to 1 hour (or higher) for long-lived SSE streams
- [ ] Also needed: `proxy_http_version 1.1;` and `proxy_set_header Connection '';` — required for persistent connections through Nginx to the upstream
- [ ] Full Nginx location block includes: `proxy_buffering off`, `proxy_read_timeout 3600`, `proxy_http_version 1.1`, `X-Accel-Buffering no` (or rely on response header)

---

### Q9 — SSE retry interval ⭐⭐

**Scenario:** Your service has a scheduled 10-minute maintenance window every Sunday at 2am. During the window, 50,000 SSE clients will disconnect and immediately start retrying every 3 seconds (the browser default). This generates 16,667 reconnect attempts per second the moment your server comes back up.

**Task:** Explain what the `retry:` SSE field does. Show how to use it to back off clients during a known outage. Explain when NOT to use it.

**Acceptance Criteria:**
- [ ] `retry: 5000\n\n` sent as an SSE event tells the browser to wait 5,000ms before the next reconnect attempt (overrides the browser default of ~3s)
- [ ] Send the retry directive at stream start: `res.write('retry: 30000\n\n')` — tells all clients to wait 30s before reconnecting after any disconnect (appropriate during a maintenance window)
- [ ] Maintenance window strategy: before the shutdown, send `retry: 600000\n\n` (10 minutes) then close all SSE connections — clients will wait 10 minutes before retrying, spreading load across the full reconnect window
- [ ] The `retry:` value persists: browsers remember the last `retry:` value they received from this URL and use it for all subsequent reconnects until told otherwise
- [ ] When NOT to use: during normal operation — setting a long retry interval means clients take longer to recover from a legitimate network hiccup, increasing perceived downtime; let the browser use its default 3s during normal operation
- [ ] Reset after maintenance: send `retry: 3000\n\n` as the first event after coming back up to restore normal reconnect behavior

---

### Q10 — Memory leak in SSE ⭐⭐

**Scenario:** A load test shows your SSE server's memory grows 200MB per hour under 500 concurrent connections that connect and disconnect every minute. After 6 hours, the process OOMs. A heap snapshot shows thousands of live `setInterval` handles and `Map` entries for connections that closed hours ago.

**Task:** Implement proper cleanup using `req.on('close', ...)`. Describe what happens without this cleanup for intervals and the subscribers Map.

**Acceptance Criteria:**
- [ ] Cleanup handler: `req.on('close', () => { clearInterval(interval); subscribers.delete(userId); res.end(); })` — registered immediately after the SSE headers are sent
- [ ] Interval leak: without cleanup, each disconnected client's `setInterval` (e.g., sending heartbeat comments `:\n\n`) fires forever; after 1,000 connects/disconnects, 1,000 intervals are running; each call to `res.write` on a closed response throws or silently fails but still executes the interval function
- [ ] Map leak: `subscribers` grows without bound — each disconnected client's `userId` → `res` entry persists; the `res` object holds references to the socket, headers, and request buffers — each entry is ~50–100KB; 10,000 stale entries = 500MB–1GB
- [ ] Ghost presence: if the subscribers Map is used to build presence lists, disconnected users appear as online to new joiners
- [ ] `res.end()` in the close handler: marks the response as finished — prevents further writes from throwing; safe to call even if the client already disconnected
- [ ] Verification: after fix, `subscribers.size` should plateau at the number of currently-active connections, not grow monotonically

---

### Q11 — Choosing between SSE and WebSocket ⭐⭐

**Scenario:** Your platform team is standardizing on one real-time transport. You need to classify 6 planned features and justify each choice before the architecture review.

**Task:** For each of the 6 features, state SSE or WebSocket and give a one-sentence justification: live sports scores, collaborative editing, push notifications, live chat, file upload progress, IoT sensor stream.

**Acceptance Criteria:**
- [ ] Live sports scores → SSE: data flows only from server to client (score updates); bidirectional communication is not needed; SSE is simpler and firewall-friendly
- [ ] Collaborative editing → WebSocket: clients send keystrokes and cursor positions continuously; the server must receive client operations to apply OT/CRDT — bidirectionality is essential
- [ ] Push notifications → SSE: server pushes notifications to the browser; the client never sends notification data back; SSE auto-reconnect handles mobile network switches gracefully
- [ ] Live chat → WebSocket: users send messages (client → server) and receive messages (server → client) — bidirectional; SSE would require a separate HTTP POST for every message sent (doubles request count)
- [ ] File upload progress → SSE: the server streams upload progress percentage to the client; the client is not sending data on the SSE channel (upload uses a separate multipart POST); unidirectional push is sufficient
- [ ] IoT sensor stream → SSE if read-only dashboard (sensor data → server → browser), WebSocket if the dashboard can also send commands to actuators (bidirectional); state both cases and the deciding factor

---

### Q12 — SSE horizontal scaling ⭐⭐⭐

**Scenario:** Your IoT dashboard is deployed on 3 instances. Sensor data arrives at a random instance via a webhook. Users watching the dashboard are spread across all 3 instances. An event arriving on instance 2 must reach users on instances 1 and 3.

**Task:** Describe two solutions to SSE horizontal scaling: (a) Redis pub/sub bridge, (b) polling-based fan-out. Compare their trade-offs.

**Acceptance Criteria:**
- [ ] Problem statement: SSE connections are in-process — subscribers Map on instance 2 only has users connected to instance 2; instances 1 and 3's subscribers are invisible to it
- [ ] Solution (a) Redis pub/sub: on sensor event, the receiving instance publishes to `Redis channel:sensor:{sensorId}`; all instances subscribe at startup; on message, each instance writes the SSE event to all local subscribers for that sensor — same pattern as WebSocket scaling from Day 46
- [ ] Redis pub/sub trade-offs: low latency (sub-millisecond Redis round trip), scales to many instances, but adds Redis as a required dependency; if Redis goes down, no events are delivered to any instance
- [ ] Solution (b) polling-based fan-out: a background process on each instance polls a shared Redis stream or database table every N milliseconds for new events; each instance independently delivers events to its local SSE subscribers
- [ ] Polling trade-offs: simpler to reason about (no pub/sub subscriptions to manage), naturally tolerant of Redis restarts (next poll picks up missed events), but adds latency equal to the poll interval (e.g., 500ms polling = up to 500ms extra latency); poll interval creates a trade-off between latency and DB/Redis load
- [ ] Recommendation: Redis pub/sub for low-latency requirements (<100ms); polling for eventual-consistent dashboards where 1s latency is acceptable and simplicity is valued

---

### Q13 — Named event types for protocol design ⭐⭐⭐

**Scenario:** Your IoT dashboard streams 3 different kinds of events: metric updates (temperature, humidity), system alerts (threshold exceeded), and connection status messages (reconnecting, connected). Currently all use unnamed `data:` events and the client parses a `type` field from the JSON.

**Task:** Redesign using named SSE event types. Show the server-side event emission and the client-side `addEventListener` handlers for each. Explain why named events are better than parsing a type field.

**Acceptance Criteria:**
- [ ] Server named event emission: `res.write('event: metric-update\n')` then `res.write(`data: ${JSON.stringify({ sensor, value, unit })}\n\n`)`
- [ ] Alert event: `res.write('event: alert\n')` then `res.write(`data: ${JSON.stringify({ sensorId, threshold, actual })}\n\n`)`
- [ ] Connection status event: `res.write('event: connection-status\n')` then `res.write(`data: ${JSON.stringify({ status: 'connected' })}\n\n`)`
- [ ] Client handler: `source.addEventListener('metric-update', (e) => { updateChart(JSON.parse(e.data)); })`; separate listeners for `'alert'` and `'connection-status'`
- [ ] Named events advantage 1: the browser routes events to the correct handler before the JavaScript runs — no parsing and branching required in a single `onmessage`
- [ ] Named events advantage 2: adding a new event type does not break existing handlers — old `addEventListener` calls simply never fire for the new type; with a single `onmessage` + type-field parsing, adding a new type requires updating the switch/case
- [ ] Named events advantage 3: each listener is independently removable — `source.removeEventListener('alert', handler)` removes only that handler; with `onmessage` you would need to modify the shared handler function

---

### Q14 — SSE with authentication ⭐⭐⭐

**Scenario:** Your SSE endpoint streams sensitive financial data. The frontend uses JWT Bearer tokens for all other API calls. The browser's `EventSource` API does not support setting custom `Authorization` headers, making standard Bearer auth impossible.

**Task:** Describe 3 authentication approaches for SSE: (a) token in query string, (b) cookie-based auth, (c) one-time token. State which is most secure and why.

**Acceptance Criteria:**
- [ ] Approach (a) query string: `new EventSource('/stream?token=' + jwt)` — simple but the token appears in server logs, proxy logs, browser history, and Referer headers; a log aggregation system will store thousands of valid tokens in plaintext; rated most risky
- [ ] Approach (b) cookie auth: set a `HttpOnly; Secure; SameSite=Strict` session cookie via a regular REST login endpoint; `EventSource` automatically sends cookies with the request; server validates the session cookie; no token exposed in URL
- [ ] Approach (b) trade-off: requires cookie-based auth throughout the app (or a parallel session system); `SameSite=Strict` prevents CSRF; this is the most secure approach for browser clients
- [ ] Approach (c) one-time token: client calls `POST /api/sse-token` with Bearer JWT → server issues a short-lived (30s TTL), single-use token stored in Redis → client opens `new EventSource('/stream?ot=' + oneTimeToken)` → server validates token, marks it used in Redis, then starts stream
- [ ] One-time token trade-off: token in URL is still logged, but it expires in 30s and cannot be replayed — significantly limits the attack window compared to a long-lived JWT; adds Redis dependency and an extra HTTP round trip
- [ ] Most secure ranking: (b) cookie > (c) one-time token > (a) persistent JWT in URL; if the app already uses cookie auth, (b) is zero additional complexity; if it uses JWT-only, (c) is the best available option

---

### Q15 — Polling strategy decision tree ⭐⭐⭐

**Scenario:** You are advising 4 different product teams on their real-time update strategy. Each team describes their requirements and constraints. You must recommend a transport and justify it.

**Task:** Given 4 scenarios, choose WebSocket, SSE, or polling. Justify with latency, connection overhead, and battery usage trade-offs.

**Acceptance Criteria:**
- [ ] Scenario 1 — live multiplayer game, 500ms updates, bidirectional (player inputs + server state): WebSocket; 500ms updates require low-latency persistent connection; bidirectional eliminates SSE; polling every 500ms generates 2 req/s per client — high overhead at scale; WebSocket has negligible per-frame overhead
- [ ] Scenario 2 — server-to-client notifications, updates every 5–30s, mobile app, no client→server data: SSE; unidirectional fits SSE; auto-reconnect is valuable on mobile; polling at 5s intervals means 12 requests/minute per user (high for battery); SSE keeps one persistent connection which is more battery-efficient than repeated TCP handshakes
- [ ] Scenario 3 — admin dashboard, data refreshes every 60s, internal tool, low traffic (50 users): polling (`setInterval` + `fetch`); 60s intervals mean 1 request/minute — negligible overhead; simplest implementation (no SSE/WS infrastructure); no persistent connection required; battery non-issue for desktop internal tool
- [ ] Scenario 4 — collaborative whiteboard, real-time cursor + shape sync, <100ms latency required: WebSocket; sub-100ms requirement rules out polling (latency = poll interval); requires bidirectional (cursors sent from client, shapes synced from server); WebSocket frames have ~10-byte overhead enabling high-frequency low-latency updates
- [ ] Battery usage principle: a persistent connection (SSE/WS) consumes less battery than repeated polling because TCP handshake + TLS negotiation on every poll request wakes the radio more frequently; one long-lived connection keeps the radio in a low-power connected state
- [ ] General rule: choose the least complex transport that satisfies requirements — polling for infrequent + simple, SSE for frequent server-push + unidirectional, WebSocket for bidirectional + low latency

---

## Scoring Rubric

| Score | Interpretation |
|-------|----------------|
| 0–4   | Re-study — revisit SSE protocol format, `EventSource` API, and when to use each transport |
| 5–9   | Progressing — core protocol knowledge is there; practice building SSE endpoints with cleanup and proxy configuration |
| 10–12 | Solid — ready to build production SSE features; review authentication approaches and horizontal scaling patterns |
| 13–15 | Ready to advance — strong grasp of real-time transport selection and SSE production concerns; move to Day 48 |
