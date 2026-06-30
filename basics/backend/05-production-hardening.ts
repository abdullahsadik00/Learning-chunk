// ═══════════════════════════════════════════════════════════════
// BACKEND 05: PRODUCTION HARDENING · VALIDATION · SECURITY HEADERS · FILE UPLOADS  (Day 40)
// Run: npx ts-node 05-production-hardening.ts
// ═══════════════════════════════════════════════════════════════
//
// Topics covered:
//  1. Input validation with Zod
//  2. File uploads with Multer
//  3. Environment configuration
//  4. Security hardening
//  5. Error handling in production
//  6. Graceful shutdown
//  7. Health check endpoints
//  8. Compression and performance

// ───────────────────────────────────────────────────────────────
// 1. Input Validation with Zod
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Input Validation with Zod ===");

/*
  ZOD OVERVIEW
  ─────────────
  Zod is a TypeScript-first schema declaration and validation library.
  You declare the SHAPE of data once, and Zod:
    • validates incoming data at runtime
    • infers the static TypeScript type automatically (zero duplication)

  Install: npm install zod

  The key workflow:
    1. Define a schema with z.object(), z.string(), etc.
    2. Call schema.parse(data)   — throws on failure
       OR schema.safeParse(data) — returns { success, data, error }
    3. Use z.infer<typeof schema> to extract the TypeScript type.

  PARSE vs SAFEPARSE
  ──────────────────
  .parse(data)
    • Returns the validated, possibly transformed data directly
    • THROWS a ZodError on validation failure
    • Use inside try/catch or when you are certain input is valid

  .safeParse(data)
    • Never throws
    • Returns { success: true, data: T } or { success: false, error: ZodError }
    • Preferred in HTTP request handlers — lets you return a structured 400

  TRANSFORMS
  ──────────
  .transform() lets you reshape valid data as part of the schema.
  Example: parse a date string into a real Date object, or lowercase an email.

  REFINEMENTS
  ───────────
  .refine(fn, message) adds a custom predicate that Zod cannot express with
  built-in combinators.  The function receives the parsed value and must return
  boolean (or Promise<boolean> for async refinements).

  UNION TYPES
  ───────────
  z.union([schemaA, schemaB]) validates against the FIRST matching schema.
  z.discriminatedUnion("type", [...]) is faster when each branch has a
  discriminator field (e.g. { type: "user" } vs { type: "admin" }).
*/

// Simulated Zod-like demonstration (no real zod dependency needed to run demo)

// In real code with Zod installed:
//
//   import { z } from "zod";
//
//   // 1a. Basic schema
//   const UserSchema = z.object({
//     name:     z.string().min(2).max(50),
//     email:    z.string().email(),
//     age:      z.number().int().min(0).max(120).optional(),
//     role:     z.enum(["user", "admin"]).default("user"),
//   });
//
//   // 1b. Derive the TypeScript type — no manual interface needed
//   type User = z.infer<typeof UserSchema>;
//
//   // 1c. .parse() — throws on invalid input
//   try {
//     const user = UserSchema.parse({ name: "A", email: "bad-email" });
//   } catch (err: any) {
//     console.error("Validation failed:", err.errors);
//     // err.errors is an array of { path, message, code } objects
//   }
//
//   // 1d. .safeParse() — never throws, ideal for Express handlers
//   const result = UserSchema.safeParse(req.body);
//   if (!result.success) {
//     return res.status(400).json({
//       error:  "Validation failed",
//       issues: result.error.errors.map(e => ({
//         field:   e.path.join("."),
//         message: e.message,
//       })),
//     });
//   }
//   const user = result.data; // fully typed User
//
//   // 1e. Transform — parse date string into Date object, lowercase email
//   const LoginSchema = z.object({
//     email:    z.string().email().transform(s => s.toLowerCase().trim()),
//     password: z.string().min(8),
//     loginAt:  z.string().datetime().transform(s => new Date(s)),
//   });
//
//   // 1f. Refine — custom cross-field validation
//   const PasswordSchema = z.object({
//     password:        z.string().min(8),
//     confirmPassword: z.string(),
//   }).refine(data => data.password === data.confirmPassword, {
//     message: "Passwords do not match",
//     path:    ["confirmPassword"],
//   });
//
//   // 1g. Union for polymorphic request bodies
//   const EventSchema = z.discriminatedUnion("type", [
//     z.object({ type: z.literal("email"),  to: z.string().email(), subject: z.string() }),
//     z.object({ type: z.literal("sms"),    to: z.string(), body: z.string().max(160)  }),
//     z.object({ type: z.literal("push"),   token: z.string(), title: z.string()       }),
//   ]);
//
//   // 1h. Reusable validation middleware factory
//   function validateBody<T>(schema: z.ZodSchema<T>) {
//     return (req: Request, res: Response, next: NextFunction): void => {
//       const result = schema.safeParse(req.body);
//       if (!result.success) {
//         res.status(400).json({
//           error:  "Validation failed",
//           issues: result.error.errors.map(e => ({
//             field:   e.path.join("."),
//             message: e.message,
//           })),
//         });
//         return;
//       }
//       req.body = result.data; // replace raw input with validated+transformed data
//       next();
//     };
//   }
//
//   // Usage:
//   router.post("/users", validateBody(UserSchema), createUserHandler);

// Demonstration of the validation logic without the zod runtime:
function simulateZodValidation(data: Record<string, unknown>) {
  const errors: { field: string; message: string }[] = [];

  if (typeof data.name !== "string" || data.name.length < 2) {
    errors.push({ field: "name", message: "Must be a string with at least 2 characters" });
  }
  if (typeof data.email !== "string" || !data.email.includes("@")) {
    errors.push({ field: "email", message: "Must be a valid email address" });
  }

  if (errors.length > 0) {
    return { success: false as const, errors };
  }
  return { success: true as const, data: { name: data.name as string, email: data.email as string } };
}

const validResult   = simulateZodValidation({ name: "Sadik", email: "sadik@example.com" });
const invalidResult = simulateZodValidation({ name: "A",     email: "not-an-email" });

console.log("Valid input:  ", validResult.success ? validResult.data : null);
console.log("Invalid input:", validResult.success ? null : invalidResult);

// ───────────────────────────────────────────────────────────────
// 2. File Uploads with Multer
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. File Uploads with Multer ===");

/*
  MULTER OVERVIEW
  ───────────────
  Multer is an Express middleware for handling multipart/form-data (file uploads).
  It parses the incoming request and makes uploaded files available on req.file
  (single) or req.files (multiple).

  Install: npm install multer
           npm install --save-dev @types/multer

  TWO STORAGE STRATEGIES
  ──────────────────────
  diskStorage   — writes files to local disk.  Gives you full control over
                  destination folder and filename.  The file lives on the server.
  memoryStorage — keeps the file in RAM as a Buffer (req.file.buffer).
                  Never writes to disk.  Use this when you immediately stream
                  the file to S3 / GCS — no temp file cleanup needed.

  CONFIGURATION OPTIONS
  ─────────────────────
  storage     — multer.diskStorage() or multer.memoryStorage()
  limits      — { fileSize: 5 * 1024 * 1024 } — 5 MB max
  fileFilter  — function(req, file, cb) — reject files by MIME type or name

  ROUTE-LEVEL UPLOAD HANDLERS
  ───────────────────────────
  upload.single("avatar")        — one file, field name "avatar"
  upload.array("photos", 10)     — up to 10 files, same field name
  upload.fields([...])           — multiple fields with different names

  SECURITY: MIME TYPE VALIDATION
  ────────────────────────────────
  NEVER trust req.file.originalname extension alone.
  A user can rename shell.php to photo.jpg.
  Always check req.file.mimetype against an allowlist.
  For extra safety, use the `file-type` package which reads the file's magic
  bytes (first few bytes of the buffer) rather than the name or MIME header.

  SECURE FILENAME GENERATION
  ──────────────────────────
  Never save uploaded files with their original filename.
  Reasons:
    1. Path traversal: ../../etc/passwd
    2. Name collisions between users
    3. Executable extensions: shell.php, attack.exe
  Solution: generate a UUID-based name and preserve only the extension.

  LOCAL VS S3
  ───────────
  Local disk storage is fine for development but has issues in production:
    • Ephemeral disks (containers, Heroku dynos) lose files on restart
    • Multi-instance deployments: file uploaded to server A is missing on server B
  Production pattern with memoryStorage:
    1. Multer puts the file in req.file.buffer
    2. Your handler streams it to S3 using the AWS SDK PutObjectCommand
    3. Store the S3 URL in your database
*/

// In real code:
//
//   import multer  from "multer";
//   import path    from "path";
//   import { v4 as uuidv4 } from "uuid";
//   import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
//
//   const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
//
//   // ── diskStorage variant ──────────────────────────────────────
//   const diskStorage = multer.diskStorage({
//     destination: (_req, _file, cb) => cb(null, "uploads/"),
//     filename:    (_req, file, cb) => {
//       const ext      = path.extname(file.originalname).toLowerCase(); // e.g. ".jpg"
//       const safeName = `${uuidv4()}${ext}`;                           // "a1b2-c3d4.jpg"
//       cb(null, safeName);
//     },
//   });
//
//   // ── fileFilter — reject disallowed MIME types ────────────────
//   const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
//     if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
//       cb(null, true);       // accept
//     } else {
//       cb(new Error(`File type not allowed: ${file.mimetype}`));
//     }
//   };
//
//   const upload = multer({
//     storage:    diskStorage,
//     limits:     { fileSize: 5 * 1024 * 1024 },  // 5 MB
//     fileFilter,
//   });
//
//   // ── single file upload ───────────────────────────────────────
//   router.post("/upload/avatar", upload.single("avatar"), (req, res) => {
//     if (!req.file) return res.status(400).json({ error: "No file uploaded" });
//     res.json({ url: `/uploads/${req.file.filename}` });
//   });
//
//   // ── multiple files (same field) ──────────────────────────────
//   router.post("/upload/gallery", upload.array("photos", 10), (req, res) => {
//     const files = req.files as Express.Multer.File[];
//     res.json({ count: files.length, files: files.map(f => f.filename) });
//   });
//
//   // ── multiple fields ──────────────────────────────────────────
//   router.post("/upload/product",
//     upload.fields([
//       { name: "thumbnail", maxCount: 1 },
//       { name: "gallery",   maxCount: 5 },
//     ]),
//     (req, res) => {
//       const files = req.files as { [f: string]: Express.Multer.File[] };
//       res.json({ thumbnail: files.thumbnail?.[0]?.filename });
//     }
//   );
//
//   // ── memoryStorage + S3 ───────────────────────────────────────
//   const memUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10_000_000 } });
//   const s3 = new S3Client({ region: process.env.AWS_REGION });
//
//   router.post("/upload/s3", memUpload.single("file"), async (req, res) => {
//     const file = req.file!;
//     const key  = `uploads/${uuidv4()}${path.extname(file.originalname)}`;
//     await s3.send(new PutObjectCommand({
//       Bucket:      process.env.S3_BUCKET!,
//       Key:         key,
//       Body:        file.buffer,
//       ContentType: file.mimetype,
//     }));
//     res.json({ url: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}` });
//   });

console.log("Multer config (diskStorage):  storage + limits + fileFilter");
console.log("Multer config (memoryStorage): buffer streamed directly to S3");
console.log("Secure filename:               uuid() + original extension only");
console.log("MIME check:                    allowlist of image/* types");

// ───────────────────────────────────────────────────────────────
// 3. Environment Configuration
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. Environment Configuration ===");

/*
  ENVIRONMENT VARIABLES
  ─────────────────────
  Configuration that changes between environments (dev / test / production)
  should live in environment variables, never in source code.
  Examples: DB connection strings, API keys, JWT secrets, port numbers.

  DOTENV
  ──────
  In development, a `.env` file at the project root stores env vars locally.
  `dotenv` reads the file and populates process.env before your app starts.
  NEVER commit `.env` to git — add it to `.gitignore`.
  Commit `.env.example` with placeholder values as documentation.

  Install: npm install dotenv

  VALIDATE AT STARTUP
  ───────────────────
  Do not scatter process.env.SOME_VAR reads throughout the codebase.
  Instead, validate ALL required env vars once, at process startup, with Zod.
  Benefits:
    1. Fail-fast: the server refuses to start rather than breaking later
    2. Clear error message listing exactly which vars are missing
    3. Type-safe config object — no more string | undefined everywhere
    4. Transform strings to numbers/booleans in one place

  NODE_ENV BRANCHING
  ──────────────────
  NODE_ENV controls behavior that differs across environments:
    • "development" — verbose logs, detailed error messages, no minification
    • "test"        — suppress logs, use test DB, faster bcrypt rounds
    • "production"  — minimal logs, no stack traces in responses, trust proxy

  NEVER LOG SECRETS
  ─────────────────
  Never console.log(config) or include secrets in error messages.
  Log config keys that are present, not their values.
*/

// In real code:
//
//   import dotenv from "dotenv";
//   import { z }  from "zod";
//
//   // Load .env file (no-op in production where vars come from the platform)
//   dotenv.config();
//
//   const EnvSchema = z.object({
//     NODE_ENV:    z.enum(["development", "test", "production"]).default("development"),
//     PORT:        z.string().default("3000").transform(Number),
//     DATABASE_URL: z.string().url(),
//     JWT_SECRET:  z.string().min(32),
//     AWS_REGION:  z.string().optional(),
//     S3_BUCKET:   z.string().optional(),
//   });
//
//   // safeParse so we can produce a readable error message
//   const parsed = EnvSchema.safeParse(process.env);
//   if (!parsed.success) {
//     console.error("Missing or invalid environment variables:");
//     parsed.error.errors.forEach(e => {
//       console.error(`  ${e.path.join(".")}: ${e.message}`);
//     });
//     process.exit(1);  // fail-fast — do not start the server
//   }
//
//   export const config = parsed.data;
//   // config.PORT is now a number, not a string
//   // config.JWT_SECRET is string (guaranteed >= 32 chars)
//
//   // NODE_ENV branching
//   if (config.NODE_ENV === "development") {
//     console.log("Running in development mode");
//   }

// Simulation of the startup validation pattern:
function validateEnv(env: Record<string, string | undefined>) {
  const required = ["DATABASE_URL", "JWT_SECRET", "PORT"];
  const missing  = required.filter(k => !env[k]);

  if (missing.length > 0) {
    console.error("FATAL — missing env vars:", missing.join(", "));
    return false;
  }

  // Transform PORT to number
  const port = Number(env.PORT);
  if (isNaN(port) || port < 1 || port > 65535) {
    console.error("FATAL — PORT must be a valid port number");
    return false;
  }

  console.log("Env validated. Present vars:", required.join(", "));
  console.log("NODE_ENV:", env.NODE_ENV ?? "development");
  return true;
}

// Demonstrate fail-fast
validateEnv({ DATABASE_URL: "postgres://localhost/mydb", JWT_SECRET: "supersecretkey32chars!!", PORT: "3000", NODE_ENV: "development" });

// ───────────────────────────────────────────────────────────────
// 4. Security Hardening
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. Security Hardening ===");

/*
  HELMET
  ──────
  helmet() is a collection of small Express middlewares that set HTTP response
  headers which defend against common web vulnerabilities.

  Install: npm install helmet

  Headers it sets (among others):
    Content-Security-Policy    — restricts sources for scripts, styles, fonts
    X-Content-Type-Options     — prevents MIME sniffing (nosniff)
    X-Frame-Options            — prevents clickjacking (DENY or SAMEORIGIN)
    Strict-Transport-Security  — forces HTTPS (HSTS)
    Referrer-Policy            — controls Referer header leakage
    X-Powered-By               — helmet REMOVES this Express default header
                                 so attackers can't fingerprint your stack

  Usage:
    import helmet from "helmet";
    app.use(helmet());          // sensible defaults
    app.use(helmet({ contentSecurityPolicy: false })); // disable one rule

  SQL INJECTION
  ─────────────
  Happens when user input is concatenated directly into a SQL string.

  VULNERABLE:
    const q = `SELECT * FROM users WHERE email = '${req.body.email}'`;
    // Input: ' OR '1'='1   →  returns ALL rows
    // Input: '; DROP TABLE users; --  →  destroys your data

  SAFE (parameterized queries / prepared statements):
    // Raw pg driver:
    const r = await pool.query("SELECT * FROM users WHERE email = $1", [req.body.email]);
    // Prisma (parameterizes automatically):
    const user = await prisma.user.findUnique({ where: { email: req.body.email } });

  Rule: NEVER interpolate user input into SQL strings.

  XSS PREVENTION
  ──────────────
  Cross-Site Scripting: an attacker injects a <script> tag into content that
  is stored in your DB and later rendered in other users' browsers.

  Layers of defence:
    1. Helmet's CSP header restricts which scripts browsers will execute
    2. Escape / sanitize HTML input before storing it
       — sanitize-html: strips disallowed tags and attributes
         npm install sanitize-html
       — DOMPurify: runs in browser (or jsdom on server)
    3. React / Vue / Angular auto-escape by default (innerHTML bypass is opt-in)

  Example with sanitize-html:
    import sanitizeHtml from "sanitize-html";
    const safe = sanitizeHtml(req.body.bio, {
      allowedTags:  ["b", "i", "em", "strong", "a"],
      allowedAttributes: { a: ["href"] },
    });

  MONGODB INJECTION (NoSQL)
  ─────────────────────────
  MongoDB operators like $where, $gt can be injected if req.body is passed
  directly to Mongoose queries.
  express-mongo-sanitize strips keys that start with $ from req.body:
    npm install express-mongo-sanitize
    app.use(mongoSanitize());

  HTTP PARAMETER POLLUTION (HPP)
  ──────────────────────────────
  ?sort=name&sort=price — Express puts both in an array, breaking code that
  expects a string.  hpp middleware keeps only the last value (or a whitelist).
    npm install hpp
    app.use(hpp());
    app.use(hpp({ whitelist: ["filter"] })); // allow arrays for 'filter'
*/

// Security middleware setup (conceptual):
function demonstrateSecurityLayers() {
  const headers: Record<string, string> = {
    "X-Content-Type-Options":        "nosniff",
    "X-Frame-Options":               "DENY",
    "Strict-Transport-Security":     "max-age=31536000; includeSubDomains",
    "Referrer-Policy":               "no-referrer",
    "Content-Security-Policy":       "default-src 'self'",
  };

  console.log("Security headers set by helmet():");
  Object.entries(headers).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  // SQL injection example
  const userInput   = "' OR '1'='1";
  const vulnerable  = `SELECT * FROM users WHERE email = '${userInput}'`;
  const safeQuery   = "SELECT * FROM users WHERE email = $1";
  console.log("\nVulnerable query:", vulnerable);
  console.log("Safe query (parameterized):", safeQuery, "+ params:", [userInput]);

  // XSS: stripping dangerous tags
  const rawInput  = 'Hello <script>stealCookies()</script> <b>World</b>';
  const sanitized = rawInput.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  console.log("\nRaw user input:", rawInput);
  console.log("After sanitize-html:", sanitized);
}

demonstrateSecurityLayers();

// ───────────────────────────────────────────────────────────────
// 5. Error Handling in Production
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Error Handling in Production ===");

/*
  OPERATIONAL vs PROGRAMMER ERRORS
  ──────────────────────────────────
  Operational errors — expected failures in a correctly running program.
    • User sends invalid JSON
    • Request body fails Zod validation
    • Database record not found
    • Third-party API returns 503
  These are not bugs. They are recoverable situations. Handle them gracefully
  and return an appropriate HTTP status code to the client.

  Programmer errors — bugs in the code itself.
    • TypeError: Cannot read property 'x' of undefined
    • Calling an async function without await
    • Out-of-bounds array access
  These should NOT be caught silently. Let the process crash (or restart) so
  the bug surfaces in logs and gets fixed.

  APPERROR CLASS
  ──────────────
  A custom error class lets you attach metadata (HTTP status, isOperational flag)
  and distinguish your deliberate "user-facing" errors from unexpected crashes.

  isOperational = true  → send a user-friendly message, keep the server running
  isOperational = false → log the full stack, restart the process

  NEVER EXPOSE STACK TRACES TO CLIENTS
  ─────────────────────────────────────
  Stack traces reveal file paths, library versions, and internal logic.
  In production, always return a generic message and log the details server-side.

  GLOBAL ERROR HANDLER (Express)
  ──────────────────────────────
  A 4-argument Express middleware is the global error handler.
  All errors passed to next(err) land here.

  ORDER OF MIDDLEWARE:
    app.use(routes)          ← normal routes
    app.use(notFoundHandler) ← catches unmatched routes → 404
    app.use(errorHandler)    ← catches all errors passed via next(err)

  UNHANDLED PROMISE REJECTIONS
  ────────────────────────────
  Any async error not caught with try/catch or .catch() becomes an
  unhandledRejection.  Hook process.on('unhandledRejection') to log it and
  initiate a graceful shutdown.
*/

// AppError class
class AppError extends Error {
  readonly statusCode:   number;
  readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode    = statusCode;
    this.isOperational = isOperational;
    // Restore the prototype chain (required when extending built-ins in TypeScript)
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Factory helpers
const notFound       = (resource: string)   => new AppError(`${resource} not found`, 404);
const unauthorized   = ()                    => new AppError("Authentication required", 401);
const forbidden      = ()                    => new AppError("Insufficient permissions", 403);
const validationFail = (message: string)     => new AppError(message, 422);

// Simulated global error handler logic
function handleError(err: unknown, isProduction: boolean): { status: number; body: object } {
  if (err instanceof AppError && err.isOperational) {
    // Operational — safe to tell the client
    return {
      status: err.statusCode,
      body:   { error: err.message },
    };
  }

  // Programmer error or unknown — do not leak internals
  const stack = err instanceof Error ? err.stack : String(err);
  console.error("UNHANDLED ERROR (log to monitoring):", stack);

  return {
    status: 500,
    body:   {
      error: isProduction
        ? "An unexpected error occurred"
        : (err instanceof Error ? err.message : String(err)),
    },
  };
}

// Demo
const userErr   = notFound("User");
const crashErr  = new TypeError("Cannot read property 'x' of undefined");

console.log("Operational error response:", handleError(userErr,  true));
console.log("Programmer error response: ", handleError(crashErr, true));

// Hooks for unhandled errors (would live in your server entry file):
//
//   process.on("unhandledRejection", (reason) => {
//     console.error("Unhandled rejection:", reason);
//     server.close(() => process.exit(1));
//   });
//
//   process.on("uncaughtException", (err) => {
//     console.error("Uncaught exception:", err);
//     process.exit(1); // always exit — state is now unknown
//   });

// ───────────────────────────────────────────────────────────────
// 6. Graceful Shutdown
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. Graceful Shutdown ===");

/*
  WHY GRACEFUL SHUTDOWN?
  ──────────────────────
  When a container orchestrator (Kubernetes, ECS) needs to restart or scale
  down your service, it sends SIGTERM.  If you exit immediately:
    • In-flight HTTP requests get dropped (clients see connection reset)
    • Open DB transactions may be left incomplete
    • Cache writes may not flush

  THE SEQUENCE
  ─────────────
  1. Receive SIGTERM (or SIGINT from Ctrl-C in dev)
  2. Stop accepting NEW connections:  server.close(callback)
  3. Wait for in-flight requests to finish (server.close does this)
  4. Close database connections (prisma.$disconnect(), pool.end(), etc.)
  5. Exit with code 0 (success) — code 1 indicates an error

  TIMEOUT SAFETY NET
  ──────────────────
  Add a forced-exit timeout (e.g. 10 s) so a stuck request doesn't prevent
  shutdown forever:
    setTimeout(() => { console.error("Forced shutdown"); process.exit(1); }, 10_000);

  EXIT CODES
  ──────────
  process.exit(0) — clean shutdown, orchestrators treat as healthy restart
  process.exit(1) — error, orchestrators may alert and will restart the process
*/

// In a real server entry file (index.ts / server.ts):
//
//   const server = app.listen(config.PORT, () => {
//     console.log(`Listening on port ${config.PORT}`);
//   });
//
//   async function shutdown(signal: string) {
//     console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
//
//     // 1. Stop accepting new connections
//     server.close(async () => {
//       console.log("HTTP server closed");
//
//       try {
//         // 2. Close DB connections
//         await prisma.$disconnect();
//         console.log("Database disconnected");
//         process.exit(0);
//       } catch (err) {
//         console.error("Error during shutdown:", err);
//         process.exit(1);
//       }
//     });
//
//     // 3. Force exit if it takes too long
//     setTimeout(() => {
//       console.error("Graceful shutdown timed out — forcing exit");
//       process.exit(1);
//     }, 10_000);
//   }
//
//   process.on("SIGTERM", () => shutdown("SIGTERM")); // from container orchestrator
//   process.on("SIGINT",  () => shutdown("SIGINT"));  // Ctrl-C in development

function simulateShutdown(signal: string) {
  console.log(`\n[Shutdown] Received ${signal}`);
  console.log("[Shutdown] Step 1: server.close() — stop accepting new connections");
  console.log("[Shutdown] Step 2: wait for in-flight requests to complete");
  console.log("[Shutdown] Step 3: prisma.$disconnect() / pool.end()");
  console.log("[Shutdown] Step 4: process.exit(0)");
}

simulateShutdown("SIGTERM");

// ───────────────────────────────────────────────────────────────
// 7. Health Check Endpoints
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. Health Check Endpoints ===");

/*
  LIVENESS vs READINESS
  ──────────────────────
  GET /health  (liveness probe)
    • Question: "Is the process alive and the event loop running?"
    • Answer fast — no DB call, no external I/O
    • If this fails, the orchestrator RESTARTS the process
    • Response: 200 OK always (if the process can respond at all)

  GET /health/ready  (readiness probe)
    • Question: "Is the app ready to serve production traffic?"
    • Checks actual dependencies: DB, Redis, external APIs
    • If this fails, the orchestrator STOPS sending traffic (but does not restart)
    • Use this: during startup before DB connection is established, and
                temporarily during high load or maintenance

  Kubernetes uses both; simpler platforms (Railway, Render) often only use /health.

  RESPONSE FORMAT
  ───────────────
  Standardise on a small JSON object so monitoring tools can parse it:
    {
      "status":    "ok" | "degraded" | "error",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "checks": {
        "database": "ok",
        "redis":    "error"
      },
      "uptime": 3600
    }
*/

// Simulated health check handlers (no Express at runtime):
type HealthStatus = "ok" | "degraded" | "error";

interface HealthCheckResult {
  status:    HealthStatus;
  timestamp: string;
  uptime:    number;
  checks?:   Record<string, HealthStatus>;
}

function livenessCheck(): HealthCheckResult {
  return {
    status:    "ok",
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
  };
}

async function readinessCheck(dbConnected: boolean): Promise<{ httpStatus: number; body: HealthCheckResult }> {
  const checks: Record<string, HealthStatus> = {
    database: dbConnected ? "ok" : "error",
  };

  const allOk  = Object.values(checks).every(s => s === "ok");
  const status: HealthStatus = allOk ? "ok" : "error";

  return {
    httpStatus: allOk ? 200 : 503,
    body: {
      status,
      timestamp: new Date().toISOString(),
      uptime:    process.uptime(),
      checks,
    },
  };
}

console.log("GET /health (liveness):", livenessCheck());

(async () => {
  const ready    = await readinessCheck(true);
  const notReady = await readinessCheck(false);
  console.log("GET /health/ready (DB up):   HTTP", ready.httpStatus,    ready.body.status);
  console.log("GET /health/ready (DB down): HTTP", notReady.httpStatus, notReady.body.status);

// ───────────────────────────────────────────────────────────────
// 8. Compression and Performance
// ───────────────────────────────────────────────────────────────

console.log("\n=== 8. Compression and Performance ===");

/*
  GZIP COMPRESSION
  ─────────────────
  The `compression` middleware compresses HTTP response bodies with gzip
  (or brotli if the client sends Accept-Encoding: br).

  Install: npm install compression
           npm install --save-dev @types/compression

  Usage:
    import compression from "compression";
    app.use(compression());                  // compress all responses > 1 KB
    app.use(compression({ threshold: 0 })); // compress everything

  WHEN IT HELPS
  ─────────────
  High text-to-size ratio payloads benefit most:
    • JSON API responses             → typical 60–80% size reduction
    • HTML pages                     → similar gains
    • Large CSV / log files          → large gains

  WHEN IT DOES NOT HELP (or hurts)
  ──────────────────────────────────
    • Already-compressed formats: JPEG, PNG, MP4, PDF — essentially no gain,
      and you waste CPU cycles
    • Very small responses (< 1 KB) — gzip header overhead cancels the saving
    • High-frequency, tiny API responses (health checks, ping) — skip compression

  Place compression() EARLY in the middleware chain (before routes) but AFTER
  helmet(), so helmet still sees the unmodified response headers.

  CACHE-CONTROL FOR STATIC ASSETS
  ─────────────────────────────────
  Tell browsers (and CDNs) how long to cache a response before re-requesting it.

  Cache-Control: public, max-age=31536000, immutable
    • public       — shared caches (CDN) may cache this
    • max-age=N    — cache for N seconds (31536000 = 1 year)
    • immutable    — content at this URL never changes — skip revalidation

  Combine with content-hashed filenames (bundlers do this: main.a3f9b.js)
  so a new deploy produces a new URL, busting the cache automatically.

  For dynamic API responses that change often:
    Cache-Control: no-store              — never cache
    Cache-Control: private, max-age=60  — only the browser (not CDN) caches for 60 s

  ETAG AND CONDITIONAL REQUESTS
  ──────────────────────────────
  An ETag is a fingerprint (hash) of the response body.
  Express sets ETags automatically for responses sent with res.send().

  Flow:
    1. Client requests GET /data. Server responds: 200 + ETag: "abc123"
    2. Client caches the response and ETag.
    3. Next request: client sends If-None-Match: "abc123".
    4. Server recomputes the ETag. If unchanged: 304 Not Modified (no body).
       Body is not re-transmitted — saves bandwidth.

  Use express.static() for static files; it handles ETags and Last-Modified
  automatically:
    app.use("/static", express.static("public", { maxAge: "1y", immutable: true }));
*/

// Middleware setup summary (conceptual):
const performanceMw = [
  { name: "helmet()",      purpose:   "Security headers — goes first" },
  { name: "compression()", purpose:   "Gzip responses — before routes" },
  { name: "express.json()", purpose:  "Parse JSON bodies" },
  { name: "express.static()", purpose: "Serve static files with ETag + Cache-Control" },
];

console.log("Recommended middleware order:");
performanceMw.forEach((m, i) => console.log(`  ${i + 1}. ${m.name.padEnd(20)} ${m.purpose}`));

const cacheExamples: { path: string; header: string }[] = [
  { path: "/static/main.a3f9b.js", header: "public, max-age=31536000, immutable" },
  { path: "/api/users",            header: "no-store" },
  { path: "/api/profile",          header: "private, max-age=60" },
];

console.log("\nCache-Control examples:");
cacheExamples.forEach(e => console.log(`  ${e.path.padEnd(30)} → ${e.header}`));

// ───────────────────────────────────────────────────────────────
// Practice Q&A
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice Q&A ===");

const qa: { q: string; a: string }[] = [
  {
    q: "What's the difference between .parse() and .safeParse() in Zod?",
    a: ".parse() returns the validated data directly but THROWS a ZodError on "
     + "failure — use it inside try/catch or when input is guaranteed valid. "
     + ".safeParse() never throws; instead it returns { success: true, data } or "
     + "{ success: false, error }. Use .safeParse() in HTTP handlers so you can "
     + "return a structured 400 response without a try/catch.",
  },
  {
    q: "A user uploads a file renamed to 'shell.php'. How do you prevent it from being executed?",
    a: "Three layers of defence: (1) validate req.file.mimetype against an "
     + "allowlist (e.g. image/jpeg, image/png) in Multer's fileFilter — reject "
     + "anything else before it's written to disk. (2) Generate a UUID-based "
     + "filename, preserving only the extension — never use the original name. "
     + "(3) Serve uploaded files from a path that is NOT processed by any "
     + "server-side interpreter (e.g. a separate S3 bucket or a static-files "
     + "directory with no PHP/Node execution). For extra certainty, use the "
     + "'file-type' package to read the file's magic bytes instead of trusting "
     + "the MIME header which the client can spoof.",
  },
  {
    q: "What's an operational error vs a programmer error? Give an example of each.",
    a: "Operational error — an expected failure in a correctly functioning program. "
     + "Example: a user submits a login form with a wrong password → return 401. "
     + "The app handles it and keeps running. "
     + "Programmer error — a bug in the code itself. "
     + "Example: TypeError: Cannot read property 'id' of undefined — because a "
     + "developer forgot to check whether a DB query returned null. "
     + "These should not be caught silently; let the process crash or restart so "
     + "the bug surfaces and gets fixed.",
  },
  {
    q: "Why should you validate environment variables at startup rather than when they're first used?",
    a: "Fail-fast principle: if DATABASE_URL is missing, the server should refuse "
     + "to start with a clear error message rather than booting successfully and "
     + "then crashing on the first DB call — possibly hours later in production. "
     + "Startup validation also makes the missing variable immediately obvious in "
     + "deploy logs, and it lets you produce ONE typed config object that the rest "
     + "of the codebase imports, eliminating scattered process.env reads and "
     + "'string | undefined' handling throughout your code.",
  },
  {
    q: "Your server receives SIGTERM. What should happen before the process exits?",
    a: "1. Stop accepting new connections by calling server.close(). "
     + "2. Wait for all in-flight requests to complete (server.close() does this). "
     + "3. Close database connections gracefully (prisma.$disconnect(), pool.end()). "
     + "4. Flush any buffered logs or metrics. "
     + "5. Exit with code 0 to signal a clean shutdown. "
     + "Add a forced-exit timeout (e.g. 10 s) as a safety net so a stuck request "
     + "cannot prevent the process from ever exiting.",
  },
];

qa.forEach(({ q, a }, i) => {
  console.log(`\nQ${i + 1}: ${q}`);
  console.log(`A${i + 1}: ${a}`);
});

// ───────────────────────────────────────────────────────────────
// runDemo — reference card
// ───────────────────────────────────────────────────────────────

function runDemo() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║              BACKEND 05 — PRODUCTION HARDENING  REFERENCE CARD           ║
╠══════════════════════════════════════════════════════════════════════════╣
║  INPUT VALIDATION (Zod)                                                   ║
║    z.object({...}).safeParse(req.body)  → { success, data | error }      ║
║    z.infer<typeof Schema>               → TypeScript type for free        ║
║    .transform()                         → reshape during validation       ║
║    .refine(fn, msg)                     → custom predicate                ║
║    z.discriminatedUnion("type", [...])  → polymorphic request bodies      ║
║    validateBody(Schema) middleware      → returns structured 400          ║
╠══════════════════════════════════════════════════════════════════════════╣
║  FILE UPLOADS (Multer)                                                    ║
║    multer({ storage, limits, fileFilter })  → configure once             ║
║    diskStorage  → files on disk; memoryStorage → Buffer → S3             ║
║    fileFilter   → check mimetype against allowlist                        ║
║    secure name  → uuidv4() + path.extname() only                         ║
║    upload.single("f") / .array("f",n) / .fields([...])                  ║
╠══════════════════════════════════════════════════════════════════════════╣
║  ENVIRONMENT CONFIG                                                        ║
║    dotenv.config() → loads .env                                           ║
║    Zod schema on process.env at startup → fail-fast, typed config        ║
║    Never log config values — only log which keys are present              ║
║    NODE_ENV: development | test | production                              ║
╠══════════════════════════════════════════════════════════════════════════╣
║  SECURITY                                                                  ║
║    helmet()              → sets 6+ protective headers, removes X-Powered-By ║
║    Parameterized queries → prevent SQL injection (never interpolate)      ║
║    sanitize-html         → strip dangerous tags before storing            ║
║    express-mongo-sanitize → strip $ operators from req.body              ║
║    hpp()                 → prevent HTTP parameter pollution               ║
╠══════════════════════════════════════════════════════════════════════════╣
║  ERROR HANDLING                                                            ║
║    AppError(msg, status, isOperational)                                   ║
║    isOperational=true  → tell client, keep running                        ║
║    isOperational=false → log full stack, restart process                 ║
║    Global error handler: 4-arg Express middleware                         ║
║    process.on("unhandledRejection") → log + graceful shutdown             ║
║    NEVER send stack traces to clients in production                       ║
╠══════════════════════════════════════════════════════════════════════════╣
║  GRACEFUL SHUTDOWN                                                         ║
║    SIGTERM/SIGINT → server.close() → db.disconnect() → exit(0)           ║
║    Forced-exit timeout: setTimeout(exit(1), 10_000)                      ║
╠══════════════════════════════════════════════════════════════════════════╣
║  HEALTH CHECKS                                                             ║
║    GET /health       → liveness  (200 always, no I/O)                    ║
║    GET /health/ready → readiness (checks DB, returns 503 if not ready)   ║
║    Response: { status, timestamp, uptime, checks }                        ║
╠══════════════════════════════════════════════════════════════════════════╣
║  COMPRESSION & PERFORMANCE                                                 ║
║    compression()  → gzip JSON/HTML; skip for images/video                ║
║    Place AFTER helmet(), BEFORE routes                                    ║
║    Static assets: Cache-Control: public, max-age=31536000, immutable     ║
║    API routes:    Cache-Control: no-store                                 ║
║    ETags:         automatic with res.send(); 304 if unchanged             ║
╚══════════════════════════════════════════════════════════════════════════╝
`);
}

runDemo();

})(); // end async IIFE

export default runDemo;
