// ════════════════════════════════════════════════════════════════
// DAY 37 — CUSTOM MIDDLEWARE PATTERNS
// ════════════════════════════════════════════════════════════════
//
// Middleware is just a function with this signature:
//   (req: Request, res: Response, next: NextFunction) => void
//
// The express chain works like a pipeline:
//   call next()       → move to next middleware
//   call next(error)  → jump to the error handler (4-arg middleware)
//   call res.json()   → end the chain, send response
//
// PATTERN 1: Middleware Factory
// A function that returns a middleware — lets you configure it per-use:
//   app.use(requireRole('admin'))
//   app.use(cache({ ttl: 60 }))
//   app.use(requestLogger({ level: 'debug' }))
//
// PATTERN 2: Async middleware
// Express 4 does NOT auto-catch async errors. If an async middleware
// throws, Express never sees it and the request hangs forever.
// Express 5 (still in beta as of 2024) fixes this.
// For Express 4: wrap with asyncHandler so rejections call next(err).

import { Request, Response, NextFunction } from 'express';

// ─────────────────────────────────────────────────────────────────
// 1. asyncHandler — wraps async route handlers so errors go to next()
// ─────────────────────────────────────────────────────────────────
//
// WITHOUT asyncHandler:
//   app.get('/users', async (req, res) => {
//     const users = await db.query(); // if this throws, the request hangs!
//   });
//
// WITH asyncHandler:
//   app.get('/users', asyncHandler(async (req, res) => {
//     const users = await db.query(); // throws → next(err) → error handler
//   }));
//
// How it works: Promise.resolve() wraps both sync and async functions.
// If fn returns a rejected Promise, .catch(next) calls next(err).
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export function asyncHandler(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Promise.resolve() handles both:
    //   - async functions (returns a Promise)
    //   - sync functions (wraps the return value in a resolved Promise)
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ─────────────────────────────────────────────────────────────────
// 2. requestLogger — middleware factory with log level config
// ─────────────────────────────────────────────────────────────────
//
// A factory gives you a configured middleware without global state.
// Each call to requestLogger({ level }) creates a separate closure.
interface LoggerOptions {
  level?: 'debug' | 'info' | 'warn';
  // If true, log request body (never do this in production — may contain passwords)
  logBody?: boolean;
}

export function requestLogger(opts: LoggerOptions = {}) {
  const { level = 'info', logBody = false } = opts;

  const log = (msg: string) => {
    const prefix = `[${level.toUpperCase()}] ${new Date().toISOString()}`;
    console.log(`${prefix} ${msg}`);
  };

  // This is the actual middleware function returned by the factory
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    // We hook into res.on('finish') to log AFTER the response is sent.
    // This way we capture the status code and response time.
    res.on('finish', () => {
      const duration = Date.now() - start;
      const statusColor = res.statusCode >= 500 ? '🔴' :
                          res.statusCode >= 400 ? '🟡' : '🟢';
      log(`${statusColor} ${req.method} ${req.originalUrl} ${res.statusCode} — ${duration}ms`);

      if (logBody && level === 'debug' && req.body && Object.keys(req.body).length > 0) {
        // Mask sensitive fields before logging
        const safeBody = maskSensitiveFields(req.body);
        log(`   Body: ${JSON.stringify(safeBody)}`);
      }
    });

    next(); // pass control to next middleware
  };
}

// Helper: mask passwords, tokens, secrets in logged objects
function maskSensitiveFields(obj: Record<string, unknown>): Record<string, unknown> {
  const SENSITIVE = new Set(['password', 'token', 'secret', 'authorization', 'credit_card']);
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = SENSITIVE.has(key.toLowerCase()) ? '[REDACTED]' : value;
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────
// 3. requireHeader — gate a route on the presence of a header
// ─────────────────────────────────────────────────────────────────
//
// Usage: app.use('/internal', requireHeader('X-Internal-Token'))
// Used for: API key authentication, internal service headers, CSRF tokens
//
// Why a factory? So you can specify which header at the call site:
//   requireHeader('X-Api-Key')    — for public API
//   requireHeader('X-Admin-Key')  — for admin endpoints
export function requireHeader(headerName: string, options: { errorMessage?: string } = {}) {
  const lowerHeader = headerName.toLowerCase(); // HTTP headers are case-insensitive

  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.headers[lowerHeader];

    if (!value) {
      res.status(401).json({
        error: options.errorMessage ?? `Missing required header: ${headerName}`,
        header: headerName,
      });
      return; // do NOT call next() — we've ended the chain
    }

    // Attach the header value to req for downstream handlers to use
    // Using Object.assign avoids TypeScript's strict property checks
    Object.assign(req, { [lowerHeader]: value });

    next();
  };
}

// ─────────────────────────────────────────────────────────────────
// 4. timeout — respond 408 if handler doesn't finish in time
// ─────────────────────────────────────────────────────────────────
//
// Critical for production: a slow DB query or external API call can
// tie up a connection indefinitely. Set a timeout and fail fast.
//
// NOTE: This only stops the response — the underlying work (DB query)
// may still be running. For true cancellation, use AbortController.
export function timeout(ms: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      // Only send if headers haven't been sent yet
      if (!res.headersSent) {
        res.status(408).json({
          error: 'Request Timeout',
          message: `The server did not produce a response within ${ms}ms`,
          timeout_ms: ms,
        });
      }
    }, ms);

    // We need to clear the timer when the response finishes normally
    res.on('finish', () => {
      if (!timedOut) clearTimeout(timer);
    });

    res.on('close', () => {
      // Client disconnected (browser navigated away, etc.)
      clearTimeout(timer);
    });

    // Patch next() so if timeout fired, we don't call next() on late responses
    const wrappedNext: NextFunction = (err?: unknown) => {
      if (timedOut) return; // too late — 408 already sent
      next(err);
    };

    next(); // BUG FIX: use actual next here to start the chain, wrappedNext
            // would be used if we were intercepting next calls downstream
    void wrappedNext; // suppress unused variable warning in teaching context
  };
}

// ─────────────────────────────────────────────────────────────────
// 5. sanitize — trim all string values in req.body recursively
// ─────────────────────────────────────────────────────────────────
//
// Prevents whitespace-only inputs from passing validation.
// Trim before you validate — otherwise "  admin  " passes a min-length check.
//
// Recursive so it handles nested objects: { address: { street: "  Main St  " } }
function trimStrings(obj: unknown): unknown {
  if (typeof obj === 'string') return obj.trim();
  if (Array.isArray(obj))     return obj.map(trimStrings);
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = trimStrings(value);
    }
    return result;
  }
  return obj; // numbers, booleans, null — pass through unchanged
}

export function sanitize() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.body && typeof req.body === 'object') {
      req.body = trimStrings(req.body);
    }
    next();
  };
}

// ─────────────────────────────────────────────────────────────────
// BONUS: notFound — 404 catch-all (must be registered LAST)
// ─────────────────────────────────────────────────────────────────
// Any request that didn't match a route falls through to this.
// Always put it after all your route registrations.
export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    path: req.path,
  });
}

// ─────────────────────────────────────────────────────────────────
// BONUS: globalErrorHandler — 4-argument error middleware
// ─────────────────────────────────────────────────────────────────
// Express identifies error handlers by their 4-argument signature.
// The (err, req, res, next) form MUST have all 4 params — even if you
// don't use next — otherwise Express won't treat it as an error handler.
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean; // true = expected error (validation, auth)
                            // false = unexpected error (bug, DB crash)
}

export function globalErrorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction  // MUST include next even if unused — Express needs it
): void {
  const statusCode = err.statusCode ?? 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Log every error (in production, send to your logging service)
  console.error(`[ERROR] ${req.method} ${req.path}`, {
    message: err.message,
    stack: err.stack,
    statusCode,
  });

  res.status(statusCode).json({
    error: err.name || 'InternalServerError',
    message: err.message,
    // Never expose stack traces in production — attackers can use them
    ...(isProduction ? {} : { stack: err.stack }),
    // Request ID would go here in a real app for log correlation
    // requestId: req.headers['x-request-id'],
  });
}
