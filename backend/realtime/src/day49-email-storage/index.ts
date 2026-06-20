// ════════════════════════════════════════════════════════════════
// DAY 49 — EMAIL + FILE STORAGE
// ════════════════════════════════════════════════════════════════
//
// TWO CORE TOPICS:
//   1. Sending email with Nodemailer (SMTP / transactional)
//   2. Handling file uploads with Multer (disk / memory / S3 presign)
//
// ────────────────────────────────────────────────────────────────
// EMAIL ARCHITECTURE
// ────────────────────────────────────────────────────────────────
//
// SMTP vs Transactional API:
//
//   SMTP (Nodemailer):
//     ✅ Works with any SMTP server: Gmail, SendGrid SMTP, Mailgun, AWS SES
//     ✅ Same library regardless of provider — just change host/auth
//     ✅ Good for low-volume apps and internal tooling
//     ❌ You manage TLS, authentication, connection pooling
//     ❌ Gmail limits: 500/day (personal), 2000/day (Workspace)
//
//   Transactional API (Resend, SendGrid API, Postmark):
//     ✅ Better deliverability (dedicated IPs, DKIM/SPF managed for you)
//     ✅ Built-in analytics, bounces, unsubscribes
//     ✅ Simpler code (HTTP POST instead of SMTP config)
//     ❌ Vendor lock-in
//     ❌ Costs money at scale
//
//   RECOMMENDATION: Use Resend or SendGrid for production.
//   Use Ethereal (ethereal.email) for development — catches emails
//   without sending them. Nodemailer creates a test account automatically.
//
// EMAIL DELIVERABILITY — what makes email land in inbox:
//   SPF:  DNS record saying "these servers are allowed to send for mydomain.com"
//   DKIM: Cryptographic signature proving the email wasn't tampered with
//   DMARC: Policy saying what to do if SPF/DKIM fail (reject, quarantine, none)
//   These are DNS records — set them up in your domain registrar.
//   Using SendGrid/Resend handles this for you on their subdomain.
//
// HTML vs TEXT emails:
//   Always send BOTH html and text versions.
//   Why text? Gmail's spam filter trusts emails with a text fallback.
//   Some users have HTML disabled (accessibility, corporate policy).
//   Nodemailer: { html: '...', text: '...' }
//
// EMAIL TEMPLATES:
//   ❌ Don't do: `<h1>Hello ${name}</h1>` (XSS risk, hard to maintain)
//   ✅ Use a dedicated template: function that returns { subject, html, text }
//   Production options:
//     - react-email: write emails as React components (excellent DX)
//     - mjml: responsive email XML framework
//     - handlebars/mustache: simple template strings
//
// ────────────────────────────────────────────────────────────────
// FILE UPLOAD ARCHITECTURE
// ────────────────────────────────────────────────────────────────
//
// MULTER STORAGE STRATEGIES:
//
//   DiskStorage:
//     ✅ Simple — files written to local filesystem
//     ✅ Fast (no buffering in Node.js memory)
//     ❌ Single-server only: file on server A, user might hit server B
//     ❌ Lost on deploy (containers, serverless, ephemeral filesystems)
//     USE FOR: local dev, single-server apps, temp processing
//
//   MemoryStorage:
//     ✅ File available as Buffer immediately — easy to stream to S3
//     ✅ No filesystem I/O
//     ❌ Risk of OOM (Out Of Memory) on large uploads or concurrent users
//     ❌ File gone if process crashes
//     USE FOR: files you immediately stream to a cloud storage service
//
//   S3 PRESIGNED URLS (production pattern — recommended):
//     Instead of routing the upload through your server:
//     1. Client: POST /upload/presign { filename, contentType }
//     2. Server: call S3.createPresignedPost() → get presigned URL (valid 5 min)
//     3. Client: uploads DIRECTLY to S3 using the presigned URL
//     4. Client: POST /upload/complete { s3Key } to notify your API
//     ✅ Your server never touches the bytes → no memory pressure
//     ✅ Scales to massive files (S3 handles multipart)
//     ✅ Cheaper (no egress through your server)
//     ❌ More complex client-side code
//     ❌ Requires AWS SDK
//
// FILE VALIDATION:
//   Never trust the Content-Type header alone — it's set by the client.
//   Use a library like `file-type` to detect MIME by reading the file's
//   magic bytes (first few bytes of the file contain the real type).
//   Example: a .jpg renamed to .pdf still has JPEG magic bytes (0xFF 0xD8).
//
// ════════════════════════════════════════════════════════════════

import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';

const app = express();
app.use(express.json());

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(__dirname, '../../..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ─── Email setup ──────────────────────────────────────────────────

// Ethereal is a fake SMTP service that catches emails without sending them.
// Perfect for development — you get a preview URL to see the email in the browser.
// nodemailer.createTestAccount() creates a disposable account automatically.

let transporter: nodemailer.Transporter;
let testAccount: nodemailer.TestAccount;

async function initEmailTransport(): Promise<void> {
  try {
    testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host:   'smtp.ethereal.email',
      port:   587,
      secure: false, // TLS via STARTTLS (not SSL)
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.log('[email] Ethereal test account created');
    console.log(`[email] User: ${testAccount.user}`);
    console.log('[email] Emails captured at: https://ethereal.email');
  } catch (err) {
    console.warn('[email] Could not create Ethereal account:', (err as Error).message);
    console.warn('[email] Email endpoints will return errors');
  }
}

// ─── Email templates ──────────────────────────────────────────────
// Template functions return { subject, html, text }.
// html = full HTML email. text = plain text fallback.
// In production: use react-email or mjml for responsive designs.

function welcomeEmail(name: string, verifyUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: `Welcome to MyApp, ${name}!`,

    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Welcome to MyApp</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background:#7c3aed;padding:32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;">Welcome to MyApp</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              <h2 style="margin-top:0;color:#1e1b4b;">Hi ${name},</h2>
              <p style="color:#374151;line-height:1.6;">
                Thanks for signing up! Please verify your email address to get started.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${verifyUrl}"
                   style="background:#7c3aed;color:#fff;padding:14px 28px;
                          border-radius:6px;text-decoration:none;font-weight:bold;
                          display:inline-block;">
                  Verify Email Address
                </a>
              </div>
              <p style="color:#6b7280;font-size:13px;">
                If the button doesn't work, copy this URL into your browser:<br>
                <a href="${verifyUrl}" style="color:#7c3aed;">${verifyUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:24px 32px;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                You received this email because you signed up for MyApp.<br>
                If this wasn't you, ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,

    // Plain text version — ALWAYS include this alongside HTML
    // Improves deliverability and serves users with HTML disabled
    text: `
Welcome to MyApp, ${name}!

Thanks for signing up. Please verify your email address:

${verifyUrl}

If you didn't sign up for MyApp, you can safely ignore this email.
`.trim(),
  };
}

function passwordResetEmail(name: string, resetUrl: string, expiresInMinutes = 60): { subject: string; html: string; text: string } {
  return {
    subject: 'Reset your MyApp password',
    html: `
<html><body style="font-family:sans-serif;padding:20px;">
  <h2>Password Reset Request</h2>
  <p>Hi ${name},</p>
  <p>We received a request to reset your password. Click the link below:</p>
  <p><a href="${resetUrl}" style="color:#7c3aed;">${resetUrl}</a></p>
  <p><em>This link expires in ${expiresInMinutes} minutes.</em></p>
  <p>If you didn't request this, ignore this email — your password won't change.</p>
</body></html>`,
    text: `Password Reset\n\nHi ${name},\n\nReset your password: ${resetUrl}\n\nExpires in ${expiresInMinutes} minutes.`,
  };
}

// ─── Email routes ──────────────────────────────────────────────────

// POST /email/test — send a test email and return the Ethereal preview URL
const sendEmailSchema = z.object({
  to:   z.string().email().optional().default('test@example.com'),
  name: z.string().optional().default('Test User'),
  type: z.enum(['welcome', 'password-reset']).optional().default('welcome'),
});

app.post('/email/test', async (req: Request, res: Response): Promise<void> => {
  if (!transporter) {
    res.status(503).json({ error: 'Email transport not initialized' });
    return;
  }

  const parsed = sendEmailSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const { to, name, type } = parsed.data;
  const template = type === 'welcome'
    ? welcomeEmail(name, 'https://myapp.com/verify?token=abc123')
    : passwordResetEmail(name, 'https://myapp.com/reset?token=xyz789');

  try {
    const info = await transporter.sendMail({
      from:    `"MyApp" <noreply@myapp.com>`,
      to,
      subject: template.subject,
      html:    template.html,
      text:    template.text,
    });

    // nodemailer.getTestMessageUrl() returns the Ethereal preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);

    res.json({
      success:    true,
      messageId:  info.messageId,
      previewUrl,
      note: 'Open previewUrl in your browser to see the captured email',
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── Multer storage strategies ─────────────────────────────────────

// Strategy 1: DiskStorage
// Files are saved to UPLOADS_DIR with original names (sanitized to avoid path traversal)
const diskStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename(_req, file, cb) {
    // Sanitize filename: remove path components, add timestamp to avoid collisions
    const safe = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    const unique = `${Date.now()}-${safe}`;
    cb(null, unique);
  },
});

// Strategy 2: MemoryStorage
// File is stored as a Buffer on req.file.buffer — ready to stream to S3
const memStorage = multer.memoryStorage();

// File filter: only allow images
function imageFileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Pass an Error to reject the file — multer will call next(err)
    cb(new Error(`Only images allowed. Got: ${file.mimetype}`));
  }
}

const uploadImage = multer({
  storage: diskStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1,                   // single file only
  },
});

const uploadAny = multer({
  storage: memStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// ─── File upload routes ────────────────────────────────────────────

// POST /upload/image — disk storage, images only, max 5MB
app.post('/upload/image', uploadImage.single('image'), (req: Request, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const { originalname, filename, size, mimetype, path: filePath } = req.file;

  res.json({
    success:      true,
    storage:      'disk',
    originalName: originalname,
    savedAs:      filename,
    size,
    mimetype,
    url:          `/uploads/${filename}`,
    absolutePath: filePath,
    note: `File saved to ${UPLOADS_DIR}/${filename}`,
  });
});

// POST /upload/any — memory storage, any file type, max 10MB
app.post('/upload/any', uploadAny.single('file'), (req: Request, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const { originalname, size, mimetype, buffer } = req.file;

  // buffer is available because we used memoryStorage
  // In production you'd do: await s3.putObject({ Body: buffer, ... })
  const preview = buffer.slice(0, 8).toString('hex');

  res.json({
    success:      true,
    storage:      'memory',
    originalName: originalname,
    size,
    mimetype,
    bufferLength: buffer.length,
    magicBytes:   preview, // first 8 bytes — useful for detecting real file type
    note: 'File is in memory buffer — in production, stream this to S3 immediately',
  });
});

// POST /upload/presign — simulate the S3 presigned URL pattern
// In production: use @aws-sdk/s3-request-presigner
const presignSchema = z.object({
  filename:    z.string().min(1),
  contentType: z.string().min(1),
  sizeBytes:   z.number().positive().max(100 * 1024 * 1024), // max 100MB
});

app.post('/upload/presign', (req: Request, res: Response): void => {
  const parsed = presignSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const { filename, contentType, sizeBytes } = parsed.data;
  const s3Key = `uploads/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // In real code:
  // const command = new PutObjectCommand({ Bucket: 'my-bucket', Key: s3Key, ContentType: contentType });
  // const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

  res.json({
    // SIMULATED — in production this would be a real S3 presigned URL
    presignedUrl: `https://my-bucket.s3.us-east-1.amazonaws.com/${s3Key}?X-Amz-Signature=SIMULATED&X-Amz-Expires=300`,
    s3Key,
    expiresAt: expiresAt.toISOString(),
    method: 'PUT',
    instructions: [
      '1. PUT the file directly to presignedUrl (binary body, Content-Type header required)',
      '2. After upload succeeds (HTTP 200 from S3), call POST /upload/complete',
      `3. Include s3Key: "${s3Key}" in the completion request`,
    ],
    clientCode: `
// Browser/client code:
const { presignedUrl, s3Key } = await fetch('/upload/presign', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ filename: '${filename}', contentType: '${contentType}', sizeBytes: ${sizeBytes} }),
}).then(r => r.json());

// Upload directly to S3 — your server never sees the bytes
await fetch(presignedUrl, {
  method: 'PUT',
  headers: { 'Content-Type': '${contentType}' },
  body: file, // File object from <input type="file">
});

// Notify your server
await fetch('/upload/complete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ s3Key, originalName: '${filename}', size: ${sizeBytes} }),
});`.trim(),
  });
});

// POST /upload/complete — record the S3 upload in your database
app.post('/upload/complete', (req: Request, res: Response): void => {
  const { s3Key, originalName, size } = req.body as {
    s3Key: string;
    originalName: string;
    size: number;
  };

  if (!s3Key || !originalName) {
    res.status(400).json({ error: 'Missing s3Key or originalName' });
    return;
  }

  // In production: save to database { userId, s3Key, originalName, size, uploadedAt }
  const record = {
    id:           `file_${Date.now()}`,
    s3Key,
    originalName,
    size,
    url:          `https://cdn.myapp.com/${s3Key}`,
    uploadedAt:   new Date().toISOString(),
  };

  console.log(`[upload] Recorded S3 upload: ${s3Key} (${originalName}, ${size} bytes)`);
  res.status(201).json({ success: true, file: record });
});

// Serve uploaded files from disk
app.use('/uploads', express.static(UPLOADS_DIR));

// ─── Global error handler ─────────────────────────────────────────
// Multer throws errors (file too large, wrong type) as Error objects.
// Express catches them in error-handling middleware (4 params).

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof multer.MulterError) {
    // LIMIT_FILE_SIZE, LIMIT_FILE_COUNT, LIMIT_UNEXPECTED_FILE, etc.
    res.status(400).json({ error: `Upload error: ${err.message}`, code: err.code });
  } else if (err.message.includes('Only images allowed')) {
    res.status(400).json({ error: err.message });
  } else {
    console.error('[server] Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Start ────────────────────────────────────────────────────────

const PORT = 3001;

async function main(): Promise<void> {
  await initEmailTransport();

  app.listen(PORT, () => {
    console.log(`\n[server] Day 49 — Email + File Storage`);
    console.log(`[server] Listening on http://localhost:${PORT}`);
    console.log(`[server] Uploads directory: ${UPLOADS_DIR}`);
    console.log('');
    console.log('[endpoints]');
    console.log(`  POST http://localhost:${PORT}/email/test`);
    console.log(`       body: { "to": "x@y.com", "name": "Alice", "type": "welcome" }`);
    console.log('');
    console.log(`  POST http://localhost:${PORT}/upload/image    (multipart, field: "image", max 5MB)`);
    console.log(`  POST http://localhost:${PORT}/upload/any      (multipart, field: "file", max 10MB)`);
    console.log(`  POST http://localhost:${PORT}/upload/presign  (JSON: filename, contentType, sizeBytes)`);
    console.log(`  GET  http://localhost:${PORT}/uploads/:filename`);
    console.log('');
    console.log('Test email:');
    console.log(`  curl -X POST http://localhost:${PORT}/email/test \\`);
    console.log(`       -H 'Content-Type: application/json' \\`);
    console.log(`       -d '{"to":"test@example.com","name":"Alice","type":"welcome"}'`);
    console.log('');
    console.log('Test image upload:');
    console.log(`  curl -X POST http://localhost:${PORT}/upload/image \\`);
    console.log(`       -F 'image=@/path/to/photo.jpg'`);
  });
}

main().catch(console.error);
