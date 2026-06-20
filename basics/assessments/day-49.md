# Day 49 Assessment — Nodemailer · Email Templates · Multer · File Storage · S3 Presigned URLs

**Theme:** You are building the backend for a contract management SaaS. Users upload signed PDFs (up to 50MB), receive email notifications, and share documents with teammates. Reliability and security of file handling directly affect trust.

---

### Q1 — Nodemailer transporter ⭐

**Scenario:** You need to set up email sending for the contract SaaS. A junior developer suggests using their personal Gmail account for production email. Before writing any code, you need to explain the correct production approach.

**Task:** Describe the difference between SMTP transport and `service: 'gmail'` transport. Explain why transactional email services (Resend, SendGrid) are better than raw SMTP for production.

**Acceptance Criteria:**
- [ ] SMTP transport: configured with explicit `host`, `port`, `secure`, and `auth` options — `nodemailer.createTransport({ host: 'smtp.example.com', port: 587, secure: false, auth: { user, pass } })`; gives full control over the mail server
- [ ] Service transport: `nodemailer.createTransport({ service: 'gmail', auth: { user, pass } })` — Nodemailer has built-in presets for ~100 popular services; convenience wrapper that sets the SMTP host/port automatically
- [ ] Deliverability: transactional services (Resend, SendGrid, Mailgun) maintain dedicated IP pools with established sender reputations; emails sent from a personal Gmail account or a raw VPS IP have poor deliverability — often go to spam
- [ ] Reputation: one spam complaint via Gmail's "Report Spam" damages your personal Gmail account, not just the application; transactional services absorb complaints and protect your domain
- [ ] Analytics: transactional services provide delivery receipts, open tracking, click tracking, and bounce handling via webhooks — raw SMTP provides none of these
- [ ] Gmail production risk: Gmail rate-limits to ~500 emails/day for personal accounts and 2,000/day for Google Workspace; at 50k sign-ups/day this is immediately inadequate

---

### Q2 — Test email with Ethereal ⭐

**Scenario:** The team wants to add email to CI/CD pipelines and local development without sending real emails to real users. A developer asks how to test email code safely.

**Task:** Explain why real emails should not be sent in development. Describe what `nodemailer.createTestAccount()` creates and how to get the preview URL from the send result.

**Acceptance Criteria:**
- [ ] Real emails in development risk: accidentally emailing real users (if test data contains real addresses from production), consuming email sending quota, and polluting analytics with test events
- [ ] `nodemailer.createTestAccount()`: creates a temporary Ethereal.email account (SMTP test service); returns `{ user, pass }` credentials; emails sent to this account are captured and never delivered to real recipients
- [ ] Setup: `const account = await nodemailer.createTestAccount(); const transporter = nodemailer.createTransport({ host: 'smtp.ethereal.email', port: 587, auth: { user: account.user, pass: account.pass } })`
- [ ] Send and preview: `const info = await transporter.sendMail({ from, to, subject, html })`; then `const url = nodemailer.getTestMessageUrl(info)` returns a URL to view the rendered email in the browser
- [ ] Mailtrap alternative: a commercial test service (`mailtrap.io`) that provides team-shareable inboxes, spam score analysis, and HTML/text rendering checks — useful for team email QA
- [ ] Environment switching: use `NODE_ENV === 'production'` to swap between Ethereal (development) and Resend/SendGrid (production) transporters — the `sendMail` call is identical regardless of which transporter is active

---

### Q3 — Email content ⭐

**Scenario:** Your welcome email renders beautifully in Gmail on desktop but is completely invisible in Outlook 2016 (which blocks all HTML). A user who uses a screen reader reports that your email is unreadable. The security team notes that some email clients strip `<a href>` tags.

**Task:** Explain why you must always send both `html` and `text` fields. Describe what happens to `<a href>` links in the text fallback.

**Acceptance Criteria:**
- [ ] `html` field: the visually styled version of the email rendered by clients that support HTML; most modern clients (Gmail, Apple Mail, Outlook 365) display this
- [ ] `text` field: the plain-text fallback displayed by clients that block HTML (Outlook 2016 with images disabled, corporate security gateways that strip HTML, command-line mail readers)
- [ ] Spam filter impact: emails without a `text` field are scored as more likely to be spam — legitimate email systems always provide both MIME parts; a `text`-only email with no `html` is also flagged
- [ ] Screen reader accessibility: screen readers work best with plain text; the `text` field is also used by email-to-speech tools and Braille displays
- [ ] `<a href>` in text fallback: HTML anchor tags cannot be rendered as clickable links in plain text; the `text` field must contain the raw URL explicitly: `Click here to verify: https://example.com/verify?token=abc` — if you only copy the anchor text ("Click here"), the link is lost entirely
- [ ] Best practice: the `text` field should be a complete, readable version of the email — not just a note saying "please enable HTML"; users on plain-text clients deserve the full content

---

### Q4 — Multer basics ⭐

**Scenario:** Your contract upload endpoint needs to accept a single signed PDF file. Another endpoint accepts up to 5 supporting documents at once. A junior developer has never used Multer and asks how the middleware works.

**Task:** Describe what `multer({ storage: diskStorage({ destination, filename }) })` does. Explain `upload.single` vs `upload.array`. State where `req.file` vs `req.files` comes from.

**Acceptance Criteria:**
- [ ] `multer({ storage })` creates a Multer middleware factory; `diskStorage` is a storage engine that writes files to disk; `destination` is a function `(req, file, cb) => cb(null, './uploads')` that determines the directory; `filename` is a function that determines the saved filename
- [ ] `upload.single('contract')` is middleware for a single file field named `'contract'` in the multipart form; it processes the file and attaches it to `req.file`
- [ ] `upload.array('documents', 5)` is middleware for multiple files under the field name `'documents'`, with a maximum of 5; it attaches an array to `req.files`
- [ ] `req.file`: populated by `upload.single` — a single object with `{ fieldname, originalname, mimetype, size, path, filename }` properties
- [ ] `req.files`: populated by `upload.array` or `upload.fields` — an array (or object keyed by field name) of file objects with the same structure
- [ ] If `upload.single` is used but no file is sent, `req.file` is `undefined` — always check before accessing `req.file.path`

---

### Q5 — File upload security ⭐⭐

**Scenario:** Your contract upload endpoint stores files with the original filename provided by the user. A security researcher submits a file named `../../.env` and your server saves it to `/app/uploads/../../.env` — overwriting your environment file. Another researcher uploads a file with MIME type `application/pdf` that is actually an executable.

**Task:** List 5 security checks every file upload endpoint must perform. Show how a path traversal attack using `../../etc/passwd` as a filename works.

**Acceptance Criteria:**
- [ ] Check 1 — MIME type validation: verify the Content-Type header against an allowlist (`['application/pdf', 'image/png']`); but do NOT rely on this alone — clients can spoof the Content-Type header
- [ ] Check 2 — magic bytes validation: read the first 4–8 bytes of the file and verify against known file signatures; PDF files always begin with `%PDF` (hex `25 50 44 46`); a file claiming to be PDF but starting with `MZ` (PE executable) should be rejected
- [ ] Check 3 — max file size: configure `limits: { fileSize: 52_428_800 }` in Multer (50MB); without this, a 10GB upload exhausts disk space and memory
- [ ] Check 4 — filename sanitization: never use `req.file.originalname` as the saved filename; generate a UUID-based name: `${uuid()}.pdf`; if original name must be stored, sanitize with a library like `sanitize-filename` which strips `../`, `..\\`, and null bytes
- [ ] Check 5 — store outside web root: save uploads to a directory that is not served statically (e.g., `/var/uploads`, not `/app/public/uploads`); files served from the web root are accessible directly via URL without authentication
- [ ] Path traversal attack: user submits `filename: '../../etc/passwd'`; server saves to `path.join('./uploads', '../../etc/passwd')` which resolves to `/etc/passwd`; the file write overwrites a system file or reads sensitive data; fix: `path.basename(filename)` to strip directory components before joining

---

### Q6 — DiskStorage vs MemoryStorage ⭐⭐

**Scenario:** Your single-server staging environment uses DiskStorage. Production is a 3-pod Kubernetes cluster — each pod writes uploads to its local disk. Pod 1 receives the upload, Pod 2 serves the download request, and the file is not found. You need to redesign.

**Task:** Explain when DiskStorage is appropriate vs MemoryStorage. Show the risk of 10 concurrent 50MB uploads in MemoryStorage. Describe the streaming approach to upload directly to S3 from MemoryStorage.

**Acceptance Criteria:**
- [ ] DiskStorage appropriate: single-server deployments, large files that would exhaust memory, cases where the file needs post-upload processing before uploading to cloud storage; simple to implement; files persist across process restarts
- [ ] DiskStorage problem on multi-pod deployments: each pod has its own ephemeral disk (in Kubernetes); a file uploaded to Pod 1 is not accessible on Pod 2 or Pod 3 — requires shared storage (EFS, NFS) or immediate upload to S3
- [ ] MemoryStorage: `multer({ storage: multer.memoryStorage() })` — file bytes are stored in `req.file.buffer` (a Node.js Buffer in heap memory) rather than written to disk
- [ ] Memory risk: 10 concurrent uploads × 50MB = 500MB of Node.js heap; with typical container memory limits of 512MB–1GB, this causes OOM kills; `--max-old-space-size` would need to be raised for large files
- [ ] S3 streaming with MemoryStorage: `s3.upload({ Bucket, Key, Body: req.file.buffer, ContentType: req.file.mimetype }).promise()` — the buffer is streamed directly to S3 in the same request handler; no disk I/O required
- [ ] Better for large files: use streaming without buffering the full file: pipe `req` directly via `busboy` to an S3 upload stream, never holding the full file in memory; MemoryStorage is only safe for small files (<10MB)

---

### Q7 — Email template system ⭐⭐

**Scenario:** Your contract SaaS sends 12 different email types: welcome, contract shared, contract signed, reminder, invoice, etc. A junior developer has written 12 separate HTML strings inline in 12 different route handlers. When the company rebrand happens, they face updating 12 files.

**Task:** Implement a `welcomeEmail(name, verifyUrl)` template function returning `{ subject, html, text }`. Explain when template literals are sufficient vs when to use mjml/react-email. Explain CSS inlining.

**Acceptance Criteria:**
- [ ] Template function: `function welcomeEmail(name: string, verifyUrl: string): { subject: string; html: string; text: string }` — returns all three required fields
- [ ] `subject: 'Welcome to ContractSaaS — please verify your email'`
- [ ] `html`: template literal with minimal inline styles: `` `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><h1>Welcome, ${name}!</h1><p><a href="${verifyUrl}">Verify your email</a></p></div>` ``
- [ ] `text`: `` `Welcome, ${name}!\n\nPlease verify your email by visiting:\n${verifyUrl}\n\nIf you did not sign up, ignore this email.` ``
- [ ] Template literals are sufficient for: simple transactional emails with 1–3 variable slots, teams without a dedicated email designer, internal tooling emails
- [ ] Use mjml when: responsive layouts are required (mobile vs desktop column layouts), the design team owns the email templates, or you need to maintain 20+ template variants consistently
- [ ] CSS inlining: most email clients (especially Outlook) do not apply `<style>` block rules — all CSS must be written as `style=""` attributes directly on each HTML element; mjml and react-email handle this automatically; for raw HTML you must inline manually or use a library like `juice`

---

### Q8 — S3 presigned URL flow ⭐⭐

**Scenario:** Your current upload flow proxies all file data through your Node.js servers: client → your server → S3. During a 50MB contract upload, your server's memory usage spikes, your bandwidth bill doubles, and the request takes 45 seconds on a slow connection. The senior engineer says "use presigned URLs."

**Task:** Describe the 4-step presigned URL upload flow. Explain why this bypasses your server and what the security implications are of the TTL.

**Acceptance Criteria:**
- [ ] Step 1: client sends `POST /api/uploads/presign { filename: 'contract.pdf', contentType: 'application/pdf' }` to your server
- [ ] Step 2: server generates an S3 presigned URL: `const url = await s3.getSignedUrlPromise('putObject', { Bucket, Key: uuid() + '.pdf', ContentType: 'application/pdf', Expires: 300 })`; server responds with `{ url, key }` to the client
- [ ] Step 3: client performs `PUT url` directly to S3 with the file bytes as the request body and the `Content-Type` header; S3 validates the presigned URL signature and stores the file; your server receives zero bytes of the file
- [ ] Step 4: client sends `POST /api/uploads/complete { s3Key }` to your server; server records the file metadata (s3Key, filename, size, userId) in the database; this is when the file is "registered" in your system
- [ ] Bypassing your server: no file data touches your Node.js process — no memory pressure, no bandwidth cost, no timeout risk; S3 handles the upload directly with multi-datacenter redundancy
- [ ] TTL security: the presigned URL expires after 300 seconds; if a user receives the URL and doesn't use it, it becomes invalid; if the URL is intercepted, the attacker has at most 5 minutes to upload to that specific S3 key — and cannot upload a different file to a different key

---

### Q9 — File type validation ⭐⭐

**Scenario:** A malicious user uploads a PHP webshell with `Content-Type: application/pdf` and filename `contract.pdf`. Your server checks `req.file.mimetype === 'application/pdf'` and accepts it. The file is later served from a PHP-enabled directory, executing arbitrary code.

**Task:** Explain why `req.file.mimetype` can be spoofed. Show how to validate using magic bytes. Show how to read the first 4 bytes of a Buffer to verify a PDF.

**Acceptance Criteria:**
- [ ] MIME type spoofing: `req.file.mimetype` comes from the `Content-Type` header in the multipart form data that the client sends; the client controls this header entirely; any value can be set using `curl` or a custom HTTP client — it is not derived from the file content
- [ ] Magic bytes definition: the first few bytes of a file contain a fixed signature that identifies the file format; this is determined by the file format specification, not the client — a PHP file cannot fake a PDF magic byte sequence without corrupting the file
- [ ] PDF magic bytes: `%PDF` = hex `25 50 44 46`; a valid PDF file always starts with this sequence (followed by a version number like `-1.7`)
- [ ] Validation code: `const buf = req.file.buffer.slice(0, 4); const isPDF = buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46;` — requires MemoryStorage so `req.file.buffer` is available
- [ ] With DiskStorage: `const fd = fs.openSync(req.file.path, 'r'); const buf = Buffer.allocUnsafe(4); fs.readSync(fd, buf, 0, 4, 0); fs.closeSync(fd);` then check the same bytes
- [ ] Rejection: if `!isPDF`, delete the uploaded file (`fs.unlinkSync(req.file.path)`) and return `400 Bad Request` with `{ error: 'Invalid file type' }` — do not store the file or record the upload

---

### Q10 — Email rate limiting ⭐⭐

**Scenario:** Your "resend verification email" endpoint has no rate limiting. A script kiddie discovers it and sends 10,000 requests per minute for a target user — your SendGrid account is flagged for abuse and suspended. All email sending stops for all users.

**Task:** Implement per-user email rate limiting using Redis. Explain why per-user limits are better than a global limit.

**Acceptance Criteria:**
- [ ] Redis key: `emails:${userId}:${date}` where `date = new Date().toISOString().split('T')[0]` (YYYY-MM-DD) — resets at midnight automatically (key expires with TTL)
- [ ] Rate limit check: `const count = await redis.incr(key); if (count === 1) await redis.expire(key, 86400); if (count > 5) return res.status(429).json({ error: 'Email rate limit exceeded — try again tomorrow' })`
- [ ] `INCR` is atomic — no race condition between check and increment in a concurrent environment; if count > 5 after the INCR, reject before sending
- [ ] Set TTL on first increment (`count === 1`) to ensure the key expires at the end of the day even if `count` never reaches 5; without TTL the key persists forever
- [ ] Per-user limit benefit: a single abuser's rate limit does not affect other users — the key is scoped to `userId`; with a global limit, one automated script consumes the entire sending budget, blocking legitimate users
- [ ] Additional protection: apply IP-based rate limiting on the `/resend-verification` route separately (e.g., 10 requests/minute per IP) to prevent the same user from using different accounts to exhaust per-user limits at scale

---

### Q11 — Signed URL expiry ⭐⭐

**Scenario:** Your contract download links are presigned S3 URLs embedded in emails. A user forwards an email with the download link to an unauthorized third party 30 days later. The third party can still access the contract.

**Task:** Explain why presigned URLs must have expiry. State appropriate TTLs for upload URLs, download URLs, and public permanent URLs. Describe the trade-off between security and usability.

**Acceptance Criteria:**
- [ ] Without expiry: a presigned URL grants permanent access to the S3 object to anyone who has the URL — a forwarded email, a leaked Slack message, or a browser history entry becomes a permanent security breach
- [ ] Upload URL TTL: 5–10 minutes — the user must immediately use the URL to upload their file; there is no legitimate reason for a longer window; short TTL limits the blast radius if the URL is intercepted
- [ ] Download URL TTL: 1–24 hours depending on sensitivity; for contracts (sensitive PII): 1–4 hours; for public marketing assets: 24 hours; the user clicks the link and downloads — they don't need the URL to stay valid for days
- [ ] Public permanent URL: do not use presigned URLs; make the S3 object publicly readable via bucket policy (`s3:GetObject` for `Principal: "*"`); use CloudFront CDN in front for caching; suitable only for truly public content (marketing images, public documentation)
- [ ] Usability trade-off: very short TTLs (5 minutes) for download links cause frustration — user receives email, is interrupted, opens email 20 minutes later, link expired; balance security requirements against realistic user behavior
- [ ] Re-issue pattern: expose `GET /api/contracts/:id/download` which checks authorization and issues a fresh presigned URL on each request — the stored URL in the database is the S3 key, not a presigned URL; presigned URLs are generated on demand with a short TTL

---

### Q12 — Multipart upload for large files ⭐⭐⭐

**Scenario:** Enterprise clients upload contracts that are 500MB–2GB (heavily annotated PDFs with embedded CAD drawings). Single-part S3 uploads fail for files over 5GB and have no resume capability — a network blip at 95% restarts the entire upload.

**Task:** Describe the S3 multipart upload flow from the backend perspective. Explain the minimum part size. Show the initiate → upload parts → complete sequence. Explain why it is resumable.

**Acceptance Criteria:**
- [ ] S3 multipart upload allows splitting a large file into parts (minimum 5MB each, except the last part) and uploading them independently — enabling parallelism and resumability
- [ ] Step 1 — initiate: `const { UploadId } = await s3.createMultipartUpload({ Bucket, Key }).promise()` — S3 returns an `UploadId` that ties all parts together
- [ ] Step 2 — upload parts: split file into chunks; for each chunk: `const { ETag } = await s3.uploadPart({ Bucket, Key, UploadId, PartNumber: i, Body: chunk }).promise()`; collect `{ PartNumber, ETag }` for each completed part
- [ ] Parts can be uploaded in parallel: `Promise.all(chunks.map((chunk, i) => uploadPart(chunk, i + 1)))` — uploading all 10 parts simultaneously vs sequentially reduces total upload time proportional to available bandwidth
- [ ] Step 3 — complete: `await s3.completeMultipartUpload({ Bucket, Key, UploadId, MultipartUpload: { Parts: [{ PartNumber: 1, ETag }, ...] } }).promise()` — S3 assembles all parts into the final object
- [ ] Resumability: if part 7 fails, only part 7 needs to be re-uploaded — not the entire file; store the `UploadId` and the list of successfully uploaded `PartNumber`/`ETag` pairs in your database; on resume, skip parts with existing ETags
- [ ] Cleanup: if the upload is abandoned, S3 continues to charge storage for incomplete parts; call `s3.abortMultipartUpload({ Bucket, Key, UploadId })` on failure; also configure an S3 lifecycle rule to auto-abort incomplete multipart uploads after 7 days

---

### Q13 — Email deliverability ⭐⭐⭐

**Scenario:** Your production emails are landing in spam for 30% of recipients. The engineering team investigates and discovers: no SPF record, no DKIM, no DMARC, and you are sending from a shared IP that other tenants on your VPS provider have previously used for spam.

**Task:** Explain 4 email deliverability factors: SPF, DKIM, DMARC, and sending reputation. Describe what each does. Explain why sending from Gmail SMTP in production is risky.

**Acceptance Criteria:**
- [ ] SPF (Sender Policy Framework): a DNS TXT record on your domain (`v=spf1 include:sendgrid.net ~all`) that lists which mail servers are authorized to send email on behalf of your domain; receiving servers check this to verify the sender is not spoofed
- [ ] DKIM (DomainKeys Identified Mail): a cryptographic signature added to outgoing email headers; the private key signs the email on your sending server; the public key is published in DNS; receiving servers verify the signature to confirm the email was not tampered with in transit
- [ ] DMARC (Domain-based Message Authentication, Reporting & Conformance): a DNS TXT record that tells receiving servers what to do when SPF or DKIM fails (`p=none` log only, `p=quarantine` send to spam, `p=reject` discard); also enables aggregate reports on your domain's email authentication health
- [ ] Sending reputation: ISPs (Gmail, Outlook, Yahoo) score your sending IP and domain based on historical behavior — spam complaints, bounce rate, spam trap hits, volume consistency; a new IP has no reputation and is often treated with suspicion; reputation is built over weeks via "IP warming" (gradually increasing volume)
- [ ] Gmail SMTP production risk 1: rate limited to 2,000 emails/day for Google Workspace (500 for personal); insufficient for any meaningful scale
- [ ] Gmail SMTP production risk 2: your app's sending reputation is tied to your personal Gmail reputation — one spam complaint or security event on your Gmail account affects all your application's email deliverability
- [ ] Gmail SMTP production risk 3: Google can suspend your account for "unusual activity" (automated sending), cutting off all email sending instantly with no service SLA

---

### Q14 — File storage architecture ⭐⭐⭐

**Scenario:** A junior engineer proposes storing contract PDFs as `BYTEA` blobs in PostgreSQL "for simplicity — everything in one place." Another proposes a dedicated file server with direct URL serving. You need to design the correct architecture.

**Task:** Design the file storage system for the contract SaaS: metadata in PostgreSQL, file bytes in S3. Explain why files should never be stored in PostgreSQL BYTEA columns. Compare presigned URL serving vs proxy endpoint serving.

**Acceptance Criteria:**
- [ ] PostgreSQL metadata schema: `contracts (id UUID PRIMARY KEY, s3_key TEXT NOT NULL, original_filename TEXT, file_size_bytes BIGINT, mime_type TEXT, uploaded_by UUID REFERENCES users(id), project_id UUID, created_at TIMESTAMPTZ DEFAULT NOW(), deleted_at TIMESTAMPTZ)`
- [ ] S3 storage: files are stored by `s3_key` (e.g., `contracts/2026/06/{uuid}.pdf`); the S3 key is the only link between the database record and the physical file
- [ ] Why not PostgreSQL BYTEA: database storage is expensive (10–50× more per GB than S3); BYTEA columns bloat the database, slowing down ALL queries (table size affects query planner statistics, vacuum times, and backup duration); PostgreSQL is optimized for structured data, not binary blobs; streaming large files from DB puts connection pool pressure on every download
- [ ] Presigned URL serving: `GET /api/contracts/:id/download` → verify auth → look up `s3_key` → generate presigned URL (1h TTL) → redirect client to S3 URL; file bytes never touch your server; scales infinitely; no bandwidth cost; S3 handles range requests for resumable downloads
- [ ] Proxy endpoint serving: `GET /api/contracts/:id/download` → verify auth → `s3.getObject({ Bucket, Key })` → pipe to `res`; your server proxies the file bytes; allows: adding access logs, injecting watermarks on the fly, checking revocation mid-stream
- [ ] When to use proxy: access logging for compliance (who downloaded what file), dynamic watermarking (embed user's name in PDF), real-time revocation checks (check if contract was rescinded before serving); accept the bandwidth and latency cost consciously

---

### Q15 — Email tracking ⭐⭐⭐

**Scenario:** Your marketing team wants to know which users are opening contract-ready notifications and which are not. An engineer adds a 1×1 pixel tracking image to every email. The product team then asks why "opened" rates are only 45% even though users confirm they received the email.

**Task:** Explain how the 1×1 pixel tracker works, why it is blocked by many email clients, and how click tracking differs from open tracking.

**Acceptance Criteria:**
- [ ] 1×1 pixel tracker: `<img src="https://api.example.com/track/open?emailId=abc&userId=xyz" width="1" height="1" style="display:none">` — when the email is rendered and images are loaded, the browser makes an HTTP GET request to your server; you record `emailId` + `userId` + timestamp as an "opened" event
- [ ] Server handler: `GET /track/open?emailId&userId` → `db.trackingEvents.insert({ emailId, userId, type: 'open', ip, userAgent, openedAt: now })` → respond with a 1×1 transparent GIF (`image/gif` content type)
- [ ] Image blocking: Apple Mail Privacy Protection (iOS 15+, macOS Monterey+) pre-fetches all images in emails using Apple's proxy servers — every email appears "opened" regardless of whether the user actually opened it; Gmail offers "Dynamic Email" which also pre-loads images
- [ ] Apple MPP impact: open rates become unreliable — 45% may reflect real opens, or 100% may be proxy pre-fetches falsely attributed to users; open rate as a metric is largely deprecated for Apple device users since 2021
- [ ] Click tracking: rewrite all links in the email to go through your tracking URL: `<a href="https://api.example.com/track/click?emailId=abc&userId=xyz&dest=https://app.example.com/contracts">View Contract</a>`; when clicked, log the event and redirect to the original destination with `res.redirect(302, dest)`
- [ ] Click tracking reliability: click tracking is more reliable than open tracking — users must intentionally click; not affected by proxy pre-fetching; provides higher-signal engagement data; the trade-off is increased URL length and a redirect hop

---

## Scoring Rubric

| Score | Interpretation |
|-------|----------------|
| 0–4   | Re-study — revisit Nodemailer docs, Multer configuration, and S3 presigned URL concepts before proceeding |
| 5–9   | Progressing — core concepts understood; build a complete file upload endpoint with type validation, S3 upload, and email confirmation |
| 10–12 | Solid — ready to build production file and email features; review multipart upload and email deliverability for edge cases |
| 13–15 | Ready to advance — strong grasp of file storage architecture and email infrastructure; move to Day 50 |
