// ════════════════════════════════════════════════════════════════
// DAY 47 — SERVER-SENT EVENTS (SSE)
// ════════════════════════════════════════════════════════════════
//
// SSE PROTOCOL (dead simple):
//   1. Client makes a normal GET request
//   2. Server sets Content-Type: text/event-stream
//   3. Server keeps the connection open and writes lines
//   4. Each "event" is:
//        data: {"any":"json"}\n\n       ← double newline = end of event
//   5. Named events:
//        event: price-update\n
//        data: {"symbol":"AAPL"}\n\n
//   6. Event IDs (for resume after reconnect):
//        id: 42\n
//        data: {...}\n\n
//   7. Custom retry interval:
//        retry: 5000\n\n               ← tell browser to wait 5s before reconnecting
//
// BROWSER USAGE:
//   const es = new EventSource('/stocks/stream');
//   es.addEventListener('price-update', (e) => {
//     const data = JSON.parse(e.data);
//     console.log(data.symbol, data.price);
//   });
//   es.onerror = () => console.log('disconnected, browser will retry...');
//   // To close: es.close();
//
// SSE vs WEBSOCKET — the honest comparison:
//
//   SSE:
//     ✅ Server-to-client only (stock prices, notifications, live scores)
//     ✅ Automatic reconnect built into browser EventSource API
//     ✅ Works over plain HTTP (no upgrade protocol)
//     ✅ Firewall/proxy friendly (just a long-lived HTTP response)
//     ✅ Simple — just write strings to a response
//     ✅ HTTP/2 multiplexes many SSE streams on one TCP connection
//     ❌ Client can't send data over the same connection
//     ❌ HTTP/1.1: max ~6 connections per origin (EventSource counts as one)
//     ❌ No binary data support (text only)
//
//   WebSocket:
//     ✅ Bidirectional (client AND server can send any time)
//     ✅ Binary data support (audio, video, file chunks)
//     ✅ Lower overhead per message (smaller frame headers)
//     ❌ Upgrade handshake required
//     ❌ Some corporate firewalls/proxies strip Upgrade headers
//     ❌ No automatic reconnect — you implement it yourself
//     ❌ More complex (readyState management, keep-alives)
//
// WHEN TO CHOOSE SSE:
//   - Live dashboards (metrics, stock prices, sports scores)
//   - Notification systems (user gets alerts pushed to them)
//   - AI chat streaming (ChatGPT streams tokens via SSE)
//   - Long-running job progress (export job: 45% done...)
//   - Any "server pushes to passive viewer" scenario
//
// RECONNECT WITH LAST-EVENT-ID:
//   When the browser reconnects after a drop, it sends:
//     GET /stocks/stream HTTP/1.1
//     Last-Event-ID: 42
//   Your server can resume sending from event 43 onwards.
//   This is critical for: notification systems (don't miss a notification),
//   ordered event logs. For stock prices, you usually just send current price.
//
// CORS WITH SSE:
//   SSE requests from a different origin require CORS headers.
//   EventSource does NOT support custom request headers (unlike fetch).
//   If you need auth with SSE, use: /stream?token=xyz (query param)
//   or set-cookie + credentials: 'include' in EventSource constructor.
//
// ════════════════════════════════════════════════════════════════

import express, { Request, Response } from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';

const app = express();
app.use(cors());
app.use(express.json());

// ─── SSE helper ───────────────────────────────────────────────────
// Encapsulates the repetitive SSE setup and writing.

function setupSSEHeaders(res: Response): void {
  res.writeHead(200, {
    'Content-Type':  'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection':    'keep-alive',
    // Allow EventSource from any origin (adjust in prod)
    'Access-Control-Allow-Origin': '*',
  });

  // Flush the headers immediately — important for nginx/proxies that buffer
  res.flushHeaders();

  // Some proxies/CDNs buffer the response. Sending a comment line every ~20s
  // keeps the connection alive through those intermediaries.
  // SSE comment format: ": this is a comment\n\n"
}

function sendSSEEvent(res: Response, data: unknown, eventName?: string, id?: string): void {
  if (id)        res.write(`id: ${id}\n`);
  if (eventName) res.write(`event: ${eventName}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function sendSSEComment(res: Response, comment = 'keep-alive'): void {
  res.write(`: ${comment}\n\n`);
}

// ─── Connection registry for notifications ────────────────────────
// Map<userId, Set<Response>> — one user can have multiple tabs open
const notificationSubscribers = new Map<string, Set<Response>>();

// ─── DEMO 1: Live stock prices ────────────────────────────────────
// Client connects → server streams price updates every 1 second.
// Shows: named events, realistic price simulation, cleanup on disconnect.

const STOCKS: Record<string, number> = {
  AAPL: 183.42,
  MSFT: 415.26,
  GOOGL: 178.54,
  TSLA: 247.15,
  NVDA: 875.39,
};

// Simulate realistic price movement: random walk with ±1% max change
function updatePrice(symbol: string): number {
  const current = STOCKS[symbol]!;
  const changePct = (Math.random() - 0.5) * 0.02; // ±1%
  const newPrice = Math.max(1, current * (1 + changePct));
  STOCKS[symbol] = parseFloat(newPrice.toFixed(2));
  return STOCKS[symbol]!;
}

app.get('/stocks/stream', (req: Request, res: Response) => {
  console.log('[sse] Client connected to /stocks/stream');
  setupSSEHeaders(res);

  // Send current prices immediately on connect (don't make client wait 1s)
  for (const [symbol, price] of Object.entries(STOCKS)) {
    sendSSEEvent(res, { symbol, price, change: 0 }, 'price-update');
  }

  let eventId = 0;

  const priceInterval = setInterval(() => {
    for (const symbol of Object.keys(STOCKS)) {
      const oldPrice = STOCKS[symbol]!;
      const newPrice = updatePrice(symbol);
      const change = parseFloat((newPrice - oldPrice).toFixed(2));

      sendSSEEvent(
        res,
        { symbol, price: newPrice, change, ts: Date.now() },
        'price-update',
        String(++eventId),
      );
    }
  }, 1000);

  // Keep-alive comment every 20s (keeps proxies from closing the connection)
  const keepAlive = setInterval(() => sendSSEComment(res), 20_000);

  // CRITICAL: Clean up when client disconnects (browser tab close, es.close(), network drop)
  // Without this, the interval runs forever — memory and CPU leak
  req.on('close', () => {
    clearInterval(priceInterval);
    clearInterval(keepAlive);
    console.log('[sse] Client disconnected from /stocks/stream');
  });
});

// ─── DEMO 2: Notification system ─────────────────────────────────
// Client subscribes, server pushes notifications via POST /notifications.
// Shows: connection registry, broadcast to all subscribers.

app.get('/notifications/stream', (req: Request, res: Response) => {
  // In production: get userId from JWT/session. Here use query param for demo.
  const userId = (req.query['userId'] as string) || 'anonymous';

  console.log(`[sse] User ${userId} connected to notifications stream`);
  setupSSEHeaders(res);

  // Tell client their retry interval
  res.write('retry: 3000\n\n');

  // Register this connection
  if (!notificationSubscribers.has(userId)) {
    notificationSubscribers.set(userId, new Set());
  }
  notificationSubscribers.get(userId)!.add(res);

  // Send a welcome notification
  sendSSEEvent(res, {
    id: randomUUID(),
    title: 'Connected',
    body: `Notification stream active for user: ${userId}`,
    ts: Date.now(),
  }, 'notification');

  req.on('close', () => {
    const connections = notificationSubscribers.get(userId);
    if (connections) {
      connections.delete(res);
      if (connections.size === 0) {
        notificationSubscribers.delete(userId);
      }
    }
    console.log(`[sse] User ${userId} disconnected from notifications`);
  });
});

// Send a notification to one or all users
// POST /notifications  { userId?: string, title: string, body: string }
app.post('/notifications', (req: Request, res: Response) => {
  const { userId, title, body } = req.body as {
    userId?: string;
    title: string;
    body: string;
  };

  const notification = { id: randomUUID(), title, body, ts: Date.now() };

  if (userId) {
    // Send to specific user (all their open tabs)
    const connections = notificationSubscribers.get(userId);
    if (!connections || connections.size === 0) {
      res.status(404).json({ error: `User ${userId} not connected` });
      return;
    }
    for (const conn of connections) {
      sendSSEEvent(conn, notification, 'notification');
    }
    res.json({ sent: connections.size, to: userId });
  } else {
    // Broadcast to all subscribers
    let totalSent = 0;
    for (const connections of notificationSubscribers.values()) {
      for (const conn of connections) {
        sendSSEEvent(conn, notification, 'notification');
        totalSent++;
      }
    }
    res.json({ sent: totalSent, broadcast: true });
  }
});

// ─── DEMO 3: Job progress tracking ───────────────────────────────
// Client subscribes to a job → server streams progress updates → closes stream when done.
// Shows: finite SSE streams, the done sentinel event, closing from server side.

// Simulated job steps with realistic-sounding messages
const JOB_STEPS = [
  'Initializing job context...',
  'Loading source data...',
  'Validating input schema...',
  'Transforming records (batch 1/3)...',
  'Transforming records (batch 2/3)...',
  'Transforming records (batch 3/3)...',
  'Running data quality checks...',
  'Writing output...',
  'Generating summary report...',
  'Cleaning up temporary files...',
];

app.get('/jobs/:jobId/progress', (req: Request, res: Response) => {
  const { jobId } = req.params;
  console.log(`[sse] Client streaming progress for job ${jobId}`);

  setupSSEHeaders(res);

  const total = JOB_STEPS.length;
  let step = 0;
  let cancelled = false;

  const jobInterval = setInterval(async () => {
    if (cancelled) return;

    step++;
    const pct = Math.round((step / total) * 100);
    const message = JOB_STEPS[step - 1] ?? 'Working...';

    sendSSEEvent(res, { jobId, step, total, pct, message, ts: Date.now() }, 'progress');

    if (step >= total) {
      clearInterval(jobInterval);

      // Slight delay then send the completion event
      setTimeout(() => {
        if (!cancelled) {
          sendSSEEvent(res, { jobId, done: true, pct: 100, ts: Date.now() }, 'complete');

          // Server closes the stream — the client's EventSource will see readyState → CLOSED
          // Without this, the browser would keep the connection open forever
          res.end();
          console.log(`[sse] Job ${jobId} complete, stream closed`);
        }
      }, 200);
    }
  }, 500);

  req.on('close', () => {
    cancelled = true;
    clearInterval(jobInterval);
    console.log(`[sse] Client disconnected from job ${jobId} progress stream`);
  });
});

// ─── Demo HTML page ───────────────────────────────────────────────
// Served at GET / — shows live stock prices using EventSource.
// All HTML/CSS/JS is inlined so there are no external dependencies.

app.get('/', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SSE Demo — Day 47</title>
  <style>
    body { font-family: monospace; background: #0f0f0f; color: #e2e8f0; padding: 2rem; }
    h1   { color: #7c3aed; margin-bottom: 0.5rem; }
    p    { color: #94a3b8; margin-bottom: 2rem; }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1rem;
    }

    .card {
      background: #1e1e2e;
      border: 1px solid #2a2a3e;
      border-radius: 8px;
      padding: 1.5rem;
      transition: border-color 0.3s;
    }
    .card.up   { border-color: #22c55e; }
    .card.down { border-color: #ef4444; }

    .symbol  { font-size: 1.4rem; font-weight: bold; color: #7c3aed; }
    .price   { font-size: 1.8rem; margin: 0.5rem 0; }
    .change  { font-size: 0.9rem; }
    .change.up   { color: #22c55e; }
    .change.down { color: #ef4444; }

    .status {
      margin-top: 2rem;
      padding: 0.75rem 1rem;
      background: #1e1e2e;
      border-radius: 6px;
      font-size: 0.85rem;
      color: #64748b;
    }
  </style>
</head>
<body>
  <h1>Live Stock Prices via SSE</h1>
  <p>Using <code>new EventSource('/stocks/stream')</code> — no WebSocket, no polling.</p>
  <div class="grid" id="grid"></div>
  <div class="status" id="status">Connecting...</div>

  <script>
    const grid   = document.getElementById('grid');
    const status = document.getElementById('status');
    const cards  = {};

    function getOrCreateCard(symbol) {
      if (!cards[symbol]) {
        const div = document.createElement('div');
        div.className = 'card';
        div.id = 'card-' + symbol;
        div.innerHTML =
          '<div class="symbol">' + symbol + '</div>' +
          '<div class="price" id="price-' + symbol + '">--</div>' +
          '<div class="change" id="change-' + symbol + '">--</div>';
        grid.appendChild(div);
        cards[symbol] = div;
      }
      return cards[symbol];
    }

    const es = new EventSource('/stocks/stream');

    es.addEventListener('price-update', (e) => {
      const d = JSON.parse(e.data);
      const card   = getOrCreateCard(d.symbol);
      const priceEl  = document.getElementById('price-'  + d.symbol);
      const changeEl = document.getElementById('change-' + d.symbol);

      priceEl.textContent  = '$' + d.price.toFixed(2);
      changeEl.textContent = (d.change >= 0 ? '+' : '') + d.change.toFixed(2);
      changeEl.className   = 'change ' + (d.change >= 0 ? 'up' : 'down');
      card.className       = 'card '   + (d.change >= 0 ? 'up' : 'down');
    });

    es.onopen  = () => { status.textContent = 'Connected — receiving live prices'; };
    es.onerror = () => { status.textContent = 'Disconnected — EventSource will retry...'; };
  </script>
</body>
</html>`);
});

// ─── Start server ─────────────────────────────────────────────────

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`[sse] Server running on http://localhost:${PORT}`);
  console.log(`[sse] Endpoints:`);
  console.log(`  GET  http://localhost:${PORT}/                           → demo page`);
  console.log(`  GET  http://localhost:${PORT}/stocks/stream              → live stock SSE`);
  console.log(`  GET  http://localhost:${PORT}/notifications/stream?userId=alice`);
  console.log(`  POST http://localhost:${PORT}/notifications              → push notification`);
  console.log(`  GET  http://localhost:${PORT}/jobs/job-123/progress      → job progress SSE`);
  console.log('');
  console.log('Test with curl:');
  console.log(`  curl -N http://localhost:${PORT}/stocks/stream`);
  console.log(`  curl -X POST http://localhost:${PORT}/notifications -H 'Content-Type: application/json' \\`);
  console.log(`    -d '{"title":"Hello","body":"World","userId":"alice"}'`);
});
