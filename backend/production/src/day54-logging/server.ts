// ════════════════════════════════════════════════════════════════
// DAY 54 — STRUCTURED LOGGING + HEALTH CHECKS + GRACEFUL SHUTDOWN
// ════════════════════════════════════════════════════════════════
//
// WHY STRUCTURED LOGGING?
// ───────────────────────
// Bad (unstructured):
//   console.log('User alice logged in at 2026-06-20T10:00:00Z from 192.168.1.1')
//   console.log('POST /api/posts took 145ms and returned 201')
//
// Problems with console.log in production:
//   1. Searching is a nightmare: grep "User alice" across gigabytes of logs
//   2. No severity levels: you can't say "show me only errors"
//   3. No machine parsing: log aggregators (Datadog, Splunk, CloudWatch) can't
//      extract fields — they just see a blob of text
//
// Good (structured):
//   logger.info({ userId: 'alice', event: 'login', ip: '192.168.1.1' }, 'User logged in')
//   logger.info({ method: 'POST', path: '/api/posts', status: 201, duration: 145 }, 'Request')
//
// Each line is a JSON object in production:
//   {"level":"info","time":1719432000,"userId":"alice","event":"login","msg":"User logged in"}
//
// Benefits:
//   - Filter by any field: level:error, userId:alice, status:500
//   - Set up alerts: "alert if error_rate > 5/min"
//   - Build dashboards: p99 latency per endpoint over time
//   - Correlate across services: requestId links logs from API + DB + cache
//
// PINO vs WINSTON:
// ─────────────────
//   Pino:   ~5-10x faster than Winston (uses async logging, minimal overhead)
//           JSON by default, minimal API, used by Fastify and many large apps
//   Winston: more transports (file, HTTP, Slack), easier to configure,
//            slower (synchronous by default)
//   Verdict: Pino for new projects. Winston if you need multiple log destinations.
//
// LOG LEVELS (lowest to highest severity):
// ──────────────────────────────────────────
//   trace  → extremely verbose, every function call (dev only)
//   debug  → diagnostic info useful during development
//   info   → normal application events (request served, user logged in)
//   warn   → something unexpected but recoverable (retried a failed request)
//   error  → an operation failed (DB query failed, validation threw)
//   fatal  → app cannot continue (failed to bind to port, config missing)
//
//   In production: set LOG_LEVEL=info (skip trace and debug — too noisy)
//   In development: set LOG_LEVEL=debug (pino-pretty makes it human-readable)
//
// REQUEST ID (CORRELATION IDs):
// ──────────────────────────────
//   Every request gets a unique ID (UUID or nanoid).
//   Every log line for that request includes the ID.
//   When debugging: filter logs by requestId to see the complete request lifecycle.
//   Cross-service: pass X-Request-Id header to downstream services so you can
//   trace a request across your entire distributed system.
//
// HEALTH CHECKS:
// ──────────────
//   Load balancers (AWS ALB, nginx), Kubernetes, and platforms like Railway
//   poll your health endpoint to decide if traffic should be routed to your instance.
//   Two common patterns:
//     /health (liveness):  "is the process alive?" — just returns 200
//     /health/ready:       "is the process ready to serve traffic?"
//                          — checks DB, cache, external dependencies
//   Kubernetes:
//     livenessProbe:  → /health  (restart pod if this fails)
//     readinessProbe: → /health/ready (remove pod from load balancer if this fails)
//
// GRACEFUL SHUTDOWN:
// ──────────────────
//   When a container is stopped (docker compose down, deploy rolling restart),
//   the process receives SIGTERM. Without a handler, Node.js exits immediately,
//   killing any in-flight requests mid-stream (HTTP 502 for clients).
//   With graceful shutdown:
//   1. Stop accepting new connections
//   2. Wait for in-flight requests to finish (with a timeout)
//   3. Close DB connections cleanly
//   4. Exit
//   Rolling deploys (new container starts while old one shuts down) become seamless.

import express, { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import pino from 'pino';
import http from 'http';

// ──────────────────────────────────────────────────────────────
// LOGGER SETUP
// ──────────────────────────────────────────────────────────────
//
// pino-pretty: a transport that formats JSON logs as human-readable colored output.
// Use in development only — pino-pretty is slower and outputs text, not JSON.
//
// The transport option is Node 18+ style — it spawns a worker thread for the
// pretty-printer so it doesn't block the main thread.
//
// In production (NODE_ENV=production):
//   - No transport → pino outputs raw JSON to stdout
//   - Your log aggregator (Datadog agent, Fluentd, CloudWatch agent) reads stdout
//     and parses the JSON

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname', // hide process id and hostname in dev
          },
        }
      : undefined,
});

// ──────────────────────────────────────────────────────────────
// EXTEND EXPRESS REQUEST TYPE
// ──────────────────────────────────────────────────────────────
//
// TypeScript doesn't know about our custom `req.log` and `req.requestId` fields.
// We extend the Request interface via declaration merging so TypeScript is happy.
// This must be in a module (any import/export makes it a module).

declare global {
  namespace Express {
    interface Request {
      log: pino.Logger;       // child logger scoped to this request
      requestId: string;      // unique ID for this request
      startTime: bigint;      // for calculating duration
    }
  }
}

// ──────────────────────────────────────────────────────────────
// EXPRESS APP
// ──────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());

// ──────────────────────────────────────────────────────────────
// REQUEST LOGGING MIDDLEWARE
// ──────────────────────────────────────────────────────────────
//
// This middleware runs before every route handler.
// It:
//   1. Generates a unique requestId for this request
//   2. Creates a child logger with requestId baked in
//      → every logger call from req.log includes { requestId: '...' } automatically
//   3. Logs the incoming request
//   4. Logs the outgoing response (using the 'finish' event)
//
// WHY 'finish' event instead of logging in the route handler?
//   - Works for ALL routes without modifying each one
//   - Captures the final status code (which can be changed by error handlers)
//   - Measures true end-to-end duration including serialization

app.use((req: Request, res: Response, next: NextFunction) => {
  // Generate a unique ID for this request.
  // Check if the client sent one (from an upstream service or API gateway).
  // If not, generate a new one.
  req.requestId = (req.headers['x-request-id'] as string) ?? randomUUID();
  req.startTime = process.hrtime.bigint(); // nanosecond precision

  // Create a child logger — inherits all pino config + adds requestId to every line
  // This means: every req.log.info({ ... }) call automatically includes requestId
  req.log = logger.child({ requestId: req.requestId });

  // Log the incoming request
  req.log.info({ method: req.method, url: req.url }, 'Request received');

  // 'finish' fires when the response has been sent to the client
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - req.startTime) / 1_000_000;

    // Choose log level based on status code
    const level = res.statusCode >= 500 ? 'error'
      : res.statusCode >= 400 ? 'warn'
      : 'info';

    req.log[level](
      {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: Math.round(durationMs),
      },
      'Request completed'
    );
  });

  // Add the requestId to the response headers.
  // Clients (and your frontend) can log this ID so support can correlate
  // "the user saw an error" with your server logs.
  res.setHeader('X-Request-Id', req.requestId);

  next();
});

// ──────────────────────────────────────────────────────────────
// HEALTH CHECK ENDPOINTS
// ──────────────────────────────────────────────────────────────

// GET /health — liveness probe
// "Is the process alive and able to serve requests?"
// Should almost always return 200 — even if the DB is down.
// If this returns non-200, Kubernetes kills and restarts the pod.
// You want the pod restarted only if the process itself is broken.
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),      // seconds since process start
    version: process.env.npm_package_version ?? '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// GET /health/ready — readiness probe
// "Is the process ready to receive traffic?"
// Checks actual dependencies (DB, cache, external APIs).
// Return 503 Service Unavailable if a critical dependency is down.
// Kubernetes removes the pod from the load balancer until this returns 200.
// This is better than serving traffic and getting DB errors on every request.
app.get('/health/ready', async (_req: Request, res: Response) => {
  const checks: Record<string, { status: 'ok' | 'error'; latencyMs?: number; error?: string }> = {};

  // Simulate a DB connectivity check (in a real app: prisma.$queryRaw`SELECT 1`)
  try {
    const start = Date.now();
    await new Promise<void>((resolve) => setTimeout(resolve, 50)); // simulate 50ms DB ping
    checks['database'] = { status: 'ok', latencyMs: Date.now() - start };
  } catch (err) {
    checks['database'] = {
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }

  const allHealthy = Object.values(checks).every((c) => c.status === 'ok');

  return res
    .status(allHealthy ? 200 : 503)
    .json({
      status: allHealthy ? 'ready' : 'not ready',
      checks,
    });
});

// ──────────────────────────────────────────────────────────────
// EXAMPLE API ROUTES (demonstrating req.log usage)
// ──────────────────────────────────────────────────────────────

app.get('/api/demo', (req: Request, res: Response) => {
  // Use req.log instead of logger — every line auto-includes requestId
  req.log.debug({ query: req.query }, 'Processing demo request');

  // Simulate some work
  const result = { message: 'Hello from the demo endpoint', requestId: req.requestId };

  req.log.info({ result }, 'Demo request processed successfully');
  res.json(result);
});

app.get('/api/error-demo', (_req: Request, res: Response, next: NextFunction) => {
  // Simulate an unexpected error
  next(new Error('Simulated database connection failure'));
});

// ──────────────────────────────────────────────────────────────
// ERROR HANDLING MIDDLEWARE
// ──────────────────────────────────────────────────────────────
//
// Catches all errors passed to next(err) from route handlers.
//
// CRITICAL: Log the full error (with stack trace) server-side.
// CRITICAL: Return a sanitized message to clients (no stack traces, no internals).
//
// WHY sanitize? Stack traces leak:
//   - File system structure (/home/user/app/src/...)
//   - Node.js version, library versions
//   - Internal logic that attackers can use to craft targeted exploits

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  // Log at 'error' level with full context
  req.log.error(
    {
      error: {
        message: err.message,
        name: err.name,
        stack: err.stack, // full stack trace — never send this to clients
      },
    },
    'Unhandled error'
  );

  // Send a safe, generic message to the client
  res.status(500).json({
    error: 'Internal server error',
    requestId: req.requestId, // include requestId so users can report it
  });
});

// ──────────────────────────────────────────────────────────────
// SERVER START + GRACEFUL SHUTDOWN
// ──────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? '3001', 10);

// Create an http.Server explicitly (instead of app.listen) so we have a
// reference to it for graceful shutdown.
const server = http.createServer(app);

server.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV }, 'Server started');
});

// ──────────────────────────────────────────────────────────────
// GRACEFUL SHUTDOWN
// ──────────────────────────────────────────────────────────────
//
// SIGTERM: sent by Docker, Kubernetes, and most PaaS platforms when
//   stopping/restarting a container. You have a grace period (usually 30s)
//   to clean up before SIGKILL forcefully terminates the process.
//
// SIGINT: sent when you press Ctrl+C in the terminal.
//   Handle it the same way for consistent behavior during development.
//
// SHUTDOWN SEQUENCE:
//   1. server.close() — stop accepting NEW connections
//      In-flight requests can still complete. The callback fires when all
//      active connections have closed.
//   2. Close DB connections, flush log buffers, etc.
//   3. process.exit(0) — clean exit
//
// TIMEOUT: if requests don't complete within 10 seconds, force exit.
//   This prevents a stuck request from blocking the shutdown indefinitely.
//   In production, your orchestrator (Kubernetes) will SIGKILL after ~30s anyway.

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutdown signal received — starting graceful shutdown');

  // 10-second timeout: if cleanup takes longer, force exit
  const forceExitTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, 10_000);

  // Don't let this timer keep the process alive if everything shuts down quickly
  forceExitTimer.unref();

  // Step 1: Stop accepting new connections.
  // The callback fires when all in-flight requests have finished.
  await new Promise<void>((resolve) => {
    server.close(() => {
      logger.info('HTTP server closed — all in-flight requests complete');
      resolve();
    });
  });

  // Step 2: Close database connections.
  // In a real app: await prisma.$disconnect() or pool.end()
  logger.info('Closing database connections');
  await new Promise<void>((resolve) => setTimeout(resolve, 100)); // simulate DB close

  // Step 3: Exit cleanly
  logger.info('Graceful shutdown complete');
  process.exit(0);
}

// Register signal handlers
// 'once' instead of 'on': only handle the first signal.
// If SIGTERM fires twice (orchestrator is impatient), don't double-shutdown.
process.once('SIGTERM', () => void gracefulShutdown('SIGTERM'));
process.once('SIGINT', () => void gracefulShutdown('SIGINT'));

export { app, server, logger };
