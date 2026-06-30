// ═══════════════════════════════════════════════════════════════
// BACKEND 14: NODEMAILER · EMAIL TEMPLATES · MULTER · FILE STORAGE · S3  (Day 49)
// Run: npx ts-node 14-email-storage.ts
// ═══════════════════════════════════════════════════════════════
//
// This file covers the full email + file-storage stack used in
// production Node.js applications:
//
//  • Nodemailer — sending email via SMTP / SendGrid / SES
//  • Email templates — Handlebars, HTML quirks, MJML
//  • Email best practices — background jobs, SPF/DKIM, retries
//  • Multer — file uploads (disk, memory, limits, file filter)
//  • Local file storage — serving, limitations
//  • AWS S3 — PutObject / GetObject / Delete / List (SDK v3)
//  • S3 presigned URLs — client-direct upload / download
//  • File storage patterns — public vs private, CDN, type validation, metadata
//
// NOTE: This file contains RUNNABLE TypeScript that simulates the
// APIs with stubs so you can study patterns without live credentials.
// In a real project you install the actual packages and remove the stubs.

// ───────────────────────────────────────────────────────────────
// STUB SECTION — simulated third-party modules
// (Replace with real imports in an actual project)
// ───────────────────────────────────────────────────────────────

/*
  Real imports you would use:
  import nodemailer from "nodemailer";
  import handlebars from "handlebars";
  import fs from "fs";
  import path from "path";
  import multer from "multer";
  import { Request, Response, NextFunction } from "express";
  import {
    S3Client, PutObjectCommand, GetObjectCommand,
    DeleteObjectCommand, ListObjectsV2Command,
  } from "@aws-sdk/client-s3";
  import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
*/

// ── Minimal stubs so ts-node can run this file without the packages ──

interface MailOptions {
  from?: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{ filename: string; path?: string; content?: Buffer | string }>;
}

interface SentMessageInfo { messageId: string; previewURL?: string }

interface Transporter {
  sendMail(options: MailOptions): Promise<SentMessageInfo>;
  verify?(): Promise<true>;
}

// Simulates nodemailer.createTransport()
function createTransport(_config: Record<string, unknown>): Transporter {
  return {
    async sendMail(opts: MailOptions): Promise<SentMessageInfo> {
      console.log(`  [SMTP STUB] → To: ${opts.to} | Subject: "${opts.subject}"`);
      return { messageId: `<stub-${Date.now()}@example.com>`, previewURL: "https://ethereal.email/stub" };
    },
    async verify(): Promise<true> {
      console.log("  [SMTP STUB] Connection verified");
      return true;
    },
  };
}

// ───────────────────────────────────────────────────────────────
// 1. Email with Nodemailer
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Email with Nodemailer ===");

/*
  CONCEPT: Transport configurations

  ① Gmail (personal / small apps)
      host: "smtp.gmail.com", port: 587, secure: false
      auth: { user: "you@gmail.com", pass: "<16-char app password>" }
      — Google account → Security → 2-Step → App Passwords
      — Use "Less Secure Apps" only in emergencies; App Passwords are correct

  ② SendGrid (recommended for production)
      host: "smtp.sendgrid.net", port: 587
      auth: { user: "apikey", pass: process.env.SENDGRID_API_KEY }
      — Free tier: 100 emails/day. Has dashboards, bounce/spam tracking.

  ③ AWS SES (cheapest at scale — $0.10 / 1000 emails)
      host: "email-smtp.<region>.amazonaws.com", port: 587
      auth: { user: process.env.SES_SMTP_USER, pass: process.env.SES_SMTP_PASS }
      — Must verify your "From" domain or address first in the SES console.

  ④ Ethereal (fake SMTP — only for development)
      nodemailer.createTestAccount() → generates throwaway credentials
      Emails are CAPTURED, never actually delivered — perfect for dev.
*/

// Gmail transport (production-like)
const gmailTransport = createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,             // STARTTLS — upgrades after handshake
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // NOT your real password
  },
});

// SendGrid transport
const sendGridTransport = createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    user: "apikey",          // literal string "apikey"
    pass: process.env.SENDGRID_API_KEY,
  },
});

// Ethereal (dev) transport — in real code you await nodemailer.createTestAccount()
const etherealTransport = createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: "dev@ethereal.email",
    pass: "devpass",
  },
});

// Full mailOptions anatomy
async function sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
  const mailOptions: MailOptions = {
    from:    '"My App" <noreply@myapp.com>',   // display name + address
    to:      userEmail,                          // single address or array
    cc:      "team@myapp.com",                  // optional
    bcc:     "archive@myapp.com",               // never visible to recipients
    subject: `Welcome, ${userName}!`,
    // Always provide BOTH text and html — email clients use text as fallback
    text: `Hi ${userName},\n\nWelcome to My App!\n\nThanks,\nThe Team`,
    html: `<h1>Hi ${userName},</h1><p>Welcome to <strong>My App</strong>!</p>`,
    attachments: [
      { filename: "welcome.pdf", path: "/tmp/welcome.pdf" },  // file on disk
      { filename: "logo.png",    content: Buffer.from("..base64..") }, // in-memory
    ],
  };

  const info = await etherealTransport.sendMail(mailOptions);
  console.log("  Sent:", info.messageId);
  // In dev, paste info.previewURL into browser to see the captured email
  if (info.previewURL) console.log("  Preview:", info.previewURL);
}

await sendWelcomeEmail("user@example.com", "Sadik");

// ───────────────────────────────────────────────────────────────
// 2. Email Templates
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. Email Templates ===");

/*
  APPROACH 1 — Plain string interpolation (fragile)
  Fine for one-liners; breaks for multi-line HTML.
*/
function buildPlainTemplate(name: string, otp: string): string {
  return `<h1>Hi ${name}</h1><p>Your OTP: <strong>${otp}</strong></p>`;
}
console.log("  Plain template (first 60 chars):", buildPlainTemplate("Sadik", "123456").slice(0, 60));

/*
  APPROACH 2 — Handlebars (recommended)

  templates/otp.hbs:
    <h1>Hi {{name}},</h1>
    <p>Your OTP is: <strong>{{otp}}</strong></p>
    <p>It expires in {{expiryMinutes}} minutes.</p>

  Code:
    import handlebars from "handlebars";
    import fs from "fs";
    import path from "path";

    const source = fs.readFileSync(
      path.join(__dirname, "templates/otp.hbs"), "utf8"
    );
    const compiled = handlebars.compile(source);
    const html = compiled({ name: "Sadik", otp: "998877", expiryMinutes: 10 });

  APPROACH 3 — nodemailer-express-handlebars plugin
    Wires Handlebars directly into the transporter:

    import hbs from "nodemailer-express-handlebars";
    transporter.use("compile", hbs({
      viewEngine: { defaultLayout: false },
      viewPath: path.join(__dirname, "templates"),
    }));

    await transporter.sendMail({
      template: "otp",          // looks for templates/otp.hbs
      context: { name: "Sadik", otp: "998877" },
      ...
    });
*/

// Simulated Handlebars compile (stub)
function handlebarsCompile(templateSource: string): (ctx: Record<string, string>) => string {
  return (ctx) =>
    templateSource.replace(/\{\{(\w+)\}\}/g, (_, key) => ctx[key] ?? "");
}

const otpTemplateSource = "<h1>Hi {{name}},</h1><p>OTP: <strong>{{otp}}</strong></p><p>Expires in {{expiryMinutes}} min.</p>";
const otpTemplate = handlebarsCompile(otpTemplateSource);
const renderedOtp = otpTemplate({ name: "Sadik", otp: "998877", expiryMinutes: "10" });
console.log("  Handlebars render:", renderedOtp);

/*
  HTML EMAIL QUIRKS — critical things that catch developers off-guard:

  1. NO external CSS classes — Gmail strips <style> tags.
     ✅ Use INLINE styles:  <p style="color:#333; font-size:16px;">
     ❌ Never:              <p class="body-text">

  2. TABLE LAYOUT — many clients (Outlook) ignore modern CSS flex/grid.
     Use nested <table> for layout if you need Outlook compatibility.

  3. NO JavaScript — stripped by every mail client. Don't use it.

  4. Images — must be publicly accessible URLs, or base64 inline.
     Use absolute URLs: <img src="https://cdn.myapp.com/logo.png">

  5. Max width — wrap content in a centered 600px table for desktop+mobile.

  6. MJML — framework that compiles readable HTML into table-layout soup:
     import mjml2html from "mjml";
     const { html } = mjml2html(`
       <mjml>
         <mj-body>
           <mj-section><mj-column>
             <mj-text>Hi {{name}}</mj-text>
           </mj-column></mj-section>
         </mj-body>
       </mjml>
     `);
     — Handles cross-client compatibility automatically.

  7. Preview in dev — use a service like mailhog (docker) or Ethereal
     to see exactly how the email renders without spamming real inboxes.
*/

console.log("  HTML email quirks: inline styles, table layout, no JS, absolute image URLs");

// ───────────────────────────────────────────────────────────────
// 3. Email Best Practices
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. Email Best Practices ===");

/*
  ① NEVER block the HTTP response on email sending
    ❌ BAD:
      app.post("/register", async (req, res) => {
        await createUser(req.body);
        await sendWelcomeEmail(req.body.email);  // blocks! SMTP can take seconds
        res.json({ ok: true });
      });

    ✅ GOOD — push to a queue (BullMQ, RabbitMQ, SQS):
      app.post("/register", async (req, res) => {
        await createUser(req.body);
        await emailQueue.add("welcome", { email: req.body.email });
        res.json({ ok: true });   // returns instantly
      });

      // Background worker:
      emailQueue.process("welcome", async (job) => {
        await sendWelcomeEmail(job.data.email);
      });

  ② RETRY on transient failures — SMTP servers timeout:
      emailQueue.add("welcome", data, {
        attempts: 5,
        backoff: { type: "exponential", delay: 2000 },
      });

  ③ EMAIL VALIDATION before sending:
*/

function isValidEmail(email: string): boolean {
  // This regex is good enough for basic validation;
  // definitive validation = actually send an email and check bounce.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
console.log("  Valid:", isValidEmail("sadik@example.com"));   // true
console.log("  Invalid:", isValidEmail("notanemail"));          // false

/*
  ④ UNSUBSCRIBE link — required by CAN-SPAM (US) and GDPR (EU).
     Every marketing email must include a one-click unsubscribe link.
     Transactional emails (receipts, OTPs) are generally exempt.

  ⑤ SPF / DKIM / DMARC — DNS records that prove you own your domain.
     Without them, Gmail and Outlook may mark your email as spam.

     SPF  — lists which servers are allowed to send from your domain.
             TXT record: "v=spf1 include:sendgrid.net ~all"

     DKIM — your mail server cryptographically signs each email.
             TXT record: "v=DKIM1; k=rsa; p=<public key>"

     DMARC — policy: what to do if SPF/DKIM fail (none / quarantine / reject).
             TXT record: "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"

     Setup: your email provider (SendGrid, SES) gives you the exact DNS records.

  ⑥ DEV vs PRODUCTION routing:
     env === "production" → real SMTP (SendGrid / SES)
     env === "development" → Ethereal (emails captured, never delivered)
     env === "test" → nodemailer.createTransport({ jsonTransport: true })
                      (stores email as JSON, no network at all)
*/

function getTransport(env: string): Transporter {
  if (env === "production") return sendGridTransport;
  if (env === "test")       return createTransport({ jsonTransport: true });
  return etherealTransport;    // development default
}
const transport = getTransport("development");
console.log("  Transport selected for 'development':", transport ? "ethereal" : "none");

// ───────────────────────────────────────────────────────────────
// 4. File Uploads with Multer
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. File Uploads with Multer ===");

/*
  Multer is Express middleware that parses multipart/form-data (file uploads).

  TWO storage engines:

  ① diskStorage — saves directly to disk
      const diskStorage = multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, "public/uploads/"),
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname);
          cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
        },
      });

  ② memoryStorage — keeps file as Buffer in req.file.buffer (RAM)
      const memStorage = multer.memoryStorage();
      — Use this when you need to pipe the buffer straight to S3 / resize it.
      — DANGER: large files will exhaust server RAM; always set limits.
*/

// Simulated Multer types for demonstration
interface MulterFile {
  fieldname: string;
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;     // only when memoryStorage
  path?: string;       // only when diskStorage
}

// fileFilter — whitelist allowed MIME types
function imageFileFilter(
  _req: unknown,
  file: MulterFile,
  cb: (err: Error | null, accept: boolean) => void
): void {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Only images allowed. Received: ${file.mimetype}`), false);
  }
}

// Simulate calling fileFilter
function simulateFileFilter(file: MulterFile): string {
  let result = "";
  imageFileFilter(null, file, (err, accept) => {
    result = err ? `Rejected: ${err.message}` : `Accepted: ${file.originalname}`;
  });
  return result;
}
console.log("  " + simulateFileFilter({ fieldname: "avatar", originalname: "photo.jpg",  mimetype: "image/jpeg",       size: 50000 }));
console.log("  " + simulateFileFilter({ fieldname: "avatar", originalname: "shell.php",  mimetype: "application/x-php", size: 1000 }));

/*
  FULL MULTER SETUP (paste this into your Express app):

    import multer, { MulterError } from "multer";

    const upload = multer({
      storage: multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, "public/uploads/"),
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname);
          cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024,   // 5 MB per file
        files: 5,                      // max 5 files per request
      },
      fileFilter: imageFileFilter,
    });

    // Route handlers:
    router.post("/avatar",   upload.single("avatar"),          handler);  // one file
    router.post("/gallery",  upload.array("photos", 10),       handler);  // up to 10
    router.post("/mixed",    upload.fields([                               // named fields
      { name: "cover", maxCount: 1 },
      { name: "attachments", maxCount: 5 },
    ]), handler);
    router.post("/any",      upload.any(),                     handler);  // any field

    // Error handling — MUST wrap in express error middleware:
    app.use((err, _req, res, _next) => {
      if (err instanceof MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "File too large" });
        if (err.code === "LIMIT_FILE_COUNT") return res.status(400).json({ error: "Too many files" });
      }
      res.status(400).json({ error: err.message });
    });
*/

// Simulate MulterError detection
class MulterError extends Error {
  constructor(public code: string, message?: string) { super(message ?? code); }
}

function handleUploadError(err: Error): string {
  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE")  return "413 File too large";
    if (err.code === "LIMIT_FILE_COUNT") return "400 Too many files";
  }
  return `400 ${err.message}`;
}
console.log("  " + handleUploadError(new MulterError("LIMIT_FILE_SIZE")));
console.log("  " + handleUploadError(new Error("Only images allowed")));

// ───────────────────────────────────────────────────────────────
// 5. Local File Storage
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Local File Storage ===");

/*
  SERVING UPLOADS:
    app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
    // File at: public/uploads/1234567890-abc.jpg
    // URL at:  https://yourapp.com/uploads/1234567890-abc.jpg

  GENERATING THE PUBLIC URL:
    function getLocalFileUrl(req: Request, filename: string): string {
      return `${req.protocol}://${req.get("host")}/uploads/${filename}`;
    }

  WHY LOCAL STORAGE IS FINE IN DEV BUT BAD IN PRODUCTION:

  ✅ Pros:
    - Zero setup — works immediately
    - No external service dependency
    - Free

  ❌ Cons:
    1. SINGLE SERVER — if you run 3 instances behind a load balancer,
       only the instance that received the upload has the file.
       The other two 404.

    2. EPHEMERAL ON HEROKU / RAILWAY / RENDER — deploying wipes the
       filesystem. All uploaded files disappear on every deploy.

    3. NO CDN — every file request hits your Node.js server.
       That's wasted CPU and bandwidth.

    4. BACKUP COMPLEXITY — you have to manually back up disk files.

  RULE: Use local storage only for local development.
        Use S3 (or equivalent) for staging and production.
*/

function generateLocalFilename(originalName: string): string {
  const ext = originalName.split(".").pop() ?? "bin";
  const id  = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${id}.${ext}`;
}
const localFilename = generateLocalFilename("profile_photo.jpg");
const localUrl      = `http://localhost:3000/uploads/${localFilename}`;
console.log("  Local filename:", localFilename);
console.log("  Local URL:", localUrl);
console.log("  Problems: single-server, ephemeral deploys, no CDN");

// ───────────────────────────────────────────────────────────────
// 6. AWS S3
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. AWS S3 ===");

/*
  CONCEPTS:
    Bucket  — top-level container (like a drive). Globally unique name.
    Object  — a file stored in a bucket.
    Key     — the object's "path" within the bucket:
              "avatars/users/42/profile.jpg"
    Region  — where the bucket physically lives: "us-east-1", "ap-south-1", etc.
              Always choose the region closest to your users / compute.

  AUTHENTICATION:
    AWS reads credentials from environment variables (set in .env):
      AWS_ACCESS_KEY_ID     = AKIA...
      AWS_SECRET_ACCESS_KEY = wJalr...
      AWS_REGION            = ap-south-1

    NEVER hard-code credentials in source code.
    Use IAM roles for production (EC2/Lambda automatically receive temporary creds).

  SDK v3 SETUP:
    import { S3Client } from "@aws-sdk/client-s3";
    const s3 = new S3Client({ region: process.env.AWS_REGION });
*/

// Stubbed S3Client for demonstration
interface S3Command { _type: string; Bucket: string; Key: string }

class S3Client {
  constructor(private config: { region: string }) {}
  async send(command: S3Command): Promise<Record<string, unknown>> {
    console.log(`  [S3 STUB] ${command._type} s3://${command.Bucket}/${command.Key}`);
    return { ETag: '"stub-etag"', ContentLength: 1024, Body: Buffer.from("stub") };
  }
}

class PutObjectCommand implements S3Command {
  _type = "PutObject";
  Bucket: string; Key: string;
  constructor(public input: { Bucket: string; Key: string; Body: Buffer | string; ContentType?: string }) {
    this.Bucket = input.Bucket; this.Key = input.Key;
  }
}
class GetObjectCommand implements S3Command {
  _type = "GetObject";
  Bucket: string; Key: string;
  constructor(public input: { Bucket: string; Key: string }) {
    this.Bucket = input.Bucket; this.Key = input.Key;
  }
}
class DeleteObjectCommand implements S3Command {
  _type = "DeleteObject";
  Bucket: string; Key: string;
  constructor(public input: { Bucket: string; Key: string }) {
    this.Bucket = input.Bucket; this.Key = input.Key;
  }
}
class ListObjectsV2Command implements S3Command {
  _type = "ListObjectsV2";
  Bucket: string; Key: string;
  constructor(public input: { Bucket: string; Prefix?: string }) {
    this.Bucket = input.Bucket; this.Key = input.Prefix ?? "";
  }
}

const s3 = new S3Client({ region: process.env.AWS_REGION ?? "ap-south-1" });
const BUCKET = process.env.S3_BUCKET ?? "my-app-bucket";

// PutObject — upload a file
async function uploadToS3(
  fileBuffer: Buffer,
  s3Key: string,
  mimeType: string
): Promise<string> {
  await s3.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         s3Key,
    Body:        fileBuffer,
    ContentType: mimeType,
  }));
  // Public URL (only for public-read buckets):
  return `https://${BUCKET}.s3.amazonaws.com/${s3Key}`;
}

// GetObject — download a file
async function downloadFromS3(s3Key: string): Promise<void> {
  const response = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: s3Key }));
  // response.Body is a ReadableStream in real SDK; pipe to file or response
  console.log("  Downloaded object, ETag:", response.ETag);
}

// DeleteObject — remove a file
async function deleteFromS3(s3Key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: s3Key }));
}

// ListObjectsV2 — list files under a prefix
async function listS3Objects(prefix: string): Promise<void> {
  await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix }));
  // response.Contents = [{ Key, Size, LastModified, ETag }, ...]
}

// Run all four operations
const s3Key    = `avatars/user-42/${generateLocalFilename("photo.jpg")}`;
const fakeBuffer = Buffer.from("fake image bytes");
const publicUrl  = await uploadToS3(fakeBuffer, s3Key, "image/jpeg");
console.log("  Public URL:", publicUrl);
await downloadFromS3(s3Key);
await listS3Objects("avatars/user-42/");
await deleteFromS3(s3Key);

// ───────────────────────────────────────────────────────────────
// 7. S3 Presigned URLs
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. S3 Presigned URLs ===");

/*
  PROBLEM: Uploading through your server = double bandwidth cost.
    Client → (file bytes) → Your Server → (file bytes) → S3
    Your server is a middle-man that adds latency and costs egress.

  SOLUTION: Presigned PUT URL — client uploads DIRECTLY to S3.
    1. Client requests a presigned URL from your API.
    2. Your server calls S3 to generate a time-limited signed URL.
    3. Server returns the URL to the client (no file data touched).
    4. Client does HTTP PUT directly to S3 using that URL.
    5. Client notifies your server: "I uploaded — here's the S3 key."
    6. Your server stores the S3 key in the database.

  PRESIGNED GET URL — temporary download link for PRIVATE objects.
    - Private bucket: objects not publicly accessible.
    - To let a user download, generate a signed URL that expires in N seconds.
    - The URL includes an HMAC signature — S3 verifies it without hitting your server.
    - Expiry: 3600 (1 hour) for documents, 300 (5 min) for one-time downloads.
*/

// Simulated getSignedUrl (real: import { getSignedUrl } from "@aws-sdk/s3-request-presigner")
async function getSignedUrl(
  _s3: S3Client,
  command: S3Command,
  options: { expiresIn: number }
): Promise<string> {
  const expiry = new Date(Date.now() + options.expiresIn * 1000).toISOString();
  return `https://${BUCKET}.s3.amazonaws.com/${command.Key}?X-Amz-Expires=${options.expiresIn}&X-Amz-Signature=stub&expiry=${expiry}`;
}

// Generate presigned PUT URL (client will upload directly to S3)
async function getPresignedPutUrl(
  s3KeyForUpload: string,
  mimeType: string,
  expiresInSeconds = 300   // 5 minutes
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         s3KeyForUpload,
    ContentType: mimeType,
    Body:        Buffer.alloc(0),  // placeholder — not sent with presigned URL
  });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

// Generate presigned GET URL (temporary download link)
async function getPresignedGetUrl(
  s3KeyForDownload: string,
  expiresInSeconds = 3600   // 1 hour
): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: s3KeyForDownload });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

// Express route: client asks for a presigned PUT URL
async function handlePresignedPutRequest(): Promise<void> {
  /*
    Real Express handler:
      router.post("/uploads/presigned-put", authMiddleware, async (req, res) => {
        const { filename, mimeType } = req.body;
        const s3Key = `uploads/${req.user.id}/${Date.now()}-${filename}`;
        const presignedUrl = await getPresignedPutUrl(s3Key, mimeType);
        res.json({ presignedUrl, s3Key });
        // Client does: fetch(presignedUrl, { method: "PUT", body: file })
        // Then client calls POST /uploads/confirm with { s3Key }
      });
  */
  const newKey = `uploads/user-42/${generateLocalFilename("resume.pdf")}`;
  const putUrl = await getPresignedPutUrl(newKey, "application/pdf");
  const getUrl = await getPresignedGetUrl(newKey, 3600);

  console.log("  Presigned PUT URL (5 min):", putUrl.slice(0, 80) + "...");
  console.log("  Presigned GET URL (1 hr):", getUrl.slice(0, 80) + "...");
  console.log("  Client uploads directly to S3 — your server never touches the bytes.");
}

await handlePresignedPutRequest();

// ───────────────────────────────────────────────────────────────
// 8. File Storage Patterns
// ───────────────────────────────────────────────────────────────

console.log("\n=== 8. File Storage Patterns ===");

/*
  PUBLIC vs PRIVATE BUCKETS:

    Public bucket  — anyone can read any object via its URL.
                     Use for: static assets, public profile photos.
                     Never for: invoices, medical records, private docs.

    Private bucket — objects require authentication (IAM or presigned URL).
                     Use for: all user-generated content by default.
                     Access: generate presigned GET URLs on demand.

  CDN IN FRONT OF S3 (CloudFront):
    S3 alone → each request travels to the bucket's region.
    CloudFront → caches objects at 400+ edge locations worldwide.
    Setup: create CloudFront distribution → origin = S3 bucket.
    URL changes: s3.amazonaws.com/... → dXXX.cloudfront.net/...
    Cost: reduces S3 GET charges; CloudFront has its own (cheaper) pricing.

  IMAGE RESIZING ON UPLOAD (Sharp):
    When user uploads a 10 MB raw photo you don't store that everywhere.
    After S3 upload, a Lambda (or Bull worker) runs:
      import sharp from "sharp";
      const thumbnail = await sharp(originalBuffer)
        .resize(200, 200)
        .webp({ quality: 80 })
        .toBuffer();
      await uploadToS3(thumbnail, `thumbnails/${s3Key}`, "image/webp");

  VIRUS SCANNING:
    Never trust user-uploaded files.
    Options:
      - ClamAV (open source, self-hosted): scan buffer before saving to S3.
      - VirusTotal API (SaaS): send file hash, get verdict.
      - AWS GuardDuty Malware Protection (for S3): scans on upload automatically.

  FILE TYPE VALIDATION — THE RIGHT WAY:
    Extension check (.pdf) is meaningless — trivially spoofed.
    MIME type from Content-Type header is also user-controlled.

    ✅ Check MAGIC BYTES — first few bytes of the file identify its true type:
      import { fileTypeFromBuffer } from "file-type";  // npm package

      const type = await fileTypeFromBuffer(fileBuffer);
      if (!type || type.mime !== "application/pdf") {
        throw new Error("File is not a real PDF");
      }

    PDF magic bytes:  %PDF  (hex: 25 50 44 46)
    PNG magic bytes:  \x89PNG
    JPEG magic bytes: \xFF\xD8\xFF

  STORING METADATA IN DATABASE:
    Never rely on reconstructing file info from S3 — always persist metadata.
*/

// Database record schema for uploaded files
interface FileMetadata {
  id:           string;
  originalName: string;      // "invoice_march.pdf"
  s3Key:        string;      // "uploads/user-42/1234567890-abc.pdf"
  mimeType:     string;      // "application/pdf"
  sizeBytes:    number;      // 204800
  uploadedBy:   string;      // user ID
  uploadedAt:   Date;
  isPublic:     boolean;
  cdnUrl?:      string;      // if public: CloudFront URL
}

function createFileRecord(
  file: MulterFile,
  s3Key: string,
  userId: string
): FileMetadata {
  return {
    id:           Math.random().toString(36).slice(2),
    originalName: file.originalname,
    s3Key,
    mimeType:     file.mimetype,
    sizeBytes:    file.size,
    uploadedBy:   userId,
    uploadedAt:   new Date(),
    isPublic:     false,
    cdnUrl:       undefined, // set after making public + CloudFront
  };
}

const sampleFile: MulterFile = {
  fieldname:    "invoice",
  originalname: "invoice_march.pdf",
  mimetype:     "application/pdf",
  size:         204_800,
};
const sampleKey    = `invoices/user-42/${generateLocalFilename("invoice_march.pdf")}`;
const fileRecord   = createFileRecord(sampleFile, sampleKey, "user-42");
console.log("  File metadata record:");
console.log("    originalName:", fileRecord.originalName);
console.log("    s3Key:", fileRecord.s3Key);
console.log("    sizeBytes:", fileRecord.sizeBytes, "(" + (fileRecord.sizeBytes / 1024).toFixed(0) + " KB)");
console.log("    isPublic:", fileRecord.isPublic);

// Simulated magic-byte check (real: use "file-type" npm package)
function checkMagicBytes(buffer: Buffer, expectedMime: string): boolean {
  const header = buffer.slice(0, 4).toString("hex");
  const signatures: Record<string, string> = {
    "application/pdf":  "25504446",  // %PDF
    "image/png":        "89504e47",  // .PNG
    "image/jpeg":       "ffd8ff",    // JPEG SOI
  };
  const expected = signatures[expectedMime];
  if (!expected) return false;
  return header.startsWith(expected);
}

const fakePdfBuffer  = Buffer.from("%PDF-1.4 fake content");
const fakePngBuffer  = Buffer.from("fakephp<?php echo 'bad'; ?>");
console.log("  Real PDF check:", checkMagicBytes(fakePdfBuffer,  "application/pdf")); // true
console.log("  PHP disguised as PNG:", checkMagicBytes(fakePngBuffer, "image/png")); // false

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice ===");

/*
  Q: Why should you send emails from a background job instead of directly
     in the request handler?

  A: SMTP calls are slow (often 500ms–2s). If you await them in the handler,
     the HTTP response is blocked for that entire duration. Under load, this
     exhausts your connection pool and degrades the entire app. A background
     queue (BullMQ, SQS) makes the handler return in milliseconds and lets
     workers process emails concurrently with automatic retries on failure.

  ─────────────────────────────────────────────────────────────────────────

  Q: What's a presigned PUT URL and why is it better than uploading through
     your server?

  A: A presigned PUT URL is a time-limited, cryptographically signed S3 URL
     your server generates. The client uses it to upload a file DIRECTLY to
     S3, bypassing your server entirely. This eliminates the double-bandwidth
     cost (client → server → S3), reduces server CPU and memory pressure,
     and removes your server as a bottleneck. Your server only stores the
     resulting S3 key in the database after the client confirms upload.

  ─────────────────────────────────────────────────────────────────────────

  Q: A user uploads shell.php renamed to invoice.pdf. How do you detect
     the real file type?

  A: You inspect the MAGIC BYTES — the first few bytes of the file buffer
     that encode the true file format. PDF files always start with "%PDF"
     (hex 25504446). A PHP file starts with "<?php" regardless of its
     extension. The "file-type" npm package reads magic bytes and returns
     the real MIME type. Never trust the file extension or the
     Content-Type header — both are user-controlled.

     import { fileTypeFromBuffer } from "file-type";
     const type = await fileTypeFromBuffer(buffer);
     if (type?.mime !== "application/pdf") throw new Error("Not a PDF");

  ─────────────────────────────────────────────────────────────────────────

  Q: What's wrong with storing uploaded files on your server's local disk
     in production?

  A: Three critical problems:
     1. MULTI-INSTANCE — if your app runs 3+ instances behind a load balancer,
        only the instance that received the upload has the file. Other instances
        return 404 for the same URL.
     2. EPHEMERAL FILESYSTEM — platforms like Heroku, Railway, and Render wipe
        the local disk on every deploy, destroying all uploads permanently.
     3. NO CDN — every file request hits your Node.js process, wasting CPU/memory
        that should serve API requests.
     Use S3 or equivalent object storage for any deployment beyond a single
     local development machine.

  ─────────────────────────────────────────────────────────────────────────

  Q: You want email to go to spam in dev but actually deliver in production.
     How do you configure this?

  A: Use environment-based transport selection:
     - production  → real SMTP (SendGrid / SES) with verified domain.
                     Emails actually deliver to recipients.
     - development → Ethereal fake SMTP. Emails are captured in Ethereal's
                     web dashboard, never delivered to real inboxes.
                     nodemailer.createTestAccount() gives you throwaway creds.
     - test        → nodemailer.createTransport({ jsonTransport: true }).
                     No network calls at all — email stored as JSON object.
     This keeps dev email noise zero and production email real.
*/

// Demonstrate Q1 answer in code:
async function registerUserFast(email: string): Promise<{ ok: boolean }> {
  // createUser(email) — omitted for brevity
  // Enqueue instead of await:
  console.log(`  [Queue] welcome email job added for: ${email}`);
  return { ok: true };  // returns immediately — no SMTP delay
}
const result = await registerUserFast("new@example.com");
console.log("  Register response:", result);

// ───────────────────────────────────────────────────────────────
// runDemo() — reference card
// ───────────────────────────────────────────────────────────────

function runDemo(): void {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║          BACKEND 14 · EMAIL + FILE STORAGE REFERENCE CARD       ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  NODEMAILER                                                      ║
║  createTransport({ host, port, auth })                          ║
║  transporter.sendMail({ from, to, subject, html, text })        ║
║  Transports: Gmail (app password), SendGrid, SES, Ethereal      ║
║  Always provide both html and text (client fallback)            ║
║                                                                  ║
║  EMAIL TEMPLATES                                                 ║
║  Handlebars: compile(source)(context) → HTML string             ║
║  HTML quirks: inline styles, table layout, no JS, absolute URLs ║
║  MJML: readable markup → cross-client table HTML                ║
║                                                                  ║
║  BEST PRACTICES                                                  ║
║  Never await sendMail in request handler → use BullMQ queue     ║
║  Retry with exponential backoff on SMTP timeout                 ║
║  SPF + DKIM + DMARC → stop going to spam                       ║
║  Validate email format before enqueueing                        ║
║  Dev: Ethereal | Prod: SendGrid/SES                             ║
║                                                                  ║
║  MULTER                                                          ║
║  diskStorage: saves to disk (destination + filename callbacks)  ║
║  memoryStorage: Buffer in req.file.buffer (use for S3 upload)  ║
║  limits: { fileSize, files }                                    ║
║  fileFilter: whitelist MIME types, call cb(null, true/false)    ║
║  Handle MulterError: LIMIT_FILE_SIZE, LIMIT_FILE_COUNT          ║
║                                                                  ║
║  LOCAL STORAGE                                                   ║
║  express.static("public/uploads") → serves files               ║
║  Problems: single-server, ephemeral deploy, no CDN              ║
║  Use only in development                                         ║
║                                                                  ║
║  AWS S3 (@aws-sdk/client-s3 v3)                                 ║
║  s3.send(new PutObjectCommand({ Bucket, Key, Body }))           ║
║  s3.send(new GetObjectCommand({ Bucket, Key }))                 ║
║  s3.send(new DeleteObjectCommand({ Bucket, Key }))              ║
║  s3.send(new ListObjectsV2Command({ Bucket, Prefix }))          ║
║  Creds: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION    ║
║                                                                  ║
║  PRESIGNED URLs (@aws-sdk/s3-request-presigner)                 ║
║  getSignedUrl(s3, new PutObjectCommand(...), { expiresIn: 300 })║
║  getSignedUrl(s3, new GetObjectCommand(...), { expiresIn: 3600})║
║  Flow: client → API (get URL) → S3 (PUT directly) → API (key)  ║
║                                                                  ║
║  STORAGE PATTERNS                                                ║
║  Public bucket: static assets, public avatars                   ║
║  Private bucket: all UGC by default; serve via presigned GET    ║
║  CDN: CloudFront in front of S3 for global caching              ║
║  Resize: Sharp (thumbnail generation after upload)              ║
║  Magic bytes: "file-type" package — checks real format          ║
║  DB metadata: s3Key, originalName, mimeType, size, uploadedBy   ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
  `);
}

runDemo();

export default runDemo;
