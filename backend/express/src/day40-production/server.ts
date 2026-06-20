// ════════════════════════════════════════════════════════════════
// DAY 40 — PRODUCTION HARDENING
// ════════════════════════════════════════════════════════════════
//
// Run with: npm run day40
//
// A dev server that works is not a production server.
// This file layers on the middleware stack that makes an Express app
// safe, observable, and resilient under real-world conditions.
//
// ORDER MATTERS — middleware runs top to bottom:
//   1. Helmet       — security headers (before anything that sends responses)
//   2. CORS         — must be before routes (OPTIONS preflight must be handled)
//   3. Rate limiter — before body parsing (reject early, save CPU)
//   4. Body parser  — after rate limit (don't parse bodies you'll reject)
//   5. Validation   — Zod schemas, before business logic
//   6. Routes       — business logic
//   7. 404 handler  — after all routes
//   8. Error handler — last, 4-arg signature

import express, { Request, Response, NextFunction } from 'express';
import helmet   from 'helmet';
import cors     from 'cors';
import rateLimit from 'express-rate-limit';
import multer   from 'multer';
import { z, ZodError } from 'zod';
import path from 'path';
import os   from 'os';

const app  = express();
const PORT = 3004;

// ─────────────────────────────────────────────────────────────────
// 1. HELMET — Security Headers
// ─────────────────────────────────────────────────────────────────
// helmet() sets ~15 HTTP response headers that harden the browser
// security model. Call it before any routes.
//
// What each header does:
//
//   X-Content-Type-Options: nosniff
//     Prevents MIME sniffing — the browser must use the declared Content-Type.
//     Without it: a server sends text/plain, browser decides it "looks like JS"
//     and executes it. With it: browser trusts the Content-Type header.
//
//   X-Frame-Options: DENY  (or SAMEORIGIN)
//     Prevents your page from being embedded in an <iframe> on another site.
//     Stops clickjacking attacks (invisible iframe over a "like" button).
//
//   Content-Security-Policy (CSP)
//     Whitelist of sources from which the browser may load scripts, styles,
//     images, etc. Significantly reduces XSS impact.
//     default-src 'self' means: only load resources from the same origin.
//     In practice, tune this carefully — too strict breaks your own app.
//
//   Referrer-Policy: no-referrer
//     Controls what URL is sent in the Referer header when the user navigates.
//     'no-referrer' = never send it — protects user privacy.
//     'strict-origin-when-cross-origin' = safe middle ground for analytics.
//
//   Strict-Transport-Security (HSTS)
//     Tells browsers: only connect via HTTPS for the next maxAge seconds.
//     After the first visit, the browser won't even try HTTP.
//     DO NOT enable until your HTTPS cert is stable — you can lock yourself out.
//
//   X-DNS-Prefetch-Control: off
//     Disables DNS prefetching — minor privacy protection.
//
//   X-Download-Options: noopen
//     IE-only: prevents IE from auto-opening downloaded files in the browser context.
//
//   X-Permitted-Cross-Domain-Policies: none
//     Prevents Adobe Flash/PDF from loading cross-domain content from this domain.

app.use(helmet({
  // Content-Security-Policy is strict by default in helmet — tune for your stack
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'", "'unsafe-inline'"], // unsafe-inline needed for many UI frameworks
      imgSrc:      ["'self'", 'data:', 'https:'],
      connectSrc:  ["'self'"],
      fontSrc:     ["'self'"],
      objectSrc:   ["'none'"],                    // block Flash, plugins
      upgradeInsecureRequests: [],
    },
  },
  // HSTS: only enable when HTTPS is confirmed and stable
  hsts: process.env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
  // referrerPolicy: 'no-referrer' is the helmet default — fine for most APIs
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// ─────────────────────────────────────────────────────────────────
// 2. CORS — Cross-Origin Resource Sharing
// ─────────────────────────────────────────────────────────────────
// The browser blocks cross-origin fetch() by default (Same-Origin Policy).
// CORS headers tell the browser which origins are allowed to make requests.
//
// HOW CORS WORKS:
//   Simple requests (GET, POST with plain text): browser sends request,
//     server responds with Access-Control-Allow-Origin header.
//     Browser allows or blocks based on that header.
//
//   Preflight (PUT, PATCH, DELETE, or custom headers):
//     Browser sends OPTIONS request FIRST. Server must respond 200 with
//     appropriate headers. Then browser sends the real request.
//
// COMMON MISTAKES:
//   ❌ cors({ origin: '*' }) with credentials: true
//      Browsers BLOCK this — wildcard and credentials can't coexist.
//
//   ❌ cors({ origin: '*' }) in production with cookies
//      Cookies are credentials. Wildcard means cookies won't be sent.
//
//   ✅ Whitelist specific origins in production
//   ✅ Use '*' only for truly public, credential-free APIs (public CDN, open data)

const ALLOWED_ORIGINS = process.env.NODE_ENV === 'production'
  ? ['https://myapp.com', 'https://www.myapp.com']
  : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin(requestOrigin, callback) {
    // Allow requests with no Origin header (e.g. curl, Postman, server-to-server)
    if (!requestOrigin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(requestOrigin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${requestOrigin}' not allowed`));
    }
  },
  credentials:     true,          // allow cookies and Authorization header
  methods:         ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders:  ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders:  ['X-Request-ID', 'X-RateLimit-Remaining'],
  maxAge:          86400,         // preflight cache: 24h (browser won't re-preflight)
  optionsSuccessStatus: 204,      // some browsers (IE11) choke on 200 for OPTIONS
}));

// ─────────────────────────────────────────────────────────────────
// 3. RATE LIMITING — Different limits for different endpoint types
// ─────────────────────────────────────────────────────────────────
// Why different limits?
//   General API: 100 req/15min — typical browsing is well under this
//   Auth endpoints: 10 req/15min — slow down brute-force password attacks
//   Resource-intensive: 5 req/15min — protect expensive operations
//
// In production: use a Redis store so limits are shared across instances.
// Default in-memory store resets on restart and doesn't work with multiple processes.
// import RedisStore from 'rate-limit-redis';

const generalLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15-minute window
  max:              100,             // max requests per window per IP
  standardHeaders:  true,            // add RateLimit-* headers (RFC 6585)
  legacyHeaders:    false,           // don't add X-RateLimit-* (deprecated)
  message: {
    error:     'Too Many Requests',
    message:   'You have exceeded 100 requests in 15 minutes.',
    retryAfter: '15 minutes',
  },
  // keyGenerator: customise the key (default: IP address)
  // For APIs behind proxies, use req.ip which respects X-Forwarded-For
  // But first set: app.set('trust proxy', 1) to trust your proxy
  keyGenerator: (req) => req.ip ?? 'unknown',
});

const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutes
  max:             10,              // only 10 login attempts per IP per window
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    error:   'Too Many Requests',
    message: 'Too many authentication attempts. Try again in 15 minutes.',
  },
  // skipSuccessfulRequests: true — don't count successful logins against the limit
  // Only rate-limit failures (more aggressive protection)
  skipSuccessfulRequests: true,
});

const heavyLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Rate limit exceeded for resource-intensive operations' },
});

// Apply general limiter to all routes
app.use(generalLimiter);

// ─────────────────────────────────────────────────────────────────
// 4. BODY PARSING
// ─────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─────────────────────────────────────────────────────────────────
// 5. REQUEST ID MIDDLEWARE
// ─────────────────────────────────────────────────────────────────
// Attach a unique ID to every request. Log it everywhere.
// When a user reports "I got an error at 3pm", you find the request ID
// in the logs and see exactly what happened.
app.use((req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] as string
    ?? `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  res.setHeader('X-Request-ID', requestId);
  // Attach to req so route handlers can log it
  (req as Request & { requestId: string }).requestId = requestId;
  next();
});

// ─────────────────────────────────────────────────────────────────
// 6. ZOD VALIDATION — Centralised, structured, reusable schemas
// ─────────────────────────────────────────────────────────────────
//
// Why Zod?
//   1. TypeScript-first — infers types from schemas
//   2. Composable — schemas can be extended, merged, or optional()
//   3. Detailed errors — tells you exactly which field failed and why
//
// Error response shape (consistent across all endpoints):
//   {
//     "message": "Validation failed",
//     "errors": {
//       "email":    ["Invalid email address"],
//       "password": ["Must be at least 8 characters"]
//     }
//   }
//
// NOT: { "error": "Invalid input" } — too vague for a client to show inline errors.
// The frontend needs field-level errors to highlight the right input.

const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8,  'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be at most 100 characters')
    .trim(),
  role: z.enum(['user', 'admin']).optional().default('user'),
});

// Infer the TypeScript type from the Zod schema — single source of truth
type RegisterInput = z.infer<typeof registerSchema>;

// Middleware factory: validate req.body against a Zod schema
function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      // Reshape Zod errors into { field: [messages] } format
      const errors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const field = issue.path.join('.') || '_root';
        if (!errors[field]) errors[field] = [];
        errors[field].push(issue.message);
      }
      res.status(400).json({ message: 'Validation failed', errors });
      return;
    }
    // Replace req.body with the parsed (and coerced) data
    req.body = result.data;
    next();
  };
}

// ─────────────────────────────────────────────────────────────────
// 7. FILE UPLOAD WITH MULTER
// ─────────────────────────────────────────────────────────────────
//
// Multer handles multipart/form-data (file uploads).
//
// TWO STORAGE STRATEGIES:
//   diskStorage — saves to disk. Good for dev. In production, stream
//                 directly to S3/GCS instead (disk fills up, doesn't scale).
//   memoryStorage — keeps in RAM as a Buffer. Good for passing to cloud SDK.
//
// SECURITY CHECKLIST FOR FILE UPLOADS:
//   1. File type validation (check MIME type AND file extension)
//   2. File size limit (prevent DoS via huge uploads)
//   3. Rename the file (never trust client-provided filenames — path traversal)
//   4. Scan for malware in production (ClamAV, cloud scan APIs)
//   5. Serve from a separate domain (prevents script execution via XSS)
//   6. Don't serve uploaded files with execute permissions

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

const upload = multer({
  storage: multer.memoryStorage(), // keep in RAM — we'd stream to S3 in production

  limits: {
    fileSize:  5 * 1024 * 1024, // 5MB max per file
    files:     1,               // max 1 file per request
    fieldSize: 10 * 1024,       // max 10KB for non-file fields
  },

  fileFilter(_req, file, cb) {
    // Check MIME type (declared by client — can be spoofed, but filters noise)
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error(`File type '${file.mimetype}' not allowed. Accepted: JPEG, PNG, GIF, WEBP`));
      return;
    }

    // Check file extension (additional layer — a .php file named .jpg still won't exec)
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      cb(new Error(`File extension '${ext}' not allowed`));
      return;
    }

    cb(null, true); // accept the file
  },
});

// ─────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status:    'ok',
    uptime:    process.uptime(),
    timestamp: new Date().toISOString(),
    memory: {
      used:  Math.round(process.memoryUsage().heapUsed  / 1024 / 1024) + 'MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
    },
    // Include version for deployment verification
    version: process.env.npm_package_version ?? 'unknown',
  });
});

// Auth route with tight rate limit + Zod validation
app.post(
  '/api/register',
  authLimiter,                      // tighter rate limit for auth
  validateBody(registerSchema),     // validate + coerce input
  (req: Request, res: Response) => {
    const input = req.body as RegisterInput;
    // In a real app: hash password, save to DB, send verification email
    res.status(201).json({
      message: 'Registration successful',
      user: { email: input.email, name: input.name, role: input.role },
    });
  }
);

// Resource-intensive route example
app.post(
  '/api/export',
  heavyLimiter,
  async (_req: Request, res: Response) => {
    // Simulate an expensive operation (DB export, PDF generation, etc.)
    await new Promise(r => setTimeout(r, 100));
    res.json({ message: 'Export started', jobId: `job_${Date.now()}` });
  }
);

// File upload route
app.post(
  '/api/upload',
  upload.single('file'),    // 'file' is the form field name
  (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;

    // In production: stream file.buffer to S3/GCS, get back a URL
    // Here we just show what we'd do with it
    const safeFilename = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname).toLowerCase()}`;

    res.status(201).json({
      message:      'File uploaded successfully',
      file: {
        originalName: file.originalname,
        savedAs:      safeFilename,        // never expose the storage path
        mimeType:     file.mimetype,
        sizeBytes:    file.size,
        sizeKB:       Math.round(file.size / 1024),
        // In production, return the CDN URL:
        // url: `https://cdn.myapp.com/uploads/${safeFilename}`,
      },
    });

    // Clean up: in a real app, write to uploads dir or S3.
    // For teaching, we just log.
    console.log(`[Upload] ${file.originalname} (${file.size} bytes) → would save as ${safeFilename}`);

    // Save to temp for demonstration (optional)
    const tmpPath = path.join(os.tmpdir(), safeFilename);
    require('fs').writeFileSync(tmpPath, file.buffer);
    console.log(`[Upload] Saved to temp: ${tmpPath}`);
  }
);

// ─────────────────────────────────────────────────────────────────
// 8. ASYNC ERROR HANDLING — Express 4 vs Express 5
// ─────────────────────────────────────────────────────────────────
//
// EXPRESS 4 (current stable):
//   Does NOT auto-catch rejected Promises from async route handlers.
//   This hangs the request silently:
//
//     app.get('/bad', async (req, res) => {
//       throw new Error('oops'); // Express 4 never sees this!
//     });
//
//   Fix: wrap with asyncHandler (see day37/middleware.ts) OR
//        use try/catch + next(err) manually.
//
// EXPRESS 5 (beta):
//   Automatically catches async errors and forwards to next(err).
//   When Express 5 becomes stable, asyncHandler wrappers are no longer needed.
//
// ALWAYS wrap async handlers in Express 4:

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

app.get(
  '/api/async-demo',
  asyncHandler(async (_req, res) => {
    // Simulate async work
    await new Promise(r => setTimeout(r, 50));
    // If we throw here, asyncHandler catches it and calls next(err)
    res.json({ message: 'Async handler works correctly' });
  })
);

app.get(
  '/api/async-error',
  asyncHandler(async (_req, _res) => {
    await new Promise(r => setTimeout(r, 10));
    throw new Error('This async error is caught by asyncHandler and sent to the error handler');
  })
);

// ─────────────────────────────────────────────────────────────────
// 404 HANDLER
// ─────────────────────────────────────────────────────────────────
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error:   'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    // Include requestId so this 404 can be traced in logs
    requestId: (req as Request & { requestId?: string }).requestId,
  });
});

// ─────────────────────────────────────────────────────────────────
// GLOBAL ERROR HANDLER — MUST BE LAST
// ─────────────────────────────────────────────────────────────────
// Catches:
//   - next(err) from any middleware or route handler
//   - Multer errors (file too large, wrong type)
//   - CORS errors
//   - Zod errors (if not handled in validateBody)
//   - Any unhandled async errors (via asyncHandler)
//
// 4-argument signature is REQUIRED — all 4 params must be declared.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error & { statusCode?: number; code?: string }, _req: Request, res: Response, _next: NextFunction) => {
  // Multer-specific error codes
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large', maxSize: '5MB' });
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ error: 'Too many files. Upload one at a time.' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: `Unexpected field. Use field name 'file'.` });
  }

  // CORS errors
  if (err.message.startsWith('CORS:')) {
    return res.status(403).json({ error: err.message });
  }

  // Zod errors (if they escape validateBody middleware)
  if (err instanceof ZodError) {
    return res.status(400).json({ message: 'Validation failed', errors: err.errors });
  }

  // Operational errors (expected: 404, 401, validation, etc.)
  const statusCode = err.statusCode ?? 500;
  const isOperational = statusCode < 500;

  // Log: in production, send to your logging service (Datadog, Sentry, etc.)
  if (isOperational) {
    console.warn(`[WARN ${statusCode}]`, err.message);
  } else {
    console.error(`[ERROR ${statusCode}]`, err.message, '\n', err.stack);
  }

  const isProduction = process.env.NODE_ENV === 'production';
  res.status(statusCode).json({
    error:   err.name || 'Error',
    message: isOperational ? err.message : 'Internal server error',
    // Never expose stack traces in production
    ...(isProduction ? {} : { stack: err.stack }),
  });
});

// ─────────────────────────────────────────────────────────────────
// PROCESS-LEVEL ERROR HANDLING
// ─────────────────────────────────────────────────────────────────
// These catch errors that escape Express entirely.
// In production: log to your error tracking service, then exit gracefully.

process.on('unhandledRejection', (reason: unknown) => {
  console.error('[FATAL] Unhandled Promise Rejection:', reason);
  // In production: exit so the process manager (PM2, k8s) restarts cleanly
  // process.exit(1);
});

process.on('uncaughtException', (err: Error) => {
  console.error('[FATAL] Uncaught Exception:', err.message, '\n', err.stack);
  // ALWAYS exit on uncaughtException — the process may be in an unknown state
  process.exit(1);
});

// ─────────────────────────────────────────────────────────────────
// GRACEFUL SHUTDOWN
// ─────────────────────────────────────────────────────────────────
// On SIGTERM (k8s pod shutdown, PM2 reload), stop accepting new connections
// and wait for in-flight requests to complete before exiting.
const server = app.listen(PORT, () => {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║         DAY 40 — PRODUCTION HARDENING                   ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\nServer at http://localhost:${PORT}`);
  console.log('\nMiddleware stack:');
  console.log('  ✅ Helmet      — security headers');
  console.log('  ✅ CORS        — origin whitelist');
  console.log('  ✅ Rate limit  — 100/15min general, 10/15min auth, 5/15min heavy');
  console.log('  ✅ Zod         — schema validation with field-level errors');
  console.log('  ✅ Multer      — file upload with type + size validation');
  console.log('  ✅ AsyncHandler— async error forwarding to next(err)');
  console.log('\nRoutes:');
  console.log('  GET  /health              — health check');
  console.log('  POST /api/register        — Zod-validated registration (rate limited)');
  console.log('  POST /api/export          — heavy operation (5 req/15min)');
  console.log('  POST /api/upload          — image upload (5MB max, images only)');
  console.log('  GET  /api/async-demo      — async handler that works');
  console.log('  GET  /api/async-error     — async error forwarded to error handler');
  console.log('\nTry:');
  console.log('  curl http://localhost:3004/health');
  console.log('  curl -X POST http://localhost:3004/api/register \\');
  console.log('       -H "Content-Type: application/json" \\');
  console.log('       -d \'{"email":"test@example.com","password":"secret123","name":"Test"}\'');
  console.log('  curl -X POST http://localhost:3004/api/upload \\');
  console.log('       -F "file=@/path/to/image.jpg"');
});

process.on('SIGTERM', () => {
  console.log('\n[Shutdown] SIGTERM received. Closing server gracefully...');
  server.close(() => {
    console.log('[Shutdown] All connections closed. Exiting.');
    process.exit(0);
  });

  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    console.error('[Shutdown] Forceful exit after timeout');
    process.exit(1);
  }, 30_000);
});

export default app;
