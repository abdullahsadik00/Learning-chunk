// ═══════════════════════════════════════════════════════════════
// BACKEND 19: STRUCTURED LOGGING · HEALTH CHECKS · OBSERVABILITY · GRACEFUL SHUTDOWN  (Day 54)
// Run: npx ts-node 19-observability.ts
// ═══════════════════════════════════════════════════════════════
//
// Topics covered:
//  1. The three pillars of observability
//  2. Structured logging with Pino
//  3. What to log (and what NOT to log)
//  4. Metrics with prom-client (Prometheus)
//  5. Distributed tracing and correlation IDs
//  6. Health checks (liveness vs readiness)
//  7. Graceful shutdown
//  8. Error tracking with Sentry

// ───────────────────────────────────────────────────────────────
// 1. The Three Pillars of Observability
// ───────────────────────────────────────────────────────────────

console.log("=== 1. The Three Pillars of Observability ===");

/*
  OBSERVABILITY = knowing what is happening inside your system
  by examining its outputs — without deploying new code.

  The three pillars work together:

  ┌──────────┬──────────────────────────────────┬──────────────────────────────┐
  │ Pillar   │ Question it answers              │ Example tools                │
  ├──────────┼──────────────────────────────────┼──────────────────────────────┤
  │ LOGS     │ What happened?                   │ Pino, Winston, Datadog Logs  │
  │          │ Events, errors, audit trail      │ CloudWatch, Loki             │
  ├──────────┼──────────────────────────────────┼──────────────────────────────┤
  │ METRICS  │ How much? How fast?              │ Prometheus, prom-client      │
  │          │ Counts, gauges, histograms       │ Grafana, Datadog Metrics     │
  ├──────────┼──────────────────────────────────┼──────────────────────────────┤
  │ TRACES   │ Where did the time go?           │ OpenTelemetry, Jaeger        │
  │          │ End-to-end request journey       │ Zipkin, Datadog APM          │
  └──────────┴──────────────────────────────────┴──────────────────────────────┘

  WHY console.log IS NOT ENOUGH IN PRODUCTION
  ────────────────────────────────────────────
  console.log("User logged in: " + userId)
    ✗ Plain text — cannot be queried or filtered efficiently
    ✗ No log level — everything looks equally important
    ✗ No timestamp, no request ID, no environment, no severity
    ✗ Cannot be shipped to a log aggregation system without parsing
    ✗ Synchronous in some environments — can block the event loop
    ✗ Zero correlation — cannot connect this line to a trace or metric

  The three pillars work TOGETHER in an incident workflow:
    1. Metric spike   → p99 latency jumped from 200ms to 4s at 14:32
    2. Trace lookup   → find a slow request, see DB query took 3.8s
    3. Log inspection → look at logs for that trace ID, see "ORA-00028: session killed"

  Without all three you are guessing. With all three you diagnose in minutes.
*/

// Simulating what structured observability looks like:
interface LogEntryBase {
  level:     string;
  requestId: string;
  userId?:   string;
  msg:       string;
}

interface LogEntry extends LogEntryBase {
  time: number;
  [key: string]: unknown;
}

function simulateStructuredLog(entry: LogEntryBase & Record<string, unknown>): LogEntry {
  return { ...entry, time: Date.now() };
}

const exampleLog = simulateStructuredLog({
  level:     "info",
  requestId: "req_abc123",
  userId:    "usr_42",
  method:    "POST",
  url:       "/api/transfer",
  status:    200,
  duration:  142,
  msg:       "request completed",
});
console.log("Structured log entry:", JSON.stringify(exampleLog));

// ───────────────────────────────────────────────────────────────
// 2. Structured Logging with Pino
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. Structured Logging with Pino ===");

/*
  PINO — THE PRODUCTION LOGGER FOR NODE.JS
  ──────────────────────────────────────────
  Install: npm install pino pino-http
  Dev:     npm install -D pino-pretty

  Why Pino over console or Winston?
    • Fastest Node.js logger (benchmarked; uses asynchronous logging)
    • Outputs newline-delimited JSON — one JSON object per line
    • Machine-readable: grep, jq, log aggregators can parse instantly
    • pino-pretty transforms JSON → colored human output in dev only

  BASIC SETUP
  ────────────
  import pino from 'pino';

  const logger = pino({
    level: process.env.LOG_LEVEL ?? 'info',   // controls minimum level
    transport: process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,                             // raw JSON in production
  });

  LOG LEVELS (lowest → highest severity)
  ────────────────────────────────────────
  trace  (10) — very verbose: function entry/exit, internal state
  debug  (20) — developer details: variable values, branch taken
  info   (30) — normal operations: request received, job started      ← default minimum
  warn   (40) — something unexpected but recoverable
  error  (50) — an operation failed; action required
  fatal  (60) — process is about to exit

  Setting level: 'warn' silences trace/debug/info — only warn+ are emitted.
  In production use 'info'. In staging use 'debug'. In tests use 'warn'.

  LOGGING WITH CONTEXT (mergingObject + message)
  ───────────────────────────────────────────────
  // Always log structured data BEFORE the message string:
  logger.info({ userId: 'usr_42', action: 'transfer' }, 'Transfer initiated');
  // → { "level": "info", "time": 1719000000000, "userId": "usr_42",
  //     "action": "transfer", "msg": "Transfer initiated" }

  // NOT this — loses structure, cannot be queried:
  logger.info(`User usr_42 initiated transfer`);   // ✗ plain string

  CHILD LOGGERS — per-request context
  ────────────────────────────────────
  Child loggers inherit parent's level and transport, and automatically
  include extra fields in every log line they emit.

  const reqLogger = logger.child({ requestId: 'req_abc123', userId: 'usr_42' });
  reqLogger.info('Validating input');
  reqLogger.warn({ field: 'amount' }, 'Missing field');
  // Both lines automatically include requestId and userId — no manual passing.

  // Pass reqLogger down to service functions:
  async function validateTransfer(amount: number, log: pino.Logger) {
    log.debug({ amount }, 'Running validation');
    if (amount <= 0) log.warn({ amount }, 'Non-positive amount rejected');
  }

  PINO-HTTP — automatic request/response logging
  ────────────────────────────────────────────────
  import pinoHttp from 'pino-http';

  const httpLogger = pinoHttp({
    logger,                         // reuse your pino instance
    genReqId: () => crypto.randomUUID(),   // attach unique ID to each request
    customLogLevel: (_req, res) =>
      res.statusCode >= 500 ? 'error'
      : res.statusCode >= 400 ? 'warn'
      : 'info',
    serializers: {
      req: (req) => ({ method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  });

  app.use(httpLogger);
  // Now req.log is a child logger with requestId pre-attached:
  app.get('/users', (req, res) => {
    req.log.info({ userId: req.user?.id }, 'Fetching user list');
    res.json([]);
  });

  SHIPPING TO PRODUCTION LOG AGGREGATORS
  ────────────────────────────────────────
  Pino writes JSON to stdout. External agents pick it up:

  Datadog   → install datadog-agent or dd-trace; tails stdout automatically
  AWS CW    → CloudWatch agent or awslogs Docker log driver reads stdout
  Grafana   → Promtail agent ships stdout lines to Loki; query with LogQL
  Elastic   → Filebeat tails the log file and sends to Elasticsearch

  NEVER write to files from inside the app — let process stdout be the sink.
  This keeps the app stateless and plays well with container orchestration.
*/

// Simulating Pino-style log lines:
function pinoLine(level: string, data: Record<string, unknown>, msg: string): string {
  const levelNum: Record<string, number> = {
    trace: 10, debug: 20, info: 30, warn: 40, error: 50, fatal: 60,
  };
  return JSON.stringify({ level: levelNum[level], time: Date.now(), ...data, msg });
}

console.log(pinoLine("info",  { requestId: "req_1", userId: "usr_42", action: "login" }, "User authenticated"));
console.log(pinoLine("warn",  { requestId: "req_2", attempts: 3 }, "Repeated failed login"));
console.log(pinoLine("error", { requestId: "req_3", err: { message: "Connection refused", stack: "..." } }, "DB unreachable"));

// ───────────────────────────────────────────────────────────────
// 3. What to Log (and What NOT to Log)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. What to Log ===");

/*
  LOG THESE — the minimum set for a debuggable production system
  ──────────────────────────────────────────────────────────────

  REQUEST / RESPONSE
    { method, url, statusCode, durationMs, userId, requestId }
    Log at start for tracing, end for final status. Use pino-http.

  ERRORS
    { err: serialized_error, requestId, userId, ...context }
    Always include the full stack trace and surrounding context.
    Use pino's built-in error serializer: logger.error({ err }, 'msg')

  SLOW OPERATIONS  (threshold: >500ms for DB, >1s for external calls)
    { query, durationMs, table, requestId }
    Anything above threshold gets a warn-level slow query log.

  BACKGROUND JOBS
    { jobId, jobType, queue }  at started / completed / failed transitions
    Include attempt number on retries and the error on failure.

  SECURITY EVENTS
    { ip, userId?, action }  for rate-limit hits, auth failures, suspicious activity
    These feed SIEM tools and alert on brute force attacks.

  AUDIT TRAIL
    { actor, action, resource, before, after }  for sensitive mutations
    (financial transactions, permission changes, admin actions)


  NEVER LOG THESE — compliance, security, and noise reasons
  ──────────────────────────────────────────────────────────
  Passwords, hashed or not
  JWT tokens or session IDs       (replay attacks if logs are breached)
  Credit card numbers, CVVs       (PCI-DSS violation)
  SSNs, passport numbers          (PII — GDPR/CCPA violation)
  Full request/response bodies    (may contain any of the above)
  Health check hits               (noise — filter in log config, not code)
  Email addresses in messages     (log userId instead; resolve in dashboard)

  PATTERN — log references, not values:
    ✓  logger.info({ userId: 'usr_42' }, 'Password changed')
    ✗  logger.info({ email: 'bob@example.com', password: 'abc123' }, 'Logged in')
*/

// Safe logging helper that strips sensitive fields before logging:
function sanitize(obj: Record<string, unknown>): Record<string, unknown> {
  const FORBIDDEN = new Set(["password", "token", "secret", "authorization",
                             "creditCard", "ssn", "cvv"]);
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([key]) => !FORBIDDEN.has(key.toLowerCase()))
      .map(([key, val]) =>
        typeof val === "string" && val.includes("@")
          ? [key, "[REDACTED_EMAIL]"]
          : [key, val]
      )
  );
}

const rawBody = { userId: "usr_42", email: "bob@example.com", password: "secret123", amount: 500 };
console.log("Safe to log:", sanitize(rawBody));
// → { userId: 'usr_42', email: '[REDACTED_EMAIL]', amount: 500 }

// ───────────────────────────────────────────────────────────────
// 4. Metrics with prom-client (Prometheus)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. Metrics with prom-client ===");

/*
  PROMETHEUS + GRAFANA — THE STANDARD METRICS STACK
  ───────────────────────────────────────────────────
  Install: npm install prom-client

  Prometheus scrapes your app's GET /metrics endpoint every 15s.
  Grafana queries Prometheus to render dashboards and fire alerts.

  THE FOUR METRIC TYPES
  ──────────────────────

  COUNTER — monotonically increasing number; only goes up (or resets)
    Use for: total requests, total errors, emails sent, retries
    Cannot decrease (use Gauge for that).

    const httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });
    // On each request:
    httpRequestsTotal.inc({ method: 'POST', route: '/transfer', status_code: '200' });

    Query: rate(http_requests_total[5m])  → requests per second over last 5 minutes


  GAUGE — value that can go up and down
    Use for: active connections, queue depth, memory usage, cache size

    const activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of currently open connections',
    });
    activeConnections.inc();   // on connect
    activeConnections.dec();   // on disconnect
    activeConnections.set(42); // set absolute value

    Query: active_connections > 1000  → alert if too many connections


  HISTOGRAM — records observations in configurable buckets; computes percentiles
    Use for: request durations, DB query times, payload sizes

    const httpDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],  // seconds
    });
    // Wrap each request:
    const end = httpDuration.startTimer({ method: 'GET', route: '/users' });
    await handleRequest();
    end();   // records duration

    Query: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
           → p99 latency over the last 5 minutes


  SUMMARY — similar to Histogram but computes quantiles client-side
    Prefer Histogram in most cases — Histograms aggregate across instances.


  THE /metrics ENDPOINT
  ──────────────────────
  import { register } from 'prom-client';

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  Output is Prometheus exposition format — plain text, scraped by Prometheus.


  ALERTING RULES (examples)
  ──────────────────────────
  Error rate > 1%:
    ALERT HighErrorRate
    IF rate(http_requests_total{status_code=~"5.."}[5m])
         / rate(http_requests_total[5m]) > 0.01
    FOR 2m

  p99 latency > 2s:
    ALERT SlowP99
    IF histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 2
    FOR 5m

  Memory leak detection:
    ALERT MemoryGrowing
    IF process_resident_memory_bytes > 500e6   (500 MB)


  DEFAULT METRICS
  ────────────────
  prom-client ships with collectDefaultMetrics() which automatically records:
  process_cpu_seconds_total, process_resident_memory_bytes,
  nodejs_eventloop_lag_seconds, nodejs_active_handles_total, and more.

  import { collectDefaultMetrics } from 'prom-client';
  collectDefaultMetrics({ prefix: 'myapp_' });
*/

// Simulating metric tracking without the real prom-client:
class SimpleCounter {
  private counts: Map<string, number> = new Map();

  inc(labels: Record<string, string> = {}): void {
    const key = JSON.stringify(labels);
    this.counts.set(key, (this.counts.get(key) ?? 0) + 1);
  }

  value(labels: Record<string, string> = {}): number {
    return this.counts.get(JSON.stringify(labels)) ?? 0;
  }
}

class SimpleHistogram {
  private observations: number[] = [];

  observe(value: number): void {
    this.observations.push(value);
  }

  percentile(p: number): number {
    if (this.observations.length === 0) return 0;
    const sorted = [...this.observations].sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
  }
}

const requests = new SimpleCounter();
const durations = new SimpleHistogram();

// Simulate some requests:
[120, 95, 340, 88, 2200, 150, 78, 410].forEach((ms) => {
  const status = ms > 2000 ? "500" : "200";
  requests.inc({ method: "GET", status });
  durations.observe(ms);
});

console.log("Total 200s:", requests.value({ method: "GET", status: "200" }));
console.log("Total 500s:", requests.value({ method: "GET", status: "500" }));
console.log("p50 latency:", durations.percentile(50), "ms");
console.log("p99 latency:", durations.percentile(99), "ms");

// ───────────────────────────────────────────────────────────────
// 5. Distributed Tracing and Correlation IDs
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Distributed Tracing and Correlation IDs ===");

/*
  THE PROBLEM TRACING SOLVES
  ───────────────────────────
  A request to POST /transfer might:
    1. Hit API Gateway
    2. Enter Express middleware (auth check, rate limiter)
    3. Call transferService.execute()
    4. Query Postgres (SELECT balance WHERE userId = ?)
    5. Call an external fraud-check API
    6. Insert into transfers table
    7. Publish an event to BullMQ
    8. Return 200

  Logs from steps 3-7 are generated by different functions, possibly
  in different services. Without a shared identifier you cannot
  connect them into one coherent story.

  TRACE ID + SPAN ID
  ───────────────────
  Trace ID  — unique identifier for the entire end-to-end request.
              Same value flows through every service and function call.
  Span ID   — identifies one unit of work within the trace.
              Each DB query, each function, each HTTP call gets its own span.
              Spans have parent-child relationships → a flame chart.

  CORRELATION ID (the minimum viable tracing)
  ────────────────────────────────────────────
  For a single-service Node app, a correlation/request ID attached to
  every log line gets you 80% of the value of full tracing.

  Generate on arrival:
    const requestId = req.headers['x-request-id'] ?? crypto.randomUUID();
    res.setHeader('x-request-id', requestId);   // echo back to client

  Pass through the call chain:
    ✗  service.doWork(userId, requestId)         // pollutes every signature
    ✓  Use AsyncLocalStorage (see below)


  AsyncLocalStorage — PASSING CONTEXT WITHOUT PROP DRILLING
  ──────────────────────────────────────────────────────────
  AsyncLocalStorage is a Node.js built-in (stable since v16) that creates
  a "store" scoped to an async execution context. Any code that runs
  within the same async tree can read the store — no parameter passing needed.

  import { AsyncLocalStorage } from 'node:async_hooks';

  interface RequestContext {
    requestId: string;
    userId?: string;
  }

  const requestContext = new AsyncLocalStorage<RequestContext>();

  // Middleware — set the store for this request's async tree:
  app.use((req, res, next) => {
    const ctx: RequestContext = {
      requestId: req.headers['x-request-id'] as string ?? crypto.randomUUID(),
      userId: req.user?.id,
    };
    requestContext.run(ctx, next);   // all downstream code shares this context
  });

  // Helper to get context anywhere without imports or parameters:
  function getRequestContext(): RequestContext {
    const ctx = requestContext.getStore();
    if (!ctx) throw new Error('getRequestContext() called outside request context');
    return ctx;
  }

  // Deep inside your service layer — no requestId parameter needed:
  async function chargeUser(amount: number): Promise<void> {
    const { requestId, userId } = getRequestContext();
    logger.info({ requestId, userId, amount }, 'Charging user');
    // ... DB call ...
  }


  OPENTELEMETRY — THE VENDOR-NEUTRAL STANDARD
  ─────────────────────────────────────────────
  Install: npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node

  OpenTelemetry (OTel) is the CNCF standard for traces AND metrics.
  It instruments express, http, pg, redis, etc. automatically.

  const { NodeSDK } = require('@opentelemetry/sdk-node');
  const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({ url: 'http://jaeger:4318/v1/traces' }),
    instrumentations: [getNodeAutoInstrumentations()],
  });
  sdk.start();

  Jaeger  → open-source trace visualizer (self-hosted)
  Zipkin  → another popular open-source option
  Datadog → commercial; receives OTel traces via OTLP

  Once connected, Jaeger shows a flame chart of every request:
    POST /transfer ────────────────────── 340ms
      auth middleware ──── 12ms
      DB SELECT balance ── 88ms
      fraud-check API ──── 180ms
      DB INSERT transfer ─ 45ms
      BullMQ publish ───── 15ms
*/

// Simulating AsyncLocalStorage pattern (inline polyfill for environments without @types/node):
// In a real project: import { AsyncLocalStorage } from 'node:async_hooks';
//                    import { randomUUID } from 'node:crypto';

function makeUUID(): string {
  // Simple UUID v4 without crypto dependency:
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Minimal AsyncLocalStorage stand-in for this demo file:
class AsyncLocalStorage<T> {
  private store: T | undefined;

  run<R>(store: T, fn: (...args: unknown[]) => R): R {
    const prev = this.store;
    this.store = store;
    try {
      return fn();
    } finally {
      this.store = prev;
    }
  }

  getStore(): T | undefined {
    return this.store;
  }
}

interface RequestCtx {
  requestId: string;
  userId?:   string;
}

const als = new AsyncLocalStorage<RequestCtx>();

function getCtx(): RequestCtx {
  return als.getStore() ?? { requestId: "no-context" };
}

function contextLog(level: string, msg: string, extra: Record<string, unknown> = {}): void {
  const ctx = getCtx();
  console.log(JSON.stringify({ level, requestId: ctx.requestId, userId: ctx.userId, ...extra, msg }));
}

async function deepServiceCall(): Promise<void> {
  // No requestId parameter — reads from ALS automatically:
  contextLog("info", "DB query executed", { query: "SELECT balance", durationMs: 42 });
}

async function handleRequest(userId: string): Promise<void> {
  contextLog("info", "Request started");
  await deepServiceCall();
  contextLog("info", "Request completed", { status: 200 });
}

// Simulate two concurrent requests with isolated contexts:
const run = async () => {
  await Promise.all([
    als.run({ requestId: makeUUID(), userId: "usr_1" }, () => handleRequest("usr_1")),
    als.run({ requestId: makeUUID(), userId: "usr_2" }, () => handleRequest("usr_2")),
  ]);
};
run();

// ───────────────────────────────────────────────────────────────
// 6. Health Checks
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. Health Checks ===");

/*
  LIVENESS vs READINESS — two very different questions
  ──────────────────────────────────────────────────────

  LIVENESS  →  GET /health
    Question: Is the process alive and not deadlocked?
    Kubernetes uses this as the liveness probe.
    If it fails → Kubernetes RESTARTS the pod.
    Should be: always fast (< 50ms), never touch external dependencies.

    Response:
      { "status": "ok" }   HTTP 200
    or on deadlock/crash:
      HTTP 500 (or the process itself is dead and doesn't respond)

  READINESS  →  GET /health/ready
    Question: Is the service ready to serve traffic?
    Kubernetes uses this as the readiness probe.
    If it fails → Kubernetes REMOVES the pod from the load balancer (no restart).
    This is what you check BEFORE routing traffic (startup, deploys).

    Checks to include:
      • Database: can we run a SELECT 1?
      • Redis: can we ping it?
      • BullMQ: is the worker connected?
      • External dependencies: any critical third-party APIs?

    Response:
      HTTP 200
      {
        "status": "ok",
        "checks": {
          "postgres": { "status": "ok",       "latencyMs": 3  },
          "redis":    { "status": "ok",       "latencyMs": 1  },
          "queue":    { "status": "degraded", "latencyMs": 0  }
        }
      }

    HTTP 503 when status is "degraded" or "down":
      {
        "status": "down",
        "checks": {
          "postgres": { "status": "down", "error": "ECONNREFUSED" },
          "redis":    { "status": "ok",   "latencyMs": 1 }
        }
      }

  RESPONSE TIME REQUIREMENT
  ──────────────────────────
  Health check endpoints MUST respond in < 100ms.
  Use connection pool pings, not full queries.
  Set a short timeout (e.g., 2s) on each dependency check to avoid
  blocking the response when a dependency hangs.

  DO NOT:
    ✗  Run migrations or heavy computation in health checks
    ✗  Check non-critical services (optional third parties) in readiness
    ✗  Log every health check hit (use nginx/ALB access log filtering)

  KUBERNETES PROBE CONFIG (reference)
  ─────────────────────────────────────
  livenessProbe:
    httpGet: { path: /health, port: 3000 }
    initialDelaySeconds: 10
    periodSeconds: 30
    failureThreshold: 3      # 3 failures → restart pod

  readinessProbe:
    httpGet: { path: /health/ready, port: 3000 }
    initialDelaySeconds: 5
    periodSeconds: 10
    failureThreshold: 2      # 2 failures → remove from load balancer
*/

// Simulated health check implementation (no real DB):
type HealthStatus = "ok" | "degraded" | "down";

interface CheckResult {
  status:    HealthStatus;
  latencyMs: number;
  error?:    string;
}

interface HealthReport {
  status: HealthStatus;
  checks: Record<string, CheckResult>;
}

async function checkDependency(
  name: string,
  fn: () => Promise<void>,
  timeoutMs = 2000
): Promise<CheckResult> {
  const start = Date.now();
  try {
    await Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeoutMs)
      ),
    ]);
    return { status: "ok", latencyMs: Date.now() - start };
  } catch (err) {
    return {
      status:    "down",
      latencyMs: Date.now() - start,
      error:     err instanceof Error ? err.message : String(err),
    };
  }
}

async function getReadinessReport(): Promise<HealthReport> {
  const [postgres, redis] = await Promise.all([
    checkDependency("postgres", async () => { /* await pool.query('SELECT 1') */ }),
    checkDependency("redis",    async () => { /* await redisClient.ping() */ }),
  ]);

  const checks = { postgres, redis };
  const statuses = Object.values(checks).map((c) => c.status);
  const overallStatus: HealthStatus =
    statuses.every((s) => s === "ok") ? "ok"
    : statuses.some((s) => s === "down") ? "down"
    : "degraded";

  return { status: overallStatus, checks };
}

getReadinessReport().then((report) => {
  const httpStatus = report.status === "ok" ? 200 : 503;
  console.log(`GET /health/ready → HTTP ${httpStatus}`);
  console.log(JSON.stringify(report, null, 2));
});

// ───────────────────────────────────────────────────────────────
// 7. Graceful Shutdown
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. Graceful Shutdown ===");

/*
  WHY GRACEFUL SHUTDOWN MATTERS
  ──────────────────────────────
  Kubernetes sends SIGTERM before killing a pod (on deploy, scale-down, node eviction).
  If your process exits immediately on SIGTERM:
    • In-flight HTTP requests return connection reset errors to clients
    • DB transactions may be left open or rolled back mid-write
    • BullMQ job is interrupted and may be re-queued (duplicate processing)
    • Redis pipeline is abandoned

  Goal: stop accepting NEW work, finish EXISTING work, clean up resources.

  THE CORRECT SHUTDOWN SEQUENCE
  ──────────────────────────────
  1. Catch SIGTERM / SIGINT
  2. Stop the HTTP server from accepting new connections
       server.close(callback)   — existing connections finish; no new ones accepted
  3. Wait for in-flight requests to complete
       Track with a counter: increment on request start, decrement on response end.
       Poll/resolve when counter reaches 0.
  4. Close DB connection pool
       await prisma.$disconnect()   or   await pool.end()
  5. Close Redis client
       await redisClient.quit()
  6. Drain BullMQ workers (stop accepting new jobs; finish current job)
       await worker.close()
  7. Exit with code 0
       process.exit(0)

  FORCE-KILL TIMEOUT
  ───────────────────
  If shutdown takes longer than 30s, something is stuck.
  Set a hard timeout that calls process.exit(1) so the pod does not hang forever:

    setTimeout(() => {
      logger.fatal('Shutdown timeout — forcing exit');
      process.exit(1);
    }, 30_000);

  This timeout must be shorter than Kubernetes' terminationGracePeriodSeconds (default 30s).
  Set terminationGracePeriodSeconds: 60 and your app timeout at 55s for a safe margin.

  DOUBLE SIGNAL HANDLING
  ───────────────────────
  Use a flag to prevent re-entrant shutdown if two signals arrive:
    let isShuttingDown = false;
    async function shutdown(signal: string) {
      if (isShuttingDown) return;
      isShuttingDown = true;
      // ... shutdown steps ...
    }
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));   // Ctrl+C in dev
*/

// Demonstrating the shutdown pattern structure (safe simulation — no real server):
interface MockServer {
  close: (cb: () => void) => void;
}

function buildGracefulShutdown(
  server:   MockServer,
  services: { name: string; close: () => Promise<void> }[]
): () => Promise<void> {

  let inFlightCount = 0;
  let isShuttingDown = false;

  // In a real app these would wrap Express middleware:
  const incrementInFlight = () => { inFlightCount++; };
  const decrementInFlight = () => { inFlightCount--; };
  void incrementInFlight; // suppress unused warning in this simulation
  void decrementInFlight;

  const waitForInFlight = (timeoutMs: number): Promise<void> =>
    new Promise((resolve, reject) => {
      const deadline = Date.now() + timeoutMs;
      const poll = () => {
        if (inFlightCount === 0) return resolve();
        if (Date.now() > deadline)
          return reject(new Error(`${inFlightCount} requests still in-flight at timeout`));
        setTimeout(poll, 100);
      };
      poll();
    });

  return async function shutdown(): Promise<void> {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log("[shutdown] Received signal — beginning graceful shutdown");

    // Force-kill timeout (in real app: process.exit(1); forceExit.unref()):
    const forceExit = setTimeout(() => {
      console.error("[shutdown] Timeout exceeded — forcing exit");
      // process.exit(1);  // uncomment in production
    }, 30_000);

    // Step 1: stop accepting new HTTP connections:
    await new Promise<void>((resolve) => server.close(resolve));
    console.log("[shutdown] HTTP server closed");

    // Step 2: wait for in-flight requests:
    try {
      await waitForInFlight(25_000);
      console.log("[shutdown] All in-flight requests completed");
    } catch (err) {
      console.warn("[shutdown] In-flight wait failed:", (err as Error).message);
    }

    // Step 3: close external services in parallel:
    await Promise.allSettled(
      services.map(async (svc) => {
        await svc.close();
        console.log(`[shutdown] ${svc.name} closed`);
      })
    );

    console.log("[shutdown] Shutdown complete — exiting with code 0");
    clearTimeout(forceExit);
    // process.exit(0);  // uncomment in a real app
  };
}

// Wire up signal handlers:
const mockServer: MockServer = { close: (cb) => { setTimeout(cb, 10); } };
const mockServices = [
  { name: "Postgres",  close: async () => { /* await prisma.$disconnect() */ } },
  { name: "Redis",     close: async () => { /* await redis.quit() */ } },
  { name: "BullMQ",   close: async () => { /* await worker.close() */ } },
];

const shutdown = buildGracefulShutdown(mockServer, mockServices);

// In production:
// process.on('SIGTERM', shutdown);
// process.on('SIGINT',  shutdown);

// Simulate for demo:
shutdown().then(() => console.log("(demo shutdown sequence completed)"));

// ───────────────────────────────────────────────────────────────
// 8. Error Tracking with Sentry
// ───────────────────────────────────────────────────────────────

console.log("\n=== 8. Error Tracking with Sentry ===");

/*
  WHY SENTRY IN ADDITION TO LOGS?
  ─────────────────────────────────
  Logs tell you an error happened. Sentry tells you:
    • Exactly which line of code threw (with source maps)
    • How many users were affected
    • Whether this error is new or a regression
    • Which deploy introduced it (release tracking)
    • Breadcrumbs: the sequence of events leading up to the crash
    • User context: who was affected

  Install: npm install @sentry/node

  INITIALIZATION (call before importing Express)
  ────────────────────────────────────────────────
  import * as Sentry from '@sentry/node';

  Sentry.init({
    dsn: process.env.SENTRY_DSN,          // project-specific URL from Sentry dashboard
    environment: process.env.NODE_ENV,    // 'production' | 'staging' | 'development'
    release: process.env.COMMIT_SHA,      // links errors to the exact deploy
    tracesSampleRate: 0.1,               // capture 10% of requests as performance traces
  });

  EXPRESS INTEGRATION (automatic error capture)
  ──────────────────────────────────────────────
  // After routes, before your error handler:
  app.use(Sentry.Handlers.requestHandler());    // attaches user context to each request
  app.use(Sentry.Handlers.tracingHandler());   // adds performance tracing

  // Must be the FIRST error handler:
  app.use(Sentry.Handlers.errorHandler());

  // Then your custom error handler:
  app.use((err, req, res, next) => {
    logger.error({ err }, 'Unhandled error');
    res.status(500).json({ error: 'Internal server error' });
  });

  MANUAL CAPTURE — for caught errors you still want tracked
  ──────────────────────────────────────────────────────────
  try {
    await externalPaymentAPI.charge(amount);
  } catch (err) {
    // Log locally AND send to Sentry:
    logger.error({ err }, 'Payment API failed');
    Sentry.captureException(err);
    throw new AppError('Payment failed', 502);
  }

  BREADCRUMBS — sequenced events leading to an error
  ────────────────────────────────────────────────────
  Sentry.addBreadcrumb({ category: 'auth', message: 'User logged in', level: 'info' });
  Sentry.addBreadcrumb({ category: 'payment', message: 'Charge initiated', data: { amount } });
  // If an error occurs after this, the breadcrumb trail shows the path taken.

  USER CONTEXT — identify who was affected
  ─────────────────────────────────────────
  Sentry.setUser({ id: req.user.id, email: req.user.email });
  // Sentry dashboard shows: "372 users affected by this error"

  RELEASE TRACKING — link errors to deploys
  ──────────────────────────────────────────
  In CI/CD, set COMMIT_SHA env var to the git SHA.
  Sentry shows a "first seen in release abc123" marker.
  This tells you whether an error is old or was introduced by today's deploy.

  FILTERING — avoid alert fatigue
  ─────────────────────────────────
  Sentry.init({
    beforeSend(event) {
      // Don't send 404s or validation errors to Sentry:
      if (event.exception?.values?.[0]?.value?.includes('Not found')) return null;
      return event;
    },
  });

  WHAT SENTRY DOES NOT REPLACE
  ──────────────────────────────
  ✗  Sentry is NOT a log aggregation system — don't use it for info/debug logs
  ✗  Sentry is NOT a metrics system — use Prometheus for request rates
  ✗  Sentry errors are sampled in high-traffic systems — not 100% guaranteed capture
*/

// Simulating the Sentry capture pattern (no real SDK in this file):
class MockSentry {
  private static user: Record<string, string> | null = null;
  private static breadcrumbs: string[] = [];

  static setUser(user: Record<string, string>): void {
    this.user = user;
  }

  static addBreadcrumb(crumb: { category: string; message: string }): void {
    this.breadcrumbs.push(`[${crumb.category}] ${crumb.message}`);
  }

  static captureException(err: unknown): string {
    const eventId = makeUUID().slice(0, 8);
    console.log(`[Sentry] Captured exception (id: ${eventId})`);
    console.log(`  Error:       ${err instanceof Error ? err.message : String(err)}`);
    console.log(`  User:        ${JSON.stringify(this.user)}`);
    console.log(`  Breadcrumbs: ${this.breadcrumbs.join(" → ")}`);
    return eventId;
  }
}

MockSentry.setUser({ id: "usr_42", email: "bob@example.com" });
MockSentry.addBreadcrumb({ category: "auth",    message: "User authenticated" });
MockSentry.addBreadcrumb({ category: "payment", message: "Transfer of $500 initiated" });

try {
  throw new Error("Insufficient funds — account balance: $120");
} catch (err) {
  MockSentry.captureException(err);
}

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice ===");

/*
  Q1: What is the difference between a liveness probe and a readiness probe?

  Liveness probe (GET /health):
    Answers: "Is the process alive?"
    If it fails → Kubernetes RESTARTS the pod.
    Must never check external dependencies — only confirm the process loop is running.
    Should always respond in < 50ms.

  Readiness probe (GET /health/ready):
    Answers: "Is this pod ready to receive traffic?"
    If it fails → Kubernetes REMOVES the pod from the load balancer (no restart).
    Should check: DB reachable, Redis reachable, queue worker connected.
    Returns { status: 'ok'|'degraded'|'down', checks: {...} } and HTTP 200 or 503.

  A pod that is live but not ready stays running but gets no traffic — useful
  during startup, deploy warm-up, or partial dependency outages.


  Q2: Why is `console.log('User logged in: ' + email)` bad in production?

  Multiple problems:
    (a) SECURITY / COMPLIANCE: logs PII (email) in plaintext — violates GDPR/CCPA.
        If logs are shipped to a third-party aggregator, the email is now shared.
    (b) UNSTRUCTURED: concatenated string cannot be queried or filtered.
        You cannot ask "how many logins in the last hour?" without parsing.
    (c) NO LOG LEVEL: treated as info even if it should be debug; no severity.
    (d) NO CONTEXT: no requestId, no timestamp beyond what stdout appends,
        no correlation to a trace.
    (e) SYNCHRONOUS in some Node environments; can block the event loop briefly.

  Correct version:
    logger.info({ userId: req.user.id, action: 'login' }, 'User authenticated');
    // logs ID (not email), structured fields, correct level, auto timestamp.


  Q3: Your API has a memory leak. Which observability pillar helps detect it
      and what metric do you watch?

  Pillar: METRICS
  Metric: process_resident_memory_bytes (provided automatically by prom-client's
          collectDefaultMetrics())

  Workflow:
    1. Grafana alert fires: process_resident_memory_bytes > 500 MB
    2. Open Grafana dashboard — the metric shows steady upward slope over 6 hours
       (healthy apps plateau; leaks grow monotonically).
    3. Enable heap profiling in the suspect build, generate a heap snapshot.
    4. Analyze in Chrome DevTools to find what object is accumulating.

  Also watch: nodejs_active_handles_total — a growing handle count means
  unclosed connections or timers.


  Q4: How do you pass a request ID through multiple async functions
      without passing it as a parameter everywhere?

  Use AsyncLocalStorage from node:async_hooks.

    const als = new AsyncLocalStorage<{ requestId: string }>();

    // In middleware — run the request handler inside the ALS store:
    app.use((req, res, next) => {
      als.run({ requestId: req.headers['x-request-id'] ?? randomUUID() }, next);
    });

    // Anywhere in the async call chain — no parameter needed:
    function getCurrentRequestId(): string {
      return als.getStore()?.requestId ?? 'no-context';
    }

  AsyncLocalStorage propagates through await, callbacks, and Promises
  automatically. It is the standard Node.js solution for request-scoped context.


  Q5: Your server gets SIGTERM. What is the correct sequence of shutdown steps?

    1. Set isShuttingDown = true (prevent re-entrant shutdown on double signal)
    2. Start a 30s force-kill timer: setTimeout(() => process.exit(1), 30_000)
    3. server.close()   — stop accepting NEW HTTP connections
    4. Wait for in-flight requests to drain (poll inFlightCount === 0)
    5. Close DB connection pool  — await prisma.$disconnect() / pool.end()
    6. Close Redis client        — await redis.quit()
    7. Drain BullMQ workers      — await worker.close()
    8. clearTimeout(forceKillTimer)
    9. process.exit(0)

  The force-kill timer in step 2 ensures the process cannot hang indefinitely.
  Always set it shorter than Kubernetes' terminationGracePeriodSeconds.
*/

// ───────────────────────────────────────────────────────────────
// REFERENCE CARD (runDemo)
// ───────────────────────────────────────────────────────────────

function runDemo(): void {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║          BACKEND 19 — OBSERVABILITY REFERENCE CARD               ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  THREE PILLARS                                                    ║
║    Logs    → what happened       (Pino → Datadog/Loki)           ║
║    Metrics → how much/how fast   (prom-client → Prometheus)      ║
║    Traces  → where time was spent (OTel → Jaeger/Datadog APM)    ║
║                                                                   ║
║  PINO QUICK START                                                 ║
║    const logger = pino({ level: 'info' })                        ║
║    logger.info({ userId, action }, 'message')   // structured    ║
║    logger.child({ requestId })                  // child logger   ║
║                                                                   ║
║  LOG LEVELS  trace < debug < info < warn < error < fatal         ║
║                                                                   ║
║  NEVER LOG   passwords · tokens · emails · SSNs · full bodies    ║
║                                                                   ║
║  PROM-CLIENT TYPES                                                ║
║    Counter   → monotonic count    (total requests, errors)       ║
║    Gauge     → up/down value      (connections, queue depth)     ║
║    Histogram → duration buckets   (p50/p95/p99 latency)         ║
║                                                                   ║
║  CORRELATION ID                                                   ║
║    Generate at edge: randomUUID()                                 ║
║    Propagate via: AsyncLocalStorage (no prop drilling)           ║
║    Echo back:  res.setHeader('x-request-id', requestId)          ║
║                                                                   ║
║  HEALTH CHECKS                                                    ║
║    /health       liveness  → process alive?  always HTTP 200     ║
║    /health/ready readiness → DB+Redis ok?    200 or 503          ║
║    Response must be < 100ms                                       ║
║                                                                   ║
║  GRACEFUL SHUTDOWN SEQUENCE                                       ║
║    SIGTERM → stop accepting → drain requests → close DB          ║
║    → close Redis → drain queue → exit(0) | 30s timeout exit(1)  ║
║                                                                   ║
║  SENTRY                                                           ║
║    Sentry.init({ dsn, environment, release })                    ║
║    Sentry.captureException(err)   // for caught errors           ║
║    Sentry.setUser({ id })         // identify affected users     ║
║    Sentry.addBreadcrumb(...)      // trail leading to crash      ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
`);
}

export default runDemo;

runDemo();
