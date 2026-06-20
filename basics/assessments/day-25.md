# Day 25 Assessment — Real-Time Systems · WebSocket · SSE · CRDT · System Design Interviews

**Theme:** You are interviewing for a senior frontend role. The interviewer asks you to design four systems. Walk through each systematically, covering requirements, component architecture, state management, real-time data, and performance.

---

### Q1 — WebSocket vs SSE vs Polling ⭐

**Scenario:** You are recommending a real-time transport for three different features: (A) a live dashboard that shows server CPU metrics updated every 5 seconds, (B) a collaborative text editor where multiple users type simultaneously, (C) a flight status page that refreshes every 30 seconds.

**Task:** Compare WebSocket, SSE, and polling. Map each feature to the correct transport and justify your choice.

**Acceptance Criteria:**
- [ ] WebSocket: full-duplex, single persistent TCP connection, works for both client→server and server→client messages
- [ ] SSE (Server-Sent Events): one-way server→client stream over HTTP, auto-reconnects, native `EventSource` API, works through HTTP/2 multiplexing
- [ ] Polling: simple HTTP request on an interval, no persistent connection, scales easily but has latency equal to the poll interval
- [ ] Maps CPU metrics dashboard to SSE — server pushes updates, no client→server messages needed, auto-reconnect is a bonus
- [ ] Maps collaborative text editor to WebSocket — bidirectional: clients send edits, server broadcasts to others
- [ ] Maps flight status to polling — 30-second interval makes polling perfectly adequate; no persistent connection needed
- [ ] Notes browser support: SSE is not supported in IE11; WebSocket requires a fallback on very old browsers; polling works everywhere

---

### Q2 — CRDT Basics ⭐

**Scenario:** A collaborative document editor has two users editing the same sentence simultaneously. User A deletes the word "quick" while User B changes "quick" to "fast". With last-write-wins, one of their changes is lost. The interviewer asks how CRDTs solve this.

**Task:** Explain what problem CRDTs solve compared to last-write-wins, and describe the three mathematical guarantees that make CRDTs work.

**Acceptance Criteria:**
- [ ] Explains last-write-wins: the edit with the higher timestamp overwrites the other — one user's change is silently lost
- [ ] Explains CRDT (Conflict-free Replicated Data Type): a data structure designed so that concurrent operations can always be merged without conflicts
- [ ] Commutativity: `merge(A, B) = merge(B, A)` — the order you apply operations does not matter
- [ ] Associativity: `merge(merge(A, B), C) = merge(A, merge(B, C))` — grouping of merges does not matter
- [ ] Idempotency: `merge(A, A) = A` — applying the same operation twice has the same effect as applying it once (safe to retry)
- [ ] Explains the practical result: all replicas converge to the same state once all operations are exchanged, regardless of network delays or ordering

---

### Q3 — HLS Adaptive Bitrate Streaming ⭐

**Scenario:** The company is building a video streaming feature. A backend engineer asks what `HLS.js` does and why you can't just use a `<video src="movie.mp4">` tag.

**Task:** Explain what an HLS manifest file contains, how quality level selection works, and what `HLS.js` adds on top of native browser support.

**Acceptance Criteria:**
- [ ] Explains that HLS (HTTP Live Streaming) breaks a video into short segments (2–10 seconds each) and serves them over HTTP
- [ ] Describes the manifest (`.m3u8`): a playlist file that lists the available quality levels (bitrate, resolution) and the URL of each segment
- [ ] Explains adaptive bitrate: the player monitors download speed and switches to a lower or higher quality level between segments to avoid buffering
- [ ] Notes that Safari and iOS support HLS natively; Chrome and Firefox require `HLS.js` (a JavaScript library that implements HLS parsing and MSE injection)
- [ ] Explains MSE (Media Source Extensions): a browser API that lets JavaScript feed video data to the `<video>` element programmatically
- [ ] Distinguishes VOD (video on demand, full manifest known upfront) from live streaming (manifest updates every few seconds with new segments)

---

### Q4 — Exponential Backoff ⭐

**Scenario:** After a WebSocket disconnects, the client retries immediately and then every second. During a server outage, 10,000 users all reconnect simultaneously every second, overwhelming the server's recovery. The interviewer asks how to fix this.

**Task:** Define exponential backoff, write the formula, explain jitter, and describe why it prevents the thundering herd problem.

**Acceptance Criteria:**
- [ ] Defines exponential backoff: retry delay doubles after each failed attempt — `delay = min(baseDelay * 2^attempt, maxDelay)`
- [ ] Shows a concrete sequence: 1s, 2s, 4s, 8s, 16s, 30s (capped), 30s, 30s…
- [ ] Explains the thundering herd: without jitter, all 10,000 clients retry at exactly the same times (T+1s, T+2s, T+4s) — each wave hits the server simultaneously
- [ ] Defines jitter: add random variation to the delay — `delay = random(0, min(baseDelay * 2^attempt, maxDelay))`
- [ ] Explains that jitter spreads reconnections across time so the server receives a steady trickle instead of synchronized bursts
- [ ] Notes that full jitter (random between 0 and cap) is more effective than decorrelated jitter for most reconnect scenarios

---

### Q5 — WebSocketClient Class Design ⭐⭐

**Scenario:** The app needs a reusable WebSocket abstraction. It must handle connection lifecycle, reconnect automatically with exponential backoff, queue messages sent while disconnected, and support pub/sub subscriptions for different message types.

**Task:** Design and implement a `WebSocketClient` class covering all four requirements.

**Acceptance Criteria:**
- [ ] `connect()` creates the WebSocket, attaches `onopen`, `onmessage`, `onerror`, `onclose` handlers
- [ ] `onclose` triggers reconnect with exponential backoff (using the formula from Q4) — resets attempt counter on successful open
- [ ] Message queue: `send(message)` pushes to a queue if `readyState !== OPEN`; `onopen` flushes the queue
- [ ] Pub/sub: `subscribe(type, handler)` stores handlers in a `Map<string, Set<Handler>>`; `onmessage` parses `JSON`, reads `type`, and dispatches to matching handlers
- [ ] `unsubscribe(type, handler)` removes the specific handler from the set
- [ ] `disconnect()` sets a `manualClose` flag before calling `.close()` so `onclose` does not trigger reconnect
- [ ] All public methods are type-safe — generic `WebSocketClient<MessageType>` or a typed message union

---

### Q6 — useRealtimeQuery ⭐⭐

**Scenario:** The live dashboard shows historical data (loaded via React Query) and then updates in real-time via WebSocket. Currently, engineers write separate logic for each: a `useQuery` for initial data and a manual `useState` + WebSocket listener that resets the query cache on every message. It's duplicated across six dashboards.

**Task:** Design a `useRealtimeQuery` hook that combines React Query for initial data and WebSocket updates for live mutations of the cache — without triggering a full refetch on every message.

**Acceptance Criteria:**
- [ ] `useRealtimeQuery(queryKey, queryFn, wsEventType)` returns the same shape as `useQuery` — transparent to consumers
- [ ] Internally calls `useQuery` for initial data fetch and caching
- [ ] Subscribes to the `WebSocketClient` for `wsEventType` messages in a `useEffect`
- [ ] On each WebSocket message, calls `queryClient.setQueryData(queryKey, updater)` — surgically updates the cache without refetching
- [ ] The `updater` function receives current cache data and the incoming WebSocket payload — merges/replaces as appropriate
- [ ] `useEffect` cleanup calls `unsubscribe` to prevent memory leaks on unmount
- [ ] Notes the trade-off: skipping `invalidateQueries` means the client drives its own state — a missed message causes stale UI until the next reconnect/refetch

---

### Q7 — SSE Hook with Reconnection ⭐⭐

**Scenario:** The server-sent KPI metrics endpoint (`/api/metrics/stream`) occasionally drops the SSE connection. The client must reconnect with exponential backoff. The hook must also handle the component unmounting (cleanup) so `EventSource` is not leaked.

**Task:** Implement `useSSEMetrics(url)` with reconnection using exponential backoff and proper cleanup.

**Acceptance Criteria:**
- [ ] Creates `EventSource` in a `useEffect` with the provided URL
- [ ] Listens to `message` event: parses JSON and calls `setMetrics` with the new data
- [ ] Listens to `error` event: closes the current source, increments attempt counter, schedules reconnect with `setTimeout` using exponential backoff
- [ ] Resets attempt counter to 0 on a successful message (connection is healthy)
- [ ] Cleanup function closes the `EventSource` and clears the `setTimeout` — prevents reconnect after unmount
- [ ] Returns `{ metrics, error, connected }` for the consumer to display appropriate UI states
- [ ] Notes that `EventSource` auto-reconnects natively — the manual backoff is needed only for custom control (e.g., capping attempts or alerting on failure)

---

### Q8 — Chat Offline Support ⭐⭐

**Scenario:** The chat app must work offline. Messages typed while offline must be queued and sent when the connection is restored. Each message should show a delivery status: sending → sent → delivered → read.

**Task:** Design the offline message queue and delivery status state machine. Show the data model, the queue flush logic, and the UI states.

**Acceptance Criteria:**
- [ ] Message data model includes: `id` (client-generated UUID), `text`, `status: 'sending' | 'sent' | 'delivered' | 'read'`, `timestamp`
- [ ] Offline queue stored in `localStorage` or `IndexedDB` — survives page refresh
- [ ] On send: append to queue with `status: 'sending'`; attempt WebSocket send immediately if connected
- [ ] On `online` event (or WebSocket reconnect): flush the queue by sending each pending message in order
- [ ] On server acknowledgement: update `status` to `'sent'`; server pushes delivery/read events to update further
- [ ] UI: show a clock icon for `'sending'`, single checkmark for `'sent'`, double checkmark for `'delivered'`, blue double checkmark for `'read'`
- [ ] Deduplication: messages include a client-generated `id`; the server ignores duplicates on retry (idempotent)

---

### Q9 — Collaborative Text CRDT ⭐⭐

**Scenario:** The interviewer asks you to explain how a collaborative text editor like Google Docs handles two users inserting characters at the same position simultaneously — specifically what happens at the data structure level.

**Task:** Explain insert/delete operations in a text CRDT, describe Lamport timestamps, and explain why remote operations must be idempotent.

**Acceptance Criteria:**
- [ ] Explains that text CRDTs (e.g., YATA, RGA, Logoot) represent each character as a node with a unique identifier — position is derived from the graph, not an integer index
- [ ] Insert operation: includes character value, unique ID, and the ID of the character it is inserted after — position is determined structurally, not by array index
- [ ] Delete operation: marks the character as a tombstone (logically deleted) rather than physically removing it — preserves positional identity for concurrent operations
- [ ] Lamport timestamps: each operation carries a logical clock value (`max(localClock, remoteClock) + 1`) that establishes a total order for concurrent events
- [ ] When two users insert at the same position, the CRDT uses the unique IDs and timestamps to deterministically choose an order — all replicas converge to the same sequence
- [ ] Idempotency of remote ops: the same operation may arrive twice due to network retries; the CRDT checks the unique ID and ignores duplicates

---

### Q10 — System Design: Twitter Feed ⭐⭐

**Scenario:** "Design the frontend for a Twitter-like feed. Users see a reverse-chronological feed of tweets from people they follow. The feed should update in real-time. Like counts must feel instant. The feed may have thousands of items."

**Task:** Walk through state strategy, component architecture, real-time updates, optimistic like, and feed virtualization.

**Acceptance Criteria:**
- [ ] State strategy: React Query for feed data (server state), Zustand for optimistic like state overrides, URL params for active tab (For You / Following)
- [ ] Real-time: WebSocket (or SSE) pushes new tweet IDs; client fetches new tweets or prepends them — does not use polling
- [ ] "New tweets available" banner: shows count of new tweets since last scroll-to-top; clicking it prepends and scrolls up
- [ ] Optimistic like: immediately toggles UI; rolls back on API failure with toast
- [ ] Virtualization: TanStack Virtual for the tweet list — only ~20 DOM nodes regardless of feed length
- [ ] Fan-out on write vs read: acknowledges that the backend decides; frontend only cares about the event payload
- [ ] Explains the "new tweet" UX decision: auto-scrolling is disorienting — banner approach is preferred

---

### Q11 — System Design: Real-Time Dashboard ⭐⭐

**Scenario:** "Design a real-time monitoring dashboard. It shows live KPI cards (updating every second), a historical 24-hour trend chart (loaded once), and a table of the last 1000 log entries that scrolls and filters."

**Task:** Describe the data transport for each section, the state management, and the performance strategy for the log table.

**Acceptance Criteria:**
- [ ] KPI cards: SSE endpoint pushes updates every second; React Query's `setQueryData` updates cache without refetch; KPIs animate with a CSS counter transition
- [ ] Historical chart: loaded once with React Query, `staleTime: Infinity` — no need to refetch during the session
- [ ] Log table: initial 1000 entries loaded with React Query; new entries pushed via SSE and prepended with a cap at 1000 (drop oldest)
- [ ] Log table virtualization: TanStack Virtual — 1000 DOM nodes is too many, render only the visible slice
- [ ] Log table filtering: debounced client-side filter using `useMemo` — no API call needed since all 1000 entries are in memory
- [ ] KPI animation: `useRef` to track previous value; CSS `counter` or `requestAnimationFrame` to animate the number change
- [ ] Code splitting: chart library is lazy-loaded since it's heavy; KPI cards and table are in the main chunk

---

### Q12 — System Design: Chat App ⭐⭐⭐

**Scenario:** Design the frontend architecture for a real-time chat application. Features: one-on-one and group chats, typing indicators, read receipts, offline message queue, and virtualized message list.

**Task:** Cover WebSocket architecture, typing indicators, read receipts, offline queue, and message list virtualization. Identify the top three hard problems.

**Acceptance Criteria:**
- [ ] WebSocket architecture: single `WebSocketClient` instance (singleton) shared across the app; messages dispatched via pub/sub to conversation-specific subscribers
- [ ] Typing indicators: debounced `typing` event sent on keystroke; server fans out to other participants; cleared after 3s of inactivity — NOT stored in React Query cache (ephemeral)
- [ ] Read receipts: client sends `read` event when user views the last message (IntersectionObserver on last message item); server updates delivery status; sender receives `delivered`/`read` status event
- [ ] Offline queue: localStorage-backed queue with client-generated message IDs; flushed in order on reconnect; server deduplicates by message ID
- [ ] Message virtualization: TanStack Virtual with dynamic heights; must support "jump to unread" — virtualizer scroll-to-index
- [ ] Hard problem 1: history loading — fetching older messages (scroll-up pagination) while maintaining scroll position
- [ ] Hard problem 2: optimistic message rendering — show message immediately, reconcile with server-confirmed message (replace temp ID with real ID)
- [ ] Hard problem 3: connection state — gracefully transitioning between online, reconnecting, and offline UI states

---

### Q13 — System Design: Collaborative Document Editor ⭐⭐⭐

**Scenario:** Design the frontend for a Google Docs-style collaborative editor. Multiple users can edit simultaneously. Changes must merge without conflict. Users see each other's cursors. Undo/redo must work correctly even with concurrent edits.

**Task:** Cover CRDT operations, conflict resolution, presence indicators, and why undo/redo is hard with CRDTs.

**Acceptance Criteria:**
- [ ] CRDT choice: use Yjs (the industry-standard CRDT library for the web) with `y-websocket` provider for sync
- [ ] Operations flow: local edit → apply to local Yjs doc immediately → Yjs generates an update binary → WebSocket broadcasts to other clients → remote clients apply update
- [ ] Conflict resolution: Yjs handles all merging internally — no application-level conflict code needed
- [ ] Presence indicators: use Yjs Awareness protocol (built into `y-websocket`) — each client broadcasts cursor position and username; renders colored cursors for each peer
- [ ] Undo/redo problem: a simple undo stack cannot undo concurrent remote operations — would corrupt others' work. Yjs provides a `UndoManager` that only undoes local operations regardless of interleaved remote changes
- [ ] Offline support: Yjs buffers operations locally; all changes sync when the provider reconnects
- [ ] Persistence: server-side Yjs doc is persisted to a database; new clients receive the full document state on join

---

### Q14 — System Design: Video Streaming Platform ⭐⭐⭐

**Scenario:** Design the frontend for a video streaming platform supporting both VOD (Netflix-style) and live streams (Twitch-style). Users can select quality manually or let the player auto-adapt. Large creators upload videos via the platform.

**Task:** Cover HLS.js setup, quality selector UI, bandwidth detection, VOD vs live differences, and the upload flow (chunked and resumable).

**Acceptance Criteria:**
- [ ] HLS.js setup: `Hls.isSupported()` check; create `Hls` instance, load manifest URL, bind to `<video>` element; Safari uses native HLS via `video.src` directly
- [ ] Quality selector: `hls.levels` provides the list of quality levels; `hls.currentLevel` sets manual quality; `hls.currentLevel = -1` returns to auto
- [ ] Bandwidth detection: HLS.js uses `EWMABandwidthEstimator` internally — the app can read `hls.bandwidthEstimate` and display "HD" / "SD" labels accordingly
- [ ] VOD vs live: VOD manifest is static — seeking works anywhere; live manifest updates every few seconds with new segments, seeking is limited to a DVR window
- [ ] Live-specific UI: hide seek bar beyond DVR window; show "LIVE" badge; "Go Live" button seeks to `Infinity`
- [ ] Upload flow: split file into 5MB chunks with `File.slice()`; upload each chunk with a sequential chunk index; server reassembles; store progress in `useState`
- [ ] Resumable uploads: on failure, server returns the last received chunk index; client resumes from `chunks[lastIndex + 1]` — no need to re-upload completed chunks

---

### Q15 — System Design: E-Commerce Product Page ⭐⭐⭐

**Scenario:** Design the frontend for a high-traffic product detail page. Requirements: must be server-rendered for SEO; add-to-cart must feel instant; stock levels update in real-time; the image gallery has 20 photos; the product has thousands of customer reviews paginated infinitely; Core Web Vitals targets: LCP < 2.5s, CLS < 0.1, INP < 200ms.

**Task:** Walk through all requirements and explain how you hit each Core Web Vitals target.

**Acceptance Criteria:**
- [ ] SSR: Next.js Server Component fetches product data; rendered HTML contains full product details for SEO bots; React Query hydrated with dehydrated state
- [ ] Optimistic add-to-cart: `useMutation` with `onMutate` updates the cart badge count immediately; `onError` rolls back; `onSettled` syncs cart with server
- [ ] Real-time stock: SSE endpoint `/api/products/[id]/stock` pushes stock level; React Query `setQueryData` updates the in-stock badge without polling
- [ ] Image gallery: only the hero image loads eagerly (`fetchpriority="high"`, no lazy); remaining 19 images use `loading="lazy"`; thumbnail strip uses virtualization if more than 10 images
- [ ] Reviews: `useInfiniteQuery` with cursor pagination; "Load More" button (not auto-scroll) — reviews are below the fold, user explicitly requests more
- [ ] LCP target: hero image uses `fetchpriority="high"` + correct `srcSet` + preload hint in `<head>` — LCP element loads within 2.5s
- [ ] CLS target: image dimensions explicitly set in `width`/`height` attributes so browser reserves space before image loads — no layout shift
- [ ] INP target: add-to-cart click handler completes in < 200ms because optimistic update is synchronous — no waiting for API response before visual feedback
