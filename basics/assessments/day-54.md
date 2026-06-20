# Day 54 Assessment — Structured Logging · Health Checks · Observability · Graceful Shutdown

**Theme:** You are the on-call engineer at a startup that just had its first production incident. The root cause took 4 hours to find because logs were unstructured `console.log` strings and there was no health check. You're implementing proper observability before the next incident.

---

### Q1 — Structured vs Unstructured Logs ⭐

**Scenario:** Your codebase is full of `console.log('User alice logged in at 14:23')` calls. Your new logging platform (Datadog) can barely search these. A colleague asks why you want to change them.

**Task:** Contrast structured and unstructured logs with concrete examples. Explain what a log aggregator can do with structured logs that it cannot do with plain strings.

**Acceptance Criteria:**
- [ ] Shows the unstructured example: `console.log('User alice logged in at 14:23')` — a single opaque string
- [ ] Shows the structured alternative: `logger.info({ userId: 'alice', event: 'login', timestamp: new Date().toISOString() }, 'User logged in')` — JSON object
- [ ] Explains what an aggregator can do with structured logs: filter by `userId`, count by `event` type, alert when `event === 'failed_payment'` occurs more than N times per minute
- [ ] Explains the impossibility with unstructured: regex parsing is fragile, breaks when someone changes the log message text
- [ ] Notes that structured logs are machine-readable by default — no parsing step needed
- [ ] Mentions cost: structured logs enable field-level indexing, which reduces storage and query costs vs full-text indexing

---

### Q2 — Log Levels ⭐

**Scenario:** You're reviewing a PR where a colleague added `logger.debug()` calls on every request that log the full request body. In production, this generates 50 GB of logs per day.

**Task:** List the standard log levels from lowest to highest severity. Explain what each is used for. State which to use in production and why. Explain what `LOG_LEVEL=debug` does in Pino.

**Acceptance Criteria:**
- [ ] Lists levels in order: trace → debug → info → warn → error → fatal
- [ ] Explains `trace`: extremely fine-grained, loop iterations, internal state — development only
- [ ] Explains `debug`: diagnostic information useful during development and troubleshooting — not for production default
- [ ] Explains `info`: normal application events (request received, user logged in, job started) — production baseline
- [ ] Explains `warn`: something unexpected but recoverable (deprecated API used, slow query, retried operation)
- [ ] Explains `error`: operation failed, requires investigation (DB query failed, external API timeout)
- [ ] Explains `fatal`: application is about to crash (unrecoverable error)
- [ ] States production default: `info` and above — debug and trace are too noisy (performance + cost)
- [ ] Explains `LOG_LEVEL=debug` in Pino: overrides the minimum level, enabling all levels including debug and trace at runtime without code changes

---

### Q3 — Pino vs console.log ⭐

**Scenario:** A senior engineer says "just use Pino, not console.log." The team asks why.

**Task:** Give 3 concrete reasons Pino is better than `console.log` for production applications. Explain why logging speed matters. Explain what `pino-pretty` does and why it doesn't slow down production.

**Acceptance Criteria:**
- [ ] Reason 1: structured JSON output natively — every log line is a valid JSON object parseable by aggregators
- [ ] Reason 2: performance — Pino is 5–10x faster than Winston and ~20x faster than Bunyan in benchmarks; `console.log` is synchronous and slow
- [ ] Reason 3: `pino-pretty` for development — human-readable colored output without changing application code; disabled in production
- [ ] Explains why speed matters: logging happens on every request; slow logging adds latency to every API call; at 1000 req/s, 1ms logging overhead = 1 additional second of cumulative delay per second
- [ ] Explains how `pino-pretty` doesn't slow production: it's a separate transport process — in production, Pino writes raw JSON to stdout; `pino-pretty` is piped locally during development only
- [ ] Notes additional Pino feature: child loggers (per-request context) with zero-copy semantics

---

### Q4 — Health Check Endpoints ⭐

**Scenario:** Your Kubernetes cluster keeps restarting your pod every 5 minutes even though the app is running fine. Investigation reveals there's no health check endpoint configured.

**Task:** Explain `GET /health` (liveness) vs `GET /health/ready` (readiness). Explain how Kubernetes uses each probe. Explain why a 503 from the readiness endpoint is correct behavior (not an error).

**Acceptance Criteria:**
- [ ] Defines liveness probe: "is the process alive and not deadlocked?" — returns 200 if the HTTP server can respond at all
- [ ] Defines readiness probe: "can this instance serve production traffic?" — checks DB connectivity, Redis, and any critical dependencies
- [ ] Explains Kubernetes liveness action: if liveness returns non-200, Kubernetes restarts the pod
- [ ] Explains Kubernetes readiness action: if readiness returns non-200, Kubernetes removes the pod from the Service load balancer (stops sending traffic) without restarting it
- [ ] Explains why 503 from readiness is correct: the pod is alive but not ready (e.g., DB connection lost temporarily) — removing it from the load balancer is the right response, not a restart
- [ ] Notes the liveness/readiness split prevents cascading restarts: if DB goes down, all pods return readiness 503 but stay alive — when DB recovers, they become ready again without restarts
- [ ] Mentions `startup` probe (third Kubernetes probe type): for slow-starting apps — similar to liveness but only active during startup phase

---

### Q5 — Request ID Correlation ⭐⭐

**Scenario:** A customer reports "my order failed at around 2 PM." You have 10,000 log lines from 2 PM across 4 service instances. Without a request ID, finding their specific request is nearly impossible.

**Task:** Explain why `requestId` in every log line is essential. Show how to generate one, attach it to a logger with Pino child loggers, and explain what `pino-http` does automatically.

**Acceptance Criteria:**
- [ ] Explains the value: filter all logs by `requestId` to see the complete lifecycle of exactly one request across all services and middleware
- [ ] Shows generation: `const requestId = crypto.randomUUID()` (Node 14.17+ built-in, no dependencies)
- [ ] Shows Pino child logger: `const reqLog = logger.child({ requestId, userId: req.user?.id })` — all subsequent log calls include these fields
- [ ] Shows attaching to request: `req.log = reqLog` so middleware and route handlers share the same logger
- [ ] Explains `pino-http`: middleware that automatically generates a `requestId`, creates a child logger per request, logs request start and response finish, including method, URL, status, and duration
- [ ] Notes that the `requestId` should also be returned in the response headers (`X-Request-Id`) so clients can report it when filing support tickets
- [ ] Mentions propagating `requestId` to downstream service calls (pass as `X-Request-Id` header)

---

### Q6 — Request Logging Middleware ⭐⭐

**Scenario:** Your team wants to log every incoming request. One engineer logs on request start, another on response finish. They argue about which is correct.

**Task:** Explain why you need BOTH. Show what to log on request start and response finish. Show how to attach a `finish` listener. Explain what each log catches that the other misses.

**Acceptance Criteria:**
- [ ] Shows request start log: `logger.info({ method: req.method, url: req.url, requestId }, 'Request received')` — at the top of middleware
- [ ] Shows response finish listener: `res.on('finish', () => logger.info({ method, url, status: res.statusCode, duration: Date.now() - start, requestId }, 'Request completed'))`
- [ ] Calculates duration: `const start = Date.now()` at request start, `Date.now() - start` in the finish handler
- [ ] Explains what start log catches: requests that never complete (hung connections, network drops, very long-running requests) — these never emit a 'finish' event
- [ ] Explains what finish log catches: response time, final status code (set by route handler), actual completion
- [ ] Shows `res.on('finish')` syntax correctly — 'finish' fires when response is fully sent
- [ ] Notes 'close' event fires if the connection closes before 'finish' — for detecting aborted requests

---

### Q7 — Error Logging ⭐⭐

**Scenario:** Your global error handler currently does `console.error(err.message)` and returns `res.status(500).json({ error: err.message, stack: err.stack })`. The security team says this is dangerous.

**Task:** Show the correct error log call using Pino (log the full Error object). Show the correct response to the client. Explain why returning stack traces to clients is a security issue.

**Acceptance Criteria:**
- [ ] Shows: `logger.error({ err, requestId, userId: req.user?.id }, 'Unhandled error in request handler')`
- [ ] Explains Pino's `err` serializer: automatically captures `message`, `stack`, `type`, and any custom properties from the Error object
- [ ] Shows safe client response: `res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' } })`
- [ ] Does NOT include `stack` or internal error details in the client response
- [ ] Explains security risk of returning stack traces: reveals file paths, framework versions, library versions, and internal architecture — all useful for attackers planning targeted exploits
- [ ] Explains UX principle: generic error message to user (they can't fix the stack trace anyway); detailed error in logs (you can investigate)
- [ ] Notes the `requestId` in both the log AND the client response: customer provides `requestId` to support, support looks it up in logs

---

### Q8 — Graceful Shutdown Sequence ⭐⭐

**Scenario:** Kubernetes sends `SIGTERM` to your Node.js pod to shut it down for a rolling deploy. Currently your process exits immediately, causing 502 errors for in-flight requests.

**Task:** Describe the correct graceful shutdown sequence in numbered steps. Explain why the order matters. Show the `SIGTERM` handler. Explain `process.exit(0)` vs `process.exit(1)`.

**Acceptance Criteria:**
- [ ] Step 1: receive SIGTERM, log "Shutdown initiated", stop accepting new HTTP connections: `server.close(callback)`
- [ ] Step 2: wait for in-flight requests to complete — `server.close()` does this automatically (callback fires when last connection closes)
- [ ] Step 3: close DB connection pool: `await prisma.$disconnect()` or `pool.end()`
- [ ] Step 4: exit cleanly: `process.exit(0)`
- [ ] Explains why DB must close AFTER requests: in-flight requests may still be executing DB queries — closing the pool first causes those queries to fail
- [ ] Shows forced timeout: if step 2 takes longer than 10–30 seconds, `setTimeout(() => process.exit(1), 30000)` forces exit
- [ ] Explains `process.exit(0)`: successful clean shutdown — tells the OS and orchestrator the process exited normally
- [ ] Explains `process.exit(1)`: abnormal/error exit — orchestrator may treat this as a crash and restart the pod

---

### Q9 — Log Sampling ⭐⭐

**Scenario:** Your API handles 10,000 requests per second. Full request logging would generate 864 million log lines per day at ~0.5 KB each — about 430 GB. At $0.50/GB log ingestion, that's $215/day just for logging.

**Task:** Explain log sampling. Show a sampling implementation that logs 100% of errors and slow requests, but only 10% of normal requests.

**Acceptance Criteria:**
- [ ] Explains log sampling: deliberately skip logging some percentage of successful/fast requests to reduce volume and cost
- [ ] Shows the check: `if (res.statusCode >= 400 || duration > 1000 || Math.random() < 0.10) { log the request }`
- [ ] Correctly logs 100% of errors: `res.statusCode >= 400` condition
- [ ] Correctly logs 100% of slow requests: `duration > 1000` (>1 second) condition
- [ ] Correctly logs ~10% of normal requests: `Math.random() < 0.10`
- [ ] Notes what you lose: you cannot reconstruct exact traffic patterns from sampled logs — p50 latency estimates become less precise
- [ ] Notes what you keep: all errors (full visibility), performance outliers (full visibility), cost reduction of ~90% on logging bills
- [ ] Mentions that trace IDs can mark a "sampled" trace so all logs for that request are kept even if it passes the sampler

---

### Q10 — Distributed Tracing Context ⭐⭐

**Scenario:** Your system has 4 microservices. A customer reports slow checkouts. Your logs show each service was fast individually. The slowness is somewhere in the chain between services — but you can't tell where without distributed tracing.

**Task:** Explain what a trace ID is and how it differs from a request ID. Explain what OpenTelemetry is. Explain why logs alone cannot show cross-service call chains.

**Acceptance Criteria:**
- [ ] Defines trace ID: a globally unique ID generated at the entry point (API gateway or first service) and propagated to every downstream service via HTTP headers
- [ ] Defines request ID: per-service unique ID — a single trace creates N request IDs across N services
- [ ] Explains propagation mechanism: pass `X-Trace-Id` (or `traceparent` in W3C format) as a header on all outgoing HTTP calls; each service includes it in its own logs
- [ ] States the limitation of logs alone: logs show what each service did independently — they cannot show "Service A called Service B which called Service C, total chain duration was 2.3s"
- [ ] Explains what distributed tracing adds: a visual waterfall of every service call in a trace — spans show start time, duration, parent-child relationships
- [ ] Defines OpenTelemetry: an open-source observability framework providing a unified SDK for generating traces, metrics, and logs — vendor-neutral, exports to Jaeger, Zipkin, Datadog, etc.
- [ ] Notes that OpenTelemetry auto-instrumentation can trace Express routes and HTTP calls with zero code changes

---

### Q11 — Log Aggregation Pipeline ⭐⭐

**Scenario:** A new engineer asks "where do our log lines actually go?" They see `logger.info(...)` in the code but don't know how it ends up searchable in Datadog.

**Task:** Trace the complete path of a log line from process to Datadog. Explain why writing to stdout is correct. Explain what structured JSON enables in the aggregator.

**Acceptance Criteria:**
- [ ] Traces the pipeline: Pino writes JSON to stdout → Docker captures stdout via its log driver → CloudWatch/Datadog agent reads Docker logs → ships to Datadog/ELK/CloudWatch Logs
- [ ] Explains why stdout is correct: the 12-factor app principle — processes should not manage their own log files; the platform (Docker, systemd) handles log routing
- [ ] Contrasts with file logging: writing to files requires log rotation, disk space management, and a separate log shipping agent reading files — more complexity
- [ ] Explains what structured JSON enables: Datadog auto-parses JSON fields into searchable facets — `userId:alice` becomes a filterable dimension, not just a substring to grep
- [ ] Explains field-level alerting: `event:failed_payment count > 10 in 5 minutes` → PagerDuty alert — impossible to set up reliably on unstructured strings
- [ ] Notes that `console.log` also writes to stdout — Pino just does it faster and in JSON format
- [ ] Mentions log retention: aggregators charge per GB and per retention period — structured logs with sampling help control cost

---

### Q12 — Alert Design ⭐⭐⭐

**Scenario:** You're setting up monitoring for a payment API. Your on-call rotation gets woken up at 3 AM for alerts that are either meaningless (heap memory at 60%) or too late (server already down). You need to redesign the alerting strategy.

**Task:** Define what makes an alert meaningful vs noisy. Design 3 meaningful alerts for the payment API: error rate, response time, and a business-logic alert.

**Acceptance Criteria:**
- [ ] Defines meaningful alert: has business impact, actionable, points to a specific problem an engineer can investigate
- [ ] Defines noisy alert: fires frequently with no actionable response, no clear business impact (e.g., CPU at 50%)
- [ ] Alert 1 — error rate: `5xx error rate > 1% of requests sustained for 5 minutes` — fires only when users are experiencing widespread errors, not on a single transient error
- [ ] Alert 2 — response time: `p99 latency > 2 seconds for 5 minutes` — user experience degradation, not just a single slow request
- [ ] Alert 3 — business logic: `payment failures > 5 in 1 minute` OR `auth failure rate > 20 attempts from single IP in 1 minute` (brute force detection)
- [ ] Explains why `heap memory > 50%` is noisy: Node.js V8 manages memory dynamically, 50% heap usage is often normal; alert instead on OOM kills or sustained heap growth trend
- [ ] States the alert design principle: every alert must have a linked runbook — if you can't write a runbook for it, the alert is too vague to be useful

---

### Q13 — Pino Transport in Production ⭐⭐⭐

**Scenario:** Your app currently uses `pino-pretty` in all environments. In a load test, you discover logging is adding 12ms latency per request in production — `pino-pretty` is the culprit.

**Task:** Explain why `pino-pretty` is slow. Show the environment-based transport configuration that uses `pino-pretty` only in development. Explain why this is better than two separate logging configs.

**Acceptance Criteria:**
- [ ] Explains why `pino-pretty` is slow: it formats JSON into colored human-readable text synchronously, applying timestamp formatting, color codes, and pretty-printing — much more CPU work than writing raw JSON
- [ ] Shows environment-based config:
  ```js
  const transport = process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined
  const logger = pino({ level: 'info' }, transport ? pino.transport(transport) : undefined)
  ```
- [ ] Explains why one config is better than two: no risk of accidentally using the wrong config file; same logger initialization code path in all environments; easier to audit
- [ ] Notes that in production, Pino writes raw JSON directly to stdout with no formatting — this is the fast path (near-zero overhead)
- [ ] Notes that `pino-pretty` can also be run as a pipe: `node app.js | pino-pretty` — the formatting happens in a separate process, not adding latency to the app
- [ ] Recommends installing `pino-pretty` as a devDependency only (`npm install --save-dev pino-pretty`)

---

### Q14 — Health Check Dependencies ⭐⭐⭐

**Scenario:** Your `GET /health/ready` currently just returns 200. Your app goes into a degraded state when Redis is down (caching stops working but requests still partially succeed). Kubernetes keeps routing traffic even though half the features are broken.

**Task:** Show a dependency-checking readiness endpoint that checks DB and Redis. Add per-check timeouts. Show the response structure. State the correct HTTP status for partial/full failure.

**Acceptance Criteria:**
- [ ] Shows async checks running in parallel: `await Promise.allSettled([checkDb(), checkRedis()])`
- [ ] `checkDb()` executes a simple query: `await prisma.$queryRaw\`SELECT 1\`` or `await pool.query('SELECT 1')`
- [ ] Each check has a timeout: `Promise.race([checkDb(), timeout(2000)])` — if DB takes >2s, it's treated as down
- [ ] Shows response structure: `{ status: 'ok' | 'degraded' | 'down', checks: { db: 'ok', redis: 'timeout' }, timestamp: '...' }`
- [ ] Returns 200 when all checks pass
- [ ] Returns 503 when any check fails — Kubernetes stops routing traffic to this pod
- [ ] Explains why 503 is correct: the pod is alive (liveness is fine) but not ready to serve all features — Kubernetes should stop sending it traffic
- [ ] Notes that `degraded` status (some checks failing) should also return 503 — partial feature availability is still a problem for users

---

### Q15 — Ops Runbook ⭐⭐⭐

**Scenario:** At 2 AM, the alert fires: "API p99 latency > 4 seconds." The on-call engineer is new. Without a runbook, they'll spend 45 minutes figuring out where to even start.

**Task:** Explain what a runbook is and why it matters. Write a 5-step runbook entry for "API response time spike." Explain what "runbook-driven alerting" means.

**Acceptance Criteria:**
- [ ] Defines runbook: a documented step-by-step guide for diagnosing and resolving a specific type of incident — written in advance, not during the incident
- [ ] Explains why it matters: reduces mean time to resolution (MTTR), enables non-experts to handle incidents, reduces alert fatigue (engineers trust alerts that have clear action paths)
- [ ] Runbook Step 1: check health endpoint — `GET /health/ready` — is the service degraded? Which dependency check is failing?
- [ ] Runbook Step 2: check database slow query log — are any queries taking >500ms? Look at Datadog APM or `pg_stat_statements`
- [ ] Runbook Step 3: check Redis — connection count, memory usage, eviction rate — high eviction rate means cache is undersized
- [ ] Runbook Step 4: check background job queue depth — if the queue is backed up by >1000 jobs, jobs may be consuming DB connections, starving API requests
- [ ] Runbook Step 5: check recent deployments — did anything deploy in the last 2 hours? Correlate the latency spike start time with deployment timestamps
- [ ] Defines "runbook-driven alerting": every alert in your monitoring system links directly to the specific runbook section for that alert — engineers never have to search for what to do

---

## Scoring Rubric

Count the number of acceptance criteria checkboxes you fully satisfied across all 15 questions.

| Score | Level | What it means |
|-------|-------|---------------|
| 0–4   | 🔴 Re-study | Go back to the Day 54 teaching file. Observability thinking needs to become instinctive before the tools make sense. |
| 5–9   | 🟡 Progressing | You can add basic structured logging but health checks, graceful shutdown, and tracing need more practice. |
| 10–12 | 🟢 Solid | You can make a production API observable. Move on — revisit distributed tracing and alert design later. |
| 13–15 | 🚀 Ready to advance | Strong observability knowledge. You can own the monitoring stack and run incident response for a startup. |
